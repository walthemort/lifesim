import { escapeHtml } from "./screens.js";
import { form, select, panel } from "./screens.js";
import { gameDate } from "../dates.js";
import { CREATIVE_TEAM, VIDEO_BUDGETS } from "./creativity.js";
import { musicReleaseShare } from "../career-world.js";
export function creativeStudioScreen(s, u) {
  const c = s.simulation.creativity,
    projects = Object.fromEntries(
      s.music.projects
        .filter((p) => musicReleaseShare(s, p.id) > 0)
        .map((p) => [p.id, p.title]),
    ),
    unreleased = Object.fromEntries(
      s.music.projects
        .filter(
          (p) => p.status !== "released" && musicReleaseShare(s, p.id) > 0,
        )
        .map((p) => [p.id, p.title]),
    ),
    releases = Object.fromEntries(s.music.releases.map((p) => [p.id, p.title])),
    group = c.group;
  return (
    u.title(
      "BUILD A CREATIVE WORLD",
      "Your creative production desk.",
      "Separate the recording, composition, visual work and community. Ownership and revenue stay attached to the real release.",
    ) +
    panel(
      u,
      "Recordings",
      "Alternate recordings",
      "Acoustic, live and remix versions need a fresh funded master and two delivered recording sessions. Existing exclusive beat and collaborator rights carry forward.",
      `${!c.active ? form(s, "creative-open", "", "Open creative records", 6) : ""}${form(s, "record-version", select(u, "project", "Original recording", projects) + select(u, "kind", "Alternate master", { acoustic: "Acoustic", remix: "Remix", live: "Live" }), "Start alternate recording · $150", 12)}${c.versions
        .map((v) => {
          const p = s.music.projects.find((p) => p.id === v.id);
          return `<article class="career-brief"><h3>${u.e(p?.title || v.kind)}</h3><p>${v.sessions}/2 delivered sessions · ${p?.status || "Archived master"}</p>${v.sessions < 2 ? form(s, "version-session", `<input name="project" type="hidden" value="${u.e(v.id)}">`, "Record version session · $50 / four hours", 12) : p?.status === "ready" ? form(s, "version-release", `<input name="project" type="hidden" value="${u.e(v.id)}">`, "Schedule the alternate version", 12) : ""}</article>`;
        })
        .join("")}`,
    ) +
    panel(
      u,
      "Recordings",
      "Music-video production",
      "A 25% deposit begins production; storyboard, shoot and edit each cost another 25%. A delivered video supports eight weeks of discovery on the same recording.",
      `${form(s, "video-start", select(u, "project", "Recording for the video", projects) + select(u, "budget", "Production budget", Object.fromEntries(Object.entries(VIDEO_BUDGETS).map(([id, d]) => [id, `${d.name} · ${u.money(d.cost)}`]))), "Commission video & pay 25% deposit", 12)}${c.videos.map((v) => `<article class="career-brief"><h3>${u.e(s.music.projects.find((p) => p.id === v.project)?.title || "Catalogue video")}</h3><p>${v.status} · ${v.stage}/3 stages · ${u.money(v.paid)}/${u.money(v.quote)} paid · deadline ${gameDate(v.deadline, s)}</p>${v.status === "production" ? form(s, "video-work", `<input name="video" type="hidden" value="${escapeHtml(v.id)}"><input name="method" type="hidden" value="${["storyboard", "shoot", "edit"][v.stage]}">`, `Deliver ${["storyboard", "shoot", "edit"][v.stage]} · ${u.money(v.quote * 0.25)}`, 12) : ""}</article>`).join("")}`,
    ) +
    panel(
      u,
      "Rights",
      "Composition & master ownership",
      "The game models 85% recording receipts and 15% composition receipts. Existing label, producer, master and group agreements still apply. Selling publishing assigns 75% of your composition share for three years.",
      `${form(s, "writing-split", select(u, "project", "Unreleased composition", unreleased) + select(u, "share", "Your songwriting share", { 1: "100% sole writer", ".75": "75% writer / 25% co-writer", ".5": "50/50 co-writing" }), "Agree writing credits before release", 12)}${form(s, "publishing", select(u, "project", "Composition to assign", projects), "Sell three-year publishing share", 18)}${Object.values(
        c.rights,
      )
        .map(
          (r) =>
            `<p>${u.e(s.music.projects.find((p) => p.id === r.id)?.title || "Archived composition")} · writer ${Math.round(r.writerShare * 100)}% · group interest ${Math.round(r.groupShare * 100)}%${r.publishing ? ` · publishing assignment through ${gameDate(r.publishing.ends, s)} / ${u.money(r.publishing.advance)} paid` : ""}</p>`,
        )
        .join("")}`,
    ) +
    panel(
      u,
      "Rights",
      "Sample clearance",
      "Declared samples block release until licensed or re-recorded. An application costs $20 and takes two weeks. Accepted licences cost a quoted fee plus 10% of future receipts.",
      `${form(s, "sample-request", select(u, "project", "Recording containing a sample", unreleased) + '<label class="field-label">Sample rights holder / source<input name="source" maxlength="60" required></label>', "Request permission · $20", 12)}${c.samples.map((x) => `<article class="career-brief"><h3>${u.e(x.source)}</h3><p>${x.status} · ${u.money(x.fee)} licence fee + 10% recording receipts</p>${!["licensed", "removed"].includes(x.status) ? form(s, "sample-resolve", `<input name="sample" type="hidden" value="${escapeHtml(x.id)}">` + select(u, "decision", "Your decision", { ...(x.status === "offered" ? { license: "Accept licence & pay quoted fee" } : {}), remove: "Re-record without sample · $50" }), "Confirm sample decision", 12) : ""}</article>`).join("")}`,
    ) +
    panel(
      u,
      "Group & tour",
      "A band is an agreement",
      "Newly registered recordings in an active group use equal ownership shares. Rehearsals depend on member availability; existing splits survive a breakup.",
      `${group ? `<h3>${u.e(group.name)} · ${group.status}</h3><p>${u.e(group.agreement)} · ${group.rehearsals} delivered rehearsals</p>${group.members.map((m) => `<p>${u.e(m.name)} · ${m.role} · bond ${Math.round(m.bond)}</p>`).join("")}` : ""}${!group || group.status !== "active" ? form(s, "group-form", '<label class="field-label">Group name<input name="name" maxlength="40" required></label>', "Agree a new group · $100", 12) : form(s, "group-rehearse", "", "Book group rehearsal · $20 / four hours", 12) + form(s, "group-leave", "", "Dissolve the group agreement", 12)}`,
    ) +
    panel(
      u,
      "Group & tour",
      "Map an existing tour",
      "Set one city per booked stop, separated by commas. Domestic legs cost $40; cross-border legs $450. International performances require existing citizenship or destination permission in this simplified model.",
      `${form(s, "tour-geography", select(u, "tour", "Planned tour", Object.fromEntries(s.careerWorld.music.tours.filter((t) => t.status === "planned" && !c.tourPlans[t.id]).map((t) => [t.id, `${t.stops.length} stops · ${t.route}`]))) + '<label class="field-label">Cities in stop order<input name="cities" placeholder="London, Manchester, London" required></label>', "Confirm route & pay additional travel", 18)}${Object.values(
        c.tourPlans,
      )
        .map(
          (t) =>
            `<p>${u.e(t.cities.join(" → "))} · ${u.money(t.cost)} travel paid</p>`,
        )
        .join(
          "",
        )}<button class="text-button" data-view="music">Book shows & tours in the music workspace</button>`,
    ) +
    panel(
      u,
      "Audience",
      "Local fans & recommendation signals",
      "Retention and satisfaction inform discovery. Clickbait lowers satisfaction. Local fanbases influence ticket demand in that city.",
      `${c.fanbases.map((f) => `<p>${u.e(f.city)} · ${f.fans.toLocaleString()} local fans · loyalty ${Math.round(f.loyalty)}</p>`).join("")}${form(s, "audience-review", select(u, "kind", "Audience source", { music: "Released music", social: "Resolved social content" }) + select(u, "project", "Published work", { ...releases, ...Object.fromEntries(s.social.posts.filter((p) => p.status === "resolved").map((p) => [p.id, `${p.platform}: ${p.topic || p.id}`])) }), "Review real audience metrics", 13)}${c.recommendations.map((r) => `<p>${u.e(r.id)} · retention ${Math.round(r.retention)}% · satisfaction ${Math.round(r.satisfaction)}% · ${gameDate(r.week, s)}</p>`).join("")}`,
    ) +
    panel(
      u,
      "Audience",
      "A live community",
      "Open a Streamroom account, then stream. Sessions take three hours and $5. Subscribers renew every four weeks according to satisfaction and recent activity; the platform retains half.",
      `<p>${c.community.members} community members · ${c.community.subscribers} subscribers · satisfaction ${Math.round(c.community.satisfaction)} · total receipts ${u.money(c.community.revenue)}</p>${form(s, "go-live", '<label class="field-label">Live topic<input name="topic" maxlength="60" required></label>', "Go live · $5 / three hours", 13)}${c.community.streams.map((r) => `<p>${gameDate(r.week, s)} · ${u.e(r.topic)} · ${r.viewers} viewers · ${r.joined} joined · tips ${u.money(r.tips)}</p>`).join("")}<button class="text-button" data-view="social">Your social accounts</button>`,
    ) +
    panel(
      u,
      "Production team",
      "People behind the work",
      "Staff cost real weekly salaries. Editorial, publicity and community proposals need your approval and a separate budget.",
      `${form(s, "creative-hire", select(u, "role", "Production support", Object.fromEntries(Object.entries(CREATIVE_TEAM).map(([id, d]) => [id, `${d.name} · ${u.money(d.fee)} setup / ${u.money(d.weekly)} weekly`]))), "Hire production support", 18)}${c.team.map((t) => `<article class="career-brief"><h3>${u.e(t.name)} · ${CREATIVE_TEAM[t.role].name}</h3><p>${u.money(t.weekly)}/week</p>${t.proposal ? `<p>Proposal ${t.proposal.status} · ${u.money(t.proposal.cost)} budget</p>${t.proposal.status === "pending" ? form(s, "creative-approve", `<input name="employee" type="hidden" value="${escapeHtml(t.id)}">`, "Approve & fund this proposal", 18) : ""}` : ""}${form(s, "creative-dismiss", `<input name="employee" type="hidden" value="${escapeHtml(t.id)}">`, "End support arrangement", 18)}</article>`).join("")}`,
    )
  );
}
