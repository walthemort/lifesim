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
import { availableCash } from "../world.js";
import { recommendedSleep } from "../childhood.js";
import { calendarForecast } from "../calendar.js";
export const CONDITIONS = {
  respiratory: {
    name: "Respiratory infection",
    chronic: false,
    recovery: 5,
    infectious: true,
  },
  asthma: { name: "Asthma", chronic: true, recovery: 0.5, infectious: false },
  back: {
    name: "Recurring back pain",
    chronic: true,
    recovery: 0.6,
    infectious: false,
  },
  anxiety: {
    name: "Anxiety symptoms",
    chronic: true,
    recovery: 0.6,
    infectious: false,
  },
  dental: {
    name: "Dental problem",
    chronic: false,
    recovery: 0.4,
    infectious: false,
  },
  vision: {
    name: "Vision correction needed",
    chronic: true,
    recovery: 0,
    infectious: false,
  },
  hearing: {
    name: "Hearing support needed",
    chronic: true,
    recovery: 0,
    infectious: false,
  },
};
export const TREATMENTS = {
  rest: {
    name: "Rest & monitoring",
    fee: 0,
    weekly: 0,
    effect: 3,
    side: 0,
    types: ["respiratory", "back"],
  },
  medication: {
    name: "Clinician-prescribed treatment",
    fee: 25,
    weekly: 8,
    effect: 5,
    side: 0.1,
    types: ["respiratory", "asthma", "dental", "anxiety"],
  },
  physiotherapy: {
    name: "Physiotherapy plan",
    fee: 60,
    weekly: 30,
    effect: 4,
    side: 0,
    types: ["back"],
  },
  therapy: {
    name: "Therapeutic support",
    fee: 40,
    weekly: 25,
    effect: 4,
    side: 0,
    types: ["anxiety"],
  },
  procedure: {
    name: "Dental treatment",
    fee: 180,
    weekly: 0,
    effect: 14,
    side: 0.05,
    types: ["dental"],
  },
  glasses: {
    name: "Corrective eyewear",
    fee: 120,
    weekly: 0,
    effect: 0,
    side: 0,
    types: ["vision"],
  },
  hearingAid: {
    name: "Hearing device fitting",
    fee: 450,
    weekly: 1,
    effect: 0,
    side: 0,
    types: ["hearing"],
  },
};
export const NUTRITION = {
  household: { name: "Usual household meals", cost: 0, health: 0, recovery: 0 },
  economical: {
    name: "Planned home cooking",
    cost: 15,
    health: 0.1,
    recovery: 0.5,
  },
  balanced: { name: "Balanced meal plan", cost: 35, health: 0.25, recovery: 1 },
  athlete: {
    name: "Sports nutrition plan",
    cost: 70,
    health: 0.25,
    recovery: 2,
  },
  convenience: {
    name: "Convenience meals",
    cost: 50,
    health: -0.12,
    recovery: 0,
  },
};
export const HABITS = {
  movement: "Regular movement",
  reading: "Reading before bed",
  mindfulness: "Mindfulness practice",
  social: "A weekly connection",
};
export function initializeHealth(s) {
  return {
    active: false,
    lastWeek: s.week,
    conditions: [],
    appointments: [],
    injuries: [],
    sleepDebt: 0,
    stress: 0,
    burnout: 0,
    nutrition: "household",
    paid: 0,
    lastCost: 0,
    habits: Object.fromEntries(
      Object.keys(HABITS).map((id) => [
        id,
        { strength: 0, streak: 0, lastWeek: -1 },
      ]),
    ),
    household: [],
    history: [],
    actions: {},
    checkups: { dental: -520, vision: -520, hearing: -520 },
  };
}
export function startHealthRecord(state) {
  const s = act(state, { minAge: 6, hours: 1, label: "Open a health record" });
  s.simulation.health.active = true;
  note(
    s,
    "Detailed health monitoring started. Sleep, diet, workload and appointments now contribute to this record.",
  );
  return s;
}
export function bookAppointment(
  state,
  { concern = "general", provider = "public" } = {},
) {
  if (
    !["general", "dental", "vision", "hearing", "mental", "injury"].includes(
      concern,
    ) ||
    !["public", "private"].includes(provider)
  )
    throw new Error("Choose a concern and provider.");
  if (
    state.simulation.health.appointments.some(
      (a) => a.concern === concern && a.status === "booked",
    )
  )
    throw new Error("You already have a pending appointment for this concern.");
  const fee = provider === "private" ? 120 : 0;
  const s = act(state, {
      minAge: 6,
      cost: fee,
      hours: 1,
      label: "Arrange healthcare",
    }),
    h = s.simulation.health;
  h.active = true;
  const wait =
    provider === "private"
      ? 1
      : s.globalLife.residence.country === "US"
        ? 3
        : 4;
  h.appointments.unshift({
    id: uid(s, "appointment"),
    concern,
    provider,
    week: s.week + wait,
    status: "booked",
    paid: fee,
    result: "Awaiting assessment",
  });
  h.appointments = h.appointments.slice(0, 30);
  h.paid += fee;
  note(
    s,
    `Booked ${concern} assessment in ${wait} week${wait === 1 ? "" : "s"}; appointment fee ${fee}.`,
  );
  return s;
}
export function conditionLoad(s) {
  const h = s.simulation?.health;
  if (!h?.active) return 0;
  return h.conditions
    .filter(
      (c) =>
        c.status === "active" &&
        !["glasses", "hearingAid"].includes(c.treatment),
    )
    .reduce((n, c) => n + c.severity, 0);
}
export function chooseTreatment(state, conditionId, treatment) {
  const c = state.simulation.health.conditions.find(
      (c) => c.id === conditionId && c.status === "active",
    ),
    t = TREATMENTS[treatment];
  if (!c || !t || !t.types.includes(c.type) || c.treatment === treatment)
    throw new Error(
      "Choose a clinician-assessed condition and a compatible new treatment.",
    );
  const s = act(state, {
      minAge: 6,
      cost: t.fee,
      hours: 2,
      label: "Begin treatment",
    }),
    h = s.simulation.health,
    target = h.conditions.find((x) => x.id === conditionId);
  once(s, h.actions, `treatment:${conditionId}`, 4);
  target.treatment = treatment;
  target.treatedWeeks = 0;
  target.lastDelivery = -1;
  h.paid += t.fee;
  note(
    s,
    `${CONDITIONS[c.type].name}: began ${t.name}. Follow-up and any recurring costs continue weekly.`,
  );
  return s;
}
export function setNutrition(state, plan) {
  if (!Object.hasOwn(NUTRITION, plan)) throw new Error("Choose a meal plan.");
  if (age(state) < 12 && plan !== "household")
    throw new Error("Your household handles meals until twelve.");
  const s = act(state, { minAge: 6, hours: 1 }),
    h = s.simulation.health;
  once(s, h.actions, "nutrition");
  h.active = true;
  h.nutrition = plan;
  return s;
}
export function practiceHabit(state, id) {
  if (!Object.hasOwn(HABITS, id)) throw new Error("Choose a habit.");
  const s = act(state, {
      minAge: 6,
      hours: id === "movement" ? 3 : 2,
      energy: id === "movement" ? 4 : 0,
    }),
    h = s.simulation.health,
    habit = h.habits[id];
  once(s, h.actions, `habit:${id}`);
  h.active = true;
  habit.streak = habit.lastWeek === s.week - 1 ? habit.streak + 1 : 1;
  habit.lastWeek = s.week;
  habit.strength = clamp(habit.strength + 2 + Math.min(2, habit.streak / 8));
  if (id === "mindfulness" || id === "social") h.stress = clamp(h.stress - 4);
  if (id === "reading") h.sleepDebt = clamp(h.sleepDebt - 3);
  if (id === "movement")
    s.lifeCourse.body.fitness = clamp(s.lifeCourse.body.fitness + 0.2);
  return s;
}
export function injuryRehab(state, id) {
  const injury = state.simulation.health.injuries.find(
    (i) => i.id === id && i.status !== "recovered",
  );
  if (!injury || !injury.diagnosed)
    throw new Error(
      "Arrange an injury assessment before starting targeted rehabilitation.",
    );
  const s = act(state, { minAge: 8, cost: 35, hours: 3, energy: 3 }),
    h = s.simulation.health,
    i = h.injuries.find((i) => i.id === id);
  once(s, h.actions, `rehab:${id}`);
  i.progress = clamp(i.progress + 12);
  i.lastRehab = s.week;
  h.paid += 35;
  return s;
}
function addCondition(s, type, severity = 30) {
  const h = s.simulation.health;
  if (h.conditions.some((c) => c.type === type && c.status === "active"))
    return;
  h.conditions.unshift({
    id: uid(s, "condition"),
    type,
    since: s.week,
    severity,
    treatment: null,
    treatedWeeks: 0,
    lastDelivery: -1,
    status: "active",
  });
  h.conditions = [
    ...h.conditions.filter((c) => c.status === "active"),
    ...h.conditions.filter((c) => c.status !== "active").slice(0, 23),
  ];
  note(
    s,
    `Health assessment recorded ${CONDITIONS[type].name.toLowerCase()}.`,
    "warning",
  );
}
export function healthPerformance(s) {
  const h = s.simulation?.health;
  if (!h?.active) return 0;
  return -Math.min(
    9,
    conditionLoad(s) / 35 + h.sleepDebt / 40 + h.burnout / 30,
  );
}
export function advanceHealth(s) {
  const h = s.simulation.health;
  if (h.lastWeek === s.week) return;
  h.lastWeek = s.week;
  h.lastCost = 0;
  if (!h.active) return;
  if (s.globalLife.crime.prison) {
    for (const a of h.appointments.filter(
      (a) => a.status === "booked" && a.week <= s.week,
    )) {
      a.status = "missed";
      a.result =
        "Outside appointment missed while in custody; booking fees remain spent.";
    }
    return;
  }
  const deficit = recommendedSleep(s) - s.calendar.sleep;
  h.sleepDebt = clamp(
    h.sleepDebt + deficit * 5 - (s.activity === "rest" ? 5 : 0),
  );
  const strain =
    (s.workLife.arrangement === "overtime" ? 3 : 0) +
    (s.energy < 25 ? 2 : 0) +
    conditionLoad(s) / 100;
  h.stress = clamp(
    h.stress +
      strain -
      (s.activity === "rest" ? 4 : 1) -
      h.habits.mindfulness.strength / 100,
  );
  h.burnout = clamp(h.burnout + (h.stress > 70 ? 1.5 : -0.7));
  s.energy = clamp(s.energy - h.sleepDebt / 70 - h.burnout / 80);
  if (h.sleepDebt >= 40) s.health = clamp(s.health - 0.2);
  if (h.burnout >= 60) s.happiness = clamp(s.happiness - 0.3);
  const plan = NUTRITION[h.nutrition];
  if (availableCash(s) >= plan.cost) {
    s.money = round(s.money - plan.cost);
    h.lastCost += plan.cost;
    s.health = clamp(s.health + plan.health);
    s.energy = clamp(s.energy + plan.recovery);
  } else {
    h.nutrition = "household";
    note(
      s,
      "The meal plan paused because its weekly budget was unavailable.",
      "warning",
    );
  }
  for (const a of h.appointments.filter(
    (a) => a.status === "booked" && a.week <= s.week,
  )) {
    const calendar = calendarForecast(s);
    if (calendar.mandatory + calendar.appointments > 168) {
      a.status = "missed";
      a.result =
        "Missed because mandatory commitments exceeded the calendar; booking fees remain spent.";
      note(s, a.result, "warning");
      continue;
    }
    a.status = "attended";
    if (["dental", "vision", "hearing"].includes(a.concern)) {
      h.checkups[a.concern] = s.week;
      if (roll(s) < 0.35 + Math.max(0, age(s) - 40) / 150)
        addCondition(s, a.concern, 20 + Math.floor(roll(s) * 30));
      a.result = `Screening completed. ${h.conditions.some((c) => c.type === a.concern && c.status === "active") ? "A care option is available." : "No treatment identified at this visit."}`;
    } else if (a.concern === "mental") {
      if (h.stress > 55 || h.burnout > 35)
        addCondition(s, "anxiety", Math.max(20, h.stress / 2));
      a.result =
        "Mental-health assessment completed; ongoing support depends on symptoms.";
    } else if (a.concern === "injury") {
      for (const injury of h.injuries.filter((i) => i.status !== "recovered"))
        injury.diagnosed = true;
      a.result =
        "Injury assessment completed; targeted rehabilitation is now available.";
    } else {
      if (!h.conditions.some((c) => c.status === "active") && roll(s) < 0.3)
        addCondition(s, age(s) > 35 ? "back" : "asthma", 25);
      a.result =
        "General assessment completed; new findings appear in your care record.";
    }
    note(s, a.result);
  }
  for (const c of h.conditions.filter((c) => c.status === "active")) {
    const d = CONDITIONS[c.type],
      t = TREATMENTS[c.treatment];
    let improvement = d.recovery;
    if (t && availableCash(s) >= t.weekly) {
      s.money = round(s.money - t.weekly);
      h.lastCost += t.weekly;
      c.treatedWeeks++;
      c.lastDelivery = s.week;
      improvement += t.effect;
      if (roll(s) < t.side) {
        s.energy = clamp(s.energy - 2);
        note(
          s,
          "A treatment side effect reduced energy; discuss alternatives at follow-up.",
          "warning",
        );
      }
      if (c.type === "anxiety") {
        h.stress = clamp(h.stress - 3);
        h.burnout = clamp(h.burnout - 1);
      }
    }
    c.severity = clamp(c.severity - improvement);
    if (!d.chronic && c.severity <= 1) {
      c.status = "resolved";
      note(s, `${d.name} resolved after monitoring or care.`);
    } else if (d.chronic && c.severity < 5) c.severity = 5;
    if (c.severity > 50 && !t) s.health = clamp(s.health - 0.3);
  }
  for (const path of ["football", "racing", "basketball", "tennis"]) {
    const actor = path === "football" ? s.football : s.sports[path],
      current = h.injuries.find(
        (i) => i.path === path && i.status !== "recovered",
      );
    if (actor.injuryWeeks > 0 && !current) {
      const type = ["muscle", "fracture", "concussion"][
        Math.min(2, Math.floor(actor.injuryWeeks / 3))
      ];
      h.injuries.unshift({
        id: uid(s, "injury"),
        path,
        type,
        since: s.week,
        severity: clamp(actor.injuryWeeks * 12),
        diagnosed: false,
        progress: 0,
        lastRehab: -1,
        status: "recovering",
      });
      h.injuries = h.injuries.slice(0, 20);
    } else if (current) {
      current.progress = clamp(
        current.progress + (actor.injuryWeeks === 0 ? 12 : 3),
      );
      if (current.progress >= 100) current.status = "recovered";
      else if (
        actor.injuryWeeks === 0 &&
        s.activity === "train" &&
        current.progress < 55 &&
        roll(s) < 0.08
      ) {
        actor.injuryWeeks = 2;
        current.status = "relapse";
        note(
          s,
          `${path}: returning before rehabilitation was complete caused a setback.`,
          "warning",
        );
      }
    }
  }
  if (s.week % 13 === 0 && roll(s) < 0.08)
    addCondition(s, "respiratory", 25 + Math.floor(roll(s) * 20));
  const infectious = h.conditions.some(
    (c) => c.status === "active" && CONDITIONS[c.type].infectious,
  );
  if (infectious && s.week % 2 === 0) {
    const members = [
      ...s.family.children.map((c) => ({ id: c.id, name: c.name })),
      ...s.relationships.filter((r) => r.id === s.family.partnerId),
    ];
    for (const member of members)
      if (
        !h.household.some((p) => p.id === member.id && p.until >= s.week) &&
        roll(s) < 0.18
      ) {
        h.household.push({
          id: member.id,
          name: member.name,
          until: s.week + 2,
        });
        note(
          s,
          `${member.name} developed a short household illness; recovery and extra care need time.`,
        );
      }
    h.household = h.household.slice(-20);
  }
  for (const habit of Object.values(h.habits))
    if (habit.lastWeek < s.week - 1) {
      habit.streak = 0;
      habit.strength = clamp(habit.strength - 0.5);
    }
  h.paid += h.lastCost;
  if (s.week % 4 === 0) {
    h.history.push({
      week: s.week,
      stress: h.stress,
      sleepDebt: h.sleepDebt,
      burnout: h.burnout,
    });
    h.history = h.history.slice(-26);
  }
}
export function healthHours(s, week = s.week) {
  const h = s.simulation?.health;
  if (!h?.active || s.globalLife.crime.prison) return 0;
  return (
    h.appointments.filter((a) => a.status === "booked" && a.week === week)
      .length *
      2 +
    h.household.filter((p) => p.until >= week).length * 2
  );
}
export function validateHealth(s) {
  const h = obj(s.simulation.health);
  bool(h.active);
  num(h.lastWeek, 0, s.week, true);
  for (const k of ["sleepDebt", "stress", "burnout"]) num(h[k], 0, 100);
  one(h.nutrition, Object.keys(NUTRITION));
  num(h.paid);
  num(h.lastCost);
  for (const c of arr(h.conditions, 30)) {
    obj(c);
    str(c.id, 100);
    one(c.type, Object.keys(CONDITIONS));
    num(c.since, 0, s.week, true);
    num(c.severity, 0, 100);
    if (c.treatment !== null) {
      one(c.treatment, Object.keys(TREATMENTS));
      if (!TREATMENTS[c.treatment].types.includes(c.type))
        throw new Error("Invalid treatment.");
    }
    num(c.treatedWeeks, 0, 10000, true);
    num(c.lastDelivery, -1, s.week, true);
    one(c.status, ["active", "resolved"]);
  }
  for (const a of arr(h.appointments, 30)) {
    obj(a);
    str(a.id, 100);
    one(a.concern, [
      "general",
      "dental",
      "vision",
      "hearing",
      "mental",
      "injury",
    ]);
    one(a.provider, ["public", "private"]);
    num(a.week, 0, s.week + 4, true);
    one(a.status, ["booked", "attended", "missed"]);
    num(a.paid, 0, 120);
    str(a.result, 200);
  }
  for (const i of arr(h.injuries, 20)) {
    obj(i);
    str(i.id, 100);
    one(i.path, ["football", "racing", "basketball", "tennis"]);
    one(i.type, ["muscle", "fracture", "concussion"]);
    num(i.since, 0, s.week, true);
    num(i.severity, 0, 100);
    bool(i.diagnosed);
    num(i.progress, 0, 100);
    num(i.lastRehab, -1, s.week, true);
    one(i.status, ["recovering", "relapse", "recovered"]);
  }
  obj(h.habits);
  for (const key of Object.keys(HABITS)) {
    const x = obj(h.habits[key]);
    num(x.strength, 0, 100);
    num(x.streak, 0, 10000, true);
    num(x.lastWeek, -1, s.week, true);
  }
  for (const p of arr(h.household, 20)) {
    obj(p);
    str(p.id, 100);
    str(p.name, 100);
    num(p.until, 0, s.week + 2, true);
  }
  for (const r of arr(h.history, 26)) {
    obj(r);
    num(r.week, 0, s.week, true);
    for (const k of ["stress", "sleepDebt", "burnout"]) num(r[k], 0, 100);
  }
  obj(h.checkups);
  for (const k of ["dental", "vision", "hearing"])
    num(h.checkups[k], -520, s.week, true);
  stamps(h.actions, s.week);
}
