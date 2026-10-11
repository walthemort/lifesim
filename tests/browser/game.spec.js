import { test, expect } from "@playwright/test";

test("dashboard loads with working navigation and no browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A life of your own." }),
  ).toBeVisible();
  for (const name of [
    "Career paths",
    "Relationships",
    "Investments",
    "Lifestyle & shopping",
    "Team ownership",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("main h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test("character creation, time advancement, decisions, and persistence", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Your character", exact: true })
    .click();
  await page.getByRole("button", { name: "Create a new character" }).click();
  await page.getByLabel("Your name").fill("Riley Andersen");
  await page.getByLabel("Home city").selectOption("Copenhagen");
  await page.getByLabel("Your first path").selectOption("football");
  await page.getByRole("button", { name: "Begin my story" }).click();
  await expect(
    page.getByRole("heading", { name: "Amateur player" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator(".event-option").last().click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "View your character" }),
  ).toContainText("Riley Andersen");
  await expect(page.locator(".game-date")).toContainText("WEEK 3");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(saved.week).toBe(2);
  expect(saved.event).toBe(null);
  expect(saved.city).toBe("Copenhagen");
});
test("career switching, financial trading, purchases, and social actions work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Career paths", exact: true }).click();
  await page.locator('[data-action="career"][data-id="racing"]').click();
  await page.getByRole("button", { name: "Start this chapter" }).click();
  await expect(
    page.getByRole("heading", { name: "Karting rookie" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Investments", exact: true }).click();
  await page.locator('[data-action="trade"][data-id="index"]').click();
  await page.getByLabel("Number of units").fill("5");
  await page.getByRole("button", { name: "Confirm trade" }).click();
  await expect(
    page.locator(".market-row").filter({ hasText: "Global index fund" }),
  ).toContainText("5 units");
  await page.locator('[data-action="trade"][data-id="index"]').click();
  await page.getByLabel("Buy or sell").selectOption("sell");
  await page.getByLabel("Number of units").fill("2");
  await page.getByRole("button", { name: "Confirm trade" }).click();
  await expect(
    page.locator(".market-row").filter({ hasText: "Global index fund" }),
  ).toContainText("3 units");
  await page
    .getByRole("button", { name: "Lifestyle & shopping", exact: true })
    .click();
  await page.locator('[data-action="buy"][data-id="watch"]').click();
  await expect(
    page.locator(".shop-card").filter({ hasText: "The everyday watch" }),
  ).toContainText("Owned");
  await page
    .getByRole("button", { name: "Relationships", exact: true })
    .click();
  await page.getByRole("button", { name: "Meet someone" }).click();
  await expect(page.getByRole("heading", { name: "Riley Chen" })).toBeVisible();
  await page.locator('[data-action="connect"][data-id="sam"]').click();
  await expect(page.locator(".info-banner")).toContainText(
    "1 free-time actions",
  );
});
test("export and import restore progress and reject corrupt saves", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await page.getByRole("button", { name: "Save & settings" }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export save" }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("lifesim-save.json");
  const saved = await page.evaluate(() =>
    localStorage.getItem("lifesim-save-v1"),
  );
  await page.locator("#import-save").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.locator("#toast")).toContainText("invalid");
  await page.locator("#import-save").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(saved),
  });
  await page.getByRole("button", { name: "Replace current save" }).click();
  await expect(page.locator(".game-date")).toContainText("WEEK 2");
});
test("an unreadable stored save is preserved as an exportable recovery copy", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem("lifesim-save-v1", '{"version":99,"name":"Old life"}'),
  );
  await page.reload();
  await expect(page.locator(".warning")).toContainText("recovery copy");
  expect(
    await page.evaluate(() => localStorage.getItem("lifesim-save-v1-recovery")),
  ).toBe('{"version":99,"name":"Old life"}');
  await page.getByRole("button", { name: "Save & settings" }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export recovery copy" }).click();
  expect((await downloaded).suggestedFilename()).toBe("lifesim-recovery.json");
});
test("team management is playable after a funded acquisition", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("lifesim-save-v1"));
    s.money = 300000000;
    localStorage.setItem("lifesim-save-v1", JSON.stringify(s));
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Team ownership", exact: true })
    .click();
  await page.locator('[data-action="buy"][data-id="f1-team"]').click();
  await page.getByLabel("Management strategy").selectOption("development");
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  await expect(page.locator(".team-stats")).toContainText("23");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(saved.teams["f1-team"].races).toBe(1);
  expect(saved.teamStrategy).toBe("development");
});
test("entrepreneur can name and manage a company and watch it develop", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Career paths", exact: true }).click();
  await page.locator('[data-action="career"][data-id="business"]').click();
  await page.getByRole("button", { name: "Start this chapter" }).click();
  await page.getByRole("button", { name: "Manage company" }).click();
  await page.getByLabel("Company name").fill("Northstar Labs");
  await page.getByLabel("Industry").selectOption("Clean energy");
  await page.getByLabel("Company strategy").selectOption("reinvest");
  await page.getByRole("button", { name: "Set my direction" }).click();
  await expect(
    page.getByRole("heading", { name: "Northstar Labs" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(saved.company.name).toBe("Northstar Labs");
  expect(saved.company.value).not.toBe(2500);
  expect(saved.company.strategy).toBe("reinvest");
});
test("phone layout has no horizontal overflow and supports the weekly game loop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A life of your own." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next week", exact: true }).click();
  for (const name of [
    "Overview",
    "Career paths",
    "Relationships",
    "Investments",
    "Lifestyle & shopping",
    "Team ownership",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(sizes.scroll, name).toBeLessThanOrEqual(sizes.width);
  }
});
