import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import {
  RETAIL_BUSINESSES,
  RETAIL_CATEGORIES,
  RETAIL_PRODUCTS,
  productStore,
  storeProducts,
} from "../src/retail-data.js";
import { CLOTHING } from "../src/expansion-data.js";
import { resalePrice, localPrice } from "../src/economy.js";
const fresh = (options = {}) => {
  const s = g.createGame({ seed: 8, age: 25, ...options });
  s.money = 1e10;
  return s;
};
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return g.advanceWeek(s);
}
test("every storefront has distinct stock and known categories; vehicles include nine viable dealers", () => {
  const dealers = RETAIL_BUSINESSES.filter((b) => b.category === "vehicles");
  assert.equal(dealers.length, 9);
  const listed = new Set();
  for (const store of RETAIL_BUSINESSES) {
    assert.ok(RETAIL_CATEGORIES.some(([id]) => id === store.category));
    if (store.kind === "products") {
      const stock = storeProducts(g.SHOP, store.id);
      assert.ok(stock.length >= 4, store.name);
      for (const item of stock) {
        assert.ok(!listed.has(item.id), item.id);
        listed.add(item.id);
        assert.ok(
          !["Ownership", "Property", "Music studio"].includes(item.category),
        );
      }
    } else if (store.kind === "clothing") {
      assert.equal(CLOTHING.filter((i) => i.store === store.id).length, 8);
    } else if (store.kind === "property") {
      assert.ok(store.types.every((id) => g.HOMES.some((h) => h.id === id)));
    } else if (store.kind === "experiences") {
      assert.ok(
        store.experiences.every((id) => g.EXPERIENCES.some((x) => x.id === id)),
      );
    }
  }
  assert.equal(listed.size, g.SHOP.filter((i) => productStore(i)).length);
  assert.equal(new Set(g.SHOP.map((i) => i.id)).size, g.SHOP.length);
  assert.equal(new Set(CLOTHING.map((i) => i.id)).size, CLOTHING.length);
});
for (const id of [
  "heritage-roadster",
  "volta-mini",
  "ironline-125",
  "bluewater-superyacht",
  "altair-global",
  "haven-sofa",
]) {
  test(`${id}: purchase, upkeep, value and resale use the actual ownership ledger`, () => {
    const original = fresh(),
      item = g.SHOP.find((i) => i.id === id);
    const owned = g.buy(original, id);
    assert.equal(
      owned.money,
      original.money - localPrice(original, item.price),
    );
    assert.ok(owned.inventory.includes(id));
    assert.throws(() => g.buy(owned, id), /already own/);
    const withItem = next(owned),
      without = next(original);
    assert.ok(
      Math.abs(without.money - withItem.money - (item.price + item.upkeep)) <
        0.02,
    );
    assert.deepEqual(g.restoreGame(withItem), withItem);
    const sold = g.sellItem(owned, id);
    assert.equal(sold.money, owned.money + resalePrice(owned, item));
    assert.ok(!sold.inventory.includes(id));
    assert.deepEqual(original, fresh());
  });
}
test("vehicles require adulthood and ownership never gives a sporting licence or job", () => {
  const child = fresh({ age: 15 });
  assert.throws(() => g.buy(child, "altair-global"), /older/);
  const s = g.buy(fresh(), "apex-track");
  assert.equal(s.employment, null);
  assert.equal(s.sports.racing.stage, "none");
  assert.deepEqual(s.education.completed, fresh().education.completed);
});
test("new outfits use the existing wardrobe and keep the selected look through a save", () => {
  const s = g.buyClothing(fresh(), "block-varsity");
  assert.equal(s.money, fresh().money - 240);
  assert.equal(s.globalLife.wearing, "block-varsity");
  assert.equal(s.characterLife.profile.garment, "Jacket");
  assert.deepEqual(g.restoreGame(s), s);
});
test("new property agency homes use existing closing fees, housing ownership and loans", () => {
  const s = fresh(),
    listing = g.propertyListings(s).find((p) => p.id === "loft");
  const purchased = g.purchaseHome(s, "loft", "cash");
  assert.equal(purchased.housing.properties.at(-1).type, "loft");
  assert.ok(Math.abs(s.money - purchased.money - listing.asking * 1.02) < 0.02);
  assert.equal(purchased.housing.residence, null);
  assert.deepEqual(g.restoreGame(purchased), purchased);
});
test("a populated old save is unchanged by expanding the shopping catalogue", () => {
  const old = JSON.parse(
    fs.readFileSync(new URL("./fixtures/v15-save.json", import.meta.url)),
  );
  const upgraded = g.restoreGame(old);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") assert.deepEqual(upgraded[key], value, key);
  assert.ok(RETAIL_PRODUCTS.every((i) => !old.inventory.includes(i.id)));
});
test("custom Debug skips simulate every week, preserve wellbeing locks and accept pending choices", () => {
  let s = g.toggleDebug(fresh({ age: 0 }), true);
  s.actions = 0;
  s = g.setGodModeLock(s, "energy", true);
  const original = structuredClone(s),
    skipped = g.debugAdvance(s, 7);
  let expected = structuredClone(s);
  for (let n = 0; n < 7; n++) expected = next(expected);
  assert.equal(skipped.week, 7);
  assert.equal(skipped.money, expected.money);
  assert.deepEqual(skipped.market, expected.market);
  assert.equal(skipped.energy, 100);
  assert.deepEqual(s, original);
  assert.deepEqual(g.restoreGame(skipped), skipped);
  for (const invalid of [0, 53, -1, 1.5, NaN, "4"])
    assert.throws(() => g.debugAdvance(s, invalid), /whole number/);
});
