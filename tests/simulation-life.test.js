import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import { localPrice } from "../src/economy.js";
import { simulationHours, simulationPerformance } from "../src/simulation/effects.js";
const fresh = (age = 14) => { const s = g.createGame({ age, seed: 8 }); s.money = 100000; return s; };
function next(s) { if (s.event) s = g.resolveEvent(s, s.event.options.length - 1); s = g.advanceWeek(s); if (s.event) s = g.resolveEvent(s, s.event.options.length - 1); return s; }
function weeks(s, count) { for (let i = 0; i < count && !s.ended; i++) { s = next(s); g.restoreGame(s); } return s; }
test("authentic v16 migration preserves every existing field and adds uncharged records", () => {
  const old = JSON.parse(fs.readFileSync(new URL("./fixtures/v16-save.json", import.meta.url)));
  const s = g.restoreGame(old); assert.equal(s.version, 17);
  for (const [key, value] of Object.entries(old)) if (key !== "version") assert.deepEqual(s[key], value, key);
  assert.equal(s.simulation.health.active, false); assert.equal(s.simulation.education.active, false); assert.equal(s.simulation.social.active, false);
});
test("hidden aptitudes are revealed through supervised exploration without changing talent", () => {
  const s = fresh(3), talent = s.simulation.education.subjects.arts.aptitude;
  const r = g.exploreAptitude(s, "arts"); assert.equal(r.actions, s.actions - 1); assert.equal(r.simulation.education.subjects.arts.discovered, true); assert.equal(r.simulation.education.subjects.arts.aptitude, talent); assert.equal(s.simulation.education.subjects.arts.discovered, false); assert.deepEqual(g.restoreGame(r), r);
});
test("subjects, teachers, learning plans and recurring study have actual progress and cooldowns", () => {
  let s = fresh(), before = s.simulation.education.subjects.maths.grade;
  s = g.studySubject(s, "maths"); assert.ok(s.simulation.education.subjects.maths.grade > before); assert.equal(s.calendar.spent, 3); assert.throws(() => g.studySubject(s, "maths"), /Wait/);
  s = next(s); const trust = s.simulation.education.teachers.maths.relationship;
  s = g.talkTeacher(s, "maths"); assert.equal(s.simulation.education.teachers.maths.relationship, trust + 5);
  s = next(s); s = g.assessLearning(s); const need = s.simulation.education.support.need;
  s = g.setLearningPlan(s, need === "none" ? "reading" : need); assert.ok(simulationHours(s) >= 2); assert.deepEqual(g.restoreGame(s), s);
});
test("school admissions wait, check capacity and fund fees from the actual family budget", () => {
  let s = fresh(); for (const p of Object.values(s.simulation.education.subjects)) p.grade = 95;
  const type = Object.keys(g.SCHOOL_TYPES).find((id) => id !== "neighbourhood" && g.schoolAdmissions(s, id).eligible);
  s = g.applySchool(s, type); assert.equal(s.simulation.education.school, "neighbourhood"); s = weeks(s, 2); assert.equal(s.simulation.education.school, type);
  assert.deepEqual(g.restoreGame(s), s);
});
test("subject entrance records are earned by results and do not grant degrees", () => {
  let s = fresh(17); for (const p of Object.values(s.simulation.education.subjects)) { p.grade = 100; p.preparation = 100; }
  s = g.sitSubjectExams(s); assert.ok(s.simulation.education.certificates.includes("medicine")); assert.ok(!s.education.completed.includes("medicine-degree")); assert.throws(() => g.sitSubjectExams(s), /Wait/); assert.deepEqual(g.restoreGame(s), s);
  const adult = fresh(25); adult.simulation.education.active = true;
  assert.throws(() => g.enrolEducation(adult, "medicine-degree"), /entrance record/);
});
test("a persistent school case requires enough support and stops after resolution", () => {
  let s = fresh(); s.simulation.education.active = true; s.simulation.education.bullying = { peer: "leo", name: "Leo", since: 0, severity: 40, support: 0, reports: 0, status: "open" };
  s = g.reportBullying(s, "teacher"); assert.equal(s.simulation.education.bullying.status, "open"); assert.throws(() => g.reportBullying(s, "parent"), /Wait/); s = next(s); s = g.reportBullying(s, "teacher"); assert.equal(s.simulation.education.bullying.status, "resolved"); assert.deepEqual(g.restoreGame(s), s);
});
test("historical mode is chosen at birth and changes technology, family resources and price quotes", () => {
  const old = g.createGame({ age: 0, seed: 8, startingYear: 1900, historical: true });
  const modern = g.createGame({ age: 0, seed: 8, startingYear: 1900 });
  assert.ok(localPrice(old, 100) < localPrice(modern, 100)); assert.ok(old.connections.profiles['parent:robin'].weeklyPay < modern.connections.profiles['parent:robin'].weeklyPay);
  const adult = g.createGame({ age: 25, seed: 8, startingYear: 1900, historical: true }); adult.money = 10000;
  assert.throws(() => g.buy(adult, "phone"), /2000/); assert.throws(() => g.invest(adult, "crypto", 1), /2009/); assert.deepEqual(g.restoreGame(adult), adult);
});
test("appointments reserve time, charge once, and issue actual assessed care options", () => {
  let s = fresh(25), before = s.money; s = g.bookAppointment(s, { concern: "vision", provider: "private" }); assert.equal(s.money, before - 120); assert.equal(simulationHours(s, 1), 2); assert.throws(() => g.bookAppointment(s, { concern: "vision" }), /pending/);
  s = next(s); assert.equal(s.simulation.health.appointments[0].status, "attended"); assert.equal(s.simulation.health.checkups.vision, 1); assert.deepEqual(g.restoreGame(s), s);
});
function condition(s, type = "back") { s.simulation.health.active = true; s.simulation.health.conditions.push({ id: "test-condition", type, since: 0, severity: 60, treatment: null, treatedWeeks: 0, lastDelivery: -1, status: "active" }); return s; }
test("treatments are condition-specific, paid and delivered weekly without instant cures", () => {
  let s = condition(fresh(25)); assert.throws(() => g.chooseTreatment(s, "test-condition", "glasses"), /compatible/); s = g.chooseTreatment(s, "test-condition", "physiotherapy"); assert.equal(s.money, 99940); assert.equal(s.simulation.health.conditions[0].severity, 60);
  const r = next(s); assert.equal(r.simulation.health.conditions[0].treatedWeeks, 1); assert.ok(r.simulation.health.conditions[0].severity < 60); assert.equal(r.simulation.health.lastCost, 30); assert.deepEqual(g.restoreGame(r), r);
});
test("sleep, diet and habits alter real wellbeing and sport performance only after monitoring starts", () => {
  let s = g.startHealthRecord(fresh(25)); s.calendar.sleep = 6; s = g.setNutrition(s, "balanced"); s = g.practiceHabit(s, "mindfulness"); const strength = s.simulation.health.habits.mindfulness.strength; assert.ok(strength > 0);
  const r = weeks(s, 4); assert.ok(r.simulation.health.sleepDebt > 0); assert.ok(simulationPerformance(r) < 0); assert.ok(r.simulation.health.paid >= 140); assert.ok(r.simulation.health.habits.mindfulness.strength < strength); assert.deepEqual(g.restoreGame(r), r);
});
test("assessed injury rehabilitation costs time and cannot instantly erase the sporting injury", () => {
  let s = g.startHealthRecord(fresh(25)); s.football.injuryWeeks = 5; s = next(s); const id = s.simulation.health.injuries[0].id;
  assert.throws(() => g.injuryRehab(s, id), /assessment/); s = g.bookAppointment(s, { concern: "injury", provider: "private" }); s = next(s); const weeksBefore = s.football.injuryWeeks; s = g.injuryRehab(s, id); assert.equal(s.football.injuryWeeks, weeksBefore); assert.ok(s.simulation.health.injuries[0].progress > 0); assert.deepEqual(g.restoreGame(s), s);
});
test("unfunded nutrition pauses and paid care cannot spend reserved cash", () => {
  let s = g.setNutrition(fresh(25), "athlete"); s.money = 0; const r = next(s); assert.equal(r.simulation.health.nutrition, "household"); assert.equal(r.simulation.health.lastCost, 0);
});
test("missed specific promises create named grievances which require consistent repair", () => {
  let s = fresh(25), person = s.relationships[0].id; s = g.makeSocialPromise(s, person, "time"); s = weeks(s, 5); assert.equal(s.simulation.social.promises[0].status, "missed"); const grievance = s.simulation.social.grievances[0]; assert.equal(grievance.personId, person);
  s = g.addressGrievance(s, grievance.id); assert.equal(s.simulation.social.grievances[0].status, "resolved"); assert.deepEqual(g.restoreGame(s), s);
});
test("matching affection delivers a promise and improves actual connection without free gifts", () => {
  let s = fresh(25), person = s.relationships[0].id; s = g.discoverSocialLinks(s, person); const preference = s.simulation.social.people[person].preference;
  s = g.makeSocialPromise(s, person, preference); const before = s.money; s = g.showAffection(s, person, preference); assert.equal(s.simulation.social.promises[0].status, "delivered"); assert.equal(s.money, before - (preference === "gifts" ? 20 : 0)); assert.deepEqual(g.restoreGame(s), s);
});
test("mutual plans respect a partner's wishes and counselling has paid weekly sessions", () => {
  let s = fresh(25); const id = s.relationships[0].id; s.relationships[0].role = "Partner"; s.family.partnerId = id; s.connections.profiles[id].trust = 90; s.connections.profiles[id].wantsChildren = false;
  s = g.discussLifePlan(s, "family", "children"); assert.equal(s.simulation.social.plans[0].agreed, false); assert.equal(s.connections.profiles[id].wantsChildren, false);
  s.simulation.seed = 0;
  s = g.startCounselling(s); assert.equal(s.simulation.social.counselling.status, "active");
  const cash = s.money; s = g.attendCounselling(s); assert.equal(s.money, cash - 60); assert.equal(s.simulation.social.counselling.sessions, 1); assert.deepEqual(g.restoreGame(s), s);
});
test("extended-family visits create persistent in-law relationships and preserve player money", () => {
  let s = fresh(25); const id = s.relationships[0].id; s.relationships[0].role = "Partner"; s.relationships[0].bond = 90; s.family.partnerId = id;
  s = g.introduceExtendedFamily(s); assert.equal(s.simulation.social.extended.length, 2); const member = s.simulation.social.extended[0]; const cash = s.money; s = g.visitExtendedFamily(s, member.id); assert.equal(s.money, cash - 15); assert.ok(s.simulation.social.extended[0].bond > member.bond); assert.deepEqual(g.restoreGame(s), s);
});
test("new detailed records reject invalid subjects, treatments, amounts and unsafe content types", () => {
  for (const edit of [(s) => s.simulation.education.subjects.maths.grade = Infinity, (s) => s.simulation.health.nutrition = "fake", (s) => s.simulation.social.edges = [{ a: "a", b: "b", bond: -1, known: true }], (s) => s.simulation.era.enabled = "true"]) { const s = fresh(); edit(s); assert.throws(() => g.restoreGame(s)); }
});
test("household income loss records disruption without granting the child replacement cash", () => {
  let s = fresh(0), id = 'parent:robin'; s.week = 14 * 52; const person = s.connections.profiles[id];
  const before = s.money; person.weeklyPay = 0; s.simulation.education.parents[id].lastPay = 950;
  s = next(s); assert.equal(s.simulation.education.disruption.kind, 'household-income'); assert.ok(s.money < before + 100); assert.deepEqual(g.restoreGame(s), s);
});
test("household illness reserves extra care time for an actually cohabiting partner", () => {
  let s = condition(fresh(25), 'respiratory'); const id = s.relationships[0].id;
  s.family.partnerId = id; s.family.livingTogether = true; s.relationships[0].role = 'Partner'; s.week = 1; s.simulation.seed = 2000;
  s = next(s); assert.ok(s.simulation.health.household.some(p => p.id === id)); assert.ok(simulationHours(s) >= 2); assert.deepEqual(g.restoreGame(s), s);
});
test("signed equal-sharing agreements distribute only the actual joint balance", () => {
  let s = fresh(25), id = s.relationships[0].id; s.family.partnerId = id; s.family.livingTogether = true; s.relationships[0].role = 'Partner'; s.connections.profiles[id].trust = 95; s.connections.profiles[id].wealth = 10000; s.simulation.seed = 0;
  s = g.signPrenup(s, 'equal'); assert.equal(s.simulation.social.prenups[0].status, 'signed');
  s.relationships[0].role = 'Spouse'; s.realWorld.household.joint = { partnerId: id, balance: 1000, playerBasis: 900, partnerBasis: 100 };
  const cash = s.money, partnerCash = s.connections.profiles[id].wealth;
  g.settleSeparation(s, id, { spouse: true }); assert.equal(s.money, cash + 500 - 400); assert.equal(s.connections.profiles[id].wealth, partnerCash + 500); assert.equal(s.realWorld.household.joint, null);
});
test("a child develops an independent adult record and support transfers actual money", () => {
  let s = fresh(45); s.week = 18 * 52; s.simulation.social.active = true;
  const child = { id: 'child:test', name: 'Taylor', bornWeek: 0, parentId: s.relationships[0].id, bond: 70, wellbeing: 75, education: 70, stress: 10, interest: 'music', club: 'none', schoolType: 'state', confidence: 65, independence: 50, future: 'undecided', support: false, lastSupportWeek: 0 };
  s.family.children.push(child); s = next(s); const r = s.simulation.social.children[child.id]; assert.ok(r.adult); const savings = r.adult.savings, cash = s.money;
  s = g.supportAdultChild(s, child.id, 100); assert.equal(s.money, cash - 100); assert.equal(s.simulation.social.children[child.id].adult.savings, savings + 100); assert.deepEqual(g.restoreGame(s), s);
});
