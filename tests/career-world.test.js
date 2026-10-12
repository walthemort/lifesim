import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import {
  athlete,
  next,
  weeks,
  professional,
  moveOffer,
  musician,
  musicOffer,
} from "./career-world-fixtures.js";
const near = (a, b) =>
  assert.ok(Math.abs(a - b) < 0.011, `${a} differs from ${b}`);

for (const id of g.WORLD_SPORTS) {
  test(`${id}: moves need a paid development career and retain the current contract while discussed`, () => {
    const youth = g.createGame({ age: 14, career: id, seed: 1 });
    assert.throws(
      () =>
        g.requestSportMove(youth, id, {
          kind: "transfer",
          destination: g.SPORT_DESTINATIONS[id][0].name,
        }),
      /Requires/,
    );
    const s = professional(id),
      p = athlete(s, id),
      r = g.requestSportMove(s, id, {
        kind: "transfer",
        destination: g.SPORT_DESTINATIONS[id][1].name,
      });
    assert.deepEqual(athlete(r, id).contract, p.contract);
    assert.deepEqual(r.employment, s.employment);
    assert.equal(r.actions, s.actions - 1);
    assert.equal(r.careerWorld.sports[id].requests.at(-1).status, "pending");
    assert.throws(
      () =>
        g.requestSportMove(r, id, {
          kind: "transfer",
          destination: g.SPORT_DESTINATIONS[id][0].name,
        }),
      /cooldown/,
    );
    assert.deepEqual(g.restoreGame(r), r);
  });
  test(`${id}: a live offer requires a separate signing and reserves travel time`, () => {
    const { s, o } = moveOffer(id),
      old = athlete(s, id).club;
    assert.notEqual(old, o.club);
    const r = g.signSportMove(s, id, o.id, "travel");
    assert.equal(athlete(r, id).club, o.club);
    assert.equal(r.employment.employer, o.club);
    assert.equal(r.employment.weeklyPay, o.pay);
    assert.equal(r.city, s.city);
    assert.equal(r.careerWorld.sports[id].travel, true);
    assert.equal(g.careerWorldHours(r, r.week + 1), 3);
    assert.deepEqual(g.restoreGame(r), r);
    assert.throws(
      () => g.signSportMove(r, id, o.id, "travel"),
      /offer|invitation/i,
    );
  });
  test(`${id}: support staff bill weekly, improve recovery and remain dismissible after retirement`, () => {
    let s = professional(id);
    const cash = s.money,
      costs = g.expenses(s);
    s = g.hireSportStaff(s, id, "coach");
    s = g.hireSportStaff(s, id, "physio");
    assert.equal(s.money, cash - 550);
    near(g.expenses(s), costs + 115);
    const p = athlete(s, id),
      ability = p.ability;
    g.prepareCareerWorld(s);
    near(p.ability, ability + 0.04);
    p.injuryWeeks = 3;
    g.prepareCareerWorld(s);
    assert.equal(p.injuryWeeks, 2);
    assert.throws(() => g.hireSportStaff(s, id, "coach"), /already/);
    s = id === "football" ? g.leaveFootball(s) : g.leaveSport(s, id);
    assert.equal(g.careerWorldCosts(s), 115);
    s = g.dismissSportStaff(s, id, "coach");
    s = g.dismissSportStaff(s, id, "physio");
    assert.equal(g.careerWorldCosts(s), 0);
    assert.deepEqual(g.restoreGame(s), s);
  });
  test(`${id}: team and role actions affect performance without promising automatic selection`, () => {
    const s = professional(id),
      r = g.sportCareerAction(s, id, "team");
    assert.ok(g.sportChemistryBonus(r, id) > g.sportChemistryBonus(s, id));
    assert.throws(() => g.sportCareerAction(r, id, "team"), /cooldown/);
    const q = g.sportCareerAction(r, id, "role"),
      n = next(q);
    assert.ok(
      ["agreed", "refused"].includes(
        n.careerWorld.sports[id].roleReview.status,
      ),
    );
    assert.throws(() => g.sportCareerAction(n, id, "role"), /cooldown/);
    assert.deepEqual(g.restoreGame(n), n);
  });
  test(`${id}: international duty consumes eight hours and cannot also earn a club appearance`, () => {
    let s = professional(id);
    const c = s.careerWorld.sports[id],
      inv = {
        id: `invite:${id}`,
        name: "National exhibition",
        fee: 150,
        status: "offered",
        expiresWeek: s.week + 3,
        performanceWeek: null,
      };
    c.invitations.push(inv);
    const booked = g.bookSportInvitation(s, id, inv.id);
    assert.equal(g.careerWorldHours(booked, booked.week + 1), 8);
    assert.equal(g.internationalDuty(booked, id, booked.week + 1), true);
    s = next(booked);
    const f = s.seasons[id].fixtures.find((f) => f.week === s.week);
    if (f) assert.notEqual(f.status, "played");
    assert.ok(
      ["completed", "missed"].includes(
        s.careerWorld.sports[id].invitations[0].status,
      ),
    );
    assert.equal(g.internationalDuty(s, id), false);
    assert.deepEqual(g.restoreGame(s), s);
  });
}
test("all sports have distinct market windows; discussions wait for their next window", () => {
  const s = professional("football");
  assert.equal(g.sportWindow(s, "football", 26), true);
  assert.equal(g.sportWindow(s, "football", 35), false);
  assert.equal(g.sportWindow(s, "basketball", 35), true);
  assert.equal(g.sportWindow(s, "racing", 35), false);
  assert.equal(g.sportWindow(s, "racing", 39), true);
  assert.equal(g.sportWindow(s, "tennis", 20), true);
  s.week = 10;
  s.actions = 3;
  const r = g.requestSportMove(s, "football", {
    kind: "transfer",
    destination: g.SPORT_DESTINATIONS.football[1].name,
  });
  assert.equal(r.careerWorld.sports.football.requests[0].decisionWeek, 26);
});
test("moving to the next sporting tier requires experience, skill and the correct racing licence", () => {
  let s = professional("racing");
  const dest = g.SPORT_DESTINATIONS.racing[1].name;
  assert.throws(
    () =>
      g.requestSportMove(s, "racing", { kind: "step-up", destination: dest }),
    /104/,
  );
  s.progress.racing.weeks = 104;
  s.education.completed = s.education.completed.filter(
    (x) => x !== "international-license",
  );
  assert.throws(
    () =>
      g.requestSportMove(s, "racing", { kind: "step-up", destination: dest }),
    /international-license/,
  );
  s.education.completed.push("international-license");
  s.skills.driving = 40;
  assert.throws(
    () =>
      g.requestSportMove(s, "racing", { kind: "step-up", destination: dest }),
    /skill/,
  );
});
for (const id of ["football", "basketball"]) {
  test(`${id}: a loan returns to the original remaining contract without reverting progress`, () => {
    const { s, o } = moveOffer(id, "loan"),
      original = structuredClone(athlete(s, id).contract),
      club = athlete(s, id).club;
    let r = g.signSportMove(s, id, o.id, "travel");
    const returnWeek = r.careerWorld.sports[id].loan.returnWeek;
    assert.equal(returnWeek, r.week + 26);
    assert.equal(athlete(r, id).contract.expiresWeek, returnWeek);
    const progress = r.progress[id].weeks;
    r = weeks(r, 26);
    assert.equal(athlete(r, id).club, club);
    assert.equal(athlete(r, id).contract.expiresWeek, original.expiresWeek);
    assert.equal(r.careerWorld.sports[id].loan, null);
    assert.ok(r.progress[id].weeks > progress);
    assert.deepEqual(g.restoreGame(r), r);
  });
}
test("racing and tennis do not allow team-sport loans and racing preserves funding requirements", () => {
  for (const id of ["racing", "tennis"])
    assert.throws(
      () =>
        g.requestSportMove(professional(id), id, {
          kind: "loan",
          destination: g.SPORT_DESTINATIONS[id][1].name,
        }),
      /appropriate/,
    );
  const { s, o } = moveOffer("racing");
  s.money = 0;
  assert.throws(
    () => g.signSportMove(s, "racing", o.id, "travel"),
    /fund|cash|reserve/i,
  );
});
test("an athlete who quits during a loan is not rehired at its return date", () => {
  const { s, o } = moveOffer("football", "loan");
  let r = g.leaveFootball(g.signSportMove(s, "football", o.id, "travel"));
  r = weeks(r, 26);
  assert.equal(r.employment, null);
  assert.equal(r.football.contract, null);
  assert.equal(r.careerWorld.sports.football.loan, null);
});
test("missed starter promises count bench decisions but exclude injury and international absence", () => {
  const s = professional("football"),
    c = s.careerWorld.sports.football;
  const fixture = s.seasons.football.fixtures.find((f) => f.week > s.week);
  s.week = fixture.week;
  fixture.status = "bench";
  c.promise = {
    role: "starter",
    reviewWeek: s.week,
    appearances: 0,
    available: 2,
  };
  const trust = c.coachTrust,
    happiness = s.happiness;
  g.advanceSportWorld(s);
  assert.equal(c.coachTrust, trust - 5);
  assert.equal(s.happiness, happiness - 3);
  assert.equal(c.promise, null);
  fixture.status = "injured";
  c.promise = {
    role: "starter",
    reviewWeek: s.week + 13,
    appearances: 0,
    available: 0,
  };
  g.advanceSportWorld(s);
  assert.equal(c.promise.available, 0);
});
test("a same-city move avoids household costs and later ordinary recruitment resets travel obligations", () => {
  const { s, o } = moveOffer(
    "football",
    "transfer",
    g.SPORT_DESTINATIONS.football[0].name,
  );
  const cash = s.money;
  let r = g.signSportMove(s, "football", o.id, "move");
  assert.equal(r.money, cash);
  assert.equal(r.careerWorld.sports.football.travel, false);
  r = next(r);
  r.careerWorld.sports.football.travel = true;
  r.careerWorld.sports.football.assignmentCity = "Copenhagen";
  const normal = {
    id: "normal:new-club",
    kind: "contract",
    club: "Local Athletic",
    jobId: "football-1",
    pay: 450,
    duration: 104,
    status: "offered",
    expiresWeek: r.week + 4,
  };
  g.enhanceSportOffer(r, "football", normal);
  r.football.offers.push(normal);
  r = g.acceptFootballOffer(r, normal.id);
  assert.equal(r.careerWorld.sports.football.travel, false);
  assert.equal(r.careerWorld.sports.football.assignmentCity, r.city);
  assert.equal(r.employment.employer, normal.club);
  assert.deepEqual(g.restoreGame(r), r);
});
test("a permanent career move can be countered once but loan terms cannot overwrite the return agreement", () => {
  const { s, o } = moveOffer("football");
  const countered = g.negotiateSportOffer(s, "football", o.id, "security");
  assert.throws(
    () => g.signSportMove(countered, "football", o.id, "travel"),
    /negotiation|counter/i,
  );
  const settled = weeks(countered, 2);
  const offer = settled.football.offers.find((x) => x.id === o.id);
  assert.ok(["agreed", "refused"].includes(offer.terms.negotiation.status));
  assert.deepEqual(
    g.restoreGame(g.signSportMove(settled, "football", o.id, "travel")),
    g.signSportMove(settled, "football", o.id, "travel"),
  );
  const loan = moveOffer("basketball", "loan");
  assert.throws(
    () => g.negotiateSportOffer(loan.s, "basketball", loan.o.id, "security"),
    /parent contract/,
  );
});
test("household relocation costs money, interrupts a partner wage and needs their agreement", () => {
  const { s, o } = moveOffer("basketball");
  const id = s.relationships[0].id;
  s.relationships[0].role = "Partner";
  s.family.partnerId = id;
  s.family.sinceWeek = s.week;
  const partner = s.connections.profiles[id];
  partner.trust = 40;
  assert.throws(
    () => g.signSportMove(s, "basketball", o.id, "move"),
    /partner/,
  );
  partner.trust = 80;
  partner.weeklyPay = 600;
  const r = g.signSportMove(s, "basketball", o.id, "move");
  assert.equal(r.city, "Copenhagen");
  near(r.money, s.money - 1500);
  assert.equal(r.connections.profiles[id].weeklyPay, 0);
  assert.equal(r.careerWorld.relocation.previousPay, 600);
  assert.equal(g.careerWorldHours(r, r.week + 1), 0);
  assert.deepEqual(g.restoreGame(r), r);
  const later = weeks(r, 8);
  assert.equal(later.careerWorld.relocation, null);
  assert.ok([0, 540].includes(later.connections.profiles[id].weeklyPay));
});
test("collaborations record fees and the artist share through actual recording and royalties", () => {
  const s = musician(),
    o = musicOffer(s);
  let r = g.acceptMusicOpportunity(s, o.id, "Shared work");
  near(r.money, s.money - 250);
  const id = r.music.projects.at(-1).id;
  assert.equal(g.musicReleaseShare(r, id), 0.7);
  assert.equal(g.musicAudienceBoost(r, id), 100);
  r = weeks(r, 4);
  assert.equal(r.careerWorld.music.offers[0].status, "released");
  const release = r.music.releases.find((x) => x.id === id);
  assert.ok(release.weeklyStreams > 0);
  assert.equal(
    release.totalRoyalties,
    Math.round(release.weeklyStreams * 0.002 * 0.7 * 100) / 100,
  );
  assert.deepEqual(g.restoreGame(r), r);
});
test("collaboration counteroffers take time and permit no acceptance before settlement", () => {
  const s = musician(),
    o = musicOffer(s);
  let r = g.negotiateCollaboration(s, o.id);
  assert.throws(
    () => g.acceptMusicOpportunity(r, o.id, "Too early"),
    /settled/,
  );
  assert.throws(() => g.negotiateCollaboration(r, o.id), /counteroffer/);
  r = weeks(r, 2);
  const q = r.careerWorld.music.offers[0];
  assert.ok(["agreed", "refused"].includes(q.negotiation.status));
  assert.equal(q.fee, q.negotiation.status === "agreed" ? 85 : 100);
  assert.deepEqual(g.restoreGame(r), r);
});
test("producer client work pays once after quality delivery and does not grant client royalties", () => {
  const s = musician(),
    o = musicOffer(s, "client");
  let r = g.acceptMusicOpportunity(s, o.id, "Client master");
  const id = r.music.projects.at(-1).id;
  assert.equal(g.musicReleaseShare(r, id), 0);
  r = weeks(r, 4);
  assert.equal(r.careerWorld.music.offers[0].status, "delivered");
  assert.equal(r.music.releases.find((x) => x.id === id).totalRoyalties, 0);
  const income = r.music.totalIncome;
  g.advanceMusicWorld(r);
  assert.equal(r.music.totalIncome, income);
  assert.throws(
    () =>
      g.assembleAlbum(r, {
        title: "Not mine",
        tracks: [...r.music.releases.slice(0, 2).map((x) => x.id), id],
      }),
    /own/,
  );
  assert.deepEqual(g.restoreGame(r), r);
});
test("a missed producer deadline does not pay when the recording is eventually delivered", () => {
  const s = musician(),
    o = musicOffer(s, "client");
  o.deadline = s.week + 1;
  let r = g.acceptMusicOpportunity(s, o.id, "Late master");
  r = weeks(r, 4);
  assert.equal(r.careerWorld.music.offers[0].status, "failed");
  assert.equal(g.musicReleaseShare(r, r.music.projects.at(-1).id), 0);
  const income = r.music.totalIncome;
  g.advanceMusicWorld(r);
  assert.equal(r.music.totalIncome, income);
});
test("albums master existing owned tracks once, without duplicating releases or rights", () => {
  const s = musician(),
    tracks = s.music.releases.map((x) => x.id);
  const r = g.assembleAlbum(s, { title: "A first chapter", tracks });
  assert.equal(r.money, s.money - 250);
  assert.equal(r.careerWorld.music.albums[0].status, "mastering");
  assert.throws(
    () => g.assembleAlbum(r, { title: "Double dip", tracks }),
    /one album/,
  );
  const released = weeks(r, 2);
  assert.equal(released.careerWorld.music.albums[0].status, "released");
  assert.equal(released.music.releases.length, s.music.releases.length);
  assert.deepEqual(g.restoreGame(released), released);
});
test("tour budgets need owned releases, real fans, sufficient cash and an available work schedule", () => {
  const s = musician();
  const poor = structuredClone(s);
  poor.money = 0;
  assert.throws(
    () => g.startMusicTour(poor, { route: "local", crew: "band" }),
    /cash/,
  );
  const young = structuredClone(s);
  young.startAge = 16;
  assert.throws(
    () => g.startMusicTour(young, { route: "local", crew: "solo" }),
    /adulthood/,
  );
  const employed = professional("tennis");
  employed.music = structuredClone(s.music);
  assert.throws(
    () => g.startMusicTour(employed, { route: "regional", crew: "solo" }),
    /employment/,
  );
  s.music.fans = 50;
  assert.throws(
    () => g.startMusicTour(s, { route: "local", crew: "solo" }),
    /fans/,
  );
});
test("tour stops reserve time, charge missed shows and retain the rehearsed role after a hobby change", () => {
  let s = musician("producer");
  const ready = s.careerWorld.music.liveReadiness;
  s = g.rehearseLive(s);
  assert.equal(s.careerWorld.music.liveReadiness, ready + 6);
  assert.throws(() => g.rehearseLive(s), /once/);
  s = g.startMusicTour(s, { route: "local", crew: "band" });
  const t = s.careerWorld.music.tours[0];
  assert.equal(t.role, "producer");
  assert.equal(g.careerWorldHours(s, t.stops[0].week), 8);
  s = g.configureMusic(s, { role: "singer", genre: "Pop" });
  s.week = t.stops[0].week;
  s.energy = 0;
  const cash = s.money;
  g.advanceMusicWorld(s);
  const stop = s.careerWorld.music.tours[0].stops[0];
  assert.equal(stop.status, "missed");
  assert.equal(stop.gross, 0);
  assert.equal(s.money, cash - 280);
  assert.equal(s.careerWorld.music.tours[0].costs, 400);
  assert.equal(s.careerWorld.music.tours[0].role, "producer");
  assert.deepEqual(g.restoreGame(s), s);
});
test("tour cancellation charges only remaining commitments and never refunds completed show costs", () => {
  let s = g.startMusicTour(musician(), { route: "local", crew: "band" });
  s = weeks(s, 2);
  const t = s.careerWorld.music.tours[0],
    cash = s.money;
  const r = g.cancelMusicTour(s);
  assert.equal(r.money, cash - 140);
  assert.equal(r.careerWorld.music.tours[0].costs, t.costs + 140);
  assert.equal(
    r.careerWorld.music.tours[0].stops.filter((x) => x.status === "cancelled")
      .length,
    2,
  );
  assert.equal(r.careerWorld.music.activeTour, null);
  assert.throws(() => g.cancelMusicTour(r), /No active/);
  const later = weeks(r, 4);
  assert.equal(later.careerWorld.music.tours[0].costs, t.costs + 140);
  assert.deepEqual(g.restoreGame(later), later);
});
test("tour performance receipts respect capacity, accumulate real costs and finish once", () => {
  let s = g.startMusicTour(musician(), { route: "local", crew: "solo" });
  s = weeks(s, 4);
  const t = s.careerWorld.music.tours[0];
  assert.equal(t.status, "completed");
  assert.equal(t.costs, 120 + 3 * 80);
  assert.equal(
    t.gross,
    t.stops.reduce((n, x) => n + x.tickets * 12, 0),
  );
  assert.ok(t.stops.some((x) => x.status === "performed"));
  assert.ok(t.stops.every((x) => x.tickets <= 80));
  assert.equal(s.careerWorld.music.activeTour, null);
  const cash = s.money;
  g.advanceMusicWorld(s);
  assert.equal(s.money, cash);
  assert.deepEqual(g.restoreGame(s), s);
});
test("tour ticket receipts deduct live costs, manager commission and tax from cash exactly once", () => {
  let s = g.hireMusicManager(musician(), "local");
  s = g.startMusicTour(s, { route: "local", crew: "band" });
  const t = s.careerWorld.music.tours[0];
  s.week = t.stops[0].week;
  s.energy = 100;
  const cash = s.money,
    earned = s.banking.tax.earned,
    withheld = s.banking.tax.withheld,
    commission = s.careerSupport.music.commissionPaid;
  g.advanceMusicWorld(s);
  const stop = t.stops[0],
    fee = Math.round(stop.gross * 0.1 * 100) / 100;
  assert.equal(stop.status, "performed");
  near(s.careerSupport.music.commissionPaid - commission, fee);
  near(
    s.banking.tax.earned - earned,
    Math.max(0, stop.gross - fee - stop.cost),
  );
  near(
    s.money - cash,
    stop.gross - stop.cost - fee - (s.banking.tax.withheld - withheld),
  );
  const after = s.money;
  g.advanceMusicWorld(s);
  assert.equal(s.money, after);
  assert.deepEqual(g.restoreGame(s), s);
});
test("authentic v8 saves preserve every existing field and start career agreements without invented history", () => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/v8-save.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(old.version, 8);
  const s = g.restoreGame(old);
  assert.equal(s.version, g.VERSION);
  for (const [key, value] of Object.entries(old))
    if (key !== "version")
      assert.deepEqual(s[key], value, `migration changed ${key}`);
  assert.equal(s.careerWorld.music.activeTour, null);
  assert.deepEqual(s.careerWorld.music.rights, {});
  assert.equal(g.musicReleaseShare(s, s.music.releases[0].id), 1);
  assert.deepEqual(g.restoreGame(s), s);
});
test("imports reject malformed career agreements, staff, ownership shares and tour ledgers", () => {
  const base = g.startMusicTour(musician(), { route: "local", crew: "solo" });
  const mutations = [
    (s) => s.careerWorld.sports.football.staff.push("invented"),
    (s) => (s.careerWorld.sports.racing.chemistry = 101),
    (s) =>
      (s.careerWorld.music.rights.fake = {
        share: 1.1,
        audience: 0,
        offerId: "bad",
      }),
    (s) => (s.careerWorld.music.tours[0].stops[0].gross = 10000),
    (s) => (s.careerWorld.music.tours[0].stops[0].tickets = 81),
    (s) => (s.careerWorld.music.tours[0].costs = -1),
    (s) => (s.careerWorld.music.activeTour = "missing"),
  ];
  for (const mutate of mutations) {
    const s = structuredClone(base);
    mutate(s);
    assert.throws(() => g.restoreGame(s), /Invalid/);
  }
});
