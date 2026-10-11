import {
  age,
  availableCash,
  expenses,
  RENTALS,
  HOMES,
  LEGACY_BEDROOMS,
  HOBBIES,
  MILESTONES,
  propertyListings,
  mortgagePayment,
  householdCosts,
  homeBedrooms,
  PROGRAMS,
} from "./engine.js";

export function housingScreen(s, u) {
  const { title, panelHeading, money, e, tag } = u,
    h = s.housing;
  const residence = h.properties.find((p) => p.id === h.residence);
  const homeName = residence
    ? HOMES.find((x) => x.id === residence.type).name
    : RENTALS.find((r) => r.id === h.rental)?.name ||
      (age(s) < 18
        ? "Family home"
        : s.inventory.some((id) => Object.hasOwn(LEGACY_BEDROOMS, id))
          ? "Your owned home"
          : "Your current rental");
  return `${title("ROOTS & REAL ESTATE", "Find somewhere to call home.", "Rent, buy a first home, or build a property portfolio. Loans and vacant homes keep costing money.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">YOUR RESIDENCE</span><h2>${e(homeName)}</h2><p>${homeBedrooms(s)} bedroom(s) · ${money(h.deposit)} refundable rental deposit</p></section><section class="panel"><span class="eyebrow">RENTAL INCOME LAST WEEK</span><h2>${money(h.weeklyIncome, 2)}</h2><p>${money(h.totalIncome, 2)} total · after 10% management fees, before upkeep and loans</p></section><section class="panel"><span class="eyebrow">ALL WEEKLY COMMITMENTS</span><h2>${money(expenses(s), 2)}</h2><p>Living costs, household, property payments, equipment and tuition</p></section></div><section class="panel">${panelHeading("Rental homes", "Four weeks of refundable rent deposit plus $100 moving cost. Children need at least two bedrooms.")}<div class="everyday-grid">${RENTALS.map((r) => `<article class="everyday-card"><h3>${e(r.name)}</h3><p>${money(r.rent)} weekly rent · ${r.bedrooms} bedrooms<br>${money(r.deposit)} deposit</p><button class="button secondary" data-action="rent-home" data-id="${r.id}" ${age(s) < 18 || (h.rental === r.id && !h.residence) ? "disabled" : ""}>Review rental</button></article>`).join("")}</div></section><section class="panel">${panelHeading("Property market", `Asking prices refresh every 13 weeks. This market closes in ${propertyListings(s)[0].expiresWeek - s.week} weeks.`, tag(`${h.properties.length} / 6 owned`, "blue"))}<div class="everyday-grid">${propertyListings(
    s,
  )
    .map(
      (p) =>
        `<article class="everyday-card"><span class="eyebrow">${p.bedrooms} BEDROOMS</span><h3>${e(p.name)}</h3><strong class="property-price">${money(p.asking)}</strong><p>${money(p.upkeep)}/week upkeep<br>Potential rent ${money(p.rent)}/week<br>20% deposit mortgage: ${money(mortgagePayment(p.asking * 0.8), 2)}/week</p><button class="button primary" data-action="purchase-home" data-id="${p.id}" ${age(s) < 18 ? "disabled" : ""}>Review purchase</button></article>`,
    )
    .join(
      "",
    )}</div><p class="muted">Mortgage underwriting requires 26 weeks in employment, a 20% deposit, 2% closing fees, and twelve payments of cash reserves. The new payment plus existing property costs must fit within 35% of wages. Interest is fixed at 6% for twenty years. Cash purchases also pay 2% closing fees.</p></section><section class="panel">${panelHeading("Your properties", "Rental searches and sales take at least four weeks; finding a tenant or buyer is uncertain.")}<div class="everyday-grid">${
    h.properties
      .map((p) => {
        const d = HOMES.find((h) => h.id === p.type);
        return `<article class="everyday-card" data-property="${e(p.id)}"><h3>${e(d.name)}</h3>${tag(p.saleWeek !== null ? "For sale" : h.residence === p.id ? "Your residence" : p.tenant ? "Tenanted" : p.nextTenantWeek !== null ? "Seeking a tenant" : "Vacant", "blue")}<p>Value ${money(p.value)}<br>Mortgage ${money(p.loan?.balance || 0)} · ${money(p.loan?.payment || 0, 2)}/week<br>${p.loan?.missed ? `${p.loan.missed}/13 missed payments · repossession risk` : `${money(d.upkeep)}/week upkeep`}</p><div class="everyday-actions">${[
          ["move", "Move in"],
          ["let", "Find tenants"],
          ["sell", "List for sale"],
          ["repay", "Repay mortgage"],
          ["endlease", "End lease at expiry"],
        ]
          .map(
            ([mode, label]) =>
              `<button class="button secondary" data-action="manage-property" data-id="${e(p.id)}" data-mode="${mode}" ${!s.actions || (mode === "repay" && !p.loan) || (mode === "endlease" && (!p.tenant || p.endLease)) || (mode === "move" && (h.residence === p.id || p.tenant || p.nextTenantWeek !== null)) || (mode === "let" && (h.residence === p.id || p.tenant || p.nextTenantWeek !== null)) || (mode === "sell" && (p.tenant || p.nextTenantWeek !== null)) || (p.saleWeek !== null && mode !== "repay") ? "disabled" : ""}>${label}</button>`,
          )
          .join("")}</div></article>`;
      })
      .join("") || '<p class="muted">Your first set of keys starts here.</p>'
  }</div><p class="muted">Occupied homes cannot be sold or reclaimed until the lease ends. Give notice to prevent automatic renewal. A sale deducts 5% and settles the remaining loan. Thirteen consecutive missed mortgage payments trigger repossession at 85% of estimated value. Property values fluctuate; equity is not spendable cash.</p></section>`;
}
export function familyScreen(s, u) {
  const { title, panelHeading, e, money, meter, tag } = u,
    f = s.family;
  const partner = s.relationships.find((r) =>
    ["Partner", "Spouse"].includes(r.role),
  );
  return `${title("LOVE, CARE & THE SMALL MOMENTS", "Build a life together.", "Partnerships, parenting, and pets bring meaning, time commitments, and recurring expenses.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">YOUR HOUSEHOLD</span><h2>${f.children.length} children · ${f.pets.length} pet${f.pets.length === 1 ? "" : "s"}</h2><p>${money(householdCosts(s))}/week support and care, plus scheduled vet checks</p></section><section class="panel"><span class="eyebrow">YOUR PARTNER</span><h2>${partner ? e(partner.name) : "Your own chapter"}</h2><p>${partner ? `${e(partner.role)} · ${s.week - f.sinceWeek} weeks together · ${Math.round(partner.bond)} connection` : "Meet people through Relationships."}</p></section><section class="panel"><span class="eyebrow">TIME TO SHARE</span><h2>${s.actions} actions</h2><p>Young children drain energy; employed parents pay additional childcare.</p></section></div><section class="panel">${panelHeading("Partnership & family planning", "Commitment grows through shared time. Dates build a bond; engagement and marriage are separate decisions.")}<div class="everyday-actions">${partner ? `<button class="button secondary" data-action="family-plan" data-mode="propose" ${partner.role !== "Partner" || f.engagement ? "disabled" : ""}>Plan a proposal</button><button class="button secondary" data-action="family-plan" data-mode="wedding" ${!f.engagement ? "disabled" : ""}>Plan a wedding</button><button class="button primary" data-action="family-plan" data-mode="child" ${f.pending || f.children.length >= 4 ? "disabled" : ""}>Plan for a child</button><button class="button secondary" data-action="family-plan" data-mode="adopt-child" ${f.pending || f.children.length >= 4 ? "disabled" : ""}>Explore adoption</button><button class="text-button" data-action="family-plan" data-mode="breakup">Discuss separation</button>` : '<button class="button secondary" data-view="relationships">Meet someone</button>'}</div><p class="muted">Engagement requires age 18+, 52 weeks together, and 80 connection and 75 trust. Weddings can take place four weeks later, for $300 at city hall or a $3,000 celebration. Family planning requires age 21+, a year together, 80 connection, 70 trust, mutual interest in children, and at least two bedrooms. A birth takes 39 weeks and $1,000 preparation; adoption takes 26 weeks and $3,000. Both are simplified family-planning routes.</p>${f.engagement ? `<div class="info-banner">Engaged ${s.week - f.engagement.week} weeks ago. Choose a wedding when you are ready.</div>` : ""}${f.pending ? `<div class="info-banner">Preparing to welcome ${e(f.pending.name)} · ${f.pending.arrivalWeek - s.week} weeks remaining.</div>` : ""}</section><section class="panel">${panelHeading("Growing up", "Children develop over years. Basic support costs end at eighteen; optional university support continues until twenty-one.")}<label class="field-label">Parenting focus<select id="parenting-focus">${[
    ["balanced", "Balanced care"],
    ["quality", "More quality time — stronger connection"],
    ["education", "School support — education growth"],
  ]
    .map(
      ([id, name]) =>
        `<option value="${id}" ${id === f.parenting ? "selected" : ""}>${name}</option>`,
    )
    .join(
      "",
    )}</select></label><div class="everyday-grid">${f.children.map((c) => `<article class="everyday-card"><h3>${e(c.name)}</h3>${tag(`${Math.floor((s.week - c.bornWeek) / 52)} years old`, "purple")}<p>Connection ${Math.round(c.bond)} · wellbeing ${Math.round(c.wellbeing)}<br>Education ${Math.round(c.education)} / 100</p>${meter(c.bond, "purple")}<button class="button secondary" data-action="child-time" data-id="${e(c.id)}" ${!s.actions ? "disabled" : ""}>Spend time · $10</button></article>`).join("") || '<p class="muted">No children yet. There is no required life timetable.</p>'}</div><p class="muted">Under-five support costs $45/week plus $45 childcare if employed. Ages 5–12 cost $65/week; teenagers cost $90/week. Parenting focuses trade energy for stronger connections or education.</p></section><section class="panel">${panelHeading("Animal companions", "Adoption requires age 18+, a private home, and space for up to two pets.")}<div class="everyday-actions"><button class="button primary" data-action="adopt-pet" ${f.pets.length >= 2 ? "disabled" : ""}>Adopt a companion</button></div><div class="everyday-grid">${f.pets.map((p) => `<article class="everyday-card"><h3>${e(p.name)}</h3>${tag(p.kind, "orange")}<p>Connection ${Math.round(p.bond)} · health ${Math.round(p.health)}<br>${money(p.kind === "dog" ? 14 : 10)}/week care<br>Next $80 vet check in ${p.nextVetWeek - s.week} weeks</p>${meter(p.bond, "orange")}<button class="button secondary" data-action="pet-care" data-id="${e(p.id)}" ${!s.actions ? "disabled" : ""}>Play & care</button></article>`).join("")}</div>${f.petMemories.length ? `<p class="muted">Remembering ${f.petMemories.map((p) => e(p.name)).join(", ")}.</p>` : ""}</section>`;
}
export function hobbiesScreen(s, u) {
  const { title, panelHeading, e, money, meter, tag } = u,
    p = s.pastimes;
  return `${title("CRAFT, COMMUNITY & YOUR STORY", "Make more of everyday life.", "Practice becomes craft. A portfolio can lead to commissions, small sales, and a hobby worth keeping.")}<section class="panel">${panelHeading("Daily habits", "Your routine changes weekly living costs and wellbeing.")}<div class="form-row"><label class="field-label">Daily routine<select id="daily-routine">${[
    ["balanced", "Balanced — regular living costs"],
    ["frugal", "Frugal — save $15/week, less comfort"],
    ["healthy", "Healthy — spend $20/week, improve health"],
    ["mealprep", "Meal prep — save $10/week, needs 30 cooking"],
  ]
    .map(
      ([id, name]) =>
        `<option value="${id}" ${id === p.routine ? "selected" : ""} ${id === "mealprep" && p.hobbies.cooking.skill < 30 ? "disabled" : ""}>${name}</option>`,
    )
    .join(
      "",
    )}</select></label><div><p class="muted">Community standing: ${Math.round(p.community)} / 100. Volunteering can help people and improve the chance of a creative commission.</p><button class="button secondary" data-action="volunteer" ${!s.actions ? "disabled" : ""}>Volunteer locally</button></div></div></section><section class="panel">${panelHeading("Your hobbies", "Practice takes an action and 6 energy. Projects need ten practice sessions and 25 skill.", tag(`${money(p.totalIncome, 2)} earned`, "green"))}<div class="everyday-grid">${HOBBIES.map((h) => `<article class="everyday-card" data-hobby="${h.id}"><h3>${e(h.name)}</h3><p>${p.hobbies[h.id].sessions} practice sessions · ${Math.round(p.hobbies[h.id].skill)} / 100 skill<br>${h.gear.length ? (h.id === "photography" ? "Phone or camera required" : "Computer required") : "No special equipment required"}</p>${meter(p.hobbies[h.id].skill, "blue")}<div class="everyday-actions"><button class="button secondary" data-action="hobby-practice" data-id="${h.id}" ${!s.actions ? "disabled" : ""}>Practise · ${money(h.cost)}</button><button class="button primary" data-action="hobby-project" data-id="${h.id}" ${p.hobbies[h.id].sessions < 10 || p.hobbies[h.id].skill < 25 || p.projects.some((r) => r.status === "working") ? "disabled" : ""}>Create a project</button></div><p class="muted">${e(h.project)} · ${h.weeks} weeks · ${money(h.budget)}</p></article>`).join("")}</div></section><section class="panel">${panelHeading("Portfolio & commissions", "Projects earn uncertain small sales for a year. Paid briefs need age 18+, 40 skill and a completed portfolio piece.")}<div class="everyday-grid">${p.projects.map((r) => `<article class="everyday-card"><h3>${e(r.title)}</h3>${tag(r.status === "working" ? `${r.finishWeek - s.week} weeks to completion` : "In your portfolio", "purple")}<p>${e(HOBBIES.find((h) => h.id === r.hobby).name)} · ${Math.round(r.quality)} quality<br>${money(r.income, 2)} earned from sales</p></article>`).join("")}</div><div class="everyday-grid">${
    p.offers
      .filter((o) => o.status === "offered" && o.expiresWeek >= s.week)
      .map(
        (o) =>
          `<article class="everyday-card"><h3>${e(o.client)}</h3><p>${e(HOBBIES.find((h) => h.id === o.hobby).name)} brief · ${money(o.fee)} on successful delivery<br>${o.expiresWeek - s.week} weeks left · $15 materials, 10 energy</p><button class="button secondary" data-action="freelance" data-id="${e(o.id)}" ${!s.actions ? "disabled" : ""}>Deliver commission</button></article>`,
      )
      .join("") ||
    '<p class="muted">No open commissions. Clients review portfolios every four weeks; an offer is never guaranteed.</p>'
  }</div></section><section class="panel">${panelHeading("Life milestones", "A journal of what you have built. Milestones are recorded at the end of each week.")}<div class="milestone-grid">${MILESTONES.map(
    ([id, name, text]) => {
      const m = s.milestones.find((m) => m.id === id);
      return `<article class="milestone ${m ? "earned" : ""}"><span>${m ? "✓" : "○"}</span><div><h3>${e(name)}</h3><p>${m ? `Recorded in week ${m.week}${s.debug.used ? " · sandbox life" : ""}` : e(text)}</p></div></article>`;
    },
  ).join("")}</div></section>`;
}
export function debugScreen(s, u) {
  const { title, panelHeading, e, money } = u;
  if (!s.debug.enabled)
    return `${title("SANDBOX TOOLS", "Debug mode is off.", "Enable it from Save & settings to experiment with your current life.")}<button class="button primary" data-action="settings">Open Save & settings</button>`;
  return `${title("SANDBOX TOOLS", "Try a different possibility.", "These changes persist in this save. Your life keeps its sandbox label after debug is switched off.")}<div class="info-banner warning">${u.hasDebugBackup ? "A pre-debug backup is available in Save & settings." : "Export a backup before experimenting."} Time skips still run wages, expenses, markets, recruitment, and deadlines.</div><section class="panel">${panelHeading("Quick controls", `Current cash ${money(s.money)} · ${s.actions} actions left this week.`)}<div class="everyday-actions">${[
    ["cash-small", "Add $10,000"],
    ["cash-million", "Add $1 million"],
    ["cash-billion", "Add $1 billion"],
    ["wellbeing", "Restore wellbeing"],
    ["actions", "Refill actions"],
    ["skills", "Set career skills to 80"],
  ]
    .map(
      ([id, text]) =>
        `<button class="button secondary" data-action="debug-quick" data-id="${id}">${text}</button>`,
    )
    .join(
      "",
    )}</div></section><section class="panel">${panelHeading("Character controls", "Set exact values. Apply changes explicitly.")}<form id="debug-stats-form"><div class="everyday-grid">${[
    ["money", "Cash balance", s.money, -1e9, 1e12],
    ["health", "Health", s.health, 0, 100],
    ["energy", "Energy", s.energy, 0, 100],
    ["happiness", "Happiness", s.happiness, 0, 100],
    ["actions", "Free-time actions", s.actions, 0, 3],
    ["recognition", "Public recognition", s.fame.recognition, 0, 100],
  ]
    .map(
      ([id, label, value, min, max]) =>
        `<label class="field-label">${label}<input name="${id}" type="number" min="${min}" max="${max}" step="${id === "actions" ? 1 : 0.01}" value="${value}" required></label>`,
    )
    .join(
      "",
    )}</div><button class="button primary" type="submit">Apply character values</button></form></section><section class="panel">${panelHeading("Skills, audiences & education", "Edit one skill or audience at a time, or grant a qualification.")}<form id="debug-skill-form"><div class="form-row"><label class="field-label">Skill to edit<select name="skill">${Object.keys(
    s.skills,
  )
    .map((k) => `<option value="career:${k}">${e(k)}</option>`)
    .join(
      "",
    )}${HOBBIES.map((h) => `<option value="hobby:${h.id}">${e(h.name)}</option>`).join("")}</select></label><label class="field-label">Skill value<input name="value" type="number" min="0" max="100" step="0.1" value="80" required></label></div><button class="button secondary" type="submit">Apply skill</button></form><form id="debug-audience-form"><div class="form-row"><label class="field-label">Platform audience<select name="platform">${Object.keys(
    s.social.profiles,
  )
    .map((id) => `<option>${id}</option>`)
    .join(
      "",
    )}</select></label><label class="field-label">Followers<input name="followers" type="number" min="0" max="1000000000" step="1" value="10000" required></label></div><button class="button secondary" type="submit">Apply audience</button></form><form id="debug-qualification-form"><label class="field-label">Qualification to grant<select name="qualification">${PROGRAMS.map((p) => `<option value="${p.id}">${e(p.name)}${s.education.completed.includes(p.id) ? " — already completed" : ""}</option>`).join("")}</select></label><button class="button secondary" type="submit">Grant qualification</button></form></section><section class="panel">${panelHeading("Advance time", "Every week is simulated. Pending life choices use their last option; a choice generated on the final week remains for you. Recruitment and sale windows can expire.")}<div class="everyday-actions">${[1, 4, 13, 52].map((n) => `<button class="button secondary" data-action="debug-time" data-id="${n}">Simulate ${n} week${n === 1 ? "" : "s"}</button>`).join("")}</div></section><section class="panel">${panelHeading("Debug history", "Your most recent changes.")}<div class="story-list">${s.debug.edits.map((x) => `<div class="story-row"><span class="story-dot orange"></span><div><p>${e(x.text)}</p><small>Week ${x.week}</small></div></div>`).join("")}</div></section>`;
}
