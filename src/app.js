import {
  retailScreen,
  relocationDialog,
  crimeScreen,
  studioScreen,
  trackDialog,
  companyScreen,
  companyLaunchDialog,
  notificationDialog,
  notificationCount,
} from "./expansion-screens.js";
import {
  COUNTRIES,
  CITY_CATALOGUE,
  placeCountry,
  country,
} from "./geography.js";
import { CLOTHING, INDUSTRIES, CRIMES } from "./expansion-data.js";
import {
  applyImmigration,
  moveCountry,
  studyLanguage,
  buyClothing,
  wearClothing,
  visitBarber,
  commitCrime,
  prisonActivity,
  setArtistName,
  startTrack,
  workTrack,
  releaseTrack,
  releaseReadyRecording,
  fundFounder,
  businessDevelopment,
  setBusinessModel,
  acceptKartOffer,
} from "./engine.js";
import { gameDate, displayDates } from "./dates.js";
import {
  inboxScreen,
  familyConflictScreen,
  recordingPlanDialog,
  contentPlanDialog,
} from "./pressure-screens.js";
import {
  refreshInbox,
  markInboxMessage,
  choosePerformancePlan,
  startPlannedRecording,
  producePlannedContent,
  respondFamilyRequest,
  respondPublicMessage,
  deliverCommunityPromise,
  setOwnerPlan,
  appointOwnerStaff,
  dismissOwnerStaff,
  upgradeOwnerFacility,
} from "./engine.js";
import {
  identityScreen,
  characterCreatorForm,
  profileFields,
  characterPortrait,
} from "./identity-screens.js";
import {
  creatorAvailable,
  setProPreview,
  editCharacterProfile,
  setCareerRoutine,
  requestPathSupport,
  personalDevelopment,
  choosePersonalGoal,
  bookLocalOpportunity,
  createCustomCharacter,
  createRandomCharacter,
} from "./engine.js";
import {
  reviewContract,
  contractProposal,
  allSportExitCosts,
  sportExitCost,
  musicBuyoutCost,
  buyOutMusicAgreement,
  acceptEndorsement,
  bookEndorsementAppearance,
  cancelEndorsement,
} from "./contracts.js";
import { CAREER_CHALLENGES, bookCareerChallenge } from "./career-milestones.js";
import { contactAction, bookContactTraining } from "./living-world.js";
import { contractTermsFragment, livingWorldScreen } from "./depth-screens.js";
import {
  requestSportMove,
  signSportMove,
  hireSportStaff,
  dismissSportStaff,
  sportCareerAction,
  bookSportInvitation,
  negotiateCollaboration,
  acceptMusicOpportunity,
  assembleAlbum,
  rehearseLive,
  startMusicTour,
  cancelMusicTour,
} from "./career-world.js";
import { careerMoveDialog } from "./career-world-screens.js";
import { programmeTuition } from "./world.js";
import {
  schoolAction,
  applyScholarship,
  familySupport,
  requestFamilyFunding,
  bodyAction,
  chooseSchoolRoute,
} from "./life-course.js";
import { ageingScreen, originFamilyScreen } from "./life-course-screens.js";
import {
  hireMusicManager,
  dismissMusicManager,
  careerActivity,
  bookMusicInterview,
} from "./career-support.js";
import { buyCareerEquipment } from "./career-equipment.js";
import { childhoodScreen } from "./childhood-screens.js";
import {
  bankingScreen,
  storyScreen,
  fixtureCalendar,
} from "./finance-season-screens.js";
import {
  calendarScreen,
  connectionsScreen,
  familyDepthScreen,
} from "./calendar-screens.js";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./style.css";
import {
  loanQuote,
  takeLoan,
  transferSavings,
  repayLoan,
  negotiateSportOffer,
  hireAgent,
  dismissAgent,
  acceptSportSponsor,
  deliverSportAppearance,
  deliverStoryCommission,
  ageUp,
  childhoodActivity,
  chooseChildInterest,
  childhoodStage,
  VERSION,
  TIME_BLOCKS,
  DATE_PLANS,
  CHILD_CLUBS,
  setCalendar,
  attendInterview,
  setWorkArrangement,
  workplaceAction,
  requestPromotion,
  acceptPromotion,
  setPension,
  withdrawPension,
  openDatingApp,
  messageMatch,
  inviteDate,
  askExclusive,
  moveInTogether,
  cancelAppointment,
  bookFamilyDay,
  setChildPlan,
  respondFamilyIssue,
  toggleDebug,
  debugEdit,
  debugAdvance,
  RENTALS,
  HOMES,
  HOBBIES,
  propertyListings,
  mortgagePayment,
  rentHome,
  purchaseHome,
  manageProperty,
  setRoutine,
  practiseHobby,
  startHobbyProject,
  deliverFreelance,
  volunteer,
  familyAction,
  adoptPet,
  careForPet,
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
  setActivity,
  advanceWeek,
  resolveEvent,
  invest,
  buy,
  sellItem,
  connect,
  meet,
  configureCompany,
  positionName,
  PROGRAMS,
  BUSINESSES,
  COLLECTIBLES,
  jobDefinition,
  qualificationName,
  availableCash,
  reservedCash,
  assetValue,
  stakePercent,
  meetingFee,
  applyForJob,
  acceptJobOffer,
  requestRaise,
  resignJob,
  enrolEducation,
  withdrawEducation,
  foundCompany,
  requestBoardMeeting,
  submitAcquisitionOffer,
  completeAcquisition,
  cancelOffer,
  acquireOpportunity,
  setBusinessStrategy,
  injectCapital,
  buyCollectible,
  consignCollectible,
  joinFootball,
  configureFootball,
  leaveFootball,
  acceptFootballOffer,
  declineFootballOffer,
  joinSport,
  setSportTraining,
  leaveSport,
  acceptSportOffer,
  declineSportOffer,
  SPORTS,
  openSocialAccount,
  configureSocial,
  createPost,
  acceptSponsor,
  PLATFORMS,
  totalFollowers,
  fameLabel,
  configureMusic,
  practiseMusic,
  startMusicProject,
  bookMusicGig,
  acceptLabelOffer,
  MUSIC_ROLES,
  takeExperience,
  EXPERIENCES,
} from "./engine.js";
import { workScreen, ownershipScreen, collectiblesScreen } from "./screens.js";
import {
  sportsScreen,
  socialScreen,
  musicScreen,
  shoppingScreen,
} from "./life-screens.js";
import {
  housingScreen,
  familyScreen,
  hobbiesScreen,
  debugScreen,
} from "./everyday-screens.js";
let shopFilters = {
  category: "All",
  query: "",
  sort: "catalogue",
  owned: false,
};

const icons = {
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  camera:
    '<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6l2-3h4l2 3"/><circle cx="12" cy="13" r="4"/>',
  video:
    '<rect x="3" y="5" width="15" height="14" rx="2"/><path d="m9 9 5 3-5 3V9ZM18 10l3-2v8l-3-2"/>',
  music:
    '<path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',
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
const compactMoney = (value) =>
  Math.abs(value) >= 1e6
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value)
    : money(value);
const percent = (value) =>
  value === 0 ? "0%" : `${value.toFixed(value < 0.01 ? 6 : 3)}%`;
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
  retailStore = null,
  focusedSport = null,
  focusedOwnership = null,
  inboxArchived = false,
  storageWarning = "",
  recoverySave = "",
  migrationSave = "",
  debugBackup = "",
  migrationVersion = 13,
  toastTimer;
try {
  recoverySave = localStorage.getItem(`${STORAGE}-recovery`) || "";
  debugBackup = localStorage.getItem(`${STORAGE}-before-debug`) || "";
  migrationSave =
    localStorage.getItem(`${STORAGE}-before-v13`) ||
    localStorage.getItem(`${STORAGE}-before-v12`) ||
    localStorage.getItem(`${STORAGE}-before-v11`) ||
    localStorage.getItem(`${STORAGE}-before-v10`) ||
    localStorage.getItem(`${STORAGE}-before-v9`) ||
    localStorage.getItem(`${STORAGE}-before-v8`) ||
    localStorage.getItem(`${STORAGE}-before-v7`) ||
    localStorage.getItem(`${STORAGE}-before-v6`) ||
    localStorage.getItem(`${STORAGE}-before-v5`) ||
    localStorage.getItem(`${STORAGE}-before-v4`) ||
    localStorage.getItem(`${STORAGE}-before-v3`) ||
    localStorage.getItem(`${STORAGE}-before-v2`) ||
    "";
  migrationVersion = localStorage.getItem(`${STORAGE}-before-v13`)
    ? 13
    : localStorage.getItem(`${STORAGE}-before-v12`)
      ? 12
      : localStorage.getItem(`${STORAGE}-before-v11`)
        ? 11
        : localStorage.getItem(`${STORAGE}-before-v10`)
          ? 10
          : localStorage.getItem(`${STORAGE}-before-v9`)
            ? 9
            : localStorage.getItem(`${STORAGE}-before-v8`)
              ? 8
              : localStorage.getItem(`${STORAGE}-before-v7`)
                ? 7
                : localStorage.getItem(`${STORAGE}-before-v6`)
                  ? 6
                  : localStorage.getItem(`${STORAGE}-before-v5`)
                    ? 5
                    : localStorage.getItem(`${STORAGE}-before-v4`)
                      ? 4
                      : 3;
  const saved = localStorage.getItem(STORAGE);
  try {
    state = saved ? restoreGame(saved) : createRandomCharacter();
    if (
      saved &&
      JSON.parse(saved).version < VERSION &&
      !localStorage.getItem(`${STORAGE}-before-v13`)
    ) {
      migrationSave = saved;
      migrationVersion = 13;
      localStorage.setItem(`${STORAGE}-before-v13`, saved);
    }
  } catch {
    recoverySave = saved;
    localStorage.setItem(`${STORAGE}-recovery`, saved);
    state = createRandomCharacter();
    storageWarning =
      "Your previous save could not be loaded. A recovery copy is available in Save & settings.";
  }
} catch {
  state = createRandomCharacter();
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
    const next = fn(state);
    refreshInbox(next);
    state = next;
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
  modal.innerHTML = displayDates(
    `<button class="modal-close icon-button" data-action="close-modal" aria-label="Close dialog">${icon("close")}</button>${content}`,
  );
  const heading = modal.querySelector("h2");
  if (heading) {
    heading.id = "dialog-heading";
    modal.setAttribute("aria-labelledby", heading.id);
  }
  modal.classList.toggle(
    "creator-modal",
    Boolean(modal.querySelector("#character-form")),
  );
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
  ["inbox", "mail", "Messages & decisions"],
  ["childhood", "heart", "Childhood & school"],
  ["identity", "spark", "Character & hometown"],
  ["ageing", "heart", "Health & ageing"],
  ["calendar", "calendar", "Weekly calendar"],
  ["career", "briefcase", "Work & education"],
  ["company", "rocket", "Start & run a company"],
  ["crime", "flag", "Crime & consequences"],
  ["sports", "football", "Sport & development"],
  ["music", "music", "Music & creativity"],
  ["social", "video", "Social media & fame"],
  ["relationships", "users", "Relationships"],
  ["family", "heart", "Family & pets"],
  ["housing", "home", "Homes & property"],
  ["hobbies", "spark", "Hobbies & journal"],
  ["investments", "chart", "Investments"],
  ["banking", "coin", "Banking & tax"],
  ["lifestyle", "bag", "Lifestyle & shopping"],
  ["teams", "trophy", "Businesses & clubs"],
];
function sidebar() {
  return `<aside class="sidebar"><a class="brand" href="#overview" aria-label="Lifesim overview"><span class="brand-mark">l<span>.</span></span><span>lifesim<span class="brand-dot">.</span></span></a><div class="save-label"><span class="live-dot"></span> YOUR LIFE, IN PLAY</div><div class="nav-label">YOUR WORLD</div><nav aria-label="Main navigation">${nav.map(([id, glyph, label]) => `<button class="nav-item ${view === id ? "active" : ""}" data-view="${id}" aria-label="${e(label)}" ${view === id ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${id === "inbox" ? `<span class="inbox-count">${state.nextChapter.messages.filter((m) => !m.read && !m.archived && m.status === "open").length}</span>` : ""}${id === "overview" ? '<span class="nav-active-dot"></span>' : ""}</button>`).join("")}</nav><div class="sidebar-bottom"><div class="chapter-box">${icon("spark")}<strong>One life. Endless possibilities.</strong><p>There’s no right way to live.<br>Find yours.</p></div><button class="nav-item" data-action="settings" aria-label="Save & settings">${icon("settings")}<span>Save & settings</span></button><button class="profile" data-action="character" aria-label="View your character"><span class="avatar">${e(initials(state.name))}</span><span><strong>${e(state.name)}</strong><small>${age(state)} years · ${e(state.city)}</small></span>${icon("chevronDown")}</button></div></aside>`;
}
function header() {
  const date = new Date(Date.UTC(2026, 0, 5 + state.week * 7));
  return `<header class="topbar"><div class="breadcrumb">Your world ${icon("chevron")} <strong>${view === "debug" ? "Debug sandbox" : nav.find((n) => n[0] === view)?.[2]}</strong></div><div class="time-controls"><button class="icon-button notification-bell" data-action="notification-bell" aria-label="Notifications">${icon("bell")}<span>${notificationCount(state)}</span></button><span class="game-date">${icon("calendar")}<span>${date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}<small>AGE ${age(state)} · Space advances time</small></span></span><button class="button secondary age-up" data-action="age-up" ${state.ended ? "disabled" : ""}>Age up</button><button class="button primary next-week" data-action="next-week" ${state.ended ? "disabled" : ""}>${state.event ? "Make a choice" : "Next week"} ${icon("arrow")}</button></div></header>`;
}
function stats() {
  const cards = [
    [
      "coin",
      "Available cash",
      compactMoney(availableCash(state)),
      `${salary(state) - expenses(state) >= 0 ? "+" : ""}${money(salary(state) - expenses(state))} / week before investment income`,
      "green",
    ],
    [
      "chart",
      "Net worth",
      compactMoney(netWorth(state)),
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
  if (age(state) < 12) return childhoodScreen(state, ui());
  const choiceInterval =
    state.childhood.startedAtBirth && age(state) < 18 ? 13 : 2;
  return `${title("THE BIG PICTURE", `A life of your own<span class="heading-dot">.</span>`, `Welcome back, ${e(state.name.split(" ")[0])}. Every small choice is part of a bigger story.`, `<button class="button secondary" data-action="character">${icon("users")} Your character</button>`)}${stats()}<div class="dashboard-grid"><div class="dashboard-main"><section class="chapter-hero"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> CHAPTER ${Math.floor(state.week / 52) + 1} · ${age(state) < 25 ? "FINDING YOUR FEET" : age(state) < 40 ? "MAKING YOUR MARK" : age(state) < 60 ? "BUILDING YOUR LEGACY" : "LIFE ON YOUR TERMS"}</div><h2>Your next chapter<br>is unwritten.</h2><p>A career to build. People to meet.<br>A whole world of possibilities.</p><button class="button hero-button" data-view="career">Explore work & education ${icon("arrow")}</button></div>${scene()}</section>${workingOverview()}${lifeOverview()}<section class="panel">${panelHeading("This week’s focus", "You decide what deserves your time.", tag("Weekly plan", "blue"))}<div class="focus-grid">${Object.entries(
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
    )}</div></section></div><div class="dashboard-aside"><section class="panel life-choice">${panelHeading("Life happens", "", `<span class="notification-dot"></span>`)}<span class="choice-illustration">${icon("spark")}</span><div class="eyebrow">${state.event ? e(state.event.tag).toUpperCase() : "A LITTLE REMINDER"}</div><h3>${state.event ? e(state.event.title) : "Make room for the unexpected."}</h3><p>${state.event ? e(state.event.text) : `Opportunities, dilemmas, and chance encounters arrive as your story unfolds. Your next life choice appears every ${choiceInterval} weeks.`}</p>${state.event ? `<button class="button primary full-width" data-action="event">Make your choice ${icon("arrow")}</button>` : `<div class="quiet-note">${icon("calendar")} Your next choice in ${choiceInterval - (state.week % choiceInterval)} weeks</div>`}</section><section class="panel">${panelHeading("Your inner circle", "", `<button class="icon-button" data-view="relationships" aria-label="View relationships">${icon("arrow")}</button>`)}${state.relationships
    .slice(0, 3)
    .map((r) => personRow(r))
    .join(
      "",
    )}<div class="panel-footnote">${icon("users")} ${state.actions} free-time actions left this week</div></section><section class="panel wealth-panel">${panelHeading("Building your future", "Net worth over time", icon("chart"))}<strong class="wealth-value">${compactMoney(netWorth(state))}</strong>${sparkline(
    state.history.map((h) => h.value),
    "#62dda6",
    true,
  )}<div class="chart-labels"><span>${state.history.length > 1 ? "Week " + state.history[0].week : "Your starting point"}</span><span>Now</span></div><button class="text-button" data-view="investments">Explore investments ${icon("arrow")}</button></section><div class="wellbeing-note">${icon("heart")}<span>Health <strong>${Math.round(state.health)} / 100</strong></span><span class="live-dot"></span></div></div></div>`;
}
function personRow(r) {
  return `<div class="person-row"><span class="avatar small ${e(r.color)}">${e(r.icon)}</span><div><strong>${e(r.name)}</strong><small>${e(r.role)}</small></div><div class="bond"><span>${Math.round(r.bond)}<small>%</small></span>${meter(r.bond, r.color)}</div></div>`;
}
function ui() {
  return {
    title,
    panelHeading,
    tag,
    icon,
    meter,
    money,
    e,
    percent,
    hasDebugBackup: Boolean(debugBackup),
    programmes: PROGRAMS,
    selectedOwnership: focusedOwnership,
  };
}
function workingOverview() {
  const p = state.employment,
    c = CAREERS[state.career];
  const offers = state.applications.filter((a) => a.status === "offer").length;
  return `<section class="panel career-panel">${panelHeading("Your working life", "Qualifications, opportunities, and the work you put in.", `<button class="text-button" data-view="career">Find work ${icon("arrow")}</button>`)}<div class="current-career"><span class="feature-icon ${c.color}">${icon(c.icon)}</span><div><span class="eyebrow">${p ? e(jobDefinition(p.jobId).employer) : state.company ? "SELF-EMPLOYED" : "OPEN TO OPPORTUNITIES"}</span><h3>${e(positionName(state))}</h3><p>${money(salary(state))} / week${p ? ` · ${p.tenure} weeks in this role` : ""}</p></div></div><div class="career-progress"><div><span>${p ? "Sustained job performance" : state.education.active ? "Your current studies" : "Applications do not change your job until you accept an offer"}</span>${p ? `<strong>${p.performance} / 100</strong>` : ""}</div>${p ? meter(p.performance, c.color) : ""}<small>${offers ? `${offers} job offer(s) waiting on the work screen.` : state.education.active ? e(qualificationName(state.education.active.programId)) : "Study, train, or build relevant experience to meet vacancy requirements."}</small></div>${state.vacancies.some((v) => v.exceptional) ? `<div class="opportunity-note">${icon("spark")} A contact has opened an unusual job opportunity. Check the job board before it closes.</div>` : ""}</section>`;
}
function careerView() {
  return workScreen(state, ui());
}
function relationshipsView() {
  return connectionsScreen(state, ui()) + livingWorldScreen(state, ui());
}
function investmentsView() {
  const holdings = portfolioValue(state);
  return `${title("PLAY THE LONG GAME", "Make your future grow.", "Simulated markets move every week. Returns are uncertain; only invest what you can spare.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">AVAILABLE CASH</span><h2>${money(availableCash(state))}</h2><p>${money(salary(state))} income − ${money(expenses(state))} costs / week</p></section><section class="panel"><span class="eyebrow">INVESTED CAPITAL</span><h2>${money(holdings)}</h2><p>${MARKETS.reduce((n, m) => n + state.holdings[m.id], 0)} units across your portfolio</p></section><section class="panel"><span class="eyebrow">TOTAL NET WORTH</span><h2>${money(netWorth(state))}</h2><p>Cash, shares, business equity, possessions & collectibles</p></section></div><section class="panel">${panelHeading("The market", "Fictional assets · prices update when you advance a week", tag("Live in your world", "green"))}<div class="market-table"><div class="market-row market-head"><span>ASSET</span><span>PRICE</span><span>24-WEEK TREND</span><span>YOU OWN</span><span>TRADE</span></div>${MARKETS.map(
    (m) => {
      const h = state.marketHistory[m.id],
        prev = h.at(-2) || m.price,
        change = (state.market[m.id] / prev - 1) * 100;
      return `<div class="market-row"><div class="asset-name"><span class="asset-symbol ${m.color}">${m.symbol.slice(0, 2)}</span><div><strong>${m.name}</strong><small>${m.symbol} <span>· ${m.type} · ${m.risk} risk</span></small></div></div><div><strong>${money(state.market[m.id], 2)}</strong><small class="${change >= 0 ? "positive" : "negative"}">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</small></div><div class="mini-chart">${sparkline(h, change >= 0 ? "#62dda6" : "#ee927d")}</div><div><strong>${state.holdings[m.id].toLocaleString("en-US", { maximumFractionDigits: 6 })} ${m.type === "Listed company" ? "shares" : "units"}</strong><small>${money(state.holdings[m.id] * state.market[m.id])}${BUSINESSES.some((b) => b.stock === m.id) ? ` · ${percent(stakePercent(state, BUSINESSES.find((b) => b.stock === m.id).id))} owned` : ""}</small></div><button class="button secondary" data-action="trade" data-id="${m.id}">Trade ${icon("arrow")}</button></div>`;
    },
  ).join(
    "",
  )}</div></section><div class="info-banner">${icon("chart")}<span>Global funds are steadier. Individual stocks fluctuate more. Digital assets can swing sharply. Company share prices respond to trading profits as well as market conditions. Funds and profitable issuers can distribute quarterly income; crypto has no dividend. Large trades are limited by weekly liquidity.</span></div>${collectiblesScreen(state, ui())}`;
}
function lifestyleView() {
  const head = retailScreen(state, ui(), retailStore);
  if (
    !retailStore ||
    ["Budget wardrobe", "High street", "Designer atelier", "Barbers"].includes(
      retailStore,
    )
  )
    return head;
  if (retailStore === "Experiences") {
    const page = shoppingScreen(state, ui(), { category: "All" });
    return (
      head +
      page.slice(page.indexOf('<section class="panel experiences-panel">'))
    );
  }
  const categories =
    retailStore === "Car dealers"
      ? ["Garage"]
      : retailStore === "Electronics"
        ? ["Essentials", "Creator gear", "Workspace"]
        : ["Property", "Hobbies", "Wellbeing", "Style"];
  const selected = categories.includes(shopFilters.category)
    ? shopFilters.category
    : categories[0];
  return (
    head +
    shoppingScreen(state, ui(), {
      ...shopFilters,
      category: shopFilters.category === "All" ? "All" : selected,
    })
  );
}
function lifeOverview() {
  const pending =
    state.football.offers.filter((o) => o.status === "offered").length +
    Object.values(state.sports).reduce(
      (n, p) => n + p.offers.filter((o) => o.status === "offered").length,
      0,
    );
  return `<section class="panel life-overview">${panelHeading("Life beyond your job", "Your hobbies, your craft, and your public life.")}<div class="life-metrics"><div><span>Public recognition</span><strong>${e(fameLabel(state))}</strong><small>${state.fame.recognition.toFixed(1)} / 100</small></div><div><span>Social audience</span><strong>${totalFollowers(state).toLocaleString()}</strong><small>Followers across accounts</small></div><div><span>Invitations</span><strong>${pending} sporting offers</strong><small>${state.music.releases.length} music releases</small></div></div><div class="inline-actions"><button class="button secondary" data-view="sports">Develop a sport</button><button class="button secondary" data-view="music">Your music studio</button><button class="button secondary" data-view="social">Create & connect</button></div></section>`;
}
function teamsView() {
  return ownershipScreen(state, ui());
}
const pages = {
  overview,
  inbox: () => inboxScreen(state, ui(), { archived: inboxArchived }),
  career: careerView,
  childhood: () => childhoodScreen(state, ui()),
  calendar: () =>
    calendarScreen(state, ui()) +
    fixtureCalendar(state, ui()) +
    storyScreen(state, ui()) +
    familyConflictScreen(state, ui()),
  relationships: relationshipsView,
  investments: investmentsView,
  banking: () => bankingScreen(state, ui()),
  lifestyle: lifestyleView,
  identity: () => identityScreen(state, ui()),
  sports: () => sportsScreen(state, ui(), focusedSport),
  music: () => studioScreen(state, ui()) + musicScreen(state, ui()),
  company: () => companyScreen(state, ui()),
  crime: () => crimeScreen(state, ui()),
  social: () => socialScreen(state, ui()),
  teams: teamsView,
  family: () =>
    familyScreen(state, ui()) +
    familyDepthScreen(state, ui()) +
    originFamilyScreen(state, ui()) +
    familyConflictScreen(state, ui()),
  ageing: () => ageingScreen(state, ui()),
  housing: () => housingScreen(state, ui()),
  hobbies: () => hobbiesScreen(state, ui()) + storyScreen(state, ui()),
  debug: () => debugScreen(state, ui()),
};
for (const id of [
  "career",
  "company",
  "investments",
  "banking",
  "teams",
  "housing",
  "hobbies",
  "social",
  "family",
  "relationships",
  "music",
  "sports",
]) {
  const original = pages[id];
  pages[id] = () =>
    age(state) < (id === "sports" ? 5 : id === "music" ? 6 : 12)
      ? `<div class="info-banner">${icon("heart")}<span>${age(state) < 5 ? "Your family cares for you while you learn through supervised play." : "Your school years and childhood activities come first. More independence opens as you grow."}</span></div>` +
        childhoodScreen(state, ui())
      : original();
}
function render() {
  app.innerHTML = displayDates(
    `${sidebar()}<div class="workspace">${header()}<main id="main">${storageWarning ? `<div class="info-banner warning">${e(storageWarning)}</div>` : ""}${state.debug.used ? `<div class="info-banner warning sandbox-banner">${icon("settings")}<span>Sandbox life · Debug ${state.debug.enabled ? "enabled" : "previously used"}</span><button class="button secondary" data-view="debug">Debug controls</button></div>` : ""}${state.ended ? `<div class="info-banner">${icon("spark")}<span>Your life story is complete at age ${age(state)}, with a net worth of ${money(netWorth(state))}.</span><button class="button primary" data-action="new-game">Start a new life</button></div>` : ""}${pages[view]()}<footer><span>One life. Make it yours.</span><span>${storageWarning ? "Export to keep your progress" : "Progress saved on this device"} <span class="live-dot"></span></span></footer></main></div>`,
  );
  addSectionNavigation();
}
function addSectionNavigation() {
  const main = document.querySelector("#main");
  if (main.querySelector(".category-sections")) return;
  const headings = [...main.querySelectorAll(".panel-heading > div > h2")];
  if (headings.length < 2) return;
  const bar = document.createElement("nav");
  bar.className = "category-sections";
  bar.setAttribute(
    "aria-label",
    `${nav.find(([id]) => id === view)?.[2] || "Debug"} sections`,
  );
  bar.innerHTML = headings
    .map((heading, index) => {
      heading.id = `page-section-${view}-${index}`;
      heading.tabIndex = -1;
      return `<a class="section-shortcut" href="#${heading.id}" data-action="jump-section" data-id="${heading.id}">${e(heading.textContent)}</a>`;
    })
    .join("");
  const title = main.querySelector(".page-title");
  if (title) title.after(bar);
  else main.prepend(bar);
}
function characterDialog() {
  dialog(
    `<div class="eyebrow">YOUR CHARACTER</div><h2>${e(state.name)}</h2>${characterPortrait(state.characterLife.profile)}<p>${age(state)} years old · ${e(state.city)} · ${e(state.trait)}</p><div class="character-stats">${Object.entries(
      state.skills,
    )
      .map(
        ([k, v]) =>
          `<div><span>${e(k)}</span><strong>${Math.round(v)}</strong>${meter(v, "blue")}</div>`,
      )
      .join(
        "",
      )}</div><div class="info-banner">${icon("heart")} Health: ${Math.round(state.health)} / 100</div><p class="muted">Traits give a starting skill bonus. Social characters strengthen bonds faster; Athletic characters gain more from training.</p><button class="button secondary full-width" data-action="identity-open">Character & hometown</button><button class="button primary full-width" data-action="new-game">Create a new character ${icon("arrow")}</button>`,
  );
}
function newGameDialog() {
  if (creatorAvailable(state)) {
    dialog(characterCreatorForm(state, ui()));
    return;
  }
  dialog(
    `<div class="eyebrow">A WHOLE LIFE AHEAD</div><h2>A new life awaits.</h2><p>Begin at birth with a random name, hometown, family background and personality. Discover your interests as you grow. Starting a new life replaces your current save; export it first to keep both.</p><button class="button primary full-width" data-action="identity-random-life">Begin random life</button><p class="muted">The character creator is available with Debug or Pro access. It lets you choose a name, appearance, birthplace, family and starting interests.</p><button class="button secondary full-width" data-action="settings">Open Save & settings</button>`,
  );
}
function beginLife(next) {
  state = next;
  view = "overview";
  focusedSport = null;
  focusedOwnership = null;
  inboxArchived = false;
  save();
  render();
  modal.close();
  window.scrollTo({ top: 0 });
  notify("Your story begins. Make it yours.");
}

function eventDialog() {
  if (!state.event) return;
  const ev = state.event;
  dialog(
    `<div class="eyebrow">${e(ev.tag)}</div><h2>${e(ev.title)}</h2><p>${e(ev.text)}</p><div class="event-options">${ev.options.map((o, i) => `<button class="event-option" data-action="resolve-event" data-id="${i}" ${o.cost && availableCash(state) < o.cost ? "disabled" : ""}><strong>${e(o.label)} ${icon("arrow")}</strong><span>${e(o.detail)}</span></button>`).join("")}</div>`,
  );
}
function settingsDialog() {
  dialog(
    `<div class="eyebrow">YOUR WORLD, SAFE AND SOUND</div><h2>Save & settings</h2><p>Your progress saves automatically in this browser. Export a backup to keep it across devices.</p><div class="settings-actions"><button class="button primary full-width" data-action="export">${icon("download")} Export save</button><label class="button secondary full-width import-label">Import save<input id="import-save" type="file" accept=".json,application/json" hidden></label><button class="button secondary full-width" data-action="new-game">Create a new life</button><button class="button secondary full-width" data-action="toggle-debug">${state.debug.enabled ? "Disable debug mode" : "Enable debug mode"}</button>${state.debug.enabled ? `<button class="button secondary full-width" data-action="open-debug">Open debug controls</button>` : ""}${debugBackup ? `<button class="button secondary full-width" data-action="export-debug-backup">Export pre-debug save</button><button class="button secondary full-width" data-action="restore-debug-backup">Restore pre-debug save</button>` : ""}</div><p class="muted">Lifesim v0.13 · Single-player prototype. Money is displayed in USD. Saves stay on your device; no account or server is required.</p>`,
  );
  const creatorSettings = document.createElement("div");
  creatorSettings.className = "everyday-card";
  creatorSettings.innerHTML = `<h3>Character creator</h3><p>${creatorAvailable(state) ? "Character customization is unlocked." : "Enable Debug to use the creator in this prototype."}</p>${creatorAvailable(state) ? '<button class="button secondary full-width" data-action="new-game">Open character creator</button>' : ""}${state.debug.enabled ? `<p class="muted">Pro preview is a local testing switch, without accounts, billing or a paid entitlement. It keeps profile customization unlocked after Debug is disabled; age, cash and skill edits still require Debug. This life retains its sandbox marker.</p><button class="button secondary full-width" data-action="identity-pro-preview">${state.characterLife.proPreview ? "Disable" : "Enable"} local Pro preview</button>` : ""}`;
  modal.querySelector(".settings-actions").append(creatorSettings);
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
  if (migrationSave) {
    const button = document.createElement("button");
    button.className = "button secondary full-width";
    button.textContent = "Export pre-update save";
    button.onclick = () => {
      const url = URL.createObjectURL(
        new Blob([migrationSave], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `lifesim-before-v${migrationVersion}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    modal.querySelector(".settings-actions").append(button);
  }
}
function bidDialog(id) {
  const n = state.negotiations.find((n) => n.id === id);
  if (!n) return;
  const b = BUSINESSES.find((b) => b.id === n.targetId),
    remaining = 100 - stakePercent(state, b.id),
    stakes = (b.stock ? [5, 10, 25] : [25, 51, 100, remaining]).filter(
      (v, i, a) => v > 0 && v <= remaining && a.indexOf(v) === i,
    );
  const active = ["meeting", "open", "submitted", "accepted"].includes(
    n.status,
  );
  dialog(
    `<div class="eyebrow">OWNERSHIP NEGOTIATION · ${e(n.status)}</div><h2>${e(b.name)}</h2><p>Introduction fee paid: ${money(n.fee)}. Current equity value: ${money(assetValue(state, b.id))}. Your existing stake: ${stakePercent(state, b.id).toFixed(3)}%.</p>${n.status === "open" ? `<form id="acquisition-form" data-id="${e(id)}"><label class="field-label">Stake to acquire<select name="stake">${stakes.map((v) => `<option value="${v}">${v}% stake</option>`).join("")}</select></label><label class="field-label">Your cash offer<input name="amount" type="number" min="1" step="0.01" value="${Math.round(((assetValue(state, b.id) * (stakes[0] || 0)) / 100) * 1.3)}" required></label><p class="muted">The owners expect a premium; a low bid can be rejected. Their price can change with valuation. Your entire offer is reserved until acceptance, expiry, or withdrawal. You have ${money(availableCash(state))} uncommitted.</p><button type="submit" class="button primary full-width" ${!stakes.length ? "disabled" : ""}>Submit funded offer</button></form>` : n.status === "accepted" ? `<p>The owners accepted ${money(n.offer)} for ${n.stake}%. Close within ${n.expiresWeek - state.week} weeks.</p><button class="button primary full-width" data-action="complete-acquisition" data-id="${e(id)}">Complete acquisition</button>` : ["meeting", "submitted"].includes(n.status) ? `<p>A decision is due in ${Math.max(0, n.decisionWeek - state.week)} weeks.${n.offer ? ` ${money(n.offer)} is reserved.` : ""}</p>` : `<p>This approach is ${e(n.status)}. The introduction fee was non-refundable.</p>`}${active ? `<button class="text-button cancel-bid" data-action="cancel-bid" data-id="${e(id)}">Withdraw approach</button>` : ""}`,
  );
}
function tradeDialog(id) {
  const m = MARKETS.find((m) => m.id === id);
  if (!m) return;
  dialog(
    `<div class="eyebrow">${m.symbol} · ${m.risk.toUpperCase()} RISK</div><h2>${m.name}</h2><p>${money(state.market[id], 2)} per unit · You own ${state.holdings[id]} units.</p><form id="trade-form" data-id="${id}"><label class="field-label">Buy or sell<select name="direction"><option value="buy">Buy units</option><option value="sell">Sell units</option></select></label><label class="field-label">Number of units<input type="number" name="quantity" min="${m.fractional ? 0.000001 : 1}" max="${m.volume}" step="${m.fractional ? 0.000001 : 1}" value="1" required></label><div class="trade-total">Total <strong id="trade-total">${money(state.market[id], 2)}</strong></div><p class="muted">Uncommitted cash: ${money(availableCash(state), 2)}. Remaining weekly liquidity: ${(m.volume - state.tradeVolumes[id]).toLocaleString()}. Company shares represent real ownership in this simulated world. Realised gains are subject to 15% investment tax; losses offset gains at the annual tax settlement.</p><button class="button primary full-width" type="submit">Confirm trade ${icon("arrow")}</button></form>`,
  );
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action],[data-view]");
  if (!button || button.disabled) return;
  if (button.dataset.view) {
    view = button.dataset.view;
    if (
      view === "sports" &&
      ["football", "racing", "basketball", "tennis"].includes(
        button.dataset.sport,
      )
    )
      focusedSport = button.dataset.sport;
    render();
    window.scrollTo({ top: 0 });
    return;
  }
  const id = button.dataset.id;
  switch (button.dataset.action) {
    case "chapter-inbox-filter":
      inboxArchived = !inboxArchived;
      render();
      break;
    case "chapter-read-message":
      update((s) => markInboxMessage(s, id));
      break;
    case "chapter-archive-message":
      update((s) => markInboxMessage(s, id, "archive"));
      break;
    case "chapter-owner-focus":
      focusedOwnership = id;
      view = "teams";
      render();
      window.scrollTo({ top: 0 });
      break;
    case "chapter-owner-dismiss":
      update(
        (s) => dismissOwnerStaff(s, id, button.dataset.role),
        "Appointment ended; the company paid notice.",
      );
      break;
    case "chapter-owner-upgrade":
      update(
        (s) => upgradeOwnerFacility(s, id),
        "Facility construction commissioned from company cash.",
      );
      break;
    case "chapter-plan-recording":
      dialog(recordingPlanDialog(state, ui()));
      break;
    case "chapter-plan-content":
      dialog(contentPlanDialog(state, ui()));
      break;
    case "chapter-community-promise":
      update(
        (s) => deliverCommunityPromise(s, id),
        "Community session delivered.",
      );
      break;
    case "identity-open":
      modal.close();
      view = "identity";
      render();
      window.scrollTo({ top: 0 });
      break;
    case "retail-store":
      retailStore = id;
      shopFilters.category = "";
      render();
      break;
    case "retail-reset": {
      const area = document.querySelector("[data-dressing-room]");
      if (area) {
        area.querySelector(".character-portrait").outerHTML = characterPortrait(
          state.characterLife.profile,
        );
        area.querySelector("[data-outfit-name]").textContent =
          "Your current look";
      }
      break;
    }
    case "outfit-preview": {
      const item = CLOTHING.find((i) => i.id === id),
        area = document.querySelector("[data-dressing-room]");
      if (item && area) {
        area.querySelector(".character-portrait").outerHTML = characterPortrait(
          {
            ...state.characterLife.profile,
            outfit: item.outfit,
            garment: item.garment,
          },
        );
        area.querySelector("[data-outfit-name]").textContent = item.name;
      }
      break;
    }
    case "outfit-buy":
      update((s) => buyClothing(s, id), "Outfit purchased and worn.");
      break;
    case "outfit-wear":
      update((s) => wearClothing(s, id), "Outfit changed.");
      break;
    case "relocation-dialog":
      dialog(relocationDialog(state, ui()));
      break;
    case "language-study":
      update(studyLanguage, "Language & civic knowledge improved.");
      break;
    case "naturalisation":
      dialog(
        `<h2>Apply for citizenship?</h2><p>This submits an application for ${e(country(state.globalLife.residence.country).name)}. The non-refundable fee is paid now; residence, civic knowledge and criminal-record requirements are checked again at review.</p><button class="button primary" data-action="naturalisation-confirm">Submit citizenship application</button>`,
      );
      break;
    case "naturalisation-confirm":
      if (
        update(
          (s) =>
            applyImmigration(s, {
              country: s.globalLife.residence.country,
              route: "citizenship",
            }),
          "Application submitted.",
        )
      )
        modal.close();
      break;
    case "crime-review": {
      const d = CRIMES[id];
      if (d)
        dialog(
          `<div class="eyebrow">A SERIOUS CHOICE</div><h2>${e(d.name)}?</h2><p>This risks arrest, a ${money(d.fine)} fine and up to ${d.sentence} weeks in custody. A conviction ends employment and can affect future jobs and immigration.</p><button class="button primary" data-action="crime-confirm" data-id="${id}">Take the risk</button>`,
        );
      break;
    }
    case "crime-confirm":
      if (update((s) => commitCrime(s, id), "Your choice has consequences.")) {
        modal.close();
        view = "crime";
        render();
      }
      break;
    case "prison-activity":
      update((s) => prisonActivity(s, id), "Supervised activity completed.");
      break;
    case "track-new":
      dialog(trackDialog(state, ui()));
      break;
    case "track-work":
      update((s) => workTrack(s, id), "Studio session completed.");
      break;
    case "ready-recording-release":
      update(
        (s) => releaseReadyRecording(s, id),
        "Recording scheduled for release.",
      );
      break;
    case "track-release":
      if (update((s) => releaseTrack(s, id), "Single scheduled for release."))
        modal.close();
      break;
    case "founder-fund-dialog":
      dialog(
        '<h2>Fund your company.</h2><form id="founder-fund-form"><label class="field-label">Capital contribution<input name="amount" type="number" min="100" max="1000000000" step="0.01" required></label><p>Personal cash becomes company cash and equity. This uses one action and two hours. You can spend company funds on development, facilities and an industry pivot.</p><button class="button primary">Transfer founder capital</button></form>',
      );
      break;
    case "business-develop":
      update(
        (s) => businessDevelopment(s, id),
        "Company development completed.",
      );
      break;
    case "kart-seat":
      update((s) => acceptKartOffer(s, id), "Karting seat accepted.");
      break;
    case "notification-bell": {
      const content = notificationDialog(state, ui());
      update((s) => {
        const n = structuredClone(s);
        n.globalLife.readAlerts = [
          ...new Set([
            ...n.globalLife.readAlerts,
            ...n.globalLife.racing.offers
              .filter((o) => o.status === "offered")
              .map((o) => o.id),
            ...n.music.projects
              .filter((p) => p.status === "ready")
              .map((p) => `studio:${p.id}`),
            ...n.nextChapter.messages
              .filter((m) => m.status === "open")
              .map((m) => m.id),
            ...n.globalLife.marketAlerts.map((a) => a.id),
            ...n.globalLife.applications
              .filter((a) => a.status !== "pending")
              .map((a) => a.id),
            ...(n.event ? [`event:${n.week}`] : []),
          ]),
        ].slice(-80);
        return n;
      });
      dialog(content);
      break;
    }
    case "notification-sports":
      modal.close();
      view = "sports";
      focusedSport = "racing";
      render();
      break;
    case "notification-music":
      modal.close();
      view = "music";
      render();
      break;
    case "notification-inbox":
      modal.close();
      view = "inbox";
      render();
      break;
    case "notification-markets":
      modal.close();
      view = "investments";
      render();
      break;
    case "notification-identity":
      modal.close();
      view = "identity";
      render();
      break;
    case "identity-pro-preview":
      if (update((s) => setProPreview(s, !s.characterLife.proPreview)))
        settingsDialog();
      break;
    case "identity-random-life":
      beginLife(createRandomCharacter());
      break;
    case "identity-edit-profile":
      if (!creatorAvailable(state)) {
        notify("Character customization requires Debug or Pro access.");
        break;
      }
      dialog(
        `<h2>Edit your character.</h2><p>Your profile changes do not move your household, award skills or rewrite family history.</p><form id="identity-profile-form">${profileFields(state, ui())}<button class="button primary full-width" type="submit">Save character profile</button></form>`,
      );
      break;
    case "identity-development":
      update(
        (s) => personalDevelopment(s, id),
        "Personal development session completed.",
      );
      break;
    case "identity-family-support":
      update(
        (s) => requestPathSupport(s, id),
        "Your family has considered your request.",
      );
      break;
    case "identity-book-local":
      update(
        (s) => bookLocalOpportunity(s, id),
        "Local workshop booked for next week.",
      );
      break;
    case "focus-sport":
      if (!["football", ...SPORTS.map((sport) => sport.id)].includes(id)) break;
      focusedSport = id;
      render();
      document
        .querySelector(`[data-action="focus-sport"][data-id="${id}"]`)
        .focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
      break;
    case "jump-section": {
      event.preventDefault();
      const heading = document.getElementById(id);
      if (!heading) break;
      heading.scrollIntoView({ block: "start" });
      heading.focus({ preventScroll: true });
      document.querySelectorAll(".section-shortcut").forEach((shortcut) => {
        shortcut.classList.toggle("active", shortcut === button);
        if (shortcut === button)
          shortcut.setAttribute("aria-current", "location");
        else shortcut.removeAttribute("aria-current");
      });
      break;
    }
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
    case "toggle-debug":
      if (!state.debug.used) {
        debugBackup = JSON.stringify(state);
        try {
          localStorage.setItem(`${STORAGE}-before-debug`, debugBackup);
        } catch {
          notify("Backup is in memory; export it before leaving.");
        }
      }
      if (update((s) => toggleDebug(s, !s.debug.enabled))) {
        modal.close();
        if (state.debug.enabled) {
          view = "debug";
          render();
        }
      }
      break;
    case "open-debug":
      modal.close();
      view = "debug";
      render();
      break;
    case "export-debug-backup": {
      if (!debugBackup) break;
      const url = URL.createObjectURL(
        new Blob([debugBackup], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "lifesim-before-debug.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      break;
    }
    case "restore-debug-backup":
      dialog(
        '<h2>Return to your pre-debug life?</h2><p>This replaces the current life with your saved pre-debug snapshot. Export your current save first if you want to keep both.</p><button class="button primary full-width" data-action="confirm-debug-restore">Restore original life</button>',
      );
      break;
    case "confirm-debug-restore":
      if (
        debugBackup &&
        update(() => restoreGame(debugBackup), "Pre-debug life restored.")
      ) {
        modal.close();
        view = "overview";
        render();
      }
      break;
    case "debug-quick": {
      const changes = id.startsWith("cash-")
        ? {
            money: Math.min(
              1e12,
              state.money +
                {
                  "cash-small": 10000,
                  "cash-million": 1e6,
                  "cash-billion": 1e9,
                }[id],
            ),
          }
        : id === "wellbeing"
          ? { health: 100, energy: 100, happiness: 100 }
          : id === "actions"
            ? { actions: 3 }
            : {
                skills: Object.fromEntries(
                  Object.keys(state.skills).map((k) => [k, 80]),
                ),
              };
      update((s) => debugEdit(s, changes), "Sandbox values updated.");
      break;
    }
    case "debug-time":
      update((s) => debugAdvance(s, Number(id)), "Time simulated.");
      break;
    case "rent-home": {
      const r = RENTALS.find((r) => r.id === id);
      dialog(
        `<h2>${e(r.name)}</h2><p>${money(r.rent)} rent per week plus personal living costs. ${money(r.deposit)} refundable deposit and $100 moving costs; your old rental deposit is credited. Moving out of an owned residence keeps it in your portfolio. Uses one action.</p><button class="button primary full-width" data-action="confirm-rent" data-id="${id}">Move into rental</button>`,
      );
      break;
    }
    case "confirm-rent":
      if (update((s) => rentHome(s, id), "Moved into your new rental."))
        modal.close();
      break;
    case "purchase-home": {
      const h = propertyListings(state).find((h) => h.id === id);
      dialog(
        `<h2>${e(h.name)}</h2><form id="home-purchase-form" data-id="${id}"><label class="field-label">Purchase method<select name="financing"><option value="cash">Cash: ${money(h.asking * 1.02)} including fees</option><option value="mortgage">Mortgage: ${money(h.asking * 0.22)} upfront, ${money(mortgagePayment(h.asking * 0.8), 2)}/week</option></select></label><p class="muted">Estimated value ${money(h.asking)}. ${money(h.upkeep)}/week upkeep. A mortgage needs 26 weeks in employment, affordable repayments, and twelve payments in cash reserves after closing. This purchase does not move you in automatically. Uses one action.</p><button class="button primary full-width" type="submit">Purchase property</button></form>`,
      );
      break;
    }
    case "manage-property": {
      const mode = button.dataset.mode;
      const descriptions = {
        move: "Move in for $100. Your old rental deposit is returned.",
        let: "Pay $150 advertising fees. Tenant reviews begin in four weeks. An occupied home earns rent minus 10% management fees. A one-year lease can renew or end.",
        sell: "List for sale. Buyer reviews begin in four weeks and can fail. Sale deducts 5% and pays off the mortgage; you keep the remaining equity.",
        repay: "Use cash to repay the entire remaining mortgage.",
        endlease:
          "Give notice now. The tenant stays and pays rent until the scheduled expiry; the lease will not renew.",
      };
      dialog(
        `<h2>${e({ move: "Make this your home?", let: "Advertise for tenants?", sell: "Sell this property?", repay: "Clear this mortgage?", endlease: "End the lease at expiry?" }[mode])}</h2><p>${e(descriptions[mode])} Uses one action.</p><button class="button primary full-width" data-action="confirm-property" data-id="${e(id)}" data-mode="${mode}">Confirm property action</button>`,
      );
      break;
    }
    case "confirm-property":
      if (
        update(
          (s) => manageProperty(s, id, button.dataset.mode),
          "Property plans updated.",
        )
      )
        modal.close();
      break;
    case "hobby-practice":
      update((s) => practiseHobby(s, id), "Practice completed.");
      break;
    case "hobby-project": {
      const h = HOBBIES.find((h) => h.id === id);
      dialog(
        `<h2>${e(h.project)}</h2><form id="hobby-project-form" data-id="${id}"><label class="field-label">Project title<input name="title" maxlength="60" required></label><p class="muted">${money(h.budget)} production budget, one action, 8 energy, and ${h.weeks} weeks. Skills set quality; audiences and luck affect small sales over the following year.</p><button class="button primary full-width" type="submit">Start hobby project</button></form>`,
      );
      break;
    }
    case "freelance":
      update(
        (s) => deliverFreelance(s, id),
        "Commission delivered; check your story for the result.",
      );
      break;
    case "volunteer":
      update(volunteer, "Thanks for helping your neighbourhood.");
      break;
    case "family-plan": {
      const mode = button.dataset.mode;
      const text = {
        propose:
          "You need age 18+, a year together, and 80 connection. Engagement costs $250 and one action.",
        wedding:
          "The wedding must be at least four weeks after engagement. Choose a $300 city-hall ceremony or a $3,000 celebration.",
        child:
          "Prepare for a child over 39 weeks, with $1,000 upfront. You need age 21+, a year together, 80 connection, and a family-sized home. Recurring support and care begin after arrival.",
        "adopt-child":
          "This simplified adoption route takes 26 weeks and $3,000 upfront. You need age 21+, a year together, 80 connection, and a family-sized home.",
        breakup:
          "This ends your relationship. Existing children remain in your household and need support. Pending family arrivals must complete first.",
      };
      dialog(
        `<h2>${e({ propose: "Plan your proposal", wedding: "Plan your wedding", child: "A new family chapter", "adopt-child": "Explore adoption", breakup: "Discuss separation" }[mode])}</h2><form id="family-plan-form" data-mode="${mode}"><p>${e(text[mode])}</p>${["child", "adopt-child"].includes(mode) ? '<label class="field-label">Child name<input name="name" maxlength="32" required></label>' : mode === "wedding" ? '<label class="field-label">Wedding style<select name="style"><option value="simple">City hall — $300</option><option value="celebration">Celebration — $3,000</option></select></label>' : ""}<button class="button primary full-width" type="submit">Confirm family plan</button></form>`,
      );
      break;
    }
    case "child-time":
      update((s) => familyAction(s, "child-time", { id }), "Time well spent.");
      break;
    case "adopt-pet":
      dialog(
        '<h2>Meet your new companion.</h2><form id="pet-form"><label class="field-label">Pet name<input name="name" maxlength="32" required></label><label class="field-label">Companion<select name="kind"><option value="dog">Dog — $200 adoption, $14/week care</option><option value="cat">Cat — $125 adoption, $10/week care</option></select></label><p class="muted">One action, a private home, and age 18+ required. An $80 routine vet check is due every 26 weeks.</p><button class="button primary full-width" type="submit">Adopt pet</button></form>',
      );
      break;
    case "pet-care":
      update((s) => careForPet(s, id), "Your companion enjoyed that.");
      break;
    case "focus":
      update((s) => setActivity(s, id), "Weekly focus updated");
      break;
    case "age-up":
      if (state.event) eventDialog();
      else if (update(ageUp, "Your life is growing.")) {
        if (state.event) eventDialog();
      }
      break;
    case "depth-contact-action":
      update((s) => contactAction(s, id, button.dataset.kind));
      break;
    case "depth-contact-training":
      update((s) => bookContactTraining(s, id));
      break;
    case "depth-challenge-book": {
      const path = button.dataset.path;
      const o = state.careerMilestones.paths[path].opportunities.find(
        (o) => o.id === id,
      );
      const d = CAREER_CHALLENGES.find((d) => d.id === o?.kind);
      if (d)
        dialog(
          `<h2>${e(d.title)}</h2><p>Costs ${money(d.cost)} now, one action and three preparation hours. The assessment reserves ${d.hours} hours in week ${state.week + d.delay}; it replaces a regular sporting fixture in that week. Cup and playoff winners can advance through three rounds. Results are uncertain, and higher-tier recruitment still requires the right qualifications and experience.</p><button class="button primary" data-action="depth-challenge-confirm" data-path="${path}" data-id="${e(id)}">Enter career opportunity</button>`,
        );
      break;
    }
    case "depth-challenge-confirm":
      if (update((s) => bookCareerChallenge(s, button.dataset.path, id)))
        modal.close();
      break;
    case "depth-label-buyout":
      dialog(
        `<h2>Buy out your label?</h2><p>Repay the remaining advance and agreed exit fee: ${money(musicBuyoutCost(state))}. Your recording exclusivity ends; previous royalties and recording expenses remain in your accounts. Uses one action and two hours.</p><button class="button primary" data-action="depth-label-buyout-confirm">Pay label buyout</button>`,
      );
      break;
    case "depth-label-buyout-confirm":
      if (update(buyOutMusicAgreement)) modal.close();
      break;
    case "depth-endorsement-review": {
      const o = state.contracts.offers.find((o) => o.id === id);
      if (o)
        dialog(
          `<h2>${e(o.brand)} endorsement</h2><p>${money(o.fee)} gross fee: half upfront and half after two public appearances in six weeks. This reserves ${e(o.category)} exclusivity for thirteen weeks, including after delivery. Appearances need an action, two preparation hours and three hours next week, public privacy and sufficient energy. Missing delivery or cancelling repays the full ${money(o.fee / 2)} gross advance. Any active athlete agreement takes its image-rights share from all personal endorsements; agent or music management fees and income tax further reduce cash.</p><button class="button primary" data-action="depth-endorsement-confirm" data-id="${e(id)}">Sign endorsement</button>`,
        );
      break;
    }
    case "depth-endorsement-confirm":
      if (update((s) => acceptEndorsement(s, id))) modal.close();
      break;
    case "depth-endorsement-book":
      update((s) => bookEndorsementAppearance(s, id));
      break;
    case "depth-endorsement-cancel": {
      const d = state.contracts.endorsements.find((d) => d.id === id);
      if (d)
        dialog(
          `<h2>Cancel this campaign?</h2><p>Repay ${money(d.advance)} gross upfront pay. Representation and image-rights costs remain spent; the remaining balance is not earned.</p><button class="button primary" data-action="depth-endorsement-cancel-confirm" data-id="${e(id)}">Repay and cancel campaign</button>`,
        );
      break;
    }
    case "depth-endorsement-cancel-confirm":
      if (update((s) => cancelEndorsement(s, id))) modal.close();
      break;
    case "world-staff-hire":
      update((s) => hireSportStaff(s, button.dataset.sport, id));
      break;
    case "world-staff-dismiss":
      update((s) => dismissSportStaff(s, button.dataset.sport, id));
      break;
    case "world-sport-activity":
      update((s) =>
        sportCareerAction(s, button.dataset.sport, button.dataset.kind),
      );
      break;
    case "world-international":
      update((s) => bookSportInvitation(s, button.dataset.sport, id));
      break;
    case "world-move-review": {
      const html = careerMoveDialog(state, button.dataset.sport, id, ui());
      if (html) dialog(html);
      break;
    }
    case "world-collab-negotiate":
      update((s) => negotiateCollaboration(s, id));
      break;
    case "world-collab-record":
      dialog(
        `<h2>Record for your music agreement</h2><form id="world-collab-form" data-id="${e(id)}"><label class="field-label">Project title<input name="title" maxlength="60" required></label><p>Recording costs $150 plus any agreed artist fee, one action and three hours. The usual equipment and practice requirements apply.</p><button class="button primary" type="submit">Start agreed recording</button></form>`,
      );
      break;
    case "world-live-rehearse":
      update(rehearseLive);
      break;
    case "world-tour-cancel": {
      const t = state.careerWorld.music.tours.find(
        (t) => t.id === state.careerWorld.music.activeTour,
      );
      if (t)
        dialog(
          `<h2>Cancel remaining shows?</h2><p>Cancellation costs ${money(
            t.stops
              .filter((x) => x.status === "scheduled")
              .reduce((n, x) => n + x.cost * 0.25, 0),
            2,
          )}. Setup and completed shows are retained in your accounts.</p><button class="button primary" data-action="world-tour-cancel-confirm">Cancel remaining tour</button>`,
        );
      break;
    }
    case "world-tour-cancel-confirm":
      if (update(cancelMusicTour)) modal.close();
      break;
    case "school-peer":
      update((s) => schoolAction(s, button.dataset.kind, id));
      break;
    case "exam-prepare":
      update((s) => schoolAction(s, "prepare"));
      break;
    case "school-scholarship":
      update(applyScholarship);
      break;
    case "family-funding":
      update(requestFamilyFunding);
      break;
    case "relative-support":
      update((s) => familySupport(s, id, button.dataset.kind));
      break;
    case "body-care":
      update((s) => bodyAction(s, id));
      break;
    case "childhood-activity":
      update((s) => childhoodActivity(s, id), "A little moment in your story.");
      break;
    case "childhood-interest":
      update((s) => chooseChildInterest(s, id), "A new interest to explore.");
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
    case "company": {
      const c = state.company;
      if (!c) break;
      dialog(
        `<div class="eyebrow">BUILD SOMETHING OF YOUR OWN</div><h2>Your company, your direction.</h2><form id="company-form"><label class="field-label">Company name<input name="name" maxlength="40" value="${e(c.name)}" required></label><label class="field-label">Industry<select name="sector">${INDUSTRIES.map(
          (i) => i.name,
        )
          .map(
            (v) => `<option ${c.sector === v ? "selected" : ""}>${v}</option>`,
          )
          .join(
            "",
          )}</select></label><label class="field-label">Company strategy<select name="strategy"><option value="balanced" ${c.strategy === "balanced" ? "selected" : ""}>Balanced — draw 25% of positive profit</option><option value="reinvest" ${c.strategy === "reinvest" ? "selected" : ""}>Reinvest — retain all founder profit</option><option value="dividends" ${c.strategy === "dividends" ? "selected" : ""}>Take income — draw 50% of positive profit</option></select></label><p class="muted">Technology has the biggest weekly swings; consumer goods are steadier. All sectors can grow or lose value. Changing industry requires an action and company-funded retooling plus any higher capital requirement. Staffing follows company revenue. Side-business distributions use this strategy and are paid quarterly.</p><button class="button primary full-width" type="submit">Set my direction ${icon("arrow")}</button></form>`,
      );
      break;
    }
    case "join-football":
      update(joinFootball, "Joined the local football pathway.");
      break;
    case "join-sport":
      update((s) => joinSport(s, id), "Your sporting path has begun.");
      break;
    case "confirm-loan":
      if (
        update(
          (s) =>
            takeLoan(
              s,
              Number(button.dataset.amount),
              Number(button.dataset.term),
            ),
          "Loan funded. Repayments start next week.",
        )
      )
        modal.close();
      break;
    case "repay-loan": {
      const loan = state.banking.loans.find((l) => l.id === id);
      if (!loan) break;
      dialog(
        `<h2>Make an extra repayment</h2><form id="repay-loan-form" data-id="${e(id)}"><label class="field-label">Repayment amount<input name="amount" type="number" min="0.01" max="${loan.balance}" step="0.01" value="${loan.balance}" required></label><p class="muted">Balance ${money(loan.balance)}. No early repayment penalty. Uses uncommitted cash.</p><button type="submit" class="button primary full-width">Repay debt</button></form>`,
      );
      break;
    }
    case "hire-agent":
      update(
        (s) => hireAgent(s, button.dataset.sport, id),
        "Representation agreed. Commission applies to sporting income.",
      );
      break;
    case "dismiss-agent":
      update(
        (s) => dismissAgent(s, button.dataset.sport),
        "Representation ended.",
      );
      break;
    case "sport-sponsor": {
      const offer = state.seasons[button.dataset.sport].sponsorOffers.find(
        (o) => o.id === id,
      );
      if (!offer) break;
      dialog(
        `<h2>${e(offer.brand)}</h2><p>${money(offer.annual)}/year toward racing costs for 52 weeks. Support pays competition costs directly. An appearance is due every thirteen weeks; missing it can end the agreement.</p><p class="muted">Signing uses one action and two hours; each appearance uses one action and three hours.</p><button class="button primary full-width" data-action="confirm-sport-sponsor" data-id="${e(id)}" data-sport="${button.dataset.sport}">Accept sponsorship</button>`,
      );
      break;
    }
    case "confirm-sport-sponsor":
      if (
        update(
          (s) => acceptSportSponsor(s, button.dataset.sport, id),
          "Competition funding agreed.",
        )
      )
        modal.close();
      break;
    case "sport-appearance":
      update(
        (s) => deliverSportAppearance(s, button.dataset.sport),
        "Sponsor appearance delivered.",
      );
      break;
    case "story-delivery":
      update(
        (s) => deliverStoryCommission(s, id),
        "Commission delivered. Check the outcome in your journal.",
      );
      break;
    case "sport-offer": {
      const sport = button.dataset.sport,
        o = (
          sport === "football" ? state.football : state.sports[sport]
        ).offers.find((o) => o.id === id);
      if (!o) break;
      if (state.careerWorld.sports[sport].moves[id]) {
        dialog(careerMoveDialog(state, sport, id, { e, money }));
        break;
      }
      dialog(
        `<div class="eyebrow">SPORTING INVITATION</div><h2>${e(o.club)}</h2><p>${o.kind === "contract" ? `A ${o.terms?.weeks || o.duration || 104}-week sporting contract offers ${money(o.pay)}/week gross base income. Signing ends your current paid job or sporting contract.` : o.kind === "academy" ? `An academy place offers coached development while you continue school. It gives no professional salary or guarantee of a senior place.` : `A two-week trial assesses your ability, discipline, and fitness. A successful trial can lead to an academy or development offer; it can also end without a place.`}</p>${o.kind === "contract" && o.terms ? `<p>Role: ${e(o.terms.role)}. Appearance bonus ${money(o.terms.appearanceBonus)}; win bonus ${money(o.terms.winBonus)}. Annual driver funding: ${money(o.terms.annualFunding)}.</p><p class="muted">Income tax and any agent commission reduce spendable pay. Racing needs thirteen weeks of uncovered funding in cash reserves before signing.</p>${o.terms?.negotiation ? `<p>${o.terms?.negotiation.status === "pending" ? `Your counteroffer is being considered until week ${o.terms?.negotiation.decisionWeek}.` : `Negotiation: ${e(o.terms?.negotiation.status)}.`}</p>` : `<form id="sport-negotiation-form" data-sport="${sport}" data-id="${e(id)}"><label class="field-label">Contract approach<select name="approach"><option value="security">Security: 156 weeks, 5% less pay</option><option value="balanced">Balanced: 104 weeks, 8% more pay</option><option value="ambitious">Ambitious: 52 weeks, 20% more pay, starter role</option></select></label><p class="muted">One action and three hours. The club may refuse, and an ambitious counter can cost you the invitation. You can negotiate once.</p><button class="button secondary full-width" type="submit">Send counteroffer</button></form>`}` : ""}${o.kind === "contract" ? contractTermsFragment(state, sport, id, ui()) : ""}<button class="button primary full-width" ${o.terms?.negotiation?.status === "pending" || state.contracts.reviews.some((r) => r.sector === sport && r.offerId === id && r.status === "pending") ? "disabled" : ""} data-action="confirm-sport-offer" data-sport="${sport}" data-id="${e(id)}">Accept invitation</button>`,
      );
      break;
    }
    case "confirm-sport-offer":
      if (
        update(
          (s) =>
            button.dataset.sport === "football"
              ? acceptFootballOffer(s, id)
              : acceptSportOffer(s, button.dataset.sport, id),
          "Invitation accepted.",
        )
      )
        modal.close();
      break;
    case "decline-sport":
      update(
        (s) =>
          button.dataset.sport === "football"
            ? declineFootballOffer(s, id)
            : declineSportOffer(s, button.dataset.sport, id),
        "Invitation declined.",
      );
      break;
    case "leave-sport":
      dialog(
        `<h2>Step away from this sport?</h2><p>Your participation and any sporting contract will end. Current release-clause cost: ${money(sportExitCost(state, button.dataset.sport))}. Local participation can be restarted later; professional recruitment still depends on development and age.</p><button class="button primary full-width" data-action="confirm-leave-sport" data-sport="${button.dataset.sport}">Confirm stepping away</button>`,
      );
      break;
    case "confirm-leave-sport":
      if (
        update(
          (s) =>
            button.dataset.sport === "football"
              ? leaveFootball(s)
              : leaveSport(s, button.dataset.sport),
          "Sport participation ended.",
        )
      )
        modal.close();
      break;
    case "open-account":
      update(
        (s) => openSocialAccount(s, id),
        "Account opened. Your audience starts at zero.",
      );
      break;
    case "post": {
      const platform = PLATFORMS.find((p) => p.id === id),
        sponsored = button.dataset.sponsored === "true",
        cost = id === "lens" ? 5 : id === "loop" ? 20 : id === "tube" ? 35 : 15;
      dialog(
        `<div class="eyebrow">${sponsored ? "LABELLED SPONSORED CONTENT" : "CONTENT PRODUCTION"}</div><h2>${e(platform.name)}</h2><form id="post-form" data-platform="${id}" data-sponsored="${sponsored}"><label class="field-label">Content approach<select name="approach"><option value="authentic">Authentic — builds trust</option><option value="polished">Polished — higher production quality</option><option value="clickbait">Clickbait — more reach, reputation −5</option></select></label><p class="muted">Production costs ${money(cost)}, one free-time action, and 5 energy. Results arrive next week. Photos and videos need a phone or camera; streams need a computer. ${sponsored ? "The labelled public post must reach at least 35 quality for sponsor payment." : ""}</p><button class="button primary full-width" type="submit">Publish content</button></form>`,
      );
      break;
    }
    case "sponsor": {
      const o = state.social.offers.find((o) => o.id === id);
      if (!o) break;
      dialog(
        `<div class="eyebrow">BRAND COLLABORATION</div><h2>${e(o.brand)}</h2><p>${money(o.fee)} for one labelled public post on ${e(PLATFORMS.find((p) => p.id === o.platform).name)} within three weeks. Payment follows delivery with at least 35 production quality. Missed delivery earns no fee and harms reputation.</p><button class="button primary full-width" data-action="confirm-sponsor" data-id="${e(id)}">Accept collaboration</button>`,
      );
      break;
    }
    case "confirm-sponsor":
      if (
        update(
          (s) => acceptSponsor(s, id),
          "Collaboration agreed. Deliver its sponsored post.",
        )
      )
        modal.close();
      break;
    case "music-practice":
      update(practiseMusic, "Practice session complete.");
      break;
    case "record-music":
      dialog(trackDialog(state, ui()));
      break;
    case "music-gig": {
      const g = state.music.gigs.find((g) => g.id === id);
      if (!g) break;
      dialog(
        `<h2>${e(g.venue)}</h2><p>A performance next week pays ${money(g.fee)} if delivered. Booking uses one action and 8 energy. Craft and wellbeing affect success.</p><button class="button primary full-width" data-action="confirm-music-gig" data-id="${e(id)}">Book performance</button>`,
      );
      break;
    }
    case "confirm-music-gig":
      if (
        update((s) => bookMusicGig(s, id), "Performance booked for next week.")
      )
        modal.close();
      break;
    case "label-offer": {
      const o = state.music.labelOffers.find((o) => o.id === id);
      if (!o) break;
      dialog(
        `<div class="eyebrow">RECORD LABEL TERMS</div><h2>${e(o.name)}</h2><p>A 52-week agreement pays ${money(o.advance)} upfront. The agreed artist royalty share repays the advance before you receive further royalty cash. This is a recoupable advance.</p>${contractTermsFragment(state, "music", id, ui())}<button class="button primary full-width" ${state.contracts.reviews.some((r) => r.sector === "music" && r.offerId === id && r.status === "pending") ? "disabled" : ""} data-action="confirm-label" data-id="${e(id)}">Sign label agreement</button>`,
      );
      break;
    }
    case "confirm-label":
      if (update((s) => acceptLabelOffer(s, id), "Label agreement signed."))
        modal.close();
      break;
    case "experience": {
      const x = EXPERIENCES.find((x) => x.id === id);
      dialog(
        `<h2>${e(x.name)}</h2><p>${e(x.description)} Costs ${money(x.price)} and one free-time action. Available again after ${x.cooldown} weeks.</p><button class="button primary full-width" data-action="confirm-experience" data-id="${id}">Confirm experience</button>`,
      );
      break;
    }
    case "confirm-experience":
      if (update((s) => takeExperience(s, id), "A new memory made."))
        modal.close();
      break;
    case "trade":
      tradeDialog(id);
      break;
    case "apply-job":
      update(
        (s) => applyForJob(s, id),
        "Application submitted. Check back for the employer’s response.",
      );
      break;
    case "accept-job": {
      const a = state.applications.find((a) => a.id === id);
      if (!a) break;
      const j = jobDefinition(a.jobId);
      dialog(
        `<div class="eyebrow">EMPLOYMENT OFFER</div><h2>${e(j.title)}</h2><p>${e(j.employer)} offers ${money(a.offeredPay)}/week. Accepting ends your previous contract. Current sports exit costs: ${money(allSportExitCosts(state))}. Your company, investments, skills, and qualifications remain yours.</p><button class="button primary full-width" data-action="confirm-job" data-id="${e(id)}">Accept this job</button>`,
      );
      break;
    }
    case "confirm-job":
      if (update((s) => acceptJobOffer(s, id), "Employment contract accepted."))
        modal.close();
      break;
    case "raise":
      if (update(requestRaise)) notify(state.log[0].text);
      break;
    case "resign":
      dialog(
        `<div class="eyebrow">END YOUR CONTRACT</div><h2>Leave your current job?</h2><p>Your wages stop immediately. Current sports exit costs: ${money(allSportExitCosts(state))}. You keep your qualifications and experience, but a new job requires a successful application.</p><button class="button primary full-width" data-action="confirm-resign">Confirm resignation</button>`,
      );
      break;
    case "confirm-resign":
      if (update(resignJob, "Your contract has ended.")) modal.close();
      break;
    case "enrol": {
      const p = PROGRAMS.find((p) => p.id === id);
      if (!p) break;
      dialog(
        `<div class="eyebrow">EDUCATION</div><h2>${e(p.name)}</h2><p>Tuition is ${money(programmeTuition(state, id), 2)} per calendar week${programmeTuition(state, id) < p.tuition ? ` (usual fee ${money(p.tuition)}; your current tuition support applies)` : ""}. This programme requires ${p.weeks} study weeks: sixteen allocated study hours advance one study week; an overbooked calendar slows progress. If you cannot pay, progress pauses. The credential is awarded only on completion.</p><button class="button primary full-width" data-action="confirm-enrol" data-id="${id}">Enrol in programme</button>`,
      );
      break;
    }
    case "confirm-enrol":
      if (
        update(
          (s) => enrolEducation(s, id),
          "Enrolment confirmed. Your next tuition payment is due next week.",
        )
      )
        modal.close();
      break;
    case "withdraw-course":
      dialog(
        `<h2>Withdraw from your studies?</h2><p>Paid tuition is not refunded and incomplete study progress is lost. No qualification is awarded.</p><button class="button primary full-width" data-action="confirm-withdraw-course">Confirm withdrawal</button>`,
      );
      break;
    case "confirm-withdraw-course":
      if (update(withdrawEducation, "Enrolment withdrawn.")) modal.close();
      break;
    case "found-company":
      dialog(companyLaunchDialog(state, ui()));
      break;
    case "company-launch-plan":
      dialog(companyLaunchDialog(state, ui(), id));
      break;
    case "approach": {
      const b = BUSINESSES.find((b) => b.id === id);
      if (!b) break;
      dialog(
        `<div class="eyebrow">APPROACH THE OWNERS</div><h2>${e(b.name)}</h2><p>An introduction request costs ${money(meetingFee(state, id))}, paid now and not refunded. Owners respond in two weeks. They can refuse to talk; a successful meeting still requires a funded offer and normally a premium. You cannot approach again for 26 weeks.</p><button class="button primary full-width" data-action="confirm-approach" data-id="${id}">Pay for introduction request</button>`,
      );
      break;
    }
    case "confirm-approach":
      if (
        update(
          (s) => requestBoardMeeting(s, id),
          "Introduction requested. The fee is paid; a response is due in two weeks.",
        )
      )
        modal.close();
      break;
    case "review-bid":
      bidDialog(id);
      break;
    case "complete-acquisition":
      if (update((s) => completeAcquisition(s, id), "Acquisition completed."))
        modal.close();
      break;
    case "cancel-bid":
      if (
        update(
          (s) => cancelOffer(s, id),
          "Approach withdrawn; committed cash is released.",
        )
      )
        modal.close();
      break;
    case "sale-opportunity": {
      const o = state.opportunities.find((o) => o.id === id);
      if (!o) break;
      const b = BUSINESSES.find((b) => b.id === o.targetId);
      dialog(
        `<div class="eyebrow">OWNER-LED SALE</div><h2>${e(b.name)}</h2><p>The owners offer ${o.stake}% for ${money(o.askingPrice)}. This is a ${e(b.kind.toLowerCase())}. Its last weekly profit was ${money(state.businessResults[b.id].profit)}. Future profits and dividends are uncertain. The sale window closes in ${o.expiresWeek - state.week} weeks.</p><button class="button primary full-width" data-action="confirm-opportunity" data-id="${e(id)}">Acquire offered stake</button>`,
      );
      break;
    }
    case "confirm-opportunity":
      if (update((s) => acquireOpportunity(s, id), "Stake acquired."))
        modal.close();
      break;
    case "inject-capital":
      dialog(
        `<h2>Fund ${e(BUSINESSES.find((b) => b.id === id).name)}</h2><form id="capital-form" data-id="${id}"><label class="field-label">Capital injection<input name="amount" type="number" min="1" step="0.01" required value="10000"></label><p class="muted">This money moves from personal cash into company cash. It is not immediately withdrawable. Other minority shareholders benefit in proportion to their stakes.</p><button type="submit" class="button primary full-width">Confirm capital injection</button></form>`,
      );
      break;
    case "collectible": {
      const l = state.collectibles.listings.find((l) => l.id === id);
      if (!l) break;
      const c = COLLECTIBLES.find((c) => c.id === l.collectibleId);
      dialog(
        `<div class="eyebrow">AUTHENTICATED DEALER LISTING</div><h2>${e(c.name)}</h2><p>Asking ${money(l.price)}; estimated current value ${money(state.collectibles.prices[c.id])}. Resale takes a two-week auction, may fail, and carries an 8% commission.</p><button class="button primary full-width" data-action="confirm-collectible" data-id="${e(id)}">Purchase collectible</button>`,
      );
      break;
    }
    case "confirm-collectible":
      if (update((s) => buyCollectible(s, id), "Collectible purchased."))
        modal.close();
      break;
    case "consign": {
      const c = COLLECTIBLES.find((c) => c.id === id);
      if (!c) break;
      dialog(
        `<div class="eyebrow">AUCTION CONSIGNMENT</div><h2>${e(c.name)}</h2><form id="auction-form" data-id="${id}"><label class="field-label">Minimum acceptable bid<input name="reserve" type="number" min="1" step="0.01" required value="${Math.round(state.collectibles.prices[id] * 0.9)}"></label><p class="muted">The auction takes two weeks. A reserve price is not a guaranteed buyer. If sold, 8% is deducted from the winning bid.</p><button class="button primary full-width" type="submit">Consign to auction</button></form>`,
      );
      break;
    }
    case "hire-music-manager":
      update((s) => hireMusicManager(s, id), "Music manager hired.");
      break;
    case "dismiss-music-manager":
      update(dismissMusicManager, "Management agreement ended.");
      break;
    case "career-activity":
      update((s) => careerActivity(s, id), "Career activity complete.");
      break;
    case "music-interview":
      update((s) => bookMusicInterview(s, id), "Interview booked.");
      break;
    case "career-buy":
      update(
        (s) => buyCareerEquipment(s, button.dataset.group, id),
        "Career equipment purchased.",
      );
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
      dialog(
        `<h2>Plan a date</h2><form id="date-form" data-id="${e(id)}"><label class="field-label">Date plan<select name="plan">${DATE_PLANS.map((p) => `<option value="${p.id}">${e(p.name)} · ${money(p.cost)} · ${p.hours} h</option>`).join("")}</select></label><label class="field-label">Conversation approach<select name="approach"><option value="attentive">Listen and ask questions</option><option value="shared">Explore shared interests</option><option value="ambitions">Talk about ambitions</option></select></label><p class="muted">Invite them for next week. They can decline; an accepted invitation reserves time and charges the date cost. See the plan in Weekly calendar.</p><button class="button primary full-width" type="submit">Send date invitation</button></form>`,
      );
      break;
    case "dating-app":
      update(openDatingApp);
      break;
    case "message-match":
      update((s) => messageMatch(s, id));
      break;
    case "exclusive":
      update((s) => askExclusive(s, id));
      break;
    case "move-in":
      update(moveInTogether);
      break;
    case "family-day":
      update(bookFamilyDay, "A family day is planned for next week.");
      break;
    case "cancel-appointment":
      update((s) => cancelAppointment(s, id));
      break;
    case "workplace":
      update((s) => workplaceAction(s, id));
      break;
    case "promotion":
      update(requestPromotion);
      break;
    case "accept-promotion":
      update(acceptPromotion);
      break;
    case "withdraw-pension":
      update(withdrawPension);
      break;
    case "family-issue":
      update((s) => respondFamilyIssue(s, id, button.dataset.mode));
      break;
    case "interview":
      dialog(
        `<h2>Prepare for your interview</h2><form id="interview-form" data-id="${e(id)}"><label class="field-label">Interview approach<select name="approach"><option value="prepared">Research the employer and prepare</option><option value="experience">Discuss practical experience</option><option value="honest">Discuss your strengths honestly</option></select></label><p class="muted">Uses one action and three hours. Qualifications still matter; the employer decides next week.</p><button class="button primary full-width" type="submit">Attend interview</button></form>`,
      );
      break;
    case "child-plan": {
      const c = state.family.children.find((c) => c.id === id);
      dialog(
        `<h2>${e(c.name)}’s school and interests</h2><form id="child-plan-form" data-id="${e(id)}"><label class="field-label">Activity club<select name="club">${CHILD_CLUBS.map((x) => `<option value="${x.id}" ${c.club === x.id ? "selected" : ""}>${e(x.name)} · ${money(x.cost)}/week</option>`).join("")}</select></label><label class="field-label">School choice<select name="school"><option value="state" ${c.schoolType === "state" ? "selected" : ""}>State school</option><option value="private" ${c.schoolType === "private" ? "selected" : ""}>Private school · $90/week</option></select></label><label class="field-label">Future university support<select name="support"><option value="false" ${!c.support ? "selected" : ""}>No financial commitment</option><option value="true" ${c.support ? "selected" : ""}>Offer $60/week from 18 to 21 if they choose university</option></select></label><p class="muted">They enjoy ${e(c.interest)}. Discuss their preferences; their eventual career is their choice. Organised activities add two weekly care hours before age sixteen.</p><button class="button primary full-width" type="submit">Agree on a plan</button></form>`,
      );
      break;
    }
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
  if (event.target.id === "loan-quote-form") {
    event.preventDefault();
    const data = new FormData(event.target),
      q = loanQuote(
        state,
        Number(data.get("amount")),
        Number(data.get("term")),
      );
    dialog(
      `<h2>Your personal loan quote</h2><p>${money(q.amount)} for ${q.term} weeks at ${(q.apr * 100).toFixed(2)}% fixed APR. Repayment: ${money(q.payment)}/week. Origination fee: ${money(q.fee)}; cash received: ${money(q.amount - q.fee)}. Estimated total including fee: ${money(q.total)}.</p>${q.eligible ? "<p>The bank can fund this loan. One action and two hours are required; the principal remains a debt until repaid.</p>" : `<p class="muted">Not eligible: ${q.reasons.map(e).join(". ")}.</p>`}<button class="button primary full-width" data-action="confirm-loan" data-amount="${q.amount}" data-term="${q.term}" ${!q.eligible || !state.actions ? "disabled" : ""}>Accept loan terms</button>`,
    );
    return;
  }
  const forms = {
    "legal-review": (s, data, form) =>
      reviewContract(
        s,
        form.dataset.sector,
        form.dataset.id,
        data.get("approach"),
      ),
    "savings-form": (s, data) =>
      transferSavings(
        s,
        Number(data.get("amount")) *
          (data.get("direction") === "withdraw" ? -1 : 1),
      ),
    "repay-loan-form": (s, data, form) =>
      repayLoan(s, form.dataset.id, Number(data.get("amount"))),
    "sport-negotiation-form": (s, data, form) =>
      negotiateSportOffer(
        s,
        form.dataset.sport,
        form.dataset.id,
        data.get("approach"),
      ),
    "calendar-form": (s, data) =>
      setCalendar(s, {
        mode: data.get("mode"),
        sleep: Number(data.get("sleep")),
        hours: Object.fromEntries(
          TIME_BLOCKS.map((k) => [k, Number(data.get(k))]),
        ),
      }),
    "date-form": (s, data, form) =>
      inviteDate(s, form.dataset.id, data.get("plan"), data.get("approach")),
    "interview-form": (s, data, form) =>
      attendInterview(s, form.dataset.id, data.get("approach")),
    "child-plan-form": (s, data, form) =>
      setChildPlan(
        s,
        form.dataset.id,
        data.get("club"),
        data.get("school"),
        data.get("support") === "true",
      ),
    "work-arrangement-form": (s, data) =>
      setWorkArrangement(s, data.get("mode")),
    "pension-form": (s, data) => setPension(s, Number(data.get("rate"))),
    "home-purchase-form": (s, data, form) =>
      purchaseHome(s, form.dataset.id, data.get("financing")),
    "hobby-project-form": (s, data, form) =>
      startHobbyProject(s, form.dataset.id, data.get("title")),
    "family-plan-form": (s, data, form) =>
      familyAction(s, form.dataset.mode, Object.fromEntries(data)),
    "pet-form": (s, data) => adoptPet(s, data.get("kind"), data.get("name")),
    "sport-move-form": (s, data, form) =>
      requestSportMove(s, form.dataset.sport, Object.fromEntries(data)),
    "world-move-sign-form": (s, data, form) =>
      signSportMove(
        s,
        form.dataset.sport,
        form.dataset.id,
        data.get("familyPlan"),
      ),
    "world-collab-form": (s, data, form) =>
      acceptMusicOpportunity(s, form.dataset.id, data.get("title")),
    "world-album-form": (s, data) =>
      assembleAlbum(s, {
        title: data.get("title"),
        tracks: data.getAll("track"),
      }),
    "world-tour-form": (s, data) => startMusicTour(s, Object.fromEntries(data)),
    "school-focus-form": (s, data) =>
      schoolAction(s, "focus", data.get("focus")),
    "school-club-form": (s, data) => schoolAction(s, "club", data.get("club")),
    "teen-job-form": (s, data) => schoolAction(s, "part-time", data.get("job")),
    "school-route-form": (s, data) => chooseSchoolRoute(s, data.get("route")),
    "performance-plan": (s, data, form) =>
      choosePerformancePlan(s, form.dataset.path, data.get("choice")),
    "chapter-recording-form": (s, data) =>
      startPlannedRecording(s, Object.fromEntries(data)),
    "chapter-content-form": (s, data) =>
      producePlannedContent(s, Object.fromEntries(data)),
    "chapter-family": (s, data, form) =>
      respondFamilyRequest(s, form.dataset.id, data.get("choice")),
    "chapter-public": (s, data, form) =>
      respondPublicMessage(s, form.dataset.id, data.get("choice")),
    "chapter-owner-plan": (s, data, form) =>
      setOwnerPlan(s, form.dataset.id, Object.fromEntries(data)),
    "chapter-owner-hire": (s, data, form) =>
      appointOwnerStaff(
        s,
        form.dataset.id,
        form.dataset.role,
        data.get("tier"),
      ),
    "relocation-form": (s, data) =>
      data.get("step") === "apply"
        ? applyImmigration(s, {
            country: data.get("country"),
            route: data.get("route"),
          })
        : moveCountry(s, {
            country: data.get("country"),
            city: data.get("city"),
            contact: data.get("step") === "contact",
          }),
    "barber-form": (s, data) => visitBarber(s, Object.fromEntries(data)),
    "artist-name-form": (s, data) => setArtistName(s, data.get("name")),
    "track-form": (s, data) => startTrack(s, Object.fromEntries(data)),
    "founder-fund-form": (s, data) =>
      fundFounder(s, Number(data.get("amount"))),
    "business-model-form": (s, data) =>
      setBusinessModel(s, Object.fromEntries(data)),
    "identity-profile-form": (s, data) =>
      editCharacterProfile(s, Object.fromEntries(data)),
    "identity-goal-form": (s, data) => choosePersonalGoal(s, data.get("goal")),
    "identity-routine": (s, data, form) =>
      setCareerRoutine(s, form.dataset.path, data.get("focus")),
    "debug-stats-form": (s, data) =>
      debugEdit(
        s,
        Object.fromEntries([...data].map(([k, v]) => [k, Number(v)])),
      ),
    "debug-skill-form": (s, data) => {
      const [group, id] = data.get("skill").split(":");
      return debugEdit(s, {
        [group === "career"
          ? "skills"
          : group === "specialist"
            ? "specialistSkills"
            : "hobbySkills"]: {
          [id]: Number(data.get("value")),
        },
      });
    },
    "debug-audience-form": (s, data) =>
      debugEdit(s, {
        followers: { [data.get("platform")]: Number(data.get("followers")) },
      }),
    "debug-qualification-form": (s, data) =>
      debugEdit(s, { qualification: data.get("qualification") }),
  };
  if (forms[event.target.dataset.form || event.target.id]) {
    event.preventDefault();
    const form = event.target,
      data = new FormData(form);
    if (
      update(
        (s) => forms[form.dataset.form || form.id](s, data, form),
        "Your plans are updated.",
      ) &&
      modal.open
    )
      modal.close();
    return;
  }
  if (event.target.id === "post-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) =>
          createPost(s, {
            platform: event.target.dataset.platform,
            approach: data.get("approach"),
            sponsored: event.target.dataset.sponsored === "true",
          }),
        "Content published; results arrive next week.",
      )
    )
      modal.close();
  }
  if (event.target.id === "music-project-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) => startMusicProject(s, { title: data.get("title") }),
        "Recording started; release in four weeks.",
      )
    )
      modal.close();
  }
  if (event.target.id === "character-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    const options = Object.fromEntries(
      [...data].filter(([key]) => !key.includes(":")),
    );
    options.age = Number(data.get("age") || 0);
    if (options.money === "") delete options.money;
    else if (options.money !== undefined) options.money = Number(options.money);
    options.personality = Object.fromEntries(
      [...data]
        .filter(([key]) => key.startsWith("personality:"))
        .map(([key, value]) => [key.slice(12), Number(value)]),
    );
    for (const [prefix, field] of [
      ["skill:", "skills"],
      ["specialist:", "specialistSkills"],
    ]) {
      const values = Object.fromEntries(
        [...data]
          .filter(([key, value]) => key.startsWith(prefix) && value !== "")
          .map(([key, value]) => [key.slice(prefix.length), Number(value)]),
      );
      if (Object.keys(values).length) options[field] = values;
    }
    try {
      beginLife(createCustomCharacter(state, options));
    } catch (error) {
      notify(error.message);
    }
  }
  if (event.target.id === "found-company-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) => foundCompany(s, Object.fromEntries(data)),
        "Company launched.",
      )
    )
      modal.close();
  }
  if (event.target.id === "acquisition-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) =>
          submitAcquisitionOffer(
            s,
            event.target.dataset.id,
            Number(data.get("amount")),
            Number(data.get("stake")),
          ),
        "Offer submitted. Cash is committed until the decision.",
      )
    )
      modal.close();
  }
  if (event.target.id === "capital-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) =>
          injectCapital(s, event.target.dataset.id, Number(data.get("amount"))),
        "Company funded.",
      )
    )
      modal.close();
  }
  if (event.target.id === "auction-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (
      update(
        (s) =>
          consignCollectible(
            s,
            event.target.dataset.id,
            Number(data.get("reserve")),
          ),
        "Auction consignment confirmed.",
      )
    )
      modal.close();
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
  if (event.target.id === "shop-query") {
    shopFilters.query = event.target.value;
    const start = event.target.selectionStart;
    render();
    const search = document.querySelector("#shop-query");
    search.focus();
    search.setSelectionRange(start, start);
  }
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
  if (event.target.id === "daily-routine") {
    update((s) => setRoutine(s, event.target.value), "Daily routine updated.");
    return;
  }
  if (event.target.id === "parenting-focus") {
    update(
      (s) => familyAction(s, "parenting", { style: event.target.value }),
      "Parenting focus updated.",
    );
    return;
  }
  if (["football-position", "football-training"].includes(event.target.id))
    update(
      (s) =>
        configureFootball(s, {
          position: document.querySelector("#football-position").value,
          training: document.querySelector("#football-training").value,
        }),
      "Football plan updated.",
    );
  if (event.target.matches("[data-sport-training]"))
    update(
      (s) =>
        setSportTraining(
          s,
          event.target.dataset.sportTraining,
          event.target.value,
        ),
      "Training plan updated.",
    );
  if (["social-niche", "social-privacy"].includes(event.target.id))
    update(
      (s) =>
        configureSocial(s, {
          niche: document.querySelector("#social-niche").value,
          privacy: document.querySelector("#social-privacy").value,
        }),
      "Public identity updated.",
    );
  if (["music-role", "music-genre"].includes(event.target.id))
    update(
      (s) =>
        configureMusic(s, {
          role: document.querySelector("#music-role").value,
          genre: document.querySelector("#music-genre").value,
        }),
      "Music direction updated.",
    );
  if (["shop-category", "shop-sort", "shop-owned"].includes(event.target.id)) {
    shopFilters = {
      ...shopFilters,
      category: document.querySelector("#shop-category").value,
      sort: document.querySelector("#shop-sort").value,
      owned: document.querySelector("#shop-owned").checked,
    };
    render();
  }

  if (event.target.matches("[data-business-strategy]"))
    update(
      (s) =>
        setBusinessStrategy(
          s,
          event.target.dataset.businessStrategy,
          event.target.value,
        ),
      "Management strategy updated.",
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
        focusedSport = null;
        focusedOwnership = null;
        inboxArchived = false;
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

document.addEventListener("input", (event) => {
  const form = event.target.closest(
    "#character-form, #identity-profile-form, #barber-form",
  );
  if (!form) return;
  const data = new FormData(form);
  const preview = form.querySelector(".character-portrait");
  if (preview)
    preview.outerHTML = characterPortrait({
      ...state.characterLife.profile,
      ...Object.fromEntries(data),
    });
  const name = form.querySelector("[data-creator-name]");
  if (name) name.textContent = data.get("name") || "Your character";
});

function fillCityOptions(form, kind) {
  const code = form.querySelector(
    kind === "creator" ? "#creator-country" : "#relocation-country",
  )?.value;
  const search =
    form
      .querySelector(
        kind === "creator" ? "#creator-city-search" : "#relocation-city-search",
      )
      ?.value.toLocaleLowerCase() || "";
  const select = form.querySelector(
    kind === "creator" ? 'select[name="birthplace"]' : "#relocation-city",
  );
  if (!select || !code) return;
  const names = (CITY_CATALOGUE[code] || []).filter((c) =>
    c.toLocaleLowerCase().includes(search),
  );
  select.innerHTML = names
    .slice(0, 200)
    .map((c) => `<option>${e(c)}</option>`)
    .join("");
  const description = form.querySelector("[data-immigration-rule]");
  if (description)
    description.textContent = `${country(code).name}: confirm residence permission before moving. Citizenship remains separate. ${names.length.toLocaleString()} cities match your search.`;
}
document.addEventListener("input", (event) => {
  if (event.target.id === "creator-city-search")
    fillCityOptions(event.target.form, "creator");
  if (event.target.id === "relocation-city-search")
    fillCityOptions(event.target.form, "relocation");
});
document.addEventListener("change", (event) => {
  if (event.target.id === "creator-country")
    fillCityOptions(event.target.form, "creator");
  if (event.target.id === "relocation-country")
    fillCityOptions(event.target.form, "relocation");
  if (
    event.target.name === "birthplace" &&
    event.target.closest("#character-form")
  ) {
    const form = event.target.form,
      select = form.querySelector("#creator-country");
    if (select && !CITY_CATALOGUE[select.value].includes(event.target.value))
      select.value = placeCountry(event.target.value);
  }
  if (
    event.target.name === "sector" &&
    event.target.closest("#found-company-form")
  ) {
    const d = INDUSTRIES.find((i) => i.name === event.target.value);
    event.target.form.querySelector("[data-startup-cost]").textContent =
      `${money(d.capital)} startup capital · age eighteen and 30 business skill. Capital moves into the company's cash account.`;
  }
});
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    event.ctrlKey ||
    event.altKey ||
    event.metaKey ||
    event.shiftKey ||
    state.ended
  )
    return;
  if (modal.open) {
    if (!event.target.closest('input,textarea,[contenteditable="true"]'))
      event.preventDefault();
    return;
  }
  if (
    event.target.closest(
      'input,textarea,select,button,a,[contenteditable="true"]',
    )
  )
    return;
  event.preventDefault();
  document.querySelector('[data-action="next-week"]')?.click();
});
