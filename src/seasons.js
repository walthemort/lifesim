import {
  performanceBonus,
  performanceInjuryRisk,
  finishPerformancePlan,
  familySportAbsence,
} from "./pressure-effects.js";
import { milestoneAway } from "./career-milestones.js";
import { sportChemistryBonus, internationalDuty } from "./career-world.js";
import {
  physicalPerformance,
  injuryRisk,
  recordSportInjury,
} from "./life-course.js";
import { rng, jobDefinition, availableCash } from "./world.js";
import { allocationRatio, spendTime } from "./calendar.js";
import { receiveIncome } from "./banking.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n)),
  round = (n) => Math.round(n * 100) / 100;
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
export const SEASON_SPORTS = ["football", "racing", "basketball", "tennis"];
export const AGENTS = [
  {
    id: "development",
    name: "Next Chapter Sports",
    fee: 100,
    rate: 0.05,
    reputation: 15,
    skill: 0.08,
  },
  {
    id: "commercial",
    name: "Motion Representation",
    fee: 250,
    rate: 0.1,
    reputation: 30,
    skill: 0.15,
  },
  {
    id: "elite",
    name: "Pinnacle Athletes",
    fee: 500,
    rate: 0.08,
    reputation: 60,
    skill: 0.22,
  },
];
const CLUBS = [
  "Riverside",
  "Harbor",
  "Westbridge",
  "Oakfield",
  "Meridian",
  "Northline",
  "Easton",
  "Juniper",
  "Kingsbridge",
  "Cedar",
  "Atlas",
  "Solstice",
  "Bayview",
  "Lakeside",
  "Hillcrest",
  "Wellington",
  "Ashford",
  "Elmwood",
  "Stonegate",
  "Redwood",
  "Southport",
];
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
const level = (s, id) =>
  actor(s, id).contract ? jobDefinition(actor(s, id).contract.jobId).level : 0;
const active = (s, id) => !["none", "retired"].includes(actor(s, id).stage);
function pairings(count, repeats) {
  let circle = Array.from({ length: count }, (_, i) => i),
    rounds = [];
  for (let rep = 0; rep < repeats; rep++) {
    for (let r = 0; r < count - 1; r++) {
      const pairs = [];
      for (let i = 0; i < count / 2; i++) {
        let home = circle[i],
          away = circle[count - 1 - i];
        if ((r + rep + i) % 2) [home, away] = [away, home];
        pairs.push({ home, away });
      }
      rounds.push(pairs);
      circle = [circle[0], circle.at(-1), ...circle.slice(1, -1)];
    }
  }
  return rounds;
}
function createSchedule(s, id, path, advancing = false) {
  const p = actor(s, id),
    year = Math.floor(s.week / 52),
    base = year * 52,
    count = id === "football" ? 20 : id === "basketball" ? 12 : 20;
  path.year = year;
  path.club = p.club;
  path.stage = p.stage;
  path.level = level(s, id);
  path.appearances = 0;
  path.form = 50;
  path.trainedWeek = -1;
  path.blocked = "unavailable";
  path.fundingMisses = 0;
  const teamSport = id === "football" || id === "basketball";
  const ownName = teamSport ? p.club || "Your local side" : s.name;
  const competitors = teamSport
    ? CLUBS.map((name) => name + (id === "football" ? " FC" : " Hoops"))
    : [
        "Leo Martinez",
        "Maya Petersen",
        "Noah Reed",
        "Sofia Laurent",
        "Ethan Brooks",
        "Luca Romano",
        "Ava Silva",
        "Oscar Kim",
        "Amir Hassan",
        "Chloe Bennett",
        "Theo Fischer",
        "Isla Morgan",
        "Daniel Novak",
        "Zoe Alvarez",
        "Finn Taylor",
        "Yuki Tanaka",
        "Eva Jensen",
        "Louis Moreau",
        "Nora Berg",
        "Marco Rossi",
        "Aria Scott",
      ];
  const opponents = competitors.filter((name) => name !== ownName);
  path.table = Array.from({ length: count }, (_, i) => ({
    id: i,
    name: i === 0 ? ownName : opponents[i - 1],
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    for: 0,
    against: 0,
    points: 0,
    rating: clamp(42 + path.level * 9 + ((i * 17 + year * 3) % 20)),
  }));
  if (id === "football" || id === "basketball") {
    const rounds = pairings(count, id === "football" ? 2 : 4);
    path.fixtures = rounds.map((matches, i) => {
      const match = matches.find((m) => m.home === 0 || m.away === 0),
        opponent = match.home === 0 ? match.away : match.home;
      return {
        id: `${id}:${year}:${i}`,
        week: base + 1 + Math.floor((i * 38) / rounds.length),
        opponent: path.table[opponent].name,
        home: match.home === 0,
        matches,
        status: "scheduled",
        result: null,
      };
    });
  } else {
    const weeks =
      id === "racing"
        ? Array.from({ length: 22 }, (_, i) => 3 + i * 2)
        : Array.from({ length: 26 }, (_, i) => 1 + i * 2);
    path.fixtures = weeks.map((week, i) => ({
      id: `${id}:${year}:${i}`,
      week: base + week,
      opponent:
        id === "racing"
          ? `${CLUBS[i % CLUBS.length]} Grand Prix`
          : `${CLUBS[i % CLUBS.length]} Open`,
      home: false,
      matches: [],
      status: "scheduled",
      result: null,
    }));
  }
  // Joining or transferring mid-season does not replay fixtures from earlier weeks.
  for (const f of path.fixtures)
    if (f.week < s.week || (!advancing && f.week === s.week)) {
      f.status = "past";
      const noise = (a, b) =>
        ((a * 31 + b * 17 + f.week * 13 + year * 7) % 101) / 101;
      if (id === "football" || id === "basketball")
        for (const m of f.matches) {
          const h = path.table[m.home],
            a = path.table[m.away],
            football = id === "football";
          let hs = football
            ? Math.max(
                0,
                Math.round(
                  (h.rating - a.rating + 10) / 35 + noise(h.id, a.id) * 3 - 0.5,
                ),
              )
            : Math.round(65 + h.rating * 0.4 + noise(h.id, a.id) * 25);
          const as = football
            ? Math.max(
                0,
                Math.round(
                  (a.rating - h.rating) / 35 + noise(a.id, h.id) * 3 - 0.5,
                ),
              )
            : Math.round(65 + a.rating * 0.4 + noise(a.id, h.id) * 25);
          if (!football && hs === as) hs++;
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
            loser.losses++;
            winner.points += football ? 3 : 2;
          }
        }
      else {
        const field = path.table
          .filter((t) => t.id !== 0)
          .sort(
            (a, b) =>
              b.rating +
                noise(b.id, 0) * 40 -
                (a.rating + noise(a.id, 0) * 40) || a.id - b.id,
          );
        const points =
          id === "racing"
            ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
            : [250, 150, 100, 75, 50, 40, 30, 20, 10, 5];
        field.forEach((t, i) => {
          t.played++;
          t.points += points[i] || 0;
          if (i === 0) t.wins++;
        });
      }
    }
}
export function initializeSeasons(s) {
  s.seasons = Object.fromEntries(
    SEASON_SPORTS.map((id) => {
      const path = {
        year: 0,
        club: null,
        stage: "none",
        level: 0,
        fixtures: [],
        table: [],
        appearances: 0,
        form: 50,
        trainedWeek: -1,
        blocked: "unavailable",
        agent: null,
        sponsor: null,
        sponsorOffers: [],
        nextSponsorWeek: s.week + 13,
        history: [],
        fundingMisses: 0,
      };
      createSchedule(s, id, path);
      return [id, path];
    }),
  );
}
export function standings(s, id) {
  return [...s.seasons[id].table].sort(
    (a, b) =>
      b.points - a.points ||
      (["racing", "tennis"].includes(id) ? b.wins - a.wins : 0) ||
      b.for - b.against - (a.for - a.against) ||
      b.for - a.for ||
      a.id - b.id,
  );
}
export function syncSeason(s, id, advancing = false) {
  if (!s.seasons) return;
  const path = s.seasons[id],
    p = actor(s, id);
  if (
    path.year !== Math.floor(s.week / 52) ||
    path.club !== p.club ||
    path.stage !== p.stage ||
    path.level !== level(s, id)
  ) {
    if (path.appearances) {
      path.history.unshift({
        year: path.year,
        club: path.club || "Local participation",
        place: standings(s, id).findIndex((t) => t.id === 0) + 1,
        points: path.table[0].points,
        appearances: path.appearances,
      });
      path.history = path.history.slice(0, 10);
    }
    createSchedule(s, id, path, advancing);
  }
}
export function prepareSeasons(s) {
  for (const id of SEASON_SPORTS) {
    syncSeason(s, id, true);
    const path = s.seasons[id],
      p = actor(s, id);
    path.blocked =
      internationalDuty(s, id) ||
      milestoneAway(s, id) ||
      familySportAbsence(s, id)
        ? "unavailable"
        : p.injuryWeeks
          ? "injured"
          : p.training === "rest"
            ? "rest"
            : allocationRatio(s, id) < 0.5
              ? "unavailable"
              : "ready";
    for (const o of p.offers) {
      const n = o.terms?.negotiation;
      if (
        o.status === "offered" &&
        n?.status === "pending" &&
        n.decisionWeek <= s.week
      ) {
        const chance = Math.min(
          0.92,
          0.55 +
            (path.agent
              ? AGENTS.find((a) => a.id === path.agent.id).skill
              : 0) +
            p.reputation * 0.002 -
            (n.approach === "ambitious"
              ? 0.25
              : n.approach === "balanced"
                ? 0.08
                : 0),
        );
        if (rng(s) < chance) {
          n.status = "agreed";
          o.pay = n.pay;
          o.duration = n.weeks;
          Object.assign(o.terms, { weeks: n.weeks, role: n.role });
          log(
            s,
            `${o.club} agreed to the revised ${id} contract. Review and sign before the offer expires.`,
            "positive",
          );
        } else if (n.approach === "ambitious" && rng(s) < 0.4) {
          n.status = "withdrawn";
          o.status = "declined";
          log(
            s,
            `${o.club} withdrew its offer after the ambitious counterproposal.`,
            "warning",
          );
        } else {
          n.status = "refused";
          log(
            s,
            `${o.club} refused the counterproposal. The original offer remains available.`,
          );
        }
      }
    }
  }
}
export function markSportTraining(s, id) {
  if (s.seasons) s.seasons[id].trainedWeek = s.week;
}
export function enhanceSportOffer(s, id, o) {
  if (o.kind !== "contract") return;
  const j = jobDefinition(o.jobId);
  o.terms = {
    weeks: o.duration || 104,
    role: j.level >= 3 ? "starter" : "rotation",
    appearanceBonus: Math.max(5, Math.round(o.pay * 0.02)),
    winBonus: Math.round(o.pay * 0.04),
    annualFunding:
      id === "racing"
        ? { 1: 15000, 2: 60000, 3: 200000, 4: 0 }[j.level] || 0
        : 0,
    negotiation: null,
  };
}
export function negotiateSportOffer(state, id, offerId, approach) {
  if (state.ended || !state.actions)
    throw new Error(
      "Contract talks need a free-time action in an active life.",
    );
  if (state.careerWorld?.sports[id]?.moves[offerId]?.kind === "loan")
    throw new Error(
      "Loan terms preserve your parent contract; request a permanent move to renegotiate pay or duration.",
    );
  const p = actor(state, id),
    o = p?.offers.find((o) => o.id === offerId);
  if (
    !o ||
    o.kind !== "contract" ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week
  )
    throw new Error("Choose a live sporting contract offer.");
  if (!["security", "balanced", "ambitious"].includes(approach))
    throw new Error("Choose a contract approach.");
  if (o.terms?.negotiation)
    throw new Error("You can make one counterproposal per offer.");
  const s = structuredClone(state),
    offer = actor(s, id).offers.find((o) => o.id === offerId);
  spendTime(s, 3, "Sporting contract talks");
  s.actions--;
  if (!offer.terms) enhanceSportOffer(s, id, offer);
  const weeks =
      approach === "security" ? 156 : approach === "ambitious" ? 52 : 104,
    pay = Math.round(
      o.pay *
        (approach === "security"
          ? 0.95
          : approach === "ambitious"
            ? 1.2
            : 1.08),
    );
  offer.expiresWeek = Math.max(offer.expiresWeek, s.week + 4);
  offer.terms.negotiation = {
    status: "pending",
    decisionWeek: s.week + 2,
    approach,
    weeks,
    pay,
    role: approach === "ambitious" ? "starter" : "rotation",
  };
  log(
    s,
    "Sent a counterproposal. The club or team responds in two weeks; ambitious demands can lose the offer.",
  );
  return s;
}
export function checkSportSigning(s, id, o) {
  if (o.terms?.negotiation?.status === "pending")
    throw new Error(
      "Wait for the contract negotiation to finish before signing.",
    );
  const funding = o.terms?.annualFunding || 0,
    sponsor = s.seasons[id].sponsor;
  const support =
    sponsor?.status === "active" && sponsor.expiresWeek >= s.week
      ? sponsor.annual
      : 0;
  if (availableCash(s) < Math.max(0, funding - support) / 4)
    throw new Error(
      "This seat needs thirteen weeks of uncovered racing costs in cash reserves. Find sponsorship or build savings first.",
    );
}
export function signedSportTerms(s, id, o) {
  const p = actor(s, id);
  if (o.terms)
    Object.assign(p.contract, {
      role: o.terms.role,
      appearanceBonus: o.terms.appearanceBonus,
      winBonus: o.terms.winBonus,
      annualFunding: o.terms.annualFunding,
    });
  p.contract.expiresWeek = s.week + (o.terms?.weeks || o.duration || 104);
  s.seasons[id].fundingMisses = 0;
}
export function hireAgent(state, id, agentId) {
  const p = actor(state, id),
    a = AGENTS.find((a) => a.id === agentId);
  if (
    state.ended ||
    !state.actions ||
    !p ||
    !active(state, id) ||
    age(state) < 16 ||
    !a
  )
    throw new Error(
      "Active athletes aged sixteen or older can meet an agent using an action.",
    );
  if (state.seasons[id].agent)
    throw new Error("End your current representation agreement first.");
  if (p.reputation < a.reputation)
    throw new Error(`This agency needs ${a.reputation} sporting reputation.`);
  if (availableCash(state) < a.fee)
    throw new Error("Not enough cash for the representation fee.");
  const s = structuredClone(state);
  spendTime(s, 2, "Meet a sports agent");
  s.actions--;
  s.money -= a.fee;
  s.seasons[id].agent = { id: a.id, signedWeek: s.week };
  log(
    s,
    `Signed with ${a.name}. Commission is ${(a.rate * 100).toFixed(0)}% of this sport’s wages and performance bonuses.`,
  );
  return s;
}
export function dismissAgent(state, id) {
  if (state.ended || !state.seasons[id]?.agent)
    throw new Error("No active agent agreement.");
  const s = structuredClone(state);
  s.seasons[id].agent = null;
  return s;
}
export function sportFundingCost(s, id) {
  const p = actor(s, id),
    sponsor = s.seasons?.[id]?.sponsor;
  return (
    Math.max(
      0,
      (p.contract?.annualFunding || 0) -
        (sponsor?.status === "active" && sponsor.expiresWeek >= s.week
          ? sponsor.annual
          : 0),
    ) / 52
  );
}
export function agentCommission(s) {
  if (!s.seasons || !SEASON_SPORTS.includes(s.career) || !s.employment)
    return 0;
  const a = s.seasons[s.career].agent;
  return a
    ? round(s.employment.weeklyPay * AGENTS.find((x) => x.id === a.id).rate)
    : 0;
}
export function sportingCosts(s) {
  return s.seasons
    ? round(SEASON_SPORTS.reduce((n, id) => n + sportFundingCost(s, id), 0)) +
        agentCommission(s)
    : 0;
}
export function acceptSportSponsor(state, id, offerId) {
  if (state.ended || !state.actions)
    throw new Error("Sponsorship needs a free-time action.");
  const o = state.seasons[id]?.sponsorOffers.find((o) => o.id === offerId);
  if (
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week ||
    state.seasons[id].sponsor?.status === "active"
  )
    throw new Error(
      "Choose an available sponsorship without an existing active agreement.",
    );
  const s = structuredClone(state),
    offer = s.seasons[id].sponsorOffers.find((o) => o.id === offerId);
  spendTime(s, 2, "Agree sporting sponsorship");
  s.actions--;
  offer.status = "accepted";
  s.seasons[id].sponsor = {
    brand: o.brand,
    annual: o.annual,
    status: "active",
    expiresWeek: s.week + 52,
    nextAppearanceWeek: s.week + 13,
    lastAppearanceWeek: -1,
  };
  log(
    s,
    `${o.brand} will cover up to $${o.annual}/year of racing fees directly. A promotional appearance is required every thirteen weeks; unused support is not personal cash.`,
  );
  return s;
}
export function deliverSportAppearance(state, id) {
  const sponsor = state.seasons[id]?.sponsor;
  if (
    state.ended ||
    !state.actions ||
    sponsor?.status !== "active" ||
    sponsor.expiresWeek <= state.week
  )
    throw new Error(
      "Choose an active sports sponsor and use a free-time action.",
    );
  if (
    state.week < sponsor.nextAppearanceWeek - 4 ||
    sponsor.lastAppearanceWeek >= sponsor.nextAppearanceWeek - 4
  )
    throw new Error(
      "An appearance can be delivered once, in the four weeks before the deadline.",
    );
  const s = structuredClone(state);
  spendTime(s, 3, "Sports sponsor appearance");
  s.actions--;
  s.seasons[id].sponsor.lastAppearanceWeek = s.week;
  s.fame.reputation = clamp(s.fame.reputation + 1);
  log(
    s,
    "Delivered the sponsor appearance. Funding continues at the scheduled review.",
    "positive",
  );
  return s;
}
function bonus(s, id, gross) {
  const agent = s.seasons[id].agent,
    commission = agent
      ? round(gross * AGENTS.find((a) => a.id === agent.id).rate)
      : 0;
  receiveIncome(s, gross, "earned", { deduction: commission });
  s.money = round(s.money - commission);
}
function result(s, id, path, f) {
  const p = actor(s, id),
    unfunded = sportFundingCost(s, id) > 0 && s.money < 0;
  const selected =
    path.blocked === "ready" &&
    path.trainedWeek === s.week &&
    !unfunded &&
    !p.injuryWeeks &&
    (id === "racing" ||
      id === "tennis" ||
      !p.contract ||
      p.ability +
        p.discipline * 0.15 +
        s.energy * 0.15 +
        path.form * 0.08 +
        sportChemistryBonus(s, id) +
        (p.contract.role === "starter" ? 8 : 0) >=
        55 + path.level * 10);
  const status = selected
    ? "played"
    : p.injuryWeeks
      ? "injured"
      : unfunded
        ? "unfunded"
        : path.blocked === "ready"
          ? "bench"
          : path.blocked;
  const score = Math.round(
    clamp(
      p.ability * 0.65 +
        performanceBonus(s, id, f) +
        sportChemistryBonus(s, id) +
        physicalPerformance(s, id) +
        p.discipline * 0.15 +
        s.energy * 0.2 +
        (rng(s) * 2 - 1) * 15,
    ),
  );
  let won = false,
    ownScore = 0,
    otherScore = 0,
    position = 0,
    points = 0;
  if (id === "football" || id === "basketball") {
    for (const match of f.matches) {
      const h = path.table[match.home],
        a = path.table[match.away];
      const strength = (t) =>
        t.id === 0
          ? clamp(
              t.rating * 0.65 +
                (selected ? p.ability + performanceBonus(s, id, f) : t.rating) *
                  0.35,
            )
          : t.rating;
      const football = id === "football";
      const hs = football
        ? Math.max(
            0,
            Math.round(
              (strength(h) - strength(a) + 10) / 35 + rng(s) * 3 - 0.5,
            ),
          )
        : Math.round(65 + strength(h) * 0.4 + rng(s) * 25);
      const as = football
        ? Math.max(
            0,
            Math.round((strength(a) - strength(h)) / 35 + rng(s) * 3 - 0.5),
          )
        : Math.round(65 + strength(a) * 0.4 + rng(s) * 25);
      let homeGoals = hs,
        awayGoals = as;
      if (!football && homeGoals === awayGoals) homeGoals++;
      h.played++;
      a.played++;
      h.for += homeGoals;
      h.against += awayGoals;
      a.for += awayGoals;
      a.against += homeGoals;
      if (homeGoals === awayGoals) {
        h.draws++;
        a.draws++;
        h.points++;
        a.points++;
      } else {
        const winner = homeGoals > awayGoals ? h : a,
          loser = homeGoals > awayGoals ? a : h;
        winner.wins++;
        loser.losses++;
        winner.points += football ? 3 : 2;
      }
      if (match.home === 0 || match.away === 0) {
        ownScore = match.home === 0 ? homeGoals : awayGoals;
        otherScore = match.home === 0 ? awayGoals : homeGoals;
        won = ownScore > otherScore;
      }
    }
    if (selected && id === "football") {
      p.matches++;
      const goals =
        p.position === "Goalkeeper"
          ? 0
          : Math.min(ownScore, rng(s) < score / 150 ? 1 : 0);
      p.goals += goals;
      p.lastMatch = { week: s.week, rating: score, goals };
      p.coachTrust = clamp(p.coachTrust + (score >= 60 ? 0.3 : -0.1));
      p.reputation = clamp(p.reputation + (score >= 60 ? 0.22 : 0.04));
    }
  } else {
    const field = path.table
      .map((t) => ({
        id: t.id,
        score:
          t.id === 0
            ? selected
              ? score
              : -100
            : t.rating + (rng(s) * 2 - 1) * 20,
      }))
      .sort((a, b) => b.score - a.score || a.id - b.id);
    position = selected ? field.findIndex((x) => x.id === 0) + 1 : 0;
    won = position === 1;
    const distribution =
      id === "racing"
        ? [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
        : [250, 150, 100, 75, 50, 40, 30, 20, 10, 5];
    field.forEach((entry, i) => {
      const t = path.table[entry.id];
      if (entry.id === 0 && !selected) return;
      t.played++;
      const awarded = distribution[i] || 0;
      t.points += awarded;
      if (i === 0) t.wins++;
      if (entry.id === 0) points = awarded;
    });
  }
  if (selected) {
    path.appearances++;
    path.form = clamp(path.form * 0.8 + score * 0.2);
    if (id !== "football") {
      p.events++;
      if (won) p.wins++;
      p.reputation = clamp(p.reputation + (won ? 0.8 : 0.2));
      p.lastResult = { week: s.week, score, won };
    }
    if (p.contract) {
      bonus(
        s,
        id,
        (p.contract.appearanceBonus || 0) +
          (won ? p.contract.winBonus || 0 : 0),
      );
      if (id === "tennis" && p.stage === "professional") {
        const prize = Math.round(
          level(s, id) * 300 * (won ? 1.5 : points ? 0.5 : 0),
        );
        if (prize) {
          bonus(s, id, prize);
          log(
            s,
            `Tennis prize: $${prize} gross from ${f.opponent}.`,
            "positive",
          );
        }
      }
    }
    if (
      rng(s) <
      (p.training === "fitness" ? 0.012 : 0.004) *
        injuryRisk(s, id) *
        performanceInjuryRisk(s, id, f)
    ) {
      p.injuryWeeks = 2 + Math.floor(rng(s) * 4);
      recordSportInjury(s, id);
      log(s, `${id} injury: ${p.injuryWeeks} weeks of recovery.`, "warning");
    }
  }
  f.status = status;
  f.result = { score, won, ownScore, otherScore, position, points };
  finishPerformancePlan(s, id, f, selected);
  log(
    s,
    `${id}: ${f.opponent} · ${selected ? (id === "football" || id === "basketball" ? `${ownScore}–${otherScore}` : `finished ${position}, ${points} points`) : status === "bench" ? "not selected" : status}.`,
    selected ? "info" : "warning",
  );
}
export function advanceSeasons(s) {
  for (const id of SEASON_SPORTS) {
    syncSeason(s, id, true);
    const path = s.seasons[id],
      p = actor(s, id);
    if (!active(s, id)) continue;
    for (const f of path.fixtures.filter(
      (f) => f.week === s.week && f.status === "scheduled",
    ))
      result(s, id, path, f);
    const sponsor = path.sponsor;
    if (sponsor?.status === "active") {
      if (sponsor.expiresWeek <= s.week) {
        sponsor.status = "expired";
        log(s, `${sponsor.brand} funding agreement ended.`);
      } else if (sponsor.nextAppearanceWeek <= s.week) {
        if (sponsor.lastAppearanceWeek < sponsor.nextAppearanceWeek - 4) {
          sponsor.status = "cancelled";
          p.reputation = clamp(p.reputation - 5);
          log(
            s,
            "Sports sponsor withdrew funding after a missed appearance. Racing costs now fall to you.",
            "warning",
          );
        } else sponsor.nextAppearanceWeek += 13;
      }
    }
    for (const o of path.sponsorOffers)
      if (o.status === "offered" && o.expiresWeek <= s.week)
        o.status = "expired";
    if (
      id === "racing" &&
      age(s) >= 16 &&
      p.reputation >= 15 &&
      s.week >= path.nextSponsorWeek
    ) {
      path.nextSponsorWeek = s.week + 13;
      if (
        sponsor?.status !== "active" &&
        !path.sponsorOffers.some((o) => o.status === "offered") &&
        rng(s) < 0.4
      ) {
        const annual =
          p.reputation >= 65 && s.skills.charisma >= 40
            ? 100000
            : p.reputation >= 35 && s.skills.charisma >= 25
              ? 30000
              : 5000;
        path.sponsorOffers.unshift({
          id: `sport-sponsor:${s.week}`,
          brand:
            annual === 100000
              ? "Atlas Performance"
              : annual === 30000
                ? "Motion Sports"
                : "Daybreak Karting",
          annual,
          status: "offered",
          expiresWeek: s.week + 4,
        });
        path.sponsorOffers = path.sponsorOffers.slice(0, 8);
        log(
          s,
          "A racing sponsor offered funding in exchange for regular appearances. Review its terms in Sport & development.",
          "milestone",
        );
      }
    }
    if (sportFundingCost(s, id) > 0 && s.money < 0) {
      path.fundingMisses++;
      if (path.fundingMisses >= 4) {
        if (s.employment?.jobId === p.contract?.jobId) {
          s.employment = null;
          s.career = s.company ? "business" : "unemployed";
        }
        p.contract = null;
        p.stage = "local";
        p.club = "Local karting club";
        log(
          s,
          "The racing team ended your seat after four weeks of unfunded competition costs.",
          "warning",
        );
      }
    } else path.fundingMisses = 0;
  }
}
export function validateSeasons(s) {
  const n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = Infinity) => n(v, min, max) && Number.isInteger(v),
    fail = () => {
      throw new Error("Invalid sports season or contract data in save.");
    };
  if (!s.seasons) fail();
  for (const id of SEASON_SPORTS) {
    const p = s.seasons[id];
    if (
      !p ||
      !int(p.year, 0, Math.floor(s.week / 52)) ||
      !(p.club === null || typeof p.club === "string") ||
      typeof p.stage !== "string" ||
      !int(p.level, 0, 4) ||
      !int(p.appearances) ||
      !n(p.form, 0, 100) ||
      !int(p.trainedWeek, -1, s.week) ||
      !["ready", "injured", "rest", "unavailable"].includes(p.blocked) ||
      !int(p.fundingMisses, 0, 4) ||
      !int(p.nextSponsorWeek) ||
      !Array.isArray(p.table) ||
      p.table.length > 20 ||
      !Array.isArray(p.fixtures) ||
      p.fixtures.length > 52 ||
      !Array.isArray(p.history) ||
      p.history.length > 10 ||
      !Array.isArray(p.sponsorOffers) ||
      p.sponsorOffers.length > 8
    )
      fail();
    if (
      p.table.some(
        (t) =>
          !int(t.id, 0, 19) ||
          typeof t.name !== "string" ||
          [
            "played",
            "wins",
            "draws",
            "losses",
            "for",
            "against",
            "points",
          ].some((k) => !int(t[k])) ||
          !n(t.rating, 0, 100),
      ) ||
      new Set(p.table.map((t) => t.id)).size !== p.table.length ||
      p.fixtures.some(
        (f) =>
          typeof f.id !== "string" ||
          !int(f.week) ||
          typeof f.opponent !== "string" ||
          typeof f.home !== "boolean" ||
          ![
            "scheduled",
            "past",
            "played",
            "bench",
            "injured",
            "rest",
            "unavailable",
            "unfunded",
          ].includes(f.status) ||
          !Array.isArray(f.matches) ||
          f.matches.length > 10 ||
          f.matches.some(
            (m) =>
              !int(m.home, 0, p.table.length - 1) ||
              !int(m.away, 0, p.table.length - 1) ||
              m.home === m.away,
          ) ||
          (f.result !== null &&
            (!n(f.result.score, 0, 100) ||
              typeof f.result.won !== "boolean" ||
              ["ownScore", "otherScore", "position", "points"].some(
                (k) => !int(f.result[k]),
              ))),
      ) ||
      p.history.some(
        (h) =>
          !int(h.year, 0, p.year) ||
          typeof h.club !== "string" ||
          !int(h.place, 1, 20) ||
          !int(h.points) ||
          !int(h.appearances),
      )
    )
      fail();
    if (
      p.agent &&
      (!AGENTS.some((a) => a.id === p.agent.id) ||
        !int(p.agent.signedWeek, 0, s.week))
    )
      fail();
    if (
      p.sponsor &&
      (typeof p.sponsor.brand !== "string" ||
        !n(p.sponsor.annual, 0, 100000) ||
        !["active", "expired", "cancelled"].includes(p.sponsor.status) ||
        !int(p.sponsor.expiresWeek) ||
        !int(p.sponsor.nextAppearanceWeek) ||
        !int(p.sponsor.lastAppearanceWeek, -1, s.week))
    )
      fail();
    if (
      p.sponsorOffers.some(
        (o) =>
          typeof o.id !== "string" ||
          typeof o.brand !== "string" ||
          !n(o.annual, 0, 100000) ||
          !["offered", "accepted", "expired"].includes(o.status) ||
          !int(o.expiresWeek),
      )
    )
      fail();
    for (const o of actor(s, id).offers) {
      const t = o.terms;
      if (
        t &&
        (!(
          [52, 104, 156].includes(t.weeks) ||
          (t.weeks === 26 &&
            ["football", "basketball"].includes(id) &&
            s.careerWorld?.sports[id]?.moves[o.id]?.kind === "loan")
        ) ||
          !["rotation", "starter"].includes(t.role) ||
          !n(t.appearanceBonus) ||
          !n(t.winBonus) ||
          !n(t.annualFunding, 0, 200000))
      )
        fail();
      if (
        t?.negotiation &&
        (!["pending", "agreed", "refused", "withdrawn"].includes(
          t.negotiation.status,
        ) ||
          !int(t.negotiation.decisionWeek) ||
          !["security", "balanced", "ambitious"].includes(
            t.negotiation.approach,
          ) ||
          !n(t.negotiation.pay) ||
          ![52, 104, 156].includes(t.negotiation.weeks) ||
          !["rotation", "starter"].includes(t.negotiation.role))
      )
        fail();
    }
    const c = actor(s, id).contract;
    if (
      c?.annualFunding !== undefined &&
      (!n(c.annualFunding, 0, 200000) ||
        !n(c.appearanceBonus) ||
        !n(c.winBonus) ||
        !["rotation", "starter"].includes(c.role))
    )
      fail();
  }
}
