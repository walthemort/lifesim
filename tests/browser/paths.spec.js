import { tap, interact, reveal } from "./mobile-helpers.js";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1";
async function load(
  page,
  state = g.createGame({ seed: 1, age: 18, career: "office" }),
) {
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
  await interact(
    page,
    page.getByRole("button", {
      name: /^(Next week|Make a choice)$/,
      includeHidden: true,
    }),
    "click",
  );
  if (await page.getByRole("dialog").isVisible())
    await interact(page, page.locator(".event-option").last(), "click");
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return g.advanceWeek(s);
}
function creator() {
  let s = g.buy(g.createGame({ seed: 1, age: 18, career: "office" }), "phone");
  s = g.openSocialAccount(s, "lens");
  return s;
}

test("football starts through school after growing up from birth", async ({
  page,
}) => {
  let s = g.createGame({ seed: 1, career: "football" });
  expect(s.football.stage).toBe("none");
  for (let i = 0; i < 5; i++) {
    if (s.event) s = g.resolveEvent(s, 0);
    s = g.ageUp(s);
  }
  if (s.event) s = g.resolveEvent(s, 0);
  await load(page, s);
  await tap(page, "Sport & development");
  await expect(page.locator('[data-sport-card="football"]')).toContainText(
    "School football team",
  );
  await interact(
    page,
    page.getByLabel("Football training"),
    "selectOption",
    "technical",
  );
  const before = await saved(page);
  await week(page);
  const after = await saved(page);
  expect(after.football.ability).toBeGreaterThan(before.football.ability);
  expect(after.employment).toBeNull();
  expect(after.money).toBe(0);
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
  await tap(page, "Sport & development");
  await interact(
    page,
    page.getByRole("button", {
      name: "Review invitation",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Accept invitation",
      includeHidden: true,
    }),
    "click",
  );
  await expect(page.locator('[data-sport-card="football"]')).toContainText(
    "decision in 2 weeks",
  );
  await week(page);
  await week(page);
  await interact(
    page,
    page.getByRole("button", {
      name: "Review invitation",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Accept invitation",
      includeHidden: true,
    }),
    "click",
  );
  const s = await saved(page);
  expect(s.football.stage).toBe("academy");
  expect(s.employment).toBeNull();
  expect(s.school.enrolled).toBe(true);
});
test("a Formula 4 seat follows a complete top-tier karting championship and licensing", async ({
  page,
}) => {
  let initial;
  for (let seed = 1; seed < 10; seed++) {
    let s = g.createGame({ seed, age: 16, career: "racing" });
    s.money = 100000;
    s.globalLife.racing.tier = "kart1";
    s.sports.racing.club = "Junior Karting Series 1";
    s.sports.racing.ability = 95;
    s.sports.racing.discipline = 95;
    s.skills.driving = 95;
    s.education.completed = ["racing-license"];
    for (let i = 0; i < 45; i++) s = next(s);
    if (
      g
        .advanceWeek(
          s.event ? g.resolveEvent(s, s.event.options.length - 1) : s,
        )
        .sports.racing.offers.some((o) => o.id.startsWith("racing:ladder:"))
    ) {
      initial = s;
      break;
    }
  }
  expect(initial).toBeTruthy();
  await load(page, initial);
  await tap(page, "Sport & development");
  await week(page);
  await interact(
    page,
    page
      .locator('[data-sport-card="racing"]')
      .getByRole("button", { name: "Review invitation", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Accept invitation",
      includeHidden: true,
    }),
    "click",
  );
  const s = await saved(page);
  expect(s.employment.jobId).toBe("racing-1");
  expect(s.sports.racing.stage).toBe("junior");
  expect(s.sports.racing.contract.expiresWeek).toBe(s.week + 104);
  expect(s.globalLife.racing.history.at(-1).starts).toBeGreaterThanOrEqual(12);
});

test("shopping filters find equipment and publishing content produces delayed audience results", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Lifestyle & shopping");
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Electronics"]'),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Shopping category"),
    "selectOption",
    "Essentials",
  );
  await interact(
    page,
    page.getByLabel("Search shopping"),
    "fill",
    "smartphone",
  );
  await expect(page.locator(".shop-card")).toHaveCount(2);
  await interact(
    page,
    page.locator('[data-action="buy"][data-id="phone"]'),
    "click",
  );
  await interact(page, page.getByLabel("Show owned possessions only"), "check");
  await expect(page.locator(".shop-card")).toHaveCount(1);
  await tap(page, "Social media & fame");
  await interact(
    page,
    page.locator('[data-action="open-account"][data-id="lens"]'),
    "click",
  );
  await interact(
    page,
    page.locator('[data-action="post"][data-id="lens"]'),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Content approach"),
    "selectOption",
    "polished",
  );
  await interact(
    page,
    page.getByRole("button", { name: "Publish content", includeHidden: true }),
    "click",
  );
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
  await tap(page, "Social media & fame");
  await interact(
    page,
    page.getByRole("button", {
      name: "Review collaboration",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Accept collaboration",
      includeHidden: true,
    }),
    "click",
  );
  expect((await saved(page)).money).toBe(initial.money);
  await interact(
    page,
    page.getByRole("button", {
      name: "Create sponsored post",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Content approach"),
    "selectOption",
    "polished",
  );
  await interact(
    page,
    page.getByRole("button", { name: "Publish content", includeHidden: true }),
    "click",
  );
  await week(page);
  const s = await saved(page);
  expect(s.social.deals[0].status).toBe("completed");
  expect(s.social.weeklyIncome).toBe(500);
  await expect(page.locator("main")).toContainText("$500.00");
});
test("a rapper practises, records, and releases a track over four weeks", async ({
  page,
}) => {
  await load(
    page,
    g.buy(g.createGame({ seed: 1, age: 18, career: "music" }), "phone"),
  );
  await tap(page, "Music & creativity");
  await interact(page, page.getByLabel("Music role"), "selectOption", "rapper");
  await interact(
    page,
    page.getByLabel("Music genre"),
    "selectOption",
    "Hip-hop",
  );
  await expect(
    page.getByRole("button", {
      name: "Open track workshop",
      includeHidden: true,
    }),
  ).toHaveCount(0);
  while ((await saved(page)).music.sessions < 8) {
    if (!(await saved(page)).actions) await week(page);
    await interact(
      page,
      page.getByRole("button", {
        name: "Practise your craft",
        includeHidden: true,
      }),
      "click",
    );
  }
  await interact(
    page,
    page.getByRole("button", {
      name: "Create a track",
      includeHidden: true,
    }),
    "click",
  );
  await interact(page, page.getByLabel("Track title"), "fill", "First chorus");
  await interact(page, page.getByLabel("Beat source"), "selectOption", "lease");
  await interact(
    page,
    page.getByLabel("Production ambition"),
    "selectOption",
    "lean",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Start track workshop",
      includeHidden: true,
    }),
    "click",
  );
  if (!(await saved(page)).actions) await week(page);
  await interact(
    page,
    page.getByRole("button", {
      name: "Write & revise lyrics",
      includeHidden: true,
    }),
    "click",
  );
  if (!(await saved(page)).actions) await week(page);
  await interact(
    page,
    page.getByRole("button", {
      name: "Record performance",
      includeHidden: true,
    }),
    "click",
  );
  await expect(page.locator("main")).toContainText("Mixing expected");
  expect((await saved(page)).music.releases).toHaveLength(0);
  for (let i = 0; i < 4; i++) await week(page);
  expect((await saved(page)).music.releases).toHaveLength(0);
  await interact(
    page,
    page.getByRole("button", { name: "Release single", includeHidden: true }),
    "click",
  );
  await week(page);
  const s = await saved(page);
  expect(s.music.releases[0].title).toBe("First chorus");
  expect(s.music.releases[0].role).toBe("rapper");
  expect(s.music.releases[0].totalStreams).toBeGreaterThan(0);
  expect(s.music.totalIncome).toBeGreaterThan(0);
  await page.reload();
  await tap(page, "Music & creativity");
  await expect(page.locator("main")).toContainText("First chorus");
});
test("repeatable experiences spend cash and an action then enforce their cooldown", async ({
  page,
}) => {
  const initial = g.createGame({ seed: 1, age: 18, career: "office" });
  await load(page, initial);
  await tap(page, "Lifestyle & shopping");
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Experiences"]'),
    "click",
  );
  await interact(
    page,
    page.locator('[data-action="experience"][data-id="dinner"]'),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Confirm experience",
      includeHidden: true,
    }),
    "click",
  );
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
  await tap(page, "Work & education");
  await expect(
    page.getByRole("button", { name: "Discuss a raise", includeHidden: true }),
  ).toBeDisabled();
  await interact(
    page,
    page.getByRole("button", { name: "Save & settings", includeHidden: true }),
    "click",
  );
  const pending = page.waitForEvent("download");
  await interact(
    page,
    page.getByRole("button", {
      name: "Export pre-update save",
      includeHidden: true,
    }),
    "click",
  );
  expect((await pending).suggestedFilename()).toBe("lifesim-before-v15.json");
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
    await tap(page, name);
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    expect(sizes.scroll, name).toBeLessThanOrEqual(sizes.width);
  }
  expect(errors).toEqual([]);
});
