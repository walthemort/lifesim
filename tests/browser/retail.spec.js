import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import {
  RETAIL_BUSINESSES,
  RETAIL_CATEGORIES,
  storeProducts,
} from "../../src/retail-data.js";
import { resalePrice } from "../../src/economy.js";
import { tap, visitStore } from "./mobile-helpers.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, state = g.createGame({ age: 25, seed: 8 })) {
  await page.addInitScript(
    ({ state, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { state, key: KEY },
  );
  await page.goto("/");
}
test("shopping starts with categories, then nine dealers, then a single company's showroom", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Lifestyle & shopping");
  await expect(
    page.getByRole("navigation", { name: "Shopping categories" }),
  ).toBeVisible();
  await expect(page.locator('[data-action="retail-category"]')).toHaveCount(9);
  await expect(page.locator('[data-action="retail-store"]')).toHaveCount(0);
  await page
    .locator('[data-action="retail-category"][data-id="vehicles"]')
    .click();
  await expect(page.locator('[data-action="retail-store"]')).toHaveCount(9);
  await expect(page.locator(".shop-card")).toHaveCount(0);
  await page
    .locator('[data-action="retail-store"][data-id="heritage"]')
    .click();
  await expect(
    page.getByRole("heading", { name: "Heritage Motor Co.", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".shop-card")).toHaveCount(5);
  await expect(
    page.locator('.shop-card [data-id="heritage-roadster"]'),
  ).toBeVisible();
  await page.getByLabel("Shopping category").selectOption("All");
  const ids = await page
    .locator("[data-product]")
    .evaluateAll((els) => els.map((el) => el.dataset.product));
  expect(ids).toEqual(storeProducts(g.SHOP, "heritage").map((i) => i.id));
  await expect(page.locator('.shop-card [data-id="watch"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Explore other dealers" }).click();
  await expect(page.locator('[data-action="retail-store"]')).toHaveCount(9);
  await page.locator('[data-action="retail-home"]').click();
  await expect(
    page.getByRole("navigation", { name: "Shopping categories" }),
  ).toBeVisible();
});
test("search, sorting and owned filters stay inside a dealer and reset when visiting another", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Lifestyle & shopping");
  await visitStore(page, "vehicles", "heritage");
  await page.getByLabel("Search shopping").fill("Roadster");
  await expect(page.locator("[data-product]")).toHaveCount(1);
  await page.getByLabel("Show owned possessions only").check();
  await expect(page.locator("[data-product]")).toHaveCount(0);
  await visitStore(page, "vehicles", "bluewater");
  await expect(page.getByLabel("Search shopping")).toHaveValue("");
  await expect(
    page.getByLabel("Show owned possessions only"),
  ).not.toBeChecked();
  await page.getByLabel("Sort shopping").selectOption("high");
  await expect(page.locator("[data-product]").first()).toHaveAttribute(
    "data-product",
    "bluewater-megayacht",
  );
  await expect(page.locator("[data-product]")).toHaveCount(6);
  await visitStore(page, "vehicles", "altair");
  await expect(page.locator('[data-product="private-jet"]')).toBeVisible();
  await expect(page.locator('[data-product="yacht"]')).toHaveCount(0);
});
test("a classic purchase persists and My belongings uses its actual resale quote", async ({
  page,
}) => {
  let s = g.createGame({ age: 25, seed: 8 });
  s.money = 1000000;
  await load(page, s);
  await tap(page, "Lifestyle & shopping");
  await visitStore(page, "vehicles", "heritage");
  await page
    .locator('[data-action="buy"][data-id="heritage-roadster"]')
    .click();
  const owned = await saved(page);
  expect(owned.inventory).toContain("heritage-roadster");
  expect(owned.money).toBe(s.money - 42000);
  await page
    .getByRole("button", { name: "My belongings", exact: true })
    .click();
  await expect(
    page.locator('[data-product="heritage-roadster"]'),
  ).toContainText("Owned");
  await page
    .locator('[data-action="sell-item"][data-id="heritage-roadster"]')
    .click();
  const quote = resalePrice(
    owned,
    g.SHOP.find((i) => i.id === "heritage-roadster"),
  );
  await expect(page.getByRole("dialog")).toContainText(
    quote.toLocaleString("en-US"),
  );
  await page.getByRole("button", { name: "Confirm sale" }).click();
  const sold = await saved(page);
  expect(sold.money).toBe(owned.money + quote);
  expect(sold.inventory).not.toContain("heritage-roadster");
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(sold);
});
test("new clothing stores preview without charging and keep purchases in the wardrobe", async ({
  page,
}) => {
  const s = g.createGame({ age: 25, seed: 8 });
  s.money = 10000;
  await load(page, s);
  await tap(page, "Lifestyle & shopping");
  await visitStore(page, "clothing", "block-nine");
  await expect(page.locator('[data-action="outfit-preview"]')).toHaveCount(8);
  await page
    .locator('[data-action="outfit-preview"][data-id="block-varsity"]')
    .click();
  expect((await saved(page)).money).toBe(s.money);
  await expect(page.locator("[data-outfit-name]")).toHaveText("Varsity jacket");
  await page
    .locator('[data-action="outfit-buy"][data-id="block-varsity"]')
    .click();
  expect((await saved(page)).money).toBe(s.money - 240);
  await page
    .getByRole("button", { name: "My belongings", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Varsity jacket · wearing" }),
  ).toBeVisible();
  await page.reload();
  expect((await saved(page)).globalLife.wearing).toBe("block-varsity");
});
test("property agencies quote actual listings and buy through the existing housing ledger", async ({
  page,
}) => {
  const s = g.createGame({ age: 25, seed: 8 });
  s.money = 2000000;
  await load(page, s);
  await tap(page, "Lifestyle & shopping");
  await visitStore(page, "property", "urban-key");
  await expect(page.locator("[data-property-listing]")).toHaveCount(4);
  await expect(page.locator('[data-property-listing="island"]')).toHaveCount(0);
  await page
    .locator('[data-property-listing="loft"] [data-action="purchase-home"]')
    .click();
  await expect(page.getByRole("dialog")).toContainText("Warehouse loft");
  await page
    .getByRole("button", { name: "Purchase property", exact: true })
    .click();
  const bought = await saved(page);
  expect(bought.housing.properties.at(-1).type).toBe("loft");
  expect(bought.housing.residence).toBe(null);
  const quote = g.propertyListings(s).find((p) => p.id === "loft");
  expect(bought.money).toBeCloseTo(s.money - quote.asking * 1.02, 2);
  await page
    .getByRole("button", { name: "Manage your homes & tenants" })
    .click();
  await expect(
    page.locator(`[data-property="${bought.housing.properties.at(-1).id}"]`),
  ).toBeVisible();
});
test("God mode has a visible Time tab, custom real-week skips and next birthday", async ({
  page,
}) => {
  const s = g.toggleDebug(g.createGame({ age: 0, seed: 8 }), true);
  await load(page, s);
  await page.getByRole("button", { name: "God mode", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Time", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Advance time", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Time", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("Weeks to simulate").fill("7");
  await page.getByRole("button", { name: "Simulate chosen weeks" }).click();
  expect((await saved(page)).week).toBe(7);
  await page
    .getByRole("button", { name: "Go to next birthday · 45 weeks" })
    .click();
  const r = await saved(page);
  expect(r.week).toBe(52);
  expect(g.age(r)).toBe(1);
  await expect(
    page.getByRole("tab", { name: "Time", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.locator('[data-action="debug-time"][data-id="1"]').click();
  expect((await saved(page)).week).toBe(53);
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("new stores and Debug controls fit small phones without browser errors", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await load(page, g.toggleDebug(g.createGame({ age: 25, seed: 8 }), true));
  await tap(page, "Lifestyle & shopping");
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [category] of RETAIL_CATEGORIES) {
      const store = RETAIL_BUSINESSES.find((b) => b.category === category);
      await visitStore(page, category, store.id);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const store of RETAIL_BUSINESSES) {
    await visitStore(page, store.category, store.id);
    await expect(page.locator("[data-retail-business]")).toHaveAttribute(
      "data-retail-business",
      store.id,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "God mode", exact: true }).click();
  await page.getByRole("tab", { name: "Time", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
