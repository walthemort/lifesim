import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import {
  racingEntryReady,
  detailedRaceResult,
  racingLicenceReason,
} from "../src/simulation/racing.js";
function driver(age = 18) {
  let s = g.createGame({ age, seed: 8 });
  s.money = 1e7;
  s = g.joinSport(s, "racing");
  s = g.openRaceEngineering(s);
  return s;
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
function weekend() {
  let s = g.fundKartSeason(driver());
  s = next(s);
  const f = s.seasons.racing.fixtures.find(
    (f) => f.week > s.week && f.week <= s.week + 2,
  );
  s = g.startRaceWeekend(s, f.id);
  s = g.practiceRace(s);
  s = g.qualifyRace(s);
  return s;
}
test("kart budget is escrow with itemised actual payer costs", () => {
  let s = driver(10);
  const parent = s.relationships.find((p) => p.role === "Parent");
  s.connections.profiles[parent.id].wealth = 100000;
  const cash = s.money,
    wealth = s.connections.profiles[parent.id].wealth;
  s = g.fundKartSeason(s);
  const b = s.simulation.racing.seasons[0];
  assert.equal(b.total, b.entries + b.tyres + b.travel + b.repairs);
  assert.equal(s.money, cash);
  assert.equal(s.connections.profiles[parent.id].wealth, wealth - b.total);
  assert.equal(b.payer.id, parent.id);
  assert.deepEqual(g.restoreGame(s), s);
});
test("kart equipment changes actual specification, wear and funding", () => {
  let s = driver(),
    cash = s.money;
  s = g.chooseKartEquipment(s, "agile", "tuned");
  assert.equal(s.money, cash - 1550);
  assert.equal(s.simulation.racing.engine, "tuned");
  assert.throws(() => g.chooseKartEquipment(s, "agile", "tuned"), /already/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("practice and qualifying gate entry and completed laps feed the scheduled standings", () => {
  let s = weekend(),
    id = s.simulation.racing.current,
    f = s.seasons.racing.fixtures.find((f) => f.id === id);
  assert.equal(racingEntryReady(s, f), true);
  while (s.week < f.week) s = next(s);
  const w = s.simulation.racing.weekends[0];
  assert.equal(w.status, "complete");
  assert.ok(w.laps.length > 0);
  assert.equal(w.classification.length, s.seasons.racing.table.length);
  assert.ok(s.simulation.racing.components.engine < 100);
  assert.equal(
    s.seasons.racing.fixtures.find((f) => f.id === id).result.position,
    w.position,
  );
  assert.equal(s.simulation.racing.seasons[0].spent, w.cost);
  assert.deepEqual(g.restoreGame(s), s);
});
test("engineering feedback needs a reference run and setup has explicit valid ranges", () => {
  let s = driver();
  s = next(s);
  s = g.startRaceWeekend(
    s,
    s.seasons.racing.fixtures.find(
      (f) => f.week > s.week && f.week <= s.week + 2,
    ).id,
  );
  assert.throws(() => g.raceFeedback(s), /reference/);
  s = g.practiceRace(s);
  s = g.raceFeedback(s);
  assert.ok(s.simulation.racing.weekends[0].feedback.finding);
  assert.throws(() => g.configureRace(s, { balance: 100 }), /valid/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("component repairs cost real money and refresh only the selected component", () => {
  let s = driver();
  s.simulation.racing.components.engine = 30;
  s.simulation.racing.components.gearbox = 50;
  const cash = s.money;
  s = g.serviceRaceComponent(s, "engine");
  assert.equal(s.money, cash - 120);
  assert.equal(s.simulation.racing.components.engine, 100);
  assert.equal(s.simulation.racing.components.gearbox, 50);
  assert.deepEqual(g.restoreGame(s), s);
});
test("Super Licence points require real recorded formula results within three seasons", () => {
  let s = driver();
  assert.match(racingLicenceReason(s, "super-license"), /40/);
  s.week = 150;
  s.globalLife.racing.history = [
    { year: 1, tier: "f2", position: 1, points: 400, wins: 8, starts: 22 },
  ];
  g.advanceRacing(s);
  assert.equal(g.superLicencePoints(s), 40);
  assert.equal(racingLicenceReason(s, "super-license"), null);
  s.week = 260;
  g.advanceRacing(s);
  assert.equal(g.superLicencePoints(s), 0);
});
test("alternate disciplines change race format without earning formula licence points", () => {
  let s = driver();
  s = g.changeRacingDiscipline(s, "rally");
  assert.equal(s.simulation.racing.discipline, "rally");
  s.week = 46;
  s.globalLife.racing.history = [
    { year: 0, tier: "f2", position: 1, points: 400, wins: 8, starts: 22 },
  ];
  g.advanceRacing(s);
  assert.equal(g.superLicencePoints(s), 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("reserve placements require an international licence and do not promise a race seat", () => {
  let s = driver();
  assert.throws(() => g.beginReserveDuties(s), /international/);
  s.education.completed.push("international-license");
  s.sports.racing.ability = 100;
  s.sports.racing.reputation = 100;
  s.simulation.seed = 0;
  s = g.beginReserveDuties(s);
  assert.equal(s.simulation.racing.reserve.status, "active");
  s = next(s);
  s = g.deliverReserveDuties(s, "simulator");
  assert.equal(s.simulation.racing.reserve.delivered, 1);
  assert.equal(s.sports.racing.contract, null);
  assert.deepEqual(g.restoreGame(s), s);
});
test("changing a chassis cannot refresh an unchanged engine or refit free fresh parts", () => {
  let s = driver();
  s.simulation.racing.components.engine = 20;
  s = g.chooseKartEquipment(s, "agile", "club");
  assert.equal(s.simulation.racing.components.engine, 20);
  s = next(s);
  const cash = s.money;
  s = g.chooseKartEquipment(s, "balanced", "club");
  assert.equal(s.money, cash - 200);
  assert.equal(s.simulation.racing.components.engine, 20);
  assert.deepEqual(g.restoreGame(s), s);
});
test("component servicing can use the actual funded kart repair reserve", () => {
  let s = g.fundKartSeason(driver());
  s = next(s);
  s.simulation.racing.components.engine = 30;
  const cash = s.money,
    balance = s.simulation.racing.seasons[0].balance;
  s = g.serviceRaceComponent(s, "engine");
  assert.equal(s.money, cash);
  assert.equal(s.simulation.racing.seasons[0].balance, balance - 120);
  assert.equal(s.simulation.racing.seasons[0].transactions[0].repairs, 120);
  assert.deepEqual(g.restoreGame(s), s);
});
