import { salary, expenses } from "./engine.js";
import { takeHomePay, estimatedPayTax } from "./banking.js";
import {
  SEASON_SPORTS,
  AGENTS,
  standings,
  sportFundingCost,
  agentCommission,
} from "./seasons.js";
import { storyWeeklyHours, storyWeeklyCosts } from "./stories.js";
import { pensionDue } from "./careers.js";
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
const active = (s, id) => !["none", "retired"].includes(actor(s, id).stage);
export function bankingScreen(s, u) {
  const { title, panelHeading, e, money, tag } = u,
    b = s.banking,
    t = b.tax;
  return `${title("THE MONEY YOU CAN ACTUALLY USE", "Plan beyond the pay cheque.", "Save for a buffer, understand your deductions, and borrow only when repayments fit your life.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">GROSS WEEKLY PAY</span><h2>${money(salary(s))}</h2><p>${money(estimatedPayTax(s))} estimated income tax · ${money(pensionDue(s))} pension · ${money(agentCommission(s))} agent commission</p></section><section class="panel"><span class="eyebrow">TAKE-HOME PAY</span><h2>${money(takeHomePay(s))}</h2><p>Before housing, tuition, care and debt payments</p></section><section class="panel"><span class="eyebrow">CREDIT HISTORY</span><h2>${b.credit} / 850</h2><p>Missed payments and overdrafts reduce your score. Stable repayments help it recover.</p></section></div><section class="panel wide-panel">${panelHeading("Your savings", "Transfers move money between cash and savings. Savings must be withdrawn before they can fund purchases.")}<div class="company-numbers"><div><span>Available in savings</span><strong>${money(b.savings)}</strong></div><div><span>Annual nominal interest</span><strong>${(b.savingsRate * 100).toFixed(2)}%</strong></div><div><span>Current policy rate</span><strong>${(b.baseRate * 100).toFixed(2)}%</strong></div></div><form id="savings-form"><div class="form-row"><label class="field-label">Transfer direction<select name="direction"><option value="deposit">Deposit cash</option><option value="withdraw">Withdraw savings</option></select></label><label class="field-label">Transfer amount<input name="amount" type="number" min="0.01" max="1000000000000" step="0.01" value="1000" required></label></div><p class="muted">Interest is credited weekly to savings after 15% investment-income tax. Policy rates can change quarterly; existing personal loans keep their agreed fixed rate.</p><button class="button primary" type="submit">Transfer savings</button></form></section><section class="panel wide-panel">${panelHeading("Borrowing & repayments", "Approval depends on age, stable wage payments, credit, existing debts and take-home affordability.")}<form id="loan-quote-form"><div class="form-row"><label class="field-label">Loan amount<input name="amount" type="number" min="1000" max="100000" step="1" value="5000" required></label><label class="field-label">Repayment term<select name="term">${[
    [52, "One year"],
    [104, "Two years"],
    [156, "Three years"],
    [260, "Five years"],
  ]
    .map(
      ([v, label]) =>
        `<option value="${v}" ${v === 104 ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label></div><p class="muted">Loans require age 18+, thirteen weeks in a job, four recorded wage payments and a credit score of 600+. Sporting contracts need at least twenty-six weeks remaining. At most two personal loans; a 1% origination fee (minimum $20) applies. Debt repayments must fit 30% of take-home wages and your remaining budget. Overdrafts still carry 0.5% weekly interest.</p><button class="button primary" type="submit">Review borrowing terms</button></form><div class="everyday-grid">${b.loans.map((l) => `<article class="everyday-card"><h3>Personal loan ${e(l.id.split(":")[1])}</h3>${tag(l.status, l.status === "defaulted" ? "orange" : "blue")}<p>${money(l.balance)} remaining · ${(l.apr * 100).toFixed(2)}% fixed APR<br>${money(l.payment)}/week · ${l.weeks} scheduled payments remaining<br>${l.missed} consecutive missed payments</p>${l.status !== "repaid" ? `<button class="button secondary" data-action="repay-loan" data-id="${e(l.id)}">Make an extra repayment</button>` : ""}</article>`).join("")}</div><p class="muted">Unpaid interest remains in the balance. Eight consecutive missed payments send a loan to collections; the liability stays payable and blocks new credit. Extra repayments have no penalty. Loan proceeds increase cash and debt together.</p></section><section class="panel wide-panel">${panelHeading("Your tax record", "The same fictional tax system applies in all four prototype cities.")}<div class="company-numbers"><div><span>Earned income this tax year</span><strong>${money(t.earned)}</strong></div><div><span>Tax withheld this year</span><strong>${money(t.withheld)}</strong></div><div><span>Tax paid over this life</span><strong>${money(t.paid)}</strong></div></div><p class="muted">Annual earned-income bands: $0–$12,000 at 0%; $12,000–$50,000 at 20%; $50,000–$125,000 at 35%; higher income at 45%. Pay, creator/music earnings, performance bonuses, commissions and founder drawings count as earned income. Pension contributions and sports-agent fees reduce taxable pay. Investment income and realised capital gains use 15%; paper gains are untaxed. Capital losses offset capital gains and carry forward. Each fifty-two-week tax year settles overpayments or shortfalls automatically.</p><p>${money(t.lastGross)} gross receipts and ${money(t.lastWeekly)} withholding recorded this week.</p><div class="application-list">${t.history.map((h) => `<div class="application-row"><div><strong>Tax year ${h.year + 1}</strong><small>${money(h.due)} total due · ${h.adjustment < 0 ? money(-h.adjustment) + " refund" : h.adjustment > 0 ? money(h.adjustment) + " additional payment" : "fully covered by withholding"}</small></div></div>`).join("")}</div></section><section class="panel wide-panel">${panelHeading("Recent bank movements", "Savings transfers, interest and loan transactions.")}<div class="application-list">${
    b.statements
      .slice(0, 12)
      .map(
        (x) =>
          `<div class="application-row"><div><strong>${e(x.label)}</strong><small>Week ${x.week}</small></div><strong>${money(x.amount)}</strong></div>`,
      )
      .join("") || '<p class="muted">Your first transfer starts the record.</p>'
  }</div></section>`;
}
export function seasonScreen(s, u) {
  const { panelHeading, e, tag, money } = u,
    paths = SEASON_SPORTS.filter((id) => active(s, id));
  return `<section class="panel wide-panel">${panelHeading("Seasons, selection & representation", "Fixtures happen on their scheduled week. Training, fitness and team selection determine your appearances.")}<div class="everyday-actions">${paths.map((id) => `<a class="button secondary" href="#season-${id}">${e(id[0].toUpperCase() + id.slice(1))}</a>`).join("")}</div>${paths.length ? "" : '<p class="muted">Join a sport to start a fixture calendar. Professional offers still come through development and scouting.</p>'}</section>${paths
    .map((id) => {
      const path = s.seasons[id],
        p = actor(s, id),
        table = standings(s, id),
        agent = path.agent && AGENTS.find((a) => a.id === path.agent.id),
        sponsor = path.sponsor;
      return `<section class="panel wide-panel season-panel" id="season-${id}" data-season="${id}">${panelHeading(`${id[0].toUpperCase() + id.slice(1)} season ${path.year + 1}`, `${p.club} · ${path.appearances} appearances this campaign`, tag(`${table.findIndex((t) => t.id === 0) + 1} / ${table.length}`, "purple"))}<div class="company-numbers"><div><span>Recent form</span><strong>${Math.round(path.form)} / 100</strong></div><div><span>Contract role</span><strong>${p.contract?.role || "Development / existing terms"}</strong></div><div><span>${id === "racing" ? "Own racing funding" : "Appearance bonus"}</span><strong>${money(id === "racing" ? sportFundingCost(s, id) : p.contract?.appearanceBonus || 0)}${id === "racing" ? "/week" : ""}</strong></div></div><p class="muted">${id === "football" ? "Twenty teams play a thirty-eight-match league campaign. Team results continue when you are injured or not selected." : id === "basketball" ? "Twelve teams play forty-four fixtures across thirty-eight weeks. Busy weeks can include two matches." : id === "racing" ? "Twenty competitors contest twenty-two rounds. Results award championship points; an injured or unfunded driver cannot start." : "Twenty tour competitors enter twenty-six scheduled events. Finishing position earns ranking points and professional results can earn prize money."} Resting or allocating too little hobby time means missing personal participation. A promised starter role helps selection but does not override poor fitness or performance.</p><div class="season-columns"><div><h3>Upcoming fixtures</h3><div class="application-list">${
        path.fixtures
          .filter((f) => f.status === "scheduled" && f.week > s.week)
          .slice(0, 5)
          .map(
            (f) =>
              `<div class="application-row"><div><strong>${e(f.opponent)}</strong><small>Week ${f.week}${id === "football" || id === "basketball" ? ` · ${f.home ? "home" : "away"}` : ""}</small></div></div>`,
          )
          .join("") ||
        '<p class="muted">The campaign is finished. The next season begins on the annual calendar.</p>'
      }</div><h3>Recent results</h3>${path.fixtures
        .filter((f) => !["scheduled", "past"].includes(f.status))
        .slice(-4)
        .reverse()
        .map(
          (f) =>
            `<p class="muted">Week ${f.week}: ${e(f.opponent)} · ${f.status === "played" ? (id === "football" || id === "basketball" ? `${f.result.ownScore}–${f.result.otherScore}` : `${f.result.position}th, ${f.result.points} points`) : e(f.status)}</p>`,
        )
        .join(
          "",
        )}</div><div><h3>${id === "racing" ? "Championship" : id === "tennis" ? "Tour rankings" : "League table"}</h3><div class="standings-table">${table.map((t, i) => `<div class="standings-row ${t.id === 0 ? "your-side" : ""}"><span>${i + 1}</span><span>${e(t.name)}</span><span>${t.played}</span><strong>${t.points}</strong></div>`).join("")}</div><p class="muted">Rank · side / competitor · played · points</p></div></div><h3>Your agent</h3>${agent ? `<p>${e(agent.name)} · ${(agent.rate * 100).toFixed(0)}% commission on this sport’s wages and performance bonuses.</p><button class="button secondary" data-action="dismiss-agent" data-sport="${id}">End representation</button>` : `<div class="everyday-actions">${AGENTS.map((a) => `<button class="button secondary" data-action="hire-agent" data-sport="${id}" data-id="${a.id}" ${p.reputation < a.reputation || !s.actions ? "disabled" : ""}>${e(a.name)} · ${money(a.fee)}</button>`).join("")}</div><p class="muted">Next Chapter needs 15 reputation and takes 5% commission; Motion needs 30 and takes 10%; Pinnacle needs 60 and takes 8%. Agents improve negotiating chances. Recruitment still requires ability, licences, experience and an available invitation.</p>`}${
        id === "racing"
          ? `<h3>Competition funding</h3><p class="muted">New F4 seats cost $15,000/year; F3 $60,000; F2 $200,000; F1 has no driver-funded entry charge. Signing needs thirteen weeks of uncovered costs in cash reserves. Four unfunded weeks can end a seat. Existing pre-update contracts retain their original cost terms until replaced.</p>${sponsor ? `<p>${e(sponsor.brand)} · ${e(sponsor.status)} · ${money(sponsor.annual)}/year support</p>${sponsor.status === "active" ? `<p class="muted">Appearance deadline: week ${sponsor.nextAppearanceWeek}. Deliver once in the preceding four weeks to keep support.</p><button class="button primary" data-action="sport-appearance" data-sport="${id}" ${s.week < sponsor.nextAppearanceWeek - 4 || sponsor.lastAppearanceWeek >= sponsor.nextAppearanceWeek - 4 || !s.actions ? "disabled" : ""}>Deliver sponsor appearance</button>` : ""}` : ""}<div class="application-list">${path.sponsorOffers
              .filter((o) => o.status === "offered")
              .map(
                (o) =>
                  `<div class="application-row"><div><strong>${e(o.brand)}</strong><small>${money(o.annual)}/year toward racing costs · offer closes week ${o.expiresWeek}</small></div><button class="button primary" data-action="sport-sponsor" data-sport="${id}" data-id="${e(o.id)}" ${sponsor?.status === "active" || !s.actions ? "disabled" : ""}>Review sponsorship</button></div>`,
              )
              .join("")}</div>`
          : ""
      }${
        path.history.length
          ? `<h3>Previous campaigns</h3>${path.history
              .slice(0, 3)
              .map(
                (h) =>
                  `<p class="muted">Season ${h.year + 1} · ${e(h.club)} · place ${h.place} · ${h.points} points · ${h.appearances} appearances</p>`,
              )
              .join("")}`
          : ""
      }</section>`;
    })
    .join("")}`;
}
const descriptions = {
  notice: "Employment notice",
  grant: "Study grant",
  "partner-care": "Supporting your partner’s training",
  "partner-help": "Help while your partner trains",
  rehab: "Injury rehabilitation",
  "child-care": "Extra time supporting a child",
  "child-help": "Practical support for a child",
  commission: "A paid creative commission",
  rent: "Temporary rent surcharge",
};
export function storyScreen(s, u) {
  const { panelHeading, e, money, tag } = u,
    active = s.stories.effects.filter((e) => e.status === "active");
  return `<section class="panel wide-panel">${panelHeading("Life commitments", "Choices can change the weeks that follow, rather than ending with the conversation.")}<p class="muted">${storyWeeklyHours(s)} additional care / recovery hours and ${money(storyWeeklyCosts(s))} recurring costs are included in your weekly plan and budget.</p><div class="everyday-grid">${active.map((x) => `<article class="everyday-card"><h3>${e(descriptions[x.kind])}</h3>${tag(`${Math.max(0, x.until - s.week)} weeks remaining`, "orange")}<p>${x.kind === "notice" ? "Your current role ends at the deadline if you have not changed contracts. Apply for qualified vacancies while your wages continue." : x.kind === "grant" ? "Eight allocated study hours unlock half-price tuition for your current course." : x.kind === "commission" ? "A deliverable is needed before payment. One action, four hours and $25 materials." : x.kind === "rent" ? `${money(x.weeklyCost)}/week until the deadline or a move to another rental.` : "The time and costs are reflected in your calendar. The outcome follows when the commitment ends."}</p>${x.kind === "commission" ? `<button class="button primary" data-action="story-delivery" data-id="${e(x.id)}" ${!s.actions ? "disabled" : ""}>Deliver commissioned work</button>` : x.kind === "notice" ? '<button class="button secondary" data-view="career">Look for work</button>' : ""}</article>`).join("") || '<p class="muted">No ongoing life commitments. Opportunities and setbacks appear through your life choices.</p>'}</div>${
    s.stories.history.length
      ? `<div class="application-list">${s.stories.history
          .slice(0, 6)
          .map(
            (h) =>
              `<div class="application-row"><div><strong>${e(h.text)}</strong><small>Week ${h.week}</small></div></div>`,
          )
          .join("")}</div>`
      : ""
  }</section>`;
}
export function fixtureCalendar(s, u) {
  const { panelHeading, e } = u;
  const fixtures = SEASON_SPORTS.filter((id) => active(s, id))
    .flatMap((id) =>
      s.seasons[id].fixtures
        .filter((f) => f.status === "scheduled" && f.week > s.week)
        .map((f) => ({ ...f, sport: id })),
    )
    .sort((a, b) => a.week - b.week)
    .slice(0, 8);
  return `<section class="panel wide-panel">${panelHeading("Sporting dates", "Competition is part of your sporting schedule and does not consume another free-time action.")}<div class="application-list">${fixtures.map((f) => `<div class="application-row"><div><strong>${e(f.opponent)}</strong><small>${e(f.sport)} · week ${f.week}</small></div></div>`).join("") || '<p class="muted">Join a sport to add upcoming fixtures.</p>'}</div><button class="button secondary" data-view="sports">Review the season</button></section>`;
}
