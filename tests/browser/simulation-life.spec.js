import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, s = g.createGame({ age: 14, seed: 8 })) {
  await page.addInitScript(
    ({ s, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(s));
    },
    { s, key: KEY },
  );
  await page.goto("/");
}
async function week(page) {
  await page.locator('[data-action="next-week"]').click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
test("school records reveal an aptitude, record real study and show teacher-specific progress", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Childhood & school");
  await page
    .getByRole("button", { name: "Open school record", exact: true })
    .click();
  const explore = page.locator('[data-operation="explore"]');
  await explore.getByLabel("Interest to explore").selectOption("maths");
  await explore.getByRole("button").click();
  const before = await saved(page);
  expect(before.simulation.education.subjects.maths.discovered).toBe(true);
  const study = page.locator('[data-operation="study"]');
  await study.getByLabel("Subject to study").selectOption("maths");
  await study.getByRole("button").click();
  expect(
    (await saved(page)).simulation.education.subjects.maths.grade,
  ).toBeGreaterThan(before.simulation.education.subjects.maths.grade);
  await page.getByRole("tab", { name: "School", exact: true }).click();
  await expect(page.getByText("Ms Patel", { exact: true })).toBeVisible();
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("a booked assessment has a real date, cost and finding after the simulation advances", async ({
  page,
}) => {
  const s = g.createGame({ age: 25, seed: 8 });
  s.money = 10000;
  await load(page, s);
  await tap(page, "Health & ageing");
  await page.getByRole("button", { name: "Open medical record" }).click();
  await page.getByRole("tab", { name: "Care", exact: true }).click();
  const form = page.locator('[data-operation="appointment"]');
  await form.getByLabel("Healthcare concern").selectOption("vision");
  await form.getByLabel("Provider").selectOption("private");
  await form.getByRole("button").click();
  expect((await saved(page)).money).toBe(9880);
  await expect(
    page.locator('[data-simulation-tab="Care"]').last(),
  ).toContainText("booked");
  await week(page);
  expect((await saved(page)).simulation.health.appointments[0].status).toBe(
    "attended",
  );
  await expect(
    page.locator('[data-simulation-tab="Care"]').last(),
  ).toContainText("Screening completed");
});
test("a specific promise is fulfilled through the corresponding real social action", async ({
  page,
}) => {
  const s = g.createGame({ age: 25, seed: 8 });
  s.money = 10000;
  await load(page, s);
  await tap(page, "Relationships");
  await page.getByRole("button", { name: "Open connected life" }).click();
  const person = s.relationships[0].id,
    promise = page.locator('[data-operation="promise"]');
  await promise.getByLabel("Who are you promising?").selectOption(person);
  await promise
    .getByRole("combobox", { name: "Promise", exact: true })
    .selectOption("gifts");
  await promise.getByRole("button").click();
  const gesture = page.locator('[data-operation="affection"]');
  await gesture.getByLabel("Someone you care about").selectOption(person);
  await gesture.getByLabel("Your gesture").selectOption("gifts");
  const before = await saved(page);
  await gesture.getByRole("button").click();
  const after = await saved(page);
  expect(after.money).toBe(before.money - 20);
  expect(after.simulation.social.promises[0].status).toBe("delivered");
});
test("detailed records stay within small phone screens and all focused tabs are reachable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [category, label] of [
      ["Childhood & school", "Open school record"],
      ["Health & ageing", "Open medical record"],
      ["Relationships", "Open connected life"],
    ]) {
      await tap(page, category);
      await page.getByRole("button", { name: label, exact: true }).click();
      const names = await page.getByRole("tab").allTextContents();
      for (const name of names) {
        await page.getByRole("tab", { name, exact: true }).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  }
  expect(errors).toEqual([]);
});
test("historical rules are an explicit choice in ordinary random-life creation", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Save & settings");
  await page
    .getByRole("button", { name: "Create a new life", exact: true })
    .click();
  await page.getByLabel("Starting year", { exact: true }).fill("1900");
  await page.locator('[name="historical"]').check();
  await page
    .getByRole("button", { name: "Begin random life", exact: true })
    .click();
  const s = await saved(page);
  expect(s.startingYear).toBe(1900);
  expect(s.simulation.era.enabled).toBe(true);
  expect(s.startAge).toBe(0);
  expect(g.restoreGame(s)).toEqual(s);
});
test("authentic v16 lives retain an exact downloadable backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v16-save.json", import.meta.url)),
  );
  await load(page, old);
  const s = await saved(page);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") expect(s[key]).toEqual(value);
  await tap(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export pre-update save", exact: true })
    .click();
  const file = await pending;
  expect(file.suggestedFilename()).toBe("lifesim-before-v17.json");
  expect(JSON.parse(fs.readFileSync(await file.path(), "utf8"))).toEqual(old);
});
