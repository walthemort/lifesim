import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import { applyStockSplit } from "../src/simulation/economy.js";
import {
  effectiveShares,
  cryptoWalletValue,
  cryptoFee,
  macroGrowth,
  impairedCredit,
} from "../src/simulation/effects.js";
function fresh() {
  let s = g.createGame({ age: 30, seed: 8 });
  s.money = 1e7;
  return s;
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
test("connected cycles change actual prices, market growth and lending rates", () => {
  let s = g.openEconomicWorld(fresh());
  const price = g.localPrice(s, 100);
  s.simulation.economy.phase = "recession";
  assert.ok(macroGrowth(s) < 0);
  s = next(s);
  assert.ok(g.localPrice(s, 100) < price);
  assert.ok(s.banking.baseRate < 0.035);
  assert.deepEqual(g.restoreGame(s), s);
});
test("actual company profits produce quarterly earnings rather than fabricated forecasts", () => {
  let s = g.openEconomicWorld(fresh());
  for (let i = 0; i < 13; i++) s = next(s);
  assert.ok(s.simulation.economy.earnings.length > 0);
  assert.ok(s.simulation.economy.earnings.every((r) => r.week === 13));
  assert.deepEqual(g.restoreGame(s), s);
});
test("share splits preserve total value, basis, client units, stake and reserved orders", () => {
  let s = fresh(),
    b = g.BUSINESSES.find((b) => b.stock),
    id = b.stock;
  s.holdings[id] = 100;
  s.banking.basis[id] = 100 * s.market[id];
  const client = {
    id: "c",
    name: "Client",
    mandate: "balanced",
    cash: 1000,
    holdings: Object.fromEntries(
      g.MARKETS.map((m) => [m.id, m.id === id ? 20 : 0]),
    ),
    basis: Object.fromEntries(
      g.MARKETS.map((m) => [m.id, m.id === id ? 100 : 0]),
    ),
    taxRate: 0.15,
    taxPaid: 0,
    losses: 0,
    startValue: 2000,
    fees: 0,
    lastValue: 2000,
  };
  s.simulation.professions.clients = [client];
  s = g.placeLimitOrder(
    s,
    {
      asset: id,
      side: "buy",
      quantity: 10,
      limit: s.market[id] * 0.5,
      weeks: 13,
    },
    g.MARKETS,
  );
  const worth = g.netWorth(s),
    percent = g.stakePercent(s, b.id),
    reserve = g.reservedCash(s),
    basis = s.banking.basis[id],
    a = {
      id: "split-test",
      asset: id,
      kind: "split",
      ratio: 2,
      announced: 0,
      due: 4,
      status: "announced",
    };
  s.simulation.economy.corporate.push(a);
  applyStockSplit(s, a);
  assert.equal(g.netWorth(s), worth);
  assert.equal(s.banking.basis[id], basis);
  assert.equal(g.stakePercent(s, b.id), percent);
  assert.equal(g.reservedCash(s), reserve);
  assert.equal(s.simulation.professions.clients[0].holdings[id], 40);
  assert.equal(s.simulation.professions.clients[0].basis[id], 100);
  assert.deepEqual(g.restoreGame(s), s);
});
test("crypto custody moves real coins and their proportional basis without increasing wealth", () => {
  let s = g.openEconomicWorld(fresh()),
    m = g.MARKETS.find((m) => m.type === "Crypto");
  s = g.invest(s, m.id, 0.1);
  const quantity = s.holdings[m.id],
    before = g.netWorth(s),
    basis = s.banking.basis[m.id];
  s = g.cryptoTransfer(s, m.id, 0.05, "withdraw");
  assert.equal(s.holdings[m.id], quantity - 0.05);
  assert.equal(s.simulation.economy.crypto.wallets[m.id], 0.05);
  assert.equal(g.netWorth(s), before - 5);
  assert.equal(
    s.banking.basis[m.id] + s.simulation.economy.crypto.walletBasis[m.id],
    basis + 5,
  );
  s = g.cryptoTransfer(s, m.id, 0.05, "deposit");
  assert.equal(s.holdings[m.id], quantity);
  assert.equal(s.simulation.economy.crypto.wallets[m.id], 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("an exchange suspension blocks spot dealing and custody transfers", () => {
  let s = g.openEconomicWorld(fresh()),
    m = g.MARKETS.find((m) => m.type === "Crypto");
  s = g.invest(s, m.id, 0.1);
  s.simulation.economy.crypto.frozenUntil = s.week + 2;
  assert.throws(() => g.invest(s, m.id, -0.01), /suspended/);
  assert.throws(() => g.cryptoTransfer(s, m.id, 0.01, "withdraw"), /available/);
});
test("a household budget reconciles actual cash and retains individual purchase receipts", () => {
  let s = g.startHouseholdBudget(fresh(), {
      essentials: 300,
      discretionary: 30,
      savings: 50,
    }),
    cash = s.money;
  s = g.buy(s, "phone");
  s = next(s);
  const h = s.simulation.economy.budget.history[0];
  assert.equal(h.delta, Math.round((s.money - cash) * 100) / 100);
  assert.ok(h.discretionary > 30);
  assert.ok(h.receipts.some((r) => r.category === "shopping"));
  assert.ok(
    Math.abs(h.receipts.reduce((n, r) => n + r.amount, 0) - h.delta) < 0.02,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("court protection pauses only included unsecured debt; interest and exclusion records remain", () => {
  let s = fresh();
  s.money = 200;
  s.banking.loans = [
    {
      id: "insolvent",
      original: 10000,
      balance: 10000,
      apr: 0.1,
      payment: 100,
      weeks: 104,
      term: 104,
      openedWeek: 0,
      missed: 8,
      status: "defaulted",
      paid: 0,
    },
  ];
  assert.throws(() => g.petitionInsolvency(fresh()), /negative net worth/);
  s = g.petitionInsolvency(s);
  assert.equal(s.simulation.economy.insolvency.status, "assessment");
  assert.ok(impairedCredit(s));
  const debt = s.banking.loans[0].balance;
  s = next(s);
  assert.ok(s.banking.loans[0].balance > debt);
  assert.equal(s.banking.loans[0].missed, 8);
  for (let i = 0; i < 3; i++) s = next(s);
  assert.equal(s.simulation.economy.insolvency.status, "active");
  assert.deepEqual(g.restoreGame(s), s);
});
