import * as g from "../src/engine.js";
import { next } from "./career-world-fixtures.js";
export {
  athlete,
  clear,
  next,
  weeks,
  professional,
  moveOffer,
  musician,
  musicOffer,
} from "./career-world-fixtures.js";
export function labelOffer(s) {
  const o = {
    id: `label:fixture:${s.week}`,
    name: "Northline Independent Records",
    advance: 1000,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  s.music.labelOffers.push(o);
  return o;
}
export function sportsOffer(s, sector) {
  const p = sector === "football" ? s.football : s.sports[sector];
  const o = {
    id: `clauses:${sector}:${s.week}`,
    kind: "contract",
    club: p.club,
    jobId: p.contract.jobId,
    pay: s.employment.weeklyPay,
    duration: 104,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  g.enhanceSportOffer(s, sector, o);
  p.offers.push(o);
  return o;
}
export function endorsementOffer(s, sector, brand = 0) {
  const b = g.ENDORSEMENT_BRANDS[brand];
  const o = {
    id: `image:fixture:${s.contracts.serial++}`,
    sector,
    brand: b.name,
    category: b.category,
    fee: 1000,
    status: "offered",
    expiresWeek: s.week + 4,
  };
  s.contracts.offers.push(o);
  return o;
}
export function contactReady(s, field = "office", level = 2) {
  const id = Object.keys(s.livingWorld.people)[0];
  if (!id) throw new Error("This fixture needs a non-relative contact.");
  Object.assign(s.livingWorld.people[id], {
    field,
    level,
    talent: 75,
    reputation: 30,
    developedWeeks: 104,
  });
  s.relationships.find((r) => r.id === id).bond = 80;
  s.connections.profiles[id].trust = 80;
  return id;
}
export function challengeOffer(s, path, kind) {
  let o;
  for (let i = 0; i < 14; i++) {
    g.advanceMilestones(s);
    o = s.careerMilestones.paths[path].opportunities.find(
      (o) => o.kind === kind && o.status === "offered",
    );
    if (o || g.challengeEligibility(s, kind).length) break;
    Object.assign(s, next(s));
  }
  if (!o)
    throw new Error(
      `Fixture does not qualify for ${kind}: ${g.challengeEligibility(s, kind).join(", ")}`,
    );
  return o;
}
