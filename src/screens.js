import { routineScreen } from "./identity-screens.js";
import { contractsScreen, milestonesScreen } from "./depth-screens.js";
import { sportWorldScreen, musicWorldScreen } from "./career-world-screens.js";
import { schoolLifeScreen } from "./life-course-screens.js";
import { careerSupportScreen } from "./career-support.js";
import { careerEquipmentScreen } from "./career-equipment.js";
import { workplaceScreen } from "./calendar-screens.js";
import {
  PROGRAMS,
  programmeTuition,
  TRACK_SKILLS,
  BUSINESSES,
  COLLECTIBLES,
  jobDefinition,
  jobEligibility,
  qualificationName,
  availableCash,
  reservedCash,
  assetValue,
  stakePercent,
  meetingFee,
  positionName,
  isSportingJob,
  age,
} from "./engine.js";

export function workScreen(s, u) {
  const { title, panelHeading, tag, icon, meter, money, e } = u;
  const p = s.employment,
    j = p ? jobDefinition(p.jobId) : null,
    course = s.education.active,
    study = course ? PROGRAMS.find((c) => c.id === course.programId) : null;
  const sporting = p && isSportingJob(j);
  const contract = `<section class="panel wide-panel">${panelHeading("Your working life", "Contracts, performance, and opportunities.", tag(p ? "Employed" : s.company ? "Self-employed" : "Seeking work", p ? "green" : "blue"))}<div class="current-career"><span class="feature-icon blue">${icon("briefcase")}</span><div><h3>${e(positionName(s))}</h3><p>${j ? e(p.employer || j.employer) : s.company ? e(s.company.name) : "Applications are open. Qualifications and experience count."}</p></div></div>${p ? `<div class="company-numbers"><div><span>Contracted pay</span><strong>${money(p.weeklyPay)}/wk</strong></div><div><span>Sustained performance</span><strong>${p.performance} / 100</strong></div><div><span>Time in this job</span><strong>${p.tenure} weeks</strong></div></div><div class="inline-actions"><button class="button primary" data-action="raise" ${sporting || s.week < p.nextRaiseWeek || !s.actions ? "disabled" : ""}>Discuss a raise ${icon("arrow")}</button><button class="button secondary" data-action="resign">Hand in resignation</button><span class="muted">${sporting ? "Sporting pay changes through club or sponsor contract offers." : s.week < p.nextRaiseWeek ? `Next salary discussion in ${p.nextRaiseWeek - s.week} weeks.` : "A discussion uses one free-time action; approval depends on performance and pay band."}</span></div><p class="muted">${sporting ? "Develop your sporting career and review club offers in Sport & development." : "Good work can earn a 3% annual merit increase. A requested raise can be refused; the next discussion is 26 weeks later. New roles require successful recruitment."}</p>` : `<div class="info-banner">${icon("coin")}<span>${s.company ? "Founder drawings depend on actual profit and cash." : "You have no employment income."} A new job starts only when you accept an offer. You can apply while employed.</span></div>`}</section>`;
  const applications = `<section class="panel wide-panel">${panelHeading("Your applications", "Most applications take two weeks; new professions invite you to an interview first.")}<div class="application-list">${
    s.applications.length
      ? s.applications
          .slice()
          .reverse()
          .slice(0, 8)
          .map((a) => {
            const role = jobDefinition(a.jobId);
            return `<div class="application-row"><div><strong>${e(role.title)}</strong><small>${e(role.employer)} · ${a.status === "pending" ? `Decision in ${Math.max(0, a.decisionWeek - s.week)} weeks` : a.status === "offer" ? `${money(a.offeredPay)}/week · expires in ${a.expiresWeek - s.week} weeks` : e(a.status)}</small></div>${a.status === "interview" ? `<button class="button primary" data-action="interview" data-id="${e(a.id)}">Prepare interview</button>` : a.status === "offer" ? `<button class="button primary" data-action="accept-job" data-id="${e(a.id)}">Review offer</button>` : tag(a.status, a.status === "accepted" ? "green" : a.status === "rejected" ? "orange" : "blue")}</div>`;
          })
          .join("")
      : '<p class="muted">No applications yet. A qualified application is a chance, not a guarantee.</p>'
  }</div></section>`;
  const education = `<section class="panel wide-panel">${panelHeading("Education & qualifications", "Certificates unlock work; degrees take years.", tag(`${s.education.completed.length} qualifications`, "blue"))}<div class="qualification-tags">${s.education.completed.length ? s.education.completed.map((id) => tag(qualificationName(id), "blue")).join("") : '<span class="muted">No formal qualifications yet. Entry-level work is still available.</span>'}</div>${course ? `<div class="enrolment"><div><h3>${e(study.name)}</h3><p>${course.progress} / ${study.weeks} study weeks · ${money(study.tuition)}/week · ${money(course.spent)} paid so far</p></div>${meter((course.progress / study.weeks) * 100, "blue")}<p>${course.paused ? "Tuition was unaffordable last week. Your progress is retained; payments resume when funds are available." : "Sixteen study hours in your weekly calendar complete one study week; overbooking slows progress. Tuition is charged while enrolled."}</p><button class="text-button" data-action="withdraw-course">Withdraw from programme</button></div>` : ""}<div class="education-grid">${PROGRAMS.map(
    (c) => {
      const held = s.education.completed.includes(c.id),
        requirements = [
          c.minAge && age(s) < c.minAge ? `Age ${c.minAge}+` : "",
          c.requires && !s.education.completed.includes(c.requires)
            ? qualificationName(c.requires)
            : "",
          c.minimumSkill && s.skills[c.skill] < c.minimumSkill
            ? `${c.minimumSkill} ${c.skill} skill`
            : "",
          c.experience && s.progress[c.track].weeks < c.experience
            ? `${c.experience} weeks of ${c.track} experience`
            : "",
        ].filter(Boolean);
      return `<div class="education-card"><h3>${e(c.name)}</h3><p>${c.weeks} weeks full-time · ${money(programmeTuition(s, c.id), 2)}/week</p><small>${held ? "Qualification completed" : requirements.length ? `Requires: ${e(requirements.join(", "))}` : "Entry requirements met"}</small><button class="button secondary full-width" data-action="enrol" data-id="${c.id}" ${held || course || requirements.length ? "disabled" : ""}>${held ? "Completed" : "Review programme"}</button></div>`;
    },
  ).join("")}</div></section>`;
  const vacancies = `<div class="section-title"><h2>The job board</h2><span>New vacancies every 4 weeks · ${s.actions} actions left</span></div><div class="career-grid job-grid">${s.vacancies
    .map((v) => {
      const j = jobDefinition(v.jobId),
        eligibility = jobEligibility(s, v),
        applied = s.applications.some((a) => a.vacancyId === v.id),
        same = s.employment?.jobId === v.jobId;
      return `<section class="panel vacancy-card" data-vacancy="${e(v.id)}"><div class="eyebrow">${e(j.employer)}</div><h2>${e(j.title)}</h2><div class="vacancy-pay">${money(j.pay)}–${money(j.maxPay)}<small> / week</small></div>${v.exceptional ? `<div class="opportunity-note">${icon("spark")} The previous coordinator left unexpectedly. A contact is introducing unconventional applicants; a degree and management history are not required.</div>` : ""}<div class="path-meta"><span>Qualification<strong>${j.qualification ? e(qualificationName(j.qualification)) : "No formal requirement"}</strong></span><span>Relevant skill<strong>${j.skill} ${e(TRACK_SKILLS[j.track])}</strong></span><span>Experience<strong>${j.experience} weeks</strong></span><span>Closing in<strong>${v.expiresWeek - s.week} weeks</strong></span></div><p class="eligibility ${eligibility.eligible ? "positive" : "muted"}">${eligibility.eligible ? "You meet the application requirements." : `Still needed: ${e(eligibility.missing.join("; "))}.`}</p><button class="button ${eligibility.eligible ? "primary" : "secondary"} full-width" data-action="apply-job" data-id="${e(v.id)}" ${!eligibility.eligible || applied || same || !s.actions ? "disabled" : ""}>${same ? "Your current job" : applied ? "Application submitted" : eligibility.eligible ? "Submit application" : "Not yet qualified"} ${icon("arrow")}</button></section>`;
    })
    .join("")}</div>`;
  return `${title("WORK, LEARNING & OPPORTUNITY", "Earn your next chapter.", "Find a vacancy, qualify, apply, and decide whether to accept the offer.")}${contract}${careerEquipmentScreen(s, u)}${careerSupportScreen(s, u)}${sportWorldScreen(s, u)}${musicWorldScreen(s, u)}${contractsScreen(s, u)}${milestonesScreen(s, u)}${workplaceScreen(s, u)}${applications}${education}${vacancies}${founderPanel(s, u)}${schoolLifeScreen(s, u)}${routineScreen(s, u, "office")}${routineScreen(s, u, "business")}${routineScreen(s, u, "investor")}`;
}
export function founderPanel(s, u) {
  const { panelHeading, tag, icon, money, e, percent } = u,
    c = s.company;
  return `<section class="panel founder-panel">${panelHeading("Build your own company", "Ownership is not a salary guarantee.", tag(c ? "Founded" : "Entrepreneurship", "purple"))}${c ? `<h3>${e(c.name)}</h3><p class="muted">${e(c.sector)} · ${c.employees} staff · ${e(c.strategy)} strategy</p><div class="company-numbers"><div><span>Estimated equity value</span><strong>${money(c.value)}</strong></div><div><span>Company cash</span><strong>${money(c.cash)}</strong></div><div><span>Last trading profit</span><strong>${money(c.profit)}/wk</strong></div></div><p class="muted">${s.employment ? "Runs as a side business while you are employed; positive quarterly profit may pay dividends." : "Founder drawings come from positive profit and available company cash."} Reinvesting retains all founder drawings, balanced takes 25%, and taking income draws 50%. Losing money can erode the business.</p><button class="button secondary" data-action="company">Manage company ${icon("arrow")}</button>` : `<p class="muted">A degree is not compulsory to start a company. You need 30 business skill and $5,000 startup capital. You can keep an existing job while building it.</p><button class="button primary" data-action="found-company" ${age(s) < 18 || s.skills.business < 30 || availableCash(s) < 5000 ? "disabled" : ""}>Plan a company ${icon("arrow")}</button>`}</section>`;
}

export function ownershipScreen(s, u) {
  const { title, panelHeading, tag, icon, money, e, percent } = u;
  const sales = `<section class="panel wide-panel">${panelHeading("Owner-led sale opportunities", "Windows are rare, announced quarterly, and last six weeks.", tag(`${s.opportunities.length} open`, "yellow"))}${s.opportunities.length ? `<div class="sale-list">${s.opportunities.map((o) => `<div class="application-row"><div><strong>${e(BUSINESSES.find((b) => b.id === o.targetId).name)} · ${o.stake}% stake</strong><small>Asking ${money(o.askingPrice)} · closes in ${o.expiresWeek - s.week} weeks</small></div><button class="button primary" data-action="sale-opportunity" data-id="${e(o.id)}" ${availableCash(s) < o.askingPrice ? "disabled" : ""}>Review sale</button></div>`).join("")}</div>` : '<p class="muted">Nobody has announced a sale right now. Watch for openings, or pay to approach the owners. Most sports clubs are not listed in any given year.</p>'}</section>`;
  const approaches = `<section class="panel wide-panel">${panelHeading("Your boardroom approaches", "Fees buy an introduction request, not an agreement.")}<div class="application-list">${
    s.negotiations.length
      ? s.negotiations
          .slice()
          .reverse()
          .slice(0, 8)
          .map(
            (n) =>
              `<div class="application-row"><div><strong>${e(BUSINESSES.find((b) => b.id === n.targetId).name)}</strong><small>${e(n.status)}${n.offer ? ` · ${money(n.offer)} for ${n.stake}%` : ""}${["meeting", "submitted"].includes(n.status) ? ` · decision in ${Math.max(0, n.decisionWeek - s.week)} weeks` : ""}</small></div><button class="button secondary" data-action="review-bid" data-id="${e(n.id)}">Review</button></div>`,
          )
          .join("")
      : '<p class="muted">No approaches yet. Owners can refuse a meeting, reject a bid, or require a substantial premium. Cash committed to a live bid cannot be spent twice.</p>'
  }</div></section>`;
  return `${title("THE OWNERSHIP WORLD", "The right business. The right moment.", "Buy an available stake or make a patient, funded approach to its owners.")}<div class="info-banner">${icon("coin")}<span>${money(availableCash(s))} uncommitted cash · ${money(reservedCash(s))} reserved for bids. Listed-company holdings and ownership stakes are the same shares, counted once.</span></div>${sales}${approaches}<div class="career-grid two-columns">${BUSINESSES.map(
    (b) => {
      const stake = stakePercent(s, b.id),
        r = s.businessResults[b.id],
        t = s.teams[b.id],
        last = s.negotiations.filter((n) => n.targetId === b.id).at(-1),
        cooldown = last && s.week < last.requestedWeek + 26;
      return `<section class="panel team-card" data-business="${b.id}"><div class="team-art ${b.color}">${icon(b.icon)}<span>${e(b.kind).toUpperCase()}</span></div><h2>${e(b.name)}</h2><div class="path-meta"><span>Estimated equity value<strong>${money(assetValue(s, b.id))}</strong></span><span>Your ownership<strong>${percent(stake)}</strong></span><span>Last company profit<strong class="${r.profit >= 0 ? "positive" : "negative"}">${money(r.profit)}/wk</strong></span><span>Staff<strong>${b.employees.toLocaleString("en-US")}</strong></span></div>${b.stock ? `<p class="muted">Shares trade on the market. Build a minority position there, or approach the board for a 5–25% block transaction. More than 50% gives management control.</p><button class="button secondary full-width" data-view="investments">View listed shares ${icon("chart")}</button>` : `<p class="muted">${stake ? `Company cash: ${money(r.cash)}. Ownership pays dividends only when accumulated profit and company cash allow it.` : "This is a privately held business. It is available only through a sale window or an accepted owner negotiation."}</p>`}${t ? `<div class="team-stats"><div><strong>${Math.round(t.rating)}</strong><small>Team rating</small></div><div><strong>${t.wins} / ${t.races}</strong><small>Wins / outings</small></div><div><strong>${money(t.profit)}</strong><small>Trading profit</small></div></div>` : ""}${stake > 50 ? `<label class="field-label">Management strategy<select data-business-strategy="${b.id}"><option value="balanced" ${r.strategy === "balanced" ? "selected" : ""}>Balanced</option><option value="development" ${r.strategy === "development" ? "selected" : ""}>Development — more investment, higher costs</option><option value="commercial" ${r.strategy === "commercial" ? "selected" : ""}>Commercial — sponsorship and sales</option></select></label>${!b.stock ? `<button class="button secondary full-width" data-action="inject-capital" data-id="${b.id}">Fund the business</button>` : ""}` : stake > 0 ? '<p class="muted">A minority stake earns its share of dividends, but does not grant management control.</p>' : ""}<button class="button ${stake >= 100 ? "secondary" : "primary"} full-width approach-button" data-action="approach" data-id="${b.id}" ${stake >= 100 || cooldown || availableCash(s) < meetingFee(s, b.id) ? "disabled" : ""}>${stake >= 100 ? "Fully owned" : cooldown ? `Owners unavailable for ${last.requestedWeek + 26 - s.week} weeks` : `Request introduction · ${money(meetingFee(s, b.id))}`} ${icon("arrow")}</button></section>`;
    },
  ).join("")}</div>`;
}
export function collectiblesScreen(s, u) {
  const { panelHeading, tag, icon, money, e } = u;
  return `<section class="panel collectibles-panel">${panelHeading("Collectibles & auctions", "Estimated values are not a guaranteed resale price.", tag("8% selling commission", "yellow"))}<div class="collectible-grid">${COLLECTIBLES.map(
    (c) => {
      const owned = s.collectibles.owned[c.id],
        lot = s.collectibles.listings.find((l) => l.collectibleId === c.id),
        auction = s.collectibles.auctions
          .filter((a) => a.collectibleId === c.id)
          .at(-1),
        pending = auction?.status === "pending";
      return `<div class="collectible-card"><span class="feature-icon ${c.color}">${icon(c.icon)}</span><span class="eyebrow">${c.category}</span><h3>${c.name}</h3><p>Estimated ${money(s.collectibles.prices[c.id])}${owned ? ` · bought for ${money(owned.basis)}` : ""}</p><small>${owned ? (pending ? "Auction result in " + Math.max(0, auction.decisionWeek - s.week) + " weeks" : auction?.status === "unsold" ? "Last auction found no qualifying buyer." : "Owned; resale depends on finding a buyer.") : lot ? `Asking ${money(lot.price)} · expires in ${lot.expiresWeek - s.week} weeks` : "No authenticated example is listed this week."}</small><button class="button secondary full-width" data-action="${owned ? "consign" : "collectible"}" data-id="${e(owned ? c.id : lot?.id || c.id)}" ${pending || (!owned && (!lot || availableCash(s) < lot.price)) ? "disabled" : ""}>${owned ? (pending ? "At auction" : "Consign to auction") : lot ? "Review listing" : "Currently unavailable"}</button></div>`;
    },
  ).join(
    "",
  )}</div><p class="muted">Dealer listings change every eight weeks. Auctions take two weeks and can fail to find a buyer. Your estimated net worth includes collectibles at 92% of their quoted value; they are not spendable cash.</p></section>`;
}
