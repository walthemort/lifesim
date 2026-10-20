export const PERSONALITY = {
  confidence: "Confidence",
  ambition: "Ambition",
  patience: "Patience",
  discipline: "Discipline",
  empathy: "Empathy",
};
const clamp = (n) => Math.max(0, Math.min(100, n));
export function personalityModifier(s, situation) {
  const p = s.characterLife?.personality;
  if (!p) return 0;
  const keys = {
    interview: ["confidence", "discipline"],
    work: ["ambition", "discipline"],
    training: ["discipline", "patience"],
    relationships: ["empathy", "patience"],
    performance: ["confidence", "discipline"],
  }[situation];
  return keys
    ? keys.reduce((n, k) => n + (p[k] - 50), 0) / keys.length / 10
    : 0;
}
export function growPersonality(s, changes) {
  if (!s.characterLife) return;
  for (const [key, change] of Object.entries(changes))
    if (Object.hasOwn(PERSONALITY, key))
      s.characterLife.personality[key] = clamp(
        s.characterLife.personality[key] + change,
      );
}
export function personalityChoice(s, option) {
  if (s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52) < 5)
    return;
  growPersonality(s, {
    discipline: option.discipline > 0 || option.grade > 0 ? 0.5 : 0,
    ambition: option.skill > 0 ? 0.25 : 0,
    empathy: option.charisma > 0 || option.empathy > 0 ? 0.25 : 0,
    patience: option.energy > 0 ? 0.25 : 0,
    confidence: option.football > 0 || option.recognition > 0 ? 0.25 : 0,
  });
}
