import { rng } from "./world.js";
const SPORTS = ["football", "racing", "basketball", "tennis"];
const clubs = {
  football: [
    "Riverside FC",
    "Harbor Athletic",
    "Meridian City",
    "Westbridge United",
    "Copenhagen Athletic",
    "New York City Stars",
  ],
  racing: [
    "Apex Motorsport",
    "Meridian Racing",
    "Meridian Grand Prix",
    "Meridian Motorsport",
    "Nordic Racing",
    "Monaco Grand Prix Team",
    "Harbor Racing",
    "Atlas Racing",
    "Northline Motorsport",
    "Solstice Racing",
  ],
  basketball: [
    "Harbor Hoops",
    "Meridian Basketball",
    "Westbridge Wolves",
    "Copenhagen Hoops",
    "New York Knights",
  ],
  tennis: [
    "Northline Tennis",
    "Westbridge Tennis Centre",
    "Nordic Tennis Academy",
    "Monaco Performance Tennis",
  ],
};
const actor = (s, p) => (p === "football" ? s.football : s.sports[p]);
const clamp = (n) => Math.max(0, Math.min(100, n));
export function initializeRivals(s) {
  s.realWorld.rivals = { athletes: [], history: [], lastWeek: s.week };
  for (const path of SPORTS)
    for (let level = 0; level <= 4; level++)
      for (let i = 1; i < 20; i++)
        s.realWorld.rivals.athletes.push({
          id: `${path}:${level}:${i}`,
          path,
          level,
          field: i,
          name: `${["Leo", "Maya", "Noah", "Sofia", "Ethan", "Luca", "Amara", "Hugo", "Aisha", "Oscar"][i % 10]} ${["Martinez", "Petersen", "Reed", "Laurent", "Brooks", "Romano", "Silva", "Chen"][Math.floor(i / 3) % 8]}`,
          club: clubs[path][(i - 1) % clubs[path].length],
          bornAge: level === 0 ? 8 + (i % 8) : 19 + (i % 14),
          startWeek: s.week,
          ability: 35 + level * 9 + (i % 12),
          form: 50,
          injuryUntil: 0,
          contractUntil: s.week + 46 + (i % 3) * 52,
          status: level !== 4 && i === 1 ? "free" : "contracted",
          availableSince: s.week,
          player: false,
        });
}
export function rivalVacancy(s, path, level, club) {
  if (!s.realWorld || level === 0) return null;
  return (
    s.realWorld.rivals.athletes.find(
      (a) =>
        a.path === path &&
        a.level === level &&
        a.club === club &&
        !a.player &&
        ["free", "retired"].includes(a.status),
    ) || null
  );
}
export function canRecruit(s, path, level, club) {
  if (!s.realWorld) return true;
  const p = actor(s, path);
  if (
    p.contract &&
    p.club === club &&
    Number(p.contract.jobId.slice(-1)) === level
  )
    return true;
  return !!rivalVacancy(s, path, level, club);
}
export function bindRivalOffer(s, path, o, level) {
  const p = actor(s, path);
  if (
    p.contract &&
    p.club === o.club &&
    Number(p.contract.jobId.slice(-1)) === level
  )
    return;
  const a = rivalVacancy(s, path, level, o.club);
  if (a) o.rivalSlot = a.id;
}
export function claimRivalSeat(s, path, o) {
  if (!o.rivalSlot || !s.realWorld) return;
  const a = s.realWorld.rivals.athletes.find((a) => a.id === o.rivalSlot);
  if (
    !a ||
    a.path !== path ||
    a.club !== o.club ||
    !["free", "retired"].includes(a.status)
  )
    throw new Error(
      "This sporting vacancy has been filled. Review another offer.",
    );
  for (const previous of s.realWorld.rivals.athletes.filter(
    (a) => a.path === path && a.player,
  )) {
    previous.player = false;
    previous.status = "free";
    previous.availableSince = s.week;
  }
  a.player = true;
  a.status = "contracted";
  a.contractUntil = actor(s, path).contract.expiresWeek || s.week + 104;
}
export function rivalField(s, path, level, index, fallback) {
  const a = s.realWorld?.rivals.athletes.find(
    (a) => a.path === path && a.level === level && a.field === index,
  );
  if (!a || a.player) return fallback;
  return a.status === "retired" || a.injuryUntil > s.week
    ? Math.max(0, a.ability - 25)
    : clamp(a.ability * 0.8 + a.form * 0.2);
}
export function rivalName(s, path, level, index, fallback) {
  return (
    s.realWorld?.rivals.athletes.find(
      (a) => a.path === path && a.level === level && a.field === index,
    )?.name || fallback
  );
}
export function prepareRivals(s) {
  if (!s.realWorld) return;
  const r = s.realWorld.rivals;
  if (r.lastWeek === s.week) return;
  r.lastWeek = s.week;
  for (const a of r.athletes) {
    const years = a.bornAge + Math.floor((s.week - a.startWeek) / 52);
    if (a.player) {
      const p = actor(s, a.path);
      if (p.contract && p.club === a.club) {
        a.contractUntil = p.contract.expiresWeek || s.week + 104;
        a.ability = p.ability;
      } else {
        a.player = false;
        a.status = "free";
        a.availableSince = s.week;
      }
      continue;
    }
    if (a.status === "contracted" && a.contractUntil <= s.week) {
      a.status = "free";
      a.availableSince = s.week;
      r.history.unshift({
        week: s.week,
        text: `${a.name}'s ${a.club} contract expired. A ${a.path} vacancy opened.`,
      });
    }
    if (
      years >=
        (a.path === "football" ? 38 : a.path === "basketball" ? 37 : 40) &&
      a.status !== "retired"
    ) {
      a.status = "retired";
      a.availableSince = s.week;
      r.history.unshift({
        week: s.week,
        text: `${a.name} retired from ${a.path}. Their ${a.club} place is available.`,
      });
    }
    if (s.week % 13 !== 0) continue;
    if (a.status === "contracted") {
      a.ability = clamp(
        a.ability + (years < 25 ? 0.3 : years > 31 ? -0.4 : 0.05),
      );
      a.form = clamp(a.form + (rng(s.realWorld) - 0.5) * 8);
      if (rng(s.realWorld) < 0.012)
        a.injuryUntil = s.week + 2 + Math.floor(rng(s.realWorld) * 8);
    } else if (s.week - a.availableSince >= 13 && rng(s.realWorld) < 0.5) {
      const old = a.name;
      if (a.status === "retired") {
        a.name = `${["Riley", "Jamie", "Alex", "Taylor"][Math.floor(rng(s.realWorld) * 4)]} ${["Costa", "Kim", "Singh", "Andersen"][Math.floor(rng(s.realWorld) * 4)]}`;
        a.bornAge = 18;
        a.startWeek = s.week;
        a.ability = 40 + a.level * 8;
      }
      a.status = "contracted";
      a.contractUntil =
        (Math.ceil(s.week / 52) + Math.floor(rng(s.realWorld) * 3)) * 52 + 46;
      r.history.unshift({
        week: s.week,
        text: `${a.name} signed a new ${a.club} agreement${old !== a.name ? " after a veteran retirement" : ""}.`,
      });
    }
  }
  r.history = r.history.slice(0, 80);
}
