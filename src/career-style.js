import { availableCash } from "./world.js";
const kit = (id, path, name, price, colour, pro = false) => ({
  id,
  path,
  name,
  price,
  colour,
  pro,
  assetKey: `career/gear/${id}`,
});
export const CAREER_KIT = [
  kit("football-issued", "football", "Club-issued boots", 0, "#7694a7"),
  kit("football-classic", "football", "Heritage leather boots", 45, "#484a54"),
  kit("football-speed", "football", "Velocity boots", 90, "#eab36b"),
  kit(
    "football-aurora",
    "football",
    "Aurora signature boots",
    150,
    "#c29be7",
    true,
  ),
  kit("racing-issued", "racing", "Club helmet", 0, "#7694a7"),
  kit("racing-comet", "racing", "Comet helmet livery", 120, "#e6a079"),
  kit("racing-aurora", "racing", "Aurora helmet livery", 180, "#b29be7", true),
  kit("basketball-issued", "basketball", "Club court shoes", 0, "#7694a7"),
  kit("basketball-flight", "basketball", "Flight high-tops", 75, "#7ad3b2"),
  kit(
    "basketball-aurora",
    "basketball",
    "Aurora court shoes",
    120,
    "#b29be7",
    true,
  ),
  kit("tennis-issued", "tennis", "Club racket", 0, "#7694a7"),
  kit("tennis-control", "tennis", "Control racket design", 85, "#7ad3b2"),
  kit("tennis-aurora", "tennis", "Aurora racket design", 140, "#b29be7", true),
];
const celebration = (id, name, pose, pro = false) => ({
  id,
  name,
  pose,
  pro,
  assetKey: `career/celebrations/${id}`,
});
export const CAREER_CELEBRATIONS = {
  football: [
    celebration("wave", "Wave to the fans", "wave"),
    celebration("heart", "Heart to the crowd", "heart"),
    celebration("slide", "Knee-slide pose", "slide"),
    celebration("signature", "Signature spotlight", "star", true),
  ],
  racing: [
    celebration("salute", "Podium salute", "wave"),
    celebration("fist", "Finish-line fist pump", "fist"),
    celebration("trophy", "Trophy lift", "trophy"),
    celebration("signature", "Signature podium moment", "star", true),
  ],
  basketball: [
    celebration("team", "Celebrate with the team", "wave"),
    celebration("three", "Three-point gesture", "fist"),
    celebration("heart", "Heart to the stands", "heart"),
    celebration("signature", "Signature court celebration", "star", true),
  ],
  tennis: [
    celebration("thanks", "Thank the crowd", "wave"),
    celebration("fist", "Quiet fist pump", "fist"),
    celebration("trophy", "Trophy lift", "trophy"),
    celebration("signature", "Signature match-point pose", "star", true),
  ],
};
export function initializeCareerStyle() {
  return {
    owned: [],
    equipment: Object.fromEntries(
      Object.keys(CAREER_CELEBRATIONS).map((p) => [p, `${p}-issued`]),
    ),
    celebrations: Object.fromEntries(
      Object.entries(CAREER_CELEBRATIONS).map(([p, items]) => [p, items[0].id]),
    ),
  };
}
const allowed = (s) => s.debug.enabled || s.characterLife.proPreview;
const active = (s, path) =>
  !["none", "retired"].includes(
    (path === "football" ? s.football : s.sports[path]).stage,
  );
function check(s, path) {
  if (
    !Object.hasOwn(CAREER_CELEBRATIONS, path) ||
    !active(s, path) ||
    s.ended ||
    s.globalLife.crime.prison
  )
    throw new Error(
      "Personalise the kit of an active sporting path outside custody.",
    );
}
export function equipCareerKit(state, id) {
  const k = CAREER_KIT.find((k) => k.id === id);
  if (!k) throw new Error("Choose a career kit model.");
  check(state, k.path);
  if (k.pro && !allowed(state) && !state.profession.style.owned.includes(id))
    throw new Error(
      "This design needs Pro preview or Debug access. No purchase is offered in this build.",
    );
  const owned = k.price === 0 || state.profession.style.owned.includes(id);
  if (!owned && availableCash(state) < k.price)
    throw new Error("Fund this cosmetic kit from uncommitted cash.");
  const s = structuredClone(state);
  if (!owned) {
    s.money = Math.round((s.money - k.price) * 100) / 100;
    s.profession.style.owned.push(id);
  }
  s.profession.style.equipment[k.path] = id;
  return s;
}
export function setCareerCelebration(state, path, id) {
  check(state, path);
  const c = CAREER_CELEBRATIONS[path].find((c) => c.id === id);
  if (!c) throw new Error("Choose a celebration for this sport.");
  if (c.pro && !allowed(state))
    throw new Error(
      "This signature animation is part of the local Pro preview.",
    );
  const s = structuredClone(state);
  s.profession.style.celebrations[path] = id;
  return s;
}
export function kitIllustration(k) {
  const shape =
    k.path === "racing"
      ? `<path d="M36 108V72q5-45 50-43 45 4 47 52l-8 35H57Z" fill="${k.colour}"/><path d="M43 64q49-20 85 5l-4 23H51Z" fill="#17232e"/><path d="M49 59q33-21 63-4M70 111h49" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>`
      : k.path === "tennis"
        ? `<ellipse cx="91" cy="63" rx="29" ry="38" transform="rotate(23 91 63)" fill="#d5e8e112" stroke="${k.colour}" stroke-width="8"/><path d="M64 95l-22 42" stroke="${k.colour}" stroke-width="13" stroke-linecap="round"/><path d="M73 36l34 56m-24-60 34 51M64 61l47-19M66 78l54-22" stroke="#e8ece799" stroke-width="1.5"/>`
        : `<path d="M28 93l12-31 28 10 5 14 48 19q16 6 15 22H31q-13-4-3-34Z" fill="${k.colour}"/><path d="M28 120h108v12H29Z" fill="#dbe5e4"/><path d="M58 82l12 9m-5-12 13 10m-5-5 14 9" stroke="#fff" stroke-width="3"/><path d="M40 76l-6 19q25 11 44 6" fill="none" stroke="#17232e66" stroke-width="5"/>${k.path === "football" ? '<path d="M41 134v6m17-6v6m47-6v6m16-6v6" stroke="#b9cbca" stroke-width="5"/>' : ""}`;
  return `<svg class="career-kit-preview" viewBox="0 0 160 160" role="img" aria-label="${k.name}" data-model-key="${k.assetKey}"><circle cx="80" cy="80" r="68" fill="${k.colour}16"/>${shape}</svg>`;
}
export function celebrationIllustration(c) {
  const arms = {
    wave: "M58 77L35 59 28 29M80 77l22 21",
    heart: "M58 76L47 64 66 56 77 66 87 56 103 64 80 77",
    slide: "M58 76L31 55m49 22 27-22",
    fist: "M58 76L40 73 38 49m42 28 24 16",
    trophy: "M59 76L45 50 57 28m23 49 17-27-9-22",
    star: "M58 77L31 43m49 34 28-34",
  }[c.pose];
  return `<svg class="celebration-preview" viewBox="0 0 140 150" role="img" aria-label="${c.name}" data-model-key="${c.assetKey}"><circle cx="70" cy="45" r="15" fill="#c18e6c"/><path d="M70 66v43M69 109l-19 27m19-27 22 27${arms}" fill="none" stroke="#83d4b3" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export function validateCareerStyle(style) {
  if (
    !style ||
    !Array.isArray(style.owned) ||
    style.owned.length > CAREER_KIT.length ||
    new Set(style.owned).size !== style.owned.length ||
    style.owned.some((id) => !CAREER_KIT.some((k) => k.id === id)) ||
    !style.equipment ||
    !style.celebrations ||
    Object.keys(style.equipment).length !== 4 ||
    Object.keys(style.celebrations).length !== 4 ||
    Object.keys(CAREER_CELEBRATIONS).some(
      (path) =>
        !CAREER_KIT.some(
          (k) =>
            k.path === path &&
            k.id === style.equipment[path] &&
            (k.price === 0 || style.owned.includes(k.id)),
        ) ||
        !CAREER_CELEBRATIONS[path].some(
          (c) => c.id === style.celebrations[path],
        ),
    )
  )
    throw new Error("Invalid career kit or celebration data.");
}
