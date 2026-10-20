import { localProfile } from "./economy.js";
import { productTrading, onParentalLeave } from "./realism.js";
import { industry } from "./expansion-data.js";
import { ownerOperatingAdjustment } from "./ownership-play.js";
import { publicHiringPenalty } from "./pressure-effects.js";
import { personalityModifier } from "./personality.js";
import { releaseSportAgreement } from "./contracts.js";
import {
  schoolScholarshipRate,
  consumeScholarship,
  relevantWorkWeeks,
} from "./life-course.js";
import { receiveIncome, recordCapitalGain, recordTrade } from "./banking.js";
import { storyTuitionSupport } from "./stories.js";
import { EXTRA_PROGRAMS, EXTRA_JOBS, EXTRA_CAREERS } from "./career-data.js";
import { allocationRatio, spendTime } from "./calendar.js";
import { beginEmployment } from "./careers.js";
import { orderCashReserved } from "./profession-effects.js";
import { assertCareerPath, careerPathReason } from "./career-commitment.js";
import { eraIndex, subjectAdmissionReason, historicalJobReason } from "./simulation/effects.js";

// Employment, qualifications, and ownership share the same clock and cash balance.
export const PROGRAMS = [
  ...EXTRA_PROGRAMS,
  {
    id: "football-coaching",
    name: "Football coaching certificate",
    weeks: 26,
    tuition: 50,
    requires: "school",
    skill: "athletics",
    gain: 4,
    minimumSkill: 30,
    minAge: 18,
    experience: 52,
    track: "football",
  },
  {
    id: "school",
    name: "Secondary-school equivalency",
    weeks: 52,
    tuition: 20,
    requires: null,
    skill: "business",
    gain: 4,
  },
  {
    id: "business-cert",
    name: "Business administration certificate",
    weeks: 26,
    tuition: 35,
    requires: "school",
    skill: "business",
    gain: 6,
  },
  {
    id: "finance-cert",
    name: "Investment operations certificate",
    weeks: 39,
    tuition: 45,
    requires: "school",
    skill: "finance",
    gain: 8,
  },
  {
    id: "business-degree",
    name: "Business bachelor’s degree",
    weeks: 156,
    tuition: 65,
    requires: "school",
    skill: "business",
    gain: 12,
  },
  {
    id: "finance-degree",
    name: "Finance bachelor’s degree",
    weeks: 156,
    tuition: 75,
    requires: "school",
    skill: "finance",
    gain: 12,
  },
  {
    id: "racing-license",
    name: "National competition licence",
    weeks: 13,
    tuition: 100,
    requires: null,
    skill: "driving",
    gain: 6,
    minimumSkill: 25,
    minAge: 15,
  },
  {
    id: "international-license",
    name: "International racing licence",
    weeks: 26,
    tuition: 250,
    requires: "racing-license",
    skill: "driving",
    gain: 8,
    minimumSkill: 55,
    minAge: 16,
  },
  {
    id: "super-license",
    name: "Top-level racing licence",
    weeks: 52,
    tuition: 600,
    requires: "international-license",
    skill: "driving",
    gain: 10,
    minimumSkill: 85,
    minAge: 18,
    experience: 208,
    track: "racing",
  },
];
const job = (
  id,
  title,
  employer,
  track,
  level,
  pay,
  qualification,
  skill,
  experience = 0,
) => ({
  id,
  title,
  employer,
  track,
  level,
  pay,
  maxPay: Math.round(pay * 1.35),
  qualification,
  skill,
  experience,
});
export const JOBS = [
  ...EXTRA_JOBS,
  job(
    "coach-0",
    "Academy coach",
    "Harbor Athletic academy",
    "office",
    0,
    700,
    "football-coaching",
    10,
  ),
  job(
    "basketball-1",
    "Development squad player",
    "Harbor Hoops",
    "basketball",
    1,
    300,
    null,
    45,
    52,
  ),
  job(
    "basketball-2",
    "Professional basketball player",
    "Harbor Hoops",
    "basketball",
    2,
    2400,
    null,
    65,
    104,
  ),
  job(
    "basketball-3",
    "National league player",
    "Metro Basketball",
    "basketball",
    3,
    14000,
    null,
    85,
    208,
  ),
  job(
    "basketball-4",
    "International basketball star",
    "Metro Basketball",
    "basketball",
    4,
    50000,
    null,
    95,
    312,
  ),
  job(
    "tennis-1",
    "Junior tour sponsorship",
    "Northline Tennis",
    "tennis",
    1,
    100,
    null,
    45,
    52,
  ),
  job(
    "tennis-2",
    "Professional tour sponsorship",
    "Northline Tennis",
    "tennis",
    2,
    450,
    null,
    65,
    104,
  ),
  job(
    "tennis-3",
    "International tour sponsorship",
    "Motion Sports",
    "tennis",
    3,
    3000,
    null,
    85,
    208,
  ),
  job(
    "tennis-4",
    "Elite tour sponsorship",
    "Motion Sports",
    "tennis",
    4,
    15000,
    null,
    95,
    312,
  ),
  job(
    "office-0",
    "Office assistant",
    "Cedar Logistics",
    "office",
    0,
    650,
    null,
    0,
  ),
  job(
    "support-0",
    "Customer support trainee",
    "Horizon Technologies",
    "office",
    0,
    580,
    "school",
    10,
  ),
  job(
    "office-1",
    "Project coordinator",
    "Cedar Logistics",
    "office",
    1,
    1050,
    "business-cert",
    35,
    52,
  ),
  job(
    "office-2",
    "Department manager",
    "Horizon Technologies",
    "office",
    2,
    2100,
    "business-degree",
    55,
    156,
  ),
  job(
    "office-3",
    "Operations director",
    "Cedar Logistics",
    "office",
    3,
    4500,
    "business-degree",
    75,
    416,
  ),
  job(
    "office-4",
    "Chief executive",
    "Solstice Energy",
    "office",
    4,
    11000,
    "business-degree",
    90,
    780,
  ),
  job(
    "football-0",
    "Amateur player",
    "Riverside FC reserves",
    "football",
    0,
    0,
    null,
    25,
  ),
  job(
    "football-1",
    "Development squad player",
    "Harbor Athletic",
    "football",
    1,
    450,
    "school",
    50,
    52,
  ),
  job(
    "football-2",
    "First-team player",
    "Riverside FC",
    "football",
    2,
    3500,
    null,
    70,
    156,
  ),
  job(
    "football-3",
    "Premier division player",
    "Harbor Athletic",
    "football",
    3,
    15000,
    null,
    85,
    312,
  ),
  job(
    "football-4",
    "International football star",
    "Harbor Athletic",
    "football",
    4,
    65000,
    null,
    95,
    468,
  ),
  job(
    "racing-0",
    "Karting instructor",
    "Apex Karting",
    "racing",
    0,
    550,
    "racing-license",
    30,
  ),
  job(
    "racing-1",
    "Formula 4 driver",
    "Apex Motorsport",
    "racing",
    1,
    350,
    "racing-license",
    50,
    52,
  ),
  job(
    "racing-2",
    "Formula 3 driver",
    "Apex Motorsport",
    "racing",
    2,
    2000,
    "international-license",
    65,
    104,
  ),
  job(
    "racing-3",
    "Formula 2 driver",
    "Meridian Racing",
    "racing",
    3,
    8000,
    "international-license",
    80,
    208,
  ),
  job(
    "racing-4",
    "Formula 1 driver",
    "Meridian Grand Prix",
    "racing",
    4,
    45000,
    "super-license",
    95,
    312,
  ),
  job(
    "investor-0",
    "Investment operations assistant",
    "Solstice Capital",
    "investor",
    0,
    750,
    "finance-cert",
    25,
  ),
  job(
    "investor-1",
    "Investment analyst",
    "Solstice Capital",
    "investor",
    1,
    1250,
    "finance-degree",
    45,
    52,
  ),
  job(
    "investor-2",
    "Portfolio manager",
    "Solstice Capital",
    "investor",
    2,
    2800,
    "finance-degree",
    70,
    260,
  ),
  job(
    "breakthrough",
    "Tour operations coordinator",
    "Atlas World Tour",
    "office",
    1,
    1800,
    null,
    15,
  ),
];
export const TRACK_SKILLS = {
  ...Object.fromEntries(
    Object.entries(EXTRA_CAREERS).map(([id, c]) => [id, c.skill]),
  ),
  basketball: "athletics",
  tennis: "athletics",
  music: "charisma",
  creator: "charisma",
  office: "business",
  football: "athletics",
  racing: "driving",
  investor: "finance",
  business: "business",
  unemployed: "business",
};
export const BUSINESSES = [
  {
    id: "football-team",
    name: "Riverside FC",
    kind: "Football club",
    icon: "football",
    color: "green",
    value: 750000,
    revenue: 7000,
    costs: 6800,
    employees: 25,
    sporting: true,
    racing: false,
    saleChance: 0.035,
  },
  {
    id: "harbor-fc",
    name: "Harbor Athletic",
    kind: "Football club",
    icon: "football",
    color: "blue",
    value: 18000000,
    revenue: 190000,
    costs: 195000,
    employees: 90,
    sporting: true,
    racing: false,
    saleChance: 0.025,
  },
  {
    id: "gt-team",
    name: "Apex Motorsport",
    kind: "GT racing team",
    icon: "flag",
    color: "purple",
    value: 2000000,
    revenue: 18000,
    costs: 17500,
    employees: 28,
    sporting: true,
    racing: true,
    saleChance: 0.03,
  },
  {
    id: "f1-team",
    name: "Meridian Grand Prix",
    kind: "Formula 1 team",
    icon: "flag",
    color: "orange",
    value: 250000000,
    revenue: 310000,
    costs: 325000,
    employees: 700,
    sporting: true,
    racing: true,
    saleChance: 0.015,
  },
  {
    id: "cafe",
    name: "Maple & Main Coffee",
    kind: "Private company",
    icon: "home",
    color: "yellow",
    value: 180000,
    revenue: 7000,
    costs: 6200,
    employees: 7,
    saleChance: 0.12,
  },
  {
    id: "studio",
    name: "Northstar Design Studio",
    kind: "Private company",
    icon: "briefcase",
    color: "purple",
    value: 950000,
    revenue: 26000,
    costs: 24000,
    employees: 14,
    saleChance: 0.1,
  },
  {
    id: "logistics",
    name: "Cedar Logistics",
    kind: "Private company",
    icon: "briefcase",
    color: "blue",
    value: 12000000,
    revenue: 290000,
    costs: 265000,
    employees: 210,
    saleChance: 0.055,
  },
  {
    id: "horizon",
    name: "Horizon Technologies",
    kind: "Listed company",
    icon: "chart",
    color: "blue",
    stock: "tech",
    shares: 100000000,
    revenue: 60000000,
    costs: 48000000,
    employees: 12000,
    saleChance: 0,
  },
  {
    id: "solstice",
    name: "Solstice Energy",
    kind: "Listed company",
    icon: "chart",
    color: "yellow",
    stock: "energy",
    shares: 50000000,
    revenue: 20000000,
    costs: 16500000,
    employees: 4800,
    saleChance: 0,
  },
];
export const COLLECTIBLES = [
  {
    id: "vintage-watch",
    name: "1960s mechanical chronograph",
    category: "Watches",
    value: 4500,
    volatility: 0.022,
    icon: "watch",
    color: "blue",
  },
  {
    id: "rookie-card",
    name: "Signed rookie football card",
    category: "Sports memorabilia",
    value: 850,
    volatility: 0.055,
    icon: "football",
    color: "green",
  },
  {
    id: "print",
    name: "Limited-edition artist’s print",
    category: "Art",
    value: 2400,
    volatility: 0.035,
    icon: "spark",
    color: "purple",
  },
  {
    id: "classic-car",
    name: "1980s homologation coupe",
    category: "Classic cars",
    value: 65000,
    volatility: 0.018,
    icon: "car",
    color: "orange",
  },
];
const clone = (s) => structuredClone(s);
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const round = (n) => Math.round(n * 100) / 100;
export function rng(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function log(s, text, kind = "info") {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
}
function writable(s) {
  if (s.globalLife?.crime.prison)
    throw new Error("This activity is unavailable in custody.");
  if (s.ended)
    throw new Error("This life is complete. Start a new life to keep playing.");
}
const asset = (id) => BUSINESSES.find((b) => b.id === id);
const program = (id) => PROGRAMS.find((p) => p.id === id);
export const jobDefinition = (id) => JOBS.find((j) => j.id === id);
export const qualificationName = (id) => program(id)?.name || id;
function hasQualification(s, id) {
  const degree = {
    "business-cert": "business-degree",
    "finance-cert": "finance-degree",
  }[id];
  return (
    s.education.completed.includes(id) ||
    (degree && s.education.completed.includes(degree))
  );
}
export const programmeTuition = (s, id) =>
  program(id).tuition *
  (1 - Math.max(storyTuitionSupport(s, id), schoolScholarshipRate(s)));
export const tuitionDue = (s) =>
  s.education?.active ? programmeTuition(s, s.education.active.programId) : 0;
export const reservedCash = (s) =>
  s.negotiations
    .filter((n) => ["submitted", "accepted"].includes(n.status))
    .reduce((sum, n) => sum + n.offer, 0) + orderCashReserved(s);
export const availableCash = (s) => s.money - reservedCash(s);
export const assetValue = (s, id) => {
  const b = asset(id);
  return b.stock ? s.market[b.stock] * b.shares : s.assetValues[id];
};
export const stakePercent = (s, id) => {
  const b = asset(id);
  return b.stock
    ? (s.holdings[b.stock] / b.shares) * 100
    : s.ownership[id]?.stake || 0;
};
export const privateOwnershipValue = (s) =>
  BUSINESSES.filter((b) => !b.stock).reduce(
    (v, b) => v + (assetValue(s, b.id) * stakePercent(s, b.id)) / 100,
    0,
  );
export const collectibleValue = (s) =>
  Object.keys(s.collectibles.owned).reduce(
    (v, id) => v + s.collectibles.prices[id] * 0.92,
    0,
  );
export const positionName = (s) =>
  s.startAge + Math.floor(s.week / 52) < 18 && !s.employment
    ? s.startAge + Math.floor(s.week / 52) < 1
      ? "Newborn"
      : s.startAge + Math.floor(s.week / 52) < 3
        ? "Toddler"
        : s.startAge + Math.floor(s.week / 52) < 5
          ? "Preschool child"
          : "School student"
    : s.employment
      ? jobDefinition(s.employment.jobId).title
      : s.company && s.career === "business"
        ? "Independent business owner"
        : "Looking for work";

function vacancies(s) {
  const regular = JOBS.filter(
    (j) =>
      !["breakthrough", "office-0", "support-0"].includes(j.id) &&
      !isSportingJob(j),
  );
  const selected = ["office-0", "support-0"];
  const pool = [...regular];
  for (let i = 0; i < 6 && pool.length; i++)
    selected.push(pool.splice(Math.floor(rng(s) * pool.length), 1)[0].id);
  s.vacancies = selected.map((jobId) => ({
    id: `${jobId}:${s.week}`,
    jobId,
    postedWeek: s.week,
    expiresWeek: s.week + 4,
    exceptional: false,
  }));
}
function collectibleLots(s) {
  s.collectibles.listings = COLLECTIBLES.filter(
    (c) => !s.collectibles.owned[c.id],
  )
    .filter(() => rng(s) < 0.6)
    .map((c) => ({
      id: `${c.id}:${s.week}`,
      collectibleId: c.id,
      price: Math.round(s.collectibles.prices[c.id] * (1.02 + rng(s) * 0.08)),
      expiresWeek: s.week + 8,
    }));
}
export function initializeWorld(
  s,
  {
    background = "school",
    legacy = false,
    legacyPay = 0,
    legacyLevel = 0,
  } = {},
) {
  s.aspiration = s.career === "unemployed" ? "office" : s.career;
  s.education = {
    completed:
      background === "business-degree"
        ? ["school", "business-degree"]
        : background === "school"
          ? ["school"]
          : [],
    active: null,
  };
  s.employment =
    legacy && ["office", "football", "racing", "investor"].includes(s.career)
      ? {
          jobId: `${s.career}-${legacyLevel}`,
          weeklyPay: legacyPay,
          startingPay: legacyPay,
          tenure: s.progress[s.career].weeks,
          performance: 65,
          nextRaiseWeek: s.week + 13,
          legacy: true,
        }
      : null;
  s.applications = [];
  s.vacancies = [];
  s.opportunities = [];
  s.negotiations = [];
  s.ownership = {};
  s.assetValues = Object.fromEntries(
    BUSINESSES.filter((b) => !b.stock).map((b) => [b.id, b.value]),
  );
  s.businessResults = Object.fromEntries(
    BUSINESSES.map((b) => [
      b.id,
      {
        profit: 0,
        cash: Math.round((b.value || s.market[b.stock] * b.shares) * 0.03),
        strategy: "balanced",
        periodProfit: 0,
      },
    ]),
  );
  s.collectibles = {
    prices: Object.fromEntries(COLLECTIBLES.map((c) => [c.id, c.value])),
    owned: {},
    listings: [],
    auctions: [],
  };
  for (const id of ["football-team", "f1-team"])
    if (legacy && s.inventory.includes(id)) {
      s.ownership[id] = {
        stake: 100,
        basis: asset(id).value,
        acquiredWeek: s.week,
      };
      s.inventory = s.inventory.filter((i) => i !== id);
    }
  if (!legacy) {
    s.career = "unemployed";
    s.company = null;
    s.teams = {};
  }
  if (s.company) {
    s.company.cash = Math.max(500, s.company.value * 0.1);
    s.company.revenue = Math.max(400, s.company.value / 150);
    s.company.costs = s.company.revenue * 0.88;
    s.company.profit = 0;
    s.company.periodProfit = 0;
  }
  vacancies(s);
  collectibleLots(s);
  if (legacy)
    log(
      s,
      "Save updated: your existing contract, company and club ownership are preserved. Future jobs require applications and qualifications.",
      "milestone",
    );
}
export const isSportingJob = (j) =>
  ["football", "basketball", "tennis"].includes(j.track) ||
  (j.track === "racing" && j.level >= 1);
function clearPlayingContracts(s) {
  for (const id of ["football", "racing", "basketball", "tennis"])
    releaseSportAgreement(s, id);
  if (s.football?.contract) {
    s.football.contract = null;
    s.football.stage = "community";
    s.football.club = "Local amateur club";
  }
  for (const p of Object.values(s.sports || {}))
    if (p.contract) {
      p.contract = null;
      p.stage = "local";
      p.club = "Local club";
    }
}
export function jobEligibility(s, vacancy) {
  const j = jobDefinition(vacancy.jobId),
    missing = [];
  if (!j) return { eligible: false, missing: ["Vacancy unavailable"] };
  const eraReason = historicalJobReason(s, j);
  if (eraReason) missing.push(eraReason);
  const locked = careerPathReason(s, j.track);
  if (locked) missing.push(locked);
  if (s.globalLife?.crime.prison) missing.push("release from custody");
  if (
    s.globalLife?.crime.record.some((r) => r.severity >= 3) &&
    ["finance", "investor", "medical", "law"].includes(j.track)
  )
    missing.push("a clean serious-conviction record for this regulated role");
  if (isSportingJob(j))
    missing.push("Sporting contracts come through development and scouting");
  if (s.startAge + Math.floor(s.week / 52) < 18)
    missing.push("Employment requires age 18+");
  if (vacancy.expiresWeek <= s.week) missing.push("Application window closed");
  if (j.qualification && !hasQualification(s, j.qualification))
    missing.push(qualificationName(j.qualification));
  const key = TRACK_SKILLS[j.track];
  if (s.skills[key] < j.skill) missing.push(`${j.skill} ${key} skill`);
  if (relevantWorkWeeks(s, j.track) < j.experience)
    missing.push(`${j.experience} weeks of relevant experience`);
  if (vacancy.exceptional && s.skills.charisma < 25)
    missing.push("25 charisma for this introduction");
  return { eligible: missing.length === 0, missing };
}
export function applyForJob(state, vacancyId) {
  writable(state);
  const v = state.vacancies.find((v) => v.id === vacancyId);
  if (!v) throw new Error("This vacancy is no longer available.");
  const eligible = jobEligibility(state, v);
  if (!eligible.eligible)
    throw new Error(`Missing requirements: ${eligible.missing.join(", ")}.`);
  if (state.employment?.jobId === v.jobId)
    throw new Error("You already hold this job.");
  if (state.applications.some((a) => a.vacancyId === vacancyId))
    throw new Error("You already applied for this vacancy.");
  if (!state.actions)
    throw new Error("No free-time actions left for an application this week.");
  const s = clone(state);
  spendTime(s, 3, "Workplace action");
  s.actions--;
  s.applications.push({
    id: `application:${v.id}`,
    vacancyId: v.id,
    jobId: v.jobId,
    status: "pending",
    appliedWeek: s.week,
    decisionWeek: s.week + (jobDefinition(v.jobId).interview ? 1 : 2),
    ...(jobDefinition(v.jobId).interview ? { interviewed: false } : {}),
    expiresWeek: s.week + 6,
    exceptional: v.exceptional,
  });
  s.applications = s.applications.slice(-24);
  log(
    s,
    `Applied to ${jobDefinition(v.jobId).employer} for ${jobDefinition(v.jobId).title.toLowerCase()}. ${jobDefinition(v.jobId).interview ? "An interview response is due next week." : "A decision is due in two weeks."}`,
  );
  return s;
}
export function acceptJobOffer(state, id) {
  writable(state);
  const a = state.applications.find((a) => a.id === id);
  if (!a || a.status !== "offer" || a.expiresWeek <= state.week)
    throw new Error("This job offer is no longer available.");
  assertCareerPath(state, jobDefinition(a.jobId).track);
  const s = clone(state),
    application = s.applications.find((a) => a.id === id),
    j = jobDefinition(a.jobId);
  if (isSportingJob(j))
    throw new Error(
      "Sporting contracts must come through development and scouting.",
    );
  clearPlayingContracts(s);
  s.employment = {
    jobId: j.id,
    weeklyPay: a.offeredPay,
    startingPay: a.offeredPay,
    tenure: 0,
    performance: 65,
    nextRaiseWeek: s.week + 13,
    legacy: false,
  };
  s.career = j.track;
  beginEmployment(s);
  s.progress[j.track].level = j.level;
  s.progress[j.track].unlocked = true;
  application.status = "accepted";
  for (const other of s.applications)
    if (other.status === "offer" && other.id !== id) other.status = "declined";
  log(
    s,
    `Accepted ${j.title.toLowerCase()} at ${j.employer}: $${a.offeredPay}/week. Your previous contract ends.`,
    "milestone",
  );
  return s;
}
export function resignJob(state) {
  writable(state);
  if (!state.employment)
    throw new Error("You do not have an employment contract.");
  const s = clone(state);
  log(
    s,
    `Resigned from ${jobDefinition(s.employment.jobId).employer}. Your pay stops immediately.`,
    "warning",
  );
  clearPlayingContracts(s);
  s.employment = null;
  s.career =
    s.company && !s.profession?.company.delegated ? "business" : "unemployed";
  return s;
}
export function requestRaise(state) {
  writable(state);
  if (!state.employment)
    throw new Error("You need an employment contract to request a raise.");
  if (isSportingJob(jobDefinition(state.employment.jobId)))
    throw new Error(
      "Sporting pay is agreed through club or sponsor contract offers.",
    );
  if (state.week < state.employment.nextRaiseWeek)
    throw new Error(
      `Your next salary discussion is available in ${state.employment.nextRaiseWeek - state.week} weeks.`,
    );
  if (!state.actions)
    throw new Error("No free-time actions left for a salary discussion.");
  const s = clone(state),
    p = s.employment,
    j = jobDefinition(p.jobId);
  spendTime(s, 3, "Workplace action");
  s.actions--;
  p.nextRaiseWeek = s.week + 26;
  const ceiling = Math.max(j.maxPay, p.startingPay * 1.35);
  if (
    p.performance >= 70 &&
    p.weeklyPay < ceiling &&
    rng(s) <
      Math.min(
        0.85,
        0.35 + (p.performance - 65) * 0.015 + s.skills.charisma * 0.002,
      )
  ) {
    const old = p.weeklyPay;
    p.weeklyPay = Math.min(ceiling, Math.round(old * (1.03 + rng(s) * 0.04)));
    log(
      s,
      `Raise approved: $${old} → $${p.weeklyPay}/week in the same role.`,
      "milestone",
    );
  } else
    log(
      s,
      "Your raise request was declined. Improve sustained performance and revisit it in 26 weeks.",
      "warning",
    );
  return s;
}
export function enrolEducation(state, id) {
  writable(state);
  const subjectReason = subjectAdmissionReason(state, id);
  if (subjectReason) throw new Error(subjectReason);
  if (state.startAge + Math.floor(state.week / 52) < 12)
    throw new Error(
      "Your family handles preschool and primary school. Independent courses start from age twelve.",
    );
  const p = program(id);
  if (!p) throw new Error("Choose an available programme.");
  if (state.education.active)
    throw new Error("Finish or withdraw from your current programme first.");
  if (state.education.completed.includes(id))
    throw new Error("You already hold this qualification.");
  if (p.requires && !state.education.completed.includes(p.requires))
    throw new Error(`You need ${qualificationName(p.requires)} first.`);
  if (p.minAge && state.startAge + Math.floor(state.week / 52) < p.minAge)
    throw new Error(`This programme requires age ${p.minAge}+. `);
  if (p.minimumSkill && state.skills[p.skill] < p.minimumSkill)
    throw new Error(
      `This programme requires ${p.minimumSkill} ${p.skill} skill.`,
    );
  if (p.experience && state.progress[p.track].weeks < p.experience)
    throw new Error(
      `This programme requires ${p.experience} weeks of ${p.track} experience.`,
    );
  if (availableCash(state) < programmeTuition(state, id))
    throw new Error(
      "You need enough available cash for the first tuition payment.",
    );
  const s = clone(state);
  s.education.active = { programId: id, progress: 0, spent: 0, paused: false };
  log(
    s,
    `Enrolled in ${p.name}. Tuition: $${p.tuition}/week; ${p.weeks} full-time study weeks.`,
    "milestone",
  );
  return s;
}
export function withdrawEducation(state) {
  writable(state);
  if (!state.education.active) throw new Error("You are not enrolled.");
  const s = clone(state);
  log(
    s,
    `Withdrew from ${qualificationName(s.education.active.programId)}. Tuition already paid is not refunded.`,
    "warning",
  );
  s.education.active = null;
  return s;
}
export function foundCompany(
  state,
  { name, sector, model = "service", price = "standard" },
) {
  assertCareerPath(state, "business");
  writable(state);
  if (state.startAge + Math.floor(state.week / 52) < 18)
    throw new Error("Founding a company independently requires age 18+.");
  if (state.company) throw new Error("You already have a founded company.");
  if (state.skills.business < 30)
    throw new Error("Develop 30 business skill before launching a company.");
  const definition = industry(sector);
  if (!definition) throw new Error("Choose a supported industry.");
  if (
    ![
      "service",
      "retail",
      "subscription",
      "manufacturing",
      "licensing",
    ].includes(model) ||
    !["budget", "standard", "premium"].includes(price)
  )
    throw new Error("Choose a business model and price policy.");
  if (availableCash(state) < definition.capital)
    throw new Error(
      `You need $${definition.capital.toLocaleString()} startup capital.`,
    );
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 40 ||
    !industry(sector)
  )
    throw new Error("Choose a company name and supported industry.");
  const s = clone(state);
  s.money -= definition.capital;
  s.company = {
    name: name.trim(),
    sector,
    strategy: "balanced",
    value: definition.capital,
    employees: 1,
    cash: definition.capital,
    revenue: definition.revenue,
    costs: definition.costs,
    profit: definition.revenue - definition.costs,
    periodProfit: 0,
  };
  if (s.globalLife)
    s.globalLife.companyPlan = {
      model,
      price,
      quality: 50,
      customers: 10,
      research: 0,
      lastAction: null,
    };
  if (!s.employment) s.career = "business";
  log(
    s,
    `Founded ${s.company.name} with $${definition.capital.toLocaleString()} startup capital. Earnings now depend on trading profit.`,
    "milestone",
  );
  return s;
}
export function meetingFee(s, id) {
  return Math.max(1000, Math.round(assetValue(s, id) * 0.004));
}
export function requestBoardMeeting(state, id) {
  writable(state);
  if (!asset(id)) throw new Error("This business is unavailable.");
  if (stakePercent(state, id) >= 100)
    throw new Error("You already own this business.");
  if (
    state.negotiations.some(
      (n) => n.targetId === id && state.week < n.requestedWeek + 26,
    )
  )
    throw new Error(
      "The owners will not meet again within 26 weeks of your last approach.",
    );
  const fee = meetingFee(state, id);
  if (availableCash(state) < fee)
    throw new Error(
      "Not enough available cash for the non-refundable meeting fee.",
    );
  const s = clone(state);
  s.money -= fee;
  s.negotiations.push({
    id: `meeting:${id}:${s.week}`,
    targetId: id,
    status: "meeting",
    requestedWeek: s.week,
    decisionWeek: s.week + 2,
    expiresWeek: s.week + 8,
    fee,
  });
  s.negotiations = s.negotiations.slice(-24);
  log(
    s,
    `Paid $${fee.toLocaleString("en-US")} to approach ${asset(id).name}. The owners will respond in two weeks; a meeting is not guaranteed.`,
  );
  return s;
}
export function submitAcquisitionOffer(state, id, amount, stake) {
  writable(state);
  const n = state.negotiations.find((n) => n.id === id);
  if (!n || n.status !== "open" || n.expiresWeek <= state.week)
    throw new Error("There is no open negotiation.");
  const b = asset(n.targetId),
    allowed = b.stock
      ? [5, 10, 25]
      : [25, 51, 100, 100 - stakePercent(state, b.id)];
  if (!allowed.includes(stake) || stakePercent(state, b.id) + stake > 100)
    throw new Error(
      "Choose an available stake that does not exceed full ownership.",
    );
  if (!Number.isFinite(amount) || amount < 1 || round(amount) !== amount)
    throw new Error("Enter an offer of at least $1, to the nearest cent.");
  if (availableCash(state) < amount)
    throw new Error("Not enough uncommitted cash to fund this offer.");
  const s = clone(state),
    bid = s.negotiations.find((n) => n.id === id);
  bid.status = "submitted";
  bid.offer = amount;
  bid.stake = stake;
  bid.decisionWeek = s.week + 2;
  bid.expiresWeek = s.week + 6;
  log(
    s,
    `Submitted a $${amount.toLocaleString("en-US")} offer for ${stake}% of ${b.name}. Cash is reserved until the bid is resolved.`,
  );
  return s;
}
function transferStake(s, id, stake, price) {
  const b = asset(id);
  s.money -= price;
  if (b.stock) {
    const units = Math.round((b.shares * stake) / 100);
    recordTrade(s, b.stock, units, price, s.holdings[b.stock]);
    s.holdings[b.stock] += units;
  } else {
    const old = s.ownership[id];
    s.ownership[id] = {
      stake: (old?.stake || 0) + stake,
      basis: (old?.basis || 0) + price,
      acquiredWeek: s.week,
    };
  }
  if (b.sporting && stakePercent(s, id) > 50 && !s.teams[id])
    s.teams[id] = { rating: 40, wins: 0, races: 0, profit: 0 };
  log(
    s,
    `Acquired ${stake}% of ${b.name} for $${price.toLocaleString("en-US")}.`,
    "milestone",
  );
}
export function completeAcquisition(state, id) {
  writable(state);
  const n = state.negotiations.find((n) => n.id === id);
  if (!n || n.status !== "accepted" || n.expiresWeek <= state.week)
    throw new Error("This acquisition offer cannot be completed.");
  if (availableCash(state) + n.offer < n.offer)
    throw new Error(
      "Your cash no longer covers this offer and other commitments.",
    );
  if (stakePercent(state, n.targetId) + n.stake > 100)
    throw new Error(
      "Your existing stake now conflicts with this offer. Withdraw it and request a smaller stake.",
    );
  const s = clone(state);
  transferStake(s, n.targetId, n.stake, n.offer);
  s.negotiations.find((n) => n.id === id).status = "completed";
  return s;
}
export function cancelOffer(state, id) {
  writable(state);
  const s = clone(state),
    n = s.negotiations.find((n) => n.id === id);
  if (!n || !["meeting", "open", "submitted", "accepted"].includes(n.status))
    throw new Error("No active approach to cancel.");
  n.status = "withdrawn";
  log(
    s,
    "Withdrew an acquisition approach. Reserved cash is released; meeting fees are not refunded.",
  );
  return s;
}
export function acquireOpportunity(state, id) {
  writable(state);
  const o = state.opportunities.find((o) => o.id === id);
  if (!o || o.expiresWeek <= state.week)
    throw new Error("This sale opportunity has closed.");
  if (stakePercent(state, o.targetId) + o.stake > 100)
    throw new Error("This stake conflicts with your existing ownership.");
  if (availableCash(state) < o.askingPrice)
    throw new Error("Not enough available cash to acquire this stake.");
  const s = clone(state);
  transferStake(s, o.targetId, o.stake, o.askingPrice);
  s.opportunities = s.opportunities.filter((p) => p.id !== id);
  return s;
}
export function setBusinessStrategy(state, id, strategy) {
  writable(state);
  if (!asset(id) || stakePercent(state, id) <= 50)
    throw new Error(
      "A controlling stake above 50% is required to set strategy.",
    );
  if (!["balanced", "development", "commercial"].includes(strategy))
    throw new Error("Choose an available strategy.");
  const s = clone(state);
  s.businessResults[id].strategy = strategy;
  return s;
}
export function injectCapital(state, id, amount) {
  writable(state);
  if (!asset(id) || asset(id).stock || stakePercent(state, id) <= 50)
    throw new Error("You must control a private business to fund it.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > availableCash(state))
    throw new Error("Choose an affordable positive capital injection.");
  const s = clone(state);
  s.money -= amount;
  s.businessResults[id].cash += amount;
  s.assetValues[id] += amount;
  log(s, `Injected $${amount.toLocaleString("en-US")} into ${asset(id).name}.`);
  return s;
}
export function buyCollectible(state, id) {
  writable(state);
  const lot = state.collectibles.listings.find((l) => l.id === id);
  if (!lot || lot.expiresWeek <= state.week)
    throw new Error("This collectible listing has expired.");
  if (state.collectibles.owned[lot.collectibleId])
    throw new Error("You already own this collectible.");
  if (availableCash(state) < lot.price)
    throw new Error("Not enough available cash for this collectible.");
  const s = clone(state);
  s.money -= lot.price;
  s.collectibles.owned[lot.collectibleId] = {
    basis: lot.price,
    acquiredWeek: s.week,
  };
  s.collectibles.listings = s.collectibles.listings.filter((l) => l.id !== id);
  log(
    s,
    `Purchased ${COLLECTIBLES.find((c) => c.id === lot.collectibleId).name.toLowerCase()}.`,
    "milestone",
  );
  return s;
}
export function consignCollectible(state, id, reserve) {
  writable(state);
  if (!state.collectibles.owned[id])
    throw new Error("You do not own this collectible.");
  if (
    state.collectibles.auctions.some(
      (a) => a.collectibleId === id && a.status === "pending",
    )
  )
    throw new Error("This collectible is already at auction.");
  if (!Number.isFinite(reserve) || reserve < 1 || round(reserve) !== reserve)
    throw new Error("Enter a reserve of at least $1, to the nearest cent.");
  const s = clone(state);
  s.collectibles.auctions.push({
    id: `auction:${id}:${s.week}`,
    collectibleId: id,
    reserve: round(reserve),
    decisionWeek: s.week + 2,
    status: "pending",
  });
  s.collectibles.auctions = s.collectibles.auctions.slice(-12);
  log(
    s,
    "Consigned a collectible to auction. Results arrive in two weeks; an 8% commission applies only if sold.",
  );
  return s;
}
function employmentTick(s) {
  if (s.employment && !onParentalLeave(s)) {
    const p = s.employment,
      j = jobDefinition(p.jobId),
      skill = s.skills[TRACK_SKILLS[j.track]];
    const effort = s.activity === "focus" ? 8 : s.activity === "rest" ? -12 : 3;
    const score = clamp(
      40 +
        skill * 0.25 +
        s.energy * 0.25 +
        effort +
        personalityModifier(s, "work") +
        (rng(s) * 2 - 1) * 8,
    );
    p.performance = Math.round(p.performance * 0.8 + score * 0.2);
    p.tenure++;
    if (!isSportingJob(j) && p.tenure % 52 === 0 && p.performance >= 78) {
      const old = p.weeklyPay;
      p.weeklyPay = Math.min(
        Math.max(j.maxPay, p.startingPay * 1.35),
        Math.round(p.weeklyPay * 1.03),
      );
      if (p.weeklyPay > old)
        log(
          s,
          `Annual merit review: pay increased to $${p.weeklyPay}/week without changing your job.`,
          "milestone",
        );
    }
  }
  for (const a of s.applications) {
    if (a.status === "interview" && a.expiresWeek <= s.week) {
      a.status = "rejected";
      log(s, "The interview invitation expired without a response.");
      continue;
    }
    if (a.status === "pending" && a.decisionWeek <= s.week) {
      if (jobDefinition(a.jobId).interview && a.interviewed === false) {
        a.status = "interview";
        a.expiresWeek = s.week + 3;
        log(
          s,
          `Interview invitation: ${jobDefinition(a.jobId).title}. Respond within three weeks.`,
          "milestone",
        );
        continue;
      }
      const j = jobDefinition(a.jobId),
        surplus = s.skills[TRACK_SKILLS[j.track]] - j.skill;
      const chance = Math.min(
        0.9,
        (a.exceptional
          ? 0.35
          : a.interviewed
            ? 0.25 + a.interviewScore * 0.005
            : 0.58) +
          surplus * 0.004 +
          s.skills.charisma * 0.002,
      );
      if (rng(s) < Math.max(0.05, chance - publicHiringPenalty(s))) {
        a.status = "offer";
        a.offeredPay = Math.round(
          j.pay *
            (1 + rng(s) * 0.06) *
            (s.realWorld ? localProfile(s).wage : 1) * eraIndex(s),
        );
        a.expiresWeek = s.week + 4;
        log(
          s,
          `Job offer: ${j.title} at ${j.employer}. Accept within four weeks.`,
          "milestone",
        );
      } else {
        a.status = "rejected";
        log(
          s,
          `${j.employer} chose another applicant for ${j.title.toLowerCase()}.`,
          "warning",
        );
      }
    } else if (a.status === "offer" && a.expiresWeek <= s.week)
      a.status = "expired";
  }
  if (s.week % 4 === 0) vacancies(s);
  else s.vacancies = s.vacancies.filter((v) => v.expiresWeek > s.week);
  if (
    s.skills.charisma >= 25 &&
    s.relationships.some((r) => r.bond >= 80) &&
    rng(s) < 0.02 &&
    !s.vacancies.some((v) => v.exceptional)
  ) {
    s.vacancies.push({
      id: `breakthrough:${s.week}`,
      jobId: "breakthrough",
      postedWeek: s.week,
      expiresWeek: s.week + 3,
      exceptional: true,
    });
    log(
      s,
      "A contact introduced you to Atlas World Tour: their coordinator resigned unexpectedly. An unusual vacancy is open for three weeks.",
      "milestone",
    );
  }
}
function educationTick(s) {
  const e = s.education.active;
  if (!e) return 0;
  const p = program(e.programId);
  const due = programmeTuition(s, p.id);
  if (availableCash(s) < due) {
    e.paused = true;
    log(
      s,
      "Tuition could not be paid. Studies paused this week; your progress is retained.",
      "warning",
    );
    return 0;
  }
  s.money -= due;
  e.spent += due;
  consumeScholarship(s, schoolScholarshipRate(s) > 0 ? p.tuition * 0.5 : 0);
  e.paused = false;
  e.progress += allocationRatio(s, "study", 16);
  s.energy = clamp(s.energy - 3);
  if (e.progress >= p.weeks) {
    s.education.completed.push(p.id);
    s.skills[p.skill] = clamp(s.skills[p.skill] + p.gain);
    s.education.active = null;
    log(
      s,
      `Graduated: ${p.name}. The qualification now counts in job applications.`,
      "milestone",
    );
  }
  return due;
}
function acquisitionTick(s) {
  s.opportunities = s.opportunities.filter(
    (o) => o.expiresWeek > s.week && stakePercent(s, o.targetId) < 100,
  );
  if (s.week % 13 === 0)
    for (const b of BUSINESSES.filter((b) => !b.stock))
      if (
        !s.opportunities.some((o) => o.targetId === b.id) &&
        stakePercent(s, b.id) < 100 &&
        rng(s) < b.saleChance
      ) {
        const remaining = 100 - stakePercent(s, b.id),
          stake = b.sporting
            ? remaining
            : Math.min(remaining, rng(s) < 0.5 ? 25 : 100);
        s.opportunities.push({
          id: `sale:${b.id}:${s.week}`,
          targetId: b.id,
          stake,
          askingPrice: Math.round(
            ((assetValue(s, b.id) * stake) / 100) * (1.02 + rng(s) * 0.1),
          ),
          expiresWeek: s.week + 6,
        });
        log(
          s,
          `${b.name} owners have listed a ${stake}% stake. The sale window closes in six weeks.`,
          "milestone",
        );
      }
  for (const n of s.negotiations) {
    if (
      ["open", "submitted", "accepted", "meeting"].includes(n.status) &&
      n.expiresWeek <= s.week
    ) {
      n.status = "expired";
      continue;
    }
    if (n.status === "meeting" && n.decisionWeek <= s.week) {
      const chance = Math.min(
        0.75,
        0.22 +
          s.skills.charisma * 0.003 +
          (stakePercent(s, n.targetId) >= 5 ? 0.15 : 0),
      );
      if (rng(s) < chance) {
        n.status = "open";
        n.minimumPremium = 1.15 + rng(s) * 0.25;
        n.expiresWeek = s.week + 6;
        log(
          s,
          `${asset(n.targetId).name} owners agreed to hear an offer. They expect a premium above current valuation.`,
          "milestone",
        );
      } else {
        n.status = "refused";
        log(
          s,
          `${asset(n.targetId).name} owners declined your approach. The meeting fee is not refundable.`,
          "warning",
        );
      }
    } else if (n.status === "submitted" && n.decisionWeek <= s.week) {
      const minimum =
        ((assetValue(s, n.targetId) * n.stake) / 100) * n.minimumPremium;
      n.status = n.offer >= minimum ? "accepted" : "rejected";
      if (n.status === "accepted") n.expiresWeek = s.week + 3;
      log(
        s,
        n.status === "accepted"
          ? `${asset(n.targetId).name} accepted your bid. Complete the acquisition within three weeks.`
          : `${asset(n.targetId).name} rejected your bid as too low. Reserved cash is released.`,
        n.status === "accepted" ? "milestone" : "warning",
      );
    }
  }
}
function businessesTick(s) {
  for (const b of BUSINESSES) {
    const r = s.businessResults[b.id],
      t = s.teams[b.id],
      strategy = r.strategy;
    let revenue =
        b.revenue *
        (0.85 + rng(s) * 0.3) *
        (strategy === "commercial" ? 1.08 : 1),
      costs =
        b.costs *
        (strategy === "development"
          ? 1.12
          : strategy === "commercial"
            ? 1.02
            : 1);
    if (b.sporting) {
      if (t) {
        t.rating = clamp(
          t.rating +
            (strategy === "development" ? 0.2 : 0.05) +
            (rng(s) * 2 - 1) * 0.4 -
            (r.cash < 0 ? 1 : 0),
          0,
          95,
        );
        const season = s.week % 52 < 40;
        if (season && (!b.racing || s.week % 2 === 0)) {
          const legacyWin = rng(s) < t.rating / 130;
          if (!s.ownershipPlay) {
            t.races++;
            if (legacyWin) {
              t.wins++;
              revenue *= 1.1;
            }
          }
        }
      }
      if (s.week % 52 >= 40) revenue *= 0.7;
    }
    ({ revenue, costs } = ownerOperatingAdjustment(s, b.id, revenue, costs));
    r.profit = Math.round(revenue - costs);
    r.cash += r.profit;
    r.periodProfit += r.profit;
    if (t) t.profit = r.profit;
    if (!b.stock)
      s.assetValues[b.id] = Math.max(
        b.value * 0.1,
        Math.round(
          s.assetValues[b.id] *
            (1 + (rng(s) * 2 - 1) * 0.008 + (r.cash < 0 ? -0.008 : 0)),
        ),
      );
    if (s.week % 13 === 0) {
      const distribution = Math.min(
        Math.max(0, r.periodProfit * 0.3),
        Math.max(0, r.cash),
      );
      const dividend = round((distribution * stakePercent(s, b.id)) / 100);
      r.cash -= distribution;
      receiveIncome(s, dividend, "investment");
      r.periodProfit = 0;
      if (dividend > 0)
        log(
          s,
          `${b.name} paid you a quarterly dividend of $${dividend.toLocaleString("en-US")}.`,
          "positive",
        );
      if (b.stock && distribution > 0)
        s.market[b.stock] = Math.max(
          1,
          round(s.market[b.stock] - distribution / b.shares),
        );
    }
  }
  if (s.company) {
    const c = s.company,
      key = s.skills.business,
      active = s.career === "business";
    const volatility = industry(c.sector)?.volatility || 0.01;
    const growth =
      0.0005 +
      (s.profession?.company.delegated &&
      !s.ownershipPlay.management.founder?.staff.some(
        (p) => p.role === "coach" && p.expiresWeek > s.week,
      )
        ? -0.005
        : 0) +
      (s.globalLife?.companyPlan?.research || 0) * 0.00001 +
      ((s.globalLife?.companyPlan?.quality || 50) - 50) * 0.000005 +
      (s.globalLife?.companyPlan?.model === "subscription" ? 0.0002 : 0) +
      (s.globalLife?.companyPlan?.price === "premium"
        ? s.globalLife.companyPlan.quality >= 65
          ? 0.0003
          : -0.0005
        : s.globalLife?.companyPlan?.price === "budget"
          ? 0.0001
          : 0) +
      key * 0.000025 +
      (active && s.activity === "focus" ? 0.003 : 0) +
      (c.strategy === "reinvest"
        ? 0.0015
        : c.strategy === "dividends"
          ? -0.001
          : 0) +
      (rng(s) * 2 - 1) * volatility;
    c.revenue = Math.max(50, round(c.revenue * (1 + growth)));
    c.costs = round(c.costs * (1 + 0.0003 + (rng(s) * 2 - 1) * 0.008));
    const operations = ownerOperatingAdjustment(
      s,
      "founder",
      c.revenue,
      c.costs,
    );
    const product = productTrading(s);
    c.profit = round(
      operations.revenue + product.revenue - operations.costs - product.costs,
    );
    c.cash += c.profit;
    c.periodProfit += c.profit;
    c.value = Math.max(
      500,
      Math.min(
        1e12,
        Math.round(c.value * (1 + growth - (c.cash < 0 ? 0.01 : 0))),
      ),
    );
    c.employees = Math.max(1, Math.min(100000, Math.floor(c.revenue / 1500)));
    if (s.week % 13 === 0) {
      const share =
        c.strategy === "reinvest" ? 0 : c.strategy === "dividends" ? 0.5 : 0.25;
      const payout = active
        ? 0
        : round(
            Math.min(Math.max(0, c.periodProfit * share), Math.max(0, c.cash)),
          );
      c.cash -= payout;
      receiveIncome(s, round(payout), "investment");
      c.periodProfit = 0;
      if (payout)
        log(
          s,
          `${c.name} paid a $${payout.toFixed(2)} side-business dividend.`,
          "positive",
        );
    }
  }
}
function collectiblesTick(s) {
  for (const c of COLLECTIBLES)
    s.collectibles.prices[c.id] = Math.max(
      50,
      Math.round(
        s.collectibles.prices[c.id] * (1 + (rng(s) * 2 - 1) * c.volatility),
      ),
    );
  s.collectibles.listings = s.collectibles.listings.filter(
    (l) => l.expiresWeek > s.week,
  );
  if (s.week % 8 === 0) collectibleLots(s);
  for (const a of s.collectibles.auctions)
    if (a.status === "pending" && a.decisionWeek <= s.week) {
      const bid = Math.round(
        s.collectibles.prices[a.collectibleId] * (0.85 + rng(s) * 0.2),
      );
      if (
        s.collectibles.owned[a.collectibleId] &&
        bid >= a.reserve &&
        rng(s) < 0.7
      ) {
        a.status = "sold";
        a.proceeds = round(bid * 0.92);
        s.money += a.proceeds;
        recordCapitalGain(
          s,
          a.proceeds - s.collectibles.owned[a.collectibleId].basis,
        );
        delete s.collectibles.owned[a.collectibleId];
        log(
          s,
          `Collectible sold at auction: $${a.proceeds.toLocaleString("en-US")} after the 8% fee.`,
          "positive",
        );
      } else {
        a.status = "unsold";
        log(
          s,
          "Your collectible did not sell at auction. It remains yours; you can try again later.",
          "warning",
        );
      }
    }
}
export function advanceWorld(s) {
  const tuition = educationTick(s);
  employmentTick(s);
  businessesTick(s);
  acquisitionTick(s);
  collectiblesTick(s);
  return tuition;
}

export function validateWorld(s) {
  const n = (v, min = -Infinity, max = Infinity) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const integer = (v, min = 0, max = Infinity) =>
    n(v, min, max) && Number.isInteger(v);
  const list = (v, max) => Array.isArray(v) && v.length <= max;
  const fail = () => {
    throw new Error(
      "Invalid employment, education, or ownership data in save.",
    );
  };
  if (
    !Object.hasOwn(TRACK_SKILLS, s.aspiration) ||
    !s.education ||
    !list(s.education.completed, PROGRAMS.length) ||
    new Set(s.education.completed).size !== s.education.completed.length ||
    s.education.completed.some((id) => !program(id))
  )
    fail();
  if (s.education.active) {
    const e = s.education.active,
      p = program(e.programId);
    if (
      !p ||
      !n(e.progress, 0, p.weeks) ||
      !n(e.spent, 0) ||
      typeof e.paused !== "boolean" ||
      s.education.completed.includes(p.id) ||
      (p.requires && !s.education.completed.includes(p.requires))
    )
      fail();
  }
  if (s.employment) {
    const p = s.employment,
      j = jobDefinition(p.jobId);
    if (
      !j ||
      j.track !== s.career ||
      !n(p.weeklyPay, 0) ||
      !n(p.startingPay, 0) ||
      !integer(p.tenure) ||
      (p.weeklyHours !== undefined && !integer(p.weeklyHours, 1, 80)) ||
      !n(p.performance, 0, 100) ||
      !integer(p.nextRaiseWeek) ||
      typeof p.legacy !== "boolean"
    )
      fail();
  } else if (!["unemployed", "business"].includes(s.career)) fail();
  if (s.career === "business" && !s.company) fail();
  if (
    s.company &&
    ["cash", "revenue", "costs", "profit", "periodProfit"].some(
      (k) => !n(s.company[k], ["revenue", "costs"].includes(k) ? 0 : -Infinity),
    )
  )
    fail();
  if (
    !list(s.vacancies, 12) ||
    s.vacancies.some(
      (v) =>
        typeof v.id !== "string" ||
        !jobDefinition(v.jobId) ||
        !integer(v.postedWeek) ||
        !integer(v.expiresWeek) ||
        typeof v.exceptional !== "boolean" ||
        (v.exceptional && v.jobId !== "breakthrough"),
    )
  )
    fail();
  if (
    !list(s.applications, 24) ||
    s.applications.some(
      (a) =>
        typeof a.id !== "string" ||
        typeof a.vacancyId !== "string" ||
        !jobDefinition(a.jobId) ||
        ![
          "pending",
          "interview",
          "offer",
          "accepted",
          "rejected",
          "declined",
          "expired",
        ].includes(a.status) ||
        !integer(a.appliedWeek) ||
        !integer(a.decisionWeek) ||
        !integer(a.expiresWeek) ||
        typeof a.exceptional !== "boolean" ||
        (["offer", "accepted", "declined", "expired"].includes(a.status) &&
          !n(a.offeredPay, 0)),
    )
  )
    fail();
  if (
    !s.ownership ||
    Array.isArray(s.ownership) ||
    Object.entries(s.ownership).some(
      ([id, o]) =>
        !asset(id) ||
        asset(id).stock ||
        !n(o.stake, 1, 100) ||
        !n(o.basis, 0) ||
        !integer(o.acquiredWeek),
    )
  )
    fail();
  if (!s.assetValues || !s.businessResults) fail();
  for (const b of BUSINESSES) {
    const r = s.businessResults[b.id];
    if (
      (!b.stock && !n(s.assetValues[b.id], 1)) ||
      !r ||
      !n(r.cash) ||
      !n(r.profit) ||
      !n(r.periodProfit) ||
      !["balanced", "development", "commercial"].includes(r.strategy)
    )
      fail();
    if (b.stock && !integer(s.holdings[b.stock], 0, b.shares)) fail();
  }
  if (
    !list(s.opportunities, 9) ||
    s.opportunities.some(
      (o) =>
        typeof o.id !== "string" ||
        !asset(o.targetId) ||
        asset(o.targetId).stock ||
        !n(o.stake, 1, 100) ||
        !n(o.askingPrice, 1) ||
        !integer(o.expiresWeek),
    )
  )
    fail();
  if (
    !list(s.negotiations, 24) ||
    s.negotiations.some(
      (o) =>
        typeof o.id !== "string" ||
        !asset(o.targetId) ||
        ![
          "meeting",
          "open",
          "submitted",
          "accepted",
          "refused",
          "rejected",
          "expired",
          "completed",
          "withdrawn",
        ].includes(o.status) ||
        !integer(o.requestedWeek) ||
        !integer(o.decisionWeek) ||
        !integer(o.expiresWeek) ||
        !n(o.fee, 0) ||
        (["submitted", "accepted", "completed", "rejected"].includes(
          o.status,
        ) &&
          (!n(o.offer, 1) || !n(o.stake, 1, 100))) ||
        (["open", "submitted", "accepted", "completed", "rejected"].includes(
          o.status,
        ) &&
          !n(o.minimumPremium, 1, 2)),
    )
  )
    fail();
  for (const [id, t] of Object.entries(s.teams))
    if (
      !asset(id)?.sporting ||
      stakePercent(s, id) <= 50 ||
      !n(t.rating, 0, 100) ||
      !integer(t.wins) ||
      !integer(t.races) ||
      !n(t.profit)
    )
      fail();
  const c = s.collectibles;
  if (
    !c ||
    !c.prices ||
    !c.owned ||
    !list(c.listings, 4) ||
    !list(c.auctions, 12)
  )
    fail();
  for (const item of COLLECTIBLES) if (!n(c.prices[item.id], 1)) fail();
  const known = (id) => COLLECTIBLES.some((c) => c.id === id);
  if (
    Object.entries(c.owned).some(
      ([id, o]) => !known(id) || !n(o.basis, 0) || !integer(o.acquiredWeek),
    ) ||
    c.listings.some(
      (l) =>
        typeof l.id !== "string" ||
        !known(l.collectibleId) ||
        !n(l.price, 1) ||
        !integer(l.expiresWeek),
    ) ||
    c.auctions.some(
      (a) =>
        typeof a.id !== "string" ||
        !known(a.collectibleId) ||
        !n(a.reserve, 1) ||
        !integer(a.decisionWeek) ||
        !["pending", "sold", "unsold"].includes(a.status) ||
        (a.status === "pending" && !c.owned[a.collectibleId]) ||
        (a.status === "sold" && !n(a.proceeds, 0)),
    )
  )
    fail();
}
