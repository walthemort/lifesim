import { RENTALS } from "./everyday.js";
import { country } from "./geography.js";
import { initializeRivals, prepareRivals } from "./rivals.js";
import { FX, residenceCode, localProfile, economyProfile } from "./economy.js";
import { rng, availableCash, jobDefinition } from "./world.js";
import { spendTime } from "./calendar.js";
import { receiveIncome } from "./banking.js";
import { assertCareerPath } from "./career-commitment.js";

const age = (s) => s.startAge + Math.floor(s.week / 52),
  round = (n) => Math.round(n * 100) / 100,
  clamp = (n) => Math.max(0, Math.min(100, n));
const note = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
function act(state, hours = 2, minAge = 18) {
  if (
    state.ended ||
    state.event ||
    state.globalLife.crime.prison ||
    age(state) < minAge ||
    !state.actions
  )
    throw new Error(
      `Requires age ${minAge}+, an action and no pending life choice or custody.`,
    );
  const s = structuredClone(state);
  spendTime(s, hours, "Real-world decisions");
  s.actions--;
  return s;
}
export function initializeRealism(s, { legacy = false } = {}) {
  const t = s.banking.tax;
  s.realWorld = {
    seed: (s.seed ^ 0x729a612f) >>> 0,
    serial: 0,
    lastWeek: s.week,
    economy: {
      rates: { ...FX },
      taxBuckets: {},
      purchaseBasis: {},
      rentalTerms: null,
    },
    household: {
      joint: null,
      separations: [],
      custody: {},
      support: [],
      parentalLeave: null,
      statements: [],
      lastWeek: s.week,
    },
    products: [],
    rights: {},
    setbacks: [],
    observed: { releases: s.music.releases.map((r) => r.id), contracts: [] },
    appearance: { automatic: true },
    retiredMusic: false,
  };
  if (legacy && (t.earned || t.investment || t.capitalNet || t.withheld))
    s.realWorld.economy.taxBuckets[`${t.year}:legacy`] = {
      year: t.year,
      country: residenceCode(s),
      earned: t.earned,
      investment: t.investment,
      capital: t.capitalNet,
      withheld: t.withheld,
      legacy: true,
    };
  if (legacy && s.housing.rental) {
    const r = RENTALS.find((r) => r.id === s.housing.rental);
    s.realWorld.economy.rentalTerms = {
      id: r.id,
      rent: r.rent,
      deposit: s.housing.deposit,
      country: residenceCode(s),
    };
  }
  initializeRivals(s);
}
export function jointShare(s) {
  const j = s.realWorld?.household.joint;
  if (!j) return 0;
  const total = j.playerBasis + j.partnerBasis;
  return round(j.balance * (total ? j.playerBasis / total : 0));
}
export function openJointAccount(state) {
  const id = state.family.partnerId,
    p = state.connections.profiles[id];
  if (!id || !state.family.livingTogether || !p || p.trust < 65)
    throw new Error(
      "A shared home, partner consent and 65 trust are required.",
    );
  if (state.realWorld.household.joint)
    throw new Error("A joint account is already open.");
  const s = act(state);
  s.realWorld.household.joint = {
    partnerId: id,
    balance: 0,
    playerBasis: 0,
    partnerBasis: 0,
    openedWeek: s.week,
  };
  return s;
}
export function jointTransfer(state, { direction, amount }) {
  amount = Number(amount);
  const j = state.realWorld.household.joint;
  if (
    !j ||
    j.partnerId !== state.family.partnerId ||
    !["deposit", "withdraw", "partner"].includes(direction) ||
    !Number.isFinite(amount) ||
    amount < 10 ||
    amount > 1e9
  )
    throw new Error("Choose a valid joint transfer of at least $10.");
  const p = state.connections.profiles[j.partnerId];
  if (p.trust < 40)
    throw new Error("Discuss the relationship before moving joint funds.");
  if (
    (direction === "deposit" && availableCash(state) < amount) ||
    (direction === "withdraw" && jointShare(state) < amount) ||
    (direction === "partner" && (p.trust < 65 || p.wealth < amount))
  )
    throw new Error(
      "The contributing person must have the funds, and withdrawals cannot exceed your share.",
    );
  const s = act(state, 1),
    n = s.realWorld.household.joint;
  if (direction === "deposit") {
    s.money = round(s.money - amount);
    n.balance = round(n.balance + amount);
    n.playerBasis = round(n.playerBasis + amount);
  } else if (direction === "partner") {
    s.connections.profiles[n.partnerId].wealth = round(p.wealth - amount);
    n.balance = round(n.balance + amount);
    n.partnerBasis = round(n.partnerBasis + amount);
  } else {
    const before = jointShare(s);
    n.balance = round(n.balance - amount);
    s.money = round(s.money + amount);
    const partnerValue = round(j.balance - before);
    n.playerBasis = round(before - amount);
    n.partnerBasis = partnerValue;
  }
  s.realWorld.household.statements.unshift({
    week: s.week,
    text: `Joint account ${direction}: $${amount}.`,
  });
  s.realWorld.household.statements = s.realWorld.household.statements.slice(
    0,
    40,
  );
  return s;
}
export function routePartnerContribution(s, id, amount) {
  const j = s.realWorld?.household.joint;
  if (!j || j.partnerId !== id) return false;
  j.balance = round(j.balance + amount);
  j.partnerBasis = round(j.partnerBasis + amount);
  return true;
}
export function settleSeparation(
  s,
  id,
  { custody = "shared", spouse = false } = {},
) {
  const h = s.realWorld?.household;
  if (!h) return;
  if (!["shared", "primary", "other"].includes(custody))
    throw new Error("Choose shared custody, primary care or the other parent.");
  const j = h.joint;
  let yours = 0,
    theirs = 0;
  if (j) {
    yours = jointShare(s);
    theirs = round(j.balance - yours);
    s.money = round(s.money + yours);
    if (s.connections.profiles[j.partnerId])
      s.connections.profiles[j.partnerId].wealth = round(
        s.connections.profiles[j.partnerId].wealth + theirs,
      );
    h.joint = null;
  }
  const fee = spouse ? 400 : 100;
  s.money = round(s.money - fee);
  const partner = s.connections.profiles[id];
  const children = s.family.children.filter(
    (c) => c.parentId === id && s.week - c.bornWeek < 18 * 52,
  );
  for (const c of children) {
    h.custody[c.id] = { parentId: id, mode: custody, agreedWeek: s.week };
    const own = s.employment?.weeklyPay || Math.max(0, s.company?.profit || 0),
      other = partner?.weeklyPay || 0;
    let due =
      custody === "primary"
        ? -round(other * 0.15)
        : custody === "other"
          ? round(own * 0.15)
          : round((own - other) * 0.08);
    due = Math.max(-400, Math.min(400, due));
    const previous = h.support.find(
      (a) => a.childId === c.id && a.parentId === id,
    );
    h.support = h.support.filter(
      (a) => !(a.childId === c.id && a.parentId === id),
    );
    h.support.push({
      childId: c.id,
      parentId: id,
      weekly: due,
      arrears: previous?.arrears || 0,
      paid: previous?.paid || 0,
      received: previous?.received || 0,
      startsWeek: s.week + 1,
    });
  }
  h.separations.push({
    partnerId: id,
    week: s.week,
    spouse,
    custody,
    playerSettlement: yours,
    partnerSettlement: theirs,
    fee,
  });
  h.separations = h.separations.slice(-20);
  note(
    s,
    `Separation settlement: $${yours} of joint savings returned to you, $${theirs} to your former partner. $${fee} mediation costs. Child support and agreed care continue.`,
    "milestone",
  );
}
export const custodyFactor = (s, id) =>
  ({ primary: 1, shared: 0.5, other: 0 })[
    s.realWorld?.household.custody[id]?.mode
  ] ?? 1;
export function takeParentalLeave(state, weeks = 8) {
  if (
    ![4, 8, 13].includes(Number(weeks)) ||
    !state.employment ||
    ["football", "racing", "basketball", "tennis"].includes(state.career)
  )
    throw new Error(
      "An ordinary employment contract and 4, 8 or 13 weeks are required.",
    );
  if (
    !state.family.children.some(
      (c) => state.week - c.bornWeek >= 0 && state.week - c.bornWeek < 52,
    ) ||
    state.realWorld.household.parentalLeave?.untilWeek > state.week
  )
    throw new Error(
      "Leave is available after a recent birth/adoption and cannot overlap another leave.",
    );
  const s = act(state);
  s.realWorld.household.parentalLeave = {
    jobId: s.employment.jobId,
    fromWeek: s.week + 1,
    untilWeek: s.week + Number(weeks),
    payFactor: localProfile(s).tax === 0 ? 0 : 0.6,
  };
  note(
    s,
    `Agreed parental leave for ${weeks} weeks. Income is reduced, work hours are removed and your job remains protected.`,
  );
  return s;
}
export const onParentalLeave = (s, week = s.week) => {
  const l = s.realWorld?.household.parentalLeave;
  return (
    !!l &&
    l.jobId === s.employment?.jobId &&
    week >= l.fromWeek &&
    week <= l.untilWeek
  );
};
export const leavePayFactor = (s) =>
  onParentalLeave(s) ? s.realWorld.household.parentalLeave.payFactor : 1;
function householdWeek(s) {
  const h = s.realWorld.household;
  if (h.lastWeek === s.week) return;
  h.lastWeek = s.week;
  for (const a of h.support) {
    const c = s.family.children.find((c) => c.id === a.childId),
      p = s.connections.profiles[a.parentId];
    if (!c || !p || s.week - c.bornWeek >= 18 * 52 || s.week < a.startsWeek)
      continue;
    const due = Math.abs(a.weekly);
    if (a.weekly >= 0) {
      const paid = Math.min(Math.max(0, availableCash(s)), due + a.arrears);
      s.money = round(s.money - paid);
      p.wealth = round(p.wealth + paid);
      a.paid = round(a.paid + paid);
      a.arrears = round(a.arrears + due - paid);
    } else {
      const paid = Math.min(p.wealth, due);
      p.wealth = round(p.wealth - paid);
      s.money = round(s.money + paid);
      a.received = round(a.received + paid);
    }
    if (a.arrears)
      note(
        s,
        `Child support for ${c.name}: $${a.arrears} unpaid. This obligation remains due.`,
        "warning",
      );
  }
  if (h.parentalLeave && s.week > h.parentalLeave.untilWeek) {
    note(s, "Your parental leave ended. Regular working hours and pay resume.");
    h.parentalLeave = null;
  }
}
export const PRODUCT_TYPES = {
  game: {
    name: "Game release",
    weeks: 8,
    budget: 2500,
    unitCost: 8,
    price: 30,
    skill: "technical",
  },
  clothing: {
    name: "Clothing collection",
    weeks: 4,
    budget: 1800,
    unitCost: 12,
    price: 45,
    skill: "business",
  },
  restaurant: {
    name: "Restaurant menu launch",
    weeks: 3,
    budget: 1400,
    unitCost: 8,
    price: 25,
    skill: "business",
  },
  service: {
    name: "Client service package",
    weeks: 3,
    budget: 600,
    unitCost: 20,
    price: 100,
    skill: "business",
  },
  software: {
    name: "Software subscription",
    weeks: 6,
    budget: 2200,
    unitCost: 3,
    price: 20,
    skill: "technical",
  },
  studio: {
    name: "Studio production package",
    weeks: 4,
    budget: 1500,
    unitCost: 40,
    price: 160,
    skill: "business",
  },
};
export function productType(sector) {
  return (
    {
      "Game studio": "game",
      "Clothing brand": "clothing",
      Restaurant: "restaurant",
      "Coffee shop": "restaurant",
      "Software subscription": "software",
      Technology: "software",
      "Recording studio": "studio",
      "Record label": "studio",
    }[sector] || "service"
  );
}
export function startBusinessProduct(
  state,
  { name, scope = "standard", price },
) {
  const type = productType(state.company?.sector),
    d = PRODUCT_TYPES[type];
  price = Number(price);
  if (
    !state.company ||
    typeof name !== "string" ||
    !name.trim() ||
    name.trim().length > 60 ||
    !["lean", "standard", "ambitious"].includes(scope) ||
    !Number.isFinite(price) ||
    price < d.unitCost ||
    price > d.price * 5
  )
    throw new Error(
      "Choose a named product, scope and a price covering delivery costs.",
    );
  if (state.realWorld.products.some((p) => p.status === "developing"))
    throw new Error("Finish development of your active product first.");
  const mult = { lean: 0.6, standard: 1, ambitious: 1.8 }[scope],
    budget = round(d.budget * mult);
  if (state.company.cash < budget + d.unitCost * 5)
    throw new Error(
      "Company cash must cover development and a delivery buffer.",
    );
  const s = act(state, 4),
    quality = Math.round(
      clamp(
        s.skills[d.skill] * 0.5 +
          s.globalLife.companyPlan.quality * 0.3 +
          (scope === "ambitious" ? 15 : scope === "lean" ? -5 : 5),
      ),
    );
  s.company.cash = round(s.company.cash - budget);
  s.realWorld.products.push({
    id: `product:${s.realWorld.serial++}`,
    type,
    name: name.trim(),
    scope,
    price,
    unitCost: d.unitCost,
    quality,
    status: "developing",
    progress: 0,
    required: Math.ceil(d.weeks * mult),
    budget,
    sales: 0,
    revenue: 0,
    costs: budget,
    launchedWeek: null,
    reviews: [],
    sessions: 0,
    createdWeek: s.week,
  });
  s.realWorld.products = s.realWorld.products.slice(-20);
  return s;
}
export function developProduct(state, id) {
  const p = state.realWorld.products.find(
    (p) => p.id === id && p.status === "developing",
  );
  if (!p) throw new Error("Choose a product in development.");
  const s = act(state, 4),
    n = s.realWorld.products.find((p) => p.id === id);
  n.sessions++;
  n.progress = Math.min(n.required, n.progress + 0.5);
  n.quality = clamp(n.quality + 0.5);
  return s;
}
export function setProductPrice(state, id, price) {
  const p = state.realWorld.products.find((p) => p.id === id),
    d = PRODUCT_TYPES[p?.type];
  price = Number(price);
  if (
    !p ||
    !d ||
    !Number.isFinite(price) ||
    price < d.unitCost ||
    price > d.price * 5
  )
    throw new Error("Set a price within delivery cost and market limits.");
  const s = act(state, 1);
  s.realWorld.products.find((p) => p.id === id).price = price;
  return s;
}
export function stopProduct(state, id) {
  if (
    !state.realWorld.products.some((p) => p.id === id && p.status === "selling")
  )
    throw new Error("Choose an active product.");
  const s = act(state, 1);
  s.realWorld.products.find((p) => p.id === id).status = "withdrawn";
  return s;
}
export function productTrading(s) {
  if (!s.realWorld || !s.company) return { revenue: 0, costs: 0 };
  let revenue = 0,
    costs = 0;
  for (const p of s.realWorld.products) {
    if (p.status === "developing") {
      if (s.globalLife.crime.prison) continue;
      p.progress = Math.min(p.required, p.progress + 0.25);
      if (p.progress >= p.required) {
        p.status = "selling";
        p.launchedWeek = s.week;
        note(
          s,
          `Launched ${p.name}. Customers compare price and quality; development spending does not guarantee sales.`,
          "milestone",
        );
      }
      continue;
    }
    if (p.status !== "selling") continue;
    const d = PRODUCT_TYPES[p.type],
      competition = 0.6 + rng(s.realWorld) * 0.8,
      appeal = Math.max(0, (p.quality / 100 + 0.15) * (d.price / p.price)),
      demand = Math.max(
        0,
        Math.floor(
          (4 + s.globalLife.companyPlan.customers * 0.1) * appeal * competition,
        ),
      );
    const units = Math.min(
      demand,
      Math.max(0, Math.floor(s.company.cash / p.unitCost)),
    );
    const gross = round(units * p.price),
      delivery = round(units * p.unitCost);
    p.sales += units;
    p.revenue = round(p.revenue + gross);
    p.costs = round(p.costs + delivery);
    revenue += gross;
    costs += delivery;
    if (s.week % 13 === 0) {
      const rating = Math.round(
        clamp(
          p.quality +
            (rng(s.realWorld) - 0.5) * 15 -
            (p.price > d.price * 2 ? 20 : 0),
        ),
      );
      p.reviews.unshift({ week: s.week, rating });
      p.reviews = p.reviews.slice(0, 10);
      if (rating < 35)
        addSetback(
          s,
          "business",
          `Poor reviews for ${p.name}. Improve quality or reconsider pricing.`,
        );
    }
  }
  return { revenue: round(revenue), costs: round(costs) };
}
export function recordTrackRights(s, track, project) {
  if (!s.realWorld) return;
  const lease = track.beat === "lease";
  s.realWorld.rights[project.id] = {
    id: project.id,
    ownerShare: lease ? 0.75 : 1,
    producerShare: lease ? 0.25 : 0,
    licence: lease
      ? "non-exclusive"
      : track.beat === "exclusive"
        ? "exclusive"
        : "owned",
    streamLimit: lease ? 10000 : null,
    expiresWeek: lease ? s.week + 104 : null,
    producerPaid: 0,
    blocked: false,
    reviewedWeek: null,
  };
}
export function musicRightsShare(s, id) {
  const r = s.realWorld?.rights[id];
  return r && !r.blocked ? r.ownerShare : r ? 0 : 1;
}
export function recordProducerRoyalty(s, id, gross) {
  const r = s.realWorld?.rights[id];
  if (r && !r.blocked)
    r.producerPaid = round(r.producerPaid + gross * r.producerShare);
}
export function renewBeatLicence(state, id) {
  const r = state.realWorld.rights[id],
    release = state.music.releases.find((p) => p.id === id);
  if (!r || r.licence !== "non-exclusive")
    throw new Error("Choose a non-exclusive beat licence.");
  if (availableCash(state) < 100) throw new Error("Beat renewal costs $100.");
  const s = act(state, 2, 6),
    n = s.realWorld.rights[id];
  s.money -= 100;
  n.streamLimit = (release?.totalStreams || 0) + 10000;
  n.expiresWeek = s.week + 104;
  n.blocked = false;
  n.reviewedWeek = s.week;
  if (release && r.blocked) {
    const restored = s.music.releases.find((p) => p.id === id);
    restored.weeklyStreams = Math.round(
      restored.initialStreams *
        Math.pow(0.85, Math.max(0, s.week - restored.releasedWeek)),
    );
  }
  return s;
}
export function retireMusic(state) {
  if (!state.music.active)
    throw new Error("You have not started a music career.");
  if (
    state.music.projects.some((p) => p.status === "recording") ||
    state.careerWorld.music.activeTour ||
    state.music.gigs.some((g) => g.status === "booked")
  )
    throw new Error(
      "Finish active recordings, booked performances and tours before retiring from new work.",
    );
  const s = act(state, 2, 18);
  s.realWorld.retiredMusic = true;
  s.music.active = false;
  note(
    s,
    "Retired from new music work. Existing catalogue royalties continue under your rights and label agreements.",
  );
  return s;
}
export function resumeMusic(state) {
  assertCareerPath(state, "music");
  const s = act(state, 2, 18);
  s.realWorld.retiredMusic = false;
  s.music.active = true;
  return s;
}
function addSetback(s, path, text) {
  const existing = s.realWorld.setbacks.find(
    (x) => x.path === path && x.text === text && x.status === "open",
  );
  if (existing) return;
  s.realWorld.setbacks.unshift({
    id: `setback:${s.realWorld.serial++}`,
    path,
    text,
    week: s.week,
    status: "open",
    sessions: 0,
  });
  s.realWorld.setbacks = s.realWorld.setbacks.slice(0, 40);
  note(s, text, "warning");
}
export function workOnSetback(state, id) {
  const b = state.realWorld.setbacks.find(
    (b) => b.id === id && b.status === "open",
  );
  if (!b) throw new Error("Choose an active setback.");
  const s = act(state, 3, 12),
    n = s.realWorld.setbacks.find((b) => b.id === id);
  n.sessions++;
  s.characterLife.personality.confidence = clamp(
    s.characterLife.personality.confidence + 0.5,
  );
  s.happiness = clamp(s.happiness + 1);
  if (n.sessions >= 4) n.status = "addressed";
  note(
    s,
    "Worked on a recovery plan. Confidence develops gradually; a lost contract, funding or bad review is not undone.",
  );
  return s;
}
export function prepareRealism(s) {
  prepareRivals(s);
  const world = s.realWorld;
  if (!world) return;
  for (const r of Object.values(world.rights)) {
    const release = s.music.releases.find((p) => p.id === r.id);
    if (
      r.licence === "non-exclusive" &&
      !r.blocked &&
      (s.week >= r.expiresWeek || release?.totalStreams >= r.streamLimit)
    ) {
      r.blocked = true;
      addSetback(
        s,
        "music",
        "A beat licence reached its term or stream cap. Renew permission before further distribution.",
      );
    }
  }
}
export function advanceRealism(s) {
  const w = s.realWorld;
  if (!w || w.lastWeek === s.week) return;
  w.lastWeek = s.week;
  householdWeek(s);
  for (const r of s.music.releases)
    if (!w.observed.releases.includes(r.id)) {
      w.observed.releases.push(r.id);
      if (r.quality < 35)
        addSetback(
          s,
          "music",
          `Poor critical reception for “${r.title}”. More practice and revision can improve the next release.`,
        );
    }
  w.observed.releases = w.observed.releases.slice(-40);
  for (const path of ["football", "racing", "basketball", "tennis"]) {
    const p = path === "football" ? s.football : s.sports[path],
      a = s.contracts.current[path];
    if (a?.status === "ended" && !w.observed.contracts.includes(a.offerId)) {
      w.observed.contracts.push(a.offerId);
      addSetback(
        s,
        path,
        `${path}: your ${a.party} agreement ended. Recover form and pursue a genuinely available place.`,
      );
    }
    if (p.injuryWeeks >= 4)
      addSetback(
        s,
        path,
        `${path}: a sustained injury interrupted competition. Rehabilitation and recovery need time.`,
      );
  }
  w.observed.contracts = w.observed.contracts.slice(-40);
  if (s.week % 13 === 0)
    for (const [code, rate] of Object.entries(w.economy.rates))
      w.economy.rates[code] = Math.max(
        FX[code] * 0.7,
        Math.min(FX[code] * 1.3, rate * (1 + (rng(w) - 0.5) * 0.01)),
      );
}
export function validateRealism(s) {
  const w = s.realWorld,
    fail = () => {
      throw new Error(
        "Invalid real-world economy, rivals, household, product or rights data.",
      );
    },
    obj = (x) => x && typeof x === "object" && !Array.isArray(x),
    n = (x, min = 0, max = 1e15) => Number.isFinite(x) && x >= min && x <= max,
    int = (x, min = 0, max = 1e15) => n(x, min, max) && Number.isInteger(x),
    str = (x, max = 300) =>
      typeof x === "string" && x.length > 0 && x.length <= max,
    arr = (x, max) => Array.isArray(x) && x.length <= max;
  if (
    !obj(w) ||
    !int(w.seed, 0, 4294967295) ||
    !int(w.serial) ||
    !int(w.lastWeek, 0, s.week) ||
    !obj(w.economy) ||
    !obj(w.economy.rates) ||
    Object.entries(w.economy.rates).some(
      ([k, v]) => !FX[k] || !n(v, FX[k] * 0.7, FX[k] * 1.3),
    ) ||
    !obj(w.economy.taxBuckets) ||
    Object.values(w.economy.taxBuckets).some(
      (b) =>
        !obj(b) ||
        !int(b.year, 0, Math.floor(s.week / 52)) ||
        !countryValid(b.country) ||
        !n(b.earned) ||
        !n(b.investment) ||
        !n(b.capital, -1e15) ||
        !n(b.withheld) ||
        typeof b.legacy !== "boolean",
    ) ||
    (w.economy.rentalTerms !== null &&
      (!obj(w.economy.rentalTerms) ||
        !RENTALS.some((r) => r.id === w.economy.rentalTerms.id) ||
        !n(w.economy.rentalTerms.rent) ||
        !n(w.economy.rentalTerms.deposit) ||
        !countryValid(w.economy.rentalTerms.country))) ||
    !obj(w.economy.purchaseBasis) ||
    Object.values(w.economy.purchaseBasis).some((v) => !n(v))
  )
    fail();
  const h = w.household;
  if (
    !obj(h) ||
    !arr(h.separations, 20) ||
    !arr(h.support, 80) ||
    !arr(h.statements, 40) ||
    !obj(h.custody) ||
    h.separations.some(
      (a) =>
        !obj(a) ||
        !s.connections.profiles[a.partnerId] ||
        !int(a.week, 0, s.week) ||
        typeof a.spouse !== "boolean" ||
        !["shared", "primary", "other"].includes(a.custody) ||
        !n(a.playerSettlement) ||
        !n(a.partnerSettlement) ||
        !n(a.fee),
    ) ||
    h.statements.some(
      (a) => !obj(a) || !int(a.week, 0, s.week) || !str(a.text),
    ) ||
    !int(h.lastWeek, 0, s.week) ||
    (h.joint !== null &&
      (!obj(h.joint) ||
        !s.connections.profiles[h.joint.partnerId] ||
        h.joint.partnerId !== s.family.partnerId ||
        !n(h.joint.balance) ||
        !n(h.joint.playerBasis) ||
        !n(h.joint.partnerBasis) ||
        !int(h.joint.openedWeek, 0, s.week)))
  )
    fail();
  if (
    h.support.some(
      (a) =>
        !obj(a) ||
        !s.family.children.some((c) => c.id === a.childId) ||
        !s.connections.profiles[a.parentId] ||
        !n(a.weekly, -400, 400) ||
        !n(a.arrears) ||
        !n(a.paid) ||
        !n(a.received) ||
        !int(a.startsWeek),
    ) ||
    Object.entries(h.custody).some(
      ([id, c]) =>
        !obj(c) ||
        !int(c.agreedWeek, 0, s.week) ||
        !s.family.children.some((c) => c.id === id) ||
        !["shared", "primary", "other"].includes(c.mode) ||
        !s.connections.profiles[c.parentId],
    ) ||
    (h.parentalLeave !== null &&
      (!obj(h.parentalLeave) ||
        !str(h.parentalLeave.jobId) ||
        !int(h.parentalLeave.fromWeek) ||
        !int(h.parentalLeave.untilWeek, h.parentalLeave.fromWeek) ||
        !n(h.parentalLeave.payFactor, 0, 1)))
  )
    fail();
  const r = w.rivals;
  if (
    !obj(r) ||
    !arr(r.athletes, 380) ||
    r.athletes.length !== 380 ||
    !arr(r.history, 80) ||
    r.history.some((a) => !obj(a) || !int(a.week, 0, s.week) || !str(a.text)) ||
    !int(r.lastWeek, 0, s.week) ||
    r.athletes.some(
      (a) =>
        !str(a.id) ||
        !str(a.name, 60) ||
        !["football", "racing", "basketball", "tennis"].includes(a.path) ||
        !int(a.level, 0, 4) ||
        !int(a.field, 1, 19) ||
        !str(a.club) ||
        !int(a.bornAge, 0, 90) ||
        !int(a.startWeek, 0, s.week) ||
        !n(a.ability, 0, 100) ||
        !n(a.form, 0, 100) ||
        !int(a.injuryUntil, 0, s.week + 5200) ||
        !int(a.contractUntil, 0, s.week + 5200) ||
        !["contracted", "free", "retired"].includes(a.status) ||
        !int(a.availableSince, 0, s.week) ||
        typeof a.player !== "boolean",
    ) ||
    new Set(r.athletes.map((a) => a.id)).size !== r.athletes.length
  )
    fail();
  if (
    !arr(w.products, 20) ||
    w.products.some(
      (p) =>
        !str(p.id) ||
        !str(p.name, 60) ||
        !PRODUCT_TYPES[p.type] ||
        !["lean", "standard", "ambitious"].includes(p.scope) ||
        !n(p.price, p.unitCost, PRODUCT_TYPES[p.type].price * 5) ||
        p.unitCost !== PRODUCT_TYPES[p.type].unitCost ||
        !n(p.quality, 0, 100) ||
        !["developing", "selling", "withdrawn"].includes(p.status) ||
        !n(p.progress, 0, p.required) ||
        !int(p.required, 1, 30) ||
        !n(p.budget) ||
        !int(p.sales) ||
        !n(p.revenue) ||
        !n(p.costs) ||
        !int(p.sessions) ||
        !int(p.createdWeek, 0, s.week) ||
        !(p.launchedWeek === null || int(p.launchedWeek, 0, s.week)) ||
        !arr(p.reviews, 10) ||
        p.reviews.some(
          (r) => !obj(r) || !int(r.week, 0, s.week) || !n(r.rating, 0, 100),
        ),
    )
  )
    fail();
  if (
    new Set(w.products.map((p) => p.id)).size !== w.products.length ||
    !obj(w.rights) ||
    Object.entries(w.rights).some(
      ([id, r]) =>
        r.id !== id ||
        !str(id) ||
        !n(r.ownerShare, 0, 1) ||
        !n(r.producerShare, 0, 1) ||
        Math.abs(r.ownerShare + r.producerShare - 1) > 0.001 ||
        !["owned", "exclusive", "non-exclusive"].includes(r.licence) ||
        !n(r.producerPaid) ||
        typeof r.blocked !== "boolean" ||
        (r.licence === "non-exclusive" &&
          (!int(r.streamLimit, 1) || !int(r.expiresWeek, 0, s.week + 5200))),
    ) ||
    !arr(w.setbacks, 40) ||
    w.setbacks.some(
      (b) =>
        !str(b.id) ||
        !str(b.text) ||
        ![
          "football",
          "racing",
          "basketball",
          "tennis",
          "music",
          "business",
        ].includes(b.path) ||
        !int(b.week, 0, s.week) ||
        !["open", "addressed"].includes(b.status) ||
        !int(b.sessions, 0, 4),
    ) ||
    typeof w.retiredMusic !== "boolean" ||
    !obj(w.appearance) ||
    typeof w.appearance.automatic !== "boolean" ||
    !obj(w.observed) ||
    !arr(w.observed.releases, 40) ||
    !arr(w.observed.contracts, 40) ||
    w.observed.releases.some((id) => !str(id)) ||
    w.observed.contracts.some((id) => !str(id))
  )
    fail();
}
function countryValid(code) {
  return !!country(code);
}
