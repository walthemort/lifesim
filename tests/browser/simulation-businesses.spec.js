import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
function company() {
  let s = g.createGame({ age: 30, seed: 8 });
  s.money = 1e8;
  s.skills.business = 100;
  s = g.foundCompany(s, { name: "Test Works", sector: "Technology" });
  s.company.cash = 1e6;
  return s;
}
async function load(page, s) {
  await page.addInitScript(
    (s) => localStorage.setItem("lifesim-save-v1", JSON.stringify(s)),
    s,
  );
  await page.goto("/");
  await tap(page, "Start & run a company");
  await page
    .getByRole("button", { name: "Open business operations", exact: true })
    .click();
}
test("company operations open a real division and spend company funds on supplies", async ({
  page,
}) => {
  const s = company();
  await load(page, s);
  await page
    .getByRole("button", { name: "Open operations", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pay for supply order", exact: true })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(saved.money).toBe(s.money);
  expect(saved.company.cash).toBe(s.company.cash - 360);
  expect(saved.simulation.businesses.firms.founder.orders[0].units).toBe(30);
  expect(g.restoreGame(saved)).toEqual(saved);
});
test("business workspaces fit three phone widths", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page, g.openBusinessOperations(company(), "founder"));
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of [
      "Operations",
      "Employees",
      "Board",
      "Acquisitions",
      "Expansion",
      "Specialist clubs",
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
