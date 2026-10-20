import { ROLE_WEIGHTS } from "./profession-data.js";
import { fixtureContext, hashFraction } from "./pressure-effects.js";
import { activeCareerPath } from "./career-commitment.js";
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function currentSportSpecialties(s, path) {
  const p = s.profession.sports[path],
    a = path === "football" ? s.football : s.sports[path],
    earned = Math.max(0, a.ability - p.foundation);
  return Object.fromEntries(
    Object.entries(p.skills).map(([key, value]) => [
      key,
      clamp(value + earned, 0, 100),
    ]),
  );
}
export const orderCashReserved = (s) =>
  (s.profession?.investing.orders || [])
    .filter((o) => o.status === "pending" && o.side === "buy")
    .reduce((n, o) => n + Math.round(o.quantity * o.limit * 100) / 100, 0);
export const orderSharesReserved = (s, id) =>
  (s.profession?.investing.orders || [])
    .filter(
      (o) => o.status === "pending" && o.side === "sell" && o.asset === id,
    )
    .reduce((n, o) => n + o.quantity, 0);
export function specialtyBonus(s, path, fixture) {
  const p = s.profession?.sports[path];
  if (!p || !p.participating) return 0;
  const actor = path === "football" ? s.football : s.sports[path];
  const skills = currentSportSpecialties(s, path);
  let keys = ROLE_WEIGHTS[path][p.role] || Object.keys(p.skills);
  if (path === "racing" && fixture) {
    const context = fixtureContext(s, path, fixture);
    if (context === "Wet conditions") keys = ["wet", "racecraft"];
    else if (context === "High tyre wear") keys = ["tyres", "racecraft"];
  }
  const mastery =
    keys.reduce((n, k) => n + (skills[k] ?? actor.ability), 0) / keys.length;
  return clamp((mastery - actor.ability) * 0.12, -5, 5) - p.fatigue * 0.045;
}
export const tennisSurface = (f) =>
  ["Hard court", "Clay court", "Grass court"][
    Math.floor(hashFraction(f.id + ":surface") * 3)
  ];
export function detailedTacticBonus(s, path, f) {
  const p = s.profession?.sports[path],
    t = p?.tactics,
    a = path === "football" ? s.football : s.sports[path];
  if (!t || t.fixtureId !== f.id || t.week !== f.week || t.club !== a.club)
    return 0;
  const d = t.details,
    k = currentSportSpecialties(s, path),
    c = fixtureContext(s, path, f),
    scaled = (key, n) => n * (0.35 + k[key] / 155);
  if (path === "racing")
    return clamp(
      (d.setup === "downforce"
        ? c === "Wet conditions"
          ? scaled("wet", 3)
          : c === "High tyre wear"
            ? 1
            : -1
        : d.setup === "lowDrag"
          ? c === "Wet conditions"
            ? -3
            : 2
          : 0) +
        (d.compound === "wet"
          ? c === "Wet conditions"
            ? 4
            : -5
          : d.compound === "soft"
            ? c === "High tyre wear"
              ? -3
              : c === "Wet conditions"
                ? -4
                : 2
            : d.compound === "hard"
              ? c === "High tyre wear"
                ? 3
                : c === "Wet conditions"
                  ? -4
                  : 0
              : 0),
      -8,
      7,
    );
  if (path === "football")
    return (
      (d.responsibility === "possession"
        ? scaled("passing", c === "Opponent presses aggressively" ? 3 : 1)
        : d.responsibility === "runner"
          ? scaled("positioning", c === "Opponent defends compactly" ? 1 : 3)
          : d.responsibility === "cover"
            ? scaled("defending", 2)
            : 0) +
      (d.setPiece === "corners"
        ? scaled("passing", 1)
        : d.setPiece === "freeKicks"
          ? scaled("finishing", 1)
          : d.setPiece === "marking"
            ? scaled("defending", 1)
            : 0)
    );
  if (path === "basketball")
    return (
      (d.shot === "perimeter"
        ? scaled("shooting", c === "Opponent defends compactly" ? 3 : 1)
        : d.shot === "paint"
          ? scaled("shooting", c === "Opponent defends compactly" ? -1 : 3)
          : d.shot === "facilitate"
            ? scaled("playmaking", 2)
            : 0) +
      (d.coverage === "zone"
        ? scaled("defence", 1)
        : d.coverage === "man"
          ? scaled("defence", k.defence >= 60 ? 2 : -1)
          : 0)
    );
  const surface = tennisSurface(f);
  return (
    (d.pattern === "baseline"
      ? scaled("baseline", surface === "Clay court" ? 3 : 1)
      : d.pattern === "volley"
        ? scaled("net", surface === "Grass court" ? 3 : 0)
        : d.pattern === "serve"
          ? scaled("serve", surface === "Clay court" ? 0 : 2)
          : 0) +
    (d.risk === "patient"
      ? scaled("movement", 1)
      : d.risk === "attack"
        ? k.serve >= 65
          ? 2
          : -2
        : 0)
  );
}
export const trainingRisk = (s, path) =>
  s.profession?.sports[path]?.participating
    ? 1 + s.profession.sports[path].fatigue / 100
    : 1;
export const professionHours = (s, week = s.week) =>
  s.globalLife?.crime.prison
    ? 0
    : Object.entries(s.profession?.sports || {}).reduce(
        (n, [path, p]) =>
          n +
          (path === activeCareerPath(s) &&
          p.block &&
          ((p.block.status !== "cancelled" &&
            week > p.block.startedWeek &&
            week <= p.block.endsWeek) ||
            p.block.deliveredWeek === week)
            ? p.block.hours
            : 0),
        0,
      );
export function artisticDiscovery(s) {
  const p = s.profession?.music;
  if (!p?.enabled) return 1;
  return p.direction === "accessible"
    ? 1.12
    : p.direction === "experimental"
      ? 0.86
      : 1;
}
export function artisticRetention(s, r) {
  const p = s.profession?.music;
  if (!p?.enabled) return 1;
  return p.direction === "experimental"
    ? r.quality >= 65
      ? 1.045
      : 0.96
    : p.direction === "accessible"
      ? r.quality < 55
        ? 0.94
        : 1.005
      : 1;
}
export function seriesAudienceBonus(s, post) {
  const x = s.profession?.creator.series.find((x) => x.id === post.seriesId);
  return x ? clamp(0.8 + x.retention / 200, 0.8, 1.25) : 1;
}
