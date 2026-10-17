import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import {
  receiveIncome,
  recordCapitalGain,
  startBankingWeek,
} from "../src/banking.js";
import { requiredHours } from "../src/calendar.js";
import { employmentIncome } from "../src/careers.js";
import { musician } from "./career-world-fixtures.js";

const fresh = (o = {}) => g.createGame({ age: 23, seed: 8, ...o });
const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
const next = (s) => clear(g.advanceWeek(clear(s)));
const weeks = (s, n) => {
  for (let i = 0; i < n; i++) s = next(s);
  return s;
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.011, `${a} != ${b}`);
const moveForFixture = (s, code) => {
  s.globalLife.residence.country = code;
  s.city = code === "DK" ? "Copenhagen" : code === "CH" ? "Zürich" : "London";
  s.globalLife.residence.city = s.city;
};
function couple() {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("./fixtures/v4-save.json", import.meta.url)),
    ),
  );
  s.money = 1e6;
  s = weeks(g.setActivity(s, "social"), 52);
  s.connections.profiles[s.family.partnerId].trust = 90;
  return clear(s);
}
function employed() {
  let s = fresh();
  s.applications.push({
    id: "fixture",
    vacancyId: "fixture",
    jobId: "office-0",
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: 650,
  });
  return g.acceptJobOffer(s, "fixture");
}

test("regional purchase quotes match debits and moving cannot inflate resale value", () => {
  let s = fresh();
  moveForFixture(s, "DK");
  const item = g.SHOP.find((i) => i.id === "phone");
  const cash = s.money,
    price = g.localPrice(s, item.price);
  s = g.buy(s, item.id);
  near(s.money, cash - price);
  moveForFixture(s, "CH");
  s = g.sellItem(s, item.id);
  near(s.money, cash - price * 0.2);
});

test("regional rental deposits and rents remain the agreed amounts after a move", () => {
  let s = fresh();
  moveForFixture(s, "DK");
  s = g.rentHome(s, "shared");
  const terms = structuredClone(s.realWorld.economy.rentalTerms);
  moveForFixture(s, "CH");
  assert.deepEqual(
    g.rentTerms(
      s,
      g.RENTALS.find((r) => r.id === "shared"),
    ),
    terms,
  );
  assert.deepEqual(g.restoreGame(s), s);
});

test("tax ledgers retain separate residence policies without taxing total income twice", () => {
  const s = fresh();
  receiveIncome(s, 20000);
  moveForFixture(s, "DK");
  receiveIncome(s, 30000);
  assert.equal(
    g.regionalTaxDue(s),
    g.countryIncomeTax(20000, "GB") + g.countryIncomeTax(30000, "DK"),
  );
  assert.equal(Object.keys(s.realWorld.economy.taxBuckets).length, 2);
});

test("imported tax-year income gets one allowance and keeps the original policy", () => {
  const s = fresh();
  s.banking.tax.earned = 20000;
  g.initializeRealism(s, { legacy: true });
  receiveIncome(s, 5000);
  assert.equal(Object.keys(s.realWorld.economy.taxBuckets).length, 1);
  assert.equal(g.regionalTaxDue(s), g.annualIncomeTax(25000));
});

test("investment losses offset subsequent gains across a tax-year boundary", () => {
  const s = fresh();
  recordCapitalGain(s, -1000);
  s.week = 53;
  startBankingWeek(s);
  const cash = s.money;
  recordCapitalGain(s, 600);
  near(s.money, cash);
  assert.equal(g.regionalTaxDue(s), 0);
  recordCapitalGain(s, 600);
  near(s.money, cash - 30);
  assert.equal(g.regionalTaxDue(s), 30);
});

for (const path of ["football", "racing", "basketball", "tennis"]) {
  test(`${path}: a top-level place only opens when an incumbent actually leaves`, () => {
    const s = fresh({ career: path });
    const a = s.realWorld.rivals.athletes.find(
      (a) => a.path === path && a.level === 4,
    );
    assert.equal(g.canRecruit(s, path, 4, a.club), false);
    a.contractUntil = 1;
    s.week = 1;
    g.prepareRivals(s);
    assert.equal(g.canRecruit(s, path, 4, a.club), true);
    const o = { club: a.club };
    g.bindRivalOffer(s, path, o, 4);
    assert.equal(o.rivalSlot, a.id);
    const p = path === "football" ? s.football : s.sports[path];
    p.contract = { expiresWeek: 105, jobId: `${path}-4` };
    p.club = a.club;
    g.claimRivalSeat(s, path, o);
    assert.equal(a.player, true);
    assert.throws(() => g.claimRivalSeat(s, path, o), /filled/);
  });
}

test("retirement opens a place immediately and injuries affect the actual racing field", () => {
  const s = fresh();
  const a = s.realWorld.rivals.athletes.find(
    (a) => a.path === "racing" && a.level === 4,
  );
  a.bornAge = 40;
  s.week = 1;
  g.prepareRivals(s);
  assert.equal(a.status, "retired");
  assert.equal(g.canRecruit(s, "racing", 4, a.club), true);
  const b = s.realWorld.rivals.athletes.find(
    (a) => a.path === "racing" && a.level === 1,
  );
  const healthy = g.rivalField(s, "racing", 1, b.field, 50);
  b.injuryUntil = 5;
  assert.ok(g.rivalField(s, "racing", 1, b.field, 50) < healthy);
});

test("joint deposits, withdrawals and separation conserve each person’s actual wealth", () => {
  let s = couple();
  s = g.rentHome(s, "family");
  s.relationships.find((r) => r.id === s.family.partnerId).bond = 90;
  s = g.moveInTogether(s);
  s = next(s);
  const id = s.family.partnerId;
  s.connections.profiles[id].wealth = 5000;
  const cash = s.money;
  s = g.openJointAccount(s);
  s = g.jointTransfer(s, { direction: "deposit", amount: 1000 });
  s = next(s);
  const partnerBefore = s.connections.profiles[id].wealth;
  s = g.jointTransfer(s, { direction: "partner", amount: 500 });
  near(s.connections.profiles[id].wealth, partnerBefore - 500);
  assert.equal(g.jointShare(s), 1000);
  assert.throws(
    () => g.jointTransfer(s, { direction: "withdraw", amount: 1001 }),
    /share/,
  );
  s = g.jointTransfer(s, { direction: "withdraw", amount: 250 });
  assert.equal(g.jointShare(s), 750);
  const playerBefore = s.money,
    pBefore = s.connections.profiles[id].wealth;
  const joint = s.realWorld.household.joint.balance;
  g.settleSeparation(s, id);
  near(s.money, playerBefore + 750 - 100);
  near(s.connections.profiles[id].wealth, pBefore + joint - 750);
  assert.equal(s.realWorld.household.joint, null);
  assert.ok(s.money < cash + 10000);
});

test("shared custody reduces care costs and unpaid support remains an actual debt", () => {
  let s = g.rentHome(couple(), "family");
  s = g.familyAction(s, "child", { name: "Robin" });
  s = weeks(s, 39);
  const before = g.householdCosts(s),
    id = s.family.partnerId;
  s = g.familyAction(clear(s), "breakup", { custody: "shared" });
  near(g.householdCosts(s), before / 2);
  const h = s.realWorld.household,
    a = h.support[0];
  a.weekly = 100;
  a.startsWeek = s.week;
  s.money = 0;
  s.connections.profiles[id].wealth = 0;
  s.week++;
  g.advanceRealism(s);
  assert.equal(a.arrears, 100);
  const net = g.netWorth(s);
  a.arrears = 0;
  near(g.netWorth(s), net + 100);
});

test("parental leave removes overtime, reduces pay, protects performance, then ends", () => {
  let s = employed();
  s.family.children.push({ id: "leave-child", name: "Alex", bornWeek: 0 });
  s.workLife.arrangement = "overtime";
  s = g.takeParentalLeave(s, 4);
  const performance = s.employment.performance,
    pay = employmentIncome(s);
  s = next(s);
  assert.equal(requiredHours(s).work, 0);
  near(employmentIncome(s), pay * 0.6);
  assert.equal(s.employment.performance, performance);
  s = weeks(s, 4);
  assert.equal(g.onParentalLeave(s), false);
  assert.ok(requiredHours(s).work > 0);
});

test("a product spends company capital and records customer revenue and delivery costs", () => {
  let s = fresh();
  s.money = 1e6;
  s.skills.business = 80;
  s = g.foundCompany(s, { name: "Small studio", sector: "Game studio" });
  s = next(s);
  const cash = s.company.cash;
  s = g.startBusinessProduct(s, {
    name: "First game",
    price: 30,
    scope: "lean",
  });
  const p = s.realWorld.products[0];
  assert.equal(s.company.cash, cash - p.budget);
  assert.equal(p.revenue, 0);
  p.progress = p.required;
  g.productTrading(s);
  assert.equal(p.status, "selling");
  const trade = g.productTrading(s);
  assert.equal(trade.revenue, p.sales * p.price);
  assert.equal(trade.costs, p.sales * p.unitCost);
  assert.ok(trade.revenue > 0);
  s = g.stopProduct(s, p.id);
  assert.deepEqual(g.productTrading(s), { revenue: 0, costs: 0 });
});

test("licensed beats cap distribution, split royalties, and require funded renewal", () => {
  let s = musician("rapper", 1);
  const release = s.music.releases[0];
  g.recordTrackRights(s, { beat: "lease" }, release);
  const rights = s.realWorld.rights[release.id];
  rights.streamLimit = release.totalStreams + 1;
  const producer = rights.producerPaid;
  s = next(s);
  assert.equal(s.music.releases[0].weeklyStreams, 1);
  near(s.realWorld.rights[release.id].producerPaid - producer, 0.0005);
  s = next(s);
  assert.equal(s.music.releases[0].weeklyStreams, 0);
  assert.equal(s.realWorld.rights[release.id].blocked, true);
  const cash = s.money;
  s = g.renewBeatLicence(s, release.id);
  assert.equal(s.money, cash - 100);
  assert.equal(s.realWorld.rights[release.id].blocked, false);
  s = next(s);
  assert.ok(
    s.music.releases[0].weeklyStreams > 0,
    "renewed permission resumes distribution",
  );
});

test("retiring from music keeps the owned catalogue and its royalty income", () => {
  let s = musician("producer", 1);
  s.music.releases[0].weeklyStreams = 1000;
  const income = s.music.totalIncome;
  s = g.retireMusic(s);
  s = next(s);
  assert.equal(s.music.active, false);
  assert.equal(s.realWorld.retiredMusic, true);
  assert.ok(s.music.totalIncome > income);
  assert.equal(s.music.releases.length, 1);
  assert.throws(() => g.practiseMusic(s), /Resume new music/);
  assert.throws(
    () => g.configureMusic(s, { role: "producer", genre: "Electronic" }),
    /Resume new music/,
  );
  assert.deepEqual(g.restoreGame(s), s);
});

test("producer and artist splits divide the actual streaming receipts once", () => {
  let s = musician("producer", 1);
  const r = s.music.releases[0];
  g.recordTrackRights(s, { beat: "lease" }, r);
  r.weeklyStreams = 1000;
  const income = s.music.totalIncome;
  s = next(s);
  const gross = s.music.releases[0].weeklyStreams * 0.002;
  near(
    s.realWorld.rights[r.id].producerPaid,
    Math.round(gross * 0.25 * 100) / 100,
  );
  near(s.music.totalIncome - income, Math.round(gross * 0.75 * 100) / 100);
});

test("retirement cannot abandon an already booked performance", () => {
  const s = musician("producer", 1);
  s.music.gigs.push({ id: "booked", status: "booked" });
  assert.throws(() => g.retireMusic(s), /booked performances/);
});

test("a local job offer pays the quoted salary without applying a second regional multiplier", () => {
  let offered;
  for (let seed = 1; seed <= 10; seed++) {
    let s = g.createGame({
      age: 23,
      seed,
      countryCode: "DK",
      city: "Copenhagen",
    });
    s = g.applyForJob(s, s.vacancies.find((v) => v.jobId === "office-0").id);
    s = weeks(s, 2);
    if (s.applications[0].status === "offer") {
      offered = s;
      break;
    }
  }
  assert.ok(
    offered,
    "a genuine local application succeeds for a deterministic seed",
  );
  const a = offered.applications[0],
    base = g.jobDefinition("office-0").pay;
  assert.ok(a.offeredPay >= Math.round(base * 1.25));
  const s = g.acceptJobOffer(offered, a.id);
  assert.equal(s.employment.weeklyPay, a.offeredPay);
});

test("custody keeps paying the locked regional rental rather than the base catalogue price", () => {
  let s = fresh({ countryCode: "DK", city: "Copenhagen" });
  s = g.rentHome(s, "shared");
  const rent = s.realWorld.economy.rentalTerms.rent;
  s.globalLife.crime.prison = { releaseWeek: s.week + 10 };
  const cash = s.money;
  s = g.advanceWeek(s);
  near(s.money, cash - rent);
});

test("v13 migration preserves every original field and introduces no invented spending or royalties", () => {
  const old = JSON.parse(
    fs.readFileSync(new URL("./fixtures/v13-save.json", import.meta.url)),
  );
  const s = g.restoreGame(old);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") assert.deepEqual(s[key], value, key);
  assert.equal(s.version, 14);
  assert.deepEqual(s.realWorld.products, []);
  assert.deepEqual(s.realWorld.rights, {});
  assert.equal(s.realWorld.household.joint, null);
  assert.deepEqual(g.restoreGame(s), s);
});

test("save import rejects corrupted new financial, household, rival and licence records", () => {
  for (const corrupt of [
    (s) => (s.realWorld.economy.taxBuckets.bad = null),
    (s) =>
      (s.realWorld.economy.taxBuckets.bad = {
        year: 0,
        country: "XX",
        earned: 0,
        investment: 0,
        capital: 0,
        withheld: 0,
        legacy: false,
      }),
    (s) =>
      (s.realWorld.economy.rentalTerms = {
        id: "shared",
        rent: -100,
        deposit: 100,
        country: "GB",
      }),
    (s) => s.realWorld.household.support.push(null),
    (s) => s.realWorld.household.separations.push({}),
    (s) => (s.realWorld.rivals.athletes[0].ability = Infinity),
    (s) =>
      (s.realWorld.rights.fake = {
        id: "fake",
        ownerShare: 1,
        producerShare: 1,
      }),
  ]) {
    const s = fresh();
    corrupt(s);
    assert.throws(() => g.restoreGame(s));
  }
});

test("import rejects malformed customer reviews and rival history before rendering", () => {
  let s = fresh();
  s.money = 1e6;
  s.skills.business = 80;
  s = g.foundCompany(s, { name: "Import studio", sector: "Game studio" });
  s = g.startBusinessProduct(s, { name: "Catalogue item", price: 30 });
  s.realWorld.products[0].reviews.push({
    week: 0,
    rating: "<img src=x onerror=alert(1)>",
  });
  assert.throws(() => g.restoreGame(s));
  const rival = fresh();
  rival.realWorld.rivals.history.push({ week: 0, text: null });
  assert.throws(() => g.restoreGame(rival));
  const date = fresh();
  date.realWorld.rivals.athletes[0].contractUntil = 1e15;
  assert.throws(() => g.restoreGame(date));
});
