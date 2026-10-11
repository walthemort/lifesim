import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import { footballRecruitmentChance } from "../src/career-support.js";

function musician() {
  let s = g.createGame({ seed: 1, age: 23, career: "music" });
  s = g.buy(s, "microphone");
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
test("music managers require a demonstrated path, take a signing fee and add recurring costs", () => {
  const base = musician(),
    s = g.hireMusicManager(base, "local");
  assert.equal(base.music.releases.length, 1);
  assert.equal(s.money, base.money - 100);
  assert.equal(s.actions, base.actions - 1);
  assert.equal(g.expenses(s) - g.expenses(base), 20);
  assert.equal(s.careerSupport.music.manager.id, "local");
  assert.throws(() => g.hireMusicManager(s, "regional"), /End/);
  assert.throws(
    () =>
      g.hireMusicManager(g.createGame({ age: 23, career: "music" }), "local"),
    /Requires/,
  );
  assert.throws(() => g.hireMusicManager(base, "international"), /5000/);
  assert.equal(
    g.restoreGame(JSON.stringify(s)).careerSupport.music.manager.id,
    "local",
  );
  const ended = g.dismissMusicManager(s);
  assert.equal(g.expenses(ended), g.expenses(base));
  assert.deepEqual(ended.music.releases, s.music.releases);
});
test("music commission deducts cash and taxable earnings without taking unrelated income", () => {
  let s = g.hireMusicManager(musician(), "local");
  const money = s.money,
    tax = s.banking.tax.earned,
    withheld = s.banking.tax.withheld;
  s.week++;
  g.advanceMusic(s);
  const commission = s.careerSupport.music.commissionPaid;
  assert.equal(commission, Math.round(s.music.weeklyIncome * 0.1 * 100) / 100);
  assert.equal(
    Math.round((s.banking.tax.earned - tax) * 100) / 100,
    Math.round((s.music.weeklyIncome - commission) * 100) / 100,
  );
  assert.equal(
    Math.round((s.money - money) * 100) / 100,
    Math.round(
      (s.music.weeklyIncome -
        commission -
        (s.banking.tax.withheld - withheld)) *
        100,
    ) / 100,
  );
  const before = s.careerSupport.music.commissionPaid;
  g.receiveIncome(s, 1000, "investment");
  assert.equal(s.careerSupport.music.commissionPaid, before);
});
test("creative career activities cost time and energy and respect equipment and cooldowns", () => {
  let s = musician();
  assert.throws(() => g.careerActivity(s, "mixing"), /computer/);
  s = g.buy(s, "laptop");
  const skill = s.music.skills.production,
    money = s.money;
  s = g.careerActivity(s, "mixing");
  assert.equal(s.music.skills.production, skill + 0.8);
  assert.equal(s.money, money);
  assert.throws(() => g.careerActivity(s, "mixing"), /before repeating/);
  assert.equal(
    g.restoreGame(JSON.stringify(s)).careerSupport.activities.mixing,
    s.week,
  );
});
test("promotion improves actual release reach without instantly awarding an audience", () => {
  let base = g.buy(
    g.createGame({ seed: 1, age: 23, career: "music" }),
    "microphone",
  );
  base.music.sessions = 12;
  base.music.releases = [
    {
      id: "old",
      title: "Earlier",
      role: "singer",
      genre: "Pop",
      quality: 30,
      releasedWeek: 0,
      totalStreams: 1,
      weeklyStreams: 1,
      initialStreams: 1,
      totalRoyalties: 0,
    },
  ];
  const promoted = g.careerActivity(base, "campaign");
  assert.equal(promoted.music.fans, base.music.fans);
  assert.equal(promoted.money, base.money - 100);
  let ordinary = g.startMusicProject(base, { title: "New song" }),
    campaign = g.startMusicProject(promoted, { title: "New song" });
  ordinary.week = 3;
  campaign.week = 3;
  ordinary.music.projects[0].releaseWeek = 3;
  campaign.music.projects[0].releaseWeek = 3;
  g.advanceMusic(ordinary);
  g.advanceMusic(campaign);
  assert.ok(
    campaign.music.releases.at(-1).initialStreams >
      ordinary.music.releases.at(-1).initialStreams,
  );
  assert.throws(
    () => g.careerActivity(promoted, "campaign"),
    /before repeating/,
  );
});
test("promotion supports already released tracks and expires on the weekly clock", () => {
  const base = musician();
  base.music.releases[0].weeklyStreams = 1000;
  let promoted = g.careerActivity(base, "campaign"),
    ordinary = structuredClone(base);
  ordinary.week++;
  promoted.week++;
  g.advanceMusic(ordinary);
  g.advanceMusic(promoted);
  assert.ok(
    promoted.music.releases[0].weeklyStreams >
      ordinary.music.releases[0].weeklyStreams,
  );
  assert.ok(promoted.music.weeklyIncome > ordinary.music.weeklyIncome);
  ordinary = structuredClone(promoted);
  promoted.careerSupport.music.campaignUntil = promoted.week;
  ordinary.careerSupport.music.campaignUntil = 0;
  ordinary.week++;
  promoted.week++;
  g.advanceMusic(ordinary);
  g.advanceMusic(promoted);
  assert.equal(
    promoted.music.releases[0].weeklyStreams,
    ordinary.music.releases[0].weeklyStreams,
  );
});
test("label pitches accelerate review but preserve the requirements for a real offer", () => {
  let s = g.hireMusicManager(musician(), "local");
  s.music.nextLabelWeek = s.week + 12;
  s = g.careerActivity(s, "label-pitch");
  assert.equal(s.music.nextLabelWeek, s.week + 1);
  s.week++;
  g.advanceMusic(s);
  assert.equal(s.music.labelOffers.length, 0); // One release is insufficient even with representation.
});
test("press invitations have deadlines and interviews reserve time and can fail", () => {
  let s = g.hireMusicManager(musician(), "local");
  s.careerSupport.music.nextPressWeek = s.week;
  for (let i = 0; !s.careerSupport.music.press.length && i < 30; i++) {
    s.careerSupport.music.nextPressWeek = s.week;
    g.advanceCareerSupport(s);
  }
  assert.equal(s.careerSupport.music.press.length, 1);
  const id = s.careerSupport.music.press[0].id;
  s = g.bookMusicInterview(s, id);
  assert.equal(s.careerSupport.music.press[0].status, "booked");
  assert.equal(g.calendarForecast(s, { comingWeek: true }).required.care, 3);
  assert.equal(g.calendarForecast(s).required.care, 0);
  s.week++;
  assert.equal(g.careerSupportHours(s), 3);
  s.energy = 0;
  const fans = s.music.fans;
  g.advanceCareerSupport(s);
  assert.equal(s.careerSupport.music.press[0].status, "missed");
  assert.equal(s.music.fans, fans);
  assert.equal(
    g.restoreGame(JSON.stringify(s)).careerSupport.music.press[0].status,
    "missed",
  );
  assert.throws(() => g.bookMusicInterview(s, id), /available interview/);
});
test("footballers can analyse matches, treat injuries and use qualified representation", () => {
  let s = g.joinFootball(g.createGame({ seed: 1, age: 23 }));
  s.football.reputation = 15;
  const ability = s.football.ability;
  s = g.careerActivity(s, "match-analysis");
  assert.equal(s.football.ability, ability + 0.5);
  assert.throws(() => g.careerActivity(s, "club-outreach"), /sports agent/);
  s = g.hireAgent(s, "football", "development");
  s = g.advanceWeek(s);
  s = g.careerActivity(s, "club-outreach");
  assert.equal(s.football.nextScoutWeek, 2);
  assert.equal(s.careerSupport.football.outreachUntil, 14);
  assert.ok(Math.abs(footballRecruitmentChance(s, 0.4) - 0.49) < 1e-9);
  s = g.advanceWeek(s);
  assert.equal(s.football.offers.length, 0); // No playing history or ability to support an invitation.
  if (s.event) s = g.resolveEvent(s, 0);
  s.football.injuryWeeks = 3;
  const money = s.money;
  s = g.careerActivity(s, "physio");
  assert.equal(s.football.injuryWeeks, 2);
  assert.equal(s.money, money - 45);
  assert.equal(
    g.restoreGame(JSON.stringify(s)).careerSupport.football.outreachUntil,
    14,
  );
});
test("career support save validation rejects fabricated managers, deadlines and activity histories", () => {
  for (const change of [
    (s) => (s.careerSupport.music.manager = { id: "fake", signedWeek: 0 }),
    (s) => (s.careerSupport.activities.fake = 0),
    (s) => (s.careerSupport.music.commissionPaid = -1),
    (s) => (s.careerSupport.football.outreachUntil = NaN),
  ]) {
    const s = musician();
    change(s);
    assert.throws(() => g.restoreGame(JSON.stringify(s)), /career support/);
  }
});
