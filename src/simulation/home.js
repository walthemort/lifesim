import { SHOP, HOMES, RENTALS } from "../engine.js";
import { availableCash } from "../world.js";
import {
  act,
  age,
  clamp,
  round,
  roll,
  uid,
  note,
  once,
  num,
  str,
  bool,
  one,
  arr,
  obj,
  stamps,
} from "./common.js";
export const ROOMS = {
  bedroom: "Bedroom",
  living: "Living room",
  kitchen: "Kitchen",
  study: "Study",
  music: "Music room",
};
export const RENOVATIONS = {
  decorate: {
    name: "Redecorate & refit",
    fraction: 0.015,
    minimum: 2000,
    weeks: 4,
    permit: 0,
  },
  efficiency: {
    name: "Energy-efficiency retrofit",
    fraction: 0.03,
    minimum: 5000,
    weeks: 6,
    permit: 80,
  },
  extension: {
    name: "Additional bedroom",
    fraction: 0.07,
    minimum: 18000,
    weeks: 10,
    permit: 180,
  },
};
export const CONTRACTORS = {
  economy: {
    name: "Local value contractor",
    multiplier: 1,
    quality: 55,
    delay: 0.18,
  },
  established: {
    name: "Established building firm",
    multiplier: 1.25,
    quality: 75,
    delay: 0.08,
  },
  specialist: {
    name: "Specialist renovation team",
    multiplier: 1.6,
    quality: 90,
    delay: 0.04,
  },
};
export function initializeHome(s) {
  return {
    lastWeek: s.week,
    fashion: { context: "none", lastReview: -1 },
    furniture: [],
    projects: [],
    actions: {},
    lastCost: 0,
  };
}
export function furnitureItems(s) {
  return SHOP.filter(
    (i) =>
      s.inventory.includes(i.id) &&
      (i.category === "Homewares" ||
        [
          "desk",
          "office-chair",
          "monitor",
          "books",
          "piano",
          "guitar",
          "vinyl",
          "console",
          "telescope",
          "art-supplies",
          "hifi-speakers",
          "hifi-amplifier",
          "vinyl-cabinet",
        ].includes(i.id)),
  );
}
export function availableRooms(s, property) {
  if (
    (property === "family" && age(s) < 18) ||
    (property === "rental:shared" && s.housing.rental === "shared")
  )
    return ["bedroom"];
  const owned = s.housing.properties.find((p) => p.id === property),
    rental =
      property === `rental:${s.housing.rental}`
        ? RENTALS.find((r) => r.id === s.housing.rental)
        : null;
  const bedrooms = owned
    ? HOMES.find((h) => h.id === owned.type).bedrooms
    : rental?.bedrooms;
  return bedrooms === undefined
    ? []
    : Object.keys(ROOMS).slice(0, Math.min(5, bedrooms + 2));
}
export function setDressContext(state, context) {
  if (!["none", "work", "formal", "sport", "weather"].includes(context))
    throw new Error("Choose an outfit context.");
  const s = act(state, { minAge: 12, hours: 1 }),
    h = s.simulation.home;
  once(s, h.actions, "outfit-context");
  h.fashion.context = context;
  h.fashion.lastReview = s.week;
  note(
    s,
    "Considered your wardrobe for this setting. Garment suitability matters; its price and Pro status do not.",
  );
  return s;
}
export function placeFurniture(state, item, room, property = "family") {
  if (
    !Object.hasOwn(ROOMS, room) ||
    !furnitureItems(state).some((i) => i.id === item)
  )
    throw new Error("Choose an owned furnishing and a valid room.");
  if (!availableRooms(state, property).includes(room))
    throw new Error(
      "Choose an available room in a current rental, your family home or an owned property.",
    );
  const s = act(state, { minAge: 12, hours: 1 }),
    h = s.simulation.home;
  const occupants = h.furniture.filter(
    (f) => f.property === property && f.room === room && f.item !== item,
  );
  if (occupants.length >= 5)
    throw new Error("This room has room for five placed furnishings.");
  h.furniture = h.furniture.filter((f) => f.item !== item);
  h.furniture.push({ item, room, property, week: s.week });
  return s;
}
export function removeHomeItem(s, item) {
  if (s.simulation?.home)
    s.simulation.home.furniture = s.simulation.home.furniture.filter(
      (f) => f.item !== item,
    );
}
export function renovationQuote(s, propertyId, type, contractor) {
  const property = s.housing.properties.find((p) => p.id === propertyId),
    plan = RENOVATIONS[type],
    firm = CONTRACTORS[contractor];
  if (!property || !plan || !firm)
    throw new Error("Choose an owned property, project and contractor.");
  const price = round(
    Math.max(plan.minimum, property.value * plan.fraction) * firm.multiplier,
  );
  return {
    price,
    deposit: round(price * 0.2),
    installment: round((price * 0.8) / plan.weeks),
    permit: plan.permit,
    weeks: plan.weeks,
    quality: firm.quality,
  };
}
export function startRenovation(
  state,
  propertyId,
  type,
  contractor = "established",
) {
  const q = renovationQuote(state, propertyId, type, contractor),
    property = state.housing.properties.find((p) => p.id === propertyId),
    h = state.simulation.home;
  if (
    property.tenant ||
    property.nextTenantWeek !== null ||
    property.saleWeek !== null ||
    h.projects.some((p) => ["permit", "active"].includes(p.status))
  )
    throw new Error(
      "Use a vacant property not seeking tenants or a buyer, and finish your existing building project first.",
    );
  if (
    type === "extension" &&
    h.projects.some(
      (p) =>
        p.property === propertyId &&
        p.type === "extension" &&
        p.status === "complete",
    )
  )
    throw new Error("This property already has its additional bedroom.");
  const s = act(state, { minAge: 18, cost: q.deposit + q.permit, hours: 2 }),
    target = s.simulation.home;
  target.projects.push({
    id: uid(s, "renovation"),
    property: propertyId,
    type,
    contractor,
    quote: q.price,
    installment: q.installment,
    deposit: q.deposit,
    permit: q.permit,
    paid: q.deposit + q.permit,
    progress: 0,
    required: q.weeks,
    since: s.week,
    permitWeek: s.week + (type === "extension" ? 4 : 1),
    deadline: s.week + q.weeks * 3 + 6,
    quality: q.quality,
    status: "permit",
    delays: 0,
    refunded: false,
    valueAdded: 0,
  });
  target.projects = [
    ...target.projects.filter((p) => ["permit", "active"].includes(p.status)),
    ...target.projects
      .filter((p) => !["permit", "active"].includes(p.status))
      .slice(-20),
  ];
  note(
    s,
    `${RENOVATIONS[type].name}: quote $${q.price}, deposit $${q.deposit}, approval/inspection fee $${q.permit}. Remaining stages cost $${q.installment} each.`,
  );
  return s;
}
export function cancelRenovation(state, id) {
  const p = state.simulation.home.projects.find(
    (p) => p.id === id && ["permit", "active"].includes(p.status),
  );
  if (!p) throw new Error("Choose an unfinished project.");
  const fee =
    p.status === "active"
      ? round(Math.max(0, p.quote - (p.paid - p.permit)) * 0.15)
      : 0;
  const s = act(state, { minAge: 18, cost: fee, hours: 1 }),
    target = s.simulation.home.projects.find((x) => x.id === id);
  if (p.status === "permit" && !p.refunded) {
    s.money = round(s.money + p.deposit);
    target.paid -= p.deposit;
    target.refunded = true;
  }
  target.status = "cancelled";
  target.paid += fee;
  note(
    s,
    "Building work cancelled. Approval fees and delivered work remain spent; unused pre-approval deposits were returned.",
  );
  return s;
}
export function advanceHome(s) {
  const h = s.simulation.home;
  if (h.lastWeek === s.week) return;
  h.lastWeek = s.week;
  h.lastCost = 0;
  h.furniture = h.furniture.filter((f) => s.inventory.includes(f.item));
  const current =
      s.housing.residence ||
      (s.housing.rental ? `rental:${s.housing.rental}` : "family"),
    comfortable = h.furniture.filter(
      (f) => f.property === current && ["bedroom", "living"].includes(f.room),
    ).length;
  if (comfortable && s.activity === "rest") {
    s.energy = clamp(s.energy + Math.min(1.5, comfortable * 0.15));
    s.happiness = clamp(s.happiness + Math.min(0.5, comfortable * 0.05));
  }
  if (h.fashion.context === "weather") {
    const month = Math.floor((s.week % 52) / 4.34),
      southern = ["AU", "NZ", "ZA", "BR", "AR", "CL"].includes(
        s.globalLife.residence.country,
      ),
      cold = southern ? month >= 5 && month <= 7 : month <= 1 || month >= 10;
    if (
      cold &&
      !["Jacket", "Knitwear", "Hoodie"].includes(
        s.characterLife.profile.garment,
      )
    )
      s.energy = clamp(s.energy - 0.5);
  }
  if (s.globalLife.crime.prison) return;
  for (const p of h.projects.filter((p) =>
    ["permit", "active"].includes(p.status),
  )) {
    const property = s.housing.properties.find((x) => x.id === p.property);
    if (!property || p.deadline < s.week) {
      p.status = "abandoned";
      note(
        s,
        "A building contract ended before completion; delivered work and fees remain spent.",
        "warning",
      );
      continue;
    }
    if (p.status === "permit") {
      if (s.week < p.permitWeek) continue;
      if (p.type === "extension" && roll(s) < 0.12) {
        p.status = "refused";
        if (!p.refunded) {
          s.money = round(s.money + p.deposit);
          p.paid -= p.deposit;
          p.refunded = true;
        }
        note(
          s,
          "The extension permit was refused. The unused deposit was refunded; the application fee was retained.",
          "warning",
        );
        continue;
      }
      p.status = "active";
      note(
        s,
        "Building approval and contractor scheduling are complete; paid stages can now proceed.",
      );
    }
    if (
      property.tenant ||
      property.saleWeek !== null ||
      s.calendar.last?.mandatory > 168 ||
      availableCash(s) < p.installment ||
      roll(s) < CONTRACTORS[p.contractor].delay
    ) {
      p.delays++;
      continue;
    }
    const cost =
      p.progress === p.required - 1
        ? round(Math.max(0, p.quote - (p.paid - p.permit)))
        : p.installment;
    if (availableCash(s) < cost) {
      p.delays++;
      continue;
    }
    s.money = round(s.money - cost);
    h.lastCost += cost;
    p.paid = round(p.paid + cost);
    p.progress++;
    if (p.progress >= p.required) {
      p.status = "complete";
      p.valueAdded = round(
        Math.min(
          property.value * 0.08,
          (p.paid - p.permit) * (0.35 + p.quality / 150),
        ),
      );
      property.value = round(property.value + p.valueAdded);
      note(
        s,
        `${RENOVATIONS[p.type].name} completed. Paid $${p.paid}; estimated property value increased by $${p.valueAdded}.`,
        "milestone",
      );
    }
  }
}
export function validateHome(s) {
  const h = obj(s.simulation.home);
  num(h.lastWeek, 0, s.week, true);
  num(h.lastCost);
  const fashion = obj(h.fashion);
  one(fashion.context, ["none", "work", "formal", "sport", "weather"]);
  num(fashion.lastReview, -1, s.week, true);
  const placed = new Set();
  for (const f of arr(h.furniture, 100)) {
    obj(f);
    str(f.item, 100);
    if (!s.inventory.includes(f.item) || placed.has(f.item))
      throw new Error("Invalid furnished possession.");
    placed.add(f.item);
    one(f.room, Object.keys(ROOMS));
    str(f.property, 100);
    num(f.week, 0, s.week, true);
  }
  for (const p of arr(h.projects, 21)) {
    obj(p);
    str(p.id, 100);
    str(p.property, 100);
    one(p.type, Object.keys(RENOVATIONS));
    one(p.contractor, Object.keys(CONTRACTORS));
    for (const k of [
      "quote",
      "installment",
      "deposit",
      "permit",
      "paid",
      "valueAdded",
    ])
      num(p[k]);
    num(p.required, 1, 20, true);
    num(p.progress, 0, p.required, true);
    num(p.since, 0, s.week, true);
    num(p.permitWeek, p.since, s.week + 4, true);
    num(p.deadline, p.since, s.week + 40, true);
    num(p.quality, 0, 100);
    one(p.status, [
      "permit",
      "active",
      "complete",
      "cancelled",
      "refused",
      "abandoned",
    ]);
    num(p.delays, 0, 10000, true);
    bool(p.refunded);
  }
  stamps(h.actions, s.week);
}
