import { relativeAlive } from "./life-course.js";
import { joinFootball } from "./life.js";
import { joinSport, SPORTS } from "./sport.js";
import { configureMusic } from "./music.js";
import { ensurePeople } from "./connections.js";
import { spendTime } from "./calendar.js";
import { careerPathReason } from "./career-commitment.js";

const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n));
const log = (s, text) => {
  s.log.unshift({ week: s.week, text, kind: "milestone" });
  s.log = s.log.slice(0, 40);
};
export const CHILD_ACTIVITIES = [
  {
    id: "play",
    name: "Play & discover",
    minAge: 0,
    description: "Supervised play develops movement and curiosity.",
  },
  {
    id: "family",
    name: "Time with your family",
    minAge: 0,
    description: "Comfort, conversation and stronger family bonds.",
  },
  {
    id: "read",
    name: "Share a book",
    minAge: 3,
    description: "Picture books and reading build language and knowledge.",
  },
  {
    id: "explore",
    name: "Explore outdoors",
    minAge: 3,
    description: "An adult joins you while you explore and move.",
  },
  {
    id: "friends",
    name: "Play with school friends",
    minAge: 5,
    description: "Free play builds confidence and friendships.",
  },
  {
    id: "study",
    name: "Do your homework",
    minAge: 5,
    description: "Build study habits and work on school results.",
  },
];
export const CHILD_INTERESTS = [
  { id: "unemployed", name: "Still discovering", minAge: 0 },
  { id: "football", name: "Football", minAge: 5 },
  { id: "racing", name: "Karting", minAge: 6 },
  { id: "basketball", name: "Basketball", minAge: 6 },
  { id: "tennis", name: "Tennis", minAge: 6 },
  { id: "music", name: "Music lessons", minAge: 6 },
];
export const childhoodStage = (s) =>
  age(s) < 1
    ? "Infancy"
    : age(s) < 3
      ? "Toddler years"
      : age(s) < 5
        ? "Preschool"
        : age(s) < 12
          ? "Primary school"
          : age(s) < 18
            ? "Teenage years"
            : "Adult life";
export const recommendedSleep = (s) =>
  age(s) < 1
    ? 14
    : age(s) < 3
      ? 12
      : age(s) < 5
        ? 11
        : age(s) < 12
          ? 10
          : age(s) < 18
            ? 9
            : 8;
export const childhoodAllowance = (s) =>
  age(s) < 6 ? 0 : age(s) < 12 ? 5 : 25;
const MILESTONES = [
  {
    age: 0,
    id: "birth",
    text: "You were born. Your family welcomes you into the world.",
  },
  {
    age: 1,
    id: "steps",
    text: "Your first birthday: learning to walk and exploring with your family.",
  },
  {
    age: 2,
    id: "words",
    text: "Your second birthday: words and conversations are becoming part of your world.",
  },
  {
    age: 3,
    id: "preschool",
    text: "Preschool begins. Play, stories and other children fill your days.",
  },
  {
    age: 5,
    id: "primary",
    text: "Your first day of primary school. Learning and friendships begin a new chapter.",
  },
  {
    age: 6,
    id: "allowance",
    text: "Your family starts a $5 weekly allowance. They cover your basic needs and childhood club fees.",
  },
  {
    age: 12,
    id: "secondary",
    text: "Secondary school begins. Your allowance becomes $25/week, with $15 personal costs.",
  },
  {
    age: 16,
    id: "sixteen",
    text: "You turned sixteen. Sporting contracts and age-appropriate dating can become possibilities.",
  },
  {
    age: 18,
    id: "adult",
    text: "You turned eighteen. Your childhood allowance ends; adult living costs and qualified job applications begin.",
  },
];
export function initializeChildhood(s, { legacy = false } = {}) {
  s.childhood = {
    startedAtBirth: !legacy && s.startAge === 0,
    lastAge: age(s),
    development: {
      movement: age(s) < 5 ? 5 : 60,
      language: age(s) < 5 ? 5 : 60,
      curiosity: 30,
      confidence: 40,
    },
    milestones: [],
    activities: {},
    choices: [],
  };
  if (!legacy && age(s) < 12) {
    const surname = s.name.split(" ").at(-1);
    s.relationships = [
      {
        id: "parent:robin",
        name: `Robin ${surname}`,
        role: "Parent",
        bond: 90,
        icon: "RM",
        color: "purple",
      },
      {
        id: "parent:casey",
        name: `Casey ${surname}`,
        role: "Parent",
        bond: 88,
        icon: "CM",
        color: "orange",
      },
    ];
    s.connections.profiles = {};
    ensurePeople(s);
    for (const [i, r] of s.relationships.entries())
      Object.assign(s.connections.profiles[r.id], {
        ageOffset: 27 + i * 3,
        job: i ? "Teacher" : "Technician",
        weeklyPay: i ? 850 : 950,
        wealth: 10000,
        plans: "Raising you and supporting your childhood",
      });
  }
  if (!legacy && age(s) < 12)
    for (const m of MILESTONES.filter((m) => m.age <= age(s))) remember(s, m);
}
function remember(s, m) {
  if (s.childhood.milestones.some((x) => x.id === m.id)) return;
  s.childhood.milestones.push({
    id: m.id,
    age: m.age,
    week: s.week,
    text: m.text,
  });
  log(s, m.text);
}
export function prepareChildhood(s) {
  const a = age(s),
    c = s.childhood;
  if (a !== c.lastAge) {
    if (s.calendar.mode === "automatic") s.calendar.sleep = recommendedSleep(s);
    c.lastAge = a;
    for (const m of MILESTONES.filter((m) => m.age === a)) remember(s, m);
  }
  if (a >= 5 && a < 18 && !s.school.enrolled) s.school.enrolled = true;
  if (
    a >= 5 &&
    a < 12 &&
    !s.relationships.some((r) => r.id === "sam") &&
    s.relationships.length < 8
  ) {
    s.relationships.push({
      id: "sam",
      name: "Sam Taylor",
      role: "Best friend",
      bond: 55,
      icon: "ST",
      color: "blue",
    });
    ensurePeople(s);
    log(s, "You made a school friend: Sam Taylor.");
  }
  const interest = CHILD_INTERESTS.find((i) => i.id === s.aspiration);
  if (
    a < 12 &&
    interest &&
    !careerPathReason(s, interest.id) &&
    interest.id !== "unemployed" &&
    a >= interest.minAge
  ) {
    if (interest.id === "football" && s.football.stage === "none") {
      s.football.stage = "school";
      s.football.club = "School football team";
      s.football.nextScoutWeek = s.week + 13;
      log(s, "Your family helped you join school football.");
    } else if (
      ["racing", "basketball", "tennis"].includes(interest.id) &&
      s.sports[interest.id].stage === "none"
    ) {
      const d = SPORTS.find((d) => d.id === interest.id);
      s.sports[interest.id].stage = "local";
      s.sports[interest.id].club = d.start;
      s.sports[interest.id].nextScoutWeek = s.week + 13;
      log(s, `Your family helped you start ${interest.name.toLowerCase()}.`);
    } else if (interest.id === "music" && !s.music.active) {
      s.music.active = true;
      log(s, "Your family helped you start music lessons.");
    }
  }
}
export function childhoodWeek(s) {
  const a = age(s),
    d = s.childhood.development;
  d.movement = clamp(d.movement + (a < 3 ? 0.35 : 0.05));
  d.language = clamp(d.language + (a < 5 ? 0.35 : 0.06));
  d.curiosity = clamp(d.curiosity + 0.01);
  if (a >= 3) s.skills.knowledge = clamp(s.skills.knowledge + 0.025);
  if (a >= 5) s.skills.empathy = clamp(s.skills.empathy + 0.015);
  s.energy = clamp(s.energy + 3);
  s.happiness = clamp(s.happiness + 0.1);
  for (const r of s.relationships)
    if (r.role === "Parent") r.bond = clamp(r.bond + 0.01);
}
export function guardianSupport(s) {
  if (age(s) >= 12) return;
  const parents = s.relationships.filter(
    (r) => r.role === "Parent" && relativeAlive(s, r.id),
  );
  const fees =
    (s.football.stage === "school" ? 5 : 0) +
    SPORTS.reduce(
      (n, d) => n + (s.sports[d.id].stage === "local" ? d.entryFee : 0),
      0,
    );
  let due = childhoodAllowance(s) + fees;
  for (const r of parents) {
    const p = s.connections.profiles[r.id],
      paid = Math.min(p.wealth, due);
    p.wealth -= paid;
    due -= paid;
  }
}
export function childhoodActivity(state, id) {
  const a = CHILD_ACTIVITIES.find((x) => x.id === id);
  if (state.ended || age(state) >= 18 || !a || age(state) < a.minAge)
    throw new Error("Choose an activity available at your age.");
  if (state.event) throw new Error("Make your pending life choice first.");
  if (!state.actions)
    throw new Error(
      "Use next week or age up to make time for another activity.",
    );
  if (state.childhood.activities[id] === state.week)
    throw new Error("You have already done this activity this week.");
  const s = structuredClone(state);
  if (age(s) >= 5) spendTime(s, 2, "Childhood activity");
  s.actions--;
  s.childhood.activities[id] = s.week;
  const d = s.childhood.development;
  d.confidence = clamp(d.confidence + 0.5);
  if (id === "play" || id === "explore") {
    d.movement = clamp(d.movement + 1);
    d.curiosity = clamp(d.curiosity + 0.5);
    if (age(s) >= 3) s.skills.athletics = clamp(s.skills.athletics + 0.25);
  }
  if (id === "read") {
    d.language = clamp(d.language + 1);
    s.skills.knowledge = clamp(s.skills.knowledge + 0.5);
  }
  if (id === "study") {
    s.school.grade = clamp(s.school.grade + 1);
    s.skills.knowledge = clamp(s.skills.knowledge + 0.5);
  }
  if (id === "family")
    for (const r of s.relationships.filter(
      (r) => r.role === "Parent" && relativeAlive(s, r.id),
    )) {
      r.bond = clamp(r.bond + 2);
      s.connections.profiles[r.id].trust = clamp(
        s.connections.profiles[r.id].trust + 1,
      );
    }
  if (id === "friends") {
    s.skills.charisma = clamp(s.skills.charisma + 0.5);
    for (const r of s.relationships.filter((r) => r.role === "Best friend"))
      r.bond = clamp(r.bond + 2);
  }
  s.happiness = clamp(s.happiness + 1);
  log(s, `${a.name}: a little moment in your childhood.`);
  return s;
}
export function chooseChildInterest(state, id) {
  const choice = CHILD_INTERESTS.find((i) => i.id === id);
  if (state.ended || age(state) >= 18 || !choice || age(state) < choice.minAge)
    throw new Error("This interest is not available at your age yet.");
  if (state.event) throw new Error("Make your pending life choice first.");
  if (!state.actions) throw new Error("You need a free-time action.");
  let s = structuredClone(state);
  if (id === "football" && ["none", "retired"].includes(s.football.stage))
    s = joinFootball(s);
  else if (
    ["racing", "basketball", "tennis"].includes(id) &&
    ["none", "retired"].includes(s.sports[id].stage)
  )
    s = joinSport(s, id);
  else {
    s.actions--;
    if (id === "music")
      s = configureMusic(s, { role: s.music.role, genre: s.music.genre });
  }
  s.aspiration = id;
  log(
    s,
    `You are exploring ${choice.name.toLowerCase()}. Your future is still open.`,
  );
  return s;
}
export const CHILDHOOD_EVENTS = [
  {
    id: "baby-birthday",
    minAge: 1,
    maxAge: 1,
    tag: "YOUR FIRST YEAR",
    title: "A world to explore.",
    text: "Your family is helping you take your first steps. Familiar faces, sounds and toys fill your days.",
    options: [
      {
        label: "Reach for a familiar face",
        detail: "Family connection +2 · confidence +2",
        child: { family: 2, confidence: 2 },
      },
      {
        label: "Explore a new toy",
        detail: "Movement +2 · curiosity +2",
        child: { movement: 2, curiosity: 2 },
      },
    ],
  },
  {
    id: "toddler-words",
    minAge: 2,
    maxAge: 2,
    tag: "GROWING UP",
    title: "Finding your words.",
    text: "You are starting to say what you want. Your family listens and helps you learn.",
    options: [
      {
        label: "Ask about everything",
        detail: "Language +3 · curiosity +2",
        child: { language: 3, curiosity: 2 },
      },
      {
        label: "Sing along with your family",
        detail: "Language +2 · family connection +2",
        child: { language: 2, family: 2 },
      },
    ],
  },
  {
    id: "preschool-friend",
    minAge: 3,
    maxAge: 4,
    tag: "PRESCHOOL",
    title: "Someone wants to play.",
    text: "Another child offers you a turn with their building blocks. A grown-up stays nearby.",
    options: [
      {
        label: "Build something together",
        detail: "Confidence +2 · charisma +1",
        child: { confidence: 2, charisma: 1 },
      },
      {
        label: "Watch before joining in",
        detail: "Curiosity +2 · confidence +1",
        child: { curiosity: 2, confidence: 1 },
      },
    ],
  },
  {
    id: "first-school-day",
    minAge: 5,
    maxAge: 5,
    tag: "PRIMARY SCHOOL",
    title: "Your first school day.",
    text: "The classroom feels new and a little overwhelming. Your family helps you settle in.",
    options: [
      {
        label: "Ask the teacher for help",
        detail: "School grade +2 · confidence +2",
        child: { grade: 2, confidence: 2 },
      },
      {
        label: "Introduce yourself to someone",
        detail: "Charisma +2 · confidence +1",
        child: { charisma: 2, confidence: 1 },
      },
      {
        label: "Tell your family how you feel",
        detail: "Family connection +3 · confidence +1",
        child: { family: 3, confidence: 1 },
      },
    ],
  },
  {
    id: "child-pocket-money",
    minAge: 6,
    maxAge: 6,
    tag: "YOUR FIRST ALLOWANCE",
    title: "A little money of your own.",
    text: "Your family gives you $5 each week. Your basic needs and childhood club fees remain their responsibility.",
    options: [
      {
        label: "Save for something special",
        detail: "Curiosity +1 · finance +1; your existing cash stays yours",
        child: { curiosity: 1, finance: 1 },
      },
      {
        label: "Ask how the family budget works",
        detail: "Knowledge +1 · family connection +2",
        child: { knowledge: 1, family: 2 },
      },
    ],
  },
  {
    id: "child-fair-play",
    minAge: 7,
    maxAge: 9,
    tag: "SCHOOL & FRIENDSHIP",
    title: "A friend feels left out.",
    text: "A classmate has not been invited into a playground game. You decide how to respond.",
    options: [
      {
        label: "Invite them to join",
        detail: "Confidence +2 · empathy +2",
        child: { confidence: 2, empathy: 2 },
      },
      {
        label: "Ask a teacher to help",
        detail: "Confidence +1 · school grade +1",
        child: { confidence: 1, grade: 1 },
      },
      {
        label: "Stay with your current group",
        detail: "Confidence +1 · empathy −1",
        child: { confidence: 1, empathy: -1 },
      },
    ],
  },
  {
    id: "child-school-project",
    minAge: 10,
    maxAge: 11,
    tag: "LEARNING WHO YOU ARE",
    title: "A project that feels like yours.",
    text: "Your teacher invites you to make something for the school showcase. This is a chance to discover what you enjoy.",
    options: [
      {
        label: "Build a model and explain it",
        detail: "Technical +2 · knowledge +1",
        child: { technical: 2, knowledge: 1 },
      },
      {
        label: "Write and perform a short song",
        detail: "Charisma +2 · language +2",
        child: { charisma: 2, language: 2 },
      },
      {
        label: "Organise a team activity",
        detail: "Confidence +2 · empathy +1",
        child: { confidence: 2, empathy: 1 },
      },
    ],
  },
  {
    id: "secondary-start",
    minAge: 12,
    maxAge: 12,
    tag: "SECONDARY SCHOOL",
    title: "A bigger school, a new chapter.",
    text: "Your new school has clubs, older students and more demanding lessons. You can decide where to put your energy.",
    options: [
      {
        label: "Make a study plan",
        detail: "School grade +3 · knowledge +2",
        child: { grade: 3, knowledge: 2 },
      },
      {
        label: "Get to know your classmates",
        detail: "Confidence +3 · charisma +2",
        child: { confidence: 3, charisma: 2 },
      },
      {
        label: "Balance lessons and your interests",
        detail: "School grade +1 · confidence +2",
        child: { grade: 1, confidence: 2 },
      },
    ],
  },
];
export function childhoodEvent(s) {
  const choices = CHILDHOOD_EVENTS.filter(
    (e) => age(s) >= e.minAge && age(s) <= e.maxAge,
  );
  return choices.length
    ? structuredClone(
        choices[(Math.floor(s.week / 52) + s.startAge) % choices.length],
      )
    : null;
}
export function resolveChildhoodEffects(s, event, option) {
  if (!CHILDHOOD_EVENTS.some((e) => e.id === event.id)) return;
  for (const [key, value] of Object.entries(option.child || {})) {
    if (Object.hasOwn(s.childhood.development, key))
      s.childhood.development[key] = clamp(
        s.childhood.development[key] + value,
      );
    else if (key === "family")
      for (const r of s.relationships.filter(
        (r) => r.role === "Parent" && relativeAlive(s, r.id),
      ))
        r.bond = clamp(r.bond + value);
    else if (key === "grade") s.school.grade = clamp(s.school.grade + value);
    else if (Object.hasOwn(s.skills, key))
      s.skills[key] = clamp(s.skills[key] + value);
  }
  s.childhood.choices.unshift({
    week: s.week,
    title: event.title,
    choice: option.label,
  });
  s.childhood.choices = s.childhood.choices.slice(0, 40);
}
export function validateChildhood(s) {
  const c = s.childhood,
    n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = Infinity) => n(v, min, max) && Number.isInteger(v),
    fail = () => {
      throw new Error("Invalid childhood data in save.");
    };
  if (
    !c ||
    typeof c.startedAtBirth !== "boolean" ||
    !int(c.lastAge, 0, age(s)) ||
    ["movement", "language", "curiosity", "confidence"].some(
      (k) => !n(c.development?.[k], 0, 100),
    ) ||
    !Array.isArray(c.milestones) ||
    c.milestones.length > 9 ||
    new Set(c.milestones.map((x) => x.id)).size !== c.milestones.length ||
    c.milestones.some(
      (x) =>
        !MILESTONES.some((m) => m.id === x.id && m.age === x.age) ||
        !int(x.week, 0, s.week) ||
        x.age > age(s) ||
        typeof x.text !== "string",
    ) ||
    !c.activities ||
    typeof c.activities !== "object" ||
    Array.isArray(c.activities) ||
    Object.entries(c.activities).some(
      ([id, w]) =>
        !CHILD_ACTIVITIES.some((a) => a.id === id) || !int(w, 0, s.week),
    ) ||
    !Array.isArray(c.choices) ||
    c.choices.length > 40 ||
    c.choices.some(
      (x) =>
        !int(x.week, 0, s.week) ||
        typeof x.title !== "string" ||
        typeof x.choice !== "string",
    )
  )
    fail();
}
