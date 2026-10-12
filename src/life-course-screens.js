import {
  SCHOOL_CLUBS,
  TEEN_JOBS,
  relativeAlive,
  teenWorkHours,
} from "./life-course.js";
const age = (s) => s.startAge + Math.floor(s.week / 52);
export function schoolLifeScreen(s, u) {
  const { panelHeading, money, e, tag } = u,
    c = s.lifeCourse.school,
    a = age(s),
    active = s.school.enrolled && a < 18;
  if (a < 5) return "";
  if (
    a >= 18 &&
    !s.education.active &&
    !c.exams.length &&
    !c.totalWages &&
    c.route === "undecided" &&
    c.scholarship.status === "none"
  )
    return "";
  const focus = `<form id="school-focus-form"><label class="field-label">School focus<select name="focus">${["balanced", "academic", "creative", "sport"].map((id) => `<option value="${id}" ${c.focus === id ? "selected" : ""}>${id}</option>`).join("")}</select></label><p class="muted">Academic focus adds three committed hours per week. Creative and sporting interests develop slowly alongside your normal lessons.</p><button class="button secondary" type="submit">Set school focus</button></form>`;
  const club = `<form id="school-club-form"><label class="field-label">Extracurricular club<select name="club"><option value="none">No organised club</option>${SCHOOL_CLUBS.filter(
    (x) => a >= x.minAge,
  )
    .map(
      (x) =>
        `<option value="${x.id}" ${c.club === x.id ? "selected" : ""}>${e(x.name)} · ${x.hours} hours · ${money(x.cost)}/week</option>`,
    )
    .join(
      "",
    )}</select></label><p class="muted">${a < 12 ? "Your family covers primary-school club fees." : "Club fees come from your own budget."} Regular attendance develops relevant skills.</p><button class="button secondary" type="submit" ${!s.actions || s.event ? "disabled" : ""}>Choose school club</button></form>`;
  const classmates = `<h3>Your classmates</h3><div class="everyday-grid">${c.peers.map((p) => `<article class="everyday-card"><h3>${e(p.name)}</h3><p>Friendship ${Math.round(p.friendship)} · rivalry ${Math.round(p.rivalry)}</p><div class="inline-actions"><button class="button secondary" data-action="school-peer" data-id="${p.id}" data-kind="befriend" ${!s.actions || s.event || c.actions["befriend:" + p.id] === s.week ? "disabled" : ""}>Spend time together</button><button class="button secondary" data-action="school-peer" data-id="${p.id}" data-kind="compete" ${!s.actions || s.event || c.actions["compete:" + p.id] === s.week ? "disabled" : ""}>Challenge academically</button></div></article>`).join("")}</div>`;
  const jobs =
    a >= 16 && active
      ? `<form id="teen-job-form"><h3>A job around school</h3><label class="field-label">School-age part-time job<select name="job"><option value="none">No part-time work</option>${TEEN_JOBS.map((j) => `<option value="${j.id}" ${c.partTime === j.id ? "selected" : ""}>${e(j.name)} · ${j.hours} hours · ${money(j.pay)}/week${j.grade ? ` · grade ${j.grade}+` : ""}</option>`).join("")}</select></label><p class="muted">Work uses real calendar hours. Exhaustion can prevent wages; these arrangements end at eighteen. Ordinary adult jobs still require separate applications.</p><button class="button secondary" type="submit" ${!s.actions || s.event ? "disabled" : ""}>Choose part-time job</button></form>`
      : "";
  const exams = `<h3>Exam record</h3><p class="muted">Secondary exams happen in week 49 of each year. Results combine school grades, knowledge and preparation. Revision preparation is capped at 50 and resets after each exam.</p><div class="application-list">${
    c.exams
      .slice()
      .reverse()
      .map(
        (x) =>
          `<div class="application-row"><strong>Age ${x.age}: ${x.score}/100</strong><small>Week ${x.week}</small></div>`,
      )
      .join("") ||
    '<p class="muted">No exam records yet. Older saves do not receive invented past results.</p>'
  }</div>`;
  const route =
    a >= 16
      ? `<form id="school-route-form"><label class="field-label">Your next route<select name="route">${["undecided", "university", "apprenticeship", "work", "creative"].map((id) => `<option value="${id}" ${c.route === id ? "selected" : ""}>${id}</option>`).join("")}</select></label><p class="muted">A plan does not grant a qualification or job. Review actual course and vacancy requirements in Work & education.</p><button class="button secondary" type="submit">Plan next chapter</button></form>`
      : "";
  return `<section class="panel wide-panel" data-school-life>${panelHeading("School life & your future", "Lessons, clubs, friends and results shape your options.", tag(active ? "Enrolled" : "School archive", "blue"))}<div class="life-metrics"><div><span>Exam preparation</span><strong>${c.preparation}/50</strong></div><div><span>School club</span><strong>${e(SCHOOL_CLUBS.find((x) => x.id === c.club)?.name || "None")}</strong><small>${c.clubWeeks} attendance weeks</small></div><div><span>Part-time wages</span><strong>${money(c.lastWages)}/week</strong><small>${money(c.totalWages)} total · ${teenWorkHours(s)} work hours</small></div></div>${active ? `<div class="everyday-grid"><div>${focus}</div><div>${club}</div></div>${a >= 12 ? `<button class="button secondary" data-action="exam-prepare" ${!s.actions || s.event || c.actions.prepare === s.week ? "disabled" : ""}>Prepare for exams</button>` : ""}${classmates}${jobs}` : ""}${exams}${route}<h3>Education funding</h3><p>${c.scholarship.status === "awarded" ? `Merit scholarship: half-price tuition for ${c.scholarship.remaining} more enrolled weeks. ${money(c.scholarship.used)} saved so far.` : c.scholarship.status === "exhausted" ? "Your merit tuition award has been used." : "Merit awards require age 18–25, school graduation and an average of 85 across two or more exams, including your final year. No qualification is awarded automatically."}</p><div class="inline-actions">${a >= 18 && a <= 25 && c.scholarship.status === "none" ? `<button class="button secondary" data-action="school-scholarship" ${!s.actions || s.event ? "disabled" : ""}>Apply for merit scholarship</button>` : ""}${a >= 16 && a <= 25 ? `<button class="button secondary" data-action="family-funding" ${!s.actions || s.event ? "disabled" : ""}>Ask family for education support</button>` : ""}</div></section>`;
}
export function originFamilyScreen(s, u) {
  const { panelHeading, e, money, tag } = u,
    a = age(s),
    c = s.lifeCourse;
  const relatives = s.relationships.filter((r) => c.relatives[r.id]);
  return `<section class="panel wide-panel" data-origin-family>${panelHeading("Your living family", "Relatives have their own savings, health, careers and retirement.")}<p class="muted">Household background: ${e(c.background)}. Family money is separate from your own cash. Education support requires a strong relationship and available savings.</p><div class="everyday-grid">${
    relatives
      .map((r) => {
        const p = s.connections.profiles[r.id],
          person = c.relatives[r.id],
          alive = relativeAlive(s, r.id),
          years = alive
            ? a + p.ageOffset
            : s.startAge + Math.floor(person.deceasedWeek / 52) + p.ageOffset;
        return `<article class="everyday-card"><h3>${e(r.name)}</h3>${tag(r.role, "purple")}<p>${alive ? "Age" : "Died aged"} ${years} · ${e(p.job)}<br>Health ${Math.round(person.health)} · connection ${Math.round(r.bond)}<br>${money(p.weeklyPay)}/week · ${money(p.wealth)} savings</p><p>${e(p.plans)}</p>${alive ? `<div class="inline-actions"><button class="button secondary" data-action="relative-support" data-kind="visit" data-id="${e(r.id)}" ${a < 5 || !s.actions || s.event ? "disabled" : ""}>Visit</button><button class="button secondary" data-action="relative-support" data-kind="money" data-id="${e(r.id)}" ${a < 18 || !s.actions || s.event ? "disabled" : ""}>Send $100</button><button class="button secondary" data-action="relative-support" data-kind="care" data-id="${e(r.id)}" ${a < 18 || !s.actions || s.event ? "disabled" : ""}>Arrange care · $50</button></div>` : ""}</article>`;
      })
      .join("") ||
    '<p class="muted">Existing adult saves keep their original contacts. Parents and siblings are created when a new life grows up from birth.</p>'
  }</div><h3>Family & life memories</h3><div class="application-list">${
    c.memories
      .slice(0, 10)
      .map(
        (m) =>
          `<div class="application-row"><div><p>${e(m.text)}</p><small>Week ${m.week}</small></div></div>`,
      )
      .join("") ||
    '<p class="muted">Milestones and family changes will be remembered here.</p>'
  }</div></section>`;
}
export function ageingScreen(s, u) {
  const { title, panelHeading, e, money, meter } = u,
    a = age(s),
    b = s.lifeCourse.body;
  return `${title("HEALTH, RECOVERY & A LIFETIME", "Your body changes with you.", "Build sustainable habits, manage lasting injury wear and prepare for life after competition.")}<section class="panel">${panelHeading("Physical condition", a < 12 ? "Your family handles care while you grow. Independent conditioning starts at twelve." : "Fitness and mobility gradually change with age. Training and treatment can help, with time, energy and financial costs.")}<div class="life-metrics"><div><span>Fitness</span><strong>${Math.round(b.fitness)}/100</strong>${meter(b.fitness, "green")}</div><div><span>Mobility</span><strong>${Math.round(b.mobility)}/100</strong>${meter(b.mobility, "blue")}</div><div><span>Overall health</span><strong>${Math.round(s.health)}/100</strong>${meter(s.health, "purple")}</div></div><p class="muted">Fitness gradually declines after thirty-five and mobility after forty-five. Athletic ability and injury risk are affected earlier; racing has a later ability peak. Recovery gets longer with age. Existing injuries are preserved when an old save is upgraded.</p><div class="everyday-grid">${[
    ["conditioning", "Conditioning", 12, 0, "Fitness +1 · 3 hours · energy −5"],
    ["mobility", "Mobility session", 18, 0, "Mobility +1 · 3 hours"],
    [
      "rehabilitation",
      "Rehabilitation",
      18,
      80,
      "Reduce each sporting injury-wear score by 0.5 · 3 hours · energy −2",
    ],
  ]
    .map(
      ([id, name, min, cost, text]) =>
        `<article class="everyday-card"><h3>${name}</h3><p>${text}${cost ? ` · ${money(cost)}` : ""}</p><button class="button secondary" data-action="body-care" data-id="${id}" ${a < min || !s.actions || s.event || b.actions[id] === s.week ? "disabled" : ""}>${name}</button></article>`,
    )
    .join(
      "",
    )}</div></section><section class="panel">${panelHeading("Lasting injury wear", "Wear affects performance and future injury risk. Rehabilitation reduces wear without instantly healing a current injury.")}<div class="life-metrics">${Object.entries(
    b.scars,
  )
    .map(
      ([id, n]) =>
        `<div><span>${e(id)}</span><strong>${n.toFixed(1)} / 20</strong></div>`,
    )
    .join(
      "",
    )}</div></section>${a >= 30 ? `<section class="panel">${panelHeading("A next chapter after sport", "Retirement ends playing income, rather than your other ambitions.")}<p>Experienced footballers can study a twenty-six-week coaching certificate from eighteen, after school graduation, 30 athletics and 52 professional football weeks. Academy coaching vacancies require the certificate and an ordinary successful application. You can also retrain, build a business or share your experience through media.</p><div class="inline-actions"><button class="button secondary" data-view="career">Explore qualifications & work</button><button class="button secondary" data-view="social">Build a public voice</button></div></section>` : ""}${originFamilyScreen(s, u)}`;
}
