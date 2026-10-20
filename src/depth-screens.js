import {
  CONTRACT_SPORTS,
  contractProposal,
  sportExitCost,
  allSportExitCosts,
  musicBuyoutCost,
  endorsementEligibility,
} from "./contracts.js";
import {
  MILESTONE_PATHS,
  MILESTONE_LABELS,
  CAREER_CHALLENGES,
} from "./career-milestones.js";
import { CONTACT_CAREERS } from "./living-world.js";
import { standings } from "./seasons.js";
const names = {
  football: "Football",
  racing: "Motorsport",
  basketball: "Basketball",
  tennis: "Tennis",
  music: "Music",
  creator: "Creator",
};
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
const blocked = (s) => !s.actions || s.event || s.ended;
const age = (s) =>
  s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52);
export function contractTermsFragment(s, sector, id, u) {
  const { e, money } = u,
    t = contractProposal(s, sector, id);
  if (!t) return "";
  const review = s.contracts.reviews.find(
    (r) => r.sector === sector && r.offerId === id,
  );
  const loan = s.careerWorld.sports[sector]?.moves[id]?.kind === "loan";
  if (loan)
    return `<div class="info-banner">A development loan retains the parent agreement and its exit and image-rights terms. Returning to the parent club does not charge an exit fee.</div>`;
  const description =
    sector === "music"
      ? `${Math.round(t.royaltyShare * 100)}% artist royalty share before recoupment; ${t.exclusive ? "exclusive recording: outside collaborations and client masters are blocked" : "outside recordings permitted"}. Deliver two owned releases within thirty-nine weeks; missing delivery charges 10% of the advance once. Early buyout repays the unrecouped advance plus ${money(t.exitFee)}.`
      : `Unilateral exit costs up to ${t.releaseWeeks} weeks of contracted pay, limited by time remaining. An approved career move or same-party renewal waives this fee. The team receives ${Math.round(t.imageShare * 100)}% of your personal endorsement receipts while this agreement is active. Wages and sporting bonuses keep their existing terms.`;
  const choices =
    sector === "music"
      ? '<option value="exit">Lower buyout fee · 45% artist royalty share if agreed</option><option value="flexibility">Allow outside recordings · 40% artist royalty share if agreed</option>'
      : '<option value="exit">Two-week exit clause · 25% endorsement share to team if agreed</option><option value="rights">Keep four-week exit · reduce team image share to 10% if agreed</option>';
  return `<section class="everyday-card" data-contract-terms="${sector}"><h3>Clauses & obligations</h3><p>${e(description)}</p><p>Existing sports exit obligations before replacing your employment: ${money(allSportExitCosts(s))}. Approved moves waive the releasing team's fee; other sporting agreements remain enforceable.</p>${review ? `<p>Legal counterproposal: ${e(review.status)}${review.status === "pending" ? ` · decision at week ${review.decisionWeek}` : ""}.</p>` : `<form data-form="legal-review" data-sector="${sector}" data-id="${e(id)}"><label class="field-label">Lawyer approach<select name="approach">${choices}</select></label><p class="muted">Independent legal advice costs $250, one action and three hours. Decisions take two weeks. Your agent or manager helps; advice does not guarantee agreement. You cannot sign while the legal counterproposal is pending.</p><button class="button secondary" type="submit" ${blocked(s) ? "disabled" : ""}>Hire lawyer & counter clauses</button></form>`}</section>`;
}
export function contractsScreen(s, u, filter = null) {
  const { e, money, panelHeading } = u,
    c = s.contracts;
  const accepts = (id) =>
    filter === "sports"
      ? CONTRACT_SPORTS.includes(id)
      : filter === null || id === filter;
  const agreements = Object.entries(c.current).filter(([id]) => accepts(id));
  const offers = c.offers.filter(
    (o) =>
      accepts(o.sector) && o.status === "offered" && o.expiresWeek > s.week,
  );
  const deals = c.endorsements.filter((o) => accepts(o.sector));
  const legacy =
    CONTRACT_SPORTS.some(
      (id) => accepts(id) && actor(s, id).contract && !c.current[id],
    ) ||
    (accepts("music") && s.music.label && !c.current.music);
  const eligible = [...CONTRACT_SPORTS, "music", "creator"].some(
    (id) => accepts(id) && endorsementEligibility(s, id),
  );
  if (
    !agreements.length &&
    !offers.length &&
    !deals.length &&
    !legacy &&
    !eligible
  )
    return "";
  return `<section class="panel wide-panel" data-depth-contracts>${panelHeading("Contracts, rights & commercial work", "Review what you owe, what you own and when you can leave.")}${legacy ? '<p class="muted">Your existing deal keeps its original terms. New exit clauses, image-rights shares and delivery obligations apply only when you sign a new agreement.</p>' : ""}<div class="everyday-grid">${agreements.map(([id, a]) => `<article class="everyday-card"><h3>${names[id]} · ${e(a.party)}</h3><p>${e(a.status)} · ends at week ${a.expiresWeek}</p>${id === "music" ? `<p>${a.exclusive ? "Exclusive recording" : "Outside recording permitted"} · ${Math.round(a.royaltyShare * 100)}% artist share before recoupment · ${a.deliveriesDone}/${a.deliveriesRequired} owned releases delivered by week ${a.deadlineWeek}${a.penaltyCharged ? " · delivery penalty already charged" : ""}</p>${a.status === "active" ? `<p>Current buyout: ${money(musicBuyoutCost(s))}, including the remaining advance.</p><button class="button secondary" data-action="depth-label-buyout">Review label buyout</button>` : ""}` : `<p>Current unilateral exit: ${money(sportExitCost(s, id))}. Team image-rights share: ${Math.round(a.imageShare * 100)}% of endorsements. Approved moves and retirement/expiry do not charge the release fee.</p>`}</article>`).join("")}</div><h3>Personal endorsement opportunities</h3><p class="muted">Established adult athletes, musicians and creators can attract brands. These deals pay half upfront and half after two public appearances in six weeks, with thirteen-week category exclusivity. Each appearance needs preparation and three committed hours next week. Private accounts cannot deliver a public campaign. Missing delivery or cancelling repays the full gross advance; image-rights and representation costs remain spent.</p><div class="everyday-grid">${offers.map((o) => `<article class="everyday-card"><h3>${e(o.brand)} · ${names[o.sector]}</h3><p>${money(o.fee)} gross fee · ${e(o.category)} exclusivity · offer expires in ${o.expiresWeek - s.week} weeks</p><button class="button secondary" data-action="depth-endorsement-review" data-id="${e(o.id)}">Review endorsement</button></article>`).join("") || '<p class="muted">Brand proposals are uncertain. Build your sporting reputation, music audience or creator following; buying possessions does not create an audience.</p>'}</div><div class="everyday-grid">${deals
    .slice()
    .reverse()
    .map(
      (d) =>
        `<article class="everyday-card"><h3>${e(d.brand)} · ${e(d.status)}</h3><p>${d.delivered}/2 appearances · deadline week ${d.deadlineWeek} · ${e(d.category)} exclusivity until week ${d.exclusiveUntil}</p><p>${money(d.grossPaid)} gross paid · ${money(d.imagePaid)} team image-rights costs · ${money(d.managementPaid)} representation costs, before income tax.</p>${["cancelled", "breached"].includes(d.status) ? `<p>${money(d.advance)} gross advance repaid.</p>` : ""}${d.status === "active" ? `<div class="inline-actions"><button class="button secondary" data-action="depth-endorsement-book" data-id="${e(d.id)}" ${blocked(s) || d.bookedWeek !== null ? "disabled" : ""}>Prepare campaign appearance</button><button class="button secondary" data-action="depth-endorsement-cancel" data-id="${e(d.id)}">Review campaign cancellation</button></div>${d.bookedWeek !== null ? `<p>Appearance booked for week ${d.bookedWeek}; three hours reserved.</p>` : ""}` : ""}</article>`,
    )
    .join("")}</div></section>`;
}
export function milestonesScreen(s, u, filter = null) {
  const { e, money, panelHeading } = u;
  const paths = MILESTONE_PATHS.filter(
    (id) =>
      ((filter === "sports"
        ? id !== "music"
        : filter === null || filter === id) &&
        (id === "music"
          ? s.music.active
          : !["none", "retired"].includes(actor(s, id).stage))) ||
      ((filter === null ||
        filter === id ||
        (filter === "sports" && id !== "music")) &&
        s.careerMilestones.paths[id].history.length),
  );
  if (!paths.length) return "";
  return paths
    .map((id) => {
      const m = s.careerMilestones.paths[id],
        opportunities = m.opportunities.filter((o) =>
          ["offered", "booked"].includes(o.status),
        );
      const description =
        id === "football"
          ? "Academy places, playing contracts, actual selection, cup rounds and league campaigns."
          : id === "basketball"
            ? "Academy development, age-limited draft combines, actual selection and three-round playoffs."
            : id === "racing"
              ? "Karting, competition licences, team tests and earned seats from F4 to F1."
              : id === "tennis"
                ? "Tour sponsorship, event wins and qualifying draws; progress follows your actual competition results."
                : "Auditions for vocalists and rappers, production showcases, festival bookings and catalogue milestones.";
      const ranking =
        id === "tennis"
          ? `<p>Your current circuit position: ${standings(s, "tennis").findIndex((t) => t.id === 0) + 1}/${s.seasons.tennis.table.length}. Based on this season’s circuit points.</p>`
          : "";
      return `<section class="panel wide-panel" data-depth-milestones="${id}">${panelHeading(`${names[id]} milestones & opportunities`, description)}${ranking}<p>${m.unlocks.length} recorded milestones${id !== "music" ? ` · ${m.stats.appearances} professional appearances and ${m.stats.wins} wins observed this season` : ""}</p><div class="path-steps">${m.unlocks.map((key) => `<span>${e(MILESTONE_LABELS[key])}</span>`).join("") || "<span>Build your pathway through real participation.</span>"}</div><div class="everyday-grid">${
        opportunities
          .map((o) => {
            const d = CAREER_CHALLENGES.find((d) => d.id === o.kind);
            return `<article class="everyday-card"><h3>${e(d.title)}</h3><p>${money(d.cost)} preparation / travel / entry · three preparation hours and ${d.hours} performance hours · ${e(o.status)}</p>${o.status === "booked" ? `<p>Performance in week ${o.performanceWeek}${["cup", "playoff"].includes(o.kind) ? ` · round ${o.stage + 1}/3` : ""}. Participation replaces the normal sporting fixture that week.</p>` : `<p>Invitation expires in ${o.expiresWeek - s.week} weeks. The draft combine is assessed four weeks after entry; other performances are next week. A successful assessment can attract a separately reviewed contract only if qualifications, experience and skill are sufficient.</p><button class="button secondary" data-action="depth-challenge-book" data-path="${id}" data-id="${e(o.id)}" ${blocked(s) ? "disabled" : ""}>Review career opportunity</button>`}</article>`;
          })
          .join("") ||
        '<p class="muted">Opportunities need sustained development. Cup squads and playoff rosters also require a qualifying league finish and regular professional appearances. Competition costs remain spent if you fail; invitations never guarantee a contract.</p>'
      }</div><details><summary>Career history</summary><div class="application-list">${
        m.history
          .slice(0, 12)
          .map(
            (h) =>
              `<div class="application-row"><div><strong>${e(h.title)}</strong><small>Week ${h.week} · ${e(h.detail)}</small></div></div>`,
          )
          .join("") || "<p>No recorded career moments yet.</p>"
      }</div></details></section>`;
    })
    .join("");
}
export function livingWorldScreen(s, u) {
  const { e, money, panelHeading } = u,
    w = s.livingWorld;
  const people = Object.entries(w.people).filter(([id]) =>
    s.relationships.some(
      (r) =>
        r.id === id &&
        !s.lifeCourse.relatives[id] &&
        !["Parent", "Sibling"].includes(r.role),
    ),
  );
  return `<section class="panel wide-panel" data-living-world>${panelHeading("Their lives keep moving", "Friends, collaborators and rivals have ambitions of their own.")}<p class="muted">Career conversations start at age twelve. Contacts develop over months and years, with promotion, setbacks, job searches and retirement. Hobbies begin alongside school or work; a developing interest does not instantly make them a professional. Catching up, introductions, friendly rivalry and practical support share a four-week cooldown for each person. Family relatives retain their existing life stories.</p><div class="everyday-grid">${
    people
      .map(([id, c]) => {
        const r = s.relationships.find((r) => r.id === id),
          p = s.connections.profiles[id];
        return `<article class="everyday-card" data-contact-career="${e(id)}"><h3>${e(r.name)} · ${e(c.relation)}</h3><p>${e(CONTACT_CAREERS[c.field][c.level])} · ${Math.round(c.reputation)} career reputation</p><p>${e(p.job)} · ${money(p.weeklyPay)}/week personal income · ${e(p.city)}. Their money belongs to them; a cohabiting partner contributes through the existing family budget.</p><div class="inline-actions">${[
          ["catch-up", "Catch up on their life"],
          ["introduction", "Ask for an introduction"],
          ["support", "Support their development"],
          ["rivalry", "Start a friendly rivalry"],
        ]
          .map(
            ([kind, label]) =>
              `<button class="button secondary" data-action="depth-contact-action" data-kind="${kind}" data-id="${e(id)}" ${blocked(s) || age(s) < 12 || s.week < c.lastActionWeek + 4 ? "disabled" : ""}>${label}</button>`,
          )
          .join(
            "",
          )}</div><p class="muted">Each conversation uses an action and two hours. Support costs $100; introductions need age sixteen, a developed contact career and 55 connection/trust. Rivals must share your career and cannot be your partner. A referral opens an ordinary qualified application; shared recordings keep normal costs and ownership, and training gives a small ability gain.</p></article>`;
      })
      .join("") ||
    '<p class="muted">Meet people as you grow up to learn about their ambitions.</p>'
  }</div><div class="application-list">${w.opportunities
    .slice()
    .reverse()
    .map(
      (o) =>
        `<div class="application-row"><div><strong>${e(s.relationships.find((r) => r.id === o.personId)?.name || "A contact")} · ${e(o.status)}</strong><small>${e(o.field)} introduction${o.status === "pending" ? ` · decision at week ${o.decisionWeek}` : ""}</small></div>${
          o.status === "training" && o.expiresWeek > s.week
            ? `<button class="button secondary" data-action="depth-contact-training" data-id="${e(o.id)}" ${blocked(s) ? "disabled" : ""}>Join shared practice</button>`
            : o.status === "board" && o.expiresWeek > s.week
              ? `<button class="button secondary" data-action="approach" data-id="${e(o.resultId)}">Review owner introduction</button>`
              : o.status === "introduced"
                ? `<button class="button secondary" data-view="${o.field === "music" ? "music" : "career"}">Review the opportunity</button>`
                : ""
        }</div>`,
    )
    .join(
      "",
    )}</div><details><summary>News from your circle</summary><div class="application-list">${
    w.stories
      .slice(0, 15)
      .map(
        (h) =>
          `<div class="application-row"><div><strong>Week ${h.week}</strong><small>${e(h.text)}</small></div></div>`,
      )
      .join("") || "<p>Their next chapters will unfold as time passes.</p>"
  }</div></details></section>`;
}
