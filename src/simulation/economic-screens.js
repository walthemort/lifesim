import { MARKETS } from "../engine.js";
import { BUSINESSES, stakePercent } from "../world.js";
import { form, select, panel } from "./screens.js";
import { gameDate } from "../dates.js";
import { ECONOMIC_PHASES } from "./economy.js";
export function economicWorldScreen(s, u) {
  const e = s.simulation.economy,
    b = e.budget,
    p = e.insolvency;
  return (
    u.title(
      "THE ECONOMY AROUND YOU",
      "Markets & household resilience.",
      "Economic conditions connect prices, hiring pay, business growth, bank rates and market returns. Records and targets are visible before you act.",
    ) +
    panel(
      u,
      "Economy",
      "Economic conditions",
      "Starting the connected cycle affects future prices, offers and returns; existing fixed loan terms retain their APR.",
      `${!e.active ? form(s, "economy-open", "", "Start connected economic cycles", 12) : ""}<p>${ECONOMIC_PHASES[e.phase].name} · unemployment ${e.unemployment.toFixed(1)}% · policy rate ${(e.policyRate * 100).toFixed(2)}%</p><p>Price index ${e.priceIndex.toFixed(3)} · new-offer wage index ${e.wageIndex.toFixed(3)}</p>`,
    ) +
    panel(
      u,
      "Economy",
      "Issuer earnings",
      "Actual quarterly company results produce dated earnings announcements. Surprises influence share prices; earnings are not a guaranteed trading signal.",
      e.earnings
        .slice(0, 12)
        .map(
          (r) =>
            `<article class="career-brief"><h3>${u.e(BUSINESSES.find((b) => b.id === r.issuer)?.name)}</h3><p>${gameDate(r.week, s)} · result ${u.money(r.profit)} · prior quarter ${u.money(r.expected)} · surprise ${r.surprise}% · EPS ${u.money(r.eps)}</p></article>`,
        )
        .join("") ||
        "<p>Reports arrive at the next quarter after enabling connected cycles.</p>",
    ) +
    panel(
      u,
      "Corporate actions",
      "Share splits",
      "A split changes units and quoted price together. Total basis, client ownership, market history and pending orders adjust; no cash is created.",
      `${form(s, "stock-split", select(u, "asset", "Controlled listed issuer", Object.fromEntries(BUSINESSES.filter((b) => b.stock && stakePercent(s, b.id) > 50).map((b) => [b.stock, b.name]))), "Announce a 2-for-1 split · four weeks", 18)}${e.corporate.map((c) => `<p>${u.e(MARKETS.find((m) => m.id === c.asset)?.name)} · ${c.ratio}-for-1 · ${c.status} · effective ${gameDate(c.due, s)}</p>`).join("")}`,
    ) +
    panel(
      u,
      "Crypto",
      "Exchange & self-custody",
      "Regulated dealing charges 0.2%; offshore dealing 0.1% with occasional withdrawal/dealing suspensions. Self-custody transfers cost $5 and preserve actual coins and cost basis. This is an abstract game model.",
      `${form(s, "crypto-exchange", select(u, "exchange", "Exchange arrangement", { regulated: "Regulated exchange · 0.2%", offshore: "Offshore exchange · 0.1% / liquidity risk" }, e.crypto.exchange), "Choose exchange arrangement", 18)}<p>Dealing ${e.crypto.frozenUntil > s.week ? `suspended until ${gameDate(e.crypto.frozenUntil, s)}` : "available"} · issuance index ${e.crypto.emission} · next scheduled issuance halving ${gameDate(e.crypto.nextHalving, s)}</p>${MARKETS.filter(
        (m) => m.type === "Crypto",
      )
        .map(
          (m) =>
            `<p>${u.e(m.name)} · exchange ${s.holdings[m.id]} · self-custody ${e.crypto.wallets[m.id]} · wallet basis ${u.money(e.crypto.walletBasis[m.id])}</p>`,
        )
        .join(
          "",
        )}${form(s, "crypto-transfer", select(u, "asset", "Cryptocurrency", Object.fromEntries(MARKETS.filter((m) => m.type === "Crypto").map((m) => [m.id, m.name]))) + select(u, "direction", "Transfer direction", { withdraw: "Exchange to own wallet", deposit: "Own wallet to exchange" }) + '<label class="field-label">Coin amount<input name="quantity" type="number" min=".000001" step=".000001" value=".001" required></label>', "Transfer coins · $5", 18)}${e.crypto.news.map((r) => `<p>${gameDate(r.week, s)} · ${u.e(r.text)}</p>`).join("")}`,
    ) +
    panel(
      u,
      "Budget",
      "Your weekly cash plan",
      "Targets warn rather than block spending. Receipts use actual cash movements. Transfers, investments, debt payments and uncategorised actions are shown separately from income.",
      `${form(s, "budget", `<label class="field-label">Essential spending target<input name="essentials" type="number" min="0" max="1000000000" value="${b?.essentials ?? 300}" required></label><label class="field-label">Shopping & activity target<input name="discretionary" type="number" min="0" max="1000000000" value="${b?.discretionary ?? 100}" required></label><label class="field-label">Cash growth goal<input name="savings" type="number" min="0" max="1000000000" value="${b?.savings ?? 50}" required></label>`, "Set weekly household targets", 12)}${b?.history.map((h) => `<article class="career-brief"><h3>${gameDate(h.week, s)}</h3><p>Income received ${u.money(h.income)} · essentials ${u.money(h.essentials)} · shopping/activities ${u.money(h.discretionary)} · other movement ${u.money(h.other)} · cash change ${u.money(h.delta)}</p><details><summary>Cash receipts</summary>${h.receipts.map((r) => `<p>${u.e(r.label)} · ${u.money(r.amount)}</p>`).join("")}</details></article>`).join("") || "<p>Your next weekly review will reconcile the cash ledger.</p>"}`,
    ) +
    panel(
      u,
      "Insolvency",
      "A court-supervised debt plan",
      "A first petition requires negative net worth and $1,000+ unsecured bank debt. The fee is up to $100 of available cash. A four-week assessment can lead to a 156-week plan, with cash above a $1,500 reserve contributed to included creditors. A discharge requires compliance and at least 10% repayment; secured credit, child support and criminal fines remain payable.",
      `${p ? `<p>${p.status} · original unsecured debt ${u.money(p.original)} · actually repaid ${u.money(p.paid)} · discharged ${u.money(p.discharged)}</p><p>${p.compliant} compliant / ${p.missed} missed contribution weeks · plan end ${gameDate(p.ends, s)} · credit impairment through ${gameDate(p.creditUntil, s)}</p>` : form(s, "insolvency", "", "File insolvency petition · up to $100", 18)}<button class="text-button" data-view="banking">Bank balances, loans & tax</button>`,
    )
  );
}
