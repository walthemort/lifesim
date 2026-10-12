import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1",
  saved = (page) =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, s) {
  await page.addInitScript(
    ({ key, s }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(s));
    },
    { key: KEY, s },
  );
  await page.goto("/");
}
const nav = (page, name) =>
  page.getByRole("button", { name, exact: true }).click();
async function week(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
function family(age = 16) {
  const s = g.createGame({ seed: 1, familyBackground: "wealthy" });
  s.week = 3 * 52;
  g.prepareChildhood(s);
  g.prepareLifeCourse(s);
  s.week = age * 52;
  g.prepareChildhood(s);
  g.prepareLifeCourse(s);
  s.money = 10000;
  return s;
}
test("new family backgrounds change parents finances and a sibling arrives while growing up", async ({
  page,
}) => {
  await load(page, g.createGame({ seed: 1 }));
  await nav(page, "View your character");
  await nav(page, "Create a new character");
  await page.getByLabel("Family background").selectOption("modest");
  await nav(page, "Begin my story");
  let s = await saved(page);
  expect(s.lifeCourse.background).toBe("modest");
  expect(s.connections.profiles[s.relationships[0].id].wealth).toBe(1500);
  expect(s.money).toBe(0);
  for (let i = 0; i < 3; i++) {
    await nav(page, "Age up");
    if (await page.getByRole("dialog").isVisible())
      await page.locator(".event-option").last().click();
  }
  s = await saved(page);
  expect(g.age(s)).toBe(3);
  expect(s.relationships.some((r) => r.role === "Sibling")).toBe(true);
  await nav(page, "Childhood & school");
  await expect(page.locator("[data-origin-family]")).toContainText("Jamie");
});
test("school focus, clubs, preparation and classmates have persistent effects", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 12 });
  await load(page, s);
  await nav(page, "Childhood & school");
  await page.getByLabel("School focus").selectOption("academic");
  await nav(page, "Set school focus");
  await page.getByLabel("Extracurricular club").selectOption("science");
  await nav(page, "Choose school club");
  await page
    .locator('[data-action="school-peer"][data-kind="befriend"][data-id="ava"]')
    .click();
  await nav(page, "Prepare for exams");
  let r = await saved(page);
  expect(r.lifeCourse.school.preparation).toBe(10);
  expect(r.lifeCourse.school.peers[0].friendship).toBe(45);
  expect(r.lifeCourse.school.club).toBe("science");
  await week(page);
  r = await saved(page);
  expect(r.lifeCourse.school.clubWeeks).toBe(1);
  expect(r.calendar.last.required.care).toBe(6);
  await page.reload();
  await nav(page, "Childhood & school");
  await expect(page.getByLabel("School focus")).toHaveValue("academic");
});
test("school exams record real results and reset revision preparation", async ({
  page,
}) => {
  let s = g.createGame({ seed: 1, age: 16 });
  s.week = 47;
  s = g.schoolAction(s, "prepare");
  await load(page, s);
  await nav(page, "Childhood & school");
  await week(page);
  const r = await saved(page);
  expect(r.lifeCourse.school.exams).toHaveLength(1);
  expect(r.lifeCourse.school.preparation).toBe(0);
  await expect(page.locator("[data-school-life]")).toContainText(
    `Age 16: ${r.lifeCourse.school.exams[0].score}/100`,
  );
});
test("teenage work schedules hours, pays real wages and records experience", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 16 });
  await load(page, s);
  await nav(page, "Childhood & school");
  await page.getByLabel("School-age part-time job").selectOption("shop");
  await nav(page, "Choose part-time job");
  await week(page);
  const r = await saved(page);
  expect(r.employment).toBeNull();
  expect(r.money).toBe(582);
  expect(r.lifeCourse.school.workHours.office).toBe(8);
  await nav(page, "Weekly calendar");
  expect(r.calendar.last.required.work).toBe(8);
  await expect(page.locator("main")).toContainText("Work");
});
test("education support reduces family savings and transfers cash without a free qualification", async ({
  page,
}) => {
  const s = family();
  const id = s.relationships[0].id,
    before = s.connections.profiles[id].wealth;
  await load(page, s);
  await nav(page, "Childhood & school");
  await nav(page, "Ask family for education support");
  const r = await saved(page);
  expect(r.money).toBe(s.money + 2000);
  expect(r.connections.profiles[id].wealth).toBe(before - 2000);
  expect(r.education.active).toBeNull();
  await page.reload();
  expect((await saved(page)).lifeCourse.school.actions["family-funding"]).toBe(
    s.week,
  );
});
test("parents retire, family care costs money and transfers support to the relative", async ({
  page,
}) => {
  const s = family(40),
    id = s.relationships[0].id;
  await load(page, s);
  await nav(page, "Family & pets");
  await expect(page.locator("[data-origin-family]")).toContainText("Retired");
  await page
    .locator(
      `[data-action="relative-support"][data-kind="money"][data-id="${id}"]`,
    )
    .click();
  await page
    .locator(
      `[data-action="relative-support"][data-kind="care"][data-id="${id}"]`,
    )
    .click();
  const r = await saved(page);
  expect(r.money).toBe(s.money - 150);
  expect(r.connections.profiles[id].wealth).toBe(
    s.connections.profiles[id].wealth + 100,
  );
  expect(r.lifeCourse.relatives[id].health).toBe(
    s.lifeCourse.relatives[id].health + 2,
  );
});
test("physical care changes real fitness and injury wear and specialist debug values persist", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 40 });
  s.lifeCourse.body.scars.football = 3;
  s.football.injuryWeeks = 4;
  await load(page, s);
  await nav(page, "Health & ageing");
  await page
    .locator('[data-action="body-care"][data-id="conditioning"]')
    .click();
  await page
    .locator('[data-action="body-care"][data-id="rehabilitation"]')
    .click();
  let r = await saved(page);
  expect(r.lifeCourse.body.fitness).toBe(s.lifeCourse.body.fitness + 1);
  expect(r.lifeCourse.body.scars.football).toBe(2.5);
  expect(r.football.injuryWeeks).toBe(4);
  await nav(page, "Save & settings");
  await nav(page, "Enable debug mode");
  await page
    .getByLabel("Skill to edit")
    .selectOption("specialist:body.mobility");
  await page.getByLabel("Skill value").fill("82.5");
  await nav(page, "Apply skill");
  await page.reload();
  expect((await saved(page)).lifeCourse.body.mobility).toBe(82.5);
});
test("merit scholarship claims reduce tuition without awarding a degree", async ({
  page,
}) => {
  let s = g.createGame({ seed: 1, age: 16 });
  for (let i = 0; i < 104; i++) {
    s.school.grade = 95;
    s.skills.knowledge = 95;
    if (s.event) s = g.resolveEvent(s, 0);
    s = g.advanceWeek(s);
  }
  if (s.event) s = g.resolveEvent(s, 0);
  await load(page, s);
  await nav(page, "Childhood & school");
  await nav(page, "Apply for merit scholarship");
  let r = await saved(page);
  expect(r.lifeCourse.school.scholarship.remaining).toBe(156);
  expect(r.education.completed).not.toContain("business-degree");
  await nav(page, "Work & education");
  await page
    .locator('[data-action="enrol"][data-id="business-degree"]')
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "$32.50 per calendar week",
  );
  await page.getByRole("button", { name: /Enrol in programme/ }).click();
  await week(page);
  r = await saved(page);
  expect(r.education.active.spent).toBe(32.5);
  expect(r.lifeCourse.school.scholarship.remaining).toBe(155);
});
test("authentic v7 saves preserve managers and finances with an exact downloadable backup", async ({
  page,
}) => {
  const raw = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v7-save.json", import.meta.url)),
  );
  await load(page, raw);
  const r = await saved(page);
  expect(r.version).toBe(g.VERSION);
  expect(r.family).toEqual(raw.family);
  expect(r.banking).toEqual(raw.banking);
  expect(r.careerSupport).toEqual(raw.careerSupport);
  expect(r.lifeCourse.school.exams).toEqual([]);
  await nav(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await nav(page, "Export pre-update save");
  const dl = await pending;
  expect(dl.suggestedFilename()).toBe("lifesim-before-v10.json");
  expect(JSON.parse(fs.readFileSync(await dl.path()))).toEqual(raw);
});
test("expanded school, family and health screens fit phones without browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, family());
  for (const name of [
    "Childhood & school",
    "Health & ageing",
    "Family & pets",
    "Work & education",
  ]) {
    await nav(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
