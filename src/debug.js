import { PROGRAMS, reservedCash } from "./world.js";
import { HOBBIES } from "./everyday.js";

export const DEBUG_SPECIALIST_SKILLS = [
  ...["confidence", "ambition", "patience", "discipline", "empathy"].map(
    (key) => ({
      id: `personality.${key}`,
      label: `Personality: ${key}`,
      path: ["characterLife", "personality", key],
    }),
  ),
  ...["fitness", "mobility"].map((key) => ({
    id: `body.${key}`,
    label: `Physical: ${key}`,
    path: ["lifeCourse", "body", key],
  })),
  ...["vocals", "lyrics", "production"].map((key) => ({
    id: `music.${key}`,
    label: `Music: ${key}`,
    path: ["music", "skills", key],
  })),
  ...["ability", "discipline", "coachTrust", "reputation"].map((key) => ({
    id: `football.${key}`,
    label: `Football: ${key}`,
    path: ["football", key],
  })),
  ...["racing", "basketball", "tennis"].flatMap((sport) =>
    ["ability", "discipline", "reputation"].map((key) => ({
      id: `${sport}.${key}`,
      label: `${sport}: ${key}`,
      path: ["sports", sport, key],
    })),
  ),
  {
    id: "social.contentSkill",
    label: "Creator: content production",
    path: ["social", "contentSkill"],
  },
  { id: "school.grade", label: "School: grade", path: ["school", "grade"] },
  ...["movement", "language", "curiosity", "confidence"].map((key) => ({
    id: `childhood.${key}`,
    label: `Childhood: ${key}`,
    path: ["childhood", "development", key],
  })),
];

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
    "specialistSkills",
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
  if (Object.hasOwn(changes, "specialistSkills")) {
    const values = changes.specialistSkills;
    if (
      !values ||
      typeof values !== "object" ||
      Array.isArray(values) ||
      !Object.keys(values).length
    )
      throw new Error("Choose valid specialist skills.");
    for (const [id, value] of Object.entries(values)) {
      const skill = DEBUG_SPECIALIST_SKILLS.find((k) => k.id === id);
      if (!skill || !number(value, 0, 100))
        throw new Error("Invalid specialist skill value. Enter 0 to 100.");
      const target = skill.path.slice(0, -1).reduce((o, k) => o[k], s);
      target[skill.path.at(-1)] = value;
      summary.push(`${skill.label}: ${value}`);
    }
  }
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
