import { availableCash, rng, PROGRAMS, jobDefinition } from "./world.js";
import { spendTime, allocationRatio } from "./calendar.js";
import { receiveIncome } from "./banking.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n));
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
export const STORY_EVENTS = [
  {
    id: "restructure",
    tag: "WORKING LIFE",
    title: "Your department is closing.",
    text: "Your employer has given eight weeks’ notice. Your current role will end unless you have moved into another position. You have time to search, study or rebuild your budget.",
    options: [
      {
        label: "Ask contacts for an introduction",
        detail:
          "An unusual coordinator vacancy opens. Notice remains in effect; apply and qualify before it closes.",
        story: "notice-network",
      },
      {
        label: "Seek a retraining grant",
        detail:
          "$150 application costs. Half your current course tuition can be covered for thirteen weeks if you allocate eight study hours. Your job still ends in eight weeks.",
        cost: 150,
        story: "notice-study",
      },
      {
        label: "Keep working and prepare",
        detail:
          "Continue earning during eight weeks of notice. Look for another role or prepare for the income gap.",
        story: "notice",
      },
    ],
  },
  {
    id: "partner-career",
    tag: "A SHARED LIFE",
    title: "Your partner wants to study for a new role.",
    text: "A thirteen-week training opportunity could improve their earnings. Supporting it changes who handles the everyday care and chores.",
    options: [
      {
        label: "Take on more at home",
        detail:
          "Four extra weekly care hours for thirteen weeks. Successful training raises their wages by 10%.",
        story: "partner-care",
      },
      {
        label: "Arrange additional help",
        detail:
          "Pay $35 per week for thirteen weeks. They can pursue the training without extra care hours for you.",
        story: "partner-help",
      },
      {
        label: "Talk about postponing it",
        detail:
          "They postpone this opportunity. Disappointment costs some trust; you keep your current commitments.",
        story: "partner-wait",
      },
    ],
  },
  {
    id: "rehabilitation",
    tag: "SPORT & HEALTH",
    title: "A specialist offers a recovery programme.",
    text: "You have an injury, and a physiotherapist can help you return gradually. Recovery takes time and should come before competition.",
    options: [
      {
        label: "Book rehabilitation",
        detail:
          "$150 upfront and two recovery hours weekly for four weeks. Attended sessions shorten the current injury.",
        cost: 150,
        story: "rehab",
      },
      {
        label: "Recover at your normal pace",
        detail:
          "Keep the existing recovery timetable. You remain unavailable for competition until fit.",
        story: "recover",
      },
    ],
  },
  {
    id: "family-care",
    tag: "FAMILY RESPONSIBILITY",
    title: "Your child needs extra support at home.",
    text: "A difficult spell at school has left your child needing consistent attention for six weeks. Decide how to make room for them.",
    options: [
      {
        label: "Make time personally",
        detail:
          "Six additional care hours weekly for six weeks. Shared time builds your connection and their wellbeing.",
        story: "child-care",
      },
      {
        label: "Arrange practical support",
        detail:
          "Pay $30 weekly for six weeks. Support improves wellbeing while preserving your schedule.",
        story: "child-help",
      },
      {
        label: "Try to carry on as usual",
        detail:
          "No extra commitment, but their wellbeing and your connection suffer.",
        story: "child-wait",
      },
    ],
  },
  {
    id: "collaboration",
    tag: "AN UNEXPECTED OPENING",
    title: "Someone wants to commission your work.",
    text: "A local organiser likes what you have been making. There is a $500 commission available, with a four-week deadline and a real deliverable.",
    options: [
      {
        label: "Agree to deliver the commission",
        detail:
          "Finish through Life commitments within four weeks. Delivery needs an action, four hours and $25 materials. $500 gross is paid only on successful completion.",
        story: "commission",
      },
      {
        label: "Decline politely",
        detail:
          "Keep your time for current projects. No fee, penalty or obligation.",
        story: "decline",
      },
    ],
  },
  {
    id: "scholarship",
    tag: "EDUCATION",
    title: "A study grant is available.",
    text: "A local foundation is supporting students who keep up regular study alongside their other responsibilities.",
    options: [
      {
        label: "Accept the study conditions",
        detail:
          "Half your current course tuition is covered for thirteen weeks when you allocate at least eight study hours. It does not award the qualification.",
        story: "grant",
      },
      {
        label: "Keep your current arrangements",
        detail: "Continue paying tuition and studying at your current pace.",
        story: "decline",
      },
    ],
  },
  {
    id: "replacement",
    tag: "A CHANCE TO BE SEEN",
    title: "A development squad has a late vacancy.",
    text: "Someone has pulled out of a football assessment. A coach has noticed your local progress and offers the chance to take their place.",
    options: [
      {
        label: "Ask to attend the assessment",
        detail:
          "A two-week academy or reserve trial invitation opens. Accept it in Sport & development; selection is still uncertain.",
        story: "replacement-trial",
      },
      {
        label: "Keep developing locally",
        detail: "Continue your normal school or local football path.",
        story: "decline",
      },
    ],
  },
  {
    id: "rent-review",
    tag: "HOUSING",
    title: "Your landlord proposes a temporary rent increase.",
    text: "Your landlord cites higher maintenance costs and proposes an additional $35 weekly charge for the next year. You can agree or negotiate a shorter surcharge while keeping your rental.",
    options: [
      {
        label: "Accept the proposed arrangement",
        detail:
          "$35 additional weekly housing costs for fifty-two weeks. Moving to another rental ends this surcharge.",
        story: "rent-year",
      },
      {
        label: "Negotiate a shorter arrangement",
        detail:
          "$75 administrative cost, then $25 additional weekly costs for thirteen weeks. Moving ends the surcharge.",
        cost: 75,
        story: "rent-quarter",
      },
      {
        label: "Keep the home while searching",
        detail:
          "The $35 weekly surcharge applies until you move, for up to fifty-two weeks. Look for another rental in Homes & property.",
        story: "rent-year",
      },
    ],
  },
];
export function initializeStories(s) {
  s.stories = { effects: [], history: [], serial: 0, cooldowns: {} };
}
const live = (s, kind) =>
  s.stories?.effects.filter(
    (e) => e.status === "active" && e.kind === kind && e.until >= s.week,
  ) || [];
export function storyWeeklyHours(s) {
  return (
    live(s, "partner-care").length * 4 +
    live(s, "child-care").length * 6 +
    live(s, "rehab").length * 2
  );
}
export function storyWeeklyCosts(s) {
  return (
    live(s, "partner-help").length * 35 +
    live(s, "child-help").length * 30 +
    live(s, "rent")
      .filter((e) => e.target === s.housing.rental)
      .reduce((n, e) => n + e.weeklyCost, 0)
  );
}
export function storyTuitionSupport(s, programId) {
  return live(s, "grant").some((e) => e.target === programId) &&
    allocationRatio(s, "study", 16) >= 0.5
    ? 0.5
    : 0;
}
export function eligibleStoryEvents(s) {
  const known = (id) =>
    !s.stories.effects.some((e) => e.status === "active" && e.source === id) &&
    (s.stories.cooldowns[id] || 0) <= s.week;
  const eligible = {
    restructure:
      !!s.employment &&
      s.employment.tenure >= 52 &&
      !["football", "racing", "basketball", "tennis"].includes(s.career),
    "partner-career": !!s.family.partnerId && age(s) >= 18,
    rehabilitation:
      s.football.injuryWeeks > 0 ||
      Object.values(s.sports).some((p) => p.injuryWeeks > 0),
    "family-care": s.family.children.some(
      (c) => s.week - c.bornWeek >= 5 * 52 && s.week - c.bornWeek < 18 * 52,
    ),
    collaboration:
      s.music.releases.length > 0 ||
      s.pastimes.projects.some((p) => p.status === "released"),
    scholarship: !!s.education.active,
    replacement:
      ["school", "community"].includes(s.football.stage) &&
      s.football.schoolWeeks + s.football.grassrootsWeeks >= 13 &&
      s.football.ability >= 30 &&
      age(s) <= 25,
    "rent-review": s.housing.rental !== null,
  };
  return STORY_EVENTS.filter((e) => eligible[e.id] && known(e.id));
}
function effect(s, source, kind, weeks, target = null, extra = {}) {
  const e = {
    id: `story:${s.stories.serial++}`,
    source,
    kind,
    target,
    start: s.week,
    until: s.week + weeks,
    status: "active",
    ...extra,
  };
  s.stories.effects.push(e);
  s.stories.effects = s.stories.effects
    .filter((x) => x.status === "active")
    .concat(s.stories.effects.filter((x) => x.status !== "active").slice(-12));
  return e;
}
function history(s, text) {
  s.stories.history.unshift({ week: s.week, text });
  s.stories.history = s.stories.history.slice(0, 30);
  log(s, text);
}
export function resolveStoryEffects(s, event, option) {
  if (!event.id || !STORY_EVENTS.some((e) => e.id === event.id)) return;
  const source = event.id,
    choice = option.story;
  s.stories.cooldowns[source] = s.week + 52;
  if (choice?.startsWith("notice")) {
    if (!s.employment)
      throw new Error("This employer notice no longer applies.");
    effect(s, source, "notice", 8, s.employment.jobId, {
      tenure: s.employment.tenure,
    });
    if (
      choice === "notice-network" &&
      !s.vacancies.some((v) => v.jobId === "breakthrough")
    ) {
      s.vacancies.push({
        id: `story-job:${s.week}`,
        jobId: "breakthrough",
        postedWeek: s.week,
        expiresWeek: s.week + 4,
        exceptional: true,
      });
      s.vacancies = s.vacancies.slice(-12);
    }
    if (choice === "notice-study" && s.education.active)
      effect(s, source, "grant", 13, s.education.active.programId);
  }
  if (choice === "grant" && s.education.active)
    effect(s, source, "grant", 13, s.education.active.programId);
  if (choice === "partner-care" || choice === "partner-help")
    effect(s, source, choice, 13, s.family.partnerId);
  if (choice === "partner-wait" && s.family.partnerId) {
    const p = s.connections.profiles[s.family.partnerId];
    p.trust = clamp(p.trust - 5);
  }
  if (choice === "rehab") {
    const id = s.football.injuryWeeks
      ? "football"
      : Object.keys(s.sports).find((id) => s.sports[id].injuryWeeks);
    if (id) effect(s, source, "rehab", 4, id);
  }
  if (choice?.startsWith("child-")) {
    const child = s.family.children.find(
      (c) => s.week - c.bornWeek >= 5 * 52 && s.week - c.bornWeek < 18 * 52,
    );
    if (child) {
      if (choice === "child-wait") {
        child.bond = clamp(child.bond - 5);
        child.wellbeing = clamp(child.wellbeing - 5);
      } else effect(s, source, choice, 6, child.id);
    }
  }
  if (choice === "commission")
    effect(s, source, "commission", 4, s.music.active ? "music" : "hobby", {
      fee: 500,
      quality: s.music.active
        ? Math.max(...Object.values(s.music.skills))
        : Math.max(...Object.values(s.pastimes.hobbies).map((h) => h.skill)),
    });
  if (choice === "replacement-trial") {
    const f = s.football;
    if (!f.trial && !f.offers.some((o) => o.status === "offered"))
      f.offers.push({
        id: `replacement:${s.week}`,
        kind: age(s) <= 18 ? "academy-trial" : "reserve-trial",
        club:
          age(s) <= 18
            ? "Harbor Athletic academy"
            : "Riverside FC development squad",
        jobId: null,
        status: "offered",
        expiresWeek: s.week + 4,
        pay: 0,
        duration: 104,
      });
    f.offers = f.offers.slice(-12);
  }
  if (choice === "rent-year" || choice === "rent-quarter")
    effect(
      s,
      source,
      "rent",
      choice === "rent-year" ? 52 : 13,
      s.housing.rental,
      { weeklyCost: choice === "rent-year" ? 35 : 25 },
    );
  history(s, `${event.title} ${option.label}.`);
}
export function deliverStoryCommission(state, id) {
  const e = state.stories.effects.find(
    (e) => e.id === id && e.kind === "commission" && e.status === "active",
  );
  if (state.ended || !e || e.until <= state.week || !state.actions)
    throw new Error(
      "Choose an open commission and use a free-time action before its deadline.",
    );
  if (availableCash(state) < 25)
    throw new Error("Delivery needs $25 materials.");
  if (state.energy < 15)
    throw new Error("Rest before delivering the commission.");
  const s = structuredClone(state),
    job = s.stories.effects.find((x) => x.id === id);
  spendTime(s, 4, "Deliver a creative commission");
  s.actions--;
  s.money -= 25;
  s.energy -= 8;
  const success = rng(s) < Math.min(0.95, 0.45 + job.quality * 0.005);
  job.status = success ? "completed" : "failed";
  if (success) {
    receiveIncome(s, job.fee, "earned");
    s.fame.reputation = clamp(s.fame.reputation + 2);
    history(s, `Delivered the commission: $${job.fee} gross earned.`);
  } else {
    s.fame.reputation = clamp(s.fame.reputation - 2);
    history(s, "The commission did not meet the brief. No fee was paid.");
  }
  return s;
}
export function advanceStories(s) {
  for (const e of s.stories.effects.filter((e) => e.status === "active")) {
    if (
      (e.kind === "rent" && e.target !== s.housing.rental) ||
      (e.kind === "grant" && e.target !== s.education.active?.programId) ||
      (e.kind.startsWith("partner-") && e.target !== s.family.partnerId)
    ) {
      e.status = "cancelled";
      history(
        s,
        "A previous life commitment ended after your circumstances changed.",
      );
      continue;
    }
    if (["child-care", "child-help"].includes(e.kind)) {
      const c = s.family.children.find((c) => c.id === e.target);
      if (c) {
        c.wellbeing = clamp(c.wellbeing + 0.4);
        if (e.kind === "child-care") c.bond = clamp(c.bond + 0.4);
      }
    }
    if (e.kind === "rehab") {
      const p = e.target === "football" ? s.football : s.sports[e.target];
      if (p.injuryWeeks > 0 && s.energy >= 15 && s.calendar.last.stress < 50)
        p.injuryWeeks--;
    }
    if (e.until > s.week) continue;
    if (e.kind === "notice") {
      if (
        s.employment?.jobId === e.target &&
        s.employment.tenure >= e.tenure + 8
      ) {
        history(
          s,
          `${jobDefinition(e.target).employer}'s department closed. Your wages stop; your qualification and experience remain.`,
        );
        s.employment = null;
        s.career = s.company ? "business" : "unemployed";
      }
    } else if (e.kind === "commission") {
      e.status = "failed";
      s.fame.reputation = clamp(s.fame.reputation - 5);
      history(
        s,
        "A commissioned project missed its deadline. No fee was paid.",
      );
      continue;
    } else if (
      e.kind.startsWith("partner-") &&
      s.connections.profiles[e.target]
    ) {
      const p = s.connections.profiles[e.target];
      p.weeklyPay = Math.round(p.weeklyPay * 1.1);
      p.plans = "Completed training for a better-paid role";
      p.trust = clamp(p.trust + 4);
      history(
        s,
        "Your partner finished their training and moved into better-paid work.",
      );
    }
    e.status = "completed";
    if (!["notice", "partner-care", "partner-help"].includes(e.kind))
      history(s, "A temporary life commitment reached its planned end.");
  }
}
export function validateStories(s) {
  const n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = Infinity) => n(v, min, max) && Number.isInteger(v),
    known = (id) => STORY_EVENTS.some((e) => e.id === id),
    d = s.stories,
    fail = () => {
      throw new Error("Invalid ongoing life event data in save.");
    };
  const kinds = [
    "notice",
    "grant",
    "partner-care",
    "partner-help",
    "rehab",
    "child-care",
    "child-help",
    "commission",
    "rent",
  ];
  if (
    !d ||
    !int(d.serial) ||
    !Array.isArray(d.effects) ||
    d.effects.length > 24 ||
    !Array.isArray(d.history) ||
    d.history.length > 30 ||
    !d.cooldowns ||
    typeof d.cooldowns !== "object" ||
    Object.entries(d.cooldowns).some(
      ([id, week]) => !known(id) || !int(week),
    ) ||
    d.effects.filter((e) => e.status === "active").length > 12 ||
    new Set(d.effects.map((e) => e.id)).size !== d.effects.length
  )
    fail();
  if (
    d.effects.some(
      (e) =>
        typeof e.id !== "string" ||
        !known(e.source) ||
        !kinds.includes(e.kind) ||
        !(e.target === null || typeof e.target === "string") ||
        !int(e.start, 0, s.week) ||
        !int(e.until, e.start + 1, e.start + 52) ||
        !["active", "completed", "failed", "cancelled"].includes(e.status) ||
        (e.kind === "notice" && (!jobDefinition(e.target) || !int(e.tenure))) ||
        (e.kind === "grant" && !PROGRAMS.some((p) => p.id === e.target)) ||
        (e.kind.startsWith("partner-") && !s.connections.profiles[e.target]) ||
        (e.kind.startsWith("child-") &&
          !s.family.children.some((c) => c.id === e.target)) ||
        (e.kind === "rehab" &&
          !["football", "racing", "basketball", "tennis"].includes(e.target)) ||
        (e.kind === "commission" &&
          (!["music", "hobby"].includes(e.target) ||
            !n(e.fee, 0, 500) ||
            !n(e.quality, 0, 100))) ||
        (e.kind === "rent" &&
          (!["shared", "studio", "family"].includes(e.target) ||
            ![25, 35].includes(e.weeklyCost))),
    ) ||
    d.history.some((h) => !int(h.week, 0, s.week) || typeof h.text !== "string")
  )
    fail();
}
