export const PATH_NAMES = {
  football: "Football",
  racing: "Motorsport",
  basketball: "Basketball",
  tennis: "Tennis",
  music: "Music",
  creator: "Content creation",
  business: "Founder",
  office: "Office work",
  investor: "Professional investing",
  medicine: "Medicine",
  nursing: "Nursing",
  teaching: "Teaching",
  engineering: "Engineering",
  trades: "Skilled trades",
  hospitality: "Hospitality",
  law: "Law",
};
export const SPORT_PATHS = ["football", "racing", "basketball", "tennis"];
export function activeCareerPath(s) {
  if (s.employment) return s.career;
  if (s.company && s.career === "business" && !s.profession?.company.delegated)
    return "business";
  const active = SPORT_PATHS.filter(
    (id) =>
      !["none", "retired"].includes(
        (id === "football" ? s.football : s.sports[id]).stage,
      ),
  );
  if (active.includes(s.career)) return s.career;
  if (active.includes(s.aspiration)) return s.aspiration;
  if (active.length) return active[0];
  if (s.music.active && !s.realWorld?.retiredMusic) return "music";
  if (s.profession?.creator.committed) return "creator";
  return null;
}
export function careerPathReason(s, path) {
  if (!s.profession) return null;
  const current = activeCareerPath(s);
  return current && current !== path
    ? `Leave your ${PATH_NAMES[current] || current} path before starting ${PATH_NAMES[path] || path}. You must qualify for the new path.`
    : null;
}
export function assertCareerPath(s, path) {
  const reason = careerPathReason(s, path);
  if (reason) throw new Error(reason);
}
