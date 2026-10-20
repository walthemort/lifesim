import { outfitSuitability } from "./simulation/effects.js";
import { routePartnerContribution } from "./realism.js";
import { relativeAlive } from "./life-course.js";
import { availableCash, rng } from "./world.js";
import { spendTime, requiredHours } from "./calendar.js";
const age = (s) =>
  s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52);
const clamp = (n) => Math.max(0, Math.min(100, n));
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
const INTERESTS = ["music", "sport", "travel", "cooking", "technology", "art"];
const VALUES = ["family", "career", "security", "adventure", "creativity"];
export const DATE_PLANS = [
  {
    id: "walk",
    name: "Walk in the park",
    cost: 0,
    hours: 2,
    interest: "sport",
  },
  {
    id: "coffee",
    name: "Coffee and conversation",
    cost: 15,
    hours: 2,
    interest: null,
  },
  {
    id: "dinner",
    name: "Dinner together",
    cost: 65,
    hours: 3,
    interest: "cooking",
  },
  { id: "concert", name: "Live music", cost: 90, hours: 4, interest: "music" },
  { id: "gallery", name: "Art gallery", cost: 10, hours: 3, interest: "art" },
  { id: "video", name: "Video date", cost: 0, hours: 2, interest: null },
];
export const CHILD_CLUBS = [
  { id: "none", name: "No organised club", cost: 0 },
  { id: "football", name: "Local football", cost: 12, interest: "sport" },
  { id: "karting", name: "Karting", cost: 45, interest: "sport" },
  { id: "music", name: "Music lessons", cost: 20, interest: "music" },
  { id: "coding", name: "Coding club", cost: 12, interest: "technology" },
  { id: "art", name: "Art classes", cost: 10, interest: "art" },
];
const hash = (text) =>
  [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
export function personProfile(s, r) {
  const h = hash(r.id + r.name);
  return {
    personality: ["Outgoing", "Thoughtful", "Ambitious", "Practical"][h % 4],
    interests: [INTERESTS[h % 6], INTERESTS[((h % 6) + 2) % 6]],
    values: VALUES[h % 5],
    trust: clamp(45 + r.bond * 0.35),
    mood: 65,
    ageOffset: age(s) < 18 ? 0 : Math.max(18 - age(s), (h % 5) - 2),
    city: s.city,
    job:
      age(s) < 18
        ? "Student"
        : age(s) < 21
          ? "Working and studying"
          : ["Office worker", "Teacher", "Designer", "Technician", "Nurse"][
              h % 5
            ],
    weeklyPay: age(s) < 18 ? 0 : 450 + (h % 600),
    wealth: age(s) < 18 ? 250 : 5000,
    dates: 0,
    successfulDates: 0,
    lastContactWeek: s.week,
    wantsChildren: h % 5 !== 0,
    plans: "Settled locally",
    lastDecisionWeek: -52,
  };
}
export function ensurePeople(s) {
  for (const r of s.relationships)
    if (!s.connections.profiles[r.id])
      s.connections.profiles[r.id] = personProfile(s, r);
}
function ensureChildren(s) {
  for (const c of s.family.children)
    if (!c.interest)
      Object.assign(c, {
        interest: INTERESTS[hash(c.id + c.name) % 6],
        club: "none",
        schoolType: "state",
        confidence: 60,
        independence: 50,
        future: "undecided",
        support: false,
        lastSupportWeek: s.week,
      });
}
export function initializeConnections(s) {
  s.connections = {
    profiles: {},
    discoveries: [],
    serial: 0,
    appActive: false,
    nextDiscoveryWeek: 0,
  };
  ensurePeople(s);
  s.family.livingTogether = s.relationships.some((r) => r.role === "Spouse");
  s.family.issues = [];
  s.family.issueSerial = 0;
  s.family.weeklyContribution = 0;
  ensureChildren(s);
}
export function compatibility(s, id) {
  const p = s.connections.profiles[id];
  if (!p) return 0;
  const interests = new Set();
  if (s.music.active || s.pastimes.hobbies.cooking?.sessions)
    interests.add(s.music.active ? "music" : "cooking");
  if (
    s.trait === "Athletic" ||
    s.football.stage !== "none" ||
    Object.values(s.sports).some((x) => x.stage !== "none")
  )
    interests.add("sport");
  for (const [id, h] of Object.entries(s.pastimes.hobbies))
    if (h.sessions)
      interests.add(
        id === "coding" ? "technology" : id === "photography" ? "art" : id,
      );
  const matching = p.interests.filter((i) => interests.has(i)).length;
  const values =
    s.trait === "Ambitious"
      ? "career"
      : s.trait === "Social"
        ? "family"
        : s.trait === "Analytical"
          ? "security"
          : "adventure";
  return Math.min(
    95,
    45 +
      matching * 15 +
      (p.values === values ? 15 : 0) +
      (p.personality === "Thoughtful" ? 5 : 0),
  );
}
function action(state, hours = 2, label = "Social plans") {
  if (state.ended || !state.actions)
    throw new Error("You need a free-time action in an active life.");
  const s = structuredClone(state);
  spendTime(s, hours, label);
  s.actions--;
  return s;
}
export function openDatingApp(state) {
  if (age(state) < 18)
    throw new Error(
      "Dating apps are available from age 18. Meet people at school or local activities before then.",
    );
  if (
    !state.inventory.some((i) =>
      ["phone", "premium-phone", "laptop", "workstation"].includes(i),
    )
  )
    throw new Error("Buy a phone or computer to use a dating app.");
  if (state.relationships.some((r) => ["Partner", "Spouse"].includes(r.role)))
    throw new Error("You are already in an exclusive relationship.");
  if (state.connections.nextDiscoveryWeek > state.week)
    throw new Error("New profiles arrive every thirteen weeks.");
  const s = action(state, 1, "Browse dating profiles");
  s.connections.appActive = true;
  s.connections.nextDiscoveryWeek = s.week + 13;
  const names = [
    "Alex Bennett",
    "Robin Hayes",
    "Charlie Silva",
    "Dakota Walsh",
    "Rowan Patel",
    "Ellis Grant",
    "Reese Martin",
    "Finley Ross",
  ];
  s.connections.discoveries = Array.from({ length: 4 }, () => {
    const serial = s.connections.serial++,
      name = names[serial % names.length],
      r = {
        id: `match:${serial}`,
        name,
        role: "New connection",
        bond: 20,
        icon: name
          .split(" ")
          .map((x) => x[0])
          .join(""),
        color: ["purple", "blue", "green", "orange"][serial % 4],
      };
    return { person: r, profile: personProfile(s, r), status: "available" };
  });
  return s;
}
export function messageMatch(state, id) {
  const candidate = state.connections.discoveries.find(
    (d) => d.person.id === id,
  );
  if (!candidate || candidate.status !== "available")
    throw new Error("Choose an available profile.");
  if (state.relationships.length >= 8)
    throw new Error(
      "Your circle is full. Focus on the people you already know.",
    );
  if (state.relationships.some((r) => ["Partner", "Spouse"].includes(r.role)))
    throw new Error("You are already in an exclusive relationship.");
  const s = action(state, 1, "Message a dating profile"),
    d = s.connections.discoveries.find((d) => d.person.id === id);
  if (rng(s) < 0.75) {
    d.status = "matched";
    s.relationships.push(d.person);
    s.connections.profiles[id] = d.profile;
    log(
      s,
      `${d.person.name} replied. Get to know each other before making plans.`,
    );
  } else {
    d.status = "declined";
    log(s, `${d.person.name} did not reply. Interest has to be mutual.`);
  }
  return s;
}
export function inviteDate(state, id, planId, approach = "attentive") {
  const r = state.relationships.find((r) => r.id === id),
    p = state.connections.profiles[id],
    plan = DATE_PLANS.find((d) => d.id === planId);
  if (
    !r ||
    !p ||
    !plan ||
    !["attentive", "shared", "ambitions"].includes(approach)
  )
    throw new Error("Choose a person, date and conversation approach.");
  if (
    age(state) < 16 ||
    ["Parent", "Sibling", "Best friend", "Former partner"].includes(r.role) ||
    age(state) < 18 !== age(state) + p.ageOffset < 18
  )
    throw new Error("This connection is not available for dating.");
  if (
    state.relationships.some(
      (x) => ["Partner", "Spouse"].includes(x.role) && x.id !== id,
    )
  )
    throw new Error("You are already in an exclusive relationship.");
  if (r.bond < 35)
    throw new Error(
      "Build at least 35 connection before inviting them on a date.",
    );
  if (p.city !== state.city && plan.id !== "video")
    throw new Error("They live elsewhere. Arrange a video date.");
  if (
    plan.id === "video" &&
    !state.inventory.some((i) =>
      ["phone", "premium-phone", "laptop", "workstation"].includes(i),
    )
  )
    throw new Error("A video date needs a phone or computer.");
  const entries = state.calendar.entries.filter(
    (e) => e.status === "scheduled" && e.week === state.week + 1,
  );
  if (
    entries.some((e) => e.personId === id) ||
    entries.filter((e) => e.kind === "date").length >= 2
  )
    throw new Error(
      "You already have plans with them, or two dates booked next week.",
    );
  const required = Object.values(requiredHours(state)).reduce(
    (a, b) => a + b,
    0,
  );
  if (required + entries.reduce((n, e) => n + e.hours, 0) + plan.hours > 168)
    throw new Error(
      "Next week has no room for this date. Adjust your commitments first.",
    );
  if (availableCash(state) < plan.cost)
    throw new Error("Not enough available cash for this date.");
  const s = action(state, 1, "Arrange a date"),
    person = s.connections.profiles[id];
  if (
    !["Partner", "Spouse"].includes(r.role) &&
    rng(s) >
      Math.min(
        0.95,
        0.3 +
          compatibility(s, id) * 0.004 +
          r.bond * 0.002 +
          person.trust * 0.001,
      )
  ) {
    log(s, `${r.name} declined the invitation. No reservation was charged.`);
    return s;
  }
  s.money -= plan.cost;
  person.lastContactWeek = s.week;
  s.calendar.entries.push({
    id: `appointment:${s.calendar.serial++}`,
    kind: "date",
    personId: id,
    plan: plan.id,
    approach,
    week: s.week + 1,
    hours: plan.hours,
    cost: plan.cost,
    title: `${plan.name} with ${r.name}`,
    status: "scheduled",
  });
  s.calendar.entries = s.calendar.entries.slice(-32);
  log(s, `${r.name} agreed to ${plan.name.toLowerCase()} next week.`);
  return s;
}
export function askExclusive(state, id) {
  const r = state.relationships.find((r) => r.id === id),
    p = state.connections.profiles[id];
  if (
    !r ||
    !p ||
    [
      "Parent",
      "Sibling",
      "Best friend",
      "Former partner",
      "Partner",
      "Spouse",
    ].includes(r.role)
  )
    throw new Error("Choose someone you are dating.");
  if (state.relationships.some((x) => ["Partner", "Spouse"].includes(x.role)))
    throw new Error("You are already in a relationship.");
  if (p.successfulDates < 3 || r.bond < 65 || p.trust < 65)
    throw new Error(
      "Commitment needs three good dates, 65 connection and 65 trust.",
    );
  if (state.week - p.lastDecisionWeek < 4)
    throw new Error("Give them four weeks before asking again.");
  const s = action(state, 2, "Talk about commitment"),
    profile = s.connections.profiles[id];
  profile.lastDecisionWeek = s.week;
  if (
    rng(s) <
    Math.min(0.95, 0.3 + compatibility(s, id) * 0.005 + profile.trust * 0.002)
  ) {
    s.relationships.find((x) => x.id === id).role = "Partner";
    s.family.partnerId = id;
    s.family.sinceWeek = s.week;
    s.family.engagement = null;
    log(s, `You and ${r.name} chose to become exclusive.`, "milestone");
  } else
    log(
      s,
      `${r.name} is not ready for commitment. You can continue getting to know each other.`,
    );
  return s;
}
export function moveInTogether(state) {
  const r = state.relationships.find((r) =>
      ["Partner", "Spouse"].includes(r.role),
    ),
    p = r && state.connections.profiles[r.id];
  if (
    !r ||
    age(state) < 18 ||
    r.bond < 75 ||
    p.trust < 65 ||
    (!state.housing.rental && !state.housing.residence)
  )
    throw new Error(
      "Moving in needs an adult partnership, 75 connection, 65 trust and your own home.",
    );
  if (state.family.livingTogether)
    throw new Error("You already live together.");
  const s = action(state, 3, "Move in together");
  s.family.livingTogether = true;
  s.connections.profiles[r.id].city = s.city;
  log(
    s,
    `Moved in with ${r.name}. You now share care and some household costs.`,
    "milestone",
  );
  return s;
}
export function cancelAppointment(state, id) {
  const e = state.calendar.entries.find((e) => e.id === id);
  if (state.ended || !e || e.status !== "scheduled" || e.week <= state.week)
    throw new Error("Only upcoming appointments can be cancelled.");
  const s = structuredClone(state),
    entry = s.calendar.entries.find((e) => e.id === id);
  entry.status = "cancelled";
  s.money += entry.cost * 0.8;
  if (entry.personId)
    s.connections.profiles[entry.personId].trust = clamp(
      s.connections.profiles[entry.personId].trust - 2,
    );
  log(s, `Cancelled ${entry.title}. 80% of paid reservations was refunded.`);
  return s;
}
export function bookFamilyDay(state) {
  if (!state.family.children.length && !state.family.partnerId)
    throw new Error(
      "Start a partnership or family before planning a family day.",
    );
  if (
    state.calendar.entries.some(
      (e) =>
        e.kind === "family" &&
        e.status === "scheduled" &&
        e.week === state.week + 1,
    )
  )
    throw new Error("A family day is already planned.");
  const entries = state.calendar.entries.filter(
    (e) => e.status === "scheduled" && e.week === state.week + 1,
  );
  if (
    Object.values(requiredHours(state)).reduce((a, b) => a + b, 0) +
      entries.reduce((n, e) => n + e.hours, 0) +
      5 >
    168
  )
    throw new Error("Next week has no room for a family day.");
  if (availableCash(state) < 25) throw new Error("A family day costs $25.");
  const s = action(state, 1, "Plan a family day");
  s.money -= 25;
  s.calendar.entries.push({
    id: `appointment:${s.calendar.serial++}`,
    kind: "family",
    week: s.week + 1,
    hours: 5,
    cost: 25,
    title: "A day with the family",
    status: "scheduled",
  });
  s.calendar.entries = s.calendar.entries.slice(-32);
  return s;
}
export function setChildPlan(state, id, club, schoolType, support = false) {
  const c = state.family.children.find((c) => c.id === id);
  if (
    state.ended ||
    !c ||
    !CHILD_CLUBS.some((x) => x.id === club) ||
    !["state", "private"].includes(schoolType) ||
    typeof support !== "boolean"
  )
    throw new Error("Choose a child, activity, school and support plan.");
  const years = Math.floor((state.week - c.bornWeek) / 52);
  if (years < 5 || years >= 18)
    throw new Error("School and activity plans are for children aged 5–17.");
  if (club === "karting" && years < 6)
    throw new Error("Karting lessons start at age 6.");
  const s = action(state, 2, "Discuss a child’s plans"),
    child = s.family.children.find((c) => c.id === id);
  Object.assign(child, { club, schoolType, support, lastSupportWeek: s.week });
  log(
    s,
    `Discussed ${c.name}'s school, activities and future support. Their interests will shape their own choices.`,
  );
  return s;
}
export function respondFamilyIssue(state, id, choice) {
  const issue = state.family.issues.find(
    (i) => i.id === id && i.status === "open",
  );
  if (!issue || !["listen", "tutor", "pressure"].includes(choice))
    throw new Error("Choose a response to an open family issue.");
  const cost = choice === "tutor" ? 40 : 0;
  if (availableCash(state) < cost) throw new Error("Tutoring costs $40.");
  const s = action(state, choice === "listen" ? 3 : 2, "Help a child"),
    c = s.family.children.find((c) => c.id === issue.childId);
  s.money -= cost;
  s.family.issues.find((i) => i.id === id).status = "resolved";
  if (choice === "listen") {
    c.bond = clamp(c.bond + 6);
    c.confidence = clamp(c.confidence + 5);
    c.wellbeing = clamp(c.wellbeing + 4);
  }
  if (choice === "tutor") {
    c.education = clamp(c.education + 4);
    c.confidence = clamp(c.confidence + 2);
  }
  if (choice === "pressure") {
    c.education = clamp(c.education + 2);
    c.bond = clamp(c.bond - 5);
    c.wellbeing = clamp(c.wellbeing - 5);
  }
  c.lastSupportWeek = s.week;
  log(
    s,
    `Responded to ${c.name}'s concerns${choice === "pressure" ? "; pressure hurt your connection" : ""}.`,
  );
  return s;
}
export function childExtraCosts(s) {
  return s.family.children.reduce((n, c) => {
    const years = Math.floor((s.week - c.bornWeek) / 52);
    return (
      n +
      (years >= 5 && years < 18
        ? (CHILD_CLUBS.find((x) => x.id === c.club)?.cost || 0) +
          (c.schoolType === "private" ? 90 : 0)
        : years >= 18 && years < 21 && c.future === "university" && c.support
          ? 60
          : 0)
    );
  }, 0);
}
export function advanceConnections(s) {
  ensurePeople(s);
  ensureChildren(s);
  s.family.weeklyContribution = 0;
  let room = Math.max(
    0,
    168 - (s.calendar.last?.mandatory || 0) - s.calendar.spent,
  );
  for (const e of s.calendar.entries.filter(
    (e) => e.status === "scheduled" && e.week <= s.week,
  )) {
    const p = e.personId ? s.connections.profiles[e.personId] : null,
      r = e.personId ? s.relationships.find((r) => r.id === e.personId) : null;
    const missed =
      room < e.hours ||
      s.energy < 15 ||
      (e.kind === "date" &&
        (!p || !r || (p.city !== s.city && e.plan !== "video")));
    if (missed) {
      e.status = "missed";
      if (p) {
        p.trust = clamp(p.trust - 8);
        r.bond = clamp(r.bond - 5);
      }
      log(
        s,
        `Missed ${e.title}. Your commitments left too little time or energy.`,
        "warning",
      );
      continue;
    }
    room -= e.hours;
    e.status = "completed";
    if (e.kind === "date") {
      const plan = DATE_PLANS.find((d) => d.id === e.plan),
        shared = plan.interest && p.interests.includes(plan.interest),
        quality =
          compatibility(s, r.id) * 0.5 +
          outfitSuitability(s, "formal") +
          p.mood * 0.25 +
          (e.approach === "attentive"
            ? 15
            : e.approach === "shared" && shared
              ? 20
              : e.approach === "ambitions" && p.values === "career"
                ? 18
                : 5) -
          (s.calendar.last.stress || 0) * 0.15;
      p.dates++;
      p.lastContactWeek = s.week;
      if (quality >= 45) {
        p.successfulDates++;
        p.trust = clamp(p.trust + 8);
        r.bond = clamp(r.bond + 12);
        s.happiness = clamp(s.happiness + 4);
        log(
          s,
          `Your date with ${r.name} went well. You learned more about each other.`,
          "positive",
        );
      } else {
        p.trust = clamp(p.trust - 3);
        r.bond = clamp(r.bond - 2);
        log(
          s,
          `The date with ${r.name} felt strained. Listen to their interests and make room in your schedule.`,
        );
      }
    } else {
      for (const c of s.family.children) {
        c.bond = clamp(c.bond + 8);
        c.wellbeing = clamp(c.wellbeing + 5);
        c.lastSupportWeek = s.week;
      }
      const partner = s.relationships.find((r) => r.id === s.family.partnerId);
      if (partner) {
        partner.bond = clamp(partner.bond + 6);
        s.connections.profiles[partner.id].trust = clamp(
          s.connections.profiles[partner.id].trust + 4,
        );
      }
      s.happiness = clamp(s.happiness + 5);
      log(s, "Shared a day with the family.", "positive");
    }
  }
  for (const r of s.relationships) {
    const p = s.connections.profiles[r.id];
    if (!relativeAlive(s, r.id)) continue;
    p.wealth = Math.max(
      0,
      p.wealth +
        (age(s) + p.ageOffset < 6
          ? 0
          : age(s) + p.ageOffset < 12
            ? 5
            : age(s) + p.ageOffset < 18
              ? 25
              : p.weeklyPay) -
        (age(s) + p.ageOffset < 12 ? 0 : age(s) + p.ageOffset < 18 ? 15 : 350),
    );
    p.mood = clamp(p.mood + (p.wealth < 300 ? -1 : 0.1));
    if (
      s.activity === "social" ||
      s.calendar.last.allocations.relationships >= 4
    ) {
      p.lastContactWeek = s.week;
      p.trust = clamp(p.trust + 0.15);
    } else if (s.week - p.lastContactWeek > 4) {
      p.trust = clamp(p.trust - 0.4);
      r.bond = clamp(r.bond - 0.3);
    }
    if (s.week % 52 === 0) {
      if (p.job === "Student" && age(s) + p.ageOffset >= 18) {
        p.job = "Working and studying";
        p.weeklyPay = 400;
        log(s, `${r.name} started their own working life.`);
      } else if (p.weeklyPay && !s.lifeCourse?.relatives[r.id])
        p.weeklyPay = Math.round(p.weeklyPay * 1.03);
    }
    if (
      s.week % 26 === 0 &&
      !["Parent", "Partner", "Spouse", "Sibling"].includes(r.role) &&
      rng(s) < 0.08
    ) {
      p.city = p.city === s.city ? "Elsewhere" : s.city;
      p.plans =
        p.city === s.city
          ? "Returned to your city"
          : "Moved for a career opportunity";
      log(s, `${r.name} ${p.plans.toLowerCase()}.`);
    }
    if (s.family.livingTogether && r.id === s.family.partnerId) {
      const contribution = Math.min(150, p.weeklyPay * 0.2, p.wealth);
      p.wealth -= contribution;
      if (!routePartnerContribution(s, r.id, contribution))
        s.money += contribution;
      s.family.weeklyContribution = contribution;
    }
  }
  if (!s.family.partnerId) s.family.livingTogether = false;
  for (const c of s.family.children) {
    const years = Math.floor((s.week - c.bornWeek) / 52),
      club = CHILD_CLUBS.find((x) => x.id === c.club);
    if (years >= 5 && years < 18) {
      if (club?.interest) {
        c.confidence = clamp(
          c.confidence + (club.interest === c.interest ? 0.15 : -0.03),
        );
      }
      if (c.schoolType === "private" && s.money >= 0)
        c.education = clamp(c.education + 0.06);
      c.independence = clamp(c.independence + 0.03);
      if (s.calendar.last.stress > 30) {
        c.bond = clamp(c.bond - 0.15);
        c.wellbeing = clamp(c.wellbeing - 0.1);
      }
      if (
        s.week % 13 === 0 &&
        !s.family.issues.some((i) => i.childId === c.id && i.status === "open")
      ) {
        s.family.issues.push({
          id: `family-issue:${s.family.issueSerial++}`,
          childId: c.id,
          title:
            c.education < 55
              ? "Finding schoolwork difficult"
              : "Feeling left out at school",
          week: s.week,
          expiresWeek: s.week + 3,
          status: "open",
        });
        s.family.issues = s.family.issues.slice(-16);
      }
    }
    if (years >= 18 && c.future === "undecided") {
      c.future =
        c.education >= 70
          ? "university"
          : c.interest === "music" || c.interest === "art"
            ? "creative work"
            : "apprenticeship";
      log(
        s,
        `${c.name} chose ${c.future}. You can support them, but this is their own life.`,
        "milestone",
      );
    }
    if (years >= 21 && c.future === "university") {
      c.future = "graduate career";
      c.support = false;
      log(
        s,
        `${c.name} finished university and began their own career.`,
        "milestone",
      );
    }
  }
  for (const i of s.family.issues)
    if (i.status === "open" && i.expiresWeek <= s.week) {
      i.status = "missed";
      const c = s.family.children.find((c) => c.id === i.childId);
      c.wellbeing = clamp(c.wellbeing - 3);
      log(s, `${c.name}'s concerns went unanswered.`, "warning");
    }
}
export function validateConnections(s) {
  const n = (v, min = 0, max = Infinity) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const profile = (p, r) =>
    p &&
    ["Outgoing", "Thoughtful", "Ambitious", "Practical"].includes(
      p.personality,
    ) &&
    Array.isArray(p.interests) &&
    p.interests.length === 2 &&
    p.interests.every((i) => INTERESTS.includes(i)) &&
    VALUES.includes(p.values) &&
    ["trust", "mood"].every((k) => n(p[k], 0, 100)) &&
    n(
      p.ageOffset,
      r?.role === "Family friend"
        ? -100
        : r?.role === "Parent"
          ? 18
          : r?.role === "Sibling"
            ? -30
            : -2,
      r?.role === "Family friend"
        ? 150
        : r?.role === "Parent"
          ? 100
          : r?.role === "Sibling"
            ? 30
            : 2,
    ) &&
    typeof p.city === "string" &&
    typeof p.job === "string" &&
    typeof p.plans === "string" &&
    n(p.weeklyPay) &&
    n(p.wealth) &&
    n(p.dates) &&
    n(p.successfulDates, 0, p.dates) &&
    n(p.lastContactWeek, 0, s.week) &&
    n(p.lastDecisionWeek, -52, s.week) &&
    typeof p.wantsChildren === "boolean";
  const c = s.connections,
    f = s.family,
    fail = () => {
      throw new Error("Invalid dating or family data in save.");
    };
  if (
    !c ||
    !c.profiles ||
    typeof c.profiles !== "object" ||
    Array.isArray(c.profiles) ||
    Object.keys(c.profiles).length !== s.relationships.length ||
    s.relationships.some((r) => !profile(c.profiles[r.id], r)) ||
    !n(c.serial) ||
    !Number.isInteger(c.serial) ||
    typeof c.appActive !== "boolean" ||
    !n(c.nextDiscoveryWeek) ||
    !Array.isArray(c.discoveries) ||
    c.discoveries.length > 4 ||
    c.discoveries.some(
      (d) =>
        !profile(d.profile) ||
        typeof d.person?.id !== "string" ||
        typeof d.person.name !== "string" ||
        !n(d.person.bond, 0, 100) ||
        !["available", "matched", "declined"].includes(d.status),
    ) ||
    typeof f.livingTogether !== "boolean" ||
    !n(f.weeklyContribution) ||
    !n(f.issueSerial) ||
    !Array.isArray(f.issues) ||
    f.issues.length > 16
  )
    fail();
  if (
    f.children.some(
      (c) =>
        !INTERESTS.includes(c.interest) ||
        !CHILD_CLUBS.some((x) => x.id === c.club) ||
        !["state", "private"].includes(c.schoolType) ||
        !n(c.confidence, 0, 100) ||
        !n(c.independence, 0, 100) ||
        ![
          "undecided",
          "university",
          "creative work",
          "apprenticeship",
          "graduate career",
        ].includes(c.future) ||
        typeof c.support !== "boolean" ||
        !n(c.lastSupportWeek, 0, s.week),
    ) ||
    f.issues.some(
      (i) =>
        typeof i.id !== "string" ||
        !f.children.some((c) => c.id === i.childId) ||
        typeof i.title !== "string" ||
        !n(i.week, 0, s.week) ||
        !n(i.expiresWeek) ||
        !["open", "resolved", "missed"].includes(i.status),
    )
  )
    fail();
  if (
    s.calendar.entries.some(
      (e) =>
        e.kind === "date" &&
        (!c.profiles[e.personId] ||
          !DATE_PLANS.some((d) => d.id === e.plan) ||
          !["attentive", "shared", "ambitions"].includes(e.approach)),
    )
  )
    fail();
}
