import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1";
const fresh = () => g.createGame({ seed: 8, age: 23 });
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, state = fresh()) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
const navigate = (page, name) =>
  page.getByRole("button", { name, exact: true }).click();
async function next(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
const step = (s) => {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  return s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
};
function parent() {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("../fixtures/v4-save.json", import.meta.url)),
    ),
  );
  s.money = 1e7;
  s = g.setActivity(s, "social");
  for (let i = 0; i < 52; i++) s = step(s);
  s = g.rentHome(s, "family");
  s = g.familyAction(s, "child", { name: "Emilia" });
  for (let i = 0; i < 39; i++) s = step(s);
  s.week = s.family.children[0].bornWeek + 7 * 52;
  return s;
}

test("a weekly custom plan persists and controls study progression through the dashboard", async ({
  page,
}) => {
  let s = g.enrolEducation(fresh(), "business-cert");
  await load(page, s);
  await navigate(page, "Weekly calendar");
  await expect(
    page.getByRole("heading", { name: "Make room for what matters." }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Planning mode", exact: true })
    .selectOption("custom");
  await page.getByRole("spinbutton", { name: /^Study hours/ }).fill("0");
  await navigate(page, "Save weekly plan");
  await next(page);
  expect((await saved(page)).education.active.progress).toBe(0);
  await page.reload();
  await navigate(page, "Weekly calendar");
  await expect(
    page.getByRole("combobox", { name: "Planning mode", exact: true }),
  ).toHaveValue("custom");
  await page.getByRole("spinbutton", { name: /^Study hours/ }).fill("16");
  await navigate(page, "Save weekly plan");
  await next(page);
  expect((await saved(page)).education.active.progress).toBe(1);
});
test("a date is booked, shown on the calendar, and resolved when the week advances", async ({
  page,
}) => {
  let s = g.meet(fresh());
  s.relationships.at(-1).bond = 95;
  await load(page, s);
  await navigate(page, "Relationships");
  const person = page
    .locator(".relationship-card")
    .filter({ hasText: "Riley Chen" });
  await person.getByRole("button", { name: "Ask on a date" }).click();
  await page
    .getByRole("combobox", { name: "Date plan", exact: true })
    .selectOption("dinner");
  await navigate(page, "Send date invitation");
  let booked = await saved(page);
  expect(booked.calendar.entries[0].status).toBe("scheduled");
  expect(booked.relationships.at(-1).role).toBe("New connection");
  expect(booked.money).toBe(s.money - 65);
  await navigate(page, "Weekly calendar");
  await expect(page.locator("main")).toContainText(
    "Dinner together with Riley Chen",
  );
  await next(page);
  expect((await saved(page)).calendar.entries[0].status).toBe("completed");
  await navigate(page, "Relationships");
  await expect(
    page.locator(".relationship-card").filter({ hasText: "Riley Chen" }),
  ).toContainText("1 good dates");
});
test("three good dates unlock a mutual commitment conversation without automatically creating a spouse", async ({
  page,
}) => {
  let s = g.meet(fresh());
  const id = s.relationships.at(-1).id;
  s.relationships.at(-1).bond = 95;
  for (let i = 0; i < 3; i++) s = step(g.inviteDate(s, id, "walk"));
  s.seed = 0;
  await load(page, s);
  await navigate(page, "Relationships");
  await navigate(page, "Talk about commitment");
  let coupled = await saved(page);
  expect(coupled.relationships.at(-1).role).toBe("Partner");
  expect(coupled.family.sinceWeek).toBe(s.week);
  expect(coupled.family.engagement).toBeNull();
  await page.reload();
  expect((await saved(page)).family.partnerId).toBe(id);
});
test("new profession recruitment requires completing the interview dialog and accepting an offer", async ({
  page,
}) => {
  let s = fresh();
  s.vacancies.push({
    id: "profession",
    jobId: "hospitality-0",
    postedWeek: 0,
    expiresWeek: 4,
    exceptional: false,
  });
  s = step(g.applyForJob(s, "profession"));
  await load(page, s);
  await navigate(page, "Work & education");
  await navigate(page, "Prepare interview");
  await page
    .getByRole("combobox", { name: "Interview approach", exact: true })
    .selectOption("prepared");
  await navigate(page, "Attend interview");
  expect((await saved(page)).applications[0].interviewed).toBe(true);
  await next(page);
  expect((await saved(page)).applications[0].status).toBe("offer");
  await navigate(page, "Review offer");
  await navigate(page, "Accept this job");
  expect((await saved(page)).employment.jobId).toBe("hospitality-0");
  await expect(page.locator("main")).toContainText(
    "Probation review in 13 weeks",
  );
});
test("parents can discuss activities, respond to school concerns and share a family day", async ({
  page,
}) => {
  let s = parent();
  while ((s.week + 1) % 13) s = step(s);
  s = step(s);
  await load(page, s);
  await navigate(page, "Family & pets");
  await navigate(page, "Discuss school & activities");
  await page
    .getByRole("combobox", { name: "Activity club", exact: true })
    .selectOption("music");
  await page
    .getByRole("combobox", { name: "School choice", exact: true })
    .selectOption("private");
  await navigate(page, "Agree on a plan");
  expect((await saved(page)).family.children[0].club).toBe("music");
  await navigate(page, "Listen together · 3 h");
  expect((await saved(page)).family.issues.at(-1).status).toBe("resolved");
  await navigate(page, "Plan a family day · $25");
  expect((await saved(page)).calendar.entries.at(-1).kind).toBe("family");
  await navigate(page, "Weekly calendar");
  await expect(page.locator("main")).toContainText("A day with the family");
  await next(page);
  expect((await saved(page)).calendar.entries.at(-1).status).toBe("completed");
});
test("authentic v4 lives upgrade with a downloadable unmodified pre-v7 snapshot", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v4-save.json", import.meta.url)),
  );
  await load(page, old);
  expect((await saved(page)).version).toBe(7);
  expect((await saved(page)).money).toBe(old.money);
  await navigate(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await navigate(page, "Export pre-update save");
  expect((await pending).suggestedFilename()).toBe("lifesim-before-v7.json");
  const backup = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(`${key}-before-v7`)),
    KEY,
  );
  expect(backup).toEqual(old);
  await page.reload();
  expect((await saved(page)).connections.profiles["person-2"].trust).toBe(80);
});
test("calendar and relationship screens fit a mobile viewport without horizontal overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, parent());
  for (const name of [
    "Weekly calendar",
    "Relationships",
    "Family & pets",
    "Work & education",
  ]) {
    await navigate(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
