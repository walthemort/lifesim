import { PROGRAMS, reservedCash } from "./world.js";
import { HOBBIES } from "./everyday.js";

function audit(s, text) {
  s.debug.used = true;
  s.debug.edits.unshift({ week: s.week, text });
  s.debug.edits = s.debug.edits.slice(0, 20);
  s.log.unshift({ week: s.week, text: `Debug: ${text}`, kind: "warning" });
  s.log = s.log.slice(0, 40);
}
export function toggleDebug(state, enabled) {
  if (typeof enabled !== "boolean")
    throw new Error("Choose whether debug is enabled.");
  const s = structuredClone(state);
  s.debug.enabled = enabled;
  audit(
    s,
    enabled ? "Enabled sandbox controls." : "Disabled sandbox controls.",
  );
  return s;
}
export function debugEdit(state, changes) {
  if (!state.debug.enabled)
    throw new Error("Enable debug mode in Save & settings first.");
  if (state.ended)
    throw new Error("Start a new life or restore your pre-debug save.");
  if (
    !changes ||
    typeof changes !== "object" ||
    Array.isArray(changes) ||
    !Object.keys(changes).length
  )
    throw new Error("Choose a debug change.");
  const allowed = [
    "money",
    "health",
    "energy",
    "happiness",
    "actions",
    "skills",
    "hobbySkills",
    "followers",
    "recognition",
    "qualification",
  ];
  if (Object.keys(changes).some((k) => !allowed.includes(k)))
    throw new Error("This debug field is unavailable.");
  const number = (n, min, max, integer = false) =>
    typeof n === "number" &&
    Number.isFinite(n) &&
    n >= min &&
    n <= max &&
    (!integer || Number.isInteger(n));
  const s = structuredClone(state),
    summary = [];
  for (const k of [
    "money",
    "health",
    "energy",
    "happiness",
    "actions",
    "recognition",
  ])
    if (Object.hasOwn(changes, k)) {
      const min =
        k === "money" ? (reservedCash(s) > 0 ? reservedCash(s) : -1e9) : 0;
      const max = k === "money" ? 1e12 : k === "actions" ? 3 : 100;
      if (!number(changes[k], min, max, k === "actions"))
        throw new Error(
          `Invalid ${k}; enter ${min} to ${max}. Cash cannot be lower than reserved bids.`,
        );
      if (k === "recognition") s.fame.recognition = changes[k];
      else s[k] = changes[k];
      summary.push(`${k}: ${changes[k]}`);
    }
  for (const k of ["skills", "hobbySkills", "followers"])
    if (Object.hasOwn(changes, k)) {
      const values = changes[k];
      if (
        !values ||
        typeof values !== "object" ||
        Array.isArray(values) ||
        !Object.keys(values).length
      )
        throw new Error("Choose valid debug values.");
      const keys =
        k === "skills"
          ? Object.keys(s.skills)
          : k === "hobbySkills"
            ? HOBBIES.map((h) => h.id)
            : Object.keys(s.social.profiles);
      for (const [id, value] of Object.entries(values)) {
        if (
          !keys.includes(id) ||
          !number(value, 0, k === "followers" ? 1e9 : 100, k === "followers")
        )
          throw new Error("Invalid skill or audience value.");
        if (k === "skills") s.skills[id] = value;
        if (k === "hobbySkills") s.pastimes.hobbies[id].skill = value;
        if (k === "followers") s.social.profiles[id].followers = value;
      }
      summary.push(`Edited ${k}.`);
    }
  if (Object.hasOwn(changes, "qualification")) {
    if (!PROGRAMS.some((p) => p.id === changes.qualification))
      throw new Error("Choose a known qualification.");
    if (!s.education.completed.includes(changes.qualification))
      s.education.completed.push(changes.qualification);
    if (s.education.active?.programId === changes.qualification)
      s.education.active = null;
    summary.push(`Granted ${changes.qualification}.`);
  }
  audit(s, summary.join(" ").slice(0, 200));
  return s;
}
