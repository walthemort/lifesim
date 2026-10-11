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
async function week(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return g.advanceWeek(s);
}
function creator() {
  let s = g.buy(g.createGame({ seed: 1 }), "phone");
  s = g.openSocialAccount(s, "lens");
  return s;
}

test("a new football life starts at school age with local participation and no professional application", async ({
  page,
}) => {
  await load(page);
  await page
    .getByRole("button", { name: "Your character", exact: true })
    .click();
  await page.getByRole("button", { name: "Create a new character" }).click();
  await page.getByLabel("Life path / interest").selectOption("football");
  await expect(page.getByLabel("Starting age")).toHaveValue("14");
  await page.getByRole("button", { name: "Begin my story" }).click();
  await expect(
    page.getByRole("heading", { name: "School student" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sport & development", exact: true })
    .click();
  await expect(page.locator('[data-sport-card="football"]')).toContainText(
    "School football team",
  );
  await page.getByLabel("Football training").selectOption("technical");
  const before = await saved(page);
  await week(page);
  const after = await saved(page);
  expect(after.football.ability).toBeGreaterThan(before.football.ability);
  expect(after.football.matches).toBe(1);
  expect(after.employment).toBeNull();
  expect(after.money).toBe(505);
  await page
    .getByRole("button", { name: "Work & education", exact: true })
    .click();
  expect(
    await page
      .locator('[data-action="apply-job"][data-id^="football"]')
      .count(),
  ).toBe(0);
  await expect(
    page.locator('[data-action="apply-job"]').first(),
  ).toBeDisabled();
});
test("an academy trial takes two weeks, then a separate invitation must be accepted", async ({
  page,
}) => {
  let initial;
  for (let seed = 1; seed < 80; seed++) {
    const s = g.createGame({ seed, age: 16, career: "football" });
    s.football.ability = 70;
    s.football.offers = [
      {
        id: "trial:test",
        kind: "academy-trial",
        club: "Harbor Athletic academy",
        jobId: null,
        pay: 0,
        duration: 104,
        status: "offered",
        expiresWeek: 4,
      },
    ];
    let trial = g.acceptFootballOffer(s, "trial:test");
    trial = next(next(trial));
    if (
      trial.football.offers.some(
        (o) => o.kind === "academy" && o.status === "offered",
      )
    ) {
      initial = s;
      break;
    }
  }
  expect(initial).toBeTruthy();
  await load(page, initial);
  await page
    .getByRole("button", { name: "Sport & development", exact: true })
    .click();
  await page.getByRole("button", { name: "Review invitation" }).click();
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page.locator('[data-sport-card="football"]')).toContainText(
    "decision in 2 weeks",
  );
  await week(page);
  await week(page);
  await page.getByRole("button", { name: "Review invitation" }).click();
  await page.getByRole("button", { name: "Accept invitation" }).click();
  const s = await saved(page);
  expect(s.football.stage).toBe("academy");
  expect(s.employment).toBeNull();
  expect(s.school.enrolled).toBe(true);
});
test("karting development produces an offered Formula 4 seat only after licensing and development", async ({
  page,
}) => {
  let initial;
  for (let seed = 1; seed < 80; seed++) {
    const s = g.createGame({ seed, age: 16, career: "racing" });
    s.money = 10000; // Fund the junior seat as well as the competition licence.
    s.sports.racing.stage = "academy";
    s.sports.racing.club = "Apex driver development";
    s.sports.racing.experience = 104;
    s.sports.racing.ability = 75;
    s.sports.racing.nextScoutWeek = 1;
    s.skills.driving = 75;
    s.education.completed = ["racing-license"];
    const r = next(s);
    if (r.sports.racing.offers.some((o) => o.kind === "contract")) {
      initial = s;
      break;
    }
  }
  expect(initial).toBeTruthy();
  await load(page, initial);
  await page
    .getByRole("button", { name: "Sport & development", exact: true })
    .click();
  await expect(page.locator('[data-sport-card="racing"]')).toContainText(
    "Local karting",
  );
  await week(page);
  await page
    .locator('[data-sport-card="racing"]')
    .getByRole("button", { name: "Review invitation" })
    .click();
  await page.getByRole("button", { name: "Accept invitation" }).click();
  const s = await saved(page);
  expect(s.employment.jobId).toBe("racing-1");
  expect(s.sports.racing.stage).toBe("junior");
  expect(s.sports.racing.contract.expiresWeek).toBe(105);
});
test("shopping filters find equipment and publishing content produces delayed audience results", async ({
  page,
}) => {
  await load(page);
  await page
    .getByRole("button", { name: "Lifestyle & shopping", exact: true })
    .click();
  await page.getByLabel("Shopping category").selectOption("Essentials");
  await page.getByLabel("Search shopping").fill("smartphone");
  await expect(page.locator(".shop-card")).toHaveCount(2);
  await page.locator('[data-action="buy"][data-id="phone"]').click();
  await page.getByLabel("Show owned possessions only").check();
  await expect(page.locator(".shop-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Social media & fame", exact: true })
    .click();
  await page.locator('[data-action="open-account"][data-id="lens"]').click();
  await page.locator('[data-action="post"][data-id="lens"]').click();
  await page.getByLabel("Content approach").selectOption("polished");
  await page.getByRole("button", { name: "Publish content" }).click();
  expect((await saved(page)).social.posts[0].status).toBe("pending");
  await week(page);
  let s = await saved(page);
  expect(s.social.posts[0].status).toBe("resolved");
  expect(s.social.posts[0].views).toBeGreaterThan(0);
  expect(s.social.weeklyIncome).toBe(0);
  await expect(page.locator("main")).toContainText("ViewTube");
  await expect(page.locator("main")).toContainText("Streamroom");
  await page.reload();
  expect((await saved(page)).social.posts[0].status).toBe("resolved");
});
test("creator sponsorship pays after a labelled post is delivered rather than on acceptance", async ({
  page,
}) => {
  const initial = creator();
  initial.social.contentSkill = 80;
  initial.social.offers = [
    {
      id: "sponsor:test",
      platform: "lens",
      brand: "Northline Audio",
      fee: 500,
      status: "offered",
      expiresWeek: 4,
    },
  ];
  await load(page, initial);
  await page
    .getByRole("button", { name: "Social media & fame", exact: true })
    .click();
  await page.getByRole("button", { name: "Review collaboration" }).click();
  await page.getByRole("button", { name: "Accept collaboration" }).click();
  expect((await saved(page)).money).toBe(initial.money);
  await page.getByRole("button", { name: "Create sponsored post" }).click();
  await page.getByLabel("Content approach").selectOption("polished");
  await page.getByRole("button", { name: "Publish content" }).click();
  await week(page);
  const s = await saved(page);
  expect(s.social.deals[0].status).toBe("completed");
  expect(s.social.weeklyIncome).toBe(500);
  await expect(page.locator("main")).toContainText("$500.00");
});
test("a rapper practises, records, and releases a track over four weeks", async ({
  page,
}) => {
  await load(page, g.buy(g.createGame({ seed: 1, career: "music" }), "phone"));
  await page
    .getByRole("button", { name: "Music & creativity", exact: true })
    .click();
  await page.getByLabel("Music role").selectOption("rapper");
  await page.getByLabel("Music genre").selectOption("Hip-hop");
  await expect(
    page.getByRole("button", { name: "Record a release" }),
  ).toBeDisabled();
  while ((await saved(page)).music.sessions < 8) {
    if (!(await saved(page)).actions) await week(page);
    await page.getByRole("button", { name: "Practise your craft" }).click();
  }
  await page.getByRole("button", { name: "Record a release" }).click();
  await page.getByLabel("Release title").fill("First chorus");
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.locator("main")).toContainText("releases in 4 weeks");
  expect((await saved(page)).music.releases).toHaveLength(0);
  for (let i = 0; i < 4; i++) await week(page);
  const s = await saved(page);
  expect(s.music.releases[0].title).toBe("First chorus");
  expect(s.music.releases[0].role).toBe("rapper");
  expect(s.music.releases[0].totalStreams).toBeGreaterThan(0);
  expect(s.music.totalIncome).toBeGreaterThan(0);
  await page.reload();
  await page
    .getByRole("button", { name: "Music & creativity", exact: true })
    .click();
  await expect(page.locator("main")).toContainText("First chorus");
});
test("repeatable experiences spend cash and an action then enforce their cooldown", async ({
  page,
}) => {
  const initial = g.createGame({ seed: 1 });
  await load(page, initial);
  await page
    .getByRole("button", { name: "Lifestyle & shopping", exact: true })
    .click();
  await page.locator('[data-action="experience"][data-id="dinner"]').click();
  await page.getByRole("button", { name: "Confirm experience" }).click();
  const s = await saved(page);
  expect(s.money).toBe(initial.money - 45);
  expect(s.actions).toBe(2);
  expect(s.relationships[0].bond).toBe(initial.relationships[0].bond + 3);
  await expect(
    page.locator('[data-action="experience"][data-id="dinner"]'),
  ).toBeDisabled();
  await week(page);
  await expect(
    page.locator('[data-action="experience"][data-id="dinner"]'),
  ).toBeEnabled();
});
test("existing professional players retain their wages and can export a pre-upgrade backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v2-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const s = await saved(page);
  expect(s.version).toBe(g.VERSION);
  expect(s.employment.weeklyPay).toBe(3700);
  expect(s.football.stage).toBe("professional");
  await page
    .getByRole("button", { name: "Work & education", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Discuss a raise" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save & settings" }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export pre-update save" }).click();
  expect((await pending).suggestedFilename()).toBe("lifesim-before-v6.json");
});
test("sport, music, social, and shopping screens fit a phone with established careers and large audiences", async ({
  page,
}) => {
  const s = creator();
  s.social.profiles.lens.followers = 9000000;
  s.fame.recognition = 95;
  s.music.fans = 1000000;
  s.money = 100000000;
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, s);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const name of [
    "Sport & development",
    "Music & creativity",
    "Social media & fame",
    "Lifestyle & shopping",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    expect(sizes.scroll, name).toBeLessThanOrEqual(sizes.width);
  }
  expect(errors).toEqual([]);
});
