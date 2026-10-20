import { activeCareerPath } from "./career-commitment.js";
// Organize the existing controls into one accessible workspace per activity.
function makeWorkspace(scope, key, labels, classify, selections, defaultTab) {
  const nodes = [...scope.children].filter(
    (n) =>
      !n.matches(
        "footer,.page-title,.sandbox-banner,.info-banner.warning,[data-career-commitment],[data-detailed-shortcut]",
      ),
  );
  const bar = document.createElement("nav");
  bar.className = "workspace-tabs";
  bar.setAttribute("role", "tablist");
  bar.setAttribute("aria-label", `${key.split(":")[0]} workspace`);
  const chosen = labels.includes(selections[key])
    ? selections[key]
    : defaultTab || labels[0];
  selections[key] = chosen;
  const panels = Object.fromEntries(
    labels.map((label, i) => {
      const panel = document.createElement("div");
      panel.id = `pane-${key.replaceAll(":", "-")}-${i}`;
      panel.dataset.workspacePanel = label;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `${panel.id}-tab`);
      panel.hidden = label !== chosen;
      const button = document.createElement("button");
      button.id = `${panel.id}-tab`;
      button.type = "button";
      button.textContent = label;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", panel.id);
      button.setAttribute("aria-selected", String(label === chosen));
      button.tabIndex = label === chosen ? 0 : -1;
      button.dataset.action = "workspace-tab";
      button.dataset.workspace = key;
      button.dataset.id = label;
      bar.append(button);
      return [label, panel];
    }),
  );
  for (const node of nodes) {
    const target = classify(node);
    if (target === null) {
      node.remove();
      continue;
    }
    panels[target in panels ? target : labels[0]].append(node);
  }
  const footer = scope.querySelector(":scope > footer");
  if (footer) footer.before(bar, ...Object.values(panels));
  else scope.append(bar, ...Object.values(panels));
  if (key === "god") {
    const quick = panels["Quick controls"];
    const locks = quick.querySelector("[data-god-locks]");
    if (locks) quick.prepend(locks);
  }
  for (const panel of Object.values(panels))
    if (!panel.children.length)
      panel.innerHTML =
        '<section class="panel"><p class="muted">More options appear here as this part of your career develops.</p></section>';
}
export function organizeWorkspace(main, view, s, selections) {
  const title = [...main.querySelectorAll(".page-title")];
  title.slice(1).forEach((n) => n.remove());
  const heading = (n) =>
    n.querySelector(".panel-heading h2,h2,h3")?.textContent || "";
  if (view === "music" && main.querySelector("[data-track-studio]")) {
    main.dataset.musicWorld = "";
    makeWorkspace(
      main,
      "music",
      ["Overview", "Studio", "Catalogue", "Promote", "Live", "Team"],
      (n) => {
        const h = heading(n);
        if (
          n.matches(
            "[data-music-overview],[data-music-chart],[data-profession-music-audience]",
          )
        )
          return "Overview";
        if (
          n.matches(
            "[data-music-catalogue],[data-music-rights],[data-music-albums]",
          )
        )
          return "Catalogue";
        if (
          n.matches("[data-music-promotion]") ||
          h === "Your next release plan"
        )
          return "Promote";
        if (
          n.matches("[data-music-live],[data-music-touring]") ||
          h === "Performances & label interest"
        )
          return "Live";
        if (
          n.matches("[data-career-support],[data-depth-milestones]") ||
          h === "Contracts, rights & commercial work"
        )
          return "Team";
        if (
          h === "Recording & releases" &&
          !n.querySelector('[data-action="ready-recording-release"],.tag')
        )
          return null;
        return "Studio";
      },
      selections,
    );
  } else if (view === "sports" && main.querySelector(".sport-section")) {
    const section = main.querySelector(".sport-section"),
      id = section.id.replace("sport-section-", "");
    const matchday =
      id === "racing"
        ? "Race weekend"
        : id === "basketball"
          ? "Game day"
          : id === "tennis"
            ? "Tournament"
            : "Matchday";
    if (!section.querySelector("[data-sport-card]")) return;
    const school = [...main.children].find((n) =>
      n.matches(".info-banner:not(.warning)"),
    );
    if (school) section.append(school);
    section.dataset.sportWorld = id;
    const cockpit = main.querySelector(".career-cockpit");
    if (cockpit) section.prepend(cockpit);
    const rivals = main.querySelector("[data-rivals]");
    if (rivals) section.append(rivals);
    if (id === "football") {
      const world = section.querySelector('[data-sport-team="football"]');
      if (world) {
        world.querySelector("#sport-move-form")?.remove();
        const rows = world.querySelector(".application-list");
        rows?.remove();
      }
      // Contract invitations have a single home in the contract/transfer menu.
      for (const o of s.football.offers.filter((o) => o.kind === "contract"))
        section
          .querySelector('[data-sport-card="football"]')
          ?.querySelector(
            `[data-action="sport-offer"][data-id="${CSS.escape(o.id)}"]`,
          )
          ?.closest(".application-row")
          ?.remove();
    }
    makeWorkspace(
      section,
      `sports:${id}`,
      [matchday, "Development", "Standings", "Team", "Contract", "Style"],
      (n) => {
        if (
          n.matches(
            ".career-cockpit,[data-performance],[data-profession-analysis]",
          )
        )
          return matchday;
        if (n.matches("[data-profession-style]")) return "Style";
        if (n.matches("[data-season]")) return "Standings";
        if (n.matches("[data-rivals]")) return "Team";
        if (n.matches("[data-sport-team]"))
          return id === "football" ? "Team" : "Contract";
        if (
          n.matches("[data-football-market]") ||
          heading(n) === "Contracts, rights & commercial work"
        )
          return "Contract";
        return "Development";
      },
      selections,
      ["none", "retired"].includes(
        (id === "football" ? s.football : s.sports[id]).stage,
      )
        ? "Development"
        : matchday,
    );
    const development = section.querySelector(
      '[data-workspace-panel="Development"]',
    );
    development.querySelector("[data-profession-training]") &&
      development.prepend(
        development.querySelector("[data-profession-training]"),
      );
    for (const n of [...development.children])
      if (
        n.matches(
          "[data-identity-routine],[data-career-support],[data-equipment-group],[data-depth-milestones]",
        )
      ) {
        const details = document.createElement("details"),
          summary = document.createElement("summary");
        details.className = "career-support-details";
        summary.textContent = heading(n);
        n.before(details);
        details.append(summary, n);
      }
  } else if (view === "social" && main.querySelector("[data-platform]")) {
    makeWorkspace(
      main,
      "social",
      ["Accounts", "Content", "Team", "Deals"],
      (n) => {
        const h = heading(n);
        if (n.matches("[data-social-management]")) return "Team";
        if (
          h === "Brand collaborations" ||
          h === "Contracts, rights & commercial work"
        )
          return "Deals";
        if (
          n.matches("[data-profession-series]") ||
          h === "Your recent content" ||
          h === "Research, record & edit"
        )
          return "Content";
        return "Accounts";
      },
      selections,
    );
  } else if (view === "career" && main.querySelector("[data-vacancy]")) {
    makeWorkspace(
      main,
      "work",
      ["Your work", "Find a job", "Education"],
      (n) => {
        const h = heading(n);
        if (h === "Your applications" || n.querySelector("[data-vacancy]"))
          return "Find a job";
        if (
          h === "Education & qualifications" ||
          h.includes("School life") ||
          n.matches("[data-detailed-shortcut]")
        )
          return "Education";
        return "Your work";
      },
      selections,
    );
  } else if (
    [
      "school-life",
      "health-record",
      "social-life",
      "garage",
      "home-design",
      "professional",
      "business-operations",
      "sport-lab",
      "race-engineering",
      "creative-production",
      "economic-world",
      "life-planning",
    ].includes(view)
  ) {
    const labels =
      view === "life-planning"
        ? ["Cases", "Supervision", "Will", "Estate", "Family history"]
        : view === "economic-world"
          ? ["Economy", "Corporate actions", "Crypto", "Budget", "Insolvency"]
          : view === "creative-production"
            ? [
                "Recordings",
                "Rights",
                "Group & tour",
                "Audience",
                "Production team",
              ]
            : view === "race-engineering"
              ? ["Weekend", "Reports", "Kart budget", "Components", "Career"]
              : view === "sport-lab"
                ? [
                    "Football",
                    "Basketball",
                    "Tennis",
                    "Boxing",
                    "Motorsport",
                  ].sort(
                    (a, b) =>
                      ((b === "Motorsport" ? "racing" : b.toLowerCase()) ===
                      (activeCareerPath(s) || s.aspiration)
                        ? 1
                        : 0) -
                      ((a === "Motorsport" ? "racing" : a.toLowerCase()) ===
                      (activeCareerPath(s) || s.aspiration)
                        ? 1
                        : 0),
                  )
                : view === "business-operations"
                  ? [
                      "Operations",
                      "Employees",
                      "Board",
                      "Acquisitions",
                      "Expansion",
                      "Specialist clubs",
                    ]
                  : view === "professional"
                    ? ["Casework", "People", "Training", "Career"]
                    : view === "school-life"
                      ? ["Subjects", "School", "Support", "Home life"]
                      : view === "health-record"
                        ? ["Overview", "Care", "Recovery", "Habits"]
                        : view === "garage"
                          ? [
                              "Fleet",
                              "Journeys",
                              "Licences",
                              "Finance",
                              "Used market",
                            ]
                          : view === "home-design"
                            ? ["Rooms", "Style", "Projects"]
                            : ["People", "Plans", "Family", "Agreements"];
    makeWorkspace(
      main,
      view,
      labels,
      (n) => n.dataset.simulationTab || labels[0],
      selections,
    );
  } else if (view === "debug" && s.debug.enabled) {
    makeWorkspace(
      main,
      "god",
      ["Quick controls", "Time", "Skills", "Advanced"],
      (n) =>
        n.matches("[data-god-time]")
          ? "Time"
          : n.matches("[data-god-skills]")
            ? "Skills"
            : n.matches("[data-god-locks],[data-god-money]") ||
                heading(n) === "Quick controls"
              ? "Quick controls"
              : "Advanced",
      selections,
    );
  } else if (view === "company" && s.company) {
    makeWorkspace(
      main,
      "company",
      ["Overview", "Products", "Clients", "Operations"],
      (n) =>
        n.matches("[data-profession-clients]")
          ? "Clients"
          : n.matches("[data-business-products]")
            ? "Products"
            : n.matches("[data-ownership-dashboard]")
              ? "Operations"
              : "Overview",
      selections,
    );
  } else if (
    view === "investments" &&
    main.querySelector("[data-profession-orders]")
  ) {
    makeWorkspace(
      main,
      "investing",
      ["Market", "Research", "Orders"],
      (n) =>
        n.matches("[data-profession-orders]")
          ? "Orders"
          : n.matches("[data-profession-research]")
            ? "Research"
            : "Market",
      selections,
    );
  }
}
