import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import { creditClientDividend } from "../src/simulation/professions.js";
function employee(track) {
  let s = g.createGame({ age: 30, seed: 8 });
  s.money = 1e7;
  for (const k in s.skills) s.skills[k] = 100;
  const j = g.JOBS.find(
    (j) =>
      j.track === track &&
      (track !== "office" ||
        g.JOBS.some(
          (n) =>
            n.employer === j.employer &&
            n.track === track &&
            n.level === j.level + 1,
        )),
  );
  assert.ok(j, track);
  s.applications.push({
    id: "test",
    vacancyId: "test",
    jobId: j.id,
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: j.pay,
  });
  s = g.acceptJobOffer(s, "test");
  s = g.openProfessionalDesk(s);
  return s;
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
function practise(s, methods) {
  for (const method of methods) {
    s = next(s);
    s = g.professionalPractice(s, method);
    assert.deepEqual(g.restoreGame(s), s);
  }
  return s;
}
test("professional desk requires employment and follows the actual contract", () => {
  const s = g.createGame({ age: 30 });
  assert.throws(() => g.openProfessionalDesk(s), /employment/);
  let t = employee("office");
  t = g.newProfessionalCase(t);
  const cash = t.money;
  t = g.professionalPractice(t, "plan");
  assert.equal(t.money, cash);
  assert.equal(t.calendar.spent, 0);
  assert.throws(() => g.professionalPractice(t, "plan"), /Wait|free action/);
  t = g.resignJob(t);
  assert.equal(t.simulation.professions.references.length, 1);
  assert.throws(() => g.professionalPractice(t, "deliver"), /employment/);
  assert.deepEqual(
    g.restoreGame(next(t)).simulation.professions.references,
    t.simulation.professions.references,
  );
});
test("medicine records delivered supervised work, not elapsed training time", () => {
  let s = employee("medicine");
  s.education.completed.push("medical-license");
  s = g.beginSpecialisation(s, "emergency");
  assert.throws(() => g.assessSpecialisation(s), /104/);
  s = g.newProfessionalCase(s);
  s = practise(s, ["escalate", "continuity", "history"]);
  assert.equal(s.simulation.professions.cases[0].status, "delivered");
  assert.ok(s.simulation.professions.specialisation.delivered > 0);
  s = next(s);
  s.simulation.professions.specialisation.delivered = 104;
  s.simulation.seed = 0;
  s = g.assessSpecialisation(s);
  assert.equal(s.simulation.professions.specialisation.status, "certified");
  assert.deepEqual(g.restoreGame(s), s);
});
test("nursing escalates actual ward staffing using employer funds", () => {
  let s = g.newProfessionalCase(employee("nursing"));
  const c = s.simulation.professions.cases[0];
  c.staff = 2;
  c.demand = 30;
  const cash = s.money,
    budget = s.simulation.professions.employerCash;
  s = g.professionalPractice(s, "escalate");
  assert.equal(s.simulation.professions.cases[0].staff, 3);
  assert.equal(s.simulation.professions.employerCash, budget - 250);
  assert.equal(s.money, cash);
  assert.deepEqual(g.restoreGame(s), s);
});
test("teaching keeps individual support and attendance records", () => {
  let s = g.newProfessionalCase(employee("teaching"));
  const before = s.simulation.professions.class.map((p) => ({ ...p }));
  s = practise(s, ["support", "parents", "support", "practise"]);
  assert.equal(s.simulation.professions.class.length, 24);
  assert.ok(
    s.simulation.professions.class.every(
      (p, i) =>
        p.grade > before[i].grade && p.attendance >= before[i].attendance,
    ),
  );
  assert.equal(s.simulation.professions.cases[0].status, "delivered");
});
test("engineering cannot certify an untested prototype", () => {
  let s = g.newProfessionalCase(employee("engineering"));
  assert.throws(() => g.professionalPractice(s, "review"), /Verification/);
  s = practise(s, [
    "model",
    "model",
    "prototype",
    "test",
    "test",
    "test",
    "review",
  ]);
  assert.equal(s.simulation.professions.cases[0].status, "delivered");
  assert.equal(s.simulation.professions.cases[0].spent, 1250);
});
test("trades requires surveys, costed materials and an inspection before invoicing", () => {
  let s = g.newProfessionalCase(employee("trades"));
  assert.throws(() => g.professionalPractice(s, "deliver"), /Next required/);
  s = practise(s, ["survey", "quote", "materials", "deliver", "inspect"]);
  assert.equal(s.simulation.professions.cases[0].customerPaid, true);
  assert.equal(s.simulation.professions.cases[0].spent, 500);
});
test("hospitality cannot serve bookings with insufficient stock", () => {
  let s = g.newProfessionalCase(employee("hospitality"));
  assert.throws(() => g.professionalPractice(s, "service"), /bookings/);
  s.simulation.professions.cases[0].demand = 20;
  s = practise(s, ["stock", "prepare", "prepare", "service", "inspect"]);
  assert.equal(s.simulation.professions.cases[0].stock, 10);
  assert.equal(s.simulation.professions.cases[0].status, "delivered");
});
test("legal hearings require evidence, a filing and elapsed court time", () => {
  let s = g.newProfessionalCase(employee("law"));
  assert.throws(() => g.professionalPractice(s, "file"), /two evidence/);
  s = practise(s, ["evidence", "evidence", "file"]);
  s = next(s);
  assert.throws(() => g.professionalPractice(s, "hearing"), /scheduled/);
  s = next(next(s));
  s = g.professionalPractice(s, "hearing");
  assert.notEqual(s.simulation.professions.cases[0].status, "open");
  assert.deepEqual(g.restoreGame(s), s);
});
test("client assets and dividend tax never become personal wealth", () => {
  let s = employee("investor"),
    c = s.simulation.professions.clients[0],
    asset = g.MARKETS.find(
      (m) => m.type !== "Crypto" && m.type !== "Listed company",
    );
  const cash = s.money,
    net = g.netWorth(s),
    start = c.cash;
  s = g.tradeForClient(s, c.id, asset.id, 1);
  c = s.simulation.professions.clients[0];
  assert.equal(s.money, cash);
  assert.equal(g.netWorth(s), net);
  assert.equal(c.cash, start - s.market[asset.id]);
  assert.equal(c.basis[asset.id], s.market[asset.id]);
  creditClientDividend(s, asset.id, 10);
  assert.equal(c.taxPaid, 1.5);
  assert.equal(s.money, cash);
  assert.deepEqual(g.restoreGame(s), s);
  assert.throws(() => g.tradeForClient(s, c.id, asset.id, -2), /own units/);
  const crypto = g.MARKETS.find((m) => m.type === "Crypto");
  assert.throws(
    () =>
      g.tradeForClient(s, s.simulation.professions.clients[1].id, crypto.id, 1),
    /mandate/,
  );
});
test("internal promotion needs an opening and references retain delivery quality", () => {
  let s = employee("office");
  assert.throws(() => g.requestPromotion(s), /open internal vacancy/);
  s = g.reviewInternalVacancy(s);
  assert.equal(s.simulation.professions.vacancy.competitors.length, 3);
  assert.throws(() => g.reviewInternalVacancy(s), /Wait/);
  s.employment.performance = 95;
  s.employment.tenure = 104;
  s = g.resignJob(s);
  assert.equal(s.simulation.professions.references[0].tenure, 104);
  assert.ok(s.simulation.professions.references[0].score > 75);
  assert.deepEqual(g.restoreGame(s), s);
});
