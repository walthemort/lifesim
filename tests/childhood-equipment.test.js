import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";

const birth = () => g.createGame({ seed: 1 });
const adult = () => g.createGame({ seed: 1, age: 23, career: "music" });
function grow(s, years) {
  for (let i = 0; i < years; i++) {
    if (s.event) s = g.resolveEvent(s, 0);
    s = g.ageUp(s);
  }
  return s;
}

test("newborns have parents and care, without cash, qualifications, school or employment", () => {
  const s = birth();
  assert.equal(g.age(s), 0);
  assert.equal(s.money, 0);
  assert.equal(g.salary(s), 0);
  assert.equal(g.expenses(s), 0);
  assert.equal(s.employment, null);
  assert.deepEqual(s.education.completed, []);
  assert.equal(s.school.enrolled, false);
  assert.equal(s.calendar.sleep, 14);
  assert.equal(s.skills.business, 0);
  assert.equal(s.skills.driving, 0);
  assert.equal(s.relationships.filter((r) => r.role === "Parent").length, 2);
  assert.equal(s.childhood.milestones[0].id, "birth");
  assert.equal(g.restoreGame(JSON.stringify(s)).startAge, 0);
});
test("age up simulates a birthday and leaves childhood decisions for the player", () => {
  const s = g.ageUp(birth());
  assert.equal(s.week, 52);
  assert.equal(g.age(s), 1);
  assert.equal(s.event.id, "baby-birthday");
  assert.equal(s.calendar.sleep, 12);
  assert.equal(s.debug.used, false);
  assert.throws(() => g.ageUp(s), /choice/);
  const c = g.resolveEvent(s, 0);
  assert.equal(c.childhood.choices.length, 1);
  assert.equal(c.event, null);
  assert.equal(g.age(g.ageUp(c)), 2);
});
test("supervised activities are free, age appropriate and limited per week", () => {
  const s = birth(),
    p = g.childhoodActivity(s, "play");
  assert.equal(p.money, 0);
  assert.equal(p.actions, s.actions - 1);
  assert.ok(
    p.childhood.development.movement > s.childhood.development.movement,
  );
  assert.throws(() => g.childhoodActivity(p, "play"), /already/);
  assert.throws(() => g.childhoodActivity(s, "study"), /age/);
  assert.throws(() => g.practiseMusic(s), /six/);
  assert.throws(() => g.joinFootball(s), /five/);
  assert.throws(
    () => g.foundCompany(s, { name: "Baby Inc", sector: "Technology" }),
    /eighteen|18/,
  );
  assert.throws(() => g.invest(s, "index", 1), /adult|18|eighteen/);
});
test("childhood develops naturally without adult career skills or financial charges", () => {
  const s = grow(birth(), 5);
  assert.equal(s.money, 0);
  assert.equal(s.skills.business, 0);
  assert.equal(s.skills.driving, 0);
  assert.equal(s.progress.office.weeks, 0);
  assert.equal(s.school.enrolled, true);
  assert.equal(s.calendar.sleep, 10);
  assert.ok(s.childhood.development.language > 5);
  assert.ok(s.relationships.some((r) => r.id === "sam"));
  assert.deepEqual(s.education.completed, []);
  assert.equal(s.banking.credit, birth().banking.credit);
  assert.equal(g.restoreGame(JSON.stringify(s)).week, 260);
});
test("birth interests unlock through school and local participation at the appropriate ages", () => {
  for (const [career, years] of [
    ["football", 5],
    ["racing", 6],
    ["basketball", 6],
    ["tennis", 6],
    ["music", 6],
  ]) {
    let s = g.createGame({ seed: 1, career });
    assert.equal(s.music.active, false);
    assert.equal(s.football.stage, "none");
    s = grow(s, years);
    assert.equal(s.employment, null);
    if (career === "football") assert.equal(s.football.stage, "school");
    else if (career === "music") assert.equal(s.music.active, true);
    else assert.equal(s.sports[career].stage, "local");
    assert.equal(g.restoreGame(JSON.stringify(s)).week, years * 52);
  }
});
test("parents cover childhood club fees instead of consuming the child allowance", () => {
  let s = g.createGame({ seed: 1, age: 6, career: "racing" });
  const parent = s.relationships[0].id;
  const fee = g.SPORTS.find((d) => d.id === "racing").entryFee;
  const wealth = s.connections.profiles[parent].wealth,
    pay = s.connections.profiles[parent].weeklyPay;
  s = g.advanceWeek(s);
  assert.equal(s.money, 5);
  assert.equal(g.expenses(s), 0);
  assert.equal(
    s.connections.profiles[parent].wealth,
    wealth + pay - 350 - 5 - fee,
  );
});
test("school, teenage allowance and adulthood follow the same weekly clock", () => {
  let s = grow(birth(), 12);
  assert.equal(g.age(s), 12);
  assert.equal(s.event.id, "secondary-start");
  assert.equal(g.salary(s), 25);
  assert.equal(g.expenses(s), 15);
  assert.equal(s.calendar.sleep, 9);
  for (let guard = 0; g.age(s) < 18 && guard < 100; guard++) {
    if (s.event) s = g.resolveEvent(s, 0);
    s = g.ageUp(s);
  }
  assert.equal(g.age(s), 18);
  assert.equal(g.salary(s), 0);
  assert.equal(s.school.enrolled, false);
  assert.ok(s.education.completed.includes("school"));
  assert.equal(s.calendar.sleep, 8);
  assert.ok(s.childhood.milestones.some((m) => m.id === "adult"));
  assert.equal(s.debug.used, false);
  assert.equal(g.restoreGame(JSON.stringify(s)).week, s.week);
});
test("age up pauses early for adult choices without silently selecting an option", () => {
  let s = adult();
  s = g.ageUp(s);
  assert.equal(s.week, 2);
  assert.ok(s.event);
  assert.equal(g.age(s), 23);
});
test("parent relationships cannot be treated as romantic partners", () => {
  const s = g.createGame({ seed: 1, age: 6 });
  const id = s.relationships[0].id;
  assert.throws(
    () => g.connect(s, id, true),
    /romantic|date|relationship|Parent/,
  );
  assert.throws(
    () => g.askExclusive(s, id),
    /relationship|romantic|friend|family|dating/,
  );
});
test("authentic v6 saves retain age, household, finances, milestones and existing progress", () => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/v6-save.json", import.meta.url),
      "utf8",
    ),
  );
  const s = g.restoreGame(JSON.stringify(old));
  assert.equal(s.version, g.VERSION);
  assert.equal(s.childhood.startedAtBirth, false);
  assert.equal(s.childhood.milestones.length, 0);
  for (const key of Object.keys(old).filter((k) => k !== "version"))
    assert.deepEqual(s[key], old[key], key);
});
test("save validation rejects malformed ages and childhood development", () => {
  for (const value of [-1, 0.5, NaN, 61])
    assert.throws(() => g.createGame({ age: value }), /age/);
  for (const change of [
    (s) => (s.childhood.development.language = 101),
    (s) => (s.childhood.lastAge = 1),
    (s) => (s.childhood.activities.fake = 0),
  ]) {
    const s = birth();
    change(s);
    assert.throws(() => g.restoreGame(JSON.stringify(s)), /childhood/);
  }
});
test("music purchases use shared cash and inventory and require an active path", () => {
  let s = adult();
  s = g.buyCareerEquipment(s, "music", "microphone");
  assert.equal(s.money, 12500 - 160);
  assert.ok(s.inventory.includes("microphone"));
  assert.throws(() => g.buy(s, "microphone"), /already/);
  assert.throws(
    () =>
      g.buyCareerEquipment(g.createGame({ age: 23 }), "music", "microphone"),
    /active/,
  );
  assert.throws(() => g.buyCareerEquipment(s, "music", "camera"), /active/);
  assert.equal(
    g.restoreGame(JSON.stringify(s)).inventory.includes("microphone"),
    true,
  );
});
test("studio upgrades improve actual project quality and charge recurring upkeep", () => {
  let base = g.buy(adult(), "laptop");
  base.music.role = "producer";
  base.music.sessions = 8;
  const ordinary = g.startMusicProject(base, { title: "Ordinary" });
  let upgraded = base;
  for (const id of ["audio-interface", "studio-monitors", "treated-studio"])
    upgraded = g.buyCareerEquipment(upgraded, "music", id);
  const project = g.startMusicProject(upgraded, { title: "Better room" });
  assert.equal(
    project.music.projects[0].quality,
    ordinary.music.projects[0].quality + 10,
  );
  assert.equal(g.expenses(upgraded), g.expenses(base) + 10);
  assert.equal(upgraded.money, base.money - 350 - 650 - 2500);
  assert.equal(base.inventory.length, 1);
});
test("professional studios enforce equipment and experience requirements through every purchase route", () => {
  let s = adult();
  s.money = 100000;
  assert.throws(() => g.buy(s, "professional-studio"), /Requires/);
  for (const id of [
    "workstation",
    "audio-interface",
    "studio-monitors",
    "treated-studio",
  ])
    s = g.buy(s, id);
  assert.throws(
    () => g.buyCareerEquipment(s, "music", "professional-studio"),
    /40 production|two released/,
  );
  s.music.skills.production = 40;
  s.music.releases = [{}, {}];
  s = g.buyCareerEquipment(s, "music", "professional-studio");
  assert.equal(g.musicStudioBonus(s), 17);
  assert.equal(g.expenses(s) - g.expenses(adult()), 114);
  assert.throws(
    () => g.buy(g.createGame({ age: 6, career: "music" }), "audio-interface"),
    /older/,
  );
});
test("debug specialist skill edits are exact, atomic, bounded and persist without activating careers", () => {
  const original = g.toggleDebug(birth(), true);
  const s = g.debugEdit(original, {
    specialistSkills: {
      "music.production": 84.5,
      "music.vocals": 71,
      "music.lyrics": 62,
      "football.ability": 77,
      "racing.discipline": 88,
      "social.contentSkill": 92,
      "childhood.curiosity": 66,
    },
  });
  assert.equal(s.music.skills.production, 84.5);
  assert.equal(s.music.active, false);
  assert.equal(s.football.ability, 77);
  assert.equal(s.sports.racing.discipline, 88);
  assert.equal(s.social.contentSkill, 92);
  assert.equal(s.childhood.development.curiosity, 66);
  assert.equal(g.restoreGame(JSON.stringify(s)).music.skills.production, 84.5);
  assert.equal(original.music.skills.production, 15);
  assert.ok(s.debug.edits[0].text.includes("production"));
  for (const specialistSkills of [
    { "music.production": 101 },
    { "music.production": NaN },
    { "music.fake": 50 },
    { "music.production": 50, "football.ability": -1 },
  ])
    assert.throws(() => g.debugEdit(original, { specialistSkills }), /Invalid/);
  assert.throws(
    () =>
      g.debugEdit(birth(), { specialistSkills: { "music.production": 50 } }),
    /Enable/,
  );
});
