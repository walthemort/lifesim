// Read-only cross-system effects: no imports from the simulation engine.
export function eraIndex(s) {
  return s.simulation?.era.enabled ? Math.max(.04, Math.min(8, Math.pow(1.025, (s.startingYear || 2026) + Math.floor(s.week / 52) - 2026))) : 1;
}
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
  return health + steps + (sim.education.active && s.school.enrolled && sim.education.support.plan !== "none" ? 2 : 0);
}
export function simulationCosts(s) {
  const sim = s.simulation; if (!sim || s.globalLife?.crime.prison) return 0;
  const weekly = { medication: 8, physiotherapy: 30, therapy: 25, hearingAid: 1 };
  const food = { household: 0, economical: 15, balanced: 35, athlete: 70, convenience: 50 };
  return (sim.health.active ? food[sim.health.nutrition] + sim.health.conditions.filter((c) => c.status === "active").reduce((n, c) => n + (weekly[c.treatment] || 0), 0) : 0) + (sim.social.active && s.family.livingTogether ? sim.social.stepChildren.filter((c) => c.partnerId === s.family.partnerId && c.ageAtMeeting + Math.floor((s.week - c.metWeek) / 52) < 18).length * 25 : 0);
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
