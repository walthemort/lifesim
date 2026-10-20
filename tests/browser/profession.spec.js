import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import fs from "node:fs";
import { professional, musician, weeks } from "../career-world-fixtures.js";
import { tap } from "./mobile-helpers.js";
const KEY = "lifesim-save-v1",
  saved = (page) =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, s = g.createGame({ age: 23, seed: 8 })) {
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
  await page.locator('[data-action="next-week"]').click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
function employed(track) {
  let s = g.createGame({ age: 23, seed: 8 });
  s.money = 100000;
  for (const k of Object.keys(s.skills)) s.skills[k] = 95;
  const j = g.JOBS.find((j) => j.track === track && !g.isSportingJob(j));
  s.applications.push({
    id: "fixture-job",
    vacancyId: "fixture",
    jobId: j.id,
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: j.pay,
  });
  return g.acceptJobOffer(s, "fixture-job");
}
for (const path of g.WORLD_SPORTS) {
  test(`${path} offers its own skills, training, preparation and kit on a phone`, async ({
    page,
  }) => {
    const s = professional(path);
    await load(page, s);
    await tap(page, "Sport & development");
    await page.getByRole("tab", { name: "Development", exact: true }).click();
    const block = page.locator('[data-form="sport-block"]'),
      focus = Object.keys(g.SPORT_SPECIALTIES[path])[0];
    await block.locator('[name="focus"]').selectOption(focus);
    await block.locator('[name="load"]').selectOption("coached");
    await block.getByRole("button").click();
    await week(page);
    expect((await saved(page)).profession.sports[path].block.sessions).toBe(1);
    await expect(page.locator("[data-profession-training]")).toContainText(
      "$35",
    );
    await page
      .getByRole("tab", {
        name: {
          football: "Matchday",
          racing: "Race weekend",
          basketball: "Game day",
          tennis: "Tournament",
        }[path],
        exact: true,
      })
      .click();
    const form = page.locator('[data-form="performance-plan"]');
    if (await form.count()) {
      await form.locator("summary").click();
      for (const [key, d] of Object.entries(g.MATCH_DETAILS[path]))
        await form
          .locator(`[name="detail-${key}"]`)
          .selectOption(Object.keys(d.options).at(-1));
      await form
        .getByRole("button", { name: "Prepare performance plan" })
        .click();
      expect(
        (await saved(page)).profession.sports[path].tactics,
      ).not.toBeNull();
    }
    await page.getByRole("tab", { name: "Style", exact: true }).click();
    const kit = g.CAREER_KIT.find(
        (k) => k.path === path && k.price > 0 && !k.pro,
      ),
      money = (await saved(page)).money;
    await page
      .locator(`[data-action="profession-equip"][data-id="${kit.id}"]`)
      .click();
    expect((await saved(page)).money).toBe(money - kit.price);
    const celebration = g.CAREER_CELEBRATIONS[path][1];
    await page
      .locator('[data-form="career-celebration"] select')
      .selectOption(celebration.id);
    await page.getByRole("button", { name: "Set celebration" }).click();
    expect((await saved(page)).profession.style.celebrations[path]).toBe(
      celebration.id,
    );
    await expect(
      page.locator(".career-style-hero [data-model-key]"),
    ).toHaveCount(2);
    await page.reload();
    await tap(page, "Sport & development");
    await page.getByRole("tab", { name: "Style", exact: true }).click();
    await expect(
      page
        .locator(".career-style-hero")
        .getByRole("img", { name: kit.name, exact: true }),
    ).toBeVisible();
    expect((await saved(page)).profession.style.equipment[path]).toBe(kit.id);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  });
}
test("another sporting path is visibly locked until the player confirms leaving", async ({
  page,
}) => {
  await load(page, g.createGame({ age: 14, seed: 8, career: "racing" }));
  await tap(page, "Sport & development");
  await expect(page.getByRole("button", { name: /^Football/ })).toBeDisabled();
  await tap(page, "Music & creativity");
  await expect(page.locator("[data-career-commitment]")).toContainText(
    "Leave your Motorsport",
  );
  await page
    .getByRole("button", { name: "Leave this path", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Future entry still needs",
  );
  await page
    .getByRole("button", { name: "Confirm leaving current path" })
    .click();
  expect((await saved(page)).sports.racing.stage).toBe("retired");
  await page.getByRole("tab", { name: "Studio", exact: true }).click();
  await page.getByLabel("Music role").selectOption("producer");
  expect(g.activeCareerPath(await saved(page))).toBe("music");
  await tap(page, "Sport & development");
  await expect(page.locator("[data-career-commitment]")).toContainText(
    "Leave your Music",
  );
});
for (const track of ["medicine", "engineering", "hospitality"])
  test(`${track} has a role-specific supervised assignment`, async ({
    page,
  }) => {
    await load(page, employed(track));
    await tap(page, "Work & education");
    await page.getByRole("button", { name: "Take a work assignment" }).click();
    const form = page.locator('[data-form="work-assignment"]');
    const method = Object.keys(g.WORK_METHODS[track])[0];
    await form.locator("select").selectOption(method);
    await form.getByRole("button").click();
    const s = await saved(page);
    expect(s.profession.work.active.title).toBe(g.WORK_CASES[track].name);
    expect(s.profession.work.active.sessions).toBe(1);
    await expect(form.getByRole("button")).toBeDisabled();
    await tap(page, "Messages & decisions");
    await expect(page.locator(".inbox-list")).toContainText(
      g.WORK_CASES[track].name,
    );
  });
test("a singer, rapper and producer get different final studio review choices", async ({
  page,
}) => {
  for (const [role, method] of [
    ["singer", "comp"],
    ["rapper", "flow"],
    ["producer", "master"],
  ]) {
    let s = musician(role, 1);
    s = g.startPlannedRecording(s, { title: `Final ${role} take` });
    s = weeks(s, 5);
    if (role === "singer") await load(page, s);
    else {
      await page.evaluate(
        ({ key, s }) => localStorage.setItem(key, JSON.stringify(s)),
        { key: KEY, s },
      );
      await page.reload();
    }
    await tap(page, "Music & creativity");
    await page.getByRole("tab", { name: "Studio", exact: true }).click();
    const form = page.locator('[data-form="studio-review"]');
    await form.locator("select").selectOption(method);
    const before = (await saved(page)).money;
    await form.getByRole("button").click();
    expect((await saved(page)).money).toBe(
      before - g.STUDIO_REVIEWS[role][method].cost,
    );
    expect((await saved(page)).profession.music.studio[0].role).toBe(role);
  }
});
test("a creator can plan and publish a real episode from the Content menu", async ({
  page,
}) => {
  let s = g.createGame({ age: 23, seed: 8 });
  s.money = 100000;
  s = g.openSocialAccount(g.buy(s, "phone"), "lens");
  await load(page, s);
  await tap(page, "Social media & fame");
  await page.getByRole("tab", { name: "Content", exact: true }).click();
  const form = page.locator('[data-form="creator-series"]');
  await form.locator('[name="title"]').fill("My new chapter");
  await form.getByRole("button").click();
  await week(page);
  await page.getByRole("button", { name: "Produce next episode" }).click();
  expect(
    (await saved(page)).profession.creator.series[0].episodes,
  ).toHaveLength(1);
  await week(page);
  await expect(page.locator("[data-profession-series]")).toContainText(
    "published",
  );
  expect(
    (await saved(page)).profession.creator.series[0].episodes[0].views,
  ).toBeGreaterThan(0);
});
test("client work spends company cash and shows an actual accepted invoice", async ({
  page,
}) => {
  let s = g.createGame({ age: 23, seed: 8 });
  s.money = 100000;
  s.skills.business = 85;
  s = g.foundCompany(s, { name: "Harbour Works", sector: "Technology" });
  await load(page, s);
  await tap(page, "Start & run a company");
  await page.getByRole("tab", { name: "Clients", exact: true }).click();
  await page
    .locator('[data-action="profession-client-accept"][data-id="pilot"]')
    .click();
  for (let i = 0; i < 3; i++) {
    const before = (await saved(page)).company.cash;
    await page.getByRole("button", { name: "Deliver client work" }).click();
    expect((await saved(page)).company.cash).toBe(before - 120);
    if (i < 2) await week(page);
  }
  await expect(page.locator("[data-profession-clients]")).toContainText(
    "Invoice due",
  );
  await week(page);
  await week(page);
  expect((await saved(page)).profession.company.contracts[0].paid).toBe(650);
});
test("research and reserved limit orders live beside the existing investment market", async ({
  page,
}) => {
  const s = g.createGame({ age: 23, seed: 8 });
  s.money = 100000;
  await load(page, s);
  await tap(page, "Investments");
  await page.getByRole("tab", { name: "Research", exact: true }).click();
  await page
    .locator('[data-action="profession-research"][data-id="tech"]')
    .click();
  await expect(page.locator("[data-profession-research]")).toContainText(
    "simulated issuer profit",
  );
  await page.getByRole("tab", { name: "Orders", exact: true }).click();
  const form = page.locator('[data-form="limit-order"]');
  await form.locator('[name="limit"]').fill("150");
  await form.locator('[name="quantity"]').fill("2");
  await form.getByRole("button").click();
  let r = await saved(page);
  expect(g.availableCash(r)).toBe(r.money - 300);
  await week(page);
  r = await saved(page);
  expect(r.holdings.index).toBe(2);
  await expect(page.locator("[data-profession-orders]")).toContainText(
    "filled",
  );
});
test("Pro kit is gated while ordinary kit stays available", async ({
  page,
}) => {
  await load(page, professional("football"));
  await tap(page, "Sport & development");
  await page.getByRole("tab", { name: "Style", exact: true }).click();
  const premium = g.CAREER_KIT.find((k) => k.path === "football" && k.pro);
  await expect(
    page.locator(`[data-action="profession-equip"][data-id="${premium.id}"]`),
  ).toBeDisabled();
  await page
    .locator('[data-action="profession-equip"][data-id="football-classic"]')
    .click();
  expect((await saved(page)).profession.style.equipment.football).toBe(
    "football-classic",
  );
});
test("a real v15 save gets an exact downloadable backup", async ({ page }) => {
  const old = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v15-save.json", import.meta.url)),
  );
  await load(page, old);
  expect((await saved(page)).version).toBe(g.VERSION);
  await tap(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export pre-update save" }).click();
  const file = await pending;
  expect(JSON.parse(fs.readFileSync(await file.path(), "utf8"))).toEqual(old);
});

test("God mode exposes the new career-specific sporting skills", async ({
  page,
}) => {
  await load(page, g.toggleDebug(professional("football"), true));
  await tap(page, "Save & settings");
  await page.getByRole("button", { name: "Open debug controls" }).click();
  await page.getByRole("tab", { name: "Skills", exact: true }).click();
  const group = page
    .locator(".god-skill-groups details")
    .filter({ has: page.locator("summary", { hasText: "Football" }) });
  await group.locator("summary").click();
  await group.locator('[name="football.finishing"]').fill("35");
  await group.locator('[name="football.passing"]').fill("90");
  await group
    .getByRole("button", { name: "Save football", exact: true })
    .click();
  const s = await saved(page);
  expect(s.profession.sports.football.skills.finishing).toBe(35);
  expect(s.profession.sports.football.skills.passing).toBe(90);
});
