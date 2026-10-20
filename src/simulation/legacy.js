import { initializeLivingWorld } from "../living-world.js";
import { createGame, MARKETS, SHOP, portfolioValue } from "../engine.js";
import {
  BUSINESSES,
  privateOwnershipValue,
  collectibleValue,
} from "../world.js";
import { resalePrice } from "../economy.js";
import { jointShare } from "../realism.js";
import { personProfile } from "../connections.js";
import { initializeLifeCourse } from "../life-course.js";
import { initializeSimulation } from "./index.js";
import {
  founderShare,
  additionalBusinessValue,
  mobilityDebt,
  cryptoWalletValue,
} from "./effects.js";
import {
  act,
  age,
  clamp,
  round,
  roll,
  uid,
  note,
  num,
  str,
  bool,
  one,
  arr,
  obj,
} from "./common.js";
export function initializeLegacy(s) {
  return {
    generation: 0,
    will: null,
    previousLife: null,
    archive: [],
    settled: [],
    trusts: [],
    companies: [],
    relatives: [],
    lastWeek: s.week,
  };
}
export function estateBeneficiaries(s) {
  return [
    ...s.family.children.map((c) => ({
      id: c.id,
      name: c.name,
      bornWeek: c.bornWeek,
      kind: "child",
    })),
    ...(s.family.partnerId
      ? [
          {
            id: s.family.partnerId,
            name:
              s.relationships.find((r) => r.id === s.family.partnerId)?.name ||
              "Your partner",
            bornWeek: null,
            kind: "partner",
          },
        ]
      : []),
    {
      id: "charity",
      name: "Community charitable fund",
      bornWeek: null,
      kind: "charity",
    },
  ];
}
export function writeWill(state, allocations, trustAge = 18) {
  const choices = estateBeneficiaries(state);
  if (
    !Array.isArray(allocations) ||
    !allocations.length ||
    allocations.length > 22 ||
    allocations.some(
      (a) =>
        !choices.some((b) => b.id === a.id) ||
        !Number.isInteger(a.share) ||
        a.share < 1 ||
        a.share > 100,
    ) ||
    new Set(allocations.map((a) => a.id)).size !== allocations.length ||
    allocations.reduce((n, a) => n + a.share, 0) !== 100 ||
    ![18, 21, 25].includes(trustAge)
  )
    throw new Error(
      "Allocate exactly 100% among existing beneficiaries and choose trust release at 18, 21 or 25.",
    );
  const s = act(state, { minAge: 18, cost: 150, hours: 3 });
  s.simulation.legacy.will = {
    week: s.week,
    allocations: allocations.map((a) => ({ ...a })),
    trustAge,
  };
  note(
    s,
    "Signed an estate plan. Debt, executor sale costs and estate tax are paid before the actual remaining estate is distributed.",
  );
  return s;
}
export function estateQuote(s) {
  const liquid =
      Math.max(0, s.money) +
      s.banking.savings +
      (s.workLife.pension || 0) +
      s.simulation.legacy.trusts
        .filter((t) => t.beneficiary === s.name && !t.released)
        .reduce((n, t) => n + t.amount, 0) +
      jointShare(s) +
      s.housing.deposit,
    market = portfolioValue(s) + cryptoWalletValue(s),
    property = s.housing.properties.reduce((n, p) => n + p.value * 0.95, 0),
    possessions = SHOP.filter(
      (i) => i.category !== "Ownership" && s.inventory.includes(i.id),
    ).reduce((n, i) => n + resalePrice(s, i), 0),
    business =
      ((s.company?.value || 0) * founderShare(s) +
        privateOwnershipValue(s) +
        additionalBusinessValue(s)) *
      0.9,
    collectibles = collectibleValue(s),
    gross = round(
      liquid + market + property + possessions + business + collectibles,
    ),
    debts = round(
      Math.max(0, -s.money) +
        s.banking.loans.reduce((n, l) => n + l.balance, 0) +
        s.housing.properties.reduce((n, p) => n + (p.loan?.balance || 0), 0) +
        mobilityDebt(s) +
        s.realWorld.household.support.reduce((n, a) => n + a.arrears, 0),
    ),
    net = Math.max(0, round(gross - debts)),
    tax = round(Math.max(0, net - 500000) * 0.2),
    distributable = round(net - tax);
  let allocation = s.simulation.legacy.will?.allocations;
  if (!allocation) {
    const children = s.family.children;
    if (s.family.partnerId && children.length)
      allocation = [
        { id: s.family.partnerId, share: 50 },
        ...children.map((c) => ({ id: c.id, share: 50 / children.length })),
      ];
    else if (children.length)
      allocation = children.map((c) => ({
        id: c.id,
        share: 100 / children.length,
      }));
    else allocation = [{ id: s.family.partnerId || "charity", share: 100 }];
  }
  let remainder = distributable;
  const distributions = allocation.map((a, i) => {
    const amount =
      i === allocation.length - 1
        ? remainder
        : round((distributable * a.share) / 100);
    remainder = round(remainder - amount);
    return {
      ...a,
      amount,
      name:
        estateBeneficiaries(s).find((b) => b.id === a.id)?.name ||
        "Named beneficiary",
    };
  });
  return {
    gross,
    debts,
    tax,
    distributable,
    shortfall: round(Math.max(0, debts - gross)),
    market,
    property,
    possessions,
    business,
    distributions,
    trustAge: s.simulation.legacy.will?.trustAge || 18,
  };
}
export function eligibleHeirs(s) {
  return s.family.children.filter((c) => {
    const years = Math.floor((s.week - c.bornWeek) / 52);
    return years >= 18 && years < 90;
  });
}
export function continueAsHeir(state, childId) {
  const old = state.simulation.legacy,
    child = eligibleHeirs(state).find((c) => c.id === childId),
    settlement = `life:${old.generation}:${state.week}`;
  if (
    !state.ended ||
    !child ||
    old.generation >= 50 ||
    old.settled.includes(settlement)
  )
    throw new Error(
      "Continue a completed life as an existing adult child, once per estate, for up to fifty generations.",
    );
  const quote = estateQuote(state),
    years = Math.floor((state.week - child.bornWeek) / 52),
    adult = state.simulation.social.children[child.id]?.adult,
    inheritance =
      quote.distributions.find((d) => d.id === childId)?.amount || 0,
    n = createGame({
      name: child.name,
      age: 0,
      worldWeek: state.week,
      ageEpochWeek: child.bornWeek,
      startingYear: state.startingYear,
      city: state.city,
      country: state.globalLife.residence.country,
      seed: (state.simulation.seed ^ 0x62c41f) >>> 0,
      education: child.education >= 60 ? "school" : "none",
      historical: state.simulation.era.enabled,
    });
  // The executor sells the parent's personal assets. The new life starts with its
  // own money plus the actual net cash allocation, never a second asset copy.
  n.money = round(adult?.savings || 0);
  n.health = clamp(child.wellbeing);
  n.happiness = clamp(child.bond);
  n.skills.knowledge = clamp(child.education * 0.6);
  const ownDegree = adult?.qualified
    ? {
        medicine: "medicine-degree",
        engineering: "engineering-degree",
        teaching: "teaching-degree",
      }[state.simulation.social.children[child.id]?.ambition]
    : null;
  if (ownDegree && !n.education.completed.includes(ownDegree))
    n.education.completed.push(ownDegree);
  n.school.grade = child.education;
  const family = [],
    profiles = {},
    relatives = {},
    parentId = `ancestor:${old.generation}`;
  family.push({
    id: parentId,
    name: state.name,
    role: "Parent",
    bond: child.bond,
    icon: state.name
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2),
    color: "purple",
  });
  profiles[parentId] = {
    ...personProfile(n, family[0]),
    ageOffset: Math.max(18, age(state) - years),
    wealth: 0,
    weeklyPay: 0,
    job: "Deceased",
    plans: "Remembered in your family",
  };
  relatives[parentId] = {
    health: 0,
    retired: true,
    deceasedWeek: state.week,
    deathAge: Math.max(75, Math.min(100, age(state))),
    path: "retired",
    lastAge: age(state),
  };
  const other = state.relationships.find((r) => r.id === child.parentId);
  if (other && state.lifeCourse.relatives[other.id]?.deceasedWeek == null) {
    const r = { ...other, role: "Parent" },
      p = state.connections.profiles[other.id],
      offset = age(state) + p.ageOffset - years;
    if (offset >= 18 && offset <= 100) {
      family.push(r);
      profiles[r.id] = {
        ...p,
        ageOffset: offset,
        wealth: round(
          p.wealth +
            (quote.distributions.find((d) => d.id === r.id)?.amount || 0),
        ),
      };
    }
  }
  for (const sibling of state.family.children
    .filter((c) => c.id !== childId)
    .slice(0, 4)) {
    const siblingYears = Math.floor((state.week - sibling.bornWeek) / 52);
    if (Math.abs(siblingYears - years) > 30) continue;
    const r = {
      id: `relative:${old.generation}:${sibling.id}`,
      name: sibling.name,
      role: "Sibling",
      bond: Math.round((sibling.bond + child.bond) / 2),
      icon: sibling.name.slice(0, 2).toUpperCase(),
      color: "blue",
    };
    family.push(r);
    profiles[r.id] = {
      ...personProfile(n, r),
      ageOffset: siblingYears - years,
      wealth: round(
        (state.simulation.social.children[sibling.id]?.adult?.savings || 0) +
          (siblingYears >= quote.trustAge
            ? quote.distributions.find((d) => d.id === sibling.id)?.amount || 0
            : 0),
      ),
      weeklyPay: siblingYears >= 18 ? 450 : 0,
      job: siblingYears >= 18 ? "Independent working life" : "Student",
    };
  }
  if (adult?.partner) {
    const r = {
      id: `heir-partner:${old.generation}:${childId}`,
      name: `${child.name.split(" ")[0]}’s partner`,
      role: "Partner",
      bond: 70,
      icon: "PA",
      color: "green",
    };
    family.push(r);
    profiles[r.id] = personProfile(n, r);
    n.family.partnerId = r.id;
    n.family.livingTogether = true;
    n.family.sinceWeek = n.week;
    for (const c of adult.children)
      n.family.children.push({
        id: `descendant:${old.generation}:${c.id}`,
        name: c.name,
        parentId: r.id,
        bornWeek: c.bornWeek,
        bond: 75,
        wellbeing: 85,
        education: 50,
        interest: "music",
        club: "none",
        schoolType: "state",
        confidence: 60,
        independence: 50,
        future: "undecided",
        support: false,
        lastSupportWeek: n.week,
      });
  }
  if (family.length < 2) {
    const contact = state.relationships.find(
      (r) => r.id !== child.parentId && r.role !== "Parent",
    );
    if (contact) {
      const r = {
        ...contact,
        id: `family-friend:${old.generation}:${contact.id}`,
        role: "Family friend",
      };
      family.push(r);
      profiles[r.id] = {
        ...state.connections.profiles[contact.id],
        ageOffset:
          age(state) + state.connections.profiles[contact.id].ageOffset - years,
      };
    } else {
      const r = {
        id: `executor:${old.generation}`,
        name: "Family estate solicitor",
        role: "Family friend",
        bond: 40,
        icon: "ES",
        color: "blue",
      };
      family.push(r);
      profiles[r.id] = personProfile(n, r);
    }
  }
  n.relationships = family.slice(0, 8);
  n.connections.profiles = Object.fromEntries(
    n.relationships.map((r) => [r.id, profiles[r.id]]),
  );
  initializeLifeCourse(n, { legacy: true });
  for (const [id, p] of Object.entries(relatives))
    n.lifeCourse.relatives[id] = p;
  initializeLivingWorld(n);
  n.characterLife.parentInterests = Object.fromEntries(
    n.relationships
      .filter((r) => r.role === "Parent")
      .map((r) => [r.id, "school"]),
  );
  initializeSimulation(n);
  const l = n.simulation.legacy,
    parentSnapshot = structuredClone(state);
  parentSnapshot.simulation.legacy.previousLife = null;
  l.previousLife = JSON.stringify(parentSnapshot);
  l.generation = old.generation + 1;
  l.settled = [...old.settled, settlement].slice(-50);
  l.archive = [
    ...old.archive,
    {
      id: settlement,
      name: state.name,
      week: state.week,
      age: age(state),
      netEstate: quote.distributable,
      debt: quote.debts,
      tax: quote.tax,
      heir: child.name,
      received: inheritance,
      distributions: quote.distributions.map((d) => ({
        id: d.id,
        name: d.name,
        share: d.share,
        amount: d.amount,
      })),
      career: state.career,
    },
  ].slice(-50);
  l.companies = structuredClone(old.companies);
  if (state.company)
    l.companies.push({
      id: `family-company:${old.generation}`,
      name: state.company.name,
      sector: state.company.sector,
      value: state.company.value,
      cash: state.company.cash,
      revenue: state.company.revenue,
      costs: state.company.costs,
      profit: state.company.profit,
      employees: state.company.employees,
      lastWeek: state.week,
    });
  l.companies = l.companies.slice(-20);
  l.trusts = structuredClone(
    old.trusts.filter(
      (t) =>
        t.beneficiary !== state.name &&
        !t.released &&
        t.releaseWeek > state.week,
    ),
  );
  if (years < quote.trustAge)
    l.trusts.push({
      id: `trust:${settlement}:${childId}`,
      beneficiary: child.name,
      amount: inheritance,
      releaseWeek: child.bornWeek + quote.trustAge * 52,
      released: false,
    });
  else n.money = round(n.money + inheritance);
  for (const c of state.family.children.filter(
    (c) =>
      c.id !== childId &&
      Math.floor((state.week - c.bornWeek) / 52) < quote.trustAge,
  )) {
    const amount = quote.distributions.find((d) => d.id === c.id)?.amount || 0;
    if (amount)
      l.trusts.push({
        id: `trust:${settlement}:${c.id}`,
        beneficiary: c.name,
        amount,
        releaseWeek: c.bornWeek + quote.trustAge * 52,
        released: false,
      });
  }
  l.relatives = state.family.children
    .filter((c) => c.id !== childId)
    .map((c) => ({
      id: `relative:${old.generation}:${c.id}`,
      name: c.name,
      bornWeek: c.bornWeek,
      wealth: round(
        (state.simulation.social.children[c.id]?.adult?.savings || 0) +
          (Math.floor((state.week - c.bornWeek) / 52) >= quote.trustAge
            ? quote.distributions.find((d) => d.id === c.id)?.amount || 0
            : 0),
      ),
      alive: true,
    }));
  // Keep the world's clock, companies, market history and people outside this
  // new character. Personal debts, qualifications and contracts are not inherited.
  for (const key of [
    "market",
    "marketHistory",
    "assetValues",
    "businessResults",
    "opportunities",
    "negotiations",
    "collectibles",
  ])
    n[key] = structuredClone(state[key]);
  n.negotiations = [];
  n.collectibles.owned = {};
  n.collectibles.auctions = [];
  n.teams = {};
  n.ownership = {};
  n.simulation.economy = structuredClone(state.simulation.economy);
  n.simulation.economy.budget = null;
  n.simulation.economy.insolvency = null;
  for (const id of Object.keys(n.simulation.economy.crypto.wallets)) {
    n.simulation.economy.crypto.wallets[id] = 0;
    n.simulation.economy.crypto.walletBasis[id] = 0;
  }
  n.simulation.economy.crypto.exchange = "regulated";
  n.simulation.originSeed = state.simulation.originSeed;
  n.ownershipPlay.competitions = structuredClone(
    state.ownershipPlay.competitions,
  );
  n.realWorld.rivals = structuredClone(state.realWorld.rivals);
  n.realWorld.economy = {
    ...structuredClone(state.realWorld.economy),
    taxBuckets: {},
    purchaseBasis: {},
    rentalTerms: null,
  };
  for (const a of n.realWorld.rivals.athletes.filter((a) => a.player)) {
    a.player = false;
    a.status = "free";
    a.availableSince = n.week;
  }
  n.banking.baseRate = state.banking.baseRate;
  n.banking.savingsRate = state.banking.savingsRate;
  n.debug = structuredClone(state.debug);
  n.experience.locks = structuredClone(state.experience.locks);
  n.characterLife.proPreview = state.characterLife.proPreview;
  n.history = [
    {
      week: n.week,
      value: n.money + inheritance * (years < quote.trustAge ? 1 : 0),
    },
  ];
  n.log = [];
  note(
    n,
    `Continued as ${child.name}, age ${years}, in the same world. The executor liquidated personal assets, paid estate liabilities and tax, and allocated $${inheritance}. The heir retains their own recorded education; parental qualifications and career contracts do not transfer.`,
  );
  return n;
}
export function buyFamilyCompany(state, id) {
  const c = state.simulation.legacy.companies.find((c) => c.id === id);
  if (!c || state.company || Math.floor(state.week / 13) % 4 !== 0)
    throw new Error(
      "A family-world company must be in its quarterly sale window, and your founded-company slot must be free.",
    );
  const s = act(state, {
    minAge: 18,
    cost: Math.round(c.value * 1.15),
    hours: 4,
  });
  s.company = {
    name: c.name,
    sector: c.sector,
    strategy: "balanced",
    value: c.value,
    cash: c.cash,
    revenue: c.revenue,
    costs: c.costs,
    profit: c.profit,
    employees: c.employees,
    periodProfit: 0,
  };
  s.profession.company.delegated = true;
  s.simulation.legacy.companies = s.simulation.legacy.companies.filter(
    (x) => x.id !== id,
  );
  return s;
}
export function advanceLegacy(s) {
  const l = s.simulation.legacy;
  if (l.lastWeek === s.week) return;
  l.lastWeek = s.week;
  for (const t of l.trusts.filter(
    (t) => !t.released && t.releaseWeek <= s.week && t.beneficiary === s.name,
  )) {
    s.money = round(s.money + t.amount);
    t.released = true;
    note(
      s,
      `A family trust released its $${t.amount} principal. The release is a transfer of an existing asset.`,
    );
  }
  for (const c of l.companies) {
    c.lastWeek = s.week;
    c.revenue = round(Math.max(50, c.revenue * (0.999 + roll(s) * 0.002)));
    c.costs = round(Math.max(40, c.costs * (0.999 + roll(s) * 0.002)));
    c.profit = round(c.revenue - c.costs);
    c.cash = round(c.cash + c.profit);
    c.value = Math.max(
      500,
      Math.round(c.value * (c.cash < 0 ? 0.998 : 1.0001)),
    );
  }
  if (s.week % 52 === 0)
    for (const r of l.relatives) {
      const years = Math.floor((s.week - r.bornWeek) / 52);
      if (years >= 95) r.alive = false;
      else if (s.connections.profiles[r.id])
        r.wealth = s.connections.profiles[r.id].wealth;
      else if (r.alive && years >= 18) r.wealth = round(r.wealth + 5200);
      for (const t of l.trusts.filter(
        (t) =>
          !t.released && t.beneficiary === r.name && t.releaseWeek <= s.week,
      )) {
        r.wealth = round(r.wealth + t.amount);
        if (s.connections.profiles[r.id])
          s.connections.profiles[r.id].wealth = r.wealth;
        t.released = true;
      }
    }
}
export function validateLegacy(s) {
  const l = obj(s.simulation.legacy);
  num(l.generation, 0, 50, true);
  num(l.lastWeek, 0, s.week, true);
  if (l.previousLife !== null) {
    str(l.previousLife, 2000000);
    const prior = JSON.parse(l.previousLife);
    if (
      !prior.ended ||
      prior.week > s.week ||
      prior.simulation?.legacy?.previousLife !== null
    )
      throw new Error("Invalid completed-life snapshot.");
  }
  if (l.will) {
    num(l.will.week, 0, s.week, true);
    one(l.will.trustAge, [18, 21, 25]);
    for (const a of arr(l.will.allocations, 22)) {
      str(a.id, 100);
      num(a.share, 1, 100, true);
    }
    if (
      l.will.allocations.reduce((n, a) => n + a.share, 0) !== 100 ||
      new Set(l.will.allocations.map((a) => a.id)).size !==
        l.will.allocations.length
    )
      throw new Error("Invalid estate allocation.");
  }
  for (const id of arr(l.settled, 50)) str(id, 100);
  for (const a of arr(l.archive, 50)) {
    str(a.id, 100);
    str(a.name, 32);
    num(a.week, 0, s.week, true);
    num(a.age, 0, 120, true);
    for (const k of ["netEstate", "debt", "tax", "received"])
      num(a[k], 0, 1e15);
    str(a.heir, 32);
    str(a.career, 40);
    for (const d of arr(a.distributions, 22)) {
      str(d.id, 100);
      str(d.name, 100);
      num(d.share, 0, 100);
      num(d.amount, 0, 1e15);
    }
  }
  if (
    l.archive.length !== l.generation ||
    l.settled.length !== l.generation ||
    new Set(l.settled).size !== l.settled.length
  )
    throw new Error("Invalid generation history.");
  for (const t of arr(l.trusts, 50)) {
    str(t.id, 150);
    str(t.beneficiary, 32);
    num(t.amount, 0, 1e15);
    num(t.releaseWeek, 0, s.week + 25 * 52, true);
    bool(t.released);
  }
  for (const c of arr(l.companies, 20)) {
    str(c.id, 100);
    str(c.name, 40);
    str(c.sector, 100);
    num(c.value, 500, 1e12);
    num(c.cash, -1e15, 1e15);
    num(c.revenue);
    num(c.costs);
    num(c.profit, -1e12, 1e12);
    num(c.employees, 1, 100000, true);
    num(c.lastWeek, 0, s.week, true);
  }
  for (const r of arr(l.relatives, 20)) {
    str(r.id, 100);
    str(r.name, 32);
    num(r.bornWeek, 0, s.week, true);
    num(r.wealth, 0, 1e15);
    bool(r.alive);
  }
}
