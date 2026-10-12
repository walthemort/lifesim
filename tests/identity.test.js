import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import { personalityModifier } from "../src/personality.js";
import {
  next,
  weeks,
  musician,
  professional,
} from "./career-world-fixtures.js";
const fresh = (options = {}) => g.createGame({ seed: 1, age: 18, ...options });
const parentsWealth = (s) =>
  s.relationships
    .filter((r) => r.role === "Parent")
    .reduce((n, r) => n + s.connections.profiles[r.id].wealth, 0);
function supported(path = "racing", background = "wealthy") {
  const s = fresh({ age: 10, career: path, familyBackground: background });
  s.characterLife.seed = 1;
  return g.requestPathSupport(s, path);
}

test("normal mode rejects creator and profile edits at the engine boundary", () => {
  const s = fresh();
  assert.equal(g.creatorAvailable(s), false);
  assert.throws(
    () => g.createCustomCharacter(s, { name: "Custom Person" }),
    /Debug or Pro/,
  );
  assert.throws(
    () => g.editCharacterProfile(s, { name: "Custom Person" }),
    /Debug or Pro/,
  );
  assert.throws(() => g.setProPreview(s, true), /Enable Debug/);
  assert.equal(s.name, "Alex Morgan");
});
test("random lives begin at birth with deterministic varied identities and no qualifications or personal wealth", () => {
  const a = g.createRandomCharacter(15),
    b = g.createRandomCharacter(15),
    c = g.createRandomCharacter(80);
  assert.deepEqual(a, b);
  assert.notEqual(a.name, c.name);
  assert.equal(a.startAge, 0);
  assert.equal(a.money, 0);
  assert.equal(a.career, "unemployed");
  assert.deepEqual(a.education.completed, []);
  assert.ok(
    Object.values(a.characterLife.personality).every((v) => v >= 35 && v <= 65),
  );
  assert.deepEqual(g.restoreGame(a), a);
});
test("Debug creator edits specialist skills and cash without fabricating a sporting career or past experience", () => {
  const old = g.toggleDebug(fresh(), true);
  const s = g.createCustomCharacter(old, {
    name: "Riley Silva",
    nationality: "Brazilian",
    birthplace: "Copenhagen",
    city: "Monaco",
    pronouns: "She / her",
    hair: "Red",
    hairstyle: "Curly",
    age: 18,
    career: "racing",
    money: 100000,
    personality: { confidence: 90 },
    skills: { driving: 80 },
    specialistSkills: { "music.production": 95, "racing.ability": 85 },
    qualification: "racing-license",
  });
  assert.equal(s.name, "Riley Silva");
  assert.equal(s.money, 100000);
  assert.equal(s.music.skills.production, 95);
  assert.equal(s.sports.racing.ability, 85);
  assert.equal(s.skills.driving, 80);
  assert.equal(s.characterLife.personality.confidence, 90);
  assert.equal(s.career, "unemployed");
  assert.equal(s.employment, null);
  assert.equal(s.sports.racing.experience, 0);
  assert.equal(s.characterLife.profile.birthplace, "Copenhagen");
  assert.deepEqual(g.restoreGame(s), s);
});
test("Pro preview retains identity customization after disabling Debug while keeping age, money and skill cheats locked", () => {
  let current = g.setProPreview(g.toggleDebug(fresh(), true), true);
  current = g.toggleDebug(current, false);
  const s = g.createCustomCharacter(current, {
    name: "Pro Baby",
    familyBackground: "wealthy",
    career: "music",
    personality: { ambition: 70 },
  });
  assert.equal(s.startAge, 0);
  assert.equal(s.money, 0);
  assert.equal(s.music.active, false);
  assert.ok(s.debug.used);
  assert.equal(s.debug.enabled, false);
  assert.ok(parentsWealth(s) >= 150000);
  for (const change of [
    { age: 18 },
    { money: 100 },
    { skills: { driving: 99 } },
    { qualification: "racing-license" },
    { personality: { ambition: 99 } },
  ])
    assert.throws(
      () => g.createCustomCharacter(current, change),
      /Debug|30 to 70/,
    );
  assert.deepEqual(g.restoreGame(s), s);
});
test("profile edits are cosmetic and cannot relocate a household or grant skills", () => {
  const s = g.toggleDebug(fresh(), true);
  const r = g.editCharacterProfile(s, {
    name: "New Name",
    skin: "Deep",
    hairstyle: "Long",
    birthplace: "Monaco",
  });
  assert.equal(r.city, s.city);
  assert.deepEqual(r.skills, s.skills);
  assert.deepEqual(r.housing, s.housing);
  assert.throws(
    () => g.editCharacterProfile(s, { city: "Monaco" }),
    /valid character/,
  );
  assert.throws(
    () => g.editCharacterProfile(s, { hair: "<script>" }),
    /valid hair/,
  );
});
test("confidence affects interviews while qualification gates still reject unqualified applications", () => {
  const s = fresh();
  s.applications.push({
    id: "interview:test",
    vacancyId: "test",
    jobId: "office-0",
    status: "interview",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 3,
    exceptional: false,
    offeredPay: 650,
  });
  const high = structuredClone(s),
    low = structuredClone(s);
  high.characterLife.personality.confidence = 100;
  low.characterLife.personality.confidence = 0;
  assert.ok(
    g.attendInterview(high, "interview:test", "prepared").applications[0]
      .interviewScore >
      g.attendInterview(low, "interview:test", "prepared").applications[0]
        .interviewScore,
  );
  s.characterLife.personality.confidence = 100;
  s.vacancies.push({
    id: "unqualified",
    jobId: "engineering-2",
    postedWeek: 0,
    expiresWeek: 5,
    exceptional: false,
  });
  assert.throws(() => g.applyForJob(s, "unqualified"));
});
test("empathy and patience affect real relationship gains without changing outing costs", () => {
  const high = fresh(),
    low = structuredClone(high);
  high.characterLife.personality.empathy = 100;
  high.characterLife.personality.patience = 100;
  low.characterLife.personality.empathy = 0;
  low.characterLife.personality.patience = 0;
  const a = g.connect(high, "sam"),
    b = g.connect(low, "sam");
  assert.ok(a.relationships[0].bond > b.relationships[0].bond);
  assert.equal(a.money, b.money);
  assert.equal(a.actions, b.actions);
});
test("personal development requires time, changes personality, and cannot repeat in the same week", () => {
  const s = fresh(),
    r = g.personalDevelopment(s, "reflection");
  assert.equal(r.actions, s.actions - 1);
  assert.equal(r.calendar.spent, 2);
  assert.ok(
    r.characterLife.personality.patience > s.characterLife.personality.patience,
  );
  assert.throws(() => g.personalDevelopment(r, "confidence"), /next week/);
  assert.throws(
    () => g.personalDevelopment(fresh({ age: 0 }), "discipline"),
    /age-appropriate/,
  );
  assert.equal(personalityModifier(s, "training"), 0);
});
for (const path of ["football", "racing", "basketball", "tennis", "music"]) {
  test(`${path} routines reserve real time, deliver skill gains and award no contract`, () => {
    const original = fresh({ age: 12, career: path });
    const scheduled = g.setCareerRoutine(original, path, "craft");
    assert.equal(g.identityHours(scheduled), 3);
    assert.equal(scheduled.actions, original.actions - 1);
    assert.throws(
      () => g.setCareerRoutine(scheduled, path, "recover"),
      /once per week/,
    );
    const before =
      path === "music"
        ? scheduled.music.skills.vocals
        : (path === "football" ? scheduled.football : scheduled.sports[path])
            .ability;
    const delivered = next(scheduled);
    const after =
      path === "music"
        ? delivered.music.skills.vocals
        : (path === "football" ? delivered.football : delivered.sports[path])
            .ability;
    assert.ok(after > before);
    assert.equal(delivered.characterLife.routines[path].sessions, 1);
    assert.equal(delivered.employment, null);
    assert.deepEqual(g.restoreGame(delivered), delivered);
  });
}
test("injury blocks extra technical sessions while recovery never heals an active injury instantly", () => {
  let s = g.setCareerRoutine(professional("basketball"), "basketball", "craft");
  s.sports.basketball.injuryWeeks = 5;
  s = next(s);
  assert.equal(s.characterLife.routines.basketball.sessions, 0);
  assert.equal(s.characterLife.routines.basketball.missed, 1);
  s = g.setCareerRoutine(s, "basketball", "recover");
  const injury = s.sports.basketball.injuryWeeks;
  const r = next(s);
  assert.equal(r.characterLife.routines.basketball.sessions, 1);
  assert.ok(
    r.sports.basketball.injuryWeeks > 0 &&
      r.sports.basketball.injuryWeeks >= injury - 1,
  );
});
test("family coaching spends parents savings once per delivered session without giving the player money", () => {
  const s = supported();
  assert.ok(s.characterLife.support);
  assert.equal(s.characterLife.support.paid, 0);
  assert.equal(g.identityHours(s, s.week + 1), 2);
  const control = structuredClone(s);
  control.characterLife.support = null;
  const a = next(s),
    b = next(control);
  assert.ok(
    Math.abs(
      parentsWealth(b) - parentsWealth(a) - s.characterLife.support.fee,
    ) < 0.01,
  );
  assert.equal(a.money, b.money);
  assert.equal(a.characterLife.support.sessions, 1);
  const wealth = parentsWealth(a);
  g.advanceIdentity(a);
  assert.equal(parentsWealth(a), wealth);
  assert.throws(() => g.requestPathSupport(a, "racing"), /cooldown/);
  assert.deepEqual(g.restoreGame(a), a);
});
test("modest family finances, weak relationships and school expectations restrict additional coaching", () => {
  assert.throws(() => supported("racing", "modest"), /savings/);
  let s = fresh({ age: 10, career: "football", familyBackground: "wealthy" });
  for (const r of s.relationships) r.bond = 10;
  assert.throws(() => g.requestPathSupport(s, "football"), /trust/);
  s = fresh({ age: 10, career: "football", familyBackground: "wealthy" });
  s.school.grade = 40;
  const refused = g.requestPathSupport(s, "football");
  assert.equal(refused.characterLife.support, null);
  assert.equal(refused.actions, s.actions - 1);
  assert.equal(refused.football.stage, s.football.stage);
});
test("family support stops if it becomes unaffordable or the player becomes an adult", () => {
  const s = supported("music");
  for (const r of s.relationships.filter((r) => r.role === "Parent"))
    s.connections.profiles[r.id].wealth = 0;
  s.week++;
  g.advanceIdentity(s);
  assert.equal(s.characterLife.support, null);
  const adult = supported("football");
  adult.startAge = 18;
  adult.week++;
  g.advanceIdentity(adult);
  assert.equal(adult.characterLife.support, null);
});
test("local workshops charge canonical city fees, reserve next-week hours and never grant a professional role", () => {
  const s = fresh({ age: 18, career: "racing", city: "Monaco" });
  const offer = s.characterLife.localOffers[0];
  const r = g.bookLocalOpportunity(s, offer.id);
  assert.equal(r.money, s.money - offer.fee);
  assert.equal(g.identityHours(r, r.week + 1), 4);
  assert.throws(() => g.bookLocalOpportunity(r, offer.id), /no longer/);
  r.characterLife.seed = 1;
  const a = next(r);
  assert.equal(
    a.characterLife.localOffers.find((o) => o.id === offer.id).status,
    "attended",
  );
  assert.equal(a.employment, null);
  assert.deepEqual(a.education.completed, s.education.completed);
  assert.deepEqual(g.restoreGame(a), a);
});
test("workshops refund a move-related cancellation and cannot be double-booked or booked after expiry", () => {
  const s = fresh(),
    first = s.characterLife.localOffers[0],
    second = s.characterLife.localOffers[1];
  const r = g.bookLocalOpportunity(s, first.id);
  assert.throws(() => g.bookLocalOpportunity(r, second.id), /booked local/);
  r.city = "Copenhagen";
  r.week++;
  g.advanceIdentity(r);
  assert.equal(r.characterLife.localOffers[0].status, "cancelled");
  assert.equal(r.money, s.money);
  const old = fresh();
  old.week = 13;
  assert.throws(
    () => g.bookLocalOpportunity(old, old.characterLife.localOffers[0].id),
    /no longer/,
  );
});
test("goals complete once from actual releases, with memories and no repeat reward", () => {
  let s = fresh({ career: "music" });
  s = g.choosePersonalGoal(s, "release");
  s.music.sessions = 8;
  s.money = 1000;
  s.inventory.push("phone");
  s = g.startMusicProject(s, { title: "First real track" });
  s = weeks(s, 4);
  assert.equal(s.characterLife.goal, null);
  assert.equal(s.characterLife.completedGoals.length, 1);
  assert.ok(
    s.characterLife.memories.some(
      (m) => m.kind === "goal" && m.week === s.week,
    ),
  );
  assert.throws(() => g.choosePersonalGoal(s, "release"), /already achieved/);
  const memories = s.characterLife.memories.length;
  g.advanceIdentity(s);
  assert.equal(s.characterLife.memories.length, memories);
});
test("existing achievements in v10 saves are preserved without fabricated earlier memories or retroactive goal rewards", () => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/v10-save.json", import.meta.url),
      "utf8",
    ),
  );
  const s = g.restoreGame(old);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") assert.deepEqual(s[key], value);
  assert.equal(s.version, g.VERSION);
  assert.deepEqual(s.characterLife.memories, []);
  assert.deepEqual(s.characterLife.completedGoals, []);
  assert.ok(Object.values(s.characterLife.personality).every((v) => v === 50));
  assert.deepEqual(g.restoreGame(s), s);
});
test("current saves reject corrupt identity data, workshop fees, future bookings and invented Pro grants", () => {
  const s = fresh();
  for (const mutate of [
    (s) => (s.characterLife.personality.confidence = Infinity),
    (s) => (s.characterLife.profile.hair = "injected"),
    (s) => (s.characterLife.proPreview = true),
    (s) => (s.characterLife.localOffers[0].fee = 0.01),
    (s) => {
      s.characterLife.localOffers[0].status = "booked";
      s.characterLife.localOffers[0].performanceWeek = 900;
    },
    (s) =>
      (s.characterLife.routines.racing = { focus: "unlimited", sessions: 0 }),
  ]) {
    const broken = structuredClone(s);
    mutate(broken);
    assert.throws(() => g.restoreGame(broken), /Invalid character/);
  }
  const family = supported();
  family.characterLife.support.fee = 1;
  assert.throws(() => g.restoreGame(family), /Invalid character/);
});

test("busy parent schedules and later ill health affect actual family coaching availability", () => {
  const s = fresh({ age: 10, career: "racing", familyBackground: "wealthy" });
  s.relationships[1].bond = 10;
  assert.equal(g.parentTime(s, s.relationships[0].id), 1);
  assert.throws(() => g.requestPathSupport(s, "racing"), /time/);
  const supportedState = supported();
  for (const r of supportedState.relationships.filter(
    (r) => r.role === "Parent",
  ))
    supportedState.lifeCourse.relatives[r.id].health = 30;
  supportedState.week++;
  g.advanceIdentity(supportedState);
  assert.equal(supportedState.characterLife.support, null);
});

for (const path of ["creator", "business", "investor", "office", "school"]) {
  test(`${path} routines develop the actual path without granting income or credentials`, () => {
    let s = fresh({ age: path === "school" ? 12 : 18 });
    if (path === "creator") s = g.openSocialAccount(g.buy(s, "phone"), "tube");
    if (path === "business") {
      s.skills.business = 30;
      s = g.foundCompany(s, { name: "Small Studio", sector: "Technology" });
    }
    if (path === "investor") s = g.invest(s, "index", 1);
    if (path === "office") {
      s = g.applyForJob(s, s.vacancies[0].id);
      s = weeks(s, 2);
      if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
      s = g.acceptJobOffer(s, s.applications[0].id);
    }
    assert.ok(g.routineAvailable(s, path));
    const before = structuredClone(s);
    s = g.setCareerRoutine(s, path, "craft");
    s = next(s);
    assert.equal(s.characterLife.routines[path].sessions, 1);
    assert.deepEqual(s.education.completed, before.education.completed);
    if (path === "creator")
      assert.ok(s.social.contentSkill > before.social.contentSkill);
    else {
      const skill =
        path === "office"
          ? g.TRACK_SKILLS[g.jobDefinition(s.employment.jobId).track]
          : g.LIFE_PATHS[path].skill;
      assert.ok(s.skills[skill] > before.skills[skill]);
    }
    assert.deepEqual(g.restoreGame(s), s);
  });
}
