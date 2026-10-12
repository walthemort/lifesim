import { personalityModifier } from "./personality.js";
import { checkContractReview, registerMusicAgreement } from "./contracts.js";
import { milestoneAway } from "./career-milestones.js";
import {
  musicReleaseShare,
  musicAudienceBoost,
  musicTourWeek,
} from "./career-world.js";
import {
  currentMusicManager,
  musicPromotionMultiplier,
  musicManagerCommission,
} from "./career-support.js";
import { musicStudioBonus } from "./career-equipment.js";
import { receiveIncome } from "./banking.js";
import { allocationRatio, spendTime } from "./calendar.js";
import { availableCash, rng } from "./world.js";
export const MUSIC_ROLES = {
  singer: "Singer",
  rapper: "Rapper",
  producer: "Music producer",
};
const skillKey = (role) =>
    ({ singer: "vocals", rapper: "lyrics", producer: "production" })[role],
  clamp = (n) => Math.max(0, Math.min(100, n)),
  round = (n) => Math.round(n * 100) / 100,
  age = (s) => s.startAge + Math.floor(s.week / 52);
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
const action = (s) => {
  if (age(s) < 6) throw new Error("Music lessons start at age six.");
  if (s.ended) throw new Error("This life is complete.");
  if (!s.actions) throw new Error("No free-time actions left.");
};
export function initializeMusic(s) {
  s.music = {
    active: s.aspiration === "music" && age(s) >= 6,
    role: "singer",
    genre: "Pop",
    skills: { vocals: 15, lyrics: 15, production: 15 },
    sessions: 0,
    fans: 0,
    projects: [],
    releases: [],
    gigs: [],
    labelOffers: [],
    label: null,
    nextGigWeek: s.week + 8,
    nextLabelWeek: s.week + 13,
    weeklyIncome: 0,
    totalIncome: 0,
  };
}
export const musicLabel = (s) =>
  s.music.label
    ? "Label artist"
    : s.fame.recognition >= 65 && s.music.releases.length
      ? "Touring artist"
      : s.music.releases.length >= 3
        ? "Independent musician"
        : s.music.sessions >= 12
          ? "Local artist"
          : "Bedroom hobbyist";
export function configureMusic(state, { role, genre }) {
  if (age(state) < 6) throw new Error("Music lessons start at age six.");
  if (state.ended) throw new Error("This life is complete.");
  if (
    !Object.hasOwn(MUSIC_ROLES, role) ||
    !["Pop", "Hip-hop", "Electronic", "Indie", "R&B"].includes(genre)
  )
    throw new Error("Choose a music role and genre.");
  const s = structuredClone(state);
  s.music.active = true;
  s.music.role = role;
  s.music.genre = genre;
  return s;
}
export function practiseMusic(state) {
  action(state);
  if (state.energy < 10) throw new Error("Rest before practising.");
  const s = structuredClone(state),
    m = s.music;
  m.active = true;
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.energy = clamp(s.energy - 4);
  m.sessions++;
  m.skills[skillKey(m.role)] = clamp(
    m.skills[skillKey(m.role)] + 1 + personalityModifier(s, "training") * 0.03,
  );
  for (const key of Object.keys(m.skills))
    if (key !== skillKey(m.role)) m.skills[key] = clamp(m.skills[key] + 0.2);
  s.happiness = clamp(s.happiness + 2);
  log(
    s,
    `Practised ${MUSIC_ROLES[m.role].toLowerCase()} skills. Regular sessions build craft over time.`,
  );
  return s;
}
export function startMusicProject(state, { title }) {
  action(state);
  if (typeof title !== "string" || !title.trim() || title.trim().length > 60)
    throw new Error("Give the release a title of 1–60 characters.");
  if (!state.music.active)
    throw new Error("Choose your music direction first.");
  if (state.music.projects.some((p) => p.status === "recording"))
    throw new Error("Finish the current recording first.");
  if (state.music.sessions < 8)
    throw new Error(
      "Complete at least eight practice sessions before recording.",
    );
  if (
    state.music.role === "producer" &&
    !["laptop", "workstation"].some((i) => state.inventory.includes(i))
  )
    throw new Error("A producer needs a computer.");
  if (
    state.music.role !== "producer" &&
    !["phone", "premium-phone", "microphone"].some((i) =>
      state.inventory.includes(i),
    )
  )
    throw new Error("Recording vocals requires a phone or microphone.");
  if (availableCash(state) < 150)
    throw new Error("Recording and distribution cost $150.");
  const s = structuredClone(state),
    m = s.music;
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.money -= 150;
  const gear =
    (s.inventory.includes("microphone") ? 8 : 0) +
    (s.inventory.includes("workstation") ? 8 : 0) +
    (s.inventory.includes("editing") ? 4 : 0) +
    musicStudioBonus(s);
  const quality = Math.round(
    clamp(
      m.skills[skillKey(m.role)] * 0.65 +
        m.skills.production * 0.2 +
        s.skills.charisma * 0.15 +
        gear,
    ),
  );
  m.projects.push({
    id: `record:${s.week}:${m.projects.length}`,
    title: title.trim(),
    genre: m.genre,
    role: m.role,
    quality,
    status: "recording",
    releaseWeek: s.week + 4,
  });
  m.projects = m.projects.slice(-20);
  log(
    s,
    `Started recording “${title.trim()}”. Release is in four weeks; $150 production and distribution cost paid.`,
  );
  return s;
}
export function bookMusicGig(state, id) {
  action(state);
  if (
    musicTourWeek(state, state.week + 1) ||
    milestoneAway(state, "music", state.week + 1)
  )
    throw new Error("Your tour already has a show booked for next week.");
  const gig = state.music.gigs.find((g) => g.id === id);
  if (!gig || gig.status !== "offered" || gig.expiresWeek <= state.week)
    throw new Error("This gig invitation expired.");
  if (state.music.gigs.some((g) => g.status === "booked"))
    throw new Error("You have a booked performance this week.");
  if (state.energy < 15)
    throw new Error("Recover before booking a performance.");
  const s = structuredClone(state),
    g = s.music.gigs.find((g) => g.id === id);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.energy = clamp(s.energy - 8);
  g.status = "booked";
  g.performanceWeek = s.week + 1;
  log(
    s,
    `Booked ${g.venue}. The performance is next week; payment depends on delivering it.`,
  );
  return s;
}
export function acceptLabelOffer(state, id) {
  action(state);
  const o = state.music.labelOffers.find((o) => o.id === id);
  if (!o || o.status !== "offered" || o.expiresWeek <= state.week)
    throw new Error("Label offer expired.");
  if (state.music.label)
    throw new Error("A label agreement is already active.");
  if (age(state) < 18) throw new Error("Label contracts require age 18+.");
  checkContractReview(state, "music", id);
  const s = structuredClone(state);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.music.labelOffers.find((o) => o.id === id).status = "accepted";
  s.music.label = {
    name: o.name,
    advance: o.advance,
    unrecouped: o.advance,
    share: 0.5,
    expiresWeek: s.week + 52,
  };
  registerMusicAgreement(s, o);
  const commission = musicManagerCommission(s, o.advance);
  receiveIncome(s, o.advance, "earned", { deduction: commission });
  s.money = Math.round((s.money - commission) * 100) / 100;
  log(
    s,
    `Signed with ${o.name}: $${o.advance} advance. Your ${Math.round(s.music.label.share * 100)}% royalty share repays the advance first; the agreement lasts 52 weeks.`,
    "milestone",
  );
  return s;
}
export function advanceMusic(s) {
  const m = s.music;
  m.weeklyIncome = 0;
  if (!m.active) return;
  if (["focus", "study"].includes(s.activity))
    m.skills[skillKey(m.role)] = clamp(
      m.skills[skillKey(m.role)] + 0.12 * allocationRatio(s, "music", 4),
    );
  if (m.label && m.label.expiresWeek <= s.week) {
    log(
      s,
      `${m.label.name} agreement ended. Future royalties are yours; the advance is not a cash loan.`,
    );
    m.label = null;
  }
  for (const p of m.projects) {
    if (p.status === "recording" && allocationRatio(s, "project", 4) < 0.5)
      p.releaseWeek++;
  }
  for (const p of m.projects)
    if (p.status === "recording" && p.releaseWeek <= s.week) {
      p.status = "released";
      const fans = Object.values(s.social.profiles).reduce(
        (n, a) => n + a.followers,
        0,
      );
      const base = Math.round(
        (40 +
          p.quality * 6 +
          fans * 0.015 +
          musicAudienceBoost(s, p.id) * 0.015) *
          (0.4 + rng(s) * 1.2) *
          (m.label ? 1.2 : 1) *
          musicPromotionMultiplier(s),
      );
      const viral = p.quality >= 60 && rng(s) < 0.02;
      const streams = base + (viral ? Math.floor(5000 + rng(s) * 20000) : 0);
      m.fans += Math.floor(streams * 0.005);
      m.releases.push({
        id: p.id,
        title: p.title,
        role: p.role,
        genre: p.genre,
        quality: p.quality,
        releasedWeek: s.week,
        totalStreams: 0,
        weeklyStreams: streams,
        initialStreams: streams,
        totalRoyalties: 0,
      });
      m.releases = m.releases.slice(-20);
      log(
        s,
        `Released “${p.title}”. ${streams.toLocaleString()} first-week streams${viral ? "; a rare breakout beyond your usual listeners" : ""}.`,
        "milestone",
      );
    }
  for (const r of m.releases) {
    if (r.releasedWeek !== s.week) {
      const organic = Math.max(
        0,
        Math.round(r.weeklyStreams * (0.75 + rng(s) * 0.22)),
      );
      const promoted = s.careerSupport.music.campaignUntil > s.week;
      r.weeklyStreams = Math.round(
        organic *
          (promoted ? 1.08 + (currentMusicManager(s)?.skill || 0) * 0.2 : 1),
      );
      if (promoted) m.fans += Math.floor((r.weeklyStreams - organic) * 0.005);
    }
    r.totalStreams += r.weeklyStreams;
    const gross = round(r.weeklyStreams * 0.002 * musicReleaseShare(s, r.id));
    let earned = m.label ? round(gross * m.label.share) : gross;
    if (m.label?.unrecouped > 0) {
      const recoup = Math.min(earned, m.label.unrecouped);
      m.label.unrecouped = round(m.label.unrecouped - recoup);
      earned = round(earned - recoup);
    }
    m.weeklyIncome += earned;
    r.totalRoyalties = round(r.totalRoyalties + earned);
  }
  for (const g of m.gigs) {
    if (g.status === "offered" && g.expiresWeek <= s.week) g.status = "expired";
    if (g.status === "booked" && g.performanceWeek <= s.week) {
      if (
        s.energy >= 10 &&
        rng(s) <
          Math.min(
            0.95,
            0.5 +
              m.skills[skillKey(m.role)] * 0.004 +
              personalityModifier(s, "performance") * 0.005,
          )
      ) {
        g.status = "performed";
        m.fans += Math.floor(15 + s.fame.recognition * 0.5);
        m.weeklyIncome += g.fee;
        s.fame.recognition = clamp(s.fame.recognition + 0.5);
        s.fame.reputation = clamp(s.fame.reputation + 1);
        log(s, `Performed at ${g.venue}; earned $${g.fee}.`, "positive");
      } else {
        g.status = "cancelled";
        s.fame.reputation = clamp(s.fame.reputation - 2);
        log(
          s,
          "The gig could not be delivered. No performance fee was earned.",
          "warning",
        );
      }
    }
  }
  if (s.week >= m.nextGigWeek) {
    m.nextGigWeek = s.week + 8;
    if (
      age(s) >= 14 &&
      m.sessions >= 12 &&
      m.skills[skillKey(m.role)] >= 30 &&
      !m.gigs.some((g) => ["offered", "booked"].includes(g.status)) &&
      rng(s) < 0.45 + (currentMusicManager(s)?.skill || 0)
    ) {
      m.gigs.push({
        id: `gig:${s.week}`,
        venue:
          s.fame.recognition >= 65
            ? "City festival stage"
            : s.fame.recognition >= 35
              ? "Independent live venue"
              : "Community talent night",
        fee: Math.round(60 + s.fame.recognition * 8),
        status: "offered",
        expiresWeek: s.week + 3,
        performanceWeek: null,
      });
      m.gigs = m.gigs.slice(-20);
      log(
        s,
        "A local organiser invited you to perform. Review the gig in your music studio.",
        "milestone",
      );
    }
  }
  for (const o of m.labelOffers)
    if (o.status === "offered" && o.expiresWeek <= s.week) o.status = "expired";
  if (s.week >= m.nextLabelWeek) {
    m.nextLabelWeek = s.week + 13;
    if (
      age(s) >= 18 &&
      !m.label &&
      m.sessions >= 52 &&
      m.releases.length >= 3 &&
      m.skills[skillKey(m.role)] >= 60 &&
      s.fame.recognition >= 35 &&
      !m.labelOffers.some((o) => o.status === "offered") &&
      rng(s) < 0.2 + (currentMusicManager(s)?.skill || 0) * 0.5
    ) {
      m.labelOffers.push({
        id: `label:${s.week}`,
        name: "Northline Independent Records",
        advance: Math.round(1000 + s.fame.recognition * 80),
        status: "offered",
        expiresWeek: s.week + 4,
      });
      m.labelOffers = m.labelOffers.slice(-12);
      log(
        s,
        "An independent label sent an advance and royalty-sharing proposal. Review its terms.",
        "milestone",
      );
    }
  }
  m.weeklyIncome = round(m.weeklyIncome);
  m.totalIncome = round(m.totalIncome + m.weeklyIncome);
  const commission = musicManagerCommission(s, m.weeklyIncome);
  receiveIncome(s, m.weeklyIncome, "earned", { deduction: commission });
  s.money = Math.round((s.money - commission) * 100) / 100;
}
export function validateMusic(s) {
  const m = s.music,
    n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    integer = (v) => n(v) && Number.isInteger(v),
    fail = () => {
      throw new Error("Invalid music career data.");
    };
  if (
    !m ||
    typeof m.active !== "boolean" ||
    !Object.hasOwn(MUSIC_ROLES, m.role) ||
    !["Pop", "Hip-hop", "Electronic", "Indie", "R&B"].includes(m.genre) ||
    ["vocals", "lyrics", "production"].some((k) => !n(m.skills?.[k], 0, 100)) ||
    !integer(m.sessions) ||
    !integer(m.fans) ||
    !n(m.weeklyIncome) ||
    !n(m.totalIncome) ||
    !integer(m.nextGigWeek) ||
    !integer(m.nextLabelWeek) ||
    !Array.isArray(m.projects) ||
    m.projects.length > 20 ||
    !Array.isArray(m.releases) ||
    m.releases.length > 20 ||
    !Array.isArray(m.gigs) ||
    m.gigs.length > 20 ||
    !Array.isArray(m.labelOffers) ||
    m.labelOffers.length > 12
  )
    fail();
  if (
    m.projects.some(
      (p) =>
        typeof p.id !== "string" ||
        typeof p.title !== "string" ||
        p.title.length > 60 ||
        !Object.hasOwn(MUSIC_ROLES, p.role) ||
        !n(p.quality, 0, 100) ||
        !integer(p.releaseWeek) ||
        !["recording", "released"].includes(p.status),
    ) ||
    m.releases.some(
      (r) =>
        typeof r.id !== "string" ||
        typeof r.title !== "string" ||
        r.title.length > 60 ||
        !Object.hasOwn(MUSIC_ROLES, r.role) ||
        !n(r.quality, 0, 100) ||
        !integer(r.releasedWeek) ||
        !integer(r.totalStreams) ||
        !integer(r.weeklyStreams) ||
        !integer(r.initialStreams) ||
        !n(r.totalRoyalties),
    ) ||
    m.gigs.some(
      (g) =>
        typeof g.id !== "string" ||
        typeof g.venue !== "string" ||
        !n(g.fee, 1) ||
        !integer(g.expiresWeek) ||
        !["offered", "booked", "expired", "performed", "cancelled"].includes(
          g.status,
        ) ||
        (g.status === "booked" && !integer(g.performanceWeek)),
    ) ||
    m.labelOffers.some(
      (o) =>
        typeof o.id !== "string" ||
        typeof o.name !== "string" ||
        !n(o.advance, 1) ||
        !integer(o.expiresWeek) ||
        !["offered", "accepted", "expired"].includes(o.status),
    )
  )
    fail();
  if (
    m.label !== null &&
    (typeof m.label?.name !== "string" ||
      !n(m.label.advance, 1) ||
      !n(m.label.unrecouped, 0, m.label.advance) ||
      !n(m.label.share, 0, 1) ||
      !integer(m.label.expiresWeek))
  )
    fail();
}
