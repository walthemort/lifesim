import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
import { tap } from "./mobile-helpers.js";
import { professional, musician } from "../career-world-fixtures.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, s = g.createGame({ seed: 8, age: 23 })) {
  await page.addInitScript(
    ({ s, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(s));
    },
    { s, key: KEY },
  );
  await page.goto("/");
}

for (const width of [320, 390, 430, 1440]) {
  test(`phone navigation and all world categories fit a ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await load(page);
    const tabs = page.getByRole("navigation", { name: "App tabs" });
    await expect(tabs.getByRole("button")).toHaveCount(5);
    for (const button of await tabs.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await tap(page, "World tab");
    const names = await page
      .locator(".world-card")
      .evaluateAll((cards) => cards.map((c) => c.getAttribute("aria-label")));
    expect(names.length).toBeGreaterThanOrEqual(20);
    for (const name of names) {
      await tap(page, name);
      await expect(page.locator("#main")).not.toBeEmpty();
      const sizes = await page.evaluate(() => ({
        viewport: innerWidth,
        doc: document.documentElement.scrollWidth,
        body: document.body.getBoundingClientRect().width,
      }));
      expect(sizes.doc, name).toBeLessThanOrEqual(sizes.viewport + 1);
      expect(sizes.body, name).toBeLessThanOrEqual(480);
    }
    expect(errors).toEqual([]);
  });
}

test("phone settings opens privacy and exports/imports the same save through the browser fallback", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Save & settings");
  await tap(page, "Privacy & support");
  await expect(
    page.getByRole("heading", { name: "Your life stays on your phone." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save & settings", exact: true })
    .first()
    .click();
  const download = page.waitForEvent("download");
  await tap(page, "Export save");
  const backup = await download;
  const exported = JSON.parse(fs.readFileSync(await backup.path()));
  expect(exported).toEqual(await saved(page));
  await page.locator("#import-save").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  await page.getByRole("button", { name: "Replace current save" }).click();
  expect(await saved(page)).toEqual(exported);
});

test("a genuine v13 save gets an exact migration backup in phone settings", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v13-save.json", import.meta.url)),
  );
  await load(page, old);
  expect((await saved(page)).version).toBe(14);
  await tap(page, "Save & settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export pre-update save" }).click();
  const file = await download;
  expect(JSON.parse(fs.readFileSync(await file.path()))).toEqual(old);
});

test("selected motorsport exposes a persistent rival field and stays first on a phone", async ({
  page,
}) => {
  await load(page, professional("racing"));
  await tap(page, "Sport tab");
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-racing",
  );
  await expect(page.locator('[data-rivals="racing"]')).toContainText(
    "Apex Motorsport",
  );
  await expect(page.locator('[data-rivals="racing"] tbody tr')).toHaveCount(19);
});

test("music retirement and catalogue ownership persist through phone controls", async ({
  page,
}) => {
  const s = musician("producer", 1);
  await load(page, s);
  await tap(page, "Music & creativity");
  await page.locator('[data-action="music-retire"]').click();
  expect((await saved(page)).realWorld.retiredMusic).toBe(true);
  await page.reload();
  await tap(page, "Music & creativity");
  await expect(page.locator('[data-action="music-resume"]')).toBeVisible();
  await page.locator('[data-action="music-resume"]').click();
  expect((await saved(page)).music.active).toBe(true);
});

test("a founded company can fund product development from its own category on a phone", async ({
  page,
}) => {
  let s = g.createGame({ age: 23, seed: 8 });
  s.money = 1e6;
  s.skills.business = 80;
  s = g.foundCompany(s, { name: "Pocket studio", sector: "Game studio" });
  await load(page, s);
  await tap(page, "Start & run a company");
  const form = page.locator("#product-start-form");
  await form.getByLabel("Product name").fill("Pocket racer");
  await form.getByLabel("Product price in USD").fill("30");
  await form.getByRole("button").click();
  const result = await saved(page);
  expect(result.realWorld.products[0].name).toBe("Pocket racer");
  expect(result.company.cash).toBe(
    s.company.cash - result.realWorld.products[0].budget,
  );
  await page.reload();
  await tap(page, "Start & run a company");
  await expect(page.locator("[data-business-products]")).toContainText(
    "Pocket racer",
  );
});

async function bridge(page, snapshot) {
  await page.addInitScript(
    ({ snapshot }) => {
      const fake = (window.__nativeTest = {
        snapshot: localStorage.getItem("test-native-snapshot") ?? snapshot,
        calls: [],
        listeners: {},
      });
      window.webkit = { messageHandlers: { bridge: { postMessage() {} } } };
      const methods = {
        Preferences: ["get", "set"],
        Filesystem: ["writeFile"],
        Share: ["share"],
        Haptics: ["impact"],
        App: ["addListener", "removeListener"],
      };
      window.Capacitor = {
        PluginHeaders: Object.entries(methods).map(([name, items]) => ({
          name,
          methods: items.map((name) => ({
            name,
            rtype: name === "addListener" ? "callback" : "promise",
          })),
        })),
        nativeCallback(plugin, method, options, callback) {
          fake.listeners[options.eventName] = callback;
          return "test-listener";
        },
        async nativePromise(plugin, method, options) {
          fake.calls.push({ plugin, method, options });
          if (plugin === "Preferences" && method === "get")
            return { value: fake.snapshot };
          if (plugin === "Preferences" && method === "set") {
            fake.snapshot = options.value;
            localStorage.setItem("test-native-snapshot", options.value);
          }
          if (plugin === "Filesystem")
            return { uri: "file:///test-cache/lifesim-save.json" };
          return {};
        },
      };
    },
    { snapshot },
  );
}

test("the native bridge restores Preferences, mirrors saves and shares an actual JSON backup", async ({
  page,
}) => {
  const s = g.createGame({ age: 23, seed: 8, name: "Native player" });
  await bridge(page, JSON.stringify({ [KEY]: JSON.stringify(s) }));
  await page.goto("/");
  expect((await saved(page)).name).toBe("Native player");
  await tap(page, "Next week");
  await expect
    .poll(async () =>
      page.evaluate(
        (key) => JSON.parse(JSON.parse(window.__nativeTest.snapshot)[key]).week,
        KEY,
      ),
    )
    .toBe(1);
  await tap(page, "Save & settings");
  await tap(page, "Export save");
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          window.__nativeTest.calls.filter((c) => c.plugin === "Share").length,
      ),
    )
    .toBe(1);
  const calls = await page.evaluate(() => window.__nativeTest.calls);
  const write = calls.find(
    (c) => c.plugin === "Filesystem" && c.method === "writeFile",
  );
  expect(JSON.parse(write.options.data)).toEqual(await saved(page));
  expect(write.options.directory).toBe("CACHE");
  expect(calls.find((c) => c.plugin === "Share").options.files).toEqual([
    "file:///test-cache/lifesim-save.json",
  ]);
  expect(calls.some((c) => c.plugin === "Haptics")).toBe(true);
  await page.reload();
  expect((await saved(page)).week).toBe(1);
});

test("a failed native restore leaves the original snapshot untouched and warns the player", async ({
  page,
}) => {
  await bridge(page, "{unreadable-native-save");
  await page.goto("/");
  await expect(page.locator("#main")).toContainText(
    "Your native save could not be restored",
  );
  expect(await page.evaluate(() => window.__nativeTest.snapshot)).toBe(
    "{unreadable-native-save",
  );
  expect(
    await page.evaluate(() =>
      window.__nativeTest.calls.some(
        (c) => c.plugin === "Preferences" && c.method === "set",
      ),
    ),
  ).toBe(false);
});
