import {
  SPORT_SPECIALTIES,
  SPORT_ROLES,
  TRAINING_LOADS,
  WORK_CASES,
  WORK_METHODS,
  MATCH_DETAILS,
  STUDIO_REVIEWS,
  ART_DIRECTIONS,
  SERIES_FORMATS,
  CLIENT_BRIEFS,
} from "./profession-data.js";
import {
  CAREER_KIT,
  CAREER_CELEBRATIONS,
  kitIllustration,
  celebrationIllustration,
} from "./career-style.js";
import {
  tennisSurface,
  currentSportSpecialties,
} from "./profession-effects.js";
import { jobDefinition, isSportingJob } from "./world.js";
import { gameDate } from "./dates.js";
import { careerPathReason } from "./career-commitment.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  off = (s) =>
    !s.actions || s.ended || s.event || s.globalLife.crime.prison
      ? "disabled"
      : "";
const options = (entries, selected, e) =>
  Object.entries(entries)
    .map(
      ([id, name]) =>
        `<option value="${e(id)}" ${id === selected ? "selected" : ""}>${e(name)}</option>`,
    )
    .join("");
export function sportingDevelopment(s, u, path) {
  const p = s.profession.sports[path],
    a = path === "football" ? s.football : s.sports[path],
    b = p.block;
  const skills = currentSportSpecialties(s, path);
  return `<section class="panel" data-profession-training>${u.panelHeading("Build your sporting identity", "Specialist skills change your contribution; training load, rest and the fixture conditions matter.")}<div class="specialty-grid">${Object.entries(
    SPORT_SPECIALTIES[path],
  )
    .map(
      ([key, name]) =>
        `<div><span>${name}</span><strong>${skills[key].toFixed(1)}</strong>${u.meter(skills[key], "green")}</div>`,
    )
    .join(
      "",
    )}</div><p class="muted">Training fatigue ${Math.round(p.fatigue)}/100. High fatigue reduces performance and increases injury risk; it recovers over time.</p><form data-form="sport-identity" data-path="${path}"><label class="field-label">Sporting role<select name="role">${options(SPORT_ROLES[path], p.role, u.e)}</select></label><button class="button secondary" ${age(s) < 8 || p.roleWeek === s.week || ["none", "retired"].includes(a.stage) || off(s) ? "disabled" : ""}>Choose sporting role</button></form>${
    b?.status === "active"
      ? `<article class="career-brief"><h3>${SPORT_SPECIALTIES[path][b.focus]}</h3><p>${TRAINING_LOADS[b.load].name} · ${b.hours} hours/week · through ${gameDate(b.endsWeek, s)}</p><p>${b.sessions}/4 sessions · ${b.missed} missed · ${u.money(b.paid)} paid</p><p>${u.e(b.note)}</p><button class="text-button" data-action="profession-training-cancel" data-id="${path}" ${off(s)}>Cancel training block</button></article>`
      : `<form data-form="sport-block" data-path="${path}"><h3>Plan a four-week development block</h3><label class="field-label">Specialty<select name="focus">${options(SPORT_SPECIALTIES[path], null, u.e)}</select></label><label class="field-label">Training load<select name="load">${Object.entries(
          TRAINING_LOADS,
        )
          .map(
            ([id, d]) =>
              `<option value="${id}">${d.name} · ${d.hours}h/week · ${u.money(d.cost)}/week</option>`,
          )
          .join(
            "",
          )}</select></label><p class="muted">Uses one planning action and one hour. Future sessions reserve calendar time and charge only when delivered. Coached blocks need age twelve; all blocks need age eight and an active, uninjured sport.</p><button class="button primary" ${age(s) < 8 || a.injuryWeeks || ["none", "retired"].includes(a.stage) || off(s) ? "disabled" : ""}>Start development block</button></form>`
  }${p.history
    .slice(0, 2)
    .map(
      (h) =>
        `<p class="muted">${SPORT_SPECIALTIES[path][h.focus]} · ${h.sessions} delivered / ${h.missed} missed · ${u.money(h.paid)}</p>`,
    )
    .join("")}</section>`;
}
export function matchDetailFields(s, u, path, f) {
  return `<details class="sport-tactical-details"><summary>${path === "racing" ? "Setup & tyres" : path === "football" ? "Player instructions & set pieces" : path === "basketball" ? "Shot selection & defensive coverage" : "Surface & point construction"}</summary>${path === "tennis" ? `<p>${tennisSurface(f)}. Grass rewards the serve/net game; clay rewards patient baseline construction.</p>` : path === "racing" ? "<p>Downforce helps wet grip; low drag favours stable conditions. Soft tyres can struggle with high wear; a wet compound is costly on a dry track.</p>" : path === "basketball" ? "<p>Perimeter shooting can stretch a compact defence. Attacking the paint needs space; man coverage depends on your defensive skill.</p>" : "<p>Passing lanes help against a press. Runs, defensive cover and set-piece work use their relevant specialist skills.</p>"}${Object.entries(
    MATCH_DETAILS[path],
  )
    .map(
      ([key, d]) =>
        `<label class="field-label">${d.label}<select name="detail-${key}">${options(d.options, key === "compound" ? "auto" : "balanced", u.e)}</select></label>`,
    )
    .join("")}</details>`;
}
export function sportingAnalysis(s, u, path) {
  const p = s.profession.sports[path],
    r = p.reports[0],
    kit = CAREER_KIT.find((k) => k.id === s.profession.style.equipment[path]);
  return `<section class="panel" data-profession-analysis>${u.panelHeading(path === "racing" ? "Driver debrief" : path === "football" ? "Player match report" : path === "basketball" ? "Player box score" : "Court performance report", "Fixture outcomes feed your report. Individual indicators are modelled from your actual appearance, skills and performance.")}<div class="equipped-career-kit">${kitIllustration(kit)}<div><strong>${kit.name}</strong><small>Appearance only</small><button class="text-button" data-action="profession-open-style" data-id="${path}">Personalise your kit</button></div></div>${
    r
      ? `<h3>${u.e(r.opponent)}</h3><p>${gameDate(r.week, s)} · ${r.score}/100 performance · ${SPORT_ROLES[path][r.role]}</p><div class="specialty-grid">${Object.entries(
          r.metrics,
        )
          .map(
            ([key, value]) =>
              `<div><span>${u.e(key)}</span><strong>${value}</strong></div>`,
          )
          .join(
            "",
          )}</div>${r.celebrationId ? `<div class="victory-moment">${celebrationIllustration(CAREER_CELEBRATIONS[path].find((c) => c.id === r.celebrationId))}<p>Your signature moment</p></div>` : ""}`
      : '<p class="muted">Your first actual appearance will create a report. Selection, licences, contracts and funding still apply.</p>'
  }<div class="application-list">${p.reports
    .slice(1, 6)
    .map(
      (r) =>
        `<div class="application-row"><span>${gameDate(r.week, s)} · ${u.e(r.opponent)}</span><strong>${r.score}/100</strong></div>`,
    )
    .join("")}</div></section>`;
}
export function careerStyleScreen(s, u, path) {
  const p = s.profession.style,
    selected = CAREER_KIT.find((k) => k.id === p.equipment[path]),
    c = CAREER_CELEBRATIONS[path].find((c) => c.id === p.celebrations[path]),
    access = s.debug.enabled || s.characterLife.proPreview;
  return `<section class="panel" data-profession-style>${u.panelHeading("Your kit & signature moments", "Choose how you look and celebrate. Designs never change skill, selection or race performance.")}<div class="career-style-hero">${kitIllustration(selected)}${celebrationIllustration(c)}</div><h3>${selected.name}</h3><div class="career-kit-grid">${CAREER_KIT.filter(
    (k) => k.path === path,
  )
    .map((k) => {
      const owned = k.price === 0 || p.owned.includes(k.id);
      return `<article class="career-kit-card">${kitIllustration(k)}<h3>${k.name}</h3><span class="tag ${k.pro ? "purple" : "blue"}">${k.pro ? "Pro design" : "Standard design"}</span><p>${owned ? "In your kit" : u.money(k.price)}</p><button class="button secondary" data-action="profession-equip" data-id="${k.id}" ${k.id === selected.id || (!access && k.pro && !owned) || s.ended || s.globalLife.crime.prison ? "disabled" : ""}>${k.id === selected.id ? "Equipped" : owned ? "Wear this design" : k.pro && !access ? "Pro preview required" : "Buy & equip"}</button></article>`;
    })
    .join(
      "",
    )}</div><form data-form="career-celebration" data-path="${path}"><label class="field-label">Signature celebration<select name="celebration">${CAREER_CELEBRATIONS[path].map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""} ${x.pro && !access ? "disabled" : ""}>${x.name}${x.pro ? " · Pro design" : ""}</option>`).join("")}</select></label><button class="button primary" ${s.ended || s.globalLife.crime.prison ? "disabled" : ""}>Set celebration</button></form><p class="muted">Kit purchases use simulated personal cash. Premium designs use the existing free Pro/Debug preview; no real purchase is offered.</p></section>`;
}
export function workAssignmentScreen(s, u) {
  const j = jobDefinition(s.employment?.jobId),
    p = s.profession.work,
    a = p.active;
  if ((!j || isSportingJob(j)) && !p.history.length) return "";
  const c = WORK_CASES[a?.track || j?.track] || WORK_CASES.office,
    methods = WORK_METHODS[a?.track || j?.track] || WORK_METHODS.office;
  return `<section class="panel" data-profession-work>${u.panelHeading(c.name, c.text)}${
    a
      ? `<article class="career-brief"><span class="eyebrow">${c.stages[a.stage]}</span><h3>${a.progress.toFixed(1)}/6 delivery units</h3><p>Deadline ${gameDate(a.dueWeek, s)} · ${Math.round(a.quality)}/100 evidence quality</p><p>${u.money(a.bonus)} gross project bonus only after a successful delivery. One session per week gives colleagues time to respond.</p><form data-form="work-assignment"><label class="field-label">Your next working session<select name="method">${Object.entries(
          methods,
        )
          .map(([id, d]) => `<option value="${id}">${u.e(d.label)}</option>`)
          .join(
            "",
          )}</select></label><p class="muted">Three hours and an action. Faster methods deliver 1.5 units but leave less time for checking. Quality and collaboration deliver one unit; the right approach depends on the profession.</p><button class="button primary" ${a.lastSessionWeek === s.week || off(s) ? "disabled" : ""}>Work on assignment</button></form></article>`
      : `<p>Take a supervised, role-appropriate assignment at your current employer. Complete research, delivery and review over several weeks. Success helps performance and manager trust; missed deadlines can hurt your review.</p><button class="button primary" data-action="profession-assignment-start" ${!j || isSportingJob(j) || s.week < p.nextWeek || off(s) ? "disabled" : ""}>Take a work assignment</button>`
  }<div class="application-list">${p.history
    .slice(0, 5)
    .map(
      (a) =>
        `<article class="career-brief"><h3>${u.e(a.title)}</h3><p>${u.e(a.status)} · ${u.e(a.outcome || "")}</p><small>${u.money(a.paid || 0)} gross bonus. This does not grant a qualification or promotion.</small></article>`,
    )
    .join("")}</div></section>`;
}
export function musicCareerScreens(s, u) {
  if (!s.music.active) return "";
  const m = s.profession.music,
    eligible = s.music.projects.filter(
      (p) =>
        p.status === "ready" && !m.studio.some((r) => r.projectId === p.id),
    ),
    role = s.music.role;
  return `<section class="panel" data-profession-music-audience>${u.panelHeading("Your sound & your listeners", "Artistic choices trade opening reach against repeat listening; strong music still matters.")}<form data-form="artistic-direction"><label class="field-label">Artist direction<select name="direction">${Object.entries(
    ART_DIRECTIONS,
  )
    .map(
      ([id, d]) =>
        `<option value="${id}" ${id === m.direction ? "selected" : ""}>${d.name}</option>`,
    )
    .join(
      "",
    )}</select></label><p>${ART_DIRECTIONS[m.direction].text}</p><p class="muted">One action and two hours. Keep a direction for at least thirteen weeks. Accessible releases have a wider opening, while experimental releases need quality to retain listeners. Existing rights, royalties and label terms still apply.</p><button class="button secondary" ${s.week < m.changedWeek + 13 || off(s) ? "disabled" : ""}>Set artist direction</button></form><p>Core listener loyalty ${Math.round(m.loyalty)}/100 · influenced by genuine new-release feedback.</p>${m.reviews
    .slice(0, 5)
    .map(
      (r) =>
        `<article class="career-brief"><h3>${u.e(r.title)}</h3><p>Critics ${r.critical}/100 · listeners ${r.publicRating}/100</p><small>${r.firstWeekStreams.toLocaleString()} first-week streams · ${gameDate(r.week, s)}</small></article>`,
    )
    .join(
      "",
    )}</section><section class="panel" data-profession-studio>${u.panelHeading(role === "producer" ? "Producer's final listening room" : role === "rapper" ? "Flow, delivery & the final take" : "Vocal performance & arrangement", "Give a finished, unreleased recording one final role-specific revision before release.")}<p class="muted">One review per recording, one action and three hours. Skill determines a modest quality improvement; you cannot polish a released recording or repeatedly farm its rating.</p>${
    eligible
      .map(
        (p) =>
          `<form data-form="studio-review" data-id="${u.e(p.id)}"><h3>${u.e(p.title)} · ${p.quality}/100</h3><label class="field-label">Final studio session<select name="method">${Object.entries(
            STUDIO_REVIEWS[p.role],
          )
            .map(
              ([id, d]) =>
                `<option value="${id}">${d.name} · ${u.money(d.cost)}</option>`,
            )
            .join(
              "",
            )}</select></label><button class="button secondary" ${off(s)}>Revise finished recording</button></form>`,
      )
      .join("") ||
    "<p>Your finished, unreleased recordings appear here after mixing.</p>"
  }${m.studio
    .slice(0, 3)
    .map(
      (r) =>
        `<p class="muted">${u.e(s.music.projects.find((p) => p.id === r.projectId)?.title || "Archived recording")} · ${STUDIO_REVIEWS[r.role][r.method].name} · +${r.gain} quality · ${u.money(r.cost)}</p>`,
    )
    .join("")}</section>`;
}
export function creatorSeriesScreen(s, u) {
  if (careerPathReason(s, "creator"))
    return `<section class="panel" data-profession-series><h2>A series is a creator career</h2><p>${u.e(careerPathReason(s, "creator"))}</p><p class="muted">Ordinary social posts, fans and your social media manager remain available around your current career.</p></section>`;
  const series = s.profession.creator.series,
    p = series.find((p) => p.status === "active");
  return `<section class="panel" data-profession-series>${u.panelHeading("Build a series", "Six real episodes, an audience promise and a publishing rhythm.")}${
    p
      ? `<h3>${u.e(p.title)}</h3><p>${SERIES_FORMATS[p.format]} · ${p.platform} · ${p.cadence === 1 ? "Weekly" : "Fortnightly"}</p><div class="specialty-grid"><div><span>Published episodes</span><strong>${p.episodes.filter((e) => e.status === "published").length}/6</strong></div><div><span>Audience retention</span><strong>${Math.round(p.retention)}%</strong></div></div><p class="muted">Next episode from ${gameDate(p.nextWeek, s)}. Missing the cadence reduces retention. Episodes use ordinary production costs, gear and the shared two-post weekly limit. Your social manager does not create these episodes automatically.</p><form data-form="series-episode" data-id="${u.e(p.id)}"><label class="field-label">Episode approach<select name="approach"><option value="authentic">Authentic</option><option value="polished">Polished</option><option value="clickbait">Clickbait · retention risk</option></select></label><button class="button primary" ${p.episodes.length >= 6 || s.week < p.nextWeek || p.episodes.some((e) => e.createdWeek === s.week) || off(s) ? "disabled" : ""}>Produce next episode</button></form><div class="application-list">${p.episodes.map((e, i) => `<div class="application-row"><span>Episode ${i + 1} · ${e.status}</span><strong>${e.views.toLocaleString()} views</strong><small>${e.gained} followers${e.retention !== null ? ` · ${e.retention}% modelled retention` : ""}</small></div>`).join("")}</div>`
      : `<form data-form="creator-series"><label class="field-label">Series title<input name="title" maxlength="50" required></label><label class="field-label">Series platform<select name="platform">${Object.entries(
          s.social.profiles,
        )
          .filter(([, p]) => p.active)
          .map(([id]) => `<option value="${id}">${id}</option>`)
          .join(
            "",
          )}</select></label><label class="field-label">Series format<select name="format">${options(SERIES_FORMATS, null, u.e)}</select></label><label class="field-label">Publishing cadence<select name="cadence"><option value="1">Weekly</option><option value="2">Fortnightly</option></select></label><button class="button primary" ${age(s) < 13 || off(s) ? "disabled" : ""}>Plan a six-episode series</button></form>`
  }${series
    .filter((p) => p.status === "completed")
    .slice(-3)
    .map(
      (p) =>
        `<p>${u.e(p.title)} · completed · ${p.episodes.reduce((n, e) => n + e.views, 0).toLocaleString()} views</p>`,
    )
    .join("")}</section>`;
}
export function clientContractsScreen(s, u) {
  if (!s.company) return "";
  const p = s.profession.company,
    active = p.contracts.find((c) =>
      ["active", "invoiced", "disputed"].includes(c.status),
    );
  return `<section class="panel" data-profession-clients>${u.panelHeading("Client contracts", `${s.company.sector}: fund delivery, meet the brief and collect the invoice.`)}<p>Company cash ${u.money(s.company.cash)}. These client projects are separate from ordinary sales; there is no upfront payment.</p>${
    active
      ? `<article class="career-brief"><h3>${CLIENT_BRIEFS[active.kind].name}</h3><p>${active.units}/${CLIENT_BRIEFS[active.kind].units} delivery units · ${Math.round(active.quality)}/100 quality</p><p>${u.money(active.fee)} fee · ${u.money(active.costs)} delivery costs so far</p><p>Deadline ${gameDate(active.dueWeek, s)} · ${u.e(active.status)}</p><p>${u.e(active.note)}</p>${active.status !== "invoiced" ? `<form data-form="client-delivery" data-id="${u.e(active.id)}"><label class="field-label">Delivery method<select name="approach"><option value="quality">Careful delivery · ${u.money(CLIENT_BRIEFS[active.kind].unitCost * 1.2)} company cash</option><option value="efficient">Lean delivery · ${u.money(CLIENT_BRIEFS[active.kind].unitCost)} company cash</option></select></label><button class="button primary" ${active.lastSessionWeek === s.week || off(s) ? "disabled" : ""}>Deliver client work</button></form>` : `<p>Invoice due ${gameDate(active.invoiceWeek, s)}.</p>`}</article>`
      : `<div class="everyday-grid">${Object.entries(CLIENT_BRIEFS)
          .map(
            ([id, d]) =>
              `<article class="career-brief"><h3>${d.name}</h3><p>${d.units} delivery units · ${d.weeks} weeks · ${d.quality}/100 required quality</p><p>${u.money(d.fee)} fee on collection · ${u.money(d.unitCost)}–${u.money(d.unitCost * 1.2)} cost per unit</p><small>Needs ${d.skill} business skill. Delivery uses one action and three hours, at most once per week. Weak work requires paid remediation before the deadline.</small><button class="button secondary" data-action="profession-client-accept" data-id="${id}" ${s.skills.business < d.skill || s.week < p.nextWeek || off(s) ? "disabled" : ""}>Accept client brief</button></article>`,
          )
          .join("")}</div>`
  }<div class="application-list">${p.contracts
    .filter((c) => !["active", "invoiced", "disputed"].includes(c.status))
    .slice(-6)
    .reverse()
    .map(
      (c) =>
        `<article class="career-brief"><h3>${CLIENT_BRIEFS[c.kind].name} · ${c.status}</h3><p>${u.e(c.note)}</p><small>${u.money(c.paid - c.costs)} realised project margin · company funds only</small></article>`,
    )
    .join("")}</div></section>`;
}
export function investorScreens(s, u, markets) {
  const p = s.profession.investing;
  return `<section class="panel" data-profession-research>${u.panelHeading("Your research desk", "Study observations, concentration and downside; research never reveals future prices.")}<div class="investor-watchlist">${markets.map((m) => `<article class="career-brief"><h3>${m.symbol} · ${u.e(m.name)}</h3><p>${u.money(s.market[m.id], 2)} · ${m.risk} risk</p><div class="inline-actions"><button class="button secondary" data-action="profession-watch" data-id="${m.id}">${p.watchlist.includes(m.id) ? "Remove from watchlist" : "Watch this asset"}</button><button class="button secondary" data-action="profession-research" data-id="${m.id}" ${age(s) < 18 || p.research.some((r) => r.asset === m.id && r.week === s.week) || off(s) ? "disabled" : ""}>Research fundamentals</button></div></article>`).join("")}</div>${p.research
    .slice(0, 8)
    .map(
      (r) =>
        `<article class="career-brief"><h3>${markets.find((m) => m.id === r.asset).symbol} · ${gameDate(r.week, s)}</h3><p>${r.observations} weekly price observations · ${r.volatility.toFixed(2)}% observed weekly volatility · ${r.drawdown.toFixed(2)}% below the observed high</p><p>${r.profit === null ? "No listed-company profit statement" : `${u.money(r.profit)} simulated issuer profit this week`}</p><small>${u.e(r.note)}</small></article>`,
    )
    .join(
      "",
    )}</section><section class="panel" data-profession-orders>${u.panelHeading("Limit orders", "Set your price and expiry. Orders are checked at weekly closes, using actual available cash, units and market liquidity.")}<form data-form="limit-order"><label class="field-label">Order asset<select name="asset">${markets.map((m) => `<option value="${m.id}">${m.symbol} · ${u.e(m.name)}</option>`).join("")}</select></label><label class="field-label">Order side<select name="side"><option value="buy">Buy at or below the limit</option><option value="sell">Sell at or above the limit</option></select></label><label class="field-label">Order quantity<input type="number" name="quantity" min="0.000001" step="0.000001" value="1" required></label><label class="field-label">Limit price in USD<input type="number" name="limit" min="0.01" step="0.01" value="${s.market.index}" required></label><label class="field-label">Order expiry<select name="weeks"><option value="1">One week</option><option value="4" selected>Four weeks</option><option value="13">Thirteen weeks</option></select></label><p class="muted">Buy orders reserve quantity × limit price; sell orders reserve the units. Up to five open orders. Normal cost basis, investment taxes and weekly liquidity apply. Orders pause in custody and can expire unfilled.</p><button class="button primary" ${age(s) < 18 || off(s) ? "disabled" : ""}>Place limit order</button></form><div class="application-list">${p.orders
    .slice()
    .reverse()
    .map(
      (o) =>
        `<article class="career-brief"><h3>${o.side.toUpperCase()} ${o.quantity} ${markets.find((m) => m.id === o.asset).symbol} · ${o.status}</h3><p>Limit ${u.money(o.limit, 2)} · expires ${gameDate(o.expiresWeek, s)}</p><small>${u.e(o.note)}</small>${o.status === "pending" ? `<button class="text-button" data-action="profession-order-cancel" data-id="${u.e(o.id)}">Cancel order & release reservation</button>` : ""}</article>`,
    )
    .join("")}</div></section>`;
}
