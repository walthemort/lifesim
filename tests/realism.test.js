import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
const fresh = (options) => g.createGame({ seed: 1, ...options });
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return g.advanceWeek(s);
}
function steps(s, count) {
  for (let i = 0; i < count; i++) s = next(s);
  return s;
}
function employed() {
  let s = fresh();
  s = g.applyForJob(s, s.vacancies.find((v) => v.jobId === "office-0").id);
  s = steps(s, 2);
  assert.equal(s.applications[0].status, "offer");
  return g.acceptJobOffer(s, s.applications[0].id);
}
function vacancy(s, jobId, exceptional = false) {
  const v = {
    id: `${jobId}:${s.week}`,
    jobId,
    postedWeek: s.week,
    expiresWeek: s.week + 4,
    exceptional,
  };
  s.vacancies.push(v);
  return v;
}
function forSale(s, targetId, stake = 100) {
  const o = {
    id: `sale:${targetId}:${s.week}`,
    targetId,
    stake,
    askingPrice: Math.round(((g.assetValue(s, targetId) * stake) / 100) * 1.05),
    expiresWeek: s.week + 6,
  };
  s.opportunities.push(o);
  return o;
}
function willingBoard(s, targetId) {
  const n = {
    id: `meeting:${targetId}:${s.week}`,
    targetId,
    status: "open",
    requestedWeek: s.week,
    decisionWeek: s.week + 2,
    expiresWeek: s.week + 8,
    fee: 1000,
    minimumPremium: 1.2,
  };
  s.negotiations.push(n);
  return n;
}

test("a career interest does not give a new character a contract or free qualification", () => {
  const s = fresh({
    name: " Jamie ",
    age: 24,
    city: "Copenhagen",
    trait: "Athletic",
    career: "racing",
  });
  assert.equal(s.name, "Jamie");
  assert.equal(s.city, "Copenhagen");
  assert.equal(s.skills.athletics, 25);
  assert.equal(s.money, 12500);
  assert.equal(s.career, "unemployed");
  assert.equal(s.aspiration, "racing");
  assert.equal(g.salary(s), 0);
  assert.throws(() => g.chooseCareer(s, "racing"), /Apply for/);
  assert.throws(
    () => fresh({ education: "business-degree", age: 18 }),
    /age of at least 21/,
  );
  const original = structuredClone(s),
    result = next(s);
  assert.equal(result.money, 12220);
  assert.equal(result.progress.racing.weeks, 0);
  assert.deepEqual(s, original);
});
test("applications enforce qualifications, experience, skill, and closing dates", () => {
  const s = fresh(),
    v = vacancy(s, "office-2");
  assert.equal(g.jobEligibility(s, v).eligible, false);
  assert.throws(() => g.applyForJob(s, v.id), /Missing requirements/);
  s.education.completed.push("business-degree");
  s.skills.business = 70;
  assert.throws(() => g.applyForJob(s, v.id), /156 weeks/);
  s.progress.office.weeks = 156;
  assert.equal(g.jobEligibility(s, v).eligible, true);
  v.expiresWeek = s.week;
  assert.throws(() => g.applyForJob(s, v.id), /closed/);
});
test("a degree satisfies a certificate requirement in the same field, while unrelated degrees do not", () => {
  const s = fresh({ age: 21, education: "business-degree" });
  s.skills.business = 45;
  s.progress.office.weeks = 52;
  const coordinator = vacancy(s, "office-1");
  assert.equal(g.jobEligibility(s, coordinator).eligible, true);
  assert.equal(
    g.applyForJob(s, coordinator.id).applications[0].status,
    "pending",
  );
  s.skills.finance = 45;
  const investment = vacancy(s, "investor-0");
  assert.equal(g.jobEligibility(s, investment).eligible, false);
  s.education.completed.push("finance-degree");
  assert.equal(g.jobEligibility(s, investment).eligible, true);
});
test("applications cost time, take two weeks, and require accepting a separate offer", () => {
  let s = fresh(),
    id = s.vacancies.find((v) => v.jobId === "office-0").id;
  s = g.applyForJob(s, id);
  assert.equal(s.actions, 2);
  assert.equal(s.employment, null);
  assert.equal(s.applications[0].status, "pending");
  assert.throws(() => g.applyForJob(s, id), /already applied/);
  s = next(s);
  assert.equal(s.applications[0].status, "pending");
  s = next(s);
  assert.equal(s.applications[0].status, "offer");
  assert.equal(s.employment, null);
  s = g.acceptJobOffer(s, s.applications[0].id);
  assert.equal(g.salary(s), s.applications[0].offeredPay);
  assert.equal(s.employment.tenure, 0);
});
test("qualified candidates can be rejected and successful offers expire", () => {
  let s = fresh({ seed: 42 });
  s = g.applyForJob(s, s.vacancies.find((v) => v.jobId === "office-0").id);
  s = steps(s, 2);
  assert.equal(s.applications[0].status, "rejected");
  assert.equal(s.employment, null);
  s = fresh();
  const initial = s.vacancies.map((v) => v.id);
  s = g.applyForJob(s, initial[0]);
  s = steps(s, 6);
  assert.equal(s.applications[0].status, "expired");
  assert.ok(s.vacancies.every((v) => !initial.includes(v.id)));
  assert.throws(
    () => g.acceptJobOffer(s, s.applications[0].id),
    /no longer available/,
  );
});
test("contract wages and relevant experience persist without automatic role promotion", () => {
  let s = employed(),
    pay = g.salary(s),
    cash = s.money;
  s = next(s);
  assert.equal(s.money, cash + pay - 280);
  assert.equal(s.progress.office.weeks, 1);
  s.skills.business = 100;
  s.progress.office.weeks = 1000;
  s = steps(g.setActivity(s, "rest"), 12);
  assert.equal(s.employment.jobId, "office-0");
  assert.equal(s.progress.office.level, 0);
  const xp = s.progress.office.weeks;
  s = g.resignJob(s);
  assert.equal(g.salary(s), 0);
  assert.equal(s.progress.office.weeks, xp);
  assert.ok(s.education.completed.includes("school"));
});
test("raises depend on sustained performance and have enforced cooldowns", () => {
  const original = employed();
  original.week = original.employment.nextRaiseWeek;
  original.employment.performance = 100;
  original.skills.charisma = 100;
  let approved = false;
  for (let seed = 1; seed < 15; seed++) {
    const s = structuredClone(original);
    s.seed = seed;
    const r = g.requestRaise(s);
    if (r.employment.weeklyPay > s.employment.weeklyPay) {
      approved = true;
      assert.equal(r.employment.jobId, s.employment.jobId);
      assert.equal(r.actions, s.actions - 1);
      assert.throws(() => g.requestRaise(r), /next salary discussion/);
      break;
    }
  }
  assert.ok(approved);
  const poor = structuredClone(original);
  poor.employment.performance = 30;
  const r = g.requestRaise(poor);
  assert.equal(r.employment.weeklyPay, poor.employment.weeklyPay);
  assert.equal(r.employment.nextRaiseWeek, poor.week + 26);
});
test("excellent annual reviews increase pay in the same job", () => {
  const s = employed();
  s.employment.tenure = 51;
  s.employment.performance = 100;
  s.skills.business = 100;
  s.energy = 100;
  const r = next(s);
  assert.ok(r.employment.weeklyPay > s.employment.weeklyPay);
  assert.equal(r.employment.jobId, s.employment.jobId);
});
test("a situational vacancy accepts unconventional qualified applicants but not everyone", () => {
  const s = fresh({ education: "none", trait: "Social" }),
    v = vacancy(s, "breakthrough", true);
  assert.equal(g.jobEligibility(s, v).eligible, true);
  assert.equal(g.applyForJob(s, v.id).applications[0].exceptional, true);
  const weak = fresh({ education: "none" }),
    unusual = vacancy(weak, "breakthrough", true);
  assert.equal(g.jobEligibility(weak, unusual).eligible, false);
  let discovered = false;
  for (let seed = 1; seed < 160 && !discovered; seed++) {
    let candidate = fresh({ seed, trait: "Social" });
    candidate.relationships[0].bond = 100;
    candidate = next(candidate);
    discovered = candidate.vacancies.some((v) => v.exceptional);
  }
  assert.ok(discovered);
});
test("study takes calendar time, charges tuition, and awards credentials only at completion", () => {
  const s = g.enrolEducation(fresh(), "business-cert"),
    a = next(g.setActivity(s, "study")),
    b = next(s);
  assert.equal(a.education.active.progress, 1);
  assert.equal(b.education.active.progress, 0.5);
  assert.equal(a.money, s.money - 280 - 35);
  assert.equal(a.education.active.spent, 35);
  assert.ok(!a.education.completed.includes("business-cert"));
  assert.equal(g.expenses(s), 315);
  let student = g.setActivity(
    g.enrolEducation(employed(), "business-cert"),
    "rest",
  );
  student = steps(student, 51);
  assert.equal(student.education.active.progress, 25.5);
  assert.ok(!student.education.completed.includes("business-cert"));
  student = next(student);
  assert.equal(student.education.active, null);
  assert.ok(student.education.completed.includes("business-cert"));
});
test("study prerequisites, concurrency, funding pauses, and withdrawal are enforced", () => {
  assert.throws(
    () => g.enrolEducation(fresh({ education: "none" }), "business-degree"),
    /need/,
  );
  let s = g.enrolEducation(fresh(), "business-cert");
  assert.throws(() => g.enrolEducation(s, "finance-cert"), /current programme/);
  s.money = 100;
  s = next(s);
  assert.equal(s.education.active.paused, true);
  assert.equal(s.education.active.progress, 0);
  s.money = 1000;
  s = next(s);
  assert.equal(s.education.active.paused, false);
  assert.equal(s.education.active.progress, 0.5);
  s = g.withdrawEducation(s);
  assert.equal(s.education.active, null);
  assert.ok(!s.education.completed.includes("business-cert"));
});
test("racing licensing and high-level competition experience cannot be bypassed", () => {
  const s = fresh();
  s.skills.driving = 100;
  const v = vacancy(s, "racing-4");
  assert.throws(() => g.applyForJob(s, v.id), /licence/);
  assert.throws(() => g.enrolEducation(s, "super-license"), /International/);
  s.education.completed.push("racing-license", "international-license");
  assert.throws(() => g.enrolEducation(s, "super-license"), /208 weeks/);
});
test("startup capital is required and founder drawings cannot exceed actual profit and cash", () => {
  let s = fresh();
  assert.throws(
    () => g.foundCompany(s, { name: "Future Co", sector: "Technology" }),
    /30 business/,
  );
  s.skills.business = 35;
  s = g.foundCompany(s, { name: "Future Co", sector: "Technology" });
  assert.equal(s.money, 7500);
  assert.equal(g.netWorth(s), 12500);
  assert.equal(g.salary(s), 5);
  s.company.profit = -100;
  assert.equal(g.salary(s), 0);
  s.company.profit = 100;
  s.company.cash = 20;
  assert.equal(g.salary(s), 20);
  s = g.configureCompany(s, {
    name: "Future Co",
    sector: "Technology",
    strategy: "reinvest",
  });
  assert.equal(g.salary(s), 0);
});
test("a side business preserves employment and remains active", () => {
  let s = employed();
  s.skills.business = 35;
  const pay = g.salary(s);
  s = g.foundCompany(s, { name: "Northstar", sector: "Clean energy" });
  assert.equal(s.career, "office");
  assert.equal(g.salary(s), pay);
  s = next(s);
  assert.ok(Number.isFinite(s.company.profit));
  assert.deepEqual(g.restoreGame(s), s);
});
test("quarterly side-business distributions follow the selected strategy and leave retained profits in company cash", () => {
  for (const [strategy, share] of [
    ["reinvest", 0],
    ["balanced", 0.25],
    ["dividends", 0.5],
  ]) {
    let s = employed();
    if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
    s.skills.business = 35;
    s = g.foundCompany(s, { name: "Northstar", sector: "Technology" });
    s = g.configureCompany(s, { ...s.company, strategy });
    s.week = 12;
    s.company.periodProfit = 1000;
    const cash = s.money,
      businessCash = s.company.cash;
    const r = next(s);
    const payout = Math.round((1000 + r.company.profit) * share * 100) / 100;
    assert.equal(r.money, cash + g.salary(s) - 280 + payout);
    assert.ok(
      Math.abs(r.company.cash - (businessCash + r.company.profit - payout)) <
        0.000001,
    );
    assert.equal(r.company.periodProfit, 0);
    assert.equal(r.employment.jobId, s.employment.jobId);
    assert.deepEqual(g.restoreGame(r), r);
  }
});
test("crypto supports fractions while public shares have liquidity and ownership limits", () => {
  let s = g.invest(fresh(), "crypto", 0.1);
  assert.equal(s.holdings.crypto, 0.1);
  s = g.invest(s, "crypto", -0.05);
  assert.equal(s.holdings.crypto, 0.05);
  assert.throws(() => g.invest(s, "tech", 0.5), /whole number/);
  assert.throws(() => g.invest(s, "crypto", 0.00000001), /six decimal/);
  assert.throws(() => g.invest(s, "crypto", 0.000001), /minimum trade/);
  s.money = 1e10;
  const volume = g.MARKETS.find((m) => m.id === "tech").volume;
  s = g.invest(s, "tech", volume);
  assert.throws(() => g.invest(s, "tech", 1), /liquidity/);
  s = next(s);
  assert.equal(s.tradeVolumes.tech, 0);
  assert.equal(g.invest(s, "tech", 1).holdings.tech, volume + 1);
});
test("listed shares represent real stakes, count once, and require majority for control", () => {
  let s = g.invest(fresh(), "tech", 10);
  assert.equal(g.stakePercent(s, "horizon"), (10 / 100000000) * 100);
  assert.equal(g.netWorth(s), 12500);
  assert.throws(
    () => g.setBusinessStrategy(s, "horizon", "commercial"),
    /controlling stake/,
  );
  s.holdings.tech = 50000000;
  s.money = 1000;
  assert.throws(
    () => g.setBusinessStrategy(s, "horizon", "commercial"),
    /above 50/,
  );
  s = g.invest(s, "tech", 1);
  s = g.setBusinessStrategy(s, "horizon", "commercial");
  assert.equal(s.businessResults.horizon.strategy, "commercial");
  s = g.invest(s, "tech", -1);
  assert.equal(s.businessResults.horizon.strategy, "balanced");
});
test("profitable public issuers and funds pay quarterly income; crypto has no dividend", () => {
  let s = fresh();
  s = g.invest(s, "tech", 100);
  s = g.invest(s, "bonds", 10);
  s = g.invest(s, "crypto", 1);
  s.week = 12;
  const units = structuredClone(s.holdings);
  s = next(s);
  assert.deepEqual(s.holdings, units);
  assert.ok(
    s.log.some((l) =>
      l.text.includes("Horizon Technologies paid you a quarterly dividend"),
    ),
  );
  assert.ok(s.log.some((l) => l.text.includes("GOVT distributed")));
  assert.ok(!s.log.some((l) => l.text.includes("NOVA distributed")));
});
test("clubs cannot be bought in the lifestyle shop and sale windows are occasional", () => {
  const s = fresh();
  s.money = 1e10;
  assert.throws(() => g.buy(s, "football-team"), /sale opportunity/);
  assert.throws(() => g.buy(s, "f1-team"), /acquisition offer/);
  assert.equal(s.opportunities.length, 0);
  let generated = false;
  for (let seed = 1; seed < 100 && !generated; seed++) {
    let candidate = fresh({ seed });
    candidate.week = 12;
    candidate = next(candidate);
    generated = candidate.opportunities.length > 0;
  }
  assert.ok(generated);
  let candidate = fresh();
  const o = forSale(candidate, "cafe");
  candidate.week = o.expiresWeek;
  assert.throws(() => g.acquireOpportunity(candidate, o.id), /closed/);
  candidate = next(candidate);
  assert.ok(!candidate.opportunities.some((p) => p.id === o.id));
});
test("a funded sale opportunity transfers club ownership and activates management", () => {
  let s = fresh();
  s.money = 2000000;
  const o = forSale(s, "football-team");
  s = g.acquireOpportunity(s, o.id);
  assert.equal(g.stakePercent(s, "football-team"), 100);
  assert.equal(s.money, 2000000 - o.askingPrice);
  assert.ok(s.teams["football-team"]);
  assert.ok(!s.inventory.includes("football-team"));
  s = g.setBusinessStrategy(s, "football-team", "development");
  s = next(s);
  assert.equal(s.teams["football-team"].races, 1);
  assert.equal(s.businessResults["football-team"].strategy, "development");
  assert.deepEqual(g.restoreGame(s), s);
});
test("minority private holdings earn dividends without granting management control", () => {
  let s = fresh();
  s.money = 1000000;
  const o = forSale(s, "cafe", 25);
  s = g.acquireOpportunity(s, o.id);
  assert.equal(g.stakePercent(s, "cafe"), 25);
  assert.throws(
    () => g.setBusinessStrategy(s, "cafe", "commercial"),
    /controlling/,
  );
  s.week = 12;
  s.businessResults.cafe.periodProfit = 10000;
  s = next(s);
  assert.ok(
    s.log.some((l) =>
      l.text.includes("Maple & Main Coffee paid you a quarterly dividend"),
    ),
  );
  assert.ok(g.privateOwnershipValue(s) > 0);
});
test("introduction fees are non-refundable, owners may refuse, and repeat approaches have cooldowns", () => {
  let s = fresh();
  s.money = 1000000;
  const fee = g.meetingFee(s, "cafe"),
    cash = s.money;
  s = g.requestBoardMeeting(s, "cafe");
  assert.equal(s.money, cash - fee);
  assert.equal(s.negotiations[0].status, "meeting");
  assert.throws(() => g.requestBoardMeeting(s, "cafe"), /26 weeks/);
  s = steps(s, 2);
  assert.ok(["open", "refused"].includes(s.negotiations[0].status));
  assert.equal(s.money, cash - fee - 560);
  let refused = false;
  for (let seed = 1; seed < 30 && !refused; seed++) {
    let candidate = fresh({ seed });
    candidate.money = 1e9;
    candidate = g.requestBoardMeeting(candidate, "f1-team");
    candidate = steps(candidate, 2);
    refused = candidate.negotiations[0].status === "refused";
  }
  assert.ok(refused);
});
test("a low acquisition bid is rejected and releases committed funds", () => {
  let s = fresh();
  s.money = 1000000;
  const n = willingBoard(s, "cafe");
  assert.throws(
    () => g.submitAcquisitionOffer(s, n.id, 0.5, 100),
    /at least \$1/,
  );
  assert.throws(
    () => g.submitAcquisitionOffer(s, n.id, 10000.001, 100),
    /nearest cent/,
  );
  s = g.submitAcquisitionOffer(s, n.id, 10000, 100);
  assert.equal(g.reservedCash(s), 10000);
  s = steps(s, 2);
  assert.equal(s.negotiations[0].status, "rejected");
  assert.equal(g.reservedCash(s), 0);
  assert.equal(g.stakePercent(s, "cafe"), 0);
});
test("premium offers reserve funds, require acceptance and closing, then transfer control", () => {
  let s = fresh();
  s.money = 1000000;
  const n = willingBoard(s, "cafe");
  s = g.submitAcquisitionOffer(s, n.id, 400000, 100);
  assert.equal(g.availableCash(s), 600000);
  assert.throws(() => g.completeAcquisition(s, n.id), /cannot be completed/);
  s = steps(s, 2);
  assert.equal(s.negotiations[0].status, "accepted");
  s = g.completeAcquisition(s, n.id);
  assert.equal(g.stakePercent(s, "cafe"), 100);
  assert.equal(g.reservedCash(s), 0);
  assert.equal(s.money, 599440);
  assert.deepEqual(g.restoreGame(s), s);
});
test("bid commitments prevent double spending and can be withdrawn or expire", () => {
  let s = fresh();
  const n = willingBoard(s, "cafe");
  s = g.submitAcquisitionOffer(s, n.id, 12400, 25);
  assert.equal(g.availableCash(s), 100);
  assert.throws(() => g.buy(s, "watch"), /cash/);
  assert.throws(() => g.invest(s, "tech", 2), /uncommitted/);
  s = g.cancelOffer(s, n.id);
  assert.equal(g.availableCash(s), 12500);
  s = fresh();
  s.money = 1000000;
  const bid = willingBoard(s, "cafe");
  s = g.submitAcquisitionOffer(s, bid.id, 400000, 100);
  s = steps(s, 2);
  assert.equal(s.negotiations[0].status, "accepted");
  s = steps(s, 3);
  assert.equal(s.negotiations[0].status, "expired");
  assert.equal(g.reservedCash(s), 0);
});
test("a negotiated public-company block credits the same stock-market shares", () => {
  let s = fresh();
  s.money = 3e9;
  const n = willingBoard(s, "horizon");
  s = g.submitAcquisitionOffer(s, n.id, 2e9, 10);
  s = steps(s, 2);
  assert.equal(s.negotiations[0].status, "accepted");
  s = g.completeAcquisition(s, n.id);
  assert.equal(s.holdings.tech, 10000000);
  assert.equal(g.stakePercent(s, "horizon"), 10);
  assert.equal(g.privateOwnershipValue(s), 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("private controlling owners can inject capital without creating personal cash", () => {
  let s = fresh();
  s.money = 1000000;
  const o = forSale(s, "cafe");
  s = g.acquireOpportunity(s, o.id);
  const cash = s.money,
    reserve = s.businessResults.cafe.cash,
    value = g.assetValue(s, "cafe");
  s = g.injectCapital(s, "cafe", 10000);
  assert.equal(s.money, cash - 10000);
  assert.equal(s.businessResults.cafe.cash, reserve + 10000);
  assert.equal(g.assetValue(s, "cafe"), value + 10000);
});
test("collectibles need live listings, cannot be spent as cash, and sell through uncertain auctions", () => {
  let s = fresh();
  s.collectibles.listings = [
    {
      id: "watch-lot",
      collectibleId: "vintage-watch",
      price: 4700,
      expiresWeek: 4,
    },
  ];
  s = g.buyCollectible(s, "watch-lot");
  assert.equal(s.money, 7800);
  assert.equal(g.collectibleValue(s), 4500 * 0.92);
  assert.equal(s.collectibles.listings.length, 0);
  assert.throws(() => g.buyCollectible(s, "watch-lot"), /expired/);
  assert.throws(
    () => g.consignCollectible(s, "vintage-watch", 0.5),
    /at least \$1/,
  );
  assert.throws(
    () => g.consignCollectible(s, "vintage-watch", 100.001),
    /nearest cent/,
  );
  s = g.consignCollectible(s, "vintage-watch", 100);
  assert.ok(s.collectibles.owned["vintage-watch"]);
  assert.throws(
    () => g.consignCollectible(s, "vintage-watch", 100),
    /already at auction/,
  );
  s = steps(s, 2);
  assert.ok(["sold", "unsold"].includes(s.collectibles.auctions[0].status));
  if (s.collectibles.auctions[0].status === "sold") {
    assert.ok(!s.collectibles.owned["vintage-watch"]);
    assert.ok(s.collectibles.auctions[0].proceeds > 0);
  }
  assert.deepEqual(g.restoreGame(s), s);
});
test("a collectible with an excessive reserve remains unsold, with no commission charged", () => {
  let s = fresh();
  s.collectibles.listings = [
    { id: "card", collectibleId: "rookie-card", price: 850, expiresWeek: 4 },
  ];
  s = g.buyCollectible(s, "card");
  s = g.consignCollectible(s, "rookie-card", 100000);
  const cash = s.money;
  s = steps(s, 2);
  assert.equal(s.collectibles.auctions[0].status, "unsold");
  assert.ok(s.collectibles.owned["rookie-card"]);
  assert.equal(s.money, cash - 560);
});
test("v1 migration preserves contracts, money, shares, companies, and club ownership", () => {
  const old = JSON.parse(
      fs.readFileSync(
        new URL("./fixtures/v1-save.json", import.meta.url),
        "utf8",
      ),
    ),
    s = g.restoreGame(old);
  assert.equal(s.version, 2);
  assert.equal(s.money, old.money);
  assert.equal(g.salary(s), 2100);
  assert.equal(s.employment.legacy, true);
  assert.equal(s.holdings.tech, 100);
  assert.ok(s.company);
  assert.equal(g.stakePercent(s, "football-team"), 100);
  assert.ok(s.teams["football-team"]);
  assert.ok(!s.inventory.includes("football-team"));
  assert.equal(old.version, 1);
  assert.deepEqual(g.restoreGame(s), s);
});
test("save validation rejects unsupported jobs, credentials, ownership stakes, and offers", () => {
  for (const mutate of [
    (s) => (s.employment = { jobId: "fake" }),
    (s) => (s.education.completed = ["instant-doctorate"]),
    (s) => (s.holdings.tech = 100000001),
    (s) => (s.ownership = { cafe: { stake: 150, basis: 0, acquiredWeek: 0 } }),
    (s) => (s.negotiations = [{ status: "accepted", offer: -100 }]),
    (s) => (s.collectibles.owned = { fake: {} }),
    (s) => (s.tradeVolumes.tech = 1e9),
  ]) {
    const s = fresh();
    mutate(s);
    assert.throws(() => g.restoreGame(s));
  }
});
test("debt can be recovered through real wages and long runs do not grant a promotion", () => {
  let s = employed();
  s.money = -1000;
  const pay = g.salary(s),
    cost = g.expenses(s);
  const r = next(s);
  assert.equal(r.money, -1000 + pay - cost);
  assert.ok(r.money > -1000);
  s = g.setActivity(s, "rest");
  s = steps(s, 300);
  assert.equal(s.employment.jobId, "office-0");
  assert.equal(s.history.length, 52);
  assert.equal(s.marketHistory.index.length, 24);
  assert.deepEqual(g.restoreGame(s), s);
});
