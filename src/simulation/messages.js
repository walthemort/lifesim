// Derived inbox sources: opening a message never performs or pays for an action.
export function simulationMessages(s) {
  const q = s.simulation;
  if (!q) return [];
  const result = [],
    add = (id, title, body, view, deadline) =>
      result.push({ id, title, body, view, deadline });
  for (const a of q.health.appointments
    .filter((a) => a.status === "booked")
    .slice(0, 4))
    add(
      a.id,
      "Healthcare appointment booked",
      "Your visit reserves two hours on its due date. Review the medical record for findings and treatment choices.",
      "health-record",
      a.week + 1,
    );
  for (const c of q.professions.cases
    .filter((c) => c.status === "open")
    .slice(0, 3))
    add(
      c.id,
      "Professional case deadline",
      `${c.kind} practice: stage ${c.stage}, quality ${Math.round(c.quality)}. Your current employer and qualifications still govern delivery.`,
      "professional",
      c.deadline,
    );
  const v = q.professions.vacancy;
  if (v?.status === "open")
    add(
      `vacancy:${v.jobId}:${v.reviewed}`,
      "An internal position is open",
      "There are other applicants. Review the opening and meet the ordinary role and performance requirements.",
      "professional",
      v.closes,
    );
  for (const f of Object.values(q.businesses.firms)) {
    if (f.raise?.status === "offered")
      add(
        f.raise.id,
        "Investor terms received",
        `${f.name}: ${f.raise.equity}% new equity for $${f.raise.amount}. Accepting dilutes your ownership and funds the company.`,
        "business-operations",
        f.raise.expires,
      );
    if (f.vote?.status === "pending")
      add(
        `board:${f.id}:${f.vote.since}`,
        "Board resolution pending",
        `${f.name}: ${f.vote.proposal}. The decision follows the recorded share votes.`,
        "business-operations",
        f.vote.due + 1,
      );
  }
  for (const c of q.justice.cases
    .filter((c) => ["interview", "charged"].includes(c.status))
    .slice(0, 3))
    add(
      c.id,
      c.status === "charged"
        ? "A court hearing is scheduled"
        : "An investigator requested an interview",
      "Review the evidence stage and decide whether to retain a solicitor or enter a plea. The court can acquit or convict.",
      "life-planning",
      (c.hearing || c.due) + 1,
    );
  if (q.justice.supervision?.status === "active")
    add(
      `supervision:${q.justice.supervision.since}:${q.justice.supervision.nextCheck}`,
      "Community supervision appointment",
      "Appointments take two hours. Repeated missed appointments can revoke release; international travel needs separate permission.",
      "life-planning",
      q.justice.supervision.nextCheck + 1,
    );
  for (const a of q.economy.corporate
    .filter((c) => c.status === "announced")
    .slice(0, 3))
    add(
      a.id,
      "A share split was announced",
      "Units, prices, history and pending orders will adjust together on the effective date. The split does not create cash.",
      "economic-world",
      a.due + 1,
    );
  for (const x of q.creativity.samples
    .filter((x) => x.status === "offered")
    .slice(0, 3))
    add(
      x.id,
      "Sample-clearance terms received",
      `${x.source}: $${x.fee} plus ${Math.round(x.share * 100)}% of recording receipts. Clear or remove the sample before release.`,
      "creative-production",
      s.week + 4,
    );
  for (const v of q.creativity.videos
    .filter((v) => v.status === "production")
    .slice(0, 2))
    add(
      v.id,
      "Music-video production deadline",
      `${v.stage}/3 stages complete; $${v.paid} of $${v.quote} paid. Further production requires your time and budget.`,
      "creative-production",
      v.deadline,
    );
  for (const t of q.creativity.team.filter(
    (t) => t.proposal?.status === "pending",
  ))
    add(
      `staff:${t.id}:${t.proposal.since}`,
      "A production-team proposal needs approval",
      `${t.name} proposed work with a $${t.proposal.cost} additional budget. Staff wages continue separately.`,
      "creative-production",
      s.week + 4,
    );
  return result.slice(0, 30);
}
