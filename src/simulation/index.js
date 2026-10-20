import { initializeEducation, advanceEducation, validateEducation } from "./education.js";
import { initializeHealth, advanceHealth, validateHealth } from "./health.js";
import { initializeSocial, advanceSocial, validateSocial, syncSocial } from "./social.js";
import { initializeMobility, advanceMobility, validateMobility } from "./mobility.js";
import { initializeHome, advanceHome, validateHome } from "./home.js";
import { initializeProfessions, advanceProfessions, validateProfessions } from "./professions.js";
import { num, str, bool, arr, obj } from "./common.js";
export * from "./education.js";
export * from "./health.js";
export * from "./social.js";
export * from "./actions.js";
export * from "./mobility.js";
export * from "./home.js";
export * from "./professions.js";
export function initializeSimulation(s) {
  s.simulation = { schema: 1, originSeed: s.seed, seed: (s.seed ^ 0x7b615d) >>> 0, serial: 0, lastWeek: s.week, journal: [], era: { enabled: false }, education: initializeEducation(s), health: initializeHealth(s), social: initializeSocial(s), mobility: initializeMobility(s), home: initializeHome(s), professions: initializeProfessions(s) };
  syncSocial(s);
}
export function advanceSimulation(s) {
  if (s.simulation.lastWeek === s.week) return;
  s.simulation.lastWeek = s.week;
  advanceEducation(s); advanceHealth(s); advanceSocial(s);
  advanceMobility(s);
  advanceHome(s);
  advanceProfessions(s);
}
export function validateSimulation(s) {
  const sim = obj(s.simulation); if (sim.schema !== 1) throw new Error("Unsupported detailed simulation data.");
  num(sim.originSeed, 0, 4294967295, true); num(sim.seed, 0, 4294967295, true); num(sim.serial, 0, 1e9, true); num(sim.lastWeek, 0, s.week, true); bool(obj(sim.era).enabled);
  for (const j of arr(sim.journal, 80)) { obj(j); num(j.week, 0, s.week, true); str(j.text, 500); }
  validateEducation(s); validateHealth(s); validateSocial(s);
  validateMobility(s);
  validateHome(s);
  validateProfessions(s);
}
