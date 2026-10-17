import { tap } from "./mobile-helpers.js";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, state) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
const nav = (page, name) => tap(page, name);
const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
const next = (s) => clear(g.advanceWeek(clear(s)));
function employed() {
  let s = g.createGame({ seed: 8, age: 23 });
  s.applications.push({
    id: "test",
    vacancyId: "test",
    jobId: "office-0",
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: 650,
  });
  s = g.acceptJobOffer(s, "test");
  s.money = 100000;
  for (let i = 0; i < 13; i++) s = next(g.setActivity(s, "rest"));
  return s;
}
function player() {
  let s = g.createGame({ seed: 8, age: 23, career: "football" });
  s.money = 100000;
  s.football.ability = 85;
  s.football.discipline = 90;
  s.football.reputation = 80;
  const o = {
    id: "football:test",
    kind: "contract",
    club: "Riverside FC",
    jobId: "football-2",
    pay: 3500,
    duration: 104,
    status: "offered",
    expiresWeek: 4,
  };
  g.enhanceSportOffer(s, "football", o);
  s.football.offers.push(o);
  return s;
}
async function week(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}

test("banking transfers preserve wealth, earn interest and persist across reloads", async ({
  page,
}) => {
  const s = employed();
  await load(page, s);
  await nav(page, "Banking & tax");
  await expect(
    page.getByRole("heading", { name: "Plan beyond the pay cheque." }),
  ).toBeVisible();
  await page
    .getByRole("spinbutton", { name: "Transfer amount", exact: true })
    .fill("1000.01");
  await nav(page, "Transfer savings");
  let r = await saved(page);
  expect(r.banking.savings).toBe(1000.01);
  expect(g.netWorth(r)).toBeCloseTo(g.netWorth(s), 2);
  await week(page);
  r = await saved(page);
  expect(r.banking.savings).toBeGreaterThan(1000.01);
  expect(r.banking.tax.lastWeekly).toBeGreaterThan(0);
  await page.reload();
  await nav(page, "Banking & tax");
  await page
    .getByRole("combobox", { name: "Transfer direction" })
    .selectOption("withdraw");
  await page
    .getByRole("spinbutton", { name: "Transfer amount", exact: true })
    .fill("500");
  await nav(page, "Transfer savings");
  expect((await saved(page)).banking.savings).toBeCloseTo(
    r.banking.savings - 500,
    2,
  );
});
test("borrowing shows concrete terms, adds debt and supports full early repayment", async ({
  page,
}) => {
  const s = employed();
  await load(page, s);
  await nav(page, "Banking & tax");
  await nav(page, "Review borrowing terms");
  await expect(page.getByRole("dialog")).toContainText("Origination fee: $50");
  await nav(page, "Accept loan terms");
  let r = await saved(page);
  expect(r.money).toBe(s.money + 4950);
  expect(r.banking.loans[0].balance).toBe(5000);
  expect(g.netWorth(r)).toBeCloseTo(g.netWorth(s) - 50, 2);
  await week(page);
  r = await saved(page);
  expect(r.banking.loans[0].balance).toBeLessThan(5000);
  await nav(page, "Make an extra repayment");
  await nav(page, "Repay debt");
  expect((await saved(page)).banking.loans[0].status).toBe("repaid");
  await page.reload();
  await nav(page, "Banking & tax");
  await expect(page.locator("main")).toContainText("repaid");
});
test("unqualified borrowing is explained and cannot be accepted", async ({
  page,
}) => {
  await load(page, g.createGame({ seed: 8, age: 14 }));
  await nav(page, "Banking & tax");
  await nav(page, "Review borrowing terms");
  await expect(page.getByRole("dialog")).toContainText("Not eligible");
  await expect(page.getByRole("dialog")).toContainText("Age 18+");
  await expect(
    page.getByRole("button", { name: "Accept loan terms" }),
  ).toBeDisabled();
  expect((await saved(page)).banking.loans).toHaveLength(0);
});
test("sport contract negotiations persist and fixture results populate the league table", async ({
  page,
}) => {
  await load(page, player());
  await nav(page, "Sport & development");
  await nav(page, "Review invitation");
  await expect(page.getByRole("dialog")).toContainText(
    "104-week sporting contract",
  );
  await page
    .getByRole("combobox", { name: "Contract approach" })
    .selectOption("security");
  await nav(page, "Send counteroffer");
  expect((await saved(page)).football.offers[0].terms.negotiation.status).toBe(
    "pending",
  );
  await nav(page, "Review invitation");
  await expect(
    page.getByRole("button", { name: "Accept invitation", exact: true }),
  ).toBeDisabled();
  await page.getByRole("dialog").press("Escape");
  await week(page);
  await week(page);
  await nav(page, "Review invitation");
  await nav(page, "Accept invitation");
  let r = await saved(page);
  expect(r.employment.jobId).toBe("football-2");
  await expect(page.locator("#season-football .standings-row")).toHaveCount(20);
  await week(page);
  r = await saved(page);
  expect(r.seasons.football.appearances).toBeGreaterThan(0);
  await expect(page.locator("#season-football")).toContainText(
    "Recent results",
  );
  await page.reload();
  await nav(page, "Weekly calendar");
  await expect(
    page.getByRole("heading", { name: "Sporting dates" }),
  ).toBeVisible();
});
test("sponsor support is offered as racing funding and an appearance can be delivered", async ({
  page,
}) => {
  let s = g.createGame({ seed: 8, age: 18, career: "racing" });
  s.seasons.racing.sponsorOffers.push({
    id: "test",
    brand: "Test sponsor",
    annual: 15000,
    status: "offered",
    expiresWeek: 4,
  });
  await load(page, s);
  await nav(page, "Sport & development");
  await nav(page, "Review sponsorship");
  await expect(page.getByRole("dialog")).toContainText(
    "pays competition costs directly",
  );
  await nav(page, "Accept sponsorship");
  expect((await saved(page)).money).toBe(s.money);
  await expect(
    page.getByRole("button", { name: "Deliver sponsor appearance" }),
  ).toBeDisabled();
  for (let i = 0; i < 9; i++) await week(page);
  await nav(page, "Deliver sponsor appearance");
  expect((await saved(page)).seasons.racing.sponsor.lastAppearanceWeek).toBe(9);
  await expect(
    page.getByRole("button", { name: "Deliver sponsor appearance" }),
  ).toBeDisabled();
});
test("life choice commissions become visible obligations and delivery has a real outcome", async ({
  page,
}) => {
  let s = g.createGame({ seed: 8, age: 23 });
  s.event = structuredClone(
    g.STORY_EVENTS.find((e) => e.id === "collaboration"),
  );
  await load(page, s);
  await nav(page, "Make a choice");
  await page.locator(".event-option").first().click();
  expect((await saved(page)).money).toBe(s.money);
  await nav(page, "Weekly calendar");
  await expect(
    page.getByRole("heading", { name: "Life commitments" }),
  ).toBeVisible();
  await nav(page, "Deliver commissioned work");
  const r = await saved(page);
  expect(["completed", "failed"]).toContain(r.stories.effects[0].status);
  expect(r.money).toBeCloseTo(
    s.money -
      25 +
      (r.stories.effects[0].status === "completed"
        ? 500 - r.banking.tax.lastWeekly
        : 0),
    2,
  );
  await page.reload();
  expect((await saved(page)).stories.effects[0].status).toBe(
    r.stories.effects[0].status,
  );
});
test("authentic v5 saves upgrade with an unchanged pre-v9 download and preserved household", async ({
  page,
}) => {
  const raw = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v5-save.json", import.meta.url)),
  );
  await load(page, raw);
  let r = await saved(page);
  expect(r.version).toBe(g.VERSION);
  expect(r.family).toEqual(raw.family);
  expect(r.workLife).toEqual(raw.workLife);
  expect(r.banking.tax.paid).toBe(0);
  await nav(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await nav(page, "Export pre-update save");
  expect((await pending).suggestedFilename()).toBe("lifesim-before-v14.json");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(`${key}-before-v14`)),
      KEY,
    ),
  ).toEqual(raw);
  await page.getByRole("dialog").press("Escape");
  await week(page);
  r = await saved(page);
  expect(r.banking.incomeHistory).toHaveLength(1);
  await page.reload();
  expect((await saved(page)).week).toBe(raw.week + 1);
});
test("new money, season and commitment screens fit a small mobile viewport without script errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  let s = g.acceptFootballOffer(player(), "football:test");
  s = next(s);
  s.event = structuredClone(
    g.STORY_EVENTS.find((e) => e.id === "collaboration"),
  );
  s = g.resolveEvent(s, 0);
  await load(page, s);
  for (const screen of [
    "Banking & tax",
    "Sport & development",
    "Weekly calendar",
    "Hobbies & journal",
  ]) {
    await nav(page, screen);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await nav(page, "Banking & tax");
  await nav(page, "Review borrowing terms");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
