import {
  COUNTRIES,
  CITY_CATALOGUE,
  country,
  immigrationRule,
} from "./geography.js";
import { INDUSTRIES, CRIMES, RACING_TIERS } from "./expansion-data.js";
import { creatorAvailable } from "./identity.js";
import { immigrationEligibility } from "./expansion.js";
import { gameDate } from "./dates.js";
import { founderPanel } from "./screens.js";
import { ownershipDashboardScreen } from "./pressure-screens.js";
const age = (s) =>
  s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52);
const disabled = (s) =>
  !s.actions || s.event || s.ended || s.globalLife.crime.prison
    ? "disabled"
    : "";
export function relocationScreen(s, u) {
  const { e, panelHeading, money } = u,
    g = s.globalLife,
    rule = immigrationRule(g.residence.country);
  return `<section class="panel wide-panel" data-relocation>${panelHeading("Passports & relocation", "Birthplace, citizenship and residence are separate parts of your identity.")}<div class="life-metrics"><div><span>Birthplace</span><strong>${e(s.characterLife.profile.birthplace)}</strong><small>${e(country(g.birthCountry).name)} · immutable history</small></div><div><span>Current residence</span><strong>${e(s.city)}</strong><small>${e(country(g.residence.country).name)} · since ${gameDate(g.residence.sinceWeek, s)}</small></div><div><span>Language & civic knowledge</span><strong>${g.language}/100</strong></div></div><p class="muted">Citizenship: ${g.citizenships.map((c) => e(country(c).name)).join(", ")}. Moving normally requires residence permission, not citizenship. EU citizens may move within the EU. A work application needs employment; study needs enrolment; investment needs $250,000. These are simplified simulation rules; actual country rules differ. A conviction can block or delay an application.</p><div class="inline-actions"><button class="button secondary" data-action="relocation-dialog" ${age(s) < 18 ? "disabled" : ""}>Plan a move abroad</button><button class="button secondary" data-action="language-study" ${disabled(s)}>Language & civic class · $25</button><button class="button secondary" data-action="naturalisation" ${g.citizenships.includes(g.residence.country) || immigrationEligibility(s, g.residence.country, "citizenship").length ? "disabled" : ""}>Apply for citizenship · ${money(rule.fee)}</button></div><p class="muted">Naturalisation in ${e(country(g.residence.country).name)}: ${rule.years === null ? "no ordinary route in this simulation" : `${rule.years} years of residence, 60 civic knowledge and a character/background review`}. It adds citizenship; it does not erase your previous nationality or convictions.</p><div class="application-list">${g.applications
    .slice()
    .reverse()
    .map(
      (a) =>
        `<div class="application-row"><div><strong>${e(country(a.country).name)} · ${e(a.route)}</strong><small>${e(a.status)} · review ${gameDate(a.decisionWeek, s)}${a.reason ? ` · ${e(a.reason)}` : ""}</small></div></div>`,
    )
    .join("")}</div></section>`;
}
export function relocationDialog(s, u) {
  const { e } = u;
  return `<div class="eyebrow">A NEW HOME</div><h2>Moving across borders.</h2><p>Choose a residence route, wait for approval, then confirm your move. Citizenship normally follows years of residence. Moving and a housing buffer need at least $3,000.</p><form id="relocation-form"><label class="field-label">Destination country<select name="country" id="relocation-country">${COUNTRIES.map((c) => `<option value="${c.code}" ${c.code === "US" ? "selected" : ""}>${e(c.name)}</option>`).join("")}</select></label><label class="field-label">Find a city<input id="relocation-city-search" type="search" placeholder="Search cities"></label><label class="field-label">Destination city<select name="city" id="relocation-city">${CITY_CATALOGUE.US.slice(
    0,
    200,
  )
    .map((c) => `<option>${e(c)}</option>`)
    .join(
      "",
    )}</select></label><label class="field-label">Application route<select name="route"><option value="work">Work residence · needs employment</option><option value="study">Student residence · needs enrolment</option><option value="investor">Investor residence · $250,000 funds</option></select></label><label class="field-label">Your next step<select name="step"><option value="apply">Submit residence application</option><option value="move">Confirm move with passport / approval</option>${creatorAvailable(s) ? '<option value="contact">Pro relocation contact · $2,500 (checks still apply)</option>' : ""}</select></label><p class="muted" data-immigration-rule>Visa review and application fees vary by country. Your citizenship and criminal record are checked. A relocation contact arranges residence permission; it cannot grant instant citizenship.</p><button class="button primary full-width" type="submit" ${disabled(s)}>Confirm selected step</button></form>`;
}
export function crimeScreen(s, u) {
  const { title, panelHeading, e, money } = u,
    c = s.globalLife.crime;
  return `${title("CHOICES & CONSEQUENCES", "A different kind of path.", "Crime can bring short-lived money, court costs, custody and lasting damage to your opportunities.")}<section class="panel wide-panel">${panelHeading("Your criminal record", "Records remain after release. Rehabilitation helps your life, but does not erase a conviction.")}<div class="life-metrics"><div><span>Convictions</span><strong>${c.record.length}</strong></div><div><span>Exposure</span><strong>${Math.round(c.heat)}/100</strong></div><div><span>Rehabilitation</span><strong>${c.rehabilitation}/100</strong></div></div>${
    c.prison
      ? `<div class="info-banner warning">In custody · expected release ${gameDate(c.prison.releaseWeek, s)}. Employment has ended; normal career, shopping and travel activities are unavailable.</div><div class="inline-actions">${[
          ["education", "Prison education"],
          ["rehabilitation", "Rehabilitation programme"],
          ["exercise", "Supervised exercise"],
        ]
          .map(
            ([id, name]) =>
              `<button class="button secondary" data-action="prison-activity" data-id="${id}">${name}</button>`,
          )
          .join("")}</div>`
      : ""
  }<div class="application-list">${c.record.map((r) => `<div class="application-row"><div><strong>${e(CRIMES[r.crime].name)}${r.juvenile ? " · juvenile case" : ""}</strong><small>${gameDate(r.week, s)} · ${r.sentence} weeks custody · ${money(r.fine)} fine</small></div></div>`).join("") || '<p class="muted">No convictions recorded.</p>'}</div></section>${
    !c.prison
      ? `<div class="everyday-grid">${Object.entries(CRIMES)
          .map(
            ([id, d]) =>
              `<article class="panel"><h3>${e(d.name)}</h3><p>Potential proceeds: ${money(d.gain)}. High chance of detection. Conviction can bring ${d.sentence} weeks in custody and a ${money(d.fine)} fine. Prior exposure increases the risk.</p><button class="button secondary" data-action="crime-review" data-id="${id}" ${age(s) < d.age || disabled(s) ? "disabled" : ""}>Review risky choice</button></article>`,
          )
          .join("")}</div>`
      : ""
  }`;
}
export function studioScreen(s, u) {
  const { panelHeading, e, money } = u,
    g = s.globalLife;
  return `<section class="panel wide-panel" data-track-studio>${panelHeading("Artist identity & track workshop", "Beat → lyrics → recording → mixing → unreleased library → single or album.")}<form id="artist-name-form"><div class="form-row"><label class="field-label">Artist name<input name="name" value="${e(g.artistName)}" maxlength="40" required></label><button class="button secondary" ${disabled(s)}>Save artist name</button></div></form><button class="button primary" data-action="track-new" ${disabled(s)}>Create a track</button><div class="application-list">${
    g.tracks
      .filter((t) => t.stage !== "released")
      .slice()
      .reverse()
      .map((t) => {
        const p = s.music.projects.find((p) => p.id === t.projectId);
        return `<article class="everyday-card" data-track="${e(t.id)}"><h3>${e(t.title)}</h3><p>${e(t.stage)} · ${e(t.theme)} · ${e(t.beat)} beat · ${money(t.cost)} spent</p><small>Beat ${t.beatQuality}/100 · lyrics ${t.lyricQuality}/100 · performance ${t.vocalQuality}/100${p ? ` · track rating ${p.quality}/100` : ""}</small>${["beat", "lyrics", "vocals"].includes(t.stage) ? `<p>${t.sessions}/${t.ambition === "ambitious" ? 4 : t.ambition === "lean" ? 1 : 2} sessions in this stage. Each session uses an action, three hours and four energy.</p><button class="button secondary" data-action="track-work" data-id="${e(t.id)}" ${disabled(s)}>${t.stage === "beat" ? "Produce beat" : t.stage === "lyrics" ? "Write & revise lyrics" : "Record performance"}</button>` : t.stage === "mixing" ? `<p>Mixing expected ${gameDate(p.releaseWeek, s)}. Overbooked weeks delay completion.</p>` : t.stage === "ready" ? `<p>Unreleased. Keep this track for an album or schedule a single.</p><button class="button primary" data-action="track-release" data-id="${e(t.id)}" ${disabled(s)}>Release single</button>` : `<p>${t.stage === "scheduled" ? `Release scheduled for ${gameDate(p.releaseWeek, s)}.` : `Released as ${e(g.artistName)}. Revenue is recorded once in your catalogue.`}</p>`}</article>`;
      })
      .join("") ||
    '<p class="muted">Your unreleased library starts with your first finished track.</p>'
  }</div></section>`;
}
export function trackDialog(s, u) {
  return `<div class="eyebrow">TRACK WORKSHOP</div><h2>Make your next track.</h2><form id="track-form"><label class="field-label">Track title<input name="title" maxlength="60" required></label><label class="field-label">Beat source<select name="beat"><option value="produce">Produce your own · computer required</option><option value="lease">License a non-exclusive beat · $100</option><option value="exclusive">Buy an exclusive beat · $600</option></select></label><label class="field-label">Song direction<select name="theme">${["Personal", "Storytelling", "Party", "Love", "Social commentary", "Instrumental"].map((t) => `<option>${t}</option>`).join("")}</select></label><label class="field-label">Production ambition<select name="ambition"><option value="lean">Demo · one session per stage</option><option value="standard" selected>Standard · two sessions per stage</option><option value="ambitious">Detailed · four sessions per stage</option></select></label><p class="muted">At least eight practice sessions are needed. Buying a beat moves you to lyric writing. Recording needs equipment and $150 for production; mixing takes four calendar weeks. Finished tracks stay unreleased until you choose a single or album. Skills and preparation determine ratings; success remains uncertain.</p><button class="button primary full-width" ${disabled(s)}>Start track workshop</button></form>`;
}
export function companyScreen(s, u) {
  const { title, e, money, panelHeading } = u,
    c = s.company,
    p = s.globalLife.companyPlan;
  return `${title("IDEA, CUSTOMERS & OPERATIONS", "Build your own company.", "Choose an industry and a business model. Fund the work, find customers and manage actual company cash.")}${founderPanel(s, u)}${
    c
      ? `<section class="panel wide-panel">${panelHeading("Business model & development", "Development is paid from company cash. Spending does not guarantee growth.")}<div class="life-metrics"><div><span>Quality</span><strong>${p.quality}/100</strong></div><div><span>Customer relationships</span><strong>${p.customers}</strong></div><div><span>Research sessions</span><strong>${p.research}</strong></div></div><form id="business-model-form"><div class="form-row"><label class="field-label">Business model<select name="model" aria-label="Business model">${["service", "retail", "subscription", "manufacturing", "licensing"].map((v) => `<option ${v === p.model ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="field-label">Pricing<select name="price">${["budget", "standard", "premium"].map((v) => `<option ${v === p.price ? "selected" : ""}>${v}</option>`).join("")}</select></label><button class="button secondary" ${disabled(s)}>Set business model</button></div></form><button class="button secondary" data-action="founder-fund-dialog" ${disabled(s)}>Contribute founder capital</button><div class="inline-actions">${[
          ["research", 100, "Customer research"],
          ["quality", 300, "Improve quality"],
          ["marketing", 200, "Run customer campaign"],
        ]
          .map(
            ([id, cost, label]) =>
              `<button class="button secondary" data-action="business-develop" data-id="${id}" ${p.lastAction === s.week || c.cash < cost || disabled(s) ? "disabled" : ""}>${label} · ${money(cost)}</button>`,
          )
          .join(
            "",
          )}</div></section>${ownershipDashboardScreen(s, u, "founder")}`
      : `<div class="industry-grid">${INDUSTRIES.map((i) => `<article class="panel"><h3>${e(i.name)}</h3><p>${e(i.description)}</p><strong>${money(i.capital)} startup capital</strong><p class="muted">${Math.round(i.volatility * 1000) / 10}% weekly trading volatility · staffing, operations and facilities cost real money.</p><button class="button secondary" data-action="company-launch-plan" data-id="${e(i.name)}" ${age(s) < 18 ? "disabled" : ""}>Explore business plan</button></article>`).join("")}</div>`
  }`;
}
export function companyLaunchDialog(s, u, sector = "Technology") {
  const { e, money } = u;
  return `<div class="eyebrow">YOUR BUSINESS PLAN</div><h2>Turn an idea into a company.</h2><form id="found-company-form"><label class="field-label">Company name<input name="name" maxlength="40" required value="${e(s.name.split(" ")[0])} Ventures"></label><label class="field-label">Industry<select name="sector">${INDUSTRIES.map((i) => `<option ${i.name === sector ? "selected" : ""}>${e(i.name)}</option>`).join("")}</select></label><label class="field-label">Business model<select name="model" aria-label="Business model"><option value="service">Services & client work</option><option value="retail">Retail & ecommerce</option><option value="subscription">Subscriptions</option><option value="manufacturing">Manufacturing</option><option value="licensing">Licensing & intellectual property</option></select></label><label class="field-label">Pricing policy<select name="price"><option value="budget">Budget & volume</option><option value="standard" selected>Standard</option><option value="premium">Premium</option></select></label><p data-startup-cost class="muted">${money(INDUSTRIES.find((i) => i.name === sector).capital)} startup capital · age eighteen and 30 business skill. You can keep your day job. Capital moves to the company's cash account; it is not spent twice.</p><button class="button primary full-width">Launch company</button></form>`;
}
export function careerCockpit(s, u, path) {
  const { e, money } = u,
    p = path === "football" ? s.football : s.sports[path],
    season = s.seasons[path],
    next = season.fixtures.find(
      (f) => f.status === "scheduled" && f.week > s.week,
    ),
    own = season.table.find((t) => t.id === 0),
    r = s.globalLife.racing;
  if (path === "racing")
    return `<section class="career-cockpit paddock"><div class="cockpit-eyebrow">DRIVER CONTROL CENTRE</div><h2>${e(RACING_TIERS.find((t) => t.id === r.tier).name)}</h2><div class="cockpit-grid"><div class="circuit-map"><svg viewBox="0 0 260 150" role="img" aria-label="Circuit illustration"><path d="M34 115L29 42Q28 19 55 20L90 23 108 64 145 57 160 24Q178 8 207 26L228 85Q238 116 205 122L141 109 102 128 60 131Z" fill="none" stroke="#94acbf" stroke-width="9"/><path d="M34 115L29 42Q28 19 55 20L90 23 108 64 145 57 160 24Q178 8 207 26L228 85Q238 116 205 122L141 109 102 128 60 131Z" fill="none" stroke="#182835" stroke-width="4"/><circle cx="29" cy="72" r="6" fill="#f38661"/></svg><small>Season circuit illustration</small></div><div><span>NEXT ROUND</span><h3>${next ? e(next.opponent) : "Between race weekends"}</h3><p>${next ? gameDate(next.week, s) : "Prepare for the next season"}</p><p>${e(p.club || "Local karting")} · ${own?.points || 0} points · ${own?.wins || 0} wins</p></div><div><span>YOUR DEVELOPMENT</span><h3>${Math.round(p.ability)} racecraft</h3><p>${r.affiliate ? e(r.affiliate.name) : "Independent driver · no junior affiliation"}</p><p>Licence: ${s.education.completed.includes("super-license") ? "Top level" : s.education.completed.includes("international-license") ? "International" : s.education.completed.includes("racing-license") ? "National" : "Karting entry"}</p></div></div><div class="ladder-strip">${RACING_TIERS.map((t) => `<span class="${t.id === r.tier ? "current" : ""}">${e(t.name)}</span>`).join("")}</div><p>Championship wins and strong results attract next-tier offers. Formula 4 begins at fifteen with a licence and funding; Formula 1 also depends on scarce seats and incumbent contracts. A championship does not guarantee an offer.</p>${r.offers
      .filter((o) => o.status === "offered")
      .map(
        (o) =>
          `<div class="application-row"><div><strong>${e(RACING_TIERS.find((t) => t.id === o.tier).name)} seat invitation</strong><small>Respond by ${gameDate(o.expiresWeek, s)}</small></div><button class="button primary" data-action="kart-seat" data-id="${e(o.id)}">Accept karting seat</button></div>`,
      )
      .join("")}<div class="application-list">${r.history
      .slice()
      .reverse()
      .map(
        (h) =>
          `<div class="application-row"><strong>${e(RACING_TIERS.find((t) => t.id === h.tier).name)} · ${s.startingYear + h.year}</strong><small>P${h.position} · ${h.points} points · ${h.wins} wins · ${h.starts} starts</small></div>`,
      )
      .join("")}</div></section>`;
  if (path === "football")
    return `<section class="career-cockpit football-desk"><div class="cockpit-eyebrow">PLAYER & MATCH CENTRE</div><h2>${e(p.club || "Your football journey")}</h2><div class="cockpit-grid"><div class="pitch-map"><svg viewBox="0 0 160 110" role="img" aria-label="Football pitch illustration"><rect x="8" y="8" width="144" height="94" fill="#285a48" stroke="#86bda4"/><path d="M80 8v94M8 31h25v48H8m144-48h-25v48h25" stroke="#86bda4" fill="none"/><circle cx="80" cy="55" r="16" stroke="#86bda4" fill="none"/><circle cx="80" cy="55" r="4" fill="#fff"/></svg></div><div><span>NEXT FIXTURE</span><h3>${next ? e(next.opponent) : "Between fixtures"}</h3><p>${next ? gameDate(next.week, s) : "Develop through school and club training"}</p><p>${e(p.position)} · ${p.matches} appearances · ${p.goals} goals</p></div><div><span>CONTRACT & FORM</span><h3>${Math.round(season.form)} match form</h3><p>${p.contract ? `Ends ${p.contract.expiresWeek === null ? "Ongoing agreement" : gameDate(p.contract.expiresWeek, s)}` : "Developing · no professional contract"}</p><p>${own?.points || 0} league points · ${Math.round(p.coachTrust)} coach trust</p></div></div></section>`;
  return "";
}
export function notificationCount(s) {
  const g = s.globalLife,
    unseen = (id) => !g.readAlerts.includes(id);
  return (
    s.nextChapter.messages.filter(
      (m) => !m.read && !m.archived && m.status === "open" && unseen(m.id),
    ).length +
    g.marketAlerts.filter((a) => unseen(a.id)).length +
    g.applications.filter((a) => a.status !== "pending" && unseen(a.id))
      .length +
    g.racing.offers.filter(
      (o) => o.status === "offered" && o.expiresWeek > s.week && unseen(o.id),
    ).length +
    s.music.projects.filter(
      (p) => p.status === "ready" && unseen(`studio:${p.id}`),
    ).length +
    (s.event && unseen(`event:${s.week}`) ? 1 : 0)
  );
}
export function notificationDialog(s, u) {
  const { e } = u,
    g = s.globalLife,
    msg = s.nextChapter.messages.filter(
      (m) => !m.read && !m.archived && m.status === "open",
    );
  const extra =
    g.racing.offers
      .filter(
        (o) =>
          o.status === "offered" &&
          o.expiresWeek > s.week &&
          !g.readAlerts.includes(o.id),
      )
      .map(
        (o) =>
          `<article class="everyday-card"><h3>${e(RACING_TIERS.find((t) => t.id === o.tier).name)} seat invitation</h3><p>Review before ${gameDate(o.expiresWeek, s)}.</p><button class="button secondary" data-action="notification-sports">Review driver opportunities</button></article>`,
      )
      .join("") +
    s.music.projects
      .filter(
        (p) => p.status === "ready" && !g.readAlerts.includes(`studio:${p.id}`),
      )
      .map(
        (p) =>
          `<article class="everyday-card"><h3>Mixing completed: ${e(p.title)}</h3><p>Your finished recording is unreleased. Choose a single or an album.</p><button class="button secondary" data-action="notification-music">Open your unreleased library</button></article>`,
      )
      .join("");
  return `<div class="eyebrow">NOTIFICATIONS</div><h2>What changed in your world.</h2>${s.event ? `<article class="everyday-card"><h3>${e(s.event.title)}</h3><p>${e(s.event.text)}</p><button class="button primary" data-action="event">Make your life choice</button></article>` : ""}<div class="application-list">${msg.map((m) => `<article class="everyday-card"><h3>${e(m.title)}</h3><p>${e(m.body || m.text || "A new decision is waiting in your personal inbox.")}</p><button class="button secondary" data-action="notification-inbox">Review messages & decisions</button></article>`).join("")}${g.marketAlerts.map((a) => `<article class="everyday-card"><h3>${e(a.symbol)} ${a.change >= 0 ? "↑" : "↓"} ${Math.abs(a.change)}%</h3><p>Your held investment changed during the last trading period · ${gameDate(a.week, s)}</p><button class="button secondary" data-action="notification-markets">Review investments</button></article>`).join("")}${g.applications
    .filter((a) => a.status !== "pending" && !g.readAlerts.includes(a.id))
    .map(
      (a) =>
        `<article class="everyday-card"><h3>${e(country(a.country).name)} · application ${e(a.status)}</h3><p>${e(a.reason || "Your immigration decision is ready.")}</p><button class="button secondary" data-action="notification-identity">Review passports & relocation</button></article>`,
    )
    .join(
      "",
    )}${extra}</div>${!s.event && !msg.length && !g.marketAlerts.length && !extra && !g.applications.some((a) => a.status !== "pending" && !g.readAlerts.includes(a.id)) ? '<p class="muted">You are caught up. Career offers and material moves in your held investments appear here.</p>' : ""}`;
}
