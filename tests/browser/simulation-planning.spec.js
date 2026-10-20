import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
function fresh() {
  const s = g.createGame({ age: 30, seed: 8 });
  s.money = 1e6;
  return s;
}
function parent(ended = false) {
  const s = fresh();
  s.week = 1560;
  s.family.children = [
    {
      id: "heir",
      name: "Robin Morgan",
      bornWeek: 500,
      parentId: "sam",
      bond: 80,
      education: 70,
      wellbeing: 85,
      interest: "music",
      club: "none",
      schoolType: "state",
      confidence: 60,
      independence: 50,
      future: "undecided",
      support: false,
      lastSupportWeek: 0,
    },
  ];
  s.ended = ended;
  return s;
}
async function load(page, s) {
  await page.addInitScript(
    (s) => localStorage.setItem("lifesim-save-v1", JSON.stringify(s)),
    s,
  );
  await page.goto("/");
}
async function economics(page) {
  await tap(page, "Investments");
  await page
    .getByRole("button", { name: "Open economy & resilience", exact: true })
    .click();
}
async function planning(page) {
  await tap(page, "Family & pets");
  const b = page.getByRole("button", {
    name: "Open wills & family history",
    exact: true,
  });
  if (!(await b.isVisible())) {
    for (const tab of await page.getByRole("tab").allTextContents()) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      if (await b.isVisible()) break;
    }
  }
  await b.click();
}
test("household targets create a persistent real cash review", async ({
  page,
}) => {
  await load(page, fresh());
  await economics(page);
  await page.getByRole("tab", { name: "Budget", exact: true }).click();
  const f = page.locator('[data-operation="budget"]');
  await f
    .getByRole("spinbutton", {
      name: "Shopping & activity target",
      exact: true,
    })
    .fill("50");
  await f.getByRole("button").click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(s.simulation.economy.budget.discretionary).toBe(50);
  expect(g.restoreGame(s)).toEqual(s);
});
test("a will allocates real beneficiaries using readable percentage fields", async ({
  page,
}) => {
  await load(page, parent());
  await planning(page);
  await page.getByRole("tab", { name: "Will", exact: true }).click();
  const f = page.locator('[data-operation="will"]');
  await f
    .getByRole("spinbutton", { name: "Robin Morgan · percentage", exact: true })
    .fill("75");
  await f
    .getByRole("spinbutton", {
      name: "Community charitable fund · percentage",
      exact: true,
    })
    .fill("25");
  await f.getByRole("button").click();
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(s.simulation.legacy.will.allocations[0].share).toBe(75);
  expect(g.restoreGame(s)).toEqual(s);
});
test("inheritance reviews the estate before replacing the completed life and preserves its export", async ({
  page,
}) => {
  const s = parent(true);
  await load(page, s);
  await page
    .getByRole("button", { name: "Review estate & heirs", exact: true })
    .click();
  await page.getByRole("tab", { name: "Estate", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Review estate & continue as heir",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Continue as Robin Morgan",
  );
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("lifesim-save-v1")),
      )
    ).name,
  ).toBe(s.name);
  await page
    .getByRole("button", {
      name: "Confirm estate settlement & continue",
      exact: true,
    })
    .click();
  const n = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(n.name).toBe("Robin Morgan");
  expect(n.week).toBe(s.week);
  expect(n.simulation.legacy.generation).toBe(1);
  expect(g.restoreGame(n)).toEqual(n);
  await page.getByRole("tab", { name: "Family history", exact: true }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Export the previous completed life",
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "lifesim-previous-life.json",
  );
});
test("economy and legal workspaces fit three phone widths", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page, parent());
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await economics(page);
    for (const name of [
      "Economy",
      "Corporate actions",
      "Crypto",
      "Budget",
      "Insolvency",
    ]) {
      await page.getByRole("tab", { name, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await planning(page);
    for (const name of [
      "Cases",
      "Supervision",
      "Will",
      "Estate",
      "Family history",
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
