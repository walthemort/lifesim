import {
  COUNTRIES,
  country,
  placeCountry,
  validPlace,
  immigrationRule,
} from "./geography.js";
import { CLOTHING, CRIMES, RACING_TIERS, industry } from "./expansion-data.js";
import { creatorAvailable } from "./identity.js";
import { availableCash, rng, jobDefinition } from "./world.js";
import { spendTime } from "./calendar.js";
import { enhanceSportOffer, syncSeason } from "./seasons.js";
import { releaseSportAgreement } from "./contracts.js";
import { startMusicProject } from "./music.js";
import { gameDate } from "./dates.js";
const age = (s) => s.startAge + Math.floor(s.week / 52),
  clamp = (n) => Math.max(0, Math.min(100, n));
const note = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
const acting = (s, hours = 2, minAge = 12) => {
  if (s.ended || s.event)
    throw new Error("Resolve your current life choice first.");
  if (s.globalLife?.crime.prison)
    throw new Error("This activity is unavailable while serving a sentence.");
  if (age(s) < minAge || !s.actions)
    throw new Error(`Requires age ${minAge}+ and a free-time action.`);
  const next = structuredClone(s);
  spendTime(next, hours, "Personal appointments");
  next.actions--;
  return next;
};
export function initializeExpansion(
  s,
  { countryCode = null, legacy = false } = {},
) {
  const code = countryCode || placeCountry(s.city) || "GB";
  s.globalLife = {
    seed: (s.seed ^ 0x639184b7) >>> 0,
    serial: 0,
    lastWeek: s.week,
    birthCountry:
      countryCode || placeCountry(s.characterLife.profile.birthplace) || code,
    residence: { country: code, city: s.city, sinceWeek: s.week },
    citizenships: [
      legacy
        ? COUNTRIES.find(
            (c) => c.nationality === s.characterLife.profile.nationality,
          )?.code || code
        : code,
    ],
    permits: [],
    applications: [],
    moves: [],
    language: 50,
    crime: {
      record: [],
      prison: null,
      heat: 0,
      rehabilitation: 0,
      attempts: 0,
    },
    wardrobe: [],
    wearing: null,
    artistName: s.name,
    tracks: [],
    racing: {
      tier:
        RACING_TIERS.find((t) => t.job === s.sports.racing.contract?.jobId)
          ?.id || "kart3",
      history: [],
      offers: [],
      affiliate: null,
      seats: Array.from({ length: 10 }, (_, i) => ({
        team: i,
        opensWeek: (Math.floor(s.week / 52) + 1 + (i % 3)) * 52,
      })),
      lastYear: -1,
    },
    companyPlan: s.company
      ? {
          model: "service",
          price: "standard",
          quality: 50,
          customers: 10,
          research: 0,
          lastAction: null,
        }
      : null,
    marketAlerts: [],
    readAlerts: [],
    marketWeek: s.week,
  };
  if (!legacy) s.characterLife.profile.nationality = country(code).nationality;
}
export function immigrationEligibility(s, code, route) {
  const c = country(code),
    g = s.globalLife,
    missing = [];
  if (
    !c ||
    (code === g.residence.country && !g.permits.some((p) => p.country === code))
  )
    missing.push("a different destination");
  if (age(s) < 18) missing.push("age eighteen");
  if (g.crime.prison) missing.push("release from custody");
  const records = g.crime.record,
    rule = immigrationRule(code);
  if (
    records.some((r) => r.severity >= 3) &&
    (rule.strict || route === "citizenship")
  )
    missing.push("serious convictions require a separate admissibility review");
  if (records.some((r) => s.week - r.week < 260))
    missing.push("five years without a new conviction");
  if (route === "work" && !s.employment)
    missing.push("an employment contract for the work route");
  if (route === "study" && !s.education.active)
    missing.push("enrolment for the student route");
  if (route === "investor" && availableCash(s) < 250000)
    missing.push("$250,000 investment funds");
  if (route === "citizenship") {
    if (g.residence.country !== code)
      missing.push("residence in the destination");
    if (rule.years === null)
      missing.push("ordinary naturalisation is unavailable");
    else if (s.week - g.residence.sinceWeek < rule.years * 52)
      missing.push(`${rule.years} years of residence`);
    if (g.language < 60) missing.push("60 language and civic knowledge");
  }
  if (!["work", "study", "investor", "citizenship"].includes(route))
    missing.push("a valid application route");
  // Citizenship applications concern your current home, unlike visas.
  if (route === "citizenship") {
    const i = missing.indexOf("a different destination");
    if (i >= 0) missing.splice(i, 1);
  }
  return missing;
}
export function applyImmigration(state, { country: code, route }) {
  const missing = immigrationEligibility(state, code, route);
  if (missing.length)
    throw new Error(`Application requires: ${missing.join("; ")}.`);
  const g = state.globalLife;
  if (g.citizenships.includes(code))
    throw new Error(
      "You already hold this citizenship; move using your passport.",
    );
  if (
    g.applications.some(
      (a) => a.country === code && ["pending", "approved"].includes(a.status),
    )
  )
    throw new Error("An application or approval is already active.");
  const rule = immigrationRule(code),
    fee = route === "citizenship" ? rule.fee : Math.round(rule.fee * 0.5);
  if (availableCash(state) < fee)
    throw new Error(`The non-refundable application fee is $${fee}.`);
  const s = acting(state, 3, 18);
  s.money -= fee;
  s.globalLife.applications.push({
    id: `migration:${s.globalLife.serial++}`,
    country: code,
    route,
    fee,
    submittedWeek: s.week,
    decisionWeek: s.week + rule.wait,
    status: "pending",
    reason: null,
  });
  s.globalLife.applications = s.globalLife.applications.slice(-40);
  note(
    s,
    `Applied for ${country(code).name} ${route === "citizenship" ? "citizenship" : route + " residence permission"}. Review expected ${gameDate(s.week + rule.wait)}; approval is not guaranteed.`,
  );
  return s;
}
export function studyLanguage(state) {
  const s = acting(state, 3, 12);
  if (availableCash(s) < 25) throw new Error("Language classes cost $25.");
  s.money -= 25;
  s.globalLife.language = clamp(s.globalLife.language + 2);
  return s;
}
export function moveCountry(state, { country: code, city, contact = false }) {
  if (!validPlace(code, city))
    throw new Error("Choose a city in the destination country.");
  const g = state.globalLife;
  const eu = country(code)?.eu && g.citizenships.some((c) => country(c)?.eu);
  const allowed =
    g.citizenships.includes(code) ||
    eu ||
    g.permits.some((p) => p.country === code && p.endsWeek > state.week) ||
    g.applications.some(
      (a) =>
        a.country === code &&
        a.route !== "citizenship" &&
        a.status === "approved",
    );
  if (contact && !creatorAvailable(state))
    throw new Error("The relocation contact requires Pro or Debug.");
  if (!allowed && !contact)
    throw new Error(
      "Obtain residence permission before moving. Citizenship is not required.",
    );
  if (
    contact &&
    immigrationEligibility(
      state,
      code,
      availableCash(state) >= 250000
        ? "investor"
        : state.employment
          ? "work"
          : state.education.active
            ? "study"
            : "work",
    ).length
  )
    throw new Error(
      "Your contact cannot bypass funding, visa qualifications or criminal-record checks.",
    );
  const partner =
    state.family.partnerId &&
    state.connections.profiles[state.family.partnerId];
  if (partner && partner.trust < 50)
    throw new Error("Your partner has not agreed to move the household.");
  const fee = contact ? 2500 : 1000;
  if (availableCash(state) < fee + 2000)
    throw new Error(
      `Reserve the $${fee} moving/contact fee and a $2,000 housing buffer.`,
    );
  const s = acting(state, 4, 18),
    n = s.globalLife;
  s.money -= fee;
  const previous = n.residence;
  if (previous.country !== code) {
    n.language = 25;
    n.residence = { country: code, city, sinceWeek: s.week };
  } else n.residence.city = city;
  s.city = city;
  if (partner && partner.city !== city) {
    const profile = s.connections.profiles[s.family.partnerId];
    s.careerWorld.relocation = {
      partnerId: s.family.partnerId,
      previousJob: profile.job,
      previousPay: profile.weeklyPay,
      decisionWeek: s.week + 8,
    };
    profile.city = city;
    profile.job = "Relocating";
    profile.weeklyPay = 0;
  }
  if (
    !n.citizenships.includes(code) &&
    !eu &&
    !n.permits.some((p) => p.country === code && p.endsWeek > s.week)
  )
    n.permits.push({
      country: code,
      route: contact
        ? "contact"
        : n.applications.find(
            (a) => a.country === code && a.status === "approved",
          ).route,
      startsWeek: s.week,
      endsWeek: s.week + 312,
    });
  n.moves.push({
    from: previous.country,
    to: code,
    city,
    week: s.week,
    cost: fee,
  });
  n.moves = n.moves.slice(-40);
  for (const a of n.applications)
    if (
      a.country === code &&
      a.status === "approved" &&
      a.route !== "citizenship"
    )
      a.status = "used";
  // Housing is local. Keep owned assets; relocation returns a rental deposit through existing cash accounting.
  if (s.housing.rental) {
    s.money += s.housing.deposit || 0;
    s.housing.rental = null;
    s.housing.deposit = 0;
  }
  s.housing.residence = null;
  for (const p of Object.values(s.careerWorld.sports))
    p.travel = p.assignmentCity !== city;
  note(
    s,
    `Moved to ${city}, ${country(code).name}. Birthplace and existing citizenship are unchanged.`,
    "milestone",
  );
  return s;
}
export function buyClothing(state, id) {
  const item = CLOTHING.find((i) => i.id === id);
  if (!item || state.globalLife.wardrobe.includes(id))
    throw new Error("Choose clothing you do not already own.");
  if (availableCash(state) < item.price)
    throw new Error("Not enough cash for this outfit.");
  const s = acting(state, 1);
  s.money -= item.price;
  s.globalLife.wardrobe.push(id);
  return wearClothing(s, id);
}
export function wearClothing(state, id) {
  const item = CLOTHING.find((i) => i.id === id);
  if (!item || !state.globalLife.wardrobe.includes(id))
    throw new Error("Purchase this outfit first.");
  const s = structuredClone(state);
  s.globalLife.wearing = id;
  s.characterLife.profile.outfit = item.outfit;
  s.characterLife.profile.garment = item.garment;
  return s;
}
export function visitBarber(state, { hairstyle, hair, tier = "local" }) {
  if (!["local", "salon", "atelier"].includes(tier))
    throw new Error("Choose a barber.");
  const choices = [
    "Short",
    "Long",
    "Curly",
    "Shaved",
    "Buzz cut",
    "Fade",
    "Side part",
    "Ponytail",
    "Bob",
    "Braids",
    "Dreadlocks",
    "Afro",
    "Space buns",
    "Wolf cut",
    "Pompadour",
  ];
  if (
    !choices.includes(hairstyle) ||
    !["Black", "Brown", "Blonde", "Red", "Grey"].includes(hair)
  )
    throw new Error("Choose a haircut and colour.");
  if (
    [
      "Braids",
      "Dreadlocks",
      "Afro",
      "Space buns",
      "Wolf cut",
      "Pompadour",
    ].includes(hairstyle) &&
    !creatorAvailable(state)
  )
    throw new Error("This premium hairstyle requires Pro or Debug.");
  const price = { local: 20, salon: 75, atelier: 250 }[tier];
  if (availableCash(state) < price)
    throw new Error("Not enough cash for this appointment.");
  const s = acting(state, 2);
  s.money -= price;
  s.characterLife.profile.hairstyle = hairstyle;
  s.characterLife.profile.hair = hair;
  note(s, `Visited the ${tier} barber for $${price}.`);
  return s;
}
export function commitCrime(state, id) {
  const d = CRIMES[id];
  if (!d) throw new Error("Choose a crime scenario.");
  const s = acting(state, 3, d.age),
    c = s.globalLife.crime;
  c.attempts++;
  c.heat = clamp(c.heat + 15);
  if (rng(s.globalLife) < Math.min(0.98, d.risk + c.heat * 0.002)) {
    const juvenile = age(s) < 18,
      sentence = juvenile ? Math.ceil(d.sentence * 0.5) : d.sentence;
    c.record.push({
      id: `conviction:${s.globalLife.serial++}`,
      crime: id,
      severity: d.severity,
      week: s.week,
      sentence,
      fine: d.fine,
      juvenile,
    });
    c.record = c.record.slice(-40);
    s.money -= d.fine;
    c.prison = {
      startsWeek: s.week,
      releaseWeek: s.week + sentence,
      crime: id,
    };
    s.actions = 0;
    s.event = null;
    s.employment = null;
    s.career = s.company ? "business" : "unemployed";
    for (const path of ["football", "racing", "basketball", "tennis"]) {
      releaseSportAgreement(s, path, { automatic: true });
      const p = path === "football" ? s.football : s.sports[path];
      p.contract = null;
      p.stage = path === "football" ? "community" : "local";
      p.trial = null;
      for (const o of p.offers)
        if (o.status === "offered") o.status = "declined";
    }
    s.fame.reputation = clamp(s.fame.reputation - 10 * d.severity);
    note(
      s,
      `Convicted of ${d.name.toLowerCase()}: $${d.fine} fine, ${sentence} weeks in custody. Expected release ${gameDate(c.prison.releaseWeek)}. Your employment ends.`,
      "warning",
    );
  } else {
    s.money += d.gain;
    note(
      s,
      `The crime yielded $${d.gain}, but exposure and future arrest risk increased.`,
      "warning",
    );
  }
  return s;
}
export function prisonActivity(state, kind) {
  if (!state.globalLife.crime.prison || state.ended)
    throw new Error("Prison activities are available only in custody.");
  if (!["education", "rehabilitation", "exercise"].includes(kind))
    throw new Error("Choose a prison activity.");
  const s = structuredClone(state),
    c = s.globalLife.crime;
  if (c.activityWeek === s.week)
    throw new Error("One supervised activity per week.");
  c.activityWeek = s.week;
  if (kind === "education")
    s.skills.knowledge = clamp(s.skills.knowledge + 0.3);
  if (kind === "exercise") s.health = clamp(s.health + 0.5);
  if (kind === "rehabilitation") c.rehabilitation = clamp(c.rehabilitation + 1);
  return s;
}
export function advanceCustody(s, markets) {
  s.week++;
  s.actions = 0;
  s.event = null;
  const g = s.globalLife,
    c = g.crime;
  for (const m of markets) {
    s.market[m.id] = Math.max(
      1,
      Math.round(s.market[m.id] * (1 + (rng(g) * 2 - 1) * m.volatility) * 100) /
        100,
    );
    s.marketHistory[m.id].push(s.market[m.id]);
    s.marketHistory[m.id] = s.marketHistory[m.id].slice(-24);
  }
  s.happiness = clamp(s.happiness - 0.3);
  c.heat = Math.max(0, c.heat - 0.3);
  if (s.week >= c.prison.releaseWeek) {
    c.prison = null;
    s.actions = 3;
    note(
      s,
      "Released from custody. Your record remains; rebuild relationships, qualifications and employment.",
      "milestone",
    );
  }
  if (age(s) >= 90) {
    s.ended = true;
    c.prison = null;
  }
  return s;
}
export function setArtistName(state, name) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 40)
    throw new Error("Choose an artist name of 1–40 characters.");
  const s = acting(state, 1, 6);
  s.globalLife.artistName = name.trim();
  return s;
}
export function startTrack(
  state,
  { title, beat = "produce", theme = "Personal", ambition = "standard" },
) {
  if (
    !["produce", "lease", "exclusive"].includes(beat) ||
    ![
      "Personal",
      "Storytelling",
      "Party",
      "Love",
      "Social commentary",
      "Instrumental",
    ].includes(theme) ||
    !["lean", "standard", "ambitious"].includes(ambition) ||
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 60
  )
    throw new Error("Choose a valid track title, beat and creative direction.");
  if (!state.music.active || state.music.sessions < 8)
    throw new Error(
      "Choose a music role and complete eight practice sessions.",
    );
  if (
    state.music.projects.length >= 20 &&
    state.music.projects.every((p) => p.status !== "released")
  )
    throw new Error(
      "Release existing recordings before starting more projects.",
    );
  if (
    state.globalLife.tracks.some(
      (t) => !["ready", "scheduled", "released"].includes(t.stage),
    )
  )
    throw new Error("Finish your active track first.");
  if (
    beat === "produce" &&
    !["laptop", "workstation"].some((id) => state.inventory.includes(id))
  )
    throw new Error(
      "Producing a beat requires a computer; you can license one instead.",
    );
  const cost = { produce: 0, lease: 100, exclusive: 600 }[beat];
  if (availableCash(state) < cost + 150)
    throw new Error("Reserve beat costs and $150 for recording/mixing.");
  const s = acting(state, 2, 6);
  s.money -= cost;
  s.globalLife.tracks.push({
    id: `track:${s.globalLife.serial++}`,
    title: title.trim(),
    beat,
    theme,
    ambition,
    stage: beat === "produce" ? "beat" : "lyrics",
    sessions: 0,
    beatQuality: beat === "produce" ? 0 : beat === "exclusive" ? 65 : 45,
    lyricQuality: 0,
    vocalQuality: 0,
    projectId: null,
    cost,
    createdWeek: s.week,
  });
  s.globalLife.tracks = s.globalLife.tracks.slice(-40);
  return s;
}
export function workTrack(state, id) {
  const t = state.globalLife.tracks.find((t) => t.id === id);
  if (!t || !["beat", "lyrics", "vocals"].includes(t.stage))
    throw new Error("Choose a track in production.");
  let s = acting(state, 3, 6),
    p = s.globalLife.tracks.find((t) => t.id === id);
  if (s.energy < 10) throw new Error("Rest before the next studio session.");
  s.energy = clamp(s.energy - 4);
  p.sessions++;
  const required =
    p.ambition === "ambitious" ? 4 : p.ambition === "lean" ? 1 : 2;
  if (p.sessions < required) return s;
  p.sessions = 0;
  if (p.stage === "beat") {
    p.beatQuality = Math.round(
      clamp(
        s.music.skills.production +
          (rng(s.globalLife) * 12 - 6) +
          (required - 1) * 2,
      ),
    );
    p.stage = "lyrics";
  } else if (p.stage === "lyrics") {
    p.lyricQuality =
      p.theme === "Instrumental"
        ? p.beatQuality
        : Math.round(
            clamp(
              s.music.skills.lyrics +
                (rng(s.globalLife) * 12 - 6) +
                (required - 1) * 2,
            ),
          );
    p.stage = "vocals";
  } else {
    p.vocalQuality = Math.round(
      clamp(
        (s.music.role === "producer"
          ? s.music.skills.production
          : s.music.skills.vocals) +
          (rng(s.globalLife) * 12 - 6) +
          (required - 1) * 2,
      ),
    );
    // The base production API enforces equipment, cash and the four-week mixing calendar. Its action was already paid above.
    s.calendar.spent -= 3;
    s.calendar.actions.pop();
    s.actions++;
    s = startMusicProject(s, { title: p.title });
    p = s.globalLife.tracks.find((t) => t.id === id);
    const project = s.music.projects.at(-1);
    project.manualRelease = true;
    project.quality = Math.round(
      clamp(
        (p.beatQuality + p.lyricQuality + p.vocalQuality + project.quality) / 4,
      ),
    );
    p.projectId = project.id;
    p.stage = "mixing";
    p.cost += 150;
  }
  return s;
}
export function releaseReadyRecording(state, id) {
  const p = state.music.projects.find(
    (p) => p.id === id && p.status === "ready",
  );
  if (!p) throw new Error("Choose a finished unreleased recording.");
  if (state.careerWorld.music.albums.some((a) => a.tracks.includes(id)))
    throw new Error("This track is already on an album.");
  const s = acting(state, 1, 6),
    project = s.music.projects.find((p) => p.id === id);
  project.status = "recording";
  project.manualRelease = false;
  project.releaseWeek = s.week + 1;
  return s;
}
export function releaseTrack(state, id) {
  const t = state.globalLife.tracks.find((t) => t.id === id),
    project = state.music.projects.find((p) => p.id === t?.projectId);
  if (!t || t.stage !== "ready" || project?.status !== "ready")
    throw new Error(
      "Finish production and mixing before releasing this track.",
    );
  if (state.careerWorld.music.albums.some((a) => a.tracks.includes(project.id)))
    throw new Error("This track is already scheduled on an album.");
  const s = acting(state, 1, 6),
    p = s.music.projects.find((p) => p.id === project.id);
  p.status = "recording";
  p.manualRelease = false;
  p.releaseWeek = s.week + 1;
  s.globalLife.tracks.find((t) => t.id === id).stage = "scheduled";
  note(
    s,
    `Scheduled “${p.title}” by ${s.globalLife.artistName} for ${gameDate(p.releaseWeek)}.`,
  );
  return s;
}
export function fundFounder(state, amount) {
  if (
    !state.company ||
    !Number.isFinite(amount) ||
    amount < 100 ||
    amount > 1e9 ||
    Math.abs(Math.round(amount * 100) - amount * 100) > 0.000001
  )
    throw new Error(
      "Choose a founder capital contribution of $100–$1 billion.",
    );
  if (availableCash(state) < amount || state.company.value + amount > 1e12)
    throw new Error(
      "This contribution exceeds available personal cash or company limits.",
    );
  const s = acting(state, 2, 18);
  s.money = Math.round((s.money - amount) * 100) / 100;
  s.company.cash = Math.round((s.company.cash + amount) * 100) / 100;
  s.company.value += amount;
  note(
    s,
    `Contributed $${amount.toLocaleString()} to ${s.company.name}. Personal cash was transferred into company equity.`,
  );
  return s;
}
export function businessDevelopment(state, kind) {
  if (!state.company || !["research", "quality", "marketing"].includes(kind))
    throw new Error("Choose an action for your company.");
  if (state.globalLife.companyPlan.lastAction === state.week)
    throw new Error("One business development action per week.");
  const cost = { research: 100, quality: 300, marketing: 200 }[kind];
  if (state.company.cash < cost)
    throw new Error("Company cash must cover this development.");
  const s = acting(state, 4, 18),
    p = s.globalLife.companyPlan,
    c = s.company;
  c.cash -= cost;
  p.lastAction = s.week;
  if (kind === "research") {
    p.research++;
    s.skills.business = clamp(s.skills.business + 0.25);
  }
  if (kind === "quality") {
    p.quality = clamp(p.quality + 2);
    c.costs = Math.round(c.costs * 1.001 * 100) / 100;
  }
  if (kind === "marketing") {
    const gain = Math.floor(rng(s.globalLife) * 5);
    p.customers += gain;
    c.revenue = Math.round(c.revenue * (1 + gain * 0.002) * 100) / 100;
    note(
      s,
      `Campaign reached ${gain} new customers. $200 company cash spent; customer acquisition is uncertain.`,
    );
  }
  return s;
}
export function setBusinessModel(state, { model, price }) {
  if (
    !state.company ||
    ![
      "service",
      "retail",
      "subscription",
      "manufacturing",
      "licensing",
    ].includes(model) ||
    !["budget", "standard", "premium"].includes(price)
  )
    throw new Error("Choose a business model and pricing policy.");
  const s = acting(state, 2, 18);
  s.globalLife.companyPlan.model = model;
  s.globalLife.companyPlan.price = price;
  return s;
}
function racingAdvance(s) {
  const r = s.globalLife.racing,
    p = s.sports.racing;
  if (["none", "retired"].includes(p.stage)) return;
  if (p.contract) {
    const tier = RACING_TIERS.find((t) => t.job === p.contract.jobId);
    if (tier) {
      if (tier.id === "f1" && r.tier !== "f1") {
        const seat = r.seats.find((t) => t.opensWeek <= s.week + 26);
        if (seat) seat.opensWeek = s.week + 156;
      }
      r.tier = tier.id;
    }
  }
  if (
    p.contract &&
    p.contract.expiresWeek - s.week <= 26 &&
    p.contract.expiresWeek > s.week &&
    s.week % 13 === 0 &&
    !p.offers.some((o) => o.status === "offered") &&
    p.ability >= 50 &&
    rng(s.globalLife) < 0.7
  ) {
    const o = {
      id: `racing:renewal:${s.week}`,
      kind: "contract",
      club: p.club,
      jobId: p.contract.jobId,
      pay: s.employment?.weeklyPay || jobDefinition(p.contract.jobId).pay,
      status: "offered",
      expiresWeek: s.week + 8,
    };
    enhanceSportOffer(s, "racing", o);
    p.offers.push(o);
    p.offers = p.offers.slice(-12);
  }
  const season = s.seasons.racing,
    year = Math.floor(s.week / 52);
  if (s.week % 52 < 46 || r.lastYear === year) return;
  r.lastYear = year;
  const ranked = [...season.table].sort(
      (a, b) => b.points - a.points || b.wins - a.wins || a.id - b.id,
    ),
    own = ranked.find((t) => t.id === 0),
    position = ranked.findIndex((t) => t.id === 0) + 1;
  if (!own || own.played < 12) return;
  const entry = {
    year,
    tier: r.tier,
    position,
    points: own.points,
    wins: own.wins,
    starts: own.played,
  };
  r.history.push(entry);
  r.history = r.history.slice(-20);
  const i = RACING_TIERS.findIndex((t) => t.id === r.tier),
    target = RACING_TIERS[i + 1];
  if (!target) return;
  const qualified =
    position === 1 || (position <= 3 && p.ability >= target.ability + 8);
  if (
    !qualified ||
    age(s) < target.age ||
    p.ability < target.ability ||
    p.injuryWeeks
  )
    return;
  if (target.licence && !s.education.completed.includes(target.licence)) {
    note(
      s,
      `Strong ${RACING_TIERS[i].name} results, but ${target.name} recruitment needs the ${target.licence}.`,
    );
    return;
  }
  if (
    target.id === "f1" &&
    (s.progress.racing.weeks < 312 ||
      !r.seats.some((t) => t.opensWeek <= s.week + 26) ||
      rng(s.globalLife) > 0.25)
  ) {
    note(
      s,
      "Strong Formula 2 results attracted scouts, but no Formula 1 seat is available. Incumbent contracts and team confidence matter.",
    );
    return;
  }
  if (target.job) {
    const o = {
      id: `racing:ladder:${s.week}`,
      kind: "contract",
      club: jobDefinition(target.job).employer,
      jobId: target.job,
      pay: jobDefinition(target.job).pay,
      status: "offered",
      expiresWeek: s.week + 8,
    };
    enhanceSportOffer(s, "racing", o);
    p.offers.push(o);
    p.offers = p.offers.slice(-12);
  } else {
    r.offers.push({
      id: `kart:${s.week}`,
      tier: target.id,
      expiresWeek: s.week + 8,
      status: "offered",
    });
    r.offers = r.offers.slice(-12);
  }
  if (i >= 3 && position === 1 && !r.affiliate && rng(s.globalLife) < 0.45) {
    r.affiliate = {
      name: "Meridian Grand Prix Junior Academy",
      sinceWeek: s.week,
      reviewWeek: s.week + 104,
    };
    note(
      s,
      "A junior affiliate programme invited you. Mentoring improves access; affiliation does not promise an F1 seat.",
      "milestone",
    );
  }
  note(
    s,
    `${RACING_TIERS[i].name}: finished ${position}. An offer for ${target.name} is available; review the seat and funding.`,
    "milestone",
  );
}
export function acceptKartOffer(state, id) {
  const o = state.globalLife.racing.offers.find(
      (o) =>
        o.id === id && o.status === "offered" && o.expiresWeek > state.week,
    ),
    target = RACING_TIERS.find((t) => t.id === o?.tier);
  if (!o || !target) throw new Error("This karting seat is unavailable.");
  if (age(state) < target.age || state.sports.racing.ability < target.ability)
    throw new Error("This karting series has age and ability requirements.");
  const s = acting(state, 2, 6);
  s.globalLife.racing.tier = o.tier;
  s.globalLife.racing.offers.find((x) => x.id === id).status = "accepted";
  s.sports.racing.club = target.name;
  s.sports.racing.stage = "academy";
  syncSeason(s, "racing");
  return s;
}
export function advanceExpansion(s, markets) {
  const g = s.globalLife;
  if (g.lastWeek === s.week) return;
  g.lastWeek = s.week;
  g.crime.heat = Math.max(0, g.crime.heat - 0.25);
  for (const a of g.applications)
    if (a.status === "pending" && a.decisionWeek <= s.week) {
      const missing = immigrationEligibility(s, a.country, a.route);
      if (missing.length || rng(g) > 0.88) {
        a.status = "rejected";
        a.reason =
          missing.join("; ") ||
          "The reviewing authority declined this application.";
      } else {
        a.status = "approved";
        if (a.route === "citizenship") {
          g.citizenships.push(a.country);
          s.characterLife.profile.nationality = country(a.country).nationality;
          a.status = "used";
        } else if (a.country === g.residence.country) {
          g.permits.push({
            country: a.country,
            route: a.route,
            startsWeek: s.week,
            endsWeek: s.week + 312,
          });
          a.status = "used";
        }
        note(
          s,
          `${country(a.country).name}: ${a.route} application approved. ${a.route === "citizenship" ? "Citizenship is now recorded." : "You can confirm a move with your residence permission."}`,
          "milestone",
        );
      }
    }
  for (const a of g.applications)
    if (a.status === "approved" && s.week > a.decisionWeek + 52) {
      a.status = "rejected";
      a.reason = "Unused residence approval expired.";
    }
  const code = g.residence.country;
  const eu = country(code).eu && g.citizenships.some((c) => country(c).eu);
  if (
    !g.citizenships.includes(code) &&
    !eu &&
    g.permits.some((p) => p.country === code) &&
    !g.permits.some((p) => p.country === code && p.endsWeek > s.week)
  ) {
    const home = g.citizenships[0],
      city = country(home).capital;
    s.city = city;
    g.residence = { country: home, city, sinceWeek: s.week };
    s.money -= 1000;
    note(
      s,
      "Residence permission expired without renewal. Your household returned to a country of citizenship; $1,000 relocation costs were charged.",
      "warning",
    );
  }
  for (const t of g.tracks) {
    const p = s.music.projects.find((p) => p.id === t.projectId);
    if (p?.status === "ready" && t.stage === "mixing") t.stage = "ready";
    if (p?.status === "released") t.stage = "released";
  }
  for (const o of g.racing.offers)
    if (o.status === "offered" && o.expiresWeek <= s.week) o.status = "expired";
  racingAdvance(s);
  g.marketAlerts = [];
  for (const m of markets) {
    const h = s.marketHistory[m.id],
      previous = h.at(-2),
      change = previous ? (h.at(-1) / previous - 1) * 100 : 0;
    if (s.holdings[m.id] > 0 && Math.abs(change) >= 3)
      g.marketAlerts.push({
        id: `market:${m.id}:${s.week}`,
        market: m.id,
        symbol: m.symbol,
        change: Math.round(change * 100) / 100,
        week: s.week,
      });
  }
  g.marketWeek = s.week;
}
export function validateExpansion(s) {
  const g = s.globalLife,
    fail = () => {
      throw new Error(
        "Invalid global identity, relocation, retail, studio or crime data.",
      );
    },
    obj = (x) => x && typeof x === "object" && !Array.isArray(x),
    num = (x, min = 0, max = 1e12) =>
      Number.isFinite(x) && x >= min && x <= max,
    int = (x, min = 0, max = 1e12) => num(x, min, max) && Number.isInteger(x),
    text = (x, max = 100) =>
      typeof x === "string" && x.trim().length > 0 && x.length <= max,
    arr = (x, max) => Array.isArray(x) && x.length <= max;
  if (
    !obj(g) ||
    !country(g.birthCountry) ||
    !obj(g.residence) ||
    !validPlace(g.residence.country, g.residence.city) ||
    s.city !== g.residence.city ||
    !int(g.residence.sinceWeek, 0, s.week) ||
    !arr(g.citizenships, 10) ||
    !g.citizenships.length ||
    g.citizenships.some((c) => !country(c)) ||
    new Set(g.citizenships).size !== g.citizenships.length ||
    !num(g.language, 0, 100) ||
    !int(g.seed, 0, 4294967295) ||
    !int(g.serial) ||
    !int(g.lastWeek, 0, s.week)
  )
    fail();
  if (
    !arr(g.permits, 40) ||
    g.permits.some(
      (p) =>
        !country(p.country) ||
        !["work", "study", "investor", "contact"].includes(p.route) ||
        !int(p.startsWeek, 0, s.week) ||
        !int(p.endsWeek, p.startsWeek + 1),
    ) ||
    !arr(g.moves, 40) ||
    g.moves.some(
      (m) =>
        !country(m.from) ||
        !validPlace(m.to, m.city) ||
        !int(m.week, 0, s.week) ||
        !num(m.cost),
    )
  )
    fail();
  if (
    !arr(g.applications, 40) ||
    g.applications.some(
      (a) =>
        !text(a.id) ||
        !country(a.country) ||
        !["work", "study", "investor", "citizenship"].includes(a.route) ||
        !["pending", "approved", "rejected", "used"].includes(a.status) ||
        !int(a.submittedWeek, 0, s.week) ||
        !int(a.decisionWeek, a.submittedWeek + 1) ||
        !num(a.fee) ||
        (a.reason !== null && !text(a.reason, 1000)),
    )
  )
    fail();
  const c = g.crime;
  if (
    !obj(c) ||
    !arr(c.record, 40) ||
    !int(c.attempts) ||
    !num(c.heat, 0, 100) ||
    !num(c.rehabilitation, 0, 100) ||
    c.record.some(
      (r) =>
        !text(r.id) ||
        !CRIMES[r.crime] ||
        r.severity !== CRIMES[r.crime].severity ||
        !int(r.week, 0, s.week) ||
        !int(r.sentence, 1) ||
        r.fine !== CRIMES[r.crime].fine ||
        typeof r.juvenile !== "boolean",
    ) ||
    (c.prison !== null &&
      (!obj(c.prison) ||
        !CRIMES[c.prison.crime] ||
        !int(c.prison.startsWeek, 0, s.week) ||
        !int(c.prison.releaseWeek, s.week + 1) ||
        s.actions !== 0 ||
        s.employment))
  )
    fail();
  if (
    !arr(g.wardrobe, CLOTHING.length) ||
    new Set(g.wardrobe).size !== g.wardrobe.length ||
    g.wardrobe.some((id) => !CLOTHING.some((i) => i.id === id)) ||
    (g.wearing !== null && !g.wardrobe.includes(g.wearing)) ||
    !text(g.artistName, 40) ||
    !arr(g.tracks, 40)
  )
    fail();
  if (
    g.tracks.some(
      (t) =>
        !text(t.id) ||
        !text(t.title, 60) ||
        !["produce", "lease", "exclusive"].includes(t.beat) ||
        ![
          "Personal",
          "Storytelling",
          "Party",
          "Love",
          "Social commentary",
          "Instrumental",
        ].includes(t.theme) ||
        !["lean", "standard", "ambitious"].includes(t.ambition) ||
        ![
          "beat",
          "lyrics",
          "vocals",
          "mixing",
          "ready",
          "scheduled",
          "released",
        ].includes(t.stage) ||
        !int(t.sessions, 0, 3) ||
        !num(t.beatQuality, 0, 100) ||
        !num(t.lyricQuality, 0, 100) ||
        !num(t.vocalQuality, 0, 100) ||
        !num(t.cost) ||
        !int(t.createdWeek, 0, s.week) ||
        (t.projectId !== null &&
          !s.music.projects.some((p) => p.id === t.projectId)),
    )
  )
    fail();
  const r = g.racing;
  if (
    !obj(r) ||
    !RACING_TIERS.some((t) => t.id === r.tier) ||
    !arr(r.history, 20) ||
    r.history.some(
      (h) =>
        !int(h.year) ||
        !RACING_TIERS.some((t) => t.id === h.tier) ||
        !int(h.position, 1, 20) ||
        !int(h.points, 0, 550) ||
        !int(h.starts, 0, 22) ||
        !int(h.wins, 0, h.starts),
    ) ||
    !arr(r.offers, 12) ||
    r.offers.some(
      (o) =>
        !text(o.id) ||
        !["kart2", "kart1"].includes(o.tier) ||
        !int(o.expiresWeek) ||
        !["offered", "accepted", "expired"].includes(o.status),
    ) ||
    !arr(r.seats, 10) ||
    r.seats.length !== 10 ||
    r.seats.some((t) => !int(t.team, 0, 9) || !int(t.opensWeek)) ||
    !int(r.lastYear, -1)
  )
    fail();
  if (
    g.companyPlan !== null &&
    (!obj(g.companyPlan) ||
      !s.company ||
      ![
        "service",
        "retail",
        "subscription",
        "manufacturing",
        "licensing",
      ].includes(g.companyPlan.model) ||
      !["budget", "standard", "premium"].includes(g.companyPlan.price) ||
      !num(g.companyPlan.quality, 0, 100) ||
      !int(g.companyPlan.customers) ||
      !int(g.companyPlan.research) ||
      (g.companyPlan.lastAction !== null &&
        !int(g.companyPlan.lastAction, 0, s.week)))
  )
    fail();
  if (
    !arr(g.marketAlerts, 30) ||
    g.marketAlerts.some(
      (a) =>
        !text(a.id) ||
        !text(a.symbol) ||
        !Number.isFinite(a.change) ||
        !int(a.week, 0, s.week),
    ) ||
    !arr(g.readAlerts, 80) ||
    g.readAlerts.some((a) => !text(a))
  )
    fail();
}
