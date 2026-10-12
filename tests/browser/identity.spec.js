import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
const nav = (page, name) =>
  page.getByRole("button", { name, exact: true }).click();
async function load(page, state = g.createGame({ seed: 1, age: 18 })) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
async function week(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
async function enableDebug(page) {
  await nav(page, "Save & settings");
  await nav(page, "Enable debug mode");
}

test("ordinary lives offer random creation and keep customization restricted", async ({
  page,
}) => {
  await load(page);
  await nav(page, "Character & hometown");
  await expect(
    page.getByRole("button", { name: "Edit character profile" }),
  ).toHaveCount(0);
  await nav(page, "Start a new life");
  await expect(page.getByRole("dialog")).toContainText("Debug or Pro access");
  await expect(page.getByLabel("Your name")).toHaveCount(0);
  await nav(page, "Begin random life");
  const s = await saved(page);
  expect(s.startAge).toBe(0);
  expect(s.money).toBe(0);
  expect(s.debug.enabled).toBe(false);
  expect(s.education.completed).toEqual([]);
  await expect(page.locator("main h1")).toHaveText("Your early years.");
});
test("Debug creator previews appearance and starts a custom life with all specialist controls", async ({
  page,
}) => {
  await load(page);
  await enableDebug(page);
  await nav(page, "Save & settings");
  await nav(page, "Open character creator");
  await page.getByLabel("Your name").fill("Riley Andersen");
  await page.getByLabel("Home city").selectOption("Copenhagen");
  await page.getByLabel("Birthplace", { exact: true }).selectOption("Monaco");
  await page.getByLabel("Hair colour").selectOption("Red");
  await page.getByLabel("Hair style").selectOption("Curly");
  await page.getByLabel("Life path / interest").selectOption("racing");
  await expect(page.locator("[data-creator-name]")).toHaveText(
    "Riley Andersen",
  );
  await page.getByLabel("Confidence", { exact: true }).fill("88");
  await page.locator(".creator-debug summary").click();
  await page.getByLabel("Starting cash").fill("5000");
  await page.getByLabel("Music: production", { exact: true }).fill("95");
  await page.getByLabel("racing: ability", { exact: true }).fill("90");
  await nav(page, "Begin my story");
  const s = await saved(page);
  expect(s.name).toBe("Riley Andersen");
  expect(s.startAge).toBe(0);
  expect(s.money).toBe(5000);
  expect(s.characterLife.profile.hair).toBe("Red");
  expect(s.characterLife.profile.birthplace).toBe("Monaco");
  expect(s.characterLife.personality.confidence).toBe(88);
  expect(s.music.skills.production).toBe(95);
  expect(s.sports.racing.ability).toBe(90);
  expect(s.sports.racing.stage).toBe("none");
  expect(s.employment).toBeNull();
  await page.reload();
  expect((await saved(page)).characterLife.profile.hairstyle).toBe("Curly");
});
test("local Pro preview keeps customization after Debug is disabled but hides cheat controls", async ({
  page,
}) => {
  await load(page);
  await enableDebug(page);
  await nav(page, "Save & settings");
  await nav(page, "Enable local Pro preview");
  await nav(page, "Disable debug mode");
  await nav(page, "Save & settings");
  await nav(page, "Open character creator");
  await expect(page.getByRole("dialog")).toContainText("PRO CHARACTER CREATOR");
  await expect(page.getByLabel("Starting cash")).toHaveCount(0);
  await expect(page.getByLabel("Starting age")).toHaveCount(0);
  await page.getByLabel("Your name").fill("Pro Newborn");
  await page.getByLabel("Family background").selectOption("wealthy");
  await nav(page, "Begin my story");
  const s = await saved(page);
  expect(s.name).toBe("Pro Newborn");
  expect(s.money).toBe(0);
  expect(s.startAge).toBe(0);
  expect(s.characterLife.proPreview).toBe(true);
  expect(s.debug.enabled).toBe(false);
  await nav(page, "Character & hometown");
  await nav(page, "Edit character profile");
  await page.getByLabel("Your name").fill("Pro Updated");
  await nav(page, "Save character profile");
  expect((await saved(page)).name).toBe("Pro Updated");
});
for (const [path, name] of [
  ["football", "Football"],
  ["racing", "Motorsport"],
  ["basketball", "Basketball"],
  ["tennis", "Tennis"],
]) {
  test(`${name} has its own routine on the selected sport page`, async ({
    page,
  }) => {
    await load(page, g.createGame({ seed: 1, age: 12, career: path }));
    await nav(page, "Sport & development");
    const panel = page.locator(`[data-identity-routine="${path}"]`);
    await panel
      .getByLabel(`${name} routine`, { exact: true })
      .selectOption("craft");
    await panel
      .getByRole("button", {
        name: `Plan ${name.toLowerCase()} routine`,
        exact: true,
      })
      .click();
    await week(page);
    expect((await saved(page)).characterLife.routines[path].sessions).toBe(1);
    await expect(panel).toContainText("1 sessions");
  });
}
test("music producers plan studio practice in the music category", async ({
  page,
}) => {
  const s = g.configureMusic(
    g.createGame({ seed: 1, age: 12, career: "music" }),
    { role: "producer", genre: "Electronic" },
  );
  await load(page, s);
  await nav(page, "Music & creativity");
  await page.getByLabel("Music routine", { exact: true }).selectOption("craft");
  await nav(page, "Plan music routine");
  const before = (await saved(page)).music.skills.production;
  await week(page);
  expect((await saved(page)).music.skills.production).toBeGreaterThan(before);
});
test("family coaching and hometown workshop bookings record outcomes and preserve normal career gates", async ({
  page,
}) => {
  const s = g.createGame({
    seed: 1,
    age: 10,
    career: "racing",
    familyBackground: "wealthy",
  });
  s.characterLife.seed = 1;
  s.money = 500;
  await load(page, s);
  await nav(page, "Sport & development");
  await nav(page, "Ask family about motorsport coaching");
  expect((await saved(page)).characterLife.support).toBeTruthy();
  await week(page);
  expect((await saved(page)).characterLife.support.sessions).toBe(1);
  await nav(page, "Character & hometown");
  await page
    .getByRole("button", { name: "Book local workshop", exact: true })
    .first()
    .click();
  const booked = (await saved(page)).characterLife.localOffers.find(
    (o) => o.status === "booked",
  );
  expect(booked).toBeTruthy();
  await week(page);
  const after = await saved(page);
  expect(["attended", "missed"]).toContain(
    after.characterLife.localOffers.find((o) => o.id === booked.id).status,
  );
  expect(after.employment).toBeNull();
  await expect(page.locator("main")).toContainText("Your life timeline");
});
test("personal goals can be chosen and personal development uses actual actions", async ({
  page,
}) => {
  await load(page, g.createGame({ seed: 1, age: 12, career: "music" }));
  await nav(page, "Character & hometown");
  await page.getByLabel("Your next personal goal").selectOption("release");
  await nav(page, "Choose personal goal");
  const before = await saved(page);
  await nav(page, "Reflect & listen");
  const after = await saved(page);
  expect(after.characterLife.goal.id).toBe("release");
  expect(after.actions).toBe(before.actions - 1);
  expect(after.characterLife.personality.patience).toBeGreaterThan(
    before.characterLife.personality.patience,
  );
  await expect(
    page.getByRole("button", { name: "Reflect & listen", exact: true }),
  ).toBeDisabled();
});
test("v10 import preserves the original life and exports an exact pre-v12 backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v10-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const state = await saved(page);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") expect(state[key]).toEqual(value);
  expect(state.version).toBe(g.VERSION);
  expect(state.characterLife.memories).toEqual([]);
  await nav(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await nav(page, "Export pre-update save");
  const download = await pending;
  expect(download.suggestedFilename()).toBe("lifesim-before-v12.json");
  expect(JSON.parse(fs.readFileSync(await download.path(), "utf8"))).toEqual(
    old,
  );
});
test("character screen and the full creator fit a phone without browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, g.createGame({ seed: 1, age: 10, career: "racing" }));
  await nav(page, "Character & hometown");
  await expect(
    page.getByRole("navigation", { name: "Character & hometown sections" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await enableDebug(page);
  await nav(page, "Save & settings");
  await nav(page, "Open character creator");
  await page.locator(".creator-debug summary").click();
  const dialog = page.getByRole("dialog");
  expect(
    await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.getByLabel("Your name").fill("Phone Player");
  await nav(page, "Begin my story");
  expect((await saved(page)).name).toBe("Phone Player");
  expect(errors).toEqual([]);
});
