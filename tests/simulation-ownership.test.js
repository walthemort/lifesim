import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import { mobilityDebt, vehicleWearFactor, outfitSuitability, renovationRentBonus } from "../src/simulation/effects.js";
import { resalePrice } from "../src/economy.js";
const fresh = (age = 25) => { const s = g.createGame({ age, seed: 8 }); s.money = 1e8; return s; };
function ready(s) { if (s.event) s = g.resolveEvent(s, s.event.options.length - 1); return s; }
function next(s) { return ready(g.advanceWeek(ready(s))); }
function weeks(s, n) { for (let i = 0; i < n; i++) { s = next(s); g.restoreGame(s); } return s; }
function driver(s) { s.simulation.mobility.licences.road = { lessons: 20, status: "passed", validUntil: s.week + 520, lastLesson: -1, lastExam: s.week }; return s; }
function employee() { let s = fresh(); const job = g.JOBS.find((j) => j.track === "office" && !j.qualification); s.applications.push({ id: "job-test", vacancyId: "test", jobId: job.id, status: "offer", appliedWeek: 0, decisionWeek: 0, expiresWeek: 4, exceptional: false, offeredPay: job.pay }); s = g.acceptJobOffer(s, "job-test"); s.employment.tenure = 26; return s; }
test("licence lessons reserve time, cost cash and cannot be repeated in one week", () => {
  let s = fresh(18); const cash = s.money; s = g.licenceLesson(s, "road"); assert.equal(s.money, cash - 45); assert.equal(s.simulation.mobility.licences.road.lessons, 1); assert.equal(s.calendar.spent, 2); assert.throws(() => g.licenceLesson(s, "road"), /Wait/); assert.throws(() => g.sitLicenceExam(s, "road"), /required lessons/);
  for (let i = 1; i < 20; i++) { s = next(s); s = g.licenceLesson(s, "road"); } s.simulation.seed = 0; s.skills.driving = 90; s = g.sitLicenceExam(s, "road"); assert.equal(s.simulation.mobility.licences.road.status, "passed"); assert.deepEqual(g.restoreGame(s), s);
});
test("actual vehicle use needs permission, spends fuel and changes mileage and resale", () => {
  let s = g.startFleetManagement(g.buy(fresh(), "used-car")); assert.throws(() => g.vehicleTrip(s, "used-car"), /valid licence/); s = driver(s); const quote = resalePrice(s, g.SHOP.find((i) => i.id === "used-car")), cash = s.money; s.simulation.seed = 0;
  s = g.vehicleTrip(s, "used-car", "local"); assert.equal(s.money, cash - 5.4); assert.equal(s.simulation.mobility.vehicles['used-car'].km, 30); assert.ok(resalePrice(s, g.SHOP.find((i) => i.id === "used-car")) < quote); assert.deepEqual(g.restoreGame(s), s);
});
test("private aircraft may be owned without a licence but actual jet trips need professional crew", () => {
  let s = g.startFleetManagement(g.buy(fresh(), "altair-lightjet")); assert.throws(() => g.vehicleTrip(s, 'altair-lightjet', 'flight', 'self'), /licence|professional/); s.simulation.seed = 0; const cash = s.money; s = g.vehicleTrip(s, 'altair-lightjet', 'flight', 'crew'); assert.equal(s.money, cash - 3600); assert.equal(s.simulation.mobility.vehicles['altair-lightjet'].km, 1200); assert.deepEqual(g.restoreGame(s), s);
});
test("servicing pays the quoted cost and improves an actually damaged condition", () => {
  let s = g.startFleetManagement(g.buy(fresh(), 'used-car')); s.simulation.mobility.vehicles['used-car'].condition = 40; const cash = s.money; s = g.serviceVehicle(s, 'used-car'); assert.equal(s.money, cash - 80); assert.equal(s.simulation.mobility.vehicles['used-car'].condition, 55); assert.deepEqual(g.restoreGame(s), s);
});
test("insurance reimburses only a paid invoice under a policy held at the incident, once", () => {
  let s = g.startFleetManagement(g.buy(fresh(), 'used-car')); s = g.insureVehicle(s, 'used-car'); const v = s.simulation.mobility.vehicles['used-car']; v.incident = { id: 'incident-test', kind: 'accident', week: 0, cost: 2000, repaired: false, claimed: false, cover: { ...v.insurance } };
  assert.throws(() => g.claimInsurance(s, 'used-car'), /paid repair/); s = g.repairVehicle(s, 'used-car'); s = next(s); s = g.claimInsurance(s, 'used-car'); assert.throws(() => g.claimInsurance(s, 'used-car'), /unclaimed/);
  const control = structuredClone(s), amount = s.simulation.mobility.claims[0].amount; control.simulation.mobility.claims = [];
  const paid = weeks(s, 2), without = weeks(control, 2); assert.equal(paid.money - without.money, amount); assert.equal(paid.simulation.mobility.claims[0].status, 'paid'); assert.equal(next(paid).money - next(without).money, amount);
});
test("finance records the actual secured debt and repays it from sale proceeds", () => {
  const original = employee(), q = g.vehicleFinanceQuote(original, 'used-car', 'finance'); assert.equal(q.eligible, true);
  const s = g.financeVehicle(original, 'used-car', 'finance'); assert.equal(s.money, original.money - q.deposit - 100); assert.equal(mobilityDebt(s), q.principal); assert.ok(s.inventory.includes('used-car')); assert.equal(g.netWorth(original) - g.netWorth(s), q.deposit + 100);
  const sold = g.sellItem(s, 'used-car'); assert.equal(mobilityDebt(sold), 0); assert.equal(sold.money, s.money); assert.deepEqual(g.restoreGame(sold), sold);
});
test("leases provide use without ownership and charge contractual early-exit costs", () => {
  let s = g.financeVehicle(employee(), 'used-car', 'lease'), c = s.simulation.mobility.contracts[0]; assert.ok(!s.inventory.includes('used-car')); assert.throws(() => g.sellItem(s, 'used-car'), /do not own/); assert.throws(() => g.buy(s, 'used-car'), /Return.*lease/);
  const cost = Math.round((c.ends - s.week) * c.payment * .25 * 100) / 100, cash = s.money; s = g.repayVehicleFinance(s, c.id); assert.equal(s.money, cash - cost); assert.equal(s.simulation.mobility.vehicles['used-car'].disposition, 'returned'); assert.deepEqual(g.restoreGame(s), s);
});
test("unpaid secured credit repossesses the vehicle without erasing a deficiency", () => {
  let s = g.financeVehicle(employee(), 'used-car', 'finance'); s = g.resignJob(s); s.money = 0; s = weeks(s, 8); assert.ok(!s.inventory.includes('used-car')); assert.equal(s.simulation.mobility.vehicles['used-car'].disposition, 'repossessed'); assert.ok(mobilityDebt(s) > 0); assert.ok(s.banking.credit < 600); assert.deepEqual(g.restoreGame(s), s);
});
test("used listings stay stable within a quarter and inspected purchases retain actual condition and price", () => {
  let s = fresh(), offer = g.usedVehicleOffers(s)[0]; s = g.inspectUsedVehicle(s, offer.id); const inspected = s.simulation.mobility.inspections[0]; s = next(s); const later = g.usedVehicleOffers(s).find((o) => o.id === offer.id); assert.equal(later.condition, inspected.condition); assert.equal(later.ask, offer.ask);
  const cash = s.money; s = g.buyUsedVehicle(s, offer.id, 1); assert.equal(s.money, cash - offer.ask - 150); assert.equal(s.simulation.mobility.vehicles[offer.vehicle].condition, offer.condition); assert.equal(s.realWorld.economy.purchaseBasis[offer.vehicle], offer.ask); assert.deepEqual(g.restoreGame(s), s);
});
test("secure storage adds real recurring costs and protects uncovered assets", () => {
  let s = g.startFleetManagement(g.buy(fresh(), 'bluewater-runabout')), baseline = structuredClone(s); s = g.rentVehicleStorage(s, 'berth', 1); const r = next(s), unprotected = next(baseline); assert.equal(r.simulation.mobility.vehicles['bluewater-runabout'].condition, 100); assert.ok(unprotected.simulation.mobility.vehicles['bluewater-runabout'].condition < 100); assert.equal(r.simulation.mobility.weeklyCost, 90); assert.deepEqual(g.restoreGame(r), r);
});
test("contextual clothing considers the garment rather than its price or cosmetic colours", () => {
  let s = g.setDressContext(fresh(), 'work'); s.characterLife.profile.garment = 'Shirt'; const score = outfitSuitability(s, 'work'); s.characterLife.profile.outfit = 'Purple'; assert.equal(outfitSuitability(s, 'work'), score); s.characterLife.profile.garment = 'Hoodie'; assert.ok(outfitSuitability(s, 'work') < score); assert.deepEqual(g.restoreGame(s), s);
});
test("furnishings are unique placements, respect available room zones and leave no phantom items after sale", () => {
  let s = g.rentHome(g.buy(fresh(), 'haven-bed'), 'studio'); s = g.placeFurniture(s, 'haven-bed', 'bedroom', 'rental:studio'); assert.throws(() => g.placeFurniture(s, 'haven-bed', 'music', 'rental:studio'), /available room/); assert.equal(s.simulation.home.furniture.length, 1);
  s = g.sellItem(s, 'haven-bed'); assert.equal(s.simulation.home.furniture.length, 0); assert.deepEqual(g.restoreGame(s), s);
});
test("renovation stages spend the actual quote and update the existing property ledger", () => {
  let s = g.purchaseHome(fresh(), 'starter', 'cash'), property = s.housing.properties[0].id; const q = g.renovationQuote(s, property, 'decorate', 'specialist'); s = g.startRenovation(s, property, 'decorate', 'specialist'); assert.equal(s.simulation.home.projects[0].progress, 0);
  s = weeks(s, 15); const p = s.simulation.home.projects[0]; assert.equal(p.status, 'complete'); assert.equal(p.paid, q.price + q.permit); assert.ok(p.valueAdded > 0); assert.ok(renovationRentBonus(s, property) > 0); assert.deepEqual(g.restoreGame(s), s);
});
test("a refused extension refunds only its unused deposit and retains the approval fee", () => {
  let s = g.purchaseHome(fresh(), 'starter', 'cash'), property = s.housing.properties[0].id; const baseline = structuredClone(s); s.simulation.seed = 2000; s = g.startRenovation(s, property, 'extension', 'established'); const q = g.renovationQuote(baseline, property, 'extension', 'established');
  s = weeks(s, 4); const control = weeks(baseline, 4); assert.equal(s.simulation.home.projects[0].status, 'refused'); assert.equal(s.simulation.home.projects[0].paid, q.permit); assert.ok(Math.abs(control.money - s.money - q.permit) < .01); assert.deepEqual(g.restoreGame(s), s);
});
test("new ownership records reject invalid debt, condition and placement data", () => {
  for (const edit of [(s) => s.simulation.mobility.storage.berth = -1, (s) => s.simulation.mobility.licences.road.lessons = NaN, (s) => s.simulation.home.furniture = [{ item:'fake', room:'bedroom', property:'family', week:0 }]]) { const s = fresh(); edit(s); assert.throws(() => g.restoreGame(s)); }
});
