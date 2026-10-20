import { escapeHtml } from "./screens.js";
import { COUNTRIES } from "../geography.js";
import { CRIMES } from "../expansion-data.js";
import { form, select, panel } from "./screens.js";
import { gameDate } from "../dates.js";
import { estateQuote, estateBeneficiaries, eligibleHeirs } from "./legacy.js";
export function lifePlanningScreen(s, u) {
  const j = s.simulation.justice,
    l = s.simulation.legacy,
    q = estateQuote(s),
    beneficiaries = estateBeneficiaries(s),
    shares = l.will?.allocations || q.distributions,
    heirs = eligibleHeirs(s),
    defaults = Object.fromEntries(
      shares.map((a) => [a.id, Math.floor(a.share)]),
    );
  if (!l.will && shares.length)
    defaults[shares[0].id] +=
      100 - Object.values(defaults).reduce((n, v) => n + v, 0);
  return (
    u.title(
      "CONSEQUENCES & CONTINUITY",
      "Your legal and family affairs.",
      "Delayed cases, supervision and an estate plan connect the decisions in this life to the next. These are simplified fictional legal rules.",
    ) +
    panel(
      u,
      "Cases",
      "Investigations & court",
      "Detailed legal records replace instant outcomes for future crime attempts. Evidence develops over time; a solicitor can review a case, and a court can acquit or convict.",
      `${!j.active ? `<form data-form="simulation-action" data-operation="justice-open"><button class="button secondary" ${s.ended ? "disabled" : ""}>Start detailed legal records</button></form>` : ""}${j.cases.map((c) => `<article class="career-brief"><h3>${CRIMES[c.crime].name} · ${c.status}</h3><p>Investigation opened ${gameDate(c.since, s)} · ${c.hearing ? `court date ${gameDate(c.hearing, s)}` : `next review ${gameDate(c.due, s)}`} · ${c.lawyer ? "solicitor retained" : "no solicitor retained"}</p><p>${u.e(c.outcome || "The evidence has not yet produced a final decision.")}</p>${["interview", "charged"].includes(c.status) ? form(s, "case-response", `<input name="case" value="${escapeHtml(c.id)}" type="hidden">` + select(u, "choice", "Legal response", { ...(!c.lawyer ? { lawyer: "Retain a solicitor · $500" } : {}), trial: "Contest the charge at trial", guilty: "Enter a guilty plea" }), "Record your legal response", 12) : ""}</article>`).join("") || "<p>No detailed investigations are pending.</p>"}<button class="text-button" data-view="crime">Crime scenarios & custody activities</button>`,
    ) +
    panel(
      u,
      "Supervision",
      "Release is a responsibility",
      "Parole needs adulthood, half a sentence served and rehabilitation 10. The panel can refuse. Community appointments are due every four weeks; repeated breaches can return you to custody.",
      `${s.globalLife.crime.prison ? `<p>Custody through ${gameDate(s.globalLife.crime.prison.releaseWeek, s)}</p><form data-form="simulation-action" data-operation="parole"><button class="button secondary" ${s.ended ? "disabled" : ""}>Request a parole-panel review</button></form>` : ""}${j.parole ? `<p>Parole review ${j.parole.status} · ${gameDate(j.parole.due, s)}</p>` : ""}${j.supervision ? `<h3>${j.supervision.kind} · ${j.supervision.status}</h3><p>${j.supervision.attended} appointments attended · ${j.supervision.missed} missed · next ${gameDate(j.supervision.nextCheck, s)} · ends ${gameDate(j.supervision.until, s)}</p>${j.supervision.status === "active" ? form(s, "supervision", "", "Attend supervision appointment · two hours", 12) + form(s, "supervised-travel", select(u, "country", "Destination permission", Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]))), "Request four-week travel permission", 18) : ""}${j.supervision.travel ? `<p>Permission: ${u.e(j.supervision.travel.country)} through ${gameDate(j.supervision.travel.until, s)}. Immigration permission is still required separately.</p>` : ""}` : "<p>No community supervision is active.</p>"}`,
    ) +
    panel(
      u,
      "Will",
      "Choose the beneficiaries",
      "Allocate whole percentages totalling 100. The $150 solicitor fee and three hours are paid now; the estate is settled after death. Debts, sale costs and estate tax come first.",
      `${form(s, "will", beneficiaries.map((b) => `<label class="field-label">${u.e(b.name)} · percentage<input name="share:${u.e(b.id)}" type="number" min="0" max="100" step="1" value="${defaults[b.id] || 0}" required></label>`).join("") + select(u, "trustAge", "Release age for younger beneficiaries", { 18: "18 years old", 21: "21 years old", 25: "25 years old" }, String(l.will?.trustAge || 18)), "Sign or revise your will · $150", 18)}<p>${l.will ? `Last signed ${gameDate(l.will.week, s)}.` : "Without a will, a partner shares equally with children collectively; children otherwise share the remaining estate. Without either, the estate goes to charity."}</p>`,
    ) +
    panel(
      u,
      "Estate",
      "The executor’s sale estimate",
      "The continuation model liquidates personal assets into a cash estate. Property sales retain a 5% fee and business interests a 10% discount. The fictional estate tax is 20% above $500,000 after debts. Other beneficiaries receive their shares; personal debts, jobs and qualifications do not transfer.",
      `<div class="life-metrics"><div><span>Executor sale assets</span><strong>${u.money(q.gross)}</strong></div><div><span>Actual liabilities</span><strong>${u.money(q.debts)}</strong></div><div><span>Estate tax</span><strong>${u.money(q.tax)}</strong></div><div><span>Distributable</span><strong>${u.money(q.distributable)}</strong></div></div>${q.distributions.map((d) => `<p>${u.e(d.name)} · ${d.share.toFixed(2)}% · ${u.money(d.amount)}</p>`).join("")}${q.shortfall ? `<p>Unfunded estate liabilities ${u.money(q.shortfall)}. Heirs receive no estate assets and do not personally assume this shortfall.</p>` : ""}${s.ended && heirs.length ? `<form data-form="simulation-action" data-operation="heir">${select(u, "child", "Continue as an adult child", Object.fromEntries(heirs.map((c) => [c.id, `${c.name} · ${Math.floor((s.week - c.bornWeek) / 52)} years old`])))}<button class="button primary">Review estate & continue as heir</button></form>` : s.ended ? "<p>An existing adult child is required to continue this family line.</p>" : "<p>Heir continuation becomes available when this life ends. A real adult child must already exist in your family.</p>"}${l.trusts.map((t) => `<p>Trust for ${u.e(t.beneficiary)} · ${u.money(t.amount)} · ${t.released ? "released" : `held until ${gameDate(t.releaseWeek, s)}`}</p>`).join("")}`,
    ) +
    panel(
      u,
      "Family history",
      "A world that continues",
      "The calendar, market history, listed companies, sporting world and known family survive succession. The latest completed life remains exportable; up to fifty generations are recorded.",
      `<p>Generation ${l.generation + 1}</p>${l.previousLife ? '<button class="button secondary" data-action="export-parent-life">Export the previous completed life</button>' : ""}${l.archive
        .slice()
        .reverse()
        .map(
          (a) =>
            `<article class="career-brief"><h3>${u.e(a.name)} · age ${a.age}</h3><p>${gameDate(a.week, s)} · net estate ${u.money(a.netEstate)} · heir ${u.e(a.heir)} received ${u.money(a.received)}</p></article>`,
        )
        .join(
          "",
        )}${l.relatives.map((r) => `<p>${u.e(r.name)} · ${r.alive ? "independent family life" : "remembered by the family"} · ${u.money(r.wealth)} savings</p>`).join("")}`,
    ) +
    panel(
      u,
      "Family history",
      "Companies beyond one life",
      "A founded company sold by the executor continues under outside ownership. A premium reacquisition window opens one quarter in four; buying it requires real personal funds.",
      l.companies
        .map(
          (c) =>
            `<article class="career-brief"><h3>${u.e(c.name)}</h3><p>${u.e(c.sector)} · value ${u.money(c.value)} · cash ${u.money(c.cash)} · weekly result ${u.money(c.profit)}</p>${Math.floor(s.week / 13) % 4 === 0 && !s.company ? form(s, "family-company", `<input name="company" value="${u.e(c.id)}" type="hidden">`, `Acquire for ${u.money(Math.round(c.value * 1.15))}`, 18) : "<p>No current sale window or company slot available.</p>"}</article>`,
        )
        .join("") ||
        "<p>Founded businesses from earlier generations will appear here.</p>",
    )
  );
}
