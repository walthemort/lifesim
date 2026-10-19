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
export { characterPortrait } from "./portraits.js";
import { characterPortrait, portraitStage } from "./portraits.js";
function selectField(key, label, values, current, e) {
  return `<label class="field-label">${label}<select name="${key}" aria-label="${e(label)}">${values.map((value) => `<option value="${e(value)}" ${value === current ? "selected" : ""}>${e(value)}</option>`).join("")}</select></label>`;
}
export function profileFields(s, u, creating = false) {
  const { e } = u,
    p = s.characterLife.profile;
  return `<div class="identity-preview">${characterPortrait({ ...p, visualAge: creating ? 0 : age(s) })}<div><strong data-creator-name>${e(s.name)}</strong><p>Your appearance follows you through every age.</p><label class="field-label">Preview age<select data-portrait-age aria-label="Preview age">${[
    [0, "Baby"],
    [2, "Infant"],
    [9, "Child"],
    [16, "Teen"],
    [24, "Young adult"],
    [42, "Adult"],
    [70, "Older adult"],
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${portraitStage(creating ? 0 : age(s)) === label ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label></div></div><div class="everyday-grid"><label class="field-label">Your name<input name="name" maxlength="32" value="${e(s.name)}" required autocomplete="off"></label>${selectField("pronouns", "Pronouns", PROFILE_OPTIONS.pronouns, p.pronouns, e)}${creating ? `<label class="field-label">Birth country<select name="country" id="creator-country">${COUNTRIES.map((c) => `<option value="${c.code}" ${c.code === placeCountry(p.birthplace) ? "selected" : ""}>${e(c.name)}</option>`).join("")}</select></label><label class="field-label">Find a birthplace<input id="creator-city-search" type="search" placeholder="Search cities in this country"></label>${selectField("birthplace", "Birthplace", [...new Set([...WORLD_CITIES, p.birthplace])], p.birthplace, e)}` : s.debug.enabled ? selectField("birthplace", "Birthplace", [...new Set([...WORLD_CITIES, p.birthplace])], p.birthplace, e) : ""}${Object.entries(
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
  return `<div class="eyebrow">${debug ? "DEBUG CHARACTER CREATOR" : "PRO CHARACTER CREATOR"}</div><h2>Create your next life.</h2><p>${debug ? "Customize a sandbox life. Age, cash and skills are Debug controls." : "Choose your identity and family. Your life still starts at birth; skills and qualifications must be earned."} This replaces your current life; export it first to keep both.</p><form id="character-form"><label class="field-label">Starting year<input name="startingYear" type="number" value="${s.startingYear}" min="1900" max="2100" step="1" required></label><p class="muted">Choose your birth year to begin as yourself. This sets the calendar for your life.</p>${profileFields(s, u, true)}<div class="everyday-grid">${debug ? selectField("city", "Home city", [...new Set([...WORLD_CITIES, s.city])], s.city, e) : ""}${selectField("trait", "Your personality", ["Ambitious", "Social", "Analytical", "Athletic"], s.trait, e)}<label class="field-label">Family background<select name="familyBackground"><option value="modest">Modest household</option><option value="comfortable" selected>Comfortable household</option><option value="wealthy">Wealthy household</option></select></label><label class="field-label">Life path / interest<select name="career">${Object.entries(
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
