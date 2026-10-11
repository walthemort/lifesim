const profession = (name, skill, roles, pay, color = "blue") => ({
  name,
  subtitle: "Build a career through qualifications, interviews and experience.",
  icon: "briefcase",
  skill,
  color,
  roles,
  pay,
});
export const EXTRA_CAREERS = {
  medicine: profession(
    "Medicine",
    "knowledge",
    ["Clinic assistant", "Junior doctor", "Doctor", "Consultant"],
    [420, 1100, 2200, 3800],
  ),
  nursing: profession(
    "Nursing",
    "empathy",
    ["Care assistant", "Registered nurse", "Senior nurse", "Clinical lead"],
    [430, 900, 1350, 1900],
  ),
  teaching: profession(
    "Teaching",
    "knowledge",
    ["Classroom assistant", "Teacher", "Head of department", "School leader"],
    [380, 900, 1450, 2200],
  ),
  engineering: profession(
    "Engineering",
    "technical",
    [
      "Trainee technician",
      "Graduate engineer",
      "Senior engineer",
      "Principal engineer",
    ],
    [400, 1050, 1800, 2900],
  ),
  trades: profession(
    "Skilled trades",
    "technical",
    [
      "Apprentice",
      "Qualified electrician",
      "Senior electrician",
      "Site supervisor",
    ],
    [350, 850, 1250, 1800],
  ),
  hospitality: profession(
    "Hospitality",
    "charisma",
    [
      "Cafe assistant",
      "Team supervisor",
      "Restaurant manager",
      "Regional manager",
    ],
    [360, 600, 950, 1500],
  ),
  law: profession(
    "Law",
    "knowledge",
    ["Legal assistant", "Trainee solicitor", "Solicitor", "Partner"],
    [450, 950, 1900, 3400],
  ),
};
const course = (
  id,
  name,
  weeks,
  tuition,
  requires,
  skill,
  gain = 12,
  extra = {},
) => ({
  id,
  name,
  weeks,
  tuition,
  requires,
  skill,
  gain,
  minAge: 18,
  ...extra,
});
export const EXTRA_PROGRAMS = [
  course(
    "medicine-degree",
    "Medical degree",
    312,
    95,
    "school",
    "knowledge",
    30,
  ),
  course(
    "medical-license",
    "Clinical registration",
    52,
    45,
    "medicine-degree",
    "knowledge",
    8,
    { minimumSkill: 60, experience: 52, track: "medicine" },
  ),
  course(
    "nursing-diploma",
    "Nursing diploma",
    156,
    55,
    "school",
    "empathy",
    20,
  ),
  course(
    "nursing-degree",
    "Advanced nursing degree",
    104,
    65,
    "nursing-diploma",
    "empathy",
  ),
  course(
    "teaching-degree",
    "Teacher education degree",
    156,
    55,
    "school",
    "knowledge",
    20,
  ),
  course(
    "engineering-degree",
    "Engineering degree",
    156,
    70,
    "school",
    "technical",
    24,
  ),
  course(
    "trade-cert",
    "Electrical apprenticeship certificate",
    104,
    25,
    "school",
    "technical",
    20,
  ),
  course(
    "hospitality-cert",
    "Hospitality supervision certificate",
    26,
    25,
    "school",
    "charisma",
    8,
  ),
  course("law-degree", "Law degree", 208, 75, "school", "knowledge", 25),
  course(
    "law-license",
    "Solicitor registration",
    52,
    45,
    "law-degree",
    "knowledge",
    8,
    { minimumSkill: 60, experience: 104, track: "law" },
  ),
];
const qualifications = {
  medicine: [null, "medicine-degree", "medical-license", "medical-license"],
  nursing: ["school", "nursing-diploma", "nursing-diploma", "nursing-degree"],
  teaching: ["school", "teaching-degree", "teaching-degree", "teaching-degree"],
  engineering: [
    "school",
    "engineering-degree",
    "engineering-degree",
    "engineering-degree",
  ],
  trades: ["school", "trade-cert", "trade-cert", "trade-cert"],
  hospitality: [
    null,
    "hospitality-cert",
    "hospitality-cert",
    "business-degree",
  ],
  law: ["school", "law-degree", "law-license", "law-license"],
};
const employers = {
  medicine: "Westbridge Hospital",
  nursing: "Westbridge Care Network",
  teaching: "Oakfield Education",
  engineering: "Meridian Engineering",
  trades: "Brightline Electrical",
  hospitality: "Juniper Kitchens",
  law: "Easton Legal",
};
export const EXTRA_JOBS = Object.entries(EXTRA_CAREERS).flatMap(([track, c]) =>
  c.roles.map((title, level) => ({
    id: `${track}-${level}`,
    title,
    employer: employers[track],
    track,
    level,
    pay: c.pay[level],
    maxPay: Math.round(c.pay[level] * 1.35),
    qualification: qualifications[track][level],
    skill: [10, 35, 60, 80][level],
    experience: level === 0 || level === 1 ? 0 : level === 2 ? 156 : 364,
    hours:
      track === "medicine" && level > 0
        ? 48
        : track === "nursing"
          ? 36
          : track === "teaching"
            ? 36
            : 40,
    interview: true,
  })),
);
