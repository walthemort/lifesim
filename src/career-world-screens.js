import { contractTermsFragment } from "./depth-screens.js";
import {
  WORLD_SPORTS,
  SPORT_DESTINATIONS,
  SUPPORT_STAFF,
  TOUR_ROUTES,
  LIVE_CREWS,
  sportWindow,
  nextSportWindow,
  musicReleaseShare,
} from "./career-world.js";
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]),
  age = (s) => s.startAge + Math.floor(s.week / 52);
export function sportWorldScreen(s, u, sport = null) {
  const { panelHeading, e, money, tag } = u;
  return WORLD_SPORTS.filter((id) => !sport || id === sport)
    .filter(
      (id) =>
        !["none", "retired"].includes(actor(s, id).stage) ||
        s.careerWorld.sports[id].staff.length,
    )
    .map((id) => {
      const p = actor(s, id),
        c = s.careerWorld.sports[id],
        pro = !!p.contract && s.career === id;
      const name = {
          football: "Football",
          racing: "Motorsport",
          basketball: "Basketball",
          tennis: "Tennis",
        }[id],
        moveLabel =
          id === "racing"
            ? "Seat market"
            : id === "tennis"
              ? "Training base & sponsorship"
              : "Transfers & playing opportunities";
      const moves = `<form id="sport-move-form" data-sport="${id}"><div class="form-row"><label class="field-label">${name} destination<select name="destination">${SPORT_DESTINATIONS[
        id
      ]
        .filter((d) => d.name !== p.club)
        .map(
          (d) =>
            `<option value="${e(d.name)}">${e(d.name)} · ${d.city}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="field-label">${name} move type<select name="kind"><option value="transfer">${id === "racing" ? "Change team at current level" : id === "tennis" ? "Change base / tour sponsor" : "Permanent move at current level"}</option><option value="step-up">Seek the next career level</option>${["football", "basketball"].includes(id) ? '<option value="loan">Twenty-six-week development loan</option>' : ""}</select></label><label class="field-label">${name} requested role<select name="role"><option value="rotation">${["football", "basketball"].includes(id) ? "Rotation role" : "Standard support"}</option><option value="starter">${["football", "basketball"].includes(id) ? "Starting role, slightly lower pay" : "Priority support, slightly lower pay"}</option></select></label></div><p class="muted">Responses wait for the market window and take at least two weeks. Agents help with interest and release permission; skills, professional experience, competition licences and racing funding remain required. Requesting a move keeps your current job.</p><button class="button secondary" type="submit" ${!pro || !s.actions || s.event || c.loan || c.requests.some((r) => r.status === "pending") ? "disabled" : ""}>Request ${id === "racing" ? "seat talks" : id === "tennis" ? "base / sponsor talks" : "a move"}</button></form>`;
      const offers = c.requests
        .slice()
        .reverse()
        .map((r) => {
          const o = p.offers.find((o) => o.id === `world:${r.id}`);
          return `<div class="application-row"><div><strong>${e(r.destination)}</strong><small>${e(r.kind)} · ${e(r.status)}${r.status === "pending" ? ` · review in ${Math.max(0, r.decisionWeek - s.week)} weeks` : ""}</small></div>${o?.status === "offered" && o.expiresWeek > s.week ? `<button class="button secondary" data-action="world-move-review" data-sport="${id}" data-id="${e(o.id)}">Review career move</button>` : ""}</div>`;
        })
        .join("");
      const staff = SUPPORT_STAFF.map(
        (a) =>
          `<article class="education-card"><h3>${id === "racing" && a.id === "coach" ? "Personal race engineer" : e(a.name)}</h3><p>${money(a.fee)} signing fee · ${money(a.weekly)}/week${a.id === "coach" ? " · supports ability development" : " · accelerates injury recovery"}</p><button class="button secondary" data-action="${c.staff.includes(a.id) ? "world-staff-dismiss" : "world-staff-hire"}" data-id="${a.id}" data-sport="${id}" ${!c.staff.includes(a.id) && (!pro || !s.actions || s.event) ? "disabled" : ""}>${c.staff.includes(a.id) ? "Dismiss staff" : "Hire support staff"}</button></article>`,
      ).join("");
      return `<section class="panel wide-panel" data-sport-team="${id}">${panelHeading(`${name}: ${moveLabel}`, "Develop your professional life, support network and next opportunity.", tag(pro ? "Professional" : "Developing", "blue"))}<div class="life-metrics"><div><span>${id === "racing" ? "Paddock / engineering chemistry" : id === "tennis" ? "Coaching team chemistry" : "Team chemistry"}</span><strong>${Math.round(c.chemistry)}/100</strong></div><div><span>Professional support</span><strong>${Math.round(c.coachTrust)}/100</strong></div><div><span>Market window</span><strong>${sportWindow(s, id) ? "Open" : `In ${nextSportWindow(s, id) - s.week} weeks`}</strong></div></div><p class="muted">${c.assignmentCity} career base${c.travel ? " · travel adds three committed hours each week and can strain relationships" : ""}. ${c.loan ? `On loan until week ${c.loan.returnWeek}, then returning to ${e(c.loan.club)} if the parent contract remains active.` : ""}</p>${pro ? moves : '<p class="muted">Paid career moves and staff become available after earning a professional contract. Continue developing through the sporting pathway.</p>'}<div class="application-list">${offers}</div><div class="inline-actions"><button class="button secondary" data-action="world-sport-activity" data-kind="team" data-sport="${id}" ${!pro || !s.actions || s.event ? "disabled" : ""}>${id === "racing" ? "Engineering debrief" : id === "tennis" ? "Work with your coaching team" : "Build teammate chemistry"}</button><button class="button secondary" data-action="world-sport-activity" data-kind="role" data-sport="${id}" ${!pro || !s.actions || s.event ? "disabled" : ""}>${["football", "basketball"].includes(id) ? "Discuss playing role" : "Discuss team / tour support"}</button></div><p class="muted">Role reviews take a week and may be refused. Starting-role promises are reviewed against actual available matches, while injury and international absence are excluded.</p><div class="education-grid">${staff}</div><h3>${id === "racing" ? "International exhibitions" : id === "tennis" ? "National tour invitations" : "International call-ups"}</h3><div class="application-list">${
        c.invitations
          .slice()
          .reverse()
          .map(
            (o) =>
              `<div class="application-row"><div><strong>${e(o.name)}</strong><small>${e(o.status)} · ${money(o.fee)} gross appearance fee</small></div>${o.status === "offered" && o.expiresWeek > s.week ? `<button class="button secondary" data-action="world-international" data-sport="${id}" data-id="${o.id}" ${!s.actions || s.event ? "disabled" : ""}>Accept invitation</button>` : ""}</div>`,
          )
          .join("") ||
        '<p class="muted">Strong professional ability and reputation can attract invitations. Participation reserves eight hours and takes you away from your usual fixture that week.</p>'
      }</div></section>`;
    })
    .join("");
}
export function musicWorldScreen(s, u) {
  if (!s.music.active) return "";
  const { panelHeading, e, money } = u,
    c = s.careerWorld.music;
  const opportunities = c.offers
    .slice()
    .reverse()
    .map(
      (o) =>
        `<article class="everyday-card"><h3>${e(o.artist)} · ${o.kind === "client" ? "Production commission" : "Collaboration"}</h3><p>${o.kind === "client" ? `${money(o.clientPay)} gross delivery fee · quality ${o.minimumQuality}+ · deadline week ${o.deadline}. The client owns royalties.` : `${money(o.fee)} collaborator fee plus $150 recording · ${Math.round((1 - o.royalty) * 100)}% of master receipts belong to you, before label/manager terms.`}</p><p>${e(o.status)}${o.status === "offered" ? ` · expires in ${o.expiresWeek - s.week} weeks` : ""}${o.negotiation ? ` · negotiation ${e(o.negotiation.status)}` : ""}</p>${o.status === "offered" && o.expiresWeek > s.week ? `<div class="inline-actions"><button class="button secondary" data-action="world-collab-negotiate" data-id="${o.id}" ${!s.actions || s.event || o.negotiation ? "disabled" : ""}>Discuss terms</button><button class="button secondary" data-action="world-collab-record" data-id="${o.id}" ${!s.actions || s.event || o.negotiation?.status === "pending" ? "disabled" : ""}>Record project</button></div>` : ""}</article>`,
    )
    .join("");
  const album = `<form id="world-album-form"><label class="field-label">Album title<input name="title" maxlength="60" required placeholder="Your next chapter"></label><div class="everyday-grid">${[
    ...s.music.releases,
    ...s.music.projects.filter((p) => p.status === "ready"),
  ]
    .filter(
      (r) =>
        musicReleaseShare(s, r.id) > 0 &&
        !c.albums.some((a) => a.tracks.includes(r.id)),
    )
    .map(
      (r) =>
        `<label class="check-label"><input type="checkbox" name="track" value="${e(r.id)}"> ${e(r.title)}</label>`,
    )
    .join(
      "",
    )}</div><p class="muted">Choose three to eight owned tracks. Mastering costs $250 and four hours; release follows in two weeks. An album promotes the existing tracks and keeps their original ownership shares.</p><button class="button secondary" type="submit" ${age(s) < 16 || !s.actions || s.event ? "disabled" : ""}>Master an album</button></form>`;
  const touring = `<form id="world-tour-form"><div class="form-row"><label class="field-label">Tour route<select name="route">${TOUR_ROUTES.map((r) => `<option value="${r.id}">${e(r.name)} · ${r.shows} shows · ${money(r.setup)} setup · ${money(r.cost)}/show</option>`).join("")}</select></label><label class="field-label">Live team<select name="crew">${LIVE_CREWS.map((t) => `<option value="${t.id}">${e(t.name)} · ${money(t.fee)}/show</option>`).join("")}</select></label></div><p class="muted">Local shows need 100 music fans and eight hours per show week; regional tours need 1,000 fans and twenty-four hours, international tours 10,000 fans and forty hours. You need two owned releases, age eighteen, setup cash and a buffer for two show budgets. Longer tours require a free employment schedule. Rehearsal and craft help performance; ticket sales can disappoint and show costs remain payable.</p><button class="button secondary" type="submit" ${!s.actions || s.event || c.activeTour || age(s) < 18 ? "disabled" : ""}>Plan tour</button></form>`;
  return `<section class="panel wide-panel" data-music-live>${panelHeading("Collaborations, albums & a live career", "Own your agreements and build more than a release count.")}<div class="life-metrics"><div><span>Live readiness</span><strong>${Math.round(c.liveReadiness)}/100</strong></div><div><span>Albums</span><strong>${c.albums.length}</strong></div><div><span>Tours</span><strong>${c.tours.length}</strong></div></div><div class="inline-actions"><button class="button secondary" data-action="world-live-rehearse" ${age(s) < 14 || !s.actions || s.event || c.lastRehearsalWeek === s.week ? "disabled" : ""}>Rehearse live set</button>${c.activeTour ? '<button class="button secondary" data-action="world-tour-cancel">Review tour cancellation</button>' : ""}</div><p class="muted">Rehearsal uses three hours and energy, once each week. Producers rehearse a live production / DJ set. Managers improve access to collaborators and help negotiate terms; early artists may not receive offers immediately.</p></section><section class="panel" data-music-collaborations><h2>Collaborations & commissions</h2><div class="everyday-grid">${opportunities || '<p class="muted">Twelve practice sessions, an existing release and an audience can attract work. Qualified producers may receive paid commissions; other offers share fees and royalties.</p>'}</div></section><section class="panel" data-music-albums><h2>Build an album</h2>${album}<div class="application-list">${c.albums.map((a) => `<div class="application-row"><strong>${e(a.title)}</strong><small>${a.tracks.length} tracks · ${a.status}</small></div>`).join("")}</div></section><section class="panel" data-music-touring><h2>Take your work on the road</h2>${touring}${c.tours
    .slice()
    .reverse()
    .map(
      (t) =>
        `<article class="everyday-card"><h3>${e(TOUR_ROUTES.find((r) => r.id === t.route).name)} · ${e(t.status)}</h3><p>${money(t.gross)} gross receipts · ${money(t.costs)} production/travel costs · ${money(t.gross - t.costs)} before management commission and tax</p><div class="application-list">${t.stops.map((x) => `<div class="application-row"><div><strong>${e(x.city)}</strong><small>Week ${x.week} · ${e(x.status)} · ${x.tickets} tickets</small></div><span>${money(x.gross)} receipts · ${money(x.cost)} budget</span></div>`).join("")}</div></article>`,
    )
    .join("")}</section>`;
}
export function careerMoveDialog(s, id, offerId, u) {
  const { e, money } = u,
    p = actor(s, id),
    o = p.offers.find((o) => o.id === offerId),
    meta = s.careerWorld.sports[id].moves[offerId];
  if (!o || o.status !== "offered" || !meta) return "";
  const pending =
    o.terms?.negotiation?.status === "pending" ||
    s.contracts.reviews.some(
      (r) => r.sector === id && r.offerId === offerId && r.status === "pending",
    );
  const negotiation =
    meta.kind === "loan"
      ? ""
      : o.terms?.negotiation
        ? `<p>Contract negotiation: ${e(o.terms.negotiation.status)}${pending ? ` · review at week ${o.terms.negotiation.decisionWeek}` : ""}.</p>`
        : `<form id="sport-negotiation-form" data-sport="${id}" data-id="${e(offerId)}"><label class="field-label">Contract approach<select name="approach"><option value="security">Security · 156 weeks, 5% less pay</option><option value="balanced">Balanced · 104 weeks, 8% more pay</option><option value="ambitious">Ambitious · 52 weeks, 20% more pay, starter role</option></select></label><p class="muted">A counteroffer uses an action and three hours and takes two weeks. Agents help negotiations; the destination can refuse. You must still sign during an open market window.</p><button class="button secondary" type="submit">Send counteroffer</button></form>`;
  return `<h2>${e(o.club)}</h2><p>${e(meta.kind)} · ${o.terms?.weeks || o.duration} weeks · ${money(o.pay)}/week gross pay · ${e(o.terms?.role || "rotation")} role. Appearance bonus ${money(o.terms?.appearanceBonus || 0)}; win bonus ${money(o.terms?.winBonus || 0)}. Racing funding ${money(o.terms?.annualFunding || 0)}/year requires a thirteen-week uncovered cash buffer.</p>${negotiation}${contractTermsFragment(s, id, offerId, u)}<form id="world-move-sign-form" data-sport="${id}" data-id="${e(offerId)}"><label class="field-label">Household plan<select name="familyPlan"><option value="travel">Keep home base and travel · extra three hours/week where needed</option><option value="move">Move household · $1,500 · age 18+ and partner agreement</option></select></label><p class="muted">Relocating can interrupt a partner’s wages while they seek work and unsettle children. A loan returns to the original remaining contract after twenty-six weeks. Roles help selection but cannot guarantee appearances. Your current contract continues until you sign.</p><button class="button primary full-width" type="submit" ${pending ? "disabled" : ""}>Sign career move</button></form>`;
}
