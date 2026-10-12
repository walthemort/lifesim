import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1";
async function load(page, state = g.createGame({ seed: 1 })) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
const nav = (page, name) =>
  page.getByRole("button", { name, exact: true }).click();
function musician() {
  let s = g.buy(
    g.createGame({ seed: 1, age: 23, career: "music" }),
    "microphone",
  );
  s.music.sessions = 52;
  s.music.skills.vocals = 60;
  s = g.startMusicProject(s, { title: "First song" });
  for (let i = 0; i < 4; i++) {
    if (s.event) s = g.resolveEvent(s, 0);
    s = g.advanceWeek(s);
  }
  if (s.event) s = g.resolveEvent(s, 0);
  s.music.fans = 20;
  return s;
}

test("birth dashboard, supervised choices and birthday events persist", async ({
  page,
}) => {
  await load(page);
  await expect(page.getByRole("heading", { name: "Infancy" })).toBeVisible();
  await page
    .locator('[data-action="childhood-activity"][data-id="play"]')
    .click();
  expect((await saved(page)).childhood.development.movement).toBe(6);
  await nav(page, "Age up");
  await expect(page.getByRole("dialog")).toContainText("A world to explore.");
  expect((await saved(page)).week).toBe(52);
  await page.locator(".event-option").first().click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Toddler years" }),
  ).toBeVisible();
  expect((await saved(page)).childhood.choices).toHaveLength(1);
});
test("young children have age-appropriate sleep and locked independent screens", async ({
  page,
}) => {
  await load(page);
  await nav(page, "Weekly calendar");
  await expect(page.getByLabel("Sleep per night")).toHaveValue("14");
  for (const name of [
    "Work & education",
    "Music & creativity",
    "Investments",
    "Family & pets",
  ]) {
    await nav(page, name);
    await expect(
      page.getByRole("heading", { name: "Your early years." }),
    ).toBeVisible();
    expect(
      await page.locator('[data-action="apply-job"]:enabled').count(),
    ).toBe(0);
  }
});
test("music studio equipment can be bought from career and music screens", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 23, career: "music" });
  await load(page, s);
  await nav(page, "Work & education");
  await page.locator('[data-equipment="laptop"] button').click();
  await nav(page, "Music & creativity");
  for (const id of ["audio-interface", "studio-monitors", "treated-studio"])
    await page.locator(`[data-equipment="${id}"] button`).click();
  const after = await saved(page);
  expect(after.money).toBe(
    s.money - g.SHOP.find((i) => i.id === "laptop").price - 350 - 650 - 2500,
  );
  expect(after.inventory).toContain("treated-studio");
  await expect(
    page.locator('[data-equipment="treated-studio"] button'),
  ).toHaveText("Owned");
  await expect(
    page.locator('[data-equipment="professional-studio"] button'),
  ).toBeDisabled();
  await page.reload();
  await nav(page, "Work & education");
  await expect(
    page.locator('[data-equipment="audio-interface"] button'),
  ).toHaveText("Owned");
});
test("debug exposes and persists music, football, racing and creator skills", async ({
  page,
}) => {
  await load(page, g.createGame({ seed: 1, age: 23, career: "music" }));
  await nav(page, "Save & settings");
  await nav(page, "Enable debug mode");
  for (const [id, value] of [
    ["music.production", "84.5"],
    ["music.vocals", "71"],
    ["music.lyrics", "62"],
    ["football.ability", "77"],
    ["racing.ability", "83"],
    ["social.contentSkill", "90"],
  ]) {
    await page.getByLabel("Skill to edit").selectOption(`specialist:${id}`);
    await page.getByLabel("Skill value").fill(value);
    await nav(page, "Apply skill");
  }
  await page.reload();
  const s = await saved(page);
  expect(s.music.skills).toEqual({ production: 84.5, vocals: 71, lyrics: 62 });
  expect(s.football.ability).toBe(77);
  expect(s.sports.racing.ability).toBe(83);
  expect(s.social.contentSkill).toBe(90);
  expect(s.week).toBe(0);
  await nav(page, "Music & creativity");
  await expect(page.locator("main")).toContainText("85 / 100");
});
test("musicians hire a manager, promote releases and improve their craft in the career screen", async ({
  page,
}) => {
  const s = musician();
  await load(page, s);
  await nav(page, "Work & education");
  await page
    .locator('[data-action="hire-music-manager"][data-id="local"]')
    .click();
  await expect(page.locator('[data-career-support="music"]')).toContainText(
    "First Track Management",
  );
  await page
    .locator('[data-action="career-activity"][data-id="campaign"]')
    .click();
  await page
    .locator('[data-action="career-activity"][data-id="songwriting"]')
    .click();
  const after = await saved(page);
  expect(after.money).toBe(s.money - 200);
  expect(after.music.skills.lyrics).toBe(s.music.skills.lyrics + 0.8);
  await nav(page, "Music & creativity");
  await expect(
    page.locator('[data-action="career-activity"][data-id="campaign"]'),
  ).toBeDisabled();
  await nav(page, "End management agreement");
  expect((await saved(page)).careerSupport.music.manager).toBeNull();
});
test("footballers can use their agent for club outreach and analyse match footage", async ({
  page,
}) => {
  let s = g.joinFootball(g.createGame({ seed: 1, age: 23 }));
  s.football.reputation = 15;
  s = g.hireAgent(s, "football", "development");
  s = g.advanceWeek(s);
  await load(page, s);
  await nav(page, "Sport & development");
  await page
    .locator('[data-action="career-activity"][data-id="club-outreach"]')
    .click();
  await page
    .locator('[data-action="career-activity"][data-id="match-analysis"]')
    .click();
  const after = await saved(page);
  expect(after.football.nextScoutWeek).toBe(s.week + 1);
  expect(after.football.ability).toBe(s.football.ability + 0.5);
  expect(after.employment).toBeNull();
});
test("music interviews are booked separately and resolve on the next week", async ({
  page,
}) => {
  let s = g.hireMusicManager(musician(), "local");
  for (let i = 0; !s.careerSupport.music.press.length && i < 30; i++) {
    s.careerSupport.music.nextPressWeek = s.week;
    g.advanceCareerSupport(s);
  }
  s.energy = 100;
  s.skills.charisma = 100;
  await load(page, s);
  await nav(page, "Music & creativity");
  await page.locator('[data-action="music-interview"]').click();
  expect((await saved(page)).careerSupport.music.press[0].status).toBe(
    "booked",
  );
  await nav(page, "Next week");
  const after = await saved(page);
  expect(["completed", "missed"]).toContain(
    after.careerSupport.music.press[0].status,
  );
  expect(after.week).toBe(s.week + 1);
  await page.reload();
  expect((await saved(page)).careerSupport.music.press[0].status).toBe(
    after.careerSupport.music.press[0].status,
  );
});
test("authentic v6 migration keeps old lives and downloads an exact backup", async ({
  page,
}) => {
  const raw = JSON.parse(
    fs.readFileSync(new URL("../fixtures/v6-save.json", import.meta.url)),
  );
  await load(page, raw);
  const s = await saved(page);
  expect(s.version).toBe(g.VERSION);
  expect(s.startAge).toBe(raw.startAge);
  expect(s.banking).toEqual(raw.banking);
  expect(s.family).toEqual(raw.family);
  expect(s.childhood.startedAtBirth).toBe(false);
  await nav(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await nav(page, "Export pre-update save");
  const dl = await pending;
  expect(dl.suggestedFilename()).toBe("lifesim-before-v8.json");
  expect(JSON.parse(fs.readFileSync(await dl.path()))).toEqual(raw);
});
test("birth and expanded career panels fit phones without browser errors", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await load(page);
  for (const name of ["Overview", "Childhood & school", "Weekly calendar"]) {
    await nav(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.evaluate(
    ({ key, s }) => localStorage.setItem(key, JSON.stringify(s)),
    { key: KEY, s: musician() },
  );
  await page.reload();
  for (const name of [
    "Work & education",
    "Music & creativity",
    "Sport & development",
  ]) {
    await nav(page, name);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
