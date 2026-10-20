import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
function fresh() {
  const s = g.createGame({ age: 25, seed: 8 });
  s.money = 1e8;
  return s;
}
async function load(page, s = fresh()) {
  await page.addInitScript(
    ({ s, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(s));
    },
    { s, key: KEY },
  );
  await page.goto("/");
}
async function garage(page) {
  await tap(page, "Lifestyle & shopping");
  await page
    .locator('[data-action="retail-category"][data-id="vehicles"]')
    .first()
    .click();
  await page
    .getByRole("button", {
      name: "Open garage, journeys & licences",
      exact: true,
    })
    .click();
}
test("garage management and licence lessons use the actual fleet and cash records", async ({
  page,
}) => {
  const s = g.buy(fresh(), "used-car");
  await load(page, s);
  await garage(page);
  await page
    .getByRole("button", { name: "Start fleet management", exact: true })
    .click();
  await expect(page.locator('[data-simulation-tab="Fleet"]')).toContainText(
    "100.0/100 condition",
  );
  await page.getByRole("tab", { name: "Licences", exact: true }).click();
  const cash = (await saved(page)).money;
  await page
    .getByRole("button", { name: "Book lesson · $45", exact: true })
    .click();
  const r = await saved(page);
  expect(r.money).toBe(cash - 45);
  expect(r.simulation.mobility.licences.road.lessons).toBe(1);
  expect(g.restoreGame(r)).toEqual(r);
});
test("vehicle finance displays a complete quote before confirming any payment", async ({
  page,
}) => {
  let s = fresh();
  const job = g.JOBS.find((j) => j.track === "office" && !j.qualification);
  s.applications.push({
    id: "offer",
    vacancyId: "test",
    jobId: job.id,
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: job.pay,
  });
  s = g.acceptJobOffer(s, "offer");
  s.employment.tenure = 26;
  await load(page, s);
  await garage(page);
  await page.getByRole("tab", { name: "Finance", exact: true }).click();
  const f = page.locator('[data-operation="vehicle-finance"]');
  await f
    .getByRole("combobox", { name: "Model to finance", exact: true })
    .selectOption("used-car");
  await f.getByRole("button").click();
  await expect(page.getByRole("dialog")).toContainText("Secured principal");
  expect((await saved(page)).money).toBe(s.money);
  await page
    .getByRole("button", {
      name: "Confirm agreement & initial payment",
      exact: true,
    })
    .click();
  const r = await saved(page);
  expect(r.inventory).toContain("used-car");
  expect(r.simulation.mobility.contracts[0].balance).toBe(5200);
  expect(g.restoreGame(r)).toEqual(r);
});
test("rooms place a real furnishing and retain its inventory ownership", async ({
  page,
}) => {
  const s = g.rentHome(g.buy(fresh(), "haven-bed"), "studio");
  await load(page, s);
  await tap(page, "Homes & property");
  await page
    .getByRole("button", { name: "Open rooms & renovations", exact: true })
    .click();
  const f = page.locator('[data-operation="furniture"]');
  await f
    .getByRole("combobox", { name: "Owned furnishing", exact: true })
    .selectOption("haven-bed");
  await f
    .getByRole("combobox", { name: "Home to furnish", exact: true })
    .selectOption("rental:studio");
  await f.getByRole("button").click();
  const r = await saved(page);
  expect(r.simulation.home.furniture[0].item).toBe("haven-bed");
  expect(r.inventory).toContain("haven-bed");
  await expect(
    page.getByRole("img", { name: "Furnished room overview" }),
  ).toBeVisible();
});
test("garage and home workspaces fit 320, 390 and 430 pixel phones", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(
    page,
    g.rentHome(g.buy(g.buy(fresh(), "haven-bed"), "used-car"), "studio"),
  );
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await garage(page);
    for (const name of await page.getByRole("tab").allTextContents()) {
      await page.getByRole("tab", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await tap(page, "Homes & property");
    await page
      .getByRole("button", { name: "Open rooms & renovations", exact: true })
      .click();
    for (const name of await page.getByRole("tab").allTextContents()) {
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
