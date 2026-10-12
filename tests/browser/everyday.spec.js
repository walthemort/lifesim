import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, state = g.createGame({ seed: 8, age: 23 })) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
async function navigate(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
}
async function week(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
async function debug(page) {
  await navigate(page, "Save & settings");
  await navigate(page, "Enable debug mode");
}
function wealthy() {
  const s = g.createGame({ seed: 8, age: 23 });
  s.money = 1e7;
  return s;
}
function couple() {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("../fixtures/v4-save.json", import.meta.url)),
    ),
  );
  s.money = 1e7;
  s = g.setActivity(s, "social");
  for (let i = 0; i < 52; i++) {
    if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
    s = g.advanceWeek(s);
  }
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
test("debug is discoverable, keeps an original backup, persists edits and restores the pre-debug life", async ({
  page,
}) => {
  const initial = g.createGame({ seed: 8, age: 18, career: "office" });
  await load(page, initial);
  await debug(page);
  await expect(
    page.getByRole("heading", { name: "Try a different possibility." }),
  ).toBeVisible();
  await navigate(page, "Add $1 billion");
  await navigate(page, "Restore wellbeing");
  let s = await saved(page);
  expect(s.money).toBe(initial.money + 1e9);
  expect(s.health).toBe(100);
  expect(s.debug.used).toBe(true);
  const backup = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(`${key}-before-debug`)),
    KEY,
  );
  expect(backup).toEqual(initial);
  await page.reload();
  await expect(page.locator(".sandbox-banner")).toContainText("Debug enabled");
  await navigate(page, "Save & settings");
  const download = page.waitForEvent("download");
  await navigate(page, "Export pre-debug save");
  expect((await download).suggestedFilename()).toBe(
    "lifesim-before-debug.json",
  );
  await navigate(page, "Disable debug mode");
  await expect(page.locator(".sandbox-banner")).toContainText(
    "previously used",
  );
  await navigate(page, "Save & settings");
  await navigate(page, "Restore pre-debug save");
  await navigate(page, "Restore original life");
  s = await saved(page);
  expect(s).toEqual(initial);
  await expect(page.locator(".sandbox-banner")).toHaveCount(0);
});
test("debug exact stats, hobby skills, followers, and qualifications can be edited without changing the clock", async ({
  page,
}) => {
  await load(page);
  await debug(page);
  await page.getByLabel("Cash balance", { exact: true }).fill("500000");
  await page.getByLabel("Energy", { exact: true }).fill("42");
  await navigate(page, "Apply character values");
  await page.getByLabel("Skill to edit").selectOption("hobby:cooking");
  await page.getByLabel("Skill value").fill("55");
  await navigate(page, "Apply skill");
  await page.getByLabel("Platform audience").selectOption("lens");
  await page.getByLabel("Followers", { exact: true }).fill("10000");
  await navigate(page, "Apply audience");
  await page
    .getByLabel("Qualification to grant")
    .selectOption("business-degree");
  await navigate(page, "Grant qualification");
  const s = await saved(page);
  expect(s.money).toBe(500000);
  expect(s.energy).toBe(42);
  expect(s.week).toBe(0);
  expect(s.pastimes.hobbies.cooking.skill).toBe(55);
  expect(s.social.profiles.lens.followers).toBe(10000);
  expect(s.education.completed).toContain("business-degree");
  expect(g.restoreGame(s)).toEqual(s);
});
test("debug time skips process real finances and choices", async ({ page }) => {
  const initial = g.createGame({ seed: 8, age: 18, career: "office" });
  await load(page, initial);
  await debug(page);
  await navigate(page, "Simulate 13 weeks");
  const s = await saved(page);
  let expected = g.toggleDebug(initial, true);
  for (let i = 0; i < 13; i++) {
    if (expected.event)
      expected = g.resolveEvent(expected, expected.event.options.length - 1);
    expected = g.advanceWeek(expected);
  }
  expect(s.week).toBe(13);
  expect(s.money).toBe(expected.money);
  expect(s.market).toEqual(expected.market);
  await page.reload();
  expect((await saved(page)).week).toBe(13);
});
test("renting, buying, moving into a home and listing it for sale use actual cash and equity", async ({
  page,
}) => {
  await load(page, wealthy());
  await navigate(page, "Homes & property");
  await page.getByRole("button", { name: "Review rental" }).first().click();
  await navigate(page, "Move into rental");
  expect((await saved(page)).housing.deposit).toBe(480);
  await page.getByRole("button", { name: "Review purchase" }).first().click();
  await page.getByLabel("Purchase method").selectOption("cash");
  await navigate(page, "Purchase property");
  let s = await saved(page);
  expect(s.housing.properties).toHaveLength(1);
  expect(s.housing.residence).toBeNull();
  await navigate(page, "Move in");
  await navigate(page, "Confirm property action");
  s = await saved(page);
  expect(s.housing.residence).toBe(s.housing.properties[0].id);
  expect(s.housing.deposit).toBe(0);
  await week(page);
  await navigate(page, "List for sale");
  await navigate(page, "Confirm property action");
  expect((await saved(page)).housing.properties[0].saleWeek).toBe(5);
  await page.reload();
  await navigate(page, "Homes & property");
  await expect(page.locator("[data-property]").first()).toContainText(
    "For sale",
  );
});
test("mortgage underwriting failures do not spend cash and a qualified buyer gets a real loan", async ({
  page,
}) => {
  const s = wealthy();
  await load(page, s);
  await navigate(page, "Homes & property");
  await page.getByRole("button", { name: "Review purchase" }).first().click();
  await page.getByLabel("Purchase method").selectOption("mortgage");
  await navigate(page, "Purchase property");
  expect((await saved(page)).housing.properties).toHaveLength(0);
  expect((await saved(page)).money).toBe(s.money);
  await expect(page.locator("#toast")).toContainText("26 weeks");
  await page.getByRole("button", { name: "Close dialog" }).click();
  const old = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("../fixtures/v1-save.json", import.meta.url)),
    ),
  );
  s.employment = { ...old.employment, tenure: 52, weeklyPay: 3000 };
  s.career = old.career;
  s.progress[s.career].level = g.jobDefinition(s.employment.jobId).level;
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: KEY, state: s },
  );
  await page.reload();
  await navigate(page, "Homes & property");
  await page.getByRole("button", { name: "Review purchase" }).first().click();
  await page.getByLabel("Purchase method").selectOption("mortgage");
  await navigate(page, "Purchase property");
  expect((await saved(page)).housing.properties[0].loan.balance).toBe(96000);
  await week(page);
  expect((await saved(page)).housing.properties[0].loan.balance).toBeLessThan(
    96000,
  );
});
test("a family can choose a proposal, wait, and book a wedding separately", async ({
  page,
}) => {
  const initial = couple();
  await load(page, initial);
  await navigate(page, "Family & pets");
  await navigate(page, "Plan a proposal");
  await navigate(page, "Confirm family plan");
  expect((await saved(page)).relationships.at(-1).role).toBe("Partner");
  await navigate(page, "Plan a wedding");
  await navigate(page, "Confirm family plan");
  await expect(page.locator("#toast")).toContainText("four weeks");
  await page.getByRole("button", { name: "Close dialog" }).click();
  for (let i = 0; i < 4; i++) await week(page);
  await navigate(page, "Plan a wedding");
  await page.getByLabel("Wedding style").selectOption("simple");
  await navigate(page, "Confirm family plan");
  expect((await saved(page)).relationships.at(-1).role).toBe("Spouse");
  await page.reload();
  await expect(page.locator("main")).toContainText("Spouse");
});
test("planning a child preserves the waiting period and creates ongoing care after arrival", async ({
  page,
}) => {
  const initial = g.rentHome(couple(), "family");
  await load(page, initial);
  await navigate(page, "Family & pets");
  await navigate(page, "Plan for a child");
  await page.getByLabel("Child name").fill("Robin");
  await navigate(page, "Confirm family plan");
  let s = await saved(page);
  expect(s.family.pending.arrivalWeek).toBe(initial.week + 39);
  expect(s.family.children).toHaveLength(0);
  await debug(page);
  for (let i = 0; i < 3; i++) await navigate(page, "Simulate 13 weeks");
  await navigate(page, "Family & pets");
  s = await saved(page);
  expect(s.family.children[0].name).toBe("Robin");
  expect(g.householdCosts(s)).toBe(45);
  await page.getByLabel("Parenting focus").selectOption("quality");
  const bond = (await saved(page)).family.children[0].bond;
  await navigate(page, "Spend time · $10");
  expect((await saved(page)).family.children[0].bond).toBeGreaterThan(bond);
});
test("pet adoption adds a named companion and care changes its connection", async ({
  page,
}) => {
  await load(page);
  await navigate(page, "Family & pets");
  await navigate(page, "Adopt a companion");
  await page.getByLabel("Pet name").fill("Milo");
  await page.getByRole("combobox", { name: /^Companion/ }).selectOption("dog");
  await navigate(page, "Adopt pet");
  const initial = await saved(page);
  expect(initial.family.pets[0].name).toBe("Milo");
  expect(g.householdCosts(initial)).toBe(14);
  await navigate(page, "Play & care");
  expect((await saved(page)).family.pets[0].bond).toBe(60);
  await page.reload();
  await navigate(page, "Family & pets");
  await expect(page.locator("main")).toContainText("Milo");
});
test("hobby practice unlocks a project that later produces a portfolio piece and sales", async ({
  page,
}) => {
  const initial = g.buy(wealthy(), "phone");
  initial.pastimes.hobbies.photography = { skill: 22, sessions: 8 };
  await load(page, initial);
  await navigate(page, "Hobbies & journal");
  const hobby = page.locator('[data-hobby="photography"]');
  await expect(
    hobby.getByRole("button", { name: "Create a project" }),
  ).toBeDisabled();
  for (let i = 0; i < 2; i++)
    await hobby.getByRole("button", { name: "Practise · $5" }).click();
  await hobby.getByRole("button", { name: "Create a project" }).click();
  await page.getByLabel("Project title").fill("City light");
  await navigate(page, "Start hobby project");
  expect((await saved(page)).pastimes.projects[0].status).toBe("working");
  for (let i = 0; i < 4; i++) await week(page);
  const s = await saved(page);
  expect(s.pastimes.projects[0].status).toBe("released");
  expect(s.pastimes.projects[0].income).toBeGreaterThan(0);
  expect(s.milestones.some((m) => m.id === "maker")).toBe(true);
  await page.reload();
  await expect(page.locator("main")).toContainText("City light");
});
test("v3 upgrades preserve the old life and provide the exact pre-upgrade save for export", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v3-save.json", import.meta.url)),
  );
  await load(page, old);
  const s = await saved(page);
  expect(s.version).toBe(g.VERSION);
  expect(s.money).toBe(old.money);
  expect(s.music).toEqual(old.music);
  expect(s.family.partnerId).toBe(old.relationships.at(-1).id);
  await navigate(page, "Save & settings");
  const download = page.waitForEvent("download");
  await navigate(page, "Export pre-update save");
  expect((await download).suggestedFilename()).toBe("lifesim-before-v13.json");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(`${key}-before-v13`)),
      KEY,
    ),
  ).toEqual(old);
});
test("family, property, hobbies and debug fit a phone without horizontal overflow or browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, wealthy());
  for (const name of [
    "Homes & property",
    "Family & pets",
    "Hobbies & journal",
  ]) {
    await navigate(page, name);
    const size = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(size.content, name).toBeLessThanOrEqual(size.viewport);
  }
  await debug(page);
  const size = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(size.content).toBeLessThanOrEqual(size.viewport);
  expect(errors).toEqual([]);
});
