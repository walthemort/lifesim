import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
async function load(page, s) {
  await page.addInitScript(
    (s) => localStorage.setItem("lifesim-save-v1", JSON.stringify(s)),
    s,
  );
  await page.goto("/");
  await tap(page, "Sport & development");
  await page
    .getByRole("button", { name: "Open inside your sport", exact: true })
    .click();
}
function player(id) {
  let s = g.createGame({ age: 18, seed: 8 });
  s.money = 1e7;
  return id === "football" ? g.joinFootball(s) : g.joinSport(s, id);
}
test("football detail opens a persistent passing network", async ({ page }) => {
  await load(page, player("football"));
  await page.getByRole("tab", { name: "Football", exact: true }).click();
  await page
    .getByRole("button", { name: "Open detailed football", exact: true })
    .click();
  await expect(
    page.locator('[data-simulation-tab="Football"]').first(),
  ).toContainText("Cautions");
  await page
    .getByRole("button", {
      name: "Practise a passing combination",
      exact: true,
    })
    .click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(s.simulation.sports.football.links[0].trust).toBe(53);
  expect(g.restoreGame(s)).toEqual(s);
});
test("racing desk reserves an itemised season and fits all phone widths", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let s = player("racing");
  s = g.openRaceEngineering(s);
  await load(page, s);
  await page.getByRole("tab", { name: "Motorsport", exact: true }).click();
  await page
    .getByRole("button", { name: "Open race engineering", exact: true })
    .click();
  await page.getByRole("tab", { name: "Kart budget", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Reserve the remaining kart season budget",
      exact: true,
    })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(saved.simulation.racing.seasons[0].balance).toBeGreaterThan(0);
  expect(g.restoreGame(saved)).toEqual(saved);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of [
      "Weekend",
      "Reports",
      "Kart budget",
      "Components",
      "Career",
    ]) {
      await page.getByRole("tab", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("tennis and boxing entry controls fit a small phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 750 });
  await load(page, g.openDetailedSport(player("tennis"), "tennis"));
  await page.getByRole("tab", { name: "Tennis", exact: true }).click();
  await page
    .getByRole("button", { name: "Pay tournament entry", exact: true })
    .click();
  await page.getByRole("tab", { name: "Boxing", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Join supervised boxing · $30",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
