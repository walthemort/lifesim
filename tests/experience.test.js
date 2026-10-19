import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import { gameDate, displayDates } from "../src/dates.js";
import { characterPortrait, portraitStage } from "../src/portraits.js";
import { musician, professional } from "./career-world-fixtures.js";
const fresh = (o = {}) => g.createGame({ age: 18, seed: 8, ...o });
const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
const next = (s) => clear(g.advanceWeek(clear(s)));
const weeks = (s, n) => {
  for (let i = 0; i < n; i++) s = next(s);
  return s;
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.011, `${a} != ${b}`);
function social() {
  let s = fresh();
  s.money = 100000;
  s = g.buy(s, "phone");
  s = g.openSocialAccount(s, "lens");
  return s;
}
function recording() {
  let s = musician("producer", 1);
  s = g.startPlannedRecording(s, {
    title: "My next chapter",
    budget: "lean",
    schedule: "regular",
    marketing: "none",
  });
  return s;
}

test("starting year controls new lives, dates and absolute timestamps without rewriting ages", () => {
  const s = fresh({ startingYear: 1993 });
  assert.equal(gameDate(0, s), "5 Jan 1993");
  assert.equal(gameDate(52, s), "4 Jan 1994");
  assert.equal(g.age(s), 18);
  assert.match(
    displayDates("Review at week 104; lasts 4 weeks", s),
    /1995; lasts 4 weeks/,
  );
  for (const startingYear of [1899, 2101, NaN, 1990.5])
    assert.throws(() => fresh({ startingYear }));
  assert.equal(
    g.createRandomCharacter(8, { startingYear: 1995 }).startingYear,
    1995,
  );
  const pro = g.setProPreview(g.toggleDebug(fresh(), true), true);
  const born = g.createCustomCharacter(g.toggleDebug(pro, false), {
    name: "A real beginning",
    startingYear: 1988,
  });
  assert.equal(born.startAge, 0);
  assert.equal(born.startingYear, 1988);
  assert.deepEqual(g.restoreGame(s), s);
});

test("v14 migration preserves every old field, and begins new systems without invented earnings", () => {
  const old = JSON.parse(
    fs.readFileSync(new URL("./fixtures/v14-save.json", import.meta.url)),
  );
  const s = g.restoreGame(old);
  for (const [k, v] of Object.entries(old))
    if (k !== "version") assert.deepEqual(s[k], v, k);
  assert.equal(s.startingYear, 2026);
  assert.deepEqual(s.experience.music.history, []);
  assert.deepEqual(s.experience.music.campaigns, []);
  assert.equal(s.experience.manager, null);
  assert.deepEqual(s.experience.locks, {
    health: false,
    energy: false,
    happiness: false,
  });
});

test("social posts are independent of the retired social media skill", () => {
  const start = social();
  const low = structuredClone(start),
    high = structuredClone(start);
  low.social.contentSkill = 0;
  high.social.contentSkill = 100;
  const a = g.createPost(low, { platform: "lens" }),
    b = g.createPost(high, { platform: "lens" });
  assert.equal(a.social.posts.at(-1).quality, b.social.posts.at(-1).quality);
  assert.equal(a.social.contentSkill, 0);
  assert.equal(a.actions, start.actions - 1);
  assert.equal(a.money, start.money - 5);
});

for (const path of ["football", "racing", "basketball", "tennis"])
  test(`${path}: fame grows public accounts without requiring a post`, () => {
    let s = professional(path);
    s = g.buy(s, "phone");
    s = g.openSocialAccount(s, "lens");
    s.fame.recognition = 80;
    const before = s.social.profiles.lens.followers;
    s = next(s);
    assert.ok(s.social.profiles.lens.followers > before);
    assert.ok(s.experience.growth > 0);
    const privateLife = structuredClone(s);
    privateLife.social.privacy = "private";
    const count = privateLife.social.profiles.lens.followers;
    const result = next(privateLife);
    assert.equal(result.experience.growth, 0);
    assert.equal(result.social.profiles.lens.followers, count);
  });

test("a social manager charges actual cash and schedules posts without spending player actions", () => {
  let s = social();
  s = g.hireSocialManager(s, "assistant");
  const cash = s.money;
  s.week++;
  g.prepareExperience(s);
  const manager = s.experience.manager;
  near(s.money, cash - 60 - 5);
  assert.equal(manager.posted, 1);
  assert.equal(s.actions, 1);
  assert.equal(s.social.posts.at(-1).managed, true);
  const after = s.money;
  g.prepareExperience(s);
  assert.equal(s.money, after);
  assert.deepEqual(g.restoreGame(s), s);
});

test("social management pauses for insufficient funds, respects privacy and does not fulfil a brand deal", () => {
  let s = social();
  s = g.hireSocialManager(s, "assistant");
  s.money = 0;
  s.week++;
  g.prepareExperience(s);
  assert.equal(s.experience.manager.paused, true);
  assert.equal(s.social.posts.length, 0);
  s.money = 1000;
  s.social.privacy = "private";
  s.week++;
  g.prepareExperience(s);
  assert.equal(s.social.posts[0].public, false);
  assert.equal(s.social.posts[0].dealId, null);
  s.actions = 3;
  s = g.dismissSocialManager(s);
  assert.equal(s.experience.manager, null);
});

test("manager production shares the two-post weekly limit and needs the correct equipment", () => {
  let s = social();
  s = g.hireSocialManager(s, "team");
  s.week++;
  s.social.posts = [0, 1].map((i) => ({
    id: `manual-${i}`,
    createdWeek: s.week,
  }));
  g.prepareExperience(s);
  assert.equal(s.experience.manager.posted, 0);
  assert.equal(s.social.posts.length, 2);
});

test("pre-release promotion pays upfront, grows real pre-saves, and converts once at release", () => {
  let s = recording();
  const id = s.music.projects.at(-1).id,
    cash = s.money;
  s = g.startMusicCampaign(s, { projectId: id, kind: "focused" });
  assert.equal(s.money, cash - 150);
  assert.throws(
    () => g.startMusicCampaign(s, { projectId: id, kind: "grassroots" }),
    /already/,
  );
  s = weeks(s, 4);
  const c = s.experience.music.campaigns[0];
  assert.ok(c.preSaves > 0);
  assert.ok(c.reach >= c.preSaves);
  assert.ok(!s.music.releases.some((r) => r.id === id));
  s = g.releaseReadyRecording(s, id);
  s = next(s);
  const r = s.music.releases.find((r) => r.id === id);
  assert.ok(r);
  assert.equal(s.experience.music.campaigns[0].status, "released");
  const paid = g.promotionStreams(
    s,
    s.music.projects.find((p) => p.id === id),
  );
  assert.equal(paid, 0);
  assert.equal(s.music.releases.filter((r) => r.id === id).length, 1);
  assert.deepEqual(g.restoreGame(s), s);
});

test("campaigns and charts update once per week, track actual streams, and charge no royalties twice", () => {
  let s = recording();
  const id = s.music.projects.at(-1).id;
  s = g.startMusicCampaign(s, { projectId: id });
  s = next(s);
  const reach = s.experience.music.campaigns[0].reach;
  g.prepareExperience(s);
  assert.equal(s.experience.music.campaigns[0].reach, reach);
  const royalty = s.music.totalIncome;
  g.advanceExperience(s);
  assert.equal(s.music.totalIncome, royalty);
  assert.equal(
    s.experience.music.history.at(-1).streams,
    s.music.releases.reduce((n, r) => n + r.weeklyStreams, 0),
  );
  s.music.releases[0].weeklyStreams = 1e9;
  assert.equal(g.musicChart(s)[0].own, true);
  assert.equal(g.musicChart(s)[0].streams, 1e9);
});

function youth(seed = 1, ability = 100) {
  let s = fresh({ seed, age: 12, career: "football" });
  if (s.football.stage === "none") s = g.joinFootball(s);
  Object.assign(s.football, {
    ability,
    discipline: ability,
    coachTrust: ability,
  });
  s.skills.athletics = ability;
  return g.requestYouthAssessment(s);
}
test("exceptional young players almost always get several leading academy choices, without a senior job", () => {
  let offers = 0;
  for (let seed = 1; seed <= 50; seed++) {
    const s = weeks(youth(seed), 2);
    if (s.football.offers.some((o) => o.kind === "academy")) {
      offers++;
      assert.ok(
        s.football.offers.filter((o) => o.kind === "academy").length >= 3,
      );
      assert.equal(s.employment, null);
    }
  }
  assert.ok(offers >= 49, `${offers}/50 elite assessments succeeded`);
});
test("developing youth can attract smaller academies, and choosing one closes competing youth invitations", () => {
  let s;
  for (let seed = 1; seed < 30; seed++) {
    const candidate = weeks(youth(seed, 65), 2);
    if (candidate.football.offers.some((o) => o.kind === "academy")) {
      s = candidate;
      break;
    }
  }
  assert.ok(s);
  assert.ok(s.football.offers.every((o) => !o.club.includes("Meridian City")));
  s = g.acceptFootballOffer(
    s,
    s.football.offers.find((o) => o.kind === "academy").id,
  );
  assert.equal(s.football.stage, "academy");
  assert.equal(s.employment, null);
  assert.equal(s.school.enrolled, true);
  assert.ok(
    !s.football.offers.some(
      (o) => o.kind === "academy" && o.status === "offered",
    ),
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("youth assessment checks age, injuries, local participation and preparation", () => {
  assert.throws(
    () => g.requestYouthAssessment(fresh({ age: 23 })),
    /eight to eighteen/,
  );
  const s = fresh({ age: 12 });
  assert.throws(() => g.requestYouthAssessment(s), /school\/local/);
  const joined = g.joinFootball(s);
  assert.throws(() => g.requestYouthAssessment(joined), /30 football/);
  joined.football.ability = 70;
  joined.football.discipline = 80;
  joined.football.injuryWeeks = 2;
  assert.throws(() => g.requestYouthAssessment(joined), /Recover/);
});
test("the simple football shortlist chooses a legal move and keeps recruitment and vacancy gates", () => {
  let s = professional("football");
  const o = g.footballMoveOptions(s).find((o) => !o.missing.length);
  assert.ok(o);
  s = g.approachFootballClub(s, o.name);
  assert.equal(
    s.careerWorld.sports.football.requests.at(-1).destination,
    o.name,
  );
  assert.equal(s.career, "football");
  assert.throws(
    () => g.approachFootballClub(s, o.name),
    /current request|cooldown/,
  );
});

test("always-full switches require debug, persist in saves, and stop applying when debug is off", () => {
  let s = fresh();
  assert.throws(() => g.setGodModeLock(s, "energy", true), /debug/);
  s = g.toggleDebug(s, true);
  s = g.setGodModeLock(s, "all", true);
  assert.equal(s.health, 100);
  assert.equal(s.energy, 100);
  assert.equal(s.happiness, 100);
  s = weeks(s, 4);
  assert.equal(s.health, 100);
  assert.equal(s.energy, 100);
  assert.equal(s.happiness, 100);
  assert.equal(s.debug.used, true);
  assert.deepEqual(g.restoreGame(s), s);
  s = g.toggleDebug(s, false);
  s.energy = 40;
  g.applyGodMode(s);
  assert.equal(s.energy, 40);
  assert.equal(s.experience.locks.energy, true);
});
test("individual locks preserve natural changes in the other stats and cannot rewrite an ended life", () => {
  let s = g.setGodModeLock(g.toggleDebug(fresh(), true), "energy", true);
  s.health = 40;
  g.applyGodMode(s);
  assert.equal(s.health, 40);
  assert.equal(s.energy, 100);
  s.ended = true;
  s.energy = 3;
  g.applyGodMode(s);
  assert.equal(s.energy, 3);
  assert.throws(() => g.setGodModeLock(s, "money", true));
});
test("seven portrait ages preserve the saved identity and consistently show the requested hairstyle", () => {
  const p = fresh().characterLife.profile,
    original = structuredClone(p);
  const ages = [0, 2, 9, 16, 24, 42, 70];
  const drawings = [];
  assert.equal(new Set(ages.map(portraitStage)).size, 7);
  for (const visualAge of ages) {
    const svg = characterPortrait({ ...p, visualAge });
    assert.match(svg, /friendly-portrait/);
    assert.match(svg, /data-age-stage/);
    assert.equal((svg.match(/<linearGradient/g) || []).length, 2);
    drawings.push(
      svg
        .replaceAll(/portrait-\d+/g, "portrait")
        .replaceAll(/data-age-stage="[^"]*"|aria-label="[^"]*"/g, ""),
    );
  }
  assert.equal(
    new Set(drawings).size,
    7,
    "every age stage changes the actual drawing",
  );
  assert.notEqual(
    characterPortrait({ ...p, hairstyle: "Braids", visualAge: 24 }),
    characterPortrait({ ...p, hairstyle: "Short", visualAge: 24 }),
  );
  assert.deepEqual(p, original);
});
test("save validation rejects malformed calendar, money, campaigns, manager and god-mode settings", () => {
  for (const corrupt of [
    (s) => (s.startingYear = 1800),
    (s) => (s.experience.locks.energy = "true"),
    (s) => (s.experience.manager = { id: "fake" }),
    (s) => (s.experience.music.chart[0].streams = -1),
    (s) =>
      s.experience.music.history.push({ week: 0, streams: NaN, royalties: 0 }),
    (s) => s.experience.scouting.requests.push({ status: "offered" }),
    (s) => s.experience.music.campaigns.push(null),
  ]) {
    const s = fresh();
    corrupt(s);
    assert.throws(() => g.restoreGame(s));
  }
});
