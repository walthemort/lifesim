import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
const fresh = (options = {}) => g.createGame({ seed: 1, ...options });
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return g.advanceWeek(s);
}
function agedFamily(years, background = "comfortable") {
  const s = fresh({ familyBackground: background });
  s.week = years * 52;
  g.prepareChildhood(s);
  g.prepareLifeCourse(s);
  s.money = 10000;
  return s;
}
function examsReady() {
  let s = fresh({ age: 16 });
  s = g.schoolAction(s, "focus", "academic");
  for (let i = 0; i < 104; i++) {
    s.school.grade = 95;
    s.skills.knowledge = 95;
    s = next(s);
  }
  if (s.event) s = g.resolveEvent(s, 0);
  return s;
}
test("family background changes actual parental finances without giving cash to a newborn", () => {
  const modest = fresh({ familyBackground: "modest" }),
    wealthy = fresh({ familyBackground: "wealthy" });
  const id = modest.relationships[0].id;
  assert.equal(modest.money, 0);
  assert.equal(wealthy.money, 0);
  assert.equal(modest.connections.profiles[id].wealth, 1500);
  assert.equal(wealthy.connections.profiles[id].wealth, 75000);
  assert.equal(g.restoreGame(wealthy).lifeCourse.background, "wealthy");
});
test("a sibling is born once and remains a real contact as school and independent work begin", () => {
  let s = agedFamily(3),
    id = "sibling:jamie";
  assert.equal(s.relationships.filter((r) => r.id === id).length, 1);
  assert.equal(s.connections.profiles[id].ageOffset, -3);
  g.prepareLifeCourse(s);
  assert.equal(s.relationships.filter((r) => r.id === id).length, 1);
  s.week = 21 * 52;
  g.prepareLifeCourse(s);
  assert.equal(s.lifeCourse.relatives[id].path, "university");
  assert.equal(s.connections.profiles[id].weeklyPay, 100);
  s.week = 25 * 52;
  g.prepareLifeCourse(s);
  assert.equal(s.connections.profiles[id].job, "Engineer");
  assert.equal(s.connections.profiles[id].weeklyPay, 850);
  s.week = 28 * 52;
  g.prepareLifeCourse(s);
  assert.equal(s.connections.profiles[id].city, "Elsewhere");
  assert.equal(g.restoreGame(s).lifeCourse.relatives[id].path, "working");
});
test("parent retirement changes wages to pensions and prevents future annual wage growth", () => {
  const s = fresh(),
    id = s.relationships[0].id,
    pay = s.connections.profiles[id].weeklyPay;
  s.week = 40 * 52;
  g.prepareLifeCourse(s);
  assert.equal(s.lifeCourse.relatives[id].retired, true);
  assert.equal(s.connections.profiles[id].weeklyPay, Math.round(pay * 0.55));
  g.prepareCalendar(s);
  g.advanceConnections(s);
  assert.equal(s.connections.profiles[id].weeklyPay, Math.round(pay * 0.55));
  assert.equal(g.restoreGame(s).connections.profiles[id].job, "Retired");
});
test("family support moves real money and healthcare improves an actual living relative", () => {
  let s = agedFamily(25),
    id = s.relationships[0].id,
    wealth = s.connections.profiles[id].wealth;
  s = g.familySupport(s, id, "money");
  assert.equal(s.money, 9900);
  assert.equal(s.connections.profiles[id].wealth, wealth + 100);
  s.lifeCourse.relatives[id].health = 60;
  s = g.familySupport(s, id, "care");
  assert.equal(s.money, 9850);
  assert.equal(s.lifeCourse.relatives[id].health, 62);
  assert.throws(() => g.familySupport(s, id, "care"), /already/);
  assert.equal(g.restoreGame(s).money, 9850);
});
test("parent death divides savings, cannot happen twice, and preserves memories and deceased contacts", () => {
  const s = agedFamily(3),
    id = s.relationships[0].id,
    other = s.relationships[1].id;
  s.week = 53 * 52;
  s.lifeCourse.relatives[id].health = 60;
  s.connections.profiles[id].wealth = 2000;
  s.connections.profiles[other].wealth = 3000;
  const cash = s.money;
  g.prepareLifeCourse(s);
  assert.equal(g.relativeAlive(s, id), false);
  assert.equal(s.connections.profiles[id].wealth, 0);
  assert.equal(s.connections.profiles[other].wealth, 4000);
  assert.equal(s.money, cash + 500);
  assert.equal(s.connections.profiles["sibling:jamie"].wealth, 500);
  g.prepareLifeCourse(s);
  assert.equal(s.money, cash + 500);
  assert.throws(() => g.connect(s, id), /died/);
  assert.throws(() => g.familySupport(s, id, "visit"), /living/);
  assert.equal(g.restoreGame(s).lifeCourse.relatives[id].deceasedWeek, s.week);
});
test("education funding draws on family savings and relationship, with a thirteen-week cooldown", () => {
  let s = agedFamily(16, "wealthy");
  const total = () =>
    s.relationships
      .filter((r) => r.role === "Parent")
      .reduce((n, r) => n + s.connections.profiles[r.id].wealth, 0);
  const before = total(),
    money = s.money;
  s = g.requestFamilyFunding(s);
  assert.equal(s.money, money + 2000);
  assert.equal(total(), before - 2000);
  assert.throws(() => g.requestFamilyFunding(s), /thirteen/);
  const poor = agedFamily(16, "modest");
  poor.relationships
    .filter((r) => r.role === "Parent")
    .forEach((r) => (poor.connections.profiles[r.id].wealth = 0));
  assert.throws(() => g.requestFamilyFunding(poor), /afford/);
  assert.equal(
    g.restoreGame(s).lifeCourse.school.actions["family-funding"],
    s.week,
  );
});
test("clubs have age limits, actual hours, recurring fees and relevant development", () => {
  assert.throws(
    () => g.schoolAction(fresh({ age: 6 }), "club", "science"),
    /age/,
  );
  let s = g.schoolAction(fresh({ age: 12 }), "club", "science");
  const skill = s.skills.technical;
  assert.equal(g.lifeCourseHours(s), 3);
  assert.equal(g.lifeCourseCosts(s), 5);
  assert.equal(g.expenses(s), 20);
  s = next(s);
  assert.equal(s.lifeCourse.school.clubWeeks, 1);
  assert.ok(s.skills.technical > skill);
  s = g.schoolAction(s, "club", "none");
  assert.equal(g.lifeCourseCosts(s), 0);
  assert.equal(g.lifeCourseHours(s), 0);
});
test("primary school club fees come from parents while child cash stays separate", () => {
  const initial = fresh({ age: 8 });
  let s = g.schoolAction(initial, "club", "science");
  s = next(s);
  assert.equal(s.money, 5);
  assert.equal(g.lifeCourseCosts(s), 0);
  assert.equal(s.lifeCourse.school.clubWeeks, 1);
  const id = initial.relationships[0].id;
  assert.equal(
    s.connections.profiles[id].wealth,
    initial.connections.profiles[id].wealth +
      initial.connections.profiles[id].weeklyPay -
      350 -
      5 -
      5,
  );
});
test("friendship can continue beyond school and rivalry creates contextual choices", () => {
  let s = fresh({ age: 12 });
  for (let i = 0; i < 3; i++) {
    s = g.schoolAction(s, "befriend", "ava");
    if (i < 2) s = next(s);
    if (s.event) s = g.resolveEvent(s, 0);
  }
  assert.ok(s.relationships.some((r) => r.id === "school:ava"));
  assert.equal(
    g.restoreGame(s).connections.profiles["school:ava"].ageOffset,
    0,
  );
  s.lifeCourse.school.peers[1].rivalry = 75;
  const event = g
    .eligibleLifeCourseEvents(s)
    .find((e) => e.id === "school-rivalry");
  assert.ok(event);
  s.event = structuredClone(event);
  s = g.resolveEvent(s, 0);
  assert.equal(s.lifeCourse.school.peers[1].rivalry, 60);
});
test("revision affects real exams, resets preparation, and does not immediately award qualifications", () => {
  let base = fresh({ age: 16 });
  base.week = 43;
  base = g.schoolAction(base, "focus", "academic");
  let revised = structuredClone(base);
  for (let i = 0; i < 5; i++) {
    if (revised.event) revised = g.resolveEvent(revised, 0);
    revised = g.schoolAction(revised, "prepare");
    base = next(base);
    revised = next(revised);
  }
  assert.equal(revised.lifeCourse.school.exams.length, 1);
  assert.equal(revised.lifeCourse.school.exams[0].age, 16);
  assert.ok(
    revised.lifeCourse.school.exams[0].score >
      base.lifeCourse.school.exams[0].score,
  );
  assert.equal(revised.lifeCourse.school.preparation, 0);
  assert.ok(!revised.education.completed.includes("business-degree"));
  assert.equal(g.restoreGame(revised).lifeCourse.school.exams.length, 1);
});
test("teen jobs pay taxable earned wages for scheduled hours without becoming adult employment", () => {
  let s = g.schoolAction(fresh({ age: 16 }), "part-time", "shop");
  const cash = s.money;
  s = next(s);
  assert.equal(s.money, cash + 25 + 72 - 15);
  assert.equal(s.employment, null);
  assert.equal(s.lifeCourse.school.lastWages, 72);
  assert.equal(s.banking.tax.earned, 72);
  assert.equal(s.calendar.last.required.work, 8);
  assert.equal(s.lifeCourse.school.workHours.office, 8);
  assert.equal(g.restoreGame(s).lifeCourse.school.totalWages, 72);
  s.energy = 0;
  s = next(s);
  assert.equal(s.lifeCourse.school.lastWages, 0);
  assert.equal(s.lifeCourse.school.totalWages, 72);
});
test("teen jobs enforce age and tutoring grades, end at adulthood and preserve work experience", () => {
  assert.throws(
    () => g.schoolAction(fresh({ age: 15 }), "part-time", "shop"),
    /sixteen/,
  );
  assert.throws(
    () => g.schoolAction(fresh({ age: 16 }), "part-time", "tutor"),
    /grades/,
  );
  let s = g.schoolAction(fresh({ age: 17 }), "part-time", "cafe");
  s.week = 51;
  s = next(s);
  assert.equal(g.age(s), 18);
  assert.equal(s.lifeCourse.school.partTime, null);
  assert.equal(s.lifeCourse.school.lastWages, 0);
  s.lifeCourse.school.workHours.hospitality = 400;
  assert.equal(g.relevantWorkWeeks(s, "hospitality"), 10);
  assert.equal(s.employment, null);
});
test("merit scholarships depend on earned school results and reduce actual tuition for a finite duration", () => {
  let s = examsReady();
  assert.equal(g.age(s), 18);
  assert.ok(s.lifeCourse.school.exams.length >= 2);
  assert.throws(() => g.applyScholarship(fresh({ age: 18 })), /average/);
  s = g.applyScholarship(s);
  assert.equal(s.lifeCourse.school.scholarship.remaining, 156);
  s = g.enrolEducation(s, "business-degree");
  assert.equal(g.tuitionDue(s), 32.5);
  s = next(s);
  assert.equal(s.education.active.spent, 32.5);
  assert.equal(s.lifeCourse.school.scholarship.remaining, 155);
  assert.equal(s.lifeCourse.school.scholarship.used, 32.5);
  assert.equal(
    g.restoreGame(s).lifeCourse.school.scholarship.status,
    "awarded",
  );
  s.lifeCourse.school.scholarship.remaining = 1;
  s = next(s);
  assert.equal(s.lifeCourse.school.scholarship.status, "exhausted");
  assert.equal(g.tuitionDue(s), 65);
});
test("scholarships do not get consumed while tuition is paused for lack of available cash", () => {
  let s = g.applyScholarship(examsReady());
  s = g.enrolEducation(s, "business-degree");
  s.money = 0;
  s = next(s);
  assert.equal(s.education.active.paused, true);
  assert.equal(s.lifeCourse.school.scholarship.remaining, 156);
});
test("route planning changes ambitions without creating degrees or employment", () => {
  const s = g.chooseSchoolRoute(fresh({ age: 16 }), "university");
  assert.equal(s.lifeCourse.school.route, "university");
  assert.equal(s.employment, null);
  assert.equal(s.education.active, null);
  assert.deepEqual(s.education.completed, []);
  assert.throws(
    () => g.chooseSchoolRoute(fresh({ age: 12 }), "work"),
    /sixteen/,
  );
});
test("ageing affects athletic ability, injury risk and recovery rather than instant skill loss", () => {
  let young = fresh({ age: 23, career: "football" }),
    older = fresh({ age: 38, career: "football" });
  young.football.ability = 80;
  older.football.ability = 80;
  young = next(young);
  older = next(older);
  assert.ok(young.football.ability > older.football.ability);
  assert.ok(older.football.ability < 80); // Ordinary training no longer cancels late-career ageing.
  assert.ok(g.injuryRisk(older, "football") > g.injuryRisk(young, "football"));
  young.football.injuryWeeks = 3;
  older.football.injuryWeeks = 3;
  g.recordSportInjury(young, "football");
  g.recordSportInjury(older, "football");
  assert.equal(young.football.injuryWeeks, 3);
  assert.equal(older.football.injuryWeeks, 4);
  assert.equal(older.lifeCourse.body.scars.football, 1);
  assert.ok(
    g.physicalPerformance(older, "football") <
      g.physicalPerformance(young, "football"),
  );
});
test("conditioning, mobility and rehabilitation take resources and cannot undo active injuries", () => {
  let s = fresh({ age: 40 });
  s.lifeCourse.body.scars.football = 3;
  s.football.injuryWeeks = 4;
  const fitness = s.lifeCourse.body.fitness;
  s = g.bodyAction(s, "conditioning");
  assert.equal(s.lifeCourse.body.fitness, fitness + 1);
  const money = s.money;
  s = g.bodyAction(s, "rehabilitation");
  assert.equal(s.money, money - 80);
  assert.equal(s.lifeCourse.body.scars.football, 2.5);
  assert.equal(s.football.injuryWeeks, 4);
  assert.throws(() => g.bodyAction(s, "rehabilitation"), /already/);
  assert.throws(() => g.bodyAction(fresh({ age: 6 }), "conditioning"), /age/);
  assert.equal(g.restoreGame(s).lifeCourse.body.scars.football, 2.5);
});
test("coaching is a qualified normal vacancy and cannot award a job or licence without training", () => {
  const s = fresh({ age: 35, career: "football" }),
    job = g.jobDefinition("coach-0");
  assert.equal(g.isSportingJob(job), false);
  const vacancy = { jobId: "coach-0", expiresWeek: 10 };
  assert.equal(g.jobEligibility(s, vacancy).eligible, false);
  s.skills.athletics = 40;
  assert.throws(
    () => g.enrolEducation(s, "football-coaching"),
    /experience|weeks/,
  );
  s.progress.football.weeks = 52;
  s.skills.athletics = 40;
  const enrolled = g.enrolEducation(s, "football-coaching");
  assert.equal(enrolled.education.active.programId, "football-coaching");
  assert.equal(enrolled.employment, null);
  assert.ok(!enrolled.education.completed.includes("football-coaching"));
});
test("authentic v7 migration preserves the household, manager, investments and cash with no invented history", () => {
  const raw = JSON.parse(
    fs.readFileSync(new URL("./fixtures/v7-save.json", import.meta.url)),
  );
  const s = g.restoreGame(raw);
  assert.equal(s.version, 8);
  for (const key of Object.keys(raw).filter((k) => k !== "version"))
    assert.deepEqual(s[key], raw[key], key);
  assert.equal(s.lifeCourse.background, "existing");
  assert.deepEqual(s.lifeCourse.school.exams, []);
  assert.deepEqual(s.lifeCourse.memories, []);
  assert.equal(s.careerSupport.music.manager.id, "local");
  assert.equal(g.restoreGame(s).version, 8);
});
test("save validation rejects forged or malformed school, relative and body records", () => {
  for (const change of [
    (s) => (s.lifeCourse.school.preparation = 51),
    (s) => (s.lifeCourse.body.mobility = 101),
    (s) => (s.lifeCourse.body.scars.football = -1),
    (s) => (s.lifeCourse.school.partTime = "fake"),
    (s) => (s.lifeCourse.school.actions.fake = 0),
    (s) => (s.lifeCourse.relatives[s.relationships[0].id].deceasedWeek = 1),
    (s) => (s.lifeCourse.school.workHours.office = -1),
    (s) =>
      (s.lifeCourse.school.scholarship = {
        status: "awarded",
        remaining: 0,
        used: 0,
      }),
  ]) {
    const s = fresh();
    change(s);
    assert.throws(() => g.restoreGame(s), /family, school or ageing/);
  }
});
