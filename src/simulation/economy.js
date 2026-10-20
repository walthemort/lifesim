import { MARKETS, netWorth } from "../engine.js";
import { BUSINESSES, stakePercent, availableCash } from "../world.js";
import { recordCapitalGain } from "../banking.js";
import { effectiveShares, splitFactor, recordBudget } from "./effects.js";
import {
  act,
  clamp,
  round,
  roll,
  uid,
  note,
  once,
  num,
  str,
  bool,
  one,
  arr,
  obj,
  stamps,
} from "./common.js";
export const ECONOMIC_PHASES = {
  expansion: { name: "Expansion", growth: 0.001, unemployment: 4, rate: 0.04 },
  overheating: {
    name: "Overheating",
    growth: 0.0003,
    unemployment: 3,
    rate: 0.06,
  },
  recession: {
    name: "Recession",
    growth: -0.0015,
    unemployment: 8,
    rate: 0.025,
  },
  recovery: { name: "Recovery", growth: 0.0005, unemployment: 6, rate: 0.02 },
};
export function initializeEconomy(s) {
  return {
    active: false,
    lastWeek: s.week,
    phase: "expansion",
    since: s.week,
    priceIndex: 1,
    wageIndex: 1,
    unemployment: 5,
    policyRate: 0.035,
    splits: {},
    corporate: [],
    earnings: [],
    crypto: {
      exchange: "regulated",
      frozenUntil: 0,
      wallets: Object.fromEntries(
        MARKETS.filter((m) => m.type === "Crypto").map((m) => [m.id, 0]),
      ),
      walletBasis: Object.fromEntries(
        MARKETS.filter((m) => m.type === "Crypto").map((m) => [m.id, 0]),
      ),
      supply: 1,
      emission: 1,
      nextHalving: s.week + 208,
      news: [],
    },
    budget: null,
    insolvency: null,
    actions: {},
  };
}
export function openEconomicWorld(state) {
  if (state.simulation.economy.active)
    throw new Error("Economic cycle records are already active.");
  const s = act(state, { minAge: 12, hours: 1 });
  s.simulation.economy.active = true;
  return s;
}
export function recordEarnings(s, b, profit) {
  const e = s.simulation?.economy;
  if (!e?.active || !b.stock) return;
  const previous = e.earnings.find((r) => r.issuer === b.id),
    expected = previous?.profit ?? profit,
    surprise = expected
      ? clamp((profit - expected) / Math.abs(expected), -1, 1)
      : 0;
  e.earnings.unshift({
    id: `earnings:${b.id}:${s.week}`,
    issuer: b.id,
    week: s.week,
    profit: round(profit),
    expected: round(expected),
    eps: round(profit / effectiveShares(s, b)),
    surprise: round(surprise * 100),
  });
  e.earnings = e.earnings.slice(0, 48);
  s.market[b.stock] = Math.max(
    1,
    round(s.market[b.stock] * (1 + surprise * 0.025)),
  );
  note(
    s,
    `${b.name} reported $${Math.round(profit)} quarterly profit (${Math.round(surprise * 100)}% versus its prior quarter).`,
  );
}
export function proposeStockSplit(state, asset) {
  const b = BUSINESSES.find((b) => b.stock === asset),
    e = state.simulation.economy;
  if (
    !e.active ||
    !b ||
    stakePercent(state, b.id) <= 50 ||
    state.market[asset] < 4 ||
    splitFactor(state, asset) >= 64 ||
    e.corporate.some((c) => c.asset === asset && c.status === "announced")
  )
    throw new Error(
      "A controlled listed issuer, price $4+, remaining split capacity and no pending action are required.",
    );
  const s = act(state, { minAge: 18, hours: 3 });
  once(s, s.simulation.economy.actions, `split:${asset}`, 52);
  s.simulation.economy.corporate.unshift({
    id: uid(s, "corporate"),
    asset,
    kind: "split",
    ratio: 2,
    announced: s.week,
    due: s.week + 4,
    status: "announced",
  });
  s.simulation.economy.corporate = s.simulation.economy.corporate.slice(0, 24);
  return s;
}
export function applyStockSplit(s, action) {
  const e = s.simulation.economy,
    m = MARKETS.find((m) => m.id === action.asset),
    b = BUSINESSES.find((b) => b.stock === action.asset),
    ratio = action.ratio;
  if (
    action.status !== "announced" ||
    !b ||
    !m ||
    s.market[m.id] < ratio * 1 ||
    splitFactor(s, m.id) * ratio > 64
  ) {
    action.status = "cancelled";
    return;
  }
  const id = m.id;
  e.splits[id] = splitFactor(s, id) * ratio;
  s.market[id] = s.market[id] / ratio;
  s.holdings[id] *= ratio;
  s.marketHistory[id] = s.marketHistory[id].map((v) => Math.max(1, v / ratio));
  s.tradeVolumes[id] = (s.tradeVolumes[id] || 0) * ratio;
  for (const c of s.simulation.professions.clients) c.holdings[id] *= ratio;
  for (const o of s.profession.investing.orders.filter(
    (o) => o.asset === id && o.status === "pending",
  )) {
    o.quantity *= ratio;
    o.limit /= ratio;
    o.note =
      "Adjusted for a share split; reserved cash and cost basis were preserved.";
  }
  action.status = "completed";
  note(
    s,
    `${b.name} completed a ${ratio}-for-1 split. Units and pending orders adjusted; total cost basis and ownership percentages were preserved.`,
  );
}
export function chooseCryptoExchange(state, exchange) {
  if (
    !["regulated", "offshore"].includes(exchange) ||
    state.simulation.economy.crypto.frozenUntil > state.week
  )
    throw new Error("Choose an exchange while withdrawals are available.");
  const s = act(state, { minAge: 18, hours: 1 });
  s.simulation.economy.crypto.exchange = exchange;
  s.simulation.economy.active = true;
  return s;
}
export function cryptoTransfer(state, asset, quantity, direction) {
  const m = MARKETS.find((m) => m.id === asset && m.type === "Crypto"),
    c = state.simulation.economy.crypto;
  if (
    !m ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    Math.abs(quantity - Math.round(quantity * 1e6) / 1e6) > 1e-10 ||
    !["withdraw", "deposit"].includes(direction) ||
    c.frozenUntil > state.week
  )
    throw new Error("Choose a crypto amount and an available exchange.");
  const reserved = state.profession.investing.orders
    .filter(
      (o) => o.asset === asset && o.side === "sell" && o.status === "pending",
    )
    .reduce((n, o) => n + o.quantity, 0);
  if (
    (direction === "withdraw" && state.holdings[asset] - reserved < quantity) ||
    (direction === "deposit" && c.wallets[asset] < quantity)
  )
    throw new Error("Transfer only uncommitted coins in the source account.");
  const s = act(state, { minAge: 18, cost: 5, hours: 1 }),
    n = s.simulation.economy.crypto;
  const sourceUnits =
      direction === "withdraw" ? s.holdings[asset] : n.wallets[asset],
    sourceBasis =
      direction === "withdraw" ? s.banking.basis[asset] : n.walletBasis[asset],
    basis = round((sourceBasis * quantity) / sourceUnits);
  if (direction === "withdraw") {
    s.banking.basis[asset] = round(s.banking.basis[asset] - basis);
    n.walletBasis[asset] = round(n.walletBasis[asset] + basis + 5);
  } else {
    n.walletBasis[asset] = round(n.walletBasis[asset] - basis);
    s.banking.basis[asset] = round(s.banking.basis[asset] + basis + 5);
  }
  n.wallets[asset] = roundUnits(
    n.wallets[asset] + (direction === "withdraw" ? quantity : -quantity),
  );
  s.holdings[asset] = roundUnits(
    s.holdings[asset] + (direction === "withdraw" ? -quantity : quantity),
  );
  s.simulation.economy.active = true;
  return s;
}
const roundUnits = (n) => Math.round(n * 1e6) / 1e6;
export function startHouseholdBudget(
  state,
  { essentials = 300, discretionary = 100, savings = 50 },
) {
  for (const v of [essentials, discretionary, savings])
    if (!Number.isFinite(v) || v < 0 || v > 1e9)
      throw new Error("Set non-negative weekly budget amounts.");
  const s = act(state, { minAge: 12, hours: 1 }),
    old = s.simulation.economy.budget;
  s.simulation.economy.budget = {
    essentials: round(essentials),
    discretionary: round(discretionary),
    savings: round(savings),
    anchor: old?.anchor ?? s.money,
    receipts: old?.receipts || [],
    history: old?.history || [],
    since: s.week,
  };
  return s;
}
export function petitionInsolvency(state) {
  const e = state.simulation.economy,
    loans = state.banking.loans.filter((l) => l.status !== "repaid"),
    debt = loans.reduce((n, l) => n + l.balance, 0);
  if (e.insolvency || debt < 1000 || netWorth(state) >= 0)
    throw new Error(
      "A first petition requires at least $1,000 unsecured bank debt and negative net worth. Secured loans, support and criminal fines are not discharged.",
    );
  const s = act(state, {
    minAge: 18,
    hours: 4,
    cost: Math.min(100, Math.max(0, availableCash(state))),
  });
  s.simulation.economy.insolvency = {
    id: uid(s, "insolvency"),
    status: "assessment",
    since: s.week,
    review: s.week + 4,
    ends: s.week + 160,
    loanIds: loans.map((l) => l.id),
    original: round(debt),
    paid: 0,
    discharged: 0,
    compliant: 0,
    missed: 0,
    lastContribution: 0,
    creditUntil: s.week + 160 + 364,
  };
  s.banking.credit = Math.min(450, s.banking.credit);
  note(
    s,
    "An insolvency assessment began. Included unsecured bank payments pause under court protection while interest continues. Secured debts, support and fines remain due.",
  );
  return s;
}
function contribute(s, p, amount) {
  amount = round(amount);
  const loans = s.banking.loans.filter(
      (l) => p.loanIds.includes(l.id) && l.status !== "repaid",
    ),
    total = loans.reduce((n, l) => n + l.balance, 0),
    payment = Math.min(total, amount);
  if (payment <= 0) return;
  let remaining = payment;
  for (let i = 0; i < loans.length; i++) {
    const l = loans[i],
      due =
        i === loans.length - 1
          ? remaining
          : round((payment * l.balance) / total),
      paid = Math.min(l.balance, due);
    l.balance = round(l.balance - paid);
    l.paid = round(l.paid + paid);
    remaining = round(remaining - paid);
    if (l.balance < 0.01) {
      l.balance = 0;
      l.status = "repaid";
      l.missed = 0;
    }
  }
  s.money = round(s.money - payment);
  p.paid = round(p.paid + payment);
  p.lastContribution = payment;
}
export function advanceEconomicWorld(s) {
  const e = s.simulation.economy;
  if (e.lastWeek === s.week) return;
  e.lastWeek = s.week;
  if (e.active) {
    const phase = ECONOMIC_PHASES[e.phase];
    e.priceIndex = clamp(
      e.priceIndex *
        (1 +
          (e.phase === "overheating"
            ? 0.001
            : e.phase === "recession"
              ? -0.0001
              : 0.0004)),
      0.25,
      8,
    );
    e.wageIndex = clamp(
      e.wageIndex * (1 + (e.phase === "recession" ? -0.0002 : 0.00025)),
      0.3,
      8,
    );
    if (s.week - e.since >= 52 && roll(s) < 0.08) {
      const phases = Object.keys(ECONOMIC_PHASES);
      e.phase = phases[(phases.indexOf(e.phase) + 1) % phases.length];
      e.since = s.week;
      note(
        s,
        `The economy entered ${ECONOMIC_PHASES[e.phase].name.toLowerCase()}; hiring pay, prices, business growth and markets respond.`,
      );
    }
    e.unemployment = round(
      e.unemployment + (phase.unemployment - e.unemployment) * 0.03,
    );
    e.policyRate =
      round((e.policyRate + (phase.rate - e.policyRate) * 0.1) * 10000) / 10000;
    s.banking.baseRate = e.policyRate;
    s.banking.savingsRate = Math.max(0, e.policyRate - 0.005);
    for (const action of e.corporate.filter(
      (c) => c.status === "announced" && c.due <= s.week,
    ))
      applyStockSplit(s, action);
    if (s.week % 13 === 0) {
      for (const b of BUSINESSES.filter(
        (b) =>
          b.stock && s.market[b.stock] >= 150 && splitFactor(s, b.stock) < 64,
      ))
        if (
          !e.corporate.some(
            (c) => c.asset === b.stock && s.week - c.announced < 156,
          ) &&
          roll(s) < 0.12
        ) {
          e.corporate.unshift({
            id: uid(s, "corporate"),
            asset: b.stock,
            kind: "split",
            ratio: 2,
            announced: s.week,
            due: s.week + 4,
            status: "announced",
          });
          note(
            s,
            `${b.name} announced a 2-for-1 share split for four weeks from now.`,
          );
        }
      e.corporate = e.corporate.slice(0, 24);
      if (e.crypto.exchange === "offshore" && roll(s) < 0.08) {
        e.crypto.frozenUntil = s.week + 2;
        e.crypto.news.unshift({
          week: s.week,
          text: "Offshore exchange suspended dealing and transfers for two weeks during a liquidity review.",
        });
      }
    }
    const c = e.crypto;
    if (s.week >= c.nextHalving) {
      c.emission = round(c.emission * 0.5);
      c.nextHalving += 208;
      c.news.unshift({
        week: s.week,
        text: "Scheduled token issuance halved. Supply growth slowed; prices remain uncertain.",
      });
    }
    c.supply = round(c.supply + c.emission * 0.001);
    c.news = c.news.slice(0, 12);
  }
  const p = e.insolvency;
  if (p && ["assessment", "active"].includes(p.status)) {
    s.banking.credit = Math.min(450, s.banking.credit);
    if (p.status === "assessment" && s.week >= p.review) {
      if (netWorth(s) >= 0) {
        p.status = "refused";
        note(
          s,
          "The court declined insolvency protection because assets cover the remaining debt. Ordinary payments resume.",
        );
      } else {
        p.status = "active";
        const excess = Math.max(0, s.money + s.banking.savings - 1500);
        s.money = round(s.money + s.banking.savings);
        s.banking.savings = 0;
        contribute(s, p, excess);
        note(
          s,
          "The court approved a three-year contribution plan. Cash above a $1,500 protected reserve goes to included creditors.",
        );
      }
    } else if (p.status === "active") {
      const income =
          s.banking.incomeHistory.slice(-13).reduce((n, r) => n + r.gross, 0) /
          Math.max(1, s.banking.incomeHistory.slice(-13).length),
        expected = Math.max(0, income * 0.25),
        excess = Math.max(0, availableCash(s) - 1500),
        payment = Math.min(excess, expected);
      contribute(s, p, payment);
      if (payment >= expected - 0.01) p.compliant++;
      else p.missed++;
      if (s.week >= p.ends) {
        const outstanding = s.banking.loans.filter(
          (l) => p.loanIds.includes(l.id) && l.status !== "repaid",
        );
        if (p.missed <= 8 && p.paid >= p.original * 0.1) {
          p.discharged = round(outstanding.reduce((n, l) => n + l.balance, 0));
          for (const l of outstanding) {
            l.balance = 0;
            l.status = "repaid";
            l.missed = 0;
          }
          p.status = "discharged";
          note(
            s,
            `The court discharged $${p.discharged} included unsecured debt after the contribution plan. Other obligations remain. Your credit record remains impaired.`,
          );
        } else {
          p.status = "failed";
          note(
            s,
            "The contribution plan ended without discharge; remaining balances are still owed.",
          );
        }
      }
    }
  }
  const b = e.budget;
  if (b) {
    const delta = round(s.money - b.anchor),
      recorded = round(b.receipts.reduce((n, r) => n + r.amount, 0)),
      other = round(delta - recorded);
    if (Math.abs(other) > 0.01)
      b.receipts.push({
        week: s.week,
        category: "other",
        amount: other,
        label:
          "Other cash movements: transfers, debt, assets or uncategorised spending",
      });
    const essentials = -b.receipts
        .filter((r) => r.category === "essentials" && r.amount < 0)
        .reduce((n, r) => n + r.amount, 0),
      discretionary = -b.receipts
        .filter(
          (r) =>
            ["shopping", "discretionary"].includes(r.category) && r.amount < 0,
        )
        .reduce((n, r) => n + r.amount, 0),
      income = b.receipts
        .filter((r) => r.category === "income")
        .reduce((n, r) => n + r.amount, 0);
    b.history.unshift({
      week: s.week,
      income: round(income),
      essentials: round(essentials),
      discretionary: round(discretionary),
      other,
      delta,
      receipts: b.receipts.slice(-50),
    });
    b.history = b.history.slice(0, 26);
    if (
      discretionary > b.discretionary ||
      essentials > b.essentials ||
      delta < b.savings
    )
      note(
        s,
        "Your weekly budget review found spending above a target or cash growth below your savings goal.",
      );
    b.anchor = s.money;
    b.receipts = [];
  }
}
export function validateEconomy(s) {
  const e = obj(s.simulation.economy);
  bool(e.active);
  num(e.lastWeek, 0, s.week, true);
  one(e.phase, Object.keys(ECONOMIC_PHASES));
  num(e.since, 0, s.week, true);
  num(e.priceIndex, 0.25, 8);
  num(e.wageIndex, 0.3, 8);
  num(e.unemployment, 0, 100);
  num(e.policyRate, 0, 0.2);
  stamps(e.actions, s.week);
  if (Object.keys(obj(e.splits)).length > MARKETS.length)
    throw new Error("Invalid stock factors.");
  for (const [id, f] of Object.entries(e.splits))
    if (
      !BUSINESSES.some((b) => b.stock === id) ||
      ![1, 2, 4, 8, 16, 32, 64].includes(f)
    )
      throw new Error("Invalid stock factor.");
  for (const c of arr(e.corporate, 24)) {
    str(c.id, 100);
    if (!BUSINESSES.some((b) => b.stock === c.asset))
      throw new Error("Invalid corporate issuer.");
    one(c.kind, ["split"]);
    num(c.ratio, 2, 2, true);
    num(c.announced, 0, s.week, true);
    num(c.due, c.announced, s.week + 4, true);
    one(c.status, ["announced", "completed", "cancelled"]);
  }
  for (const r of arr(e.earnings, 48)) {
    str(r.id, 100);
    if (!BUSINESSES.some((b) => b.id === r.issuer))
      throw new Error("Invalid earnings issuer.");
    num(r.week, 0, s.week, true);
    num(r.profit, -1e15, 1e15);
    num(r.expected, -1e15, 1e15);
    num(r.eps, -1e12, 1e12);
    num(r.surprise, -100, 100);
  }
  const c = obj(e.crypto);
  one(c.exchange, ["regulated", "offshore"]);
  num(c.frozenUntil, 0, s.week + 2, true);
  obj(c.wallets);
  for (const m of MARKETS.filter((m) => m.type === "Crypto")) {
    num(c.wallets[m.id], 0, 1e9);
    num(c.walletBasis[m.id]);
  }
  num(c.supply, 0, 1e9);
  num(c.emission, 0, 1);
  num(c.nextHalving, 0, s.week + 208, true);
  for (const r of arr(c.news, 12)) {
    num(r.week, 0, s.week, true);
    str(r.text, 250);
  }
  if (e.budget) {
    const b = obj(e.budget);
    for (const k of ["essentials", "discretionary", "savings"])
      num(b[k], 0, 1e9);
    num(b.anchor, -1e15, 1e15);
    num(b.since, 0, s.week, true);
    const receipt = (r) => {
      num(r.week, 0, s.week, true);
      one(r.category, [
        "income",
        "essentials",
        "shopping",
        "discretionary",
        "other",
      ]);
      num(r.amount, -1e15, 1e15);
      str(r.label, 150);
    };
    for (const r of arr(b.receipts, 100)) receipt(r);
    for (const h of arr(b.history, 26)) {
      num(h.week, 0, s.week, true);
      for (const k of ["income", "essentials", "discretionary"])
        num(h[k], -1e15, 1e15);
      num(h.other, -1e15, 1e15);
      num(h.delta, -1e15, 1e15);
      for (const r of arr(h.receipts, 50)) receipt(r);
    }
  }
  if (e.insolvency) {
    const p = obj(e.insolvency);
    str(p.id, 100);
    one(p.status, ["assessment", "active", "refused", "discharged", "failed"]);
    num(p.since, 0, s.week, true);
    num(p.review, p.since, s.week + 4, true);
    num(p.ends, p.since, s.week + 160, true);
    num(p.creditUntil, p.ends, s.week + 524, true);
    for (const k of ["original", "paid", "discharged", "lastContribution"])
      num(p[k]);
    num(p.compliant, 0, 156, true);
    num(p.missed, 0, 156, true);
    for (const id of arr(p.loanIds, 2)) str(id, 100);
  }
}
