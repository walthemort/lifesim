import { localPrice, rentTerms } from "./economy.js";
import { settleSeparation, custodyFactor } from "./realism.js";
import { receiveIncome, recordCapitalGain } from "./banking.js";
import { allocationRatio, spendTime } from "./calendar.js";
import { availableCash, rng, BUSINESSES, stakePercent } from "./world.js";

const age = (s) => s.startAge + Math.floor(s.week / 52);
const clamp = (n) => Math.max(0, Math.min(100, n));
const round = (n) => Math.round(n * 100) / 100;
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
function action(state, cost = 0, energy = 0) {
  if (age(state) < 6)
    throw new Error("Use supervised childhood activities at this age.");
  if (state.ended) throw new Error("This life is complete.");
  if (!state.actions) throw new Error("You need a free-time action.");
  if (availableCash(state) < cost)
    throw new Error("Not enough uncommitted cash.");
  if (state.energy < energy) throw new Error("Rest before taking this on.");
  const s = structuredClone(state);
  spendTime(s, 3, "Home, hobby or family activity");
  s.actions--;
  s.money = round(s.money - cost);
  s.energy -= energy;
  return s;
}
export const RENTALS = [
  {
    id: "shared",
    name: "Room in a shared house",
    rent: 120,
    bedrooms: 0,
    deposit: 480,
  },
  {
    id: "studio",
    name: "Private studio",
    rent: 220,
    bedrooms: 1,
    deposit: 880,
  },
  {
    id: "family",
    name: "Family rental",
    rent: 450,
    bedrooms: 3,
    deposit: 1800,
  },
];
export const HOMES = [
  {
    id: "starter",
    name: "Starter flat",
    price: 120000,
    bedrooms: 1,
    upkeep: 35,
    rent: 220,
  },
  {
    id: "townhouse",
    name: "Suburban townhouse",
    price: 260000,
    bedrooms: 3,
    upkeep: 65,
    rent: 430,
  },
  {
    id: "cottage",
    name: "Garden cottage",
    price: 190000,
    bedrooms: 2,
    upkeep: 50,
    rent: 330,
  },
  {
    id: "penthouse",
    name: "City penthouse",
    price: 950000,
    bedrooms: 3,
    upkeep: 180,
    rent: 1100,
  },
  {
    id: "estate",
    name: "Country estate",
    price: 2400000,
    bedrooms: 6,
    upkeep: 400,
    rent: 2100,
  },
  {
    id: "beach",
    name: "Beach house",
    price: 620000,
    bedrooms: 4,
    upkeep: 130,
    rent: 700,
  },
];
// Homes bought through the original shop keep their resale and upkeep rules.
export const LEGACY_BEDROOMS = {
  apartment: 2,
  villa: 6,
  "studio-home": 1,
  townhouse: 3,
  penthouse: 3,
  "country-house": 4,
  "beach-house": 3,
};
export const HOBBIES = [
  {
    id: "writing",
    name: "Writing",
    project: "Publish an independent book",
    gear: ["laptop", "workstation"],
    cost: 2,
    budget: 100,
    weeks: 8,
    fee: 250,
  },
  {
    id: "photography",
    name: "Photography",
    project: "Build a photo exhibition",
    gear: ["phone", "premium-phone", "camera"],
    cost: 5,
    budget: 80,
    weeks: 4,
    fee: 200,
  },
  {
    id: "coding",
    name: "Coding",
    project: "Launch a small app",
    gear: ["laptop", "workstation"],
    cost: 0,
    budget: 180,
    weeks: 12,
    fee: 400,
  },
  {
    id: "cooking",
    name: "Cooking",
    project: "Host a supper club",
    gear: [],
    cost: 8,
    budget: 100,
    weeks: 4,
    fee: 180,
  },
  {
    id: "gardening",
    name: "Gardening",
    project: "Grow a market harvest",
    gear: [],
    cost: 6,
    budget: 60,
    weeks: 8,
    fee: 100,
  },
  {
    id: "art",
    name: "Art & design",
    project: "Prepare a print collection",
    gear: [],
    cost: 5,
    budget: 90,
    weeks: 6,
    fee: 220,
  },
];
export const MILESTONES = [
  ["first-job", "First pay cheque", "Accept your first employment contract."],
  ["graduate", "Qualified for the future", "Complete a degree."],
  ["homeowner", "A place of your own", "Own a property."],
  ["landlord", "Keys to an investment", "Let a property to a tenant."],
  ["married", "A shared chapter", "Get married."],
  ["parent", "Someone calls you home", "Welcome a child."],
  ["pet", "A new companion", "Adopt a pet."],
  ["maker", "Made by you", "Complete a hobby project."],
  ["artist", "Your first release", "Release your own music."],
  ["audience", "A thousand listeners", "Reach 1,000 social followers."],
  ["millionaire", "Seven figures", "Reach $1 million net worth."],
  ["owner", "On the board", "Own a controlling business or club stake."],
];
// Context determines whether a scenario can occur; rewards always come from this catalogue.
const scenario = (context, title, text, options) => ({
  context,
  tag: "Everyday life",
  title,
  text,
  options,
});
const choice = (label, detail, effects = {}) => ({ label, detail, ...effects });
export const EVERYDAY_EVENTS = [
  scenario(
    "parent",
    "The school play",
    "A school performance lands on the same day as an important work deadline. Your child hopes to see you in the audience.",
    [
      choice("Make time to attend", "Family connection +5 · energy −6", {
        familyBond: 5,
        energy: -6,
      }),
      choice(
        "Keep the deadline, celebrate afterwards",
        "Spend $30 · family connection +2",
        { cost: 30, familyBond: 2 },
      ),
      choice(
        "Explain that you cannot make it",
        "Family connection −3 · energy +3",
        { familyBond: -3, energy: 3 },
      ),
    ],
  ),
  scenario(
    "parent",
    "A difficult day at school",
    "Your child has had a disagreement with a classmate. They need someone to listen before deciding what to do.",
    [
      choice(
        "Listen and help them work through it",
        "Family wellbeing +5 · energy −5",
        { familyWellbeing: 5, energy: -5 },
      ),
      choice(
        "Arrange a meeting with their teacher",
        "Energy −8 · education +3",
        { energy: -8, familyEducation: 3 },
      ),
      choice("Give them some space", "Energy +2 · family connection −1", {
        energy: 2,
        familyBond: -1,
      }),
    ],
  ),
  scenario(
    "parent",
    "A birthday to remember",
    "Another birthday is coming. A good celebration does not have to be expensive, but it does take thought.",
    [
      choice(
        "Invite friends for a celebration",
        "$120 · family connection +6 · happiness +4",
        { cost: 120, familyBond: 6, happiness: 4 },
      ),
      choice(
        "Make a homemade cake together",
        "$15 · energy −4 · family connection +4",
        { cost: 15, energy: -4, familyBond: 4 },
      ),
      choice("Keep it small with a handwritten card", "Family connection +1", {
        familyBond: 1,
      }),
    ],
  ),
  scenario(
    "pet",
    "An anxious companion",
    "Loud building work nearby has made your pet uneasy. They are looking to you for reassurance.",
    [
      choice(
        "Spend a quiet evening together",
        "Pet connection +6 · energy −4",
        { petBond: 6, energy: -4 },
      ),
      choice("Try a new enrichment toy", "$25 · pet wellbeing +4", {
        cost: 25,
        petHealth: 4,
      }),
      choice("Keep the usual routine", "Pet connection −1", { petBond: -1 }),
    ],
  ),
  scenario(
    "pet",
    "The neighbourhood pet walk",
    "Neighbours are arranging a weekend walk. It could be a chance to get outside and meet a few familiar faces.",
    [
      choice(
        "Go along and stay for a chat",
        "Health +3 · pet connection +4 · community +2",
        { health: 3, petBond: 4, community: 2 },
      ),
      choice(
        "Bring treats for everyone",
        "$12 · pet connection +5 · community +3",
        { cost: 12, petBond: 5, community: 3 },
      ),
      choice("Enjoy a quiet walk alone", "Health +1 · pet connection +1", {
        health: 1,
        petBond: 1,
      }),
    ],
  ),
  scenario(
    "home",
    "The leaking tap",
    "A slow leak has become hard to ignore. You can hire a professional or spend your own weekend fixing it.",
    [
      choice("Book a plumber", "$140 · happiness +3", {
        cost: 140,
        happiness: 3,
      }),
      choice("Learn to fix it yourself", "$20 · energy −8 · skill +1", {
        cost: 20,
        energy: -8,
        skill: 1,
      }),
      choice("Put a bucket underneath for now", "Happiness −3", {
        happiness: -3,
      }),
    ],
  ),
  scenario(
    "home",
    "Neighbours with a plan",
    "Residents want to improve the shared garden. The project needs both cash and people willing to help.",
    [
      choice("Fund some plants", "$75 · community +5 · happiness +3", {
        cost: 75,
        community: 5,
        happiness: 3,
      }),
      choice("Help with the planting", "Energy −8 · community +4", {
        energy: -8,
        community: 4,
      }),
      choice("Wish them luck this time", "No cost or effect", {}),
    ],
  ),
  scenario(
    "maker",
    "An imitation of your work",
    "A stranger has posted something very similar to your latest project. It is frustrating, but deciding how to respond matters.",
    [
      choice("Send a calm, documented message", "Energy −4 · charisma +1", {
        energy: -4,
        charisma: 1,
      }),
      choice("Turn it into a public argument", "Happiness −4 · reputation −5", {
        happiness: -4,
        trust: -5,
      }),
      choice("Keep your attention on your next piece", "Happiness +1", {
        happiness: 1,
      }),
    ],
  ),
  scenario(
    "maker",
    "A local creative fair",
    "The town is hosting a small creative fair. It might help you meet collaborators, though an entry fee is no promise of sales.",
    [
      choice("Pay for a stall", "$60 · community +4 · charisma +2", {
        cost: 60,
        community: 4,
        charisma: 2,
      }),
      choice("Volunteer on the organising team", "Energy −8 · community +5", {
        energy: -8,
        community: 5,
      }),
      choice("Visit as a guest", "Happiness +2", { happiness: 2 }),
    ],
  ),
  scenario(
    "maker",
    "An offer that feels wrong",
    "Someone promises a large creative contract, but asks you to pay an unexplained registration fee first.",
    [
      choice("Ask for references and a written brief", "Energy −3 · skill +1", {
        energy: -3,
        skill: 1,
      }),
      choice("Pay the registration fee", "$180 lost · happiness −5", {
        cost: 180,
        happiness: -5,
      }),
      choice("Decline and move on", "No cost or effect", {}),
    ],
  ),
  scenario(
    "fame",
    "A stranger recognises you",
    "Someone stops you in a café to say your work helped them through a difficult week. It is a small reminder of the people behind the numbers.",
    [
      choice(
        "Take time for a conversation",
        "Energy −3 · happiness +5 · reputation +2",
        { energy: -3, happiness: 5, trust: 2 },
      ),
      choice(
        "Invite them to your next public event",
        "Charisma +1 · reputation +1",
        { charisma: 1, trust: 1 },
      ),
      choice("Thank them kindly and keep your privacy", "Happiness +2", {
        happiness: 2,
      }),
    ],
  ),
  scenario(
    "fame",
    "A week away from the feed",
    "You have started checking audience numbers before breakfast. A quieter routine might help you enjoy creating again.",
    [
      choice("Take a proper break", "Energy +10 · happiness +5", {
        energy: 10,
        happiness: 5,
      }),
      choice(
        "Set boundaries around your screen time",
        "Energy +4 · happiness +3",
        { energy: 4, happiness: 3 },
      ),
      choice("Keep pushing for another week", "Energy −6 · happiness −2", {
        energy: -6,
        happiness: -2,
      }),
    ],
  ),
];
export function everydayEvents(s) {
  const active = {
    parent: s.family.children.some(
      (c) => s.week - c.bornWeek >= 5 * 52 && s.week - c.bornWeek < 18 * 52,
    ),
    pet: s.family.pets.length > 0,
    home: s.housing.properties.length > 0,
    maker: s.pastimes.projects.some((p) => p.status === "released"),
    fame: s.fame.recognition >= 25,
  };
  return EVERYDAY_EVENTS.filter((e) => active[e.context]);
}
export function resolveEverydayEffects(s, o) {
  for (const c of s.family.children) {
    c.bond = clamp(c.bond + (o.familyBond || 0));
    c.wellbeing = clamp(c.wellbeing + (o.familyWellbeing || 0));
    c.education = clamp(c.education + (o.familyEducation || 0));
  }
  for (const p of s.family.pets) {
    p.bond = clamp(p.bond + (o.petBond || 0));
    p.health = clamp(p.health + (o.petHealth || 0));
  }
  s.pastimes.community = clamp(s.pastimes.community + (o.community || 0));
  s.fame.reputation = clamp(s.fame.reputation + (o.trust || 0));
}
export function initializeEveryday(s) {
  s.debug = { enabled: false, used: false, edits: [] };
  s.housing = {
    rental: null,
    deposit: 0,
    residence: null,
    properties: [],
    weeklyIncome: 0,
    totalIncome: 0,
  };
  s.family = {
    partnerId:
      s.relationships.find((r) => ["Partner", "Spouse"].includes(r.role))?.id ||
      null,
    sinceWeek: s.week,
    engagement: null,
    pending: null,
    children: [],
    parenting: "balanced",
    pets: [],
    petMemories: [],
    serial: 0,
  };
  s.pastimes = {
    routine: "balanced",
    community: 0,
    hobbies: Object.fromEntries(
      HOBBIES.map((h) => [h.id, { skill: 10, sessions: 0 }]),
    ),
    projects: [],
    offers: [],
    serial: 0,
    weeklyIncome: 0,
    totalIncome: 0,
    nextOffer: 4,
  };
  s.milestones = [];
}
export function propertyListings(s) {
  const quarter = Math.floor(s.week / 13);
  return HOMES.map((h, i) => ({
    ...h,
    asking: Math.round(
      localPrice(s, h.price, "housing") *
        (1 + Math.sin(quarter * 1.7 + i) * 0.06),
    ),
    expiresWeek: (quarter + 1) * 13,
  }));
}
export const mortgagePayment = (principal, weeks = 1040) =>
  round((principal * (0.06 / 52)) / (1 - (1 + 0.06 / 52) ** -weeks));
export function homeBedrooms(s) {
  if (s.housing.residence)
    return (
      HOMES.find(
        (h) =>
          h.id ===
          s.housing.properties.find((p) => p.id === s.housing.residence)?.type,
      )?.bedrooms || 0
    );
  if (s.housing.rental)
    return RENTALS.find((r) => r.id === s.housing.rental).bedrooms;
  const bedrooms = Math.max(
    0,
    ...s.inventory.map((id) => LEGACY_BEDROOMS[id] || 0),
  );
  return bedrooms || (age(s) < 18 ? 0 : 1);
}
export function personalLivingCosts(s, legacyHome) {
  if (age(s) < 12) return 0;
  if (age(s) < 18) return 15;
  const rent = s.housing.residence
    ? 0
    : s.housing.rental
      ? rentTerms(
          s,
          RENTALS.find((r) => r.id === s.housing.rental),
        ).rent
      : legacyHome
        ? 50
        : localPrice(s, 220, "housing");
  const routine = s.pastimes.routine;
  return (
    localPrice(s, 60, "living") +
    rent +
    (routine === "frugal"
      ? -15
      : routine === "healthy"
        ? 20
        : routine === "mealprep"
          ? -10
          : 0)
  );
}
export const householdCosts = (s) =>
  s.family.children.reduce((sum, c) => {
    const years = Math.floor((s.week - c.bornWeek) / 52);
    return (
      sum +
      custodyFactor(s, c.id) *
        (years >= 18
          ? 0
          : years < 5
            ? 45 + (s.employment ? 45 : 0)
            : years < 13
              ? 65
              : 90)
    );
  }, 0) +
  s.family.pets.reduce((sum, p) => sum + (p.kind === "dog" ? 14 : 10), 0);
export const propertyCosts = (s) =>
  s.housing.properties.reduce(
    (sum, p) =>
      sum + HOMES.find((h) => h.id === p.type).upkeep + (p.loan?.payment || 0),
    0,
  );
export const housingEquity = (s) =>
  s.housing.deposit +
  s.housing.properties.reduce(
    (sum, p) => sum + p.value - (p.loan?.balance || 0),
    0,
  );
export function rentHome(state, id) {
  const original = RENTALS.find((r) => r.id === id);
  const r = original ? { ...original, ...rentTerms(state, original) } : null;
  if (!r || age(state) < 18) throw new Error("Renting requires age 18.");
  if (state.housing.rental === id && !state.housing.residence)
    throw new Error("You already live here.");
  if (
    state.family.children.some((c) => state.week - c.bornWeek < 18 * 52) &&
    r.bedrooms < 2
  )
    throw new Error("Your children need a family-sized home.");
  const difference = r.deposit - state.housing.deposit;
  const s = action(state, Math.max(0, difference) + 100);
  if (difference < 0) s.money -= difference;
  s.housing.deposit = r.deposit;
  if (s.realWorld)
    s.realWorld.economy.rentalTerms = {
      id: r.id,
      rent: r.rent,
      deposit: r.deposit,
      country: s.globalLife.residence.country,
    };
  s.housing.rental = id;
  s.housing.residence = null;
  log(
    s,
    `Moved into ${r.name.toLowerCase()}; $100 moving cost and $${r.deposit} refundable deposit.`,
    "milestone",
  );
  return s;
}
export function purchaseHome(state, type, financing = "cash") {
  const h = propertyListings(state).find((h) => h.id === type);
  if (!h || !["cash", "mortgage"].includes(financing) || age(state) < 18)
    throw new Error("Choose a property and a valid purchase method (age 18+).");
  if (state.housing.properties.length >= 6)
    throw new Error("You can manage at most six properties.");
  const down = financing === "mortgage" ? round(h.asking * 0.2) : h.asking;
  const fees = round(h.asking * 0.02);
  const principal = h.asking - down;
  const payment = principal ? mortgagePayment(principal) : 0;
  if (
    principal &&
    (!state.employment ||
      state.employment.tenure < 26 ||
      payment + h.upkeep + propertyCosts(state) >
        state.employment.weeklyPay * 0.35 ||
      availableCash(state) < down + fees + payment * 12)
  )
    throw new Error(
      "Mortgage requires 26 weeks of employment, a 20% deposit plus 2% fees and twelve payments in reserve; all property costs must fit within 35% of your wage.",
    );
  const s = action(state, down + fees);
  const id = `property:${s.week}:${s.family.serial++}`;
  s.housing.properties.push({
    id,
    type,
    paid: h.asking,
    value: h.asking,
    purchasedWeek: s.week,
    tenant: false,
    endLease: false,
    nextTenantWeek: null,
    saleWeek: null,
    loan: principal
      ? { balance: principal, payment, missed: 0, weeks: 1040 }
      : null,
  });
  log(
    s,
    `Purchased ${h.name.toLowerCase()} for $${h.asking}, with $${fees} closing fees${principal ? " and a fixed 6% mortgage over twenty years" : ""}. Move in or advertise for tenants.`,
    "milestone",
  );
  return s;
}
export function manageProperty(state, id, mode) {
  const p = state.housing.properties.find((p) => p.id === id);
  if (!p || !["move", "let", "sell", "repay", "endlease"].includes(mode))
    throw new Error("Choose an owned property and an available action.");
  const h = HOMES.find((h) => h.id === p.type);
  if (p.saleWeek !== null && mode !== "repay")
    throw new Error("This home is already on the sale market.");
  if (mode === "move" && (p.tenant || p.nextTenantWeek !== null))
    throw new Error(
      "A home advertised for rent or occupied by tenants cannot become your residence.",
    );
  if (
    mode === "move" &&
    state.family.children.some((c) => state.week - c.bornWeek < 18 * 52) &&
    h.bedrooms < 2
  )
    throw new Error("Choose a family-sized residence.");
  if (
    mode === "let" &&
    (p.tenant || p.nextTenantWeek !== null || state.housing.residence === id)
  )
    throw new Error("Only a vacant investment property can be advertised.");
  if (mode === "sell" && (p.tenant || p.nextTenantWeek !== null))
    throw new Error("Wait until the tenancy ends before selling.");
  if (mode === "repay" && !p.loan)
    throw new Error("This home has no mortgage.");
  if (mode === "endlease" && (!p.tenant || p.endLease))
    throw new Error("Only an active renewing tenancy needs notice.");
  const s = action(
    state,
    mode === "repay"
      ? p.loan.balance
      : mode === "move"
        ? 100
        : mode === "let"
          ? 150
          : 0,
  );
  const home = s.housing.properties.find((p) => p.id === id);
  if (mode === "move") {
    s.money += s.housing.deposit;
    s.housing.deposit = 0;
    s.housing.rental = null;
    s.housing.residence = id;
  }
  if (mode === "let") home.nextTenantWeek = s.week + 4;
  if (mode === "sell") home.saleWeek = s.week + 4;
  if (mode === "repay") home.loan = null;
  if (mode === "endlease") home.endLease = true;
  log(
    s,
    mode === "move"
      ? `Moved into ${h.name}.`
      : mode === "let"
        ? `Advertised ${h.name} for tenants; first review in four weeks.`
        : mode === "sell"
          ? `Listed ${h.name}; buyer reviews begin in four weeks, with a 5% selling fee.`
          : mode === "endlease"
            ? `Gave notice that ${h.name}'s lease will end at its scheduled expiry.`
            : `Repaid the mortgage on ${h.name}.`,
  );
  return s;
}
export function setRoutine(state, routine) {
  if (!["balanced", "frugal", "healthy", "mealprep"].includes(routine))
    throw new Error("Choose a daily routine.");
  if (state.ended) throw new Error("This life is complete.");
  if (routine === "mealprep" && state.pastimes.hobbies.cooking.skill < 30)
    throw new Error("Meal prep needs 30 cooking skill.");
  const s = structuredClone(state);
  s.pastimes.routine = routine;
  return s;
}
export function practiseHobby(state, id) {
  const h = HOBBIES.find((h) => h.id === id);
  if (!h) throw new Error("Choose a hobby.");
  if (h.gear.length && !h.gear.some((id) => state.inventory.includes(id)))
    throw new Error("This hobby needs suitable equipment.");
  const s = action(state, h.cost, 6),
    p = s.pastimes.hobbies[id];
  p.sessions++;
  p.skill = clamp(p.skill + 1.5);
  s.happiness = clamp(s.happiness + 3);
  if (id === "coding") s.skills.business = clamp(s.skills.business + 0.2);
  if (id === "photography" || id === "art")
    s.social.contentSkill = clamp(s.social.contentSkill + 0.4);
  log(s, `Practised ${h.name.toLowerCase()}.`);
  return s;
}
export function startHobbyProject(state, id, title) {
  const h = HOBBIES.find((h) => h.id === id),
    skill = state.pastimes.hobbies[id];
  if (
    !h ||
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 60
  )
    throw new Error("Choose a hobby and a project title (1–60 characters).");
  if (!skill || skill.skill < 25 || skill.sessions < 10)
    throw new Error("Projects need 25 skill and ten practice sessions.");
  if (h.gear.length && !h.gear.some((id) => state.inventory.includes(id)))
    throw new Error("You need suitable equipment.");
  if (state.pastimes.projects.some((p) => p.status === "working"))
    throw new Error("Finish your current project first.");
  const s = action(state, h.budget, 8);
  s.pastimes.projects.unshift({
    id: `project:${s.pastimes.serial++}`,
    hobby: id,
    title: title.trim(),
    quality: skill.skill,
    status: "working",
    finishWeek: s.week + h.weeks,
    income: 0,
    royaltyUntil: s.week + h.weeks + 52,
  });
  s.pastimes.projects = s.pastimes.projects.slice(0, 24);
  log(
    s,
    `Started ${title.trim()}; ${h.weeks} weeks of work and $${h.budget} invested.`,
  );
  return s;
}
export function deliverFreelance(state, id) {
  const o = state.pastimes.offers.find((o) => o.id === id);
  if (!o || o.status !== "offered" || o.expiresWeek < state.week)
    throw new Error("This commission is unavailable.");
  const s = action(state, 15, 10),
    offer = s.pastimes.offers.find((o) => o.id === id);
  const quality =
    s.pastimes.hobbies[o.hobby].skill * (s.energy >= 25 ? 1 : 0.65);
  const success = quality >= 35 && rng(s) < Math.min(0.97, 0.6 + quality / 250);
  offer.status = success ? "completed" : "failed";
  if (success) {
    receiveIncome(s, o.fee, "earned");
    s.pastimes.totalIncome += o.fee;
    s.pastimes.weeklyIncome += o.fee;
  }
  log(
    s,
    success
      ? `Delivered ${o.client}'s commission: +$${o.fee}.`
      : `The commission for ${o.client} did not meet the brief; no fee paid.`,
    success ? "positive" : "warning",
  );
  return s;
}
export function volunteer(state) {
  const s = action(state, 0, 8);
  s.pastimes.community = clamp(s.pastimes.community + 3);
  s.skills.charisma = clamp(s.skills.charisma + 0.8);
  s.happiness = clamp(s.happiness + 4);
  log(s, "Helped at a neighbourhood volunteer session.");
  return s;
}
export function familyAction(state, mode, options = {}) {
  const partner = state.relationships.find((r) =>
    ["Partner", "Spouse"].includes(r.role),
  );
  if (mode === "propose") {
    if (
      age(state) < 18 ||
      !partner ||
      partner.role !== "Partner" ||
      partner.bond < 80 ||
      state.week - state.family.sinceWeek < 52 ||
      state.family.engagement
    )
      throw new Error(
        "Engagement needs age 18+, a year together, and 80 connection.",
      );
    if (state.connections && state.connections.profiles[partner.id].trust < 75)
      throw new Error("A proposal also needs 75 mutual trust.");
    const s = action(state, 250);
    s.family.engagement = { partnerId: partner.id, week: s.week };
    log(s, `Engaged to ${partner.name}.`, "milestone");
    return s;
  }
  if (mode === "wedding") {
    if (
      !partner ||
      !state.family.engagement ||
      state.family.engagement.partnerId !== partner.id ||
      state.week - state.family.engagement.week < 4
    )
      throw new Error(
        "Plan your wedding at least four weeks after engagement.",
      );
    if (!["simple", "celebration"].includes(options.style))
      throw new Error("Choose a wedding style.");
    const s = action(state, options.style === "simple" ? 300 : 3000);
    s.relationships.find((r) => r.id === partner.id).role = "Spouse";
    s.family.engagement = null;
    s.happiness = clamp(s.happiness + 10);
    log(s, `Married ${partner.name}.`, "milestone");
    return s;
  }
  if (mode === "child" || mode === "adopt-child") {
    if (
      age(state) < 21 ||
      !partner ||
      partner.bond < 80 ||
      state.week - state.family.sinceWeek < 52 ||
      homeBedrooms(state) < 2 ||
      state.family.pending ||
      state.family.children.length >= 4
    )
      throw new Error(
        "Family planning needs age 21+, a year with a partner, 80 connection, a family-sized home, and room for a child.",
      );
    if (
      typeof options.name !== "string" ||
      !options.name.trim() ||
      options.name.trim().length > 32
    )
      throw new Error("Choose a child name (1–32 characters).");
    if (
      state.connections &&
      (!state.connections.profiles[partner.id].wantsChildren ||
        state.connections.profiles[partner.id].trust < 70)
    )
      throw new Error(
        "Your partner must want children and have at least 70 trust. Discuss your lives and respect their choice.",
      );
    const s = action(state, mode === "child" ? 1000 : 3000);
    s.family.pending = {
      name: options.name.trim(),
      parentId: partner.id,
      kind: mode === "child" ? "birth" : "adoption",
      arrivalWeek: s.week + (mode === "child" ? 39 : 26),
    };
    log(
      s,
      `Preparing to welcome ${options.name.trim()} in ${mode === "child" ? 39 : 26} weeks.`,
      "milestone",
    );
    return s;
  }
  if (mode === "parenting") {
    if (
      !["balanced", "quality", "education"].includes(options.style) ||
      state.ended
    )
      throw new Error("Choose a parenting focus.");
    const s = structuredClone(state);
    s.family.parenting = options.style;
    return s;
  }
  if (mode === "child-time") {
    const child = state.family.children.find((c) => c.id === options.id);
    if (!child) throw new Error("Choose one of your children.");
    const s = action(state, 10, 4),
      c = s.family.children.find((c) => c.id === options.id);
    c.bond = clamp(c.bond + 10);
    c.wellbeing = clamp(c.wellbeing + 5);
    s.happiness = clamp(s.happiness + 5);
    log(s, `Spent time with ${c.name}.`);
    return s;
  }
  if (mode === "breakup") {
    if (!partner || state.family.pending)
      throw new Error(
        "You cannot separate during a pending family arrival in this prototype.",
      );
    const s = action(state);
    settleSeparation(s, partner.id, {
      custody: options.custody || "shared",
      spouse: partner.role === "Spouse",
    });
    s.relationships.find((r) => r.id === partner.id).role = "Former partner";
    s.family.partnerId = null;
    s.family.livingTogether = false;
    for (const e of s.calendar.entries)
      if (e.personId === partner.id && e.status === "scheduled") {
        e.status = "cancelled";
        s.money += e.cost * 0.8;
      }
    s.family.engagement = null;
    s.family.sinceWeek = s.week;
    s.happiness = clamp(s.happiness - 10);
    log(
      s,
      `Separated from ${partner.name}; existing child costs and care continue.`,
      "milestone",
    );
    return s;
  }
  throw new Error("Choose a family action.");
}
export function adoptPet(state, kind, name) {
  if (
    !["dog", "cat"].includes(kind) ||
    age(state) < 18 ||
    state.family.pets.length >= 2 ||
    homeBedrooms(state) < 1
  )
    throw new Error(
      "Pet adoption needs age 18+, a private home, and fewer than two pets.",
    );
  if (typeof name !== "string" || !name.trim() || name.trim().length > 32)
    throw new Error("Choose a pet name (1–32 characters).");
  const s = action(state, kind === "dog" ? 200 : 125);
  s.family.pets.push({
    id: `pet:${s.family.serial++}`,
    kind,
    name: name.trim(),
    bond: 50,
    health: 90,
    adoptedWeek: s.week,
    nextVetWeek: s.week + 26,
  });
  log(
    s,
    `Adopted ${name.trim()}, a ${kind}. Food, care, and vet visits become part of your household budget.`,
    "milestone",
  );
  return s;
}
export function careForPet(state, id) {
  if (!state.family.pets.some((p) => p.id === id))
    throw new Error("Choose your pet.");
  const s = action(state, 0, 4),
    pet = s.family.pets.find((p) => p.id === id);
  pet.bond = clamp(pet.bond + 10);
  pet.health = clamp(pet.health + 2);
  s.happiness = clamp(s.happiness + 6);
  log(s, `Spent time caring for ${pet.name}.`);
  return s;
}
export function advanceEveryday(s) {
  const h = s.housing,
    f = s.family,
    p = s.pastimes;
  h.weeklyIncome = 0;
  p.weeklyIncome = 0;
  for (const home of [...h.properties]) {
    const d = HOMES.find((d) => d.id === home.type);
    home.value = Math.max(
      d.price * 0.4,
      round(home.value * (1 + (rng(s) - 0.45) * 0.006)),
    );
    if (home.tenant) {
      const rent = round(d.rent * 0.9);
      h.weeklyIncome += rent;
      receiveIncome(s, rent, "investment");
      if (home.nextTenantWeek <= s.week) {
        if (home.endLease || rng(s) < 0.3) {
          home.tenant = false;
          home.endLease = false;
          home.nextTenantWeek = null;
          log(
            s,
            `${d.name}'s tenant moved out. Advertise again to find a replacement.`,
          );
        } else {
          home.nextTenantWeek = s.week + 52;
          log(s, `${d.name}'s tenant renewed for another year.`);
        }
      }
    } else if (home.nextTenantWeek !== null && home.nextTenantWeek <= s.week) {
      if (rng(s) < 0.7) {
        home.tenant = true;
        home.nextTenantWeek = s.week + 52;
        log(
          s,
          `A tenant signed a one-year lease for ${d.name}: $${d.rent}/week.`,
          "positive",
        );
      } else {
        home.nextTenantWeek = s.week + 4;
        log(
          s,
          `No suitable tenant for ${d.name} yet. Another review in four weeks.`,
        );
      }
    }
    s.money -= d.upkeep;
    if (home.loan) {
      const loan = home.loan;
      loan.balance = round(loan.balance * (1 + 0.06 / 52));
      const payment = Math.min(loan.balance, loan.payment);
      if (availableCash(s) >= payment) {
        s.money = round(s.money - payment);
        loan.balance = round(loan.balance - payment);
        loan.missed = 0;
        loan.weeks = Math.max(0, loan.weeks - 1);
        if (loan.balance < 0.01) home.loan = null;
      } else {
        loan.missed++;
        log(
          s,
          `Missed mortgage payment on ${d.name}; interest accrues (${loan.missed}/13 consecutive misses).`,
          "warning",
        );
      }
      if (home.loan?.missed >= 13) {
        s.money += home.value * 0.85 - home.loan.balance;
        recordCapitalGain(s, home.value * 0.85 - home.paid * 1.02);
        h.properties = h.properties.filter((p) => p.id !== home.id);
        if (h.residence === home.id) h.residence = null;
        log(
          s,
          `${d.name} was repossessed after thirteen missed payments; the discounted sale settled the loan.`,
          "warning",
        );
        continue;
      }
    }
    if (home.saleWeek !== null && home.saleWeek <= s.week) {
      if (rng(s) < 0.65) {
        const proceeds = round(home.value * 0.95 - (home.loan?.balance || 0));
        s.money += proceeds;
        recordCapitalGain(s, home.value * 0.95 - home.paid * 1.02);
        h.properties = h.properties.filter((p) => p.id !== home.id);
        if (h.residence === home.id) h.residence = null;
        log(
          s,
          `Sold ${d.name}, settling its mortgage and 5% fee: $${proceeds.toFixed(2)} net.`,
          "milestone",
        );
      } else {
        home.saleWeek = s.week + 4;
        log(
          s,
          `No buyer for ${d.name} this month. The sale listing continues.`,
        );
      }
    }
  }
  s.money = round(s.money);
  h.totalIncome = round(h.totalIncome + h.weeklyIncome);
  const partner = s.relationships.find((r) =>
    ["Partner", "Spouse"].includes(r.role),
  );
  if ((partner?.id || null) !== f.partnerId) {
    f.partnerId = partner?.id || null;
    f.sinceWeek = s.week;
    f.engagement = null;
  }
  if (f.pending && f.pending.arrivalWeek <= s.week) {
    const child = f.pending;
    f.children.push({
      id: `child:${f.serial++}`,
      name: child.name,
      parentId: child.parentId,
      bornWeek: s.week,
      bond: 80,
      wellbeing: 85,
      education: 50,
    });
    f.pending = null;
    s.happiness = clamp(s.happiness + 12);
    log(s, `Welcomed ${child.name} to the family.`, "milestone");
  }
  for (const c of f.children) {
    const years = Math.floor((s.week - c.bornWeek) / 52);
    if (years < 18) {
      c.bond = clamp(c.bond + (f.parenting === "quality" ? 0.3 : -0.15));
      c.wellbeing = clamp(
        c.wellbeing +
          (s.money < 0 ? -0.5 : f.parenting === "quality" ? 0.15 : 0) -
          (homeBedrooms(s) < 2 ? 0.3 : 0),
      );
      if (years >= 5)
        c.education = clamp(
          c.education + (f.parenting === "education" ? 0.15 : 0.02),
        );
      s.energy = clamp(
        s.energy -
          (years < 5 ? 1.5 : 0.5) -
          (f.parenting === "balanced" ? 0 : 0.5),
      );
    }
    if (s.week > c.bornWeek && (s.week - c.bornWeek) % 52 === 0)
      log(
        s,
        `${c.name} turned ${years}${years === 5 ? " and started school" : years === 18 ? "; childhood support costs have ended" : ""}.`,
        "milestone",
      );
  }
  for (const pet of [...f.pets]) {
    const lifespan = pet.kind === "dog" ? 13 : 17;
    if (s.week - pet.adoptedWeek >= lifespan * 52 || pet.health <= 0) {
      f.petMemories.unshift({
        id: pet.id,
        name: pet.name,
        kind: pet.kind,
        week: s.week,
      });
      f.petMemories = f.petMemories.slice(0, 8);
      f.pets = f.pets.filter((p) => p.id !== pet.id);
      s.happiness = clamp(s.happiness - 8);
      log(
        s,
        `Said goodbye to ${pet.name}, a much-loved companion.`,
        "milestone",
      );
      continue;
    }
    pet.bond = clamp(pet.bond - 0.4);
    pet.health = clamp(pet.health - (s.money < 0 ? 0.6 : 0.05));
    if (pet.nextVetWeek <= s.week) {
      if (availableCash(s) >= 80) {
        s.money -= 80;
        pet.health = clamp(pet.health + 5);
        pet.nextVetWeek = s.week + 26;
        log(s, `${pet.name}'s routine vet check cost $80.`);
      } else {
        pet.nextVetWeek = s.week + 4;
        pet.health = clamp(pet.health - 3);
        log(
          s,
          `${pet.name}'s vet appointment needs $80; rescheduled in four weeks.`,
          "warning",
        );
      }
    }
  }
  if (p.routine === "frugal") s.happiness = clamp(s.happiness - 0.4);
  if (p.routine === "healthy" || p.routine === "mealprep")
    s.health = clamp(s.health + 0.4);
  for (const project of p.projects) {
    if (
      project.status === "working" &&
      allocationRatio(s, "project", 4) < 0.5
    ) {
      project.finishWeek++;
      project.royaltyUntil++;
    }
    if (project.status === "working" && project.finishWeek <= s.week) {
      project.status = "released";
      log(
        s,
        `Completed ${project.title}. It now forms part of your portfolio; sales are uncertain.`,
        "milestone",
      );
    }
    if (project.status === "released" && project.royaltyUntil >= s.week) {
      const audience =
        1 +
        Math.min(
          2,
          Math.log10(
            1 +
              Object.values(s.social.profiles).reduce(
                (n, a) => n + a.followers,
                0,
              ),
          ) / 3,
        );
      const income = round(
        Math.max(
          0,
          (project.quality - 20) *
            0.2 *
            rng(s) *
            audience *
            Math.max(0.05, 1 - (s.week - project.finishWeek) / 60),
        ),
      );
      project.income = round(project.income + income);
      p.weeklyIncome += income;
      p.totalIncome += income;
      receiveIncome(s, income, "earned");
    }
  }
  for (const o of p.offers)
    if (o.status === "offered" && o.expiresWeek < s.week) o.status = "expired";
  if (p.nextOffer <= s.week) {
    p.nextOffer = s.week + 4;
    const qualified = HOBBIES.filter(
      (h) =>
        p.hobbies[h.id].skill >= 40 &&
        p.projects.some((r) => r.hobby === h.id && r.status === "released"),
    );
    if (age(s) >= 18 && qualified.length && rng(s) < 0.4 + p.community / 400) {
      const skill = qualified[Math.floor(rng(s) * qualified.length)];
      p.offers.unshift({
        id: `commission:${p.serial++}`,
        hobby: skill.id,
        client: [
          "A neighbourhood business",
          "An independent festival",
          "A community organiser",
        ][Math.floor(rng(s) * 3)],
        fee: Math.round(skill.fee * (0.7 + p.hobbies[skill.id].skill / 70)),
        expiresWeek: s.week + 3,
        status: "offered",
      });
      p.offers = p.offers.slice(0, 16);
      log(
        s,
        "A paid creative commission is available on Hobbies & journal.",
        "positive",
      );
    }
  }
}
export function recordMilestones(s, wealth) {
  const checks = {
    "first-job": !!s.employment,
    graduate: s.education.completed.some((id) => id.endsWith("-degree")),
    homeowner:
      s.housing.properties.length > 0 ||
      s.inventory.some((id) => Object.hasOwn(LEGACY_BEDROOMS, id)),
    landlord: s.housing.properties.some((p) => p.tenant),
    married: s.relationships.some((r) => r.role === "Spouse"),
    parent: s.family.children.length > 0,
    pet: s.family.pets.length > 0,
    maker: s.pastimes.projects.some((p) => p.status === "released"),
    artist: s.music.releases.length > 0,
    audience:
      Object.values(s.social.profiles).reduce((n, p) => n + p.followers, 0) >=
      1000,
    millionaire: wealth >= 1e6,
    owner: BUSINESSES.some((b) => stakePercent(s, b.id) > 50),
  };
  for (const [id, name] of MILESTONES)
    if (checks[id] && !s.milestones.some((m) => m.id === id)) {
      s.milestones.push({ id, week: s.week });
      log(s, `Life milestone: ${name}.`, "milestone");
    }
}
export function validateEveryday(s) {
  const n = (v, min = 0, max = Infinity) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const int = (v, min = 0, max = Infinity) =>
    n(v, min, max) && Number.isInteger(v);
  const list = (v, max) => Array.isArray(v) && v.length <= max;
  const text = (v, max) =>
    typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const unique = (a) => new Set(a.map((x) => x.id)).size === a.length;
  const fail = () => {
    throw new Error(
      "Invalid debug, housing, family, hobby, or milestone data in save.",
    );
  };
  const h = s.housing,
    f = s.family,
    p = s.pastimes,
    d = s.debug;
  if (
    !d ||
    typeof d.enabled !== "boolean" ||
    typeof d.used !== "boolean" ||
    (d.enabled && !d.used) ||
    !list(d.edits, 20) ||
    d.edits.some((e) => !int(e.week, 0, s.week) || !text(e.text, 200))
  )
    fail();
  if (
    !h ||
    !(h.rental === null || RENTALS.some((r) => r.id === h.rental)) ||
    !n(h.deposit) ||
    h.deposit !==
      (s.realWorld?.economy.rentalTerms?.id === h.rental
        ? s.realWorld.economy.rentalTerms.deposit
        : RENTALS.find((r) => r.id === h.rental)?.deposit || 0) ||
    !n(h.weeklyIncome) ||
    !n(h.totalIncome) ||
    !list(h.properties, 6) ||
    !unique(h.properties)
  )
    fail();
  if (
    h.properties.some(
      (p) =>
        !text(p.id, 80) ||
        !HOMES.some((h) => h.id === p.type) ||
        !n(p.paid, 1) ||
        !n(p.value, 1) ||
        !int(p.purchasedWeek, 0, s.week) ||
        typeof p.tenant !== "boolean" ||
        typeof p.endLease !== "boolean" ||
        (p.endLease && !p.tenant) ||
        !(p.nextTenantWeek === null || int(p.nextTenantWeek)) ||
        !(p.saleWeek === null || int(p.saleWeek)) ||
        (p.tenant && p.nextTenantWeek === null) ||
        (p.saleWeek !== null && (p.tenant || p.nextTenantWeek !== null)) ||
        (p.loan !== null &&
          (!n(p.loan.balance, 0.01) ||
            !n(p.loan.payment, 0.01) ||
            !int(p.loan.missed, 0, 12) ||
            !int(p.loan.weeks, 0, 1040))),
    )
  )
    fail();
  if (
    !(
      h.residence === null ||
      h.properties.some(
        (p) => p.id === h.residence && !p.tenant && p.nextTenantWeek === null,
      )
    ) ||
    (h.residence !== null && h.rental !== null)
  )
    fail();
  if (
    !f ||
    !(
      f.partnerId === null ||
      s.relationships.some(
        (r) => r.id === f.partnerId && ["Partner", "Spouse"].includes(r.role),
      )
    ) ||
    !int(f.sinceWeek, 0, s.week) ||
    !int(f.serial) ||
    !["balanced", "quality", "education"].includes(f.parenting) ||
    !list(f.children, 4) ||
    !list(f.pets, 2) ||
    !list(f.petMemories, 8) ||
    !unique(f.petMemories) ||
    f.petMemories.some(
      (p) =>
        !text(p.id, 80) ||
        !text(p.name, 32) ||
        !["dog", "cat"].includes(p.kind) ||
        !int(p.week, 0, s.week),
    ) ||
    !unique(f.children) ||
    !unique(f.pets)
  )
    fail();
  if (
    f.engagement !== null &&
    (!int(f.engagement.week, 0, s.week) ||
      f.engagement.partnerId !== f.partnerId ||
      !f.partnerId)
  )
    fail();
  if (
    f.pending !== null &&
    (!text(f.pending.name, 32) ||
      !s.relationships.some((r) => r.id === f.pending.parentId) ||
      !["birth", "adoption"].includes(f.pending.kind) ||
      !int(f.pending.arrivalWeek, s.week))
  )
    fail();
  if (
    f.children.some(
      (c) =>
        !text(c.id, 80) ||
        !text(c.name, 32) ||
        !s.relationships.some((r) => r.id === c.parentId) ||
        !int(c.bornWeek, 0, s.week) ||
        !n(c.bond, 0, 100) ||
        !n(c.wellbeing, 0, 100) ||
        !n(c.education, 0, 100),
    )
  )
    fail();
  if (
    f.pets.some(
      (c) =>
        !text(c.id, 80) ||
        !text(c.name, 32) ||
        !["dog", "cat"].includes(c.kind) ||
        !int(c.adoptedWeek, 0, s.week) ||
        !int(c.nextVetWeek, s.week) ||
        !n(c.bond, 0, 100) ||
        !n(c.health, 0, 100),
    )
  )
    fail();
  if (
    !p ||
    !["balanced", "frugal", "healthy", "mealprep"].includes(p.routine) ||
    !n(p.community, 0, 100) ||
    !int(p.serial) ||
    !n(p.weeklyIncome) ||
    !n(p.totalIncome) ||
    !int(p.nextOffer) ||
    !list(p.projects, 24) ||
    !list(p.offers, 16) ||
    !unique(p.projects) ||
    !unique(p.offers) ||
    HOBBIES.some(
      (h) =>
        !n(p.hobbies?.[h.id]?.skill, 0, 100) || !int(p.hobbies[h.id].sessions),
    )
  )
    fail();
  if (
    p.projects.some(
      (r) =>
        !text(r.id, 80) ||
        !text(r.title, 60) ||
        !HOBBIES.some((h) => h.id === r.hobby) ||
        !["working", "released"].includes(r.status) ||
        !int(r.finishWeek) ||
        !int(r.royaltyUntil, r.finishWeek) ||
        !n(r.income) ||
        !n(r.quality, 0, 100),
    ) ||
    p.projects.filter((r) => r.status === "working").length > 1
  )
    fail();
  if (
    p.offers.some(
      (o) =>
        !text(o.id, 80) ||
        !text(o.client, 80) ||
        !HOBBIES.some((h) => h.id === o.hobby) ||
        !n(o.fee, 1) ||
        !int(o.expiresWeek) ||
        !["offered", "completed", "failed", "expired"].includes(o.status),
    )
  )
    fail();
  if (
    !list(s.milestones, MILESTONES.length) ||
    !unique(s.milestones) ||
    s.milestones.some(
      (m) => !MILESTONES.some((x) => x[0] === m.id) || !int(m.week, 0, s.week),
    )
  )
    fail();
}
