import { personalityModifier } from "./personality.js";
import {
  JOBS,
  TRACK_SKILLS,
  jobDefinition,
  rng,
  jobEligibility,
} from "./world.js";
import { spendTime } from "./calendar.js";
const clamp = (n) => Math.max(0, Math.min(100, n));
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
export function initializeWorkLife(s) {
  s.workLife = {
    jobId: s.employment?.jobId || null,
    arrangement: "standard",
    managerBond: 50,
    colleagueBond: 50,
    warnings: 0,
    poorWeeks: 0,
    probationEnds: null,
    probationReviewed: true,
    nextPromotion: s.week + 26,
    promotion: null,
    pension: 0,
    pensionRate: 0,
    history: [],
  };
}
export function beginEmployment(s) {
  if (!s.workLife) return;
  const j = jobDefinition(s.employment.jobId);
  Object.assign(s.workLife, {
    jobId: j.id,
    arrangement: "standard",
    managerBond: 50,
    colleagueBond: 50,
    warnings: 0,
    poorWeeks: 0,
    probationEnds: s.week + 13,
    probationReviewed: false,
    nextPromotion: s.week + 26,
    promotion: null,
  });
  s.employment.weeklyHours = j.hours || 40;
}
function action(state, hours = 3, label = "Workplace meeting") {
  if (state.ended || !state.actions)
    throw new Error("You need a free-time action in an active life.");
  const s = structuredClone(state);
  spendTime(s, hours, label);
  s.actions--;
  return s;
}
export function attendInterview(state, id, approach) {
  const a = state.applications.find((a) => a.id === id);
  if (!a || a.status !== "interview" || a.expiresWeek <= state.week)
    throw new Error("This interview invitation has expired.");
  if (!["prepared", "experience", "honest"].includes(approach))
    throw new Error("Choose an interview approach.");
  const s = action(state, 3, "Job interview"),
    application = s.applications.find((a) => a.id === id),
    j = jobDefinition(a.jobId);
  const experience = Math.min(25, s.progress[j.track].weeks / 10);
  application.interviewScore = clamp(
    35 +
      personalityModifier(s, "interview") +
      s.skills[TRACK_SKILLS[j.track]] * 0.35 +
      s.skills.charisma * 0.15 +
      (approach === "prepared"
        ? 12
        : approach === "experience"
          ? experience
          : 7),
  );
  application.interviewed = true;
  application.status = "pending";
  application.decisionWeek = s.week + 1;
  log(
    s,
    `Interviewed with ${j.employer}. The hiring decision is due next week.`,
  );
  return s;
}
export function setWorkArrangement(state, mode) {
  if (
    state.ended ||
    !state.employment ||
    !["standard", "overtime"].includes(mode)
  )
    throw new Error("Choose a schedule for your current job.");
  const s = structuredClone(state);
  s.workLife.arrangement = mode;
  return s;
}
export function workplaceAction(state, mode) {
  if (!state.employment || !["manager", "colleagues", "mentor"].includes(mode))
    throw new Error("Choose a workplace activity in your current job.");
  const s = action(state),
    w = s.workLife;
  if (mode === "manager") w.managerBond = clamp(w.managerBond + 8);
  if (mode === "colleagues") {
    w.colleagueBond = clamp(w.colleagueBond + 10);
    s.happiness = clamp(s.happiness + 3);
  }
  if (mode === "mentor") {
    const k = TRACK_SKILLS[jobDefinition(s.employment.jobId).track];
    s.skills[k] = clamp(s.skills[k] + 1.5);
    w.managerBond = clamp(w.managerBond + 2);
  }
  log(
    s,
    mode === "mentor"
      ? "A mentoring session built practical skills."
      : mode === "manager"
        ? "Discussed your work and goals with your manager."
        : "Spent time with your colleagues.",
  );
  return s;
}
export function promotionCandidate(s) {
  if (!s.employment) return null;
  const j = jobDefinition(s.employment.jobId);
  return (
    JOBS.find(
      (n) =>
        n.track === j.track &&
        n.level === j.level + 1 &&
        n.employer === j.employer,
    ) || null
  );
}
export function requestPromotion(state) {
  const j = promotionCandidate(state);
  if (!j)
    throw new Error(
      "There is no higher internal role at this employer. Look for an external vacancy.",
    );
  if (state.week < state.workLife.nextPromotion || state.workLife.promotion)
    throw new Error("Your next promotion review is not available yet.");
  const eligibility = jobEligibility(state, {
    jobId: j.id,
    expiresWeek: state.week + 1,
    exceptional: false,
  });
  if (!eligibility.eligible || state.employment.performance < 70)
    throw new Error(
      `Promotion needs 70 performance and all role requirements${eligibility.missing.length ? ": " + eligibility.missing.join(", ") : "."}`,
    );
  const s = action(state);
  s.workLife.promotion = {
    jobId: j.id,
    status: "pending",
    decisionWeek: s.week + 2,
    expiresWeek: s.week + 6,
    pay: 0,
  };
  s.workLife.nextPromotion = s.week + 26;
  log(s, `Requested an internal promotion to ${j.title}. Review in two weeks.`);
  return s;
}
export function acceptPromotion(state) {
  const p = state.workLife.promotion;
  if (!state.employment || p?.status !== "offer" || p.expiresWeek <= state.week)
    throw new Error("No active promotion offer.");
  const s = structuredClone(state),
    j = jobDefinition(p.jobId);
  s.employment = {
    ...s.employment,
    jobId: j.id,
    weeklyPay: p.pay,
    startingPay: p.pay,
    tenure: 0,
    weeklyHours: j.hours || 40,
    performance: 65,
    nextRaiseWeek: s.week + 13,
  };
  s.progress[j.track].level = j.level;
  beginEmployment(s);
  log(s, `Promoted to ${j.title}, earning $${p.pay}/week.`, "milestone");
  return s;
}
export function setPension(state, rate) {
  if (state.ended || ![0, 3, 5, 10, 15].includes(rate))
    throw new Error("Choose a pension contribution of 0, 3, 5, 10 or 15%.");
  const s = structuredClone(state);
  s.workLife.pensionRate = rate;
  return s;
}
export function employmentIncome(s) {
  const p = s.employment;
  if (!p) return 0;
  return (
    Math.round(
      p.weeklyPay *
        (s.workLife?.arrangement === "overtime" &&
        ["nursing", "trades", "hospitality"].includes(s.career)
          ? 1 + (8 / (p.weeklyHours || 40)) * 1.25
          : 1) *
        100,
    ) / 100
  );
}
export function pensionDue(s) {
  return Math.round(employmentIncome(s) * (s.workLife?.pensionRate || 0)) / 100;
}
export function pensionContribution(s, income) {
  if (!s.employment) return 0;
  const contribution = Math.round(income * s.workLife.pensionRate) / 100;
  s.workLife.pension +=
    contribution +
    Math.round(income * Math.min(2, s.workLife.pensionRate)) / 100;
  return contribution;
}
export function withdrawPension(state) {
  if (
    state.ended ||
    state.startAge + Math.floor(state.week / 52) < 60 ||
    !state.workLife.pension
  )
    throw new Error("Pension savings can be withdrawn from age 60.");
  const s = structuredClone(state);
  s.money += s.workLife.pension;
  s.workLife.pension = 0;
  log(s, "Withdrew accumulated pension savings.");
  return s;
}
export function advanceWorkLife(s) {
  const w = s.workLife;
  if (!s.employment) {
    w.jobId = null;
    w.promotion = null;
    w.arrangement = "standard";
    return;
  }
  if (w.jobId !== s.employment.jobId) beginEmployment(s);
  const p = s.employment,
    j = jobDefinition(p.jobId);
  if (["football", "racing", "basketball", "tennis"].includes(j.track)) return;
  p.performance = clamp(
    Math.round(
      p.performance -
        (s.calendar.last?.stress || 0) * 0.08 +
        (w.arrangement === "overtime" ? 1 : 0),
    ),
  );
  w.poorWeeks =
    p.performance < 45 ? w.poorWeeks + 1 : Math.max(0, w.poorWeeks - 1);
  if (!w.probationReviewed && s.week >= w.probationEnds) {
    w.probationReviewed = true;
    if (p.performance < 45) {
      w.poorWeeks = Math.max(w.poorWeeks, 8);
      log(
        s,
        "Your probation review raised serious performance concerns.",
        "warning",
      );
    } else log(s, "You passed your probation review.", "positive");
  }
  if (w.poorWeeks >= 8) {
    w.poorWeeks = 0;
    w.warnings++;
    log(
      s,
      `Formal performance warning ${w.warnings}/3: your manager needs sustained improvement.`,
      "warning",
    );
    if (w.warnings >= 3) {
      log(
        s,
        `Dismissed from ${j.employer} after repeated poor performance. Wages stop next week.`,
        "warning",
      );
      s.employment = null;
      s.career = s.company ? "business" : "unemployed";
      w.jobId = null;
      w.promotion = null;
      w.arrangement = "standard";
      return;
    }
  }
  if (w.promotion?.status === "pending" && w.promotion.decisionWeek <= s.week) {
    const target = jobDefinition(w.promotion.jobId);
    const eligible = jobEligibility(s, {
      jobId: target.id,
      expiresWeek: s.week + 1,
      exceptional: false,
    }).eligible;
    if (
      eligible &&
      p.performance >= 70 &&
      rng(s) <
        Math.min(0.92, 0.35 + p.performance * 0.003 + w.managerBond * 0.003)
    ) {
      Object.assign(w.promotion, {
        status: "offer",
        pay: Math.min(
          target.maxPay,
          Math.max(target.pay, Math.round(p.weeklyPay * 1.15)),
        ),
        expiresWeek: s.week + 4,
      });
      log(
        s,
        `An internal promotion offer is ready: ${target.title}.`,
        "milestone",
      );
    } else {
      log(
        s,
        "Your promotion was declined. Build qualifications, performance and trust before the next review.",
      );
      w.promotion = null;
    }
  } else if (
    w.promotion?.status === "offer" &&
    w.promotion.expiresWeek <= s.week
  )
    w.promotion = null;
  if (s.week % 13 === 0) {
    w.history.push({
      week: s.week,
      performance: p.performance,
      pay: p.weeklyPay,
    });
    w.history = w.history.slice(-20);
  }
}
export function validateWorkLife(s) {
  const w = s.workLife,
    n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  if (
    !w ||
    (w.jobId !== null && !jobDefinition(w.jobId)) ||
    !["standard", "overtime"].includes(w.arrangement) ||
    !n(w.managerBond, 0, 100) ||
    !n(w.colleagueBond, 0, 100) ||
    !n(w.warnings, 0, 3) ||
    !n(w.poorWeeks, 0, 8) ||
    !n(w.nextPromotion) ||
    !n(w.pension) ||
    ![0, 3, 5, 10, 15].includes(w.pensionRate) ||
    typeof w.probationReviewed !== "boolean" ||
    (w.probationEnds !== null && !n(w.probationEnds)) ||
    !Array.isArray(w.history) ||
    w.history.length > 20 ||
    w.history.some(
      (h) => !n(h.week, 0, s.week) || !n(h.performance, 0, 100) || !n(h.pay),
    )
  )
    throw new Error("Invalid workplace data in save.");
  if (
    w.promotion &&
    (!jobDefinition(w.promotion.jobId) ||
      !["pending", "offer"].includes(w.promotion.status) ||
      !n(w.promotion.decisionWeek) ||
      !n(w.promotion.expiresWeek) ||
      !n(w.promotion.pay))
  )
    throw new Error("Invalid promotion data in save.");
  if (
    s.applications.some(
      (a) =>
        (a.interviewed !== undefined && typeof a.interviewed !== "boolean") ||
        (a.interviewScore !== undefined && !n(a.interviewScore, 0, 100)) ||
        (a.status === "interview" && !jobDefinition(a.jobId)?.interview),
    )
  )
    throw new Error("Invalid interview data in save.");
}
