import { simulationMessages } from "./simulation/messages.js";
import { availableCash } from "./world.js";
import { careerPathReason, assertCareerPath } from "./career-commitment.js";
import { spendTime, calendarForecast } from "./calendar.js";
import { startMusicProject } from "./music.js";
import { createPost } from "./life.js";
import { musicReleaseShare, internationalDuty } from "./career-world.js";
import {
  PERFORMANCE_CHOICES,
  fixtureContext,
  hashFraction,
} from "./pressure-effects.js";
export { PERFORMANCE_CHOICES, fixtureContext } from "./pressure-effects.js";
const sports = Object.keys(PERFORMANCE_CHOICES),
  age = (s) => s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52),
  clamp = (n) => Math.max(0, Math.min(100, n)),
  round = (n) => Math.round(n * 100) / 100;
const actor = (s, path) => (path === "football" ? s.football : s.sports[path]);
const log = (s, text) => {
  s.log.unshift({ week: s.week, text, kind: "milestone" });
  s.log = s.log.slice(0, 40);
};
export const nextPerformance = (s, path) =>
  s.seasons[path]?.fixtures.find(
    (f) => f.status === "scheduled" && f.week > s.week && f.week <= s.week + 2,
  );
export const currentTrend = (s) =>
  ["lifestyle", "football", "business", "gaming", "music"][
    Math.floor(hashFraction(`trend:${Math.floor(s.week / 13)}`) * 5)
  ];
export function initializePressure(s) {
  s.nextChapter = {
    seed: (s.seed ^ 0x68f4b39a) >>> 0,
    plans: {},
    planHistory: [],
    recordings: {},
    content: {},
    messages: [],
    familyRequests: [],
    promises: [],
    lastWeek: s.week,
  };
  refreshInbox(s);
}
function action(state, hours, label) {
  if (state.ended || state.event || !state.actions || age(state) < 5)
    throw new Error("You need a free action and no pending life choice.");
  const s = structuredClone(state);
  spendTime(s, hours, label);
  s.actions--;
  return s;
}
export function choosePerformancePlan(state, path, choice) {
  assertCareerPath(state, path);
  if (
    !Object.hasOwn(PERFORMANCE_CHOICES, path) ||
    !Object.hasOwn(PERFORMANCE_CHOICES[path], choice)
  )
    throw new Error("Choose a valid performance decision.");
  const f = nextPerformance(state, path),
    p = actor(state, path);
  if (!f || ["none", "retired"].includes(p.stage) || p.injuryWeeks)
    throw new Error(
      "A performance plan needs an active, healthy sport with a fixture in the next two weeks.",
    );
  if (
    state.nextChapter.plans[path]?.fixtureId === f.id &&
    state.nextChapter.plans[path]?.status === "planned"
  )
    throw new Error("You already prepared a decision for this fixture.");
  const s = action(state, 2, "Prepare a performance decision");
  s.nextChapter.plans[path] = {
    fixtureId: f.id,
    week: f.week,
    club: p.club,
    choice,
    chosenWeek: s.week,
    status: "planned",
    resultWeek: null,
    score: 0,
  };
  return s;
}
export const CREATIVE_BUDGETS = {
  lean: { name: "Lean", fee: 0, quality: 0 },
  standard: { name: "Standard", fee: 150, quality: 3 },
  ambitious: { name: "Ambitious", fee: 600, quality: 6 },
};
export const RELEASE_SCHEDULES = {
  regular: { name: "Four-week release", weeks: 4, quality: 0 },
  careful: { name: "Six-week polish", weeks: 6, quality: 3 },
  extended: { name: "Eight-week development", weeks: 8, quality: 5 },
};
export const RELEASE_MARKETING = {
  none: { name: "Organic discovery", fee: 0 },
  local: { name: "Local promotion", fee: 100 },
  campaign: { name: "Paid campaign", fee: 500 },
};
export function startPlannedRecording(
  state,
  {
    title,
    budget = "lean",
    schedule = "regular",
    marketing = "none",
    guest = "solo",
  },
) {
  if (
    !Object.hasOwn(CREATIVE_BUDGETS, budget) ||
    !Object.hasOwn(RELEASE_SCHEDULES, schedule) ||
    !Object.hasOwn(RELEASE_MARKETING, marketing) ||
    !["solo", "session"].includes(guest)
  )
    throw new Error("Choose a valid recording plan.");
  if (guest === "session" && (age(state) < 16 || state.music.sessions < 12))
    throw new Error(
      "Hiring a session musician requires age sixteen and twelve practice sessions.",
    );
  const extra =
    CREATIVE_BUDGETS[budget].fee +
    RELEASE_MARKETING[marketing].fee +
    (guest === "session" ? 300 : 0);
  if (availableCash(state) < 150 + extra)
    throw new Error(
      "Fund the $150 base recording fee and all planned production, guest and marketing costs.",
    );
  const s = startMusicProject(state, { title }),
    p = s.music.projects.at(-1);
  p.manualRelease = true;
  spendTime(s, 2, "Recording budget and release planning");
  s.money = round(s.money - extra);
  p.quality = clamp(
    p.quality +
      CREATIVE_BUDGETS[budget].quality +
      RELEASE_SCHEDULES[schedule].quality +
      (guest === "session" ? 3 : 0),
  );
  p.releaseWeek = s.week + RELEASE_SCHEDULES[schedule].weeks;
  s.nextChapter.recordings[p.id] = {
    budget,
    schedule,
    marketing,
    guest,
    extraCost: extra,
    plannedWeek: s.week,
  };
  log(
    s,
    `Planned “${p.title}”: $${150 + extra} total production and promotion. ${guest === "session" ? "Session musician hired for a $300 flat fee; no master ownership is transferred." : ""} Discovery remains uncertain.`,
  );
  return s;
}
export function producePlannedContent(
  state,
  {
    platform,
    approach = "authentic",
    budget = "lean",
    research = "false",
    theme = "lifestyle",
    sponsored = "false",
  },
) {
  if (
    !["lean", "standard", "ambitious"].includes(budget) ||
    !["true", "false"].includes(String(research)) ||
    !["true", "false"].includes(String(sponsored)) ||
    !["lifestyle", "football", "business", "gaming", "music"].includes(theme)
  )
    throw new Error("Choose a valid content production plan.");
  const researched = String(research) === "true",
    extra =
      (budget === "ambitious" ? 100 : budget === "standard" ? 25 : 0) +
      (researched ? 10 : 0);
  const costs = { lens: 5, loop: 20, tube: 35, stream: 15 };
  if (
    !Object.hasOwn(costs, platform) ||
    availableCash(state) < costs[platform] + extra
  )
    throw new Error(
      "Fund the platform cost, production budget and any research.",
    );
  const s = createPost(state, {
      platform,
      approach,
      sponsored: String(sponsored) === "true",
    }),
    p = s.social.posts.at(-1);
  spendTime(s, researched ? 3 : 2, "Research, recording and editing");
  s.money = round(s.money - extra);
  p.quality = clamp(
    p.quality +
      (budget === "ambitious" ? 6 : budget === "standard" ? 2 : 0) +
      (researched ? 2 : 0),
  );
  s.nextChapter.content[p.id] = {
    budget,
    researched,
    theme,
    extraCost: extra,
    createdWeek: s.week,
  };
  return s;
}
function travelCommitment(s, week) {
  const tour = s.careerWorld.music.tours.find(
    (t) => t.id === s.careerWorld.music.activeTour,
  );
  return (
    !!tour?.stops.some(
      (p) =>
        p.week === week &&
        ["scheduled", "performed", "completed", "failed"].includes(p.status),
    ) ||
    s.music.gigs.some(
      (g) =>
        ["booked", "performed", "cancelled"].includes(g.status) &&
        g.performanceWeek === week,
    ) ||
    sports.some((path) =>
      s.careerWorld.sports[path].invitations.some(
        (o) =>
          o.performanceWeek === week &&
          ["booked", "completed", "missed"].includes(o.status),
      ),
    )
  );
}
function addFamilyRequest(s, id, kind, personId, title, dueWeek) {
  const c = s.nextChapter;
  if (c.familyRequests.some((r) => r.id === id)) return;
  const conflicts = sports.filter(
    (path) =>
      !["none", "retired"].includes(actor(s, path).stage) &&
      s.seasons[path].fixtures.some(
        (f) => f.week === dueWeek && f.status === "scheduled",
      ),
  );
  c.familyRequests.push({
    id,
    kind,
    personId,
    title,
    dueWeek,
    createdWeek: s.week,
    status: "pending",
    choice: null,
    conflicts,
    travel: travelCommitment(s, dueWeek),
    paid: 0,
  });
  c.familyRequests = c.familyRequests.slice(-40);
}
function familyRequests(s) {
  const nextDate = (base) => s.week + 52 - ((((s.week - base) % 52) + 52) % 52);
  for (const child of s.family.children) {
    const due = nextDate(child.bornWeek);
    if (due <= s.week + 2)
      addFamilyRequest(
        s,
        `birthday:${child.id}:${due}`,
        "birthday",
        child.id,
        `${child.name}’s birthday`,
        due,
      );
  }
  const partner = s.relationships.find(
    (r) =>
      r.id === s.family.partnerId && ["Partner", "Spouse"].includes(r.role),
  );
  if (partner) {
    const due = nextDate(s.family.sinceWeek);
    if (due <= s.week + 2)
      addFamilyRequest(
        s,
        `anniversary:${partner.id}:${due}`,
        "anniversary",
        partner.id,
        "Your partnership anniversary",
        due,
      );
    if (
      s.family.children.some((c) => s.week - c.bornWeek < 18 * 52) &&
      s.connections.profiles[partner.id].weeklyPay > 0 &&
      (s.week + 1) % 26 === 0
    )
      addFamilyRequest(
        s,
        `partner-career:${partner.id}:${s.week + 1}`,
        "partner-career",
        partner.id,
        `${partner.name} has a career-development evening`,
        s.week + 1,
      );
  }
}
const careerPaths = {
  football: "sports",
  racing: "sports",
  basketball: "sports",
  tennis: "sports",
  music: "music",
  creator: "social",
};
function sources(s) {
  const result = [],
    push = (
      kind,
      id,
      title,
      body,
      view,
      deadline,
      action = null,
      path = null,
    ) =>
      result.push({
        id: `${kind}:${id}`,
        kind,
        ref: id,
        title,
        body,
        view,
        deadline,
        action,
        path,
      });
  for (const a of s.applications.filter((a) =>
    ["offer", "interview"].includes(a.status),
  ))
    push(
      "job",
      a.id,
      a.status === "interview"
        ? "An employer invited you to interview"
        : "An employer sent a job offer",
      "Your qualifications and the ordinary hiring process still apply.",
      "career",
      a.expiresWeek,
      a.status === "offer" ? "accept-job" : "interview",
    );
  for (const path of sports) {
    const p = actor(s, path);
    for (const o of p.offers.filter((o) => o.status === "offered"))
      push(
        s.careerWorld.sports[path].moves[o.id] ? "move" : "sport",
        o.id,
        `${o.club}: sporting invitation`,
        "Review the terms before its deadline. Development and licensing requirements remain in force.",
        "sports",
        o.expiresWeek,
        s.careerWorld.sports[path].moves[o.id]
          ? "world-move-review"
          : "sport-offer",
        path,
      );

    const f = nextPerformance(s, path);
    if (
      f &&
      !careerPathReason(s, path) &&
      !["none", "retired"].includes(p.stage)
    )
      push(
        "performance",
        f.id,
        `Prepare for ${f.opponent}`,
        `${fixtureContext(s, path, f)}. Preparation, ability and selection determine the outcome.`,
        "sports",
        f.week,
        null,
        path,
      );
  }
  for (const o of s.music.gigs.filter((o) => o.status === "offered"))
    push(
      "gig",
      o.id,
      `${o.venue}: performance invitation`,
      "Booking commits next-week time; payment follows delivery.",
      "music",
      o.expiresWeek,
      "music-gig",
    );
  for (const o of s.music.labelOffers.filter((o) => o.status === "offered"))
    push(
      "label",
      o.id,
      `${o.name}: label proposal`,
      "An advance is recoupable. Review exclusivity and delivery obligations.",
      "music",
      o.expiresWeek,
      "label-offer",
    );
  for (const o of s.social.offers.filter((o) => o.status === "offered"))
    push(
      "creator",
      o.id,
      `${o.brand}: collaboration invitation`,
      "A public, labelled post must meet the quality and delivery requirements.",
      "social",
      o.expiresWeek,
      "sponsor",
    );
  for (const o of s.contracts.offers.filter((o) => o.status === "offered"))
    push(
      "endorsement",
      o.id,
      `${o.brand}: endorsement terms`,
      "Review image rights, appearances, exclusivity and repayment obligations.",
      careerPaths[o.sector],
      o.expiresWeek,
      "depth-endorsement-review",
      o.sector,
    );
  for (const p of s.careerSupport.music.press.filter(
    (p) => p.status === "offered",
  ))
    push(
      "music-press",
      p.id,
      `${p.outlet}: interview invitation`,
      "Your manager can help; preparation and actual delivery still matter.",
      "music",
      p.expiresWeek,
      "music-interview",
    );
  for (const r of s.nextChapter.familyRequests.filter((r) =>
    ["pending", "agreed"].includes(r.status),
  ))
    push(
      "family",
      r.id,
      r.title,
      `${r.travel ? "A booked performance or trip conflicts with being there in person. " : ""}${r.conflicts.length ? "Your sporting schedule also needs a decision. " : ""}Discuss celebrating early, protecting the day or calling remotely.`,
      "family",
      r.dueWeek,
    );
  for (const o of s.opportunities)
    push(
      "sale",
      o.id,
      "Owners announced a sale",
      `${o.stake}% is offered at a funded price. Availability is limited.`,
      "teams",
      o.expiresWeek,
      "sale-opportunity",
    );
  if (
    age(s) >= 13 &&
    s.social.privacy === "public" &&
    s.fame.recognition >= 20
  ) {
    const period = Math.floor(s.week / 13);
    push(
      "press",
      `round:${period}`,
      "A local reporter asks about your ambitions",
      "Choose a thoughtful answer, a headline or an explicit public promise.",
      "inbox",
      period * 13 + 13,
    );
  }
  for (const p of s.social.posts.filter(
    (p) =>
      p.public &&
      p.approach === "clickbait" &&
      p.createdWeek + 3 > s.week &&
      s.fame.recognition >= 20,
  ))
    push(
      "backlash",
      p.id,
      "Your audience questions a sensational post",
      "A clarification can repair some trust. Doubling down carries a further reputation cost.",
      "inbox",
      p.createdWeek + 3,
    );
  if (s.profession) {
    const w = s.profession.work.active;
    if (w)
      push(
        "career-task",
        w.id,
        w.title,
        `Work assignment: ${w.progress}/6 units. Deliver before the recorded deadline; supervisor review follows your actual work.`,
        "career",
        w.dueWeek,
      );
    for (const c of s.profession.company.contracts.filter((c) =>
      ["active", "invoiced", "disputed"].includes(c.status),
    ))
      push(
        "career-task",
        c.id,
        `${c.companyName}: client delivery`,
        c.note,
        "company",
        c.invoiceWeek || c.dueWeek,
      );
    for (const p of s.profession.creator.series.filter(
      (p) => p.status === "active",
    ))
      push(
        "career-task",
        p.id,
        `${p.title}: next episode`,
        `${p.episodes.length}/6 episodes planned or delivered. Your next publishing slot is due; missed cadence affects retention.`,
        "social",
        p.nextWeek + 1,
      );
    for (const o of s.profession.investing.orders.filter(
      (o) => o.status === "pending",
    ))
      push(
        "career-task",
        o.id,
        `${o.side.toUpperCase()} ${o.asset}: open limit order`,
        o.note,
        "investments",
        o.expiresWeek,
      );
  }
  for (const m of simulationMessages(s))
    push("career-task", m.id, m.title, m.body, m.view, m.deadline);
  return result;
}
export function refreshInbox(s) {
  if (!s.nextChapter) return;
  familyRequests(s);
  const active = sources(s),
    ids = new Set(active.map((m) => m.id));
  for (const message of s.nextChapter.messages)
    if (!ids.has(message.id) && message.status === "open")
      message.status = "closed";
  for (const source of active) {
    const old = s.nextChapter.messages.find((m) => m.id === source.id);
    if (old) {
      Object.assign(old, source);
      if (old.status === "closed" && source.deadline > s.week)
        old.status = "open";
    } else
      s.nextChapter.messages.unshift({
        ...source,
        createdWeek: s.week,
        read: false,
        archived: false,
        status: source.deadline > s.week ? "open" : "closed",
        reply: null,
      });
  }
  s.nextChapter.messages = s.nextChapter.messages.slice(0, 80);
}
export function markInboxMessage(state, id, mode = "read") {
  if (
    !["read", "archive"].includes(mode) ||
    !state.nextChapter.messages.some((m) => m.id === id)
  )
    throw new Error("Choose an inbox message.");
  const s = structuredClone(state),
    m = s.nextChapter.messages.find((m) => m.id === id);
  m.read = true;
  if (mode === "archive") m.archived = true;
  return s;
}
export function respondFamilyRequest(state, id, choice) {
  const r = state.nextChapter.familyRequests.find((r) => r.id === id);
  if (
    !r ||
    r.status !== "pending" ||
    r.dueWeek <= state.week ||
    !["attend", "early", "video", "support", "decline"].includes(choice)
  )
    throw new Error("Choose a live family request and response.");
  if (choice === "early" && r.kind === "partner-career")
    throw new Error(
      "Your partner’s career evening needs day-of support or an honest decline.",
    );
  if (choice === "support" && r.kind !== "partner-career")
    throw new Error("Childcare support is for your partner’s career evening.");
  if (choice === "attend" && (r.travel || travelCommitment(state, r.dueWeek)))
    throw new Error(
      "A booked gig, tour or international appearance prevents attending at home. Celebrate early or arrange a video call.",
    );
  const cost =
    choice === "attend"
      ? 40
      : choice === "early"
        ? 25
        : choice === "support"
          ? 75
          : 0;
  if (availableCash(state) < cost)
    throw new Error("Fund the agreed family plan from available cash.");
  const s = action(
      state,
      choice === "early" ? 4 : 1,
      "Discuss a family scheduling conflict",
    ),
    q = s.nextChapter.familyRequests.find((r) => r.id === id);
  s.money = round(s.money - cost);
  q.paid = cost;
  q.choice = choice;
  q.status = ["early", "decline"].includes(choice) ? "completed" : "agreed";
  if (choice === "early") applyFamilyOutcome(s, q, 3);
  if (choice === "decline") applyFamilyOutcome(s, q, -1);
  const forecast = calendarForecast(s, { comingWeek: true });
  if (forecast.mandatory + forecast.appointments + forecast.spent > 168)
    throw new Error(
      "The agreed family plan does not fit your commitments. Discuss another compromise.",
    );
  log(
    s,
    `Discussed ${r.title.toLowerCase()}: ${choice === "attend" ? "protect the family day and excuse conflicting sporting appearances" : choice === "early" ? "celebrate together early" : choice === "video" ? "make time for a remote call" : choice === "support" ? "arrange childcare for your partner’s opportunity" : "explain why you cannot attend"}.`,
  );
  return s;
}
function applyFamilyOutcome(s, r, amount) {
  const child = s.family.children.find((c) => c.id === r.personId),
    partner = s.relationships.find((p) => p.id === s.family.partnerId);
  if (child) child.bond = clamp(child.bond + amount);
  if (partner) {
    partner.bond = clamp(partner.bond + amount);
    s.connections.profiles[partner.id].trust = clamp(
      s.connections.profiles[partner.id].trust + amount,
    );
  }
  if (r.kind === "partner-career" && amount > 0) {
    const p = s.livingWorld.people[r.personId];
    if (p) p.talent = clamp(p.talent + 1);
  }
}
export function respondPublicMessage(state, id, choice) {
  const m = state.nextChapter.messages.find((m) => m.id === id);
  if (
    !m ||
    !["press", "backlash"].includes(m.kind) ||
    m.reply ||
    m.deadline <= state.week ||
    state.social.privacy !== "public" ||
    !["thoughtful", "headline", "promise"].includes(choice)
  )
    throw new Error("Choose an unanswered public question and valid response.");
  if (m.kind === "backlash" && choice === "promise")
    throw new Error(
      "Clarify the post or stand by it; a new promise is not a correction.",
    );
  const s = action(state, 2, "Answer a public question"),
    msg = s.nextChapter.messages.find((m) => m.id === id);
  msg.reply = choice;
  msg.read = true;
  msg.status = "answered";
  s.fame.reputation = clamp(
    s.fame.reputation +
      (choice === "thoughtful"
        ? m.kind === "backlash"
          ? 2
          : 0.5
        : choice === "headline"
          ? -2
          : 0),
  );
  s.fame.recognition = clamp(
    s.fame.recognition + (choice === "thoughtful" ? 0.25 : 1),
  );
  if (choice === "promise") {
    const kind = s.music.active
      ? "release"
      : Object.values(s.social.profiles).some((p) => p.active)
        ? "content"
        : "clinic";
    if (
      kind === "clinic" &&
      !sports.some(
        (path) => !["none", "retired"].includes(actor(s, path).stage),
      )
    )
      throw new Error(
        "Build an active creative or sporting path before promising a public project.",
      );
    if (s.nextChapter.promises.some((p) => p.status === "active"))
      throw new Error("Deliver your existing public promise first.");
    s.nextChapter.promises.push({
      id: `promise:${id}`,
      kind,
      startedWeek: s.week,
      deadline: s.week + 6,
      status: "active",
      baseline:
        kind === "release"
          ? s.music.releases.map((r) => r.id)
          : s.social.posts.map((p) => p.id),
      clinicWeek: null,
    });
    s.nextChapter.promises = s.nextChapter.promises.slice(-20);
  }
  log(
    s,
    "Your public response changed recognition and reputation; attention is not a job or sponsor guarantee.",
  );
  return s;
}
export function deliverCommunityPromise(state, id) {
  const p = state.nextChapter.promises.find((p) => p.id === id);
  if (
    !p ||
    p.kind !== "clinic" ||
    p.status !== "active" ||
    p.clinicWeek !== null ||
    p.deadline <= state.week ||
    state.social.privacy !== "public" ||
    !sports.some(
      (path) => !["none", "retired"].includes(actor(state, path).stage),
    )
  )
    throw new Error(
      "A public community session needs a live sporting promise.",
    );
  if (availableCash(state) < 50) throw new Error("The venue costs $50.");
  const s = action(state, 3, "Deliver a community sports session");
  s.money -= 50;
  s.nextChapter.promises.find((p) => p.id === id).clinicWeek = s.week;
  return s;
}
export function advancePressure(s) {
  const c = s.nextChapter;
  if (!c || c.lastWeek >= s.week) return;
  c.lastWeek = s.week;
  for (const [path, p] of Object.entries(c.plans))
    if (
      p.status === "planned" &&
      (p.week < s.week || p.club !== actor(s, path).club)
    ) {
      p.status = "missed";
      p.resultWeek = s.week;
    }
  for (const r of c.familyRequests.filter(
    (r) => ["pending", "agreed"].includes(r.status) && r.dueWeek <= s.week,
  )) {
    if (r.kind !== "birthday" && r.personId !== s.family.partnerId) {
      if (r.status === "agreed") s.money = round(s.money + r.paid);
      r.status = "cancelled";
      continue;
    }
    const hasTime =
      (s.calendar.last?.mandatory || 0) +
        (s.calendar.last?.appointments || 0) +
        (s.calendar.last?.spent || 0) <=
      168;
    const delivered =
      r.status === "agreed" &&
      hasTime &&
      s.energy >= 15 &&
      (r.choice !== "attend" || !travelCommitment(s, r.dueWeek));
    r.status = delivered ? "completed" : "missed";
    applyFamilyOutcome(s, r, delivered ? (r.choice === "video" ? 1 : 4) : -3);
    log(
      s,
      `${r.title}: ${delivered ? "your agreed compromise was delivered" : "you missed the family commitment"}.`,
    );
  }
  for (const p of c.promises.filter((p) => p.status === "active")) {
    const done =
      p.kind === "clinic"
        ? p.clinicWeek !== null
        : p.kind === "release"
          ? s.music.releases.some(
              (r) =>
                !p.baseline.includes(r.id) &&
                r.releasedWeek <= p.deadline &&
                musicReleaseShare(s, r.id) > 0,
            )
          : s.social.posts.filter(
              (r) =>
                !p.baseline.includes(r.id) &&
                r.status === "resolved" &&
                r.public &&
                r.quality >= 35 &&
                r.resolveWeek <= p.deadline,
            ).length >= 2;
    if (done) {
      p.status = "delivered";
      s.fame.reputation = clamp(s.fame.reputation + 1);
      log(s, "You delivered your public promise and strengthened trust.");
    } else if (p.deadline <= s.week) {
      p.status = "broken";
      s.fame.reputation = clamp(s.fame.reputation - 4);
      log(s, "Your public promise expired without delivery; reputation fell.");
    }
  }
  c.recordings = Object.fromEntries(
    Object.entries(c.recordings).filter(
      ([id]) =>
        s.music.projects.some((p) => p.id === id) ||
        s.music.releases.some((p) => p.id === id),
    ),
  );
  c.content = Object.fromEntries(
    Object.entries(c.content).filter(([id]) =>
      s.social.posts.some((p) => p.id === id),
    ),
  );
  refreshInbox(s);
}
export function validatePressure(s) {
  const c = s.nextChapter,
    n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = Infinity) => n(v, min, max) && Number.isInteger(v),
    text = (v, max = 240) => typeof v === "string" && v.length <= max,
    list = (v, max) => Array.isArray(v) && v.length <= max,
    obj = (v) => v && typeof v === "object" && !Array.isArray(v),
    fail = () => {
      throw new Error(
        "Invalid inbox, performance decisions or household commitments.",
      );
    };
  if (
    !obj(c) ||
    !int(c.seed, 0, 4294967295) ||
    !int(c.lastWeek, 0, s.week) ||
    !obj(c.plans) ||
    !obj(c.recordings) ||
    !obj(c.content) ||
    !list(c.planHistory, 40) ||
    !list(c.messages, 80) ||
    !list(c.familyRequests, 40) ||
    !list(c.promises, 20)
  )
    fail();
  const validPlan = (p, path) =>
    sports.includes(path) &&
    Object.hasOwn(PERFORMANCE_CHOICES[path], p.choice) &&
    text(p.fixtureId, 80) &&
    text(p.club, 80) &&
    int(p.week) &&
    int(p.chosenWeek, 0, s.week) &&
    ["planned", "delivered", "missed"].includes(p.status) &&
    (p.resultWeek === null || int(p.resultWeek, 0, s.week)) &&
    n(p.score, 0, 100);
  if (
    Object.entries(c.plans).some(([path, p]) => !validPlan(p, path)) ||
    c.planHistory.some((p) => !validPlan(p, p.path))
  )
    fail();
  for (const p of Object.values(c.recordings))
    if (
      !Object.hasOwn(CREATIVE_BUDGETS, p.budget) ||
      !Object.hasOwn(RELEASE_SCHEDULES, p.schedule) ||
      !Object.hasOwn(RELEASE_MARKETING, p.marketing) ||
      !["solo", "session"].includes(p.guest) ||
      p.extraCost !==
        CREATIVE_BUDGETS[p.budget].fee +
          RELEASE_MARKETING[p.marketing].fee +
          (p.guest === "session" ? 300 : 0) ||
      !int(p.plannedWeek, 0, s.week)
    )
      fail();
  for (const p of Object.values(c.content))
    if (
      !["lean", "standard", "ambitious"].includes(p.budget) ||
      typeof p.researched !== "boolean" ||
      !["lifestyle", "football", "business", "gaming", "music"].includes(
        p.theme,
      ) ||
      p.extraCost !==
        (p.budget === "ambitious" ? 100 : p.budget === "standard" ? 25 : 0) +
          (p.researched ? 10 : 0) ||
      !int(p.createdWeek, 0, s.week)
    )
      fail();
  if (
    new Set(c.messages.map((m) => m.id)).size !== c.messages.length ||
    c.messages.some(
      (m) =>
        !text(m.id, 160) ||
        ![
          "job",
          "sport",
          "move",
          "performance",
          "gig",
          "label",
          "creator",
          "endorsement",
          "music-press",
          "family",
          "sale",
          "press",
          "backlash",
          "career-task",
        ].includes(m.kind) ||
        !text(m.ref, 120) ||
        !text(m.title, 160) ||
        !text(m.body, 400) ||
        ![
          "career",
          "sports",
          "music",
          "social",
          "inbox",
          "family",
          "teams",
          "company",
          "investments",
          "health-record",
          "professional",
          "business-operations",
          "life-planning",
          "economic-world",
          "creative-production",
        ].includes(m.view) ||
        !int(m.deadline) ||
        !int(m.createdWeek, 0, s.week) ||
        !(
          m.action === null ||
          (
            {
              job: ["accept-job", "interview"],
              sport: ["sport-offer"],
              move: ["world-move-review"],
              gig: ["music-gig"],
              label: ["label-offer"],
              creator: ["sponsor"],
              endorsement: ["depth-endorsement-review"],
              "music-press": ["music-interview"],
              sale: ["sale-opportunity"],
            }[m.kind] || []
          ).includes(m.action)
        ) ||
        !(
          m.path === null || [...sports, "music", "creator"].includes(m.path)
        ) ||
        typeof m.read !== "boolean" ||
        typeof m.archived !== "boolean" ||
        !["open", "closed", "answered"].includes(m.status) ||
        !(
          m.reply === null ||
          ["thoughtful", "headline", "promise"].includes(m.reply)
        ),
    )
  )
    fail();
  if (
    new Set(c.familyRequests.map((r) => r.id)).size !==
      c.familyRequests.length ||
    c.familyRequests.some(
      (r) =>
        !text(r.id, 160) ||
        !["birthday", "anniversary", "partner-career"].includes(r.kind) ||
        !text(r.personId, 80) ||
        !(r.kind === "birthday"
          ? s.family.children.some((c) => c.id === r.personId)
          : s.relationships.some((p) => p.id === r.personId)) ||
        !text(r.title, 160) ||
        !int(r.dueWeek) ||
        !int(r.createdWeek, 0, s.week) ||
        !["pending", "agreed", "completed", "missed", "cancelled"].includes(
          r.status,
        ) ||
        !(
          r.choice === null ||
          ["attend", "early", "video", "support", "decline"].includes(r.choice)
        ) ||
        !list(r.conflicts, 4) ||
        r.conflicts.some((path) => !sports.includes(path)) ||
        typeof r.travel !== "boolean" ||
        !n(r.paid, 0, 75) ||
        r.paid !==
          (r.choice === "attend"
            ? 40
            : r.choice === "early"
              ? 25
              : r.choice === "support"
                ? 75
                : 0) ||
        (r.status === "agreed" && r.choice === null),
    )
  )
    fail();
  if (
    new Set(c.promises.map((p) => p.id)).size !== c.promises.length ||
    c.promises.some(
      (p) =>
        !text(p.id, 160) ||
        !["release", "content", "clinic"].includes(p.kind) ||
        !int(p.startedWeek, 0, s.week) ||
        p.deadline !== p.startedWeek + 6 ||
        !["active", "delivered", "broken"].includes(p.status) ||
        !list(p.baseline, 24) ||
        p.baseline.some((id) => !text(id, 100)) ||
        !(p.clinicWeek === null || int(p.clinicWeek, 0, s.week)),
    )
  )
    fail();
}
