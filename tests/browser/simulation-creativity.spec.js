import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
function artist() {
  let s = g.createGame({ age: 25, seed: 8 });
  s.money = 1e7;
  s = g.configureMusic(s, { role: "singer", genre: "Pop" });
  s = g.buy(s, "phone");
  s.music.sessions = 20;
  return s;
}
async function load(page, s) {
  await page.addInitScript(
    (s) => localStorage.setItem("lifesim-save-v1", JSON.stringify(s)),
    s,
  );
  await page.goto("/");
  await tap(page, "Music & creativity");
  await page
    .getByRole("button", { name: "Open creative production", exact: true })
    .click();
}
test("a music group records an ownership agreement in the real save", async ({
  page,
}) => {
  await load(page, artist());
  await page.getByRole("tab", { name: "Group & tour", exact: true }).click();
  const f = page.locator('[data-operation="group-form"]');
  await f
    .getByRole("textbox", { name: "Group name", exact: true })
    .fill("The Cedars");
  await f.getByRole("button").click();
  await expect(
    page.locator('[data-simulation-tab="Group & tour"]').first(),
  ).toContainText("The Cedars");
  const s = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lifesim-save-v1")),
  );
  expect(s.simulation.creativity.group.members).toHaveLength(2);
  expect(g.restoreGame(s)).toEqual(s);
});
test("creative rights and audience workspaces fit three phone widths", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page, g.openCreativeStudio(artist()));
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of [
      "Recordings",
      "Rights",
      "Group & tour",
      "Audience",
      "Production team",
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
test("imported identifiers stay text in hidden controls rather than becoming markup", async ({
  page,
}) => {
  const s = g.openCreativeStudio(artist());
  s.simulation.creativity.samples = [
    {
      id: '"><img data-save-payload src=x onerror="window.__savePayload=1">',
      project: "record:external",
      source: 'Quoted "archive"',
      since: 0,
      due: 2,
      fee: 200,
      share: 0.1,
      status: "offered",
    },
  ];
  g.restoreGame(s);
  await load(page, s);
  await page.getByRole("tab", { name: "Rights", exact: true }).click();
  await expect(page.locator("img[data-save-payload]")).toHaveCount(0);
  expect(await page.evaluate(() => window.__savePayload)).toBeUndefined();
  await expect(
    page.locator('[data-operation="sample-resolve"] input[name="sample"]'),
  ).toHaveValue(s.simulation.creativity.samples[0].id);
});
