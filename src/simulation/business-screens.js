import { BUSINESSES, stakePercent } from "../world.js";
import { gameDate } from "../dates.js";
import { form, select, panel } from "./screens.js";
import {
  STAFF_ROLES,
  SUPPLIERS,
  SEGMENTS,
  OWNERSHIP_FORMATS,
  ownershipFormatOffers,
} from "./businesses.js";
export function businessSimulationScreen(s, u) {
  const b = s.simulation.businesses,
    choices = Object.fromEntries([
      ...(s.company ? [["founder", s.company.name]] : []),
      ...BUSINESSES.filter((b) => stakePercent(s, b.id) > 50).map((b) => [
        b.id,
        b.name,
      ]),
    ]),
    opened = Object.values(b.firms),
    hidden = (id) => `<input name="firm" type="hidden" value="${id}">`;
  return (
    u.title(
      "INSIDE THE BUSINESS",
      "People, stock & decisions.",
      "An additional operating division has its own stock and named specialists. Its trading flows into the existing company ledger; it does not replace or charge the base workforce twice.",
    ) +
    panel(
      u,
      "Operations",
      "Open an operating division",
      "Requires a controlling stake. Outside investors can remove a minority founder from the executive role.",
      form(
        s,
        "business-open",
        select(
          u,
          "firm",
          "Controlled business",
          Object.fromEntries(
            Object.entries(choices).filter(([id]) => !b.firms[id]),
          ),
        ),
        "Open operations",
        18,
      ),
    ) +
    opened
      .map((f) =>
        panel(
          u,
          "Operations",
          f.name,
          `${f.ceo ? "Executive authority active" : "Executive authority removed"} · inventory ${f.inventory}/2,000 · quality ${Math.round(f.quality)} · customer trust ${Math.round(f.customerTrust)}`,
          `<p>Last division sales ${u.money(f.lastRevenue)} · payroll and fulfilment ${u.money(f.lastCosts)}</p>${form(s, "segment", hidden(f.id) + select(u, "segment", "Customer segment", Object.fromEntries(Object.entries(SEGMENTS).map(([id, d]) => [id, d.name])), f.segment) + `<label class="field-label">Unit selling price<input type="number" name="price" value="${f.price}" min="5" max="200" step=".01" required></label>`, "Set customer offer", 18)}${form(s, "supplies", hidden(f.id) + select(u, "supplier", "Supply partner", Object.fromEntries(Object.entries(SUPPLIERS).map(([id, d]) => [id, `${d.name} · $${d.unit}/unit · ${d.lead} weeks · ${Math.round(d.reliability * 100)}% on-time likelihood`]))) + '<label class="field-label">Supply units<input type="number" name="units" min="1" max="1000" value="30" required></label>', "Pay for supply order", 18)}${f.orders
            .slice(-6)
            .map(
              (o) =>
                `<p>${SUPPLIERS[o.supplier].name} · ${o.units} units · ${o.status} · due ${gameDate(o.due, s)} · ${o.delays} delays</p>`,
            )
            .join(
              "",
            )}${f.competitors.map((c) => `<p>${u.e(c.name)} · $${c.price} · quality ${Math.round(c.quality)} · demand index ${Math.round(c.share)}</p>`).join("")}`,
        ),
      )
      .join("") +
    opened
      .map((f) =>
        panel(
          u,
          "Employees",
          f.name,
          "These are additional named specialists. Their weekly wages enter the company ledger once; unpaid or unhappy workers can leave.",
          `${form(s, "employee-hire", hidden(f.id) + select(u, "role", "Specialist role", STAFF_ROLES), "Hire · two-week signing cost / eight-week reserve", 18)}${f.staff.map((e) => `<article class="career-brief"><h3>${u.e(e.name)}</h3><p>${STAFF_ROLES[e.role]} · ${u.money(e.wage)}/week · skill ${e.skill} · morale ${Math.round(e.morale)} · ${e.missed} unpaid weeks</p>${form(s, "employee-manage", hidden(f.id) + `<input type="hidden" name="employee" value="${e.id}">` + select(u, "method", "Management conversation", { listen: "Listen & address concerns", train: "Fund training · $250", dismiss: "Dismiss · four weeks’ severance" }), "Meet this employee", 18)}</article>`).join("")}`,
        ),
      )
      .join("") +
    opened
      .map((f) =>
        panel(
          u,
          "Board",
          f.name,
          "Fundraising dilutes existing shareholders. Investor funds enter the company. Dividends use cash and each shareholder’s actual stake.",
          `<p>Your founder equity ${f.founderShare.toFixed(2)}%</p>${f.id === "founder" ? form(s, "equity-seek", hidden(f.id), "Seek investor round · $500 advice fee", 18) : ""}${f.raise ? `<p>${f.raise.status} · ${f.raise.equity}% new equity for ${u.money(f.raise.amount)} · expires ${gameDate(f.raise.expires, s)}</p>${f.raise.status === "offered" ? form(s, "equity-accept", hidden(f.id), "Accept dilution & company investment", 18) : ""}` : ""}${f.board.map((d) => `<p>${u.e(d.name)} · ${d.share.toFixed(2)}% · confidence ${Math.round(d.satisfaction)}</p>`).join("")}${form(s, "board", hidden(f.id) + select(u, "proposal", "Board resolution", { reserve: "Preserve cash reserves", dividend: "Distribute 10% of available cash", expansion: "Approve expansion" }), "Put resolution to a two-week vote", 18)}${f.vote ? `<p>${u.e(f.vote.result || f.vote.status)} · decision ${gameDate(f.vote.due, s)}</p>${f.vote.votes.map((v) => `<p>${u.e(v.name)} · ${v.yes ? "for" : "against"}</p>`).join("")}` : ""}`,
        ),
      )
      .join("") +
    panel(
      u,
      "Acquisitions",
      "Inspect an existing business",
      "A paid, dated report reveals the existing cash, profit and valuation. Sale opportunities and seller acceptance still govern acquisitions.",
      `${form(s, "diligence", select(u, "target", "Acquisition target", Object.fromEntries(BUSINESSES.map((b) => [b.id, b.name]))), "Commission diligence · 0.1% of value / $100 minimum", 18)}${b.diligence
        .slice(0, 6)
        .map(
          (d) =>
            `<article class="career-brief"><h3>${u.e(BUSINESSES.find((b) => b.id === d.target).name)}</h3><p>Report ${gameDate(d.week, s)} · cash ${u.money(d.cash)} · weekly result ${u.money(d.profit)} · value ${u.money(d.value)}</p><p>${u.e(d.risk)}</p></article>`,
        )
        .join(
          "",
        )}<button class="button secondary" data-view="teams">Existing companies & sale opportunities</button>`,
    ) +
    opened
      .map((f) =>
        panel(
          u,
          "Expansion",
          f.name,
          "Branches need stock and operating cash; franchises pay only a 6% royalty on their local sales. Opening takes four weeks.",
          `${form(s, "branch", hidden(f.id) + '<label class="field-label">Location name<input name="city" maxlength="60" required></label>' + select(u, "kind", "Expansion agreement", { branch: "Company branch · $20,000 setup / $350 weekly", franchise: "Franchise support · $8,000 setup / $80 weekly" }), "Fund the new location", 18)}${f.branches.map((b) => `<p>${u.e(b.city)} · ${b.kind} · opens ${gameDate(b.opens, s)} · local trust ${Math.round(b.trust)}</p>`).join("")}${BUSINESSES.find((b) => b.id === f.id)?.sporting && !BUSINESSES.find((b) => b.id === f.id)?.racing ? (f.stadium ? `<p>Additional stand · ${f.stadium.capacity} seats · last attendance ${f.stadium.attendance} · gate ${u.money(f.stadium.gate)} · opens ${gameDate(f.stadium.opens, s)}</p>${form(s, "tickets", hidden(f.id) + `<label class="field-label">Stand ticket price<input name="price" type="number" min="5" max="150" value="${f.stadium.ticket}" required></label>`, "Set stand tickets", 18)}` : form(s, "stadium", hidden(f.id), "Build additional 1,000-seat stand · $150,000 / 13 weeks", 18)) : ""}`,
        ),
      )
      .join("") +
    panel(
      u,
      "Specialist clubs",
      "Different ways to own sport",
      "Basketball relies on home gates, a tennis academy on actual student places, and junior karting on funded driver seats. Sale windows are uncommon; premium meetings can be refused.",
      `${Object.entries(OWNERSHIP_FORMATS)
        .filter(([id]) => !b.venues.some((v) => v.kind === id))
        .map(
          ([id, d]) =>
            `<article class="career-brief"><h3>${d.name}</h3><p>Guide ${u.money(d.price)} · base costs ${u.money(d.weekly)}/week · ${ownershipFormatOffers(s).some((o) => o.id === id) ? "Currently for sale" : "Owners are not currently advertising"}</p>${form(s, "venue-approach", `<input name="kind" type="hidden" value="${id}">`, "Request meeting · nonrefundable 2% fee / 25% price premium", 18)}${ownershipFormatOffers(s).some((o) => o.id === id) || b.approaches.some((a) => a.kind === id && a.status === "offered" && a.expires >= s.week) ? form(s, "venue-buy", `<input name="kind" type="hidden" value="${id}">`, "Acquire the available business", 18) : ""}</article>`,
        )
        .join("")}${b.approaches
        .slice(0, 5)
        .map(
          (a) =>
            `<p>${OWNERSHIP_FORMATS[a.kind].name} · ${a.status} · premium price ${u.money(a.price)} · closes ${gameDate(a.expires, s)}</p>`,
        )
        .join("")}${b.venues
        .map(
          (v) =>
            `<article class="career-brief"><h3>${u.e(v.name)}</h3><p>Cash ${u.money(v.cash)} · ${v.students} students · revenue ${u.money(v.lastRevenue)} · costs ${u.money(v.lastCosts)}</p><div class="table-scroll"><table><thead><tr><th>Club</th><th>Played</th><th>Wins</th><th>Points</th></tr></thead><tbody>${v.table
              .slice()
              .sort((a, b) => b.points - a.points)
              .map(
                (r) =>
                  `<tr><td>${u.e(r.name)}</td><td>${r.played}</td><td>${r.wins}</td><td>${r.points}</td></tr>`,
              )
              .join(
                "",
              )}</tbody></table></div>${form(s, "venue-fund", `<input name="venue" type="hidden" value="${v.id}"><label class="field-label">Owner funding<input name="amount" type="number" value="1000" min="100" required></label>`, "Transfer personal funds to the club", 18)}</article>`,
        )
        .join("")}`,
    )
  );
}
