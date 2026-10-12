import { contractHours } from "./contracts.js";
import { milestoneHours } from "./career-milestones.js";
import { careerWorldHours } from "./career-world.js";
import { lifeCourseHours, teenWorkHours } from "./life-course.js";
import { recommendedSleep } from "./childhood.js";
import { careerSupportHours } from "./career-support.js";
import { storyWeeklyHours } from "./stories.js";
const age = (s) => s.startAge + Math.floor(s.week / 52);
const clamp = (n) => Math.max(0, Math.min(100, n));
export const TIME_BLOCKS = [
  "study",
  "football",
  "racing",
  "basketball",
  "tennis",
  "music",
  "project",
  "relationships",
];
export function initializeCalendar(s) {
  s.calendar = {
    mode: "automatic",
    sleep: recommendedSleep(s),
    hours: Object.fromEntries(
      TIME_BLOCKS.map((k) => [
        k,
        k === "study" ? 8 : k === "relationships" ? 4 : 6,
      ]),
    ),
    spent: 0,
    actions: [],
    entries: [],
    serial: 0,
    last: null,
    history: [],
  };
}
export function requiredHours(s, week = s.week) {
  const working =
    teenWorkHours(s) +
    (s.employment
      ? s.employment.weeklyHours ||
        (["football", "racing", "basketball", "tennis"].includes(s.career)
          ? 35
          : 40)
      : s.company
        ? 20
        : 0);
  const school = s.school.enrolled && age(s) < 18 ? 30 : 0;
  const extra = s.workLife?.arrangement === "overtime" && s.employment ? 8 : 0;
  const care =
    s.family.children.reduce((sum, c) => {
      const years = Math.floor((s.week - c.bornWeek) / 52);
      const base =
        years >= 18
          ? 0
          : years < 5
            ? s.employment
              ? 8
              : 18
            : years < 13
              ? 8
              : 4;
      return (
        sum +
        base * (s.family.livingTogether ? 0.6 : 1) +
        (c.club && c.club !== "none" && years < 16 ? 2 : 0)
      );
    }, 0) +
    s.family.pets.length * 3 +
    storyWeeklyHours(s) +
    careerSupportHours(s, week) +
    lifeCourseHours(s) +
    careerWorldHours(s, week) +
    contractHours(s, week) +
    milestoneHours(s, week);
  return {
    sleep: s.calendar.sleep * 7,
    everyday: age(s) < 5 ? 14 : age(s) < 12 ? 21 : 28,
    work: working + extra,
    school,
    commute: working || school ? 5 : 0,
    care,
  };
}
export function calendarForecast(s, { comingWeek = false } = {}) {
  const week = s.week + (comingWeek ? 1 : 0);
  const required = requiredHours(s, week),
    mandatory = Object.values(required).reduce((a, b) => a + b, 0);
  const appointments = s.calendar.entries
    .filter((e) => e.status === "scheduled" && e.week === week)
    .reduce((n, e) => n + e.hours, 0);
  const spent = s.calendar.spent;
  const desired = Object.fromEntries(TIME_BLOCKS.map((k) => [k, 0]));
  if (s.education.active)
    desired.study =
      s.calendar.mode === "automatic"
        ? s.activity === "study"
          ? 16
          : 8
        : s.calendar.hours.study;
  if (!["none", "retired"].includes(s.football.stage) && !s.football.contract)
    desired.football =
      s.calendar.mode === "automatic" ? 6 : s.calendar.hours.football;
  for (const id of ["racing", "basketball", "tennis"])
    if (
      !["none", "retired"].includes(s.sports[id].stage) &&
      !s.sports[id].contract
    )
      desired[id] = s.calendar.mode === "automatic" ? 6 : s.calendar.hours[id];
  if (s.music.active)
    desired.music =
      s.calendar.mode === "automatic" ? 4 : s.calendar.hours.music;
  if (
    s.pastimes.projects.some((p) => p.status === "working") ||
    s.music.projects.some((p) => p.status === "recording")
  )
    desired.project =
      s.calendar.mode === "automatic" ? 4 : s.calendar.hours.project;
  desired.relationships =
    s.calendar.mode === "automatic" ? 4 : s.calendar.hours.relationships;
  const requested = Object.values(desired).reduce((a, b) => a + b, 0);
  const room = Math.max(0, 168 - mandatory - spent - appointments);
  const fraction = requested ? Math.min(1, room / requested) : 1;
  const allocations = Object.fromEntries(
    TIME_BLOCKS.map((k) => [k, Math.round(desired[k] * fraction * 10) / 10]),
  );
  const deficit = Math.max(
    0,
    mandatory + spent + appointments + requested - 168,
  );
  return {
    week,
    required,
    mandatory,
    appointments,
    spent,
    desired,
    allocations,
    deficit,
    free: Math.max(0, room - Math.min(room, requested)),
    total: mandatory + spent + appointments + Math.min(room, requested),
    stress: Math.min(
      100,
      deficit * 2 + Math.max(0, recommendedSleep(s) - s.calendar.sleep) * 12,
    ),
  };
}
export function spendTime(s, hours = 3, label = "Free-time activity") {
  if (!s.calendar) return;
  if (age(s) < 5)
    throw new Error("Use supervised childhood activities before age five.");
  const committed = Object.values(requiredHours(s)).reduce((a, b) => a + b, 0);
  const booked = s.calendar.entries
    .filter((e) => e.status === "scheduled" && e.week === s.week + 1)
    .reduce((n, e) => n + e.hours, 0);
  if (committed + booked + s.calendar.spent + hours > 168)
    throw new Error(
      "There are not enough hours left this week. Adjust your calendar or wait for next week.",
    );
  s.calendar.spent += hours;
  s.calendar.actions.push({ hours, label });
  s.calendar.actions = s.calendar.actions.slice(-30);
}
export function setCalendar(state, { mode, sleep, hours }) {
  if (state.ended) throw new Error("This life is complete.");
  if (
    !["automatic", "custom"].includes(mode) ||
    !Number.isFinite(sleep) ||
    sleep < 6 ||
    sleep > 16 ||
    !Number.isInteger(sleep)
  )
    throw new Error(
      "Choose an automatic or custom plan and 6–16 hours of sleep.",
    );
  if (
    !hours ||
    TIME_BLOCKS.some(
      (k) => !Number.isFinite(hours[k]) || hours[k] < 0 || hours[k] > 40,
    )
  )
    throw new Error("Each weekly block must be between 0 and 40 hours.");
  const s = structuredClone(state);
  s.calendar.mode = mode;
  s.calendar.sleep = sleep;
  s.calendar.hours = { ...hours };
  return s;
}
export function allocationRatio(s, id, target = 6) {
  if (!s.calendar) return 1;
  if (
    (id === "football" && s.football.contract) ||
    (["racing", "basketball", "tennis"].includes(id) && s.sports[id].contract)
  )
    return 1;
  const plan =
    s.calendar.last?.week === s.week ? s.calendar.last : calendarForecast(s);
  return Math.min(1, (plan.allocations[id] || 0) / target);
}
export function prepareCalendar(s) {
  // Last week's actions consumed time; scheduled meetings belong to the week now being simulated.
  s.calendar.last = calendarForecast(s);
  const plan = s.calendar.last;
  const sleepDebt = Math.max(0, recommendedSleep(s) - s.calendar.sleep);
  s.energy = clamp(
    s.energy - Math.min(18, plan.deficit * 0.35) - sleepDebt * 4,
  );
  s.happiness = clamp(s.happiness - Math.min(6, plan.deficit * 0.12));
  if (sleepDebt) s.health = clamp(s.health - sleepDebt * 0.4);
  s.calendar.history.push({
    week: s.week,
    stress: plan.stress,
    deficit: plan.deficit,
  });
  s.calendar.history = s.calendar.history.slice(-52);
  if (plan.deficit > 0) {
    s.log.unshift({
      week: s.week,
      text: `Your calendar was overbooked by ${plan.deficit.toFixed(1)} hours. Optional activities received less time.`,
      kind: "warning",
    });
    s.log = s.log.slice(0, 40);
  }
}
export function finishCalendar(s) {
  s.calendar.spent = 0;
  s.calendar.actions = [];
}
export function validateCalendar(s) {
  const c = s.calendar,
    number = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const list = (v, max) => Array.isArray(v) && v.length <= max;
  const fail = () => {
    throw new Error("Invalid calendar data in save.");
  };
  if (
    !c ||
    !["automatic", "custom"].includes(c.mode) ||
    !number(c.sleep, 6, 16) ||
    !Number.isInteger(c.sleep) ||
    !number(c.spent, 0, 168) ||
    !number(c.serial) ||
    !Number.isInteger(c.serial) ||
    TIME_BLOCKS.some((k) => !number(c.hours?.[k], 0, 40)) ||
    !list(c.actions, 30) ||
    !list(c.entries, 32) ||
    !list(c.history, 52)
  )
    fail();
  if (
    c.actions.some(
      (a) => !number(a.hours, 0, 24) || typeof a.label !== "string",
    ) ||
    c.entries.some(
      (e) =>
        typeof e.id !== "string" ||
        !["date", "family"].includes(e.kind) ||
        !number(e.week, 0) ||
        !Number.isInteger(e.week) ||
        !number(e.hours, 1, 12) ||
        !["scheduled", "completed", "missed", "cancelled"].includes(e.status) ||
        !number(e.cost, 0) ||
        typeof e.title !== "string",
    ) ||
    new Set(c.entries.map((e) => e.id)).size !== c.entries.length ||
    c.history.some(
      (h) =>
        !number(h.week, 0, s.week) ||
        !number(h.stress, 0, 100) ||
        !number(h.deficit, 0, 1000),
    )
  )
    fail();
  if (
    c.last !== null &&
    (!number(c.last.mandatory, 0, 400) ||
      !number(c.last.spent, 0, 168) ||
      !number(c.last.appointments, 0, 168) ||
      !number(c.last.free, 0, 168) ||
      !number(c.last.total, 0, 600) ||
      TIME_BLOCKS.some((k) => !number(c.last.desired?.[k], 0, 40)) ||
      ["sleep", "everyday", "work", "school", "commute", "care"].some(
        (k) => !number(c.last.required?.[k], 0, 200),
      ) ||
      !number(c.last.week, 0, s.week) ||
      !number(c.last.deficit, 0, 1000) ||
      !number(c.last.stress, 0, 100) ||
      TIME_BLOCKS.some((k) => !number(c.last.allocations?.[k], 0, 40)))
  )
    fail();
}
