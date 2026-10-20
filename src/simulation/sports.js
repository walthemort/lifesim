import { jobDefinition } from "../world.js";
import { assertCareerPath } from "../career-commitment.js";
import { receiveIncome } from "../banking.js";
import {
  act,
  age,
  clamp,
  round,
  roll,
  hash,
  uid,
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
export const TENNIS_ENTRIES = {
  club: { name: "Club circuit", fee: 20, min: 0, award: [100, 60, 30, 10] },
  qualifying: {
    name: "Regional qualifying draw",
    fee: 100,
    min: 25,
    award: [250, 150, 75, 25],
  },
  tour: {
    name: "International main draw",
    fee: 500,
    min: 60,
    award: [500, 300, 150, 50],
  },
};
export function initializeDetailedSports(s) {
  return {
    lastWeek: s.week,
    football: {
      active: false,
      roster: [],
      links: [],
      matches: [],
      yellow: 0,
      suspended: 0,
      minutes: 0,
      actions: {},
    },
    basketball: {
      active: false,
      roster: [],
      matches: [],
      cap: 0,
      minutes: 0,
      assignment: null,
      actions: {},
    },
    tennis: {
      active: false,
      entries: [],
      results: [],
      points: 0,
      ranking: null,
      actions: {},
    },
    boxing: {
      stage: "none",
      gym: null,
      medicalUntil: 0,
      training: 0,
      conditioning: 30,
      technique: 10,
      defence: 10,
      bouts: [],
      offer: null,
      injuryUntil: 0,
      actions: {},
    },
  };
}
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
function activeSport(s, id) {
  if (
    !["football", "basketball", "tennis"].includes(id) ||
    ["none", "retired"].includes(actor(s, id).stage)
  )
    throw new Error("Join this sport through its development pathway first.");
  assertCareerPath(s, id);
  return actor(s, id);
}
export function openDetailedSport(state, id) {
  activeSport(state, id);
  if (state.simulation.sports[id].active)
    throw new Error("Detailed sport records are already active.");
  const s = act(state, { minAge: 6, hours: 1 }),
    d = s.simulation.sports[id];
  d.active = true;
  if (id === "basketball")
    d.cap = basketballPayrollLimit(s.sports.basketball.contract?.jobId);
  if (id !== "tennis") {
    d.roster = Array.from({ length: id === "football" ? 11 : 14 }, (_, i) => ({
      id: i === 0 ? "player" : `athlete:${i}`,
      name:
        i === 0
          ? s.name
          : `${["Alex", "Sam", "Robin", "Noor", "Jules", "Morgan", "Avery"][i % 7]} ${["Chen", "Okafor", "Rossi", "Jensen"][Math.floor(i / 7)]}`,
      role:
        i === 0
          ? "Your place"
          : id === "football"
            ? i < 4
              ? "Defender"
              : i < 8
                ? "Midfielder"
                : "Forward"
            : i % 3 === 0
              ? "Centre"
              : i % 3 === 1
                ? "Guard"
                : "Forward",
      ability:
        i === 0
          ? actor(s, id).ability
          : 40 + (hash(`${s.simulation.originSeed}:${id}:${i}`) % 45),
      salary:
        i === 0
          ? (s.employment?.weeklyPay || 0) * 52
          : !actor(s, id).contract
            ? 0
            : id === "basketball"
              ? Math.round(d.cap * (0.025 + (hash(`${id}:${i}`) % 8) * 0.002))
              : 15000 *
                (jobDefinition(actor(s, id).contract.jobId)?.level || 1),
      expires: s.week + 52 * (1 + (i % 3)),
      chemistry: 50,
      guaranteed: i % 3 !== 0,
    }));
    if (id === "football")
      d.links = d.roster
        .filter((p) => p.id !== "player")
        .map((p) => ({
          a: "player",
          b: p.id,
          trust: 50,
          passes: 0,
          completed: 0,
        }));
  }
  return s;
}
export function footballCombination(state, teammate) {
  activeSport(state, "football");
  const d = state.simulation.sports.football;
  if (!d.active || !d.links.some((l) => l.b === teammate))
    throw new Error("Choose a teammate from the current passing network.");
  const s = act(state, { minAge: 6, hours: 3, energy: 8 }),
    n = s.simulation.sports.football;
  once(s, n.actions, "combination");
  const l = n.links.find((l) => l.b === teammate);
  l.trust = clamp(l.trust + 3);
  return s;
}
export function appealFootballCard(state) {
  const d = state.simulation.sports.football;
  if (!d.active || !d.suspended)
    throw new Error("No current suspension to appeal.");
  const s = act(state, { minAge: 6, hours: 2 }),
    n = s.simulation.sports.football;
  once(s, n.actions, "appeal", 4);
  const accepted = roll(s) < 0.15;
  if (accepted) n.suspended = 0;
  note(
    s,
    accepted
      ? "The disciplinary panel rescinded the suspension after review."
      : "The panel upheld the recorded suspension.",
  );
  return s;
}
export function sportSelection(s, id, selected, eligible) {
  const d = s.simulation?.sports[id];
  if (!d?.active || !["football", "basketball"].includes(id)) return selected;
  d.minutes = 0;
  if (id === "football" && d.suspended > 0) {
    d.suspended--;
    note(s, "A football suspension ruled you out of this fixture.");
    return false;
  }
  if (id === "basketball" && d.assignment && d.assignment.until >= s.week)
    return false;
  if (!eligible) return false;
  const p = actor(s, id);
  if (selected)
    d.minutes =
      id === "football"
        ? p.contract?.role === "development"
          ? 55
          : 90
        : p.contract?.role === "starter"
          ? 34
          : 24;
  else if (roll(s) < 0.2 + (p.coachTrust || p.discipline || 50) / 200)
    d.minutes =
      id === "football"
        ? 10 + Math.floor(roll(s) * 21)
        : 6 + Math.floor(roll(s) * 13);
  return d.minutes > 0;
}
export function detailedTeamMatch(s, id, path, fixture, match, selected) {
  const d = s.simulation?.sports[id];
  if (!d?.active || (match.home !== 0 && match.away !== 0)) return null;
  const ownHome = match.home === 0,
    opponent = path.table[ownHome ? match.away : match.home],
    p = actor(s, id);
  let own = 0,
    other = 0;
  const events = [],
    stats = {
      points: 0,
      assists: 0,
      rebounds: 0,
      turnovers: 0,
      fouls: 0,
      passes: 0,
      completed: 0,
      minutes: selected ? d.minutes : 0,
    };
  if (id === "football") {
    let sentOff = false;
    for (let minute = 1; minute <= 90; minute++) {
      if (roll(s) < 0.1) {
        const involved = selected && !sentOff && minute > 90 - d.minutes,
          link = involved
            ? d.links[Math.floor(roll(s) * d.links.length)]
            : null,
          trust = link ? link.trust : 50,
          success =
            roll(s) <
            clamp(
              0.5 + (p.ability - opponent.rating) / 250 + trust / 400,
              0.25,
              0.93,
            );
        if (link) {
          link.passes++;
          stats.passes++;
          if (success) {
            link.completed++;
            stats.completed++;
            link.trust = clamp(link.trust + 0.05);
          } else link.trust = clamp(link.trust - 0.08);
        }
        if (success && roll(s) < 0.17) {
          own++;
          events.push({
            minute,
            text: involved
              ? "Combination creates a goal"
              : "Team attack converted",
          });
        }
      }
      if (
        roll(s) <
        0.015 + Math.max(0, opponent.rating - path.table[0].rating) / 5000
      )
        other++;
      if (
        selected &&
        !sentOff &&
        minute > 90 - d.minutes &&
        roll(s) < (100 - p.discipline) / 25000 + 0.0007
      ) {
        stats.fouls++;
        if (roll(s) < 0.08) {
          d.suspended += 3;
          stats.minutes = Math.max(1, minute - (90 - d.minutes));
          events.push({
            minute,
            text: "Straight red card; three-match suspension",
          });
          sentOff = true;
          continue;
        }
        d.yellow++;
        events.push({ minute, text: "Yellow card" });
        if (stats.fouls >= 2) {
          d.suspended++;
          events.push({ minute, text: "Second caution; sent off" });
          stats.minutes = Math.max(1, minute - (90 - d.minutes));
          sentOff = true;
        }
        if (d.yellow % 5 === 0) d.suspended++;
      }
    }
  } else {
    const possessions = 88 + Math.floor(roll(s) * 17),
      usage = selected ? (d.minutes / 48) * 0.24 : 0;
    for (let n = 0; n < possessions; n++) {
      const shoot = (ability, ours) => {
        if (roll(s) < 0.13) {
          if (ours && roll(s) < usage) stats.turnovers++;
          return 0;
        }
        const three = roll(s) < 0.38,
          hit =
            roll(s) <
            clamp((three ? 0.31 : 0.49) + (ability - 50) / 500, 0.15, 0.8),
          points = hit ? (three ? 3 : 2) : 0;
        if (ours) {
          if (roll(s) < usage) {
            stats.points += points;
            if (!hit && roll(s) < 0.12) stats.rebounds++;
          } else if (points && roll(s) < usage) stats.assists++;
          if (!hit && roll(s) < usage * 0.6) stats.rebounds++;
          if (roll(s) < usage * 0.08) stats.fouls++;
        }
        return points;
      };
      own += shoot(
        path.table[0].rating * 0.7 +
          (selected ? p.ability : path.table[0].rating) * 0.3,
        true,
      );
      other += shoot(opponent.rating, false);
    }
    let overtime = 0;
    while (own === other && overtime++ < 20) {
      const a = 2 + Math.floor(roll(s) * 12),
        b = 2 + Math.floor(roll(s) * 12);
      own += a;
      other += b;
    }
    if (own === other) own++;
    events.push({
      minute: 48,
      text: `${possessions} possessions per side${overtime ? ` · ${overtime} overtime periods` : ""}`,
    });
    if (stats.fouls >= 6) {
      stats.minutes = Math.max(1, stats.minutes - 5);
      events.push({ minute: 43, text: "Fouled out" });
    }
  }
  const record = {
    id: fixture.id,
    week: s.week,
    opponent: fixture.opponent,
    own,
    other,
    stats,
    events: events.slice(-30),
  };
  d.matches.unshift(record);
  d.matches = d.matches.slice(0, 20);
  return { home: ownHome ? own : other, away: ownHome ? other : own };
}
function basketballPayrollLimit(jobId) {
  return (
    { 1: 500000, 2: 3000000, 3: 13000000, 4: 100000000 }[
      jobDefinition(jobId)?.level
    ] || 0
  );
}
export function syncBasketballPayroll(s) {
  const d = s.simulation?.sports.basketball;
  if (!d?.active) return;
  const limit = basketballPayrollLimit(s.sports.basketball.contract?.jobId);
  d.cap = limit;
  for (let i = 0; i < d.roster.length; i++) {
    const p = d.roster[i];
    p.salary =
      p.id === "player"
        ? (s.employment?.weeklyPay || 0) * 52
        : Math.round(limit * (0.025 + (hash(`basketball:${i}`) % 8) * 0.002));
  }
}
export function basketballCapReason(s, offer) {
  const d = s.simulation?.sports.basketball;
  if (!d?.active) return null;
  const pay = (offer.pay || 0) * 52,
    total = d.roster
      .filter((p) => p.id !== "player" && p.expires > s.week)
      .reduce((n, p) => n + p.salary, 0);
  const cap = basketballPayrollLimit(offer.jobId) || d.cap || 500000,
    projected = d.cap > 0 ? (total * cap) / d.cap : cap * 0.5;
  return pay > cap * 0.35 || projected + pay > cap
    ? "The proposed basketball salary exceeds this squad’s payroll or individual salary limit."
    : null;
}
export function requestDevelopmentAssignment(state) {
  activeSport(state, "basketball");
  const d = state.simulation.sports.basketball,
    p = state.sports.basketball;
  if (
    !d.active ||
    age(state) >= 25 ||
    p.contract?.role === "starter" ||
    d.assignment?.until >= state.week
  )
    throw new Error(
      "Development assignments are for young non-starters without a current assignment.",
    );
  const s = act(state, { minAge: 12, hours: 2 });
  s.simulation.sports.basketball.assignment = {
    since: s.week,
    until: s.week + 4,
    appearances: 0,
    points: 0,
  };
  return s;
}
export function enterTennisTournament(state, fixtureId, draw) {
  activeSport(state, "tennis");
  const d = state.simulation.sports.tennis,
    f = state.seasons.tennis.fixtures.find((f) => f.id === fixtureId),
    t = TENNIS_ENTRIES[draw];
  if (
    !d.active ||
    !t ||
    !f ||
    f.week <= state.week ||
    f.week > state.week + 8 ||
    d.entries.some((e) => e.fixture === fixtureId) ||
    state.sports.tennis.ability < t.min ||
    (draw === "tour" && (d.ranking === null || d.ranking > 200))
  )
    throw new Error(
      "Choose an upcoming tournament and meet its ability/ranking entry requirement.",
    );
  const s = act(state, { minAge: 6, cost: t.fee, hours: 1 });
  s.simulation.sports.tennis.entries.push({
    fixture: fixtureId,
    draw,
    paid: t.fee,
    week: f.week,
    status: "entered",
  });
  s.simulation.sports.tennis.entries =
    s.simulation.sports.tennis.entries.slice(-30);
  return s;
}
export function tennisEntryAllowed(s, f) {
  return (
    !s.simulation?.sports.tennis.active ||
    s.simulation.sports.tennis.entries.some(
      (e) => e.fixture === f.id && e.status === "entered",
    )
  );
}
export function tennisMatch(s, ability, opponent) {
  const sets = [],
    chance = clamp(0.5 + (ability - opponent) / 260, 0.28, 0.72);
  let wins = 0,
    losses = 0,
    pointCount = 0;
  while (wins < 2 && losses < 2) {
    let a = 0,
      b = 0,
      tiebreak = null;
    while (true) {
      let pa = 0,
        pb = 0;
      if (a === 6 && b === 6) {
        while (Math.max(pa, pb) < 7 || Math.abs(pa - pb) < 2) {
          if (roll(s) < chance) pa++;
          else pb++;
          pointCount++;
        }
        tiebreak = [pa, pb];
      } else
        while (Math.max(pa, pb) < 4 || Math.abs(pa - pb) < 2) {
          if (roll(s) < chance) pa++;
          else pb++;
          pointCount++;
        }
      if (pa > pb) a++;
      else b++;
      if ((Math.max(a, b) >= 6 && Math.abs(a - b) >= 2) || Math.max(a, b) === 7)
        break;
    }
    sets.push({ a, b, tiebreak });
    if (a > b) wins++;
    else losses++;
  }
  return { sets, won: wins === 2, pointsPlayed: pointCount };
}
export function detailedTennisResult(s, f, selected, score) {
  const d = s.simulation?.sports.tennis;
  if (!d?.active) return null;
  const entry = d.entries.find(
    (e) => e.fixture === f.id && e.status === "entered",
  );
  if (!entry || !selected) return { position: 0, points: 0, won: false };
  const draw = TENNIS_ENTRIES[entry.draw],
    rounds = [],
    ability = s.sports.tennis.ability;
  let victories = 0;
  for (let r = 0; r < 3; r++) {
    const opponent = clamp(
        35 +
          r * 15 +
          (entry.draw === "tour" ? 15 : entry.draw === "qualifying" ? 5 : -10),
      ),
      m = tennisMatch(s, (ability + score) / 2, opponent);
    rounds.push(m);
    if (!m.won) break;
    victories++;
  }
  const position = 3 - victories,
    points = draw.award[position];
  entry.status = "played";
  d.results.unshift({
    id: f.id,
    week: s.week,
    draw: entry.draw,
    points,
    won: victories === 3,
    rounds,
  });
  d.results = d.results.slice(0, 52);
  return {
    position: position === 0 ? 1 : 2 ** position,
    points,
    won: victories === 3,
  };
}
export function joinBoxingGym(state) {
  assertCareerPath(state, "boxing");
  const b = state.simulation.sports.boxing;
  if (b.stage !== "none" && b.stage !== "retired")
    throw new Error("You already belong to a boxing gym.");
  const s = act(state, { minAge: 8, cost: 30, hours: 2 }),
    n = s.simulation.sports.boxing;
  n.stage = "amateur";
  n.gym = "Cedar Community Boxing";
  note(
    s,
    "Joined supervised boxing. Training and medical clearance come before a matched amateur bout.",
  );
  return s;
}
export function leaveBoxing(state) {
  const s = act(state, { minAge: 8, hours: 1 }),
    b = s.simulation.sports.boxing;
  if (b.offer?.status === "booked")
    throw new Error("Complete the booked bout before leaving the gym.");
  b.stage = "retired";
  return s;
}
export function trainBoxing(state, focus) {
  assertCareerPath(state, "boxing");
  const b = state.simulation.sports.boxing;
  if (
    !["amateur", "professional"].includes(b.stage) ||
    b.injuryUntil > state.week ||
    !["technique", "defence", "conditioning"].includes(focus)
  )
    throw new Error(
      "Choose a boxing focus while healthy and registered at a gym.",
    );
  const s = act(state, { minAge: 8, cost: 10, hours: 4, energy: 10 }),
    n = s.simulation.sports.boxing;
  once(s, n.actions, "training");
  n.training++;
  n[focus] = clamp(n[focus] + 1 + s.skills.athletics / 100);
  return s;
}
export function boxingMedical(state) {
  const b = state.simulation.sports.boxing;
  if (
    !["amateur", "professional"].includes(b.stage) ||
    b.injuryUntil > state.week
  )
    throw new Error("Register at a gym and complete injury recovery first.");
  const s = act(state, { minAge: 12, cost: 80, hours: 2 });
  s.simulation.sports.boxing.medicalUntil =
    s.health >= 65 ? s.week + 52 : s.week;
  note(
    s,
    s.health >= 65
      ? "The boxing medical cleared you for matched bouts for one year."
      : "Medical clearance was withheld pending health improvement.",
  );
  return s;
}
export function requestBoxingBout(state) {
  const b = state.simulation.sports.boxing;
  assertCareerPath(state, "boxing");
  if (
    age(state) < 12 ||
    b.training < 8 ||
    b.medicalUntil <= state.week ||
    b.injuryUntil > state.week ||
    b.offer?.status === "booked"
  )
    throw new Error(
      "Bouts require age 12+, eight delivered training weeks, current medical clearance and recovery.",
    );
  const s = act(state, { minAge: 12, hours: 2 }),
    n = s.simulation.sports.boxing;
  once(s, n.actions, "bout", 6);
  const pro = n.stage === "professional";
  n.offer = {
    id: uid(s, "bout"),
    week: s.week + 3,
    opponent: ["Robin Vale", "Sam Mercer", "Alex North"][
      Math.floor(roll(s) * 3)
    ],
    ability: clamp(25 + n.bouts.length * 3, 25, 90),
    rounds: pro ? 6 : 3,
    purse: pro ? 300 + 100 * n.bouts.length : 0,
    status: "booked",
  };
  return s;
}
export function applyBoxingLicence(state) {
  const b = state.simulation.sports.boxing;
  if (
    b.stage !== "amateur" ||
    b.bouts.length < 8 ||
    b.bouts.filter((b) => b.won).length < 4 ||
    b.medicalUntil <= state.week ||
    b.defence < 35
  )
    throw new Error(
      "A professional licence needs eight amateur bouts, four wins, defence 35 and current medical clearance.",
    );
  const s = act(state, { minAge: 18, cost: 250, hours: 3 });
  s.simulation.sports.boxing.stage = "professional";
  return s;
}
export function advanceDetailedSports(s) {
  const q = s.simulation.sports;
  if (q.lastWeek === s.week) return;
  q.lastWeek = s.week;
  const d = q.basketball;
  if (
    d.assignment &&
    d.assignment.until >= s.week &&
    d.assignment.since < s.week &&
    !s.sports.basketball.injuryWeeks
  ) {
    d.assignment.appearances++;
    const points = Math.floor(
      8 + s.sports.basketball.ability / 5 + roll(s) * 8,
    );
    d.assignment.points += points;
    s.sports.basketball.ability = clamp(s.sports.basketball.ability + 0.15);
  }
  for (const a of d.roster.filter(
    (a) => a.id !== "player" && a.expires <= s.week,
  )) {
    a.salary = round(a.salary * (0.95 + roll(s) * 0.15));
    a.expires = s.week + 104;
  }
  const t = q.tennis;
  t.points = t.results
    .filter((r) => r.week > s.week - 52)
    .reduce((n, r) => n + r.points, 0);
  t.ranking = t.points
    ? Math.max(1, Math.floor(6000 / (1 + t.points / 15)))
    : null;
  for (const e of t.entries.filter(
    (e) => e.status === "entered" && e.week < s.week,
  ))
    e.status = "missed";
  const b = q.boxing,
    o = b.offer;
  if (o?.status === "booked" && o.week <= s.week) {
    if (
      s.globalLife.crime.prison ||
      s.health < 60 ||
      b.injuryUntil >= s.week ||
      b.medicalUntil < s.week
    ) {
      o.status = "cancelled";
      note(
        s,
        "The booked boxing bout was cancelled because clearance, fitness or availability was missing.",
      );
      return;
    }
    const rounds = [];
    let ours = 0,
      theirs = 0,
      ko = false;
    for (let r = 1; r <= o.rounds; r++) {
      const own =
          b.technique * 0.5 +
          b.conditioning * 0.3 +
          b.defence * 0.2 +
          roll(s) * 30,
        opp = o.ability + roll(s) * 30,
        win = own > opp;
      ours += win ? 10 : 9;
      theirs += win ? 9 : 10;
      rounds.push({ round: r, ours: win ? 10 : 9, theirs: win ? 9 : 10 });
      if (roll(s) < Math.max(0.015, (o.ability - b.defence) / 800)) {
        ko = true;
        b.injuryUntil = s.week + 8;
        break;
      }
    }
    const won = !ko && ours > theirs;
    o.status = "completed";
    b.bouts.unshift({
      id: o.id,
      week: s.week,
      opponent: o.opponent,
      won,
      method: ko ? "Medical stoppage" : "Judges’ decision",
      rounds,
      purse: o.purse,
    });
    b.bouts = b.bouts.slice(0, 60);
    if (o.purse) receiveIncome(s, o.purse, "earned");
    s.health = clamp(s.health - (ko ? 12 : 3));
    note(
      s,
      `Boxing ${won ? "win" : "loss"} against ${o.opponent}: ${ko ? "medical stoppage" : "judges’ decision"}.`,
    );
  }
}
export function validateDetailedSports(s) {
  const q = obj(s.simulation.sports);
  num(q.lastWeek, 0, s.week, true);
  for (const id of ["football", "basketball", "tennis"]) {
    const d = obj(q[id]);
    bool(d.active);
    stamps(d.actions, s.week);
    if (id !== "tennis") {
      num(d.minutes, 0, id === "football" ? 90 : 48, true);
      for (const p of arr(d.roster, id === "football" ? 11 : 14)) {
        str(p.id, 100);
        str(p.name, 100);
        str(p.role, 50);
        num(p.ability, 0, 100);
        num(p.salary);
        num(p.expires, 0, s.week + 156, true);
        num(p.chemistry, 0, 100);
        bool(p.guaranteed);
      }
      for (const m of arr(d.matches, 20)) {
        str(m.id, 120);
        num(m.week, 0, s.week, true);
        str(m.opponent, 200);
        num(m.own, 0, 300, true);
        num(m.other, 0, 300, true);
        for (const k of [
          "points",
          "assists",
          "rebounds",
          "turnovers",
          "fouls",
          "passes",
          "completed",
          "minutes",
        ])
          num(m.stats[k], 0, 300, true);
        for (const e of arr(m.events, 30)) {
          num(e.minute, 0, 90, true);
          str(e.text, 100);
        }
      }
    }
    if (id === "football") {
      num(d.yellow, 0, 10000, true);
      num(d.suspended, 0, 100, true);
      for (const l of arr(d.links, 10)) {
        str(l.a, 100);
        str(l.b, 100);
        num(l.trust, 0, 100);
        num(l.passes, 0, 1e6, true);
        num(l.completed, 0, l.passes, true);
      }
    }
    if (id === "basketball") {
      num(d.cap, 0, 1e12);
      if (d.assignment) {
        num(d.assignment.since, 0, s.week, true);
        num(d.assignment.until, 0, s.week + 4, true);
        num(d.assignment.appearances, 0, 4, true);
        num(d.assignment.points, 0, 300, true);
      }
    }
    if (id === "tennis") {
      num(d.points, 0, 30000, true);
      if (d.ranking !== null) num(d.ranking, 1, 10000, true);
      for (const e of arr(d.entries, 30)) {
        str(e.fixture, 120);
        one(e.draw, Object.keys(TENNIS_ENTRIES));
        num(e.paid);
        num(e.week, 0, s.week + 8, true);
        one(e.status, ["entered", "played", "missed"]);
      }
      for (const r of arr(d.results, 52)) {
        str(r.id, 120);
        num(r.week, 0, s.week, true);
        one(r.draw, Object.keys(TENNIS_ENTRIES));
        num(r.points, 0, 1000, true);
        bool(r.won);
        for (const m of arr(r.rounds, 3)) {
          bool(m.won);
          num(m.pointsPlayed, 1, 100000, true);
          for (const set of arr(m.sets, 3)) {
            num(set.a, 0, 7, true);
            num(set.b, 0, 7, true);
            if (set.tiebreak) {
              arr(set.tiebreak, 2);
              set.tiebreak.forEach((n) => num(n, 0, 10000, true));
            }
          }
        }
      }
    }
  }
  const b = obj(q.boxing);
  one(b.stage, ["none", "amateur", "professional", "retired"]);
  if (b.gym !== null) str(b.gym, 100);
  num(b.medicalUntil, 0, s.week + 52, true);
  num(b.training, 0, 10000, true);
  for (const k of ["conditioning", "technique", "defence"]) num(b[k], 0, 100);
  num(b.injuryUntil, 0, s.week + 8, true);
  stamps(b.actions, s.week);
  if (b.offer) {
    str(b.offer.id, 100);
    num(b.offer.week, 0, s.week + 3, true);
    str(b.offer.opponent, 100);
    num(b.offer.ability, 0, 100);
    num(b.offer.rounds, 3, 6, true);
    num(b.offer.purse);
    one(b.offer.status, ["booked", "completed", "cancelled"]);
  }
  for (const f of arr(b.bouts, 60)) {
    str(f.id, 100);
    num(f.week, 0, s.week, true);
    str(f.opponent, 100);
    bool(f.won);
    str(f.method, 100);
    num(f.purse);
    for (const r of arr(f.rounds, 6)) {
      num(r.round, 1, 6, true);
      num(r.ours, 0, 10, true);
      num(r.theirs, 0, 10, true);
    }
  }
}
