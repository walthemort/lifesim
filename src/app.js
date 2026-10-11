import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./style.css";
import {
  createGame,
  restoreGame,
  CAREERS,
  ACTIVITIES,
  MARKETS,
  SHOP,
  age,
  salary,
  expenses,
  portfolioValue,
  netWorth,
  careerLevel,
  chooseCareer,
  setActivity,
  advanceWeek,
  resolveEvent,
  invest,
  buy,
  sellItem,
  connect,
  meet,
  setTeamStrategy,
  configureCompany,
} from "./engine.js";

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  briefcase:
    '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a24 24 0 0 0 18 0M12 11v4"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/>',
  chart: '<path d="M3 3v18h18M6 15l5-5 4 3 6-8M17 5h4v4"/>',
  bag: '<path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  trophy:
    '<path d="M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v3a4 4 0 0 0 4 4M16 5h4v3a4 4 0 0 1-4 4M12 14v5M8 21h8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUp: '<path d="m6 15 6-6 6 6M12 9v11"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
  smile:
    '<circle cx="12" cy="12" r="9"/><path d="M8 14a4 4 0 0 0 8 0M8 8v1M16 8v1"/>',
  flag: '<path d="M4 22V3M4 3h7l2 3h7v10h-7l-2-3H4"/>',
  football:
    '<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6 5-4ZM12 3v4M21 9l-4 2M17 19l-2-2M7 19l2-2M3 9l4 2"/>',
  rocket:
    '<path d="M9 15c-2-6 2-10 11-11 0 9-4 13-10 11ZM9 7H5l-2 6h6M17 15v4l-6 2v-6M6 17l-3 4M5 16l-2 2"/><circle cx="15" cy="9" r="2"/>',
  home: '<path d="m3 10 9-7 9 7v11H3V10ZM9 21v-8h6v8"/>',
  car: '<path d="m5 7 2-4h10l2 4 2 3v8H3v-8l2-3ZM5 7h14M3 12h18M6 15h1M17 15h1M5 18v3M19 18v3"/>',
  watch:
    '<rect x="6" y="7" width="12" height="10" rx="3"/><path d="m8 7 1-5h6l1 5M8 17l1 5h6l1-5M12 10v3h3"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h3M14 15h3"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3H9Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const e = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(value);
const initials = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
const STORAGE = "lifesim-save-v1";
let state,
  view = "overview",
  storageWarning = "",
  recoverySave = "",
  toastTimer;
try {
  recoverySave = localStorage.getItem(`${STORAGE}-recovery`) || "";
  const saved = localStorage.getItem(STORAGE);
  try {
    state = saved ? restoreGame(saved) : createGame();
  } catch {
    recoverySave = saved;
    localStorage.setItem(`${STORAGE}-recovery`, saved);
    state = createGame();
    storageWarning =
      "Your previous save could not be loaded. A recovery copy is available in Save & settings.";
  }
} catch {
  state = createGame();
  storageWarning =
    "Browser storage is unavailable. Export your save before leaving.";
}
const app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
function save() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
  } catch {
    storageWarning =
      "Browser storage is unavailable. Export your save before leaving.";
  }
}
function notify(text) {
  const toast = document.querySelector("#toast");
  toast.textContent = text;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 4000);
}
function update(fn, success = "") {
  try {
    state = fn(state);
    save();
    render();
    if (success) notify(success);
    return true;
  } catch (error) {
    notify(error.message);
    return false;
  }
}
function dialog(content) {
  if (modal.open) modal.close();
  modal.innerHTML = `<button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>${content}`;
  const heading = modal.querySelector("h2");
  if (heading) {
    heading.id = "dialog-heading";
    modal.setAttribute("aria-labelledby", heading.id);
  }
  modal.showModal();
}
function tag(text, color = "green") {
  return `<span class="tag ${color}">${e(text)}</span>`;
}
function meter(value, color = "green") {
  return `<div class="meter"><span class="${color}" style="width:${Math.max(0, Math.min(100, value))}%"></span></div>`;
}
function sparkline(values, color = "#62dda6", filled = false) {
  const data = values.length === 1 ? [values[0], values[0]] : values,
    lo = Math.min(...data),
    hi = Math.max(...data),
    spread = hi - lo || Math.max(Math.abs(hi) * 0.1, 1);
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * 400},${85 - ((v - lo) / spread) * 65}`,
    )
    .join(" ");
  return `<svg class="sparkline" viewBox="0 0 400 100" preserveAspectRatio="none" role="img" aria-label="Trend over the last ${values.length} recorded weeks">${filled ? `<polygon points="0,100 ${pts} 400,100" fill="${color}" opacity=".08"/>` : ""}<polyline points="${pts}" stroke="${color}" stroke-width="2.5" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
}
const nav = [
  ["overview", "grid", "Overview"],
  ["career", "briefcase", "Career paths"],
  ["relationships", "users", "Relationships"],
  ["investments", "chart", "Investments"],
  ["lifestyle", "bag", "Lifestyle & shopping"],
  ["teams", "trophy", "Team ownership"],
];
function sidebar() {
  return `<aside class="sidebar"><a class="brand" href="#overview" aria-label="Lifesim overview"><span class="brand-mark">l<span>.</span></span><span>lifesim<span class="brand-dot">.</span></span></a><div class="save-label"><span class="live-dot"></span> YOUR LIFE, IN PLAY</div><div class="nav-label">YOUR WORLD</div><nav aria-label="Main navigation">${nav.map(([id, glyph, label]) => `<button class="nav-item ${view === id ? "active" : ""}" data-view="${id}" aria-label="${e(label)}" ${view === id ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${id === "overview" ? '<span class="nav-active-dot"></span>' : ""}</button>`).join("")}</nav><div class="sidebar-bottom"><div class="chapter-box">${icon("spark")}<strong>One life. Endless possibilities.</strong><p>There’s no right way to live.<br>Find yours.</p></div><button class="nav-item" data-action="settings" aria-label="Save & settings">${icon("settings")}<span>Save & settings</span></button><button class="profile" data-action="character" aria-label="View your character"><span class="avatar">${e(initials(state.name))}</span><span><strong>${e(state.name)}</strong><small>${age(state)} years · ${e(state.city)}</small></span>${icon("chevronDown")}</button></div></aside>`;
}
function header() {
  const date = new Date(Date.UTC(2026, 0, 5 + state.week * 7));
  return `<header class="topbar"><div class="breadcrumb">Your world ${icon("chevron")} <strong>${nav.find((n) => n[0] === view)?.[2]}</strong></div><div class="time-controls"><span class="game-date">${icon("calendar")}<span>${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}<small>YEAR ${Math.floor(state.week / 52) + 1} · WEEK ${(state.week % 52) + 1}</small></span></span><button class="button primary next-week" data-action="next-week" ${state.ended ? "disabled" : ""}>${state.event ? "Make a choice" : "Next week"} ${icon("arrow")}</button></div></header>`;
}
function stats() {
  const cards = [
    [
      "coin",
      "Available cash",
      money(state.money),
      `${salary(state) - expenses(state) >= 0 ? "+" : ""}${money(salary(state) - expenses(state))} / week before investments`,
      "green",
    ],
    [
      "chart",
      "Net worth",
      money(netWorth(state)),
      `${money(portfolioValue(state))} invested`,
      "blue",
    ],
    [
      "smile",
      "Happiness",
      `${Math.round(state.happiness)}<span>/ 100</span>`,
      state.happiness >= 65
        ? "Life is feeling pretty good"
        : "Make some time for yourself",
      "yellow",
    ],
    [
      "bolt",
      "Energy",
      `${Math.round(state.energy)}<span>/ 100</span>`,
      state.energy >= 30
        ? "Ready for what comes next"
        : "A slower week could help",
      "purple",
    ],
  ];
  return `<div class="stat-grid">${cards.map(([glyph, label, value, detail, color]) => `<section class="stat-card"><div class="stat-label">${label}<span class="stat-icon ${color}">${icon(glyph)}</span></div><div class="stat-value">${value}</div><div class="stat-detail">${e(detail)}</div>${glyph === "smile" || glyph === "bolt" ? meter(glyph === "smile" ? state.happiness : state.energy, color) : ""}</section>`).join("")}</div>`;
}
function title(eyebrow, heading, description, extra = "") {
  return `<div class="page-title"><div><div class="eyebrow">${eyebrow}</div><h1>${heading}</h1><p>${description}</p></div>${extra}</div>`;
}
function panelHeading(heading, sub = "", action = "") {
  return `<div class="panel-heading"><div><h2>${heading}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${action}</div>`;
}
function scene() {
  return `<div class="city-scene" aria-hidden="true"><div class="sun"></div><div class="city-back"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="city-front"><i></i><i></i><i></i><i></i><i></i></div><div class="scene-ground"></div><div class="scene-caption">THE WORLD IS YOURS</div></div>`;
}
function overview() {
  const c = CAREERS[state.career],
    level = careerLevel(state),
    next = c.roles[level + 1];
  return `${title("THE BIG PICTURE", `A life of your own<span class="heading-dot">.</span>`, `Welcome back, ${e(state.name.split(" ")[0])}. Every small choice is part of a bigger story.`, `<button class="button secondary" data-action="character">${icon("users")} Your character</button>`)}${stats()}<div class="dashboard-grid"><div class="dashboard-main"><section class="chapter-hero"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> CHAPTER ${Math.floor(state.week / 52) + 1} · THE BEGINNING</div><h2>Your next chapter<br>is unwritten.</h2><p>A career to build. People to meet.<br>A whole world of possibilities.</p><button class="button hero-button" data-view="career">Explore your paths ${icon("arrow")}</button></div>${scene()}</section><section class="panel career-panel">${panelHeading("Your career", "Where ambition meets the everyday.", `<button class="text-button" data-view="career">View career ${icon("arrow")}</button>`)}<div class="current-career"><span class="feature-icon ${c.color}">${icon(c.icon)}</span><div><span class="eyebrow">${e(c.name)} · LEVEL ${level + 1}</span><h3>${e(c.roles[level])}</h3><p>${money(salary(state))} / week <span>·</span> ${state.progress[state.career].weeks} weeks of experience</p></div>${tag("Active path", c.color)}</div><div class="career-progress"><div><span>${next ? `Next: ${e(next)}` : "At the top of your field"}</span><strong>${Math.round(state.skills[c.skill])}<small> / ${[0, 25, 45, 65, 85][Math.min(4, level + 1)]} skill</small></strong></div>${meter(next ? (state.skills[c.skill] / [0, 25, 45, 65, 85][level + 1]) * 100 : 100, c.color)}<small>${next ? `Reach the skill target and ${(level + 1) * 12} total weeks on this path to progress.` : "You made it. What will you do with the possibilities?"}</small></div></section><section class="panel">${panelHeading("This week’s focus", "You decide what deserves your time.", tag("Weekly plan", "blue"))}<div class="focus-grid">${Object.entries(
    ACTIVITIES,
  )
    .map(
      ([id, a]) =>
        `<button class="focus-card ${state.activity === id ? "selected" : ""}" data-action="focus" data-id="${id}" aria-pressed="${state.activity === id}"><span class="focus-radio"></span><strong>${a.name}</strong><small>${a.description}</small></button>`,
    )
    .join(
      "",
    )}</div></section><section class="panel">${panelHeading("Your story so far", "The little moments, and the big ones.")}<div class="story-list">${state.log
    .slice(0, 5)
    .map(
      (l) =>
        `<div class="story-row"><span class="story-dot ${l.kind === "milestone" ? "green" : l.kind === "warning" ? "orange" : "blue"}"></span><div><p>${e(l.text)}</p><small>${l.week === state.week ? "This week" : `Week ${l.week}`}</small></div></div>`,
    )
    .join(
      "",
    )}</div></section></div><div class="dashboard-aside"><section class="panel life-choice">${panelHeading("Life happens", "", `<span class="notification-dot"></span>`)}<span class="choice-illustration">${icon("spark")}</span><div class="eyebrow">${state.event ? e(state.event.tag).toUpperCase() : "A LITTLE REMINDER"}</div><h3>${state.event ? e(state.event.title) : "Make room for the unexpected."}</h3><p>${state.event ? e(state.event.text) : "Opportunities, dilemmas, and chance encounters arrive as your story unfolds. Your next life choice appears every two weeks."}</p>${state.event ? `<button class="button primary full-width" data-action="event">Make your choice ${icon("arrow")}</button>` : `<div class="quiet-note">${icon("calendar")} Your next choice in ${2 - (state.week % 2)} weeks</div>`}</section><section class="panel">${panelHeading("Your inner circle", "", `<button class="icon-button" data-view="relationships" aria-label="View relationships">${icon("arrow")}</button>`)}${state.relationships
    .slice(0, 3)
    .map((r) => personRow(r))
    .join(
      "",
    )}<div class="panel-footnote">${icon("users")} ${state.actions} free-time actions left this week</div></section><section class="panel wealth-panel">${panelHeading("Building your future", "Net worth over time", icon("chart"))}<strong class="wealth-value">${money(netWorth(state))}</strong>${sparkline(
    state.history.map((h) => h.value),
    "#62dda6",
    true,
  )}<div class="chart-labels"><span>${state.history.length > 1 ? "Week " + state.history[0].week : "Your starting point"}</span><span>Now</span></div><button class="text-button" data-view="investments">Explore investments ${icon("arrow")}</button></section><div class="wellbeing-note">${icon("heart")}<span>Health <strong>${Math.round(state.health)} / 100</strong></span><span class="live-dot"></span></div></div></div>`;
}
function personRow(r) {
  return `<div class="person-row"><span class="avatar small ${e(r.color)}">${e(r.icon)}</span><div><strong>${e(r.name)}</strong><small>${e(r.role)}</small></div><div class="bond"><span>${Math.round(r.bond)}<small>%</small></span>${meter(r.bond, r.color)}</div></div>`;
}
function companyPanel() {
  const c = state.company;
  if (!c) return "";
  return `<section class="panel company-panel">${panelHeading("Your company", "A business you can make your own.", tag(state.career === "business" ? "Operating" : "Paused", "purple"))}<div class="company-top"><span class="feature-icon purple">${icon("rocket")}</span><div><span class="eyebrow">${e(c.sector)}</span><h3>${e(c.name)}</h3></div><button class="button secondary" data-action="company">Manage company ${icon("arrow")}</button></div><div class="company-numbers"><div><span>Company valuation</span><strong>${money(c.value)}</strong></div><div><span>Employees</span><strong>${c.employees.toLocaleString("en-US")}</strong></div><div><span>Strategy</span><strong>${c.strategy === "reinvest" ? "Reinvest" : c.strategy === "dividends" ? "Take income" : "Balanced"}</strong></div></div><p class="muted">Reinvesting trades 35% of your weekly founder income for faster growth. Taking income pays 20% more and slows growth. Company value counts toward your net worth, but is not spendable cash. Growth pauses while you work another career.</p></section>`;
}
function careerView() {
  const c = CAREERS[state.career],
    p = state.progress[state.career];
  return `${title("CHOOSE YOUR DIRECTION", "There’s more than one way up.", "Build a career, change direction, or start over. Your experience stays with you.")}<section class="panel wide-panel">${panelHeading("Your active career", "", tag(`Level ${p.level + 1}`, c.color))}<div class="current-career"><span class="feature-icon ${c.color}">${icon(c.icon)}</span><div><h3>${e(c.roles[p.level])}</h3><p>${money(salary(state))} / week · ${p.weeks} weeks on this path</p></div></div><div class="career-ladder">${c.roles.map((r, i) => `<div class="ladder-step ${i <= p.level ? "reached" : ""}"><span>${i < p.level ? icon("check") : i + 1}</span><strong>${e(r)}</strong><small>${money(c.pay[i])}/week</small><small>${[0, 25, 45, 65, 85][i]} skill · ${i * 12} weeks</small></div>`).join("")}</div><p class="muted">Progress requires both skill and experience. Choose your weekly focus on the overview to develop ${e(c.skill)}.</p></section>${companyPanel()}<div class="section-title"><h2>A world of possibilities</h2><span>5 career paths · one shared life</span></div><div class="career-grid">${Object.entries(
    CAREERS,
  )
    .map(
      ([id, path]) =>
        `<section class="panel path-card ${state.career === id ? "path-active" : ""}"><span class="feature-icon ${path.color}">${icon(path.icon)}</span>${state.career === id ? tag("Your current path", path.color) : ""}<h2>${path.name}</h2><p>${path.subtitle}</p><div class="path-meta"><span>Starting income <strong>${money(path.pay[state.progress[id].level])}/wk</strong></span><span>Entry cost <strong>${state.progress[id].unlocked ? "Already unlocked" : path.entry ? money(path.entry) : "Free"}</strong></span><span>Develops <strong>${path.skill}</strong></span></div><button class="button ${state.career === id ? "secondary" : "primary"} full-width" data-action="career" data-id="${id}" ${state.career === id ? "disabled" : ""}>${state.career === id ? "Currently active" : "Explore this path"} ${icon("arrow")}</button></section>`,
    )
    .join("")}</div>`;
}
function relationshipsView() {
  return `${title("THE PEOPLE THAT MATTER", "A life is better shared.", "Friendships, family, and a connection that might become something more.", `<button class="button primary" data-action="meet">${icon("users")} Meet someone</button>`)}<div class="info-banner">${icon("calendar")}<span>You have <strong>${state.actions} free-time actions</strong> this week. Connections fade a little without attention; a social focus helps the whole circle.</span></div><div class="relationship-grid">${state.relationships.map((r) => `<section class="panel relationship-card"><span class="avatar large ${e(r.color)}">${e(r.icon)}</span><h2>${e(r.name)}</h2>${tag(r.role, r.color)}<div class="relationship-meter"><span>Connection</span><strong>${Math.round(r.bond)} / 100</strong></div>${meter(r.bond, r.color)}<p>${r.bond >= 75 ? "A strong connection, built on the time you share." : r.bond >= 40 ? "Getting closer, one conversation at a time." : "Every meaningful relationship starts somewhere."}</p><button class="button secondary full-width" data-action="connect" data-id="${e(r.id)}" ${!state.actions ? "disabled" : ""}>Spend time together <span>$25</span></button>${!["Sibling", "Best friend", "Spouse"].includes(r.role) ? `<button class="text-button date-button" data-action="date" data-id="${e(r.id)}" ${r.bond < 60 || !state.actions ? "disabled" : ""}>${icon("heart")} ${r.role === "Partner" && r.bond >= 90 ? "Propose" : r.role === "Partner" ? "Plan a date" : "Ask on a date"} · $90</button>` : ""}</section>`).join("")}</div>`;
}
function investmentsView() {
  const holdings = portfolioValue(state);
  return `${title("PLAY THE LONG GAME", "Make your future grow.", "Simulated markets move every week. Returns are uncertain; only invest what you can spare.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">AVAILABLE CASH</span><h2>${money(state.money)}</h2><p>${money(salary(state))} income − ${money(expenses(state))} costs / week</p></section><section class="panel"><span class="eyebrow">INVESTED CAPITAL</span><h2>${money(holdings)}</h2><p>${MARKETS.reduce((n, m) => n + state.holdings[m.id], 0)} units across your portfolio</p></section><section class="panel"><span class="eyebrow">TOTAL NET WORTH</span><h2>${money(netWorth(state))}</h2><p>Cash + investments + company + resale value of possessions</p></section></div><section class="panel">${panelHeading("The market", "Fictional assets · prices update when you advance a week", tag("Live in your world", "green"))}<div class="market-table"><div class="market-row market-head"><span>ASSET</span><span>PRICE</span><span>24-WEEK TREND</span><span>YOU OWN</span><span>TRADE</span></div>${MARKETS.map(
    (m) => {
      const h = state.marketHistory[m.id],
        prev = h.at(-2) || m.price,
        change = (state.market[m.id] / prev - 1) * 100;
      return `<div class="market-row"><div class="asset-name"><span class="asset-symbol ${m.color}">${m.symbol.slice(0, 2)}</span><div><strong>${m.name}</strong><small>${m.symbol} <span>· ${m.risk} risk</span></small></div></div><div><strong>${money(state.market[m.id], 2)}</strong><small class="${change >= 0 ? "positive" : "negative"}">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</small></div><div class="mini-chart">${sparkline(h, change >= 0 ? "#62dda6" : "#ee927d")}</div><div><strong>${state.holdings[m.id]} units</strong><small>${money(state.holdings[m.id] * state.market[m.id])}</small></div><button class="button secondary" data-action="trade" data-id="${m.id}">Trade ${icon("arrow")}</button></div>`;
    },
  ).join(
    "",
  )}</div></section><div class="info-banner">${icon("chart")}<span>Global funds are steadier. Individual stocks fluctuate more. Digital assets can swing sharply. This is a game economy, with no connection to real markets.</span></div>`;
}
function lifestyleView() {
  return `${title("MAKE IT YOURS", "The things along the way.", "Build a life that feels like you, from your first watch to a place to call home.", tag(`${state.inventory.length} things owned`, "blue"))}<div class="shop-grid">${SHOP.filter(
    (i) => i.category !== "Ownership",
  )
    .map(
      (i) =>
        `<section class="panel shop-card"><div class="product-scene ${i.color}">${icon(i.icon)}<span>${i.category.toUpperCase()}</span>${state.inventory.includes(i.id) ? tag("Owned", i.color) : ""}</div><div class="product-copy"><span class="eyebrow">${i.category}</span><h2>${i.name}</h2><p>${i.description}</p><div class="product-price"><strong>${money(i.price)}</strong><span>${i.upkeep ? money(i.upkeep) + "/wk upkeep" : "No upkeep"}</span></div><button class="button ${state.inventory.includes(i.id) ? "secondary" : "primary"} full-width" data-action="${state.inventory.includes(i.id) ? "sell-item" : "buy"}" data-id="${i.id}" ${!state.inventory.includes(i.id) && state.money < i.price ? "disabled" : ""}>${state.inventory.includes(i.id) ? `Sell for ${money(i.price * 0.8)}` : state.money < i.price ? "Keep building your savings" : "Make it yours"} ${icon(state.inventory.includes(i.id) ? "arrow" : "bag")}</button></div></section>`,
    )
    .join("")}</div>`;
}
function teamsView() {
  return `${title("FROM PLAYER TO OWNER", "Build a legacy beyond yourself.", "Your life can lead to the boardroom. Own a team and choose the direction it takes.")}<div class="career-grid two-columns">${SHOP.filter(
    (i) => i.category === "Ownership",
  )
    .map((i) => {
      const t = state.teams[i.id];
      return `<section class="panel team-card"><div class="team-art ${i.color}">${icon(i.icon)}<span>${i.id === "f1-team" ? "THE NEXT ERA OF RACING" : "MORE THAN A CLUB"}</span></div><h2>${i.name}</h2><p>${i.description}</p>${t ? `<div class="team-stats"><div><strong>${Math.round(t.rating)}</strong><small>Team rating</small></div><div><strong>${t.wins} / ${t.races}</strong><small>Wins / outings</small></div><div><strong>${money(t.profit)}</strong><small>Last weekly profit</small></div></div><label class="field-label">Management strategy<select data-team-strategy><option value="balanced" ${state.teamStrategy === "balanced" ? "selected" : ""}>Balanced — results and stability</option><option value="development" ${state.teamStrategy === "development" ? "selected" : ""}>Development — faster team improvement</option><option value="commercial" ${state.teamStrategy === "commercial" ? "selected" : ""}>Commercial — higher sponsorship revenue</option></select></label><button class="text-button" data-action="sell-item" data-id="${i.id}">Sell team for ${money(i.price * 0.8)}</button>` : `<div class="path-meta"><span>Acquisition <strong>${money(i.price)}</strong></span><span>Weekly running cost <strong>${money(i.upkeep)}</strong></span></div><button class="button primary full-width" data-action="buy" data-id="${i.id}" ${state.money < i.price ? "disabled" : ""}>${state.money < i.price ? "Build your fortune to unlock" : "Buy this team"} ${icon("arrow")}</button>`}</section>`;
    })
    .join(
      "",
    )}</div><div class="info-banner">${icon("trophy")}<span>Ownership starts a simplified weekly management simulation. Development improves your team faster; commercial strategy increases revenue. Detailed squads, transfers, car development, and race tactics are future expansions.</span></div>`;
}
const pages = {
  overview,
  career: careerView,
  relationships: relationshipsView,
  investments: investmentsView,
  lifestyle: lifestyleView,
  teams: teamsView,
};
function render() {
  app.innerHTML = `${sidebar()}<div class="workspace">${header()}<main id="main">${storageWarning ? `<div class="info-banner warning">${e(storageWarning)}</div>` : ""}${state.ended ? `<div class="info-banner">${icon("spark")}<span>Your life story is complete at age ${age(state)}, with a net worth of ${money(netWorth(state))}.</span><button class="button primary" data-action="new-game">Start a new life</button></div>` : ""}${pages[view]()}<footer><span>One life. Make it yours.</span><span>${storageWarning ? "Export to keep your progress" : "Progress saved on this device"} <span class="live-dot"></span></span></footer></main></div>`;
}
function characterDialog() {
  dialog(
    `<div class="eyebrow">YOUR CHARACTER</div><h2>${e(state.name)}</h2><p>${age(state)} years old · ${e(state.city)} · ${e(state.trait)}</p><div class="character-stats">${Object.entries(
      state.skills,
    )
      .map(
        ([k, v]) =>
          `<div><span>${e(k)}</span><strong>${Math.round(v)}</strong>${meter(v, "blue")}</div>`,
      )
      .join(
        "",
      )}</div><div class="info-banner">${icon("heart")} Health: ${Math.round(state.health)} / 100</div><p class="muted">Traits give a starting skill bonus. Social characters strengthen bonds faster; Athletic characters gain more from training.</p><button class="button primary full-width" data-action="new-game">Create a new character ${icon("arrow")}</button>`,
  );
}
function newGameDialog() {
  dialog(
    `<div class="eyebrow">A NEW CHAPTER</div><h2>Who will you become?</h2><p>Start with $12,500, a little ambition, and a whole life ahead.</p><form id="character-form"><label class="field-label">Your name<input name="name" maxlength="32" value="Alex Morgan" required autocomplete="off"></label><div class="form-row"><label class="field-label">Starting age<input name="age" type="number" min="18" max="60" step="1" value="18" required></label><label class="field-label">Home city<select name="city"><option>London</option><option>Copenhagen</option><option>New York</option><option>Monaco</option></select></label></div><label class="field-label">Your personality<select name="trait"><option>Ambitious</option><option>Social</option><option>Analytical</option><option>Athletic</option></select></label><label class="field-label">Your first path<select name="career">${Object.entries(
      CAREERS,
    )
      .map(
        ([id, c]) =>
          `<option value="${id}">${c.name}${c.entry ? ` — ${money(c.entry)} entry` : ""}</option>`,
      )
      .join(
        "",
      )}</select></label><p class="muted">All cities share the prototype economy. Starting a new life replaces your current save. Export it first if you want to keep it.</p><button class="button primary full-width" type="submit">Begin my story ${icon("arrow")}</button></form>`,
  );
}
function eventDialog() {
  if (!state.event) return;
  const ev = state.event;
  dialog(
    `<div class="eyebrow">${e(ev.tag)}</div><h2>${e(ev.title)}</h2><p>${e(ev.text)}</p><div class="event-options">${ev.options.map((o, i) => `<button class="event-option" data-action="resolve-event" data-id="${i}" ${o.cost && state.money < o.cost ? "disabled" : ""}><strong>${e(o.label)} ${icon("arrow")}</strong><span>${e(o.detail)}</span></button>`).join("")}</div>`,
  );
}
function settingsDialog() {
  dialog(
    `<div class="eyebrow">YOUR WORLD, SAFE AND SOUND</div><h2>Save & settings</h2><p>Your progress saves automatically in this browser. Export a backup to keep it across devices.</p><div class="settings-actions"><button class="button primary full-width" data-action="export">${icon("download")} Export save</button><label class="button secondary full-width import-label">Import save<input id="import-save" type="file" accept=".json,application/json" hidden></label><button class="button secondary full-width" data-action="new-game">Create a new life</button></div><p class="muted">Lifesim v0.1 · Single-player prototype. Money is displayed in USD. Saves stay on your device; no account or server is required.</p>`,
  );
  if (recoverySave) {
    const recoveryButton = document.createElement("button");
    recoveryButton.className = "button secondary full-width";
    recoveryButton.textContent = "Export recovery copy";
    recoveryButton.onclick = () => {
      const url = URL.createObjectURL(
        new Blob([recoverySave], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "lifesim-recovery.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    modal.querySelector(".settings-actions").append(recoveryButton);
  }
}
function tradeDialog(id) {
  const m = MARKETS.find((m) => m.id === id);
  if (!m) return;
  dialog(
    `<div class="eyebrow">${m.symbol} · ${m.risk.toUpperCase()} RISK</div><h2>${m.name}</h2><p>${money(state.market[id], 2)} per unit · You own ${state.holdings[id]} units.</p><form id="trade-form" data-id="${id}"><label class="field-label">Buy or sell<select name="direction"><option value="buy">Buy units</option><option value="sell">Sell units</option></select></label><label class="field-label">Number of units<input type="number" name="quantity" min="1" max="100000000" step="1" value="1" required></label><div class="trade-total">Total <strong id="trade-total">${money(state.market[id], 2)}</strong></div><p class="muted">Available cash: ${money(state.money, 2)}. No transaction fees in this prototype.</p><button class="button primary full-width" type="submit">Confirm trade ${icon("arrow")}</button></form>`,
  );
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action],[data-view]");
  if (!button || button.disabled) return;
  if (button.dataset.view) {
    view = button.dataset.view;
    render();
    window.scrollTo({ top: 0 });
    return;
  }
  const id = button.dataset.id;
  switch (button.dataset.action) {
    case "close-modal":
      modal.close();
      break;
    case "character":
      characterDialog();
      break;
    case "new-game":
      newGameDialog();
      break;
    case "settings":
      settingsDialog();
      break;
    case "focus":
      update((s) => setActivity(s, id), "Weekly focus updated");
      break;
    case "next-week":
      if (state.event) eventDialog();
      else if (update(advanceWeek, "A new week begins")) {
        if (state.event) eventDialog();
      }
      break;
    case "event":
      eventDialog();
      break;
    case "resolve-event":
      if (
        update(
          (s) => resolveEvent(s, Number(id)),
          "Choice made. Your story continues.",
        )
      )
        modal.close();
      break;
    case "career": {
      const c = CAREERS[id];
      if (!c) break;
      dialog(
        `<span class="feature-icon ${c.color}">${icon(c.icon)}</span><h2>Your next chapter: ${c.name}</h2><p>${c.subtitle}</p><div class="path-meta"><span>Entry cost<strong>${money(state.progress[id].unlocked ? 0 : c.entry)}</strong></span><span>Your current level<strong>${state.progress[id].level + 1}</strong></span></div><p class="muted">Your old career progress stays with you. Your new weekly income begins when you advance a week.</p><button class="button primary full-width" data-action="join-career" data-id="${id}">Start this chapter ${icon("arrow")}</button>`,
      );
      break;
    }
    case "join-career":
      if (update((s) => chooseCareer(s, id), "A new career chapter begins"))
        modal.close();
      break;
    case "company": {
      const c = state.company;
      if (!c) break;
      dialog(
        `<div class="eyebrow">BUILD SOMETHING OF YOUR OWN</div><h2>Your company, your direction.</h2><form id="company-form"><label class="field-label">Company name<input name="name" maxlength="40" value="${e(c.name)}" required></label><label class="field-label">Industry<select name="sector">${["Technology", "Consumer goods", "Clean energy"].map((v) => `<option ${c.sector === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label class="field-label">Company strategy<select name="strategy"><option value="balanced" ${c.strategy === "balanced" ? "selected" : ""}>Balanced — steady growth and income</option><option value="reinvest" ${c.strategy === "reinvest" ? "selected" : ""}>Reinvest — faster growth, 35% less income</option><option value="dividends" ${c.strategy === "dividends" ? "selected" : ""}>Take income — 20% more pay, slower growth</option></select></label><p class="muted">Technology has the biggest weekly swings; consumer goods are steadier. All sectors can grow or lose value. Hiring scales automatically with company valuation.</p><button class="button primary full-width" type="submit">Set my direction ${icon("arrow")}</button></form>`,
      );
      break;
    }
    case "trade":
      tradeDialog(id);
      break;
    case "buy":
      update((s) => buy(s, id), "A little more your own. Purchase complete.");
      break;
    case "sell-item": {
      const item = SHOP.find((i) => i.id === id);
      if (!item) break;
      dialog(
        `<div class="eyebrow">SELL A POSSESSION</div><h2>Let go of ${item.name.toLowerCase()}?</h2><p>You’ll receive ${money(item.price * 0.8)}. You can buy it again later at its full price.</p><button class="button primary full-width" data-action="confirm-sale" data-id="${id}">Confirm sale ${icon("arrow")}</button>`,
      );
      break;
    }
    case "confirm-sale":
      if (update((s) => sellItem(s, id), "Sale complete")) modal.close();
      break;
    case "connect":
      update((s) => connect(s, id), "Time well spent. Your connection grew.");
      break;
    case "date":
      update((s) => connect(s, id, true), "A moment to remember.");
      break;
    case "meet":
      update(meet, "You met someone new.");
      break;
    case "export": {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = "lifesim-save.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Your save has been exported");
      break;
    }
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "character-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    state = createGame(Object.fromEntries(data));
    view = "overview";
    save();
    render();
    modal.close();
    notify("Your story begins. Make it yours.");
  }
  if (event.target.id === "company-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) => configureCompany(s, Object.fromEntries(data)),
        "Company direction updated",
      )
    )
      modal.close();
  }
  if (event.target.id === "trade-form") {
    event.preventDefault();
    const data = new FormData(event.target),
      quantity =
        Number(data.get("quantity")) *
        (data.get("direction") === "sell" ? -1 : 1);
    if (
      update(
        (s) => invest(s, event.target.dataset.id, quantity),
        "Trade complete",
      )
    )
      modal.close();
  }
});
document.addEventListener("input", (event) => {
  if (event.target.closest("#trade-form")) {
    const form = event.target.closest("form"),
      q = Number(form.elements.quantity.value);
    document.querySelector("#trade-total").textContent = money(
      q * state.market[form.dataset.id],
      2,
    );
  }
});
document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-team-strategy]"))
    update(
      (s) => setTeamStrategy(s, event.target.value),
      "Team strategy updated",
    );
  if (event.target.id === "import-save") {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw new Error("Save file is too large.");
      const imported = restoreGame(await file.text());
      dialog(
        `<div class="eyebrow">IMPORT SAVE</div><h2>Continue ${e(imported.name)}’s story?</h2><p>Age ${age(imported)}, week ${imported.week}, net worth ${money(netWorth(imported))}. This replaces your current progress.</p><button class="button primary full-width" id="confirm-import">Replace current save</button>`,
      );
      document.querySelector("#confirm-import").onclick = () => {
        state = imported;
        view = "overview";
        save();
        render();
        modal.close();
        notify("Your saved life has been restored");
      };
    } catch (error) {
      notify(error.message);
    }
  }
});
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      modal.close();
  }
});
window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (Object.hasOwn(pages, next)) {
    view = next;
    render();
  }
});
if (Object.hasOwn(pages, location.hash.slice(1))) view = location.hash.slice(1);
save();
render();
