import { SHOP } from "../engine.js";
import { availableCash } from "../world.js";
import { localPrice, resalePrice } from "../economy.js";
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
  hash,
} from "./common.js";
import { historicalAvailability } from "./effects.js";
export const LICENCES = {
  road: {
    name: "Car licence",
    lessons: 20,
    cost: 45,
    exam: 90,
    minAge: 17,
    testAge: 18,
  },
  motorcycle: {
    name: "Motorcycle licence",
    lessons: 12,
    cost: 50,
    exam: 90,
    minAge: 18,
    testAge: 18,
  },
  marine: {
    name: "Coastal skipper certificate",
    lessons: 10,
    cost: 80,
    exam: 120,
    minAge: 18,
    testAge: 18,
  },
  air: {
    name: "Private pilot certificate",
    lessons: 25,
    cost: 250,
    exam: 500,
    minAge: 17,
    testAge: 18,
  },
};
export const STORAGE = {
  garage: { name: "Secure garage bay", weekly: 25 },
  berth: { name: "Serviced marina berth", weekly: 90 },
  hangar: { name: "Hangar space", weekly: 250 },
};
export const JOURNEYS = {
  local: { name: "Local trip", km: 30, hours: 2 },
  regional: { name: "Regional road trip", km: 250, hours: 6 },
  water: { name: "Day on the water", km: 70, hours: 6 },
  flight: { name: "Regional private flight", km: 1200, hours: 6 },
};
export function vehicleKind(item) {
  return item?.category === "Travel"
    ? /jet|air|plane/.test(item.id)
      ? "air"
      : "marine"
    : item?.category === "Garage"
      ? /bike|ironline/.test(item.id)
        ? "motorcycle"
        : "road"
      : null;
}
const definition = (id) => SHOP.find((i) => i.id === id);
export function initializeMobility(s) {
  return {
    active: false,
    lastWeek: s.week,
    vehicles: {},
    licences: Object.fromEntries(
      Object.keys(LICENCES).map((id) => [
        id,
        {
          lessons: 0,
          status: "none",
          validUntil: 0,
          lastLesson: -1,
          lastExam: -52,
        },
      ]),
    ),
    commute: "default",
    commuteVehicle: null,
    contracts: [],
    claims: [],
    storage: { garage: 0, berth: 0, hangar: 0 },
    storagePaid: 0,
    trips: [],
    inspections: [],
    actions: {},
    weeklyCost: 0,
  };
}
export function recordVehiclePurchase(s, id, condition = 100, km = 0) {
  const item = definition(id);
  if (!vehicleKind(item) || !s.simulation?.mobility) return;
  s.simulation.mobility.vehicles[id] = {
    id,
    condition,
    initialCondition: condition,
    km,
    purchaseKm: km,
    boughtWeek: s.week,
    lastService: s.week,
    insurance: null,
    incident: null,
    disposition: "owned",
  };
}
export function syncVehicles(s) {
  for (const id of s.inventory)
    if (vehicleKind(definition(id)) && !s.simulation.mobility.vehicles[id])
      recordVehiclePurchase(s, id);
}
export function startFleetManagement(state) {
  const s = act(state, { minAge: 18, hours: 1 });
  syncVehicles(s);
  s.simulation.mobility.active = true;
  note(
    s,
    "Fleet records started from today; earlier mileage and purchase dates were not invented. Usage, condition and secured finance now affect this record.",
  );
  return s;
}
export function licenceLesson(state, id) {
  const d = LICENCES[id];
  if (!d) throw new Error("Choose a licence category.");
  const s = act(state, {
      minAge: d.minAge,
      cost: d.cost,
      hours: 2,
      label: `${d.name} instruction`,
    }),
    m = s.simulation.mobility;
  once(s, m.actions, `lesson:${id}`);
  m.active = true;
  m.licences[id].lessons++;
  m.licences[id].lastLesson = s.week;
  if (m.licences[id].status !== "passed") m.licences[id].status = "learning";
  s.skills.driving = clamp(s.skills.driving + 0.3);
  note(
    s,
    `${d.name}: delivered lesson ${m.licences[id].lessons}/${d.lessons}. Practical assessment is separate.`,
  );
  return s;
}
export function sitLicenceExam(state, id) {
  const d = LICENCES[id],
    original = state.simulation.mobility.licences[id];
  if (
    !d ||
    original.lessons < d.lessons ||
    (original.status === "passed" && original.validUntil > state.week)
  )
    throw new Error(
      "Complete the required lessons before a new or renewal assessment.",
    );
  const s = act(state, { minAge: d.testAge, cost: d.exam, hours: 3 }),
    m = s.simulation.mobility,
    l = m.licences[id];
  once(s, m.actions, `exam:${id}`, 4);
  const passed =
    roll(s) <
    Math.min(0.95, 0.5 + s.skills.driving / 250 + s.skills.knowledge / 500);
  l.status = passed ? "passed" : "learning";
  l.lastExam = s.week;
  if (passed) l.validUntil = s.week + 520;
  note(
    s,
    `${d.name} practical assessment ${passed ? "passed; valid for ten simulation years" : "not passed; further practice is available"}.`,
  );
  return s;
}
const usable = (s, id) =>
  s.inventory.includes(id) ||
  s.simulation.mobility.contracts.some(
    (c) => c.vehicle === id && c.kind === "lease" && c.status === "active",
  );
function checkedVehicle(s, id) {
  const item = definition(id),
    v = s.simulation.mobility.vehicles[id];
  if (!item || !v || !usable(s, id))
    throw new Error("Choose an owned or currently leased vehicle.");
  return { item, v, kind: vehicleKind(item) };
}
export function changeCommute(state, mode, vehicle = null) {
  if (!["default", "walk", "public", "vehicle"].includes(mode))
    throw new Error("Choose how to commute.");
  const s = act(state, { minAge: 12, hours: 1 }),
    m = s.simulation.mobility;
  syncVehicles(s);
  m.active = true;
  if (mode === "vehicle") {
    const { kind, v } = checkedVehicle(s, vehicle),
      l = m.licences[kind];
    if (
      !["road", "motorcycle"].includes(kind) ||
      l.status !== "passed" ||
      l.validUntil < s.week ||
      v.condition < 30 ||
      (v.incident && !v.incident.repaired)
    )
      throw new Error(
        "Driving needs a valid matching licence and a roadworthy vehicle.",
      );
  }
  m.commute = mode;
  m.commuteVehicle = mode === "vehicle" ? vehicle : null;
  return s;
}
export function serviceVehicle(state, id) {
  const known = checkedVehicle(state, id),
    cost = Math.max(80, round(localPrice(state, known.item.price) * 0.002));
  const s = act(state, { minAge: 18, cost, hours: 2 }),
    m = s.simulation.mobility;
  once(s, m.actions, `service:${id}`, 4);
  const v = m.vehicles[id];
  v.lastService = s.week;
  v.condition = clamp(v.condition + 15);
  if (v.incident?.kind === "breakdown") v.incident.repaired = true;
  note(
    s,
    `${known.item.name} serviced for $${cost}; condition is ${v.condition.toFixed(1)}/100.`,
  );
  return s;
}
export function insuranceQuote(s, id, cover = "comprehensive") {
  const item = definition(id),
    kind = vehicleKind(item);
  if (!kind || !["basic", "comprehensive"].includes(cover))
    throw new Error("Choose a vehicle and policy.");
  const value = localPrice(s, item.price),
    multiplier = kind === "air" ? 0.00006 : kind === "marine" ? 0.0001 : 0.0003;
  return {
    weekly: round(
      Math.max(5, value * multiplier) *
        (cover === "basic" ? 0.45 : 1) *
        (age(s) < 25 ? 1.5 : 1),
    ),
    deductible: Math.max(250, round(value * 0.005)),
    limit: round(value * (cover === "basic" ? 0.15 : 0.8)),
  };
}
export function insureVehicle(state, id, cover = "comprehensive") {
  checkedVehicle(state, id);
  const q = insuranceQuote(state, id, cover),
    s = act(state, { minAge: 18, cost: q.weekly, hours: 1 }),
    m = s.simulation.mobility;
  if (m.vehicles[id].insurance)
    throw new Error("Cancel the current policy before replacing it.");
  m.active = true;
  m.vehicles[id].insurance = {
    cover,
    since: s.week,
    ...q,
    paid: q.weekly,
    lastPaid: s.week,
  };
  return s;
}
export function cancelVehicleInsurance(state, id) {
  const s = act(state, { minAge: 18, hours: 1 });
  checkedVehicle(s, id);
  s.simulation.mobility.vehicles[id].insurance = null;
  return s;
}
export function vehicleTrip(state, id, route = "local", operator = "self") {
  const s = act(state, {
      minAge: 18,
      hours: JOURNEYS[route]?.hours || 2,
      energy: 5,
    }),
    m = s.simulation.mobility;
  syncVehicles(s);
  m.active = true;
  const { item, v, kind } = checkedVehicle(s, id),
    journey = JOURNEYS[route];
  if (!journey || !["self", "crew"].includes(operator))
    throw new Error("Choose a valid route and operator.");
  if (
    (kind === "air" && route !== "flight") ||
    (kind === "marine" && route !== "water") ||
    (["road", "motorcycle"].includes(kind) &&
      !["local", "regional"].includes(route))
  )
    throw new Error("Choose a route suitable for this vehicle.");
  if (v.condition < 30 || (v.incident && !v.incident.repaired))
    throw new Error("Arrange repairs before using an unroadworthy vehicle.");
  const l = m.licences[kind];
  if (operator === "self" && (l.status !== "passed" || l.validUntil < s.week))
    throw new Error(
      "Obtain a valid licence for this vehicle, or use a crewed marine/air trip.",
    );
  if (operator === "crew" && !["air", "marine"].includes(kind))
    throw new Error("Crewed trips are for aircraft and boats.");
  if (
    operator !== "crew" &&
    ((kind === "air" && /jet|global/.test(id)) ||
      (kind === "marine" && item.price >= 4000000))
  )
    throw new Error(
      "This aircraft or large yacht requires professional crew; your recreational licence does not authorise its operation.",
    );
  const cost = round(
    journey.km * (kind === "air" ? 2.5 : kind === "marine" ? 3 : 0.18) +
      (operator === "crew" ? (kind === "air" ? 600 : 200) : 0),
  );
  if (availableCash(s) < cost) throw new Error("Cover fuel and any crew fee.");
  s.money = round(s.money - cost);
  v.km = round(v.km + journey.km);
  v.condition = clamp(
    v.condition - journey.km / (kind === "air" ? 4000 : 2000),
  );
  const failure =
    roll(s) <
    0.005 +
      (100 - v.condition) / 1000 +
      Math.max(0, s.week - v.lastService - 26) / 5000;
  if (failure) {
    const damage = round(
      Math.max(120, localPrice(s, item.price) * (0.03 + roll(s) * 0.3)),
    );
    v.condition = clamp(v.condition - 15);
    v.incident = {
      id: uid(s, "incident"),
      kind: "accident",
      week: s.week,
      cost: damage,
      repaired: false,
      claimed: false,
      cover: v.insurance ? { ...v.insurance } : null,
    };
    note(
      s,
      `${item.name}: a travel incident requires $${damage} of repairs.`,
      "warning",
    );
  } else {
    s.happiness = clamp(s.happiness + 3);
    note(
      s,
      `${item.name}: completed ${journey.name.toLowerCase()}, ${journey.km} km for $${cost}.`,
    );
  }
  m.trips.unshift({
    week: s.week,
    vehicle: id,
    route,
    km: journey.km,
    cost,
    completed: !failure,
  });
  m.trips = m.trips.slice(0, 30);
  return s;
}
export function repairVehicle(state, id) {
  const { v } = checkedVehicle(state, id);
  if (!v.incident || v.incident.repaired)
    throw new Error("No unpaid incident repair is pending.");
  const s = act(state, { minAge: 18, cost: v.incident.cost, hours: 2 }),
    target = s.simulation.mobility.vehicles[id];
  target.incident.repaired = true;
  target.condition = clamp(target.condition + 20);
  return s;
}
export function claimInsurance(state, id) {
  const { v } = checkedVehicle(state, id),
    event = v.incident;
  if (
    !event ||
    !event.repaired ||
    event.claimed ||
    !event.cover ||
    event.cover.since > event.week
  )
    throw new Error(
      "Claims need an unclaimed, paid repair invoice and coverage that existed at the incident.",
    );
  const s = act(state, { minAge: 18, hours: 1 }),
    m = s.simulation.mobility;
  m.vehicles[id].incident.claimed = true;
  m.claims.unshift({
    id: uid(s, "claim"),
    incident: event.id,
    vehicle: id,
    amount: round(
      Math.min(
        event.cover.limit,
        Math.max(0, event.cost - event.cover.deductible),
      ),
    ),
    due: s.week + 2,
    status: "pending",
  });
  m.claims = [
    ...m.claims.filter((c) => c.status === "pending"),
    ...m.claims.filter((c) => c.status !== "pending").slice(0, 20),
  ];
  return s;
}
export function vehicleFinanceQuote(s, id, kind = "finance") {
  const item = definition(id);
  if (!vehicleKind(item) || !["finance", "lease"].includes(kind))
    throw new Error("Choose a vehicle and financing type.");
  const price = localPrice(s, item.price),
    term = kind === "lease" ? 156 : 260,
    deposit = round(price * (kind === "lease" ? 0.1 : 0.2)),
    principal = round(price - deposit),
    rate = 0.07 / 52;
  const payment =
    kind === "lease"
      ? round(price * 0.004)
      : round((principal * rate) / (1 - (1 + rate) ** -term));
  const obligations = s.simulation.mobility.contracts
    .filter((c) => c.status === "active")
    .reduce((n, c) => n + c.payment, 0);
  const income = s.employment?.weeklyPay || 0;
  return {
    price,
    deposit,
    principal,
    payment,
    term,
    eligible:
      !historicalAvailability(s, id) &&
      age(s) >= 18 &&
      s.banking.credit >= 600 &&
      !s.simulation.mobility.contracts.some((c) => c.status === "deficiency") &&
      !!s.employment &&
      s.employment.tenure >= 13 &&
      payment + obligations <= income * 0.3 &&
      availableCash(s) >= deposit + payment * 12 + 100,
  };
}
export function financeVehicle(state, id, kind = "finance") {
  const q = vehicleFinanceQuote(state, id, kind);
  if (
    !q.eligible ||
    usable(state, id) ||
    state.simulation.mobility.contracts.filter((c) => c.status === "active")
      .length >= 5
  )
    throw new Error(
      "Financing needs thirteen weeks in stable employment, affordable payments, the deposit and twelve-payment reserve; you cannot already own or lease this model, or have five active agreements.",
    );
  const s = act(state, { minAge: 18, cost: q.deposit + 100, hours: 2 }),
    m = s.simulation.mobility;
  m.active = true;
  const c = {
    id: uid(s, "vehicle-credit"),
    vehicle: id,
    kind,
    since: s.week,
    ends: s.week + q.term,
    balance: kind === "finance" ? q.principal : 0,
    payment: q.payment,
    deposit: q.deposit,
    paid: q.deposit + 100,
    missed: 0,
    kmLimit: 45000,
    status: "active",
  };
  m.contracts.push(c);
  m.contracts = [
    ...m.contracts.filter((c) => c.status !== "settled"),
    ...m.contracts.filter((c) => c.status === "settled").slice(-20),
  ];
  if (kind === "finance") {
    s.inventory.push(id);
    s.realWorld.economy.purchaseBasis[id] = q.price;
  }
  recordVehiclePurchase(s, id);
  m.vehicles[id].disposition = kind === "lease" ? "leased" : "owned";
  return s;
}
export function settleVehicleSale(s, id) {
  const c = s.simulation?.mobility.contracts.find(
    (c) =>
      c.vehicle === id &&
      c.kind === "finance" &&
      ["active", "deficiency"].includes(c.status),
  );
  if (c) {
    if (availableCash(s) < c.balance)
      throw new Error(
        "Cover the outstanding secured loan before transferring ownership.",
      );
    s.money = round(s.money - c.balance);
    c.balance = 0;
    c.status = "settled";
  }
  if (s.simulation?.mobility.vehicles[id])
    s.simulation.mobility.vehicles[id].disposition = "sold";
}
export function repayVehicleFinance(state, contractId) {
  const c = state.simulation.mobility.contracts.find(
    (c) => c.id === contractId && ["active", "deficiency"].includes(c.status),
  );
  if (!c) throw new Error("Choose a current credit or lease agreement.");
  const v = state.simulation.mobility.vehicles[c.vehicle],
    cost =
      c.kind === "finance"
        ? c.balance
        : round(
            Math.max(0, c.ends - state.week) * c.payment * 0.25 +
              Math.max(0, v.km - v.purchaseKm - c.kmLimit) * 0.15,
          );
  const s = act(state, { minAge: 18, cost, hours: 1 }),
    target = s.simulation.mobility.contracts.find((x) => x.id === contractId);
  target.balance = 0;
  target.status = "settled";
  if (c.kind === "lease") {
    s.simulation.mobility.vehicles[c.vehicle].disposition = "returned";
    if (s.simulation.mobility.commuteVehicle === c.vehicle)
      s.simulation.mobility.commute = "public";
  }
  return s;
}
export function rentVehicleStorage(state, type, spaces) {
  if (
    !Object.hasOwn(STORAGE, type) ||
    !Number.isInteger(spaces) ||
    spaces < 0 ||
    spaces > 12
  )
    throw new Error("Choose zero to twelve spaces of a valid storage type.");
  const s = act(state, {
      minAge: 18,
      cost:
        STORAGE[type].weekly *
        Math.max(0, spaces - state.simulation.mobility.storage[type]),
      hours: 1,
    }),
    m = s.simulation.mobility;
  once(s, m.actions, `storage:${type}`, 4);
  m.active = true;
  m.storage[type] = spaces;
  return s;
}
export function usedVehicleOffers(s) {
  const quarter = Math.floor(s.week / 13),
    ids = [
      "used-car",
      "heritage-roadster",
      "family-car",
      "motorbike",
      "apex-roadster",
      "bluewater-runabout",
    ];
  return ids
    .filter((id) => !usable(s, id))
    .map((id, i) => {
      const condition =
          40 +
          (((quarter * 13 + i * 19 + s.simulation.originSeed + hash(s.city)) >>>
            0) %
            50),
        item = definition(id),
        km = 12000 + ((i * 23123 + quarter * 1901) % 160000);
      return {
        id: `${s.globalLife.residence.country}:${hash(s.city)}:${quarter}:${id}`,
        vehicle: id,
        condition,
        km,
        ask: round(localPrice(s, item.price) * (0.3 + condition / 200)),
        expires: (quarter + 1) * 13,
      };
    });
}
export function inspectUsedVehicle(state, offerId) {
  const offer = usedVehicleOffers(state).find((o) => o.id === offerId);
  if (
    !offer ||
    state.simulation.mobility.inspections.some((i) => i.offerId === offerId)
  )
    throw new Error("Choose an available, uninspected listing.");
  const s = act(state, { minAge: 18, cost: 75, hours: 2 }),
    m = s.simulation.mobility;
  m.active = true;
  m.inspections.push({
    offerId,
    week: s.week,
    condition: offer.condition,
    km: offer.km,
    faults:
      offer.condition < 60
        ? "Maintenance and repairs recommended"
        : "No major defect identified at inspection",
  });
  m.inspections = m.inspections.slice(-24);
  return s;
}
export function buyUsedVehicle(state, offerId, fraction = 1) {
  const offer = usedVehicleOffers(state).find((o) => o.id === offerId);
  if (!offer || !Number.isFinite(fraction) || fraction < 0.7 || fraction > 1)
    throw new Error(
      "Choose a live listing and offer 70–100% of its asking price.",
    );
  const bid = round(offer.ask * fraction),
    s = act(state, { minAge: 18, hours: 2 }),
    m = s.simulation.mobility;
  once(s, m.actions, `used:${offerId}`, 4);
  m.active = true;
  if (availableCash(s) < bid + 150)
    throw new Error("Fund the offer and $150 registration.");
  const inspected = m.inspections.some((i) => i.offerId === offerId),
    minimum = inspected && offer.condition < 60 ? 0.82 : 0.93;
  if (fraction < minimum) {
    note(s, "The seller refused your offer; no purchase funds were charged.");
    return s;
  }
  s.money = round(s.money - bid - 150);
  s.inventory.push(offer.vehicle);
  s.realWorld.economy.purchaseBasis[offer.vehicle] = bid;
  recordVehiclePurchase(s, offer.vehicle, offer.condition, offer.km);
  note(
    s,
    "The seller accepted; the vehicle's inspected condition, mileage and actual price are now recorded.",
  );
  return s;
}
export function advanceMobility(s) {
  const m = s.simulation.mobility;
  if (m.lastWeek === s.week) return;
  m.lastWeek = s.week;
  m.weeklyCost = 0;
  if (!m.active) return;
  syncVehicles(s);
  const charge = (cost) => {
    if (availableCash(s) < cost) return false;
    s.money = round(s.money - cost);
    m.weeklyCost += cost;
    return true;
  };
  for (const c of m.contracts.filter((c) =>
    ["active", "deficiency"].includes(c.status),
  )) {
    if (c.kind === "finance") c.balance = round(c.balance * (1 + 0.07 / 52));
    const due =
      c.kind === "finance" ? Math.min(c.payment, c.balance) : c.payment;
    if (charge(due)) {
      c.paid += due;
      c.missed = 0;
      if (c.kind === "finance") c.balance = round(c.balance - due);
    } else c.missed++;
    if (c.kind === "finance" && c.balance <= 0.01) {
      c.balance = 0;
      c.status = "settled";
    } else if (c.kind === "lease" && s.week >= c.ends) {
      c.status = "settled";
      const v = m.vehicles[c.vehicle];
      const excess = round(Math.max(0, v.km - v.purchaseKm - c.kmLimit) * 0.15);
      if (!charge(excess)) {
        c.balance = excess;
        c.kind = "finance";
        c.status = "deficiency";
      }
      v.disposition = "returned";
    } else if (c.status === "active" && c.missed >= 8) {
      if (c.kind === "finance") {
        const proceeds = resalePrice(s, definition(c.vehicle)),
          balance = c.balance;
        c.balance = round(Math.max(0, balance - proceeds));
        if (proceeds > balance) s.money = round(s.money + proceeds - balance);
        s.inventory = s.inventory.filter((id) => id !== c.vehicle);
        c.status = c.balance ? "deficiency" : "settled";
      } else {
        c.balance = round(Math.max(0, c.ends - s.week) * c.payment * 0.25);
        c.kind = "finance";
        c.status = "deficiency";
      }
      m.vehicles[c.vehicle].disposition = "repossessed";
      s.banking.credit = Math.max(300, s.banking.credit - 60);
      note(
        s,
        "A vehicle was repossessed after missed payments; any deficiency remains payable.",
        "warning",
      );
    }
  }
  for (const c of m.claims.filter(
    (c) => c.status === "pending" && c.due <= s.week,
  )) {
    s.money = round(s.money + c.amount);
    c.status = "paid";
    note(
      s,
      `Insurance reimbursed $${c.amount} against an actual repair invoice.`,
    );
  }
  for (const [type, count] of Object.entries(m.storage))
    if (count && !charge(STORAGE[type].weekly * count)) {
      m.storage[type] = 0;
      note(s, `Unfunded ${STORAGE[type].name.toLowerCase()} ended.`, "warning");
    }
  const visible = Object.values(m.vehicles).filter((v) => usable(s, v.id)),
    used = { garage: 0, berth: 0, hangar: 0 };
  for (const v of visible) {
    if (v.insurance && v.insurance.lastPaid < s.week) {
      if (charge(v.insurance.weekly)) {
        v.insurance.paid += v.insurance.weekly;
        v.insurance.lastPaid = s.week;
      } else {
        v.insurance = null;
        note(
          s,
          "An unfunded vehicle policy lapsed; old incident coverage remains recorded.",
          "warning",
        );
      }
    }
    const kind = vehicleKind(definition(v.id)),
      storage =
        kind === "air" ? "hangar" : kind === "marine" ? "berth" : "garage";
    const capacity =
      m.storage[storage] +
      (storage === "garage" ? 1 + (s.housing.residence ? 1 : 0) : 0);
    used[storage]++;
    if (used[storage] > capacity)
      v.condition = Math.max(20, v.condition - 0.12);
  }
  if (!s.globalLife.crime.prison && (s.employment || s.school.enrolled)) {
    if (m.commute === "public") {
      if (!charge(12)) m.commute = "walk";
    }
    if (m.commute === "vehicle") {
      const v = m.vehicles[m.commuteVehicle],
        item = definition(m.commuteVehicle),
        l = item && m.licences[vehicleKind(item)];
      if (
        !v ||
        !usable(s, v.id) ||
        v.condition < 30 ||
        (v.incident && !v.incident.repaired) ||
        l.status !== "passed" ||
        l.validUntil < s.week ||
        !charge(18)
      ) {
        m.commute = "public";
        note(
          s,
          "The car commute paused; arrange a valid licence, repairs or running funds.",
          "warning",
        );
      } else {
        v.km += 100;
        v.condition = clamp(v.condition - 0.05);
      }
    }
  }
}
export function validateMobility(s) {
  const m = obj(s.simulation.mobility);
  bool(m.active);
  num(m.lastWeek, 0, s.week, true);
  one(m.commute, ["default", "walk", "public", "vehicle"]);
  if (m.commuteVehicle !== null) {
    str(m.commuteVehicle, 100);
    if (!vehicleKind(definition(m.commuteVehicle)))
      throw new Error("Invalid commuting vehicle.");
  }
  num(m.weeklyCost);
  num(m.storagePaid);
  obj(m.storage);
  for (const key of Object.keys(STORAGE)) num(m.storage[key], 0, 12, true);
  obj(m.licences);
  for (const id of Object.keys(LICENCES)) {
    const l = obj(m.licences[id]);
    num(l.lessons, 0, 10000, true);
    one(l.status, ["none", "learning", "passed"]);
    num(l.validUntil, 0, s.week + 520, true);
    num(l.lastLesson, -1, s.week, true);
    num(l.lastExam, -52, s.week, true);
    if (l.status === "passed" && l.lessons < LICENCES[id].lessons)
      throw new Error("Invalid licence progress.");
  }
  const policy = (p) => {
    obj(p);
    one(p.cover, ["basic", "comprehensive"]);
    num(p.since, 0, s.week, true);
    num(p.weekly);
    num(p.deductible);
    num(p.limit);
    num(p.paid);
    num(p.lastPaid, 0, s.week, true);
  };
  if (Object.keys(obj(m.vehicles)).length > 100)
    throw new Error("Too many fleet records.");
  for (const [id, v] of Object.entries(m.vehicles)) {
    if (!vehicleKind(definition(id)) || v.id !== id)
      throw new Error("Invalid fleet model.");
    obj(v);
    num(v.condition, 0, 100);
    num(v.initialCondition, 1, 100);
    num(v.km);
    num(v.purchaseKm, 0, v.km);
    num(v.boughtWeek, 0, s.week, true);
    num(v.lastService, 0, s.week, true);
    one(v.disposition, ["owned", "leased", "sold", "returned", "repossessed"]);
    if (v.insurance !== null) policy(v.insurance);
    if (v.incident) {
      const i = obj(v.incident);
      str(i.id, 100);
      one(i.kind, ["accident", "breakdown"]);
      num(i.week, 0, s.week, true);
      num(i.cost);
      bool(i.repaired);
      bool(i.claimed);
      if (i.cover !== null) policy(i.cover);
    }
  }
  for (const c of arr(m.contracts, 40)) {
    obj(c);
    str(c.id, 100);
    if (!vehicleKind(definition(c.vehicle)))
      throw new Error("Invalid secured asset.");
    one(c.kind, ["finance", "lease"]);
    one(c.status, ["active", "deficiency", "settled"]);
    num(c.since, 0, s.week, true);
    num(c.ends, c.since, s.week + 260, true);
    num(c.balance);
    num(c.payment, 0.01);
    num(c.deposit);
    num(c.paid);
    num(c.missed, 0, 10000, true);
    num(c.kmLimit, 1);
  }
  for (const c of arr(m.claims, 30)) {
    obj(c);
    str(c.id, 100);
    str(c.incident, 100);
    if (!vehicleKind(definition(c.vehicle)))
      throw new Error("Invalid insured asset.");
    num(c.amount);
    num(c.due, 0, s.week + 2, true);
    one(c.status, ["pending", "paid"]);
  }
  for (const t of arr(m.trips, 30)) {
    num(t.week, 0, s.week, true);
    if (!vehicleKind(definition(t.vehicle)))
      throw new Error("Invalid trip vehicle.");
    one(t.route, Object.keys(JOURNEYS));
    num(t.km, 0, 2000);
    num(t.cost);
    bool(t.completed);
  }
  for (const i of arr(m.inspections, 24)) {
    str(i.offerId, 150);
    num(i.week, 0, s.week, true);
    num(i.condition, 0, 100);
    num(i.km);
    str(i.faults, 150);
  }
  stamps(m.actions, s.week);
}
