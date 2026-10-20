import { marketVolume } from "./simulation/effects.js";
import {
  availableCash,
  jobDefinition,
  isSportingJob,
  TRACK_SKILLS,
  BUSINESSES,
  rng,
} from "./world.js";
import { spendTime, calendarForecast } from "./calendar.js";
import { receiveIncome } from "./banking.js";
import { onParentalLeave } from "./realism.js";
import { createPost } from "./life.js";
import {
  SPORT_SPECIALTIES,
  SPORT_ROLES,
  TRAINING_LOADS,
  WORK_CASES,
  WORK_METHODS,
  MATCH_DETAILS,
  STUDIO_REVIEWS,
  ART_DIRECTIONS,
  SERIES_FORMATS,
  CLIENT_BRIEFS,
} from "./profession-data.js";
import {
  orderSharesReserved,
  currentSportSpecialties,
} from "./profession-effects.js";
import { hashFraction } from "./pressure-effects.js";
import {
  initializeCareerStyle,
  validateCareerStyle,
  CAREER_KIT,
  CAREER_CELEBRATIONS,
} from "./career-style.js";
import { assertCareerPath, activeCareerPath } from "./career-commitment.js";
export * from "./career-commitment.js";
export * from "./career-style.js";
export * from "./profession-data.js";
const age = (s) =>
    s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52),
  clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n)),
  round = (n) => Math.round(n * 100) / 100;
const actor = (s, path) => (path === "football" ? s.football : s.sports[path]);
const note = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
function act(state, hours = 2, minAge = 16) {
  if (
    state.ended ||
    state.event ||
    !state.actions ||
    state.globalLife.crime.prison ||
    age(state) < minAge
  )
    throw new Error(
      `Requires age ${minAge}+, an action, and no pending life choice or custody.`,
    );
  const s = structuredClone(state);
  spendTime(s, hours, "Career development");
  s.actions--;
  return s;
}
export function initializeProfession(s) {
  s.profession = {
    seed: (s.seed ^ 0x1f940c) >>> 0,
    serial: 0,
    lastWeek: s.week,
    preparedWeek: s.week,
    style: initializeCareerStyle(),
    sports: Object.fromEntries(
      Object.entries(SPORT_SPECIALTIES).map(([id, keys]) => [
        id,
        {
          skills: Object.fromEntries(
            Object.keys(keys).map((k) => [k, actor(s, id).ability]),
          ),
          foundation: actor(s, id).ability,
          role: "balanced",
          participating: false,
          fatigue: 0,
          block: null,
          tactics: null,
          roleWeek: -1,
          reports: [],
          history: [],
        },
      ]),
    ),
    work: { active: null, history: [], nextWeek: s.week },
    music: {
      enabled: false,
      direction: "independent",
      changedWeek: -13,
      loyalty: 50,
      reviews: [],
      studio: [],
    },
    creator: { series: [], committed: false },
    company: { contracts: [], nextWeek: s.week, delegated: false },
    investing: { orders: [], research: [], watchlist: [] },
  };
}
export function setSportRole(state, path, role) {
  assertCareerPath(state, path);
  if (
    !Object.hasOwn(SPORT_ROLES, path) ||
    !Object.hasOwn(SPORT_ROLES[path], role) ||
    ["none", "retired"].includes(actor(state, path).stage)
  )
    throw new Error("Choose a role in an active sporting path.");
  if (state.profession.sports[path].roleWeek === state.week)
    throw new Error("Your playing identity is already set for this week.");
  const s = act(state, 1, 8),
    p = s.profession.sports[path];
  p.skills = currentSportSpecialties(s, path);
  p.foundation = actor(s, path).ability;
  p.role = role;
  p.roleWeek = s.week;
  p.participating = true;
  return s;
}
export function startTrainingBlock(state, path, { focus, load = "steady" }) {
  assertCareerPath(state, path);
  if (
    !Object.hasOwn(SPORT_SPECIALTIES, path) ||
    !Object.hasOwn(SPORT_SPECIALTIES[path], focus) ||
    !Object.hasOwn(TRAINING_LOADS, load)
  )
    throw new Error("Choose a sporting specialty and training load.");
  const a = actor(state, path),
    p = state.profession.sports[path],
    d = TRAINING_LOADS[load];
  if (["none", "retired"].includes(a.stage) || a.injuryWeeks)
    throw new Error(
      "Join your sport and recover from injury before starting a block.",
    );
  if (p.block?.status === "active")
    throw new Error("Complete or cancel your current four-week block first.");
  if (load === "coached" && (age(state) < 12 || availableCash(state) < d.cost))
    throw new Error(
      "Coached blocks need age twelve and the first $35 weekly fee.",
    );
  const s = act(state, 1, 8),
    x = s.profession.sports[path];
  x.skills = currentSportSpecialties(s, path);
  x.foundation = actor(s, path).ability;
  x.participating = true;
  x.block = {
    focus,
    load,
    hours: d.hours,
    startedWeek: s.week,
    endsWeek: s.week + 4,
    status: "active",
    sessions: 0,
    missed: 0,
    paid: 0,
    deliveredWeek: null,
    note: "Training begins next week.",
  };
  if (calendarForecast(s, { comingWeek: true }).mandatory > 168)
    throw new Error(
      "This block would overbook your required weekly time. Adjust your calendar first.",
    );
  return s;
}
export function cancelTrainingBlock(state, path) {
  if (
    !Object.hasOwn(SPORT_SPECIALTIES, path) ||
    state.profession.sports[path].block?.status !== "active"
  )
    throw new Error("There is no active training block to cancel.");
  const s = act(state, 1, 8);
  s.profession.sports[path].block.status = "cancelled";
  return s;
}
export function prepareProfession(s) {
  const x = s.profession;
  if (!x || x.preparedWeek === s.week) return;
  x.preparedWeek = s.week;
  if (
    x.company.delegated &&
    s.week % 4 === 0 &&
    s.company &&
    !s.ownershipPlay.management.founder?.staff.some(
      (p) => p.role === "coach" && p.expiresWeek > s.week,
    )
  )
    note(
      s,
      "Your delegated company no longer has an operations manager. Its operating performance is reduced until you appoint a replacement.",
      "warning",
    );
  for (const [path, p] of Object.entries(x.sports)) {
    p.skills = currentSportSpecialties(s, path);
    p.foundation = actor(s, path).ability;
    p.fatigue = clamp(p.fatigue - 4);
    const b = p.block;
    if (!b || b.status !== "active" || s.week <= b.startedWeek) continue;
    const a = actor(s, path),
      d = TRAINING_LOADS[b.load];
    if (s.week > b.endsWeek) {
      b.status = "completed";
      continue;
    }
    const reason = s.globalLife.crime.prison
      ? "custody"
      : activeCareerPath(s) !== path
        ? "another active career"
        : a.injuryWeeks
          ? "injury"
          : ["none", "retired"].includes(a.stage)
            ? "sport inactive"
            : s.energy < 15
              ? "exhaustion"
              : s.calendar.last?.deficit > 0
                ? "calendar overbooked"
                : availableCash(s) < d.cost
                  ? "unfunded coaching"
                  : null;
    if (reason) {
      b.missed++;
      b.note = `Session missed: ${reason}. No coaching fee charged.`;
    } else {
      s.money = round(s.money - d.cost);
      b.paid = round(b.paid + d.cost);
      b.sessions++;
      b.deliveredWeek = s.week;
      const gain =
        d.gain * (1 - p.fatigue / 180) * (a.discipline >= 70 ? 1.08 : 1);
      p.skills[b.focus] = clamp(p.skills[b.focus] + gain);
      p.fatigue = clamp(p.fatigue + d.fatigue);
      s.energy = clamp(
        s.energy - (b.load === "coached" ? 5 : b.load === "recovery" ? -3 : 2),
      );
      b.note = `${SPORT_SPECIALTIES[path][b.focus]} +${gain.toFixed(2)}; ${d.cost ? `$${d.cost} coaching paid` : "no coaching fee"}.`;
    }
    if (s.week === b.endsWeek) {
      b.status = "completed";
      p.history.unshift({ ...b });
      p.history = p.history.slice(0, 12);
    }
  }
}
function currentWork(s) {
  const j = jobDefinition(s.employment?.jobId);
  return j && !isSportingJob(j) && !onParentalLeave(s) ? j : null;
}
export function startWorkAssignment(state) {
  const j = currentWork(state),
    w = state.profession.work;
  if (!j)
    throw new Error(
      "Assignments need a current non-sport job outside parental leave.",
    );
  if (w.active || state.week < w.nextWeek)
    throw new Error(
      "Finish your current assignment or wait for the next review.",
    );
  const s = act(state, 2, 16),
    c = WORK_CASES[j.track] || WORK_CASES.office;
  s.profession.work.active = {
    id: `assignment:${s.profession.serial++}`,
    jobId: j.id,
    track: j.track,
    title: c.name,
    startedWeek: s.week,
    dueWeek: s.week + 6,
    stage: 0,
    progress: 0,
    quality: 0,
    sessions: 0,
    lastSessionWeek: -1,
    status: "active",
    bonus: Math.round(s.employment.weeklyPay * 0.12),
    outcome: null,
  };
  return s;
}
export function workAssignment(state, method) {
  const a = state.profession.work.active,
    j = currentWork(state);
  const methods = WORK_METHODS[a?.track] || WORK_METHODS.office;
  if (
    !Object.hasOwn(methods, method) ||
    !a ||
    !j ||
    a.jobId !== j.id ||
    a.status !== "active"
  )
    throw new Error("Choose an approach for your current work assignment.");
  const approach = methods[method].mode;
  if (a.lastSessionWeek === state.week)
    throw new Error(
      "Give your colleagues a week to respond before the next assignment session.",
    );
  const s = act(state, 3, 16),
    p = s.profession.work.active,
    c = WORK_CASES[p.track] || WORK_CASES.office;
  const quality = clamp(
    s.skills[TRACK_SKILLS[j.track]] * 0.5 +
      s.energy * 0.2 +
      s.workLife.colleagueBond * 0.12 +
      s.workLife.managerBond * 0.08 +
      (approach === c.priority ? 12 : 5) +
      (rng(s.profession) * 8 - 4),
  );
  p.quality = (p.quality * p.sessions + quality) / (p.sessions + 1);
  p.sessions++;
  p.lastSessionWeek = s.week;
  p.progress += approach === "efficient" ? 1.5 : 1;
  p.stage = Math.min(2, Math.floor(p.progress / 2));
  s.energy = clamp(s.energy - (approach === "efficient" ? 7 : 4));
  if (approach === "collaborative")
    s.workLife.colleagueBond = clamp(s.workLife.colleagueBond + 1);
  if (p.progress >= 6) {
    const passed = p.quality >= 55;
    p.status = passed ? "completed" : "needs-improvement";
    p.outcome = `${Math.round(p.quality)}/100 review. ${passed ? "Delivered within your current role." : "Your supervisor requested stronger evidence."}`;
    if (passed) {
      receiveIncome(s, p.bonus, "earned");
      s.employment.performance = clamp(s.employment.performance + 3);
      s.workLife.managerBond = clamp(s.workLife.managerBond + 3);
    } else s.employment.performance = clamp(s.employment.performance - 2);
    p.paid = passed ? p.bonus : 0;
    s.profession.work.history.unshift({ ...p });
    s.profession.work.history = s.profession.work.history.slice(0, 20);
    s.profession.work.active = null;
    s.profession.work.nextWeek = s.week + 4;
    note(
      s,
      `${j.employer}: ${p.title} ${p.status}. ${p.outcome}${passed ? ` $${p.bonus} gross project bonus.` : ""}`,
      passed ? "milestone" : "warning",
    );
  }
  return s;
}
export function prepareSportDetails(state, path, details) {
  const plan = state.nextChapter.plans[path];
  if (
    !Object.hasOwn(MATCH_DETAILS, path) ||
    !plan ||
    plan.chosenWeek !== state.week ||
    plan.status !== "planned"
  )
    throw new Error("Prepare this fixture's performance plan first.");
  if (
    Object.keys(details).length !== 2 ||
    Object.entries(MATCH_DETAILS[path]).some(
      ([key, d]) => !Object.hasOwn(d.options, details[key]),
    )
  )
    throw new Error("Choose valid sport-specific preparation details.");
  const s = structuredClone(state);
  s.profession.sports[path].tactics = {
    fixtureId: plan.fixtureId,
    week: plan.week,
    club: actor(s, path).club,
    details: { ...details },
  };
  return s;
}
export function reviewStudioRecording(state, projectId, method) {
  assertCareerPath(state, "music");
  const project = state.music.projects.find((p) => p.id === projectId),
    methods = STUDIO_REVIEWS[project?.role],
    d = methods?.[method];
  if (
    !project ||
    project.status !== "ready" ||
    !d ||
    !Object.hasOwn(methods, method) ||
    state.realWorld.retiredMusic
  )
    throw new Error(
      "Choose a finished, unreleased recording and a review for your current music role.",
    );
  if (state.profession.music.studio.some((r) => r.projectId === projectId))
    throw new Error("This recording already received its final studio review.");
  if (
    project.role === "producer" &&
    method === "mix" &&
    !state.inventory.some((i) => ["laptop", "workstation"].includes(i))
  )
    throw new Error(
      "Mix revision needs your own computer; an external mastering consultation is also available.",
    );
  if (availableCash(state) < d.cost)
    throw new Error("Fund the studio session before booking it.");
  const s = act(state, 3, 13),
    p = s.music.projects.find((p) => p.id === projectId),
    gain = round(1 + s.music.skills[d.skill] * 0.035);
  s.money = round(s.money - d.cost);
  s.energy = clamp(s.energy - 4);
  const before = p.quality;
  p.quality = clamp(p.quality + gain);
  s.profession.music.studio.unshift({
    projectId,
    method,
    role: project.role,
    week: s.week,
    cost: d.cost,
    gain: round(p.quality - before),
  });
  s.profession.music.studio = s.profession.music.studio.slice(0, 30);
  return s;
}
export function setArtisticDirection(state, direction) {
  assertCareerPath(state, "music");
  if (
    !Object.hasOwn(ART_DIRECTIONS, direction) ||
    !state.music.active ||
    state.realWorld.retiredMusic
  )
    throw new Error("Choose a direction for an active music career.");
  if (state.week < state.profession.music.changedWeek + 13)
    throw new Error(
      "Give your current artistic direction thirteen weeks to develop.",
    );
  const s = act(state, 2, 13);
  Object.assign(s.profession.music, {
    enabled: true,
    direction,
    changedWeek: s.week,
  });
  return s;
}
export function startCreatorSeries(
  state,
  { title, platform, format = "diary", cadence = 1 },
) {
  assertCareerPath(state, "creator");
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 50 ||
    !Object.hasOwn(state.social.profiles, platform) ||
    !state.social.profiles[platform].active ||
    !Object.hasOwn(SERIES_FORMATS, format) ||
    ![1, 2].includes(Number(cadence))
  )
    throw new Error(
      "Give your series a title, active platform, format and weekly or fortnightly cadence.",
    );
  if (state.social.privacy !== "public")
    throw new Error("A discoverable series needs a public account.");
  if (state.profession.creator.series.some((p) => p.status === "active"))
    throw new Error("Finish your current six-episode series first.");
  const s = act(state, 2, 13);
  s.profession.creator.committed = true;
  s.profession.creator.series.push({
    id: `series:${s.profession.serial++}`,
    title: title.trim(),
    platform,
    format,
    cadence: Number(cadence),
    startedWeek: s.week,
    nextWeek: s.week,
    status: "active",
    retention: 50,
    episodes: [],
    missed: 0,
  });
  s.profession.creator.series = s.profession.creator.series.slice(-12);
  return s;
}
export function createSeriesEpisode(state, id, approach = "authentic") {
  assertCareerPath(state, "creator");
  if (state.social.privacy !== "public")
    throw new Error(
      "Restore public account privacy before publishing a discoverable series episode.",
    );
  const series = state.profession.creator.series.find((p) => p.id === id);
  if (
    !series ||
    series.status !== "active" ||
    series.episodes.some((p) => p.createdWeek === state.week) ||
    series.episodes.length >= 6
  )
    throw new Error("Choose an active series with an episode slot this week.");
  if (state.week < series.nextWeek)
    throw new Error("Your next episode is not due yet.");
  const s = createPost(state, {
      platform: series.platform,
      approach,
      sponsored: false,
    }),
    post = s.social.posts.at(-1),
    p = s.profession.creator.series.find((p) => p.id === id);
  post.seriesId = id;
  post.quality = clamp(
    post.quality +
      (p.format === "diary"
        ? approach === "authentic"
          ? 3
          : -2
        : p.format === "guide"
          ? approach === "polished"
            ? 3
            : -2
          : 1),
  );
  p.episodes.push({
    postId: post.id,
    createdWeek: s.week,
    status: "pending",
    views: 0,
    gained: 0,
    retention: null,
  });
  p.nextWeek = s.week + p.cadence;
  return s;
}
export function acceptClientBrief(state, kind) {
  assertCareerPath(state, "business");
  const d = CLIENT_BRIEFS[kind],
    p = state.profession.company;
  if (
    !Object.hasOwn(CLIENT_BRIEFS, kind) ||
    !state.company ||
    state.skills.business < d.skill
  )
    throw new Error(
      "Choose a client brief at your company's current business skill level.",
    );
  if (
    p.contracts.some((c) =>
      ["active", "invoiced", "disputed"].includes(c.status),
    ) ||
    state.week < p.nextWeek
  )
    throw new Error(
      "Settle your current client contract before taking another.",
    );
  if (state.company.cash < d.unitCost)
    throw new Error("The company must fund at least the first delivery unit.");
  const s = act(state, 2, 18);
  s.profession.company.contracts.push({
    id: `client:${s.profession.serial++}`,
    kind,
    companyName: s.company.name,
    sector: s.company.sector,
    startedWeek: s.week,
    dueWeek: s.week + d.weeks,
    status: "active",
    units: 0,
    quality: 0,
    costs: 0,
    fee: d.fee,
    lastSessionWeek: -1,
    invoiceWeek: null,
    paid: 0,
    note: "No advance: payment follows delivery and a two-week invoice period.",
  });
  s.profession.company.contracts = s.profession.company.contracts.slice(-20);
  return s;
}
export function deliverClientWork(state, id, approach = "quality") {
  assertCareerPath(state, "business");
  const c = state.profession.company.contracts.find((c) => c.id === id);
  if (
    !c ||
    !["active", "disputed"].includes(c.status) ||
    !state.company ||
    c.companyName !== state.company.name ||
    c.sector !== state.company.sector ||
    !["quality", "efficient"].includes(approach)
  )
    throw new Error(
      "Choose delivery or remedial work for the current company's client contract.",
    );
  if (c.lastSessionWeek === state.week)
    throw new Error("The client reviews one delivery unit per week.");
  const d = CLIENT_BRIEFS[c.kind],
    cost = Math.round(d.unitCost * (approach === "quality" ? 1.2 : 1));
  if (state.company.cash < cost)
    throw new Error("Fund the delivery cost from company cash.");
  const s = act(state, 3, 18),
    p = s.profession.company.contracts.find((c) => c.id === id);
  s.company.cash = round(s.company.cash - cost);
  p.costs = round(p.costs + cost);
  p.lastSessionWeek = s.week;
  const q = clamp(
    s.skills.business * 0.6 +
      s.energy * 0.15 +
      s.globalLife.companyPlan.quality * 0.15 +
      (approach === "quality" ? 15 : 3) +
      (rng(s.profession) * 10 - 5),
  );
  p.quality = (p.quality * p.units + q) / (p.units + 1);
  p.units++;
  s.energy = clamp(s.energy - 5);
  if (p.status === "disputed") p.quality = Math.max(p.quality, q);
  if (p.units >= d.units) {
    if (p.quality >= d.quality) {
      p.status = "invoiced";
      p.invoiceWeek = s.week + 2;
      p.note = "Delivery accepted. Invoice due in two weeks.";
    } else {
      p.status = "disputed";
      p.note = `Quality ${Math.round(p.quality)}/100 is below the agreed ${d.quality}. Remedial work is needed before the deadline.`;
    }
  }
  return s;
}
export function leaveCreatorPath(state) {
  const s = act(state, 1, 13);
  s.profession.creator.committed = false;
  for (const p of s.profession.creator.series)
    if (p.status === "active") p.status = "cancelled";
  return s;
}
export function stopMusicPath(state) {
  if (!state.music.active)
    throw new Error("You do not have an active music path.");
  if (
    state.music.projects.some((p) => p.status === "recording") ||
    state.careerWorld.music.activeTour ||
    state.music.gigs.some((g) => g.status === "booked")
  )
    throw new Error(
      "Finish active recordings, tours and booked performances before leaving music.",
    );
  const s = act(state, 2, 6);
  s.music.active = false;
  s.realWorld.retiredMusic = true;
  note(
    s,
    "Stepped away from new music work. Your catalogue and existing royalty agreements remain.",
  );
  return s;
}
export function delegateFounderPath(state) {
  if (
    activeCareerPath(state) !== "business" ||
    !state.ownershipPlay.management.founder?.staff.some(
      (p) => p.role === "coach" && p.expiresWeek > state.week,
    )
  )
    throw new Error(
      "Appoint a current operations manager in Company → Operations before stepping away from the founder career.",
    );
  if (
    state.profession.company.contracts.some((c) =>
      ["active", "disputed"].includes(c.status),
    )
  )
    throw new Error(
      "Finish active client deliveries before handing over the founder role.",
    );
  const s = act(state, 2, 18);
  s.profession.company.delegated = true;
  s.career = "unemployed";
  note(
    s,
    "Stepped away from the founder career. Company ownership and paid management remain; new personal client work needs a return to the founder role.",
  );
  return s;
}
export function resumeFounderPath(state) {
  assertCareerPath(state, "business");
  if (!state.company) throw new Error("You do not own a founded company.");
  const s = act(state, 2, 18);
  s.profession.company.delegated = false;
  s.career = "business";
  return s;
}
export function researchInvestment(state, asset, markets) {
  const m = markets.find((m) => m.id === asset);
  if (!m) throw new Error("Choose a listed asset to research.");
  if (
    state.profession.investing.research.some(
      (r) => r.asset === asset && r.week === state.week,
    )
  )
    throw new Error("You already researched this asset this week.");
  const s = act(state, 3, 18),
    issuer = BUSINESSES.find((b) => b.stock === asset),
    prices = s.marketHistory[asset],
    returns = prices.slice(1).map((p, i) => (p / prices[i] - 1) * 100),
    mean = returns.reduce((n, r) => n + r, 0) / Math.max(1, returns.length),
    vol = Math.sqrt(
      returns.reduce((n, r) => n + (r - mean) ** 2, 0) /
        Math.max(1, returns.length),
    );
  s.profession.investing.research.unshift({
    id: `research:${s.profession.serial++}`,
    asset,
    week: s.week,
    price: s.market[asset],
    observations: prices.length,
    volatility: round(vol),
    drawdown: round((s.market[asset] / Math.max(...prices) - 1) * 100),
    profit: issuer ? round(s.businessResults[issuer.id].profit) : null,
    quality: Math.round(s.skills.finance),
    note: issuer
      ? "Issuer profit is a simulated weekly observation, not a prediction."
      : "This asset has no company earnings. Price history cannot guarantee future returns.",
  });
  s.profession.investing.research = s.profession.investing.research.slice(
    0,
    24,
  );
  return s;
}
export function toggleWatchlist(state, asset, markets) {
  if (!markets.some((m) => m.id === asset))
    throw new Error("Choose a valid asset.");
  const s = structuredClone(state),
    a = s.profession.investing.watchlist;
  s.profession.investing.watchlist = a.includes(asset)
    ? a.filter((id) => id !== asset)
    : [...a, asset];
  return s;
}
export function placeLimitOrder(
  state,
  { asset, side, quantity, limit, weeks = 4 },
  markets,
) {
  const m = markets.find((m) => m.id === asset);
  quantity = Number(quantity);
  limit = Number(limit);
  weeks = Number(weeks);
  if (
    !m ||
    !["buy", "sell"].includes(side) ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > marketVolume(state, m) ||
    (!m.fractional && !Number.isSafeInteger(quantity)) ||
    (m.fractional &&
      Math.abs(quantity - Math.round(quantity * 1e6) / 1e6) > 1e-10) ||
    !Number.isFinite(limit) ||
    limit < 0.01 ||
    limit > 1e9 ||
    ![1, 4, 13].includes(weeks) ||
    quantity * limit < 1 ||
    quantity * limit > 1e12
  )
    throw new Error("Choose a valid asset, quantity, limit price and expiry.");
  if (
    state.profession.investing.orders.filter((o) => o.status === "pending")
      .length >= 5
  )
    throw new Error("You can have five open orders at once.");
  if (side === "buy" && availableCash(state) < round(quantity * limit))
    throw new Error("Reserve the full buy order at its limit price first.");
  if (
    side === "sell" &&
    quantity > state.holdings[asset] - orderSharesReserved(state, asset) + 1e-9
  )
    throw new Error("These units are already committed or not owned.");
  const s = act(state, 1, 18);
  s.profession.investing.orders.push({
    id: `order:${s.profession.serial++}`,
    asset,
    side,
    quantity,
    limit,
    placedWeek: s.week,
    expiresWeek: s.week + weeks,
    status: "pending",
    fillWeek: null,
    fillPrice: null,
    note: "Checked at each weekly closing price; no intraday or guaranteed execution.",
  });
  s.profession.investing.orders = [
    ...s.profession.investing.orders.filter((o) => o.status === "pending"),
    ...s.profession.investing.orders
      .filter((o) => o.status !== "pending")
      .slice(-25),
  ];
  return s;
}
export function cancelLimitOrder(state, id) {
  const o = state.profession.investing.orders.find((o) => o.id === id);
  if (!o || o.status !== "pending")
    throw new Error("Choose an open limit order.");
  const s = structuredClone(state);
  s.profession.investing.orders.find((o) => o.id === id).status = "cancelled";
  return s;
}
function advanceReports(s) {
  for (const [path, p] of Object.entries(s.profession.sports)) {
    const f = s.seasons[path].fixtures.find(
      (f) => f.week === s.week && f.status === "played",
    );
    if (!f || p.reports.some((r) => r.fixtureId === f.id)) continue;
    const k = currentSportSpecialties(s, path),
      score = f.result.score,
      noise = hashFraction(f.id + ":analysis");
    let metrics;
    if (path === "football")
      metrics = {
        "Pass completion": Math.round(
          clamp(40 + k.passing * 0.3 + score * 0.2, 30, 98),
        ),
        Assists: Math.min(
          Math.max(0, f.result.ownScore - (s.football.lastMatch?.goals || 0)),
          noise < k.passing / 180 ? 1 : 0,
        ),
        "Defensive contributions": Math.round(
          (k.defending * 0.4 + score * 0.2) / 8,
        ),
      };
    else if (path === "racing")
      metrics = {
        "Race finish": f.result.position,
        "Tyre control": Math.round(
          clamp(k.tyres * 0.6 + score * 0.4 - p.fatigue * 0.1),
        ),
        "Wet-weather readiness": Math.round(k.wet),
      };
    else if (path === "basketball")
      metrics = {
        Points: Math.min(
          f.result.ownScore,
          Math.round(
            (f.result.ownScore * (0.08 + k.shooting * 0.002) * score) / 100,
          ),
        ),
        Assists: Math.round((k.playmaking * score) / 1600),
        Rebounds: Math.round((k.rebounding * score) / 1000),
      };
    else
      metrics = {
        "Serve effectiveness": Math.round(clamp(k.serve * 0.6 + score * 0.4)),
        "Baseline control": Math.round(clamp(k.baseline * 0.6 + score * 0.4)),
        "Net effectiveness": Math.round(clamp(k.net * 0.6 + score * 0.4)),
      };
    const celebrating =
      f.result.won ||
      (path === "football" && s.football.lastMatch?.goals > 0) ||
      (path === "racing" && f.result.position <= 3);
    p.reports.unshift({
      fixtureId: f.id,
      week: s.week,
      opponent: f.opponent,
      score,
      role: p.role,
      fatigue: round(p.fatigue),
      metrics,
      kitId: s.profession.style.equipment[path],
      celebrationId: celebrating ? s.profession.style.celebrations[path] : null,
    });
    p.reports = p.reports.slice(0, 24);
  }
}
export function advanceProfession(s, { trade, markets } = {}) {
  const x = s.profession;
  if (!x || x.lastWeek === s.week) return;
  x.lastWeek = s.week;
  advanceReports(s);
  const a = x.work.active;
  if (
    a &&
    (!s.employment ||
      s.employment.jobId !== a.jobId ||
      s.week > a.dueWeek ||
      s.globalLife.crime.prison)
  ) {
    a.status =
      s.employment?.jobId === a.jobId && !s.globalLife.crime.prison
        ? "overdue"
        : "abandoned";
    a.outcome =
      a.status === "overdue"
        ? "The delivery deadline passed."
        : "Your original employment ended or was interrupted.";
    a.paid = 0;
    if (a.status === "overdue" && s.employment)
      s.employment.performance = clamp(s.employment.performance - 3);
    x.work.history.unshift({ ...a });
    x.work.history = x.work.history.slice(0, 20);
    x.work.active = null;
    x.work.nextWeek = s.week + 4;
  }
  for (const r of s.music.releases.filter(
    (r) =>
      !x.music.reviews.some((q) => q.releaseId === r.id) &&
      r.releasedWeek === s.week,
  )) {
    const critical = Math.round(
        clamp(r.quality + (hashFraction(r.id + ":critics") - 0.5) * 16),
      ),
      publicRating = Math.round(
        clamp(
          r.quality * 0.8 +
            x.music.loyalty * 0.2 +
            (hashFraction(r.id + ":audience") - 0.5) * 12,
        ),
      );
    x.music.reviews.unshift({
      releaseId: r.id,
      week: s.week,
      title: r.title,
      critical,
      publicRating,
      direction: x.music.direction,
      firstWeekStreams: r.weeklyStreams,
    });
    x.music.reviews = x.music.reviews.slice(0, 24);
    x.music.loyalty = clamp(
      x.music.loyalty + (publicRating >= 65 ? 2 : publicRating < 40 ? -3 : 0),
    );
  }
  for (const p of x.creator.series.filter((p) => p.status === "active")) {
    for (const e of p.episodes.filter((e) => e.status === "pending")) {
      const post = s.social.posts.find((post) => post.id === e.postId);
      if (!post || post.status !== "resolved") continue;
      Object.assign(e, {
        status: "published",
        views: post.views,
        gained: post.gained,
        retention: Math.round(
          clamp(
            20 +
              post.quality * 0.65 -
              (post.approach === "clickbait" ? 15 : 0) +
              (p.format === "diary"
                ? post.approach === "authentic"
                  ? 5
                  : -5
                : p.format === "guide"
                  ? post.quality >= 60
                    ? 5
                    : -3
                  : 0),
            5,
            95,
          ),
        ),
      });
      p.retention = round(p.retention * 0.65 + e.retention * 0.35);
    }
    if (
      p.episodes.length === 6 &&
      p.episodes.every((e) => e.status === "published")
    ) {
      p.status = "completed";
      note(
        s,
        `Completed “${p.title}”: six published episodes and ${Math.round(p.retention)}% modelled audience retention.`,
        "milestone",
      );
    } else if (s.week > p.nextWeek + 1) {
      p.missed++;
      p.retention = clamp(p.retention - 4);
      p.nextWeek = s.week + p.cadence;
    }
  }
  for (const c of x.company.contracts) {
    if (!["active", "disputed", "invoiced"].includes(c.status)) continue;
    if (
      !s.company ||
      s.company.name !== c.companyName ||
      s.company.sector !== c.sector
    ) {
      c.status = "abandoned";
      c.note = "The contracted business was closed or changed industry.";
      continue;
    }
    if (c.status === "invoiced" && s.week >= c.invoiceWeek) {
      s.company.cash = round(s.company.cash + c.fee);
      c.paid = c.fee;
      c.status = "paid";
      c.note = `$${c.fee} client invoice collected into company cash. Delivery cost $${c.costs}.`;
      x.company.nextWeek = s.week + 2;
      note(s, c.note, "milestone");
    } else if (c.status !== "invoiced" && s.week > c.dueWeek) {
      c.status = "missed";
      c.note =
        "Delivery deadline missed. The client owes no fee; spent delivery costs remain.";
      x.company.nextWeek = s.week + 4;
    }
  }
  if (trade && markets)
    for (const id of x.investing.orders
      .filter((o) => o.status === "pending")
      .map((o) => o.id)) {
      let o = s.profession.investing.orders.find((o) => o.id === id);
      if (s.week > o.expiresWeek) {
        o.status = "expired";
        o.note = "Expired without an execution.";
        continue;
      }
      if (s.globalLife.crime.prison) {
        if (s.week >= o.expiresWeek) {
          o.status = "expired";
          o.note = "Expired while trading was paused in custody.";
        }
        continue;
      }
      const price = s.market[o.asset];
      if (!(o.side === "buy" ? price <= o.limit : price >= o.limit)) {
        if (s.week >= o.expiresWeek) {
          o.status = "expired";
          o.note =
            "The weekly closing price did not meet your limit before expiry.";
        }
        continue;
      }
      // Release only this order's reservation before using the ordinary, validated trade path.
      o.status = "executing";
      try {
        const next = trade(
          s,
          o.asset,
          o.quantity * (o.side === "buy" ? 1 : -1),
        );
        Object.assign(s, next);
        o = s.profession.investing.orders.find((o) => o.id === id);
        Object.assign(o, {
          status: "filled",
          fillWeek: s.week,
          fillPrice: price,
          note: `Filled at the weekly close of $${price.toFixed(2)}. Normal liquidity, ownership and cost-basis rules applied.`,
        });
      } catch (error) {
        o.status = s.week >= o.expiresWeek ? "expired" : "pending";
        o.note = error.message;
      }
    }
}

export function validateProfession(s, markets) {
  const x = s.profession,
    obj = (v) => v && typeof v === "object" && !Array.isArray(v),
    n = (v, lo = 0, hi = 1e15) => Number.isFinite(v) && v >= lo && v <= hi,
    int = (v, lo = 0, hi = 1e15) => n(v, lo, hi) && Number.isInteger(v),
    text = (v, max = 240) => typeof v === "string" && v.length <= max,
    arr = (v, max) => Array.isArray(v) && v.length <= max;
  const fail = () => {
    throw new Error(
      "Invalid sporting development, work assignment, creative career, client contract or investment order data.",
    );
  };
  if (
    !obj(x) ||
    !int(x.seed, 0, 4294967295) ||
    !int(x.serial) ||
    !int(x.lastWeek, 0, s.week) ||
    !int(x.preparedWeek, 0, s.week) ||
    !obj(x.sports) ||
    Object.keys(x.sports).length !== 4 ||
    !obj(x.work) ||
    !obj(x.music) ||
    !obj(x.creator) ||
    !obj(x.company) ||
    !obj(x.investing)
  )
    fail();
  validateCareerStyle(x.style);
  const validBlock = (b, path) =>
    obj(b) &&
    Object.hasOwn(SPORT_SPECIALTIES[path], b.focus) &&
    Object.hasOwn(TRAINING_LOADS, b.load) &&
    b.hours === TRAINING_LOADS[b.load].hours &&
    int(b.startedWeek, 0, s.week) &&
    b.endsWeek === b.startedWeek + 4 &&
    ["active", "completed", "cancelled"].includes(b.status) &&
    int(b.sessions, 0, 4) &&
    int(b.missed, 0, 4) &&
    b.sessions + b.missed <= 4 &&
    b.paid === b.sessions * TRAINING_LOADS[b.load].cost &&
    (b.deliveredWeek === null ||
      int(b.deliveredWeek, b.startedWeek + 1, Math.min(s.week, b.endsWeek))) &&
    text(b.note);
  for (const path of Object.keys(SPORT_SPECIALTIES)) {
    const p = x.sports[path];
    if (
      !obj(p) ||
      !obj(p.skills) ||
      !n(p.foundation, 0, 100) ||
      Object.keys(p.skills).length !== 4 ||
      Object.keys(SPORT_SPECIALTIES[path]).some(
        (k) => !n(p.skills[k], 0, 100),
      ) ||
      !Object.hasOwn(SPORT_ROLES[path], p.role) ||
      typeof p.participating !== "boolean" ||
      !n(p.fatigue, 0, 100) ||
      !int(p.roleWeek, -1, s.week) ||
      !arr(p.reports, 24) ||
      !arr(p.history, 12) ||
      !(p.block === null || validBlock(p.block, path)) ||
      p.history.some((b) => !validBlock(b, path))
    )
      fail();
    if (
      p.tactics !== null &&
      (!obj(p.tactics) ||
        !text(p.tactics.fixtureId, 100) ||
        !int(p.tactics.week, 0, s.week + 2) ||
        !text(p.tactics.club, 100) ||
        !obj(p.tactics.details) ||
        Object.keys(p.tactics.details).length !== 2 ||
        Object.entries(MATCH_DETAILS[path]).some(
          ([k, d]) => !Object.hasOwn(d.options, p.tactics.details[k]),
        ))
    )
      fail();
    if (
      p.reports.some(
        (r) =>
          !obj(r) ||
          !text(r.fixtureId, 100) ||
          !int(r.week, 0, s.week) ||
          !text(r.opponent, 100) ||
          !n(r.score, 0, 100) ||
          !Object.hasOwn(SPORT_ROLES[path], r.role) ||
          !n(r.fatigue, 0, 100) ||
          !CAREER_KIT.some((k) => k.path === path && k.id === r.kitId) ||
          !(
            r.celebrationId === null ||
            CAREER_CELEBRATIONS[path].some((c) => c.id === r.celebrationId)
          ) ||
          !obj(r.metrics) ||
          Object.keys(r.metrics).length !== 3 ||
          Object.values(r.metrics).some((v) => !n(v, 0, 1000)),
      )
    )
      fail();
  }
  const validAssignment = (a) =>
    obj(a) &&
    text(a.id, 100) &&
    !!jobDefinition(a.jobId) &&
    jobDefinition(a.jobId).track === a.track &&
    text(a.title, 100) &&
    int(a.startedWeek, 0, s.week) &&
    a.dueWeek === a.startedWeek + 6 &&
    int(a.stage, 0, 2) &&
    n(a.progress, 0, 7) &&
    n(a.quality, 0, 100) &&
    int(a.sessions, 0, 8) &&
    int(a.lastSessionWeek, -1, s.week) &&
    [
      "active",
      "completed",
      "needs-improvement",
      "overdue",
      "abandoned",
    ].includes(a.status) &&
    int(a.bonus) &&
    (a.outcome === null || text(a.outcome)) &&
    (a.paid === undefined || n(a.paid, 0, a.bonus));
  if (
    typeof x.creator.committed !== "boolean" ||
    !(x.work.active === null || validAssignment(x.work.active)) ||
    !arr(x.work.history, 20) ||
    x.work.history.some((a) => !validAssignment(a)) ||
    !int(x.work.nextWeek, 0, s.week + 4)
  )
    fail();
  const m = x.music;
  if (
    typeof m.enabled !== "boolean" ||
    !Object.hasOwn(ART_DIRECTIONS, m.direction) ||
    !int(m.changedWeek, -13, s.week) ||
    !n(m.loyalty, 0, 100) ||
    !arr(m.reviews, 24) ||
    !arr(m.studio, 30) ||
    m.reviews.some(
      (r) =>
        !obj(r) ||
        !text(r.releaseId, 100) ||
        !text(r.title, 100) ||
        !int(r.week, 0, s.week) ||
        !n(r.critical, 0, 100) ||
        !n(r.publicRating, 0, 100) ||
        !Object.hasOwn(ART_DIRECTIONS, r.direction) ||
        !int(r.firstWeekStreams),
    ) ||
    m.studio.some(
      (r) =>
        !obj(r) ||
        !text(r.projectId, 100) ||
        !Object.hasOwn(STUDIO_REVIEWS, r.role) ||
        !Object.hasOwn(STUDIO_REVIEWS[r.role], r.method) ||
        !int(r.week, 0, s.week) ||
        r.cost !== STUDIO_REVIEWS[r.role][r.method].cost ||
        !n(r.gain, 0, 4.5),
    ) ||
    new Set(m.studio.map((r) => r.projectId)).size !== m.studio.length
  )
    fail();
  if (
    !arr(x.creator.series, 12) ||
    x.creator.series.filter((p) => p.status === "active").length > 1 ||
    x.creator.series.some(
      (p) =>
        !obj(p) ||
        !text(p.id, 100) ||
        !text(p.title, 50) ||
        !Object.hasOwn(s.social.profiles, p.platform) ||
        !Object.hasOwn(SERIES_FORMATS, p.format) ||
        ![1, 2].includes(p.cadence) ||
        !int(p.startedWeek, 0, s.week) ||
        !int(p.nextWeek, 0, s.week + 2) ||
        !["active", "completed", "cancelled"].includes(p.status) ||
        !n(p.retention, 0, 100) ||
        !int(p.missed) ||
        !arr(p.episodes, 6) ||
        p.episodes.some(
          (e) =>
            !obj(e) ||
            !text(e.postId, 100) ||
            !int(e.createdWeek, 0, s.week) ||
            !["pending", "published"].includes(e.status) ||
            !int(e.views) ||
            !int(e.gained) ||
            !(e.retention === null || n(e.retention, 0, 100)),
        ) ||
        new Set(p.episodes.map((e) => e.postId)).size !== p.episodes.length,
    )
  )
    fail();
  if (
    !arr(x.company.contracts, 20) ||
    typeof x.company.delegated !== "boolean" ||
    !int(x.company.nextWeek, 0, s.week + 4) ||
    x.company.contracts.filter((c) =>
      ["active", "disputed", "invoiced"].includes(c.status),
    ).length > 1 ||
    x.company.contracts.some(
      (c) =>
        !obj(c) ||
        !text(c.id, 100) ||
        !Object.hasOwn(CLIENT_BRIEFS, c.kind) ||
        !text(c.companyName, 40) ||
        !text(c.sector, 100) ||
        !int(c.startedWeek, 0, s.week) ||
        c.dueWeek !== c.startedWeek + CLIENT_BRIEFS[c.kind].weeks ||
        ![
          "active",
          "disputed",
          "invoiced",
          "paid",
          "missed",
          "abandoned",
        ].includes(c.status) ||
        !int(c.units, 0, 20) ||
        !n(c.quality, 0, 100) ||
        !n(c.costs) ||
        c.fee !== CLIENT_BRIEFS[c.kind].fee ||
        !int(c.lastSessionWeek, -1, s.week) ||
        !(
          c.invoiceWeek === null ||
          int(c.invoiceWeek, c.startedWeek, s.week + 2)
        ) ||
        ![0, c.fee].includes(c.paid) ||
        !text(c.note),
    )
  )
    fail();
  const v = x.investing,
    known = (id) => markets.find((m) => m.id === id);
  if (
    !arr(v.orders, 30) ||
    v.orders.filter((o) => o.status === "pending").length > 5 ||
    !arr(v.research, 24) ||
    !arr(v.watchlist, markets.length) ||
    new Set(v.watchlist).size !== v.watchlist.length ||
    v.watchlist.some((id) => !known(id))
  )
    fail();
  if (
    v.orders.some(
      (o) =>
        !obj(o) ||
        !text(o.id, 100) ||
        !known(o.asset) ||
        !["buy", "sell"].includes(o.side) ||
        !n(
          o.quantity,
          0.000001,
          known(o.asset) ? marketVolume(s, known(o.asset)) : 0,
        ) ||
        (!known(o.asset)?.fractional && !Number.isSafeInteger(o.quantity)) ||
        Math.abs(o.quantity - Math.round(o.quantity * 1e6) / 1e6) > 1e-10 ||
        !n(o.limit, 0.01, 1e9) ||
        !n(o.quantity * o.limit, 1, 1e12) ||
        !int(o.placedWeek, 0, s.week) ||
        ![1, 4, 13].includes(o.expiresWeek - o.placedWeek) ||
        !["pending", "filled", "cancelled", "expired"].includes(o.status) ||
        !(
          o.fillWeek === null || int(o.fillWeek, o.placedWeek, o.expiresWeek)
        ) ||
        !(o.fillPrice === null || n(o.fillPrice, 0.01)) ||
        !text(o.note, 480) ||
        (o.status === "filled" &&
          (o.fillWeek === null || o.fillPrice === null)),
    )
  )
    fail();
  if (
    new Set(v.orders.map((o) => o.id)).size !== v.orders.length ||
    v.research.some(
      (r) =>
        !obj(r) ||
        !text(r.id, 100) ||
        !known(r.asset) ||
        !int(r.week, 0, s.week) ||
        !n(r.price, 0.01) ||
        !int(r.observations, 1, 24) ||
        !n(r.volatility, 0, 1e6) ||
        !n(r.drawdown, -100, 1e6) ||
        !(r.profit === null || n(r.profit, -1e15, 1e15)) ||
        !n(r.quality, 0, 100) ||
        !text(r.note),
    )
  )
    fail();
}
