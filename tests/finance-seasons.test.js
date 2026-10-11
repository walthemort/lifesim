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
const near = (a, b) =>
  assert.ok(Math.abs(a - b) < 0.011, `${a} differs from ${b}`);
function employed() {
  let s = fresh();
  s.applications.push({
    id: "test",
    vacancyId: "test",
    jobId: "office-0",
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: 650,
  });
  s = g.acceptJobOffer(s, "test");
  s.money = 100000;
  return s;
}
function offer(s, id = "football", jobId = "football-2") {
  const p = id === "football" ? s.football : s.sports[id];
  const o = {
    id: `${id}:test`,
    kind: "contract",
    club: "Riverside FC",
    jobId,
    pay: 3500,
    duration: 104,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  g.enhanceSportOffer(s, id, o);
  p.offers.push(o);
  return o;
}
function player() {
  let s = fresh({ career: "football" });
  s.money = 100000;
  s.football.ability = 85;
  s.football.discipline = 90;
  const o = offer(s);
  return g.acceptFootballOffer(s, o.id);
}
function event(s, id, index = 0) {
  s = clear(s);
  s.event = structuredClone(g.STORY_EVENTS.find((e) => e.id === id));
  return g.resolveEvent(s, index);
}
const plan = (s, hours) =>
  g.setCalendar(s, {
    mode: "custom",
    sleep: 8,
    hours: {
      ...Object.fromEntries(g.TIME_BLOCKS.map((k) => [k, 0])),
      ...hours,
    },
  });

test("progressive annual income tax has an allowance and marginal bands", () => {
  assert.equal(g.annualIncomeTax(12000), 0);
  assert.equal(g.annualIncomeTax(50000), 7600);
  assert.equal(g.annualIncomeTax(125000), 33850);
  assert.equal(g.annualIncomeTax(225000), 78850);
});
test("wages are taxed at source and pension contributions reduce taxable pay", () => {
  const s = employed(),
    r = next(s);
  near(r.money, s.money + g.salary(s) - g.expenses(s));
  assert.ok(r.banking.tax.earned > 0);
  near(r.banking.tax.lastWeekly, g.estimatedPayTax(s));
  const p = g.setPension(s, 5),
    rp = next(p);
  assert.ok(rp.banking.tax.lastWeekly < r.banking.tax.lastWeekly);
  assert.ok(rp.workLife.pension > 0);
});
test("youth allowance, principal transfers and unrealized price changes are not income", () => {
  let s = fresh({ age: 14 });
  s = next(s);
  assert.equal(s.banking.tax.earned, 0);
  assert.equal(s.banking.tax.lastWeekly, 0);
  s = employed();
  const before = g.netWorth(s);
  s = g.transferSavings(s, 10.01);
  near(g.netWorth(s), before);
  assert.equal(s.banking.tax.earned, 0);
  s.market.index *= 2;
  assert.equal(s.banking.tax.withheld, 0);
  assert.throws(() => g.transferSavings(s, 0.001));
});
test("savings need withdrawal to spend and interest is credited after investment tax", () => {
  let s = employed();
  s = g.transferSavings(s, 10000);
  const cash = s.money,
    nw = g.netWorth(s);
  assert.equal(s.banking.savings, 10000);
  assert.equal(s.money, cash);
  const r = next(s),
    gross = Math.round(((10000 * 0.03) / 52) * 100) / 100;
  near(r.banking.savings, 10000 + gross - Math.round(gross * 0.15 * 100) / 100);
  near(r.banking.tax.investment, gross);
  s = g.transferSavings(s, -1000);
  assert.equal(s.banking.savings, 9000);
  near(g.netWorth(s), nw);
  assert.throws(() => g.transferSavings(s, -10000), /balance/);
  assert.deepEqual(g.restoreGame(r), r);
});
test("weighted trading cost basis taxes realized gains and carries losses without taxing quotes", () => {
  let s = employed();
  const p = s.market.index;
  s = g.invest(s, "index", 10);
  near(s.banking.basis.index, p * 10);
  s.market.index = p * 1.5;
  s = g.invest(s, "index", -5);
  near(s.banking.basis.index, p * 5);
  near(s.banking.tax.capitalNet, p * 2.5);
  near(s.banking.tax.withheld, p * 2.5 * 0.15);
  s.market.index = 1;
  s = g.invest(s, "index", -5);
  assert.ok(s.banking.tax.capitalNet < 0);
  assert.equal(s.banking.basis.index, 0);
  const before = s.money,
    withheld = s.banking.tax.withheld;
  s.week = 52;
  g.advanceBanking(s, 0);
  near(s.money, before + withheld);
  assert.ok(s.banking.tax.capitalNet < 0);
  assert.equal(s.banking.tax.history[0].due, 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("year end reconciles multiple earnings against actual annual taxable income", () => {
  let s = fresh();
  const before = s.money;
  g.receiveIncome(s, 500, "earned");
  g.receiveIncome(s, 1000, "earned");
  assert.ok(s.banking.tax.withheld > 0);
  s.week = 52;
  g.advanceBanking(s, 0);
  assert.equal(s.money, before + 1500);
  assert.equal(s.banking.tax.history[0].due, 0);
  assert.equal(s.banking.tax.paid, 0);
  assert.equal(s.banking.tax.year, 1);
});
test("loan approvals require recorded stable earnings and affordability", () => {
  let s = employed();
  assert.equal(g.loanQuote(s, 5000, 104).eligible, false);
  s = weeks(g.setActivity(s, "rest"), 13);
  const q = g.loanQuote(s, 5000, 104);
  assert.equal(q.eligible, true, q.reasons.join(". "));
  assert.ok(q.apr > 0);
  assert.equal(g.loanQuote(s, 100000, 52).eligible, false);
  let poor = structuredClone(s);
  poor.banking.credit = 599;
  assert.ok(
    g.loanQuote(poor, 5000, 104).reasons.some((r) => r.includes("Credit")),
  );
  poor.banking.credit = 650;
  poor.employment.tenure = 26;
  poor = g.purchaseHome(poor, "starter", "mortgage");
  assert.equal(g.loanQuote(poor, 5000, 104).eligible, false);
});
test("a loan credits cash and a liability, costs a fee and amortizes at its fixed APR", () => {
  let s = weeks(g.setActivity(employed(), "rest"), 13);
  const before = g.netWorth(s),
    cash = s.money,
    q = g.loanQuote(s, 5000, 104);
  s = g.takeLoan(s, 5000, 104);
  near(s.money, cash + 5000 - q.fee);
  near(g.netWorth(s), before - q.fee);
  assert.equal(s.banking.tax.capitalNet, 0);
  const r = next(s);
  near(
    r.banking.loans[0].balance,
    Math.round(5000 * (1 + q.apr / 52) * 100) / 100 - q.payment,
  );
  assert.equal(r.banking.loans[0].apr, q.apr);
  s = g.repayLoan(r, r.banking.loans[0].id, r.banking.loans[0].balance);
  assert.equal(s.banking.loans[0].status, "repaid");
  near(g.netWorth(s), g.netWorth(r));
  assert.deepEqual(g.restoreGame(s), s);
});
test("missed loan payments remain debt through collections and can be repaid", () => {
  let s = weeks(g.setActivity(employed(), "rest"), 13);
  s = g.takeLoan(s, 5000, 104);
  s = g.resignJob(s);
  s.money = -100;
  s = weeks(s, 8);
  const l = s.banking.loans[0];
  assert.equal(l.status, "defaulted");
  assert.ok(l.balance > 5000);
  assert.ok(s.banking.credit < 600);
  assert.equal(g.loanQuote(s, 1000, 104).eligible, false);
  s.money = 100000;
  s = g.repayLoan(s, l.id, l.balance);
  assert.equal(s.banking.loans[0].status, "repaid");
  assert.equal(s.banking.loans[0].missed, 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("season calendars contain real league rounds, race dates and basketball double weeks", () => {
  const s = fresh();
  assert.equal(s.seasons.football.fixtures.length, 38);
  assert.equal(s.seasons.basketball.fixtures.length, 44);
  assert.equal(s.seasons.racing.fixtures.length, 22);
  assert.equal(s.seasons.tennis.fixtures.length, 26);
  const fs = s.seasons.football.fixtures;
  assert.equal(fs.filter((f) => f.home).length, 19);
  for (const f of fs)
    assert.equal(new Set(f.matches.flatMap((m) => [m.home, m.away])).size, 20);
  assert.ok(
    s.seasons.basketball.fixtures.some(
      (f, i, a) => i && a[i - 1].week === f.week,
    ),
  );
});
test("football results update every club coherently and rewards require actual appearances", () => {
  let s = player();
  s = next(s);
  const path = s.seasons.football,
    table = path.table;
  assert.equal(path.appearances, 1);
  assert.equal(s.football.matches, 1);
  assert.equal(path.fixtures[0].status, "played");
  assert.equal(
    table.reduce((n, t) => n + t.for, 0),
    table.reduce((n, t) => n + t.against, 0),
  );
  assert.equal(
    table.reduce((n, t) => n + t.wins, 0),
    table.reduce((n, t) => n + t.losses, 0),
  );
  for (const t of table) {
    assert.equal(t.played, 1);
    assert.equal(t.points, t.wins * 3 + t.draws);
  }
  assert.ok(s.banking.tax.lastGross > g.salary(s));
  assert.deepEqual(g.restoreGame(s), s);
});
test("poor selection, deliberate rest and injury keep team fixtures but deny personal bonuses", () => {
  let s = player();
  s.football.ability = 0;
  s.football.discipline = 0;
  s.energy = 0;
  let r = next(s);
  assert.equal(r.seasons.football.fixtures[0].status, "bench");
  assert.equal(r.football.matches, 0);
  assert.equal(r.banking.tax.lastGross, g.salary(s));
  s = player();
  s.football.injuryWeeks = 1;
  r = next(s);
  assert.equal(r.seasons.football.fixtures[0].status, "injured");
  assert.equal(r.football.injuryWeeks, 0);
  assert.equal(r.football.matches, 0);
  s = player();
  s = g.configureFootball(s, {
    position: s.football.position,
    training: "rest",
  });
  r = next(s);
  assert.equal(r.seasons.football.fixtures[0].status, "rest");
  assert.equal(r.football.matches, 0);
});
test("joining mid-campaign populates existing league results without granting personal appearances or cash", () => {
  let s = fresh();
  s.week = 20;
  const cash = s.money,
    seed = s.seed;
  s = g.joinFootball(s);
  assert.equal(s.seasons.football.table[0].played, 20);
  assert.equal(s.seasons.football.appearances, 0);
  assert.equal(s.football.matches, 0);
  assert.equal(s.money, cash);
  assert.equal(s.seed, seed);
  assert.equal(
    s.seasons.football.fixtures.filter((f) => f.status === "past").length,
    20,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("annual rollover keeps a bounded previous campaign and starts fresh standings", () => {
  let s = player();
  s = weeks(g.setActivity(s, "rest"), 52);
  assert.equal(s.seasons.football.year, 1);
  assert.equal(s.seasons.football.table[0].played, 0);
  assert.equal(s.seasons.football.history.length, 1);
  assert.ok(s.seasons.football.history[0].appearances > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("contract negotiation takes time, cannot be repeated and blocks signing while pending", () => {
  let s = fresh({ career: "football" });
  s.money = 100000;
  s.football.reputation = 100;
  const o = offer(s);
  s = g.negotiateSportOffer(s, "football", o.id, "security");
  assert.equal(s.football.offers[0].terms.negotiation.status, "pending");
  assert.throws(() => g.acceptFootballOffer(s, o.id), /negotiation/);
  assert.throws(
    () => g.negotiateSportOffer(s, "football", o.id, "security"),
    /one counter/,
  );
  s = weeks(s, 2);
  const n = s.football.offers.find((x) => x.id === o.id);
  assert.notEqual(n.terms.negotiation.status, "pending");
  if (n.terms.negotiation.status === "agreed") {
    assert.equal(n.pay, 3325);
    s = g.acceptFootballOffer(s, o.id);
    assert.equal(s.football.contract.expiresWeek, s.week + 156);
  }
  assert.deepEqual(g.restoreGame(s), s);
});
test("an agent charges disclosed recruitment and wage commission without creating a contract", () => {
  let s = fresh({ career: "football" });
  assert.throws(() => g.hireAgent(s, "football", "development"), /reputation/);
  s.football.reputation = 20;
  const cash = s.money;
  s = g.hireAgent(s, "football", "development");
  assert.equal(s.money, cash - 100);
  assert.equal(s.football.contract, null);
  const o = offer(s);
  s = g.acceptFootballOffer(s, o.id);
  near(g.agentCommission(s), 175);
  assert.ok(
    g.estimatedPayTax(s) < g.estimatedPayTax(g.dismissAgent(s, "football")),
  );
  const r = next(s);
  assert.deepEqual(g.restoreGame(r), r);
});
test("junior racing needs licence and reserves; sponsor support offsets costs without instant cash", () => {
  let s = fresh({ career: "racing", age: 18 });
  const o = offer(s, "racing", "racing-1");
  s.education.completed.push("racing-license");
  s.money = 100;
  assert.throws(() => g.acceptSportOffer(s, "racing", o.id), /cash reserves/);
  s.money = 10000;
  s.seasons.racing.sponsorOffers.push({
    id: "test",
    brand: "Test sponsor",
    annual: 15000,
    status: "offered",
    expiresWeek: 4,
  });
  const cash = s.money;
  s = g.acceptSportSponsor(s, "racing", "test");
  assert.equal(s.money, cash);
  s = g.acceptSportOffer(s, "racing", o.id);
  assert.equal(g.sportFundingCost(s, "racing"), 0);
  assert.equal(s.sports.racing.contract.annualFunding, 15000);
  assert.deepEqual(g.restoreGame(s), s);
});
test("racing sponsor reviews enforce appearances and delivered appearances extend support", () => {
  let s = fresh({ career: "racing", age: 18 });
  s.money = 100000;
  s.seasons.racing.sponsorOffers.push({
    id: "test",
    brand: "Test sponsor",
    annual: 15000,
    status: "offered",
    expiresWeek: 4,
  });
  s = g.acceptSportSponsor(s, "racing", "test");
  assert.throws(() => g.deliverSportAppearance(s, "racing"), /four weeks/);
  const missed = weeks(g.setActivity(s, "rest"), 13);
  assert.equal(missed.seasons.racing.sponsor.status, "cancelled");
  s = weeks(g.setActivity(s, "rest"), 9);
  s = g.deliverSportAppearance(s, "racing");
  assert.throws(() => g.deliverSportAppearance(s, "racing"), /once/);
  s = weeks(s, 4);
  assert.equal(s.seasons.racing.sponsor.status, "active");
  assert.equal(s.seasons.racing.sponsor.nextAppearanceWeek, 26);
  assert.deepEqual(g.restoreGame(s), s);
});
test("racing and tennis competitions rank the field and award championship points", () => {
  let s = fresh({ career: "racing", age: 18 });
  s.money = 100000;
  s.sports.racing.ability = 95;
  s.sports.racing.discipline = 90;
  s = weeks(s, 3);
  assert.equal(s.seasons.racing.appearances, 1);
  assert.equal(
    s.seasons.racing.table.reduce((n, t) => n + t.points, 0),
    101,
  );
  assert.ok(s.seasons.racing.fixtures[0].result.position >= 1);
  s = fresh({ career: "tennis" });
  s.money = 100000;
  s = next(s);
  assert.equal(s.seasons.tennis.appearances, 1);
  assert.equal(s.sports.tennis.events, 1);
  assert.deepEqual(g.restoreGame(s), s);
});
test("notice pays wages for eight weeks then ends only the affected employment contract", () => {
  let s = employed();
  s.employment.tenure = 52;
  s = event(s, "restructure", 2);
  assert.equal(s.stories.effects[0].until, 8);
  s = weeks(g.setActivity(s, "rest"), 7);
  assert.ok(s.employment);
  const gross = g.salary(s);
  s = next(s);
  assert.equal(s.employment, null);
  assert.ok(s.banking.tax.lastGross >= gross);
  assert.ok(
    s.stories.history.some((h) => h.text.includes("department closed")),
  );
  const xp = s.progress.office.weeks;
  s = next(s);
  assert.equal(s.banking.incomeHistory.at(-1).employmentIncome, 0);
  assert.equal(s.progress.office.weeks, xp);
  assert.deepEqual(g.restoreGame(s), s);
});
test("study grants discount tuition only with eight allocated hours and end when the course changes", () => {
  let s = g.enrolEducation(fresh(), "business-cert");
  s.money = 100000;
  s = event(s, "scholarship");
  s = plan(s, { study: 8 });
  const full = g.PROGRAMS.find((p) => p.id === "business-cert").tuition;
  assert.equal(g.tuitionDue(s), full / 2);
  const r = next(s);
  assert.equal(r.education.active.spent, full / 2);
  s = plan(s, { study: 0 });
  assert.equal(g.tuitionDue(s), full);
  s = g.withdrawEducation(s);
  s = next(s);
  assert.equal(s.stories.effects[0].status, "cancelled");
  assert.deepEqual(g.restoreGame(r), r);
});
test("a creative commission pays only after delivery; missed deadlines carry reputation consequences", () => {
  let s = event(fresh(), "collaboration");
  const effect = s.stories.effects[0],
    before = s.money;
  assert.equal(s.money, before);
  s.energy = 100;
  const paid = g.deliverStoryCommission(s, effect.id);
  assert.ok(["completed", "failed"].includes(paid.stories.effects[0].status));
  near(
    paid.money,
    before -
      25 +
      (paid.stories.effects[0].status === "completed"
        ? 500 - paid.banking.tax.lastWeekly
        : 0),
  );
  assert.throws(() => g.deliverStoryCommission(paid, effect.id));
  s = weeks(s, 4);
  assert.equal(s.stories.effects[0].status, "failed");
  assert.ok(
    s.stories.history.some((h) => h.text.includes("missed its deadline")),
  );
  assert.deepEqual(g.restoreGame(paid), paid);
});
test("temporary rent charges include their final week and moving ends the obligation", () => {
  let s = g.rentHome(fresh(), "studio");
  s = event(s, "rent-review", 1);
  assert.equal(g.storyWeeklyCosts(s), 25);
  s = weeks(g.setActivity(s, "rest"), 12);
  assert.equal(s.stories.effects[0].status, "active");
  const before = s.money,
    cost = g.expenses(s);
  s = next(s);
  near(s.money, before - cost);
  assert.equal(g.storyWeeklyCosts(s), 0);
  let moved = g.rentHome(fresh(), "studio");
  moved = event(moved, "rent-review", 0);
  moved = g.rentHome(moved, "shared");
  assert.equal(g.storyWeeklyCosts(moved), 0);
  moved = next(moved);
  assert.equal(moved.stories.effects[0].status, "cancelled");
});
test("partner training shifts real care hours and improves their own wages after thirteen weeks", () => {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("./fixtures/v5-save.json", import.meta.url)),
    ),
  );
  s = clear(s);
  s.money = 1000000;
  const id = s.family.partnerId,
    pay = s.connections.profiles[id].weeklyPay;
  s = event(s, "partner-career", 0);
  assert.equal(g.storyWeeklyHours(s), 4);
  s = weeks(g.setActivity(s, "rest"), 12);
  const currentPay = s.connections.profiles[id].weeklyPay;
  s = next(s);
  assert.equal(
    s.connections.profiles[id].weeklyPay,
    Math.round(currentPay * 1.1),
  );
  assert.ok(s.connections.profiles[id].weeklyPay > pay);
  assert.equal(g.storyWeeklyHours(s), 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("authentic v5 migration preserves the developed household and starts new ledgers without retrospective tax", () => {
  const raw = JSON.parse(
      fs.readFileSync(new URL("./fixtures/v5-save.json", import.meta.url)),
    ),
    s = g.restoreGame(raw);
  assert.equal(raw.version, 5);
  assert.equal(s.version, 6);
  for (const key of [
    "money",
    "employment",
    "family",
    "housing",
    "workLife",
    "calendar",
    "debug",
    "holdings",
  ])
    assert.deepEqual(s[key], raw[key], key);
  assert.equal(s.banking.savings, 0);
  assert.equal(s.banking.tax.paid, 0);
  assert.equal(s.stories.effects.length, 0);
  assert.ok(s.seasons.football.fixtures.length);
  assert.deepEqual(g.restoreGame(s), s);
});
test("save validation rejects forged finance, season and ongoing-event data and trusts catalogued event choices", () => {
  for (const mutate of [
    (s) => s.banking.loans.push({ id: "fake" }),
    (s) => (s.banking.credit = 999),
    (s) => (s.banking.basis.index = -1),
    (s) => (s.seasons.football.fixtures[0].matches[0].away = 100),
    (s) => (s.seasons.racing.sponsor = { annual: Infinity }),
    (s) => s.stories.effects.push({ kind: "free-money" }),
  ]) {
    const s = fresh();
    mutate(s);
    assert.throws(() => g.restoreGame(s));
  }
  let s = fresh();
  s.event = structuredClone(
    g.STORY_EVENTS.find((e) => e.id === "collaboration"),
  );
  s.event.options[0].money = 1e9;
  s = g.restoreGame(s);
  const cash = s.money;
  s = g.resolveEvent(s, 0);
  assert.equal(s.money, cash);
  assert.equal(s.stories.effects[0].fee, 500);
});

test("weekly amortization clears the small rounding residual on the final scheduled repayment", () => {
  let s = weeks(g.setActivity(employed(), "rest"), 13);
  s = g.takeLoan(s, 5000, 52);
  const opened = s.week;
  s = weeks(s, 52);
  assert.equal(s.week, opened + 52);
  assert.equal(s.banking.loans[0].status, "repaid");
  assert.equal(s.banking.loans[0].balance, 0);
  assert.equal(s.banking.loans[0].weeks, 0);
  assert.ok(s.banking.loans[0].paid > 5000);
});
test("child support episodes add care time or recurring costs and improve wellbeing for six weeks", () => {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("./fixtures/v5-save.json", import.meta.url)),
    ),
  );
  s.week = s.family.children[0].bornWeek + 7 * 52;
  s.money = 1000000;
  const care = event(s, "family-care", 0),
    help = event(s, "family-care", 1);
  assert.equal(g.storyWeeklyHours(care), 6);
  assert.equal(g.storyWeeklyCosts(help), 30);
  const plain = weeks(g.setActivity(clear(s), "rest"), 6),
    supported = weeks(g.setActivity(help, "rest"), 6);
  assert.ok(
    supported.family.children[0].wellbeing > plain.family.children[0].wellbeing,
  );
  assert.equal(supported.stories.effects[0].status, "completed");
  assert.equal(g.storyWeeklyCosts(supported), 0);
  assert.deepEqual(g.restoreGame(supported), supported);
});
test("notices do not dismiss a replacement employment contract", () => {
  let s = employed();
  s.employment.tenure = 52;
  s = event(s, "restructure", 2);
  s = g.resignJob(s);
  s.applications.push({
    id: "replacement",
    vacancyId: "test",
    jobId: "office-0",
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: 700,
  });
  s = g.acceptJobOffer(s, "replacement");
  s = weeks(g.setActivity(s, "rest"), 8);
  assert.equal(s.employment.jobId, "office-0");
  assert.equal(s.employment.weeklyPay, 700);
  assert.equal(s.stories.effects[0].status, "completed");
});
test("a sponsor covers the final contract week before its funding expires", () => {
  let s = fresh({ career: "racing", age: 18 });
  s.money = 100000;
  s.education.completed.push("racing-license");
  const o = offer(s, "racing", "racing-1");
  s = g.acceptSportOffer(s, "racing", o.id);
  s.seasons.racing.sponsor = {
    brand: "Test",
    annual: 15000,
    status: "active",
    expiresWeek: 52,
    nextAppearanceWeek: 65,
    lastAppearanceWeek: 48,
  };
  s.week = 52;
  assert.equal(g.sportFundingCost(s, "racing"), 0);
  g.advanceSeasons(s);
  assert.equal(s.seasons.racing.sponsor.status, "expired");
  assert.ok(g.sportFundingCost(s, "racing") > 0);
});

test("standings have unique club names and list the character as an individual competitor", () => {
  const s = player();
  assert.equal(new Set(s.seasons.football.table.map((t) => t.name)).size, 20);
  assert.equal(s.seasons.racing.table[0].name, s.name);
  assert.equal(s.seasons.tennis.table[0].name, s.name);
});

test("joining after the current round never leaves a skipped fixture scheduled or awards backdated appearances", () => {
  let s = fresh();
  s.week = 2;
  s = g.joinFootball(s);
  assert.deepEqual(
    s.seasons.football.fixtures.slice(0, 2).map((f) => f.status),
    ["past", "past"],
  );
  assert.equal(s.seasons.football.table[0].played, 2);
  assert.equal(s.football.matches, 0);
  s = next(s);
  assert.equal(s.seasons.football.table[0].played, 3);
  assert.equal(s.football.matches, 1);
  assert.equal(
    s.seasons.football.fixtures.filter(
      (f) => f.status === "scheduled" && f.week <= s.week,
    ).length,
    0,
  );
});
test("an injury in the first basketball game of a double week prevents playing the second", () => {
  let s = fresh({ seed: 458, career: "basketball" });
  s.money = 10000;
  s.sports.basketball.ability = 100;
  s.sports.basketball.discipline = 100;
  s = g.setSportTraining(s, "basketball", "fitness");
  s = next(s);
  assert.deepEqual(
    s.seasons.basketball.fixtures.slice(0, 2).map((f) => f.status),
    ["played", "injured"],
  );
  assert.equal(s.sports.basketball.events, 1);
  assert.equal(s.seasons.basketball.table[0].played, 2);
  assert.ok(s.sports.basketball.injuryWeeks > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
