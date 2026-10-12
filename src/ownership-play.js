import { BUSINESSES, stakePercent, rng } from "./world.js";
import { spendTime } from "./calendar.js";
const clamp = (n, max = 100) => Math.max(0, Math.min(max, n));
const round = (n) => Math.round(n * 100) / 100;
const asset = (id) => BUSINESSES.find((b) => b.id === id);
const cities = [
  "Westbridge",
  "Northport",
  "Eastbank",
  "Southgate",
  "Kingsford",
  "Oakfield",
  "Hillcrest",
  "Lakeside",
  "Brookdale",
  "Stonehaven",
  "Redwood",
  "Fairview",
  "Brighton",
  "Greenford",
  "Ashford",
  "Highland",
  "Seabrook",
  "Woodbridge",
  "Parkside",
];
const driverNames = [
  "Alex Rivera",
  "Sam Laurent",
  "Riley Chen",
  "Casey Costa",
  "Jordan Rossi",
  "Morgan Silva",
  "Taylor Meyer",
  "Robin Ito",
  "Jamie Novak",
  "Avery Martin",
  "Emery Andersen",
  "Quinn Moreau",
  "Drew Keller",
  "Sage Bennett",
  "Skyler Patel",
  "Reese Tanaka",
  "Blake Wilson",
  "Cameron Lee",
  "Rowan Scott",
  "Finley Clarke",
];
export const OWNER_ROLES = {
  coach: "Coach / operations manager",
  commercial: "Commercial lead",
  talent: "Player, driver or specialist recruitment",
};
export const OWNER_BUDGETS = {
  cautious: "Protect cash reserves",
  balanced: "Balanced operating budget",
  ambitious: "Invest in performance",
};
export const OWNER_GOALS = {
  stability: "Financial stability",
  development: "Long-term development",
  title: "Compete for a title / market leadership",
};
const log = (s, text) => {
  s.log.unshift({ week: s.week, text, kind: "milestone" });
  s.log = s.log.slice(0, 40);
};
function pairings(count) {
  const teams = Array.from({ length: count }, (_, i) => i),
    rounds = [];
  for (let r = 0; r < count - 1; r++) {
    rounds.push(
      Array.from({ length: count / 2 }, (_, i) => ({
        home: r % 2 ? teams[count - 1 - i] : teams[i],
        away: r % 2 ? teams[i] : teams[count - 1 - i],
      })),
    );
    teams.splice(1, 0, teams.pop());
  }
  return [
    ...rounds,
    ...rounds.map((matches) =>
      matches.map((m) => ({ home: m.away, away: m.home })),
    ),
  ];
}
function newCompetition(s, b, history = []) {
  const year = Math.floor(s.week / 52),
    count = b.racing ? 10 : 20,
    base = year * 52;
  const table = Array.from({ length: count }, (_, id) => ({
    id,
    name:
      id === 0
        ? b.name
        : `${cities[id - 1]} ${b.racing ? "Racing" : b.id === "harbor-fc" ? "United" : "FC"}`,
    rating: id === 0 ? s.teams[b.id]?.rating || 40 : 45 + ((id * 7) % 40),
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    for: 0,
    against: 0,
    points: 0,
  }));
  const fixtures = b.racing
    ? Array.from({ length: 22 }, (_, i) => ({
        id: `${b.id}:${year}:${i}`,
        week: base + 3 + i * 2,
        matches: [],
        status: "scheduled",
        result: null,
      }))
    : pairings(count).map((matches, i) => ({
        id: `${b.id}:${year}:${i}`,
        week: base + 1 + i,
        matches,
        status: "scheduled",
        result: null,
      }));
  for (const f of fixtures) if (f.week <= s.week) f.status = "past";
  return {
    year,
    trackedFromWeek: s.week,
    shared: false,
    lastWeek: s.week,
    table,
    drivers:
      b.id === "f1-team"
        ? Array.from({ length: 20 }, (_, id) => ({
            id,
            teamId: id % 10,
            name: driverNames[id],
            played: 0,
            points: 0,
            wins: 0,
          }))
        : [],
    fixtures,
    history,
  };
}
export function initializeOwnershipPlay(s) {
  s.ownershipPlay = {
    seed: (s.seed ^ 0x216bbea3) >>> 0,
    competitions: Object.fromEntries(
      BUSINESSES.filter((b) => b.sporting).map((b) => [
        b.id,
        newCompetition(s, b),
      ]),
    ),
    management: {},
  };
}
export const ownerStandings = (s, id) =>
  [...s.ownershipPlay.competitions[id].table].sort(
    (a, b) =>
      b.points - a.points ||
      b.for - b.against - (a.for - a.against) ||
      (asset(id).racing ? b.wins - a.wins : b.for - a.for) ||
      a.id - b.id,
  );
export const ownerDriverStandings = (s, id) =>
  [...s.ownershipPlay.competitions[id].drivers].sort(
    (a, b) => b.points - a.points || b.wins - a.wins || a.id - b.id,
  );
export const ownerControl = (s, id) =>
  id === "founder" ? !!s.company : !!asset(id) && stakePercent(s, id) > 50;
export function ownerQuote(s, id, role, tier = "experienced") {
  const b = id === "founder" ? s.company : asset(id);
  if (
    !b ||
    !Object.hasOwn(OWNER_ROLES, role) ||
    !["developing", "experienced"].includes(tier)
  )
    throw new Error("Choose a valid management appointment.");
  const weekly = round(
    Math.max(50, b.revenue * 0.015) * (tier === "experienced" ? 1.8 : 1),
  );
  return {
    weekly,
    fee: round(weekly * 4),
    skill: tier === "experienced" ? 70 : 45,
  };
}
function management(s, id) {
  return (s.ownershipPlay.management[id] ||= {
    budget: "balanced",
    goal: "stability",
    staff: [],
    facility: 0,
    project: null,
    history: [],
    lastPlanWeek: null,
  });
}
const finances = (s, id) =>
  id === "founder" ? s.company : s.businessResults[id];
function ownerAction(state, id, label) {
  if (!ownerControl(state, id) || state.ended || state.event || !state.actions)
    throw new Error(
      "Management needs majority ownership, a free action and no pending life choice.",
    );
  const s = structuredClone(state);
  spendTime(s, 2, label);
  s.actions--;
  return s;
}
function remember(s, id, text) {
  const m = management(s, id);
  m.history.unshift({ week: s.week, text });
  m.history = m.history.slice(0, 30);
  log(s, text);
}
export function appointOwnerStaff(state, id, role, tier) {
  const quote = ownerQuote(state, id, role, tier);
  if (state.ownershipPlay.management[id]?.staff.some((p) => p.role === role))
    throw new Error(
      "End the current appointment before recruiting for this role.",
    );
  if (finances(state, id).cash < quote.fee + quote.weekly * 13)
    throw new Error(
      "Company cash must cover the signing fee and thirteen weeks of additional wages.",
    );
  const s = ownerAction(state, id, "Recruit management staff");
  finances(s, id).cash = round(finances(s, id).cash - quote.fee);
  management(s, id).staff.push({
    role,
    tier,
    ...quote,
    signedWeek: s.week,
    expiresWeek: s.week + 52,
  });
  remember(
    s,
    id,
    `Appointed ${OWNER_ROLES[role].toLowerCase()}; company paid $${quote.fee} and owes $${quote.weekly}/week for fifty-two weeks.`,
  );
  return s;
}
export function dismissOwnerStaff(state, id, role) {
  const staff = state.ownershipPlay.management[id]?.staff.find(
    (p) => p.role === role,
  );
  if (!staff) throw new Error("Choose a current staff appointment.");
  const fee = round(
    staff.weekly * Math.min(2, Math.max(0, staff.expiresWeek - state.week)),
  );
  if (finances(state, id).cash < fee)
    throw new Error("Company cash must cover the notice payment.");
  const s = ownerAction(state, id, "End management appointment");
  finances(s, id).cash = round(finances(s, id).cash - fee);
  management(s, id).staff = management(s, id).staff.filter(
    (p) => p.role !== role,
  );
  remember(
    s,
    id,
    `Ended ${OWNER_ROLES[role].toLowerCase()} appointment; $${fee} notice paid from company cash.`,
  );
  return s;
}
export function setOwnerPlan(state, id, { budget, goal }) {
  if (
    !Object.hasOwn(OWNER_BUDGETS, budget) ||
    !Object.hasOwn(OWNER_GOALS, goal)
  )
    throw new Error("Choose a valid budget and long-term goal.");
  if (state.ownershipPlay.management[id]?.lastPlanWeek === state.week)
    throw new Error("Review the operating plan once per week.");
  const s = ownerAction(state, id, "Review ownership operating plan"),
    m = management(s, id);
  Object.assign(m, { budget, goal, lastPlanWeek: s.week });
  return s;
}
export function ownerFacilityQuote(s, id) {
  const m = s.ownershipPlay.management[id],
    b = id === "founder" ? s.company : asset(id);
  if (!b) throw new Error("Choose an owned business.");
  const level = m?.facility || 0;
  return {
    fee: round(Math.max(1000, (b.value || 100000) * 0.005) * (level + 1)),
    upkeep: round(Math.max(10, b.costs * 0.005)),
  };
}
export function upgradeOwnerFacility(state, id) {
  const old = state.ownershipPlay.management[id],
    q = ownerFacilityQuote(state, id);
  if (old?.project || (old?.facility || 0) >= 3)
    throw new Error(
      "Complete the current project; at most three facility upgrades are available.",
    );
  if (finances(state, id).cash < q.fee + q.upkeep * 13)
    throw new Error(
      "Company cash must cover construction and an upkeep reserve.",
    );
  const s = ownerAction(state, id, "Commission facility improvement");
  finances(s, id).cash = round(finances(s, id).cash - q.fee);
  management(s, id).project = {
    level: (old?.facility || 0) + 1,
    finishWeek: s.week + 4,
    paid: q.fee,
    upkeep: q.upkeep,
  };
  remember(
    s,
    id,
    `Commissioned a facility upgrade for $${q.fee}; construction takes four weeks.`,
  );
  return s;
}
export function ownerOperatingAdjustment(s, id, revenue, costs) {
  const m = s.ownershipPlay?.management[id];
  if (!m) return { revenue, costs };
  for (const p of m.staff.filter((p) => p.expiresWeek <= s.week))
    remember(
      s,
      id,
      `${OWNER_ROLES[p.role]} contract expired; additional wages stop.`,
    );
  m.staff = m.staff.filter((p) => p.expiresWeek > s.week);
  if (m.project && m.project.finishWeek <= s.week) {
    m.facility = m.project.level;
    m.project = null;
    remember(
      s,
      id,
      "The facility improvement is complete; upkeep and performance effects now apply.",
    );
  }
  const commercial = m.staff.find((p) => p.role === "commercial"),
    operations = m.staff.find((p) => p.role === "coach");
  const base = id === "founder" ? s.company : asset(id);
  return {
    revenue:
      revenue *
      (1 +
        (commercial?.skill || 0) / 2000 +
        (id === "founder" || !base.sporting ? m.facility * 0.01 : 0)),
    costs:
      costs *
        (m.budget === "ambitious" ? 1.08 : m.budget === "cautious" ? 0.97 : 1) *
        (1 - (operations && !base.sporting ? operations.skill / 7000 : 0)) +
      m.staff.reduce((n, p) => n + p.weekly, 0) +
      m.facility * Math.max(10, base.costs * 0.005),
  };
}
function teamStrength(s, id, c, row) {
  if (row.id !== 0) return row.rating;
  const m = s.ownershipPlay.management[id];
  return clamp(
    (s.teams[id]?.rating || row.rating) +
      (m?.facility || 0) * 2 +
      (m?.staff || [])
        .filter((p) => ["coach", "talent"].includes(p.role))
        .reduce((n, p) => n + p.skill / 20, 0) +
      (m?.budget === "ambitious" ? 2 : m?.budget === "cautious" ? -2 : 0),
    95,
  );
}
function footballRound(s, id, c, f) {
  for (const match of f.matches) {
    const h = c.table[match.home],
      a = c.table[match.away],
      hs = Math.max(
        0,
        Math.round(
          (teamStrength(s, id, c, h) - teamStrength(s, id, c, a) + 10) / 35 +
            rng(s.ownershipPlay) * 3 -
            0.5,
        ),
      ),
      as = Math.max(
        0,
        Math.round(
          (teamStrength(s, id, c, a) - teamStrength(s, id, c, h)) / 35 +
            rng(s.ownershipPlay) * 3 -
            0.5,
        ),
      );
    h.played++;
    a.played++;
    h.for += hs;
    h.against += as;
    a.for += as;
    a.against += hs;
    if (hs === as) {
      h.draws++;
      a.draws++;
      h.points++;
      a.points++;
    } else {
      const winner = hs > as ? h : a,
        loser = hs > as ? a : h;
      winner.wins++;
      winner.points += 3;
      loser.losses++;
    }
    if (h.id === 0 || a.id === 0)
      f.result = {
        won: (h.id === 0 ? hs : as) > (h.id === 0 ? as : hs),
        ownScore: h.id === 0 ? hs : as,
        otherScore: h.id === 0 ? as : hs,
        opponent: h.id === 0 ? a.name : h.name,
        position: 0,
      };
  }
}
function racingRound(s, id, c, f) {
  const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
    f1 = id === "f1-team";
  const field = (f1 ? c.drivers : c.table)
    .map((row) => ({
      id: row.id,
      teamId: f1 ? row.teamId : row.id,
      score:
        teamStrength(s, id, c, c.table[f1 ? row.teamId : row.id]) +
        (rng(s.ownershipPlay) * 2 - 1) * 20,
      dnf: rng(s.ownershipPlay) < 0.03,
    }))
    .sort(
      (a, b) =>
        Number(a.dnf) - Number(b.dnf) || b.score - a.score || a.id - b.id,
    );
  for (const t of c.table) t.played++;
  let won = false,
    position = 0;
  field.forEach((entry, i) => {
    const t = c.table[entry.teamId],
      awarded = entry.dnf ? 0 : points[i] || 0;
    t.points += awarded;
    if (i === 0 && !entry.dnf) t.wins++;
    if (f1) {
      const d = c.drivers[entry.id];
      d.played++;
      d.points += awarded;
      if (i === 0 && !entry.dnf) d.wins++;
    }
    if (entry.teamId === 0) {
      if (!position) position = i + 1;
      if (i === 0 && !entry.dnf) won = true;
    }
  });
  f.result = {
    won,
    ownScore: 0,
    otherScore: 0,
    opponent: `Round ${c.fixtures.indexOf(f) + 1}`,
    position,
  };
}
function sharedCareer(s, b) {
  if (b.racing)
    return b.id === "f1-team" &&
      s.sports.racing.club === b.name &&
      s.sports.racing.contract?.jobId === "racing-4"
      ? "racing"
      : null;
  return s.football.club === b.name && s.football.contract ? "football" : null;
}
export function advanceOwnershipPlay(s) {
  if (!s.ownershipPlay) return;
  for (const b of BUSINESSES.filter((b) => b.sporting)) {
    let c = s.ownershipPlay.competitions[b.id];
    if (c.lastWeek >= s.week) continue;
    if (c.year !== Math.floor(s.week / 52)) {
      const row = ownerStandings(s, b.id).findIndex((t) => t.id === 0) + 1,
        history = [
          {
            year: c.year,
            place: row,
            points: c.table[0].points,
            played: c.table[0].played,
            trackedFromWeek: c.trackedFromWeek,
          },
          ...c.history,
        ].slice(0, 10);
      c = s.ownershipPlay.competitions[b.id] = newCompetition(s, b, history);
    }
    const source = sharedCareer(s, b),
      previousWins = c.table[0].wins,
      wasShared = c.shared;
    if (source) {
      const p = s.seasons[source];
      if (source === "football") c.table = structuredClone(p.table);
      else {
        c.drivers = p.table.map((t) => ({
          id: t.id,
          teamId: t.id % 10,
          name: t.id === 0 ? s.name : driverNames[t.id],
          played: t.played,
          points: t.points,
          wins: t.wins,
        }));
        for (const t of c.table) {
          const drivers = c.drivers.filter((d) => d.teamId === t.id);
          t.played = Math.max(...drivers.map((d) => d.played));
          t.points = drivers.reduce((n, d) => n + d.points, 0);
          t.wins = drivers.reduce((n, d) => n + d.wins, 0);
        }
      }
      c.fixtures = p.fixtures.map((f) => ({
        id: f.id,
        week: f.week,
        matches: structuredClone(f.matches),
        status: f.result
          ? "played"
          : f.status === "scheduled"
            ? "scheduled"
            : "past",
        result: f.result
          ? {
              won:
                source === "football"
                  ? f.result.won
                  : f.result.won ||
                    (f.week === s.week &&
                      wasShared &&
                      c.table[0].wins > previousWins),
              ownScore: f.result.ownScore,
              otherScore: f.result.otherScore,
              position: f.result.position,
              opponent: f.opponent,
            }
          : null,
      }));
      c.shared = true;
    } else {
      c.shared = false;
      for (const f of c.fixtures.filter(
        (f) => f.week === s.week && f.status === "scheduled",
      )) {
        if (b.racing) racingRound(s, b.id, c, f);
        else footballRound(s, b.id, c, f);
        f.status = "played";
      }
    }
    c.lastWeek = s.week;
    const t = s.teams[b.id],
      r = s.businessResults[b.id];
    for (const f of c.fixtures.filter(
      (f) => f.week === s.week && f.status === "played",
    )) {
      if (t) {
        t.races++;
        if (f.result.won) t.wins++;
      }
      if (f.result.won) {
        const bonus = Math.round(b.revenue * 0.1);
        r.profit += bonus;
        r.cash += bonus;
        r.periodProfit += bonus;
        if (t) t.profit = r.profit;
      }
    }
  }
}
export function validateOwnershipPlay(s) {
  const w = s.ownershipPlay,
    n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = Infinity) => n(v, min, max) && Number.isInteger(v),
    list = (v, max) => Array.isArray(v) && v.length <= max;
  const fail = () => {
    throw new Error("Invalid ownership management or competition records.");
  };
  if (!w || !int(w.seed, 0, 4294967295) || !w.competitions || !w.management)
    fail();
  for (const b of BUSINESSES.filter((b) => b.sporting)) {
    const c = w.competitions[b.id],
      count = b.racing ? 10 : 20;
    if (
      !c ||
      !int(c.year, 0, Math.floor(s.week / 52)) ||
      !int(c.trackedFromWeek, 0, s.week) ||
      !int(c.lastWeek, 0, s.week) ||
      typeof c.shared !== "boolean" ||
      !list(c.table, count) ||
      c.table.length !== count ||
      !list(c.fixtures, b.racing ? 22 : 38) ||
      !list(c.history, 10) ||
      !list(c.drivers, b.id === "f1-team" ? 20 : 0)
    )
      fail();
    if (
      c.table.some(
        (t, i) =>
          t.id !== i ||
          typeof t.name !== "string" ||
          t.name.length > 80 ||
          !n(t.rating, 0, 100) ||
          [
            "played",
            "wins",
            "draws",
            "losses",
            "for",
            "against",
            "points",
          ].some((k) => !int(t[k])),
      ) ||
      c.drivers.some(
        (d, i) =>
          d.id !== i ||
          !int(d.teamId, 0, 9) ||
          typeof d.name !== "string" ||
          d.name.length > 80 ||
          ["played", "points", "wins"].some((k) => !int(d[k])),
      )
    )
      fail();
    if (
      c.table.some((t) => t.played > (b.racing ? 22 : 38) || t.wins > t.played)
    )
      fail();
    if (
      !b.racing &&
      (c.table.some(
        (t) =>
          t.wins + t.draws + t.losses !== t.played ||
          t.points !== t.wins * 3 + t.draws,
      ) ||
        c.table.reduce((n, t) => n + t.for, 0) !==
          c.table.reduce((n, t) => n + t.against, 0))
    )
      fail();
    if (
      b.id === "f1-team" &&
      (c.drivers.length !== 20 ||
        c.drivers.some((d) => d.played > 22 || d.wins > d.played) ||
        c.table.some(
          (t) =>
            t.points !==
            c.drivers
              .filter((d) => d.teamId === t.id)
              .reduce((n, d) => n + d.points, 0),
        ))
    )
      fail();
    if (
      c.fixtures.some(
        (f) =>
          typeof f.id !== "string" ||
          !int(f.week) ||
          !list(f.matches, 10) ||
          f.matches.some(
            (m) =>
              !int(m.home, 0, count - 1) ||
              !int(m.away, 0, count - 1) ||
              m.home === m.away,
          ) ||
          !["past", "scheduled", "played"].includes(f.status) ||
          (f.status === "played" &&
            (!f.result ||
              typeof f.result.won !== "boolean" ||
              ["ownScore", "otherScore", "position"].some(
                (k) => !int(f.result[k]),
              ))) ||
          (f.status === "played" && f.week > s.week),
      )
    )
      fail();
    if (
      c.history.some(
        (h) =>
          !int(h.year, 0, c.year) ||
          !int(h.place, 1, count) ||
          !int(h.points) ||
          !int(h.played) ||
          !int(h.trackedFromWeek, 0, s.week),
      )
    )
      fail();
  }
  for (const [id, m] of Object.entries(w.management)) {
    if (
      !(id === "founder" ? s.company : asset(id)) ||
      !Object.hasOwn(OWNER_BUDGETS, m.budget) ||
      !Object.hasOwn(OWNER_GOALS, m.goal) ||
      !int(m.facility, 0, 3) ||
      !list(m.staff, 3) ||
      new Set(m.staff.map((p) => p.role)).size !== m.staff.length ||
      !list(m.history, 30) ||
      !(m.lastPlanWeek === null || int(m.lastPlanWeek, 0, s.week))
    )
      fail();
    for (const p of m.staff) {
      if (
        !Object.hasOwn(OWNER_ROLES, p.role) ||
        !["developing", "experienced"].includes(p.tier) ||
        !int(p.signedWeek, 0, s.week) ||
        p.expiresWeek !== p.signedWeek + 52 ||
        !n(p.weekly, 50) ||
        p.fee !== round(p.weekly * 4) ||
        p.skill !== (p.tier === "experienced" ? 70 : 45)
      )
        fail();
    }
    if (
      m.project !== null &&
      (!int(m.project.level, 1, 3) ||
        m.project.level !== m.facility + 1 ||
        !int(m.project.finishWeek) ||
        !n(m.project.paid, 1000) ||
        !n(m.project.upkeep, 10))
    )
      fail();
    if (
      m.history.some(
        (h) =>
          !int(h.week, 0, s.week) ||
          typeof h.text !== "string" ||
          h.text.length > 240,
      )
    )
      fail();
  }
}
