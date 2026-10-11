const age = (s) => s.startAge + Math.floor(s.week / 52);
import { calendarForecast, TIME_BLOCKS } from "./calendar.js";
import { compatibility, CHILD_CLUBS, childExtraCosts } from "./connections.js";
import { promotionCandidate } from "./careers.js";
const LABELS = {
  study: "Study",
  football: "Football",
  racing: "Racing",
  basketball: "Basketball",
  tennis: "Tennis",
  music: "Music practice",
  project: "Creative projects",
  relationships: "Friends & family",
};
export function calendarScreen(s, u) {
  const { title, panelHeading, e, money, tag } = u,
    plan = calendarForecast(s, { comingWeek: true }),
    current = calendarForecast(s);
  const upcoming = s.calendar.entries.filter(
    (x) => x.week > s.week && x.status === "scheduled",
  );
  return `${title("168 HOURS. ONE LIFE.", "Make room for what matters.", "Work, sleep, school and care come first. Optional plans share the time left over.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">NEXT WEEK’S COMMITMENTS</span><h2>${plan.mandatory.toFixed(1)} hours</h2><p>Work ${plan.required.work} · school ${plan.required.school} · care ${plan.required.care.toFixed(1)}</p></section><section class="panel"><span class="eyebrow">UNPLANNED TIME</span><h2>${plan.free.toFixed(1)} hours</h2><p>${plan.appointments} hours of booked dates and family days</p></section><section class="panel"><span class="eyebrow">SCHEDULE PRESSURE</span><h2>${Math.round(plan.stress)} / 100</h2><p>${plan.deficit ? `${plan.deficit.toFixed(1)} hours overbooked; optional time is reduced.` : "Your current commitments fit into a week."}</p></section></div>${plan.deficit ? '<div class="info-banner warning">Overbooking reduces study and training, delays projects, and harms work performance and family wellbeing.</div>' : ""}<section class="panel wide-panel">${panelHeading("Your weekly plan", "An automatic plan follows your active paths. A custom plan lets you set priorities.")}<div class="calendar-budget">${Object.entries(
    plan.required,
  )
    .map(
      ([id, h]) =>
        `<div><span>${e(id[0].toUpperCase() + id.slice(1))}</span><strong>${h.toFixed(1)} h</strong></div>`,
    )
    .join(
      "",
    )}</div><form id="calendar-form"><div class="calendar-fields"><label class="field-label">Planning mode<select name="mode"><option value="automatic" ${s.calendar.mode === "automatic" ? "selected" : ""}>Automatic</option><option value="custom" ${s.calendar.mode === "custom" ? "selected" : ""}>Custom</option></select></label><label class="field-label">Sleep per night<select name="sleep">${(age(s) < 12 ? [9, 10, 11, 12, 13, 14, 15, 16] : [6, 7, 8, 9]).map((v) => `<option ${s.calendar.sleep === v ? "selected" : ""}>${v}</option>`).join("")}</select></label>${TIME_BLOCKS.map((id) => `<label class="field-label">${LABELS[id]} hours<input name="${id}" type="number" min="0" max="40" step="0.5" required value="${s.calendar.hours[id]}"><small>${plan.allocations[id]} h allocated next week${plan.desired[id] !== plan.allocations[id] ? ` of ${plan.desired[id]} requested` : ""}</small></label>`).join("")}</div><p class="muted">Custom hours apply only to paths you have started. Sixteen allocated study hours complete one study week. Paid sports include training in work hours. Everyday meals, chores and personal care take ${plan.required.everyday} hours; commuting takes 5 when working or attending school. ${current.spent} hours already spent on actions this week. Younger children need more sleep; sleeping below the age-appropriate recommendation reduces health and energy.</p><button class="button primary" type="submit">Save weekly plan</button></form></section><section class="panel wide-panel">${panelHeading("Upcoming plans", "Paid reservations return 80% when cancelled before their scheduled week.")}<div class="application-list">${upcoming.map((a) => `<div class="application-row"><div><strong>${e(a.title)}</strong><small>Week ${a.week} · ${a.hours} hours · ${money(a.cost)} reserved</small></div><button class="button secondary" data-action="cancel-appointment" data-id="${e(a.id)}">Cancel plan</button></div>`).join("") || '<p class="muted">Invite someone on a date or plan a family day to add a booking here.</p>'}</div></section><section class="panel wide-panel">${panelHeading("Life dates", "Birthdays and anniversaries follow your life calendar.")}<div class="application-list"><p class="muted">Your next birthday: week ${s.week + 52 - (s.week % 52)}${s.family.partnerId ? ` · Partnership anniversary: week ${s.week + 52 - ((s.week - s.family.sinceWeek) % 52)}` : ""}</p>${s.family.children.map((c) => `<p>${e(c.name)}’s next birthday: week ${s.week + 52 - ((s.week - c.bornWeek) % 52)}</p>`).join("")}${s.calendar.entries
    .filter((e) => ["completed", "missed"].includes(e.status))
    .slice(-6)
    .reverse()
    .map(
      (a) =>
        `<div class="application-row"><div><strong>${e(a.title)}</strong><small>Week ${a.week}</small></div>${tag(a.status, a.status === "completed" ? "green" : "orange")}</div>`,
    )
    .join("")}</div></section>`;
}
export function connectionsScreen(s, u) {
  const { title, panelHeading, e, money, tag, meter, icon } = u;
  const partner = s.relationships.some((r) =>
    ["Partner", "Spouse"].includes(r.role),
  );
  return `${title("PEOPLE WITH THEIR OWN LIVES", "A connection worth making.", "Get to know their interests, build trust and make plans together.", '<button class="button primary" data-action="meet">Meet someone</button>')}<div class="info-banner">${icon("calendar")}<span>${s.actions} actions left. Dates take place next week. Three good dates, 65 connection and 65 trust open a conversation about commitment.</span></div><section class="panel wide-panel">${panelHeading("Meet through a dating app", "Adults need a phone or computer. New profiles arrive every thirteen weeks.")}<button class="button secondary" data-action="dating-app" ${partner || s.connections.nextDiscoveryWeek > s.week ? "disabled" : ""}>${s.connections.nextDiscoveryWeek > s.week ? `New profiles in ${s.connections.nextDiscoveryWeek - s.week} weeks` : "Browse dating profiles"}</button><div class="everyday-grid">${s.connections.discoveries.map((d) => `<article class="everyday-card"><h3>${e(d.person.name)}</h3><p>${e(d.profile.personality)} · ${e(d.profile.interests.join(" & "))}<br>Values ${e(d.profile.values)} · ${e(d.profile.job)}</p><button class="button secondary" data-action="message-match" data-id="${e(d.person.id)}" ${d.status !== "available" || partner || !s.actions ? "disabled" : ""}>${d.status === "available" ? "Send a message" : e(d.status)}</button></article>`).join("")}</div></section><div class="relationship-grid">${s.relationships
    .map((r) => {
      const p = s.connections.profiles[r.id],
        dating = ![
          "Parent",
          "Sibling",
          "Best friend",
          "Former partner",
        ].includes(r.role),
        exclusive = ["Partner", "Spouse"].includes(r.role);
      return `<section class="panel relationship-card"><span class="avatar large ${e(r.color)}">${e(r.icon)}</span><h2>${e(r.name)}</h2>${tag(r.role, r.color)}<p>${ageOf(s, p)} years · ${e(p.city)}<br>${e(p.personality)} · ${e(p.job)}<br>Enjoys ${e(p.interests.join(" & "))}<br>Values ${e(p.values)} · ${p.wantsChildren ? "Would like children" : "Does not want children"}<br>${e(p.plans)}</p><div class="relationship-meter"><span>Connection</span><strong>${Math.round(r.bond)} / 100</strong></div>${meter(r.bond, r.color)}<p>Trust ${Math.round(p.trust)} · mood ${Math.round(p.mood)}${dating ? ` · compatibility ${compatibility(s, r.id)}<br>${p.successfulDates} good dates out of ${p.dates}` : ""}</p><button class="button secondary full-width" data-action="connect" data-id="${e(r.id)}" ${!s.actions ? "disabled" : ""}>Spend time together <span>$25 · 2 h</span></button>${dating && (!partner || exclusive) ? `<button class="text-button date-button" data-action="date" data-id="${e(r.id)}" ${r.bond < 35 || !s.actions ? "disabled" : ""}>${icon("heart")} ${exclusive ? "Plan a date" : "Ask on a date"}</button>${!exclusive ? `<button class="button secondary full-width" data-action="exclusive" data-id="${e(r.id)}" ${p.successfulDates < 3 || r.bond < 65 || p.trust < 65 || !s.actions ? "disabled" : ""}>Talk about commitment</button>` : ""}` : ""}</section>`;
    })
    .join("")}</div>`;
}
const ageOf = (s, p) => s.startAge + Math.floor(s.week / 52) + p.ageOffset;
export function workplaceScreen(s, u) {
  const { panelHeading, e, money } = u,
    w = s.workLife,
    target = promotionCandidate(s);
  return `<section class="panel wide-panel">${panelHeading("Your workplace & future", "Performance, people and qualifications shape the next step.")} ${s.employment ? `<div class="company-numbers"><div><span>Manager trust</span><strong>${Math.round(w.managerBond)} / 100</strong></div><div><span>Colleague connection</span><strong>${Math.round(w.colleagueBond)} / 100</strong></div><div><span>Formal warnings</span><strong>${w.warnings} / 3</strong></div></div><p class="muted">${w.probationReviewed ? "Probation reviewed." : `Probation review in ${Math.max(0, w.probationEnds - s.week)} weeks.`} Three formal warnings after sustained poor performance can end your job.</p><div class="everyday-actions">${["manager", "colleagues", "mentor"].map((id, i) => `<button class="button secondary" data-action="workplace" data-id="${id}" ${!s.actions ? "disabled" : ""}>${["Meet your manager", "Join your colleagues", "Ask for mentoring"][i]}</button>`).join("")}</div><form id="work-arrangement-form"><label class="field-label">Work schedule<select name="mode"><option value="standard" ${w.arrangement === "standard" ? "selected" : ""}>Standard hours</option><option value="overtime" ${w.arrangement === "overtime" ? "selected" : ""}>Eight additional hours</option></select></label><p class="muted">Overtime improves performance if your schedule can sustain it. Nursing, trades and hospitality pay time-and-a-quarter for additional hours; salaried roles do not pay extra.</p><button class="button secondary" type="submit">Set work schedule</button></form><p>${target ? `Next internal role: ${e(target.title)}. You need its qualifications, experience and 70 performance.` : "Further roles may require a new employer and a successful application."}</p>${w.promotion?.status === "offer" ? `<button class="button primary" data-action="accept-promotion">Accept promotion · ${money(w.promotion.pay)}/week</button>` : `<button class="button primary" data-action="promotion" ${!target || s.week < w.nextPromotion || w.promotion || !s.actions ? "disabled" : ""}>${w.promotion ? "Review pending" : s.week < w.nextPromotion ? `Promotion review in ${w.nextPromotion - s.week} weeks` : "Request promotion review"}</button>`}` : '<p class="muted">Start a job to meet your manager and colleagues.</p>'}<form id="pension-form"><label class="field-label">Pension contribution<select name="rate">${[0, 3, 5, 10, 15].map((v) => `<option value="${v}" ${w.pensionRate === v ? "selected" : ""}>${v}% of wages</option>`).join("")}</select></label><p class="muted">${money(w.pension)} saved. Employers match up to 2% of wages. Savings count toward net worth and are available from age 60.</p><button class="button secondary" type="submit">Set pension contribution</button><button class="button secondary" type="button" data-action="withdraw-pension" ${ageOf(s, { ageOffset: 0 }) < 60 || !w.pension ? "disabled" : ""}>Withdraw pension savings</button></form></section>`;
}
export function familyDepthScreen(s, u) {
  const { panelHeading, e, tag, money } = u,
    f = s.family;
  return `<section class="panel wide-panel">${panelHeading("A household of your own", "Share responsibility, make time together, and hear your children out.")}<div class="everyday-actions"><button class="button secondary" data-action="move-in" ${!f.partnerId || f.livingTogether ? "disabled" : ""}>${f.livingTogether ? "Living together" : "Discuss moving in together"}</button><button class="button primary" data-action="family-day" ${!f.partnerId && !f.children.length ? "disabled" : ""}>Plan a family day · $25</button><button class="button secondary" data-view="calendar">Open weekly calendar</button></div><p class="muted">${f.livingTogether ? `Your partner contributed ${money(f.weeklyContribution)} last week from their own earnings and savings. Shared parenting reduces your care hours.` : "Living separately means you handle your own household commitments."} Activities, private school and optional university support add ${money(childExtraCosts(s))}/week. Private school costs $90/week; university support costs $60/week from eighteen to twenty-one.</p><div class="everyday-grid">${f.children
    .map((c) => {
      const years = Math.floor((s.week - c.bornWeek) / 52);
      return `<article class="everyday-card"><h3>${e(c.name)}’s own story</h3>${tag(c.interest, "purple")}<p>Confidence ${Math.round(c.confidence)} · independence ${Math.round(c.independence)}<br>${e(CHILD_CLUBS.find((x) => x.id === c.club).name)} · ${e(c.schoolType)} school<br>Future: ${e(c.future)}</p><p class="muted">Matching activities build confidence. Their school results and interests help decide their adult path.</p><button class="button secondary" data-action="child-plan" data-id="${e(c.id)}" ${years < 5 || years >= 18 || !s.actions ? "disabled" : ""}>Discuss school & activities</button></article>`;
    })
    .join("")}</div>${f.issues
    .filter((i) => i.status === "open")
    .map(
      (i) =>
        `<article class="family-issue"><h3>${e(f.children.find((c) => c.id === i.childId).name)}: ${e(i.title)}</h3><p>They need support within ${i.expiresWeek - s.week} weeks.</p><div class="everyday-actions">${[
          ["listen", "Listen together · 3 h"],
          ["tutor", "Arrange tutoring · $40"],
          ["pressure", "Push harder"],
        ]
          .map(
            ([id, label]) =>
              `<button class="button secondary" data-action="family-issue" data-id="${e(i.id)}" data-mode="${id}" ${!s.actions ? "disabled" : ""}>${label}</button>`,
          )
          .join(
            "",
          )}</div><p class="muted">Listening builds trust and wellbeing. Tutoring helps schoolwork. Pressure can hurt your relationship.</p></article>`,
    )
    .join("")}</section>`;
}
