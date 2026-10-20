import {
  act,
  age,
  clamp,
  round,
  hash,
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
import { personProfile } from "../connections.js";
export const AFFECTION = {
  time: "Uninterrupted time",
  help: "Practical help",
  gifts: "A thoughtful gift",
};
export const LIFE_PLANS = {
  home: ["local", "abroad"],
  family: ["children", "no-children"],
  spending: ["save", "enjoy"],
};
export const CHILD_AMBITIONS = [
  "engineering",
  "medicine",
  "teaching",
  "music",
  "sport",
  "trades",
];
export function initializeSocial(s) {
  return {
    active: false,
    lastWeek: s.week,
    people: {},
    edges: [],
    grievances: [],
    promises: [],
    plans: [],
    counselling: null,
    extended: [],
    stepChildren: [],
    children: {},
    prenups: [],
    lastPartner: s.family.partnerId,
    actions: {},
    weeklyCost: 0,
  };
}
export function syncSocial(s) {
  const n = s.simulation.social;
  for (const r of s.relationships.slice(0, 100))
    if (!n.people[r.id])
      n.people[r.id] = {
        preference: Object.keys(AFFECTION)[hash(r.id + s.seed) % 3],
        lastBond: r.bond,
        known: false,
        memories: [],
      };
  const ids = s.relationships.slice(0, 30).map((r) => r.id);
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      if (n.edges.length >= 80) break;
      if (
        !n.edges.some((e) => e.a === ids[i] && e.b === ids[j]) &&
        hash(`${ids[i]}:${ids[j]}:${s.seed}`) % 4 === 0
      )
        n.edges.push({
          a: ids[i],
          b: ids[j],
          bond: 25 + (hash(ids[i] + ids[j]) % 61),
          known: false,
        });
    }
  for (const c of s.family.children)
    if (!n.children[c.id])
      n.children[c.id] = {
        id: c.id,
        ambition: CHILD_AMBITIONS[hash(c.id + s.seed) % CHILD_AMBITIONS.length],
        supported: null,
        autonomy: 50,
        adult: null,
        nextFamilyWeek: s.week + 52,
      };
}
function remember(s, id, text) {
  const p = s.simulation.social.people[id];
  if (!p) return;
  p.memories.unshift({ week: s.week, text });
  p.memories = p.memories.slice(0, 12);
}
function knownPerson(state, id) {
  const r = state.relationships.find((r) => r.id === id);
  if (!r || state.lifeCourse.relatives[id]?.deceasedWeek != null)
    throw new Error("Choose a living person you know.");
  return r;
}
export function discoverSocialLinks(state, personId) {
  knownPerson(state, personId);
  const s = act(state, { minAge: 8, hours: 2 }),
    n = s.simulation.social;
  syncSocial(s);
  once(s, n.actions, `network:${personId}`, 4);
  n.active = true;
  n.people[personId].known = true;
  for (const e of n.edges.filter((e) => e.a === personId || e.b === personId))
    e.known = true;
  note(
    s,
    "A conversation revealed some of your contact's existing friendships and personal preferences.",
  );
  return s;
}
export function requestFriendIntroduction(state, personId) {
  const contact = knownPerson(state, personId);
  if (contact.bond < 60 || state.relationships.length >= 100)
    throw new Error(
      "A trusted connection of 60+ is needed, with room in your contact list.",
    );
  const s = act(state, { minAge: 12, hours: 3 }),
    n = s.simulation.social;
  once(s, n.actions, `introduction:${personId}`, 26);
  n.active = true;
  if (roll(s) > 0.4 + contact.bond / 200) {
    note(s, "Your friend could not arrange an introduction this time.");
    return s;
  }
  const id = uid(s, "introduced"),
    given = ["Avery", "Noor", "Robin", "Jules", "Harper"][hash(id) % 5],
    surname = ["Martin", "Chen", "Silva", "Patel", "Jensen"][
      hash(id + personId) % 5
    ];
  const r = {
    id,
    name: `${given} ${surname}`,
    role: "Friend",
    bond: 40,
    icon: given[0] + surname[0],
    color: "blue",
  };
  s.relationships.push(r);
  s.connections.profiles[id] = personProfile(s, r);
  syncSocial(s);
  n.edges.push({ a: personId, b: id, bond: 65, known: true });
  n.edges = n.edges.slice(-80);
  note(
    s,
    `${contact.name} introduced you to ${r.name}. The new friendship has its own preferences and future choices.`,
  );
  return s;
}
export function showAffection(state, personId, kind) {
  const person = knownPerson(state, personId);
  if (!Object.hasOwn(AFFECTION, kind))
    throw new Error("Choose time, practical help or a gift.");
  const s = act(state, {
      minAge: 6,
      cost: kind === "gifts" ? 20 : 0,
      hours: kind === "time" ? 3 : 2,
    }),
    n = s.simulation.social;
  syncSocial(s);
  once(s, n.actions, `affection:${personId}`);
  n.active = true;
  const record = n.people[personId],
    match = record.preference === kind,
    r = s.relationships.find((r) => r.id === personId),
    p = s.connections.profiles[personId];
  r.bond = clamp(person.bond + (match ? 5 : 2));
  if (p) p.trust = clamp(p.trust + (match ? 2 : 0.5));
  record.known = true;
  for (const promise of n.promises.filter(
    (p) =>
      p.personId === personId &&
      p.status === "open" &&
      p.kind === kind &&
      p.deadline >= s.week,
  )) {
    promise.status = "delivered";
    if (p) p.trust = clamp(p.trust + 3);
  }
  for (const grievance of n.grievances.filter(
    (g) => g.personId === personId && g.status === "open",
  ))
    grievance.severity = clamp(grievance.severity - (match ? 8 : 3));
  remember(s, personId, `You made time for ${AFFECTION[kind].toLowerCase()}.`);
  note(
    s,
    `${person.name} appreciated ${match ? "a gesture that suited them especially well" : "your effort"}.`,
  );
  return s;
}
export function makeSocialPromise(state, personId, kind) {
  knownPerson(state, personId);
  if (!Object.hasOwn(AFFECTION, kind)) throw new Error("Choose a promise.");
  const s = act(state, { minAge: 8, hours: 1 }),
    n = s.simulation.social;
  syncSocial(s);
  n.active = true;
  if (
    n.promises.filter((p) => p.status === "open").length >= 5 ||
    n.promises.some((p) => p.status === "open" && p.personId === personId)
  )
    throw new Error(
      "Finish an existing promise before making another to this person; at most five may be open.",
    );
  n.promises.unshift({
    id: uid(s, "promise"),
    personId,
    kind,
    made: s.week,
    deadline: s.week + 4,
    status: "open",
  });
  n.promises = [
    ...n.promises.filter((p) => p.status === "open"),
    ...n.promises.filter((p) => p.status !== "open").slice(0, 20),
  ];
  return s;
}
export function addressGrievance(state, id) {
  const original = state.simulation.social.grievances.find(
    (g) => g.id === id && g.status === "open",
  );
  if (!original) throw new Error("Choose an unresolved grievance.");
  knownPerson(state, original.personId);
  const s = act(state, { minAge: 8, hours: 2 }),
    n = s.simulation.social;
  once(s, n.actions, `grievance:${id}`, 4);
  const g = n.grievances.find((g) => g.id === id),
    p = s.connections.profiles[g.personId];
  g.severity = clamp(g.severity - 20);
  if (g.severity <= 10) {
    g.status = "resolved";
    if (p) p.trust = clamp(p.trust + 3);
    remember(s, g.personId, `You addressed: ${g.reason}`);
  }
  note(
    s,
    g.status === "resolved"
      ? "The specific disagreement was resolved."
      : "Your apology helped; rebuilding trust will need consistent behaviour.",
  );
  return s;
}
export function discussLifePlan(state, topic, choice) {
  const partner = state.relationships.find(
    (r) =>
      r.id === state.family.partnerId && ["Partner", "Spouse"].includes(r.role),
  );
  if (!partner || age(state) < 18 || !LIFE_PLANS[topic]?.includes(choice))
    throw new Error("Discuss an available life plan with your adult partner.");
  const s = act(state, { minAge: 18, hours: 2 }),
    n = s.simulation.social,
    p = s.connections.profiles[partner.id];
  syncSocial(s);
  once(s, n.actions, `plan:${topic}`, 13);
  n.active = true;
  const preferred =
    topic === "family"
      ? p.wantsChildren
        ? "children"
        : "no-children"
      : LIFE_PLANS[topic][hash(`${s.seed}:${partner.id}:${topic}`) % 2];
  const agreed =
    preferred === choice ||
    (topic !== "family" && p.trust >= 75 && roll(s) < 0.45);
  n.plans = n.plans.filter(
    (plan) => !(plan.personId === partner.id && plan.topic === topic),
  );
  n.plans.push({
    personId: partner.id,
    topic,
    choice,
    preferred,
    agreed,
    week: s.week,
  });
  n.plans = n.plans.slice(-20);
  if (agreed) p.trust = clamp(p.trust + 2);
  else p.mood = clamp(p.mood - 2);
  remember(
    s,
    partner.id,
    `${topic}: ${agreed ? "agreed on" : "disagreed about"} ${choice}.`,
  );
  note(
    s,
    `${partner.name} ${agreed ? "agreed to this shared goal" : "has different wishes; the conversation did not override them"}. Normal applications and family decisions are still required.`,
  );
  return s;
}
export function introduceExtendedFamily(state) {
  const id = state.family.partnerId,
    partner = state.relationships.find((r) => r.id === id);
  if (!partner || partner.bond < 60)
    throw new Error("A developed partnership is required.");
  const s = act(state, { minAge: 18, hours: 3 }),
    n = s.simulation.social;
  n.active = true;
  if (n.extended.some((p) => p.partnerId === id))
    throw new Error("You have already met this partner's family.");
  const surname = partner.name.split(" ").at(-1);
  for (const [index, name] of ["Jordan", "Morgan"].entries())
    n.extended.push({
      id: uid(s, "inlaw"),
      partnerId: id,
      name: `${name} ${surname}`,
      bond: 35 + index * 5,
      bornAge: age(s) + 24 + index * 3,
      metWeek: s.week,
      lastVisit: -1,
    });
  if (hash(id + s.seed) % 3 === 0)
    n.stepChildren.push({
      id: uid(s, "stepchild"),
      partnerId: id,
      name: `Jamie ${surname}`,
      ageAtMeeting: 6 + (hash(id) % 8),
      metWeek: s.week,
      bond: 25,
      wellbeing: 70,
    });
  n.extended = n.extended.slice(-20);
  n.stepChildren = n.stepChildren.slice(-8);
  note(
    s,
    "Met your partner's family. Any stepchildren require time and household support while living together.",
  );
  return s;
}
export function visitExtendedFamily(state, id) {
  const original =
    state.simulation.social.extended.find((p) => p.id === id) ||
    state.simulation.social.stepChildren.find((p) => p.id === id);
  if (!original) throw new Error("Choose a family member you have met.");
  const s = act(state, { minAge: 18, cost: 15, hours: 3 }),
    n = s.simulation.social;
  once(s, n.actions, `extended:${id}`, 4);
  const p =
    n.extended.find((p) => p.id === id) ||
    n.stepChildren.find((p) => p.id === id);
  p.bond = clamp(p.bond + 6);
  if ("lastVisit" in p) p.lastVisit = s.week;
  const partner = s.connections.profiles[p.partnerId];
  if (partner && p.partnerId === s.family.partnerId)
    partner.trust = clamp(partner.trust + 1);
  return s;
}
export function startCounselling(state) {
  const p = state.connections.profiles[state.family.partnerId];
  if (
    !p ||
    p.trust < 25 ||
    state.simulation.social.counselling?.status === "active"
  )
    throw new Error(
      "Both partners need enough trust to consider counselling, without an existing programme.",
    );
  const s = act(state, { minAge: 18, hours: 1 }),
    n = s.simulation.social;
  once(s, n.actions, "counselling", 13);
  n.active = true;
  const accepted = roll(s) < clamp(0.35 + p.trust / 180, 0, 0.95);
  n.counselling = {
    personId: state.family.partnerId,
    status: accepted ? "active" : "declined",
    sessions: 0,
    lastSession: -1,
    deadline: s.week + 8,
  };
  note(
    s,
    accepted
      ? "Your partner agreed to four counselling sessions within eight weeks; each session costs $60."
      : "Your partner declined counselling for now.",
  );
  return s;
}
export function attendCounselling(state) {
  const original = state.simulation.social.counselling;
  if (
    !original ||
    original.status !== "active" ||
    original.personId !== state.family.partnerId
  )
    throw new Error("Arrange a mutually agreed counselling programme first.");
  const s = act(state, { minAge: 18, cost: 60, hours: 2 }),
    n = s.simulation.social,
    c = n.counselling;
  once(s, n.actions, "counselling-session");
  c.sessions++;
  c.lastSession = s.week;
  const p = s.connections.profiles[c.personId],
    r = s.relationships.find((r) => r.id === c.personId);
  p.trust = clamp(p.trust + 3);
  r.bond = clamp(r.bond + 2);
  for (const g of n.grievances.filter(
    (g) => g.personId === c.personId && g.status === "open",
  )) {
    g.severity = clamp(g.severity - 10);
    if (g.severity <= 10) g.status = "resolved";
  }
  if (c.sessions === 4) {
    c.status = "completed";
    remember(s, c.personId, "Completed four counselling sessions together.");
  }
  return s;
}
export function supportChildAmbition(state, childId, support = true) {
  const child = state.family.children.find((c) => c.id === childId);
  if (
    !child ||
    ![true, false].includes(support) ||
    state.week - child.bornWeek < 8 * 52
  )
    throw new Error("Discuss an ambition with a child aged eight or older.");
  const s = act(state, { minAge: 18, hours: 2 }),
    n = s.simulation.social;
  syncSocial(s);
  once(s, n.actions, `ambition:${childId}`, 13);
  n.active = true;
  const record = n.children[childId],
    c = s.family.children.find((c) => c.id === childId);
  record.supported = support;
  record.autonomy = clamp(record.autonomy + (support ? 5 : -3));
  c.bond = clamp(c.bond + (support ? 3 : -4));
  note(
    s,
    `${child.name} wants to explore ${record.ambition}. ${support ? "Your support respects that independent choice." : "Insisting on a different path strained the relationship."}`,
  );
  return s;
}
export function signPrenup(state, policy) {
  const id = state.family.partnerId,
    partner = state.relationships.find((r) => r.id === id),
    p = state.connections.profiles[id];
  if (
    !partner ||
    partner.role !== "Partner" ||
    !["contributions", "equal"].includes(policy) ||
    p.trust < 75 ||
    state.simulation.social.prenups.some(
      (a) => a.partnerId === id && a.status === "signed",
    )
  )
    throw new Error(
      "Discuss one financial agreement with a trusting partner before marriage.",
    );
  if (availableCash(state) < 200 || p.wealth < 200)
    throw new Error("Each partner needs $200 for independent advice.");
  const s = act(state, { minAge: 18, cost: 200, hours: 2 }),
    n = s.simulation.social;
  s.connections.profiles[id].wealth -= 200;
  const agreed = roll(s) < 0.45 + p.trust / 200;
  n.prenups.push({
    partnerId: id,
    policy,
    week: s.week,
    status: agreed ? "signed" : "declined",
  });
  n.prenups = n.prenups.slice(-20);
  if (!agreed) s.connections.profiles[id].trust = clamp(p.trust - 2);
  note(
    s,
    agreed
      ? `Both partners signed a ${policy === "equal" ? "50/50 joint-account" : "recorded-contribution"} settlement agreement. Personal assets and child support remain separate.`
      : "Independent advice was paid for, but no agreement was signed.",
  );
  return s;
}
export function agreedJointShare(s, partnerId, balance, original, spouse) {
  const agreement = s.simulation?.social.prenups.find(
    (p) => p.partnerId === partnerId && p.status === "signed",
  );
  return spouse && agreement?.policy === "equal"
    ? round(balance / 2)
    : original;
}
export function supportAdultChild(state, childId, amount = 100) {
  if (!Number.isFinite(amount) || amount < 10 || amount > 100000)
    throw new Error("Choose support between $10 and $100,000.");
  const adult = state.simulation.social.children[childId]?.adult;
  if (!adult) throw new Error("This child is not yet an independent adult.");
  const s = act(state, { minAge: 18, cost: amount, hours: 1 });
  s.simulation.social.children[childId].adult.savings = round(
    adult.savings + amount,
  );
  return s;
}
export function socialHours(s) {
  if (!s.simulation?.social.active || !s.family.livingTogether) return 0;
  return (
    s.simulation.social.stepChildren.filter(
      (c) =>
        c.partnerId === s.family.partnerId &&
        c.ageAtMeeting + Math.floor((s.week - c.metWeek) / 52) < 18,
    ).length * 4
  );
}
export function advanceSocial(s) {
  const n = s.simulation.social;
  if (n.lastWeek === s.week) return;
  n.lastWeek = s.week;
  syncSocial(s);
  n.weeklyCost = 0;
  if (!n.active) return;
  for (const p of n.promises.filter(
    (p) => p.status === "open" && p.deadline < s.week,
  )) {
    p.status = "missed";
    const person = s.connections.profiles[p.personId];
    if (person) person.trust = clamp(person.trust - 5);
    n.grievances.unshift({
      id: uid(s, "grievance"),
      personId: p.personId,
      reason: `A promised ${AFFECTION[p.kind].toLowerCase()} never happened.`,
      week: s.week,
      severity: 30,
      status: "open",
    });
    remember(s, p.personId, "You did not keep a specific promise.");
  }
  for (const r of s.relationships) {
    const p = n.people[r.id];
    if (!p) continue;
    if (
      p.lastBond - r.bond >= 8 &&
      !n.grievances.some((g) => g.personId === r.id && g.status === "open")
    )
      n.grievances.unshift({
        id: uid(s, "grievance"),
        personId: r.id,
        reason: "A recent disagreement damaged your connection.",
        week: s.week,
        severity: 25,
        status: "open",
      });
    p.lastBond = r.bond;
    if (
      s.week % 4 === 0 &&
      n.grievances.some((g) => g.personId === r.id && g.status === "open")
    )
      r.bond = clamp(r.bond - 0.5);
  }
  n.grievances = [
    ...n.grievances.filter((g) => g.status === "open").slice(0, 30),
    ...n.grievances.filter((g) => g.status === "resolved").slice(0, 20),
  ];
  if (
    n.counselling?.status === "active" &&
    (n.counselling.deadline < s.week ||
      n.counselling.personId !== s.family.partnerId)
  )
    n.counselling.status = "ended";
  for (const child of n.stepChildren.filter(
    (c) =>
      s.family.livingTogether &&
      c.partnerId === s.family.partnerId &&
      c.ageAtMeeting + Math.floor((s.week - c.metWeek) / 52) < 18,
  )) {
    if (availableCash(s) >= 25) {
      s.money = round(s.money - 25);
      n.weeklyCost += 25;
      child.wellbeing = clamp(child.wellbeing + 0.1);
    } else child.wellbeing = clamp(child.wellbeing - 0.5);
  }
  for (const child of s.family.children) {
    const record = n.children[child.id],
      years = Math.floor((s.week - child.bornWeek) / 52);
    if (years >= 18 && !record.adult) {
      record.adult = {
        startedWeek: s.week,
        role: ["medicine", "engineering", "teaching"].includes(record.ambition)
          ? "student"
          : "junior",
        savings: 0,
        qualified: false,
        partner: null,
        children: [],
      };
      note(
        s,
        `${child.name} began an independent ${record.adult.role === "student" ? "course of study" : "junior working life"} in ${record.ambition}.`,
      );
    }
    if (!record.adult) continue;
    const a = record.adult,
      studyYears = record.ambition === "medicine" ? 6 : 3;
    if (a.role === "student" && s.week - a.startedWeek >= studyYears * 52) {
      a.qualified = true;
      a.role = "junior";
      note(
        s,
        `${child.name} completed their own course and began looking for junior work.`,
      );
    }
    if (a.role === "junior")
      a.savings = round(a.savings + (a.qualified ? 220 : 100));
    if (s.week >= record.nextFamilyWeek && years >= 24) {
      record.nextFamilyWeek = s.week + 52;
      if (!a.partner && roll(s) < 0.3) a.partner = `partner:${child.id}`;
      else if (
        a.partner &&
        a.children.length < 3 &&
        a.savings >= 5000 &&
        roll(s) < 0.2
      ) {
        a.savings -= 3000;
        a.children.push({
          id: uid(s, "grandchild"),
          name: ["Alex", "Sam", "Robin"][a.children.length],
          bornWeek: s.week,
        });
        note(
          s,
          `${child.name} welcomed a child; you became a grandparent.`,
          "milestone",
        );
      }
    }
  }
}
export function validateSocial(s) {
  const n = obj(s.simulation.social);
  bool(n.active);
  num(n.lastWeek, 0, s.week, true);
  num(n.weeklyCost);
  if (n.lastPartner !== null) str(n.lastPartner, 100);
  if (Object.keys(obj(n.people)).length > 100)
    throw new Error("Too many social records.");
  for (const [id, p] of Object.entries(n.people)) {
    str(id, 100);
    obj(p);
    one(p.preference, Object.keys(AFFECTION));
    num(p.lastBond, 0, 100);
    bool(p.known);
    for (const m of arr(p.memories, 12)) {
      num(m.week, 0, s.week, true);
      str(m.text, 200);
    }
  }
  for (const e of arr(n.edges, 80)) {
    obj(e);
    str(e.a, 100);
    str(e.b, 100);
    num(e.bond, 0, 100);
    bool(e.known);
  }
  for (const g of arr(n.grievances, 50)) {
    obj(g);
    str(g.id, 100);
    str(g.personId, 100);
    str(g.reason, 200);
    num(g.week, 0, s.week, true);
    num(g.severity, 0, 100);
    one(g.status, ["open", "resolved"]);
  }
  for (const p of arr(n.promises, 25)) {
    obj(p);
    str(p.id, 100);
    str(p.personId, 100);
    one(p.kind, Object.keys(AFFECTION));
    num(p.made, 0, s.week, true);
    num(p.deadline, p.made, s.week + 4, true);
    one(p.status, ["open", "delivered", "missed"]);
  }
  for (const p of arr(n.plans, 20)) {
    obj(p);
    str(p.personId, 100);
    one(p.topic, Object.keys(LIFE_PLANS));
    one(p.choice, LIFE_PLANS[p.topic]);
    one(p.preferred, LIFE_PLANS[p.topic]);
    bool(p.agreed);
    num(p.week, 0, s.week, true);
  }
  if (n.counselling) {
    const c = obj(n.counselling);
    str(c.personId, 100);
    one(c.status, ["active", "declined", "completed", "ended"]);
    num(c.sessions, 0, 4, true);
    num(c.lastSession, -1, s.week, true);
    num(c.deadline, 0, s.week + 8, true);
  }
  for (const p of arr(n.extended, 20)) {
    obj(p);
    str(p.id, 100);
    str(p.partnerId, 100);
    str(p.name, 100);
    num(p.bond, 0, 100);
    num(p.bornAge, 18, 150, true);
    num(p.metWeek, 0, s.week, true);
    num(p.lastVisit, -1, s.week, true);
  }
  for (const p of arr(n.stepChildren, 8)) {
    obj(p);
    str(p.id, 100);
    str(p.partnerId, 100);
    str(p.name, 100);
    num(p.ageAtMeeting, 0, 17, true);
    num(p.metWeek, 0, s.week, true);
    num(p.bond, 0, 100);
    num(p.wellbeing, 0, 100);
  }
  for (const p of arr(n.prenups, 20)) {
    obj(p);
    str(p.partnerId, 100);
    one(p.policy, ["equal", "contributions"]);
    num(p.week, 0, s.week, true);
    one(p.status, ["signed", "declined"]);
  }
  if (Object.keys(obj(n.children)).length > 20)
    throw new Error("Too many child records.");
  for (const [id, c] of Object.entries(n.children)) {
    str(id, 100);
    obj(c);
    str(c.id, 100);
    one(c.ambition, CHILD_AMBITIONS);
    if (c.supported !== null) bool(c.supported);
    num(c.autonomy, 0, 100);
    num(c.nextFamilyWeek, 0, s.week + 52, true);
    if (c.adult) {
      const a = obj(c.adult);
      num(a.startedWeek, 0, s.week, true);
      one(a.role, ["student", "junior"]);
      num(a.savings);
      bool(a.qualified);
      if (a.partner !== null) str(a.partner, 100);
      for (const g of arr(a.children, 3)) {
        str(g.id, 100);
        str(g.name, 100);
        num(g.bornWeek, 0, s.week, true);
      }
    }
  }
  stamps(n.actions, s.week);
}
