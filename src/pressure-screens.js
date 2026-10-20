import {
  PERFORMANCE_CHOICES,
  nextPerformance,
  fixtureContext,
  CREATIVE_BUDGETS,
  RELEASE_SCHEDULES,
  RELEASE_MARKETING,
  currentTrend,
} from "./pressure.js";
import { BUSINESSES, stakePercent } from "./world.js";
import {
  ownerStandings,
  ownerDriverStandings,
  OWNER_ROLES,
  OWNER_BUDGETS,
  OWNER_GOALS,
  ownerControl,
  ownerQuote,
  ownerFacilityQuote,
} from "./ownership-play.js";
import { matchDetailFields } from "./profession-screens.js";

const sportNames = {
  football: "Football",
  racing: "Motorsport",
  basketball: "Basketball",
  tennis: "Tennis",
};
export function performanceScreen(s, u, path) {
  const { panelHeading, e } = u,
    p = path === "football" ? s.football : s.sports[path],
    f = nextPerformance(s, path),
    plan = s.nextChapter.plans[path];
  if (["none", "retired"].includes(p.stage)) return "";
  const history = s.nextChapter.planHistory
    .filter((p) => p.path === path)
    .slice(0, 3);
  return `<section class="panel wide-panel" data-performance="${path}">${panelHeading(`${sportNames[path]} performance decisions`, "Prepare for an actual fixture; tactics do not replace ability, selection or funding.")}${
    f
      ? `<p><strong>${e(f.opponent)}</strong> · week ${f.week}<br>${e(fixtureContext(s, path, f))}</p><p class="muted">Attacking can improve performance or backfire, uses more energy and increases injury risk. Patient play trades upside for consistency. Racing pit plans depend on conditions; no approach guarantees a win.</p>${
          plan?.fixtureId === f.id && plan.status === "planned"
            ? `<p class="opportunity-note">Prepared: ${e(PERFORMANCE_CHOICES[path][plan.choice])}</p>`
            : `<form data-form="performance-plan" data-path="${path}"><div class="form-row"><label class="field-label">${sportNames[path]} approach<select name="choice" aria-label="${sportNames[path]} approach">${Object.entries(
                PERFORMANCE_CHOICES[path],
              )
                .map(([id, name]) => `<option value="${id}">${name}</option>`)
                .join(
                  "",
                )}</select></label></div>${matchDetailFields(s, u, path, f)}<button class="button secondary" type="submit" ${!s.actions || s.event || s.ended || p.injuryWeeks ? "disabled" : ""}>Prepare performance plan</button></form><p class="muted">Costs one action and two preparation hours. One decision per fixture, in the two weeks before it starts.</p>`
        }`
      : '<p class="muted">Your next fixture is more than two weeks away. Training and recovery continue.</p>'
  }${history.map((p) => `<p class="muted">Week ${p.resultWeek}: ${e(PERFORMANCE_CHOICES[path][p.choice])} · ${e(p.status)}${p.status === "delivered" ? ` · ${p.score}/100 performance` : ""}</p>`).join("")}</section>`;
}
export function creativePlanningScreen(s, u, kind) {
  const { panelHeading, e, money } = u;
  if (kind === "music") {
    if (!s.music.active) return "";
    return `<section class="panel wide-panel">${panelHeading("Your next release plan", "Choose a production budget, guest session, release schedule and marketing approach.")}<p class="muted">The normal eight-session, equipment and $150 recording requirements apply. Better budgets and longer development give modest quality gains; discovery remains uncertain. Marketing only helps public discovery. A guest is hired for a flat fee and takes no master share.</p><button class="button secondary" data-action="chapter-plan-recording" ${!s.actions || s.event || s.ended || s.music.sessions < 8 || s.music.projects.some((p) => p.status === "recording") ? "disabled" : ""}>Plan a music release</button><div class="application-list">${Object.entries(
      s.nextChapter.recordings,
    )
      .slice(-5)
      .reverse()
      .map(([id, p]) => {
        const track =
          s.music.projects.find((t) => t.id === id) ||
          s.music.releases.find((t) => t.id === id);
        return `<div class="application-row"><div><strong>${e(track?.title || "Recording")}</strong><small>${e(CREATIVE_BUDGETS[p.budget].name)} budget · ${e(RELEASE_SCHEDULES[p.schedule].name)} · ${e(RELEASE_MARKETING[p.marketing].name)} · ${money(150 + p.extraCost)} spent</small></div></div>`;
      })
      .join("")}</div></section>`;
  }
  return `<section class="panel wide-panel">${panelHeading("Research, record & edit", "Plan videos, posts and streams with an actual production budget.")}<p>Current simulated trend: <strong>${e(currentTrend(s))}</strong></p><p class="muted">Trends change every thirteen weeks. Researching a matching topic modestly improves reach, with no guaranteed audience. Production uses the usual platform/equipment gates plus two or three planning/editing hours and the chosen budget. Results arrive next week; private posts remain private.</p><button class="button secondary" data-action="chapter-plan-content" ${!s.actions || s.event || s.ended || !Object.values(s.social.profiles).some((p) => p.active) ? "disabled" : ""}>Plan content production</button></section>`;
}
export function recordingPlanDialog(s, u) {
  const { e, money } = u;
  return `<h2>Plan your music release.</h2><form id="chapter-recording-form"><label class="field-label">Release title<input name="title" maxlength="60" required></label><div class="everyday-grid"><label class="field-label">Production budget<select name="budget">${Object.entries(
    CREATIVE_BUDGETS,
  )
    .map(
      ([id, b]) =>
        `<option value="${id}">${b.name} · ${money(b.fee)} extra</option>`,
    )
    .join(
      "",
    )}</select></label><label class="field-label">Release schedule<select name="schedule">${Object.entries(
    RELEASE_SCHEDULES,
  )
    .map(([id, b]) => `<option value="${id}">${b.name}</option>`)
    .join(
      "",
    )}</select></label><label class="field-label">Release marketing<select name="marketing">${Object.entries(
    RELEASE_MARKETING,
  )
    .map(
      ([id, b]) => `<option value="${id}">${b.name} · ${money(b.fee)}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="field-label">Guest musician<select name="guest"><option value="solo">Solo recording</option><option value="session">Session musician · $300 flat fee</option></select></label></div><p class="muted">Base recording: $150, one action and three hours. Planning adds two hours; all extra costs are paid upfront. A guest requires age sixteen and twelve sessions. Existing label rights and royalties retain their terms.</p><button class="button primary" type="submit">Start planned recording</button></form>`;
}
export function contentPlanDialog(s, u) {
  const { e } = u;
  return `<h2>Plan your next production.</h2><form id="chapter-content-form"><div class="everyday-grid"><label class="field-label">Production platform<select name="platform">${Object.entries(
    s.social.profiles,
  )
    .filter(([, p]) => p.active)
    .map(([id]) => `<option value="${id}">${e(id)}</option>`)
    .join(
      "",
    )}</select></label><label class="field-label">Content approach<select name="approach"><option value="authentic">Authentic</option><option value="polished">Polished</option><option value="clickbait">Sensational / clickbait</option></select></label><label class="field-label">Sponsored delivery<select name="sponsored"><option value="false">Organic production</option><option value="true">Deliver an active labelled collaboration</option></select></label><label class="field-label">Content budget<select name="budget"><option value="lean">Lean · normal platform cost</option><option value="standard">Standard · $25 extra</option><option value="ambitious">Full production · $100 extra</option></select></label><label class="field-label">Topic research<select name="research"><option value="false">Use your existing knowledge</option><option value="true">Research the topic · $10 extra</option></select></label><label class="field-label">Production topic<select name="theme">${["lifestyle", "football", "business", "gaming", "music"].map((id) => `<option value="${id}">${id}</option>`).join("")}</select></label></div><p class="muted">Current trend: ${e(currentTrend(s))}. The normal account, equipment and two-post weekly limits apply. Standard posting takes three hours; planning adds two hours, or three with research. Sensational public posts harm reputation and can invite questions.</p><button class="button primary" type="submit">Produce planned content</button></form>`;
}
export function familyConflictScreen(s, u) {
  const { panelHeading, e, tag } = u,
    requests = s.nextChapter.familyRequests.filter((r) =>
      ["pending", "agreed"].includes(r.status),
    );
  if (!requests.length && !s.family.partnerId && !s.family.children.length)
    return "";
  return `<section class="panel wide-panel" data-family-conflicts>${panelHeading("Family scheduling conversations", "Birthdays, anniversaries and a partner’s career can need compromises.")}<div class="everyday-grid">${requests.map((r) => `<article class="everyday-card"><h3>${e(r.title)}</h3><p>Week ${r.dueWeek} · ${r.conflicts.map((p) => sportNames[p]).join(", ") || "No sporting fixture conflict"}${r.travel ? " · a booked performance/trip prevents attending at home" : ""}</p>${r.status === "pending" ? `<form data-form="chapter-family" data-id="${e(r.id)}"><label class="field-label">Family compromise<select name="choice" aria-label="Family compromise">${r.kind !== "partner-career" ? '<option value="early">Celebrate early · $25 / four hours now</option>' : ""}${!r.travel ? '<option value="attend">Protect the day · $40 / six hours then</option>' : ""}<option value="video">Arrange a remote call · one hour then</option>${r.kind === "partner-career" ? '<option value="support">Arrange childcare · $75 / four hours then</option>' : ""}<option value="decline">Explain why you cannot attend</option></select></label><button class="button secondary" type="submit" ${!s.actions || s.event || s.ended ? "disabled" : ""}>Discuss family compromise</button></form>` : `${tag("Agreed", "blue")}<p>${e(r.choice)} · paid $${r.paid}</p>`}</article>`).join("") || '<p class="muted">Upcoming family requests appear close to their actual dates.</p>'}</div><p class="muted">Replies cost an action and one planning hour, except early celebrations which use four hours now. Protecting a day excuses conflicting personal sports appearances and loses their participation/bonuses; your team still competes. Booked gigs, tours and international appearances need a different compromise. Missing an unanswered or undelivered commitment harms connection and trust. Supporting a partner develops their opportunity without guaranteeing a promotion.</p></section>`;
}
export function inboxScreen(s, u, { archived = false } = {}) {
  const { title, panelHeading, e, tag } = u,
    all = s.nextChapter.messages,
    visible = all
      .filter((m) => m.archived === archived)
      .sort(
        (a, b) =>
          Number(b.status === "open") - Number(a.status === "open") ||
          a.deadline - b.deadline ||
          b.createdWeek - a.createdWeek,
      ),
    unread = all.filter(
      (m) => !m.read && !m.archived && m.status === "open",
    ).length;
  return `${title("PEOPLE, OPPORTUNITIES & DEADLINES", "Your personal inbox.", "Messages reflect actual invitations and commitments. Opening a message never signs a contract or spends money.")}<section class="panel wide-panel">${panelHeading("Messages & decisions", `${unread} unread live messages · ${visible.length} ${archived ? "archived" : "current"}`)}<button class="button secondary" data-action="chapter-inbox-filter">${archived ? "Show current messages" : "Show archived messages"}</button><div class="inbox-list">${visible.map((m) => `<article class="everyday-card inbox-message ${m.read ? "" : "unread"}" data-inbox-id="${e(m.id)}"><div class="panel-heading"><div><h3>${e(m.title)}</h3><p>${e(m.kind)} · ${m.deadline > s.week ? `deadline in ${m.deadline - s.week} weeks` : "window ended"}</p></div>${tag(m.status, m.status === "open" ? "blue" : "purple")}</div><p>${e(m.body)}</p><div class="inline-actions">${!m.read ? `<button class="button secondary" data-action="chapter-read-message" data-id="${e(m.id)}">Mark read</button>` : ""}${!m.archived ? `<button class="text-button" data-action="chapter-archive-message" data-id="${e(m.id)}">Archive</button>` : ""}${m.status === "open" && !["press", "backlash"].includes(m.kind) ? `<button class="button secondary" data-view="${m.view}" ${m.path && sportNames[m.path] ? `data-sport="${m.path}"` : ""}>Open relevant category</button>${m.action ? `<button class="button primary" data-action="${e(m.action)}" data-id="${e(m.ref)}" ${m.path ? `data-sport="${e(m.path)}"` : ""}>Review invitation</button>` : ""}` : ""}${m.status === "open" && ["press", "backlash"].includes(m.kind) && !m.reply ? `<form data-form="chapter-public" data-id="${e(m.id)}"><label class="field-label">Public response<select name="choice"><option value="thoughtful">Answer thoughtfully / clarify the facts</option><option value="headline">Make a bold headline / stand by the post</option>${m.kind === "press" ? '<option value="promise">Promise a new project or community session</option>' : ""}</select></label><button class="button secondary" type="submit" ${!s.actions || s.event || s.ended ? "disabled" : ""}>Send public response</button></form>` : ""}</div></article>`).join("") || '<p class="muted">No messages here. Invitations arrive through your actual school, work, sporting, creative and family life.</p>'}</div></section>${familyConflictScreen(s, u)}<section class="panel wide-panel">${panelHeading("Your public promises", "An explicit announcement creates a six-week obligation.")}<div class="everyday-grid">${s.nextChapter.promises.map((p) => `<article class="everyday-card"><h3>${p.kind === "release" ? "Release a new owned track" : p.kind === "content" ? "Deliver two public posts of at least 35 quality" : "Host a community sports session"}</h3><p>${e(p.status)} · deadline week ${p.deadline}</p>${p.kind === "clinic" && p.status === "active" && p.clinicWeek === null ? `<button class="button secondary" data-action="chapter-community-promise" data-id="${e(p.id)}" ${!s.actions || s.event || s.ended ? "disabled" : ""}>Host community session · $50 / three hours</button>` : ""}</article>`).join("") || '<p class="muted">You have made no explicit public promises.</p>'}</div><p class="muted">Delivering adds one reputation; a broken promise loses four. Fame and low public reputation can affect employers, while contracts and sponsorships retain their own requirements.</p></section>`;
}
export function ownershipDashboardScreen(s, u, focus = null) {
  const { panelHeading, e, money, tag } = u,
    owned = BUSINESSES.filter((b) => stakePercent(s, b.id) > 0),
    choices = [
      ...owned.map((b) => ({ id: b.id, name: b.name })),
      ...(s.company ? [{ id: "founder", name: s.company.name }] : []),
    ];
  if (!choices.length) return "";
  const selected = choices.find((b) => b.id === focus) || choices[0],
    id = selected.id,
    b = id === "founder" ? null : BUSINESSES.find((b) => b.id === id),
    control = ownerControl(s, id),
    r = id === "founder" ? s.company : s.businessResults[id],
    m = s.ownershipPlay.management[id],
    competition = b?.sporting ? s.ownershipPlay.competitions[id] : null;
  const table = competition ? ownerStandings(s, id) : [];
  return `<section class="panel wide-panel" data-ownership-dashboard="${id}" id="ownership-dashboard">${panelHeading("Your ownership dashboard", "Company cash funds appointments and facilities. Your personal cash and ownership stake are separate.")}<nav class="ownership-shortcuts" aria-label="Owned businesses">${choices.map((b) => `<button class="section-shortcut ${b.id === id ? "active" : ""}" data-action="chapter-owner-focus" data-id="${b.id}" ${b.id === id ? 'aria-current="true"' : ""}>${e(b.name)}</button>`).join("")}</nav><h2>${e(selected.name)}</h2><div class="company-numbers"><div><span>Company cash</span><strong>${money(r.cash)}</strong></div><div><span>Last operating profit</span><strong>${money(r.profit)}/week</strong></div><div><span>Your authority</span><strong>${control ? "Management control" : "Minority shareholder"}</strong></div></div>${
    competition
      ? `<h3>${b.racing ? (id === "f1-team" ? "F1 constructor championship" : "GT team championship") : id === "harbor-fc" ? "National league table" : "Regional league table"} · season ${competition.year + 1}</h3><p class="muted">${competition.shared ? "Shared with your playing-club / Formula 1 career; these are the same competition records." : `Competition results tracked from week ${competition.trackedFromWeek}. Earlier results are unrecorded.`} Matches and races continue even while you are away or not selected.</p><div class="standings-scroll"><table class="owner-table" data-owner-standings="${id}"><thead><tr><th>Rank</th><th>${b.racing ? "Team" : "Club"}</th><th>Played</th><th>Wins</th>${!b.racing ? "<th>Draws</th><th>Losses</th><th>For</th><th>Against</th><th>GD</th>" : ""}<th>Points</th></tr></thead><tbody>${table.map((t, index) => `<tr class="${t.id === 0 ? "your-side" : ""}"><td>${index + 1}</td><th scope="row">${e(t.name)}</th><td>${t.played}</td><td>${t.wins}</td>${!b.racing ? `<td>${t.draws}</td><td>${t.losses}</td><td>${t.for}</td><td>${t.against}</td><td>${t.for - t.against}</td>` : ""}<td>${t.points}</td></tr>`).join("")}</tbody></table></div>${
          id === "f1-team"
            ? `<h3>Driver championship</h3><div class="standings-scroll"><table class="owner-table" data-owner-drivers><thead><tr><th>Rank</th><th>Driver</th><th>Constructor</th><th>Races</th><th>Wins</th><th>Points</th></tr></thead><tbody>${ownerDriverStandings(
                s,
                id,
              )
                .map(
                  (d, index) =>
                    `<tr class="${d.teamId === 0 ? "your-side" : ""}"><td>${index + 1}</td><th scope="row">${e(d.name)}</th><td>${e(competition.table[d.teamId].name)}</td><td>${d.played}</td><td>${d.wins}</td><td>${d.points}</td></tr>`,
                )
                .join("")}</tbody></table></div>`
            : ""
        }<h3>Recent club / team results</h3>${
          competition.fixtures
            .filter((f) => f.status === "played")
            .slice(-5)
            .reverse()
            .map(
              (f) =>
                `<p>Week ${f.week} · ${e(f.result.opponent)} · ${b.racing ? `best car position ${f.result.position}` : `${f.result.ownScore}–${f.result.otherScore}`} ${f.result.won ? "· win" : ""}</p>`,
            )
            .join("") ||
          '<p class="muted">No tracked results yet this season.</p>'
        }`
      : ""
  }${
    control
      ? `<h3>Budget & long-term plan</h3><form data-form="chapter-owner-plan" data-id="${id}"><div class="form-row"><label class="field-label">Operating budget<select name="budget">${Object.entries(
          OWNER_BUDGETS,
        )
          .map(
            ([key, name]) =>
              `<option value="${key}" ${(m?.budget || "balanced") === key ? "selected" : ""}>${name}</option>`,
          )
          .join(
            "",
          )}</select></label><label class="field-label">Ownership goal<select name="goal">${Object.entries(
          OWNER_GOALS,
        )
          .map(
            ([key, name]) =>
              `<option value="${key}" ${(m?.goal || "stability") === key ? "selected" : ""}>${name}</option>`,
          )
          .join(
            "",
          )}</select></label></div><button class="button secondary" type="submit" ${!s.actions || s.event || s.ended || m?.lastPlanWeek === s.week ? "disabled" : ""}>Review operating plan</button></form><p class="muted">Each review uses an action and two hours. Cautious budgets reduce baseline costs 3% and sporting strength by two; ambitious budgets increase baseline costs 8% and strength by two. Staff wages and facility upkeep are additional. Goals record your direction without guaranteeing a title or profits.</p><h3>Staff & recruitment</h3><div class="everyday-grid">${Object.entries(
          OWNER_ROLES,
        )
          .map(([role, name]) => {
            const staff = m?.staff.find((p) => p.role === role),
              quote = ownerQuote(s, id, role, "experienced");
            return `<article class="everyday-card"><h3>${e(name)}</h3>${staff ? `<p>${e(staff.tier)} appointment · ${money(staff.weekly)}/week<br>Contract ends in ${staff.expiresWeek - s.week} weeks.</p><button class="button secondary" data-action="chapter-owner-dismiss" data-id="${id}" data-role="${role}" ${!s.actions || s.event || s.ended ? "disabled" : ""}>End appointment · notice applies</button>` : `<p>Experienced hire: ${money(quote.fee)} signing fee · ${money(quote.weekly)}/week. Company cash must also cover thirteen additional wage payments.</p><form data-form="chapter-owner-hire" data-id="${id}" data-role="${role}"><label class="field-label">Recruitment level<select name="tier"><option value="experienced">Experienced</option><option value="developing">Developing · lower wages</option></select></label><button class="button secondary" type="submit" ${!s.actions || s.event || s.ended ? "disabled" : ""}>Recruit appointment</button></form>`}</article>`;
          })
          .join(
            "",
          )}</div><h3>${b?.racing ? "Engineering & facilities" : b?.sporting ? "Training facilities" : "Business facilities"}</h3><p>Facility level ${m?.facility || 0}/3. ${m?.project ? `Construction completes in ${m.project.finishWeek - s.week} weeks.` : `Next upgrade: ${money(ownerFacilityQuote(s, id).fee)} from company cash; four weeks of construction. Each level adds ${money(ownerFacilityQuote(s, id).upkeep)}/week upkeep.`}</p><button class="button secondary" data-action="chapter-owner-upgrade" data-id="${id}" ${!s.actions || s.event || s.ended || m?.project || (m?.facility || 0) >= 3 ? "disabled" : ""}>Commission facility upgrade</button><p class="muted">Sporting facilities and recruited talent improve team strength; commercial staff improve revenue. Company facilities improve revenue modestly. Operating losses remain in the business; investments do not guarantee returns or create personal cash.</p>`
      : '<p class="muted">Minority holdings can read sporting and financial reports but cannot appoint staff, change budgets or spend company cash. More than 50% is required for management.</p>'
  }${(m?.history || [])
    .slice(0, 5)
    .map((h) => `<p class="muted">Week ${h.week}: ${e(h.text)}</p>`)
    .join("")}</section>`;
}
