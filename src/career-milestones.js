import {
  JOBS,
  jobDefinition,
  TRACK_SKILLS,
  availableCash,
  rng,
} from "./world.js";
import { spendTime } from "./calendar.js";
import { standings, enhanceSportOffer, AGENTS } from "./seasons.js";
import { receiveIncome } from "./banking.js";
import { musicManagerCommission } from "./career-support.js";

export const MILESTONE_PATHS = [
  "football",
  "racing",
  "basketball",
  "tennis",
  "music",
];
export const CAREER_CHALLENGES = [
  {
    id: "cup",
    path: "football",
    title: "Cup squad selection",
    cost: 0,
    hours: 8,
    delay: 1,
  },
  {
    id: "draft",
    path: "basketball",
    title: "Development draft combine",
    cost: 150,
    hours: 8,
    delay: 4,
  },
  {
    id: "playoff",
    path: "basketball",
    title: "Playoff roster",
    cost: 0,
    hours: 8,
    delay: 1,
  },
  {
    id: "test",
    path: "racing",
    title: "Team testing programme",
    cost: 500,
    hours: 6,
    delay: 1,
  },
  {
    id: "qualifier",
    path: "tennis",
    title: "Tour qualifying draw",
    cost: 150,
    hours: 8,
    delay: 1,
  },
  {
    id: "showcase",
    path: "music",
    title: "Audition / production showcase",
    cost: 50,
    hours: 6,
    delay: 1,
  },
  {
    id: "festival",
    path: "music",
    title: "Festival booking pitch",
    cost: 75,
    hours: 8,
    delay: 1,
  },
];
export const MILESTONE_LABELS = {
  "football:school": "School football debut",
  "football:academy": "Football academy place",
  "football:contract": "First playing contract",
  "football:appearance": "Professional football appearance",
  "football:cup": "Cup winner",
  "basketball:academy": "Basketball academy place",
  "basketball:contract": "First basketball contract",
  "basketball:appearance": "Professional basketball appearance",
  "basketball:draft": "Draft selection",
  "basketball:playoff": "Playoff champion",
  "racing:kart": "First karting outing",
  "racing:licence": "National competition licence",
  "racing:1": "Formula 4 seat",
  "racing:2": "Formula 3 seat",
  "racing:3": "Formula 2 seat",
  "racing:4": "Formula 1 seat",
  "racing:test": "Successful team test",
  "tennis:debut": "First tennis event",
  "tennis:contract": "First tour sponsorship",
  "tennis:qualifier": "Qualified through the draw",
  "tennis:win": "First event win",
  "music:release": "Debut release",
  "music:practice": "Fifty practice sessions",
  "music:collaboration": "First shared release",
  "music:album": "First album",
  "music:audience": "A thousand listeners",
  "music:showcase": "Successful audition or showcase",
  "music:festival": "Festival performance",
};
const age = (s) => s.startAge + Math.floor(s.week / 52);
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
const clamp = (n) => Math.max(0, Math.min(100, n));
const skillKey = (role) =>
  ({ producer: "production", singer: "vocals", rapper: "lyrics" })[role];
function remember(s, path, title, detail) {
  const p = s.careerMilestones.paths[path];
  p.history.unshift({ week: s.week, title, detail });
  p.history = p.history.slice(0, 40);
  s.log.unshift({
    week: s.week,
    text: `${title}: ${detail}`,
    kind: "milestone",
  });
  s.log = s.log.slice(0, 40);
}
function unlock(s, id) {
  const path = id.split(":")[0],
    p = s.careerMilestones.paths[path];
  if (!p.unlocks.includes(id)) {
    p.unlocks.push(id);
    remember(
      s,
      path,
      MILESTONE_LABELS[id],
      "Recorded from your actual career progress.",
    );
  }
}
export function initializeMilestones(s) {
  s.careerMilestones = {
    seed: (s.seed ^ 0xcafe1234) >>> 0,
    paths: Object.fromEntries(
      MILESTONE_PATHS.map((id) => [
        id,
        {
          unlocks: [],
          history: [],
          opportunities: [],
          lastOffered: {},
          stats: {
            year: Math.floor(s.week / 52),
            appearances: 0,
            wins: 0,
            lastFixtureId: null,
            lastProcessedWeek: -1,
            seasonAwardYear: -1,
          },
        },
      ]),
    ),
  };
}
export function challengeEligibility(s, kind) {
  const d = CAREER_CHALLENGES.find((x) => x.id === kind),
    missing = [];
  if (!d) return ["a known career opportunity"];
  const p = d.path === "music" ? s.music : actor(s, d.path);
  if (d.path === "music") {
    if (
      !p.active ||
      age(s) < (kind === "festival" ? 18 : 14) ||
      p.sessions < 12 ||
      p.skills[skillKey(p.role)] < (kind === "festival" ? 50 : 40)
    )
      missing.push("age, regular practice and sufficient music craft");
    const owned = p.releases.filter(
      (r) => (s.careerWorld.music.rights[r.id]?.share ?? 1) > 0,
    ).length;
    if (
      owned < (kind === "festival" ? 2 : 1) ||
      p.fans < (kind === "festival" ? 500 : 10)
    )
      missing.push("owned releases and a real music audience");
  } else {
    if (["none", "retired"].includes(p.stage) || p.injuryWeeks)
      missing.push("an active, healthy sporting pathway");
    if (["cup", "playoff"].includes(kind)) {
      const place = standings(s, d.path).findIndex((t) => t.id === 0) + 1;
      if (
        !p.contract ||
        s.career !== d.path ||
        s.week % 52 < 39 ||
        s.week % 52 > 43 ||
        place > (kind === "cup" ? 8 : 4) ||
        s.careerMilestones.paths[d.path].stats.appearances < 5
      )
        missing.push(
          "a qualifying professional league season and regular appearances",
        );
    } else if (kind === "draft") {
      if (
        age(s) < 18 ||
        age(s) > 22 ||
        p.contract ||
        s.week % 52 < 26 ||
        s.week % 52 > 33 ||
        p.experience < 52 ||
        p.events < 20 ||
        p.ability < 65 ||
        s.skills.athletics < 65
      )
        missing.push(
          "age 18–22, combine window weeks 26–33, a year of basketball and twenty events, with 65 ability and athletics",
        );
    } else {
      if (
        age(s) < 16 ||
        age(s) >= 42 ||
        p.ability < 50 ||
        s.skills[TRACK_SKILLS[d.path]] < 50 ||
        (!p.contract && p.experience < 52)
      )
        missing.push(
          "age 16–41, a year of development or a professional contract, and 50 skill and ability",
        );
      if (kind === "test" && !s.education.completed.includes("racing-license"))
        missing.push("the national racing licence");
    }
  }
  return missing;
}
export function bookCareerChallenge(state, path, id) {
  const o = state.careerMilestones.paths[path]?.opportunities.find(
      (o) => o.id === id,
    ),
    d = CAREER_CHALLENGES.find((d) => d.id === o?.kind);
  if (
    state.ended ||
    state.event ||
    !state.actions ||
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week ||
    state.energy < 25
  )
    throw new Error("Choose a live career opportunity with time and energy.");
  const missing = challengeEligibility(state, o.kind);
  if (missing.length) throw new Error(`Requires: ${missing.join(", ")}.`);
  const performanceWeek = state.week + d.delay;
  if (
    state.careerMilestones.paths[path].opportunities.some(
      (x) => x.status === "booked",
    ) ||
    (path === "music"
      ? state.careerWorld.music.tours.some((t) =>
          t.stops.some(
            (x) => x.status === "scheduled" && x.week === performanceWeek,
          ),
        ) ||
        state.music.gigs.some(
          (g) => g.status === "booked" && g.performanceWeek === performanceWeek,
        )
      : state.careerWorld.sports[path].invitations.some(
          (x) => x.status === "booked" && x.performanceWeek === performanceWeek,
        ))
  )
    throw new Error(
      "This pathway already has conflicting performance commitments.",
    );
  if (availableCash(state) < d.cost)
    throw new Error(`Preparation, travel or entry costs $${d.cost}.`);
  const s = structuredClone(state);
  spendTime(s, 3, "Career opportunity preparation");
  s.actions--;
  s.money -= d.cost;
  const q = s.careerMilestones.paths[path].opportunities.find(
    (x) => x.id === id,
  );
  q.status = "booked";
  q.performanceWeek = performanceWeek;
  q.role = path === "music" ? s.music.role : null;
  q.club = path === "music" ? null : actor(s, path).club;
  remember(
    s,
    path,
    d.title,
    `Booked for week ${performanceWeek}; $${d.cost} costs paid. Success and recruitment remain uncertain.`,
  );
  return s;
}
export const milestoneAway = (s, path, week = s.week) =>
  (s.careerMilestones?.paths[path]?.opportunities || []).some(
    (o) => o.status === "booked" && o.performanceWeek === week,
  );
export const milestoneHours = (s, week = s.week) =>
  MILESTONE_PATHS.reduce(
    (n, path) =>
      n +
      (s.careerMilestones?.paths[path]?.opportunities || []).reduce(
        (sum, o) =>
          sum +
          (o.status === "booked" && o.performanceWeek === week
            ? CAREER_CHALLENGES.find((d) => d.id === o.kind).hours
            : 0),
        0,
      ),
    0,
  );
function sportPrize(s, path, amount) {
  const a = AGENTS.find((a) => a.id === s.seasons[path].agent?.id),
    fee = Math.round(amount * (a?.rate || 0) * 100) / 100;
  receiveIncome(s, amount, "earned", { deduction: fee });
  s.money = Math.round((s.money - fee) * 100) / 100;
}
function recruitment(s, path, kind) {
  const p = actor(s, path),
    current = p.contract ? jobDefinition(p.contract.jobId).level : 0;
  const j = JOBS.find(
    (j) => j.track === path && j.level === Math.min(4, current + 1),
  );
  if (
    !j ||
    p.ability < j.skill ||
    s.skills[TRACK_SKILLS[path]] < j.skill ||
    (j.level === 1 ? p.experience : s.progress[path].weeks) < j.experience ||
    (j.qualification && !s.education.completed.includes(j.qualification))
  )
    return false;
  const o = {
    id: `milestone:${path}:${kind}:${s.week}`,
    kind: "contract",
    club:
      path === "basketball"
        ? "Cedar Development Basketball"
        : path === "racing"
          ? "Vector Motorsport"
          : "Meridian Tour Sponsorship",
    jobId: j.id,
    pay: j.pay,
    duration: 104,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  enhanceSportOffer(s, path, o);
  p.offers.push(o);
  p.offers = p.offers.slice(-12);
  return true;
}
export function advanceMilestones(s) {
  for (const path of MILESTONE_PATHS) {
    const m = s.careerMilestones.paths[path];
    if (path !== "music") {
      const p = actor(s, path),
        stats = m.stats,
        season = s.seasons[path];
      if (stats.year !== season.year) {
        stats.year = season.year;
        stats.appearances = 0;
        stats.wins = 0;
        stats.lastFixtureId = null;
        stats.lastProcessedWeek = -1;
      }
      for (const f of season.fixtures.filter(
        (f) => f.week === s.week && stats.lastProcessedWeek !== s.week,
      )) {
        stats.lastFixtureId = f.id;
        if (f.status === "played" && p.contract && s.career === path) {
          stats.appearances++;
          if (f.result.won) stats.wins++;
          if (["football", "basketball"].includes(path))
            unlock(s, `${path}:appearance`);
        }
      }
      stats.lastProcessedWeek = s.week;
      if (
        p.contract &&
        stats.appearances >= 5 &&
        season.fixtures.every((f) => f.status !== "scheduled") &&
        stats.seasonAwardYear !== season.year
      ) {
        stats.seasonAwardYear = season.year;
        const place = standings(s, path).findIndex((t) => t.id === 0) + 1;
        remember(
          s,
          path,
          place === 1
            ? "Season champion"
            : place <= 3
              ? "Season podium"
              : "Season completed",
          `${season.club || s.name}: position ${place}, ${stats.appearances} recorded professional appearances this season.`,
        );
      }
      if (path === "football") {
        if (p.schoolWeeks) unlock(s, "football:school");
        if (p.stage === "academy") unlock(s, "football:academy");
        if (p.contract) unlock(s, "football:contract");
      } else if (path === "basketball") {
        if (p.stage === "academy") unlock(s, "basketball:academy");
        if (p.contract) unlock(s, "basketball:contract");
      } else if (path === "racing") {
        if (p.stage === "local" && p.events) unlock(s, "racing:kart");
        if (s.education.completed.includes("racing-license"))
          unlock(s, "racing:licence");
        if (p.contract)
          unlock(s, `racing:${jobDefinition(p.contract.jobId).level}`);
      } else {
        if (p.events) unlock(s, "tennis:debut");
        if (p.contract) unlock(s, "tennis:contract");
        if (p.wins) unlock(s, "tennis:win");
      }
    } else {
      if (
        s.music.releases.some(
          (r) => (s.careerWorld.music.rights[r.id]?.share ?? 1) > 0,
        )
      )
        unlock(s, "music:release");
      if (s.music.sessions >= 50) unlock(s, "music:practice");
      if (
        s.careerWorld.music.offers.some(
          (o) => o.kind === "collaboration" && o.status === "released",
        )
      )
        unlock(s, "music:collaboration");
      if (s.careerWorld.music.albums.some((a) => a.status === "released"))
        unlock(s, "music:album");
      if (s.music.fans >= 1000) unlock(s, "music:audience");
    }
    for (const o of m.opportunities) {
      if (o.status === "offered" && o.expiresWeek <= s.week)
        o.status = "expired";
      if (o.status !== "booked" || o.performanceWeek > s.week) continue;
      const p = path === "music" ? s.music : actor(s, path);
      const skill =
        path === "music"
          ? p.skills[skillKey(o.role)]
          : p.ability * 0.75 + s.skills[TRACK_SKILLS[path]] * 0.25;
      const eligible =
        path === "music"
          ? p.active
          : !["none", "retired"].includes(p.stage) &&
            !p.injuryWeeks &&
            (!["cup", "playoff"].includes(o.kind) ||
              (p.contract && p.club === o.club && s.career === path));
      const score = Math.round(
        clamp(
          skill * 0.8 + s.energy * 0.2 + (rng(s.careerMilestones) * 2 - 1) * 15,
        ),
      );
      const success =
        eligible &&
        s.calendar.last?.mandatory <= 168 &&
        s.energy >= 20 &&
        rng(s.careerMilestones) <
          Math.min(0.9, 0.2 + score * 0.008 - o.stage * 0.08);
      o.results.push({ week: s.week, score, success });
      s.energy = Math.max(0, s.energy - 8);
      if (!success) {
        o.status = "failed";
        remember(
          s,
          path,
          CAREER_CHALLENGES.find((d) => d.id === o.kind).title,
          "The assessment, performance or draw did not succeed. Entry costs remain spent; your existing career continues.",
        );
        continue;
      }
      if (["cup", "playoff"].includes(o.kind) && o.stage < 2) {
        o.stage++;
        o.performanceWeek = s.week + 1;
        remember(
          s,
          path,
          "Advanced to the next round",
          `The next ${o.kind} appearance reserves eight hours in week ${o.performanceWeek}.`,
        );
        continue;
      }
      o.status = "completed";
      if (path === "music") {
        s.music.fans += o.kind === "festival" ? 75 : 20;
        s.fame.recognition = clamp(
          s.fame.recognition + (o.kind === "festival" ? 2 : 1),
        );
        unlock(s, `music:${o.kind}`);
        if (o.kind === "festival") {
          const gross = 500,
            commission = musicManagerCommission(s, gross);
          receiveIncome(s, gross, "earned", { deduction: commission });
          s.money = Math.round((s.money - commission) * 100) / 100;
          s.music.weeklyIncome += gross;
          s.music.totalIncome += gross;
        }
      } else {
        p.reputation = clamp(p.reputation + 2);
        if (["cup", "playoff"].includes(o.kind)) {
          sportPrize(s, path, 2000);
          unlock(s, `${path}:${o.kind}`);
        } else if (o.kind === "qualifier") {
          sportPrize(s, path, 500);
          unlock(s, "tennis:qualifier");
        } else if (o.kind === "test") unlock(s, "racing:test");
        const offer =
          ["draft", "test", "qualifier"].includes(o.kind) &&
          recruitment(s, path, o.kind);
        if (o.kind === "draft" && offer) unlock(s, "basketball:draft");
        remember(
          s,
          path,
          "Assessment completed",
          offer
            ? "A qualified contract offer followed. Review funding, exit clauses and terms, then sign separately."
            : "Your sporting reputation improved. Higher-tier contracts still require experience, ability and competition qualifications.",
        );
      }
    }
    for (const d of CAREER_CHALLENGES.filter((d) => d.path === path)) {
      const last = m.lastOffered[d.id];
      const seasonal = ["cup", "playoff", "draft"].includes(d.id);
      if (
        m.opportunities.some(
          (o) => o.kind === d.id && ["offered", "booked"].includes(o.status),
        ) ||
        (last !== undefined &&
          (seasonal
            ? Math.floor(last / 52) === Math.floor(s.week / 52)
            : s.week < last + 13)) ||
        challengeEligibility(s, d.id).length
      )
        continue;
      m.lastOffered[d.id] = s.week;
      m.opportunities.push({
        id: `challenge:${d.id}:${s.week}`,
        kind: d.id,
        status: "offered",
        expiresWeek: s.week + 4,
        performanceWeek: null,
        role: null,
        club: null,
        stage: 0,
        results: [],
      });
      m.opportunities = m.opportunities.slice(-12);
      remember(
        s,
        path,
        d.title,
        "You meet the invitation requirements. Review the cost and time before entering.",
      );
    }
  }
}
export function validateMilestones(s) {
  const root = s.careerMilestones,
    w = (v, min = 0) => Number.isInteger(v) && v >= min && v <= 1e12,
    str = (v) => typeof v === "string" && v.length > 0 && v.length <= 500;
  const fail = () => {
    throw new Error("Invalid career milestones or assessment data in save.");
  };
  if (
    !root?.paths ||
    !w(root.seed) ||
    root.seed > 4294967295 ||
    Object.keys(root.paths).length !== 5
  )
    fail();
  for (const path of MILESTONE_PATHS) {
    const m = root.paths[path];
    if (
      !m ||
      !Array.isArray(m.unlocks) ||
      m.unlocks.length > 30 ||
      new Set(m.unlocks).size !== m.unlocks.length ||
      m.unlocks.some(
        (id) => !MILESTONE_LABELS[id] || !id.startsWith(`${path}:`),
      ) ||
      !Array.isArray(m.history) ||
      m.history.length > 40 ||
      m.history.some(
        (h) => !w(h.week) || h.week > s.week || !str(h.title) || !str(h.detail),
      ) ||
      !Array.isArray(m.opportunities) ||
      m.opportunities.length > 12 ||
      !m.lastOffered ||
      Object.entries(m.lastOffered).some(
        ([id, week]) =>
          !CAREER_CHALLENGES.some((d) => d.id === id && d.path === path) ||
          !w(week) ||
          week > s.week,
      ) ||
      !m.stats ||
      !w(m.stats.year) ||
      !w(m.stats.appearances) ||
      !w(m.stats.wins) ||
      m.stats.wins > m.stats.appearances ||
      !w(m.stats.seasonAwardYear, -1) ||
      !w(m.stats.lastProcessedWeek, -1) ||
      m.stats.lastProcessedWeek > s.week ||
      (m.stats.lastFixtureId !== null && !str(m.stats.lastFixtureId))
    )
      fail();
    for (const o of m.opportunities)
      if (
        !str(o.id) ||
        !CAREER_CHALLENGES.some((d) => d.id === o.kind && d.path === path) ||
        !["offered", "booked", "completed", "failed", "expired"].includes(
          o.status,
        ) ||
        !w(o.expiresWeek) ||
        (o.performanceWeek !== null && !w(o.performanceWeek)) ||
        (o.status === "booked" && o.performanceWeek === null) ||
        !w(o.stage) ||
        o.stage > 2 ||
        (o.role !== null &&
          !["producer", "singer", "rapper"].includes(o.role)) ||
        (path === "music" && o.status === "booked" && o.role === null) ||
        (o.club !== null && !str(o.club)) ||
        !Array.isArray(o.results) ||
        o.results.length > 3 ||
        o.results.some(
          (r) =>
            !w(r.week) ||
            r.week > s.week ||
            !w(r.score) ||
            r.score > 100 ||
            typeof r.success !== "boolean",
        )
      )
        fail();
  }
}
