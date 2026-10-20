// Read-only cross-system effects: no imports from the simulation engine.
export function eraIndex(s) {
  return s.simulation?.era.enabled ? Math.max(.04, Math.min(8, Math.pow(1.025, (s.startingYear || 2026) + Math.floor(s.week / 52) - 2026))) : 1;
}
export function vehicleWearFactor(s, id) {
  const m = s.simulation?.mobility, v = m?.vehicles[id]; if (!m?.active || !v) return 1;
  const years = Math.max(0, s.week - v.boughtWeek) / 52, distance = Math.max(0, v.km - v.purchaseKm);
  return Math.max(.08, Math.min(1, v.condition / v.initialCondition) * Math.pow(id.startsWith("heritage-") ? .99 : .94, years) * Math.max(.5, 1 - distance / 400000));
}
export function mobilityDebt(s) { return (s.simulation?.mobility?.contracts || []).reduce((n, c) => n + (c.kind === "finance" && c.status !== "settled" ? c.balance : 0), 0); }
export function mobilityWeeklyCosts(s) {
  const m = s.simulation?.mobility; if (!m?.active) return 0;
  return m.contracts.filter((c) => c.status !== "settled").reduce((n, c) => n + Math.min(c.kind === "finance" ? c.balance : c.payment, c.payment), 0) + Object.values(m.vehicles).filter((v) => v.disposition === "owned" || v.disposition === "leased").reduce((n, v) => n + (v.insurance?.weekly || 0), 0) + m.storage.garage * 25 + m.storage.berth * 90 + m.storage.hangar * 250 + (s.globalLife.crime.prison || !s.employment && !s.school.enrolled ? 0 : m.commute === "public" ? 12 : m.commute === "vehicle" ? 18 : 0);
}
export function simulationCommute(s) {
  const m = s.simulation?.mobility; if (!m?.active || m.commute === "default") return 5;
  if (m.commute === "walk") return 10;
  if (m.commute === "public") return 6;
  const v = m.vehicles[m.commuteVehicle]; return v && v.condition >= 30 && (!v.incident || v.incident.repaired) ? 3 : 6;
}
export function outfitSuitability(s, context) {
  const selected = s.simulation?.home?.fashion.context; if (selected !== context) return 0;
  const garment = s.characterLife.profile.garment;
  return ["work", "formal"].includes(context) ? ["Suit", "Formal", "Shirt"].includes(garment) ? 2 : -1 : context === "sport" && ["T-shirt", "Hoodie"].includes(garment) ? 1 : 0;
}
export function renovationRentBonus(s, property) { return Math.min(.15, (s.simulation?.home?.projects || []).filter((p) => p.property === property && p.status === "complete").reduce((n, p) => n + (p.type === "extension" ? .08 : .03) * p.quality / 100, 0)); }
export function renovationBedrooms(s, property) { return (s.simulation?.home?.projects || []).some((p) => p.property === property && p.type === "extension" && p.status === "complete") ? 1 : 0; }
export function subjectAdmissionReason(s, programme) {
  if (!s.simulation?.education.active) return null;
  const route = ({ "medicine-degree": "medicine", "engineering-degree": "engineering", "law-degree": "law" })[programme];
  return route && !s.simulation.education.certificates.includes(route) ? `Earn the ${route} subject entrance record through school exams or adult catch-up classes first.` : null;
}
export function historicalJobReason(s, job) {
  if (!s.simulation?.era.enabled) return null;
  const y = (s.startingYear || 2026) + Math.floor(s.week / 52), name = job.title.toLowerCase();
  const firstYear = /cloud|social media|influencer/.test(name) ? 2005 : /software|computer|data scientist/.test(name) ? 1980 : 1900;
  return y < firstYear ? `This type of work becomes available from ${firstYear} in historical-world mode.` : null;
}
export function simulationHours(s, week = s.week) {
  const sim = s.simulation; if (!sim || s.globalLife?.crime.prison) return 0;
  const health = sim.health.active ? sim.health.appointments.filter((a) => a.status === "booked" && a.week === week).length * 2 + sim.health.household.filter((p) => p.until >= week).length * 2 : 0;
  const steps = sim.social.active && s.family.livingTogether ? sim.social.stepChildren.filter((c) => c.partnerId === s.family.partnerId && c.ageAtMeeting + Math.floor((week - c.metWeek) / 52) < 18).length * 4 : 0;
  return health + steps + (sim.education.active && s.school.enrolled && sim.education.support.plan !== "none" ? 2 : 0) + (sim.home?.projects.some((p) => ["active", "permit"].includes(p.status)) ? 2 : 0);
}
export function simulationCosts(s) {
  const sim = s.simulation; if (!sim) return 0; if (s.globalLife?.crime.prison) return mobilityWeeklyCosts(s);
  const weekly = { medication: 8, physiotherapy: 30, therapy: 25, hearingAid: 1 };
  const food = { household: 0, economical: 15, balanced: 35, athlete: 70, convenience: 50 };
  return (sim.health.active ? food[sim.health.nutrition] + sim.health.conditions.filter((c) => c.status === "active").reduce((n, c) => n + (weekly[c.treatment] || 0), 0) : 0) + (sim.social.active && s.family.livingTogether ? sim.social.stepChildren.filter((c) => c.partnerId === s.family.partnerId && c.ageAtMeeting + Math.floor((s.week - c.metWeek) / 52) < 18).length * 25 : 0) + mobilityWeeklyCosts(s) + (sim.home?.projects || []).filter((p) => p.status === "active").reduce((n, p) => n + p.installment, 0);
}
export function simulationPerformance(s) {
  const h = s.simulation?.health; if (!h?.active) return 0;
  const load = h.conditions.filter((c) => c.status === "active" && !["glasses", "hearingAid"].includes(c.treatment)).reduce((n, c) => n + c.severity, 0);
  return -Math.min(9, load / 35 + h.sleepDebt / 40 + h.burnout / 30);
}
export function historicalAvailability(s, id, kind = "product") {
  if (!s.simulation?.era.enabled) return null;
  const y = (s.startingYear || 2026) + Math.floor(s.week / 52);
  const dates = { phone: 2000, "premium-phone": 2007, "wireless-earbuds": 2015, "tablet-reader": 2010, "smart-speaker": 2014, "travel-charger": 2000, laptop: 1985, workstation: 1980, "portable-laptop": 1990, monitor: 1980, editing: 1990, webcam: 1995, console: 1972, "handheld-console": 1989, "vr-headset": 2012, "camera-drone": 2010, "action-camera": 2004, "sim-rig": 1995, "racing-controller": 1995, "private-jet": 1960, "altair-lightjet": 1960, "altair-global": 1990, "altair-turboprop": 1950, "volta-mini": 2010, "volta-cross": 2015, "volta-longrange": 2015, "volta-gt": 2020, car: 2010, "audio-interface": 1990, "midi-keyboard": 1983, "production-software": 1990 };
  const since = kind === "social" ? ({ lens: 2010, video: 2005, stream: 2011 })[id] || 2004 : kind === "market" ? /coin|crypto|btc|eth|orbit/i.test(id) ? 2009 : 1900 : dates[id] || 1900;
  return y < since ? `Available from ${since} in historical-world mode (current year ${y}).` : null;
}
