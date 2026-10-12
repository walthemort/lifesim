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
export function characterPortrait(p) {
  const colour = (key, fallback) => colours[p[key]] || fallback;
  const hair =
    p.hairstyle === "Shaved"
      ? ""
      : p.hairstyle === "Long"
        ? '<path d="M27 58V44a33 33 0 0 1 66 0v44H78V52H42v36H27Z"/>'
        : p.hairstyle === "Curly"
          ? '<path d="M27 48a14 14 0 0 1 8-24 14 14 0 0 1 23-8 14 14 0 0 1 25 10 15 15 0 0 1 9 24l-13-6-20-13-20 14Z"/>'
          : '<path d="M29 48V38c0-34 63-34 63 0v12L73 33 47 42Z"/>';
  return `<svg class="character-portrait" viewBox="0 0 120 140" role="img" aria-label="Character portrait"><rect width="120" height="140" rx="18" fill="#1b2636"/><path d="M12 140v-18c0-38 96-38 96 0v18Z" fill="${colour("outfit", colours.Green)}"/><path d="M49 79h22v30H49Z" fill="${colour("skin", colours.Medium)}"/><g fill="${colour("hair", colours.Brown)}">${p.hairstyle === "Long" ? hair : ""}</g><ellipse cx="60" cy="58" rx="29" ry="36" fill="${colour("skin", colours.Medium)}"/><g fill="${colour("hair", colours.Brown)}">${p.hairstyle !== "Long" ? hair : ""}</g><g fill="${colour("eyes", colours.Brown)}"><circle cx="48" cy="59" r="3"/><circle cx="72" cy="59" r="3"/></g><path d="M52 77q8 6 16 0" fill="none" stroke="#704335" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function selectField(key, label, values, current, e) {
  return `<label class="field-label">${label}<select name="${key}" aria-label="${e(label)}">${values.map((value) => `<option value="${e(value)}" ${value === current ? "selected" : ""}>${e(value)}</option>`).join("")}</select></label>`;
}
export function profileFields(s, u) {
  const { e } = u,
    p = s.characterLife.profile;
  return `<div class="identity-preview">${characterPortrait(p)}<div><strong data-creator-name>${e(s.name)}</strong><p>Appearance is cosmetic. Your skills develop through life.</p></div></div><div class="everyday-grid"><label class="field-label">Your name<input name="name" maxlength="32" value="${e(s.name)}" required autocomplete="off"></label>${selectField("pronouns", "Pronouns", PROFILE_OPTIONS.pronouns, p.pronouns, e)}${selectField("nationality", "Nationality", PROFILE_OPTIONS.nationality, p.nationality, e)}${selectField("birthplace", "Birthplace", Object.keys(HOMETOWNS), p.birthplace, e)}${Object.entries(
    {
      skin: "Skin tone",
      hair: "Hair colour",
      hairstyle: "Hair style",
      eyes: "Eye colour",
      outfit: "Outfit colour",
    },
  )
    .map(([key, label]) =>
      selectField(key, label, PROFILE_OPTIONS[key], p[key], e),
    )
    .join("")}</div>`;
}
export function characterCreatorForm(s, u) {
  const { e } = u,
    debug = s.debug.enabled;
  return `<div class="eyebrow">${debug ? "DEBUG CHARACTER CREATOR" : "PRO CHARACTER CREATOR"}</div><h2>Create your next life.</h2><p>${debug ? "Customize a sandbox life. Age, cash and skills are Debug controls." : "Choose your identity and family. Your life still starts at birth; skills and qualifications must be earned."} This replaces your current life; export it first to keep both.</p><form id="character-form">${profileFields(s, u)}<div class="everyday-grid">${selectField("city", "Home city", Object.keys(HOMETOWNS), s.city, e)}${selectField("trait", "Your personality", ["Ambitious", "Social", "Analytical", "Athletic"], s.trait, e)}<label class="field-label">Family background<select name="familyBackground"><option value="modest">Modest household</option><option value="comfortable" selected>Comfortable household</option><option value="wealthy">Wealthy household</option></select></label><label class="field-label">Life path / interest<select name="career">${Object.entries(
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
  return `${title("IDENTITY, ROOTS & PERSONAL AMBITIONS", "A life that feels like yours.", "Your identity, the people raising you and the place you call home shape your opportunities.")}<section class="panel wide-panel">${panelHeading("Your character", "Appearance and nationality do not determine ability or access to jobs.")}<div class="identity-preview">${characterPortrait(c.profile)}<div><h2>${e(s.name)}</h2><p>${e(c.profile.pronouns)} · ${e(c.profile.nationality)}<br>Born in ${e(c.profile.birthplace)} · living in ${e(s.city)}</p>${creatorAvailable(s) ? '<button class="button secondary" data-action="identity-edit-profile">Edit character profile</button>' : '<p class="muted">Character customization is available with Debug or Pro access. Ordinary lives begin with a random identity.</p>'}<button class="button secondary" data-action="new-game">${creatorAvailable(s) ? "Open character creator" : "Start a new life"}</button></div></div></section><section class="panel wide-panel">${panelHeading("Personality in practice", "Small advantages change preparation and progress; qualification and career gates always apply.")}<div class="everyday-grid">${Object.entries(
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
