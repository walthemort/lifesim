import { agentCommission } from "./seasons.js";
import { availableCash } from "./world.js";
import { salary, expenses, MARKETS, age } from "./engine.js";
import { pensionDue } from "./careers.js";
import { spendTime } from "./calendar.js";
const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const log = (s, text, kind = "info") => {
  s.log.unshift({ week: s.week, text, kind });
  s.log = s.log.slice(0, 40);
};
export const TAX_BANDS = [
  { upTo: 12000, rate: 0 },
  { upTo: 50000, rate: 0.2 },
  { upTo: 125000, rate: 0.35 },
  { upTo: Infinity, rate: 0.45 },
];
export function annualIncomeTax(income) {
  let total = 0,
    lower = 0;
  for (const b of TAX_BANDS) {
    total += Math.max(0, Math.min(income, b.upTo) - lower) * b.rate;
    lower = b.upTo;
  }
  return round(total);
}
const ledger = (year) => ({
  year,
  earned: 0,
  investment: 0,
  capitalNet: 0,
  withheld: 0,
  paid: 0,
  lastWeekly: 0,
  lastGross: 0,
  lastNet: 0,
  history: [],
});
export function initializeBanking(s) {
  s.banking = {
    savings: 0,
    baseRate: 0.035,
    savingsRate: 0.03,
    credit: 650,
    serial: 0,
    loans: [],
    statements: [],
    incomeHistory: [],
    tax: ledger(Math.floor(s.week / 52)),
    basis: Object.fromEntries(
      MARKETS.map((m) => [m.id, round(s.holdings[m.id] * s.market[m.id])]),
    ),
  };
}
function statement(s, label, amount) {
  s.banking.statements.unshift({ week: s.week, label, amount: round(amount) });
  s.banking.statements = s.banking.statements.slice(0, 40);
}
export function receiveIncome(
  s,
  gross,
  kind = "earned",
  { deduction = 0, to = "cash" } = {},
) {
  gross = round(gross);
  if (
    !["earned", "investment", "exempt"].includes(kind) ||
    !Number.isFinite(gross) ||
    gross < 0
  )
    throw new Error("Income must be a finite non-negative amount.");
  if (!s.banking) {
    s.money = round(s.money + gross);
    return gross;
  }
  const t = s.banking.tax,
    taxable = Math.max(0, round(gross - deduction));
  const tax =
    kind === "exempt"
      ? 0
      : kind === "investment"
        ? round(taxable * 0.15)
        : round(annualIncomeTax(taxable * 52) / 52);
  if (kind === "earned") t.earned = round(t.earned + taxable);
  if (kind === "investment") t.investment = round(t.investment + taxable);
  t.withheld = round(t.withheld + tax);
  t.paid = round(t.paid + tax);
  t.lastWeekly = round(t.lastWeekly + tax);
  t.lastGross = round(t.lastGross + gross);
  t.lastNet = round(t.lastNet + gross - tax);
  const net = round(gross - tax);
  if (to === "savings") s.banking.savings = round(s.banking.savings + net);
  else s.money = round(s.money + net);
  return net;
}
export function estimatedPayTax(s) {
  if (!s.banking || (age(s) < 18 && !s.employment && s.career !== "business"))
    return 0;
  return round(
    annualIncomeTax(
      Math.max(0, salary(s) - pensionDue(s) - agentCommission(s)) * 52,
    ) / 52,
  );
}
export function takeHomePay(s) {
  return round(
    salary(s) - estimatedPayTax(s) - pensionDue(s) - agentCommission(s),
  );
}
export function recordCapitalGain(s, gain) {
  if (!s.banking) return;
  const t = s.banking.tax,
    prior = Math.max(0, t.capitalNet);
  t.capitalNet = round(t.capitalNet + gain);
  const tax = round(Math.max(0, Math.max(0, t.capitalNet) - prior) * 0.15);
  s.money = round(s.money - tax);
  t.withheld = round(t.withheld + tax);
  t.paid = round(t.paid + tax);
  t.lastWeekly = round(t.lastWeekly + tax);
}
export function recordTrade(s, id, quantity, value, oldUnits) {
  if (!s.banking) return;
  if (quantity > 0) s.banking.basis[id] = round(s.banking.basis[id] + value);
  else {
    const basis = oldUnits ? s.banking.basis[id] * (-quantity / oldUnits) : 0;
    s.banking.basis[id] = Math.max(0, round(s.banking.basis[id] - basis));
    recordCapitalGain(s, value - basis);
  }
}
export function bankNetWorth(s) {
  return s.banking
    ? s.banking.savings - s.banking.loans.reduce((n, l) => n + l.balance, 0)
    : 0;
}
export function bankWeeklyCosts(s) {
  return s.banking
    ? estimatedPayTax(s) +
        s.banking.loans
          .filter((l) => l.status !== "repaid")
          .reduce(
            (n, l) =>
              n +
              (l.weeks === 1
                ? round(l.balance * (1 + l.apr / 52))
                : Math.min(l.payment, round(l.balance * (1 + l.apr / 52)))),
            0,
          )
    : 0;
}
function usable(s) {
  if (s.ended) throw new Error("This life is complete.");
}
export function transferSavings(state, amount) {
  usable(state);
  if (
    !Number.isFinite(amount) ||
    Math.abs(amount - round(amount)) > 1e-8 ||
    !amount ||
    Math.abs(amount) > 1e12
  )
    throw new Error("Enter a non-zero amount with up to two decimal places.");
  if (amount > 0 && availableCash(state) < amount)
    throw new Error("Not enough uncommitted cash to deposit.");
  if (amount < 0 && state.banking.savings < -amount)
    throw new Error("Your savings balance is too low.");
  const s = structuredClone(state);
  s.money = round(s.money - amount);
  s.banking.savings = round(s.banking.savings + amount);
  statement(s, amount > 0 ? "Savings deposit" : "Savings withdrawal", amount);
  return s;
}
export function loanPayment(amount, apr, weeks) {
  const r = apr / 52;
  return round(
    r ? (amount * r) / (1 - Math.pow(1 + r, -weeks)) : amount / weeks,
  );
}
export function loanQuote(s, amount, term) {
  const reasons = [];
  if (
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount < 1000 ||
    amount > 100000
  )
    reasons.push("Borrow $1,000–$100,000 in whole dollars");
  if (![52, 104, 156, 260].includes(term))
    reasons.push("Choose a one, two, three or five-year term");
  const apr =
      round(
        (s.banking.baseRate +
          0.045 +
          Math.max(0, 750 - s.banking.credit) / 10000) *
          10000,
      ) / 10000,
    payment = loanPayment(amount, apr, term),
    income = takeHomePay(s),
    costs =
      expenses(s) - estimatedPayTax(s) - pensionDue(s) - agentCommission(s),
    fee = round(Math.max(20, amount * 0.01));
  if (age(s) < 18) reasons.push("Age 18+");
  if (
    !s.employment ||
    s.employment.tenure < 13 ||
    s.banking.incomeHistory.filter((h) => h.employmentIncome > 0).length < 4
  )
    reasons.push("Thirteen weeks employed and four recorded wage payments");
  if (
    s.employment?.jobId &&
    ["football", "racing", "basketball", "tennis"].includes(s.career)
  ) {
    const contract =
      s.career === "football"
        ? s.football.contract
        : s.sports[s.career].contract;
    if (contract?.expiresWeek !== null && contract?.expiresWeek - s.week < 26)
      reasons.push("At least 26 weeks left on your sporting contract");
  }
  if (s.banking.credit < 600) reasons.push("Credit score of at least 600");
  if (s.banking.loans.filter((l) => l.status !== "repaid").length >= 2)
    reasons.push("At most two outstanding personal loans");
  if (
    s.money < 0 ||
    s.banking.loans.some((l) => l.missed || l.status === "defaulted")
  )
    reasons.push("Clear overdraft and overdue loan payments");
  const current = s.banking.loans
      .filter((l) => l.status !== "repaid")
      .reduce((n, l) => n + l.payment, 0),
    mortgages = s.housing.properties.reduce(
      (n, p) => n + (p.loan?.payment || 0),
      0,
    );
  if (
    Number.isFinite(payment) &&
    (payment + current + mortgages > income * 0.3 ||
      payment > Math.max(0, income - costs) * 0.7)
  )
    reasons.push("Repayments must fit your take-home pay and household budget");
  if (Number.isFinite(amount) && amount > Math.max(0, income) * 26)
    reasons.push("Borrowing cannot exceed six months of take-home wages");
  return {
    eligible: reasons.length === 0,
    reasons,
    amount,
    term,
    apr,
    payment,
    fee,
    total: round(payment * term + fee),
  };
}
export function takeLoan(state, amount, term) {
  usable(state);
  const q = loanQuote(state, amount, term);
  if (!q.eligible) throw new Error(q.reasons.join(". "));
  if (!state.actions)
    throw new Error("A loan application needs a free-time action.");
  const s = structuredClone(state);
  spendTime(s, 2, "Bank loan application");
  s.actions--;
  const loan = {
    id: `loan:${s.banking.serial++}`,
    original: amount,
    balance: amount,
    apr: q.apr,
    payment: q.payment,
    weeks: term,
    term,
    openedWeek: s.week,
    missed: 0,
    status: "active",
    paid: 0,
  };
  s.banking.loans = s.banking.loans
    .filter((l) => l.status !== "repaid")
    .concat(
      s.banking.loans.filter((l) => l.status === "repaid").slice(-8),
      loan,
    );
  s.money = round(s.money + amount - q.fee);
  s.banking.credit = Math.max(300, s.banking.credit - 5);
  statement(s, "Loan funded, after origination fee", amount - q.fee);
  log(
    s,
    `Borrowed $${amount}; $${q.payment}/week at ${(q.apr * 100).toFixed(2)}% fixed APR. The $${q.fee} fee and loan liability reduce your wealth.`,
  );
  return s;
}
export function repayLoan(state, id, amount) {
  usable(state);
  const l = state.banking.loans.find((l) => l.id === id);
  if (!l || l.status === "repaid")
    throw new Error("Choose an outstanding loan.");
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > l.balance ||
    Math.abs(amount - round(amount)) > 1e-8
  )
    throw new Error("Choose a payment up to the remaining balance.");
  if (availableCash(state) < amount)
    throw new Error("Not enough uncommitted cash for repayment.");
  const s = structuredClone(state),
    loan = s.banking.loans.find((l) => l.id === id);
  s.money = round(s.money - amount);
  loan.balance = round(loan.balance - amount);
  loan.paid = round(loan.paid + amount);
  if (!loan.balance) {
    loan.status = "repaid";
    loan.missed = 0;
    s.banking.credit = Math.min(850, s.banking.credit + 10);
  }
  statement(s, "Extra loan repayment", -amount);
  return s;
}
function closeTaxYear(s) {
  const t = s.banking.tax,
    due = round(
      annualIncomeTax(t.earned) +
        0.15 * (t.investment + Math.max(0, t.capitalNet)),
    ),
    adjustment = round(due - t.withheld);
  s.money = round(s.money - adjustment);
  t.paid = round(t.paid + adjustment);
  t.history.unshift({
    year: t.year,
    earned: t.earned,
    investment: t.investment,
    capitalNet: t.capitalNet,
    due,
    withheld: t.withheld,
    adjustment,
  });
  t.history = t.history.slice(0, 10);
  if (t.earned || t.investment || t.capitalNet || adjustment)
    log(
      s,
      `Tax year ${t.year + 1} settled: $${due.toFixed(2)} due${adjustment < 0 ? `; $${(-adjustment).toFixed(2)} refund` : adjustment > 0 ? `; $${adjustment.toFixed(2)} additional payment` : ""}.`,
      "info",
    );
  const carry = Math.min(1e15, Math.max(0, -t.capitalNet));
  t.year = Math.floor(s.week / 52);
  t.earned = 0;
  t.investment = 0;
  t.capitalNet = carry ? -carry : 0;
  t.withheld = 0;
}
export function startBankingWeek(s) {
  const t = s.banking.tax,
    year = Math.floor((s.week - 1) / 52);
  if (t.year !== year) {
    closeTaxYear(s);
    t.year = year;
  }
  t.lastWeekly = 0;
  t.lastGross = 0;
  t.lastNet = 0;
  if (s.week % 13 === 0) {
    const direction = [-0.0025, 0, 0.0025][Math.floor(s.week / 13) % 3];
    s.banking.baseRate = Math.max(
      0.005,
      Math.min(0.1, s.banking.baseRate + direction),
    );
    s.banking.savingsRate = Math.max(0.0025, s.banking.baseRate - 0.005);
  }
}
export function advanceBanking(s, employmentIncome) {
  const b = s.banking,
    interest = round((b.savings * b.savingsRate) / 52);
  if (interest) {
    const net = receiveIncome(s, interest, "investment", { to: "savings" });
    statement(s, "Savings interest, after tax", net);
  }
  for (const l of b.loans.filter((l) => l.status !== "repaid")) {
    l.balance = round(l.balance * (1 + l.apr / 52));
    const due = l.weeks === 1 ? l.balance : Math.min(l.payment, l.balance);
    if (availableCash(s) >= due) {
      s.money = round(s.money - due);
      l.balance = round(l.balance - due);
      l.paid = round(l.paid + due);
      l.weeks = Math.max(0, l.weeks - 1);
      l.missed = 0;
      if (!l.balance) {
        l.status = "repaid";
        log(s, "A personal loan is fully repaid.", "milestone");
      }
      if (s.week % 13 === 0) b.credit = Math.min(850, b.credit + 2);
    } else {
      l.missed++;
      b.credit = Math.max(300, b.credit - 12);
      log(
        s,
        `Missed $${due.toFixed(2)} loan payment; interest remains in the balance (${l.missed} consecutive misses).`,
        "warning",
      );
      if (l.missed >= 8 && l.status !== "defaulted") {
        l.status = "defaulted";
        b.credit = Math.max(300, b.credit - 60);
        log(
          s,
          "A loan entered collections. The debt remains payable, and new credit is blocked.",
          "warning",
        );
      }
    }
  }
  b.incomeHistory.push({
    week: s.week,
    employmentIncome: round(employmentIncome),
    gross: b.tax.lastGross,
    tax: b.tax.lastWeekly,
  });
  b.incomeHistory = b.incomeHistory.slice(-26);
  if (s.money < 0) b.credit = Math.max(300, b.credit - 1);
  else if (
    s.week % 13 === 0 &&
    !b.loans.some((l) => l.missed || l.status === "defaulted")
  )
    b.credit = Math.min(850, b.credit + 1);
  if (s.week % 52 === 0) closeTaxYear(s);
}
export function validateBanking(s) {
  const b = s.banking,
    n = (v, min = 0, max = Infinity) =>
      typeof v === "number" && Number.isFinite(v) && v >= min && v <= max,
    int = (v, min = 0, max = Infinity) => n(v, min, max) && Number.isInteger(v),
    list = (a, max) => Array.isArray(a) && a.length <= max,
    fail = () => {
      throw new Error("Invalid banking or tax data in save.");
    };
  if (
    !b ||
    !n(b.savings) ||
    !n(b.baseRate, 0.005, 0.1) ||
    !n(b.savingsRate, 0, 0.1) ||
    !int(b.credit, 300, 850) ||
    !int(b.serial) ||
    !list(b.loans, 10) ||
    !list(b.statements, 40) ||
    !list(b.incomeHistory, 26) ||
    MARKETS.some((m) => !n(b.basis?.[m.id])) ||
    new Set(b.loans.map((l) => l.id)).size !== b.loans.length
  )
    fail();
  if (
    b.loans.some(
      (l) =>
        typeof l.id !== "string" ||
        !n(l.original, 1000, 100000) ||
        !n(l.balance) ||
        !n(l.apr, 0.01, 0.3) ||
        !n(l.payment, 0.01) ||
        !int(l.weeks, 0, l.term) ||
        ![52, 104, 156, 260].includes(l.term) ||
        !int(l.openedWeek, 0, s.week) ||
        !int(l.missed) ||
        !n(l.paid) ||
        !["active", "defaulted", "repaid"].includes(l.status) ||
        (l.status === "repaid" && l.balance !== 0),
    ) ||
    b.loans.filter((l) => l.status !== "repaid").length > 2 ||
    b.statements.some(
      (x) =>
        !int(x.week, 0, s.week) ||
        typeof x.label !== "string" ||
        !n(x.amount, -Infinity),
    ) ||
    b.incomeHistory.some(
      (x) =>
        !int(x.week, 0, s.week) ||
        ["employmentIncome", "gross", "tax"].some((k) => !n(x[k])),
    )
  )
    fail();
  const t = b.tax;
  if (
    !t ||
    !int(t.year, 0, Math.floor(s.week / 52)) ||
    [
      "earned",
      "investment",
      "withheld",
      "paid",
      "lastWeekly",
      "lastGross",
      "lastNet",
    ].some((k) => !n(t[k])) ||
    !n(t.capitalNet, -1e15) ||
    !list(t.history, 10) ||
    t.history.some(
      (h) =>
        !int(h.year, 0, t.year) ||
        ["earned", "investment", "due", "withheld"].some((k) => !n(h[k])) ||
        !n(h.capitalNet, -1e15) ||
        !n(h.adjustment, -Infinity),
    )
  )
    fail();
}
