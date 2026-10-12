import {
  COUNTRIES,
  placeCountry,
  knownCity,
  townTemplate,
} from "./geography.js";
import { availableCash, rng, TRACK_SKILLS, jobDefinition } from "./world.js";
import { spendTime, calendarForecast } from "./calendar.js";
import { relativeAlive } from "./life-course.js";
import {
  PERSONALITY,
  growPersonality,
  personalityModifier,
} from "./personality.js";
export { PERSONALITY } from "./personality.js";

const ORIGINAL_TOWNS = {
  London: {
    scale: 1,
    school: "Riverside School",
    club: "Riverside Community Sports",
    venue: "The Junction Arts Centre",
    employer: "High Street Traders",
    neighbourhood: "Riverside",
  },
  Copenhagen: {
    scale: 0.9,
    school: "Harbour School",
    club: "Harbour Community Sports",
    venue: "Harbour House Studios",
    employer: "City Cooperative",
    neighbourhood: "Harbour district",
  },
  "New York": {
    scale: 1.15,
    school: "Parkside School",
    club: "Parkside Community Sports",
    venue: "Parkside Creative Rooms",
    employer: "Neighbourhood Market",
    neighbourhood: "Parkside",
  },
  Monaco: {
    scale: 1.6,
    school: "Hillside School",
    club: "Hillside Sporting Centre",
    venue: "Marina Arts Workshop",
    employer: "Marina Services",
    neighbourhood: "Marina district",
  },
};
export const HOMETOWNS = new Proxy(ORIGINAL_TOWNS, {
  get: (target, key) =>
    target[key] ||
    (typeof key === "string" && knownCity(key) ? townTemplate(key) : undefined),
  getOwnPropertyDescriptor: (target, key) =>
    Object.getOwnPropertyDescriptor(target, key) ||
    (typeof key === "string" && knownCity(key)
      ? { configurable: true, enumerable: true, value: townTemplate(key) }
      : undefined),
});
export const PROFILE_OPTIONS = {
  nationality: [
    ...new Set(COUNTRIES.map((c) => c.nationality)),
    "British",
    "Danish",
    "American",
    "Monegasque",
    "French",
    "German",
    "Italian",
    "Spanish",
    "Brazilian",
    "Japanese",
    "Other / unspecified",
  ],
  pronouns: ["They / them", "She / her", "He / him"],
  skin: ["Porcelain", "Light", "Olive", "Medium", "Tan", "Deep", "Rich deep"],
  hair: ["Black", "Brown", "Blonde", "Red", "Grey"],
  hairstyle: [
    "Short",
    "Long",
    "Curly",
    "Shaved",
    "Buzz cut",
    "Fade",
    "Side part",
    "Ponytail",
    "Bob",
    "Braids",
    "Dreadlocks",
    "Afro",
    "Space buns",
    "Wolf cut",
    "Pompadour",
  ],
  eyes: ["Brown", "Blue", "Green", "Grey"],
  outfit: ["Green", "Blue", "Purple", "Orange", "Black"],
  face: ["Oval", "Round", "Angular"],
  eyebrows: ["Natural", "Arched", "Thick"],
  facialHair: ["None", "Stubble", "Beard", "Moustache"],
  garment: [
    "T-shirt",
    "Hoodie",
    "Jacket",
    "Shirt",
    "Suit",
    "Knitwear",
    "Formal",
  ],
};
export const LIFE_PATHS = {
  football: {
    name: "Football",
    age: 5,
    skill: "athletics",
    fee: 10,
    craft: "Ball work & positioning",
  },
  racing: {
    name: "Motorsport",
    age: 6,
    skill: "driving",
    fee: 60,
    craft: "Racecraft & simulator practice",
  },
  basketball: {
    name: "Basketball",
    age: 6,
    skill: "athletics",
    fee: 10,
    craft: "Shooting & court awareness",
  },
  tennis: {
    name: "Tennis",
    age: 6,
    skill: "athletics",
    fee: 25,
    craft: "Serve & movement practice",
  },
  music: {
    name: "Music",
    age: 6,
    skill: "knowledge",
    fee: 20,
    craft: "Studio craft & songwriting",
  },
  creator: {
    name: "Content creation",
    age: 13,
    skill: "charisma",
    fee: 15,
    craft: "Recording & editing",
  },
  office: {
    name: "Work",
    age: 18,
    skill: "technical",
    fee: 0,
    craft: "Professional development",
  },
  business: {
    name: "Business",
    age: 18,
    skill: "business",
    fee: 0,
    craft: "Product & customer research",
  },
  investor: {
    name: "Investing",
    age: 18,
    skill: "finance",
    fee: 0,
    craft: "Research & portfolio review",
  },
  school: {
    name: "School",
    age: 5,
    skill: "knowledge",
    fee: 0,
    craft: "Revision & independent learning",
  },
};
export const ROUTINE_FOCUS = {
  craft: "Develop your craft",
  fitness: "Conditioning",
  recover: "Rest & recovery",
  network: "Communication & connections",
};
const sports = ["football", "racing", "basketball", "tennis"];
const age = (s) => s.startAge + Math.floor(s.week / 52);
const clamp = (n) => Math.max(0, Math.min(100, n));
const round = (n) => Math.round(n * 100) / 100;
const actor = (s, path) => (path === "football" ? s.football : s.sports[path]);
const audience = (s) =>
  Object.values(s.social.profiles).reduce((n, p) => n + p.followers, 0);
export const PERSONAL_GOALS = [
  ...sports.map((path) => ({
    id: `${path}-pro`,
    name: `Earn a professional ${LIFE_PATHS[path].name.toLowerCase()} contract`,
    minAge: LIFE_PATHS[path].age,
    done: (s) =>
      !!actor(s, path).contract && s.career === path && !!s.employment,
  })),
  {
    id: "release",
    name: "Release your first track",
    minAge: 6,
    done: (s) => s.music.releases.length > 0,
  },
  {
    id: "audience",
    name: "Reach 1,000 social followers",
    minAge: 13,
    done: (s) => audience(s) >= 1000,
  },
  {
    id: "qualification",
    name: "Earn a post-school qualification",
    minAge: 12,
    done: (s) => s.education.completed.some((id) => id !== "school"),
  },
  {
    id: "home",
    name: "Buy your first home",
    minAge: 18,
    done: (s) => s.housing.properties.length > 0,
  },
  {
    id: "marriage",
    name: "Get married",
    minAge: 18,
    done: (s) => s.relationships.some((r) => r.role === "Spouse"),
  },
  {
    id: "child",
    name: "Become a parent",
    minAge: 18,
    done: (s) => s.family.children.length > 0,
  },
  {
    id: "company",
    name: "Found a company",
    minAge: 18,
    done: (s) => !!s.company,
  },
  {
    id: "savings",
    name: "Build $100,000 in available cash",
    minAge: 18,
    done: (s) => availableCash(s) >= 100000,
  },
];
const observations = (s) => ({
  ...Object.fromEntries(PERSONAL_GOALS.map((g) => [g.id, g.done(s)])),
  "first-job": !!s.employment,
  graduation: s.education.completed.includes("school"),
  "first-race": s.sports.racing.events > 0,
  "first-match": s.football.matches > 0,
  "first-basketball": s.sports.basketball.events > 0,
  "first-tennis": s.sports.tennis.events > 0,
});
const memoryNames = {
  "first-job": "Your first paid contract",
  graduation: "School graduation",
  "first-race": "Your first motorsport outing",
  "first-match": "Your first football match",
  "first-basketball": "Your first basketball outing",
  "first-tennis": "Your first tennis outing",
  release: "Your first released track",
  audience: "Your first 1,000 social followers",
  qualification: "Your first post-school qualification",
  home: "Your first home purchase",
  marriage: "Your marriage",
  child: "Becoming a parent",
  company: "Founding your company",
  savings: "$100,000 in available cash",
};
function remember(s, text, kind = "moment") {
  s.characterLife.memories.unshift({ week: s.week, age: age(s), text, kind });
  s.characterLife.memories = s.characterLife.memories.slice(0, 120);
}
function log(s, text) {
  s.log.unshift({ week: s.week, text, kind: "milestone" });
  s.log = s.log.slice(0, 40);
}
export function initializeIdentity(s, { legacy = false } = {}) {
  const personality = Object.fromEntries(
    Object.keys(PERSONALITY).map((k) => [k, 50]),
  );
  s.characterLife = {
    profile: {
      nationality: {
        London: "British",
        Copenhagen: "Danish",
        "New York": "American",
        Monaco: "Monegasque",
      }[s.city],
      birthplace: s.city,
      pronouns: "They / them",
      skin: "Medium",
      hair: "Brown",
      hairstyle: "Short",
      eyes: "Brown",
      outfit: "Green",
      face: "Oval",
      eyebrows: "Natural",
      facialHair: "None",
      garment: "T-shirt",
    },
    personality,
    proPreview: false,
    seed: (s.seed ^ 0x57c4a731) >>> 0,
    parentInterests: {},
    support: null,
    supportRequestedWeek: null,
    supportHistory: [],
    routines: {},
    localOffers: [],
    localRound: -1,
    serial: 0,
    goal: null,
    completedGoals: [],
    observed: observations(s),
    memories: [],
    lastWeek: s.week,
  };
  for (const r of s.relationships.filter((r) => r.role === "Parent"))
    s.characterLife.parentInterests[r.id] = [
      "football",
      "racing",
      "basketball",
      "tennis",
      "music",
      "school",
    ][Math.floor(rng(s.characterLife) * 6)];
  if (!legacy) {
    if (s.startAge === 0) remember(s, `Born in ${s.city}.`, "birth");
    refreshLocalOffers(s);
  }
}
export const creatorAvailable = (s) =>
  s.debug.enabled || s.characterLife.proPreview;
export function setProPreview(state, enabled) {
  if (!state.debug.enabled || typeof enabled !== "boolean")
    throw new Error("Enable Debug to change local Pro preview access.");
  const s = structuredClone(state);
  s.characterLife.proPreview = enabled;
  const text = `${enabled ? "Enabled" : "Disabled"} local Pro preview; no paid entitlement is assigned.`;
  s.debug.edits.unshift({ week: s.week, text });
  s.debug.edits = s.debug.edits.slice(0, 20);
  log(s, text);
  return s;
}
export function validateProfile(fields) {
  for (const [key, options] of Object.entries(PROFILE_OPTIONS))
    if (Object.hasOwn(fields, key) && !options.includes(fields[key]))
      throw new Error(`Choose a valid ${key}.`);
  if (
    Object.hasOwn(fields, "birthplace") &&
    !Object.hasOwn(HOMETOWNS, fields.birthplace)
  )
    throw new Error("Choose a valid birthplace.");
  if (
    Object.hasOwn(fields, "name") &&
    (typeof fields.name !== "string" ||
      !fields.name.trim() ||
      fields.name.trim().length > 32)
  )
    throw new Error("Choose a name of 1–32 characters.");
}
export function editCharacterProfile(state, fields) {
  if (!creatorAvailable(state))
    throw new Error("Character customization requires Debug or Pro access.");
  if (state.ended) throw new Error("This life is complete.");
  if (
    !fields ||
    typeof fields !== "object" ||
    Array.isArray(fields) ||
    Object.keys(fields).some(
      (k) =>
        !["name", "birthplace", ...Object.keys(PROFILE_OPTIONS)].includes(k),
    )
  )
    throw new Error("Choose valid character profile fields.");
  validateProfile(fields);
  if (
    !state.debug.enabled &&
    (Object.hasOwn(fields, "nationality") ||
      Object.hasOwn(fields, "birthplace"))
  )
    throw new Error(
      "Birthplace is history; citizenship changes through naturalisation. Debug can override history.",
    );
  const s = structuredClone(state);
  for (const [key, value] of Object.entries(fields))
    if (key === "name") s.name = value.trim();
    else s.characterLife.profile[key] = value;
  if (s.globalLife && fields.birthplace)
    s.globalLife.birthCountry = placeCountry(fields.birthplace);
  return s;
}
export function routineAvailable(s, path) {
  if (!Object.hasOwn(LIFE_PATHS, path) || age(s) < LIFE_PATHS[path].age)
    return false;
  if (sports.includes(path))
    return !["none", "retired"].includes(actor(s, path).stage);
  if (path === "music") return s.music.active;
  if (path === "creator")
    return Object.values(s.social.profiles).some((p) => p.active);
  if (path === "school") return s.school.enrolled && age(s) < 18;
  if (path === "office") return !!s.employment && !sports.includes(s.career);
  if (path === "business") return !!s.company;
  return Object.values(s.holdings).some((n) => n > 0);
}
function action(state, hours, label, minAge = 5) {
  if (state.ended || state.event || !state.actions || age(state) < minAge)
    throw new Error(
      "You need an age-appropriate free action and no pending life choice.",
    );
  const s = structuredClone(state);
  spendTime(s, hours, label);
  s.actions--;
  return s;
}
export function setCareerRoutine(state, path, focus) {
  if (!routineAvailable(state, path))
    throw new Error(
      "Start this path through its normal activities before planning a routine.",
    );
  if (focus !== "none" && !Object.hasOwn(ROUTINE_FOCUS, focus))
    throw new Error("Choose a valid routine focus.");
  const previous = state.characterLife.routines[path];
  if (previous?.changedWeek === state.week)
    throw new Error("You can change this routine once per week.");
  const s = action(state, 1, "Plan your weekly routine"),
    old = s.characterLife.routines[path];
  s.characterLife.routines[path] = {
    focus,
    sessions: old?.sessions || 0,
    missed: old?.missed || 0,
    changedWeek: s.week,
    lastWeek: old?.lastWeek ?? null,
  };
  const f = calendarForecast(s);
  if (f.mandatory + f.spent + f.appointments > 168)
    throw new Error(
      "This routine does not fit your weekly commitments. Free time or pause another routine first.",
    );
  return s;
}
export function identityHours(s, week = s.week) {
  const c = s.characterLife;
  if (!c) return 0;
  const support =
    c.support &&
    age(s) < 18 &&
    c.support.endsWeek >= week &&
    c.support.startsWeek <= week &&
    routineAvailable(s, c.support.path);
  return (
    Object.entries(c.routines).filter(
      ([id, r]) => r.focus !== "none" && routineAvailable(s, id),
    ).length *
      3 +
    (support ? 2 : 0) +
    c.localOffers.filter(
      (o) => o.status === "booked" && o.performanceWeek === week,
    ).length *
      4
  );
}
export const parentTime = (s, id) => {
  const relative = s.lifeCourse.relatives[id];
  if (!relativeAlive(s, id) || relative?.health < 40) return 0;
  if (relative?.retired) return 6;
  return s.connections.profiles[id].weeklyPay >= 1800 ? 1 : 3;
};
export function requestPathSupport(state, path) {
  if (
    !sports.concat(["music", "creator"]).includes(path) ||
    !routineAvailable(state, path) ||
    age(state) >= 18
  )
    throw new Error(
      "Family coaching is for active childhood interests, before eighteen.",
    );
  const c = state.characterLife;
  if (
    c.support ||
    (c.supportRequestedWeek !== null &&
      state.week < c.supportRequestedWeek + 13)
  )
    throw new Error(
      "Family support requests have a thirteen-week cooldown; finish existing support first.",
    );
  const parents = state.relationships.filter(
    (r) =>
      r.role === "Parent" &&
      relativeAlive(state, r.id) &&
      r.bond >= 60 &&
      state.connections.profiles[r.id].trust >= 60 &&
      parentTime(state, r.id) > 0,
  );
  const fee = round(LIFE_PATHS[path].fee * HOMETOWNS[state.city].scale);
  const wealth = parents.reduce(
    (n, r) => n + state.connections.profiles[r.id].wealth,
    0,
  );
  if (
    !parents.length ||
    parents.reduce((n, r) => n + parentTime(state, r.id), 0) < 2 ||
    wealth * 0.05 < fee * 12
  )
    throw new Error(
      "Your family needs enough time, trust and savings for twelve weeks of coaching. Basic school and local play remain available.",
    );
  const s = action(state, 1, "Discuss family coaching", LIFE_PATHS[path].age);
  s.characterLife.supportRequestedWeek = s.week;
  const shared = parents.some((r) => c.parentInterests[r.id] === path);
  const agreed =
    s.school.grade >= 45 &&
    rng(s.characterLife) <
      Math.min(0.95, 0.6 + (shared ? 0.2 : 0) + parents[0].bond * 0.001);
  s.characterLife.supportHistory.unshift({ week: s.week, path, agreed });
  s.characterLife.supportHistory = s.characterLife.supportHistory.slice(0, 20);
  if (agreed) {
    s.characterLife.support = {
      path,
      city: s.city,
      parentIds: parents.map((r) => r.id),
      fee,
      startsWeek: s.week + 1,
      endsWeek: s.week + 12,
      sessions: 0,
      paid: 0,
    };
    const f = calendarForecast(s, { comingWeek: true });
    if (f.mandatory + f.spent + f.appointments > 168)
      throw new Error(
        "Family coaching needs two hours each week. Adjust your commitments first.",
      );
  }
  const text = agreed
    ? `Your family agreed to twelve weeks of ${LIFE_PATHS[path].name.toLowerCase()} coaching, funded from their own savings.`
    : "Your family asked you to focus on school or reconsider the extra coaching. A refusal does not end your existing hobby.";
  remember(s, text, "family");
  log(s, text);
  return s;
}
export function personalDevelopment(state, kind) {
  const choices = {
    confidence: { confidence: 1 },
    reflection: { patience: 1, empathy: 0.5 },
    discipline: { discipline: 1, ambition: 0.5 },
  };
  if (!Object.hasOwn(choices, kind))
    throw new Error("Choose a personal development activity.");
  const s = action(state, 2, "Personal development");
  if (s.characterLife.developmentWeek === s.week)
    throw new Error(
      "Make time next week for another personal development session.",
    );
  s.characterLife.developmentWeek = s.week;
  s.energy = clamp(s.energy - 3);
  growPersonality(s, choices[kind]);
  return s;
}
export function choosePersonalGoal(state, id) {
  if (state.event || state.ended)
    throw new Error("Resolve your life choice before changing goals.");
  const goal = PERSONAL_GOALS.find((g) => g.id === id);
  if (
    !goal ||
    age(state) < goal.minAge ||
    goal.done(state) ||
    state.characterLife.completedGoals.some((g) => g.id === id)
  )
    throw new Error(
      "Choose an age-appropriate goal you have not already achieved.",
    );
  const s = structuredClone(state);
  s.characterLife.goal = { id, chosenWeek: s.week };
  return s;
}
function refreshLocalOffers(s) {
  const c = s.characterLife,
    roundNumber = Math.floor(s.week / 13);
  if (c.localRound === roundNumber) return;
  c.localRound = roundNumber;
  c.localOffers = c.localOffers
    .filter(
      (o) =>
        o.status === "booked" ||
        (o.status === "offered" && o.expiresWeek > s.week),
    )
    .slice(-12);
  const paths = [...sports, "music", "creator", "school", "office"].filter(
    (id) =>
      age(s) >= (id === "office" ? 16 : LIFE_PATHS[id].age) &&
      (id !== "school" || age(s) < 18),
  );
  const selected = paths
    .map((path) => ({ path, order: rng(c) }))
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);
  for (const { path } of selected) {
    const town = HOMETOWNS[s.city];
    c.localOffers.push({
      id: `local:${c.serial++}`,
      path,
      city: s.city,
      venue:
        path === "music" || path === "creator"
          ? town.venue
          : path === "office"
            ? town.employer
            : path === "school"
              ? town.school
              : town.club,
      fee: round(
        (path === "school"
          ? 0
          : path === "office"
            ? 10
            : LIFE_PATHS[path].fee) * town.scale,
      ),
      createdWeek: s.week,
      expiresWeek: s.week + 13,
      status: "offered",
      performanceWeek: null,
    });
  }
}
export function bookLocalOpportunity(state, id) {
  const offer = state.characterLife.localOffers.find((o) => o.id === id);
  if (
    !offer ||
    offer.status !== "offered" ||
    offer.expiresWeek <= state.week ||
    offer.city !== state.city
  )
    throw new Error(
      "This local opportunity is no longer available in your city.",
    );
  if (
    age(state) < (offer.path === "office" ? 16 : LIFE_PATHS[offer.path].age) ||
    (offer.path === "school" && age(state) >= 18)
  )
    throw new Error("This workshop is not available at your age.");
  if (state.characterLife.localOffers.some((o) => o.status === "booked"))
    throw new Error(
      "Attend your booked local session before arranging another.",
    );
  if (availableCash(state) < offer.fee)
    throw new Error(
      "Save enough available cash for the workshop fee, or ask about family coaching.",
    );
  const s = action(state, 1, "Arrange a local workshop");
  s.money = round(s.money - offer.fee);
  const o = s.characterLife.localOffers.find((o) => o.id === id);
  o.status = "booked";
  o.performanceWeek = s.week + 1;
  const f = calendarForecast(s, { comingWeek: true });
  if (f.mandatory + f.spent + f.appointments > 168)
    throw new Error(
      "The workshop needs four hours next week. Adjust your calendar first.",
    );
  return s;
}
function developPath(s, path, amount) {
  const d = LIFE_PATHS[path];
  const skill =
    path === "office" && s.employment
      ? TRACK_SKILLS[jobDefinition(s.employment.jobId).track]
      : d.skill;
  s.skills[skill] = clamp(s.skills[skill] + amount * 0.3);
  if (sports.includes(path)) {
    const p = actor(s, path);
    if (routineAvailable(s, path) && !p.injuryWeeks)
      p.ability = clamp(p.ability + amount);
  } else if (path === "music" && s.music.active) {
    const key = { producer: "production", singer: "vocals", rapper: "lyrics" }[
      s.music.role
    ];
    s.music.skills[key] = clamp(s.music.skills[key] + amount);
  } else if (path === "creator" && routineAvailable(s, path))
    s.social.contentSkill = clamp(s.social.contentSkill + amount);
  else if (path === "school" && s.school.enrolled)
    s.school.grade = clamp(s.school.grade + amount * 0.2);
}
export function advanceIdentity(s) {
  const c = s.characterLife;
  if (!c || c.lastWeek >= s.week) return;
  c.lastWeek = s.week;
  for (const o of c.localOffers)
    if (
      o.status === "offered" &&
      (o.expiresWeek <= s.week || o.city !== s.city)
    )
      o.status = "expired";
  const forecast = s.calendar.last || calendarForecast(s);
  const hasTime =
    forecast.mandatory + forecast.spent + forecast.appointments <= 168;
  for (const o of c.localOffers.filter(
    (o) => o.status === "booked" && o.performanceWeek <= s.week,
  )) {
    const cancelled =
      o.city !== s.city || (o.path === "school" && age(s) >= 18);
    if (cancelled) {
      s.money = round(s.money + o.fee);
      o.status = "cancelled";
    } else if (
      hasTime &&
      s.energy >= 20 &&
      rng(c) < 0.9 + personalityModifier(s, "performance") * 0.01
    ) {
      o.status = "attended";
      developPath(s, o.path, 0.75);
      if (o.path === "music" && s.music.active) s.music.sessions++;
      growPersonality(s, { confidence: 0.3 });
      s.energy = clamp(s.energy - 4);
      remember(
        s,
        `Attended a ${LIFE_PATHS[o.path].name.toLowerCase()} workshop at ${o.venue}, ${o.city}.`,
        "local",
      );
    } else {
      o.status = "missed";
      remember(
        s,
        `Missed your booked session at ${o.venue}; the entry fee was spent.`,
        "local",
      );
    }
  }
  for (const [path, r] of Object.entries(c.routines)) {
    if (r.focus === "none" || !routineAvailable(s, path)) continue;
    if (
      !hasTime ||
      s.energy < 20 ||
      (sports.includes(path) &&
        actor(s, path).injuryWeeks &&
        r.focus !== "recover")
    ) {
      r.missed++;
      continue;
    }
    r.sessions++;
    r.lastWeek = s.week;
    if (r.focus === "craft") {
      developPath(
        s,
        path,
        0.15 * (1 + personalityModifier(s, "training") * 0.03),
      );
      growPersonality(s, { discipline: 0.05 });
      s.energy = clamp(s.energy - 2);
    }
    if (r.focus === "fitness") {
      s.lifeCourse.body.fitness = clamp(s.lifeCourse.body.fitness + 0.15);
      s.health = clamp(s.health + 0.1);
      s.energy = clamp(s.energy - 2);
    }
    if (r.focus === "recover") {
      s.energy = clamp(s.energy + 0.8);
      growPersonality(s, { patience: 0.05 });
    }
    if (r.focus === "network") {
      s.skills.charisma = clamp(s.skills.charisma + 0.08);
      growPersonality(s, { confidence: 0.05, empathy: 0.05 });
    }
  }
  const support = c.support;
  if (support) {
    const parents = s.relationships.filter(
      (r) =>
        support.parentIds.includes(r.id) &&
        relativeAlive(s, r.id) &&
        r.bond >= 60 &&
        s.connections.profiles[r.id].trust >= 60,
    );
    const wealth = parents.reduce(
      (n, r) => n + s.connections.profiles[r.id].wealth,
      0,
    );
    if (
      age(s) >= 18 ||
      s.week > support.endsWeek ||
      !parents.length ||
      parents.reduce((n, r) => n + parentTime(s, r.id), 0) < 2 ||
      wealth < support.fee ||
      !routineAvailable(s, support.path)
    ) {
      remember(
        s,
        "Your extra family coaching ended; no unearned money or qualification was awarded.",
        "family",
      );
      c.support = null;
    } else if (
      hasTime &&
      s.energy >= 20 &&
      !(sports.includes(support.path) && actor(s, support.path).injuryWeeks)
    ) {
      let remaining = support.fee;
      for (const r of parents) {
        const p = s.connections.profiles[r.id],
          paid = Math.min(p.wealth, remaining);
        p.wealth = round(p.wealth - paid);
        remaining = round(remaining - paid);
      }
      support.sessions++;
      support.paid = round(support.paid + support.fee);
      developPath(s, support.path, 0.25);
      if (support.path === "music") s.music.sessions++;
      s.energy = clamp(s.energy - 2);
      growPersonality(s, { discipline: 0.05 });
    }
  }
  if (age(s) >= 5)
    growPersonality(
      s,
      s.activity === "social"
        ? { empathy: 0.03 }
        : s.activity === "rest"
          ? { patience: 0.03 }
          : s.activity === "focus"
            ? { ambition: 0.03 }
            : { discipline: 0.02 },
    );
  const current = observations(s);
  for (const [id, completed] of Object.entries(current)) {
    if (completed && !c.observed[id])
      remember(
        s,
        memoryNames[id] || PERSONAL_GOALS.find((g) => g.id === id).name,
        "milestone",
      );
    c.observed[id] ||= completed;
  }
  if (c.goal && PERSONAL_GOALS.find((g) => g.id === c.goal.id).done(s)) {
    const text = `Achieved your goal: ${PERSONAL_GOALS.find((g) => g.id === c.goal.id).name}.`;
    c.completedGoals.push({ ...c.goal, achievedWeek: s.week });
    c.goal = null;
    s.happiness = clamp(s.happiness + 3);
    remember(s, text, "goal");
    log(s, text);
  }
  refreshLocalOffers(s);
}
export function validateIdentity(s) {
  const c = s.characterLife;
  const n = (v, min = 0, max = Infinity) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const int = (v, min = 0, max = Infinity) =>
    n(v, min, max) && Number.isInteger(v);
  const text = (v, max = 200) =>
    typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const list = (v, max) => Array.isArray(v) && v.length <= max;
  const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const fail = () => {
    throw new Error(
      "Invalid character identity, personality, routines or local opportunities.",
    );
  };
  if (
    !obj(c) ||
    !obj(c.profile) ||
    !obj(c.personality) ||
    typeof c.proPreview !== "boolean" ||
    (c.proPreview && !s.debug.used) ||
    !int(c.seed, 0, 4294967295) ||
    !int(c.serial) ||
    !int(c.localRound, -1) ||
    !int(c.lastWeek, 0, s.week) ||
    !obj(c.routines) ||
    !obj(c.parentInterests) ||
    !obj(c.observed)
  )
    fail();
  try {
    validateProfile(c.profile);
  } catch {
    fail();
  }
  if (
    Object.entries(PROFILE_OPTIONS).some(
      ([k, opts]) =>
        !(
          ["face", "eyebrows", "facialHair", "garment"].includes(k) &&
          c.profile[k] === undefined
        ) && !opts.includes(c.profile[k]),
    ) ||
    !Object.hasOwn(HOMETOWNS, c.profile.birthplace) ||
    Object.keys(PERSONALITY).some((k) => !n(c.personality[k], 0, 100))
  )
    fail();
  if (
    Object.entries(c.parentInterests).some(
      ([id, path]) =>
        !s.relationships.some((r) => r.id === id && r.role === "Parent") ||
        !sports.concat(["music", "school"]).includes(path),
    )
  )
    fail();
  if (
    Object.entries(c.routines).some(
      ([id, r]) =>
        !Object.hasOwn(LIFE_PATHS, id) ||
        !obj(r) ||
        !["none", ...Object.keys(ROUTINE_FOCUS)].includes(r.focus) ||
        !int(r.sessions) ||
        !int(r.missed) ||
        !int(r.changedWeek, 0, s.week) ||
        !(r.lastWeek === null || int(r.lastWeek, 0, s.week)),
    )
  )
    fail();
  if (
    !(
      c.supportRequestedWeek === null || int(c.supportRequestedWeek, 0, s.week)
    ) ||
    (c.developmentWeek !== undefined && !int(c.developmentWeek, 0, s.week))
  )
    fail();
  if (c.support !== null) {
    const a = c.support;
    if (
      !obj(a) ||
      !sports.concat(["music", "creator"]).includes(a.path) ||
      !list(a.parentIds, 8) ||
      !a.parentIds.length ||
      new Set(a.parentIds).size !== a.parentIds.length ||
      a.parentIds.some(
        (id) =>
          !s.relationships.some((r) => r.id === id && r.role === "Parent"),
      ) ||
      !Object.hasOwn(HOMETOWNS, a.city) ||
      a.fee !== round(LIFE_PATHS[a.path].fee * HOMETOWNS[a.city].scale) ||
      !n(a.fee, 1, 100) ||
      !int(a.startsWeek, 1, s.week + 1) ||
      a.endsWeek !== a.startsWeek + 11 ||
      !int(a.sessions, 0, 12) ||
      !n(a.paid, 0, 1200) ||
      round(a.paid) !== round(a.sessions * a.fee)
    )
      fail();
  }
  if (
    !list(c.supportHistory, 20) ||
    c.supportHistory.some(
      (r) =>
        !int(r.week, 0, s.week) ||
        !sports.concat(["music", "creator"]).includes(r.path) ||
        typeof r.agreed !== "boolean",
    )
  )
    fail();
  if (
    !list(c.localOffers, 16) ||
    new Set(c.localOffers.map((o) => o.id)).size !== c.localOffers.length ||
    c.localOffers.some(
      (o) =>
        !obj(o) ||
        !text(o.id, 60) ||
        !sports
          .concat(["music", "creator", "office", "school"])
          .includes(o.path) ||
        !Object.hasOwn(HOMETOWNS, o.city) ||
        !text(o.venue, 80) ||
        !n(o.fee, 0, 100) ||
        o.fee !==
          round(
            (o.path === "school"
              ? 0
              : o.path === "office"
                ? 10
                : LIFE_PATHS[o.path].fee) * HOMETOWNS[o.city].scale,
          ) ||
        !int(o.createdWeek, 0, s.week) ||
        o.expiresWeek !== o.createdWeek + 13 ||
        !int(o.expiresWeek) ||
        ![
          "offered",
          "booked",
          "attended",
          "missed",
          "expired",
          "cancelled",
        ].includes(o.status) ||
        !(o.performanceWeek === null || int(o.performanceWeek, 1)) ||
        (o.status === "booked" && o.performanceWeek !== s.week + 1),
    )
  )
    fail();
  const validGoal = (g) =>
    obj(g) &&
    PERSONAL_GOALS.some((d) => d.id === g.id) &&
    int(g.chosenWeek, 0, s.week);
  if (
    !(c.goal === null || validGoal(c.goal)) ||
    !list(c.completedGoals, PERSONAL_GOALS.length) ||
    new Set(c.completedGoals.map((g) => g.id)).size !==
      c.completedGoals.length ||
    c.completedGoals.some(
      (g) => !validGoal(g) || !int(g.achievedWeek, g.chosenWeek, s.week),
    ) ||
    (c.goal && c.completedGoals.some((g) => g.id === c.goal.id))
  )
    fail();
  if (
    Object.values(c.observed).some((v) => typeof v !== "boolean") ||
    !list(c.memories, 120) ||
    c.memories.some(
      (m) =>
        !int(m.week, 0, s.week) ||
        !int(m.age, 0, 100) ||
        !text(m.text) ||
        !["moment", "birth", "family", "local", "milestone", "goal"].includes(
          m.kind,
        ),
    )
  )
    fail();
}
