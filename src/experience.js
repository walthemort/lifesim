import { rng, availableCash } from "./world.js";
import { spendTime } from "./calendar.js";
import {
  SPORT_DESTINATIONS,
  sportMoveEligibility,
  requestSportMove,
} from "./career-world.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  round = (n) => Math.round(n * 100) / 100;
const note = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
export const SOCIAL_MANAGERS = {
  assistant: {
    name: "Social assistant",
    fee: 150,
    weekly: 60,
    posts: 1,
    quality: 52,
  },
  team: {
    name: "Social media team",
    fee: 800,
    weekly: 240,
    posts: 2,
    quality: 72,
  },
};
export const MUSIC_CAMPAIGNS = {
  grassroots: { name: "Behind-the-scenes rollout", cost: 30, reach: 180 },
  focused: { name: "Release campaign", cost: 150, reach: 1100 },
  press: { name: "Press & playlist campaign", cost: 500, reach: 4500 },
};
export function initializeExperience(s) {
  s.experience = {
    locks: { health: false, energy: false, happiness: false },
    seed: (s.seed ^ 0x582fea) >>> 0,
    serial: 0,
    preparedWeek: s.week,
    lastWeek: s.week,
    manager: null,
    growth: 0,
    scouting: { requests: [], nextWeek: s.week },
    music: {
      history: [],
      campaigns: [],
      chart: Array.from({ length: 30 }, (_, i) => ({
        id: `chart:${i}`,
        title:
          [
            "Afterglow",
            "City Lights",
            "Blue Hour",
            "Orbit",
            "Summer Rain",
            "Slow Motion",
            "Side Streets",
            "Daydream",
            "Home Again",
            "Night Drive",
          ][i % 10] + (i >= 10 ? ` ${Math.floor(i / 10) + 1}` : ""),
        artist: [
          "Nova Lane",
          "The Midnight Club",
          "Amara",
          "Luca North",
          "Solstice",
          "June & Co.",
        ][i % 6],
        streams: Math.round(150 * Math.pow(1.38, 29 - i)),
      })),
    },
  };
}
export function applyGodMode(s) {
  if (s.debug?.enabled && !s.ended)
    for (const [key, on] of Object.entries(s.experience?.locks || {}))
      if (on) s[key] = 100;
  return s;
}
export function setGodModeLock(state, key, enabled) {
  if (!state.debug.enabled)
    throw new Error("Enable debug mode before using God mode.");
  if (
    !["health", "energy", "happiness", "all"].includes(key) ||
    typeof enabled !== "boolean"
  )
    throw new Error("Choose a valid always-full switch.");
  const s = structuredClone(state);
  for (const field of key === "all" ? ["health", "energy", "happiness"] : [key])
    s.experience.locks[field] = enabled;
  s.debug.used = true;
  s.debug.edits.unshift({
    week: s.week,
    text: `God mode: ${key} always full ${enabled ? "on" : "off"}.`,
  });
  s.debug.edits = s.debug.edits.slice(0, 20);
  return applyGodMode(s);
}
function act(state, hours = 2, minAge = 13) {
  if (
    state.ended ||
    state.event ||
    state.globalLife.crime.prison ||
    age(state) < minAge ||
    !state.actions
  )
    throw new Error(
      `Requires age ${minAge}+, a free action and no pending life choice or custody.`,
    );
  const s = structuredClone(state);
  spendTime(s, hours, "Career planning");
  s.actions--;
  return s;
}
export function hireSocialManager(state, id) {
  const d = SOCIAL_MANAGERS[id];
  if (!Object.hasOwn(SOCIAL_MANAGERS, id) || state.experience.manager)
    throw new Error("Choose an available social media manager.");
  if (!Object.values(state.social.profiles).some((p) => p.active))
    throw new Error("Open a social account first.");
  if (availableCash(state) < d.fee + d.weekly)
    throw new Error("Cover the signing fee and one weekly retainer.");
  const s = act(state, 2, 16);
  s.money = round(s.money - d.fee);
  s.experience.manager = {
    id,
    hiredWeek: s.week,
    paid: d.fee,
    lastWeek: s.week,
    paused: false,
    posted: 0,
    note: "Your manager begins next week.",
  };
  return s;
}
export function dismissSocialManager(state) {
  if (!state.experience.manager)
    throw new Error("No social media manager is hired.");
  const s = act(state, 1, 16);
  s.experience.manager = null;
  return s;
}
export function startMusicCampaign(state, { projectId, kind = "grassroots" }) {
  const p = state.music.projects.find(
    (p) => p.id === projectId && p.status !== "released",
  );
  const d = MUSIC_CAMPAIGNS[kind];
  if (!p || !Object.hasOwn(MUSIC_CAMPAIGNS, kind))
    throw new Error("Choose an unreleased recording and a campaign.");
  if (state.experience.music.campaigns.some((c) => c.projectId === projectId))
    throw new Error("This recording already has a rollout.");
  if (state.realWorld.retiredMusic)
    throw new Error("Resume new music work before planning a rollout.");
  if (availableCash(state) < d.cost)
    throw new Error("Fund the full campaign budget first.");
  const s = act(state, 2, 13);
  s.money = round(s.money - d.cost);
  s.experience.music.campaigns.push({
    id: `rollout:${s.experience.serial++}`,
    projectId,
    kind,
    cost: d.cost,
    startsWeek: s.week,
    endsWeek: s.week + 4,
    status: "active",
    reach: 0,
    preSaves: 0,
    usedWeek: null,
  });
  s.experience.music.campaigns = s.experience.music.campaigns.slice(-30);
  return s;
}
export function promotionStreams(s, p) {
  if (!s.experience) return 0;
  let streams = 0;
  for (const c of s.experience.music.campaigns.filter(
    (c) => c.projectId === p.id && c.usedWeek === null,
  )) {
    streams += Math.floor(c.preSaves * (p.quality / 100) * 0.8);
    c.status = "released";
    c.usedWeek = s.week;
  }
  return streams;
}
export function footballMoveOptions(s) {
  return SPORT_DESTINATIONS.football
    .filter((d) => d.name !== s.football.club)
    .map((d) => {
      const options = ["step-up", "transfer", "loan"].map((kind) => ({
        kind,
        ...sportMoveEligibility(s, "football", kind, d.name),
      }));
      const choice =
        options.find((o) => !o.missing.length) ||
        options.find((o) => o.kind === "transfer");
      return { ...d, ...choice };
    });
}
export function approachFootballClub(state, destination) {
  const o = footballMoveOptions(state).find((o) => o.name === destination);
  if (!o) throw new Error("Choose a club from your market.");
  if (o.missing.length)
    throw new Error(`Before approaching this club: ${o.missing.join(", ")}.`);
  return requestSportMove(state, "football", {
    destination,
    kind: o.kind,
    role: "rotation",
  });
}
export function requestYouthAssessment(state) {
  const f = state.football;
  if (
    age(state) < 8 ||
    age(state) > 18 ||
    !["school", "community"].includes(f.stage)
  )
    throw new Error(
      "Youth scouting is for school/local players aged eight to eighteen.",
    );
  if (f.injuryWeeks)
    throw new Error("Recover from injury before a youth assessment.");
  if (f.ability < 30 || f.discipline < 40)
    throw new Error(
      "Develop 30 football ability and 40 discipline before a youth assessment.",
    );
  if (
    state.week < state.experience.scouting.nextWeek ||
    state.experience.scouting.requests.some((r) => r.status === "pending")
  )
    throw new Error("Your next scouting review is not available yet.");
  const s = act(state, 3, 8);
  s.experience.scouting.nextWeek = s.week + 13;
  s.experience.scouting.requests.push({
    week: s.week,
    decisionWeek: s.week + 2,
    status: "pending",
    clubs: [],
  });
  s.experience.scouting.requests = s.experience.scouting.requests.slice(-8);
  return s;
}
function resolveScouting(s) {
  for (const r of s.experience.scouting.requests.filter(
    (r) => r.status === "pending" && r.decisionWeek <= s.week,
  )) {
    const f = s.football;
    if (
      !["school", "community"].includes(f.stage) ||
      age(s) > 18 ||
      f.injuryWeeks ||
      s.globalLife.crime.prison
    ) {
      r.status = "closed";
      continue;
    }
    const potential =
      (f.ability + f.discipline + f.coachTrust + s.skills.athletics) / 4;
    const chance =
      potential >= 95
        ? 0.995
        : potential >= 80
          ? 0.94
          : potential >= 60
            ? 0.8
            : 0.55;
    if (rng(s.experience) >= chance) {
      r.status = "declined";
      note(
        s,
        "Your youth assessment did not lead to a place. Keep playing and improve your preparation.",
        "warning",
      );
      continue;
    }
    const clubs =
      potential >= 85
        ? [
            "Meridian City youth academy",
            "Westbridge United youth academy",
            "Harbor Athletic academy",
          ]
        : potential >= 60
          ? ["Harbor Athletic academy", "Riverside development academy"]
          : ["Riverside community academy"];
    r.status = "offered";
    r.clubs = clubs;
    for (const club of clubs) {
      const id = `youth:${s.experience.serial++}`;
      f.offers.push({
        id,
        kind: "academy",
        club,
        jobId: null,
        pay: 0,
        duration: 104,
        status: "offered",
        expiresWeek: s.week + 4,
      });
    }
    f.offers = f.offers.slice(-12);
    note(
      s,
      `${clubs.length} youth ${clubs.length === 1 ? "academy has" : "academies have"} offered you a place after your assessment. Review them in Development. Youth development does not award a senior contract.`,
      "milestone",
    );
  }
}
function managedPosts(s) {
  const m = s.experience.manager;
  if (!m || m.lastWeek === s.week) return;
  m.lastWeek = s.week;
  m.posted = 0;
  const d = SOCIAL_MANAGERS[m.id];
  if (s.globalLife.crime.prison || availableCash(s) < d.weekly) {
    m.paused = true;
    m.note = "Paused: retainer unavailable or you are in custody.";
    return;
  }
  s.money = round(s.money - d.weekly);
  m.paid = round(m.paid + d.weekly);
  m.paused = false;
  const platforms = Object.entries(s.social.profiles).filter(
    ([id, p]) =>
      p.active &&
      (id === "stream"
        ? s.inventory.some((i) => ["laptop", "workstation"].includes(i))
        : s.inventory.some((i) =>
            ["phone", "premium-phone", "camera"].includes(i),
          )),
  );
  const capacity = Math.max(
    0,
    2 - s.social.posts.filter((p) => p.createdWeek === s.week).length,
  );
  for (const [id] of platforms.slice(0, Math.min(d.posts, capacity))) {
    const cost = { lens: 5, loop: 20, tube: 35, stream: 15 }[id];
    if (availableCash(s) < cost) continue;
    s.money = round(s.money - cost);
    m.paid = round(m.paid + cost);
    m.posted++;
    s.social.posts.push({
      id: `managed:${s.week}:${id}`,
      platform: id,
      approach: "polished",
      quality: d.quality,
      createdWeek: s.week,
      resolveWeek: s.week + 1,
      status: "pending",
      views: 0,
      gained: 0,
      dealId: null,
      public: s.social.privacy === "public",
      managed: true,
    });
  }
  s.social.posts = s.social.posts.slice(-24);
  m.note = m.posted
    ? `${m.posted} regular ${m.posted === 1 ? "post" : "posts"} queued. Production costs paid separately.`
    : "Retainer paid; no eligible equipment/account or the weekly post slots are full.";
}
export function prepareExperience(s) {
  if (!s.experience || s.experience.preparedWeek === s.week) return;
  s.experience.preparedWeek = s.week;
  resolveScouting(s);
  for (const c of s.experience.music.campaigns) {
    if (c.usedWeek !== null) continue;
    const p = s.music.projects.find((p) => p.id === c.projectId);
    if (!p || p.status === "released") {
      c.status = "expired";
      continue;
    }
    if (s.week > c.endsWeek) {
      c.status = "expired";
      continue;
    }
    if (s.globalLife.crime.prison) continue;
    const d = MUSIC_CAMPAIGNS[c.kind],
      manager = s.careerSupport.music.manager ? 1.2 : 1;
    const reach = Math.round(
      d.reach * (0.6 + rng(s.experience) * 0.8) * manager,
    );
    c.reach += reach;
    c.preSaves += Math.floor(reach * (0.015 + p.quality * 0.0005));
  }
  managedPosts(s);
}
export function advanceExperience(s) {
  const x = s.experience;
  if (!x || x.lastWeek === s.week) return;
  x.lastWeek = s.week;
  const sporting = Math.max(
    s.football.stage === "professional" ? s.football.reputation : 0,
    ...Object.values(s.sports).map((p) =>
      p.stage === "professional" ? p.reputation : 0,
    ),
  );
  const publicFame = Math.max(
    s.fame.recognition,
    sporting,
    s.music.fans ? Math.min(100, Math.log10(s.music.fans + 1) * 12) : 0,
  );
  x.growth = 0;
  if (
    age(s) >= 13 &&
    s.social.privacy === "public" &&
    !s.globalLife.crime.prison &&
    publicFame >= 15
  ) {
    for (const p of Object.values(s.social.profiles).filter((p) => p.active)) {
      const gained = Math.min(
        20000,
        Math.floor(
          Math.pow(publicFame - 10, 1.65) * (0.5 + s.fame.reputation / 100),
        ),
      );
      p.followers += gained;
      x.growth += gained;
    }
  }
  const latest = s.social.history.at(-1);
  if (latest?.week === s.week)
    latest.followers = Object.values(s.social.profiles).reduce(
      (n, p) => n + p.followers,
      0,
    );
  const streams = s.music.releases.reduce((n, r) => n + r.weeklyStreams, 0);
  x.music.history.push({
    week: s.week,
    streams,
    royalties: s.music.weeklyIncome,
  });
  x.music.history = x.music.history.slice(-26);
  for (const r of x.music.chart)
    r.streams = Math.max(50, Math.round(r.streams * (0.92 + rng(x) * 0.16)));
}
export function musicChart(s) {
  return [
    ...s.experience.music.chart.map((r) => ({ ...r, own: false })),
    ...s.music.releases
      .filter((r) => r.weeklyStreams > 0)
      .map((r) => ({
        id: r.id,
        title: r.title,
        artist: r.artist || s.globalLife.artistName,
        streams: r.weeklyStreams,
        own: true,
      })),
  ]
    .sort((a, b) => b.streams - a.streams || a.id.localeCompare(b.id))
    .slice(0, 20);
}
export function validateExperience(s) {
  const x = s.experience,
    obj = (v) => v && typeof v === "object" && !Array.isArray(v),
    n = (v, lo = 0, hi = 1e15) => Number.isFinite(v) && v >= lo && v <= hi,
    int = (v, lo = 0, hi = 1e15) => n(v, lo, hi) && Number.isInteger(v),
    arr = (v, max) => Array.isArray(v) && v.length <= max,
    str = (v) => typeof v === "string" && v.length > 0 && v.length <= 100;
  const fail = () => {
    throw new Error(
      "Invalid calendar, music rollout, scouting or social management data.",
    );
  };
  if (
    !int(s.startingYear, 1900, 2100) ||
    !obj(x) ||
    !obj(x.locks) ||
    Object.keys(x.locks).length !== 3 ||
    ["health", "energy", "happiness"].some(
      (k) => typeof x.locks[k] !== "boolean",
    ) ||
    !int(x.seed, 0, 4294967295) ||
    !int(x.serial) ||
    !int(x.lastWeek, 0, s.week) ||
    !int(x.preparedWeek, 0, s.week) ||
    !int(x.growth) ||
    !obj(x.music) ||
    !arr(x.music.history, 26) ||
    !arr(x.music.chart, 30) ||
    x.music.chart.length !== 30 ||
    !arr(x.music.campaigns, 30) ||
    !obj(x.scouting) ||
    !arr(x.scouting.requests, 8) ||
    !int(x.scouting.nextWeek, 0, s.week + 13)
  )
    fail();
  if (
    x.music.history.some(
      (h) =>
        !obj(h) ||
        !int(h.week, 0, s.week) ||
        !int(h.streams) ||
        !n(h.royalties),
    ) ||
    x.music.chart.some(
      (r) =>
        !obj(r) ||
        !str(r.id) ||
        !str(r.title) ||
        !str(r.artist) ||
        !int(r.streams),
    ) ||
    new Set(x.music.chart.map((r) => r.id)).size !== 30
  )
    fail();
  if (
    x.music.campaigns.some(
      (c) =>
        !obj(c) ||
        !str(c.id) ||
        !str(c.projectId) ||
        !Object.hasOwn(MUSIC_CAMPAIGNS, c.kind) ||
        c.cost !== MUSIC_CAMPAIGNS[c.kind].cost ||
        !int(c.startsWeek, 0, s.week) ||
        !int(c.endsWeek, c.startsWeek, s.week + 4) ||
        !["active", "expired", "released"].includes(c.status) ||
        !int(c.reach) ||
        !int(c.preSaves, 0, c.reach) ||
        !(c.usedWeek === null || int(c.usedWeek, c.startsWeek, s.week)),
    ) ||
    new Set(x.music.campaigns.map((c) => c.projectId)).size !==
      x.music.campaigns.length
  )
    fail();
  if (
    x.scouting.requests.some(
      (r) =>
        !obj(r) ||
        !int(r.week, 0, s.week) ||
        !int(r.decisionWeek, r.week, s.week + 2) ||
        !["pending", "closed", "offered", "declined"].includes(r.status) ||
        !arr(r.clubs, 3) ||
        r.clubs.some((c) => !str(c)),
    )
  )
    fail();
  if (
    x.manager !== null &&
    (!obj(x.manager) ||
      !Object.hasOwn(SOCIAL_MANAGERS, x.manager.id) ||
      !int(x.manager.hiredWeek, 0, s.week) ||
      !int(x.manager.lastWeek, 0, s.week) ||
      !n(x.manager.paid) ||
      typeof x.manager.paused !== "boolean" ||
      !int(x.manager.posted, 0, 2) ||
      !str(x.manager.note))
  )
    fail();
}
