import {
  act,
  age,
  year,
  clamp,
  hash,
  roll,
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
export const SUBJECTS = {
  maths: "Mathematics",
  language: "Language & literature",
  science: "Science",
  arts: "Arts",
  physical: "Physical education",
};
export const SCHOOL_TYPES = {
  neighbourhood: {
    name: "Neighbourhood school",
    fee: 0,
    quality: 58,
    places: 120,
    entry: 0,
  },
  comprehensive: {
    name: "District comprehensive",
    fee: 0,
    quality: 68,
    places: 75,
    entry: 45,
  },
  selective: {
    name: "Selective academic school",
    fee: 0,
    quality: 84,
    places: 20,
    entry: 75,
  },
  independent: {
    name: "Independent school",
    fee: 90,
    quality: 82,
    places: 32,
    entry: 55,
  },
};
export const SUBJECT_ROUTES = {
  engineering: {
    name: "Engineering entrance record",
    subjects: ["maths", "science"],
    grade: 70,
  },
  medicine: {
    name: "Medical entrance record",
    subjects: ["science", "maths", "language"],
    grade: 80,
  },
  law: {
    name: "Law entrance record",
    subjects: ["language", "arts"],
    grade: 70,
  },
  creative: {
    name: "Creative portfolio route",
    subjects: ["arts", "language"],
    grade: 60,
  },
};
export function initializeEducation(s) {
  return {
    active: false,
    school: "neighbourhood",
    applied: null,
    lastWeek: s.week,
    subjects: Object.fromEntries(
      Object.keys(SUBJECTS).map((k) => [
        k,
        {
          grade: s.school.grade,
          aptitude: 35 + (hash(`${s.seed}:${k}`) % 51),
          discovered: false,
          preparation: 0,
        },
      ]),
    ),
    teachers: Object.fromEntries(
      Object.keys(SUBJECTS).map((k, i) => [
        k,
        {
          name: ["Ms Patel", "Mr Jensen", "Dr Chen", "Ms Rossi", "Coach Evans"][
            i
          ],
          quality: 45 + (hash(`${s.seed}:teacher:${k}`) % 46),
          relationship: 50,
        },
      ]),
    ),
    parents: Object.fromEntries(
      s.relationships
        .filter((r) => r.role === "Parent")
        .map((r) => [
          r.id,
          {
            style: ["supportive", "strict", "competitive", "distant"][
              hash(r.id + s.seed) % 4
            ],
            availability: 65,
            lastPay: s.connections.profiles[r.id]?.weeklyPay || 0,
          },
        ]),
    ),
    support: { assessed: false, need: "unknown", plan: "none", progress: 0 },
    bullying: null,
    disruption: null,
    certificates: [],
    exams: [],
    actions: {},
    paid: 0,
  };
}
const schoolAge = (s) => {
  if (age(s) < 5 || age(s) >= 18 || !s.school.enrolled)
    throw new Error(
      "Detailed school activities require an enrolled student aged five to seventeen.",
    );
};
export function exploreAptitude(state, subject) {
  if (!Object.hasOwn(SUBJECTS, subject)) throw new Error("Choose a subject.");
  const s = act(state, {
      minAge: 3,
      hours: 1,
      label: "Explore a childhood aptitude",
    }),
    e = s.simulation.education;
  once(s, e.actions, `explore:${subject}`, 4);
  e.subjects[subject].discovered = true;
  s.childhood.development.curiosity = clamp(
    s.childhood.development.curiosity + 0.5,
  );
  note(
    s,
    `Explored ${SUBJECTS[subject]}; an aptitude assessment is now available.`,
  );
  return s;
}
export function studySubject(state, subject) {
  if (age(state) < 18) schoolAge(state);
  if (!Object.hasOwn(SUBJECTS, subject)) throw new Error("Choose a subject.");
  const s = act(state, {
      minAge: 5,
      cost: age(state) >= 18 ? 20 : 0,
      hours: 3,
      energy: 3,
      label: `Study ${SUBJECTS[subject]}`,
    }),
    e = s.simulation.education,
    p = e.subjects[subject];
  once(s, e.actions, `study:${subject}`);
  e.active = true;
  p.discovered = true;
  const t = e.teachers[subject],
    support = e.support.plan !== "none" ? 0.4 : 0;
  p.grade = clamp(p.grade + 0.4 + p.aptitude / 180 + t.quality / 250 + support);
  p.preparation = clamp(p.preparation + 10);
  t.relationship = clamp(t.relationship + 1);
  note(
    s,
    `${SUBJECTS[subject]} preparation improved; ${t.name} reviewed your work.`,
  );
  return s;
}
export function schoolAdmissions(s, id) {
  const d = SCHOOL_TYPES[id];
  if (!d) throw new Error("Choose a school.");
  const e = s.simulation.education,
    grade = Object.values(e.subjects).reduce((n, p) => n + p.grade, 0) / 5;
  const parents = s.relationships
    .filter(
      (r) => r.role === "Parent" && !s.lifeCourse.relatives[r.id]?.deceasedWeek,
    )
    .map((r) => s.connections.profiles[r.id]);
  const capacity =
    d.places -
    (hash(`${s.city}:${id}:${Math.floor(s.week / 52)}`) % (d.places + 1));
  return {
    grade,
    capacity,
    eligible:
      grade >= d.entry &&
      capacity > 0 &&
      (d.fee === 0 ||
        parents.some((p) => p?.wealth >= d.fee * 13) ||
        availableCash(s) >= d.fee * 13),
  };
}
export function applySchool(state, id) {
  schoolAge(state);
  const d = SCHOOL_TYPES[id],
    quote = schoolAdmissions(state, id);
  if (!d || !quote.eligible || state.simulation.education.applied)
    throw new Error(
      "Meet the admission grade, available places and thirteen-week fee reserve; finish any pending application.",
    );
  const s = act(state, { minAge: 5, hours: 1, label: "School application" });
  s.simulation.education.applied = {
    id,
    city: s.city,
    appliedWeek: s.week,
    decisionWeek: s.week + 2,
  };
  return s;
}
export function talkTeacher(state, subject) {
  schoolAge(state);
  if (!Object.hasOwn(SUBJECTS, subject)) throw new Error("Choose a teacher.");
  const s = act(state, { minAge: 5, hours: 1 }),
    e = s.simulation.education;
  once(s, e.actions, `teacher:${subject}`, 4);
  e.active = true;
  e.teachers[subject].relationship = clamp(
    e.teachers[subject].relationship + 5,
  );
  e.subjects[subject].preparation = clamp(e.subjects[subject].preparation + 5);
  return s;
}
export function assessLearning(state) {
  schoolAge(state);
  const s = act(state, { minAge: 5, hours: 2 }),
    e = s.simulation.education;
  once(s, e.actions, "assessment", 52);
  e.active = true;
  e.support.assessed = true;
  e.support.need = ["none", "reading", "attention", "sensory"][
    hash(`${s.seed}:support`) % 4
  ];
  note(
    s,
    `Learning assessment completed: ${e.support.need === "none" ? "no specific support need identified" : `${e.support.need} accommodations discussed`}. Aptitude is unchanged.`,
  );
  return s;
}
export function setLearningPlan(state, plan) {
  schoolAge(state);
  if (
    !["none", "reading", "attention", "sensory"].includes(plan) ||
    !state.simulation.education.support.assessed
  )
    throw new Error(
      "Arrange an assessment and choose an available support plan.",
    );
  const s = act(state, { minAge: 5, hours: 1 }),
    e = s.simulation.education;
  if (plan !== "none" && e.support.need !== "none" && plan !== e.support.need)
    throw new Error("Choose the accommodation identified in your assessment.");
  e.support.plan = plan;
  return s;
}
export function reportBullying(state, response = "teacher") {
  schoolAge(state);
  if (!["teacher", "parent", "friend"].includes(response))
    throw new Error("Choose who to involve.");
  const s = act(state, { minAge: 5, hours: 1 }),
    e = s.simulation.education;
  if (!e.bullying || e.bullying.status === "resolved")
    throw new Error("There is no open school incident.");
  once(s, e.actions, "bullying-response");
  const b = e.bullying;
  b.reports++;
  b.support = clamp(
    b.support + (response === "teacher" ? 24 : response === "parent" ? 18 : 10),
  );
  if (b.support >= b.severity) {
    b.status = "resolved";
    s.happiness = clamp(s.happiness + 3);
    note(
      s,
      "The school agreed a safety plan; the reported bullying case was resolved.",
    );
  }
  return s;
}
export function sitSubjectExams(state) {
  if (age(state) < 18) schoolAge(state);
  if (age(state) < 12) throw new Error("Subject examinations begin at twelve.");
  const s = act(state, {
      minAge: 12,
      cost: age(state) >= 18 ? 50 : 0,
      hours: 3,
      energy: 5,
    }),
    e = s.simulation.education;
  once(s, e.actions, "exams", 13);
  e.active = true;
  const grades = Object.fromEntries(
    Object.entries(e.subjects).map(([k, p]) => {
      const grade = Math.round(
        clamp(
          p.grade * 0.72 +
            p.preparation * 0.2 +
            e.teachers[k].quality * 0.08 +
            (roll(s) - 0.5) * 10,
        ),
      );
      p.preparation = 0;
      return [k, grade];
    }),
  );
  e.exams.unshift({ week: s.week, year: year(s), grades });
  e.exams = e.exams.slice(0, 24);
  if (age(s) >= 16)
    for (const [id, route] of Object.entries(SUBJECT_ROUTES))
      if (
        !e.certificates.includes(id) &&
        route.subjects.every((k) => grades[k] >= route.grade)
      )
        e.certificates.push(id);
  note(
    s,
    "Subject results recorded. Entrance records support applications; professional qualifications must still be earned.",
  );
  return s;
}
export function discussParenting(state, parentId, topic = "support") {
  const parent = state.relationships.find(
    (r) => r.id === parentId && r.role === "Parent",
  );
  if (
    !parent ||
    age(state) >= 18 ||
    state.lifeCourse.relatives[parentId]?.deceasedWeek != null
  )
    throw new Error("Talk with a living parent while growing up.");
  if (!["support", "independence", "pressure"].includes(topic))
    throw new Error("Choose a conversation.");
  const s = act(state, { minAge: 6, hours: 1 }),
    e = s.simulation.education;
  once(s, e.actions, `parent:${parentId}`, 4);
  const p =
    e.parents[parentId] ||
    (e.parents[parentId] = {
      style: "supportive",
      availability: 60,
      lastPay: 0,
    });
  const success =
    roll(s) <
    (p.style === "distant"
      ? 0.4
      : p.style === "strict" && topic === "independence"
        ? 0.5
        : 0.8);
  if (success) {
    p.availability = clamp(p.availability + 8);
    s.characterLife.personality.confidence = clamp(
      s.characterLife.personality.confidence + 1,
    );
    s.relationships.find((r) => r.id === parentId).bond = clamp(
      parent.bond + 2,
    );
  }
  note(
    s,
    `${parent.name} ${success ? "agreed to a practical change after your conversation" : "needs more time to consider your request"}.`,
  );
  return s;
}
export function advanceEducation(s) {
  const e = s.simulation.education;
  if (e.lastWeek === s.week) return;
  e.lastWeek = s.week;
  for (const r of s.relationships.filter((r) => r.role === "Parent")) {
    const p = s.connections.profiles[r.id];
    if (!p) continue;
    const record =
      e.parents[r.id] ||
      (e.parents[r.id] = {
        style: "supportive",
        availability: 60,
        lastPay: p.weeklyPay,
      });
    if (record.lastPay > 0 && p.weeklyPay === 0 && age(s) < 18) {
      e.disruption = {
        kind: "household-income",
        until: s.week + 8,
        severity: 20,
      };
      note(s, "A parent's loss of wages has disrupted the household routine.");
    }
    record.lastPay = p.weeklyPay;
  }
  if (e.applied && s.week >= e.applied.decisionWeek) {
    const q = schoolAdmissions(s, e.applied.id);
    if (
      age(s) < 18 &&
      s.school.enrolled &&
      s.city === e.applied.city &&
      q.eligible
    ) {
      e.school = e.applied.id;
      e.active = true;
      note(s, `${SCHOOL_TYPES[e.school].name} accepted your application.`);
    } else
      note(
        s,
        "The school application closed without an available, eligible place.",
        "warning",
      );
    e.applied = null;
  }
  if (!e.active || age(s) >= 18 || age(s) < 5) return;
  const fee = SCHOOL_TYPES[e.school].fee;
  if (fee) {
    const parent = Object.keys(e.parents)
      .map((id) => s.connections.profiles[id])
      .find((p) => p && p.wealth >= fee);
    if (parent) {
      parent.wealth -= fee;
      e.paid += fee;
    } else if (availableCash(s) >= fee) {
      s.money -= fee;
      e.paid += fee;
    } else {
      e.school = "neighbourhood";
      note(
        s,
        "School fees could not be funded; you returned to the neighbourhood school.",
        "warning",
      );
    }
  }
  if (e.disruption && e.disruption.until < s.week) e.disruption = null;
  for (const [key, p] of Object.entries(e.subjects)) {
    const quality =
      (e.teachers[key].quality + SCHOOL_TYPES[e.school].quality) / 2;
    p.grade = clamp(
      p.grade +
        (quality - 60) / 800 +
        (e.support.plan !== "none" ? 0.025 : 0) -
        (e.disruption ? 0.08 : 0),
    );
  }
  if (s.week % 13 === 0) {
    s.school.grade = Math.round(
      Object.values(e.subjects).reduce((n, p) => n + p.grade, 0) / 5,
    );
    if ((!e.bullying || e.bullying.status === "resolved") && roll(s) < 0.18) {
      const peer = s.lifeCourse.school.peers[hash(`${s.seed}:${s.week}`) % 3];
      e.bullying = {
        peer: peer.id,
        name: peer.name,
        since: s.week,
        severity: 35 + Math.floor(roll(s) * 35),
        support: 0,
        reports: 0,
        status: "open",
      };
      note(
        s,
        "Repeated school incidents need a trusted adult's attention.",
        "warning",
      );
    } else if (e.bullying?.status === "open") {
      s.happiness = clamp(s.happiness - 2);
      e.bullying.severity = clamp(e.bullying.severity + 2);
    }
  }
}
export function validateEducation(s) {
  const e = obj(s.simulation.education);
  bool(e.active);
  one(e.school, Object.keys(SCHOOL_TYPES));
  num(e.lastWeek, 0, s.week, true);
  num(e.paid);
  obj(e.subjects);
  obj(e.teachers);
  for (const key of Object.keys(SUBJECTS)) {
    const p = obj(e.subjects[key]),
      t = obj(e.teachers[key]);
    num(p.grade, 0, 100);
    num(p.aptitude, 0, 100);
    bool(p.discovered);
    num(p.preparation, 0, 100);
    str(t.name, 60);
    num(t.quality, 0, 100);
    num(t.relationship, 0, 100);
  }
  if (Object.keys(obj(e.parents)).length > 20)
    throw new Error("Invalid school family data.");
  for (const [id, p] of Object.entries(e.parents)) {
    str(id, 100);
    obj(p);
    one(p.style, ["supportive", "strict", "competitive", "distant"]);
    num(p.availability, 0, 100);
    num(p.lastPay);
  }
  const p = obj(e.support);
  bool(p.assessed);
  one(p.need, ["unknown", "none", "reading", "attention", "sensory"]);
  one(p.plan, ["none", "reading", "attention", "sensory"]);
  num(p.progress, 0, 100);
  if (e.applied) {
    obj(e.applied);
    one(e.applied.id, Object.keys(SCHOOL_TYPES));
    str(e.applied.city, 100);
    num(e.applied.appliedWeek, 0, s.week, true);
    num(e.applied.decisionWeek, e.applied.appliedWeek, s.week + 2, true);
  }
  if (e.disruption) {
    obj(e.disruption);
    one(e.disruption.kind, ["household-income", "move", "illness"]);
    num(e.disruption.until, 0, s.week + 52, true);
    num(e.disruption.severity, 0, 100);
  }
  if (e.bullying) {
    const b = obj(e.bullying);
    str(b.peer, 100);
    str(b.name, 100);
    num(b.since, 0, s.week, true);
    num(b.severity, 0, 100);
    num(b.support, 0, 100);
    num(b.reports, 0, 10000, true);
    one(b.status, ["open", "resolved"]);
  }
  arr(e.certificates, 4).forEach((id) => one(id, Object.keys(SUBJECT_ROUTES)));
  for (const x of arr(e.exams, 24)) {
    obj(x);
    num(x.week, 0, s.week, true);
    num(x.year, 1900, 2300, true);
    for (const key of Object.keys(SUBJECTS)) num(obj(x.grades)[key], 0, 100);
  }
  stamps(e.actions, s.week);
}
