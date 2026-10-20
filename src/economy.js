import currencies from "./currencies.json" with { type: "json" };
import { country } from "./geography.js";
import { eraIndex } from "./simulation/effects.js";
const PROFILES = {
  GB: {
    wage: 1,
    living: 1,
    housing: 1,
    retail: 1,
    tax: 1,
    allowance: 12000,
    investment: 0.15,
  },
  US: {
    wage: 1.2,
    living: 1.12,
    housing: 1.3,
    retail: 0.95,
    tax: 0.86,
    allowance: 14000,
    investment: 0.2,
  },
  DK: {
    wage: 1.25,
    living: 1.18,
    housing: 1.15,
    retail: 1.15,
    tax: 1.28,
    allowance: 10000,
    investment: 0.27,
  },
  DE: {
    wage: 1.08,
    living: 0.98,
    housing: 1.02,
    retail: 1.02,
    tax: 1.15,
    allowance: 13000,
    investment: 0.25,
  },
  FR: {
    wage: 1.02,
    living: 1.03,
    housing: 1.08,
    retail: 1.05,
    tax: 1.12,
    allowance: 12500,
    investment: 0.25,
  },
  JP: {
    wage: 0.95,
    living: 0.95,
    housing: 0.95,
    retail: 0.95,
    tax: 0.95,
    allowance: 10000,
    investment: 0.2,
  },
  BR: {
    wage: 0.48,
    living: 0.55,
    housing: 0.4,
    retail: 0.9,
    tax: 0.8,
    allowance: 6500,
    investment: 0.15,
  },
  IN: {
    wage: 0.35,
    living: 0.4,
    housing: 0.3,
    retail: 0.78,
    tax: 0.75,
    allowance: 5000,
    investment: 0.15,
  },
  NG: {
    wage: 0.32,
    living: 0.42,
    housing: 0.32,
    retail: 0.85,
    tax: 0.6,
    allowance: 5000,
    investment: 0.1,
  },
  CH: {
    wage: 1.65,
    living: 1.6,
    housing: 1.7,
    retail: 1.25,
    tax: 0.7,
    allowance: 14000,
    investment: 0.15,
  },
  MC: {
    wage: 1.5,
    living: 1.65,
    housing: 2.5,
    retail: 1.25,
    tax: 0,
    allowance: 12000,
    investment: 0,
  },
  AE: {
    wage: 1.2,
    living: 1.1,
    housing: 1.3,
    retail: 0.98,
    tax: 0,
    allowance: 12000,
    investment: 0,
  },
};
export const FX = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  DKK: 6.86,
  JPY: 149,
  BRL: 5.1,
  INR: 83.3,
  NGN: 1500,
  CHF: 0.89,
  CAD: 1.36,
  AUD: 1.52,
  SEK: 10.5,
  NOK: 10.7,
  CNY: 7.2,
  KRW: 1330,
  SGD: 1.35,
  AED: 3.67,
  NZD: 1.65,
  ZAR: 18.5,
  MXN: 17.2,
  PLN: 4.0,
  TRY: 32,
  ARS: 880,
};
export function economyProfile(code = "GB") {
  const region = country(code)?.region;
  return {
    currency: currencies[code] || "USD",
    ...(PROFILES[code] || {
      wage:
        region === "Europe"
          ? 1
          : region === "Americas"
            ? 0.65
            : region === "Asia"
              ? 0.6
              : region === "Africa"
                ? 0.4
                : 0.9,
      living: region === "Europe" ? 1 : 0.7,
      housing: region === "Europe" ? 1 : 0.6,
      retail: 1,
      tax: 1,
      allowance: 12000,
      investment: 0.15,
    }),
  };
}
export const residenceCode = (s) => s.globalLife?.residence.country || "GB";
export const localProfile = (s) => economyProfile(residenceCode(s));
export const localPrice = (s, amount, kind = "retail") =>
  Math.round(amount * (s.realWorld ? localProfile(s)[kind] || 1 : 1) * eraIndex(s) * 100) /
  100;
export function localCurrency(s, amount) {
  const c = localProfile(s).currency,
    rate = s.realWorld?.economy.rates[c] || FX[c];
  return rate
    ? new Intl.NumberFormat("en", {
        style: "currency",
        currency: c,
        maximumFractionDigits: 2,
      }).format(amount * rate)
    : `${amount.toFixed(2)} USD · ${c} exchange quote unavailable`;
}
export function countryIncomeTax(amount, code = "GB", legacy = false) {
  const p = legacy ? economyProfile("GB") : economyProfile(code);
  const bands = [
    { to: p.allowance, rate: 0 },
    { to: 50000, rate: 0.2 * p.tax },
    { to: 125000, rate: 0.35 * p.tax },
    { to: Infinity, rate: 0.45 * p.tax },
  ];
  let due = 0,
    lower = 0;
  for (const b of bands) {
    due += Math.max(0, Math.min(amount, b.to) - lower) * Math.min(0.65, b.rate);
    lower = b.to;
  }
  return Math.round(due * 100) / 100;
}
export function taxBucket(s) {
  const e = s.realWorld.economy,
    t = s.banking.tax,
    code = residenceCode(s);
  // Complete an imported tax year under its original policy, with one allowance.
  const existing = Object.values(e.taxBuckets).find(
    (b) => b.year === t.year && b.country === code,
  );
  if (existing) return existing;
  const first = !Object.values(e.taxBuckets).some((b) => b.year === t.year);
  return (e.taxBuckets[`${t.year}:${code}`] = {
    year: t.year,
    country: code,
    earned: 0,
    investment: 0,
    capital: first ? Math.min(0, t.capitalNet) : 0,
    withheld: 0,
    legacy: false,
  });
}
export function rememberTax(s, gross, kind, deduction, tax) {
  if (!s.realWorld || kind === "exempt") return;
  const b = taxBucket(s);
  b[kind === "earned" ? "earned" : "investment"] += Math.max(
    0,
    gross - deduction,
  );
  b.withheld += tax;
}
export function regionalTaxDue(s) {
  const year = s.banking.tax.year,
    buckets = Object.values(s.realWorld?.economy.taxBuckets || {}).filter(
      (b) => b.year === year,
    );
  if (!buckets.length) return null;
  return (
    Math.round(
      buckets.reduce(
        (n, b) =>
          n +
          countryIncomeTax(b.earned, b.country, b.legacy) +
          (b.legacy ? 0.15 : economyProfile(b.country).investment) *
            (b.investment + Math.max(0, b.capital)),
        0,
      ) * 100,
    ) / 100
  );
}
export const rentTerms = (s, r) =>
  s.realWorld?.economy.rentalTerms?.id === r.id
    ? s.realWorld.economy.rentalTerms
    : {
        id: r.id,
        rent: localPrice(s, r.rent, "housing"),
        deposit: localPrice(s, r.deposit, "housing"),
        country: residenceCode(s),
      };
export const resalePrice = (s, item) =>
  Math.round(
    (s.realWorld?.economy.purchaseBasis[item.id] ?? item.price) * 0.8 * 100,
  ) / 100;
