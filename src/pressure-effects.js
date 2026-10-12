export const PERFORMANCE_CHOICES = {
  football: {
    balanced: "Follow the team plan",
    link: "Link play & keep possession",
    attack: "Attack space & take risks",
  },
  racing: {
    balanced: "Balanced race plan",
    conserve: "Preserve tyres & consistency",
    undercut: "Early pit strategy",
    attack: "Take overtaking risks",
  },
  basketball: {
    balanced: "Follow the team plan",
    link: "Create shots for teammates",
    attack: "Drive & attack the basket",
  },
  tennis: {
    balanced: "Balanced point construction",
    conserve: "Stay patient & defend",
    attack: "Attack the serve & early ball",
  },
};
export const hashFraction = (text) => {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
};
export function fixtureContext(s, path, fixture) {
  const n = hashFraction(`${path}:${fixture.id}:${fixture.week}`);
  if (path === "racing")
    return n < 0.33
      ? "Wet conditions"
      : n < 0.66
        ? "High tyre wear"
        : "Cool, stable conditions";
  if (path === "tennis")
    return n < 0.5
      ? "Patient baseline opponent"
      : "Aggressive serving opponent";
  return n < 0.5
    ? "Opponent presses aggressively"
    : "Opponent defends compactly";
}
export function performancePlan(s, path, fixture) {
  const p = s.nextChapter?.plans[path];
  const actor = path === "football" ? s.football : s.sports[path];
  if (
    !p ||
    p.status !== "planned" ||
    p.fixtureId !== fixture.id ||
    p.week !== fixture.week ||
    p.club !== actor.club
  )
    return null;
  return p;
}
export function performanceBonus(s, path, fixture) {
  const p = performancePlan(s, path, fixture);
  if (!p || p.choice === "balanced") return 0;
  const context = fixtureContext(s, path, fixture);
  if (p.choice === "attack")
    return hashFraction(`${p.fixtureId}:${p.choice}:${p.chosenWeek}`) < 0.3
      ? -8
      : 4;
  if (p.choice === "undercut")
    return context === "Wet conditions"
      ? -3
      : context === "High tyre wear"
        ? 4
        : 1;
  if (p.choice === "conserve")
    return path === "racing" && context === "High tyre wear" ? 3 : 1;
  return context === "Opponent presses aggressively" ? 3 : 1;
}
export const performanceInjuryRisk = (s, path, f) => {
  const choice = performancePlan(s, path, f)?.choice;
  return choice === "attack"
    ? 1.6
    : choice === "conserve" || choice === "link"
      ? 0.8
      : 1;
};
export function finishPerformancePlan(s, path, f, selected) {
  const p = performancePlan(s, path, f);
  if (!p) return;
  p.status = selected ? "delivered" : "missed";
  p.resultWeek = s.week;
  p.score = f.result?.score || 0;
  if (selected && p.choice === "attack") s.energy = Math.max(0, s.energy - 4);
  s.nextChapter.planHistory.unshift({ ...p, path });
  s.nextChapter.planHistory = s.nextChapter.planHistory.slice(0, 40);
}
export const familySportAbsence = (s, path, week = s.week) =>
  !!s.nextChapter?.familyRequests.some(
    (r) => r.status === "agreed" && r.choice === "attend" && r.dueWeek === week,
  );
export const chapterHours = (s, week = s.week) =>
  (s.nextChapter?.familyRequests || [])
    .filter((r) => r.status === "agreed" && r.dueWeek === week)
    .reduce(
      (n, r) => n + (r.choice === "attend" ? 6 : r.choice === "video" ? 1 : 4),
      0,
    );
export const recordingCampaignBoost = (s, id) => {
  const p = s.nextChapter?.recordings[id];
  if (!p || s.social.privacy !== "public") return 1;
  return p.marketing === "campaign" ? 1.35 : p.marketing === "local" ? 1.12 : 1;
};
export const contentCampaignBoost = (s, id) => {
  const p = s.nextChapter?.content[id];
  if (!p) return 1;
  const trend = ["lifestyle", "football", "business", "gaming", "music"][
    Math.floor(hashFraction(`trend:${Math.floor(p.createdWeek / 13)}`) * 5)
  ];
  return p.theme === trend && p.researched ? 1.2 : 1;
};
export const publicHiringPenalty = (s) =>
  s.fame.recognition >= 40 ? Math.max(0, 35 - s.fame.reputation) / 350 : 0;
