import {
  COUNTRIES,
  CITY_CATALOGUE,
  placeCountry,
  WORLD_CITIES,
  country,
} from "./geography.js";
import { PRO_HAIRSTYLES } from "./expansion-data.js";
import { relocationScreen } from "./expansion-screens.js";
import {
  HOMETOWNS,
  PROFILE_OPTIONS,
  PERSONALITY,
  LIFE_PATHS,
  ROUTINE_FOCUS,
  PERSONAL_GOALS,
  routineAvailable,
  creatorAvailable,
  parentTime,
} from "./identity.js";
import { relativeAlive } from "./life-course.js";
import { DEBUG_SPECIALIST_SKILLS } from "./debug.js";
const age = (s) => s.startAge + Math.floor(s.week / 52);
const colours = {
  Light: "#f1cfb1",
  Medium: "#c98c60",
  Deep: "#76503a",
  Black: "#292329",
  Brown: "#644634",
  Blonde: "#d8b868",
  Red: "#a55235",
  Grey: "#8b929d",
  Blue: "#85b6f0",
  Green: "#65dda7",
  Purple: "#b4a0ef",
  Orange: "#e9a080",
};
let portraitSerial = 0;
export function characterPortrait(p) {
  const years = p.visualAge ?? 24;
  p = {
    ...p,
    facialHair: years < 16 ? "None" : p.facialHair,
    hair: years >= 60 ? "Grey" : p.hair,
  };
  const ageDetail =
    years >= 40
      ? `<g fill="none" stroke="#3c2823" opacity="${Math.min(0.6, 0.18 + (years - 40) * 0.008)}" stroke-width=".8"><path d="M43 45q17-5 34 0M39 66l8 2m26-2 8 2M40 74l5 8m34-8-5 8M45 89q15 8 30 0"/></g>`
      : "";
  const id = `portrait-${portraitSerial++}`;
  const skin =
    {
      Porcelain: "#f3d8c7",
      Light: "#e9bb99",
      Olive: "#c7a27a",
      Medium: "#bd825d",
      Tan: "#a66e4f",
      Deep: "#79523d",
      "Rich deep": "#4e342b",
    }[p.skin] || "#bd825d";
  const hair = colours[p.hair] || colours.Brown,
    outfit = colours[p.outfit] || "#202633",
    eye = colours[p.eyes] || "#5e4230";
  const rx =
    years < 5 ? 31 : p.face === "Round" ? 30 : p.face === "Angular" ? 25 : 27;
  const styles = {
    Short: "M31 56V39Q32 12 59 13Q92 11 91 45L83 57 80 36Q57 43 39 35L38 56Z",
    Long: "M27 109V39Q28 9 59 9Q94 9 94 44V114L81 107V45L69 29Q54 42 38 41V108Z",
    Curly:
      "M28 53Q17 36 31 29Q25 17 42 17Q47 4 60 14Q77 3 84 21Q102 24 94 39Q102 48 88 57L80 36Q63 43 40 37L36 57Z",
    Shaved: "",
    "Buzz cut": "M33 42Q35 16 61 17Q87 18 88 44L82 34Q60 21 39 35Z",
    Fade: "M32 59V38Q35 12 62 14Q89 17 89 44L85 60 80 37Q59 45 39 35L36 59Z",
    "Side part":
      "M32 56V36Q39 9 70 15Q92 19 89 46L84 52 79 29Q62 37 38 38L36 55Z",
    Ponytail:
      "M87 30Q110 30 103 64L99 94Q84 80 89 62L85 46M32 51V35Q33 12 62 12Q92 12 89 51L82 40Q60 24 39 42Z",
    Bob: "M28 88V37Q29 10 61 10Q94 9 94 40V88L80 92V43L70 29Q53 39 40 40V92Z",
    Braids:
      "M30 48Q28 10 61 10Q93 11 93 47L84 41 77 26Q63 19 40 37ZM29 40L24 117 33 115 39 39ZM86 38L94 116 102 114 93 38Z",
    Dreadlocks:
      "M26 48Q22 12 60 10Q96 10 96 48L86 46 80 28 70 42 64 26 54 45 46 27 37 52ZM27 42L24 105 33 105 37 46ZM88 43L92 104 100 104 95 41Z",
    Afro: "M29 64Q8 49 19 34Q10 12 35 13Q38 -2 58 6Q77 -1 86 13Q110 13 103 34Q114 48 94 65L84 43Q66 23 38 43Z",
    "Space buns":
      "M28 34Q8 27 20 14Q33 7 41 22M80 21Q88 5 104 16Q115 31 93 36M31 51V34Q33 12 62 12Q92 15 90 53L81 40Q61 23 39 42Z",
    "Wolf cut":
      "M25 93L28 36Q28 11 62 12Q94 12 95 39L100 95 83 83 79 38 73 51 63 33 52 52 43 35 37 84Z",
    Pompadour:
      "M31 54V37Q17 15 45 7Q89 -3 91 31L87 53 81 36Q64 41 40 34L37 54Z",
  };
  const shape = styles[p.hairstyle] || styles.Short,
    back = [
      "Long",
      "Bob",
      "Braids",
      "Dreadlocks",
      "Afro",
      "Ponytail",
      "Wolf cut",
    ].includes(p.hairstyle);
  const hairDetail =
    p.hairstyle === "Braids"
      ? `<g stroke="#160e09" stroke-width="1.3" opacity=".55" fill="none">${Array.from(
          { length: 12 },
          (_, i) => {
            const y = 48 + i * 5;
            return `<path d="M29 ${y}l5 3-5 3m65-6 5 3-5 3"/>`;
          },
        ).join(
          "",
        )}<path d="M38 29q5-12 17-13m-13 17q7-14 20-16m-12 17q9-15 19-15"/></g>`
      : ["Afro", "Curly"].includes(p.hairstyle)
        ? `<g fill="none" stroke="#fff" opacity=".12" stroke-width=".9">${Array.from({ length: 18 }, (_, i) => `<circle cx="${25 + (i % 6) * 13}" cy="${19 + Math.floor(i / 6) * 9}" r="3"/>`).join("")}</g>`
        : p.hairstyle === "Dreadlocks"
          ? '<g stroke="#1b120e" opacity=".5" fill="none" stroke-width="1.5"><path d="M30 46l-2 58m5-57-2 51m61-50 4 53m-6-48 3 47M38 27l-1 18m10-26-1 17m12-20-1 17m12-19-1 17m12-16-1 18"/></g>'
          : "";
  const garment = p.garment || "T-shirt";
  const outfitDetail =
    garment === "Suit" || garment === "Formal"
      ? '<path d="M47 109L60 142 73 109 65 111 60 133 55 111Z" fill="#f1e9df"/><path d="M39 111L50 155 59 140 43 107M81 111L70 155 61 140 77 107" fill="#101b29"/>'
      : garment === "Hoodie"
        ? '<path d="M42 109Q60 141 78 109L75 102Q60 127 45 102Z" fill="#000" opacity=".25"/><path d="M50 122v25m20-25v25" stroke="#e6e6e6" opacity=".6"/>'
        : garment === "Jacket"
          ? '<path d="M43 106L57 137 57 190M77 106L63 137 63 190" stroke="#1a202d" stroke-width="5"/><path d="M31 141h18m22 0h18" stroke="#fff" opacity=".15"/>'
          : garment === "Shirt"
            ? '<path d="M47 108L58 126 60 115 62 126 73 108" fill="#fff" opacity=".35"/><path d="M60 118v73" stroke="#fff" opacity=".2"/>'
            : garment === "Knitwear"
              ? '<path d="M28 132h64m-66 8h68m-67 8h66m-66 8h66m-66 8h66m-66 8h66" stroke="#fff" opacity=".09"/>'
              : "";
  const brows = p.eyebrows === "Thick" ? 3 : p.eyebrows === "Arched" ? 1.4 : 2;
  const beard =
    p.facialHair === "Beard"
      ? '<path d="M34 73Q36 105 60 105Q85 103 87 73L77 88Q60 96 43 86Z"/>'
      : p.facialHair === "Stubble"
        ? '<path d="M35 77Q40 105 61 104Q82 99 86 76L76 89Q58 97 44 86Z" opacity=".25"/>'
        : p.facialHair === "Moustache"
          ? '<path d="M48 82Q60 76 72 82L76 87Q61 83 45 87Z"/>'
          : "";
  return `<svg class="character-portrait shaded-portrait" viewBox="0 0 120 200" role="img" aria-label="Character portrait"><defs><linearGradient id="${id}-skin" x1="0" x2="1" y1="0" y2=".5"><stop stop-color="${skin}"/><stop offset=".45" stop-color="${skin}"/><stop offset="1" stop-color="#20151a" stop-opacity=".65"/></linearGradient><linearGradient id="${id}-fabric" x1="0" x2="1" y2=".6"><stop stop-color="${outfit}"/><stop offset=".55" stop-color="${outfit}"/><stop offset="1" stop-color="#080e1c"/></linearGradient><radialGradient id="${id}-bg"><stop stop-color="#33475b"/><stop offset="1" stop-color="#111b2a"/></radialGradient></defs><rect width="120" height="200" rx="18" fill="url(#${id}-bg)"/><ellipse cx="60" cy="194" rx="48" ry="6" fill="#000" opacity=".3"/>${back ? `<path d="${shape}" fill="${hair}"/>` : ""}<path d="M49 86h22v29H49Z" fill="url(#${id}-skin)"/><path d="M49 89Q60 103 71 89v13q-11 7-22-1Z" fill="#39231a" opacity=".25"/><path d="M10 198v-55Q10 112 45 109q15 16 30 0 35 3 35 34v55Z" fill="url(#${id}-fabric)"/><path d="M26 144l-4 54m73-54 3 54" stroke="#000" opacity=".15" stroke-width="4"/>${outfitDetail}<ellipse cx="32" cy="65" rx="5" ry="10" fill="${skin}"/><ellipse cx="89" cy="65" rx="5" ry="10" fill="${skin}"/><ellipse cx="60" cy="60" rx="${rx}" ry="38" fill="url(#${id}-skin)"/><path d="M42 59q6-5 13 0m10 0q6-5 13 0" stroke="#392b28" stroke-width="1.3" fill="none"/><g fill="#e9e4df"><ellipse cx="48" cy="61" rx="6" ry="3"/><ellipse cx="72" cy="61" rx="6" ry="3"/></g><g fill="${eye}"><circle cx="49" cy="61" r="2.7"/><circle cx="71" cy="61" r="2.7"/></g><g fill="#171923"><circle cx="49" cy="61" r="1.3"/><circle cx="71" cy="61" r="1.3"/></g><g fill="#fff"><circle cx="50" cy="60" r=".7"/><circle cx="72" cy="60" r=".7"/></g><path d="M41 52q8-${p.eyebrows === "Arched" ? 6 : 2} 14 0m10 0q8-2 14 0" stroke="${hair}" stroke-width="${brows}" fill="none" stroke-linecap="round"/><path d="M61 61l-4 12q4 3 8 0" stroke="#5e382c" opacity=".5" fill="none"/><path d="M50 84q10 4 20 0" stroke="#703f3b" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M49 81q11-4 22 0" stroke="#b57868" opacity=".3" fill="none"/><g fill="${hair}">${beard}<path d="${shape}"/></g>${hairDetail}${ageDetail}<path d="M40 32Q49 20 68 21" stroke="#fff" opacity=".1" stroke-width="3" fill="none"/></svg>`;
}
function selectField(key, label, values, current, e) {
  return `<label class="field-label">${label}<select name="${key}" aria-label="${e(label)}">${values.map((value) => `<option value="${e(value)}" ${value === current ? "selected" : ""}>${e(value)}</option>`).join("")}</select></label>`;
}
export function profileFields(s, u, creating = false) {
  const { e } = u,
    p = s.characterLife.profile;
  return `<div class="identity-preview">${characterPortrait(p)}<div><strong data-creator-name>${e(s.name)}</strong><p>Appearance is cosmetic. Your skills develop through life.</p></div></div><div class="everyday-grid"><label class="field-label">Your name<input name="name" maxlength="32" value="${e(s.name)}" required autocomplete="off"></label>${selectField("pronouns", "Pronouns", PROFILE_OPTIONS.pronouns, p.pronouns, e)}${creating ? `<label class="field-label">Birth country<select name="country" id="creator-country">${COUNTRIES.map((c) => `<option value="${c.code}" ${c.code === placeCountry(p.birthplace) ? "selected" : ""}>${e(c.name)}</option>`).join("")}</select></label><label class="field-label">Find a birthplace<input id="creator-city-search" type="search" placeholder="Search cities in this country"></label>${selectField("birthplace", "Birthplace", [...new Set([...WORLD_CITIES, p.birthplace])], p.birthplace, e)}` : s.debug.enabled ? selectField("birthplace", "Birthplace", [...new Set([...WORLD_CITIES, p.birthplace])], p.birthplace, e) : ""}${Object.entries(
    {
      skin: "Skin tone",
      hair: "Hair colour",
      hairstyle: "Hair style",
      eyes: "Eye colour",
      outfit: "Outfit colour",
      face: "Face shape",
      eyebrows: "Eyebrows",
      facialHair: "Facial hair",
      garment: "Outfit style",
    },
  )
    .map(([key, label]) =>
      selectField(
        key,
        label,
        key === "hairstyle" && !creatorAvailable(s)
          ? PROFILE_OPTIONS[key].filter((v) => !PRO_HAIRSTYLES.includes(v))
          : PROFILE_OPTIONS[key],
        p[key],
        e,
      ),
    )
    .join("")}</div>`;
}
export function characterCreatorForm(s, u) {
  const { e } = u,
    debug = s.debug.enabled;
  return `<div class="eyebrow">${debug ? "DEBUG CHARACTER CREATOR" : "PRO CHARACTER CREATOR"}</div><h2>Create your next life.</h2><p>${debug ? "Customize a sandbox life. Age, cash and skills are Debug controls." : "Choose your identity and family. Your life still starts at birth; skills and qualifications must be earned."} This replaces your current life; export it first to keep both.</p><form id="character-form">${profileFields(s, u, true)}<div class="everyday-grid">${debug ? selectField("city", "Home city", [...new Set([...WORLD_CITIES, s.city])], s.city, e) : ""}${selectField("trait", "Your personality", ["Ambitious", "Social", "Analytical", "Athletic"], s.trait, e)}<label class="field-label">Family background<select name="familyBackground"><option value="modest">Modest household</option><option value="comfortable" selected>Comfortable household</option><option value="wealthy">Wealthy household</option></select></label><label class="field-label">Life path / interest<select name="career">${Object.entries(
    {
      unemployed: "Still discovering",
      football: "Football",
      racing: "Karting & motorsport",
      basketball: "Basketball",
      tennis: "Tennis",
      music: "Music",
    },
  )
    .map(
      ([id, name]) =>
        `<option value="${id}" ${id === s.aspiration ? "selected" : ""}>${name}</option>`,
    )
    .join(
      "",
    )}</select></label></div><h3>Starting personality</h3><p class="muted">Confidence supports interviews and performances; ambition supports work; discipline and patience support practice; empathy and patience support relationships. These values evolve through activities and choices.</p><div class="everyday-grid">${Object.entries(
    PERSONALITY,
  )
    .map(
      ([key, label]) =>
        `<label class="field-label">${label}<input name="personality:${key}" type="number" value="50" min="${debug ? 0 : 30}" max="${debug ? 100 : 70}" step="1" required></label>`,
    )
    .join("")}</div>${
    debug
      ? `<details class="creator-debug"><summary>Debug starting age, money, skills & qualifications</summary><div class="everyday-grid"><label class="field-label">Starting age<input name="age" type="number" min="0" max="60" step="1" value="0" required></label><label class="field-label">Starting cash<input name="money" type="number" min="0" max="1000000000000" step="0.01" placeholder="Use the normal starting balance"></label><label class="field-label">Starting qualification<select name="qualification"><option value="">Earn qualifications normally</option>${u.programmes.map((p) => `<option value="${p.id}">${e(p.name)}</option>`).join("")}</select></label></div><p class="muted">Leave a skill blank to keep its natural starting value. Grants do not manufacture past schooling or sporting experience.</p><div class="everyday-grid">${Object.keys(
          s.skills,
        )
          .map(
            (key) =>
              `<label class="field-label">${e(key)}<input name="skill:${key}" type="number" min="0" max="100" step="0.1" placeholder="Natural starting value"></label>`,
          )
          .join("")}${DEBUG_SPECIALIST_SKILLS.filter(
          (d) => !d.id.startsWith("personality."),
        )
          .map(
            (d) =>
              `<label class="field-label">${e(d.label)}<input name="specialist:${d.id}" type="number" min="0" max="100" step="0.1" placeholder="Natural starting value"></label>`,
          )
          .join("")}</div></details>`
      : '<input type="hidden" name="age" value="0">'
  }<button class="button primary full-width" type="submit">Begin my story</button></form>`;
}
export function routineScreen(s, u, only = null) {
  const { panelHeading, e, tag, money } = u;
  return Object.entries(LIFE_PATHS)
    .filter(([id]) => (!only || id === only) && routineAvailable(s, id))
    .map(([path, d]) => {
      const r = s.characterLife.routines[path],
        support = s.characterLife.support;
      return `<section class="panel wide-panel" data-identity-routine="${path}">${panelHeading(`${d.name} routine & support`, "A focused routine reserves three hours every week; injury, exhaustion or insufficient time can prevent delivery.", tag(`${r?.sessions || 0} sessions`, "blue"))}<form data-form="identity-routine" data-path="${path}"><div class="form-row"><label class="field-label">${d.name} routine<select name="focus" aria-label="${d.name} routine">${Object.entries(
        {
          none: "No extra routine",
          craft:
            path === "music"
              ? {
                  producer: "Production & studio sessions",
                  rapper: "Writing & delivery practice",
                  singer: "Vocal practice & rehearsals",
                }[s.music.role]
              : d.craft,
          fitness: "Conditioning & wellbeing",
          recover: "Rest & recovery",
          network: "Communication & confidence",
        },
      )
        .map(
          ([key, label]) =>
            `<option value="${key}" ${(r?.focus || "none") === key ? "selected" : ""}>${e(label)}</option>`,
        )
        .join(
          "",
        )}</select></label><button type="submit" class="button secondary" ${!s.actions || s.event || s.ended || r?.changedWeek === s.week ? "disabled" : ""}>Plan ${d.name.toLowerCase()} routine</button></div></form><p class="muted">Planning costs an action and one hour; each delivered session adds a small relevant gain. ${r?.missed || 0} sessions missed. Routines award no contracts, licences, fans or work experience. Recovery never instantly heals an injury.</p>${age(s) < 18 && ["football", "racing", "basketball", "tennis", "music", "creator"].includes(path) ? `<p>${support?.path === path ? `${support.sessions} family coaching sessions · ${money(support.paid)} paid from parents’ savings · ends in ${Math.max(0, support.endsWeek - s.week)} weeks.` : "Parents can support twelve weeks of extra coaching if their time, finances, relationship and school expectations allow. Two weekly hours are reserved; fees are paid by parents only for delivered sessions."}</p><button class="button secondary" data-action="identity-family-support" data-id="${path}" ${!s.actions || s.event || s.ended || support || (s.characterLife.supportRequestedWeek !== null && s.week < s.characterLife.supportRequestedWeek + 13) ? "disabled" : ""}>Ask family about ${d.name.toLowerCase()} coaching</button>` : ""}</section>`;
    })
    .join("");
}
export function identityScreen(s, u) {
  const { title, panelHeading, e, money, meter, tag } = u,
    c = s.characterLife,
    town = HOMETOWNS[s.city];
  const goals = PERSONAL_GOALS.filter(
    (g) =>
      age(s) >= g.minAge &&
      !g.done(s) &&
      !c.completedGoals.some((x) => x.id === g.id),
  );
  return `${title("IDENTITY, ROOTS & PERSONAL AMBITIONS", "A life that feels like yours.", "Your identity, the people raising you and the place you call home shape your opportunities.")}<section class="panel wide-panel">${panelHeading("Your character", "Appearance and nationality do not determine ability or access to jobs.")}<div class="identity-preview">${characterPortrait({ ...c.profile, visualAge: age(s), condition: s.health })}<div><h2>${e(s.name)}</h2><p>${e(c.profile.pronouns)} · ${e(c.profile.nationality)}<br>Born in ${e(c.profile.birthplace)}, ${e(country(s.globalLife.birthCountry).name)}<br>Citizenship: ${s.globalLife.citizenships.map((code) => e(country(code).name)).join(", ")}<br>Living in ${e(s.city)}, ${e(country(s.globalLife.residence.country).name)}</p>${creatorAvailable(s) ? '<button class="button secondary" data-action="identity-edit-profile">Edit character profile</button>' : '<p class="muted">Character customization is available with Debug or Pro access. Ordinary lives begin with a random identity.</p>'}<button class="button secondary" data-action="new-game">${creatorAvailable(s) ? "Open character creator" : "Start a new life"}</button></div></div></section>${relocationScreen(s, u)}<section class="panel wide-panel">${panelHeading("Personality in practice", "Small advantages change preparation and progress; qualification and career gates always apply.")}<div class="everyday-grid">${Object.entries(
    PERSONALITY,
  )
    .map(
      ([id, label]) =>
        `<article class="everyday-card"><h3>${label}</h3><p>${c.personality[id].toFixed(1)} / 100</p>${meter(c.personality[id], "purple")}</article>`,
    )
    .join("")}</div><div class="inline-actions">${Object.entries({
    confidence: "Practise speaking up",
    discipline: "Plan and follow through",
    reflection: "Reflect & listen",
  })
    .map(
      ([id, label]) =>
        `<button class="button secondary" data-action="identity-development" data-id="${id}" ${age(s) < 5 || !s.actions || s.event || s.ended || c.developmentWeek === s.week ? "disabled" : ""}>${label}</button>`,
    )
    .join(
      "",
    )}</div><p class="muted">Personal development opens at five, costs an action, two hours and three energy, once weekly. Confidence affects interviews and performances; ambition affects work; discipline/patience affect training; empathy/patience affect relationships. Ordinary life choices also shape these values.</p></section><section class="panel wide-panel">${panelHeading("Your hometown", `${town.neighbourhood}, ${s.city} · a fictional local community`)}<div class="everyday-grid">${Object.entries(
    {
      School: town.school,
      "Local sports": town.club,
      "Music & creators": town.venue,
      "Local employer": town.employer,
    },
  )
    .map(
      ([label, place]) =>
        `<article class="everyday-card"><h3>${label}</h3><p>${e(place)}</p></article>`,
    )
    .join(
      "",
    )}</div><p class="muted">Local fees differ by city: Copenhagen 90%, London 100%, New York 115% and Monaco 160% of the basic workshop fee. The places above are fictional. Workshop windows refresh every thirteen weeks; available activities depend on your age. A workshop is exposure and practice, never a job, professional contract or qualification.</p><div class="everyday-grid">${
    c.localOffers
      .filter(
        (o) => o.city === s.city && ["offered", "booked"].includes(o.status),
      )
      .map(
        (o) =>
          `<article class="everyday-card" data-local-offer="${e(o.id)}"><h3>${LIFE_PATHS[o.path].name} workshop</h3><p>${e(o.venue)}<br>${money(o.fee)} entry · four hours next week<br>${o.status === "booked" ? `Booked for week ${o.performanceWeek}` : `Closes in ${o.expiresWeek - s.week} weeks`}</p>${o.status === "offered" ? `<button class="button secondary" data-action="identity-book-local" data-id="${e(o.id)}" ${!s.actions || s.event || s.ended || s.money < o.fee || c.localOffers.some((o) => o.status === "booked") ? "disabled" : ""}>Book local workshop</button>` : tag("Booked", "blue")}<button class="text-button" data-view="${["football", "racing", "basketball", "tennis"].includes(o.path) ? "sports" : o.path === "music" ? "music" : o.path === "creator" ? "social" : o.path === "school" ? "childhood" : "career"}">Explore this path</button></article>`,
      )
      .join("") ||
    '<p class="muted">Local activities open as you grow. Your family cares for you during your earliest years.</p>'
  }</div></section><section class="panel wide-panel">${panelHeading("The family behind your interests", "Basic childhood needs remain covered. Extra coaching needs real time and savings.")}<div class="everyday-grid">${
    s.relationships
      .filter((r) => r.role === "Parent")
      .map(
        (r) =>
          `<article class="everyday-card"><h3>${e(r.name)}</h3><p>${relativeAlive(s, r.id) ? `${money(s.connections.profiles[r.id].wealth)} in their own savings<br>${parentTime(s, r.id)} hours available for extra coaching each week<br>Interest: ${LIFE_PATHS[c.parentInterests[r.id] || "school"].name}` : "Remembered in your family story"}</p><p>Connection ${Math.round(r.bond)} · trust ${Math.round(s.connections.profiles[r.id].trust)}</p></article>`,
      )
      .join("") ||
    '<p class="muted">Your existing life has no recorded parent contacts. No past family story has been invented.</p>'
  }</div><p class="muted">Coaching is available for active sports/music from childhood and creator accounts from thirteen. A request uses one action/hour, has a thirteen-week cooldown and can be declined. Savings must cover twelve session fees within 5% of eligible parents’ wealth; at least 60 connection/trust and 45 school grade are needed. Shared interests improve the chance of support. Parents with high work commitments have less spare time.</p>${c.supportHistory.map((r) => `<p class="muted">Week ${r.week}: ${LIFE_PATHS[r.path].name} coaching ${r.agreed ? "agreed" : "declined"}.</p>`).join("")}</section><section class="panel wide-panel">${panelHeading("Personal goals", "Choose a future ambition. Completion is recorded once, from actual play.")}<p>${c.goal ? `Current goal: ${e(PERSONAL_GOALS.find((g) => g.id === c.goal.id).name)}` : "You can explore freely or choose something to work towards."}</p>${goals.length ? `<form id="identity-goal-form"><div class="form-row"><label class="field-label">Your next personal goal<select name="goal">${goals.map((g) => `<option value="${g.id}">${e(g.name)}</option>`).join("")}</select></label><button class="button secondary" type="submit" ${s.event || s.ended ? "disabled" : ""}>Choose personal goal</button></div></form>` : '<p class="muted">More goals open as you grow.</p>'}<p class="muted">Choosing a goal costs no action. Reaching it adds three happiness once; existing achievements cannot be claimed again.</p>${c.completedGoals.map((g) => `<p>${e(PERSONAL_GOALS.find((d) => d.id === g.id).name)} · achieved in week ${g.achievedWeek}</p>`).join("")}</section><section class="panel wide-panel">${panelHeading("Your life timeline", "First experiences, family support and goals observed during this life. Earlier events in imported saves are not reconstructed.")}<div class="application-list">${c.memories.map((m) => `<div class="application-row"><div><strong>${e(m.text)}</strong><small>Age ${m.age} · week ${m.week}</small></div>${tag(m.kind, "purple")}</div>`).join("") || '<p class="muted">Your next meaningful moments will appear here.</p>'}</div></section>`;
}
