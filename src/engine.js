import {
  initializeCareerSupport,
  validateCareerSupport,
  advanceCareerSupport,
  careerSupportCosts,
} from "./career-support.js";
export * from "./career-support.js";
import { equipmentRequirements } from "./career-equipment.js";
export {
  buyCareerEquipment,
  careerEquipmentGroups,
  musicStudioBonus,
} from "./career-equipment.js";
import {
  initializeChildhood,
  prepareChildhood,
  childhoodWeek,
  guardianSupport,
  childhoodAllowance,
  childhoodEvent,
  CHILDHOOD_EVENTS,
  resolveChildhoodEffects,
  validateChildhood,
} from "./childhood.js";
export * from "./childhood.js";
import {
  initializeWorld,
  advanceWorld,
  validateWorld,
  tuitionDue,
  availableCash,
  privateOwnershipValue,
  collectibleValue,
  BUSINESSES,
  rng,
  jobDefinition,
} from "./world.js";
export * from "./world.js";
export const VERSION = 7;
import {
  initializeBanking,
  validateBanking,
  startBankingWeek,
  advanceBanking,
  receiveIncome,
  bankNetWorth,
  bankWeeklyCosts,
  recordTrade,
  recordCapitalGain,
} from "./banking.js";
import {
  initializeSeasons,
  prepareSeasons,
  advanceSeasons,
  validateSeasons,
  sportingCosts,
  agentCommission,
} from "./seasons.js";
import {
  initializeStories,
  advanceStories,
  validateStories,
  eligibleStoryEvents,
  STORY_EVENTS,
  storyWeeklyCosts,
  resolveStoryEffects,
} from "./stories.js";
export * from "./banking.js";
export * from "./seasons.js";
export * from "./stories.js";
import { EXTRA_CAREERS } from "./career-data.js";
import {
  initializeCalendar,
  prepareCalendar,
  finishCalendar,
  validateCalendar,
  spendTime,
} from "./calendar.js";
import {
  initializeWorkLife,
  advanceWorkLife,
  validateWorkLife,
  pensionContribution,
  employmentIncome,
  pensionDue,
} from "./careers.js";
import {
  initializeConnections,
  ensurePeople,
  advanceConnections,
  validateConnections,
  childExtraCosts,
} from "./connections.js";
export * from "./calendar.js";
export * from "./careers.js";
export * from "./connections.js";
import {
  initializeEveryday,
  advanceEveryday,
  validateEveryday,
  personalLivingCosts,
  householdCosts,
  propertyCosts,
  housingEquity,
  recordMilestones,
  EVERYDAY_EVENTS,
  everydayEvents,
  resolveEverydayEffects,
} from "./everyday.js";
export * from "./everyday.js";
export * from "./debug.js";
import { EXTRA_SHOP, STUDIO_ITEMS } from "./catalogue.js";
import {
  initializeLife,
  advanceLife,
  validateLife,
  footballCosts,
  sportCosts,
} from "./life.js";
export * from "./life.js";
export const CAREERS = {
  ...EXTRA_CAREERS,
  basketball: {
    name: "Basketball",
    skill: "athletics",
    icon: "trophy",
    color: "orange",
    pay: [0],
    roles: ["School & local basketball"],
    entry: 0,
  },
  tennis: {
    name: "Tennis",
    skill: "athletics",
    icon: "trophy",
    color: "yellow",
    pay: [0],
    roles: ["Local tennis"],
    entry: 0,
  },
  music: {
    name: "Music: singer, rapper or producer",
    skill: "charisma",
    icon: "music",
    color: "purple",
    pay: [0],
    roles: ["Musician"],
    entry: 0,
  },
  creator: {
    name: "Creator: influencer, YouTuber or streamer",
    skill: "charisma",
    icon: "video",
    color: "blue",
    pay: [0],
    roles: ["Content creator"],
    entry: 0,
  },
  unemployed: {
    name: "Looking for work",
    subtitle: "Find your next opportunity.",
    icon: "briefcase",
    skill: "business",
    color: "blue",
    entry: 0,
    roles: ["Looking for work"],
    pay: [0],
  },
  office: {
    name: "The 9–5",
    subtitle: "Stability. Ambition. Your own balance.",
    icon: "briefcase",
    skill: "business",
    color: "blue",
    entry: 0,
    roles: [
      "Office assistant",
      "Project coordinator",
      "Department manager",
      "Director",
      "Chief executive",
    ],
    pay: [650, 1050, 2100, 4500, 11000],
  },
  football: {
    name: "Football",
    subtitle: "From the local pitch to the world stage.",
    icon: "football",
    skill: "athletics",
    color: "green",
    entry: 0,
    roles: [
      "Amateur player",
      "Academy prospect",
      "First-team player",
      "International player",
      "World-class player",
    ],
    pay: [100, 400, 3500, 15000, 65000],
  },
  racing: {
    name: "Motorsport",
    subtitle: "Every champion starts on the grid.",
    icon: "flag",
    skill: "driving",
    color: "orange",
    entry: 1500,
    roles: [
      "Karting rookie",
      "Formula 4 driver",
      "Formula 3 driver",
      "Formula 2 driver",
      "Formula 1 driver",
    ],
    pay: [80, 350, 2000, 8000, 45000],
  },
  business: {
    name: "Entrepreneur",
    subtitle: "Build something bigger than yourself.",
    icon: "rocket",
    skill: "business",
    color: "purple",
    entry: 2500,
    roles: [
      "Solo founder",
      "Startup founder",
      "Growing company CEO",
      "Scale-up CEO",
      "Global company CEO",
    ],
    pay: [150, 900, 5000, 22000, 90000],
  },
  investor: {
    name: "Investor",
    subtitle: "Let your money open new doors.",
    icon: "chart",
    skill: "finance",
    color: "yellow",
    entry: 0,
    roles: [
      "Independent investor",
      "Portfolio builder",
      "Fund partner",
      "Fund manager",
      "Investment magnate",
    ],
    pay: [0, 250, 1500, 6500, 30000],
  },
};
export const ACTIVITIES = {
  balanced: {
    name: "Find your balance",
    description: "Steady career progress with time for yourself.",
    skill: null,
    gain: 2,
    energy: 2,
    happiness: 3,
    health: 1,
  },
  focus: {
    name: "Go all in",
    description: "Faster career progress. More demanding weeks.",
    skill: null,
    gain: 5,
    energy: -8,
    happiness: -2,
    health: -1,
  },
  train: {
    name: "Train & compete",
    description: "Build athletic ability and driving technique.",
    skill: "athletics",
    gain: 3,
    energy: -4,
    happiness: 2,
    health: 2,
  },
  study: {
    name: "Learn & develop",
    description: "Grow your business and financial knowledge.",
    skill: "finance",
    gain: 3,
    energy: -3,
    happiness: 0,
    health: 0,
  },
  social: {
    name: "Make connections",
    description: "Invest in the people around you.",
    skill: "charisma",
    gain: 4,
    energy: 1,
    happiness: 6,
    health: 0,
  },
  rest: {
    name: "Take a breath",
    description: "Less progress, more energy and wellbeing.",
    skill: null,
    gain: 0,
    energy: 18,
    happiness: 7,
    health: 4,
  },
};
export const MARKETS = [
  {
    id: "index",
    name: "Global index fund",
    symbol: "GLBX",
    risk: "Low",
    price: 120,
    volatility: 0.015,
    drift: 0.0011,
    yield: 0.018,
    color: "green",
    type: "Fund",
    volume: 50000,
  },
  {
    id: "tech",
    name: "Horizon Technologies",
    symbol: "HRZN",
    risk: "Medium",
    price: 85,
    volatility: 0.035,
    drift: 0,
    color: "blue",
    type: "Listed company",
    volume: 250000,
  },
  {
    id: "energy",
    name: "Solstice Energy",
    symbol: "SOL",
    risk: "Medium",
    price: 42,
    volatility: 0.03,
    drift: 0,
    color: "yellow",
    type: "Listed company",
    volume: 200000,
  },
  {
    id: "crypto",
    name: "Nova digital asset",
    symbol: "NOVA",
    risk: "High",
    price: 250,
    volatility: 0.1,
    drift: 0,
    color: "purple",
    type: "Crypto",
    fractional: true,
    volume: 100000,
  },
  {
    id: "bonds",
    name: "Government bond fund",
    symbol: "GOVT",
    risk: "Low",
    price: 100,
    volatility: 0.002,
    drift: 0.035 / 52,
    yield: 0.035,
    color: "blue",
    type: "Bonds",
    volume: 100000,
  },
  {
    id: "property",
    name: "City property trust",
    symbol: "REIT",
    risk: "Medium",
    price: 60,
    volatility: 0.025,
    drift: 0.0012,
    yield: 0.04,
    color: "orange",
    type: "Property fund",
    volume: 50000,
  },
];
export const SHOP = [
  ...EXTRA_SHOP,
  ...STUDIO_ITEMS,
  {
    id: "watch",
    name: "The everyday watch",
    category: "Style",
    price: 350,
    upkeep: 0,
    happiness: 3,
    icon: "watch",
    color: "blue",
    description: "A small detail that makes the day yours.",
  },
  {
    id: "gym",
    name: "Training studio membership",
    category: "Wellbeing",
    price: 300,
    upkeep: 20,
    happiness: 2,
    icon: "heart",
    color: "green",
    description: "A place to build a healthier routine.",
  },
  {
    id: "bike",
    name: "Weekend road bike",
    category: "Wellbeing",
    price: 750,
    upkeep: 0,
    happiness: 4,
    icon: "heart",
    color: "orange",
    description: "Clear your head. Adds a health bonus during training weeks.",
  },
  {
    id: "laptop",
    name: "Your next big idea",
    category: "Workspace",
    price: 1400,
    upkeep: 0,
    happiness: 3,
    icon: "briefcase",
    color: "blue",
    description: "A capable laptop. Learn business faster during study weeks.",
  },
  {
    id: "sim-rig",
    name: "Apex racing simulator",
    category: "Hobbies",
    price: 3200,
    upkeep: 5,
    happiness: 6,
    icon: "flag",
    color: "orange",
    description:
      "Bring the track home. Builds extra driving skill in training weeks.",
  },
  {
    id: "piano",
    name: "A little room for music",
    category: "Hobbies",
    price: 1200,
    upkeep: 0,
    happiness: 5,
    icon: "spark",
    color: "purple",
    description: "A digital piano. Makes your quiet weeks a little happier.",
  },
  {
    id: "car",
    name: "City electric",
    category: "Garage",
    price: 22000,
    upkeep: 45,
    happiness: 7,
    icon: "car",
    color: "blue",
    description: "Your first set of keys. Your own way home.",
  },
  {
    id: "apartment",
    name: "A place of your own",
    category: "Property",
    price: 160000,
    upkeep: 100,
    happiness: 10,
    icon: "home",
    color: "orange",
    description: "A bright city apartment. Replaces your rent.",
  },
  {
    id: "sports-car",
    name: "Apex GT",
    category: "Garage",
    price: 145000,
    upkeep: 250,
    happiness: 12,
    icon: "car",
    color: "purple",
    description: "A little less practical. A lot more you.",
  },
  {
    id: "villa",
    name: "Coastal retreat",
    category: "Property",
    price: 1200000,
    upkeep: 500,
    happiness: 15,
    icon: "home",
    color: "green",
    description: "Room to breathe, with a view worth the journey.",
  },
  {
    id: "yacht",
    name: "Beyond the horizon",
    category: "Travel",
    price: 4000000,
    upkeep: 2000,
    happiness: 20,
    icon: "flag",
    color: "blue",
    description: "A private yacht, and a reason to spend more time away.",
  },
  {
    id: "football-team",
    name: "Local football club",
    category: "Ownership",
    price: 750000,
    upkeep: 2000,
    happiness: 8,
    icon: "football",
    color: "green",
    description:
      "Run a club: balance youth development, results, and sponsorship.",
  },
  {
    id: "f1-team",
    name: "Formula 1 team",
    category: "Ownership",
    price: 250000000,
    upkeep: 250000,
    happiness: 20,
    icon: "flag",
    color: "orange",
    description: "Own the grid. Choose a team strategy and fund its future.",
  },
];
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const clone = (s) => structuredClone(s);
export const age = (s) => s.startAge + Math.floor(s.week / 52);
export const careerLevel = (s) => s.progress[s.career].level;
export const salary = (s) =>
  age(s) < 18 && !s.employment && s.career !== "business"
    ? childhoodAllowance(s)
    : s.employment
      ? employmentIncome(s)
      : s.career === "business" && s.company
        ? Math.round(
            Math.min(
              Math.max(0, s.company.cash),
              Math.max(0, s.company.profit) *
                (s.company.strategy === "reinvest"
                  ? 0
                  : s.company.strategy === "dividends"
                    ? 0.5
                    : 0.25),
            ) * 100,
          ) / 100
        : 0;
export const expenses = (
  s,
  { education = true, sports = true, properties = true, banking = true } = {},
) =>
  personalLivingCosts(
    s,
    s.inventory.includes("apartment") ||
      s.inventory.includes("villa") ||
      SHOP.some((i) => i.effects?.residence && s.inventory.includes(i.id)),
  ) +
  SHOP.filter(
    (i) => i.category !== "Ownership" && s.inventory.includes(i.id),
  ).reduce((n, i) => n + i.upkeep, 0) +
  householdCosts(s) +
  childExtraCosts(s) +
  pensionDue(s) +
  sportingCosts(s) +
  storyWeeklyCosts(s) +
  careerSupportCosts(s) +
  (banking ? bankWeeklyCosts(s) : 0) +
  (properties ? propertyCosts(s) : 0) +
  (s.money < 0 ? Math.ceil(-s.money * 0.005) : 0) +
  (education ? tuitionDue(s) : 0) +
  (sports ? footballCosts(s) + sportCosts(s) : 0);
export const primarySkill = (s) =>
  CAREERS[s.career === "unemployed" ? s.aspiration : s.career].skill;
export const portfolioValue = (s) =>
  MARKETS.reduce((n, m) => n + s.holdings[m.id] * s.market[m.id], 0);
export const netWorth = (s) =>
  s.money +
  housingEquity(s) +
  bankNetWorth(s) +
  (s.workLife?.pension || 0) +
  portfolioValue(s) +
  (s.company?.value || 0) +
  privateOwnershipValue(s) +
  collectibleValue(s) +
  SHOP.filter(
    (i) => i.category !== "Ownership" && s.inventory.includes(i.id),
  ).reduce((n, i) => n + i.price * 0.8, 0);
function random(s) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function addLog(s, text, kind = "info") {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
}
function changeStats(s, changes) {
  for (const k of ["health", "energy", "happiness"])
    if (changes[k]) s[k] = clamp(s[k] + changes[k]);
}
export function createGame({
  name = "Alex Morgan",
  age: startAge = 0,
  footballPosition = "Midfielder",
  city = "London",
  trait = "Ambitious",
  career = "unemployed",
  education = "school",
  seed = Date.now() >>> 0,
} = {}) {
  if (
    !Number.isInteger(Number(startAge)) ||
    Number(startAge) < 0 ||
    Number(startAge) > 60
  )
    throw new Error("Choose an age from birth to sixty.");
  if (education === "business-degree" && Number(startAge) < 21)
    throw new Error(
      "A completed degree background requires a starting age of at least 21.",
    );
  const s = {
    version: VERSION,
    name: String(name).trim().slice(0, 32) || "Alex Morgan",
    startAge: Number(startAge),
    city: ["London", "Copenhagen", "New York", "Monaco"].includes(city)
      ? city
      : "London",
    trait: ["Ambitious", "Social", "Analytical", "Athletic"].includes(trait)
      ? trait
      : "Ambitious",
    career: "office",
    week: 0,
    money: 12500,
    health: 85,
    energy: 80,
    happiness: 74,
    skills: {
      athletics: 15,
      driving: 12,
      business: 18,
      finance: 12,
      charisma: 20,
      knowledge: 15,
      technical: 15,
      empathy: 20,
    },
    progress: Object.fromEntries(
      Object.keys(CAREERS).map((k) => [
        k,
        { level: 0, weeks: 0, unlocked: k === career },
      ]),
    ),
    market: Object.fromEntries(MARKETS.map((m) => [m.id, m.price])),
    marketHistory: Object.fromEntries(MARKETS.map((m) => [m.id, [m.price]])),
    holdings: Object.fromEntries(MARKETS.map((m) => [m.id, 0])),
    inventory: [],
    relationships: [
      {
        id: "sam",
        name: "Sam Taylor",
        role: "Best friend",
        bond: 72,
        icon: "ST",
        color: "purple",
      },
      {
        id: "jordan",
        name: "Jordan Morgan",
        role: "Sibling",
        bond: 85,
        icon: "JM",
        color: "orange",
      },
    ],
    activity: "balanced",
    actions: 3,
    seed,
    event: null,
    log: [],
    history: [{ week: 0, value: 12500 }],
    teamStrategy: "balanced",
    teams: {},
    company: null,
    ended: false,
  };
  const bonus = {
    Ambitious: "business",
    Social: "charisma",
    Analytical: "finance",
    Athletic: "athletics",
  }[s.trait];
  s.skills[bonus] += 10;
  if (Object.hasOwn(CAREERS, career)) {
    s.career = career;
  }
  const background =
    ["none", "school", "business-degree"].includes(education) &&
    (education !== "business-degree" || s.startAge >= 21)
      ? education
      : "school";
  initializeWorld(s, { background });
  initializeLife(s, { footballPosition });
  initializeEveryday(s);
  initializeCalendar(s);
  initializeWorkLife(s);
  initializeConnections(s);
  initializeChildhood(s);
  initializeCareerSupport(s);
  initializeBanking(s);
  initializeSeasons(s);
  initializeStories(s);
  if (s.startAge < 12) {
    s.money = 0;
    for (const k of Object.keys(s.skills))
      s.skills[k] = ["athletics", "charisma", "empathy"].includes(k) ? 5 : 0;
  } else if (s.startAge < 18) s.money = 500;
  s.tradeVolumes = Object.fromEntries(MARKETS.map((m) => [m.id, 0]));
  s.history[0].value = netWorth(s);
  addLog(
    s,
    "A new chapter begins. Your future is yours to shape.",
    "milestone",
  );
  return s;
}
function writable(s) {
  if (s.ended)
    throw new Error("This life is complete. Start a new life to keep playing.");
}
export function chooseCareer(state) {
  writable(state);
  throw new Error(
    "Apply for an available job and accept an offer to change employment.",
  );
}
export function configureCompany(state, { name, sector, strategy }) {
  writable(state);
  if (!state.company) throw new Error("Found a company before configuring it.");
  if (
    !["Technology", "Consumer goods", "Clean energy"].includes(sector) ||
    !["balanced", "reinvest", "dividends"].includes(strategy)
  )
    throw new Error("Choose an available sector and strategy.");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 40)
    throw new Error("Give your company a name (1–40 characters).");
  const s = clone(state);
  s.company = { ...s.company, name: name.trim(), sector, strategy };
  addLog(s, `Set a new direction for ${s.company.name}.`);
  return s;
}
export function setActivity(state, id) {
  writable(state);
  if (!Object.hasOwn(ACTIVITIES, id)) throw new Error("Choose a weekly focus.");
  const s = clone(state);
  if (age(state) < 5 && !["balanced", "rest"].includes(id))
    throw new Error("Use supervised childhood activities at this age.");
  if (age(state) < 12 && ["focus", "train"].includes(id))
    throw new Error(
      "Use childhood activities and your school or club training.",
    );
  s.activity = id;
  return s;
}
export function invest(state, id, quantity) {
  writable(state);
  if (age(state) < 18)
    throw new Error("Independent investing requires age 18+.");
  const m = MARKETS.find((m) => m.id === id);
  if (
    !m ||
    !Number.isFinite(quantity) ||
    quantity === 0 ||
    (!m.fractional && !Number.isSafeInteger(quantity)) ||
    (m.fractional &&
      Math.abs(quantity - Math.round(quantity * 1e6) / 1e6) > 1e-10)
  )
    throw new Error(
      m?.fractional
        ? "Enter a quantity with at most six decimal places."
        : "Enter a whole number of units.",
    );
  const cost = Math.round(state.market[id] * quantity * 100) / 100;
  if (Math.abs(cost) < 1) throw new Error("The minimum trade value is $1.");
  if (quantity > 0 && cost > availableCash(state))
    throw new Error("Not enough uncommitted cash.");
  if (quantity < 0 && -quantity > state.holdings[id] + 1e-9)
    throw new Error("You cannot sell more units than you own.");
  if ((state.tradeVolumes[id] || 0) + Math.abs(quantity) > m.volume)
    throw new Error(
      "This order exceeds the remaining weekly market liquidity. Arrange a block acquisition for a large company stake.",
    );
  const issuer = BUSINESSES.find((b) => b.stock === id);
  if (issuer && state.holdings[id] + quantity > issuer.shares)
    throw new Error("There are not that many shares outstanding.");
  const s = clone(state);
  s.money = Math.round((s.money - cost) * 100) / 100;
  recordTrade(s, id, quantity, Math.abs(cost), s.holdings[id]);
  s.holdings[id] = Math.round((s.holdings[id] + quantity) * 1e6) / 1e6;
  s.tradeVolumes[id] = (s.tradeVolumes[id] || 0) + Math.abs(quantity);
  if (issuer && s.holdings[id] / issuer.shares <= 0.5)
    s.businessResults[issuer.id].strategy = "balanced";
  addLog(
    s,
    `${quantity > 0 ? "Bought" : "Sold"} ${Math.abs(quantity)} ${m.type === "Listed company" ? "shares" : "units"} of ${m.symbol}.`,
  );
  return s;
}
export function buy(state, id) {
  writable(state);
  const item = SHOP.find((i) => i.id === id);
  if (!item) throw new Error("This item is unavailable.");
  if (item.category === "Ownership")
    throw new Error(
      "Clubs and companies require a sale opportunity or an accepted acquisition offer.",
    );
  if (state.inventory.includes(id)) throw new Error("You already own this.");
  const requirements = equipmentRequirements(state, id);
  if (requirements.length)
    throw new Error(`Requires: ${requirements.join(", ")}.`);
  if (
    age(state) <
    (item.minAge ||
      (["Garage", "Property", "Travel"].includes(item.category) ? 18 : 12))
  )
    throw new Error("This purchase requires an older character.");
  if (availableCash(state) < item.price)
    throw new Error("Not enough available cash.");
  const s = clone(state);
  s.money -= item.price;
  s.inventory.push(id);
  changeStats(s, { happiness: item.happiness });
  addLog(s, `Purchased ${item.name.toLowerCase()}.`, "milestone");
  return s;
}
export function sellItem(state, id) {
  writable(state);
  const item = SHOP.find((i) => i.id === id);
  if (!item || !state.inventory.includes(id))
    throw new Error("You do not own this item.");
  const s = clone(state);
  s.money += item.price * 0.8;
  s.inventory = s.inventory.filter((i) => i !== id);
  addLog(s, `Sold ${item.name.toLowerCase()} for 80% of its purchase price.`);
  return s;
}
export function connect(state, id, romantic = false) {
  writable(state);
  const s = clone(state),
    r = s.relationships.find((r) => r.id === id);
  if (!r) throw new Error("This person is unavailable.");
  if (!s.actions)
    throw new Error(
      "You have used your free-time actions. Advance a week for more.",
    );
  if (romantic && ["Parent", "Sibling", "Best friend"].includes(r.role))
    throw new Error("This relationship is not a romantic connection.");
  if (romantic && r.bond < 60)
    throw new Error("Get to know each other first (60 connection needed).");
  if (
    romantic &&
    s.relationships.some(
      (p) => ["Partner", "Spouse"].includes(p.role) && p.id !== id,
    )
  )
    throw new Error("You are already in a relationship.");
  if (romantic && !["Partner", "Spouse"].includes(r.role))
    throw new Error("Plan dates and mutually agree to become exclusive first.");
  const cost = romantic ? 90 : 25;
  if (s.money < cost) throw new Error("Not enough cash for this outing.");
  spendTime(s, romantic ? 4 : 2, "Quality time together");
  s.actions--;
  s.money -= cost;
  r.bond = clamp(r.bond + (s.trait === "Social" ? 18 : 12));
  if (s.connections?.profiles[id]) {
    s.connections.profiles[id].trust = clamp(
      s.connections.profiles[id].trust + 4,
    );
    s.connections.profiles[id].lastContactWeek = s.week;
  }
  s.happiness = clamp(s.happiness + 4);
  s.skills.charisma = clamp(s.skills.charisma + 1);
  if (romantic && r.role !== "Spouse") {
    if (r.role !== "Partner") {
      s.family.partnerId = r.id;
      s.family.sinceWeek = s.week;
      s.family.engagement = null;
    }
    r.role = "Partner";
  }
  addLog(
    s,
    romantic
      ? `A new chapter with ${r.name}.`
      : `Spent quality time with ${r.name}.`,
  );
  return s;
}
export function meet(state) {
  writable(state);
  if (age(state) < 13)
    throw new Error(
      "Make childhood friends through school and supervised play.",
    );
  if (!state.actions)
    throw new Error("Advance a week to make time for new connections.");
  if (state.relationships.length >= 8)
    throw new Error(
      "Your circle is full. Spend time with the people you know.",
    );
  if (availableCash(state) < 35)
    throw new Error("You need $35 for the social event.");
  const s = clone(state),
    people = [
      ["Riley Chen", "blue"],
      ["Jamie Rivera", "green"],
      ["Casey Brooks", "yellow"],
      ["Morgan Lee", "purple"],
      ["Taylor Park", "orange"],
      ["Avery Reed", "blue"],
    ];
  const [name, color] = people[s.relationships.length - 2];
  s.relationships.push({
    id: `person-${s.relationships.length}`,
    name,
    color,
    role: "New connection",
    bond: 25,
    icon: name
      .split(" ")
      .map((n) => n[0])
      .join(""),
  });
  ensurePeople(s);
  spendTime(s, 3, "Local social gathering");
  s.actions--;
  s.money -= 35;
  s.happiness = clamp(s.happiness + 3);
  addLog(s, `Met ${name} at a local gathering.`);
  return s;
}
export function setTeamStrategy(state, strategy) {
  writable(state);
  if (!["balanced", "development", "commercial"].includes(strategy))
    throw new Error("Choose an available strategy.");
  const s = clone(state);
  s.teamStrategy = strategy;
  return s;
}
const YOUTH_EVENTS = [
  {
    title: "Training or tomorrow’s exam?",
    tag: "School & sport",
    text: "An extra practice session clashes with revising for a school assessment.",
    options: [
      {
        label: "Go to practice",
        detail: "Athletics +1 · school grade −1 · energy −3",
        skill: 1,
        grade: -1,
        energy: -3,
      },
      {
        label: "Revise for the assessment",
        detail: "School grade +2 · energy −2",
        grade: 2,
        energy: -2,
      },
      {
        label: "Split the evening",
        detail: "School grade +1 · energy −1",
        grade: 1,
        energy: -1,
      },
    ],
  },
  {
    title: "A first local tournament",
    tag: "Youth competition",
    text: "Friends are heading to a local sports event. There is a modest participation fee.",
    options: [
      {
        label: "Take part",
        detail: "$25 · athletics +1 · confidence +1",
        cost: 25,
        skill: 1,
        charisma: 1,
        energy: -3,
      },
      {
        label: "Go as a spectator",
        detail: "$5 · happiness +4",
        cost: 5,
        happiness: 4,
      },
      { label: "Stay home", detail: "Energy +4 · no cost", energy: 4 },
    ],
  },
  {
    title: "Your first creative audience",
    tag: "School & creativity",
    text: "The school showcase is looking for songs, performances, and short films.",
    options: [
      {
        label: "Share something you made",
        detail: "Charisma +2 · energy −2",
        charisma: 2,
        energy: -2,
      },
      {
        label: "Help behind the scenes",
        detail: "Charisma +1 · happiness +3",
        charisma: 1,
        happiness: 3,
      },
      { label: "Keep practising privately", detail: "Energy +3", energy: 3 },
    ],
  },
  {
    title: "A coach’s honest feedback",
    tag: "Development",
    text: "Your coach says consistency matters more than a single good performance.",
    options: [
      {
        label: "Listen and make a plan",
        detail: "Sport discipline +2 · energy −2",
        discipline: 2,
        energy: -2,
      },
      { label: "Take a recovery evening", detail: "Energy +6", energy: 6 },
      {
        label: "Ask a teammate for advice",
        detail: "Connection +3 · charisma +1",
        bond: 3,
        charisma: 1,
      },
    ],
  },
  {
    title: "A borrowed set of boots",
    tag: "School football",
    text: "A relative has outgrown a pair of matchday boots and offers them to you.",
    options: [
      {
        label: "Accept the boots",
        detail: "Football boots if you do not already own them",
        item: "boots",
      },
      {
        label: "Let another player have them",
        detail: "Connection +4 · happiness +3",
        bond: 4,
        happiness: 3,
      },
      { label: "Keep your current kit", detail: "Energy +2", energy: 2 },
    ],
  },
  {
    title: "An evening with classmates",
    tag: "School friendships",
    text: "Your classmates suggest a low-cost evening together after a demanding school week.",
    options: [
      {
        label: "Join them",
        detail: "$15 · connection +5 · happiness +5",
        cost: 15,
        bond: 5,
        happiness: 5,
      },
      {
        label: "Practise your hobby",
        detail: "Charisma +1 · energy −2",
        charisma: 1,
        energy: -2,
      },
      { label: "Get an early night", detail: "Energy +8", energy: 8 },
    ],
  },
];
const EVENTS = [
  {
    title: "An evening worth saying yes to",
    tag: "Relationships",
    text: "Sam has two tickets to a gig on Friday. You have a busy week ahead, but some memories are worth making.",
    options: [
      {
        label: "Go with Sam",
        detail: "$60 · happiness +8 · connection +8",
        cost: 60,
        happiness: 8,
        bond: 8,
      },
      {
        label: "Have a quiet night in",
        detail: "Energy +8 · no cost",
        energy: 8,
      },
    ],
  },
  {
    title: "A chance to back yourself",
    tag: "Personal growth",
    text: "A respected mentor offers a focused weekend workshop. It could be the small investment that opens your next door.",
    options: [
      {
        label: "Take the workshop",
        detail: "$180 · career skill +5",
        cost: 180,
        skill: 5,
      },
      {
        label: "Learn on your own",
        detail: "Career skill +2 · energy −4",
        skill: 2,
        energy: -4,
      },
    ],
  },
  {
    title: "The shortcut looks tempting",
    tag: "A life choice",
    text: "A contact offers a risky side project with a quick payout. The money would help, but you would have to sacrifice your downtime.",
    options: [
      {
        label: "Take on the project",
        detail: "50% chance of +$600; otherwise −$200 · energy −12",
        gamble: true,
        energy: -12,
      },
      {
        label: "Protect your time",
        detail: "Happiness +5 · energy +5",
        happiness: 5,
        energy: 5,
      },
    ],
  },
  {
    title: "Room to slow down",
    tag: "Wellbeing",
    text: "You have been thinking about what a good life actually looks like. A weekend away could help you find a little perspective.",
    options: [
      {
        label: "Take a short getaway",
        detail: "$150 · health +5 · energy +12 · happiness +8",
        cost: 150,
        health: 5,
        energy: 12,
        happiness: 8,
      },
      {
        label: "Take a walk and reflect",
        detail: "Health +2 · happiness +3",
        health: 2,
        happiness: 3,
      },
    ],
  },
  {
    title: "Your community needs a hand",
    tag: "Community",
    text: "A local youth club is looking for someone to help with its next event. Your time could mean more than you think.",
    options: [
      {
        label: "Volunteer this weekend",
        detail: "Charisma +4 · happiness +6 · energy −5",
        charisma: 4,
        happiness: 6,
        energy: -5,
      },
      {
        label: "Make a donation",
        detail: "$100 · happiness +4",
        cost: 100,
        happiness: 4,
      },
      { label: "Maybe next time", detail: "No change", energy: 0 },
    ],
  },
  {
    title: "A friend needs you",
    tag: "Relationships",
    text: "Sam has had a difficult week. You could help them work through it, or send a little encouragement when you have time.",
    options: [
      {
        label: "Be there in person",
        detail: "Connection +12 · happiness +4 · energy −4",
        bond: 12,
        happiness: 4,
        energy: -4,
      },
      { label: "Send a thoughtful message", detail: "Connection +3", bond: 3 },
    ],
  },
  {
    title: "Your body is sending a signal",
    tag: "Wellbeing",
    text: "A recurring ache has been distracting you. A proper checkup could help, though easing your schedule is an option too.",
    options: [
      {
        label: "Book a specialist",
        detail: "$220 · health +12",
        cost: 220,
        health: 12,
      },
      {
        label: "Ease off and recover",
        detail: "Health +5 · energy +5",
        health: 5,
        energy: 5,
      },
    ],
  },
  {
    title: "An invitation to the right room",
    tag: "Career",
    text: "There is a networking dinner with people who have walked your career path. It is expensive, but the conversations might stay with you.",
    options: [
      {
        label: "Reserve a seat",
        detail: "$250 · career skill +5 · charisma +3",
        cost: 250,
        skill: 5,
        charisma: 3,
      },
      {
        label: "Try a free local meetup",
        detail: "Charisma +2 · energy −3",
        charisma: 2,
        energy: -3,
      },
    ],
  },
  {
    title: "The weekend is wide open",
    tag: "Lifestyle",
    text: "No deadlines. No obligations. Just a little space to decide what feels like a good use of your time.",
    options: [
      {
        label: "Explore somewhere new",
        detail: "$80 · happiness +9 · energy −2",
        cost: 80,
        happiness: 9,
        energy: -2,
      },
      {
        label: "Cook with a friend",
        detail: "$30 · happiness +5 · connection +5",
        cost: 30,
        happiness: 5,
        bond: 5,
      },
      { label: "Enjoy the quiet", detail: "Energy +7", energy: 7 },
    ],
  },
  {
    title: "Someone asks for your advice",
    tag: "Personal growth",
    text: "A younger person is starting out and wants to hear how you see the world. You do not need to have everything figured out to share what you know.",
    options: [
      {
        label: "Make time to mentor them",
        detail: "Charisma +5 · happiness +5 · energy −6",
        charisma: 5,
        happiness: 5,
        energy: -6,
      },
      {
        label: "Recommend a useful book",
        detail: "Happiness +2",
        happiness: 2,
      },
    ],
  },
  {
    title: "The comparison trap",
    tag: "A life choice",
    text: "Someone you know has reached a big milestone. It is easy to measure your progress against theirs, but your story follows its own timeline.",
    options: [
      {
        label: "Use it as motivation",
        detail: "Career skill +4 · energy −6",
        skill: 4,
        energy: -6,
      },
      {
        label: "Celebrate them and your own journey",
        detail: "Happiness +7 · charisma +2",
        happiness: 7,
        charisma: 2,
      },
    ],
  },
  {
    title: "A course outside your comfort zone",
    tag: "Education",
    text: "A hands-on course could open up a new way of thinking about your work. The tuition is real, and so is the opportunity to learn.",
    options: [
      {
        label: "Invest in the course",
        detail: "$400 · career skill +8 · energy −5",
        cost: 400,
        skill: 8,
        energy: -5,
      },
      {
        label: "Follow a free online lecture",
        detail: "Career skill +2",
        skill: 2,
      },
    ],
  },
  {
    title: "An old friend is in town",
    tag: "Relationships",
    text: "There is a message on your phone from someone you have not seen in years. Some connections are worth picking back up.",
    options: [
      {
        label: "Organize a night out",
        detail: "$100 · happiness +8 · connection +5 · energy −3",
        cost: 100,
        happiness: 8,
        bond: 5,
        energy: -3,
      },
      {
        label: "Meet for coffee",
        detail: "$15 · happiness +4 · connection +3",
        cost: 15,
        happiness: 4,
        bond: 3,
      },
      { label: "Catch up on a call", detail: "Connection +2", bond: 2 },
    ],
  },
  {
    title: "More hours, or more life?",
    tag: "Work & life",
    text: "You could spend the weekend practicing and getting ahead, or give yourself permission to switch off. Both choices shape your future.",
    options: [
      {
        label: "Put in the extra work",
        detail: "Career skill +6 · energy −10 · happiness −3",
        skill: 6,
        energy: -10,
        happiness: -3,
      },
      {
        label: "Keep the weekend for yourself",
        detail: "Happiness +6 · energy +9",
        happiness: 6,
        energy: 9,
      },
    ],
  },
  {
    title: "A small kindness travels far",
    tag: "Community",
    text: "A neighbor is organizing meals for a family going through a hard time. You could help with the cooking, contribute, or pass the word on.",
    options: [
      {
        label: "Help prepare meals",
        detail: "Happiness +6 · charisma +3 · energy −5",
        happiness: 6,
        charisma: 3,
        energy: -5,
      },
      {
        label: "Cover some supplies",
        detail: "$75 · happiness +5",
        cost: 75,
        happiness: 5,
      },
      { label: "Spread the word", detail: "Charisma +1", charisma: 1 },
    ],
  },
];
export function resolveEvent(state, index) {
  writable(state);
  const event = state.event,
    option = event?.options[index];
  if (!option) throw new Error("Choose an available option.");
  if (option.cost && availableCash(state) < option.cost)
    throw new Error("Not enough cash for this choice.");
  const s = clone(state);
  s.money -= option.cost || 0;
  changeStats(s, option);
  resolveEverydayEffects(s, option);
  resolveStoryEffects(s, event, option);
  resolveChildhoodEffects(s, event, option);
  if (option.skill)
    s.skills[primarySkill(s)] = clamp(s.skills[primarySkill(s)] + option.skill);
  if (option.charisma)
    s.skills.charisma = clamp(s.skills.charisma + option.charisma);
  if (option.bond)
    s.relationships[0].bond = clamp(s.relationships[0].bond + option.bond);
  if (option.grade && s.school.enrolled)
    s.school.grade = clamp(s.school.grade + option.grade);
  if (option.discipline) {
    if (!["none", "retired"].includes(s.football.stage))
      s.football.discipline = clamp(s.football.discipline + option.discipline);
    for (const p of Object.values(s.sports))
      if (!["none", "retired"].includes(p.stage))
        p.discipline = clamp(p.discipline + option.discipline);
  }
  if (option.item && !s.inventory.includes(option.item))
    s.inventory.push(option.item);
  if (option.gamble) {
    const won = random(s) > 0.5;
    if (won) receiveIncome(s, 600, "earned");
    else s.money -= 200;
    addLog(
      s,
      won
        ? "Your side project paid off: +$600."
        : "The side project fell through: −$200.",
      won ? "positive" : "warning",
    );
  }
  addLog(s, `Life choice: ${option.label.toLowerCase()}.`);
  s.event = null;
  return s;
}
export function advanceWeek(state) {
  writable(state);
  if (state.event)
    throw new Error("Make your pending life choice before advancing.");
  const s = clone(state),
    focus = ACTIVITIES[s.activity],
    p = s.progress[s.career];
  s.week++;
  startBankingWeek(s);
  prepareChildhood(s);
  prepareCalendar(s);
  prepareSeasons(s);
  if (s.employment || s.career === "business") p.weeks++;
  s.actions = 3;
  const income = salary(s),
    employmentPay = s.employment ? income : 0,
    costs = expenses(s, {
      education: false,
      sports: false,
      properties: false,
      banking: false,
    });
  pensionContribution(s, income);
  if (s.career === "business" && s.company) s.company.cash -= income;
  s.tradeVolumes = Object.fromEntries(MARKETS.map((m) => [m.id, 0]));
  const payReceived = receiveIncome(
    s,
    income,
    age(s) < 18 && !s.employment && s.career !== "business"
      ? "exempt"
      : "earned",
    { deduction: pensionDue(s) + agentCommission(s) },
  );
  s.money -= costs;
  if (age(s) < 12) childhoodWeek(s);
  else {
    const skill = focus.skill || primarySkill(s);
    const tired = s.energy < 25;
    s.skills[skill] = clamp(
      s.skills[skill] + focus.gain * 0.25 * (tired ? 0.5 : 1),
    );
    if (s.activity === "train")
      s.skills.driving = clamp(s.skills.driving + 0.5);
    if (s.activity === "study")
      s.skills.business = clamp(s.skills.business + 0.5);
    if (s.activity === "train" && s.inventory.includes("bike"))
      s.health = clamp(s.health + 1);
    if (s.activity === "train" && s.inventory.includes("sim-rig"))
      s.skills.driving = clamp(s.skills.driving + 0.25);
    if (s.activity === "study" && s.inventory.includes("laptop"))
      s.skills.business = clamp(s.skills.business + 0.25);
    if (s.activity === "rest" && s.inventory.includes("piano"))
      s.happiness = clamp(s.happiness + 2);
    changeStats(s, focus);
    if (s.inventory.includes("gym")) s.health = clamp(s.health + 2);
    if (s.trait === "Athletic" && s.activity === "train")
      s.skills.athletics = clamp(s.skills.athletics + 0.25);
    if (s.energy < 20) {
      s.health = clamp(s.health - 4);
      s.happiness = clamp(s.happiness - 3);
    }
    for (const r of s.relationships)
      r.bond = clamp(
        r.bond +
          (r.role === "Parent"
            ? s.activity === "social"
              ? 0.15
              : -0.01
            : s.activity === "social"
              ? 3
              : -1),
      );
  }
  const macro = (rng(s) * 2 - 1) * 0.005;
  for (const m of MARKETS) {
    const issuer = BUSINESSES.find((b) => b.stock === m.id);
    const fundamentals = issuer
      ? (s.businessResults[issuer.id].profit * 0.7) /
        (s.market[m.id] * issuer.shares)
      : 0;
    const movement =
      macro + (random(s) * 2 - 1) * m.volatility + m.drift + fundamentals;
    s.market[m.id] = Math.max(
      1,
      Math.round(s.market[m.id] * (1 + movement) * 100) / 100,
    );
    if (m.yield && s.week % 13 === 0) {
      const perUnit = (s.market[m.id] * m.yield) / 4;
      const dividend = Math.round(s.holdings[m.id] * perUnit * 100) / 100;
      receiveIncome(s, dividend, "investment");
      s.market[m.id] = Math.max(
        1,
        Math.round((s.market[m.id] - perUnit) * 100) / 100,
      );
      if (dividend)
        addLog(
          s,
          `${m.symbol} distributed $${dividend.toFixed(2)} in quarterly income.`,
          "positive",
        );
    }
  }
  for (const i of SHOP.filter((i) => s.inventory.includes(i.id))) {
    const fx = i.effects || {};
    if (s.activity === "study") {
      s.skills.business = clamp(s.skills.business + (fx.studyBusiness || 0));
      s.skills.finance = clamp(s.skills.finance + (fx.studyFinance || 0));
    }
    if (s.activity === "train") {
      s.skills.athletics = clamp(s.skills.athletics + (fx.trainAthletics || 0));
      s.skills.driving = clamp(s.skills.driving + (fx.trainDriving || 0));
      s.health = clamp(s.health + (fx.trainHealth || 0));
    }
    if (s.activity === "rest") {
      s.energy = clamp(s.energy + (fx.restEnergy || 0));
      s.happiness = clamp(s.happiness + (fx.restHappiness || 0));
    }
    if (s.activity === "social")
      s.skills.charisma = clamp(s.skills.charisma + (fx.socialCharisma || 0));
  }
  const paidTuition = advanceWorld(s);
  advanceLife(s);
  advanceSeasons(s);
  for (const m of MARKETS) {
    s.marketHistory[m.id].push(s.market[m.id]);
    s.marketHistory[m.id] = s.marketHistory[m.id].slice(-24);
  }
  if (s.money < 0)
    addLog(
      s,
      "Your balance is below zero. Debt carries 0.5% weekly interest; income or selling assets can help.",
      "warning",
    );
  addLog(
    s,
    `Week ${s.week}: $${income.toLocaleString("en-US")} gross earned · $${(income - payReceived).toFixed(2)} pay tax · $${costs.toLocaleString("en-US")} running costs${paidTuition ? ` · $${paidTuition} tuition` : ""}.`,
    income >= costs ? "positive" : "warning",
  );
  if (age(s) < 12) {
    if (s.week % 52 === 0) s.event = childhoodEvent(s);
  } else if (s.childhood.startedAtBirth && age(s) === 12 && s.week % 52 === 0)
    s.event = childhoodEvent(s);
  else if (
    s.week % (s.childhood.startedAtBirth && age(s) < 18 ? 13 : 2) ===
    0
  ) {
    const choices =
      age(s) < 18
        ? [...YOUTH_EVENTS, ...eligibleStoryEvents(s)]
        : [...EVENTS, ...everydayEvents(s), ...eligibleStoryEvents(s)];
    s.event = clone(choices[Math.floor(random(s) * choices.length)]);
  }
  advanceEveryday(s);
  advanceWorkLife(s);
  advanceConnections(s);
  guardianSupport(s);
  advanceStories(s);
  advanceCareerSupport(s);
  advanceBanking(s, employmentPay);
  finishCalendar(s);
  recordMilestones(s, netWorth(s));
  s.history.push({ week: s.week, value: Math.round(netWorth(s)) });
  s.history = s.history.slice(-52);
  if (age(s) >= 90 || s.health <= 0) {
    s.ended = true;
    s.event = null;
    addLog(
      s,
      "Your life story is complete. Look back on what you built, or begin a new chapter.",
      "milestone",
    );
  }
  return s;
}
export function restoreGame(raw) {
  const s = typeof raw === "string" ? JSON.parse(raw) : clone(raw);
  const number = (n, min = -Infinity, max = Infinity) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
  if (
    !s ||
    ![1, 2, 3, 4, 5, 6, VERSION].includes(s.version) ||
    typeof s.name !== "string" ||
    s.name.length > 32 ||
    !number(s.startAge, 0, 60) ||
    !Number.isInteger(s.startAge) ||
    !number(s.week, 0) ||
    !Number.isInteger(s.week) ||
    !number(s.money) ||
    !number(s.seed, 0, 4294967295) ||
    !Object.hasOwn(CAREERS, s.career) ||
    !Object.hasOwn(ACTIVITIES, s.activity) ||
    !number(s.actions, 0, 3) ||
    !Number.isInteger(s.actions) ||
    typeof s.ended !== "boolean"
  )
    throw new Error(
      "This save file is invalid or from an unsupported version.",
    );
  const needsChildhood = s.version < 7;
  const needsSeasons = s.version < 6;
  const needsChapters = s.version < 5;
  const needsEveryday = s.version < 4;
  if (needsChapters) {
    for (const k of ["knowledge", "technical", "empathy"])
      s.skills[k] = k === "empathy" ? 20 : 15;
    for (const k of Object.keys(EXTRA_CAREERS))
      s.progress[k] = { level: 0, weeks: 0, unlocked: false };
  }
  const needsLife = s.version < 3;
  const legacy = s.version === 1;
  if (legacy) {
    const oldLevel = s.progress?.[s.career]?.level;
    if (
      !Number.isInteger(oldLevel) ||
      oldLevel < 0 ||
      oldLevel > 4 ||
      !Number.isFinite(s.progress?.[s.career]?.weeks)
    )
      throw new Error("Invalid legacy career.");
    s.progress.unemployed = { level: 0, weeks: 0, unlocked: true };
    for (const m of MARKETS)
      if (s.market?.[m.id] === undefined) {
        s.market[m.id] = m.price;
        s.holdings[m.id] = 0;
        s.marketHistory[m.id] = [m.price];
      }
    s.tradeVolumes = Object.fromEntries(MARKETS.map((m) => [m.id, 0]));
    if (s.career === "investor" && oldLevel === 0) s.career = "unemployed";
    initializeWorld(s, {
      legacy: true,
      legacyPay: CAREERS[s.career].pay[oldLevel] || 0,
      legacyLevel: s.career === "investor" ? Math.min(oldLevel, 2) : oldLevel,
    });
    s.version = VERSION;
  }
  for (const k of ["health", "energy", "happiness"])
    if (!number(s[k], 0, 100)) throw new Error("Invalid character stats.");
  for (const k of [
    "athletics",
    "driving",
    "business",
    "finance",
    "charisma",
    "knowledge",
    "technical",
    "empathy",
  ])
    if (!number(s.skills?.[k], 0, 100)) throw new Error("Invalid skills.");
  if (needsLife) {
    for (const k of Object.keys(CAREERS))
      if (!s.progress[k])
        s.progress[k] = { level: 0, weeks: 0, unlocked: false };
    initializeLife(s, { legacy: true });
    s.version = VERSION;
  }
  for (const k of Object.keys(CAREERS))
    if (
      !number(s.progress?.[k]?.level, 0, 4) ||
      !Number.isInteger(s.progress[k].level) ||
      !number(s.progress[k].weeks, 0)
    )
      throw new Error("Invalid career progress.");
  for (const k of Object.keys(CAREERS)) {
    if (s.progress[k].unlocked === undefined)
      s.progress[k].unlocked = s.progress[k].weeks > 0 || k === s.career;
    if (typeof s.progress[k].unlocked !== "boolean")
      throw new Error("Invalid career unlock.");
  }
  if (
    s.company !== null &&
    (typeof s.company.name !== "string" ||
      !s.company.name.trim() ||
      s.company.name.length > 40 ||
      !["Technology", "Consumer goods", "Clean energy"].includes(
        s.company.sector,
      ) ||
      !["balanced", "reinvest", "dividends"].includes(s.company.strategy) ||
      !number(s.company.value, 500, 1e12) ||
      !number(s.company.employees, 1, 100000))
  )
    throw new Error("Invalid company data.");
  for (const m of MARKETS)
    if (
      !number(s.market?.[m.id], 1) ||
      !(m.fractional
        ? Number.isFinite(s.holdings?.[m.id])
        : Number.isInteger(s.holdings?.[m.id])) ||
      s.holdings[m.id] < 0 ||
      !Array.isArray(s.marketHistory?.[m.id]) ||
      !s.marketHistory[m.id].length ||
      s.marketHistory[m.id].length > 24 ||
      !s.marketHistory[m.id].every((n) => number(n, 1))
    )
      throw new Error("Invalid portfolio.");
  if (
    !Array.isArray(s.inventory) ||
    new Set(s.inventory).size !== s.inventory.length ||
    s.inventory.some((id) => !SHOP.some((i) => i.id === id)) ||
    !s.teams ||
    typeof s.teams !== "object"
  )
    throw new Error("Invalid inventory.");
  if (
    !["balanced", "development", "commercial"].includes(s.teamStrategy) ||
    !Array.isArray(s.relationships) ||
    s.relationships.length < 2 ||
    s.relationships.length > 8 ||
    s.relationships.some(
      (r) =>
        typeof r.id !== "string" ||
        typeof r.name !== "string" ||
        typeof r.role !== "string" ||
        typeof r.icon !== "string" ||
        !number(r.bond, 0, 100),
    )
  )
    throw new Error("Invalid relationships.");
  if (
    !Array.isArray(s.history) ||
    !s.history.length ||
    s.history.length > 52 ||
    s.history.some((h) => !number(h.week, 0) || !number(h.value)) ||
    !Array.isArray(s.log) ||
    s.log.length > 40 ||
    s.log.some((l) => typeof l.text !== "string" || !number(l.week, 0))
  )
    throw new Error("Invalid history.");
  if (
    !s.tradeVolumes ||
    MARKETS.some(
      (m) =>
        !Number.isFinite(s.tradeVolumes[m.id]) ||
        s.tradeVolumes[m.id] < 0 ||
        s.tradeVolumes[m.id] > m.volume,
    )
  )
    throw new Error("Invalid market liquidity data.");
  if (
    s.inventory.some(
      (id) => SHOP.find((i) => i.id === id)?.category === "Ownership",
    )
  )
    throw new Error("Invalid legacy ownership in current save.");
  if (needsEveryday) {
    initializeEveryday(s);
    s.version = VERSION;
  }
  if (needsChapters) {
    initializeCalendar(s);
    initializeWorkLife(s);
    initializeConnections(s);
    s.version = VERSION;
  }
  if (needsSeasons) {
    initializeBanking(s);
    initializeSeasons(s);
    initializeStories(s);
    s.version = VERSION;
  }
  if (needsChildhood) {
    initializeChildhood(s, { legacy: true });
    initializeCareerSupport(s);
    s.version = VERSION;
  }
  validateChildhood(s);
  validateCareerSupport(s);
  validateBanking(s);
  validateSeasons(s);
  validateStories(s);
  validateCalendar(s);
  validateWorkLife(s);
  validateConnections(s);
  validateWorld(s);
  validateLife(s);
  validateEveryday(s);
  if (s.event !== null) {
    const match = [
      ...EVENTS,
      ...YOUTH_EVENTS,
      ...CHILDHOOD_EVENTS,
      ...EVERYDAY_EVENTS,
      ...STORY_EVENTS,
    ].find((e) => e.title === s.event?.title);
    if (!match) throw new Error("Invalid life choice.");
    s.event = clone(match);
  }
  return clone(s);
}

// Time skips run the same simulation and resolve life choices with the last, free option.
export function debugAdvance(state, weeks) {
  if (!state.debug.enabled) throw new Error("Enable debug mode first.");
  if (![1, 4, 13, 52].includes(weeks))
    throw new Error("Choose one, four, thirteen, or fifty-two weeks.");
  if (state.ended) throw new Error("This life is complete.");
  let s = clone(state);
  const start = s.week;
  for (let i = 0; i < weeks && !s.ended; i++) {
    if (s.event) s = resolveEvent(s, s.event.options.length - 1);
    s = advanceWeek(s);
  }
  const text = `Simulated ${s.week - start} weeks; life choices used their last option.`;
  s.debug.edits.unshift({ week: s.week, text });
  s.debug.edits = s.debug.edits.slice(0, 20);
  addLog(s, `Debug: ${text}`, "warning");
  return s;
}

export function ageUp(state) {
  writable(state);
  if (state.event)
    throw new Error("Make your pending life choice before ageing up.");
  let s = clone(state);
  const birthday = state.week + 52 - (state.week % 52);
  while (s.week < birthday && !s.event && !s.ended) s = advanceWeek(s);
  return s;
}
