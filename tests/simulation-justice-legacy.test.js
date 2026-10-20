import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import { supervisionTravelReason } from "../src/simulation/justice.js";
function fresh() {
  let s = g.createGame({ age: 30, seed: 8 });
  s.money = 1e6;
  s.skills.business = 60;
  return s;
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
function parent() {
  let s = fresh();
  s.week = 1560;
  s.family.children = [
    {
      id: "heir",
      name: "Robin Morgan",
      bornWeek: 500,
      parentId: "sam",
      bond: 80,
      education: 70,
      wellbeing: 85,
      interest: "music",
      club: "none",
      schoolType: "state",
      confidence: 60,
      independence: 50,
      future: "undecided",
      support: false,
      lastSupportWeek: 0,
    },
  ];
  return s;
}
test("detailed crime creates an investigation before a record or sentence", () => {
  let s = g.openJusticeRecord(fresh());
  s = g.commitCrime(s, "theft");
  assert.equal(s.simulation.justice.cases[0].status, "investigating");
  assert.equal(s.globalLife.crime.record.length, 0);
  assert.equal(s.globalLife.crime.prison, null);
  assert.deepEqual(g.restoreGame(s), s);
  for (let i = 0; i < 2; i++) s = next(s);
  assert.ok(
    ["closed", "interview"].includes(s.simulation.justice.cases[0].status),
  );
});
test("a contested case retains paid legal advice and a guilty plea has delayed consequences", () => {
  let s = g.openJusticeRecord(fresh());
  s = g.commitCrime(s, "theft");
  s.simulation.justice.cases[0].evidence = 95;
  for (let i = 0; i < 2; i++) s = next(s);
  const id = s.simulation.justice.cases[0].id,
    cash = s.money;
  s = g.respondToCase(s, id, "lawyer");
  assert.equal(s.money, cash - 500);
  s = next(s);
  s = g.respondToCase(s, id, "guilty");
  for (let i = 0; i < 4; i++) s = next(s);
  assert.equal(s.simulation.justice.cases[0].status, "convicted");
  assert.equal(s.globalLife.crime.record.length, 1);
  assert.ok(s.globalLife.crime.prison);
  assert.equal(s.actions, 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("parole needs half a sentence and rehabilitation and leads to actual supervision", () => {
  let s = g.openJusticeRecord(fresh());
  s.globalLife.crime.prison = {
    startsWeek: 0,
    releaseWeek: 20,
    crime: "theft",
  };
  s.actions = 0;
  assert.throws(() => g.requestParole(s), /half/);
  for (let i = 0; i < 10; i++) s = next(s);
  s.globalLife.crime.rehabilitation = 100;
  s.simulation.seed = 0;
  s = g.requestParole(s);
  s = next(next(s));
  assert.equal(s.simulation.justice.parole.status, "approved");
  assert.equal(s.globalLife.crime.prison, null);
  assert.equal(s.simulation.justice.supervision.kind, "parole");
  assert.match(supervisionTravelReason(s, "US"), /permission/);
  assert.deepEqual(g.restoreGame(s), s);
  s = g.attendSupervision(s);
  s = g.requestSupervisedTravel(s, "US");
  assert.equal(supervisionTravelReason(s, "US"), null);
  assert.deepEqual(g.restoreGame(s), s);
});
test("repeated missed community appointments can revoke release without deleting a conviction", () => {
  let s = g.openJusticeRecord(fresh());
  s.simulation.justice.supervision = {
    kind: "probation",
    crime: "theft",
    since: 0,
    until: 26,
    nextCheck: 1,
    lastAttended: 0,
    attended: 0,
    missed: 0,
    status: "active",
    travel: null,
  };
  for (let i = 0; i < 7; i++) s = next(s);
  assert.equal(s.simulation.justice.supervision.status, "revoked");
  assert.ok(s.globalLife.crime.prison);
  assert.deepEqual(g.restoreGame(s), s);
});
test("wills require actual beneficiaries and exactly 100 percent", () => {
  let s = parent();
  assert.throws(() => g.writeWill(s, [{ id: "unknown", share: 100 }]), /100%/);
  s = g.writeWill(
    s,
    [
      { id: "heir", share: 75 },
      { id: "charity", share: 25 },
    ],
    21,
  );
  const q = g.estateQuote(s);
  assert.equal(
    q.distributions.reduce((n, d) => n + d.amount, 0),
    q.distributable,
  );
  assert.equal(q.distributions[0].share, 75);
  assert.equal(q.trustAge, 21);
  assert.deepEqual(g.restoreGame(s), s);
});
test("executor settles actual liabilities and heirs do not receive insolvent debts or duplicated assets", () => {
  let s = parent();
  s.money = -10000;
  s.ended = true;
  const q = g.estateQuote(s);
  assert.equal(q.distributable, 0);
  assert.ok(q.shortfall > 0);
  const n = g.continueAsHeir(s, "heir");
  assert.equal(n.money, 0);
  assert.equal(n.inventory.length, 0);
  assert.equal(n.banking.loans.length, 0);
  assert.equal(n.simulation.legacy.archive[0].received, 0);
  assert.deepEqual(g.restoreGame(n), n);
  assert.throws(() => g.continueAsHeir(n, "heir"), /completed life/);
});
test("an heir keeps the same date, market and company world, with an independent birthday", () => {
  let s = parent();
  s = g.foundCompany(s, { name: "Family Enterprise", sector: "Technology" });
  s = g.writeWill(s, [{ id: "heir", share: 100 }], 18);
  s.ended = true;
  const q = g.estateQuote(s),
    n = g.continueAsHeir(s, "heir");
  assert.equal(n.week, s.week);
  assert.equal(n.startingYear, s.startingYear);
  assert.equal(g.age(n), Math.floor((s.week - 500) / 52));
  assert.equal(n.money, q.distributable);
  assert.deepEqual(n.market, s.market);
  assert.deepEqual(n.businessResults, s.businessResults);
  assert.equal(n.company, null);
  assert.equal(n.simulation.legacy.companies[0].name, "Family Enterprise");
  assert.equal(JSON.parse(n.simulation.legacy.previousLife).name, s.name);
  assert.deepEqual(g.restoreGame(n), n);
  let after = n;
  const untilBirthday = 52 - ((n.week - n.ageEpochWeek) % 52);
  for (let i = 0; i < untilBirthday; i++) after = next(after);
  assert.equal(g.age(after), g.age(n) + 1);
  assert.deepEqual(g.restoreGame(after), after);
});
test("a restricted inheritance is an existing trust asset that releases once", () => {
  let s = parent();
  s = g.writeWill(s, [{ id: "heir", share: 100 }], 25);
  s.ended = true;
  let n = g.continueAsHeir(s, "heir"),
    trust = n.simulation.legacy.trusts[0];
  assert.equal(n.money, 0);
  assert.ok(trust.amount > 0);
  const worth = g.netWorth(n);
  assert.equal(worth, trust.amount);
  n.week = trust.releaseWeek;
  g.advanceLegacy(n);
  assert.equal(n.money, trust.amount);
  assert.equal(g.netWorth(n), worth);
  g.advanceLegacy(n);
  assert.equal(n.money, trust.amount);
  assert.equal(n.simulation.legacy.trusts[0].released, true);
  assert.deepEqual(g.restoreGame(n), n);
});
test("a second generation settles its own estate and replaces rather than nests full snapshots", () => {
  let s = parent();
  s.ended = true;
  let n = g.continueAsHeir(s, "heir");
  n.week += 26 * 52;
  n.family.children = [
    {
      ...s.family.children[0],
      id: "grandchild",
      name: "Avery Morgan",
      bornWeek: n.week - 20 * 52,
      parentId: n.relationships[0].id,
    },
  ];
  n.ended = true;
  const q = g.estateQuote(n),
    third = g.continueAsHeir(n, "grandchild");
  assert.equal(third.week, n.week);
  assert.equal(g.age(third), 20);
  assert.equal(third.simulation.legacy.generation, 2);
  assert.equal(third.simulation.legacy.archive.length, 2);
  assert.equal(third.money, q.distributable);
  const prior = JSON.parse(third.simulation.legacy.previousLife);
  assert.equal(prior.name, n.name);
  assert.equal(prior.simulation.legacy.previousLife, null);
  assert.deepEqual(g.restoreGame(third), third);
});
test("new legal deadlines reach the existing notification inbox without performing a response", () => {
  let s = g.openJusticeRecord(fresh());
  s = g.commitCrime(s, "theft");
  s.simulation.justice.cases[0].evidence = 95;
  s = next(next(s));
  const cash = s.money;
  g.refreshInbox(s);
  const m = s.nextChapter.messages.find(
    (m) => m.view === "life-planning" && m.kind === "career-task",
  );
  assert.ok(m);
  assert.equal(m.status, "open");
  assert.equal(s.money, cash);
  assert.deepEqual(g.restoreGame(s), s);
});
test("an heir retains their own completed university course without inheriting the parent’s professional licence", () => {
  let s = parent();
  s.family.children[0].bornWeek = 0;
  s.simulation.social.children.heir = {
    id: "heir",
    ambition: "medicine",
    supported: true,
    autonomy: 80,
    nextFamilyWeek: s.week + 52,
    adult: {
      startedWeek: 936,
      role: "junior",
      savings: 1200,
      qualified: true,
      partner: null,
      children: [],
    },
  };
  s.education.completed.push("medical-license");
  s.ended = true;
  const n = g.continueAsHeir(s, "heir");
  assert.ok(n.education.completed.includes("medicine-degree"));
  assert.ok(!n.education.completed.includes("medical-license"));
  assert.deepEqual(g.restoreGame(n), n);
});
