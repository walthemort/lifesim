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
  labelOffer,
  endorsementOffer,
  contactReady,
  challengeOffer,
} from "./depth-fixtures.js";
const near = (a, b) =>
  assert.ok(Math.abs(a - b) < 0.011, `${a} differs from ${b}`);
const fresh = () => g.createGame({ age: 23, seed: 8 });

for (const id of g.CONTRACT_SPORTS) {
  test(`${id}: exit clauses cost actual cash and cannot be bypassed by an ordinary job`, () => {
    const s = professional(id),
      fee = s.employment.weeklyPay * 4;
    assert.equal(g.sportExitCost(s, id), fee);
    s.money = 0;
    assert.throws(
      () => (id === "football" ? g.leaveFootball(s) : g.leaveSport(s, id)),
      /release clause/,
    );
    s.applications.push({
      id: "exit-job",
      vacancyId: "test",
      jobId: "office-0",
      status: "offer",
      appliedWeek: s.week,
      decisionWeek: s.week,
      expiresWeek: s.week + 4,
      exceptional: false,
      offeredPay: 650,
    });
    assert.throws(() => g.acceptJobOffer(s, "exit-job"), /release clause/);
    s.money = 100000;
    const r = g.acceptJobOffer(s, "exit-job");
    assert.equal(r.money, s.money - fee);
    assert.equal(r.contracts.current[id].status, "ended");
    assert.equal(athlete(r, id).contract, null);
    assert.deepEqual(g.restoreGame(r), r);
  });
  test(`${id}: approved moves waive the previous fee and a legal review blocks early signing`, () => {
    const { s, o } = moveOffer(id),
      before = s.money;
    let r = g.reviewContract(s, id, o.id, "rights");
    assert.equal(r.money, before - 250);
    assert.throws(
      () => g.signSportMove(r, id, o.id, "travel"),
      /legal counterproposal/,
    );
    r.contracts.seed = 1;
    r = weeks(r, 2);
    assert.equal(r.contracts.reviews[0].status, "agreed");
    // Racing's first annual window closes before this two-week counter settles.
    if (!g.sportWindow(r, id)) {
      assert.throws(() => g.signSportMove(r, id, o.id, "travel"), /window/);
      assert.equal(athlete(r, id).club, athlete(s, id).club);
    } else {
      const cash = r.money;
      r = g.signSportMove(r, id, o.id, "travel");
      assert.equal(r.money, cash);
      assert.equal(r.contracts.current[id].imageShare, 0.1);
      assert.equal(r.contracts.current[id].releaseWeeks, 4);
    }
    assert.throws(
      () => g.reviewContract(r, id, o.id, "rights"),
      /already|live/,
    );
    assert.deepEqual(g.restoreGame(r), r);
  });
}
test("a refused legal counter preserves original terms and lawyer fees remain spent", () => {
  const { s, o } = moveOffer("football");
  let r = g.reviewContract(s, "football", o.id, "exit");
  r.contracts.seed = 1000;
  r = weeks(r, 2);
  assert.equal(r.contracts.reviews[0].status, "refused");
  assert.equal(g.contractProposal(r, "football", o.id).releaseWeeks, 4);
  assert.deepEqual(g.restoreGame(r), r);
});
test("loan contracts retain parent clauses, return without fees and cannot replace clauses mid-loan", () => {
  const { s, o } = moveOffer("basketball", "loan"),
    agreement = structuredClone(s.contracts.current.basketball);
  assert.throws(
    () => g.reviewContract(s, "basketball", o.id, "exit"),
    /parent agreement/,
  );
  let r = g.signSportMove(s, "basketball", o.id, "travel");
  assert.deepEqual(r.contracts.current.basketball, agreement);
  r = weeks(r, 26);
  assert.equal(r.sports.basketball.club, agreement.party);
  assert.deepEqual(r.contracts.current.basketball, agreement);
  assert.deepEqual(g.restoreGame(r), r);
});
test("mandatory retirement never charges an exit fee or crashes a life in debt", () => {
  let s = professional("football");
  s.startAge = 40;
  s.money = -500;
  const r = next(s);
  assert.equal(r.football.contract, null);
  assert.equal(r.contracts.current.football.status, "ended");
  assert.ok(r.money < 0);
  assert.deepEqual(g.restoreGame(r), r);
});
test("exclusive labels block outside work and an actual buyout repays fees and the remaining advance", () => {
  let s = musician(),
    label = labelOffer(s);
  s = g.acceptLabelOffer(s, label.id);
  const outside = musicOffer(s, "client");
  assert.throws(
    () => g.acceptMusicOpportunity(s, outside.id, "Outside master"),
    /exclusive recording/,
  );
  const fee = g.musicBuyoutCost(s),
    cash = s.money;
  assert.equal(fee, 1250);
  const r = g.buyOutMusicAgreement(s);
  assert.equal(r.money, cash - fee);
  assert.equal(r.music.label, null);
  assert.equal(r.contracts.current.music.status, "ended");
  assert.doesNotThrow(() =>
    g.acceptMusicOpportunity(r, outside.id, "Independent client master"),
  );
  assert.deepEqual(g.restoreGame(r), r);
});
test("negotiated music flexibility trades royalty share for outside-work rights", () => {
  let s = musician(),
    o = labelOffer(s);
  s = g.reviewContract(s, "music", o.id, "flexibility");
  assert.throws(() => g.acceptLabelOffer(s, o.id), /legal counterproposal/);
  s.contracts.seed = 1;
  s = weeks(s, 2);
  s = g.acceptLabelOffer(s, o.id);
  assert.equal(s.music.label.share, 0.4);
  assert.equal(s.contracts.current.music.exclusive, false);
  const outside = musicOffer(s);
  assert.doesNotThrow(() =>
    g.acceptMusicOpportunity(s, outside.id, "Permitted collaboration"),
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("label delivery counts new owned recordings, excluding the existing catalogue and album repackaging", () => {
  let s = musician(),
    o = labelOffer(s);
  s = g.acceptLabelOffer(s, o.id);
  s = weeks(s, 1);
  s = g.assembleAlbum(s, {
    title: "Existing catalogue",
    tracks: s.music.releases.map((r) => r.id),
  });
  s = weeks(s, 2);
  assert.equal(s.contracts.current.music.deliveriesDone, 0);
  for (let i = 0; i < 2; i++) {
    s = g.startMusicProject(s, { title: `Delivered master ${i}` });
    s = weeks(s, 4);
  }
  assert.equal(s.contracts.current.music.deliveriesDone, 2);
  s = weeks(s, 28);
  assert.equal(s.contracts.current.music.penaltyCharged, false);
  assert.deepEqual(g.restoreGame(s), s);
});
test("missing a label delivery deadline charges the stated penalty once", () => {
  let s = musician(),
    o = labelOffer(s);
  s = g.acceptLabelOffer(s, o.id);
  s = weeks(s, 39);
  assert.equal(s.contracts.current.music.penaltyCharged, true);
  assert.ok(
    s.contracts.history.some((h) =>
      h.text.includes("$100 contractual penalty"),
    ),
  );
  const cash = s.money;
  g.advanceContracts(s);
  assert.equal(s.money, cash);
  assert.deepEqual(g.restoreGame(s), s);
});
test("client-owned masters do not fulfil a flexible label's owned-release obligation", () => {
  let s = musician(),
    o = labelOffer(s);
  s = g.reviewContract(s, "music", o.id, "flexibility");
  s.contracts.seed = 1;
  s = weeks(s, 2);
  s = g.acceptLabelOffer(s, o.id);
  const client = musicOffer(s, "client");
  s = g.acceptMusicOpportunity(s, client.id, "Client-owned delivery");
  s = weeks(s, 4);
  assert.equal(
    s.careerWorld.music.offers.find((x) => x.id === client.id).status,
    "delivered",
  );
  assert.equal(s.contracts.current.music.deliveriesDone, 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("basketball counts both fixtures in a double-header once when career records are reviewed again", () => {
  const s = professional("basketball"),
    stats = s.careerMilestones.paths.basketball.stats;
  const played = s.seasons.basketball.fixtures.filter(
    (f) => f.week === s.week && f.status === "played",
  );
  assert.equal(played.length, 2);
  assert.equal(stats.appearances, 2);
  g.advanceMilestones(s);
  g.advanceMilestones(s);
  assert.equal(stats.appearances, 2);
  assert.deepEqual(g.restoreGame(s), s);
});
for (const id of [...g.CONTRACT_SPORTS, "music"]) {
  test(`${id}: endorsement pay needs two actual public appearances and category exclusivity outlasts delivery`, () => {
    let s = id === "music" ? musician() : professional(id),
      o = endorsementOffer(s, id);
    s = g.acceptEndorsement(s, o.id);
    const d = s.contracts.endorsements[0];
    assert.equal(d.grossPaid, 500);
    assert.equal(d.imagePaid, id === "music" ? 0 : 100);
    s = g.bookEndorsementAppearance(s, d.id);
    assert.equal(g.contractHours(s, s.week + 1), 3);
    s = next(s);
    assert.equal(s.contracts.endorsements[0].delivered, 1);
    assert.equal(s.contracts.endorsements[0].grossPaid, 500);
    s = g.bookEndorsementAppearance(s, d.id);
    s = next(s);
    assert.equal(s.contracts.endorsements[0].status, "fulfilled");
    assert.equal(s.contracts.endorsements[0].grossPaid, 1000);
    const rival = endorsementOffer(s, id, 1);
    assert.throws(
      () => g.acceptEndorsement(s, rival.id),
      /category exclusivity/,
    );
    assert.deepEqual(g.restoreGame(s), s);
  });
}
test("private campaigns cannot deliver, and missed deadlines claw back advances once", () => {
  let s = musician(),
    o = endorsementOffer(s, "music");
  s = g.acceptEndorsement(s, o.id);
  s = g.bookEndorsementAppearance(s, s.contracts.endorsements[0].id);
  s.social.privacy = "private";
  s = weeks(s, 6);
  const d = s.contracts.endorsements[0];
  assert.equal(d.status, "breached");
  assert.equal(d.delivered, 0);
  assert.ok(
    s.contracts.history.some((h) =>
      h.text.includes("$500 gross advance was clawed back"),
    ),
  );
  const cash = s.money;
  g.advanceContracts(s);
  assert.equal(s.money, cash);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a cancelled campaign repays its advance without refunding image or management expenses", () => {
  let s = professional("racing"),
    o = endorsementOffer(s, "racing");
  s = g.acceptEndorsement(s, o.id);
  const d = s.contracts.endorsements[0],
    cash = s.money;
  const r = g.cancelEndorsement(s, d.id);
  assert.equal(r.money, cash - 500);
  assert.equal(r.contracts.endorsements[0].imagePaid, 100);
  assert.equal(r.contracts.endorsements[0].status, "cancelled");
  assert.throws(() => g.cancelEndorsement(r, d.id), /unfinished/);
  assert.deepEqual(g.restoreGame(r), r);
});
test("sports image-rights clauses cover creator endorsements without affecting unrelated wages", () => {
  let s = professional("football");
  s.social.profiles.tube.active = true;
  s.social.profiles.tube.followers = 1000;
  const salary = g.salary(s),
    o = endorsementOffer(s, "creator");
  s = g.acceptEndorsement(s, o.id);
  assert.equal(s.contracts.endorsements[0].imagePaid, 100);
  assert.equal(g.salary(s), salary);
  assert.deepEqual(g.restoreGame(s), s);
});
test("basketball draft eligibility requires youth development and cannot be entered as a paid professional", () => {
  let s = g.createGame({ age: 19, career: "basketball", seed: 8 });
  s.week = 26;
  s.money = 10000;
  s.sports.basketball.experience = 104;
  s.sports.basketball.events = 40;
  s.sports.basketball.ability = 85;
  s.skills.athletics = 85;
  const o = challengeOffer(s, "basketball", "draft");
  s = g.bookCareerChallenge(s, "basketball", o.id);
  assert.equal(
    s.careerMilestones.paths.basketball.opportunities[0].performanceWeek,
    30,
  );
  s.careerMilestones.seed = 1;
  s = weeks(s, 4);
  assert.equal(
    s.careerMilestones.paths.basketball.opportunities[0].status,
    "completed",
  );
  assert.equal(s.employment, null);
  const offer = s.sports.basketball.offers.find(
    (o) => o.id.startsWith("milestone:") && o.status === "offered",
  );
  assert.ok(offer);
  assert.equal(offer.jobId, "basketball-1");
  s = g.acceptSportOffer(s, "basketball", offer.id);
  assert.equal(s.employment.jobId, "basketball-1");
  assert.deepEqual(g.restoreGame(s), s);
  assert.ok(g.challengeEligibility(professional("basketball"), "draft").length);
});
test("racing tests cannot bypass next-tier competition licences or experience", () => {
  let s = professional("racing");
  s.education.completed = s.education.completed.filter(
    (x) => x !== "international-license",
  );
  s.progress.racing.weeks = 104;
  const o = challengeOffer(s, "racing", "test");
  const cash = s.money;
  s = g.bookCareerChallenge(s, "racing", o.id);
  assert.equal(s.money, cash - 500);
  assert.equal(g.milestoneHours(s, s.week + 1), 6);
  s.careerMilestones.seed = 1;
  s = next(s);
  assert.equal(
    s.careerMilestones.paths.racing.opportunities.find((x) => x.id === o.id)
      .status,
    "completed",
  );
  assert.ok(!s.sports.racing.offers.some((o) => o.id.startsWith("milestone:")));
  assert.equal(s.employment.jobId, "racing-1");
  assert.deepEqual(g.restoreGame(s), s);
});
test("tennis qualifying reserves competition time and pays only after a successful draw", () => {
  let s = professional("tennis"),
    o = challengeOffer(s, "tennis", "qualifier");
  s = g.bookCareerChallenge(s, "tennis", o.id);
  s.careerMilestones.seed = 1;
  const before = s.banking.tax.earned;
  s = next(s);
  assert.equal(
    s.careerMilestones.paths.tennis.opportunities.find((x) => x.id === o.id)
      .status,
    "completed",
  );
  assert.ok(
    s.careerMilestones.paths.tennis.unlocks.includes("tennis:qualifier"),
  );
  assert.ok(s.banking.tax.earned >= before + 500);
  const fixture = s.seasons.tennis.fixtures.find((f) => f.week === s.week);
  if (fixture) assert.notEqual(fixture.status, "played");
  assert.deepEqual(g.restoreGame(s), s);
});
for (const path of ["football", "basketball"]) {
  test(`${path}: cup or playoff entry needs an earned league finish and advances through real rounds`, () => {
    let s = professional(path),
      m = s.careerMilestones.paths[path];
    s.week = 39;
    m.stats.appearances = 10;
    s.seasons[path].table[0].points = 200;
    const kind = path === "football" ? "cup" : "playoff",
      o = challengeOffer(s, path, kind);
    s = g.bookCareerChallenge(s, path, o.id);
    s.careerMilestones.seed = 1;
    s = next(s);
    const q = s.careerMilestones.paths[path].opportunities.find(
      (x) => x.id === o.id,
    );
    assert.equal(q.status, "booked");
    assert.equal(q.stage, 1);
    assert.equal(q.performanceWeek, s.week + 1);
    assert.equal(g.milestoneHours(s, s.week + 1), 8);
    assert.equal(
      s.careerMilestones.paths[path].unlocks.includes(`${path}:${kind}`),
      false,
    );
    assert.deepEqual(g.restoreGame(s), s);
  });
}
for (const role of ["singer", "rapper", "producer"]) {
  test(`${role}: music auditions and showcases reserve time and preserve the booked craft`, () => {
    let s = musician(role),
      o = challengeOffer(s, "music", "showcase");
    s = g.bookCareerChallenge(s, "music", o.id);
    s.careerMilestones.seed = 1;
    s = g.configureMusic(s, {
      role: role === "producer" ? "singer" : "producer",
      genre: "Electronic",
    });
    s = next(s);
    const q = s.careerMilestones.paths.music.opportunities.find(
      (x) => x.id === o.id,
    );
    assert.equal(q.role, role);
    assert.equal(q.status, "completed");
    assert.ok(
      s.careerMilestones.paths.music.unlocks.includes("music:showcase"),
    );
    assert.deepEqual(g.restoreGame(s), s);
  });
}
test("a cup champion needs three successful rounds before the prize or title is awarded", () => {
  let s = professional("football");
  s = weeks(s, 38);
  // Prescribe a winning league finish, retaining the actual appearance history.
  s.seasons.football.table[0].points = 200;
  const o = challengeOffer(s, "football", "cup");
  s = g.bookCareerChallenge(s, "football", o.id);
  for (let i = 0; i < 3; i++) {
    s.careerMilestones.seed = 1;
    s = next(s);
    const q = s.careerMilestones.paths.football.opportunities.find(
      (x) => x.id === o.id,
    );
    assert.equal(q.results.length, i + 1);
    assert.equal(q.status, i === 2 ? "completed" : "booked");
    assert.equal(
      s.careerMilestones.paths.football.unlocks.includes("football:cup"),
      i === 2,
    );
  }
  const income = s.banking.tax.earned;
  g.advanceMilestones(s);
  assert.equal(s.banking.tax.earned, income);
  assert.deepEqual(g.restoreGame(s), s);
});
test("music festivals cannot double-book existing tour dates or gigs", () => {
  let s = musician(),
    o = challengeOffer(s, "music", "festival");
  s = g.bookCareerChallenge(s, "music", o.id);
  s.music.gigs.push({
    id: "conflict",
    venue: "Local room",
    fee: 50,
    status: "offered",
    expiresWeek: s.week + 4,
    performanceWeek: null,
  });
  assert.throws(() => g.bookMusicGig(s, "conflict"), /already|booked/);
  s = next(s);
  assert.deepEqual(g.restoreGame(s), s);
});
test("contact support costs cash, improves their development and enforces the conversation cooldown", () => {
  const s = fresh(),
    id = contactReady(s, "music");
  const cash = s.money,
    talent = s.livingWorld.people[id].talent;
  const r = g.contactAction(s, id, "support");
  assert.equal(r.money, cash - 100);
  assert.equal(r.livingWorld.people[id].talent, talent + 3);
  assert.equal(r.livingWorld.people[id].relation, "collaborator");
  assert.throws(() => g.contactAction(r, id, "catch-up"), /four weeks/);
  assert.deepEqual(g.restoreGame(r), r);
});
test("contacts develop over time using their own finances, with no cash awarded to the player", () => {
  let s = fresh(),
    id = Object.keys(s.livingWorld.people)[0];
  s.livingWorld.people[id].field = "business";
  s.livingWorld.people[id].developedWeeks = 51;
  s.livingWorld.people[id].nextReviewWeek = s.week + 1;
  s.livingWorld.seed = 1;
  const originalJob = s.connections.profiles[id].job;
  s = next(s);
  assert.equal(s.livingWorld.people[id].level, 1);
  assert.equal(s.connections.profiles[id].job, originalJob);
  s.livingWorld.people[id].nextReviewWeek = s.week + 1;
  s.livingWorld.seed = 1;
  s = next(s);
  assert.equal(s.livingWorld.people[id].level, 2);
  assert.equal(s.connections.profiles[id].job, "Small business owner");
  assert.equal(s.connections.profiles[id].weeklyPay, 650);
  assert.equal(g.salary(s), 0);
  assert.ok(s.livingWorld.people[id].history.length >= 2);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a trusted professional contact opens a vacancy but cannot award an unqualified job", () => {
  let s = fresh(),
    id = contactReady(s, "office");
  s = g.contactAction(s, id, "introduction");
  s.livingWorld.seed = 1;
  s = weeks(s, 2);
  const o = s.livingWorld.opportunities[0];
  assert.equal(o.status, "introduced");
  const vacancy = s.vacancies.find((v) => v.id === o.resultId);
  assert.ok(vacancy);
  assert.equal(vacancy.exceptional, false);
  s.skills = Object.fromEntries(Object.keys(s.skills).map((k) => [k, 0]));
  s.education.completed = [];
  assert.equal(g.jobEligibility(s, vacancy).eligible, false);
  assert.throws(
    () => g.applyForJob(s, vacancy.id),
    /Requires|require|qualification|skill/i,
  );
  assert.equal(s.employment, null);
  assert.deepEqual(g.restoreGame(s), s);
});
test("musician contacts offer shared recordings with actual costs and ownership", () => {
  let s = musician(),
    id = contactReady(s, "music");
  s.careerWorld.music.offers = [];
  s = g.contactAction(s, id, "introduction");
  s.livingWorld.seed = 1;
  s = weeks(s, 2);
  const intro = s.livingWorld.opportunities[0],
    o = s.careerWorld.music.offers.find((o) => o.id === intro.resultId);
  assert.equal(intro.status, "introduced");
  assert.equal(o.artist, s.relationships.find((r) => r.id === id).name);
  s = g.acceptMusicOpportunity(s, o.id, "A real friendship");
  const project = s.music.projects.at(-1);
  assert.equal(g.musicReleaseShare(s, project.id), 0.7);
  assert.deepEqual(g.restoreGame(s), s);
});
test("athlete introductions provide a bounded shared practice rather than a contract", () => {
  let s = professional("racing"),
    id = contactReady(s, "racing");
  s = g.contactAction(s, id, "introduction");
  s.livingWorld.seed = 1;
  s = weeks(s, 2);
  const o = s.livingWorld.opportunities[0],
    ability = s.sports.racing.ability,
    job = s.employment.jobId;
  assert.equal(o.status, "training");
  s = g.bookContactTraining(s, o.id);
  near(s.sports.racing.ability, Math.min(100, ability + 0.5));
  assert.equal(s.employment.jobId, job);
  assert.throws(() => g.bookContactTraining(s, o.id), /live training/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("investor contacts introduce owners without transferring shares or bypassing board terms", () => {
  let s = fresh(),
    id = contactReady(s, "investor");
  s = g.contactAction(s, id, "introduction");
  s.livingWorld.seed = 1;
  const holdings = structuredClone(s.holdings),
    ownership = structuredClone(s.ownership);
  s = weeks(s, 2);
  const o = s.livingWorld.opportunities[0];
  assert.equal(o.status, "board");
  assert.ok(g.BUSINESSES.some((b) => b.id === o.resultId));
  assert.deepEqual(s.holdings, holdings);
  assert.deepEqual(s.ownership, ownership);
  assert.equal(s.negotiations.length, 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("friendly rivalry works for musicians and excludes a romantic partner", () => {
  let s = musician(),
    id = contactReady(s, "music", 1);
  s = g.contactAction(s, id, "rivalry");
  assert.equal(s.livingWorld.people[id].relation, "rival");
  s = weeks(s, 13);
  assert.ok(
    s.livingWorld.stories.some((h) => h.text.includes("friendly rivalry:")),
  );
  s.relationships.find((r) => r.id === id).role = "Partner";
  assert.throws(() => g.contactAction(s, id, "rivalry"), /peer|partnership/);
});
test("autonomous contract and contact draws do not consume the existing economy random stream", () => {
  const s = professional("football"),
    id = contactReady(s, "office");
  s.livingWorld.people[id].nextReviewWeek = s.week;
  s.contracts.nextOfferWeek = s.week;
  const seed = s.seed;
  g.advanceContracts(s);
  g.advanceLivingWorld(s);
  assert.equal(s.seed, seed);
});
test("authentic v9 migration preserves every existing field and adds no retrospective clauses", () => {
  const old = JSON.parse(
      fs.readFileSync(
        new URL("./fixtures/v9-save.json", import.meta.url),
        "utf8",
      ),
    ),
    s = g.restoreGame(old);
  assert.equal(old.version, 9);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") assert.deepEqual(s[key], value, key);
  assert.equal(s.version, g.VERSION);
  assert.deepEqual(s.contracts.current, {});
  assert.deepEqual(s.contracts.endorsements, []);
  assert.ok(Array.isArray(s.milestones));
  assert.deepEqual(g.restoreGame(s), s);
});
test("save validation rejects malformed clauses, payments, career records and contact careers", () => {
  const base = professional("football");
  for (const mutate of [
    (s) => (s.contracts.current.football.imageShare = 2),
    (s) => (s.contracts.current.football.releaseWeeks = -1),
    (s) =>
      s.contracts.reviews.push({
        sector: "football",
        offerId: "bad",
        approach: "free-money",
        status: "pending",
        decisionWeek: 2,
      }),
    (s) => s.careerMilestones.paths.football.unlocks.push("invented"),
    (s) => (s.careerMilestones.paths.racing.stats.wins = 99),
    (s) => (s.livingWorld.people.sam.level = 9),
    (s) => (s.livingWorld.people.sam.nextReviewWeek = -1),
    (s) => (s.livingWorld.seed = Infinity),
  ]) {
    const s = structuredClone(base);
    mutate(s);
    assert.throws(() => g.restoreGame(s), /Invalid/);
  }
});
