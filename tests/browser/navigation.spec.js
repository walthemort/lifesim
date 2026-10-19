import { tap, interact, reveal } from "./mobile-helpers.js";
import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { professional } from "../career-world-fixtures.js";

const KEY = "lifesim-save-v1";
async function load(page, state) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
const navigate = (page, name) => tap(page, name);

for (const [id, name] of [
  ["football", "Football"],
  ["racing", "Motorsport"],
  ["basketball", "Basketball"],
  ["tennis", "Tennis"],
]) {
  test(`${name} interest comes first with its season and other sports accessible`, async ({
    page,
  }) => {
    await load(page, g.createGame({ seed: 1, age: 12, career: id }));
    await navigate(page, "Sport & development");
    await expect(page.locator(".sport-section").first()).toHaveAttribute(
      "id",
      `sport-section-${id}`,
    );
    await expect(
      page.locator(".sport-section").first().locator("[data-sport-card]"),
    ).toHaveAttribute("data-sport-card", id);
    await expect(
      page.locator(".sport-section").first().locator("[data-season]"),
    ).toHaveAttribute("data-season", id);
    await expect(
      page
        .getByRole("navigation", {
          name: "Sport & development sections",
          includeHidden: true,
        })
        .getByRole("button", { name, includeHidden: true }),
    ).toHaveAttribute("aria-current", "true");
    await expect(page.locator("[data-sport-card]")).toHaveCount(1);
  });
}

test("a paid sporting career takes priority over the original life interest", async ({
  page,
}) => {
  const state = professional("racing");
  state.aspiration = "football";
  await load(page, state);
  await navigate(page, "Sport & development");
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-racing",
  );
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "data-sport-world",
    "racing",
  );
});

test("sport shortcuts keep focus through weekly updates and category changes without changing careers", async ({
  page,
}) => {
  await load(page, g.createGame({ seed: 1, age: 12, career: "racing" }));
  await navigate(page, "Sport & development");
  const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
  const bar = page.getByRole("navigation", {
    name: "Sport & development sections",
  });
  await interact(
    page,
    bar.getByRole("button", { name: "Basketball", includeHidden: true }),
    "click",
  );
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-basketball",
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(
    before,
  );
  await navigate(page, "Next week");
  if (await page.getByRole("dialog").isVisible())
    await interact(page, page.locator(".event-option").last(), "click");
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-basketball",
  );
  await navigate(page, "Work & education");
  await navigate(page, "Sport & development");
  await expect(
    bar.getByRole("button", { name: "Basketball", includeHidden: true }),
  ).toHaveAttribute("aria-current", "true");
  await page.reload();
  await navigate(page, "Sport & development");
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-racing",
  );
});

test("category shortcuts reach real sections and stay usable on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, g.createGame({ seed: 1, age: 18, career: "music" }));
  await navigate(page, "Music & creativity");
  const bar = page.getByRole("tablist", { name: "music workspace" });
  await bar.getByRole("tab", { name: "Catalogue", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", {
      name: "Catalogue",
      exact: true,
      includeHidden: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("tabpanel", {
      name: "Studio",
      exact: true,
      includeHidden: true,
    }),
  ).toBeHidden();
  await expect(bar).toBeInViewport();
  await navigate(page, "Sport & development");
  await interact(
    page,
    page
      .getByRole("navigation", {
        name: "Sport & development sections",
        includeHidden: true,
      })
      .getByRole("button", { name: "Tennis", includeHidden: true }),
    "click",
  );
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-tennis",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("childhood shortcuts respect the age-gated screen", async ({ page }) => {
  await load(page, g.createGame({ seed: 1, career: "racing" }));
  await navigate(page, "Sport & development");
  await expect(page.locator("[data-action=focus-sport]")).toHaveCount(0);
  await expect(page.locator("main")).toContainText("supervised play");
});
