import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { tap, reveal } from "./mobile-helpers.js";
function employee(track) {
  let s = g.createGame({ age: 30, seed: 8 });
  s.money = 1e7;
  const j = g.JOBS.find((j) => j.track === track);
  s.applications.push({
    id: "test",
    vacancyId: "test",
    jobId: j.id,
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: j.pay,
  });
  return g.acceptJobOffer(s, "test");
}
async function load(page, s) {
  await page.addInitScript(
    (s) => localStorage.setItem("lifesim-save-v1", JSON.stringify(s)),
    s,
  );
  await page.goto("/");
  await tap(page, "Work & education");
  const b = page.getByRole("button", {
    name: "Open professional practice",
    exact: true,
  });
  await reveal(page, b);
  await b.click();
}
test("teachers open a practice, accept a real class and review its pupils", async ({
  page,
}) => {
  await load(page, employee("teaching"));
  await page
    .getByRole("button", { name: "Open your practice desk", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Accept the next case or project",
      exact: true,
    })
    .click();
  await page.getByRole("tab", { name: "People", exact: true }).click();
  await expect(page.locator('[data-simulation-tab="People"]')).toContainText(
    "learning support",
  );
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(s.simulation.professions.class).toHaveLength(24);
  expect(g.restoreGame(s)).toEqual(s);
});
test("professional role workspaces fit three phone widths without runtime errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page, g.openProfessionalDesk(employee("investor")));
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ["Casework", "People", "Training", "Career"]) {
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
