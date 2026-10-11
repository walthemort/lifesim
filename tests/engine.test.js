import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  restoreGame,
  advanceWeek,
  resolveEvent,
  setActivity,
  chooseCareer,
  salary,
  expenses,
  portfolioValue,
  netWorth,
  buy,
  sellItem,
  invest,
  connect,
  meet,
  setTeamStrategy,
  configureCompany,
  age,
  CAREERS,
} from "../src/engine.js";

const fresh = (options) => createGame({ seed: 42, ...options });
function next(s) {
  if (s.event) s = resolveEvent(s, s.event.options.length - 1);
  return advanceWeek(s);
}

test("character creation applies personality, career cost, and selected city", () => {
  const s = fresh({
    name: "  Jamie  ",
    age: 24,
    city: "Copenhagen",
    trait: "Athletic",
    career: "racing",
  });
  assert.equal(s.name, "Jamie");
  assert.equal(age(s), 24);
  assert.equal(s.city, "Copenhagen");
  assert.equal(s.skills.athletics, 25);
  assert.equal(s.money, 11000);
  assert.equal(s.career, "racing");
});
test("a week earns salary, pays expenses, progresses skills, and never mutates the original", () => {
  const s = fresh(),
    original = structuredClone(s),
    result = advanceWeek(s);
  assert.equal(result.money, 12500 + 650 - 280);
  assert.equal(result.week, 1);
  assert.equal(result.skills.business, s.skills.business + 2);
  assert.equal(result.progress.office.weeks, 1);
  assert.equal(result.actions, 3);
  assert.deepEqual(s, original);
});
test("career promotion requires both skill and enough weeks", () => {
  let s = setActivity(fresh(), "focus");
  for (let i = 0; i < 11; i++) s = next(s);
  assert.equal(s.progress.office.level, 0);
  s = next(s);
  assert.equal(s.progress.office.level, 1);
  assert.equal(salary(s), 1050);
  s = fresh();
  s.progress.office.weeks = 20;
  s.skills.business = 5;
  s = advanceWeek(s);
  assert.equal(s.progress.office.level, 0);
});
test("each career can advance through all five tiers", () => {
  for (const career of Object.keys(CAREERS)) {
    let s = fresh({ career });
    s.skills[CAREERS[career].skill] = 100;
    s.energy = 100;
    s = setActivity(s, "rest");
    for (let i = 0; i < 48; i++) s = next(s);
    assert.equal(s.progress[career].level, 4, career);
    assert.equal(salary(s), CAREERS[career].pay[4]);
  }
});
test("career switching keeps existing experience and refuses unaffordable entry", () => {
  let s = next(fresh());
  s = chooseCareer(s, "football");
  assert.equal(s.progress.office.weeks, 1);
  s = chooseCareer(s, "office");
  assert.equal(s.progress.office.weeks, 1);
  s.money = 0;
  assert.throws(() => chooseCareer(s, "racing"), /more savings/);
});
test("a paid career remains unlocked even before its first week", () => {
  let s = chooseCareer(fresh(), "racing");
  const balance = s.money;
  s = chooseCareer(s, "office");
  s = chooseCareer(s, "racing");
  assert.equal(s.money, balance);
});
test("company setup, strategy, valuation, and career switching work together", () => {
  let s = fresh({ career: "business" });
  assert.equal(s.company.value, 2500);
  assert.equal(netWorth(s), 12500);
  s = configureCompany(s, {
    name: "Northstar Labs",
    sector: "Clean energy",
    strategy: "reinvest",
  });
  assert.equal(salary(s), 98);
  const grown = next(s);
  assert.notEqual(grown.company.value, s.company.value);
  assert.equal(grown.company.name, "Northstar Labs");
  const paused = next(chooseCareer(grown, "office"));
  assert.equal(paused.company.value, grown.company.value);
  assert.deepEqual(restoreGame(paused), paused);
  assert.throws(
    () =>
      configureCompany(s, {
        name: "",
        sector: "Clean energy",
        strategy: "reinvest",
      }),
    /name/,
  );
});
test("reinvestment grows a company faster than taking income on the same seed", () => {
  const s = fresh({ career: "business" }),
    options = { name: "Future Co", sector: "Technology" };
  const a = next(configureCompany(s, { ...options, strategy: "reinvest" })),
    b = next(configureCompany(s, { ...options, strategy: "dividends" }));
  assert.ok(a.company.value > b.company.value);
  assert.ok(a.money < b.money);
});
test("events block time until resolved and costs are enforced", () => {
  let s = next(next(fresh()));
  assert.ok(s.event);
  assert.throws(() => advanceWeek(s), /pending life choice/);
  const index = s.event.options.findIndex((o) => o.cost);
  if (index >= 0) {
    const broke = structuredClone(s);
    broke.money = 0;
    assert.throws(() => resolveEvent(broke, index), /Not enough cash/);
  }
  s = resolveEvent(s, s.event.options.length - 1);
  assert.equal(s.event, null);
  assert.equal(advanceWeek(s).week, 3);
});
test("identical seeds and choices reproduce identical market prices and events", () => {
  let a = fresh(),
    b = fresh();
  for (let i = 0; i < 20; i++) {
    a = next(a);
    b = next(b);
  }
  assert.deepEqual(a, b);
});
test("trades debit cash, value holdings, permit selling, and reject invalid quantities", () => {
  let s = invest(fresh(), "index", 10);
  assert.equal(s.money, 11300);
  assert.equal(portfolioValue(s), 1200);
  assert.equal(netWorth(s), 12500);
  s = invest(s, "index", -4);
  assert.equal(s.holdings.index, 6);
  assert.equal(s.money, 11780);
  for (const q of [0, 1.5, NaN, Infinity])
    assert.throws(() => invest(s, "index", q));
  assert.throws(() => invest(s, "index", -7), /more units/);
  assert.throws(() => invest(s, "index", 100000), /cash/);
});
test("market movements affect portfolio wealth without altering units held", () => {
  const s = invest(fresh(), "tech", 10),
    result = next(s);
  assert.equal(result.holdings.tech, 10);
  assert.notEqual(result.market.tech, s.market.tech);
  assert.equal(portfolioValue(result), result.market.tech * 10);
});
test("shopping rejects duplicate purchases and insufficient funds; resale recovers 80%", () => {
  let s = buy(fresh(), "watch");
  assert.equal(s.money, 12150);
  assert.ok(s.inventory.includes("watch"));
  assert.throws(() => buy(s, "watch"), /already own/);
  assert.throws(() => buy(s, "villa"), /cash/);
  s = sellItem(s, "watch");
  assert.equal(s.money, 12430);
  assert.equal(s.inventory.length, 0);
  assert.throws(() => sellItem(s, "watch"), /do not own/);
});
test("home ownership replaces rent and gym membership incurs weekly upkeep", () => {
  let s = fresh();
  s.money = 200000;
  s = buy(s, "apartment");
  assert.equal(expenses(s), 210);
  s = buy(s, "gym");
  assert.equal(expenses(s), 230);
  s = sellItem(s, "apartment");
  assert.equal(expenses(s), 300);
});
test("relationship actions cost time and money and reset each week", () => {
  let s = fresh();
  for (let i = 0; i < 3; i++) s = connect(s, "sam");
  assert.equal(s.actions, 0);
  assert.equal(s.money, 12425);
  assert.equal(s.relationships[0].bond, 100);
  assert.throws(() => connect(s, "sam"), /free-time actions/);
  s = next(s);
  assert.equal(s.actions, 3);
});
test("new relationships can become partners and spouses but require connection", () => {
  let s = meet(fresh());
  const id = s.relationships.at(-1).id;
  assert.throws(() => connect(s, id, true), /60 connection/);
  for (let i = 0; i < 6; i++) {
    if (!s.actions) s = next(s);
    s = connect(s, id);
  }
  if (!s.actions) s = next(s);
  s = connect(s, id, true);
  assert.equal(s.relationships.at(-1).role, "Partner");
  s = next(s);
  s.relationships.at(-1).bond = 95;
  s = connect(s, id, true);
  assert.equal(s.relationships.at(-1).role, "Spouse");
  s = meet(s);
  const other = s.relationships.at(-1);
  other.bond = 80;
  assert.throws(() => connect(s, other.id, true), /already in a relationship/);
  assert.throws(() => connect(s, "jordan", true), /not a romantic/);
});
test("club ownership creates a working weekly management simulation and can be sold", () => {
  let s = fresh();
  s.money = 1000000;
  s = buy(s, "football-team");
  s = setTeamStrategy(s, "development");
  const result = next(s);
  assert.equal(result.teams["football-team"].rating, 23);
  assert.equal(result.teams["football-team"].races, 1);
  assert.ok(Number.isFinite(result.teams["football-team"].profit));
  s = sellItem(result, "football-team");
  assert.equal(s.teams["football-team"], undefined);
  assert.equal(expenses(s), 280);
});
test("commercial team strategy increases revenue compared with balanced on same seed", () => {
  let s = fresh();
  s.money = 300000000;
  s = buy(s, "f1-team");
  const a = next(s),
    b = next(setTeamStrategy(s, "commercial"));
  assert.ok(b.teams["f1-team"].profit > a.teams["f1-team"].profit);
  assert.equal(b.teams["f1-team"].races, 1);
});
test("rest recovers energy and low energy harms health during demanding work", () => {
  let s = fresh();
  s.energy = 10;
  s.health = 70;
  const resting = next(setActivity(s, "rest")),
    working = next(setActivity(s, "focus"));
  assert.ok(resting.health > working.health);
  assert.equal(resting.energy, 28);
  assert.equal(working.energy, 2);
});
test("negative balances incur debt interest and remain recoverable through income", () => {
  const s = fresh();
  s.money = -1000;
  assert.equal(expenses(s), 285);
  const result = next(s);
  assert.equal(result.money, -635);
  assert.ok(result.log.some((l) => l.kind === "warning"));
});
test("saves round trip including investments, choices, inventory, and relationships", () => {
  let s = invest(fresh(), "index", 4);
  s = buy(s, "gym");
  s = meet(s);
  s = next(next(s));
  assert.deepEqual(restoreGame(JSON.stringify(s)), s);
});
test("corrupt and unsupported save files are rejected", () => {
  assert.throws(() => restoreGame("not json"));
  assert.throws(() => restoreGame({ version: 2 }));
  const mutations = [
    (s) => (s.money = "100"),
    (s) => (s.health = 500),
    (s) => (s.holdings.index = -1),
    (s) => (s.market.tech = NaN),
    (s) => (s.skills = null),
    (s) => (s.progress.office.level = 1.5),
    (s) => (s.relationships = []),
    (s) => (s.inventory = ["made-up"]),
    (s) => (s.event = { title: "fake" }),
    (s) => (s.marketHistory.index = []),
    (s) => (s.career = "constructor"),
    (s) => (s.activity = "toString"),
    (s) => (s.actions = 0.5),
  ];
  for (const mutate of mutations) {
    const s = fresh();
    mutate(s);
    assert.throws(() => restoreGame(s));
  }
});
test("imported events use trusted game choices rather than supplied rewards", () => {
  const s = next(next(fresh()));
  s.event.options[0].cost = -1000000;
  const loaded = restoreGame(s);
  assert.notEqual(loaded.event.options[0].cost, -1000000);
});
test("a life concludes at 90 and disallows further gameplay transactions", () => {
  let s = fresh({ age: 60 });
  s.week = 52 * 30 - 1;
  s = next(s);
  assert.equal(age(s), 90);
  assert.equal(s.ended, true);
  for (const fn of [
    advanceWeek,
    (s) => invest(s, "index", 1),
    (s) => buy(s, "watch"),
    meet,
    (s) => chooseCareer(s, "football"),
  ])
    assert.throws(() => fn(s), /life is complete/);
});
test("long runs keep histories bounded and stats finite", () => {
  let s = setActivity(fresh(), "rest");
  for (let i = 0; i < 300; i++) s = next(s);
  assert.equal(s.history.length, 52);
  assert.equal(s.marketHistory.index.length, 24);
  assert.ok(s.log.length <= 40);
  assert.ok(Number.isFinite(netWorth(s)));
  assert.deepEqual(restoreGame(s), s);
});
