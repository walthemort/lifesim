import {
  age,
  CHILD_ACTIVITIES,
  CHILD_INTERESTS,
  childhoodStage,
  childhoodAllowance,
  recommendedSleep,
} from "./engine.js";
export function childhoodScreen(s, u) {
  const { title, panelHeading, e, money, tag, meter } = u,
    a = age(s),
    c = s.childhood,
    parents = s.relationships.filter((r) => r.role === "Parent");
  return `${title("FROM YOUR FIRST BREATH", "Your early years.", "Family, play, school and little choices build the person you become. Your interests can change as you grow.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">YOUR LIFE STAGE</span><h2>${e(childhoodStage(s))}</h2><p>Age ${a} · next birthday in ${52 - (s.week % 52)} weeks</p></section><section class="panel"><span class="eyebrow">SCHOOL & LEARNING</span><h2>${a < 3 ? "Learning at home" : a < 5 ? "Preschool" : a < 12 ? "Primary school" : a < 18 ? "Secondary school" : "School years completed"}</h2><p>${s.school.enrolled ? `School results ${Math.round(s.school.grade)} / 100. Graduation depends on your results at eighteen.` : a < 5 ? "Your family cares for you. Formal school starts at five." : "Your existing qualifications stay with your adult life."}</p></section><section class="panel"><span class="eyebrow">FAMILY SUPPORT</span><h2>${a < 18 ? money(childhoodAllowance(s)) + "/week" : "Your own budget"}</h2><p>${a < 6 ? "Your basic needs are covered; you do not earn wages or pay rent." : a < 12 ? "Your family covers basic needs and childhood club fees. The allowance is your own money." : a < 18 ? "$15 weekly personal costs. Independent work and investments unlock at eighteen." : "Childhood support has ended. Earnings and expenses follow your current circumstances."}</p></section></div><section class="panel wide-panel">${panelHeading("Growing at your own pace", "Childhood development comes from time, care and the activities you choose.")}<div class="everyday-grid">${Object.entries(
    c.development,
  )
    .map(
      ([k, v]) =>
        `<article class="everyday-card"><h3>${e(k[0].toUpperCase() + k.slice(1))}</h3><p>${Math.round(v)} / 100</p>${meter(v, "green")}</article>`,
    )
    .join(
      "",
    )}</div><p class="muted">An automatic calendar allows about ${recommendedSleep(s)} hours of sleep per day at your age. Age up simulates actual weeks until your next birthday, a pending choice or the end of your life. Weekly play remains available.</p></section>${
    a < 18
      ? `<section class="panel wide-panel">${panelHeading("Little moments", "Free, age-appropriate activities. Each uses an action and can be done once per week.")}<div class="everyday-grid">${CHILD_ACTIVITIES.map((x) => `<article class="everyday-card"><h3>${e(x.name)}</h3><p>${e(x.description)}</p><button class="button secondary" data-action="childhood-activity" data-id="${x.id}" ${a < x.minAge || !s.actions || s.event || c.activities[x.id] === s.week ? "disabled" : ""}>${a < x.minAge ? `Available at age ${x.minAge}` : "Spend time"}</button></article>`).join("")}</div></section><section class="panel wide-panel">${panelHeading("Discover your interests", "Local activities come first. Ability, education, licences and recruitment still decide later opportunities.")}<div class="everyday-actions">${CHILD_INTERESTS.filter(
          (x) => x.id !== "unemployed",
        )
          .map(
            (x) =>
              `<button class="button secondary" data-action="childhood-interest" data-id="${x.id}" ${a < x.minAge || !s.actions || s.event ? "disabled" : ""}>${e(x.name)}${a < x.minAge ? ` · age ${x.minAge}+` : ""}</button>`,
          )
          .join(
            "",
          )}</div><p class="muted">Football begins at five; karting, basketball, tennis and music lessons begin at six. Your family covers local sport fees before twelve. Academy assessments begin from eight in football and ten in other sports. Existing hobbies can continue together; exploring an interest does not award a job.</p></section>`
      : ""
  }<section class="panel wide-panel">${panelHeading("The family you grew up with", "These relationships are separate from a future partner or children of your own.")}<div class="everyday-grid">${
    parents
      .map((r) => {
        const p = s.connections.profiles[r.id];
        return `<article class="everyday-card"><h3>${e(r.name)}</h3>${tag("Parent", "purple")}<p>Age ${a + p.ageOffset} · ${e(p.job)}<br>Connection ${Math.round(r.bond)} · trust ${Math.round(p.trust)}</p>${meter(r.bond, "purple")}</article>`;
      })
      .join("") ||
    '<p class="muted">Older saved lives keep their existing family and contacts. No childhood is invented for them.</p>'
  }</div>${
    s.relationships.some((r) => r.role === "Best friend")
      ? `<p class="muted">School friends: ${s.relationships
          .filter((r) => r.role === "Best friend")
          .map((r) => e(r.name))
          .join(", ")}.</p>`
      : ""
  }</section><section class="panel wide-panel">${panelHeading("Your childhood memories", "Birthdays, milestones and choices remain part of your story.")}<div class="application-list">${
    c.milestones
      .slice()
      .reverse()
      .map(
        (m) =>
          `<div class="application-row"><div><strong>${e(m.text)}</strong><small>Age ${m.age} · week ${m.week}</small></div></div>`,
      )
      .join("") ||
    '<p class="muted">Childhood milestones appear as a new life grows.</p>'
  }${c.choices
    .slice(0, 8)
    .map(
      (x) =>
        `<div class="application-row"><div><strong>${e(x.title)}</strong><small>${e(x.choice)} · week ${x.week}</small></div></div>`,
    )
    .join("")}</div></section>`;
}
