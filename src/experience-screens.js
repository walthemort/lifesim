import { DEBUG_SPECIALIST_SKILLS } from "./debug.js";
import {
  SOCIAL_MANAGERS,
  MUSIC_CAMPAIGNS,
  musicChart,
  footballMoveOptions,
} from "./experience.js";
import { gameDate } from "./dates.js";
import { characterPortrait } from "./portraits.js";
import { HOBBIES } from "./everyday.js";
const age = (s) =>
    s.startAge + Math.floor((s.week - (s.ageEpochWeek || 0)) / 52),
  count = (n) => Math.round(n).toLocaleString("en-US");
const off = (s) =>
  !s.actions || s.event || s.ended || s.globalLife.crime.prison
    ? "disabled"
    : "";
function hash(text) {
  return [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17);
}
export function coverArt(title, genre = "") {
  const hue = hash(title) % 360;
  return `<span class="record-art" aria-hidden="true" style="--cover-hue:${hue}"><svg viewBox="0 0 100 100"><circle cx="${30 + (hue % 40)}" cy="36" r="29" fill="#fff" opacity=".18"/><path d="M-10 85Q30 15 57 73T115 30M-10 97Q30 27 57 85T115 42" fill="none" stroke="#fff" stroke-width="7" opacity=".55"/></svg><span>${title.slice(0, 1).replace(/[<>&"']/g, "")}</span></span>`;
}
const songRow = (r, i, s, u) =>
  `<article class="song-row"><span class="song-rank">${i + 1}</span>${coverArt(r.title)}<div class="song-copy"><strong>${u.e(r.title)}</strong><small>${u.e(r.artist || s.globalLife.artistName)} · ${u.e(r.genre || "Single")}</small><span>${count(r.totalStreams)} streams · ${r.quality}/100 rating</span></div><div class="song-number"><strong>${count(r.weeklyStreams)}</strong><small>this week</small></div></article>`;
export function streamingScreen(s, u) {
  const m = s.music,
    h = s.experience.music.history,
    streams = m.releases.reduce((n, r) => n + r.weeklyStreams, 0),
    total = m.releases.reduce((n, r) => n + r.totalStreams, 0),
    top = [...m.releases].sort((a, b) => b.totalStreams - a.totalStreams),
    chart = musicChart(s);
  const points =
    h.length > 1
      ? h
          .map(
            (x, i) =>
              `${12 + (i / (h.length - 1)) * 276},${86 - (x.streams / Math.max(1, ...h.map((x) => x.streams))) * 62}`,
          )
          .join(" ")
      : "";
  return `${u.title("YOUR MUSIC, IN FOCUS", "Your artist space.", "Your sound, your catalogue, your audience.")}<section class="artist-hero" data-music-overview>${characterPortrait({ ...s.characterLife.profile, visualAge: age(s) })}<div><span class="eyebrow">${m.fans >= 1000 ? "ESTABLISHED ARTIST" : "INDEPENDENT ARTIST"}</span><h2>${u.e(s.globalLife.artistName)}</h2><p>${u.e(m.genre)} · ${count(m.fans)} fans</p><span>${m.releases.length} releases · ${count(total)} lifetime streams</span></div></section><section class="panel" data-music-overview><div class="music-totals"><div><span>Weekly streams</span><strong>${count(streams)}</strong></div><div><span>Catalogue receipts</span><strong>${u.money(m.totalIncome, 2)}</strong></div></div><h2>Audience over time</h2>${h.length > 1 ? `<svg class="stream-chart" viewBox="0 0 300 100" role="img" aria-label="Weekly streams over the last ${h.length} weeks"><path d="M12 86H288M12 54H288M12 22H288" stroke="#ffffff12"/><polyline points="${points}" fill="none" stroke="#77ddad" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${h.map((x, i) => `<circle cx="${12 + (i / (h.length - 1)) * 276}" cy="${86 - (x.streams / Math.max(1, ...h.map((x) => x.streams))) * 62}" r="3" fill="#77ddad"><title>${gameDate(x.week, s)}: ${count(x.streams)} streams</title></circle>`).join("")}</svg><div class="chart-labels"><span>${gameDate(h[0].week, s)}</span><span>${gameDate(h.at(-1).week, s)}</span></div>` : '<p class="muted">Release music and advance time to build your streaming history.</p>'}</section><section class="panel" data-music-overview><h2>Popular releases</h2>${
    top
      .slice(0, 5)
      .map((r, i) => songRow(r, i, s, u))
      .join("") ||
    '<p class="muted">Your first release will appear here. Make a track in Studio, then choose when to release it.</p>'
  }</section><section class="panel" data-music-chart>${u.panelHeading("The weekly chart", "A fictional music chart ranked by actual weekly streams in this world.")}<div class="song-list">${chart.map((r, i) => `<article class="song-row ${r.own ? "your-release" : ""}"><span class="song-rank">${i + 1}</span>${coverArt(r.title)}<div class="song-copy"><strong>${u.e(r.title)}</strong><small>${u.e(r.artist)}${r.own ? " · Your release" : ""}</small></div><div class="song-number"><strong>${count(r.streams)}</strong><small>streams</small></div></article>`).join("")}</div></section><section class="panel" data-music-catalogue>${u.panelHeading("Your discography", "Every release has one catalogue entry; repackaging tracks into an album does not duplicate royalties.")}<div class="discography">${
    m.releases
      .slice()
      .reverse()
      .map(
        (r, i) =>
          `<div>${songRow(r, i, s, u)}<p class="release-detail">${gameDate(r.releasedWeek, s)} · ${u.money(r.totalRoyalties, 2)} catalogue royalties</p></div>`,
      )
      .join("") ||
    '<p class="muted">Your released singles and album tracks will appear here.</p>'
  }</div></section>`;
}
export function promotionScreen(s, u) {
  const eligible = s.music.projects.filter(
    (p) =>
      p.status !== "released" &&
      !s.experience.music.campaigns.some((c) => c.projectId === p.id),
  );
  return `<section class="panel" data-music-promotion>${u.panelHeading("Build anticipation", "Promote a recording before release. Reach and pre-saves depend on your campaign, the track and your team.")}<form id="music-rollout-form"><label class="field-label">Unreleased recording<select name="projectId" required>${eligible.map((p) => `<option value="${u.e(p.id)}">${u.e(p.title)} · ${u.e(p.status)}</option>`).join("") || '<option value="">Finish the beat, lyrics and recording first</option>'}</select></label><label class="field-label">Rollout<select name="kind">${Object.entries(
    MUSIC_CAMPAIGNS,
  )
    .map(
      ([id, d]) =>
        `<option value="${id}">${d.name} · ${u.money(d.cost)}</option>`,
    )
    .join(
      "",
    )}</select></label><p class="muted">A four-week campaign uses one action and two hours, with its full budget paid upfront. Pre-saves convert into some release-week listening once, after you actually release the recording. You still choose the release date; promotion does not guarantee a hit.</p><button class="button primary" ${!eligible.length || off(s) ? "disabled" : ""}>Plan pre-release promotion</button></form><div class="application-list">${s.experience.music.campaigns.map((c) => `<article class="rollout-card"><span class="tag purple">${u.e(c.status)}</span><h3>${u.e(s.music.projects.find((p) => p.id === c.projectId)?.title || s.music.releases.find((r) => r.id === c.projectId)?.title || "Archived recording")}</h3><p>${MUSIC_CAMPAIGNS[c.kind].name} · ${u.money(c.cost)} spent</p><div class="music-totals"><div><span>People reached</span><strong>${count(c.reach)}</strong></div><div><span>Pre-saves</span><strong>${count(c.preSaves)}</strong></div></div><small>Campaign through ${gameDate(c.endsWeek, s)}. ${c.usedWeek === null ? "Waiting for your release." : `Released ${gameDate(c.usedWeek, s)}.`}</small></article>`).join("")}</div></section>`;
}
export function socialManagementScreen(s, u) {
  const m = s.experience.manager;
  return `<section class="panel" data-social-management>${u.panelHeading("Your social team", "Posting is an activity, with no social media skill to unlock. Fame brings people to your public accounts.")}<p>${count(s.experience.growth)} followers discovered you through public recognition last week. Private accounts receive no fame-based growth.</p>${
    m
      ? `<h3>${SOCIAL_MANAGERS[m.id].name}</h3><p>${u.e(m.note)}</p><p>${u.money(SOCIAL_MANAGERS[m.id].weekly)}/week retainer · ${u.money(m.paid, 2)} paid in fees and production so far.</p><button class="button secondary" data-action="social-manager-dismiss" ${off(s)}>Dismiss social manager</button>`
      : `<div class="everyday-grid">${Object.entries(SOCIAL_MANAGERS)
          .map(
            ([id, d]) =>
              `<article class="everyday-card"><h3>${d.name}</h3><p>${u.money(d.fee)} signing · ${u.money(d.weekly)}/week. Up to ${d.posts} regular posts per week.</p><button class="button secondary" data-action="social-manager-hire" data-id="${id}" ${age(s) < 16 || off(s) ? "disabled" : ""}>Hire ${d.name.toLowerCase()}</button></article>`,
          )
          .join("")}</div>`
  }<p class="muted">Managers need age sixteen and an active account. They queue regular posts using your equipment and privacy setting, pay production costs from your cash, and share the two-post weekly limit with you. Retainers pause if funds run out. Brand deliverables remain your choice.</p></section>`;
}
export function footballMarketScreen(s, u) {
  const c = s.careerWorld.sports.football,
    pending = c.requests.some((r) => r.status === "pending"),
    cooldown = s.week < (c.actions.move ?? -13) + 13;
  return `<section class="panel" data-football-market>${u.panelHeading("Your transfer shortlist", "Choose a club. Your representative handles the request, role and appropriate career level.")}<p class="muted">Your current contract stays active while clubs respond. Existing qualification, experience, vacancy and transfer-window rules apply.</p><div class="application-list">${s.football.offers
    .filter(
      (o) =>
        o.kind === "contract" &&
        o.status === "offered" &&
        o.expiresWeek > s.week &&
        !c.requests.some((r) => o.id === `world:${r.id}`),
    )
    .map(
      (o) =>
        `<div class="application-row"><div><strong>${u.e(o.club)}</strong><small>${u.money(o.pay)}/week · ${o.terms?.weeks || o.duration || 104} weeks</small></div><div class="inline-actions"><button class="button primary" data-action="sport-offer" data-sport="football" data-id="${u.e(o.id)}">Review invitation</button><button class="text-button" data-action="decline-sport" data-sport="football" data-id="${u.e(o.id)}">Decline</button></div></div>`,
    )
    .join("")}${c.requests
    .slice()
    .reverse()
    .map((r) => {
      const offer = s.football.offers.find((o) => o.id === `world:${r.id}`);
      return `<div class="application-row"><div><strong>${u.e(r.destination)}</strong><small>${u.e(r.status)}${r.status === "pending" ? ` · review ${gameDate(r.decisionWeek, s)}` : ""}</small></div>${offer?.status === "offered" ? `<button class="button secondary" data-action="world-move-review" data-sport="football" data-id="${u.e(offer.id)}">Review career move</button>` : ""}</div>`;
    })
    .join("")}</div><div class="transfer-shortlist">${footballMoveOptions(s)
    .map(
      (d) =>
        `<article class="club-card"><span class="club-crest" aria-hidden="true">${u.e(
          d.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join(""),
        )}</span><div><h3>${u.e(d.name)}</h3><p>${u.e(d.city)} · ${d.kind === "step-up" ? "Next career level" : d.kind === "loan" ? "Development loan" : "Current career level"}</p><small>${d.missing.length ? u.e(d.missing.join(" · ")) : pending ? "Waiting for your current approach." : cooldown ? "Your next review is available after the current cooldown." : "Ready for an approach."}</small></div><button class="button secondary" data-action="football-approach" data-id="${u.e(d.name)}" ${d.missing.length || pending || cooldown || off(s) ? "disabled" : ""}>Approach club</button></article>`,
    )
    .join("")}</div></section>`;
}
export function youthScoutingScreen(s, u) {
  if (
    age(s) < 8 ||
    age(s) > 18 ||
    !["school", "community"].includes(s.football.stage)
  )
    return "";
  const f = s.football,
    pending = s.experience.scouting.requests.some(
      (r) => r.status === "pending",
    );
  return `<section class="panel" data-youth-scouting>${u.panelHeading("Get noticed", "Arrange one youth assessment; interested academies send places to your invitation list.")}<p>Ability, discipline, coach trust and athleticism determine the level of interest. Outstanding young players are very likely to receive several leading-academy offers; developing players can attract smaller academies. A youth place keeps you in education and does not guarantee a senior career.</p><button class="button primary" data-action="youth-assessment" ${pending || s.week < s.experience.scouting.nextWeek || f.ability < 30 || f.discipline < 40 || f.injuryWeeks || off(s) ? "disabled" : ""}>Arrange youth assessment</button><p class="muted">Needs 30 ability and 40 discipline. A response takes two weeks; you can request another review after thirteen weeks.</p>${s.experience.scouting.requests.map((r) => `<p>${gameDate(r.week, s)} · ${u.e(r.status)}${r.status === "pending" ? ` · review ${gameDate(r.decisionWeek, s)}` : r.clubs.length ? ` · ${r.clubs.length} interested academies` : ""}</p>`).join("")}</section>`;
}
export function godModeScreen(s, u) {
  if (!s.debug.enabled) return "";
  const core = Object.keys(s.skills).map((id) => ({
    id,
    label: id[0].toUpperCase() + id.slice(1),
    value: s.skills[id],
  }));
  const groups = [
    ["general", "General skills", core],
    [
      "hobbies",
      "Hobbies",
      HOBBIES.map((h) => ({
        id: h.id,
        label: h.name,
        value: s.pastimes.hobbies[h.id].skill,
      })),
    ],
    ...[
      "football",
      "racing",
      "basketball",
      "tennis",
      "boxing",
      "music",
      "personality",
      "body",
      "school",
      "childhood",
    ].map((id) => [
      id,
      {
        football: "Football",
        racing: "Motorsport",
        basketball: "Basketball",
        tennis: "Tennis",
        boxing: "Boxing",
        music: "Music",
        personality: "Personality",
        body: "Fitness & mobility",
        school: "School",
        childhood: "Child development",
      }[id],
      DEBUG_SPECIALIST_SKILLS.filter((k) => k.id.startsWith(id + ".")).map(
        (k) => ({
          id: k.id,
          label: k.label.split(": ").at(-1),
          value: k.path.reduce((o, key) => o[key], s),
        }),
      ),
    ]),
  ];
  return `<section class="panel" data-god-locks><div class="panel-heading"><div><span class="eyebrow">GOD MODE</span><h2>Always feel your best</h2><p>Keep selected stats full while Debug is enabled. Switch them off to return to normal play.</p></div></div><div class="god-switches">${["health", "energy", "happiness"].map((key) => `<div class="god-switch"><div><strong>${key[0].toUpperCase() + key.slice(1)}</strong><small>${Math.round(s[key])}/100 · ${s.experience.locks[key] ? "Stays full" : "Changes normally"}</small></div><button class="toggle-switch" role="switch" aria-checked="${s.experience.locks[key]}" aria-label="Always full ${key}" data-action="god-lock" data-id="${key}"><span></span></button></div>`).join("")}</div><button class="button secondary" data-action="god-lock-all">${Object.values(s.experience.locks).every(Boolean) ? "Turn all locks off" : "Keep all three full"}</button><p class="muted">Locks apply to actions and weekly updates, survive saves, and pause when Debug is disabled. They do not remove injuries, legal consequences or the end-of-life age limit.</p></section><section class="panel" data-god-money><h2>Your balance</h2><form id="god-money-form"><label class="field-label">Cash balance in USD<input type="number" name="money" value="${s.money}" min="-1000000000" max="1000000000000" step="0.01" required></label><button class="button primary">Set cash balance</button></form></section><section class="panel" data-god-skills><h2>Skills, grouped by life path</h2><p class="muted">Change a whole group or set individual values. Money and skill edits do not invent qualifications, matches or job experience.</p><button class="button secondary" data-action="god-max-group" data-id="all">Max all skills</button><div class="god-skill-groups">${groups.map(([id, label, skills]) => `<details ${id === "general" ? "open" : ""}><summary>${label}<span>${skills.length} skills</span></summary><form id="god-skills-form-${id}" data-form="god-skills-form" data-group="${id}"><div class="god-skill-grid">${skills.map((k) => `<label class="skill-adjuster"><span>${u.e(k.label)}</span><input type="number" name="${k.id}" value="${Math.round(k.value * 10) / 10}" min="0" max="100" step="0.1" required></label>`).join("")}</div><div class="inline-actions"><button class="button primary">Save ${label.toLowerCase()}</button><button class="button secondary" type="button" data-action="god-max-group" data-id="${id}">Max this group</button></div></form></details>`).join("")}</div></section>`;
}
