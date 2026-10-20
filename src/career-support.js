import { availableCash, rng } from "./world.js";
import { spendTime } from "./calendar.js";
import { AGENTS } from "./seasons.js";

export const MUSIC_MANAGERS = [
  {
    id: "local",
    name: "First Track Management",
    fee: 100,
    weekly: 20,
    rate: 0.1,
    fans: 10,
    recognition: 0,
    skill: 0.1,
  },
  {
    id: "regional",
    name: "Northline Artist Management",
    fee: 750,
    weekly: 75,
    rate: 0.12,
    fans: 500,
    recognition: 20,
    skill: 0.2,
  },
  {
    id: "international",
    name: "Global Stage Management",
    fee: 5000,
    weekly: 250,
    rate: 0.15,
    fans: 5000,
    recognition: 60,
    skill: 0.3,
  },
];
const age = (s) =>
    s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52),
  clamp = (n) => Math.max(0, Math.min(100, n)),
  round = (n) => Math.round(n * 100) / 100;
const log = (s, text) => {
  s.log.unshift({ week: s.week, text, kind: "info" });
  s.log = s.log.slice(0, 40);
};
export function initializeCareerSupport(s) {
  s.careerSupport = {
    music: {
      manager: null,
      campaignUntil: 0,
      nextPressWeek: s.week + 8,
      press: [],
      commissionPaid: 0,
    },
    football: { outreachUntil: 0 },
    activities: {},
  };
}
export const currentMusicManager = (s) =>
  MUSIC_MANAGERS.find((m) => m.id === s.careerSupport?.music.manager?.id) ||
  null;
export const careerSupportCosts = (s) => currentMusicManager(s)?.weekly || 0;
export const careerSupportHours = (s, week = s.week) =>
  (s.careerSupport?.music.press || []).filter(
    (p) => p.status === "booked" && p.interviewWeek === week,
  ).length * 3;
export function hireMusicManager(state, id) {
  const m = MUSIC_MANAGERS.find((m) => m.id === id);
  if (
    state.ended ||
    age(state) < 16 ||
    !state.music.active ||
    !state.actions ||
    !m
  )
    throw new Error(
      "Active musicians aged sixteen or older can meet a manager using an action.",
    );
  if (state.careerSupport.music.manager)
    throw new Error("End your current management agreement first.");
  if (
    state.music.sessions < 12 ||
    !state.music.releases.length ||
    state.music.fans < m.fans ||
    state.fame.recognition < m.recognition
  )
    throw new Error(
      `Requires twelve practice sessions, a release, ${m.fans} music fans and ${m.recognition} recognition.`,
    );
  if (availableCash(state) < m.fee)
    throw new Error("Not enough available cash for the management fee.");
  const s = structuredClone(state);
  spendTime(s, 2, "Meet a music manager");
  s.actions--;
  s.money -= m.fee;
  s.careerSupport.music.manager = { id, signedWeek: s.week };
  log(
    s,
    `Signed with ${m.name}: $${m.weekly}/week plus ${m.rate * 100}% of music receipts. Promotion and deal preparation still need your involvement.`,
  );
  return s;
}
export function dismissMusicManager(state) {
  if (state.ended || !state.careerSupport.music.manager)
    throw new Error("No active music management agreement.");
  const s = structuredClone(state);
  s.careerSupport.music.manager = null;
  log(
    s,
    "Ended your music management agreement. Your releases and earned audience remain yours.",
  );
  return s;
}
export function musicManagerCommission(s, gross) {
  const fee = round(gross * (currentMusicManager(s)?.rate || 0));
  s.careerSupport.music.commissionPaid = round(
    s.careerSupport.music.commissionPaid + fee,
  );
  return fee;
}
export const musicPromotionMultiplier = (s) =>
  s.careerSupport.music.campaignUntil > s.week
    ? 1.2 + (currentMusicManager(s)?.skill || 0)
    : 1;
export function footballRecruitmentChance(s, base) {
  const agent = AGENTS.find((a) => a.id === s.seasons?.football.agent?.id);
  return Math.min(
    0.95,
    base +
      (agent?.skill || 0) * 0.5 +
      (s.careerSupport.football.outreachUntil > s.week ? 0.05 : 0),
  );
}
export const CAREER_ACTIVITIES = [
  {
    id: "songwriting",
    path: "music",
    name: "Write lyrics",
    minAge: 6,
    hours: 3,
    cost: 0,
    cooldown: 1,
    description:
      "Work on a verse or song: +0.8 lyrics. Uses one action and 3 energy.",
  },
  {
    id: "mixing",
    path: "music",
    name: "Work on a mix",
    minAge: 12,
    hours: 3,
    cost: 0,
    cooldown: 1,
    description:
      "Practise production on your computer: +0.8 production. Uses one action and 3 energy.",
  },
  {
    id: "vocal-coaching",
    path: "music",
    name: "Book a vocal coach",
    minAge: 12,
    hours: 2,
    cost: 45,
    cooldown: 1,
    description: "A focused lesson: +1 vocals. Uses one action and 3 energy.",
  },
  {
    id: "campaign",
    path: "music",
    name: "Promote a release",
    minAge: 16,
    hours: 3,
    cost: 100,
    cooldown: 4,
    description:
      "A four-week promotion campaign improves streams and the chance of an interview. Your manager increases its reach. Uses one action and 3 energy.",
  },
  {
    id: "label-pitch",
    path: "music",
    name: "Prepare a label pitch",
    minAge: 18,
    hours: 2,
    cost: 0,
    cooldown: 13,
    description:
      "Meet your manager and send your catalogue. Brings the next label review forward; original skill, audience and release requirements still apply.",
  },
  {
    id: "match-analysis",
    path: "football",
    name: "Analyse match footage",
    minAge: 8,
    hours: 2,
    cost: 0,
    cooldown: 1,
    description:
      "Review decisions with your coach: +0.5 ability and +0.5 coach trust. Uses one action and 3 energy.",
  },
  {
    id: "physio",
    path: "football",
    name: "Visit a physiotherapist",
    minAge: 12,
    hours: 2,
    cost: 45,
    cooldown: 1,
    description:
      "Recover one injury week and regain 5 energy after the session. Uses one action and 3 energy.",
  },
  {
    id: "club-outreach",
    path: "football",
    name: "Ask your agent to contact clubs",
    minAge: 16,
    hours: 2,
    cost: 0,
    cooldown: 13,
    description:
      "Send your match record to clubs. Brings scouting forward and improves interest for thirteen weeks. Qualification and playing-history requirements still apply.",
  },
];
export function careerActivityRequirements(s, id) {
  const a = CAREER_ACTIVITIES.find((a) => a.id === id);
  if (!a) return ["a known activity"];
  const missing = [];
  if (age(s) < a.minAge) missing.push(`age ${a.minAge}+`);
  if (a.path === "music" && !s.music.active)
    missing.push("an active music path");
  if (a.path === "football" && ["none", "retired"].includes(s.football.stage))
    missing.push("active football participation");
  if (
    id === "mixing" &&
    !["laptop", "workstation"].some((i) => s.inventory.includes(i))
  )
    missing.push("a computer");
  if (id === "campaign" && !s.music.releases.length)
    missing.push("a released track");
  if (id === "label-pitch" && !currentMusicManager(s))
    missing.push("a music manager");
  if (id === "club-outreach" && !s.seasons.football.agent)
    missing.push("a sports agent");
  const last = s.careerSupport.activities[id];
  if (last !== undefined && s.week < last + a.cooldown)
    missing.push(`${last + a.cooldown - s.week} weeks before repeating`);
  if (availableCash(s) < a.cost) missing.push(`$${a.cost} available cash`);
  return missing;
}
export function careerActivity(state, id) {
  const a = CAREER_ACTIVITIES.find((a) => a.id === id),
    missing = careerActivityRequirements(state, id);
  if (state.ended || state.event || !state.actions || state.energy < 3)
    throw new Error(
      "Resolve life choices and make time and energy for this activity.",
    );
  if (missing.length) throw new Error(`Requires: ${missing.join(", ")}.`);
  const s = structuredClone(state);
  spendTime(s, a.hours, `${a.name}`);
  s.actions--;
  s.money -= a.cost;
  s.energy -= 3;
  s.careerSupport.activities[id] = s.week;
  if (id === "songwriting")
    s.music.skills.lyrics = clamp(s.music.skills.lyrics + 0.8);
  if (id === "mixing")
    s.music.skills.production = clamp(s.music.skills.production + 0.8);
  if (id === "vocal-coaching")
    s.music.skills.vocals = clamp(s.music.skills.vocals + 1);
  if (id === "campaign") s.careerSupport.music.campaignUntil = s.week + 4;
  if (id === "label-pitch")
    s.music.nextLabelWeek = Math.min(s.music.nextLabelWeek, s.week + 1);
  if (id === "match-analysis") {
    s.football.ability = clamp(s.football.ability + 0.5);
    s.football.coachTrust = clamp(s.football.coachTrust + 0.5);
  }
  if (id === "physio") {
    s.football.injuryWeeks = Math.max(0, s.football.injuryWeeks - 1);
    s.energy = clamp(s.energy + 5);
  }
  if (id === "club-outreach") {
    s.careerSupport.football.outreachUntil = s.week + 13;
    s.football.nextScoutWeek = Math.min(s.football.nextScoutWeek, s.week + 1);
  }
  log(s, `${a.name}: ${a.hours} hours${a.cost ? `, $${a.cost}` : ""}.`);
  return s;
}
export function bookMusicInterview(state, id) {
  const press = state.careerSupport.music.press.find((p) => p.id === id);
  if (
    state.ended ||
    state.event ||
    !state.actions ||
    !press ||
    press.status !== "offered" ||
    press.expiresWeek <= state.week
  )
    throw new Error("An available interview and a free action are required.");
  const s = structuredClone(state);
  spendTime(s, 2, "Prepare a music press interview");
  s.actions--;
  const p = s.careerSupport.music.press.find((p) => p.id === id);
  p.status = "booked";
  p.interviewWeek = s.week + 1;
  log(s, `Booked an interview with ${p.outlet} for next week.`);
  return s;
}
export function advanceCareerSupport(s) {
  const m = s.careerSupport.music;
  for (const p of m.press) {
    if (p.status === "offered" && p.expiresWeek <= s.week) p.status = "expired";
    if (p.status === "booked" && p.interviewWeek <= s.week) {
      if (
        s.energy >= 10 &&
        rng(s) < Math.min(0.95, 0.6 + s.skills.charisma * 0.003)
      ) {
        p.status = "completed";
        s.fame.recognition = clamp(s.fame.recognition + 1);
        s.music.fans += Math.round(5 + s.skills.charisma * 0.15);
        log(
          s,
          `Your ${p.outlet} interview introduced your music to new listeners.`,
        );
      } else {
        p.status = "missed";
        s.fame.reputation = clamp(s.fame.reputation - 1);
        log(s, "The interview fell through. No publicity benefit was earned.");
      }
    }
  }
  if (s.week >= m.nextPressWeek) {
    m.nextPressWeek = s.week + 8;
    if (
      age(s) >= 16 &&
      s.music.active &&
      s.music.releases.length &&
      (currentMusicManager(s) || m.campaignUntil > s.week) &&
      !m.press.some((p) => ["offered", "booked"].includes(p.status)) &&
      rng(s) < 0.35 + (currentMusicManager(s)?.skill || 0)
    ) {
      m.press.push({
        id: `press:${s.week}`,
        outlet:
          s.fame.recognition >= 50
            ? "City music magazine"
            : "Local music podcast",
        status: "offered",
        offeredWeek: s.week,
        expiresWeek: s.week + 3,
        interviewWeek: null,
      });
      m.press = m.press.slice(-20);
      log(
        s,
        "A music outlet invited you for an interview. Review it in Music & creativity.",
      );
    }
  }
}
export function validateCareerSupport(s) {
  const c = s.careerSupport,
    n = (v, min = 0, max = 1e12) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = 1e12) => n(v, min, max) && Number.isInteger(v);
  const m = c?.music;
  if (
    !m ||
    !c.football ||
    !int(m.campaignUntil) ||
    !int(m.nextPressWeek) ||
    !n(m.commissionPaid) ||
    !int(c.football.outreachUntil) ||
    !c.activities ||
    Array.isArray(c.activities) ||
    typeof c.activities !== "object" ||
    Object.entries(c.activities).some(
      ([id, w]) =>
        !CAREER_ACTIVITIES.some((a) => a.id === id) || !int(w, 0, s.week),
    ) ||
    (m.manager !== null &&
      (!MUSIC_MANAGERS.some((x) => x.id === m.manager?.id) ||
        !int(m.manager.signedWeek, 0, s.week))) ||
    !Array.isArray(m.press) ||
    m.press.length > 20 ||
    new Set(m.press.map((p) => p.id)).size !== m.press.length ||
    m.press.some(
      (p) =>
        typeof p.id !== "string" ||
        !["Local music podcast", "City music magazine"].includes(p.outlet) ||
        !["offered", "booked", "expired", "completed", "missed"].includes(
          p.status,
        ) ||
        !int(p.offeredWeek, 0, s.week) ||
        !int(p.expiresWeek, p.offeredWeek + 1) ||
        (p.interviewWeek !== null && !int(p.interviewWeek)) ||
        (["booked", "completed", "missed"].includes(p.status) &&
          p.interviewWeek === null),
    )
  )
    throw new Error("Invalid career support data in save.");
}
export function careerSupportScreen(
  s,
  u,
  only = null,
  showRepresentation = true,
) {
  const { panelHeading, e, money } = u;
  const paths = [
    ...(s.music.active ? ["music"] : []),
    ...(!["none", "retired"].includes(s.football.stage) ? ["football"] : []),
  ].filter((p) => !only || p === only);
  return paths
    .map((path) => {
      const manager = currentMusicManager(s),
        agent = AGENTS.find((a) => a.id === s.seasons.football.agent?.id);
      const representation =
        path === "music"
          ? `<h3>Your music manager</h3>${manager ? `<p>${e(manager.name)} · ${money(manager.weekly)}/week · ${manager.rate * 100}% commission on music receipts. ${money(s.careerSupport.music.commissionPaid, 2)} commissions paid.</p><button class="button secondary" data-action="dismiss-music-manager">End management agreement</button>` : `<p class="muted">Managers support promotion, media and label pitches. Hire from age sixteen after twelve practice sessions and a first release.</p><div class="education-grid">${MUSIC_MANAGERS.map((m) => `<article class="education-card"><h3>${e(m.name)}</h3><p>${money(m.fee)} signing fee · ${money(m.weekly)}/week · ${m.rate * 100}% music commission</p><small>Requires ${m.fans} music fans and ${m.recognition} recognition</small><button class="button secondary" data-action="hire-music-manager" data-id="${m.id}" ${age(s) < 16 || s.music.sessions < 12 || !s.music.releases.length || s.music.fans < m.fans || s.fame.recognition < m.recognition || availableCash(s) < m.fee || !s.actions || s.ended ? "disabled" : ""}>Hire manager</button></article>`).join("")}</div>`}`
          : `<h3>Your football agent</h3>${agent ? `<p>${e(agent.name)} · ${agent.rate * 100}% commission on football wages and bonuses. Supports negotiations and club recruitment.</p><button class="button secondary" data-action="dismiss-agent" data-sport="football">End representation</button>` : `<p class="muted">Agents can contact clubs and help negotiate contracts. They still need a convincing playing record.</p><div class="inline-actions">${AGENTS.map((a) => `<button class="button secondary" data-action="hire-agent" data-sport="football" data-id="${a.id}" ${age(s) < 16 || s.football.reputation < a.reputation || availableCash(s) < a.fee || !s.actions || s.ended ? "disabled" : ""}>${e(a.name)} · ${money(a.fee)} · ${a.rate * 100}% commission</button>`).join("")}</div>`}`;
      return `<section class="panel" data-career-support="${path}">${panelHeading(path === "music" ? "Music career & management" : "Football career & representation", "Develop your craft, prepare opportunities and build a professional support network.")}${showRepresentation ? representation : ""}<div class="education-grid">${CAREER_ACTIVITIES.filter(
        (a) => a.path === path,
      )
        .map((a) => {
          const missing = careerActivityRequirements(s, a.id);
          return `<article class="education-card"><h3>${e(a.name)}</h3><p>${e(a.description)}</p><small>${a.hours} hours · ${money(a.cost)}${missing.length ? ` · Requires: ${e(missing.join(", "))}` : ""}</small><button class="button secondary" data-action="career-activity" data-id="${a.id}" ${missing.length || !s.actions || s.event || s.energy < 3 || s.ended ? "disabled" : ""}>${e(a.name)}</button></article>`;
        })
        .join("")}</div>${
        path === "music"
          ? `<h3>Press & interviews</h3><div class="application-list">${
              s.careerSupport.music.press
                .slice()
                .reverse()
                .map(
                  (p) =>
                    `<div class="application-row"><div><strong>${e(p.outlet)}</strong><small>${e(p.status)}${p.status === "offered" ? ` · invitation expires in ${p.expiresWeek - s.week} weeks` : ""}</small></div>${p.status === "offered" ? `<button class="button secondary" data-action="music-interview" data-id="${p.id}" ${!s.actions || s.event || s.ended ? "disabled" : ""}>Book interview</button>` : ""}</div>`,
                )
                .join("") ||
              '<p class="muted">Manager outreach and active promotion can bring press invitations. Interviews take time and may fall through.</p>'
            }</div>`
          : ""
      }</section>`;
    })
    .join("");
}
