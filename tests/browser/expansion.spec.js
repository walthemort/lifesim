import { tap, interact, reveal } from "./mobile-helpers.js";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
import { gameDate } from "../../src/dates.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
const nav = (page, name) => tap(page, name);
async function load(page, s = g.createGame({ seed: 1, age: 18 })) {
  await page.addInitScript(
    ({ s, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(s));
    },
    { s, key: KEY },
  );
  await page.goto("/");
}
async function week(page) {
  await interact(page, page.locator('[data-action="next-week"]'), "click");
  if (await page.getByRole("dialog").isVisible())
    await interact(page, page.locator(".event-option").last(), "click");
}
test("Pro creator searches global cities and previews distinct shaded hairstyles", async ({
  page,
}) => {
  let s = g.setProPreview(
    g.toggleDebug(g.createGame({ seed: 1, age: 18 }), true),
    true,
  );
  s = g.toggleDebug(s, false);
  await load(page, s);
  await nav(page, "Save & settings");
  await nav(page, "Open character creator");
  await interact(page, page.getByLabel("Birth country"), "selectOption", "JP");
  await interact(page, page.getByLabel("Find a birthplace"), "fill", "Tokyo");
  await interact(
    page,
    page.getByLabel("Birthplace", { exact: true }),
    "selectOption",
    "Tokyo",
  );
  await interact(page, page.getByLabel("Your name"), "fill", "Aiko Mori");
  await interact(page, page.getByLabel("Hair style"), "selectOption", "Braids");
  await interact(page, page.getByLabel("Face shape"), "selectOption", "Round");
  await expect(
    page.locator("#character-form svg defs linearGradient"),
  ).toHaveCount(2);
  await expect(page.getByLabel("Nationality", { exact: true })).toHaveCount(0);
  await nav(page, "Begin my story");
  const r = await saved(page);
  expect(r.city).toBe("Tokyo");
  expect(r.globalLife.citizenships).toEqual(["JP"]);
  expect(r.startAge).toBe(0);
  expect(r.characterLife.profile.hairstyle).toBe("Braids");
});
test("appearance editing cannot rewrite citizenship for Pro users", async ({
  page,
}) => {
  let s = g.setProPreview(
    g.toggleDebug(g.createGame({ seed: 1, age: 18 }), true),
    true,
  );
  s = g.toggleDebug(s, false);
  await load(page, s);
  await nav(page, "Character & hometown");
  await nav(page, "Edit character profile");
  await expect(page.getByLabel("Nationality", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Birthplace", { exact: true })).toHaveCount(0);
  await interact(page, page.getByLabel("Hair style"), "selectOption", "Afro");
  await nav(page, "Save character profile");
  expect((await saved(page)).globalLife.citizenships).toEqual(["GB"]);
});
test("shopping starts with stores and outfit previews do not spend cash until purchase", async ({
  page,
}) => {
  await load(page);
  await nav(page, "Lifestyle & shopping");
  await expect(page.locator(".shop-card")).toHaveCount(0);
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Budget wardrobe"]'),
    "click",
  );
  const before = await saved(page);
  await interact(
    page,
    page.locator('[data-action="outfit-preview"][data-id="hoodie"]'),
    "click",
  );
  expect((await saved(page)).money).toBe(before.money);
  await expect(page.locator("[data-outfit-name]")).toHaveText("Campus hoodie");
  await interact(
    page,
    page.locator('[data-action="outfit-buy"][data-id="hoodie"]'),
    "click",
  );
  const r = await saved(page);
  expect(r.money).toBe(before.money - 45);
  expect(r.characterLife.profile.garment).toBe("Hoodie");
  await page.reload();
  expect((await saved(page)).globalLife.wearing).toBe("hoodie");
});
test("barbers offer previews, real appointment fees and free-user premium gates", async ({
  page,
}) => {
  await load(page);
  await nav(page, "Lifestyle & shopping");
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Barbers"]'),
    "click",
  );
  await expect(
    page.getByLabel("Hair style").locator("option", { hasText: "Braids" }),
  ).toHaveCount(0);
  await interact(page, page.getByLabel("Hair style"), "selectOption", "Fade");
  await interact(
    page,
    page.getByLabel("Barber", { exact: true }),
    "selectOption",
    "salon",
  );
  const before = await saved(page);
  await nav(page, "Book haircut");
  const r = await saved(page);
  expect(r.money).toBe(before.money - 75);
  expect(r.characterLife.profile.hairstyle).toBe("Fade");
  expect(r.actions).toBe(before.actions - 1);
});
test("car dealers show cars and keep unrelated possessions out of the selected department", async ({
  page,
}) => {
  await load(page);
  await nav(page, "Lifestyle & shopping");
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Car dealers"]'),
    "click",
  );
  await expect(page.locator(".shop-card")).not.toHaveCount(0);
  await expect(
    page.locator(".shop-card").filter({ hasText: "The everyday watch" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Shopping category")).toHaveValue("Garage");
});
test("relocation country/city search and a paid application preserve birthplace and passport", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18 });
  s.money = 300000;
  await load(page, s);
  await nav(page, "Character & hometown");
  await nav(page, "Plan a move abroad");
  await interact(
    page,
    page.getByLabel("Destination country"),
    "selectOption",
    "US",
  );
  await interact(page, page.getByLabel("Find a city"), "fill", "New York");
  await interact(
    page,
    page.getByLabel("Destination city"),
    "selectOption",
    "New York",
  );
  await interact(
    page,
    page.getByLabel("Application route"),
    "selectOption",
    "investor",
  );
  await nav(page, "Confirm selected step");
  const r = await saved(page);
  expect(r.money).toBe(s.money - 450);
  expect(r.globalLife.applications[0].status).toBe("pending");
  expect(r.city).toBe("London");
  expect(r.globalLife.citizenships).toEqual(["GB"]);
  await expect(page.locator("[data-relocation]")).toContainText("review");
});
test("criminal scenarios need confirmation and custody interrupts normal life", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18 });
  s.globalLife.seed = 0;
  await load(page, s);
  await nav(page, "Crime & consequences");
  await interact(
    page,
    page.locator('[data-action="crime-review"][data-id="theft"]'),
    "click",
  );
  await expect(page.getByRole("dialog", { includeHidden: true })).toContainText(
    "custody",
  );
  await nav(page, "Take the risk");
  const r = await saved(page);
  expect(r.globalLife.crime.prison).toBeTruthy();
  expect(r.actions).toBe(0);
  await expect(page.locator("main")).toContainText("expected release");
  await nav(page, "Rehabilitation programme");
  expect((await saved(page)).globalLife.crime.rehabilitation).toBe(1);
  await week(page);
  expect((await saved(page)).week).toBe(1);
});
test("Space advances a week and opens life choices; holding it and typing never skip time", async ({
  page,
}) => {
  await load(page);
  await interact(page, page.locator("h1"), "click");
  await page.keyboard.press("Space");
  expect((await saved(page)).week).toBe(1);
  await page.keyboard.press("Space");
  expect((await saved(page)).week).toBe(2);
  await reveal(page, page.getByRole("dialog", { includeHidden: true }));
  await expect(page.getByRole("dialog", { includeHidden: true })).toBeVisible();
  await page.keyboard.press("Space");
  expect((await saved(page)).week).toBe(2);
  await interact(page, page.locator(".event-option").last(), "click");
  await nav(page, "Music & creativity");
  await interact(
    page,
    page.getByLabel("Artist name"),
    "fill",
    "A Name With Spaces",
  );
  await page.keyboard.press("Space");
  expect((await saved(page)).week).toBe(2);
});
test("the notification bell links to actual events and material changes in held investments", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18 });
  s.globalLife.marketAlerts = [
    {
      id: "market:tech:0",
      market: "tech",
      symbol: "HRZN",
      change: -4.5,
      week: 0,
    },
  ];
  await load(page, s);
  await nav(page, "Notifications");
  await expect(page.getByRole("dialog", { includeHidden: true })).toContainText(
    "HRZN ↓ 4.5%",
  );
  await nav(page, "Review investments");
  await expect(page.locator("main h1")).toHaveText("Make your future grow.");
  expect((await saved(page)).globalLife.readAlerts).toContain("market:tech:0");
});
test("track workshop keeps a completed recording unreleased until its artist chooses a single", async ({
  page,
}) => {
  let s = g.createGame({ seed: 1, age: 18, career: "music" });
  s = g.buy(s, "phone");
  s.music.sessions = 8;
  await load(page, s);
  await nav(page, "Music & creativity");
  await interact(page, page.getByLabel("Artist name"), "fill", "Northstar");
  await nav(page, "Save artist name");
  await nav(page, "Create a track");
  await interact(page, page.getByLabel("Track title"), "fill", "Night train");
  await interact(page, page.getByLabel("Beat source"), "selectOption", "lease");
  await interact(
    page,
    page.getByLabel("Production ambition"),
    "selectOption",
    "lean",
  );
  await nav(page, "Start track workshop");
  await nav(page, "Write & revise lyrics");
  await week(page);
  await nav(page, "Record performance");
  for (let i = 0; i < 4; i++) await week(page);
  let r = await saved(page);
  expect(r.music.releases).toHaveLength(0);
  expect(r.globalLife.tracks[0].stage).toBe("ready");
  await nav(page, "Release single");
  await week(page);
  r = await saved(page);
  expect(r.music.releases).toHaveLength(1);
  expect(r.globalLife.artistName).toBe("Northstar");
  await page.getByRole("tab", { name: "Catalogue", exact: true }).click();
  await expect(page.locator("[data-music-catalogue]")).toContainText(
    "Night train",
  );
  await expect(page.locator("[data-music-catalogue]")).toContainText("rating");
});
test("company tab offers 24 industries and starts the chosen model with actual startup capital", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18 });
  s.skills.business = 50;
  s.money = 50000;
  await load(page, s);
  await nav(page, "Start & run a company");
  await expect(page.locator(".industry-grid article")).toHaveCount(24);
  await interact(
    page,
    page.locator('[data-action="company-launch-plan"][data-id="Coffee shop"]'),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Company name"),
    "fill",
    "Harbour Coffee",
  );
  await interact(
    page,
    page.getByLabel("Business model", { exact: true }),
    "selectOption",
    "retail",
  );
  await nav(page, "Launch company");
  const r = await saved(page);
  expect(r.company.sector).toBe("Coffee shop");
  expect(r.money).toBe(38000);
  expect(r.company.cash).toBe(12000);
  expect(r.globalLife.companyPlan.model).toBe("retail");
  await expect(page.locator("main")).toContainText(
    "Business model & development",
  );
});
for (const [path, text] of [
  ["racing", "DRIVER CONTROL CENTRE"],
  ["football", "PLAYER & MATCH CENTRE"],
])
  test(`${path} has its own career interface at the top`, async ({ page }) => {
    await load(page, g.createGame({ seed: 1, age: 16, career: path }));
    await nav(page, "Sport & development");
    await expect(page.locator(".career-cockpit")).toContainText(text);
    await expect(page.locator(".career-cockpit")).toBeInViewport();
  });
test("contract timestamps become dates even after many simulated years", async ({
  page,
}) => {
  let s = g.createGame({ seed: 1, age: 18, career: "racing" });
  s.money = 1000000;
  s.skills.driving = 80;
  s.education.completed = ["racing-license"];
  s.sports.racing.offers.push({
    id: "test-seat",
    kind: "contract",
    jobId: "racing-1",
    club: "Apex Motorsport",
    pay: 350,
    status: "offered",
    expiresWeek: 4,
  });
  s = g.acceptSportOffer(s, "racing", "test-seat");
  s.contracts.current.racing.expiresWeek = 1224;
  s.sports.racing.contract.expiresWeek = 1224;
  await load(page, s);
  await nav(page, "Sport & development");
  await expect(page.locator("[data-depth-contracts]")).toContainText(
    gameDate(1224),
  );
  await expect(page.locator("main")).not.toContainText("week 1224");
  await expect(page.locator(".game-date")).not.toContainText("WEEK");
});
test("v12 saves get an exact downloadable backup before additive migration", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v12-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const r = await saved(page);
  expect(r.version).toBe(g.VERSION);
  for (const [k, v] of Object.entries(old))
    if (k !== "version") expect(r[k]).toEqual(v);
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key + "-before-v15"),
      KEY,
    ),
  ).toBe(JSON.stringify(old));
  await nav(page, "Save & settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    nav(page, "Export pre-update save"),
  ]);
  expect(download.suggestedFilename()).toBe("lifesim-before-v15.json");
});
test("expanded character, retail, company and career interfaces fit a phone without browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, g.createGame({ seed: 1, age: 18, career: "racing" }));
  for (const name of [
    "Character & hometown",
    "Lifestyle & shopping",
    "Start & run a company",
    "Sport & development",
    "Music & creativity",
    "Crime & consequences",
  ]) {
    await nav(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await nav(page, "Lifestyle & shopping");
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Designer atelier"]'),
    "click",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("founder contributions transfer cash into a real company account", async ({
  page,
}) => {
  let s = g.createGame({ seed: 1, age: 18 });
  s.skills.business = 50;
  s.money = 25000;
  s = g.foundCompany(s, { name: "Seed Company", sector: "Technology" });
  await load(page, s);
  await nav(page, "Start & run a company");
  await nav(page, "Contribute founder capital");
  await interact(
    page,
    page.getByLabel("Capital contribution"),
    "fill",
    "1000.15",
  );
  await nav(page, "Transfer founder capital");
  const r = await saved(page);
  expect(r.money).toBeCloseTo(s.money - 1000.15, 2);
  expect(r.company.cash).toBeCloseTo(s.company.cash + 1000.15, 2);
  expect(g.netWorth(r)).toBeCloseTo(g.netWorth(s), 2);
});
