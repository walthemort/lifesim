import { test, expect } from "@playwright/test";
import * as g from "../../src/engine.js";
import { musician, professional } from "../career-world-fixtures.js";
import { tap } from "./mobile-helpers.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, s = g.createGame({ age: 18, seed: 8 })) {
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

test("an ordinary new life can choose its starting year and keeps the calendar after reopening", async ({
  page,
}) => {
  await load(page);
  await page.getByRole("button", { name: "View your character" }).click();
  await page
    .getByRole("button", { name: "Create a new character", exact: true })
    .click();
  await page.getByLabel("Starting year").fill("1996");
  await page
    .getByRole("button", { name: "Begin random life", exact: true })
    .click();
  expect((await saved(page)).startingYear).toBe(1996);
  expect((await saved(page)).startAge).toBe(0);
  await expect(page.locator(".game-date")).toContainText("5 Jan 1996");
  await page.reload();
  await expect(page.locator(".game-date")).toContainText("1996");
});

test("the creator previews seven friendly age stages without changing the starting age", async ({
  page,
}) => {
  const s = g.setProPreview(
    g.toggleDebug(g.createGame({ age: 18, seed: 8 }), true),
    true,
  );
  await load(page, g.toggleDebug(s, false));
  await tap(page, "Save & settings");
  await page.getByRole("button", { name: "Open character creator" }).click();
  for (const [value, stage] of [
    ["0", "baby"],
    ["2", "infant"],
    ["9", "child"],
    ["16", "teen"],
    ["24", "young-adult"],
    ["42", "adult"],
    ["70", "older-adult"],
  ]) {
    await page.getByLabel("Preview age").selectOption(value);
    await expect(
      page.locator("#character-form .character-portrait"),
    ).toHaveAttribute("data-age-stage", stage);
  }
  await page.getByLabel("Starting year").fill("1989");
  await page.getByRole("button", { name: "Begin my story" }).click();
  expect((await saved(page)).startAge).toBe(0);
  expect((await saved(page)).startingYear).toBe(1989);
});

test("company validation appears inside the open dialog, above its content", async ({
  page,
}) => {
  const s = g.createGame({ age: 18, seed: 1 });
  s.money = 5000;
  s.skills.business = 40;
  await load(page, s);
  await tap(page, "Start & run a company");
  await page.locator('[data-action="found-company"]').click();
  const form = page.locator("#found-company-form");
  await form.locator('[name="name"]').fill("My first company");
  await form.locator('[name="sector"]').selectOption("Game studio");
  await form.getByRole("button").click();
  const alert = page.getByRole("dialog").getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("startup capital");
  const a = await alert.boundingBox(),
    d = await page.getByRole("dialog").boundingBox();
  expect(a.y).toBeGreaterThanOrEqual(d.y);
  expect(a.y + a.height).toBeLessThanOrEqual(d.y + d.height);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await saved(page)).company).toBeNull();
});

for (const width of [320, 390, 430])
  test(`music workspace has focused panes and no sideways page movement at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await load(page, musician("producer", 3));
    await tap(page, "Music & creativity");
    await expect(
      page.getByRole("tab", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("button", { name: "Create a track", exact: true }),
    ).toBeHidden();
    for (const tab of [
      "Studio",
      "Catalogue",
      "Promote",
      "Live",
      "Team",
      "Overview",
    ]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(
        page.getByRole("tabpanel", { name: tab, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await expect(page.locator("main footer")).toHaveCount(1);
    const order = await page.evaluate(() => {
      const main = document.querySelector("main");
      return main.lastElementChild.tagName;
    });
    expect(order).toBe("FOOTER");
    expect(errors).toEqual([]);
  });

test("a musician can promote an actual unreleased recording with a funded rollout", async ({
  page,
}) => {
  let s = musician("producer", 1);
  s = g.startPlannedRecording(s, { title: "Under the lights", budget: "lean" });
  const before = s.money;
  await load(page, s);
  await tap(page, "Music & creativity");
  await page.getByRole("tab", { name: "Promote", exact: true }).click();
  await page
    .locator('#music-rollout-form [name="kind"]')
    .selectOption("focused");
  await page
    .getByRole("button", { name: "Plan pre-release promotion" })
    .click();
  expect((await saved(page)).money).toBe(before - 150);
  await week(page);
  await expect(page.locator("[data-music-promotion]")).toContainText(
    "Under the lights",
  );
  expect(
    (await saved(page)).experience.music.campaigns[0].preSaves,
  ).toBeGreaterThan(0);
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await expect(page.locator(".stream-chart")).toBeVisible();
  await expect(page.locator("[data-music-chart] .song-row")).toHaveCount(20);
});

test("a famous player can hire a social manager and gain public followers without a manual post", async ({
  page,
}) => {
  let s = professional("racing");
  s = g.buy(s, "phone");
  s = g.openSocialAccount(s, "lens");
  s.fame.recognition = 85;
  await load(page, s);
  await tap(page, "Social media & fame");
  await page.getByRole("tab", { name: "Team", exact: true }).click();
  await page
    .getByRole("button", { name: "Hire social assistant", exact: true })
    .click();
  expect((await saved(page)).experience.manager.id).toBe("assistant");
  await week(page);
  const result = await saved(page);
  expect(result.experience.growth).toBeGreaterThan(0);
  expect(result.social.posts.some((p) => p.managed)).toBe(true);
  await expect(page.locator("[data-social-management]")).toContainText(
    "post queued",
  );
  await page.getByRole("tab", { name: "Accounts", exact: true }).click();
  await expect(page.locator('[data-platform="lens"]')).toContainText(
    "Followers",
  );
  expect(await page.locator("[data-depth-contracts]").count()).toBe(1);
});

test("football has one active sport, six clear menus and one-button club approaches", async ({
  page,
}) => {
  await load(page, professional("football"));
  await tap(page, "Sport & development");
  await expect(page.locator(".sport-section")).toHaveCount(1);
  const tabs = page.getByRole("tablist", { name: "sports workspace" });
  expect(await tabs.getByRole("tab").allTextContents()).toEqual([
    "Matchday",
    "Development",
    "Standings",
    "Team",
    "Contract",
    "Style",
  ]);
  await tabs.getByRole("tab", { name: "Contract", exact: true }).click();
  await expect(page.locator("#sport-move-form")).toHaveCount(0);
  const approach = page
    .locator(
      '[data-football-market] button[data-action="football-approach"]:enabled',
    )
    .first();
  await approach.click();
  const s = await saved(page);
  expect(s.careerWorld.sports.football.requests.at(-1).status).toBe("pending");
  expect(s.football.contract).not.toBeNull();
  await expect(page.locator("[data-football-market]")).toContainText("pending");
});

test("a fully developed youth player can choose between leading academies while staying at school", async ({
  page,
}) => {
  let s = g.createGame({ age: 12, seed: 1, career: "football" });
  s = g.toggleDebug(s, true);
  s = g.debugEdit(s, {
    skills: { athletics: 100 },
    specialistSkills: {
      "football.ability": 100,
      "football.discipline": 100,
      "football.coachTrust": 100,
      "football.reputation": 100,
    },
  });
  await load(page, s);
  await tap(page, "Sport & development");
  await page.getByRole("tab", { name: "Development", exact: true }).click();
  await page.getByRole("button", { name: "Arrange youth assessment" }).click();
  await week(page);
  await week(page);
  expect(
    (await saved(page)).football.offers.filter(
      (o) => o.kind === "academy" && o.status === "offered",
    ),
  ).toHaveLength(3);
  await page.getByRole("button", { name: "Review invitation" }).first().click();
  await page
    .getByRole("button", { name: "Accept invitation", exact: true })
    .click();
  const result = await saved(page);
  expect(result.football.stage).toBe("academy");
  expect(result.school.enrolled).toBe(true);
  expect(result.employment).toBeNull();
});

test("ordinary football contracts have a single invitation in the Contract menu", async ({
  page,
}) => {
  const s = professional("football");
  s.football.offers.push({
    id: "natural-next-club",
    kind: "contract",
    club: "Harbour United",
    jobId: "football-1",
    pay: 450,
    duration: 104,
    status: "offered",
    expiresWeek: 4,
  });
  await load(page, s);
  await tap(page, "Sport & development");
  await page.getByRole("tab", { name: "Contract", exact: true }).click();
  const review = page.locator(
    '[data-action="sport-offer"][data-id="natural-next-club"]',
  );
  await expect(review).toHaveCount(1);
  await expect(review).toBeVisible();
  await review.click();
  await expect(page.getByRole("dialog")).toContainText("Harbour United");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .locator('[data-action="decline-sport"][data-id="natural-next-club"]')
    .click();
  expect(
    (await saved(page)).football.offers.find(
      (o) => o.id === "natural-next-club",
    ).status,
  ).toBe("declined");
});

test("God mode provides persistent always-full switches, direct cash and grouped music skills", async ({
  page,
}) => {
  await load(page, g.toggleDebug(g.createGame({ age: 18, seed: 8 }), true));
  await tap(page, "Save & settings");
  await page.getByRole("button", { name: "Open debug controls" }).click();
  await expect(
    page.getByRole("heading", { name: "God mode.", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep all three full" }).click();
  for (const key of ["health", "energy", "happiness"])
    await expect(
      page.getByRole("switch", { name: `Always full ${key}` }),
    ).toHaveAttribute("aria-checked", "true");
  await page.locator('#god-money-form [name="money"]').fill("1000000");
  await page.getByRole("button", { name: "Set cash balance" }).click();
  expect((await saved(page)).money).toBe(1000000);
  await week(page);
  const state = await saved(page);
  for (const key of ["health", "energy", "happiness"])
    expect(state[key]).toBe(100);
  await page.getByRole("tab", { name: "Skills", exact: true }).click();
  await page
    .locator(".god-skill-groups details")
    .filter({ has: page.locator("summary", { hasText: "Music" }) })
    .locator("summary")
    .click();
  const form = page.locator("#god-skills-form-music");
  await form.locator('[name="music.production"]').fill("95");
  await form.getByRole("button", { name: "Save music", exact: true }).click();
  expect((await saved(page)).music.skills.production).toBe(95);
  await page.reload();
  await tap(page, "Save & settings");
  await page.getByRole("button", { name: "Open debug controls" }).click();
  await expect(
    page.getByRole("switch", { name: "Always full energy" }),
  ).toHaveAttribute("aria-checked", "true");
  expect((await saved(page)).debug.used).toBe(true);
  expect(
    await page
      .locator('option[value="specialist:social.contentSkill"]')
      .count(),
  ).toBe(0);
});

test("World groups and search make activities easy to find, and tab navigation works from the keyboard", async ({
  page,
}) => {
  await load(page, musician("producer", 1));
  await page.getByRole("button", { name: "Activities tab" }).click();
  await expect(
    page.getByRole("heading", { name: "What will you work on?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "World tab" }).click();
  await expect(page.locator(".world-group")).toHaveCount(5);
  await page.getByLabel("Find an activity").fill("music");
  await expect(page.locator(".world-library .world-card:visible")).toHaveCount(
    1,
  );
  await page
    .getByRole("button", { name: "Music & creativity", exact: true })
    .click();
  const overview = page.getByRole("tab", { name: "Overview", exact: true });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Studio", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("tabpanel", { name: "Studio", exact: true }),
  ).toBeVisible();
});
