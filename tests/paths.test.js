import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
const fresh = (o) => g.createGame({ seed: 1, age: 18, career: "office", ...o });
const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
const next = (s) => g.advanceWeek(clear(s));
function steps(s, n) {
  for (let i = 0; i < n; i++) s = next(s);
  return s;
}
function footballInvitation(s, kind = "contract", jobId = "football-2") {
  const o = {
    id: "football:test",
    kind,
    club: "Riverside FC",
    jobId: kind === "contract" ? jobId : null,
    pay: kind === "contract" ? 3500 : 0,
    duration: 104,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  s.football.offers.push(o);
  return o;
}
function sportsInvitation(s, id, kind = "contract", jobId = `${id}-1`) {
  const o = {
    id: `${id}:test`,
    kind,
    club: "Development programme",
    jobId: kind === "contract" ? jobId : null,
    pay: 300,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  s.sports[id].offers.push(o);
  return o;
}
function creator(o = {}) {
  let s = fresh(o);
  s = g.buy(s, "phone");
  s = g.openSocialAccount(s, "lens");
  return s;
}
function musician(role = "singer") {
  let s = fresh();
  s = g.buy(s, role === "producer" ? "laptop" : "phone");
  s = g.configureMusic(s, {
    role,
    genre: role === "rapper" ? "Hip-hop" : "Pop",
  });
  for (let i = 0; i < 8; i++) {
    if (!s.actions) s = next(s);
    s = g.practiseMusic(s);
  }
  return s;
}

test("children have family housing and allowance, attend school, and cannot apply for adult employment", () => {
  const s = fresh({ age: 14, career: "football" }),
    r = next(s);
  assert.equal(s.money, 500);
  assert.equal(s.school.enrolled, true);
  assert.deepEqual(s.education.completed, []);
  assert.equal(s.football.stage, "school");
  assert.equal(g.salary(s), 25);
  assert.equal(g.expenses(s), 20);
  assert.equal(r.money, 505);
  assert.equal(r.football.schoolWeeks, 1);
  assert.equal(r.employment, null);
  assert.throws(() => g.applyForJob(s, s.vacancies[0].id), /age 18/);
  assert.deepEqual(g.restoreGame(r), r);
});
test("school-age choices use age-appropriate scenarios and graduation awards a qualification once", () => {
  let s = fresh({ age: 17 });
  s = steps(s, 2);
  assert.match(s.event.tag, /School|Youth|Development/);
  s.week = 51;
  const r = next(s);
  assert.equal(g.age(r), 18);
  assert.equal(r.school.enrolled, false);
  assert.ok(r.education.completed.includes("school"));
  assert.equal(
    next(r).education.completed.filter((id) => id === "school").length,
    1,
  );
});
test("professional athletes never appear on the employment board and manufactured vacancies cannot bypass sporting development", () => {
  let s = fresh();
  for (const id of ["football-2", "racing-4", "basketball-2", "tennis-2"]) {
    const v = {
      id,
      jobId: id,
      postedWeek: 0,
      expiresWeek: 4,
      exceptional: false,
    };
    s.vacancies.push(v);
    s.skills.athletics = 100;
    s.skills.driving = 100;
    s.progress[g.jobDefinition(id).track].weeks = 1000;
    s.education.completed.push("super-license");
    assert.throws(() => g.applyForJob(s, id), /Sporting contracts/);
    s.vacancies.pop();
  }
  s = steps(s, 8);
  assert.ok(
    s.vacancies.every((v) => !g.isSportingJob(g.jobDefinition(v.jobId))),
  );
  assert.ok(s.vacancies.some((v) => v.jobId === "office-0"));
});
test("school football develops ability and match experience but does not create a paid job", () => {
  let s = fresh({ age: 14, career: "football", trait: "Athletic" });
  s = g.configureFootball(s, { position: "Forward", training: "technical" });
  const original = structuredClone(s);
  const r = steps(s, 12);
  assert.ok(r.football.ability > s.football.ability);
  assert.ok(r.football.matches > 0);
  assert.equal(r.employment, null);
  assert.equal(r.progress.football.weeks, 0);
  assert.equal(r.football.offers.length, 0);
  assert.deepEqual(s, original);
});
test("football invitations need acceptance and trials can produce or deny an academy place", () => {
  const base = fresh({ age: 16, career: "football" });
  base.football.ability = 70;
  const o = footballInvitation(base, "academy-trial");
  let succeeded = false,
    failed = false;
  for (let seed = 1; seed < 100 && (!succeeded || !failed); seed++) {
    let s = structuredClone(base);
    s.seed = seed;
    s = g.acceptFootballOffer(s, o.id);
    assert.equal(s.football.stage, "school");
    assert.equal(s.football.trial.decisionWeek, 2);
    s = steps(s, 2);
    assert.equal(s.employment, null);
    const place = s.football.offers.find(
      (o) => o.kind === "academy" && o.status === "offered",
    );
    if (place) {
      s = g.acceptFootballOffer(s, place.id);
      assert.equal(s.football.stage, "academy");
      assert.equal(g.salary(s), 25);
      succeeded = true;
    } else failed = true;
    assert.deepEqual(g.restoreGame(s), s);
  }
  assert.ok(succeeded && failed);
});
test("football contracts replace employment, have finite duration, and cannot be renewed by generic raises", () => {
  let s = fresh({ age: 20, career: "football" });
  const o = footballInvitation(s);
  s = g.acceptFootballOffer(s, o.id);
  assert.equal(s.employment.jobId, "football-2");
  assert.equal(g.salary(s), 3500);
  assert.equal(s.football.contract.expiresWeek, 104);
  assert.throws(() => g.requestRaise(s), /contract offers/);
  s.week = 103;
  s.money = 100000;
  const r = next(s);
  assert.equal(r.employment, null);
  assert.equal(r.football.stage, "community");
  assert.equal(r.football.contract, null);
  assert.equal(g.salary(r), 0);
  assert.deepEqual(g.restoreGame(r), r);
});
test("expired or injured football invitations cannot be accepted; stepping away ends income", () => {
  let s = fresh({ age: 18, career: "football" });
  const o = footballInvitation(s);
  s.football.injuryWeeks = 2;
  assert.throws(() => g.acceptFootballOffer(s, o.id), /Recover/);
  s.football.injuryWeeks = 0;
  o.expiresWeek = 0;
  assert.throws(() => g.acceptFootballOffer(s, o.id), /expired/);
  o.expiresWeek = 4;
  s = g.acceptFootballOffer(s, o.id);
  assert.throws(() => g.leaveFootball(s), /release clause/);
  s.money = 100000;
  const release = g.sportExitCost(s, "football");
  s = g.leaveFootball(s);
  assert.equal(s.money, 100000 - release);
  assert.equal(g.salary(s), 0);
  assert.equal(s.football.stage, "retired");
  assert.equal(s.football.contract, null);
});
test("sports develop through local events, with explicit age and competition-licence gates", () => {
  for (const id of ["racing", "basketball", "tennis"]) {
    let s = fresh({ age: 14, career: id });
    assert.equal(s.sports[id].stage, "local");
    s = g.setSportTraining(s, id, "technical");
    const r = steps(s, 12);
    assert.ok(r.sports[id].ability > s.sports[id].ability);
    assert.ok(r.sports[id].events > 0);
    assert.equal(r.employment, null);
    assert.deepEqual(g.restoreGame(r), r);
  }
  let s = fresh({ age: 14, career: "racing" });
  s.skills.driving = 100;
  assert.throws(() => g.enrolEducation(s, "racing-license"), /age 16/);
  s.startAge = 16;
  const o = sportsInvitation(s, "racing");
  assert.throws(() => g.acceptSportOffer(s, "racing", o.id), /licence/);
  s.education.completed.push("racing-license");
  s = g.acceptSportOffer(s, "racing", o.id);
  assert.equal(s.employment.jobId, "racing-1");
  assert.deepEqual(g.restoreGame(s), s);
});
test("academy recruitment and junior competition occur without a job application", () => {
  let s = fresh({ age: 16, career: "basketball" });
  const o = sportsInvitation(s, "basketball", "academy");
  s = g.acceptSportOffer(s, "basketball", o.id);
  assert.equal(s.sports.basketball.stage, "academy");
  assert.equal(s.employment, null);
  s.sports.basketball.experience = 104;
  s.sports.basketball.ability = 85;
  s.skills.athletics = 90;
  s.sports.basketball.nextScoutWeek = 1;
  let offer;
  for (let seed = 1; seed < 100; seed++) {
    const attempt = structuredClone(s);
    attempt.seed = seed;
    const r = next(attempt);
    offer = r.sports.basketball.offers.find(
      (o) => o.kind === "contract" && o.status === "offered",
    );
    if (offer) {
      s = r;
      break;
    }
  }
  assert.ok(offer);
  s = g.acceptSportOffer(s, "basketball", offer.id);
  assert.equal(s.sports.basketball.stage, "junior");
  assert.equal(s.employment.jobId, "basketball-1");
  assert.equal(s.applications.length, 0);
});
test("switching paid sporting contracts leaves other sports as local hobbies, and resignation keeps saves consistent", () => {
  let s = fresh({ age: 20, career: "football" });
  s.money = 100000;
  s = g.acceptFootballOffer(s, footballInvitation(s).id);
  const footballExit = g.sportExitCost(s, "football");
  s = g.acceptSportOffer(s, "basketball", sportsInvitation(s, "basketball").id);
  assert.equal(s.money, 100000 - footballExit);
  assert.equal(s.football.contract, null);
  assert.equal(s.football.stage, "community");
  assert.equal(s.employment.jobId, "basketball-1");
  const basketballExit = g.sportExitCost(s, "basketball");
  s = g.resignJob(s);
  assert.equal(s.money, 100000 - footballExit - basketballExit);
  assert.equal(s.sports.basketball.contract, null);
  assert.equal(g.salary(s), 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("local sports remain available later in life while new professional contracts have retirement limits", () => {
  let s = fresh({ age: 50, career: "football" });
  s = g.joinSport(s, "tennis");
  const r = next(s);
  assert.equal(r.football.stage, "community");
  assert.equal(r.sports.tennis.stage, "local");
  assert.ok(r.football.matches > 0);
  assert.throws(
    () => g.acceptFootballOffer(s, footballInvitation(s).id),
    /age 40/,
  );
  assert.throws(
    () => g.acceptSportOffer(s, "tennis", sportsInvitation(s, "tennis").id),
    /age 42/,
  );
});
test("a school-age karting life can reach an F1 offer through funded licensing, development, and professional experience", () => {
  let s = fresh({ age: 14, career: "racing", trait: "Athletic" });
  // External funding pays for licensing and junior seats, without granting sporting credentials.
  s = g.debugEdit(g.toggleDebug(s, true), { money: 500000 });
  s = g.setSportTraining(s, "racing", "technical");
  const categories = new Set();
  for (let i = 0; i < 1000 && s.employment?.jobId !== "racing-4"; i++) {
    s = clear(s);
    s = g.setActivity(
      s,
      s.energy < 35 ? "rest" : s.education.active ? "study" : "balanced",
    );
    for (const o of s.sports.racing.offers.filter(
      (o) => o.status === "offered",
    ))
      if (!s.sports.racing.injuryWeeks && s.actions) {
        s = g.acceptSportOffer(s, "racing", o.id);
        if (o.jobId) categories.add(o.jobId);
      }
    if (!s.education.active)
      for (const id of [
        "racing-license",
        "international-license",
        "super-license",
      ])
        if (!s.education.completed.includes(id)) {
          try {
            s = g.enrolEducation(s, id);
            s = g.setActivity(s, s.energy < 25 ? "rest" : "study");
          } catch {}
          break;
        }
    s = next(s);
  }
  assert.deepEqual(
    [...categories],
    ["racing-1", "racing-2", "racing-3", "racing-4"],
  );
  assert.equal(s.employment.jobId, "racing-4");
  assert.ok(s.education.completed.includes("super-license"));
  assert.ok(s.progress.racing.weeks >= 312);
  assert.ok(g.age(s) < 40);
  assert.deepEqual(g.restoreGame(s), s);
});
test("the expanded shop has over fifty distinct possessions, age limits, recurring costs, and practical equipment benefits", () => {
  const items = g.SHOP.filter((i) => i.category !== "Ownership");
  assert.ok(items.length > 50);
  assert.equal(new Set(g.SHOP.map((i) => i.id)).size, g.SHOP.length);
  assert.throws(() => g.buy(fresh({ age: 14 }), "used-car"), /older/);
  let s = g.buy(fresh(), "monitor");
  s = g.setActivity(s, "study");
  const r = next(s),
    without = next(g.setActivity(fresh(), "study"));
  assert.ok(r.skills.finance > without.skills.finance);
  s = g.buy(fresh(), "phone");
  assert.equal(g.expenses(s), 282);
  s.money = 100000;
  s = g.buy(s, "studio-home");
  assert.equal(g.expenses(s), 177);
});
test("experiences use time and money, alter relationships or craft, and have persistent cooldowns", () => {
  const s = fresh(),
    r = g.takeExperience(s, "dinner");
  assert.equal(r.money, s.money - 45);
  assert.equal(r.actions, 2);
  assert.ok(r.relationships[0].bond > s.relationships[0].bond);
  assert.throws(() => g.takeExperience(r, "dinner"), /not available/);
  assert.ok(g.takeExperience(next(r), "dinner"));
  assert.throws(
    () => g.takeExperience(fresh({ age: 14 }), "holiday"),
    /age 18/,
  );
  assert.throws(
    () => g.takeExperience(s, "football-camp"),
    /active grassroots/,
  );
  const p = g.takeExperience(s, "photo-class");
  assert.equal(p.social.contentSkill, 23);
  assert.deepEqual(g.restoreGame(p), p);
});
test("social accounts need suitable equipment and age, and start without followers", () => {
  assert.throws(() => g.openSocialAccount(fresh(), "lens"), /smartphone/);
  let s = fresh({ age: 12 });
  s.money = 2000;
  s = g.buy(s, "laptop");
  assert.throws(() => g.openSocialAccount(s, "lens"), /age 13/);
  s = creator();
  assert.equal(s.social.profiles.lens.followers, 0);
  assert.equal(s.fame.recognition, 0);
  assert.throws(() => g.openSocialAccount(s, "lens"), /already open/);
});
test("content consumes resources, resolves next week, and caps output without guaranteeing fame", () => {
  let s = creator();
  const money = s.money,
    energy = s.energy;
  s = g.createPost(s, { platform: "lens" });
  assert.equal(s.money, money - 5);
  assert.equal(s.energy, energy - 5);
  assert.equal(s.social.posts[0].status, "pending");
  assert.equal(s.social.profiles.lens.followers, 0);
  s = g.createPost(s, { platform: "lens" });
  s.actions = 3;
  assert.throws(() => g.createPost(s, { platform: "lens" }), /at most two/);
  assert.notEqual(s.social.posts[0].id, s.social.posts[1].id);
  s = next(s);
  assert.equal(s.social.posts[0].status, "resolved");
  assert.ok(s.social.posts[0].views >= 0);
  assert.ok(s.fame.recognition < 15);
  assert.deepEqual(g.restoreGame(s), s);
});
test("long-form video and streaming use different equipment and production budgets", () => {
  let s = creator();
  s = g.openSocialAccount(s, "tube");
  s = g.createPost(s, { platform: "tube", approach: "polished" });
  assert.equal(s.social.posts[0].platform, "tube");
  assert.ok(s.social.posts[0].quality > 20);
  s = next(s);
  s = g.openSocialAccount(s, "stream");
  assert.throws(() => g.createPost(s, { platform: "stream" }), /computer/);
  s = g.buy(s, "laptop");
  const cash = s.money;
  s = g.createPost(s, { platform: "stream" });
  assert.equal(s.money, cash - 15);
});
test("equipment improves quality, while clickbait reduces reputation and private accounts do not gain followers", () => {
  let s = creator(),
    p = g.createPost(s, { platform: "lens", approach: "polished" });
  s = g.buy(s, "camera");
  const q = g.createPost(s, { platform: "lens", approach: "polished" });
  assert.ok(q.social.posts[0].quality > p.social.posts[0].quality);
  const click = g.createPost(s, { platform: "lens", approach: "clickbait" });
  assert.equal(click.fame.reputation, 60);
  s = g.configureSocial(s, { niche: "lifestyle", privacy: "private" });
  s.social.profiles.lens.followers = 100;
  s = g.createPost(s, { platform: "lens" });
  s = next(s);
  assert.equal(s.social.profiles.lens.followers, 100);
  assert.equal(s.social.weeklyIncome, 0);
  assert.equal(s.social.posts[0].gained, 0);
});
test("public creator advertising requires an audience and recent delivered posts; inactive audiences shrink", () => {
  let s = creator();
  s.social.profiles.lens.followers = 10000;
  s.social.profiles.lens.lastPostWeek = 0;
  const r = next(s);
  assert.ok(r.social.weeklyIncome > 0);
  assert.equal(r.money, s.money - 282 + r.social.weeklyIncome);
  s.week = 5;
  const inactive = next(s);
  assert.ok(inactive.social.profiles.lens.followers < 10000);
  assert.equal(inactive.social.weeklyIncome, 0);
});
test("sponsor acceptance does not give instant cash; paid delivery requires labelled public content", () => {
  let s = creator();
  s.social.contentSkill = 80;
  s.social.offers.push({
    id: "sponsor:test",
    platform: "lens",
    brand: "Test brand",
    fee: 500,
    status: "offered",
    expiresWeek: 4,
  });
  const cash = s.money;
  s = g.acceptSponsor(s, "sponsor:test");
  assert.equal(s.money, cash);
  s = g.createPost(s, {
    platform: "lens",
    sponsored: true,
    approach: "polished",
  });
  assert.throws(
    () =>
      g.createPost({ ...s, actions: 3 }, { platform: "lens", sponsored: true }),
    /awaiting delivery/,
  );
  s = next(s);
  assert.equal(s.social.deals[0].status, "completed");
  assert.equal(s.social.weeklyIncome, 500);
  assert.equal(s.money, cash - 5 - 282 + 500 - s.banking.tax.lastWeekly);
  assert.deepEqual(g.restoreGame(s), s);
});
test("missed sponsor deadlines and inadequate deliveries earn nothing and reduce reputation", () => {
  let s = creator();
  s.social.offers.push({
    id: "sponsor:test",
    platform: "lens",
    brand: "Test brand",
    fee: 500,
    status: "offered",
    expiresWeek: 4,
  });
  s = g.acceptSponsor(s, "sponsor:test");
  const reputation = s.fame.reputation;
  s = steps(s, 3);
  assert.equal(s.social.deals[0].status, "failed");
  assert.equal(s.social.weeklyIncome, 0);
  assert.ok(s.fame.reputation < reputation);
});
test("singers, rappers, and producers develop separate craft through practice", () => {
  for (const [role, key] of [
    ["singer", "vocals"],
    ["rapper", "lyrics"],
    ["producer", "production"],
  ]) {
    const s = musician(role);
    assert.equal(s.music.sessions, 8);
    assert.ok(s.music.skills[key] >= 23);
    assert.equal(s.music.role, role);
    assert.equal(s.employment, null);
    assert.equal(s.music.weeklyIncome, 0);
    assert.deepEqual(g.restoreGame(s), s);
  }
});
test("recording needs craft, equipment, funding, and four weeks before a release earns royalties", () => {
  assert.throws(
    () => g.startMusicProject(fresh(), { title: "First song" }),
    /direction/,
  );
  let s = musician();
  const cash = s.money;
  s = g.startMusicProject(s, { title: "First song" });
  assert.equal(s.money, cash - 150);
  assert.equal(s.music.releases.length, 0);
  assert.throws(
    () => g.startMusicProject({ ...s, actions: 3 }, { title: "Second song" }),
    /current recording/,
  );
  s = steps(s, 3);
  assert.equal(s.music.releases.length, 0);
  s = next(s);
  assert.equal(s.music.projects[0].status, "released");
  assert.equal(s.music.releases[0].title, "First song");
  assert.ok(s.music.releases[0].totalStreams > 0);
  assert.ok(s.music.totalIncome > 0);
  assert.equal(s.music.weeklyIncome, s.music.releases[0].totalRoyalties);
  assert.deepEqual(g.restoreGame(s), s);
});
test("music gigs require booking and pay only after a successful performance", () => {
  let s = musician();
  s.music.skills.vocals = 100;
  s.music.gigs.push({
    id: "gig:test",
    venue: "Local venue",
    fee: 120,
    status: "offered",
    expiresWeek: s.week + 3,
    performanceWeek: null,
  });
  const cash = s.money;
  s = g.bookMusicGig(s, "gig:test");
  assert.equal(s.money, cash);
  let delivered = false;
  for (let seed = 1; seed < 100; seed++) {
    const q = structuredClone(s);
    q.seed = seed;
    const r = next(q);
    if (r.music.gigs[0].status === "performed") {
      assert.equal(r.music.weeklyIncome, 120);
      delivered = true;
      break;
    }
  }
  assert.ok(delivered);
});
test("label advances are recouped from royalty share before additional cash is paid", () => {
  let s = musician();
  s.music.labelOffers.push({
    id: "label:test",
    name: "Independent label",
    advance: 1000,
    status: "offered",
    expiresWeek: s.week + 4,
  });
  const cash = s.money;
  s = g.acceptLabelOffer(s, "label:test");
  assert.equal(s.money, cash + 1000 - s.banking.tax.lastWeekly);
  s.music.releases.push({
    id: "release:test",
    title: "First song",
    genre: "Pop",
    role: "singer",
    quality: 80,
    releasedWeek: 0,
    totalStreams: 0,
    weeklyStreams: 10000,
    initialStreams: 10000,
    totalRoyalties: 0,
  });
  s = next(s);
  assert.equal(s.music.weeklyIncome, 0);
  assert.ok(s.music.label.unrecouped < 1000);
  assert.equal(s.music.releases[0].totalRoyalties, 0);
  assert.throws(
    () => g.acceptLabelOffer({ ...s, actions: 3 }, "label:test"),
    /expired/,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("v2 saves retain existing professional pay and investments while pending athlete applications are retired", () => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/v2-save.json", import.meta.url),
      "utf8",
    ),
  );
  old.applications.push({
    id: "pending:test",
    vacancyId: "football-3:0",
    jobId: "football-3",
    status: "pending",
    appliedWeek: 0,
    decisionWeek: 2,
    expiresWeek: 6,
    exceptional: false,
  });
  const original = structuredClone(old),
    s = g.restoreGame(old);
  assert.equal(s.version, g.VERSION);
  assert.equal(s.money, old.money);
  assert.equal(s.employment.weeklyPay, 3700);
  assert.equal(s.holdings.tech, 100);
  assert.equal(s.football.stage, "professional");
  assert.equal(s.football.contract.expiresWeek, null);
  assert.equal(s.applications[0].status, "rejected");
  assert.deepEqual(old, original);
  assert.deepEqual(g.restoreGame(s), s);
});
test("corrupt path and creative state is rejected, and valid long-running lives round trip with bounded histories", () => {
  const mutations = [
    (s) => (s.football.ability = 101),
    (s) => (s.sports.racing.stage = "f1-job"),
    (s) => (s.social.profiles.lens.followers = -1),
    (s) => (s.social.posts = [{}]),
    (s) => (s.music.skills.production = Infinity),
    (s) => (s.experienceCooldowns.unknown = 1),
  ];
  for (const mutate of mutations) {
    const s = fresh();
    mutate(s);
    assert.throws(() => g.restoreGame(s));
  }
  let s = creator();
  s.money = 100000;
  s = g.configureSocial(s, { niche: "music", privacy: "public" });
  s = g.configureMusic(s, { role: "rapper", genre: "Hip-hop" });
  for (let i = 0; i < 150; i++) {
    s = g.setActivity(s, s.energy < 25 ? "rest" : "balanced");
    s = g.createPost(s, { platform: "lens" });
    s = next(s);
  }
  assert.ok(s.social.posts.length <= 24);
  assert.ok(s.social.history.length <= 26);
  assert.deepEqual(g.restoreGame(s), s);
});
