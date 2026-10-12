import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import { chapterHours, performanceBonus } from "../src/pressure-effects.js";
import {
  professional,
  musician,
  next,
  weeks,
} from "./career-world-fixtures.js";
import { owned, parent } from "./pressure-fixtures.js";

for (const id of ["football-team", "harbor-fc"]) {
  test(`${id} league tables record all fixtures, goals, points and annual history`, () => {
    let s = owned(id);
    s = next(s);
    const rows = g.ownerStandings(s, id);
    assert.equal(rows.length, 20);
    assert.ok(rows.every((t) => t.played === 1));
    assert.equal(
      rows.reduce((n, t) => n + t.for, 0),
      rows.reduce((n, t) => n + t.against, 0),
    );
    for (const t of rows) assert.equal(t.points, t.wins * 3 + t.draws);
    const counters = s.teams[id].races;
    g.advanceOwnershipPlay(s);
    assert.equal(s.teams[id].races, counters);
    s = weeks(s, 37);
    assert.ok(g.ownerStandings(s, id).every((t) => t.played === 38));
    const points = s.ownershipPlay.competitions[id].table[0].points;
    s = weeks(s, 14);
    assert.equal(s.ownershipPlay.competitions[id].history[0].points, points);
    assert.equal(s.ownershipPlay.competitions[id].history[0].played, 38);
    assert.ok(g.ownerStandings(s, id).every((t) => t.played === 0));
    assert.deepEqual(g.restoreGame(s), s);
  });
}
for (const id of ["gt-team", "f1-team"]) {
  test(`${id} championship standings come from scheduled race results`, () => {
    const s = weeks(owned(id), 3),
      rows = g.ownerStandings(s, id);
    assert.equal(rows.length, 10);
    assert.ok(rows.every((t) => t.played === 1));
    assert.equal(s.teams[id].races, 1);
    assert.ok(rows.reduce((n, t) => n + t.points, 0) > 0);
    if (id === "f1-team") {
      const drivers = g.ownerDriverStandings(s, id);
      assert.equal(drivers.length, 20);
      for (const team of rows)
        assert.equal(
          team.points,
          drivers
            .filter((d) => d.teamId === team.id)
            .reduce((n, d) => n + d.points, 0),
        );
    }
    assert.deepEqual(g.restoreGame(s), s);
  });
}
test("minority sporting owners can read standings but cannot spend company money", () => {
  const s = owned("football-team", 25),
    cash = s.businessResults["football-team"].cash;
  assert.equal(g.ownerStandings(s, "football-team").length, 20);
  assert.throws(
    () => g.appointOwnerStaff(s, "football-team", "coach", "developing"),
    /majority/,
  );
  assert.throws(
    () =>
      g.setOwnerPlan(s, "football-team", {
        budget: "ambitious",
        goal: "title",
      }),
    /majority/,
  );
  assert.equal(s.businessResults["football-team"].cash, cash);
});
test("appointments, construction and notice draw only company cash and require real reserves", () => {
  const initial = owned("cafe"),
    quote = g.ownerQuote(initial, "cafe", "commercial", "experienced"),
    personal = initial.money;
  let s = g.appointOwnerStaff(initial, "cafe", "commercial", "experienced");
  assert.equal(s.money, personal);
  assert.equal(
    s.businessResults.cafe.cash,
    initial.businessResults.cafe.cash - quote.fee,
  );
  assert.throws(
    () => g.appointOwnerStaff(s, "cafe", "commercial", "experienced"),
    /current appointment/,
  );
  s = next(s);
  const cash = s.businessResults.cafe.cash;
  s = g.dismissOwnerStaff(s, "cafe", "commercial");
  assert.equal(s.businessResults.cafe.cash, cash - quote.weekly * 2);
  s = g.upgradeOwnerFacility(s, "cafe");
  s = weeks(s, 3);
  assert.equal(s.ownershipPlay.management.cafe.facility, 0);
  s = next(s);
  assert.equal(s.ownershipPlay.management.cafe.facility, 1);
  assert.equal(s.ownershipPlay.management.cafe.project, null);
  assert.deepEqual(g.restoreGame(s), s);
  const broke = owned("cafe");
  broke.businessResults.cafe.cash = 0;
  assert.throws(
    () => g.appointOwnerStaff(broke, "cafe", "coach", "experienced"),
    /Company cash/,
  );
});
test("an owner who plays for their football club sees the same authoritative league table", () => {
  let s = professional("football");
  s.football.club = "Riverside FC";
  s.opportunities.push({
    id: "club:shared",
    targetId: "football-team",
    stake: 100,
    askingPrice: 750000,
    expiresWeek: 4,
  });
  s = g.acquireOpportunity(s, "club:shared");
  s = next(s);
  assert.ok(s.ownershipPlay.competitions["football-team"].shared);
  assert.deepEqual(
    g.ownerStandings(s, "football-team"),
    g.standings(s, "football"),
  );
  assert.deepEqual(g.restoreGame(s), s);
});
for (const path of ["football", "racing", "basketball", "tennis"]) {
  test(`${path} decisions attach to real fixtures and resolve from actual selection`, () => {
    const initial = professional(path),
      f = g.nextPerformance(initial, path);
    assert.ok(f);
    let s = g.choosePerformancePlan(initial, path, "attack");
    assert.equal(s.actions, initial.actions - 1);
    assert.equal(s.calendar.spent, initial.calendar.spent + 2);
    assert.throws(
      () => g.choosePerformancePlan(s, path, "balanced"),
      /already prepared/,
    );
    assert.ok([-8, 4].includes(performanceBonus(s, path, f)));
    s = weeks(s, f.week - s.week);
    assert.ok(
      ["delivered", "missed"].includes(s.nextChapter.plans[path].status),
    );
    const actual = s.seasons[path].fixtures.find((x) => x.id === f.id);
    if (s.nextChapter.plans[path].status === "delivered")
      assert.equal(s.nextChapter.plans[path].score, actual.result.score);
    assert.deepEqual(g.restoreGame(s), s);
  });
}
test("injury and absent fixtures prevent tactical preparation", () => {
  const s = professional("tennis");
  s.sports.tennis.injuryWeeks = 5;
  assert.throws(
    () => g.choosePerformancePlan(s, "tennis", "attack"),
    /healthy/,
  );
  assert.throws(
    () =>
      g.choosePerformancePlan(g.createGame({ age: 0 }), "football", "attack"),
    /active/,
  );
});
test("family compromises reserve time and excuse a sporting appearance while the team still plays", () => {
  let s = parent(),
    r = s.nextChapter.familyRequests.find((r) => r.kind === "birthday");
  assert.equal(r.dueWeek, 62);
  assert.ok(r.conflicts.includes("football"));
  const control = next(s);
  s = g.respondFamilyRequest(s, r.id, "attend");
  assert.equal(chapterHours(s, 62), 6);
  s = next(s);
  assert.equal(
    s.nextChapter.familyRequests.find((q) => q.id === r.id).status,
    "completed",
  );
  assert.ok(s.family.children[0].bond > control.family.children[0].bond);
  assert.equal(
    s.seasons.football.fixtures.find((f) => f.week === 62).status,
    "unavailable",
  );
  assert.ok(s.seasons.football.table[0].played > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("booked gigs prevent attending at home but allow a remote family call", () => {
  let s = parent("music");
  s.music.gigs.push({
    id: "birthday:show",
    venue: "Local Hall",
    fee: 100,
    status: "offered",
    expiresWeek: 65,
    performanceWeek: null,
  });
  s = g.bookMusicGig(s, "birthday:show");
  g.refreshInbox(s);
  const r = s.nextChapter.familyRequests.find((r) => r.kind === "birthday");
  assert.throws(
    () => g.respondFamilyRequest(s, r.id, "attend"),
    /prevents attending/,
  );
  s = g.respondFamilyRequest(s, r.id, "video");
  assert.equal(chapterHours(s, 62), 1);
  s = next(s);
  assert.equal(
    s.nextChapter.familyRequests.find((q) => q.id === r.id).status,
    "completed",
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("booking a show after protecting a family day cannot deliver both promises", () => {
  let s = parent("music"),
    r = s.nextChapter.familyRequests.find((r) => r.kind === "birthday");
  s = g.respondFamilyRequest(s, r.id, "attend");
  s.music.gigs.push({
    id: "late:show",
    venue: "Evening Hall",
    fee: 100,
    status: "offered",
    expiresWeek: 65,
    performanceWeek: null,
  });
  s = g.bookMusicGig(s, "late:show");
  s = next(s);
  assert.equal(
    s.nextChapter.familyRequests.find((q) => q.id === r.id).status,
    "missed",
  );
});
test("planned recordings pay budgets and guest fees upfront and respect their release schedule", () => {
  const original = musician("producer"),
    before = original.money;
  let s = g.startPlannedRecording(original, {
    title: "Planned track",
    budget: "standard",
    schedule: "careful",
    marketing: "local",
    guest: "session",
  });
  assert.equal(s.money, before - 700);
  const project = s.music.projects.at(-1);
  assert.equal(project.releaseWeek, s.week + 6);
  s = weeks(s, 5);
  assert.ok(
    s.music.projects.some(
      (p) => p.id === project.id && p.status === "recording",
    ),
  );
  s = next(s);
  assert.ok(s.music.releases.some((p) => p.id === project.id));
  assert.deepEqual(g.restoreGame(s), s);
});
test("planned content keeps platform costs, account limits and sponsored delivery requirements", () => {
  let s = g.createGame({ age: 18, seed: 1 });
  s = g.buy(s, "phone");
  s = g.openSocialAccount(s, "lens");
  const before = s.money;
  s = g.producePlannedContent(s, {
    platform: "lens",
    budget: "standard",
    research: "true",
    theme: g.currentTrend(s),
  });
  assert.equal(s.money, before - 40);
  assert.equal(s.social.posts.at(-1).status, "pending");
  s = next(s);
  assert.equal(s.social.posts.at(-1).status, "resolved");
  assert.throws(
    () => g.producePlannedContent(s, { platform: "tube" }),
    /account/,
  );
  assert.throws(
    () => g.producePlannedContent(s, { platform: "lens", sponsored: "true" }),
    /sponsored post/,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("inbox read/archive actions are free and cannot accept an invitation or spend cash", () => {
  const s = professional("racing");
  g.refreshInbox(s);
  const m = s.nextChapter.messages.find((m) => m.kind === "performance");
  assert.ok(m);
  const r = g.markInboxMessage(s, m.id, "archive");
  assert.equal(r.money, s.money);
  assert.equal(r.actions, s.actions);
  assert.deepEqual(r.employment, s.employment);
  assert.ok(r.nextChapter.messages.find((x) => x.id === m.id).archived);
});
test("explicit public promises must be delivered once and a missed deadline harms reputation", () => {
  let s = g.createGame({ age: 23, career: "football", seed: 1 });
  s.fame.recognition = 30;
  g.refreshInbox(s);
  const message = s.nextChapter.messages.find((m) => m.kind === "press");
  s = g.respondPublicMessage(s, message.id, "promise");
  assert.throws(
    () => g.respondPublicMessage(s, message.id, "headline"),
    /unanswered/,
  );
  const delivered = g.deliverCommunityPromise(s, s.nextChapter.promises[0].id),
    r = next(delivered);
  assert.equal(r.nextChapter.promises[0].status, "delivered");
  const broken = weeks(s, 6);
  assert.equal(broken.nextChapter.promises[0].status, "broken");
  assert.ok(broken.fame.reputation < r.fame.reputation);
  assert.deepEqual(g.restoreGame(r), r);
});
test("v11 migration preserves every existing field and starts observing new ownership seasons without replaying prior fixtures", () => {
  const old = JSON.parse(
      fs.readFileSync(
        new URL("./fixtures/v11-save.json", import.meta.url),
        "utf8",
      ),
    ),
    s = g.restoreGame(old);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") assert.deepEqual(s[key], value, key);
  assert.equal(s.version, 12);
  for (const c of Object.values(s.ownershipPlay.competitions)) {
    assert.equal(c.trackedFromWeek, old.week);
    assert.ok(c.table.every((t) => t.played === 0));
  }
  assert.deepEqual(g.restoreGame(s), s);
});
test("current saves reject forged inbox actions, inconsistent league points and invalid family fees", () => {
  const s = parent();
  for (const mutate of [
    (s) => (s.nextChapter.messages[0].action = "new-game"),
    (s) =>
      (s.ownershipPlay.competitions["football-team"].table[0].points = 999),
    (s) => (s.nextChapter.familyRequests[0].paid = 75),
    (s) =>
      (s.nextChapter.plans.football = {
        fixtureId: "fake",
        choice: "unlimited",
        club: "FC",
        week: 62,
        chosenWeek: 61,
        status: "planned",
        resultWeek: null,
        score: 1,
      }),
  ]) {
    const r = structuredClone(s);
    mutate(r);
    assert.throws(() => g.restoreGame(r), /Invalid/);
  }
});

test("a prepared tactic affects the real fixture score, rather than only its displayed description", () => {
  const base = professional("tennis");
  base.sports.tennis.ability = 50;
  const fixture = g.nextPerformance(base, "tennis");
  const planned = g.choosePerformancePlan(base, "tennis", "attack");
  const bonus = performanceBonus(planned, "tennis", fixture);
  const balanced = weeks(
    g.choosePerformancePlan(base, "tennis", "balanced"),
    fixture.week - base.week,
  );
  const attacked = weeks(planned, fixture.week - base.week);
  const ordinary = balanced.seasons.tennis.fixtures.find(
    (f) => f.id === fixture.id,
  ).result.score;
  const actual = attacked.seasons.tennis.fixtures.find(
    (f) => f.id === fixture.id,
  ).result.score;
  assert.equal(actual, Math.min(100, Math.max(0, ordinary + bonus)));
  assert.notEqual(actual, ordinary);
});

test("an F1 owner-driver shares actual driver points with the constructor dashboard", () => {
  let s = professional("racing");
  s.money = 1e9;
  s.skills.driving = 95;
  s.sports.racing.experience = 312;
  s.progress.racing.weeks = 312;
  s.education.completed.push("super-license");
  const j = g.jobDefinition("racing-4"),
    o = {
      id: "f1:shared-seat",
      kind: "contract",
      club: j.employer,
      jobId: j.id,
      pay: j.pay,
      duration: 104,
      status: "offered",
      expiresWeek: 5,
    };
  g.enhanceSportOffer(s, "racing", o);
  s.sports.racing.offers.push(o);
  s = g.acceptSportOffer(s, "racing", o.id);
  s.opportunities.push({
    id: "f1:shared-owner",
    targetId: "f1-team",
    stake: 100,
    askingPrice: 250000000,
    expiresWeek: 5,
  });
  s = g.acquireOpportunity(s, "f1:shared-owner");
  s = weeks(s, 2);
  const c = s.ownershipPlay.competitions["f1-team"];
  assert.ok(c.shared);
  assert.equal(c.drivers[0].points, s.seasons.racing.table[0].points);
  assert.equal(
    c.table[0].points,
    c.drivers.filter((d) => d.teamId === 0).reduce((n, d) => n + d.points, 0),
  );
  assert.deepEqual(g.restoreGame(s), s);
});

test("driver standings break equal points by wins consistently in career and owner records", () => {
  const s = g.createGame({ age: 23, career: "racing", seed: 1 });
  s.seasons.racing.table[0].points = 25;
  s.seasons.racing.table[0].wins = 0;
  s.seasons.racing.table[1].points = 25;
  s.seasons.racing.table[1].wins = 1;
  assert.equal(g.standings(s, "racing")[0].id, 1);
});
