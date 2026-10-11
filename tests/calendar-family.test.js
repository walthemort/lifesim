import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
const fresh = (o) => g.createGame({ seed: 8, age: 23, ...o });
const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
const next = (s) => clear(g.advanceWeek(clear(s)));
const weeks = (s, n) => {
  for (let i = 0; i < n; i++) s = next(s);
  return s;
};
const plan = (s, hours = {}, sleep = 8) =>
  g.setCalendar(s, {
    mode: "custom",
    sleep,
    hours: {
      ...Object.fromEntries(g.TIME_BLOCKS.map((k) => [k, 0])),
      ...hours,
    },
  });
function couple() {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("./fixtures/v4-save.json", import.meta.url)),
    ),
  );
  s.money = 1e7;
  return weeks(g.setActivity(s, "social"), 52);
}
function employed(jobId = "hospitality-0") {
  let s = fresh();
  s.money = 1e6;
  const j = g.jobDefinition(jobId);
  s.applications.push({
    id: "test-offer",
    vacancyId: "test-vacancy",
    jobId,
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: j.pay,
  });
  return g.acceptJobOffer(s, "test-offer");
}
function child() {
  let s = g.rentHome(couple(), "family");
  s = g.familyAction(s, "child", { name: "Emilia" });
  return weeks(s, 39);
}

test("calendar gives school, sleep and care real commitments without modifying input", () => {
  const young = fresh({ age: 14 }),
    p = g.calendarForecast(young);
  assert.equal(p.required.school, 30);
  assert.equal(p.required.sleep, 63);
  assert.ok(p.total <= 168);
  const changed = plan(young, { football: 0 }, 8);
  assert.equal(young.calendar.mode, "automatic");
  assert.equal(changed.calendar.sleep, 8);
  assert.throws(() => plan(young, {}, 5));
  assert.throws(() => plan(young, { study: Infinity }));
  assert.throws(() => plan(young, { study: 41 }));
  const family = child();
  assert.ok(g.requiredHours(family).care >= 18);
  const shared = g.moveInTogether(family);
  assert.ok(g.requiredHours(shared).care < g.requiredHours(family).care);
});
test("zero study time pauses progress and allocated hours determine the pace", () => {
  let s = g.enrolEducation(fresh(), "business-cert");
  s = plan(s, { study: 0 });
  const zero = next(s);
  assert.equal(zero.education.active.progress, 0);
  assert.equal(
    zero.education.active.spent,
    g.PROGRAMS.find((p) => p.id === "business-cert").tuition,
  );
  const half = next(plan(s, { study: 8 })),
    full = next(plan(s, { study: 16 }));
  assert.equal(half.education.active.progress, 0.5);
  assert.equal(full.education.active.progress, 1);
});
test("oversubscribed optional paths share available time and poor sleep has consequences", () => {
  let s = g.enrolEducation(employed(), "business-cert");
  s = g.joinSport(s, "tennis");
  s = g.configureMusic(s, { role: "producer", genre: "Electronic" });
  s = plan(s, { study: 40, tennis: 40, music: 40, relationships: 40 });
  const forecast = g.calendarForecast(s);
  assert.ok(forecast.deficit > 0);
  assert.ok(forecast.allocations.study < 16);
  const busy = next(s),
    rested = next(plan(s, { study: 8 }, 9)),
    sleepy = next(plan(s, { study: 8 }, 6));
  assert.ok(busy.education.active.progress < 1);
  assert.ok(busy.employment.performance < rested.employment.performance);
  assert.ok(sleepy.health < rested.health);
  assert.ok(sleepy.energy < rested.energy);
  assert.deepEqual(g.restoreGame(busy), busy);
});
test("unallocated sport development stops, and creative work waits for project time", () => {
  let s = g.joinSport(fresh(), "tennis");
  s = plan(s, { tennis: 0 });
  const before = s.sports.tennis;
  const after = next(s);
  assert.equal(after.sports.tennis.ability, before.ability);
  assert.equal(after.sports.tennis.experience, before.experience);
  s = g.buy(fresh(), "laptop");
  s = g.configureMusic(s, { role: "producer", genre: "Electronic" });
  s = g.setActivity(s, "rest");
  for (let i = 0; i < 8; i++) {
    if (!s.actions) s = next(s);
    s = g.practiseMusic(s);
  }
  s = g.startMusicProject(s, { title: "Slow mornings" });
  s = plan(s, { music: 4, project: 0 });
  s = weeks(s, 6);
  assert.equal(s.music.projects[0].status, "recording");
  s = weeks(plan(s, { music: 4, project: 4 }), 4);
  assert.equal(s.music.projects[0].status, "released");
});
test("qualified new professions invite an interview before a hiring decision", () => {
  let s = fresh();
  s.vacancies.push({
    id: "profession",
    jobId: "hospitality-0",
    postedWeek: 0,
    expiresWeek: 4,
    exceptional: false,
  });
  const initial = s;
  s = g.applyForJob(s, "profession");
  assert.equal(initial.actions, 3);
  assert.equal(s.actions, 2);
  s = next(s);
  assert.equal(s.applications[0].status, "interview");
  assert.equal(s.employment, null);
  assert.throws(() => g.acceptJobOffer(s, s.applications[0].id));
  s = g.attendInterview(s, s.applications[0].id, "prepared");
  assert.equal(s.applications[0].status, "pending");
  assert.equal(s.calendar.spent, 3);
  s = next(s);
  assert.equal(s.applications[0].status, "offer");
  s = g.acceptJobOffer(s, s.applications[0].id);
  assert.equal(s.career, "hospitality");
  assert.equal(s.workLife.probationEnds, s.week + 13);
  assert.equal(s.employment.weeklyHours, 40);
  assert.deepEqual(g.restoreGame(s), s);
});
test("interviews expire without awarding a job, and professional credentials cannot be bypassed", () => {
  let s = fresh();
  const v = {
    id: "profession",
    jobId: "medicine-1",
    postedWeek: 0,
    expiresWeek: 4,
    exceptional: false,
  };
  s.vacancies.push(v);
  assert.throws(() => g.applyForJob(s, v.id), /Medical degree/);
  assert.throws(() => g.enrolEducation(s, "medical-license"), /Medical degree/);
  s.vacancies.push({ ...v, id: "entry", jobId: "hospitality-0" });
  s = g.applyForJob(s, "entry");
  s = weeks(s, 4);
  assert.equal(s.applications[0].status, "rejected");
  assert.equal(s.employment, null);
  assert.throws(() => g.attendInterview(s, s.applications[0].id, "prepared"));
});
test("overtime adds working hours and only eligible hourly professions receive additional pay", () => {
  const s = employed(),
    overtime = g.setWorkArrangement(s, "overtime");
  assert.equal(g.requiredHours(overtime).work, g.requiredHours(s).work + 8);
  assert.equal(g.salary(overtime), g.salary(s) * 1.25);
  const salaried = employed("engineering-0");
  assert.equal(
    g.salary(g.setWorkArrangement(salaried, "overtime")),
    g.salary(salaried),
  );
  const mentor = g.workplaceAction(s, "mentor");
  assert.ok(mentor.skills.charisma > s.skills.charisma);
  assert.equal(mentor.actions, s.actions - 1);
  assert.equal(s.workLife.managerBond, 50);
});
test("internal promotion requires qualifications and performance, then a separate acceptance", () => {
  let s = employed();
  s.week = 26;
  s.employment.performance = 95;
  s.workLife.managerBond = 100;
  assert.throws(
    () => g.requestPromotion(s),
    /Hospitality supervision certificate/,
  );
  s.education.completed.push("hospitality-cert");
  s.skills.charisma = 80;
  s = g.requestPromotion(s);
  assert.equal(s.employment.jobId, "hospitality-0");
  s = weeks(s, 2);
  assert.equal(s.workLife.promotion.status, "offer");
  const pay = s.workLife.promotion.pay;
  s = g.acceptPromotion(s);
  assert.equal(s.employment.jobId, "hospitality-1");
  assert.equal(s.employment.weeklyPay, pay);
  assert.equal(s.workLife.promotion, null);
  assert.deepEqual(g.restoreGame(s), s);
});
test("sustained poor performance produces warnings and ultimately ends wages", () => {
  let s = employed();
  s = g.setActivity(s, "rest");
  s = plan(s, { relationships: 40 });
  s.employment.performance = 10;
  for (let i = 0; i < 32 && s.employment; i++) {
    s.energy = 0;
    s.skills.charisma = 0;
    s = next(s);
  }
  assert.equal(s.employment, null);
  assert.equal(s.career, "unemployed");
  assert.equal(g.salary(s), 0);
  assert.equal(s.workLife.warnings, 3);
  assert.ok(s.log.some((l) => l.text.includes("Dismissed")));
  assert.deepEqual(g.restoreGame(s), s);
});
test("pension deposits move cash into savings, add only the employer match to wealth, and remain locked until sixty", () => {
  const original = employed(),
    contributing = g.setPension(original, 5),
    beforeCash = contributing.money;
  const zero = next(original),
    saved = next(contributing);
  assert.equal(zero.money - saved.money, g.salary(original) * 0.05);
  assert.ok(
    Math.abs(saved.workLife.pension - g.salary(original) * 0.07) < 1e-8,
  );
  assert.ok(saved.money < beforeCash + g.salary(original));
  assert.throws(() => g.withdrawPension(saved), /age 60/);
  saved.startAge = 60;
  const balance = saved.workLife.pension,
    before = g.netWorth(saved),
    withdrawn = g.withdrawPension(saved);
  assert.equal(withdrawn.money, saved.money + balance);
  assert.equal(withdrawn.workLife.pension, 0);
  assert.equal(g.netWorth(withdrawn), before);
});
test("dates reserve money and time without instantly creating a partner", () => {
  let s = g.meet(fresh());
  const id = s.relationships.at(-1).id;
  s.relationships.at(-1).bond = 95;
  const before = s.money,
    bond = s.relationships.at(-1).bond;
  const booked = g.inviteDate(s, id, "dinner");
  assert.equal(booked.relationships.at(-1).role, "New connection");
  assert.equal(booked.relationships.at(-1).bond, bond);
  assert.equal(booked.money, before - 65);
  assert.equal(
    g.calendarForecast(booked, { comingWeek: true }).appointments,
    3,
  );
  const dated = next(booked);
  assert.equal(dated.calendar.entries[0].status, "completed");
  assert.equal(dated.connections.profiles[id].successfulDates, 1);
  assert.ok(dated.relationships.at(-1).bond > bond - 1);
  assert.throws(() => g.askExclusive(dated, id), /three good dates/);
  assert.deepEqual(g.restoreGame(dated), dated);
});
test("date cancellation refunds once and skipped or unavailable dates damage trust", () => {
  let s = g.meet(fresh());
  const id = s.relationships.at(-1).id;
  s.relationships.at(-1).bond = 95;
  s = g.inviteDate(s, id, "dinner");
  const entry = s.calendar.entries[0],
    cash = s.money;
  const cancelled = g.cancelAppointment(s, entry.id);
  assert.equal(cancelled.money, cash + 52);
  assert.throws(() => g.cancelAppointment(cancelled, entry.id));
  assert.equal(next(cancelled).connections.profiles[id].dates, 0);
  s.connections.profiles[id].city = "Elsewhere";
  const trust = s.connections.profiles[id].trust;
  const missed = next(s);
  assert.equal(missed.calendar.entries[0].status, "missed");
  assert.ok(missed.connections.profiles[id].trust < trust);
  assert.throws(() => g.inviteDate(clear(missed), id, "walk"), /elsewhere/);
});
test("dating apps have age, equipment and refresh limits, and matched people have independent preferences", () => {
  assert.throws(() => g.openDatingApp(fresh({ age: 16 })), /age 18/);
  assert.throws(() => g.openDatingApp(fresh()), /phone or computer/);
  let s = g.openDatingApp(g.buy(fresh({ age: 18 }), "phone"));
  assert.equal(s.connections.discoveries.length, 4);
  assert.ok(
    s.connections.discoveries.every((d) => 18 + d.profile.ageOffset >= 18),
  );
  assert.throws(() => g.openDatingApp(s), /thirteen/);
  const id = s.connections.discoveries[0].person.id;
  s = g.messageMatch(s, id);
  assert.ok(
    ["matched", "declined"].includes(s.connections.discoveries[0].status),
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("teen dating is restricted to peers and commitment cannot be purchased", () => {
  let s = g.meet(fresh({ age: 14 }));
  const id = s.relationships.at(-1).id;
  s.relationships.at(-1).bond = 95;
  s.money = 1e9;
  assert.throws(() => g.inviteDate(s, id, "walk"), /not available/);
  s = g.meet(fresh({ age: 16 }));
  const peer = s.relationships.at(-1).id;
  s.relationships.at(-1).bond = 95;
  assert.doesNotThrow(() => g.inviteDate(s, peer, "walk"));
  assert.throws(() => g.askExclusive(s, peer), /three good dates/);
  s.connections.profiles[peer].ageOffset = 2;
  assert.throws(() => g.inviteDate(s, peer, "walk"), /not available/);
});
test("partner preferences govern family planning and cohabitation shares care and real income", () => {
  let s = g.rentHome(couple(), "family");
  const id = s.family.partnerId;
  s.connections.profiles[id].wantsChildren = false;
  assert.throws(
    () => g.familyAction(s, "child", { name: "Emilia" }),
    /must want children/,
  );
  s.connections.profiles[id].wantsChildren = true;
  const shared = g.moveInTogether(s),
    p = shared.connections.profiles[id],
    wealth = p.wealth,
    salary = p.weeklyPay;
  const advanced = next(shared);
  assert.equal(
    advanced.family.weeklyContribution,
    Math.min(150, salary * 0.2, wealth + salary - 350),
  );
  assert.equal(
    advanced.connections.profiles[id].wealth,
    wealth + salary - 350 - advanced.family.weeklyContribution,
  );
  const separated = g.familyAction(shared, "breakup");
  assert.equal(separated.family.livingTogether, false);
  assert.equal(next(separated).family.weeklyContribution, 0);
});
test("children develop interests, school activities add costs and time, and family days build wellbeing", () => {
  let s = child(),
    c = s.family.children[0];
  assert.ok(c.interest);
  assert.throws(() => g.setChildPlan(s, c.id, "football", "state"), /5–17/);
  s.week = c.bornWeek + 7 * 52;
  const before = g.expenses(s),
    care = g.requiredHours(s).care;
  s = g.setChildPlan(s, c.id, "music", "private", true);
  assert.equal(g.expenses(s) - before, 110);
  assert.equal(g.requiredHours(s).care - care, 2);
  const bond = s.family.children[0].bond;
  s = g.bookFamilyDay(s);
  s = next(s);
  assert.ok(s.family.children[0].bond > bond);
  assert.equal(s.calendar.entries.at(-1).status, "completed");
  assert.deepEqual(g.restoreGame(s), s);
});
test("school concerns can be supported or ignored, and adult children decide their own path", () => {
  let s = child(),
    c = s.family.children[0];
  s.week = c.bornWeek + 7 * 52;
  while ((s.week + 1) % 13) s = next(s);
  s = next(s);
  const issue = s.family.issues.find((i) => i.status === "open");
  assert.ok(issue);
  const bond = s.family.children[0].bond,
    confidence = s.family.children[0].confidence;
  const supported = g.respondFamilyIssue(s, issue.id, "listen");
  assert.ok(supported.family.children[0].bond > bond);
  assert.ok(supported.family.children[0].confidence > confidence);
  assert.equal(supported.family.issues.at(-1).status, "resolved");
  assert.throws(() => g.respondFamilyIssue(supported, issue.id, "listen"));
  const ignored = weeks(s, 3);
  assert.equal(ignored.family.issues.at(-1).status, "missed");
  s.week = c.bornWeek + 18 * 52 - 1;
  s.family.children[0].education = 90;
  s.family.children[0].support = true;
  s = next(s);
  assert.equal(s.family.children[0].future, "university");
  assert.equal(g.childExtraCosts(s), 60);
  s.week = c.bornWeek + 21 * 52 - 1;
  s = next(s);
  assert.equal(s.family.children[0].future, "graduate career");
  assert.equal(g.childExtraCosts(s), 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("authentic v4 migration preserves money, partner, contract fields and prior gameplay", () => {
  const old = JSON.parse(
      fs.readFileSync(new URL("./fixtures/v4-save.json", import.meta.url)),
    ),
    s = g.restoreGame(old);
  assert.equal(s.version, 5);
  assert.equal(s.money, old.money);
  assert.deepEqual(s.relationships, old.relationships);
  assert.deepEqual(s.employment, old.employment);
  assert.equal(s.family.sinceWeek, old.family.sinceWeek);
  assert.equal(s.calendar.mode, "automatic");
  assert.equal(s.workLife.pension, 0);
  assert.equal(s.debug.used, false);
  assert.deepEqual(g.restoreGame(next(s)), next(s));
  assert.equal(old.version, 4);
});
test("corrupted calendar, workplace, profile and child metadata is rejected", () => {
  const base = child(),
    mutations = [
      (s) => (s.calendar.hours.study = Infinity),
      (s) => (s.calendar.sleep = 4),
      (s) => (s.calendar.spent = -1),
      (s) => (s.workLife.pension = NaN),
      (s) => (s.workLife.pensionRate = 99),
      (s) => (s.connections.profiles.sam.trust = 500),
      (s) => delete s.connections.profiles.sam,
      (s) => (s.family.children[0].club = "f1"),
      (s) => (s.family.children[0].confidence = -2),
    ];
  for (const mutate of mutations) {
    const bad = structuredClone(base);
    mutate(bad);
    assert.throws(() => g.restoreGame(bad));
  }
});

test("a developed authentic v4 household keeps its child, pet, mortgage and sandbox history", () => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/v4-household-save.json", import.meta.url),
    ),
  );
  let s = g.restoreGame(old);
  assert.equal(s.version, 5);
  assert.equal(s.money, old.money);
  assert.deepEqual(s.housing, old.housing);
  assert.deepEqual(s.employment, old.employment);
  assert.deepEqual(s.family.pets, old.family.pets);
  assert.deepEqual(s.debug, old.debug);
  for (const [key, value] of Object.entries(old.family.children[0]))
    assert.deepEqual(s.family.children[0][key], value);
  assert.equal(s.family.sinceWeek, old.family.sinceWeek);
  assert.ok(s.family.children[0].interest);
  assert.equal(g.netWorth(s), g.netWorth(old));
  s = weeks(s, 4);
  assert.equal(s.family.children.length, 1);
  assert.equal(s.family.pets.length, 1);
  assert.ok(
    s.housing.properties[0].loan.balance <
      old.housing.properties[0].loan.balance,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
