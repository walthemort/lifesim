import { recordBudget } from "./effects.js";
import { availableCash } from "../world.js";
import { spendTime } from "../calendar.js";
export const age = (s) =>
  s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52);
export const year = (s) => (s.startingYear || 2026) + Math.floor(s.week / 52);
export const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
export const round = (n) => Math.round(n * 100) / 100;
export const hash = (text) =>
  [...String(text)].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    17,
  );
export function roll(s) {
  s.simulation.seed =
    (Math.imul(s.simulation.seed, 1664525) + 1013904223) >>> 0;
  return s.simulation.seed / 4294967296;
}
export function uid(s, prefix) {
  return `${prefix}:${++s.simulation.serial}`;
}
export function note(s, text, kind = "info") {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
  s.simulation.journal.unshift({ week: s.week, text });
  s.simulation.journal = s.simulation.journal.slice(0, 80);
}
export function act(
  state,
  {
    minAge = 6,
    cost = 0,
    hours = 2,
    energy = 0,
    label = "Life planning",
    custody = false,
  } = {},
) {
  if (
    state.ended ||
    state.event ||
    !state.actions ||
    age(state) < minAge ||
    (!custody && state.globalLife.crime.prison)
  )
    throw new Error(
      `Requires age ${minAge}+, a free action and no pending choice${custody ? "" : " or custody"}.`,
    );
  if (!Number.isFinite(cost) || cost < 0 || availableCash(state) < cost)
    throw new Error("Cover this cost from uncommitted cash.");
  if (state.energy < energy) throw new Error("Rest before this activity.");
  const s = structuredClone(state);
  if (age(s) >= 5) spendTime(s, hours, label);
  s.actions--;
  s.money = round(s.money - cost);
  s.energy -= energy;
  recordBudget(s, "discretionary", -cost, label);
  return s;
}
export function once(s, records, key, interval = 1) {
  if (records[key] !== undefined && s.week - records[key] < interval)
    throw new Error("Wait for the next review before repeating this activity.");
  records[key] = s.week;
  const keys = Object.keys(records).sort((a, b) => records[a] - records[b]);
  for (const old of keys.slice(0, Math.max(0, keys.length - 256)))
    delete records[old];
}
export function text(value, max = 60) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error(`Enter text from one to ${max} characters.`);
  return value.trim();
}
export function fail() {
  throw new Error("Invalid detailed simulation data in save.");
}
export function num(n, lo = 0, hi = 1e12, integer = false) {
  if (
    typeof n !== "number" ||
    !Number.isFinite(n) ||
    n < lo ||
    n > hi ||
    (integer && !Number.isInteger(n))
  )
    fail();
}
export function str(s, max = 160) {
  if (typeof s !== "string" || s.length > max) fail();
}
export function bool(b) {
  if (typeof b !== "boolean") fail();
}
export function one(value, choices) {
  if (!choices.includes(value)) fail();
}
export function arr(a, max = 100) {
  if (!Array.isArray(a) || a.length > max) fail();
  return a;
}
export function obj(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) fail();
  return o;
}
export function stamps(o, week) {
  obj(o);
  if (Object.keys(o).length > 256) fail();
  for (const [k, v] of Object.entries(o)) {
    str(k, 100);
    num(v, -5200, week, true);
  }
}
