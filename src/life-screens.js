import { routineScreen } from "./identity-screens.js";
import { seasonScreen } from "./finance-season-screens.js";
import { contractsScreen, milestonesScreen } from "./depth-screens.js";
import { sportWorldScreen, musicWorldScreen } from "./career-world-screens.js";
import { careerSupportScreen } from "./career-support.js";
import {
  careerEquipmentScreen,
  equipmentRequirements,
} from "./career-equipment.js";
import {
  SPORTS,
  FOOTBALL_TRAINING,
  FOOTBALL_POSITIONS,
  PLATFORMS,
  EXPERIENCES,
  MUSIC_ROLES,
  musicLabel,
  totalFollowers,
  fameLabel,
  availableCash,
  age,
  SHOP,
  footballCosts,
  sportCosts,
} from "./engine.js";
const count = (n) => Math.round(n).toLocaleString("en-US");
export function sportsScreen(s, u, focusedSport = null) {
  const { title, panelHeading, tag, icon, meter, money, e } = u,
    f = s.football;
  const invitations = (offers, sport) =>
    offers
      .filter((o) => o.status === "offered")
      .map(
        (o) =>
          `<div class="application-row"><div><strong>${e(o.club)}</strong><small>${e(o.kind.replaceAll("-", " "))}${o.kind === "contract" ? ` · ${money(o.pay)}/wk gross base income · ${o.terms?.weeks || o.duration || 104} weeks` : ""} · respond in ${o.expiresWeek - s.week} weeks</small></div><div class="inline-actions"><button class="button primary" data-action="sport-offer" data-sport="${sport}" data-id="${e(o.id)}">Review invitation</button><button class="text-button" data-action="decline-sport" data-sport="${sport}" data-id="${e(o.id)}">Decline</button></div></div>`,
      )
      .join("");
  const introduction = `${title("PRACTICE, COMPETITION & DEVELOPMENT", "Every athlete starts somewhere.", "School teams, local clubs, academies, and scouting. A professional contract is an outcome of development.")}<div class="info-banner">${icon("football")}<span>${s.school.enrolled ? `${age(s) < 12 ? "Primary" : "Secondary"} school · grade ${Math.round(s.school.grade)} / 100 · graduation at age 18. ${age(s) < 12 ? "Your family covers basic needs and local sports fees; your allowance starts at six." : "Guardians cover housing; you receive $25 allowance and pay $15 personal costs weekly."}` : "You can continue local sport alongside work or study. Youth academy places have age limits; a professional offer is never guaranteed."} Weekly local-sport fees: ${money(footballCosts(s) + sportCosts(s))}.</span></div>`;
  const cards = {};
  cards.football = `<section class="panel sport-panel" data-sport-card="football">${panelHeading("Football", f.club || "Start with school or your local club.", tag(f.stage, "green"))}<div class="sport-summary"><span class="feature-icon green">${icon("football")}</span><div><h2>${e(f.club || "The football path")}</h2><p>${e(f.position)} · ${f.matches} matches · ${f.goals} goals</p></div></div><div class="life-metrics"><div><span>Football ability</span><strong>${Math.round(f.ability)} / 100</strong>${meter(f.ability, "green")}</div><div><span>Coach trust</span><strong>${Math.round(f.coachTrust)} / 100</strong>${meter(f.coachTrust, "blue")}</div><div><span>Sport reputation</span><strong>${Math.round(f.reputation)} / 100</strong>${meter(f.reputation, "purple")}</div></div><div class="path-steps">${["School / local", "Academy", "Development squad", "Professional contract"].map((x) => `<span>${x}</span>`).join("")}</div>${
    f.stage === "none" || f.stage === "retired"
      ? `<p class="muted">Young players begin through school. Adults can join grassroots football; late professional recruitment is uncommon.</p><button class="button primary" data-action="join-football">${age(s) < 18 ? "Join school football" : "Join local football"}</button>`
      : `<div class="form-row"><label class="field-label">Playing position<select id="football-position">${FOOTBALL_POSITIONS.map((p) => `<option ${p === f.position ? "selected" : ""}>${p}</option>`).join("")}</select></label><label class="field-label">Football training<select id="football-training">${Object.entries(
          FOOTBALL_TRAINING,
        )
          .map(
            ([id, name]) =>
              `<option value="${id}" ${id === f.training ? "selected" : ""}>${name}</option>`,
          )
          .join(
            "",
          )}</select></label></div><p class="muted">${f.injuryWeeks ? `Injured: ${f.injuryWeeks} recovery weeks remain.` : f.lastMatch ? `Last match: ${f.lastMatch.rating}/100 performance; ${f.lastMatch.goals} goal(s).` : "League matches follow the thirty-eight-round fixture calendar."} ${f.contract?.expiresWeek ? `Contract ends in ${f.contract.expiresWeek - s.week} weeks.` : ""}</p><p class="muted">${f.stage === "academy" ? `${f.academyWeeks} academy development weeks.` : `${f.schoolWeeks + f.grassrootsWeeks} school / grassroots development weeks.`} Scouts review sustained development every 13 weeks. Trials take two weeks and can end without a place. Injury, age, discipline, ability, and time in competition all matter.</p>${f.trial ? `<div class="info-banner">Assessment at ${e(f.trial.club)} · decision in ${Math.max(0, f.trial.decisionWeek - s.week)} weeks</div>` : ""}<div class="application-list">${invitations(f.offers, "football") || '<p class="muted">No open football invitations. Keep playing and developing.</p>'}</div><button class="text-button" data-action="leave-sport" data-sport="football">Step away from football</button>`
  }</section>`;
  for (const d of SPORTS) {
    const p = s.sports[d.id];
    cards[d.id] =
      `<section class="panel sport-panel" data-sport-card="${d.id}">${panelHeading(d.name, p.club || d.start, tag(p.stage, "orange"))}<div class="life-metrics"><div><span>Sport ability</span><strong>${Math.round(p.ability)} / 100</strong>${meter(p.ability, "orange")}</div><div><span>Results</span><strong>${p.wins} / ${p.events}</strong><small>Wins / outings</small></div><div><span>Development</span><strong>${p.experience} weeks</strong><small>${Math.round(p.reputation)} sport reputation</small></div></div><p class="muted">${d.id === "racing" ? "Local karting → driver development → F4 → F3 → F2 → F1. National, international, and top-level licences gate competition; driver seats arrive as offers." : d.id === "basketball" ? "School / local basketball → academy → development squad → professional leagues. Team invitations depend on skill and sustained competition." : "Local tennis → academy → junior circuit → professional tour. Sponsorship supplies base income; tournament results can earn additional prizes."}</p>${
        ["none", "retired"].includes(p.stage)
          ? `<button class="button primary" data-action="join-sport" data-id="${d.id}">Start ${d.name.toLowerCase()}</button>`
          : `<label class="field-label">${d.name} training<select data-sport-training="${d.id}">${Object.entries(
              FOOTBALL_TRAINING,
            )
              .map(
                ([id, name]) =>
                  `<option value="${id}" ${id === p.training ? "selected" : ""}>${name}</option>`,
              )
              .join(
                "",
              )}</select></label><p class="muted">${p.injuryWeeks ? `${p.injuryWeeks} injury recovery weeks remain.` : p.lastResult ? `Last outing: ${p.lastResult.score}/100 · ${p.lastResult.won ? "win" : "no win"}.` : "Events run during the active season."} ${p.contract?.expiresWeek ? `Contract: ${p.contract.expiresWeek - s.week} weeks remaining.` : ""}</p>${p.trial ? `<p class="opportunity-note">Development assessment: ${p.trial.decisionWeek - s.week} weeks until the decision.</p>` : ""}<div class="application-list">${invitations(p.offers, d.id) || '<p class="muted">No open invitations. Development takes time.</p>'}</div><button class="text-button" data-action="leave-sport" data-sport="${d.id}">Step away from ${d.name.toLowerCase()}</button>`
      }</section>`;
  }
  const sports = [{ id: "football", name: "Football" }, ...SPORTS];
  const preferred =
    [focusedSport, s.career, s.aspiration].find((id) =>
      sports.some((sport) => sport.id === id),
    ) ||
    sports.find(
      ({ id }) =>
        !["none", "retired"].includes(
          (id === "football" ? s.football : s.sports[id]).stage,
        ),
    )?.id ||
    "football";
  const navigation = `<nav class="category-sections" aria-label="Sport & development sections">${sports.map(({ id, name }) => `<button class="section-shortcut ${id === preferred ? "active" : ""}" data-action="focus-sport" data-id="${id}" aria-controls="sport-section-${id}" ${id === preferred ? 'aria-current="true"' : ""}>${e(name)}</button>`).join("")}</nav>`;
  const ordered = [
    sports.find(({ id }) => id === preferred),
    ...sports.filter(({ id }) => id !== preferred),
  ];
  return (
    introduction +
    navigation +
    ordered
      .map(
        ({ id, name }) =>
          `<div class="sport-section" id="sport-section-${id}" role="region" aria-label="${e(name)} development">${cards[id]}${routineScreen(s, u, id)}${id === "football" ? careerSupportScreen(s, u, "football", false) : ""}${careerEquipmentScreen(s, u, id)}${sportWorldScreen(s, u, id)}${contractsScreen(s, u, id)}${milestonesScreen(s, u, id)}${seasonScreen(s, u, id)}</div>`,
      )
      .join("")
  );
}
export function socialScreen(s, u) {
  const { title, panelHeading, tag, icon, meter, money, e } = u,
    m = s.social;
  return `${title("CREATE, CONNECT & BUILD AN AUDIENCE", "Find your voice.", "Influencing, long-form video, short-form stories, and streaming take craft, time, and consistency.")}<div class="finance-summary"><section class="panel"><span class="eyebrow">FOLLOWERS ACROSS ACCOUNTS</span><h2>${count(totalFollowers(s))}</h2><p>Account totals can include the same person.</p></section><section class="panel"><span class="eyebrow">PUBLIC RECOGNITION</span><h2>${e(fameLabel(s))}</h2>${meter(s.fame.recognition, "purple")}<p>${s.fame.recognition.toFixed(1)} / 100 recognition · ${Math.round(s.fame.reputation)} / 100 reputation</p></section><section class="panel"><span class="eyebrow">LAST WEEK’S CREATOR INCOME</span><h2>${money(m.weeklyIncome, 2)}</h2><p>${money(m.totalIncome, 2)} earned in total</p></section></div><section class="panel">${panelHeading("Your public identity", "Authentic posts build trust; clickbait risks reputation.", tag(`${Math.round(m.contentSkill)} content skill`, "blue"))}<div class="form-row"><label class="field-label">Content niche<select id="social-niche">${["lifestyle", "football", "business", "gaming", "music"].map((n) => `<option value="${n}" ${n === m.niche ? "selected" : ""}>${n[0].toUpperCase() + n.slice(1)}</option>`).join("")}</select></label><label class="field-label">Account privacy<select id="social-privacy"><option value="public" ${m.privacy === "public" ? "selected" : ""}>Public — discoverable content</option><option value="private" ${m.privacy === "private" ? "selected" : ""}>Private — existing followers only</option></select></label></div><p class="muted">Each post uses one free-time action, production cash, and energy. Produce at most two posts a week. Results arrive next week. Better equipment helps quality; expensive possessions do not buy followers. Public accounts with 1,000 followers and recent posts can earn simulated advertising income. Inactivity loses followers; viral posts are rare.</p></section><div class="career-grid two-columns">${PLATFORMS.map(
    (d) => {
      const p = m.profiles[d.id];
      return `<section class="panel creator-card" data-platform="${d.id}"><span class="feature-icon blue">${icon(d.icon)}</span><span class="eyebrow">${e(d.kind)}</span><h2>${d.name}</h2><div class="life-metrics"><div><span>Followers</span><strong>${count(p.followers)}</strong></div><div><span>Engagement</span><strong>${p.engagement.toFixed(1)}%</strong></div></div>${p.active ? `<p class="muted">${p.lastPostWeek < 0 ? "No content delivered yet." : `Last delivered ${s.week - p.lastPostWeek} week(s) ago.`}</p><button class="button primary full-width" data-action="post" data-id="${d.id}" ${!s.actions || m.posts.filter((p) => p.createdWeek === s.week).length >= 2 ? "disabled" : ""}>${d.id === "stream" ? "Plan a stream" : d.id === "tube" ? "Produce a video" : "Create a post"} ${icon("arrow")}</button>` : `<p class="muted">Start at zero followers. Requires age 13+ and a phone or computer.</p><button class="button secondary full-width" data-action="open-account" data-id="${d.id}" ${!s.actions || age(s) < 13 ? "disabled" : ""}>Open account</button>`}</section>${contractsScreen(s, u, "creator")}`;
    },
  ).join(
    "",
  )}</div><section class="panel">${panelHeading("Brand collaborations", "A fee is earned after labelled public content is delivered.")}<div class="application-list">${
    m.offers
      .filter((o) => o.status === "offered")
      .map(
        (o) =>
          `<div class="application-row"><div><strong>${e(o.brand)} · ${money(o.fee)}</strong><small>${e(PLATFORMS.find((p) => p.id === o.platform).name)} · offer expires in ${o.expiresWeek - s.week} weeks</small></div><button class="button primary" data-action="sponsor" data-id="${e(o.id)}">Review collaboration</button></div>`,
      )
      .join("") ||
    '<p class="muted">No open brand offers. Brands look for 5,000 followers on a recent public account and strong reputation; an offer is not guaranteed.</p>'
  }${m.deals
    .slice()
    .reverse()
    .slice(0, 5)
    .map(
      (d) =>
        `<div class="application-row"><div><strong>${e(d.brand)}</strong><small>${e(d.status)} · ${money(d.fee)}${d.status === "active" ? ` · deliver within ${d.deadlineWeek - s.week} weeks` : ""}</small></div>${d.status === "active" ? `<button class="button secondary" data-action="post" data-id="${d.platform}" data-sponsored="true">Create sponsored post</button>` : tag(d.status, d.status === "completed" ? "green" : "orange")}</div>`,
    )
    .join(
      "",
    )}</div><p class="muted">Private accounts do not grow through discovery or earn advertising and sponsor income. Missed deliverables reduce reputation. Sponsored content needs at least 35 production quality.</p></section><section class="panel">${panelHeading("Your recent content", "Reach and follower conversion vary from post to post.")}<div class="application-list">${
    m.posts
      .slice()
      .reverse()
      .slice(0, 12)
      .map(
        (p) =>
          `<div class="application-row"><div><strong>${e(PLATFORMS.find((d) => d.id === p.platform).name)} · ${e(p.approach)}${p.dealId ? " · sponsored" : ""}</strong><small>Week ${p.createdWeek + 1} · ${p.quality}/100 production quality · ${p.status === "pending" ? "results next week" : `${count(p.views)} views · +${count(p.gained)} followers`}</small></div>${tag(p.status, "blue")}</div>`,
      )
      .join("") ||
    '<p class="muted">Your first post starts here. An ordinary post can reach very few people.</p>'
  }</div></section>${routineScreen(s, u, "creator")}${careerEquipmentScreen(s, u, "creator")}`;
}
export function musicScreen(s, u) {
  const { title, panelHeading, tag, meter, money, e } = u,
    m = s.music;
  return `${title("PRACTICE, RELEASES & LIVE PERFORMANCE", "Make something people remember.", "Start as a hobby, develop your craft, and build a catalogue before chasing an audience.")}<section class="panel">${panelHeading("Your music studio", "Singing, rapping, and production develop through practice.", tag(musicLabel(s), "purple"))}<div class="form-row"><label class="field-label">Music role<select id="music-role">${Object.entries(
    MUSIC_ROLES,
  )
    .map(
      ([id, label]) =>
        `<option value="${id}" ${id === m.role ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><label class="field-label">Music genre<select id="music-genre">${["Pop", "Hip-hop", "Electronic", "Indie", "R&B"].map((g) => `<option ${g === m.genre ? "selected" : ""}>${g}</option>`).join("")}</select></label></div><div class="life-metrics">${Object.entries(
    m.skills,
  )
    .map(
      ([key, value]) =>
        `<div><span>${key[0].toUpperCase() + key.slice(1)}</span><strong>${Math.round(value)} / 100</strong>${meter(value, "purple")}</div>`,
    )
    .join(
      "",
    )}</div><p class="muted">${m.sessions} practice sessions · ${count(m.fans)} music fans · ${money(m.weeklyIncome, 2)} gross music receipts last week · ${money(m.totalIncome, 2)} gross earned in total. Practice costs an action and energy. A release requires eight sessions, recording equipment, $150, and four weeks. Streams earn simulated royalties of $0.002 each; most early releases earn little.</p><div class="inline-actions"><button class="button primary" data-action="music-practice" ${!s.actions ? "disabled" : ""}>Practise your craft</button><button class="button secondary" data-action="record-music" ${!s.actions || !m.active || m.sessions < 8 || m.projects.some((p) => p.status === "recording") ? "disabled" : ""}>Record a release</button></div></section>${routineScreen(s, u, "music")}${careerEquipmentScreen(s, u, "music")}${careerSupportScreen(s, u, "music")}${musicWorldScreen(s, u)}${contractsScreen(s, u, "music")}${milestonesScreen(s, u, "music")}<section class="panel">${panelHeading("Recording & releases", "A catalogue takes time; publishing does not guarantee a hit.")}<div class="application-list">${m.projects
    .filter((p) => p.status === "recording")
    .map(
      (p) =>
        `<div class="application-row"><div><strong>${e(p.title)}</strong><small>Recording · releases in ${p.releaseWeek - s.week} weeks</small></div>${tag("In production", "purple")}</div>`,
    )
    .join("")}${
    m.releases
      .slice()
      .reverse()
      .map(
        (r) =>
          `<div class="application-row"><div><strong>${e(r.title)}</strong><small>${e(r.genre)} · ${e(MUSIC_ROLES[r.role])} · ${r.quality}/100 quality · ${count(r.totalStreams)} streams</small></div><strong>${money(r.totalRoyalties, 2)} earned</strong></div>`,
      )
      .join("") ||
    '<p class="muted">No released music yet. Choose a direction, practise, and record your first track.</p>'
  }</div></section><section class="panel">${panelHeading("Performances & label interest", "Invitations depend on craft, output, age, and audience.")}<div class="application-list">${
    m.gigs
      .slice()
      .reverse()
      .slice(0, 6)
      .map(
        (g) =>
          `<div class="application-row"><div><strong>${e(g.venue)} · ${money(g.fee)}</strong><small>${e(g.status)}${g.status === "offered" ? ` · closes in ${g.expiresWeek - s.week} weeks` : ""}</small></div>${g.status === "offered" ? `<button class="button primary" data-action="music-gig" data-id="${e(g.id)}">Review gig</button>` : tag(g.status, "blue")}</div>`,
      )
      .join("") ||
    '<p class="muted">No gig invitations yet. Local organisers look for at least twelve practice sessions and 30 skill.</p>'
  }${m.labelOffers
    .filter((o) => o.status === "offered")
    .map(
      (o) =>
        `<div class="application-row"><div><strong>${e(o.name)}</strong><small>${money(o.advance)} recoupable advance · offer expires in ${o.expiresWeek - s.week} weeks</small></div><button class="button primary" data-action="label-offer" data-id="${e(o.id)}">Review label terms</button></div>`,
    )
    .join(
      "",
    )}</div>${m.label ? `<div class="info-banner">${e(m.label.name)} · 50% royalty share · ${money(m.label.unrecouped, 2)} advance still to recoup · ${m.label.expiresWeek - s.week} contract weeks remaining.</div>` : '<p class="muted">Label interest needs substantial practice, three releases, strong craft, and public recognition. A label advance is repaid from your 50% royalty share before you receive more royalty cash.</p>'}</section>`;
}
export function shoppingScreen(
  s,
  u,
  { category = "All", query = "", sort = "catalogue", owned = false } = {},
) {
  const { title, panelHeading, tag, icon, money, e } = u;
  const catalogue = SHOP.filter((i) => i.category !== "Ownership"),
    categories = ["All", ...new Set(catalogue.map((i) => i.category))];
  let products = catalogue.filter(
    (i) =>
      (category === "All" || i.category === category) &&
      (!owned || s.inventory.includes(i.id)) &&
      `${i.name} ${i.description} ${i.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "low") products.sort((a, b) => a.price - b.price);
  if (sort === "high") products.sort((a, b) => b.price - a.price);
  return `${title("POSSESSIONS, EXPERIENCES & EVERYDAY LIFE", "More ways to make it yours.", "Build a wardrobe, a studio, a home, and memories. Equipment supports habits; upkeep keeps costing money.", tag(`${catalogue.length} possessions · ${EXPERIENCES.length} experiences`, "blue"))}<section class="panel shop-controls"><div class="form-row"><label class="field-label">Shopping category<select id="shop-category">${categories.map((c) => `<option ${c === category ? "selected" : ""}>${e(c)}</option>`).join("")}</select></label><label class="field-label">Search shopping<input id="shop-query" type="search" value="${e(query)}" placeholder="Find a phone, guitar, home…"></label><label class="field-label">Sort shopping<select id="shop-sort"><option value="catalogue">Catalogue order</option><option value="low" ${sort === "low" ? "selected" : ""}>Price: low to high</option><option value="high" ${sort === "high" ? "selected" : ""}>Price: high to low</option></select></label></div><label class="check-label"><input id="shop-owned" type="checkbox" ${owned ? "checked" : ""}> Show owned possessions only</label><p class="muted">${products.length} results · ${money(availableCash(s))} uncommitted cash · ${money(catalogue.filter((i) => s.inventory.includes(i.id)).reduce((n, i) => n + i.upkeep, 0))} weekly upkeep. You own ${s.inventory.length} possessions.</p></section><div class="shop-grid">${
    products
      .map((i) => {
        const held = s.inventory.includes(i.id),
          min =
            i.minAge ||
            (["Garage", "Property", "Travel"].includes(i.category) ? 18 : 12),
          young = age(s) < min,
          requirements = equipmentRequirements(s, i.id);
        return `<section class="panel shop-card"><div class="product-scene ${i.color}">${icon(i.icon)}<span>${e(i.category.toUpperCase())}</span>${held ? tag("Owned", i.color) : ""}</div><div class="product-copy"><span class="eyebrow">${e(i.category)}</span><h2>${e(i.name)}</h2><p>${e(i.description)}</p>${!held && requirements.length ? `<p class="muted">Requires: ${e(requirements.join(", "))}</p>` : ""}<div class="product-price"><strong>${money(i.price)}</strong><span>${i.upkeep ? money(i.upkeep) + "/wk upkeep" : "No upkeep"}</span></div><button class="button ${held ? "secondary" : "primary"} full-width" data-action="${held ? "sell-item" : "buy"}" data-id="${i.id}" ${!held && (young || requirements.length || availableCash(s) < i.price) ? "disabled" : ""}>${held ? `Sell for ${money(i.price * 0.8)}` : young ? `Available at age ${min}` : requirements.length ? "Requirements not met" : availableCash(s) < i.price ? "Keep building your savings" : "Make it yours"} ${icon(held ? "arrow" : "bag")}</button></div></section>`;
      })
      .join("") || '<p class="muted">No possessions match these filters.</p>'
  }</div><section class="panel experiences-panel">${panelHeading("Spend time, make memories", "Repeatable experiences use cash and one free-time action.")}<div class="education-grid">${EXPERIENCES.map(
    (x) => {
      const remaining = Math.max(
          0,
          (s.experienceCooldowns[x.id] || 0) - s.week,
        ),
        blocked =
          age(s) < (x.minAge || 12) ||
          remaining ||
          availableCash(s) < x.price ||
          !s.actions ||
          (x.football &&
            !["school", "academy", "community"].includes(s.football.stage));
      return `<div class="education-card"><h3>${e(x.name)}</h3><p>${e(x.description)}</p><strong>${money(x.price)}</strong><small>${remaining ? `Available again in ${remaining} weeks` : `Available every ${x.cooldown} week(s)`}</small><button class="button secondary full-width" data-action="experience" data-id="${x.id}" ${blocked ? "disabled" : ""}>Plan experience</button></div>`;
    },
  ).join("")}</div></section>`;
}
