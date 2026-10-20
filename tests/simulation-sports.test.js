import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import {
  tennisMatch,
  tennisEntryAllowed,
  detailedTennisResult,
  sportSelection,
  basketballCapReason,
} from "../src/simulation/sports.js";
function player(id = "football", age = 18) {
  let s = g.createGame({ age, seed: 8 });
  s.money = 1e7;
  s = id === "football" ? g.joinFootball(s) : g.joinSport(s, id);
  s = g.openDetailedSport(s, id);
  return s;
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
test("football passing has persistent named partners and a once-weekly training effect", () => {
  let s = player();
  const link = s.simulation.sports.football.links[0];
  s = g.footballCombination(s, link.b);
  assert.equal(s.simulation.sports.football.links[0].trust, 53);
  assert.throws(() => g.footballCombination(s, link.b), /Wait|free action/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("football suspensions exclude selection, while a substitute gets limited minutes", () => {
  let s = player();
  const d = s.simulation.sports.football;
  d.suspended = 2;
  assert.equal(sportSelection(s, "football", true, true), false);
  assert.equal(d.suspended, 1);
  d.suspended = 0;
  s.simulation.seed = 0;
  assert.equal(sportSelection(s, "football", false, true), true);
  assert.ok(d.minutes >= 10 && d.minutes <= 30);
  assert.equal(sportSelection(s, "football", false, false), false);
  assert.equal(d.minutes, 0);
});
test("football match reports agree with the real fixture and league goals", () => {
  let s = player();
  s = next(s);
  let p = s.seasons.football,
    f = p.fixtures.find((f) => f.status === "played");
  assert.ok(f);
  const m = s.simulation.sports.football.matches.find((m) => m.id === f.id);
  assert.equal(m.own, f.result.ownScore);
  assert.equal(m.other, f.result.otherScore);
  assert.ok(m.stats.minutes > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("basketball simulates possessions, box score and a funded squad salary limit", () => {
  let s = player("basketball");
  s = next(s);
  const d = s.simulation.sports.basketball,
    m = d.matches[0];
  assert.ok(m);
  assert.ok(m.own > 40);
  assert.ok(m.stats.points <= m.own);
  assert.ok(m.events.some((e) => e.text.includes("possessions")));
  assert.match(basketballCapReason(s, { pay: 1e7 }), /limit/);
  assert.equal(basketballCapReason(s, { pay: 300 }), null);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a young development assignment earns actual appearances and excludes first-team minutes", () => {
  let s = player("basketball");
  s = g.requestDevelopmentAssignment(s);
  assert.equal(sportSelection(s, "basketball", true, true), false);
  for (let i = 0; i < 4; i++) s = next(s);
  assert.equal(s.simulation.sports.basketball.assignment.appearances, 4);
  assert.ok(s.simulation.sports.basketball.assignment.points > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("tennis scoring finishes valid best-of-three sets with actual tiebreak rules", () => {
  let s = player("tennis");
  for (let i = 0; i < 50; i++) {
    const m = tennisMatch(s, 50, 50);
    assert.ok(m.sets.length === 2 || m.sets.length === 3);
    assert.equal(m.sets.filter((set) => set.a > set.b).length === 2, m.won);
    for (const set of m.sets) {
      assert.ok(
        (Math.max(set.a, set.b) === 6 && Math.abs(set.a - set.b) >= 2) ||
          (Math.max(set.a, set.b) === 7 && Math.min(set.a, set.b) >= 5),
      );
      if (set.tiebreak) {
        assert.equal(Math.max(set.a, set.b), 7);
        assert.equal(Math.min(set.a, set.b), 6);
        assert.ok(
          Math.max(...set.tiebreak) >= 7 &&
            Math.abs(set.tiebreak[0] - set.tiebreak[1]) >= 2,
        );
      }
    }
  }
});
test("tennis entry uses fees and qualifications and rolling points expire after 52 weeks", () => {
  let s = player("tennis");
  const f = s.seasons.tennis.fixtures.find((f) => f.week > s.week);
  assert.equal(tennisEntryAllowed(s, f), false);
  const cash = s.money;
  s = g.enterTennisTournament(s, f.id, "club");
  assert.equal(s.money, cash - 20);
  assert.equal(tennisEntryAllowed(s, f), true);
  s.sports.tennis.ability = 100;
  s.simulation.seed = 0;
  const r = detailedTennisResult(s, f, true, 100);
  assert.ok(r.points > 0);
  s = next(s);
  assert.equal(s.simulation.sports.tennis.points, r.points);
  assert.throws(
    () =>
      g.enterTennisTournament(
        s,
        s.seasons.tennis.fixtures.find((f) => f.week > s.week).id,
        "tour",
      ),
    /ranking/,
  );
  s.simulation.sports.tennis.results[0].week = 0;
  s.week = 53;
  g.advanceDetailedSports(s);
  assert.equal(s.simulation.sports.tennis.points, 0);
});
test("boxing respects one active path and cannot skip medical or amateur qualifications", () => {
  const s = player();
  assert.throws(() => g.joinBoxingGym(s), /Leave/);
  let b = g.createGame({ age: 18, seed: 8 });
  b.money = 1e6;
  b = g.joinBoxingGym(b);
  assert.throws(() => g.joinFootball(b), /Leave/);
  assert.throws(() => g.requestBoxingBout(b), /eight/);
  assert.throws(() => g.applyBoxingLicence(b), /eight/);
  for (let i = 0; i < 8; i++) {
    b = next(b);
    b = g.trainBoxing(b, "defence");
  }
  b = next(b);
  b = g.boxingMedical(b);
  b = g.requestBoxingBout(b);
  for (let i = 0; i < 3; i++) b = next(b);
  assert.equal(b.simulation.sports.boxing.bouts.length, 1);
  assert.equal(b.simulation.sports.boxing.bouts[0].purse, 0);
  assert.deepEqual(g.restoreGame(b), b);
});
test("school basketball does not invent professional wages; signed payroll follows the actual career tier", () => {
  let s = player("basketball");
  assert.equal(s.simulation.sports.basketball.cap, 0);
  assert.ok(s.simulation.sports.basketball.roster.every((p) => p.salary === 0));
  s.sports.basketball.contract = { jobId: "basketball-1" };
  s.employment = { weeklyPay: 300 };
  g.syncBasketballPayroll(s);
  assert.equal(s.simulation.sports.basketball.cap, 500000);
  assert.equal(s.simulation.sports.basketball.roster[0].salary, 15600);
  assert.ok(
    s.simulation.sports.basketball.roster
      .slice(1)
      .every((p) => p.salary > 0 && p.salary < 25000),
  );
  assert.equal(
    basketballCapReason(s, { jobId: "basketball-2", pay: 2400 }),
    null,
  );
});
