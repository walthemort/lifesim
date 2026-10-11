import { footballRecruitmentChance } from "./career-support.js";
import {
  syncSeason,
  enhanceSportOffer,
  checkSportSigning,
  signedSportTerms,
  markSportTraining,
} from "./seasons.js";
import { receiveIncome } from "./banking.js";
import { allocationRatio, spendTime } from "./calendar.js";
import { availableCash, rng, jobDefinition } from "./world.js";
import { EXPERIENCES } from "./catalogue.js";
import {
  initializeSports,
  advanceSports,
  validateSports,
  clearOtherSportContracts,
} from "./sport.js";
import { initializeMusic, advanceMusic, validateMusic } from "./music.js";
export * from "./sport.js";
export * from "./music.js";
export { EXPERIENCES } from "./catalogue.js";
export const PLATFORMS = [
  {
    id: "lens",
    name: "Lens",
    kind: "Photos & everyday stories",
    icon: "camera",
  },
  { id: "loop", name: "Loop", kind: "Short videos", icon: "spark" },
  { id: "tube", name: "ViewTube", kind: "Long-form videos", icon: "video" },
  { id: "stream", name: "Streamroom", kind: "Live streams", icon: "video" },
];
export const FOOTBALL_POSITIONS = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];
export const FOOTBALL_TRAINING = {
  balanced: "Balanced training",
  technical: "Technical development",
  fitness: "Physical conditioning",
  rest: "Recovery week",
};
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n)),
  round = (n) => Math.round(n * 100) / 100;
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
const writable = (s) => {
  if (s.ended) throw new Error("This life is complete.");
};
const action = (s) => {
  writable(s);
  if (!s.actions) throw new Error("No free-time actions left this week.");
};
export function initializeLife(
  s,
  { legacy = false, footballPosition = "Midfielder" } = {},
) {
  const oldPlayer =
    legacy &&
    s.employment &&
    jobDefinition(s.employment.jobId)?.track === "football";
  const level = oldPlayer ? jobDefinition(s.employment.jobId).level : 0;
  initializeSports(s, { legacy });
  initializeMusic(s);
  s.school = { enrolled: age(s) >= 5 && age(s) < 18, grade: 70, weeks: 0 };
  s.football = {
    stage: oldPlayer
      ? level >= 2
        ? "professional"
        : level === 1
          ? "reserve"
          : "community"
      : s.aspiration === "football" && age(s) >= 5
        ? age(s) < 18
          ? "school"
          : "community"
        : "none",
    club: oldPlayer ? jobDefinition(s.employment.jobId).employer : null,
    position: FOOTBALL_POSITIONS.includes(footballPosition)
      ? footballPosition
      : "Midfielder",
    training: "balanced",
    ability: oldPlayer
      ? Math.max(35, s.skills.athletics)
      : Math.max(10, s.skills.athletics * 0.75),
    discipline: 65,
    coachTrust: 50,
    reputation: oldPlayer ? level * 18 : 0,
    schoolWeeks: 0,
    grassrootsWeeks: 0,
    academyWeeks: 0,
    matches: 0,
    goals: 0,
    lastMatch: null,
    injuryWeeks: 0,
    nextScoutWeek: s.week + 13,
    offers: [],
    trial: null,
    contract: oldPlayer
      ? { jobId: s.employment.jobId, expiresWeek: null }
      : null,
  };
  if (s.football.stage === "school") s.football.club = "School football team";
  if (s.football.stage === "community") s.football.club = "Local amateur club";
  s.social = {
    niche:
      s.aspiration === "music"
        ? "music"
        : s.aspiration === "football" && age(s) >= 5
          ? "football"
          : "lifestyle",
    privacy: "public",
    contentSkill: 20,
    profiles: Object.fromEntries(
      PLATFORMS.map((p) => [
        p.id,
        { active: false, followers: 0, engagement: 4, lastPostWeek: -1 },
      ]),
    ),
    posts: [],
    offers: [],
    deals: [],
    weeklyIncome: 0,
    totalIncome: 0,
    nextSponsorWeek: s.week + 13,
    history: [],
  };
  s.fame = { recognition: oldPlayer ? level * 15 : 0, reputation: 65 };
  s.experienceCooldowns = {};
  s.experienceHistory = [];
  if (age(s) < 18)
    s.education.completed = s.education.completed.filter(
      (id) => id !== "school",
    );
  // Recruitment replaces outstanding football applications, while current contracts survive.
  s.vacancies = s.vacancies.filter((v) => {
    const j = jobDefinition(v.jobId);
    return j?.track !== "football" && !(j?.track === "racing" && j.level >= 1);
  });
  for (const a of s.applications)
    if (
      jobDefinition(a.jobId)?.track === "football" ||
      (jobDefinition(a.jobId)?.track === "racing" &&
        jobDefinition(a.jobId).level >= 1)
    ) {
      if (a.status === "pending") a.status = "rejected";
      else if (a.status === "offer") a.status = "declined";
    }
}
export const footballCosts = (s) =>
  s.football.stage === "school"
    ? age(s) < 12
      ? 0
      : 5
    : s.football.stage === "community"
      ? 15
      : 0;
export function joinFootball(state) {
  if (age(state) < 5) throw new Error("School football starts at age five.");
  action(state);
  if (!["none", "retired"].includes(state.football.stage))
    throw new Error("You already participate in football.");
  const s = structuredClone(state),
    f = s.football;
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  f.stage = age(s) < 18 ? "school" : "community";
  f.club = f.stage === "school" ? "School football team" : "Local amateur club";
  f.nextScoutWeek = s.week + 13;
  log(
    s,
    `Joined ${f.club}. Training and matches can lead to scouting; no professional contract is guaranteed.`,
    "milestone",
  );
  syncSeason(s, "football");
  return s;
}
export function configureFootball(state, { position, training }) {
  writable(state);
  if (
    !FOOTBALL_POSITIONS.includes(position) ||
    !Object.hasOwn(FOOTBALL_TRAINING, training)
  )
    throw new Error("Choose a football position and training plan.");
  const s = structuredClone(state);
  s.football.position = position;
  s.football.training = training;
  return s;
}
export function leaveFootball(state) {
  writable(state);
  const s = structuredClone(state),
    f = s.football;
  if (s.employment && jobDefinition(s.employment.jobId).track === "football") {
    s.employment = null;
    s.career = s.company ? "business" : "unemployed";
  }
  f.stage = "retired";
  f.club = null;
  f.contract = null;
  f.trial = null;
  for (const o of f.offers) if (o.status === "offered") o.status = "declined";
  log(
    s,
    "Stepped away from football. Any playing contract and wages have ended.",
    "warning",
  );
  syncSeason(s, "football");
  return s;
}
export function acceptFootballOffer(state, id) {
  action(state);
  const offer = state.football.offers.find((o) => o.id === id);
  if (!offer || offer.status !== "offered" || offer.expiresWeek <= state.week)
    throw new Error("This football invitation has expired.");
  if (state.football.injuryWeeks > 0)
    throw new Error("Recover from your injury before a trial or signing.");
  const s = structuredClone(state),
    f = s.football,
    o = f.offers.find((o) => o.id === id);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  o.status = "accepted";
  if (o.kind.endsWith("trial")) {
    if (f.trial) throw new Error("A trial is already underway.");
    f.trial = {
      offerId: id,
      kind: o.kind,
      club: o.club,
      decisionWeek: s.week + 2,
    };
    log(
      s,
      `Accepted a two-week trial with ${o.club}. Training, ability, discipline, and fitness decide the outcome.`,
    );
  } else if (o.kind === "academy") {
    f.stage = "academy";
    f.club = o.club;
    f.academyWeeks = 0;
    log(
      s,
      `Joined ${o.club}. Continue school while developing; this is not a professional contract.`,
      "milestone",
    );
  } else if (o.kind === "contract") {
    if (age(s) >= 40)
      throw new Error(
        "Professional football recruitment ends at age 40; local football remains available.",
      );
    const j = jobDefinition(o.jobId);
    checkSportSigning(s, "football", o);
    clearOtherSportContracts(s, "football");
    if (age(s) < 16) throw new Error("A playing contract requires age 16+.");
    f.stage = j.level >= 2 ? "professional" : "reserve";
    f.club = o.club;
    f.contract = { jobId: o.jobId, expiresWeek: s.week + o.duration };
    signedSportTerms(s, "football", o);
    s.employment = {
      jobId: o.jobId,
      weeklyPay: o.pay,
      startingPay: o.pay,
      tenure: 0,
      performance: 65,
      nextRaiseWeek: s.week + 13,
      legacy: false,
    };
    s.career = "football";
    s.progress.football.level = j.level;
    s.progress.football.unlocked = true;
    for (const a of s.applications)
      if (a.status === "offer") a.status = "declined";
    log(
      s,
      `Signed a ${o.duration}-week playing contract with ${o.club} for $${o.pay}/week.`,
      "milestone",
    );
  }
  for (const other of f.offers)
    if (other.id !== id && other.status === "offered")
      other.status = "declined";
  syncSeason(s, "football");
  return s;
}
export function declineFootballOffer(state, id) {
  writable(state);
  const s = structuredClone(state),
    o = s.football.offers.find((o) => o.id === id);
  if (!o || o.status !== "offered") throw new Error("Invitation unavailable.");
  o.status = "declined";
  return s;
}
function footballOffer(s, kind, club, jobId = null) {
  const f = s.football;
  const o = {
    id: `football:${kind}:${s.week}`,
    kind,
    club,
    jobId,
    status: "offered",
    expiresWeek: s.week + 4,
    pay: jobId ? Math.round(jobDefinition(jobId).pay * (1 + rng(s) * 0.12)) : 0,
    duration: 104,
  };
  enhanceSportOffer(s, "football", o);
  f.offers.push(o);
  f.offers = f.offers.slice(-12);
  log(
    s,
    `${club} sent you ${kind === "contract" ? "a playing-contract offer" : kind === "academy" ? "an academy place" : "a trial invitation"}. Respond within four weeks.`,
    "milestone",
  );
}
function footballTick(s) {
  const f = s.football;
  for (const o of f.offers)
    if (o.status === "offered" && o.expiresWeek <= s.week) o.status = "expired";
  if (
    f.contract?.expiresWeek !== null &&
    f.contract &&
    f.contract.expiresWeek <= s.week
  ) {
    if (s.employment?.jobId === f.contract.jobId) {
      s.employment = null;
      s.career = s.company ? "business" : "unemployed";
    }
    f.contract = null;
    f.stage = "community";
    f.club = "Local amateur club";
    log(
      s,
      "Your playing contract expired. Club wages have stopped; local football remains available.",
      "warning",
    );
  }
  if (["none", "retired"].includes(f.stage)) return;
  if (
    age(s) >= 40 &&
    ["academy", "reserve", "professional"].includes(f.stage)
  ) {
    const next = leaveFootball(s);
    Object.assign(s, next);
    log(
      s,
      "Retired from playing football at age 40. Your other ventures and audience remain yours.",
      "milestone",
    );
    return;
  }
  if (f.stage === "school" && age(s) >= 18) {
    f.stage = "community";
    f.club = "Local amateur club";
    log(
      s,
      "School football ended. You can continue with a local amateur club.",
    );
  }
  if (f.stage === "academy" && age(s) > 21) {
    f.stage = "community";
    f.club = "Local amateur club";
    log(
      s,
      "Your academy place ended without a senior contract. You can continue locally.",
      "warning",
    );
  }
  if (f.injuryWeeks > 0) {
    f.injuryWeeks--;
    s.energy = clamp(s.energy + 2);
  } else if (availableCash(s) >= footballCosts(s)) {
    s.money -= footballCosts(s);
    markSportTraining(s, "football");
    const recovering = f.training === "rest",
      training =
        f.training === "technical"
          ? 0.6
          : f.training === "fitness"
            ? 0.38
            : 0.3;
    const gear = s.inventory.includes("boots") ? 0.08 : 0,
      kit = s.inventory.includes("training-kit") ? 0.04 : 0;
    f.ability = clamp(
      f.ability +
        (recovering ? 0.05 : training + gear + kit) *
          allocationRatio(s, "football") *
          (s.energy < 25 ? 0.35 : 1) -
        (age(s) > 30 ? 0.12 : 0),
    );
    f.discipline = clamp(f.discipline + (recovering ? -0.1 : 0.12));
    f.coachTrust = clamp(f.coachTrust + (recovering ? -0.3 : 0.2));
    if (f.stage === "school" && allocationRatio(s, "football") >= 0.5)
      f.schoolWeeks++;
    else if (f.stage === "community" && allocationRatio(s, "football") >= 0.5)
      f.grassrootsWeeks++;
    else if (f.stage === "academy" && allocationRatio(s, "football") >= 0.5)
      f.academyWeeks++;
    if (!recovering && allocationRatio(s, "football") >= 0.5) {
      s.energy = clamp(s.energy - (f.training === "fitness" ? 5 : 3));
      s.skills.athletics = clamp(s.skills.athletics + 0.15);
    }
  } else
    log(
      s,
      "Local football fees were unaffordable; participation paused this week.",
      "warning",
    );
  if (f.trial && f.trial.decisionWeek <= s.week) {
    const t = f.trial;
    f.trial = null;
    const success =
      f.injuryWeeks === 0 &&
      rng(s) < clamp(0.1 + f.ability * 0.006 + f.discipline * 0.002, 0.1, 0.85);
    if (success)
      footballOffer(
        s,
        t.kind === "academy-trial" ? "academy" : "contract",
        t.club,
        t.kind === "academy-trial" ? null : "football-1",
      );
    else
      log(
        s,
        `${t.club} did not offer a place after your trial. Keep developing and playing; another opportunity may come.`,
        "warning",
      );
  }
  if (s.week >= f.nextScoutWeek) {
    f.nextScoutWeek = s.week + 13;
    if (
      f.trial ||
      f.offers.some((o) => o.status === "offered") ||
      f.injuryWeeks
    )
      return;
    if (
      f.stage === "community" &&
      age(s) < 40 &&
      s.progress.football.level >= 1 &&
      f.ability >= 55 &&
      rng(s) < footballRecruitmentChance(s, 0.4)
    ) {
      const jobId = `football-${s.progress.football.level}`;
      footballOffer(s, "contract", jobDefinition(jobId).employer, jobId);
    } else if (
      ["school", "community"].includes(f.stage) &&
      age(s) >= 8 &&
      age(s) <= 18 &&
      f.schoolWeeks + f.grassrootsWeeks >= 26 &&
      f.ability >= 30 &&
      f.discipline >= 50 &&
      rng(s) < footballRecruitmentChance(s, 0.35 + f.coachTrust * 0.002)
    )
      footballOffer(s, "academy-trial", "Harbor Athletic academy");
    else if (
      f.stage === "community" &&
      age(s) <= 25 &&
      f.grassrootsWeeks >= 52 &&
      f.ability >= 55 &&
      rng(s) < footballRecruitmentChance(s, 0.3)
    )
      footballOffer(s, "reserve-trial", "Riverside FC development squad");
    else if (
      f.stage === "academy" &&
      age(s) >= 16 &&
      f.academyWeeks >= 52 &&
      f.ability >= 65 &&
      f.coachTrust >= 60 &&
      rng(s) < footballRecruitmentChance(s, 0.4)
    )
      footballOffer(
        s,
        "contract",
        "Harbor Athletic development squad",
        "football-1",
      );
    else if (["reserve", "professional"].includes(f.stage)) {
      const level = s.employment?.jobId
        ? jobDefinition(s.employment.jobId).level
        : 1;
      if (
        level < 2 &&
        f.ability >= 75 &&
        f.matches >= 40 &&
        s.employment?.tenure >= 52 &&
        rng(s) < footballRecruitmentChance(s, 0.4)
      )
        footballOffer(s, "contract", "Riverside FC", "football-2");
      else if (
        level === 2 &&
        age(s) >= 18 &&
        f.ability >= 88 &&
        f.matches >= 100 &&
        f.reputation >= 60 &&
        rng(s) < footballRecruitmentChance(s, 0.25)
      )
        footballOffer(s, "contract", "Harbor Athletic", "football-3");
      else if (
        level === 3 &&
        age(s) >= 20 &&
        f.ability >= 96 &&
        f.matches >= 180 &&
        f.reputation >= 85 &&
        rng(s) < footballRecruitmentChance(s, 0.12)
      )
        footballOffer(
          s,
          "contract",
          "Harbor Athletic international squad",
          "football-4",
        );
      else if (
        f.contract?.expiresWeek &&
        f.contract.expiresWeek - s.week <= 26 &&
        s.employment?.performance >= 55 &&
        rng(s) < footballRecruitmentChance(s, 0.65)
      )
        footballOffer(s, "contract", f.club, f.contract.jobId);
    }
  }
}
export const fameLabel = (s) =>
  s.fame.recognition >= 85
    ? "Internationally famous"
    : s.fame.recognition >= 65
      ? "National name"
      : s.fame.recognition >= 35
        ? "Recognised creator"
        : s.fame.recognition >= 15
          ? "Local following"
          : "Private citizen";
export const totalFollowers = (s) =>
  Object.values(s.social.profiles).reduce((n, p) => n + p.followers, 0);
export function openSocialAccount(state, id) {
  action(state);
  const p = state.social.profiles[id];
  if (!p) throw new Error("Platform unavailable.");
  if (p.active) throw new Error("Account already open.");
  if (age(state) < 13) throw new Error("Social accounts require age 13+.");
  if (
    !["phone", "premium-phone", "laptop", "workstation"].some((i) =>
      state.inventory.includes(i),
    )
  )
    throw new Error("Buy a smartphone or computer before opening an account.");
  const s = structuredClone(state);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.social.profiles[id].active = true;
  log(
    s,
    `Opened a ${PLATFORMS.find((p) => p.id === id).name} account. An audience takes time to build.`,
  );
  return s;
}
export function configureSocial(state, { niche, privacy }) {
  writable(state);
  if (
    !["lifestyle", "football", "business", "gaming", "music"].includes(niche) ||
    !["public", "private"].includes(privacy)
  )
    throw new Error("Choose a niche and privacy setting.");
  const s = structuredClone(state);
  s.social.niche = niche;
  s.social.privacy = privacy;
  return s;
}
export function createPost(
  state,
  { platform, approach = "authentic", sponsored = false },
) {
  action(state);
  const p = state.social.profiles[platform];
  if (!p?.active) throw new Error("Open an account on this platform first.");
  if (!["authentic", "polished", "clickbait"].includes(approach))
    throw new Error("Choose a content approach.");
  if (
    state.social.posts.filter((p) => p.createdWeek === state.week).length >= 2
  )
    throw new Error("You can produce at most two posts per week.");
  if (
    platform === "stream" &&
    !["laptop", "workstation"].some((i) => state.inventory.includes(i))
  )
    throw new Error("Live streams require a computer.");
  if (
    platform !== "stream" &&
    !["phone", "premium-phone", "camera"].some((i) =>
      state.inventory.includes(i),
    )
  )
    throw new Error("Photos and short videos require a phone or camera.");
  const deal = sponsored
    ? state.social.deals.find(
        (d) =>
          d.platform === platform &&
          d.status === "active" &&
          d.deadlineWeek > state.week,
      )
    : null;
  if (sponsored && (!deal || state.social.privacy !== "public"))
    throw new Error(
      "A sponsored post needs an active agreement and a public account.",
    );
  if (deal && state.social.posts.some((p) => p.dealId === deal.id))
    throw new Error("This sponsorship already has a post awaiting delivery.");
  const cost =
    platform === "lens"
      ? 5
      : platform === "loop"
        ? 20
        : platform === "tube"
          ? 35
          : 15;
  if (availableCash(state) < cost)
    throw new Error("Not enough uncommitted cash for production costs.");
  if (state.energy < 10) throw new Error("Rest before creating more content.");
  const s = structuredClone(state);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.money -= cost;
  s.energy = clamp(s.energy - 5);
  const media = s.social;
  const gear = Math.min(
    20,
    (s.inventory.includes("premium-phone") ? 4 : 0) +
      (s.inventory.includes("camera") ? 8 : 0) +
      (s.inventory.includes("microphone") ? 4 : 0) +
      (s.inventory.includes("lighting") ? 4 : 0) +
      (s.inventory.includes("editing") ? 5 : 0) +
      (s.inventory.includes("tripod") ? 2 : 0) +
      (s.inventory.includes("webcam") ? 3 : 0) +
      (s.inventory.includes("workstation") ? 7 : 0),
  );
  const subject =
    media.niche === "football"
      ? s.football.ability * 0.2
      : media.niche === "business"
        ? s.skills.business * 0.2
        : media.niche === "music"
          ? s.inventory.some((i) => ["piano", "guitar"].includes(i))
            ? 12
            : 0
          : media.niche === "gaming"
            ? s.inventory.includes("console")
              ? 12
              : 0
            : 6;
  const quality = Math.round(
    clamp(
      10 +
        media.contentSkill * 0.4 +
        s.skills.charisma * 0.2 +
        gear +
        subject +
        (approach === "polished" ? 10 : 0),
    ),
  );
  const reputationDelta =
    approach === "clickbait" ? -5 : approach === "authentic" ? 1 : 0;
  s.fame.reputation = clamp(s.fame.reputation + reputationDelta);
  media.contentSkill = clamp(media.contentSkill + 0.6);
  media.posts.push({
    id: `post:${s.week}:${media.posts.filter((p) => p.createdWeek === s.week).length}:${platform}`,
    platform,
    approach,
    quality,
    createdWeek: s.week,
    resolveWeek: s.week + 1,
    status: "pending",
    views: 0,
    gained: 0,
    dealId: deal?.id || null,
    public: media.privacy === "public",
  });
  media.posts = media.posts.slice(-24);
  log(
    s,
    `Published ${sponsored ? "a labelled sponsored post" : "new content"} on ${PLATFORMS.find((p) => p.id === platform).name}. Results arrive next week; production cost $${cost}.`,
  );
  return s;
}
export function acceptSponsor(state, id) {
  action(state);
  const o = state.social.offers.find((o) => o.id === id);
  if (!o || o.status !== "offered" || o.expiresWeek <= state.week)
    throw new Error("This sponsorship offer expired.");
  if (state.social.privacy !== "public" || state.fame.reputation < 60)
    throw new Error(
      "Sponsors require public content and at least 60 reputation.",
    );
  if (state.social.deals.some((d) => d.status === "active"))
    throw new Error("Complete the current sponsorship first.");
  const s = structuredClone(state);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  const offer = s.social.offers.find((o) => o.id === id);
  offer.status = "accepted";
  s.social.deals.push({
    id: `deal:${id}`,
    platform: o.platform,
    brand: o.brand,
    fee: o.fee,
    status: "active",
    deadlineWeek: s.week + 3,
  });
  s.social.deals = s.social.deals.slice(-20);
  log(
    s,
    `${o.brand} agreement accepted. Deliver one labelled public post on ${PLATFORMS.find((p) => p.id === o.platform).name} within three weeks. Payment follows delivery.`,
  );
  return s;
}
function socialTick(s) {
  const m = s.social;
  m.weeklyIncome = 0;
  for (const post of m.posts)
    if (post.status === "pending" && post.resolveWeek <= s.week) {
      const discoverable = post.public && m.privacy === "public";
      const p = m.profiles[post.platform],
        viral =
          discoverable &&
          post.quality >= 50 &&
          s.fame.reputation >= 50 &&
          rng(s) < 0.02;
      const base =
        (30 + post.quality * 3 + p.followers * (0.08 + rng(s) * 0.14)) *
        (post.approach === "clickbait" ? 1.7 : 1);
      post.views = Math.round(
        discoverable
          ? viral
            ? base + 5000 + rng(s) * 80000
            : base * (0.3 + rng(s) * 1.3)
          : Math.min(p.followers, base),
      );
      post.gained =
        discoverable && rng(s) > 0.1
          ? Math.min(
              10000,
              Math.floor(
                post.views *
                  (0.006 + post.quality * 0.0002) *
                  (s.fame.reputation / 100),
              ),
            )
          : 0;
      p.followers += post.gained;
      p.lastPostWeek = s.week;
      p.engagement = round(
        clamp(1 + post.quality * 0.08 + (rng(s) * 2 - 1), 0.5, 12),
      );
      post.status = "resolved";
      const d = post.dealId ? m.deals.find((d) => d.id === post.dealId) : null;
      if (
        d?.status === "active" &&
        post.public &&
        m.privacy === "public" &&
        post.quality >= 35
      ) {
        d.status = "completed";
        m.weeklyIncome += d.fee;
        log(
          s,
          `${d.brand} paid $${d.fee} after sponsored content was delivered.`,
          "positive",
        );
      } else if (d?.status === "active") {
        d.status = "failed";
        s.fame.reputation = clamp(s.fame.reputation - 4);
        log(
          s,
          "A sponsored post failed its public-content or quality requirement. No payment was made.",
          "warning",
        );
      }
      if (viral)
        log(
          s,
          "One of your posts broke out beyond your usual audience. Most posts will have much smaller reach.",
          "milestone",
        );
    }
  for (const [id, p] of Object.entries(m.profiles))
    if (p.active) {
      if (p.lastPostWeek >= 0 && s.week - p.lastPostWeek > 4)
        p.followers = Math.max(0, Math.floor(p.followers * 0.997));
      if (
        m.privacy === "public" &&
        s.week - p.lastPostWeek <= 4 &&
        p.followers >= 1000 &&
        s.fame.reputation >= 50
      )
        m.weeklyIncome += round((p.followers * 0.0008 * p.engagement) / 5);
      if (
        s.football.stage === "professional" &&
        s.football.lastMatch?.week === s.week &&
        m.privacy === "public"
      )
        p.followers += Math.floor(s.football.reputation * 0.3);
    }
  for (const o of m.offers)
    if (o.status === "offered" && o.expiresWeek <= s.week) o.status = "expired";
  for (const d of m.deals)
    if (d.status === "active" && d.deadlineWeek <= s.week) {
      d.status = "failed";
      s.fame.reputation = clamp(s.fame.reputation - 6);
      log(
        s,
        `Missed the ${d.brand} sponsorship deadline. No fee was earned.`,
        "warning",
      );
    }
  if (s.week >= m.nextSponsorWeek) {
    m.nextSponsorWeek = s.week + 13;
    const eligible = Object.entries(m.profiles).filter(
      ([, p]) =>
        p.active && p.followers >= 5000 && s.week - p.lastPostWeek <= 4,
    );
    if (
      m.privacy === "public" &&
      s.fame.reputation >= 65 &&
      eligible.length &&
      !m.offers.some((o) => o.status === "offered") &&
      !m.deals.some((d) => d.status === "active") &&
      rng(s) < 0.35
    ) {
      const [platform, p] = eligible[Math.floor(rng(s) * eligible.length)];
      m.offers.push({
        id: `sponsor:${s.week}`,
        platform,
        brand: ["Daybreak Apparel", "Northline Audio", "Motion Sports"][
          Math.floor(rng(s) * 3)
        ],
        fee: Math.round(clamp(p.followers * 0.008, 200, 25000)),
        status: "offered",
        expiresWeek: s.week + 4,
      });
      m.offers = m.offers.slice(-20);
      log(
        s,
        "A brand has offered a paid collaboration. Check its deliverables and deadline on the social screen.",
        "milestone",
      );
    }
  }
  m.weeklyIncome = round(m.weeklyIncome);
  m.totalIncome = round(m.totalIncome + m.weeklyIncome);
  receiveIncome(s, m.weeklyIncome, "earned");
  const sporting = Math.max(
      s.football.stage === "professional" ? s.football.reputation : 0,
      ...Object.values(s.sports).map((p) =>
        p.stage === "professional" ? p.reputation : 0,
      ),
      s.music.fans ? Math.log10(s.music.fans + 1) * 11 : 0,
    ),
    target = Math.min(
      100,
      Math.max(
        sporting,
        totalFollowers(s) ? Math.log10(totalFollowers(s) + 1) * 11 : 0,
      ),
    );
  s.fame.recognition = round(clamp(s.fame.recognition * 0.92 + target * 0.08));
  m.history.push({ week: s.week, followers: totalFollowers(s) });
  m.history = m.history.slice(-26);
}
export function takeExperience(state, id) {
  action(state);
  const e = EXPERIENCES.find((e) => e.id === id);
  if (!e) throw new Error("Experience unavailable.");
  if (age(state) < (e.minAge || 12))
    throw new Error(`This experience requires age ${e.minAge}+. `);
  if ((state.experienceCooldowns[id] || 0) > state.week)
    throw new Error("This experience is not available again yet.");
  if (availableCash(state) < e.price)
    throw new Error("Not enough uncommitted cash.");
  if (
    e.football &&
    !["school", "community", "academy"].includes(state.football.stage)
  )
    throw new Error("The camp is for active grassroots or academy players.");
  const s = structuredClone(state);
  spendTime(s, 3, "Sport, music or social activity");
  s.actions--;
  s.money -= e.price;
  s.experienceCooldowns[id] = s.week + e.cooldown;
  s.experienceHistory.unshift({ id, week: s.week, paid: e.price });
  s.experienceHistory = s.experienceHistory.slice(0, 32);
  s.happiness = clamp(s.happiness + (e.happiness || 0));
  s.energy = clamp(s.energy + (e.energy || 0));
  s.skills.charisma = clamp(s.skills.charisma + (e.charisma || 0));
  s.social.contentSkill = clamp(s.social.contentSkill + (e.content || 0));
  if (e.football) s.football.ability = clamp(s.football.ability + e.football);
  if (e.bond) for (const r of s.relationships) r.bond = clamp(r.bond + e.bond);
  log(s, `${e.name}: spent $${e.price} and one free-time action.`, "positive");
  return s;
}
export function advanceLife(s) {
  if (s.school.enrolled) {
    s.school.weeks++;
    s.school.grade = clamp(
      s.school.grade +
        (s.activity === "study" ? 0.12 : s.activity === "focus" ? -0.08 : 0.03),
    );
    if (age(s) >= 18) {
      s.school.enrolled = false;
      if (s.school.grade >= 50) {
        if (!s.education.completed.includes("school"))
          s.education.completed.push("school");
        log(
          s,
          "Finished secondary school. Your qualification now counts in job applications.",
          "milestone",
        );
      } else
        log(
          s,
          "School ended without a passing qualification. An equivalency programme is available.",
          "warning",
        );
    }
  }
  footballTick(s);
  advanceSports(s);
  advanceMusic(s);
  socialTick(s);
}
export function validateLife(s) {
  validateSports(s);
  validateMusic(s);
  const n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    integer = (v, min = 0, max = Infinity) =>
      n(v, min, max) && Number.isInteger(v),
    list = (v, max) => Array.isArray(v) && v.length <= max;
  const fail = () => {
    throw new Error(
      "Invalid football, school, social, or experience data in save.",
    );
  };
  if (
    !s.school ||
    typeof s.school.enrolled !== "boolean" ||
    !n(s.school.grade, 0, 100) ||
    !integer(s.school.weeks)
  )
    fail();
  const f = s.football;
  if (
    !f ||
    ![
      "none",
      "school",
      "community",
      "academy",
      "reserve",
      "professional",
      "retired",
    ].includes(f.stage) ||
    !(f.club === null || typeof f.club === "string") ||
    !FOOTBALL_POSITIONS.includes(f.position) ||
    !Object.hasOwn(FOOTBALL_TRAINING, f.training) ||
    ["ability", "discipline", "coachTrust", "reputation"].some(
      (k) => !n(f[k], 0, 100),
    ) ||
    [
      "schoolWeeks",
      "grassrootsWeeks",
      "academyWeeks",
      "matches",
      "goals",
      "injuryWeeks",
      "nextScoutWeek",
    ].some((k) => !integer(f[k])) ||
    !list(f.offers, 12)
  )
    fail();
  if (
    f.lastMatch !== null &&
    (!integer(f.lastMatch?.week) ||
      !n(f.lastMatch?.rating, 0, 100) ||
      !integer(f.lastMatch?.goals))
  )
    fail();
  if (
    f.offers.some(
      (o) =>
        typeof o.id !== "string" ||
        typeof o.club !== "string" ||
        !["academy-trial", "reserve-trial", "academy", "contract"].includes(
          o.kind,
        ) ||
        !["offered", "accepted", "declined", "expired"].includes(o.status) ||
        !integer(o.expiresWeek) ||
        !n(o.pay) ||
        !integer(o.duration, 1) ||
        (o.kind === "contract" && jobDefinition(o.jobId)?.track !== "football"),
    )
  )
    fail();
  if (
    f.trial !== null &&
    (!["academy-trial", "reserve-trial"].includes(f.trial?.kind) ||
      typeof f.trial?.club !== "string" ||
      !integer(f.trial?.decisionWeek) ||
      !f.offers.some(
        (o) => o.id === f.trial.offerId && o.status === "accepted",
      ))
  )
    fail();
  if (
    f.contract !== null &&
    (jobDefinition(f.contract?.jobId)?.track !== "football" ||
      !(f.contract.expiresWeek === null || integer(f.contract.expiresWeek)) ||
      s.employment?.jobId !== f.contract.jobId)
  )
    fail();
  const m = s.social;
  if (
    !m ||
    !["lifestyle", "football", "business", "gaming", "music"].includes(
      m.niche,
    ) ||
    !["public", "private"].includes(m.privacy) ||
    !n(m.contentSkill, 0, 100) ||
    !n(m.weeklyIncome) ||
    !n(m.totalIncome) ||
    !integer(m.nextSponsorWeek) ||
    !list(m.posts, 24) ||
    !list(m.offers, 20) ||
    !list(m.deals, 20) ||
    !list(m.history, 26) ||
    !s.fame ||
    !n(s.fame.recognition, 0, 100) ||
    !n(s.fame.reputation, 0, 100)
  )
    fail();
  for (const p of PLATFORMS) {
    const account = m.profiles?.[p.id];
    if (
      !account ||
      typeof account.active !== "boolean" ||
      !integer(account.followers) ||
      !n(account.engagement, 0, 100) ||
      !integer(account.lastPostWeek, -1)
    )
      fail();
  }
  if (
    m.posts.some(
      (p) =>
        typeof p.id !== "string" ||
        !Object.hasOwn(m.profiles, p.platform) ||
        !["authentic", "polished", "clickbait"].includes(p.approach) ||
        !n(p.quality, 0, 100) ||
        !integer(p.createdWeek) ||
        !integer(p.resolveWeek) ||
        !["pending", "resolved"].includes(p.status) ||
        !integer(p.views) ||
        !integer(p.gained) ||
        typeof p.public !== "boolean" ||
        !(p.dealId === null || typeof p.dealId === "string"),
    ) ||
    m.offers.some(
      (o) =>
        typeof o.id !== "string" ||
        !Object.hasOwn(m.profiles, o.platform) ||
        typeof o.brand !== "string" ||
        !n(o.fee, 1) ||
        !integer(o.expiresWeek) ||
        !["offered", "accepted", "expired"].includes(o.status),
    ) ||
    m.deals.some(
      (d) =>
        typeof d.id !== "string" ||
        typeof d.brand !== "string" ||
        !Object.hasOwn(m.profiles, d.platform) ||
        !n(d.fee, 1) ||
        !integer(d.deadlineWeek) ||
        !["active", "completed", "failed"].includes(d.status),
    ) ||
    m.history.some((h) => !integer(h.week) || !integer(h.followers))
  )
    fail();
  if (
    !s.experienceCooldowns ||
    Object.entries(s.experienceCooldowns).some(
      ([id, w]) => !EXPERIENCES.some((e) => e.id === id) || !integer(w),
    ) ||
    !list(s.experienceHistory, 32) ||
    s.experienceHistory.some(
      (h) =>
        !EXPERIENCES.some((e) => e.id === h.id) ||
        !integer(h.week) ||
        !n(h.paid),
    )
  )
    fail();
}
