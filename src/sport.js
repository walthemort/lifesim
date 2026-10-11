import {
  syncSeason,
  enhanceSportOffer,
  checkSportSigning,
  signedSportTerms,
  markSportTraining,
} from "./seasons.js";
import { allocationRatio, spendTime } from "./calendar.js";
import { rng, availableCash, jobDefinition } from "./world.js";
export const SPORTS = [
  {
    id: "racing",
    name: "Motorsport",
    start: "Local karting club",
    academy: "Apex driver development",
    skill: "driving",
    icon: "flag",
    entryFee: 10,
  },
  {
    id: "basketball",
    name: "Basketball",
    start: "School / local basketball",
    academy: "Harbor Hoops academy",
    skill: "athletics",
    icon: "trophy",
    entryFee: 5,
  },
  {
    id: "tennis",
    name: "Tennis",
    start: "Local tennis club",
    academy: "Northline tennis academy",
    skill: "athletics",
    icon: "trophy",
    entryFee: 8,
  },
];
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
const writable = (s) => {
  if (s.ended) throw new Error("This life is complete.");
};
export function initializeSports(s, { legacy = false } = {}) {
  s.sports = Object.fromEntries(
    SPORTS.map((d) => {
      const player =
        legacy &&
        s.employment &&
        jobDefinition(s.employment.jobId)?.track === d.id &&
        jobDefinition(s.employment.jobId).level >= 1;
      const participating = s.aspiration === d.id || player;
      return [
        d.id,
        {
          stage: player ? "professional" : participating ? "local" : "none",
          club: player
            ? jobDefinition(s.employment.jobId).employer
            : participating
              ? d.start
              : null,
          ability: player
            ? s.skills[d.skill]
            : Math.max(10, s.skills[d.skill] * 0.75),
          discipline: 65,
          reputation: player ? jobDefinition(s.employment.jobId).level * 15 : 0,
          experience: player ? s.progress[d.id].weeks : 0,
          events: 0,
          wins: 0,
          injuryWeeks: 0,
          training: "balanced",
          nextScoutWeek: s.week + 13,
          lastResult: null,
          offers: [],
          trial: null,
          contract: player
            ? { jobId: s.employment.jobId, expiresWeek: null }
            : null,
        },
      ];
    }),
  );
}
export const sportCosts = (s) =>
  SPORTS.reduce(
    (sum, d) => sum + (s.sports[d.id].stage === "local" ? d.entryFee : 0),
    0,
  );
export function joinSport(state, id) {
  writable(state);
  const d = SPORTS.find((d) => d.id === id);
  if (!d) throw new Error("Sport unavailable.");
  if (!state.actions) throw new Error("No free-time actions left.");
  if (!["none", "retired"].includes(state.sports[id].stage))
    throw new Error("You already participate in this sport.");
  const s = structuredClone(state);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.sports[id].stage = "local";
  s.sports[id].club = d.start;
  s.sports[id].nextScoutWeek = s.week + 13;
  log(
    s,
    `Joined ${d.start}. Development and competition come before a professional offer.`,
    "milestone",
  );
  syncSeason(s, id);
  return s;
}
export function setSportTraining(state, id, training) {
  writable(state);
  if (
    !state.sports[id] ||
    !["balanced", "technical", "fitness", "rest"].includes(training)
  )
    throw new Error("Choose a sport and training plan.");
  const s = structuredClone(state);
  s.sports[id].training = training;
  return s;
}
export function leaveSport(state, id) {
  writable(state);
  if (!state.sports[id]) throw new Error("Sport unavailable.");
  const s = structuredClone(state),
    p = s.sports[id];
  if (p.contract && s.employment?.jobId === p.contract.jobId) {
    s.employment = null;
    s.career = s.company ? "business" : "unemployed";
  }
  p.stage = "retired";
  p.club = null;
  p.contract = null;
  p.trial = null;
  for (const o of p.offers) if (o.status === "offered") o.status = "declined";
  log(
    s,
    `Stepped away from ${SPORTS.find((d) => d.id === id).name}. Any playing or driving contract ends.`,
    "warning",
  );
  syncSeason(s, id);
  return s;
}
export function clearOtherSportContracts(s, keep = null) {
  if (keep !== "football" && s.football.contract) {
    s.football.contract = null;
    s.football.stage = "community";
    s.football.club = "Local amateur club";
  }
  for (const d of SPORTS)
    if (d.id !== keep && s.sports[d.id].contract) {
      s.sports[d.id].contract = null;
      s.sports[d.id].stage = "local";
      s.sports[d.id].club = d.start;
    }
}
export function acceptSportOffer(state, sportId, id) {
  writable(state);
  if (!state.actions) throw new Error("No free-time actions left.");
  const p = state.sports[sportId],
    o = p?.offers.find((o) => o.id === id);
  if (!o || o.status !== "offered" || o.expiresWeek <= state.week)
    throw new Error("Sport invitation expired.");
  if (p.injuryWeeks)
    throw new Error("Recover before attending a trial or signing.");
  const s = structuredClone(state),
    q = s.sports[sportId],
    offer = q.offers.find((o) => o.id === id);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  offer.status = "accepted";
  if (o.kind === "trial") {
    if (q.trial) throw new Error("A trial is underway.");
    q.trial = { offerId: id, decisionWeek: s.week + 2 };
    log(
      s,
      `A two-week assessment with ${o.club} begins. Results are not guaranteed.`,
    );
  } else if (o.kind === "academy") {
    q.stage = "academy";
    q.club = o.club;
    log(
      s,
      `Joined ${o.club}. Education and sport development continue together.`,
      "milestone",
    );
  } else {
    if (age(s) >= 42)
      throw new Error(
        "Professional sport recruitment ends at age 42; local participation remains available.",
      );
    const j = jobDefinition(o.jobId);
    checkSportSigning(s, sportId, o);
    if (
      age(s) < 16 ||
      (j.qualification && !s.education.completed.includes(j.qualification))
    )
      throw new Error(
        "This contract requires age 16+ and its competition licence.",
      );
    clearOtherSportContracts(s, sportId);
    q.stage = j.level >= 2 ? "professional" : "junior";
    q.club = o.club;
    q.contract = { jobId: j.id, expiresWeek: s.week + 104 };
    signedSportTerms(s, sportId, o);
    s.employment = {
      jobId: j.id,
      weeklyPay: o.pay,
      startingPay: o.pay,
      tenure: 0,
      performance: 65,
      nextRaiseWeek: s.week + 13,
      legacy: false,
    };
    s.career = j.track;
    s.progress[j.track].level = j.level;
    s.progress[j.track].unlocked = true;
    for (const a of s.applications)
      if (a.status === "offer") a.status = "declined";
    log(
      s,
      `Signed ${o.club}'s ${o.terms?.weeks || o.duration || 104}-week ${sportId === "tennis" ? "tour sponsorship" : "sporting"} contract: $${o.pay}/week gross base income.`,
      "milestone",
    );
  }
  for (const other of q.offers)
    if (other.id !== id && other.status === "offered")
      other.status = "declined";
  syncSeason(s, sportId);
  return s;
}
export function declineSportOffer(state, sportId, id) {
  writable(state);
  const s = structuredClone(state),
    o = s.sports[sportId]?.offers.find((o) => o.id === id);
  if (!o || o.status !== "offered") throw new Error("Invitation unavailable.");
  o.status = "declined";
  return s;
}
function offer(s, d, kind, jobId = null) {
  const p = s.sports[d.id];
  const invitation = {
    id: `${d.id}:${kind}:${s.week}`,
    kind,
    club: kind === "contract" ? jobDefinition(jobId).employer : d.academy,
    jobId,
    pay: jobId ? Math.round(jobDefinition(jobId).pay * (1 + rng(s) * 0.08)) : 0,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  enhanceSportOffer(s, d.id, invitation);
  p.offers.push(invitation);
  p.offers = p.offers.slice(-12);
  log(
    s,
    `${d.name}: ${kind === "trial" ? "a development trial" : kind === "academy" ? "an academy place" : "a sporting contract"} is available. Review it within four weeks.`,
    "milestone",
  );
}
export function advanceSports(s) {
  for (const d of SPORTS) {
    const p = s.sports[d.id];
    for (const o of p.offers)
      if (o.status === "offered" && o.expiresWeek <= s.week)
        o.status = "expired";
    if (
      p.contract &&
      p.contract.expiresWeek !== null &&
      p.contract.expiresWeek <= s.week
    ) {
      if (s.employment?.jobId === p.contract.jobId) {
        s.employment = null;
        s.career = s.company ? "business" : "unemployed";
      }
      p.contract = null;
      p.stage = "local";
      p.club = d.start;
      log(
        s,
        `${d.name} contract expired. Base income stops; local competition can continue.`,
        "warning",
      );
    }
    if (["none", "retired"].includes(p.stage)) continue;
    if (
      age(s) >= 42 &&
      ["academy", "junior", "professional"].includes(p.stage)
    ) {
      Object.assign(s, leaveSport(s, d.id));
      continue;
    }
    if (p.stage === "academy" && age(s) > 21) {
      p.stage = "local";
      p.club = d.start;
      log(
        s,
        `${d.academy} development place ended. Local competition remains available.`,
      );
    }
    if (p.injuryWeeks) p.injuryWeeks--;
    else if (availableCash(s) >= (p.stage === "local" ? d.entryFee : 0)) {
      s.money -= p.stage === "local" ? d.entryFee : 0;
      markSportTraining(s, d.id);
      if (allocationRatio(s, d.id) >= 0.5) p.experience++;
      const rest = p.training === "rest",
        gain =
          p.training === "technical"
            ? 0.55
            : p.training === "fitness"
              ? 0.4
              : 0.3;
      p.ability = clamp(
        p.ability +
          (rest ? 0.03 : gain) *
            allocationRatio(s, d.id) *
            (s.energy < 25 ? 0.35 : 1) -
          (age(s) > 32 ? 0.1 : 0),
      );
      p.discipline = clamp(p.discipline + (rest ? -0.1 : 0.1));
      s.skills[d.skill] = clamp(
        s.skills[d.skill] + (rest ? 0.02 : 0.25) * allocationRatio(s, d.id),
      );
      if (!rest && allocationRatio(s, d.id) >= 0.5) {
        s.energy = clamp(s.energy - 3);
      }
    } else
      log(
        s,
        `${d.name} fees could not be paid; participation paused.`,
        "warning",
      );
    if (p.trial && p.trial.decisionWeek <= s.week) {
      p.trial = null;
      if (
        p.injuryWeeks === 0 &&
        rng(s) < Math.min(0.85, 0.1 + p.ability * 0.008 + p.discipline * 0.002)
      )
        offer(s, d, "academy");
      else
        log(
          s,
          `${d.academy} did not offer a development place. Keep competing and improving.`,
          "warning",
        );
    }
    if (s.week >= p.nextScoutWeek) {
      p.nextScoutWeek = s.week + 13;
      if (
        p.trial ||
        p.injuryWeeks ||
        p.offers.some((o) => o.status === "offered")
      )
        continue;
      if (
        p.stage === "local" &&
        s.progress[d.id].level === 0 &&
        age(s) <= 19 &&
        p.experience >= 26 &&
        p.ability >= 30 &&
        rng(s) < 0.4
      )
        offer(s, d, "trial");
      else if (
        ["local", "academy", "junior", "professional"].includes(p.stage) &&
        age(s) >= 16 &&
        age(s) < 42
      ) {
        const level = p.contract
            ? jobDefinition(p.contract.jobId).level
            : Math.max(0, s.progress[d.id].level - 1),
          target = `${d.id}-${Math.min(4, level + 1)}`,
          j = jobDefinition(target);
        const minimum = { 1: 55, 2: 70, 3: 85, 4: 95 }[Math.min(4, level + 1)];
        if (
          j &&
          p.experience >= Math.max(52, j.experience) &&
          (j.level === 1 || s.progress[d.id].weeks >= j.experience) &&
          (!p.contract || s.employment?.tenure >= 52) &&
          p.ability >= minimum &&
          s.skills[d.skill] >= j.skill &&
          (!j.qualification ||
            s.education.completed.includes(j.qualification)) &&
          (d.id === "racing" ||
            p.stage !== "local" ||
            (p.experience >= 104 && p.events >= 30)) &&
          p.discipline >= 55 &&
          rng(s) < (level >= 3 ? 0.15 : 0.4)
        )
          offer(s, d, "contract", target);
        else if (
          p.contract?.expiresWeek &&
          p.contract.expiresWeek - s.week <= 26 &&
          s.employment?.performance >= 55 &&
          rng(s) < 0.65
        )
          offer(s, d, "contract", p.contract.jobId);
      }
    }
  }
}
export function validateSports(s) {
  const n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    integer = (v) => n(v) && Number.isInteger(v),
    fail = () => {
      throw new Error("Invalid sporting pathway data.");
    };
  if (!s.sports) fail();
  for (const d of SPORTS) {
    const p = s.sports[d.id];
    if (
      !p ||
      ![
        "none",
        "local",
        "academy",
        "junior",
        "professional",
        "retired",
      ].includes(p.stage) ||
      !(p.club === null || typeof p.club === "string") ||
      !["balanced", "technical", "fitness", "rest"].includes(p.training) ||
      ["ability", "discipline", "reputation"].some((k) => !n(p[k], 0, 100)) ||
      ["experience", "events", "wins", "injuryWeeks", "nextScoutWeek"].some(
        (k) => !integer(p[k]),
      ) ||
      !Array.isArray(p.offers) ||
      p.offers.length > 12
    )
      fail();
    if (
      p.lastResult !== null &&
      (!integer(p.lastResult?.week) ||
        !n(p.lastResult?.score, 0, 100) ||
        typeof p.lastResult?.won !== "boolean")
    )
      fail();
    if (
      p.offers.some(
        (o) =>
          typeof o.id !== "string" ||
          typeof o.club !== "string" ||
          !["trial", "academy", "contract"].includes(o.kind) ||
          !["offered", "accepted", "declined", "expired"].includes(o.status) ||
          !n(o.pay) ||
          !integer(o.expiresWeek) ||
          (o.kind === "contract" && jobDefinition(o.jobId)?.track !== d.id),
      )
    )
      fail();
    if (
      p.trial !== null &&
      (!integer(p.trial?.decisionWeek) ||
        !p.offers.some(
          (o) => o.id === p.trial.offerId && o.status === "accepted",
        ))
    )
      fail();
    if (
      p.contract !== null &&
      (jobDefinition(p.contract?.jobId)?.track !== d.id ||
        s.employment?.jobId !== p.contract.jobId ||
        !(p.contract.expiresWeek === null || integer(p.contract.expiresWeek)))
    )
      fail();
  }
}
