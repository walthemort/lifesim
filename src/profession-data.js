export const SPORT_SPECIALTIES = {
  football: {
    finishing: "Finishing",
    passing: "Passing",
    positioning: "Positioning",
    defending: "Defending",
  },
  racing: {
    qualifying: "Qualifying",
    racecraft: "Racecraft",
    tyres: "Tyre management",
    wet: "Wet-weather driving",
  },
  basketball: {
    shooting: "Shooting",
    playmaking: "Playmaking",
    defence: "Defence",
    rebounding: "Rebounding",
  },
  tennis: {
    serve: "Serve",
    baseline: "Baseline",
    net: "Net play",
    movement: "Court movement",
  },
};
export const TRAINING_LOADS = {
  steady: {
    name: "Steady development",
    hours: 3,
    cost: 0,
    gain: 1.2,
    fatigue: 3,
  },
  coached: {
    name: "Coached intensive block",
    hours: 6,
    cost: 35,
    gain: 2,
    fatigue: 9,
  },
  recovery: {
    name: "Recovery & technique",
    hours: 2,
    cost: 0,
    gain: 0.2,
    fatigue: -12,
  },
};
export const SPORT_ROLES = {
  football: {
    balanced: "All-round player",
    creator: "Playmaker",
    finisher: "Goal threat",
    anchor: "Defensive anchor",
  },
  racing: {
    balanced: "All-round driver",
    qualifier: "Qualifying specialist",
    endurance: "Long-run specialist",
    rain: "Wet-weather specialist",
  },
  basketball: {
    balanced: "Two-way player",
    scorer: "Scorer",
    floor: "Floor general",
    rim: "Rebounder & rim protector",
  },
  tennis: {
    balanced: "All-court player",
    server: "Big server",
    grinder: "Baseline defender",
    volley: "Serve & volley",
  },
};
export const ROLE_WEIGHTS = {
  football: {
    creator: ["passing", "positioning"],
    finisher: ["finishing", "positioning"],
    anchor: ["defending", "positioning"],
  },
  racing: {
    qualifier: ["qualifying", "racecraft"],
    endurance: ["tyres", "racecraft"],
    rain: ["wet", "racecraft"],
  },
  basketball: {
    scorer: ["shooting", "playmaking"],
    floor: ["playmaking", "shooting"],
    rim: ["defence", "rebounding"],
  },
  tennis: {
    server: ["serve", "net"],
    grinder: ["baseline", "movement"],
    volley: ["serve", "net"],
  },
};
export const WORK_CASES = {
  racing: {
    name: "Junior karting safety programme",
    stages: [
      "Review the junior session plan",
      "Test supervised coaching exercises",
      "Debrief safety and driver feedback",
    ],
    priority: "quality",
    text: "An instructor's supervised programme balances safe delivery, clear briefings and junior driver development.",
  },
  office: {
    name: "Process improvement",
    stages: [
      "Map the bottleneck",
      "Build a practical change",
      "Present the evidence",
    ],
    priority: "quality",
    text: "Reduce a recurring problem without disrupting the team.",
  },
  medicine: {
    name: "Clinical quality review",
    stages: [
      "Review anonymised cases",
      "Check the evidence with your supervisor",
      "Present a supervised improvement",
    ],
    priority: "quality",
    text: "A supervised service-quality exercise. Qualifications and clinical authority still come from your actual job.",
  },
  nursing: {
    name: "Ward handover improvement",
    stages: [
      "Listen to the care team",
      "Test a clearer handover",
      "Review continuity of care",
    ],
    priority: "collaborative",
    text: "Improve communication and continuity within your current professional scope.",
  },
  teaching: {
    name: "Student learning project",
    stages: [
      "Review learning needs",
      "Prepare a lesson sequence",
      "Evaluate student progress",
    ],
    priority: "collaborative",
    text: "Work with colleagues on a small, measurable learning improvement.",
  },
  engineering: {
    name: "Reliability prototype",
    stages: [
      "Inspect the failure pattern",
      "Prototype and verify a fix",
      "Document the test results",
    ],
    priority: "quality",
    text: "Evidence and safety checks matter more than a rushed prototype.",
  },
  trades: {
    name: "Site delivery package",
    stages: [
      "Plan materials and safety",
      "Complete supervised installation",
      "Inspect and hand over",
    ],
    priority: "quality",
    text: "Stay within your qualifications and deliver a checked piece of site work.",
  },
  hospitality: {
    name: "Service improvement shift",
    stages: [
      "Review guest feedback",
      "Trial a smoother service",
      "Compare waste and satisfaction",
    ],
    priority: "efficient",
    text: "Balance service speed, waste and the experience of your guests.",
  },
  law: {
    name: "Supervised case preparation",
    stages: [
      "Organise the case file",
      "Research and verify sources",
      "Prepare the supervisor briefing",
    ],
    priority: "quality",
    text: "Prepare a checked brief within your current role; this grants no legal qualification.",
  },
  investor: {
    name: "Investment committee brief",
    stages: [
      "Inspect the business fundamentals",
      "Build a downside case",
      "Present the balanced recommendation",
    ],
    priority: "quality",
    text: "Explain the risks and assumptions. A good report cannot predict future prices.",
  },
};
export const WORK_APPROACHES = {
  quality: "Verify the details",
  efficient: "Prioritise delivery",
  collaborative: "Work with colleagues",
};
const methods = (entries) =>
  Object.fromEntries(entries.map(([id, label, mode]) => [id, { label, mode }]));
export const WORK_METHODS = {
  racing: methods([
    ["safety", "Verify the safety briefing and session plan", "quality"],
    ["telemetry", "Organise a clear driver-feedback sheet", "efficient"],
    [
      "coaching",
      "Review the exercises with fellow instructors",
      "collaborative",
    ],
  ]),
  office: methods([
    ["audit", "Map and verify the process", "quality"],
    ["automate", "Prototype an automated workflow", "efficient"],
    ["workshop", "Run a colleague workshop", "collaborative"],
  ]),
  medicine: methods([
    ["evidence", "Check the clinical evidence with your supervisor", "quality"],
    [
      "handover",
      "Discuss the case-review findings with the care team",
      "collaborative",
    ],
    ["template", "Test a clearer review template", "efficient"],
  ]),
  nursing: methods([
    ["care-plan", "Check continuity and handover records", "quality"],
    [
      "patient-voice",
      "Review anonymised patient feedback together",
      "collaborative",
    ],
    ["rota", "Trial a clearer shift checklist", "efficient"],
  ]),
  teaching: methods([
    ["assessment", "Check learning evidence", "quality"],
    ["lesson-study", "Plan and review with another teacher", "collaborative"],
    ["resources", "Build reusable lesson resources", "efficient"],
  ]),
  engineering: methods([
    ["verification", "Run verification tests", "quality"],
    ["prototype", "Build a fast prototype", "efficient"],
    ["peer-review", "Hold a design peer review", "collaborative"],
  ]),
  trades: methods([
    [
      "inspection",
      "Check the installation and safety documentation",
      "quality",
    ],
    ["prefabricate", "Prepare the next assembly in advance", "efficient"],
    ["coordinate", "Coordinate the site handover", "collaborative"],
  ]),
  hospitality: methods([
    ["service-flow", "Trial a smoother service flow", "efficient"],
    ["guest-review", "Check guest feedback and waste", "quality"],
    ["team-brief", "Run a pre-service team briefing", "collaborative"],
  ]),
  law: methods([
    ["sources", "Verify authorities and document sources", "quality"],
    [
      "case-team",
      "Review the brief with the supervising team",
      "collaborative",
    ],
    ["index", "Build a searchable case-file index", "efficient"],
  ]),
  investor: methods([
    ["downside", "Stress-test the investment assumptions", "quality"],
    ["committee", "Present the risks to colleagues", "collaborative"],
    ["screen", "Build a faster company-screening model", "efficient"],
  ]),
};
export const MATCH_DETAILS = {
  football: {
    setPiece: {
      label: "Set-piece work",
      options: {
        balanced: "Normal team routines",
        corners: "Corners & delivery",
        freeKicks: "Direct free kicks",
        marking: "Defend dead balls",
      },
    },
    responsibility: {
      label: "Player instruction",
      options: {
        balanced: "Follow your position",
        possession: "Offer passing lanes",
        runner: "Run beyond the defence",
        cover: "Protect the defensive line",
      },
    },
  },
  racing: {
    setup: {
      label: "Car setup",
      options: {
        balanced: "Balanced setup",
        lowDrag: "Lower drag / straight-line speed",
        downforce: "More downforce / grip",
      },
    },
    compound: {
      label: "Tyre plan",
      options: {
        auto: "Follow the race engineer",
        soft: "Soft / qualifying pace",
        hard: "Hard / longer stint",
        wet: "Wet-weather compound",
      },
    },
  },
  basketball: {
    shot: {
      label: "Shot selection",
      options: {
        balanced: "Balanced shot profile",
        perimeter: "Find perimeter shots",
        paint: "Attack the paint",
        facilitate: "Create the extra pass",
      },
    },
    coverage: {
      label: "Defensive coverage",
      options: {
        balanced: "Follow the team defence",
        zone: "Protect space in a zone",
        man: "Track your matchup",
      },
    },
  },
  tennis: {
    pattern: {
      label: "Point pattern",
      options: {
        balanced: "All-court pattern",
        baseline: "Construct from the baseline",
        volley: "Approach the net",
        serve: "Build around the serve",
      },
    },
    risk: {
      label: "Shot margin",
      options: {
        balanced: "Balanced margin",
        patient: "More margin / longer rallies",
        attack: "Attack earlier in the point",
      },
    },
  },
};
export const STUDIO_REVIEWS = {
  singer: {
    comp: { name: "Vocal comp & phrasing", skill: "vocals", cost: 60 },
    harmonies: { name: "Harmony arrangement", skill: "vocals", cost: 40 },
  },
  rapper: {
    flow: { name: "Flow and bar structure edit", skill: "lyrics", cost: 0 },
    adlibs: { name: "Ad-lib recording session", skill: "vocals", cost: 60 },
  },
  producer: {
    mix: { name: "Mix balance & translation", skill: "production", cost: 25 },
    master: {
      name: "External mastering consultation",
      skill: "production",
      cost: 150,
    },
  },
};
export const ART_DIRECTIONS = {
  independent: {
    name: "Follow your sound",
    text: "Balanced discovery and long-term listeners.",
  },
  accessible: {
    name: "Reach a wider audience",
    text: "More first-week discovery; weak releases lose repeat listeners faster.",
  },
  experimental: {
    name: "Explore a new sound",
    text: "A smaller opening audience; strong work can build a more committed core.",
  },
};
export const SERIES_FORMATS = {
  diary: "Behind-the-scenes diary",
  guide: "Useful guides",
  entertainment: "Entertainment series",
};
export const CLIENT_BRIEFS = {
  pilot: {
    name: "Local client pilot",
    units: 3,
    weeks: 5,
    unitCost: 100,
    fee: 650,
    quality: 35,
    skill: 30,
  },
  repeat: {
    name: "Regional supply agreement",
    units: 5,
    weeks: 8,
    unitCost: 250,
    fee: 2500,
    quality: 55,
    skill: 50,
  },
  flagship: {
    name: "Flagship client launch",
    units: 8,
    weeks: 12,
    unitCost: 600,
    fee: 9000,
    quality: 72,
    skill: 70,
  },
};
