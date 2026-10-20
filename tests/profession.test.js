import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import {
  professional,
  musician,
  next,
  weeks,
  clear,
} from "./career-world-fixtures.js";
import {
  specialtyBonus,
  detailedTacticBonus,
  orderCashReserved,
  orderSharesReserved,
  professionHours,
  artisticDiscovery,
  artisticRetention,
} from "../src/profession-effects.js";
const fresh = (o = {}) => {
  const s = g.createGame({ age: 23, seed: 8, ...o });
  s.money = 100000;
  return s;
};
function employed(track = "office") {
  let s = fresh();
  const j = g.JOBS.find((j) => j.track === track && !g.isSportingJob(j));
  for (const k of Object.keys(s.skills)) s.skills[k] = 95;
  s.education.completed = g.PROGRAMS.map((p) => p.id);
  s.progress[track].weeks = 500;
  s.applications.push({
    id: "fixture-job",
    vacancyId: "fixture",
    jobId: j.id,
    status: "offer",
    appliedWeek: 0,
    decisionWeek: 0,
    expiresWeek: 4,
    exceptional: false,
    offeredPay: j.pay,
  });
  return g.acceptJobOffer(s, "fixture-job");
}
test("v15 migration preserves every original field and adds no invented career activity", () => {
  const old = JSON.parse(
    fs.readFileSync(new URL("./fixtures/v15-save.json", import.meta.url)),
  );
  const s = g.restoreGame(old);
  assert.equal(s.version, g.VERSION);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") assert.deepEqual(s[key], value, key);
  assert.equal(s.profession.work.active, null);
  assert.equal(s.profession.investing.orders.length, 0);
  for (const p of Object.values(s.profession.sports)) {
    assert.equal(p.participating, false);
    assert.equal(p.reports.length, 0);
  }
});
for (const path of Object.keys(g.SPORT_SPECIALTIES)) {
  test(`${path}: specialist development has actual sessions, fees, calendar hours and fatigue`, () => {
    let s = professional(path),
      focus = Object.keys(g.SPORT_SPECIALTIES[path])[0];
    s.energy = 100;
    s = g.setActivity(s, "rest");
    s = g.startTrainingBlock(s, path, { focus, load: "coached" });
    const before = s.profession.sports[path].skills[focus];
    assert.equal(professionHours(s, s.week + 1), 6);
    const r = next(s),
      p = r.profession.sports[path];
    assert.equal(p.block.sessions, 1);
    assert.equal(p.block.paid, 35);
    assert.ok(p.skills[focus] > before);
    assert.ok(p.fatigue > 0);
    assert.ok(r.calendar.last.required.care >= 6);
    assert.deepEqual(g.restoreGame(r), r);
    const same = structuredClone(r);
    g.prepareProfession(same);
    assert.deepEqual(same, r);
    s = g.cancelTrainingBlock(r, path);
    assert.equal(s.profession.sports[path].block.status, "cancelled");
  });
  test(`${path}: next-fixture preparation is specific and feeds the real result`, () => {
    let s = professional(path),
      f = g.nextPerformance(s, path);
    assert.ok(f);
    const details = Object.fromEntries(
      Object.entries(g.MATCH_DETAILS[path]).map(([k, d]) => [
        k,
        Object.keys(d.options).at(-1),
      ]),
    );
    s = g.prepareSportDetails(
      g.choosePerformancePlan(s, path, "balanced"),
      path,
      details,
    );
    assert.ok(Number.isFinite(detailedTacticBonus(s, path, f)));
    assert.deepEqual(g.restoreGame(s), s);
    s = weeks(s, f.week - s.week);
    const r = s.profession.sports[path].reports[0];
    assert.ok(r);
    assert.equal(r.fixtureId, f.id);
    assert.equal(
      r.score,
      s.seasons[path].fixtures.find((x) => x.id === f.id).result.score,
    );
    assert.equal(Object.keys(r.metrics).length, 3);
    assert.deepEqual(g.restoreGame(s), s);
  });
}
test("a blocked training session consumes neither a coaching fee nor skill progress", () => {
  let s = g.startTrainingBlock(professional("racing"), "racing", {
    focus: "wet",
    load: "coached",
  });
  s.sports.racing.injuryWeeks = 3;
  const r = next(s),
    b = r.profession.sports.racing.block;
  assert.equal(b.sessions, 0);
  assert.equal(b.paid, 0);
  assert.equal(b.missed, 1);
  assert.match(b.note, /injury/);
  assert.equal(
    r.profession.sports.racing.skills.wet,
    s.profession.sports.racing.skills.wet,
  );
});
test("specialties and fatigue change performance only after choosing to use the development system", () => {
  const s = professional("racing"),
    f = g.nextPerformance(s, "racing");
  assert.equal(specialtyBonus(s, "racing", f), 0);
  const p = s.profession.sports.racing;
  p.participating = true;
  for (const k of Object.keys(p.skills)) p.skills[k] = 100;
  assert.ok(specialtyBonus(s, "racing", f) > 0);
  p.fatigue = 100;
  assert.ok(specialtyBonus(s, "racing", f) < 0);
});
test("specialties inherit actual sporting development before the player opts in", () => {
  let s = fresh({ career: "football", age: 14 });
  s.football.ability = 80;
  s = g.setSportRole(s, "football", "creator");
  assert.equal(s.profession.sports.football.foundation, 80);
  for (const value of Object.values(s.profession.sports.football.skills))
    assert.equal(value, 80);
  assert.equal(
    specialtyBonus(s, "football", g.nextPerformance(s, "football")),
    0,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("a creator series pauses publishing while its account is private", () => {
  let s = g.startCreatorSeries(
    g.openSocialAccount(g.buy(fresh(), "phone"), "lens"),
    { title: "A public promise", platform: "lens" },
  );
  s = g.configureSocial(s, { niche: "lifestyle", privacy: "private" });
  assert.throws(
    () => g.createSeriesEpisode(s, s.profession.creator.series[0].id),
    /public/,
  );
  assert.equal(s.profession.creator.series[0].episodes.length, 0);
});
test("God mode edits the new sport skills exactly, including alongside an ability edit", () => {
  let s = g.toggleDebug(fresh({ age: 14, career: "football" }), true);
  s = g.debugEdit(s, {
    specialistSkills: {
      "football.ability": 95,
      "football.finishing": 30,
      "football.passing": 80,
    },
  });
  const p = s.profession.sports.football;
  assert.equal(p.foundation, 95);
  assert.equal(p.skills.finishing, 30);
  assert.equal(p.skills.passing, 80);
  assert.equal(Math.round(p.skills.defending), 95);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a locked legacy local sport has no participation fee in the weekly forecast", () => {
  let s = professional("football");
  s.sports.tennis.stage = "local";
  s.sports.tennis.club = "Legacy tennis club";
  assert.equal(g.activeCareerPath(s), "football");
  assert.equal(g.sportCosts(s), 0);
  s = g.leaveFootball(s);
  assert.equal(g.activeCareerPath(s), "tennis");
  assert.equal(g.sportCosts(s), 8);
});
for (const track of Object.keys(g.WORK_CASES))
  test(`${track}: role-specific work has stages, weekly response times and a reviewed bonus`, () => {
    let s = g.startWorkAssignment(employed(track)),
      a = s.profession.work.active;
    const methods = g.WORK_METHODS[track],
      method = Object.keys(methods).find(
        (k) => methods[k].mode === g.WORK_CASES[track].priority,
      );
    assert.equal(a.title, g.WORK_CASES[track].name);
    for (let i = 0; i < 6 && s.profession.work.active; i++) {
      s = clear(s);
      s = g.workAssignment(s, method);
      if (s.profession.work.active) {
        assert.throws(() => g.workAssignment(s, method), /week/);
        s = next(g.setActivity(s, "rest"));
      }
    }
    assert.equal(s.profession.work.active, null);
    a = s.profession.work.history[0];
    assert.equal(a.status, "completed");
    assert.equal(a.paid, a.bonus);
    assert.ok(a.quality >= 55);
    assert.deepEqual(g.restoreGame(s), s);
    const before = s.money;
    s = next(s);
    assert.notEqual(s.profession.work.history[0].paid, 0);
    assert.ok(s.money < before + a.bonus + g.salary(s));
  });
test("leaving a job abandons its assignment without paying a bonus", () => {
  let s = g.startWorkAssignment(employed());
  s = g.resignJob(s);
  s = next(s);
  assert.equal(s.profession.work.active, null);
  assert.equal(s.profession.work.history[0].status, "abandoned");
  assert.equal(s.profession.work.history[0].paid, 0);
});
for (const [role, method] of [
  ["singer", "comp"],
  ["rapper", "flow"],
  ["producer", "master"],
])
  test(`${role}: the final studio revision charges its actual fee and cannot be repeated`, () => {
    let s = musician(role, 1);
    s = g.startPlannedRecording(s, { title: `A ${role} recording` });
    s = weeks(s, 5);
    const p = s.music.projects.at(-1);
    assert.equal(p.status, "ready");
    const quality = p.quality,
      cash = s.money;
    s = g.reviewStudioRecording(s, p.id, method);
    assert.equal(s.money, cash - g.STUDIO_REVIEWS[role][method].cost);
    assert.ok(s.music.projects.at(-1).quality >= quality);
    assert.throws(() => g.reviewStudioRecording(s, p.id, method), /already/);
    assert.deepEqual(g.restoreGame(s), s);
  });
test("artistic direction trades opening discovery against repeat listening and records real release reviews", () => {
  let s = g.setArtisticDirection(musician("producer", 1), "experimental");
  assert.ok(artisticDiscovery(s) < 1);
  assert.ok(artisticRetention(s, { quality: 80 }) > 1);
  assert.ok(artisticRetention(s, { quality: 20 }) < 1);
  assert.throws(() => g.setArtisticDirection(s, "accessible"), /thirteen/);
  s = g.startPlannedRecording(s, { title: "Different directions" });
  s = weeks(s, 5);
  s = g.releaseReadyRecording(clear(s), s.music.projects.at(-1).id);
  s = next(s);
  const r = s.profession.music.reviews[0];
  assert.ok(r);
  assert.equal(r.firstWeekStreams, s.music.releases.at(-1).initialStreams);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a creator series uses six actual paid posts, respects weekly capacity and publishes a durable report", () => {
  let s = g.openSocialAccount(g.buy(fresh(), "phone"), "lens");
  s = g.startCreatorSeries(s, {
    title: "Building something",
    platform: "lens",
    format: "diary",
    cadence: 1,
  });
  for (let i = 0; i < 6; i++) {
    s = clear(s);
    const p = s.profession.creator.series[0],
      cash = s.money;
    s = g.createSeriesEpisode(s, p.id, "authentic");
    assert.ok(s.money < cash);
    assert.throws(() => g.createSeriesEpisode(s, p.id), /slot/);
    s = next(s);
  }
  const p = s.profession.creator.series[0];
  assert.equal(p.status, "completed");
  assert.equal(p.episodes.length, 6);
  assert.ok(p.episodes.every((e) => e.status === "published"));
  assert.ok(p.episodes.reduce((n, e) => n + e.views, 0) > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a missed series slot reduces retention and a career departure keeps published posts", () => {
  let s = g.startCreatorSeries(
    g.openSocialAccount(g.buy(fresh(), "phone"), "lens"),
    { title: "Weekly promises", platform: "lens" },
  );
  s = weeks(s, 3);
  assert.ok(s.profession.creator.series[0].missed > 0);
  assert.ok(s.profession.creator.series[0].retention < 50);
  s = g.leaveCreatorPath(s);
  assert.equal(g.activeCareerPath(s), null);
  assert.equal(s.profession.creator.series[0].status, "cancelled");
  assert.deepEqual(g.restoreGame(s), s);
});
test("a company pays for real deliveries and collects its accepted invoice exactly once", () => {
  let s = fresh();
  s.skills.business = 80;
  s = g.foundCompany(s, { name: "Client Works", sector: "Technology" });
  s = g.acceptClientBrief(s, "pilot");
  const id = s.profession.company.contracts[0].id;
  for (let i = 0; i < 3; i++) {
    s = clear(s);
    const cash = s.company.cash;
    s = g.deliverClientWork(s, id, "quality");
    assert.equal(s.company.cash, cash - 120);
    if (i < 2) s = next(g.setActivity(s, "rest"));
  }
  let c = s.profession.company.contracts[0];
  assert.equal(c.status, "invoiced");
  assert.equal(c.costs, 360);
  assert.equal(c.paid, 0);
  s = weeks(s, 2);
  c = s.profession.company.contracts[0];
  assert.equal(c.status, "paid");
  assert.equal(c.paid, 650);
  assert.deepEqual(g.restoreGame(s), s);
  const copy = structuredClone(s);
  g.advanceProfession(copy, { trade: g.invest, markets: g.MARKETS });
  assert.deepEqual(copy, s);
});
test("missed client deliveries keep their costs and never award the contract fee", () => {
  let s = fresh();
  s.skills.business = 80;
  s = g.acceptClientBrief(
    g.foundCompany(s, { name: "Deadline Co", sector: "Technology" }),
    "pilot",
  );
  s = g.deliverClientWork(s, s.profession.company.contracts[0].id, "efficient");
  s = weeks(s, 6);
  const c = s.profession.company.contracts[0];
  assert.equal(c.status, "missed");
  assert.equal(c.costs, 100);
  assert.equal(c.paid, 0);
});
test("limit buys reserve cash and execute through the ordinary cost-basis path at the actual weekly close", () => {
  let s = g.placeLimitOrder(
    fresh(),
    { asset: "index", side: "buy", quantity: 2, limit: 150, weeks: 4 },
    g.MARKETS,
  );
  assert.equal(orderCashReserved(s), 300);
  assert.equal(g.availableCash(s), s.money - 300);
  const r = next(s),
    o = r.profession.investing.orders[0];
  assert.equal(o.status, "filled");
  assert.equal(o.fillPrice, r.market.index);
  assert.equal(r.holdings.index, 2);
  assert.equal(orderCashReserved(r), 0);
  assert.deepEqual(g.restoreGame(r), r);
});
test("sell reservations prevent double selling and cancel releases the units", () => {
  let s = g.invest(fresh(), "tech", 10);
  s = g.placeLimitOrder(
    s,
    { asset: "tech", side: "sell", quantity: 8, limit: 100, weeks: 4 },
    g.MARKETS,
  );
  assert.equal(orderSharesReserved(s, "tech"), 8);
  assert.throws(() => g.invest(s, "tech", -3), /more units/);
  assert.throws(
    () =>
      g.placeLimitOrder(
        s,
        { asset: "tech", side: "sell", quantity: 3, limit: 100 },
        g.MARKETS,
      ),
    /committed/,
  );
  s = g.cancelLimitOrder(s, s.profession.investing.orders[0].id);
  s = g.invest(s, "tech", -10);
  assert.equal(s.holdings.tech, 0);
});
test("an untriggered one-week order expires at that close without spending money", () => {
  let s = g.placeLimitOrder(
    fresh(),
    { asset: "index", side: "buy", quantity: 1, limit: 1, weeks: 1 },
    g.MARKETS,
  );
  s = next(s);
  assert.equal(s.profession.investing.orders[0].status, "expired");
  assert.equal(s.holdings.index, 0);
  assert.equal(orderCashReserved(s), 0);
});
test("multiple orders release only their own reservations and each fill once", () => {
  let s = g.placeLimitOrder(
    fresh(),
    { asset: "index", side: "buy", quantity: 1, limit: 150, weeks: 4 },
    g.MARKETS,
  );
  s = g.placeLimitOrder(
    s,
    { asset: "tech", side: "buy", quantity: 1, limit: 100, weeks: 4 },
    g.MARKETS,
  );
  assert.equal(orderCashReserved(s), 250);
  s = next(s);
  assert.ok(s.profession.investing.orders.every((o) => o.status === "filled"));
  assert.equal(s.holdings.index, 1);
  assert.equal(s.holdings.tech, 1);
  assert.equal(orderCashReserved(s), 0);
  const copy = structuredClone(s);
  g.advanceProfession(copy, { trade: g.invest, markets: g.MARKETS });
  assert.deepEqual(copy, s);
  assert.deepEqual(g.restoreGame(s), s);
});
test("an order that loses funding to living expenses never creates unfunded shares", () => {
  let s = fresh();
  s.money = 200;
  s = g.placeLimitOrder(
    s,
    { asset: "index", side: "buy", quantity: 1, limit: 150, weeks: 4 },
    g.MARKETS,
  );
  s = next(s);
  assert.equal(s.holdings.index, 0);
  assert.equal(s.profession.investing.orders[0].status, "pending");
  assert.match(s.profession.investing.orders[0].note, /cash/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("founders need paid operations management to leave and must leave a later job before resuming", () => {
  let s = fresh();
  s.skills.business = 80;
  s = g.foundCompany(s, { name: "Managed Co", sector: "Technology" });
  assert.throws(() => g.delegateFounderPath(s), /operations manager/);
  s = g.appointOwnerStaff(s, "founder", "coach", "developing");
  s = g.delegateFounderPath(s);
  assert.equal(g.activeCareerPath(s), null);
  assert.equal(s.profession.company.delegated, true);
  s.actions = 3;
  s.applications.push({
    id: "new-job",
    vacancyId: "fixture",
    jobId: "office-0",
    status: "offer",
    appliedWeek: s.week,
    decisionWeek: s.week,
    expiresWeek: s.week + 4,
    exceptional: false,
    offeredPay: 650,
  });
  s = g.acceptJobOffer(s, "new-job");
  assert.equal(g.activeCareerPath(s), "office");
  assert.throws(() => g.resumeFounderPath(s), /Leave your/);
  s = g.resignJob(s);
  s = g.resumeFounderPath(s);
  assert.equal(g.activeCareerPath(s), "business");
  assert.deepEqual(g.restoreGame(s), s);
});
test("investment research uses actual observations and watchlist changes do not move prices", () => {
  const s = fresh(),
    prices = structuredClone(s.market);
  let r = g.toggleWatchlist(s, "crypto", g.MARKETS);
  assert.deepEqual(r.market, prices);
  assert.deepEqual(r.profession.investing.watchlist, ["crypto"]);
  r = g.researchInvestment(r, "tech", g.MARKETS);
  assert.equal(r.profession.investing.research[0].price, r.market.tech);
  assert.equal(
    r.profession.investing.research[0].profit,
    r.businessResults.horizon.profit,
  );
  assert.equal(r.money, s.money);
  assert.throws(() => g.researchInvestment(r, "tech", g.MARKETS), /already/);
  assert.deepEqual(g.restoreGame(r), r);
});
test("one sporting path locks the others until a real departure, while progress stays recorded", () => {
  let s = fresh({ age: 14, career: "racing" });
  const ability = s.sports.racing.ability;
  assert.equal(g.activeCareerPath(s), "racing");
  assert.throws(() => g.joinFootball(s), /Leave your Motorsport/);
  assert.throws(() => g.joinSport(s, "tennis"), /Leave/);
  assert.throws(
    () => g.configureMusic(s, { role: "singer", genre: "Pop" }),
    /Leave/,
  );
  s = g.leaveSport(s, "racing");
  s = g.joinFootball(s);
  assert.equal(g.activeCareerPath(s), "football");
  assert.equal(s.sports.racing.ability, ability);
  assert.equal(s.sports.racing.stage, "retired");
});
test("a job locks a second career, but school, passive investments and social accounts remain available", () => {
  let s = employed();
  assert.throws(
    () => g.foundCompany(s, { name: "Second role", sector: "Technology" }),
    /Leave/,
  );
  assert.throws(
    () => g.configureMusic(s, { role: "singer", genre: "Pop" }),
    /Leave/,
  );
  s = g.invest(s, "index", 1);
  s = g.openSocialAccount(g.buy(s, "phone"), "lens");
  assert.equal(g.activeCareerPath(s), "office");
  s = g.resignJob(s);
  s = g.configureMusic(s, { role: "singer", genre: "Pop" });
  assert.equal(g.activeCareerPath(s), "music");
  assert.equal(s.holdings.index, 1);
});
for (const path of Object.keys(g.CAREER_CELEBRATIONS))
  test(`${path}: owned cosmetics and celebrations persist without performance grants`, () => {
    let s = professional(path),
      before = structuredClone(
        path === "football" ? s.football : s.sports[path],
      ),
      kit = g.CAREER_KIT.find((k) => k.path === path && k.price > 0 && !k.pro),
      cash = s.money;
    s = g.equipCareerKit(s, kit.id);
    assert.equal(s.money, cash - kit.price);
    assert.deepEqual(path === "football" ? s.football : s.sports[path], before);
    const paid = s.money;
    s = g.equipCareerKit(s, kit.id);
    assert.equal(s.money, paid);
    const premium = g.CAREER_KIT.find((k) => k.path === path && k.pro);
    assert.throws(() => g.equipCareerKit(s, premium.id), /Pro/);
    s = g.equipCareerKit(g.toggleDebug(s, true), premium.id);
    s = g.setCareerCelebration(s, path, "signature");
    assert.equal(s.profession.style.celebrations[path], "signature");
    assert.deepEqual(g.restoreGame(s), s);
  });
test("new career records reject malformed budgets, specialists, orders and cosmetic identifiers", () => {
  for (const corrupt of [
    (s) => (s.profession.sports.racing.skills.wet = 101),
    (s) => (s.profession.creator.committed = "yes"),
    (s) => (s.profession.company.delegated = 1),
    (s) => (s.profession.style.equipment.football = "unknown"),
    (s) => (s.profession.music.direction = "constructor"),
    (s) => s.profession.investing.orders.push({ status: "pending" }),
    (s) => s.profession.creator.series.push(null),
  ]) {
    const s = fresh();
    corrupt(s);
    assert.throws(() => g.restoreGame(s));
  }
});
