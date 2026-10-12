import { placeCountry, immigrationRule } from "./geography.js";
import { checkMusicOutsideWork } from "./contracts.js";
import { milestoneAway } from "./career-milestones.js";
import {
  JOBS,
  jobDefinition,
  availableCash,
  rng,
  TRACK_SKILLS,
} from "./world.js";
import { spendTime } from "./calendar.js";
import { enhanceSportOffer, syncSeason, AGENTS } from "./seasons.js";
import { acceptFootballOffer } from "./life.js";
import { acceptSportOffer } from "./sport.js";
import { startMusicProject } from "./music.js";
import {
  currentMusicManager,
  musicManagerCommission,
} from "./career-support.js";
import { receiveIncome } from "./banking.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n)),
  round = (n) => Math.round(n * 100) / 100;
const log = (s, text) => {
  s.log.unshift({ week: s.week, text, kind: "info" });
  s.log = s.log.slice(0, 40);
};
export const WORLD_SPORTS = ["football", "racing", "basketball", "tennis"];
export const SPORT_DESTINATIONS = {
  football: [
    { name: "Westbridge United", city: "London" },
    { name: "Copenhagen Athletic", city: "Copenhagen" },
    { name: "New York City Stars", city: "New York" },
  ],
  racing: [
    { name: "Meridian Motorsport", city: "London" },
    { name: "Nordic Racing", city: "Copenhagen" },
    { name: "Monaco Grand Prix Team", city: "Monaco" },
  ],
  basketball: [
    { name: "Westbridge Wolves", city: "London" },
    { name: "Copenhagen Hoops", city: "Copenhagen" },
    { name: "New York Knights", city: "New York" },
  ],
  tennis: [
    { name: "Westbridge Tennis Centre", city: "London" },
    { name: "Nordic Tennis Academy", city: "Copenhagen" },
    { name: "Monaco Performance Tennis", city: "Monaco" },
  ],
};
export const SUPPORT_STAFF = [
  { id: "coach", name: "Personal coach / race engineer", fee: 350, weekly: 70 },
  { id: "physio", name: "Sports physiotherapist", fee: 200, weekly: 45 },
];
export const COLLABORATORS = [
  {
    id: "local",
    name: "River Vale",
    fans: 10,
    fee: 100,
    share: 0.3,
    skill: 40,
  },
  {
    id: "independent",
    name: "Nova West",
    fans: 500,
    fee: 1500,
    share: 0.4,
    skill: 70,
  },
  {
    id: "headline",
    name: "Atlas Echo",
    fans: 5000,
    fee: 15000,
    share: 0.5,
    skill: 90,
  },
];
export const TOUR_ROUTES = [
  {
    id: "local",
    name: "Local venue circuit",
    shows: 3,
    capacity: 80,
    price: 12,
    cost: 80,
    setup: 120,
    fans: 100,
    hours: 8,
  },
  {
    id: "regional",
    name: "Regional club tour",
    shows: 5,
    capacity: 400,
    price: 25,
    cost: 1000,
    setup: 1000,
    fans: 1000,
    hours: 24,
  },
  {
    id: "international",
    name: "International headline tour",
    shows: 6,
    capacity: 1500,
    price: 40,
    cost: 9000,
    setup: 7500,
    fans: 10000,
    hours: 40,
  },
];
export const LIVE_CREWS = [
  { id: "solo", name: "Solo / DJ setup", fee: 0, bonus: 0 },
  { id: "band", name: "Small live team", fee: 200, bonus: 4 },
  { id: "production", name: "Full live production", fee: 1000, bonus: 8 },
];
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
const paid = (s, id) =>
  WORLD_SPORTS.includes(id) &&
  s.employment &&
  s.career === id &&
  actor(s, id)?.contract;
export function initializeCareerWorld(s) {
  s.careerWorld = {
    sports: Object.fromEntries(
      WORLD_SPORTS.map((id) => [
        id,
        {
          chemistry: 50,
          coachTrust: 50,
          staff: [],
          requests: [],
          moves: {},
          loan: null,
          assignmentCity: s.city,
          travel: false,
          actions: {},
          roleReview: null,
          promise: null,
          nextInvitationWeek: s.week + 13,
          invitations: [],
        },
      ]),
    ),
    music: {
      nextOpportunityWeek: s.week + 8,
      offers: [],
      rights: {},
      albums: [],
      liveReadiness: 20,
      lastRehearsalWeek: -1,
      tours: [],
      activeTour: null,
    },
    relocation: null,
    memories: [],
  };
}
function remember(s, text) {
  s.careerWorld.memories.unshift({ week: s.week, text });
  s.careerWorld.memories = s.careerWorld.memories.slice(0, 40);
  log(s, text);
}
function action(state, hours, label) {
  if (state.ended || state.event || !state.actions)
    throw new Error(
      "Resolve your life choice and make time for this activity.",
    );
  const s = structuredClone(state);
  spendTime(s, hours, label);
  s.actions--;
  return s;
}
export function sportWindow(s, id, week = s.week) {
  const w = week % 52;
  return id === "tennis" || id === "racing"
    ? id === "tennis" || w <= 3 || w >= 39
    : id === "basketball"
      ? w <= 7 || (w >= 35 && w <= 45)
      : w <= 7 || (w >= 26 && w <= 33);
}
export function nextSportWindow(s, id, week = s.week) {
  for (let n = 0; n < 53; n++)
    if (sportWindow(s, id, week + n)) return week + n;
  return week + 52;
}
export function sportMoveEligibility(s, id, kind, destination) {
  const p = actor(s, id),
    d = SPORT_DESTINATIONS[id]?.find((d) => d.name === destination),
    missing = [];
  if (!paid(s, id) || age(s) < 16 || age(s) >= (id === "football" ? 40 : 42))
    missing.push("an active eligible professional contract");
  if (!d || d.name === p?.club) missing.push("a different destination");
  if (
    !["transfer", "loan", "step-up"].includes(kind) ||
    (kind === "loan" && !["football", "basketball"].includes(id))
  )
    missing.push("a move appropriate to this sport");
  if (s.careerWorld.sports[id]?.loan)
    missing.push("completion of your current loan");
  const level = p?.contract
    ? jobDefinition(p.contract.jobId).level + (kind === "step-up" ? 1 : 0)
    : 0;
  const j = JOBS.find((j) => j.track === id && j.level === level);
  if (
    id === "racing" &&
    kind === "step-up" &&
    s.globalLife &&
    !s.globalLife.racing.history.some(
      (h) => h.tier === s.globalLife.racing.tier && h.position <= 3,
    )
  )
    missing.push("a championship podium at your current racing tier");
  if (!j) missing.push("an available career level");
  else {
    if (s.skills[TRACK_SKILLS[id]] < j.skill || p.ability < j.skill)
      missing.push(`at least ${j.skill} relevant skill and sporting ability`);
    if (s.progress[id].weeks < j.experience)
      missing.push(`${j.experience} professional weeks`);
    if (j.qualification && !s.education.completed.includes(j.qualification))
      missing.push(j.qualification);
  }
  if (kind === "loan" && p?.contract?.expiresWeek <= s.week + 26)
    missing.push(
      "more than twenty-six weeks remaining in your parent contract",
    );
  return { missing, job: j, destination: d };
}
export function requestSportMove(
  state,
  id,
  { kind, destination, role = "rotation" },
) {
  if (!WORLD_SPORTS.includes(id) || !["rotation", "starter"].includes(role))
    throw new Error("Choose a sport and contract role.");
  const eligibility = sportMoveEligibility(state, id, kind, destination);
  if (eligibility.missing.length)
    throw new Error(`Requires: ${eligibility.missing.join(", ")}.`);
  const c = state.careerWorld.sports[id],
    last = c.actions.move;
  if (
    c.requests.some((r) => r.status === "pending") ||
    (last !== undefined && state.week < last + 13)
  )
    throw new Error(
      "Wait for your current request or the thirteen-week review cooldown.",
    );
  const s = action(state, 3, "Career move discussions"),
    path = s.careerWorld.sports[id];
  path.actions.move = s.week;
  path.requests.push({
    id: `move:${id}:${s.week}`,
    kind,
    destination,
    role,
    jobId: eligibility.job.id,
    status: "pending",
    requestedWeek: s.week,
    decisionWeek: nextSportWindow(s, id, s.week + 2),
  });
  path.requests = path.requests.slice(-12);
  remember(
    s,
    `Requested a ${kind} to ${destination}. Interest and release permission are reviewed in the next market window; your current contract continues.`,
  );
  return s;
}
export function hireSportStaff(state, id, staffId) {
  const staff = SUPPORT_STAFF.find((x) => x.id === staffId);
  if (!paid(state, id) || age(state) < 16 || !staff)
    throw new Error(
      "Professional athletes can hire appropriate support staff.",
    );
  if (
    state.careerWorld.sports[id].staff.includes(staffId) ||
    availableCash(state) < staff.fee
  )
    throw new Error(
      "This staff member is already hired or the signing fee is unaffordable.",
    );
  const s = action(state, 2, "Meet professional support staff");
  s.money -= staff.fee;
  s.careerWorld.sports[id].staff.push(staffId);
  remember(s, `Hired ${staff.name} for ${id}: $${staff.weekly}/week.`);
  return s;
}
export function dismissSportStaff(state, id, staffId) {
  if (state.ended || !state.careerWorld.sports[id]?.staff.includes(staffId))
    throw new Error("Choose hired staff.");
  const s = structuredClone(state);
  s.careerWorld.sports[id].staff = s.careerWorld.sports[id].staff.filter(
    (x) => x !== staffId,
  );
  return s;
}
export const careerWorldCosts = (s) =>
  WORLD_SPORTS.reduce(
    (n, id) =>
      n +
      (s.careerWorld?.sports[id]?.staff || []).reduce(
        (sum, key) => sum + SUPPORT_STAFF.find((x) => x.id === key).weekly,
        0,
      ),
    0,
  );
export function sportCareerAction(state, id, kind) {
  if (!paid(state, id) || !["team", "role"].includes(kind))
    throw new Error("Choose a professional team activity.");
  const c = state.careerWorld.sports[id],
    last = c.actions[kind];
  if (last !== undefined && state.week < last + (kind === "role" ? 13 : 1))
    throw new Error("This discussion or activity is on cooldown.");
  const s = action(
      state,
      2,
      kind === "team"
        ? "Team / paddock / coaching relationships"
        : "Discuss professional role",
    ),
    p = s.careerWorld.sports[id];
  p.actions[kind] = s.week;
  if (kind === "team") {
    p.chemistry = clamp(p.chemistry + 2);
    p.coachTrust = clamp(p.coachTrust + 1);
  } else p.roleReview = { decisionWeek: s.week + 1, status: "pending" };
  return s;
}
export const sportChemistryBonus = (s, id) =>
  ((s.careerWorld?.sports[id]?.chemistry ?? 50) - 50) * 0.08 +
  ((s.careerWorld?.sports[id]?.coachTrust ?? 50) - 50) * 0.05 +
  (["racing", "tennis"].includes(id) &&
  actor(s, id)?.contract?.role === "starter"
    ? 2
    : 0);
export const internationalDuty = (s, id, week = s.week) =>
  (s.careerWorld?.sports[id]?.invitations || []).some(
    (x) => x.status === "booked" && x.performanceWeek === week,
  );
export function bookSportInvitation(state, id, invitationId) {
  const o = state.careerWorld.sports[id]?.invitations.find(
    (x) => x.id === invitationId,
  );
  if (
    !paid(state, id) ||
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week
  )
    throw new Error("Choose a current professional invitation.");
  if (milestoneAway(state, id, state.week + 1))
    throw new Error("A career assessment already reserves your next week.");
  const s = action(state, 2, "Prepare an international appearance");
  const q = s.careerWorld.sports[id].invitations.find(
    (x) => x.id === invitationId,
  );
  q.status = "booked";
  q.performanceWeek = s.week + 1;
  return s;
}
export function checkCareerMoveSigning(s, id, o) {
  const meta = s.careerWorld?.sports[id]?.moves[o.id];
  if (!meta) return;
  if (!sportWindow(s, id) || !paid(s, id) || s.careerWorld.sports[id].loan)
    throw new Error(
      "This move requires a live market window and your original professional contract.",
    );
  const req = sportMoveEligibility(s, id, meta.kind, meta.destination);
  if (req.job?.id !== o.jobId)
    throw new Error(
      "The proposed career level no longer matches your current contract.",
    );
  if (req.missing.length) throw new Error(req.missing.join(", "));
  if (meta.familyPlan === "move" && meta.city !== s.city) {
    if (age(s) < 18 || availableCash(s) < 1500)
      throw new Error("Moving your household needs age eighteen and $1,500.");
    if (
      s.globalLife?.crime.record.some(
        (r) => r.severity >= 3 || s.week - r.week < 260,
      )
    )
      throw new Error(
        "A criminal-record review is required before sponsored household relocation.",
      );
    const partner =
      s.family.partnerId && s.connections.profiles[s.family.partnerId];
    if (partner && partner.trust < 50)
      throw new Error(
        "Your partner is not ready to relocate; discuss your relationship or choose travel.",
      );
  }
}
export function signedCareerMove(s, id, o, previous) {
  const c = s.careerWorld?.sports[id];
  if (!c) return;
  const meta = c.moves[o.id];
  c.loan = null;
  c.promise = {
    role: o.terms?.role || "rotation",
    reviewWeek: s.week + 13,
    appearances: 0,
    available: 0,
  };
  if (!meta) {
    c.assignmentCity = s.city;
    c.travel = false;
    c.chemistry = 50;
    c.coachTrust = 50;
    s.employment.employer = o.club;
    return;
  }
  c.assignmentCity = meta.city;
  c.chemistry = 45;
  c.coachTrust = 50;
  s.employment.employer = o.club;
  if (meta.kind === "loan") {
    c.loan = { ...previous, returnWeek: s.week + 26 };
    actor(s, id).contract.expiresWeek = Math.min(
      previous.contract.expiresWeek,
      s.week + 26,
    );
  }
  const relocating = meta.familyPlan === "move" && meta.city !== s.city;
  if (relocating) {
    s.money -= 1500;
    const old = s.city;
    s.city = meta.city;
    if (s.globalLife) {
      const g = s.globalLife,
        code = placeCountry(meta.city),
        oldCountry = g.residence.country;
      g.residence = { country: code, city: meta.city, sinceWeek: s.week };
      g.language = 25;
      if (!g.citizenships.includes(code))
        g.permits.push({
          country: code,
          route: "work",
          startsWeek: s.week,
          endsWeek: s.week + 312,
        });
      g.moves.push({
        from: oldCountry,
        to: code,
        city: meta.city,
        week: s.week,
        cost: 1500,
      });
      g.moves = g.moves.slice(-40);
    }
    c.travel = false;
    const partner =
      s.family.partnerId && s.connections.profiles[s.family.partnerId];
    if (partner && old !== meta.city) {
      s.careerWorld.relocation = {
        partnerId: s.family.partnerId,
        previousJob: partner.job,
        previousPay: partner.weeklyPay,
        decisionWeek: s.week + 8,
      };
      partner.city = meta.city;
      partner.job = "Relocating";
      partner.weeklyPay = 0;
    }
    for (const child of s.family.children)
      if (typeof child.confidence === "number")
        child.confidence = clamp(child.confidence - 2);
  } else c.travel = meta.city !== s.city;
  remember(
    s,
    `Signed ${meta.kind} with ${o.club}. ${relocating ? "Your household relocated." : "Your home base stays in place, with travel where needed."} Playing opportunities remain subject to selection.`,
  );
}
export function signSportMove(state, id, offerId, familyPlan) {
  if (
    !["travel", "move"].includes(familyPlan) ||
    !state.careerWorld.sports[id]?.moves[offerId]
  )
    throw new Error("Choose an available move and household plan.");
  const s = structuredClone(state);
  s.careerWorld.sports[id].moves[offerId].familyPlan = familyPlan;
  return id === "football"
    ? acceptFootballOffer(s, offerId)
    : acceptSportOffer(s, id, offerId);
}
export function prepareCareerWorld(s) {
  for (const id of WORLD_SPORTS) {
    const c = s.careerWorld.sports[id],
      p = actor(s, id);
    if (c.loan && s.week >= c.loan.returnWeek) {
      const loan = c.loan;
      c.loan = null;
      loan.employment.tenure += 26;
      if (paid(s, id) && loan.contract.expiresWeek > s.week) {
        p.club = loan.club;
        p.stage = loan.stage;
        p.contract = loan.contract;
        s.employment = loan.employment;
        c.assignmentCity = loan.city;
        c.travel = loan.city !== s.city;
        c.chemistry = 50;
        syncSeason(s, id);
        remember(
          s,
          `Your ${id} loan ended; you returned to ${loan.club} on the original remaining contract.`,
        );
      } else
        remember(s, `Your ${id} loan ended without an active parent contract.`);
    }
    if (paid(s, id) && s.money >= 0) {
      if (c.staff.includes("coach") && !p.injuryWeeks)
        p.ability = clamp(p.ability + 0.04);
      if (c.staff.includes("physio") && p.injuryWeeks) p.injuryWeeks--;
    }
  }
}
export function validateCareerWorld(s) {
  const c = s.careerWorld,
    n = (v, min = 0, max = 1e12) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = 1e12) => n(v, min, max) && Number.isInteger(v),
    str = (v) => typeof v === "string" && v.length > 0 && v.length <= 200,
    arr = (v, max) => Array.isArray(v) && v.length <= max,
    fail = () => {
      throw new Error(
        "Invalid sports moves, collaborations or touring data in save.",
      );
    };
  if (
    !c ||
    !c.sports ||
    typeof c.sports !== "object" ||
    Object.keys(c.sports).length !== WORLD_SPORTS.length ||
    !arr(c.memories, 40) ||
    c.memories.some((x) => !int(x.week, 0, s.week) || !str(x.text))
  )
    fail();
  for (const id of WORLD_SPORTS) {
    const p = c.sports[id];
    if (
      !p ||
      !n(p.chemistry, 0, 100) ||
      !n(p.coachTrust, 0, 100) ||
      !arr(p.staff, 2) ||
      new Set(p.staff).size !== p.staff.length ||
      p.staff.some((x) => !SUPPORT_STAFF.some((y) => y.id === x)) ||
      !str(p.assignmentCity) ||
      typeof p.travel !== "boolean" ||
      !p.actions ||
      typeof p.actions !== "object" ||
      Array.isArray(p.actions) ||
      Object.entries(p.actions).some(
        ([key, w]) =>
          !["move", "role", "team"].includes(key) || !int(w, 0, s.week),
      ) ||
      !arr(p.requests, 12) ||
      p.requests.some(
        (r) =>
          !str(r.id) ||
          !["transfer", "loan", "step-up"].includes(r.kind) ||
          (r.kind === "loan" && !["football", "basketball"].includes(id)) ||
          !SPORT_DESTINATIONS[id].some((d) => d.name === r.destination) ||
          !["rotation", "starter"].includes(r.role) ||
          jobDefinition(r.jobId)?.track !== id ||
          !["pending", "offered", "refused", "cancelled"].includes(r.status) ||
          !int(r.requestedWeek, 0, s.week) ||
          !int(r.decisionWeek, r.requestedWeek + 1),
      ) ||
      !p.moves ||
      typeof p.moves !== "object" ||
      Array.isArray(p.moves) ||
      Object.keys(p.moves).length > 24 ||
      Object.values(p.moves).some(
        (m) =>
          !["transfer", "loan", "step-up"].includes(m.kind) ||
          !SPORT_DESTINATIONS[id].some(
            (d) => d.name === m.destination && d.city === m.city,
          ) ||
          !["travel", "move"].includes(m.familyPlan),
      ) ||
      !int(p.nextInvitationWeek) ||
      !arr(p.invitations, 12) ||
      p.invitations.some(
        (o) =>
          !str(o.id) ||
          !str(o.name) ||
          !n(o.fee, 0, 100000) ||
          !["offered", "booked", "expired", "completed", "missed"].includes(
            o.status,
          ) ||
          !int(o.expiresWeek) ||
          (o.performanceWeek !== null && !int(o.performanceWeek)) ||
          (["booked", "completed", "missed"].includes(o.status) &&
            o.performanceWeek === null),
      ) ||
      (p.roleReview !== null &&
        (!["pending", "agreed", "refused"].includes(p.roleReview.status) ||
          !int(p.roleReview.decisionWeek))) ||
      (p.promise !== null &&
        (!["rotation", "starter"].includes(p.promise.role) ||
          !int(p.promise.reviewWeek) ||
          !int(p.promise.appearances) ||
          !int(p.promise.available) ||
          p.promise.appearances > p.promise.available))
    )
      fail();
    if (p.loan !== null) {
      const l = p.loan;
      if (
        !["football", "basketball"].includes(id) ||
        !str(l.club) ||
        !["reserve", "professional", "junior"].includes(l.stage) ||
        !int(l.returnWeek) ||
        !l.contract ||
        jobDefinition(l.contract.jobId)?.track !== id ||
        !int(l.contract.expiresWeek) ||
        !["rotation", "starter"].includes(l.contract.role) ||
        !n(l.contract.appearanceBonus) ||
        !n(l.contract.winBonus) ||
        l.contract.annualFunding !== 0 ||
        jobDefinition(l.employment?.jobId)?.track !== id ||
        !n(l.employment.weeklyPay) ||
        !n(l.employment.startingPay) ||
        !int(l.employment.tenure) ||
        !n(l.employment.performance, 0, 100) ||
        !int(l.employment.nextRaiseWeek) ||
        typeof l.employment.legacy !== "boolean" ||
        !str(l.city)
      )
        fail();
    }
  }
  if (
    c.relocation !== null &&
    (!s.connections.profiles[c.relocation.partnerId] ||
      !str(c.relocation.previousJob) ||
      !n(c.relocation.previousPay) ||
      !int(c.relocation.decisionWeek))
  )
    fail();
  const m = c.music;
  if (
    !m ||
    !int(m.nextOpportunityWeek) ||
    !n(m.liveReadiness, 0, 100) ||
    !int(m.lastRehearsalWeek, -1, s.week) ||
    !arr(m.offers, 20) ||
    !m.rights ||
    typeof m.rights !== "object" ||
    Array.isArray(m.rights) ||
    Object.keys(m.rights).length > 40 ||
    Object.values(m.rights).some(
      (r) => !n(r.share, 0, 1) || !n(r.audience, 0, 1e9) || !str(r.offerId),
    ) ||
    m.offers.some(
      (o) =>
        !str(o.id) ||
        !["client", "collaboration"].includes(o.kind) ||
        !(
          COLLABORATORS.some((a) => a.name === o.artist) ||
          s.relationships.some((r) => r.name === o.artist)
        ) ||
        !n(o.skill, 0, 100) ||
        !n(o.fee) ||
        !n(o.royalty, 0, 1) ||
        !n(o.audience, 0, 1e9) ||
        !n(o.clientPay) ||
        !n(o.minimumQuality, 0, 100) ||
        ![
          "offered",
          "accepted",
          "expired",
          "released",
          "delivered",
          "failed",
        ].includes(o.status) ||
        !int(o.expiresWeek) ||
        !int(o.deadline) ||
        (o.projectId !== null && !str(o.projectId)) ||
        (o.negotiation !== null &&
          (!int(o.negotiation.decisionWeek) ||
            !["pending", "agreed", "refused"].includes(o.negotiation.status))),
    ) ||
    !arr(m.albums, 10) ||
    m.albums.some(
      (a) =>
        !str(a.id) ||
        !str(a.title) ||
        !arr(a.tracks, 8) ||
        a.tracks.length < 3 ||
        new Set(a.tracks).size !== a.tracks.length ||
        a.tracks.some((id) => !str(id)) ||
        !int(a.releaseWeek) ||
        !["mastering", "released"].includes(a.status),
    ) ||
    !arr(m.tours, 10)
  )
    fail();
  for (const t of m.tours) {
    const route = TOUR_ROUTES.find((r) => r.id === t.route),
      crew = LIVE_CREWS.find((x) => x.id === t.crew);
    if (
      !route ||
      !crew ||
      !["singer", "rapper", "producer"].includes(t.role) ||
      !str(t.id) ||
      !int(t.startedWeek, 0, s.week) ||
      !n(t.setup) ||
      t.setup !== route.setup ||
      !n(t.gross) ||
      !n(t.costs) ||
      !["planned", "touring", "completed", "cancelled"].includes(t.status) ||
      !arr(t.stops, 6) ||
      t.stops.length !== route.shows ||
      new Set(t.stops.map((x) => x.week)).size !== t.stops.length ||
      t.stops.some(
        (x) =>
          !int(x.week, t.startedWeek + 1) ||
          !["London", "Copenhagen", "New York", "Monaco"].includes(x.city) ||
          !["scheduled", "performed", "missed", "cancelled"].includes(
            x.status,
          ) ||
          !int(x.tickets, 0, route.capacity) ||
          !n(x.gross) ||
          x.gross !== x.tickets * route.price ||
          !n(x.cost) ||
          x.cost !== route.cost + crew.fee,
      ) ||
      round(t.stops.reduce((n, x) => n + x.gross, 0)) !== t.gross ||
      round(
        t.setup +
          t.stops.reduce(
            (n, x) =>
              n +
              (["performed", "missed"].includes(x.status)
                ? x.cost
                : x.status === "cancelled"
                  ? x.cost * 0.25
                  : 0),
            0,
          ),
      ) !== t.costs ||
      (t.status === "completed" &&
        t.stops.some((x) => !["performed", "missed"].includes(x.status))) ||
      (t.status === "cancelled" &&
        t.stops.some((x) => x.status === "scheduled"))
    )
      fail();
  }
  const active = m.tours.filter((t) =>
    ["planned", "touring"].includes(t.status),
  );
  if (
    active.length > 1 ||
    (m.activeTour !== null && !active.some((t) => t.id === m.activeTour)) ||
    (m.activeTour === null && active.length)
  )
    fail();
}
export function advanceSportWorld(s) {
  for (const id of WORLD_SPORTS) {
    const c = s.careerWorld.sports[id],
      p = actor(s, id),
      agent = AGENTS.find((a) => a.id === s.seasons[id].agent?.id);
    if (!paid(s, id)) {
      if (c.loan) c.loan = null;
      for (const r of c.requests)
        if (r.status === "pending") r.status = "cancelled";
      for (const inv of c.invitations)
        if (inv.status === "booked") {
          inv.status = "missed";
          inv.performanceWeek = s.week;
        }
      continue;
    }
    if (c.travel) {
      s.happiness = clamp(s.happiness - 0.1);
      const r = s.relationships.find((r) => r.id === s.family.partnerId);
      if (r) r.bond = clamp(r.bond - 0.1);
    }
    if (
      c.roleReview?.status === "pending" &&
      c.roleReview.decisionWeek <= s.week
    ) {
      const success =
        rng(s) <
        Math.min(0.9, 0.25 + s.seasons[id].form * 0.005 + (agent?.skill || 0));
      c.roleReview.status = success ? "agreed" : "refused";
      if (success) {
        p.contract.role = "starter";
        c.coachTrust = clamp(c.coachTrust + 2);
      }
      remember(
        s,
        `Your ${id} role discussion was ${c.roleReview.status}. Selection still depends on performance.`,
      );
    }
    for (const r of c.requests)
      if (r.status === "pending" && r.decisionWeek <= s.week) {
        const req = sportMoveEligibility(s, id, r.kind, r.destination);
        const success =
          !req.missing.length &&
          req.job?.id === r.jobId &&
          !p.injuryWeeks &&
          rng(s) <
            Math.min(0.9, 0.25 + p.reputation * 0.004 + (agent?.skill || 0));
        r.status = success ? "offered" : "refused";
        if (success) {
          const o = {
            id: `world:${r.id}`,
            kind: "contract",
            club: r.destination,
            jobId: r.jobId,
            pay:
              r.kind === "loan"
                ? s.employment.weeklyPay
                : Math.round(
                    req.job.pay *
                      (r.role === "starter" ? 0.95 : 1) *
                      (1 + Math.min(0.15, p.reputation * 0.001)),
                  ),
            duration: r.kind === "loan" ? 26 : 104,
            status: "offered",
            expiresWeek: s.week + 4,
          };
          enhanceSportOffer(s, id, o);
          o.terms.role = r.role;
          if (r.kind === "loan") {
            o.terms.weeks = 26;
            o.terms.annualFunding = 0;
          }
          p.offers.push(o);
          p.offers = p.offers.slice(-12);
          c.moves[o.id] = {
            kind: r.kind,
            destination: r.destination,
            city: req.destination.city,
            familyPlan: "travel",
          };
          remember(
            s,
            `${r.destination} offered a ${id} ${r.kind}. Review role, pay, funding and family plans before signing.`,
          );
        } else
          remember(
            s,
            `The ${id} move was refused or its requirements were no longer met. Your current contract continues.`,
          );
      }
    for (const key of Object.keys(c.moves))
      if (!p.offers.some((o) => o.id === key)) delete c.moves[key];
    const fixture = s.seasons[id].fixtures.find((f) => f.week === s.week);
    if (c.promise && fixture && ["played", "bench"].includes(fixture.status)) {
      c.promise.available++;
      if (fixture.status === "played") c.promise.appearances++;
    }
    if (c.promise && s.week >= c.promise.reviewWeek) {
      if (
        c.promise.role === "starter" &&
        c.promise.available >= 3 &&
        c.promise.appearances / c.promise.available < 0.6
      ) {
        s.happiness = clamp(s.happiness - 3);
        c.coachTrust = clamp(c.coachTrust - 5);
        remember(
          s,
          `The ${id} starting-role promise did not produce regular appearances. Discuss your role or consider a move.`,
        );
      }
      c.promise = null;
    }
    for (const inv of c.invitations) {
      if (inv.status === "offered" && inv.expiresWeek <= s.week)
        inv.status = "expired";
      if (inv.status === "booked" && inv.performanceWeek <= s.week) {
        const success =
          !p.injuryWeeks &&
          s.energy >= 20 &&
          rng(s) < Math.min(0.95, 0.4 + p.ability * 0.005);
        inv.status = success ? "completed" : "missed";
        if (success) {
          p.reputation = clamp(p.reputation + 1);
          const commission = round(inv.fee * (agent?.rate || 0));
          receiveIncome(s, inv.fee, "earned", { deduction: commission });
          s.money -= commission;
        }
        s.energy = clamp(s.energy - 6);
        remember(
          s,
          `${inv.name}: ${inv.status}${success ? `, $${inv.fee} gross appearance fee` : ""}.`,
        );
      }
    }
    if (s.week >= c.nextInvitationWeek) {
      c.nextInvitationWeek = s.week + 13;
      if (
        age(s) >= 18 &&
        p.reputation >= 45 &&
        p.ability >= 70 &&
        !c.invitations.some((o) => ["offered", "booked"].includes(o.status)) &&
        rng(s) < 0.25
      ) {
        c.invitations.push({
          id: `international:${id}:${s.week}`,
          name:
            id === "racing"
              ? "International racing exhibition"
              : id === "tennis"
                ? "National tennis exhibition"
                : `National ${id} squad`,
          fee: 150,
          status: "offered",
          expiresWeek: s.week + 3,
          performanceWeek: null,
        });
        c.invitations = c.invitations.slice(-12);
      }
    }
  }
  const move = s.careerWorld.relocation;
  if (move && move.decisionWeek <= s.week) {
    const p = s.connections.profiles[move.partnerId];
    if (p) {
      const success = rng(s) < 0.7;
      p.job = success ? move.previousJob : "Looking for work";
      p.weeklyPay = success ? Math.round(move.previousPay * 0.9) : 0;
      remember(
        s,
        success
          ? "Your partner found work after relocating, with a different wage."
          : "Your partner is still looking for work after relocating.",
      );
    }
    s.careerWorld.relocation = null;
  }
}
export const musicReleaseShare = (s, id) =>
  s.careerWorld?.music.rights[id]?.share ?? 1;
export const musicAudienceBoost = (s, id) =>
  s.careerWorld?.music.rights[id]?.audience ?? 0;
export function negotiateCollaboration(state, id) {
  const o = state.careerWorld.music.offers.find((o) => o.id === id);
  if (
    age(state) < 14 ||
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week ||
    o.negotiation
  )
    throw new Error(
      "Choose a live collaboration with no earlier counteroffer.",
    );
  const s = action(state, 2, "Music collaboration terms");
  const q = s.careerWorld.music.offers.find((o) => o.id === id);
  q.negotiation = { decisionWeek: s.week + 2, status: "pending" };
  q.expiresWeek = Math.max(q.expiresWeek, s.week + 4);
  return s;
}
export function acceptMusicOpportunity(state, id, title) {
  const o = state.careerWorld.music.offers.find((o) => o.id === id);
  if (
    age(state) < 14 ||
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week ||
    o.negotiation?.status === "pending"
  )
    throw new Error(
      "Choose an available music opportunity with settled terms.",
    );
  if (o.kind === "client" && state.music.role !== "producer")
    throw new Error("Client production work requires a producer.");
  if (availableCash(state) < 150 + o.fee)
    throw new Error("You need the recording budget and collaborator fee.");
  checkMusicOutsideWork(state);
  const s = startMusicProject(state, { title });
  s.money -= o.fee;
  const q = s.careerWorld.music.offers.find((o) => o.id === id);
  q.status = "accepted";
  q.projectId = s.music.projects.at(-1).id;
  const p = s.music.projects.at(-1);
  p.quality = Math.round(clamp(p.quality * 0.8 + o.skill * 0.2));
  s.careerWorld.music.rights[p.id] = {
    share: o.kind === "client" ? 0 : 1 - o.royalty,
    audience: o.kind === "client" ? 0 : o.audience,
    offerId: o.id,
  };
  remember(
    s,
    `Started ${o.kind === "client" ? "client production" : "a collaboration"} with ${o.artist}. Rights and fees are recorded; success and delivery are not guaranteed.`,
  );
  return s;
}
export function assembleAlbum(state, { title, tracks }) {
  if (
    age(state) < 16 ||
    !state.music.active ||
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 60 ||
    !Array.isArray(tracks) ||
    tracks.length < 3 ||
    tracks.length > 8 ||
    new Set(tracks).size !== tracks.length ||
    tracks.some(
      (id) =>
        !(
          state.music.releases.some((r) => r.id === id) ||
          state.music.projects.some((p) => p.id === id && p.status === "ready")
        ) || musicReleaseShare(state, id) === 0,
    )
  )
    throw new Error(
      "An album needs age sixteen, a title and three to eight finished tracks you own.",
    );
  if (
    state.careerWorld.music.albums.some((a) =>
      a.tracks.some((id) => tracks.includes(id)),
    ) ||
    availableCash(state) < 250
  )
    throw new Error(
      "Tracks can belong to one album, and mastering/distribution costs $250.",
    );
  const s = action(state, 4, "Album mastering and sequencing");
  s.money -= 250;
  for (const id of tracks) {
    const p = s.music.projects.find((p) => p.id === id && p.status === "ready");
    if (p) {
      p.status = "recording";
      p.manualRelease = false;
      p.releaseWeek = s.week + 2;
      const track = s.globalLife?.tracks.find((t) => t.projectId === id);
      if (track) track.stage = "scheduled";
    }
  }
  let serial = s.careerWorld.music.albums.length;
  while (
    s.careerWorld.music.albums.some((a) => a.id === `album:${s.week}:${serial}`)
  )
    serial++;
  s.careerWorld.music.albums.push({
    id: `album:${s.week}:${serial}`,
    title: title.trim(),
    tracks,
    releaseWeek: s.week + 2,
    status: "mastering",
  });
  s.careerWorld.music.albums = s.careerWorld.music.albums.slice(-10);
  return s;
}
export function rehearseLive(state) {
  if (
    age(state) < 14 ||
    !state.music.active ||
    state.careerWorld.music.lastRehearsalWeek === state.week ||
    state.energy < 10
  )
    throw new Error(
      "Active musicians aged fourteen or older can rehearse once per week with enough energy.",
    );
  const s = action(state, 3, "Live rehearsal");
  s.energy -= 4;
  s.careerWorld.music.liveReadiness = clamp(
    s.careerWorld.music.liveReadiness + 6,
  );
  s.careerWorld.music.lastRehearsalWeek = s.week;
  return s;
}
export function startMusicTour(state, { route, crew }) {
  const r = TOUR_ROUTES.find((r) => r.id === route),
    team = LIVE_CREWS.find((t) => t.id === crew),
    m = state.careerWorld.music;
  if (
    age(state) < 18 ||
    !state.music.active ||
    !r ||
    !team ||
    state.music.releases.filter((t) => musicReleaseShare(state, t.id) > 0)
      .length < 2 ||
    state.music.fans < r.fans ||
    m.activeTour ||
    state.music.gigs.some((g) => g.status === "booked") ||
    (state.careerMilestones?.paths.music.opportunities || []).some(
      (o) =>
        o.status === "booked" &&
        o.performanceWeek >= state.week + 2 &&
        o.performanceWeek <= state.week + r.shows + 1,
    ) ||
    (r.id !== "local" && state.employment)
  )
    throw new Error(
      "Touring needs adulthood, two owned releases, enough music fans and a free schedule. Longer tours require leaving ordinary employment or paid sport first.",
    );
  const stopCost = r.cost + team.fee;
  if (availableCash(state) < r.setup + stopCost * 2)
    throw new Error(
      "Build cash for setup and at least two shows of venue, crew and travel costs.",
    );
  const s = action(state, 3, "Plan a music tour");
  s.money -= r.setup;
  let serial = m.tours.length;
  while (m.tours.some((t) => t.id === `tour:${s.week}:${serial}`)) serial++;
  const id = `tour:${s.week}:${serial}`;
  s.careerWorld.music.tours.push({
    id,
    route,
    crew,
    startedWeek: s.week,
    role: s.music.role,
    setup: r.setup,
    stops: Array.from({ length: r.shows }, (_, i) => ({
      week: s.week + 2 + i,
      city:
        r.id === "local"
          ? s.city
          : ["London", "Copenhagen", "New York", "Monaco"][i % 4],
      status: "scheduled",
      tickets: 0,
      gross: 0,
      cost: stopCost,
    })),
    gross: 0,
    costs: r.setup,
    status: "planned",
  });
  s.careerWorld.music.tours = s.careerWorld.music.tours.slice(-10);
  s.careerWorld.music.activeTour = id;
  remember(
    s,
    `Booked ${r.name}: setup $${r.setup}, ${r.shows} shows at $${stopCost} each. Ticket demand is uncertain.`,
  );
  return s;
}
export function cancelMusicTour(state) {
  const t = state.careerWorld.music.tours.find(
    (t) => t.id === state.careerWorld.music.activeTour,
  );
  if (state.ended || !t) throw new Error("No active tour.");
  const unpaid = t.stops.filter((x) => x.status === "scheduled"),
    fee = round(unpaid.reduce((n, x) => n + x.cost * 0.25, 0));
  if (availableCash(state) < fee)
    throw new Error(
      "Cancellation needs cash for 25% of remaining venue/crew commitments.",
    );
  const s = structuredClone(state),
    q = s.careerWorld.music.tours.find((x) => x.id === t.id);
  s.money -= fee;
  q.costs += fee;
  for (const x of q.stops) if (x.status === "scheduled") x.status = "cancelled";
  q.status = "cancelled";
  s.careerWorld.music.activeTour = null;
  remember(
    s,
    `Cancelled the tour and paid $${fee} remaining commitment charges. Setup and completed shows remain in your accounts.`,
  );
  return s;
}
export const musicTourWeek = (s, week = s.week) =>
  (s.careerWorld?.music.tours || []).some(
    (t) =>
      ["planned", "touring"].includes(t.status) &&
      t.stops.some((x) => x.status === "scheduled" && x.week === week),
  );
export const careerWorldHours = (s, week = s.week) =>
  WORLD_SPORTS.reduce(
    (n, id) =>
      n +
      (internationalDuty(s, id, week) ? 8 : 0) +
      (paid(s, id) && s.careerWorld?.sports[id].travel ? 3 : 0),
    0,
  ) +
  (s.careerWorld?.music.tours || []).reduce(
    (n, t) =>
      n +
      (["planned", "touring"].includes(t.status) &&
      t.stops.some((x) => x.status === "scheduled" && x.week === week)
        ? TOUR_ROUTES.find((r) => r.id === t.route).hours
        : 0),
    0,
  );
function musicReceipt(s, gross, cost = 0) {
  const commission = musicManagerCommission(s, gross);
  receiveIncome(s, gross, "earned", { deduction: cost + commission });
  s.money = round(s.money - cost - commission);
  s.music.weeklyIncome = round(s.music.weeklyIncome + gross);
  s.music.totalIncome = round(s.music.totalIncome + gross);
}
export function advanceMusicWorld(s) {
  const c = s.careerWorld.music;
  for (const o of c.offers) {
    if (o.status === "offered" && o.expiresWeek <= s.week) o.status = "expired";
    if (
      o.negotiation?.status === "pending" &&
      o.negotiation.decisionWeek <= s.week
    ) {
      const success = rng(s) < 0.35 + (currentMusicManager(s)?.skill || 0);
      o.negotiation.status = success ? "agreed" : "refused";
      if (success) {
        o.fee = round(o.fee * 0.85);
        if (o.kind === "collaboration")
          o.royalty = Math.max(0.1, o.royalty - 0.05);
        else o.clientPay = round(o.clientPay * 1.1);
      }
    }
    if (o.status === "accepted") {
      const project = s.music.projects.find((p) => p.id === o.projectId),
        release = s.music.releases.find((r) => r.id === o.projectId);
      if (project?.status === "released" && release) {
        o.status =
          o.kind === "client"
            ? release.quality >= o.minimumQuality
              ? "delivered"
              : "failed"
            : "released";
        if (o.status === "delivered") {
          musicReceipt(s, o.clientPay);
          remember(
            s,
            `Delivered production to ${o.artist}: $${o.clientPay} gross fee. Client royalties are not yours.`,
          );
        } else if (o.status === "failed")
          remember(
            s,
            "The client recording missed the quality standard. No client fee was paid.",
          );
      } else if (o.kind === "client" && s.week > o.deadline) {
        o.status = "failed";
        remember(
          s,
          "The client deadline passed without delivery. No fee was earned.",
        );
      }
    }
  }
  for (const a of c.albums)
    if (a.status === "mastering" && a.releaseWeek <= s.week) {
      a.status = "released";
      for (const id of a.tracks) {
        const r = s.music.releases.find((r) => r.id === id);
        if (r) r.weeklyStreams = Math.round(r.weeklyStreams * 1.2);
      }
      remember(
        s,
        `Released the album “${a.title}”. Its existing tracks share the catalogue; no duplicate royalty stream was created.`,
      );
    }
  const t = c.tours.find((t) => t.id === c.activeTour);
  if (t) {
    const r = TOUR_ROUTES.find((r) => r.id === t.route),
      crew = LIVE_CREWS.find((x) => x.id === t.crew);
    for (const stop of t.stops)
      if (stop.status === "scheduled" && stop.week <= s.week) {
        t.status = "touring";
        const skill =
            s.music.skills[
              { singer: "vocals", rapper: "lyrics", producer: "production" }[
                t.role
              ]
            ],
          quality = clamp(skill * 0.7 + c.liveReadiness * 0.2 + crew.bonus);
        const success =
          s.energy >= 20 && rng(s) < Math.min(0.95, 0.45 + quality * 0.005);
        stop.status = success ? "performed" : "missed";
        stop.tickets = success
          ? Math.min(
              r.capacity,
              Math.round(
                ((s.music.fans * 0.12) / r.shows) *
                  (0.6 + rng(s) * 0.8) *
                  (1 + quality / 200),
              ),
            )
          : 0;
        stop.gross = stop.tickets * r.price;
        t.gross += stop.gross;
        t.costs += stop.cost;
        musicReceipt(s, stop.gross, stop.cost);
        s.energy = clamp(s.energy - (r.id === "local" ? 8 : 14));
        if (success) {
          s.music.fans += Math.floor(stop.tickets * 0.05);
          s.fame.recognition = clamp(s.fame.recognition + 0.2);
        }
        remember(
          s,
          `${r.name}, ${stop.city}: ${stop.status}, ${stop.tickets} tickets, $${stop.gross} receipts and $${stop.cost} costs.`,
        );
      }
    if (t.stops.every((x) => x.status !== "scheduled")) {
      t.status = "completed";
      c.activeTour = null;
      remember(
        s,
        `Tour finished: $${t.gross} gross receipts and $${t.costs} production/travel costs, before management commission and tax.`,
      );
    }
  }
  for (const key of Object.keys(c.rights))
    if (![...s.music.projects, ...s.music.releases].some((p) => p.id === key))
      delete c.rights[key];
  if (s.week >= c.nextOpportunityWeek) {
    c.nextOpportunityWeek = s.week + 8;
    if (
      s.music.active &&
      age(s) >= 14 &&
      s.music.sessions >= 12 &&
      s.music.releases.length &&
      !c.offers.some((o) => o.status === "offered") &&
      rng(s) < 0.35 + (currentMusicManager(s)?.skill || 0)
    ) {
      const candidates = COLLABORATORS.filter((a) => s.music.fans >= a.fans),
        artist = candidates.at(-1);
      if (artist) {
        const client =
          s.music.role === "producer" &&
          s.music.skills.production >= 30 &&
          rng(s) < 0.5;
        c.offers.push({
          id: `music-world:${s.week}`,
          kind: client ? "client" : "collaboration",
          artist: artist.name,
          skill: artist.skill,
          fee: client ? 0 : artist.fee,
          royalty: client ? 1 : artist.share,
          audience: artist.fans * 10,
          clientPay: client ? Math.round(300 + artist.skill * 8) : 0,
          minimumQuality: client ? 40 : 0,
          status: "offered",
          expiresWeek: s.week + 4,
          deadline: s.week + 10,
          projectId: null,
          negotiation: null,
        });
        c.offers = c.offers.slice(-20);
        remember(
          s,
          `${artist.name} proposed ${client ? "paid production work" : "a collaboration"}. Review fees, deadlines and ownership before accepting.`,
        );
      }
    }
  }
}
