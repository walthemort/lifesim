import { availableCash } from "./world.js";
import { spendTime } from "./calendar.js";
import { ensurePeople } from "./connections.js";
import { receiveIncome } from "./banking.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n));
const log = (s, text) => {
  s.log.unshift({ week: s.week, text, kind: "milestone" });
  s.log = s.log.slice(0, 40);
};
export const FAMILY_BACKGROUNDS = {
  modest: { name: "Modest household", wealth: 1500, pay: [400, 400] },
  comfortable: {
    name: "Comfortable household",
    wealth: 10000,
    pay: [950, 850],
  },
  wealthy: { name: "Wealthy household", wealth: 75000, pay: [2600, 2200] },
};
export const SCHOOL_CLUBS = [
  {
    id: "debate",
    name: "Debate society",
    minAge: 10,
    cost: 0,
    hours: 2,
    skill: "charisma",
  },
  {
    id: "science",
    name: "Science club",
    minAge: 8,
    cost: 5,
    hours: 3,
    skill: "technical",
  },
  {
    id: "arts",
    name: "School arts club",
    minAge: 8,
    cost: 5,
    hours: 3,
    skill: "knowledge",
  },
  {
    id: "volunteer",
    name: "Student volunteering",
    minAge: 12,
    cost: 0,
    hours: 3,
    skill: "empathy",
  },
];
export const TEEN_JOBS = [
  {
    id: "shop",
    name: "Weekend shop assistant",
    hours: 8,
    pay: 72,
    track: "office",
    skill: "business",
  },
  {
    id: "cafe",
    name: "Café weekend helper",
    hours: 12,
    pay: 108,
    track: "hospitality",
    skill: "charisma",
  },
  {
    id: "tutor",
    name: "Peer tutor",
    hours: 6,
    pay: 84,
    grade: 80,
    track: "teaching",
    skill: "knowledge",
  },
];
const sports = ["football", "racing", "basketball", "tennis"];
export const relativeAlive = (s, id) =>
  s.lifeCourse?.relatives[id]?.deceasedWeek == null;
export function initializeLifeCourse(
  s,
  { legacy = false, background = "comfortable" } = {},
) {
  s.lifeCourse = {
    background: legacy ? "existing" : background,
    siblingBorn: legacy || age(s) >= 12,
    relatives: {},
    school: {
      focus: "balanced",
      club: null,
      clubWeeks: 0,
      preparation: 0,
      exams: [],
      peers: [
        { id: "ava", name: "Ava Morgan", friendship: 35, rivalry: 15 },
        { id: "leo", name: "Leo Chen", friendship: 30, rivalry: 35 },
        { id: "maya", name: "Maya Patel", friendship: 40, rivalry: 10 },
      ],
      actions: {},
      partTime: null,
      totalWages: 0,
      workHours: { office: 0, hospitality: 0, teaching: 0 },
      lastWages: 0,
      scholarship: { status: "none", remaining: 0, used: 0 },
      route: "undecided",
    },
    body: {
      lastAge: age(s),
      fitness: clamp(60 - Math.max(0, age(s) - 35) * 0.6),
      mobility: clamp(100 - Math.max(0, age(s) - 45) * 0.8),
      scars: Object.fromEntries(sports.map((id) => [id, 0])),
      actions: {},
    },
    memories: [],
    trustFund: 0,
  };
  for (const [i, r] of s.relationships
    .filter((r) => ["Parent", "Sibling"].includes(r.role))
    .entries()) {
    const p = s.connections.profiles[r.id];
    if (!legacy && r.role === "Parent") {
      const b = FAMILY_BACKGROUNDS[background];
      p.wealth = b.wealth;
      p.weeklyPay = b.pay[i % 2];
    }
    s.lifeCourse.relatives[r.id] = {
      health: 85,
      retired: false,
      deceasedWeek: null,
      deathAge: 80 + i * 5,
      path:
        r.role === "Parent" || age(s) + p.ageOffset >= 18
          ? "working"
          : "school",
      lastAge: age(s) + p.ageOffset,
    };
  }
}
const remember = (s, text) => {
  s.lifeCourse.memories.unshift({ week: s.week, text });
  s.lifeCourse.memories = s.lifeCourse.memories.slice(0, 40);
  log(s, text);
};
function siblingBirth(s) {
  const c = s.lifeCourse;
  if (age(s) >= 12) {
    c.siblingBorn = true;
    return;
  }
  if (
    c.siblingBorn ||
    age(s) < 3 ||
    !s.relationships.some((r) => r.role === "Parent" && relativeAlive(s, r.id))
  )
    return;
  c.siblingBorn = true;
  if (s.relationships.length >= 8) return;
  const name = `Jamie ${s.name.split(" ").at(-1)}`,
    id = "sibling:jamie";
  s.relationships.push({
    id,
    name,
    role: "Sibling",
    bond: 75,
    icon: "JM",
    color: "blue",
  });
  ensurePeople(s);
  Object.assign(s.connections.profiles[id], {
    ageOffset: -age(s),
    job: "Child",
    wealth: 0,
    weeklyPay: 0,
    plans: "Growing up in your family",
  });
  c.relatives[id] = {
    health: 90,
    retired: false,
    deceasedWeek: null,
    deathAge: 88,
    path: "school",
    lastAge: 0,
  };
  remember(s, `Your younger sibling, ${name}, was born.`);
}
export function prepareLifeCourse(s) {
  const c = s.lifeCourse,
    a = age(s);
  siblingBirth(s);
  for (const r of s.relationships.filter((r) => c.relatives[r.id])) {
    const p = s.connections.profiles[r.id],
      person = c.relatives[r.id],
      years = a + p.ageOffset;
    if (person.deceasedWeek !== null) continue;
    if (years !== person.lastAge) {
      person.lastAge = years;
      if (r.role === "Sibling" && years >= 5 && person.path === "school") {
        p.job = "Student";
        p.plans = "School and friendships";
      }
      if (years >= 60) person.health = clamp(person.health - 1.5);
      if (r.role === "Sibling" && years >= 18 && person.path === "school") {
        person.path = "university";
        p.job = "University student";
        p.weeklyPay = 100;
        p.plans = "Studying engineering";
        remember(
          s,
          `${r.name} chose university and is building their own life.`,
        );
      }
      if (r.role === "Sibling" && years >= 22 && person.path === "university") {
        person.path = "working";
        p.job = "Engineer";
        p.weeklyPay = 850;
        p.plans = "Starting a career after university";
        remember(s, `${r.name} graduated and started work as an engineer.`);
      }
      if (r.role === "Sibling" && years === 25 && person.path === "working") {
        p.weeklyPay = Math.round(p.weeklyPay * 1.25);
        p.job = "Senior engineer";
        p.city = "Elsewhere";
        p.plans = "Moved for a career opportunity";
        remember(s, `${r.name} moved away for a promotion.`);
      }
      if (years >= 67 && !person.retired) {
        person.retired = true;
        person.path = "retired";
        p.weeklyPay = Math.round(p.weeklyPay * 0.55);
        p.job = "Retired";
        p.plans = "Retirement and family";
        remember(
          s,
          `${r.name} retired. Pension income is $${p.weeklyPay}/week.`,
        );
      }
    }
    if (
      years >= person.deathAge &&
      (person.health < 65 || years >= person.deathAge + 8)
    ) {
      person.deceasedWeek = s.week;
      p.weeklyPay = 0;
      p.job = "Deceased";
      p.plans = "Remembered by your family";
      let estate = p.wealth;
      p.wealth = 0;
      if (r.role === "Parent") {
        const partner = s.relationships.find(
          (x) => x.role === "Parent" && x.id !== r.id && relativeAlive(s, x.id),
        );
        if (partner) {
          s.connections.profiles[partner.id].wealth += estate * 0.5;
          estate *= 0.5;
        }
        const siblings = s.relationships.filter(
          (x) => x.role === "Sibling" && relativeAlive(s, x.id),
        );
        const share = Math.floor((estate / (siblings.length + 1)) * 100) / 100;
        for (const sibling of siblings)
          s.connections.profiles[sibling.id].wealth += share;
        if (a >= 18) receiveIncome(s, share, "exempt");
        else c.trustFund += share;
      }
      s.happiness = clamp(s.happiness - 8);
      remember(
        s,
        `${r.name} died at age ${years}. ${r.role === "Parent" ? "Their savings were divided between their surviving family." : "Their life remains part of your family memories."}`,
      );
    }
  }
  if (a >= 18 && c.trustFund) {
    receiveIncome(s, c.trustFund, "exempt");
    remember(s, "Your childhood inheritance trust was released at eighteen.");
    c.trustFund = 0;
  }
  if (a !== c.body.lastAge) {
    c.body.lastAge = a;
    if (a > 35) c.body.fitness = clamp(c.body.fitness - 0.6);
    if (a > 45) c.body.mobility = clamp(c.body.mobility - 0.8);
    if (a > 60) s.health = clamp(s.health - 0.5);
  }
  if (a >= 18 && c.school.partTime) {
    c.school.partTime = null;
    remember(
      s,
      "Your school-age part-time arrangement ended. Adult vacancies require a separate application.",
    );
  }
}
export function consumeScholarship(s, saved) {
  const grant = s.lifeCourse?.school.scholarship;
  if (grant?.status === "awarded" && saved > 0) {
    grant.remaining--;
    grant.used += saved;
    if (!grant.remaining) grant.status = "exhausted";
  }
}
export const schoolScholarshipRate = (s) =>
  s.lifeCourse?.school.scholarship.status === "awarded" ? 0.5 : 0;
export const lifeCourseCosts = (s) =>
  s.school.enrolled && age(s) >= 12
    ? SCHOOL_CLUBS.find((c) => c.id === s.lifeCourse?.school.club)?.cost || 0
    : 0;
export const lifeCourseHours = (s) =>
  s.school.enrolled
    ? (SCHOOL_CLUBS.find((c) => c.id === s.lifeCourse?.school.club)?.hours ||
        0) + (s.lifeCourse?.school.focus === "academic" ? 3 : 0)
    : 0;
export const teenWorkHours = (s) =>
  s.school.enrolled
    ? TEEN_JOBS.find((j) => j.id === s.lifeCourse?.school.partTime)?.hours || 0
    : 0;
export function teenWages(s) {
  const c = s.lifeCourse.school,
    j = TEEN_JOBS.find((j) => j.id === c.partTime);
  c.lastWages = 0;
  if (
    j &&
    age(s) >= 16 &&
    age(s) < 18 &&
    s.school.enrolled &&
    !s.employment &&
    s.energy >= 20
  ) {
    c.lastWages = j.pay;
    c.totalWages += j.pay;
    c.workHours[j.track] += j.hours;
    s.skills[j.skill] = clamp(s.skills[j.skill] + 0.05);
    receiveIncome(s, j.pay, "earned");
    s.energy = clamp(s.energy - 3);
  }
}
export function advanceSchoolLife(s) {
  const c = s.lifeCourse.school;
  if (!s.school.enrolled || age(s) >= 18) return;
  const club = SCHOOL_CLUBS.find((x) => x.id === c.club);
  if (club) {
    c.clubWeeks++;
    s.skills[club.skill] = clamp(s.skills[club.skill] + 0.06);
    if (age(s) < 12) {
      const p = s.relationships.find(
        (r) => r.role === "Parent" && relativeAlive(s, r.id),
      );
      if (p)
        s.connections.profiles[p.id].wealth = Math.max(
          0,
          s.connections.profiles[p.id].wealth - club.cost,
        );
    }
  }
  if (c.focus === "academic") {
    s.skills.knowledge = clamp(s.skills.knowledge + 0.05);
    s.school.grade = clamp(s.school.grade + 0.03);
  }
  if (c.focus === "creative")
    s.music.skills.lyrics = clamp(s.music.skills.lyrics + 0.03);
  if (c.focus === "sport")
    s.skills.athletics = clamp(s.skills.athletics + 0.03);
  if (age(s) >= 12 && s.week % 52 === 48) {
    const score = Math.round(
      clamp(
        s.school.grade * 0.75 + s.skills.knowledge * 0.25 + c.preparation * 0.3,
      ),
    );
    c.exams.push({ week: s.week, age: age(s), score });
    c.exams = c.exams.slice(-6);
    c.preparation = 0;
    s.school.grade = clamp(s.school.grade * 0.85 + score * 0.15);
    remember(
      s,
      `School exams at age ${age(s)}: ${score}/100. Preparation and learning affected your results.`,
    );
  }
}
export const relevantWorkWeeks = (s, track) =>
  (s.progress[track]?.weeks || 0) +
  Math.floor((s.lifeCourse?.school.workHours[track] || 0) / 40);
function action(state, id, hours, minAge = 5) {
  if (state.ended || state.event || !state.actions || age(state) < minAge)
    throw new Error(
      "Make time and resolve your life choice before this activity.",
    );
  if (state.lifeCourse.school.actions[id] === state.week)
    throw new Error("You already did this activity this week.");
  const s = structuredClone(state);
  spendTime(s, hours, "School or family activity");
  s.actions--;
  s.lifeCourse.school.actions[id] = s.week;
  return s;
}
export function schoolAction(state, id, target = null) {
  if (!state.school.enrolled || age(state) >= 18)
    throw new Error("These choices are for enrolled school students.");
  if (id === "focus") {
    if (!["balanced", "academic", "creative", "sport"].includes(target))
      throw new Error("Choose a school focus.");
    const s = structuredClone(state);
    s.lifeCourse.school.focus = target;
    return s;
  }
  if (id === "club") {
    const club = SCHOOL_CLUBS.find((c) => c.id === target);
    if (target !== "none" && (!club || age(state) < club.minAge))
      throw new Error("Choose a club available at your age.");
    const s = action(state, "club", 1);
    s.lifeCourse.school.club = target === "none" ? null : target;
    s.lifeCourse.school.clubWeeks = 0;
    log(
      s,
      club
        ? `Joined ${club.name}. ${club.hours} hours and $${club.cost} per week.`
        : "Left your school club.",
    );
    return s;
  }
  if (id === "part-time") {
    const job = TEEN_JOBS.find((j) => j.id === target);
    if (
      age(state) < 16 ||
      state.employment ||
      (target !== "none" &&
        (!job || (job.grade && state.school.grade < job.grade)))
    )
      throw new Error(
        "Part-time school jobs require age sixteen and any stated grades, without another employment contract.",
      );
    const s = action(state, "part-time", 1, 16);
    s.lifeCourse.school.partTime = target === "none" ? null : target;
    log(
      s,
      job
        ? `Accepted a ${job.hours}-hour school-age job: ${job.name}. Pay is $${job.pay}/week when you can work.`
        : "Left your school-age job.",
    );
    return s;
  }
  if (id === "prepare") {
    const s = action(state, id, 3, 12);
    s.lifeCourse.school.preparation = Math.min(
      50,
      s.lifeCourse.school.preparation + 10,
    );
    s.skills.knowledge = clamp(s.skills.knowledge + 0.5);
    s.energy = clamp(s.energy - 3);
    return s;
  }
  if (["befriend", "compete"].includes(id)) {
    if (!state.lifeCourse.school.peers.some((p) => p.id === target))
      throw new Error("Choose a classmate.");
    const s = action(state, `${id}:${target}`, 2),
      peer = s.lifeCourse.school.peers.find((p) => p.id === target);
    if (id === "befriend") {
      peer.friendship = clamp(peer.friendship + 10);
      peer.rivalry = clamp(peer.rivalry - 5);
      s.skills.empathy = clamp(s.skills.empathy + 0.5);
      const friend = s.relationships.find((r) => r.id === `school:${target}`);
      if (friend) {
        friend.bond = peer.friendship;
        s.connections.profiles[friend.id].trust = clamp(
          s.connections.profiles[friend.id].trust + 2,
        );
      }
      if (
        peer.friendship >= 65 &&
        !s.relationships.some((r) => r.id === `school:${target}`) &&
        s.relationships.length < 8
      ) {
        s.relationships.push({
          id: `school:${target}`,
          name: peer.name,
          role: "Friend",
          bond: peer.friendship,
          icon: peer.name
            .split(" ")
            .map((n) => n[0])
            .join(""),
          color: "blue",
        });
        ensurePeople(s);
        remember(s, `${peer.name} became a friend beyond the classroom.`);
      }
    } else {
      peer.rivalry = clamp(peer.rivalry + 10);
      s.skills.knowledge = clamp(s.skills.knowledge + 0.5);
      if (peer.rivalry >= 65) s.happiness = clamp(s.happiness - 2);
    }
    return s;
  }
  throw new Error("Choose an available school activity.");
}
export function applyScholarship(state) {
  const c = state.lifeCourse.school;
  if (
    age(state) < 18 ||
    age(state) > 25 ||
    !state.education.completed.includes("school") ||
    c.scholarship.status !== "none" ||
    c.exams.length < 2 ||
    !c.exams.some((e) => e.age === 17) ||
    c.exams.reduce((n, e) => n + e.score, 0) / c.exams.length < 85
  )
    throw new Error(
      "Merit support needs age eighteen to twenty-five, school graduation and an average of 85 across at least two exams, including your final year.",
    );
  const s = action(state, "scholarship", 2, 18);
  s.lifeCourse.school.scholarship = {
    status: "awarded",
    remaining: 156,
    used: 0,
  };
  remember(
    s,
    "Awarded a merit scholarship: half-price tuition for 156 enrolled weeks, without free qualifications.",
  );
  return s;
}
export function familySupport(state, id, kind) {
  const relative = state.lifeCourse.relatives[id];
  if (
    !relative ||
    relative.deceasedWeek !== null ||
    !["visit", "money", "care"].includes(kind)
  )
    throw new Error("Choose a living relative and a family activity.");
  const cost = kind === "money" ? 100 : kind === "care" ? 50 : 0;
  if (age(state) < (kind === "visit" ? 5 : 18) || availableCash(state) < cost)
    throw new Error(
      "Adult support requires age eighteen and enough available cash.",
    );
  const s = action(
      state,
      `family:${id}:${kind}`,
      kind === "care" ? 4 : 2,
      kind === "visit" ? 5 : 18,
    ),
    r = s.relationships.find((r) => r.id === id),
    p = s.connections.profiles[id];
  s.money -= cost;
  r.bond = clamp(r.bond + 3);
  p.trust = clamp(p.trust + 2);
  if (kind === "money") p.wealth += 100;
  if (kind === "care")
    s.lifeCourse.relatives[id].health = clamp(relative.health + 2);
  log(s, `Spent time supporting ${r.name}${cost ? ` and paid $${cost}` : ""}.`);
  return s;
}
export function requestFamilyFunding(state) {
  const last = state.lifeCourse.school.actions["family-funding"];
  if (
    age(state) < 16 ||
    age(state) > 25 ||
    (!state.school.enrolled && !state.education.active) ||
    (last !== undefined && state.week < last + 13)
  )
    throw new Error(
      "Education support is available to students aged sixteen to twenty-five, once every thirteen weeks.",
    );
  const parents = state.relationships.filter(
    (r) =>
      r.role === "Parent" &&
      relativeAlive(state, r.id) &&
      r.bond >= 65 &&
      state.connections.profiles[r.id].trust >= 60,
  );
  const funds = parents.reduce(
      (n, r) => n + state.connections.profiles[r.id].wealth,
      0,
    ),
    cap = { modest: 100, comfortable: 500, wealthy: 2000, existing: 500 }[
      state.lifeCourse.background
    ];
  const amount = Math.floor(Math.min(cap, funds * 0.02) * 100) / 100;
  if (amount < 10)
    throw new Error(
      "Your family cannot afford education support, or your relationship needs rebuilding.",
    );
  const s = action(state, "family-funding", 2, 16);
  let remaining = amount;
  for (const r of parents) {
    const p = s.connections.profiles[r.id],
      paid = Math.min(p.wealth, remaining);
    p.wealth -= paid;
    remaining -= paid;
  }
  receiveIncome(s, amount, "exempt");
  remember(
    s,
    `Your family contributed $${amount} from their savings towards your education.`,
  );
  return s;
}
export const LIFE_COURSE_EVENTS = [
  {
    id: "school-rivalry",
    tag: "SCHOOL & FRIENDSHIP",
    title: "Competition is getting personal.",
    text: "A classroom rivalry is beginning to affect the atmosphere at school.",
    options: [
      {
        label: "Talk it through with a teacher",
        detail: "Rivalry −15 · confidence +1",
        course: { rivalry: -15, confidence: 1 },
      },
      {
        label: "Include them in a shared project",
        detail: "Rivalry −10 · friendship +10",
        course: { rivalry: -10, friendship: 10 },
      },
      {
        label: "Keep competing",
        detail: "Knowledge +1 · rivalry +5",
        course: { knowledge: 1, rivalry: 5 },
      },
    ],
  },
  {
    id: "school-showcase",
    tag: "EXTRACURRICULAR LIFE",
    title: "Your club has a showcase.",
    text: "A school event gives you a chance to contribute outside lessons.",
    options: [
      {
        label: "Help organise the event",
        detail: "Charisma +1 · school results +1",
        course: { charisma: 1, grade: 1 },
      },
      {
        label: "Work with a classmate",
        detail: "Friendship +8 · empathy +1",
        course: { friendship: 8, empathy: 1 },
      },
      {
        label: "Watch and learn",
        detail: "Knowledge +1",
        course: { knowledge: 1 },
      },
    ],
  },
  {
    id: "exam-pressure",
    tag: "EXAMS AHEAD",
    title: "Exams are getting closer.",
    text: "Revision, friends and hobbies compete for your time as the school year approaches its final assessments.",
    options: [
      {
        label: "Set a revision plan",
        detail: "Exam preparation +5 · energy −2",
        energy: -2,
        course: { preparation: 5 },
      },
      {
        label: "Ask classmates to study together",
        detail: "Exam preparation +3 · friendship +5",
        course: { preparation: 3, friendship: 5 },
      },
      {
        label: "Keep your usual routine",
        detail: "Happiness +1",
        happiness: 1,
      },
    ],
  },
  {
    id: "parent-needs-care",
    tag: "YOUR GROWING FAMILY",
    title: "A parent needs more support.",
    text: "An older relative is finding everyday life harder. You consider how to help.",
    options: [
      {
        label: "Pay for a medical appointment",
        detail: "$50 · relative health +2 · connection +3",
        cost: 50,
        course: { relativeHealth: 2, relativeBond: 3 },
      },
      {
        label: "Spend time listening",
        detail: "Connection +3 · empathy +1",
        course: { relativeBond: 3, empathy: 1 },
      },
      {
        label: "Stay in touch by phone",
        detail: "Connection +1",
        course: { relativeBond: 1 },
      },
    ],
  },
  {
    id: "athlete-next-chapter",
    tag: "A CAREER AFTER PLAYING",
    title: "There is a life beyond competition.",
    text: "Your body is changing. Coaching, further education or a creative career could become your next chapter.",
    options: [
      {
        label: "Research coaching qualifications",
        detail: "Knowledge +1 · plan for retraining; no qualification awarded",
        course: { knowledge: 1, route: "work" },
      },
      {
        label: "Explore sharing your experience online",
        detail: "Content skill +1 · plan a creative route",
        course: { content: 1, route: "creative" },
      },
      { label: "Focus on recovery for now", detail: "Energy +2", energy: 2 },
    ],
  },
];
export function eligibleLifeCourseEvents(s) {
  return LIFE_COURSE_EVENTS.filter((e) =>
    e.id === "school-rivalry"
      ? s.school.enrolled &&
        s.lifeCourse.school.peers.some((p) => p.rivalry >= 65)
      : e.id === "school-showcase"
        ? s.school.enrolled && s.lifeCourse.school.clubWeeks >= 13
        : e.id === "exam-pressure"
          ? s.school.enrolled &&
            age(s) >= 12 &&
            s.week % 52 >= 37 &&
            s.week % 52 < 48
          : e.id === "parent-needs-care"
            ? age(s) >= 18 &&
              s.relationships.some(
                (r) =>
                  r.role === "Parent" &&
                  relativeAlive(s, r.id) &&
                  s.lifeCourse.relatives[r.id]?.health <= 70,
              )
            : e.id === "athlete-next-chapter"
              ? age(s) >= 33 &&
                sports.some(
                  (id) =>
                    !["none", "retired"].includes(
                      (id === "football" ? s.football : s.sports[id]).stage,
                    ),
                )
              : false,
  );
}
export function resolveLifeCourseEffects(s, event, option) {
  if (!LIFE_COURSE_EVENTS.some((e) => e.id === event.id)) return;
  const fx = option.course || {},
    d = s.lifeCourse.school,
    peer = d.peers.slice().sort((a, b) => b.rivalry - a.rivalry)[0];
  for (const key of ["rivalry", "friendship"])
    if (fx[key]) peer[key] = clamp(peer[key] + fx[key]);
  if (fx.preparation)
    d.preparation = Math.min(50, d.preparation + fx.preparation);
  if (fx.grade) s.school.grade = clamp(s.school.grade + fx.grade);
  if (fx.confidence)
    s.childhood.development.confidence = clamp(
      s.childhood.development.confidence + fx.confidence,
    );
  for (const key of ["knowledge", "empathy", "charisma"])
    if (fx[key]) s.skills[key] = clamp(s.skills[key] + fx[key]);
  if (fx.content)
    s.social.contentSkill = clamp(s.social.contentSkill + fx.content);
  if (fx.route) d.route = fx.route;
  const parent = s.relationships
    .filter((r) => r.role === "Parent" && relativeAlive(s, r.id))
    .sort(
      (a, b) =>
        s.lifeCourse.relatives[a.id].health -
        s.lifeCourse.relatives[b.id].health,
    )[0];
  if (parent) {
    if (fx.relativeHealth)
      s.lifeCourse.relatives[parent.id].health = clamp(
        s.lifeCourse.relatives[parent.id].health + fx.relativeHealth,
      );
    if (fx.relativeBond) parent.bond = clamp(parent.bond + fx.relativeBond);
  }
  remember(s, `${event.title} ${option.label}.`);
}
export function bodyAction(state, id) {
  if (!["conditioning", "mobility", "rehabilitation"].includes(id))
    throw new Error("Choose a physical-care activity.");
  const min = id === "conditioning" ? 12 : 18,
    cost = id === "rehabilitation" ? 80 : 0;
  if (age(state) < min || availableCash(state) < cost)
    throw new Error(
      "You need the appropriate age and enough cash for treatment.",
    );
  if (state.lifeCourse.body.actions[id] === state.week)
    throw new Error("You already did this activity this week.");
  const s = action(state, `body:${id}`, 3, min);
  s.money -= cost;
  s.lifeCourse.body.actions[id] = s.week;
  if (id === "conditioning") {
    s.lifeCourse.body.fitness = clamp(s.lifeCourse.body.fitness + 1);
    s.energy = clamp(s.energy - 5);
  }
  if (id === "mobility")
    s.lifeCourse.body.mobility = clamp(s.lifeCourse.body.mobility + 1);
  if (id === "rehabilitation") {
    for (const sport of sports)
      s.lifeCourse.body.scars[sport] = Math.max(
        0,
        s.lifeCourse.body.scars[sport] - 0.5,
      );
    s.energy = clamp(s.energy - 2);
  }
  log(s, `Completed ${id}${cost ? ` for $${cost}` : ""}.`);
  return s;
}
export const athleticDecline = (s, id) =>
  (id === "racing"
    ? Math.max(0, age(s) - 36) * 0.02
    : Math.max(0, age(s) - 30) * 0.04 + Math.max(0, age(s) - 34) * 0.025) +
  (s.lifeCourse?.body.scars[id] || 0) * 0.015;
export const physicalPerformance = (s, id) =>
  ((s.lifeCourse?.body.fitness ?? 60) - 60) * 0.15 -
  Math.max(0, 75 - (s.lifeCourse?.body.mobility ?? 100)) * 0.1 -
  (s.lifeCourse?.body.scars[id] || 0) * 0.3;
export const injuryRisk = (s, id) =>
  1 +
  Math.max(0, age(s) - 30) * 0.04 +
  (s.lifeCourse?.body.scars[id] || 0) * 0.03;
export function recordSportInjury(s, id) {
  const extra = Math.floor(Math.max(0, age(s) - 30) / 8);
  const p = id === "football" ? s.football : s.sports[id];
  p.injuryWeeks += extra;
  s.lifeCourse.body.scars[id] = Math.min(20, s.lifeCourse.body.scars[id] + 1);
  log(
    s,
    `${id} injury added lasting wear. Age can lengthen recovery; rehabilitation can reduce wear.`,
  );
}
export function chooseSchoolRoute(state, route) {
  if (
    age(state) < 16 ||
    !["university", "apprenticeship", "work", "creative", "undecided"].includes(
      route,
    )
  )
    throw new Error("Future route planning starts at sixteen.");
  const s = structuredClone(state);
  s.lifeCourse.school.route = route;
  log(
    s,
    `Planning for ${route}. You still need to qualify and apply for courses or vacancies.`,
  );
  return s;
}
export function validateLifeCourse(s) {
  const c = s.lifeCourse,
    n = (v, min = 0, max = 1e12) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = 1e12) => n(v, min, max) && Number.isInteger(v),
    fail = () => {
      throw new Error("Invalid family, school or ageing data in save.");
    };
  if (
    !c ||
    !["existing", ...Object.keys(FAMILY_BACKGROUNDS)].includes(c.background) ||
    typeof c.siblingBorn !== "boolean" ||
    !c.relatives ||
    typeof c.relatives !== "object" ||
    Array.isArray(c.relatives) ||
    !Array.isArray(c.memories) ||
    c.memories.length > 40 ||
    c.memories.some(
      (m) => !int(m.week, 0, s.week) || typeof m.text !== "string",
    ) ||
    !n(c.trustFund) ||
    s.relationships.some(
      (r) => ["Parent", "Sibling"].includes(r.role) && !c.relatives[r.id],
    )
  )
    fail();
  for (const [id, p] of Object.entries(c.relatives))
    if (
      !s.relationships.some(
        (r) => r.id === id && ["Parent", "Sibling"].includes(r.role),
      ) ||
      !n(p.health, 0, 100) ||
      typeof p.retired !== "boolean" ||
      (p.deceasedWeek !== null && !int(p.deceasedWeek, 0, s.week)) ||
      !int(p.deathAge, 75, 100) ||
      !["working", "school", "university", "retired"].includes(p.path) ||
      !int(
        p.lastAge,
        0,
        Math.max(0, age(s) + (s.connections.profiles[id]?.ageOffset || 0)),
      )
    )
      fail();
  const d = c.school,
    b = c.body;
  if (
    !d ||
    !["balanced", "academic", "creative", "sport"].includes(d.focus) ||
    (d.club !== null && !SCHOOL_CLUBS.some((x) => x.id === d.club)) ||
    !int(d.clubWeeks) ||
    !n(d.preparation, 0, 50) ||
    !Array.isArray(d.exams) ||
    d.exams.length > 6 ||
    new Set(d.exams.map((e) => e.week)).size !== d.exams.length ||
    d.exams.some(
      (e, i) =>
        !int(e.week, 0, s.week) ||
        !int(e.age, 12, 17) ||
        e.age !== s.startAge + Math.floor(e.week / 52) ||
        e.week % 52 !== 48 ||
        (i > 0 && e.week <= d.exams[i - 1].week) ||
        !n(e.score, 0, 100),
    ) ||
    !Array.isArray(d.peers) ||
    d.peers.length !== 3 ||
    new Set(d.peers.map((p) => p.id)).size !== 3 ||
    d.peers.some(
      (p) =>
        !["ava", "leo", "maya"].includes(p.id) ||
        typeof p.name !== "string" ||
        !n(p.friendship, 0, 100) ||
        !n(p.rivalry, 0, 100),
    ) ||
    !d.actions ||
    Array.isArray(d.actions) ||
    typeof d.actions !== "object" ||
    Object.entries(d.actions).some(
      ([id, w]) =>
        !/^(club|part-time|prepare|scholarship|family-funding|befriend:(ava|leo|maya)|compete:(ava|leo|maya)|body:(conditioning|mobility|rehabilitation)|family:[^\s]+:(visit|money|care))$/.test(
          id,
        ) || !int(w, 0, s.week),
    ) ||
    (d.partTime !== null && !TEEN_JOBS.some((j) => j.id === d.partTime)) ||
    !n(d.totalWages) ||
    !d.workHours ||
    ["office", "hospitality", "teaching"].some((id) => !int(d.workHours[id])) ||
    !n(d.lastWages, 0, 108) ||
    d.lastWages > d.totalWages ||
    !d.scholarship ||
    !["none", "awarded", "exhausted"].includes(d.scholarship.status) ||
    !int(d.scholarship.remaining, 0, 156) ||
    !n(d.scholarship.used) ||
    (d.scholarship.status === "none" &&
      (d.scholarship.remaining !== 0 || d.scholarship.used !== 0)) ||
    (d.scholarship.status === "awarded" && d.scholarship.remaining === 0) ||
    (d.scholarship.status === "exhausted" && d.scholarship.remaining !== 0) ||
    !["undecided", "university", "apprenticeship", "work", "creative"].includes(
      d.route,
    )
  )
    fail();
  if (
    !b ||
    !int(b.lastAge, 0, age(s)) ||
    !n(b.fitness, 0, 100) ||
    !n(b.mobility, 0, 100) ||
    sports.some((id) => !n(b.scars?.[id], 0, 20)) ||
    !b.actions ||
    Array.isArray(b.actions) ||
    typeof b.actions !== "object" ||
    Object.entries(b.actions).some(
      ([id, w]) =>
        !["conditioning", "mobility", "rehabilitation"].includes(id) ||
        !int(w, 0, s.week),
    )
  )
    fail();
}
