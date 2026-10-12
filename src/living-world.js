import { JOBS, BUSINESSES, availableCash, stakePercent, rng } from "./world.js";
import { spendTime } from "./calendar.js";
import { relativeAlive } from "./life-course.js";

export const CONTACT_FIELDS = [
  "office",
  "business",
  "investor",
  "music",
  "creator",
  "football",
  "racing",
  "basketball",
  "tennis",
];
export const CONTACT_CAREERS = {
  investor: [
    "Learning finance",
    "Building personal savings",
    "Private investor",
    "Professional investor",
    "Investment partner",
  ],
  office: [
    "Studying and exploring work",
    "Junior employee",
    "Experienced professional",
    "Team leader",
    "Department manager",
  ],
  business: [
    "Exploring a business idea",
    "Testing a small business",
    "Small business owner",
    "Growing company founder",
    "Established entrepreneur",
  ],
  music: [
    "Learning music",
    "Local musician",
    "Independent recording artist",
    "Touring musician",
    "Established recording artist",
  ],
  creator: [
    "Learning production",
    "Small content creator",
    "Independent creator",
    "Full-time creator",
    "Established broadcaster",
  ],
  football: [
    "School / local football",
    "Club development player",
    "Semi-professional footballer",
    "Professional footballer",
    "Established league player",
  ],
  racing: [
    "Local karting",
    "Regional race development",
    "Junior formula driver",
    "Professional racing driver",
    "Established championship driver",
  ],
  basketball: [
    "School / local basketball",
    "Club development player",
    "Semi-professional basketballer",
    "Professional basketballer",
    "Established league player",
  ],
  tennis: [
    "Local tennis",
    "Junior tennis circuit",
    "Developing tour player",
    "Professional tennis player",
    "Established tour player",
  ],
};
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n));
const hash = (text) =>
  [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
const isRelative = (s, r) =>
  ["Parent", "Sibling"].includes(r.role) || !!s.lifeCourse.relatives[r.id];
function story(s, personId, text) {
  s.livingWorld.stories.unshift({ week: s.week, personId, text });
  s.livingWorld.stories = s.livingWorld.stories.slice(0, 40);
  s.log.unshift({ week: s.week, text, kind: "info" });
  s.log = s.log.slice(0, 40);
}
export function syncLivingContacts(s) {
  for (const r of s.relationships) {
    if (isRelative(s, r) || s.livingWorld.people[r.id]) continue;
    const p = s.connections.profiles[r.id];
    if (!p) continue;
    const h = hash(r.id + r.name),
      field = p.interests.includes("music")
        ? "music"
        : p.interests.includes("sport")
          ? ["football", "racing", "basketball", "tennis"][h % 4]
          : p.interests.includes("technology")
            ? "business"
            : p.interests.includes("art")
              ? "creator"
              : p.values === "security"
                ? "investor"
                : "office";
    s.livingWorld.people[r.id] = {
      field,
      level: 0,
      talent: 45 + (h % 36),
      reputation: 0,
      relation: "friend",
      nextReviewWeek: s.week + 26,
      lastActionWeek: -52,
      lastRivalReview: s.week,
      developedWeeks: 0,
      history: [],
    };
  }
}
export function initializeLivingWorld(s) {
  s.livingWorld = {
    seed: (s.seed ^ 0xbee123) >>> 0,
    people: {},
    opportunities: [],
    stories: [],
    serial: 0,
  };
  syncLivingContacts(s);
}
export function contactAction(state, id, kind) {
  const r = state.relationships.find((r) => r.id === id),
    p = state.connections.profiles[id],
    c = state.livingWorld.people[id];
  if (
    state.ended ||
    state.event ||
    !state.actions ||
    age(state) < 12 ||
    !r ||
    !p ||
    !c ||
    !relativeAlive(state, id) ||
    age(state) + p.ageOffset < 12
  )
    throw new Error(
      "Choose an available contact and make time for their life.",
    );
  if (
    !["catch-up", "introduction", "rivalry", "support"].includes(kind) ||
    state.week < c.lastActionWeek + 4
  )
    throw new Error("Catch up or work together at most once every four weeks.");
  if (
    kind === "introduction" &&
    (r.bond < 55 || p.trust < 55 || c.level < 2 || age(state) < 16)
  )
    throw new Error(
      "Introductions need a developed contact career, age sixteen, 55 connection and 55 trust.",
    );
  if (
    kind === "rivalry" &&
    (["Partner", "Spouse"].includes(r.role) ||
      !(
        c.field === state.career ||
        (c.field === "business" && state.company) ||
        (c.field === "investor" &&
          Object.values(state.holdings).some((n) => n > 0)) ||
        (["football", "racing", "basketball", "tennis"].includes(c.field) &&
          !["none", "retired"].includes(
            (c.field === "football" ? state.football : state.sports[c.field])
              .stage,
          )) ||
        (c.field === "music" && state.music.active) ||
        (c.field === "creator" &&
          Object.values(state.social.profiles).some((p) => p.active))
      ) ||
      c.level < 1)
  )
    throw new Error(
      "Friendly rivalry needs a peer on your career path, outside your partnership.",
    );
  if (kind === "support" && (age(state) < 18 || availableCash(state) < 100))
    throw new Error(
      "Career support needs adulthood and $100 for a workshop or practical help.",
    );
  const s = structuredClone(state);
  spendTime(s, 2, "Contact careers and shared ambitions");
  s.actions--;
  const q = s.livingWorld.people[id],
    profile = s.connections.profiles[id],
    person = s.relationships.find((r) => r.id === id);
  q.lastActionWeek = s.week;
  profile.lastContactWeek = s.week;
  if (kind === "rivalry") {
    q.relation = "rival";
    q.lastRivalReview = s.week;
    story(
      s,
      id,
      `You and ${person.name} started a friendly ${q.field} rivalry. Comparisons are reviewed every thirteen weeks; success does not award free contracts.`,
    );
  } else {
    person.bond = clamp(person.bond + 4);
    profile.trust = clamp(profile.trust + 3);
    if (kind === "support") {
      s.money -= 100;
      q.talent = clamp(q.talent + 3);
      q.relation = "collaborator";
      story(
        s,
        id,
        `Supported ${person.name}'s ${q.field} development with a $100 workshop. Their career still develops over time.`,
      );
    } else if (kind === "catch-up")
      story(
        s,
        id,
        `${person.name} discussed ${CONTACT_CAREERS[q.field][q.level].toLowerCase()} and their own ambitions. Staying close builds trust.`,
      );
    else {
      const opportunity = {
        id: `contact:${s.livingWorld.serial++}`,
        personId: id,
        field: q.field,
        status: "pending",
        decisionWeek: s.week + 2,
        expiresWeek: s.week + 6,
        resultId: null,
      };
      s.livingWorld.opportunities.push(opportunity);
      s.livingWorld.opportunities = s.livingWorld.opportunities.slice(-20);
      story(
        s,
        id,
        `${person.name} is considering an introduction. A real opportunity may follow in two weeks; recruitment requirements remain in place.`,
      );
    }
  }
  return s;
}
function introduction(s, o) {
  const r = s.relationships.find((r) => r.id === o.personId),
    p = s.connections.profiles[o.personId],
    c = s.livingWorld.people[o.personId];
  if (
    !r ||
    !p ||
    !c ||
    r.bond < 50 ||
    p.trust < 50 ||
    rng(s.livingWorld) >= Math.min(0.85, 0.25 + p.trust * 0.005)
  ) {
    o.status = "refused";
    return;
  }
  if (
    c.field === "music" &&
    s.music.active &&
    s.music.sessions >= 12 &&
    s.music.releases.length &&
    !s.careerWorld.music.offers.some((x) => x.status === "offered")
  ) {
    const id = `contact-music:${s.week}:${s.livingWorld.serial++}`;
    s.careerWorld.music.offers.push({
      id,
      kind: "collaboration",
      artist: r.name,
      skill: c.talent,
      fee: 100 * c.level,
      royalty: 0.3,
      audience: Math.round(c.reputation * 25),
      clientPay: 0,
      minimumQuality: 0,
      status: "offered",
      expiresWeek: s.week + 4,
      deadline: s.week + 10,
      projectId: null,
      negotiation: null,
    });
    s.careerWorld.music.offers = s.careerWorld.music.offers.slice(-20);
    o.resultId = id;
    o.status = "introduced";
    c.relation = "collaborator";
    story(
      s,
      r.id,
      `${r.name} proposed a shared recording. Their career and audience shape the opportunity; recording budgets and ownership still apply.`,
    );
  } else if (["football", "racing", "basketball", "tennis"].includes(c.field)) {
    const athlete = c.field === "football" ? s.football : s.sports[c.field];
    if (["none", "retired"].includes(athlete.stage)) {
      o.status = "refused";
      return;
    }
    const id = `contact-training:${s.week}:${s.livingWorld.serial++}`;
    o.resultId = id;
    o.status = "training";
    story(
      s,
      r.id,
      `${r.name} introduced you to a shared ${c.field} practice session. Book it before the invitation expires; it offers development, not a playing contract.`,
    );
  } else {
    if (c.field === "investor" && c.level >= 2 && age(s) >= 18) {
      const candidates = BUSINESSES.filter((b) => stakePercent(s, b.id) < 100);
      const target =
        candidates[Math.floor(rng(s.livingWorld) * candidates.length)];
      if (!target) {
        o.status = "refused";
        return;
      }
      o.resultId = target.id;
      o.status = "board";
      story(
        s,
        r.id,
        `${r.name} introduced you to the owners of ${target.name}. The usual meeting fee, owner permission and funded premium bid are still required; an introduction transfers no ownership.`,
      );
      return;
    }
    const candidates = JOBS.filter(
      (j) =>
        ![
          "football",
          "basketball",
          "tennis",
          "music",
          "creator",
          "business",
          "investor",
        ].includes(j.track) &&
        !(j.track === "racing" && j.level >= 1) &&
        j.level <= Math.min(2, c.level - 1),
    );
    const j = candidates[Math.floor(rng(s.livingWorld) * candidates.length)];
    if (!j) {
      o.status = "refused";
      return;
    }
    const id = `contact-job:${s.week}:${s.livingWorld.serial++}`;
    s.vacancies.push({
      id,
      jobId: j.id,
      postedWeek: s.week,
      expiresWeek: s.week + 4,
      exceptional: false,
    });
    s.vacancies = s.vacancies.slice(-12);
    o.resultId = id;
    o.status = "introduced";
    story(
      s,
      r.id,
      `${r.name} introduced you to the ${j.title.toLowerCase()} vacancy. You still need its qualifications, a successful application and an accepted offer.`,
    );
  }
}
export function bookContactTraining(state, id) {
  const o = state.livingWorld.opportunities.find((o) => o.id === id),
    p = o && (o.field === "football" ? state.football : state.sports[o.field]);
  if (
    state.ended ||
    state.event ||
    !state.actions ||
    !o ||
    o.status !== "training" ||
    o.expiresWeek <= state.week ||
    !p ||
    ["none", "retired"].includes(p.stage) ||
    p.injuryWeeks ||
    state.energy < 15
  )
    throw new Error(
      "Choose a live training introduction and recover before practising.",
    );
  const s = structuredClone(state);
  spendTime(s, 4, "A contact's shared training session");
  s.actions--;
  s.energy -= 6;
  const athlete = o.field === "football" ? s.football : s.sports[o.field];
  athlete.ability = clamp(athlete.ability + 0.5);
  s.livingWorld.opportunities.find((x) => x.id === id).status = "completed";
  story(
    s,
    o.personId,
    "Completed shared practice through a contact. Ability improved slightly; no employment or promotion was granted.",
  );
  return s;
}
export function advanceLivingWorld(s) {
  syncLivingContacts(s);
  for (const [id, c] of Object.entries(s.livingWorld.people)) {
    const r = s.relationships.find((r) => r.id === id),
      p = s.connections.profiles[id];
    if (!r || !p || isRelative(s, r) || !relativeAlive(s, id)) continue;
    const years = age(s) + p.ageOffset;
    if (years >= 6 && years < 67) c.developedWeeks++;
    if (c.nextReviewWeek <= s.week) {
      c.nextReviewWeek = s.week + 26;
      if (years >= 67) {
        if (p.job !== "Retired" && p.weeklyPay > 0) {
          p.job = "Retired";
          p.weeklyPay = Math.round(p.weeklyPay * 0.45);
          story(
            s,
            id,
            `${r.name} retired from their own working life. Their pension and plans now shape their finances.`,
          );
        }
      } else if (
        years >= 16 &&
        c.developedWeeks >= 52 &&
        p.job !== "Relocating" &&
        !(c.field === "investor" && c.level === 1 && p.wealth < 10000) &&
        !(c.field === "business" && c.level === 1 && p.wealth < 5000) &&
        rng(s.livingWorld) < 0.2 + c.talent * 0.004 &&
        c.level < 4
      ) {
        c.level++;
        if (c.field === "business" && c.level === 2) p.wealth -= 5000;
        c.reputation = clamp(c.reputation + 10);
        if (years >= 18 && (c.field === "office" || c.level >= 2)) {
          p.job = CONTACT_CAREERS[c.field][c.level];
          p.weeklyPay = [0, 450, 650, 1800, 4500][c.level];
        }
        c.history.unshift({
          week: s.week,
          level: c.level,
          title: CONTACT_CAREERS[c.field][c.level],
        });
        c.history = c.history.slice(0, 10);
        story(
          s,
          id,
          `${r.name} progressed to ${CONTACT_CAREERS[c.field][c.level].toLowerCase()}. Their career and earnings develop independently of yours.`,
        );
      } else if (
        years >= 18 &&
        c.level >= 2 &&
        rng(s.livingWorld) < 0.08 &&
        p.job !== "Relocating"
      ) {
        p.job = "Looking for work";
        p.weeklyPay = 0;
        story(
          s,
          id,
          `${r.name} lost work during a career setback. Their savings and relationships still matter.`,
        );
      } else if (
        years >= 18 &&
        p.job === "Looking for work" &&
        rng(s.livingWorld) < 0.5
      ) {
        p.job = CONTACT_CAREERS[c.field][c.level];
        p.weeklyPay = [0, 450, 650, 1800, 4500][c.level];
        story(
          s,
          id,
          `${r.name} found work again after looking for a new opportunity.`,
        );
      }
    }
    if (c.relation === "rival" && s.week >= c.lastRivalReview + 13) {
      c.lastRivalReview = s.week;
      const player =
        c.field === "music"
          ? s.fame.recognition
          : ["football", "racing", "basketball", "tennis"].includes(c.field)
            ? (c.field === "football" ? s.football : s.sports[c.field])
                .reputation
            : s.skills.business;
      const ahead = player >= c.reputation;
      s.happiness = clamp(s.happiness + (ahead ? 1 : -1));
      story(
        s,
        id,
        `${r.name}'s friendly rivalry: ${ahead ? "your recent progress leads the comparison" : "their recent progress is ahead"}. Careers still depend on actual work and opportunities.`,
      );
    }
  }
  for (const o of s.livingWorld.opportunities) {
    if (o.status === "pending" && o.decisionWeek <= s.week) introduction(s, o);
    if (
      ["pending", "training", "board"].includes(o.status) &&
      o.expiresWeek <= s.week
    )
      o.status = "expired";
  }
}
export function validateLivingWorld(s) {
  const c = s.livingWorld,
    w = (v, min = 0) => Number.isInteger(v) && v >= min && v <= 1e12,
    n = (v) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100,
    str = (v) => typeof v === "string" && v.length > 0 && v.length <= 500;
  const fail = () => {
    throw new Error(
      "Invalid evolving contact careers or introductions in save.",
    );
  };
  if (
    !c ||
    !w(c.seed) ||
    c.seed > 4294967295 ||
    !c.people ||
    Array.isArray(c.people) ||
    Object.keys(c.people).length > 100 ||
    !Array.isArray(c.opportunities) ||
    c.opportunities.length > 20 ||
    !Array.isArray(c.stories) ||
    c.stories.length > 40 ||
    !w(c.serial)
  )
    fail();
  for (const [id, p] of Object.entries(c.people))
    if (
      !s.connections.profiles[id] ||
      !CONTACT_FIELDS.includes(p.field) ||
      !w(p.level) ||
      p.level > 4 ||
      !n(p.talent) ||
      !n(p.reputation) ||
      !["friend", "rival", "collaborator"].includes(p.relation) ||
      !w(p.nextReviewWeek) ||
      !w(p.lastActionWeek, -52) ||
      p.lastActionWeek > s.week ||
      !w(p.lastRivalReview) ||
      p.lastRivalReview > s.week ||
      !w(p.developedWeeks) ||
      !Array.isArray(p.history) ||
      p.history.length > 10 ||
      p.history.some(
        (h) =>
          !w(h.week) ||
          h.week > s.week ||
          !w(h.level) ||
          h.level > 4 ||
          !str(h.title),
      )
    )
      fail();
  for (const o of c.opportunities)
    if (
      !str(o.id) ||
      !c.people[o.personId] ||
      !CONTACT_FIELDS.includes(o.field) ||
      ![
        "pending",
        "refused",
        "introduced",
        "training",
        "board",
        "completed",
        "expired",
      ].includes(o.status) ||
      !w(o.decisionWeek) ||
      !w(o.expiresWeek) ||
      (o.resultId !== null && !str(o.resultId))
    )
      fail();
  if (
    c.stories.some(
      (h) => !w(h.week) || h.week > s.week || !str(h.personId) || !str(h.text),
    )
  )
    fail();
}
