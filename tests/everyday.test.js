import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";

const fresh = (o) => g.createGame({ seed: 8, age: 23, ...o });
const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
const next = (s) => g.advanceWeek(clear(s));
function weeks(s, count) {
  for (let i = 0; i < count; i++) s = next(s);
  return s;
}
function wealthy() {
  const s = fresh();
  s.money = 1e7;
  return s;
}
function employed() {
  const s = wealthy();
  // A migrated contract provides the engine's full metadata.
  const source = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("./fixtures/v1-save.json", import.meta.url)),
    ),
  );
  s.employment = { ...source.employment, weeklyPay: 3000, tenure: 52 };
  s.career = source.career;
  s.progress[s.career].level = g.jobDefinition(s.employment.jobId).level;
  return s;
}
function couple() {
  let s = g.restoreGame(
    JSON.parse(
      fs.readFileSync(new URL("./fixtures/v4-save.json", import.meta.url)),
    ),
  );
  s.money = 1e7;
  s = g.setActivity(s, "social");
  s = weeks(s, 52);
  return clear(s);
}

test("debug is opt-in, edits immutable state, rejects invalid fields, and leaves an audit after disabling", () => {
  const initial = fresh();
  assert.throws(() => g.debugEdit(initial, { money: 1e6 }), /Enable debug/);
  let s = g.toggleDebug(initial, true);
  s = g.debugEdit(s, {
    money: 1e9,
    health: 100,
    energy: 100,
    actions: 3,
    skills: { business: 80 },
    hobbySkills: { cooking: 50 },
    followers: { lens: 10000 },
  });
  assert.equal(initial.money, 12500);
  assert.equal(initial.debug.used, false);
  assert.equal(s.money, 1e9);
  assert.equal(s.pastimes.hobbies.cooking.skill, 50);
  assert.equal(s.social.profiles.lens.followers, 10000);
  for (const values of [
    { money: NaN },
    { money: Infinity },
    { energy: 101 },
    { actions: 4 },
    { actions: 1.5 },
    { age: 16 },
    { skills: { unknown: 30 } },
    { followers: { lens: 1.5 } },
    { qualification: "bogus" },
    { hobbySkills: { writing: -1 } },
  ])
    assert.throws(() => g.debugEdit(s, values));
  s = g.toggleDebug(s, false);
  assert.equal(s.debug.used, true);
  assert.equal(s.debug.enabled, false);
  assert.throws(() => g.debugEdit(s, { money: 0 }));
  assert.deepEqual(g.restoreGame(s), s);
});
test("debug grants only known credentials, completes the matching active course, and respects bid commitments", () => {
  let s = g.toggleDebug(wealthy(), true);
  s = g.enrolEducation(s, "business-cert");
  s = g.debugEdit(s, { qualification: "business-cert" });
  assert.equal(s.education.active, null);
  assert.ok(s.education.completed.includes("business-cert"));
  s = g.debugEdit(s, { qualification: "business-cert" });
  assert.equal(
    s.education.completed.filter((x) => x === "business-cert").length,
    1,
  );
  s.negotiations = [{ id: "debug-bid", status: "submitted", offer: 100000 }];
  assert.throws(() => g.debugEdit(s, { money: 99999 }), /reserved bids/);
});
test("debug time skips reproduce real weeks and stop at the end of a life", () => {
  const start = g.toggleDebug(fresh(), true),
    unchanged = structuredClone(start);
  const result = g.debugAdvance(start, 13),
    expected = weeks(start, 13);
  assert.equal(result.week, expected.week);
  assert.equal(result.money, expected.money);
  assert.deepEqual(result.market, expected.market);
  assert.deepEqual(start, unchanged);
  assert.deepEqual(g.restoreGame(result), result);
  assert.throws(() => g.debugAdvance(result, 200));
  const old = g.toggleDebug(fresh({ age: 60 }), true);
  old.week = 29 * 52 + 51;
  assert.equal(g.debugAdvance(old, 52).week, 30 * 52);
});
test("rental deposits transfer between homes and remain part of net worth", () => {
  const initial = fresh();
  let s = g.rentHome(initial, "shared");
  assert.equal(s.money, initial.money - 580);
  assert.equal(s.housing.deposit, 480);
  assert.equal(g.netWorth(s), g.netWorth(initial) - 100);
  assert.equal(g.expenses(s), 180);
  s = g.rentHome(s, "family");
  assert.equal(s.housing.deposit, 1800);
  assert.equal(g.netWorth(s), g.netWorth(initial) - 200);
  s = g.rentHome(s, "studio");
  assert.equal(s.housing.deposit, 880);
  assert.equal(g.expenses(s), 280);
  assert.equal(initial.housing.rental, null);
  assert.deepEqual(g.restoreGame(s), s);
  assert.throws(() => g.rentHome(fresh({ age: 14 }), "shared"));
});
test("cash property purchases move wealth into equity and moving in returns the rental deposit", () => {
  let s = g.rentHome(wealthy(), "studio");
  const before = g.netWorth(s),
    asking = g.propertyListings(s)[0].asking;
  s = g.purchaseHome(s, "starter", "cash");
  const p = s.housing.properties[0];
  assert.equal(s.housing.residence, null);
  assert.equal(g.netWorth(s), before - asking * 0.02);
  s = g.manageProperty(s, p.id, "move");
  assert.equal(s.housing.deposit, 0);
  assert.equal(s.housing.rental, null);
  assert.equal(g.expenses(s), 60 + 35);
  assert.deepEqual(g.restoreGame(s), s);
});
test("mortgages enforce tenure, down payment, reserves and affordability; payments reduce principal", () => {
  assert.throws(
    () => g.purchaseHome(wealthy(), "starter", "mortgage"),
    /26 weeks/,
  );
  const eligible = employed();
  const short = structuredClone(eligible);
  short.employment.tenure = 25;
  assert.throws(() => g.purchaseHome(short, "starter", "mortgage"));
  const poor = structuredClone(eligible);
  poor.money = 26500;
  assert.throws(() => g.purchaseHome(poor, "starter", "mortgage"));
  const lowWage = structuredClone(eligible);
  lowWage.employment.weeklyPay = 100;
  assert.throws(() => g.purchaseHome(lowWage, "starter", "mortgage"));
  let s = g.purchaseHome(eligible, "starter", "mortgage");
  const loan = structuredClone(s.housing.properties[0].loan);
  const before = g.netWorth(eligible),
    price = s.housing.properties[0].paid;
  assert.equal(g.netWorth(s), before - price * 0.02);
  s = next(s);
  assert.equal(
    s.housing.properties[0].loan.balance,
    Math.round(
      (Math.round(loan.balance * (1 + 0.06 / 52) * 100) / 100 - loan.payment) *
        100,
    ) / 100,
  );
  assert.ok(s.housing.properties[0].loan.balance < loan.balance);
  assert.deepEqual(g.restoreGame(s), s);
});
test("mortgage repayment clears debt once and thirteen unaffordable weeks repossess the home", () => {
  let s = g.purchaseHome(employed(), "starter", "mortgage");
  const id = s.housing.properties[0].id,
    balance = s.housing.properties[0].loan.balance,
    before = s.money;
  const paid = g.manageProperty(s, id, "repay");
  assert.equal(paid.money, before - balance);
  assert.equal(paid.housing.properties[0].loan, null);
  assert.throws(() => g.manageProperty(paid, id, "repay"));
  s = g.manageProperty(s, id, "move");
  s = g.resignJob(s);
  s.money = 0;
  s = weeks(s, 12);
  assert.equal(s.housing.properties[0].loan.missed, 12);
  assert.deepEqual(g.restoreGame(s), s);
  s = next(s);
  assert.equal(s.housing.properties.length, 0);
  assert.equal(s.housing.residence, null);
  assert.ok(s.log.some((x) => x.text.includes("repossessed")));
  assert.deepEqual(g.restoreGame(s), s);
});
test("tenant recruitment waits, then rent pays after fees and a tenant cannot be evicted for an instant sale", () => {
  let s = g.purchaseHome(wealthy(), "starter");
  const id = s.housing.properties[0].id;
  s = g.manageProperty(s, id, "let");
  s = weeks(s, 3);
  assert.equal(s.housing.weeklyIncome, 0);
  for (let i = 0; i < 40 && !s.housing.properties[0].tenant; i++) s = next(s);
  assert.equal(s.housing.properties[0].tenant, true);
  assert.equal(s.housing.weeklyIncome, 0);
  s = next(s);
  assert.equal(s.housing.weeklyIncome, 198);
  assert.equal(s.housing.totalIncome, 198);
  assert.throws(() => g.manageProperty(s, id, "move"));
  assert.throws(() => g.manageProperty(s, id, "sell"));
  assert.deepEqual(g.restoreGame(s), s);
});
test("property sales need a buyer, settle debt, and deduct commission without counting equity twice", () => {
  let s = g.purchaseHome(employed(), "starter", "mortgage");
  const id = s.housing.properties[0].id;
  s = g.manageProperty(s, id, "sell");
  s = weeks(s, 3);
  assert.equal(s.housing.properties.length, 1);
  for (let i = 0; i < 40 && s.housing.properties.length; i++) s = next(s);
  assert.equal(s.housing.properties.length, 0);
  assert.ok(s.log.some((x) => x.text.startsWith("Sold Starter flat")));
  assert.deepEqual(g.restoreGame(s), s);
});
test("property caps, rental age gates and listing refreshes are enforced", () => {
  assert.throws(() => g.purchaseHome(fresh({ age: 14 }), "starter"));
  let s = wealthy();
  for (let i = 0; i < 6; i++) {
    if (!s.actions) s = next(s);
    s = g.purchaseHome(s, "starter");
  }
  assert.throws(() => g.purchaseHome(s, "starter"), /six properties/);
  const market = g.propertyListings(s);
  s = weeks(s, 13);
  assert.notEqual(g.propertyListings(s)[0].asking, market[0].asking);
});
test("engagement and weddings require a sustained adult partnership and separate decisions", () => {
  let young = g.meet(fresh({ age: 14 }));
  young.relationships.at(-1).bond = 95;
  assert.throws(
    () => g.inviteDate(young, young.relationships.at(-1).id, "walk"),
    /not available for dating/,
  );
  assert.throws(() => g.familyAction(young, "propose"));
  let s = couple();
  const before = s.money;
  s = g.familyAction(s, "propose");
  assert.equal(s.money, before - 250);
  assert.equal(s.relationships.at(-1).role, "Partner");
  assert.throws(
    () => g.familyAction(s, "wedding", { style: "simple" }),
    /four weeks/,
  );
  s = weeks(s, 4);
  const cash = s.money;
  s = g.familyAction(clear(s), "wedding", { style: "simple" });
  assert.equal(s.money, cash - 300);
  assert.equal(s.relationships.at(-1).role, "Spouse");
  assert.equal(s.family.engagement, null);
  assert.deepEqual(g.restoreGame(s), s);
});
test("children need an established partnership and enough housing, arrive after 39 weeks, and add real costs", () => {
  let s = couple();
  assert.throws(
    () => g.familyAction(s, "child", { name: "Robin" }),
    /family-sized/,
  );
  s = g.rentHome(s, "family");
  const before = s.money;
  s = g.familyAction(s, "child", { name: "Robin" });
  assert.equal(s.money, before - 1000);
  assert.equal(s.family.children.length, 0);
  assert.throws(() => g.familyAction(s, "adopt-child", { name: "Casey" }));
  s = weeks(s, 38);
  assert.equal(s.family.children.length, 0);
  s = next(s);
  assert.equal(s.family.children[0].name, "Robin");
  assert.equal(s.family.pending, null);
  assert.equal(g.householdCosts(s), 45);
  assert.equal(g.custodyFactor(s, s.family.children[0].id), 1);
  const c = s.family.children[0],
    bond = c.bond;
  s = g.familyAction(clear(s), "child-time", { id: c.id });
  assert.ok(s.family.children[0].bond > bond);
  assert.throws(() => g.rentHome(s, "shared"), /family-sized/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("adoption takes 26 weeks, working parents pay childcare, and child costs change with age", () => {
  let s = g.rentHome(couple(), "family");
  s = g.familyAction(s, "adopt-child", { name: "Alex" });
  s = weeks(s, 25);
  assert.equal(s.family.children.length, 0);
  s = next(s);
  assert.equal(s.family.children.length, 1);
  const job = employed();
  s.employment = job.employment;
  s.career = job.career;
  s.progress[s.career].level = job.progress[s.career].level;
  assert.equal(g.householdCosts(s), 90);
  s.family.children[0].bornWeek = s.week - 5 * 52;
  assert.equal(g.householdCosts(s), 65);
  s.family.children[0].bornWeek = s.week - 13 * 52;
  assert.equal(g.householdCosts(s), 90);
  s.family.children[0].bornWeek = s.week - 18 * 52;
  assert.equal(g.householdCosts(s), 0);
});
test("parenting improves connections or education and separation preserves child responsibilities", () => {
  let s = g.rentHome(couple(), "family");
  s = g.familyAction(s, "child", { name: "Drew" });
  s = weeks(s, 39);
  const bond = s.family.children[0].bond;
  s = g.familyAction(s, "parenting", { style: "quality" });
  s = next(s);
  assert.ok(s.family.children[0].bond > bond);
  s = g.familyAction(clear(s), "breakup");
  assert.equal(s.family.partnerId, null);
  assert.equal(s.family.children.length, 1);
  assert.equal(g.householdCosts(s), 22.5);
  assert.equal(g.custodyFactor(s, s.family.children[0].id), 0.5);
  assert.deepEqual(g.restoreGame(s), s);
});
test("pets have adoption costs, recurring support, care actions and scheduled vet bills", () => {
  assert.throws(() => g.adoptPet(fresh({ age: 14 }), "dog", "Milo"));
  assert.throws(() => g.adoptPet(g.rentHome(fresh(), "shared"), "cat", "Milo"));
  let s = g.adoptPet(wealthy(), "dog", "Milo");
  const id = s.family.pets[0].id;
  assert.equal(g.householdCosts(s), 14);
  s = g.careForPet(s, id);
  assert.equal(s.family.pets[0].bond, 60);
  s = weeks(s, 26);
  assert.equal(s.family.pets[0].nextVetWeek, 52);
  assert.ok(s.log.some((x) => x.text.includes("vet check cost $80")));
  assert.deepEqual(g.restoreGame(s), s);
});
test("hobbies require equipment and deliberate practice; projects cost resources and finish after calendar time", () => {
  let s = wealthy();
  assert.throws(() => g.practiseHobby(s, "writing"), /equipment/);
  s = g.buy(s, "laptop");
  assert.throws(
    () => g.startHobbyProject(s, "writing", "First draft"),
    /ten practice/,
  );
  for (let i = 0; i < 10; i++) {
    if (!s.actions) s = next(s);
    s = g.practiseHobby(s, "writing");
  }
  if (!s.actions) s = next(s);
  const before = s.money;
  s = g.startHobbyProject(s, "writing", "First draft");
  assert.equal(s.money, before - 100);
  assert.equal(s.pastimes.projects[0].status, "working");
  assert.throws(
    () => g.startHobbyProject(s, "writing", "Second draft"),
    /Finish/,
  );
  s = weeks(s, 7);
  assert.equal(s.pastimes.projects[0].status, "working");
  s = next(s);
  assert.equal(s.pastimes.projects[0].status, "released");
  assert.ok(s.pastimes.projects[0].income > 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("six hobbies support different equipment, budgets and durations and meals require cooking skill", () => {
  assert.equal(g.HOBBIES.length, 6);
  let s = wealthy();
  assert.throws(() => g.setRoutine(s, "mealprep"), /30 cooking/);
  s = g.setRoutine(s, "frugal");
  assert.equal(g.expenses(s), 265);
  s = g.setRoutine(s, "healthy");
  assert.equal(g.expenses(s), 300);
  s.pastimes.hobbies.cooking.skill = 30;
  s = g.setRoutine(s, "mealprep");
  assert.equal(g.expenses(s), 270);
  s = g.buy(s, "laptop");
  s = g.buy(s, "phone");
  for (const h of g.HOBBIES) {
    if (!s.actions) s = next(s);
    s = g.practiseHobby(s, h.id);
    assert.equal(s.pastimes.hobbies[h.id].sessions, 1);
  }
  assert.deepEqual(g.restoreGame(s), s);
});
test("commissions arrive for established portfolios, expire, and only successful delivery earns fees", () => {
  let s = wealthy();
  s.pastimes.hobbies.art = { skill: 90, sessions: 60 };
  s = g.startHobbyProject(s, "art", "City prints");
  s = weeks(s, 6);
  for (
    let i = 0;
    i < 80 && !s.pastimes.offers.some((o) => o.status === "offered");
    i++
  )
    s = next(s);
  assert.ok(s.pastimes.offers.length);
  s = clear(s);
  s.energy = 100;
  const offer = s.pastimes.offers.find((o) => o.status === "offered"),
    before = s.money,
    taxBefore = s.banking.tax.withheld;
  s = g.deliverFreelance(s, offer.id);
  const delivered = s.pastimes.offers.find((o) => o.id === offer.id);
  assert.ok(
    Math.abs(
      s.money -
        (before -
          15 +
          (delivered.status === "completed" ? offer.fee : 0) -
          (s.banking.tax.withheld - taxBefore)),
    ) < 0.001,
  );
  assert.throws(() => g.deliverFreelance(s, offer.id));
  s.pastimes.offers.push({
    ...offer,
    id: "expired",
    status: "offered",
    expiresWeek: s.week - 1,
  });
  assert.throws(() => g.deliverFreelance(s, "expired"));
  assert.deepEqual(g.restoreGame(s), s);
});
test("community work takes energy and actions without a cash fee and milestones are recorded once", () => {
  let s = wealthy(),
    cash = s.money;
  s = g.volunteer(s);
  assert.equal(s.money, cash);
  assert.equal(s.actions, 2);
  assert.equal(s.pastimes.community, 3);
  s = g.adoptPet(s, "cat", "Fern");
  s = next(s);
  assert.ok(s.milestones.some((m) => m.id === "pet"));
  assert.ok(s.milestones.some((m) => m.id === "millionaire"));
  s = next(s);
  assert.equal(s.milestones.filter((m) => m.id === "pet").length, 1);
  assert.deepEqual(g.restoreGame(s), s);
});
test("authentic v3 saves upgrade without changing cash, investments, partner, or creative progress", () => {
  const old = JSON.parse(
      fs.readFileSync(new URL("./fixtures/v3-save.json", import.meta.url)),
    ),
    initial = structuredClone(old),
    s = g.restoreGame(old);
  assert.equal(s.version, g.VERSION);
  assert.equal(s.money, old.money);
  assert.deepEqual(s.holdings, old.holdings);
  assert.deepEqual(s.music, old.music);
  assert.deepEqual(s.social, old.social);
  assert.deepEqual(s.relationships, old.relationships);
  assert.equal(s.family.partnerId, old.relationships.at(-1).id);
  assert.equal(s.debug.enabled, false);
  assert.deepEqual(old, initial);
  assert.deepEqual(g.restoreGame(s), s);
});
test("malformed housing, family, debug and creative saves are rejected", () => {
  const base = g.adoptPet(g.purchaseHome(wealthy(), "starter"), "cat", "Fern");
  for (const corrupt of [
    (s) => (s.debug.enabled = true),
    (s) => (s.debug.edits = [{ week: 999, text: "future" }]),
    (s) => (s.housing.deposit = -1),
    (s) => (s.housing.residence = "unknown"),
    (s) => (s.housing.properties[0].value = NaN),
    (s) => (s.housing.properties[0].loan = { balance: -1 }),
    (s) => (s.family.pets[0].kind = "dragon"),
    (s) => (s.family.pending = { name: "x", kind: "instant" }),
    (s) => (s.pastimes.hobbies.writing.skill = 101),
    (s) => (s.pastimes.projects = [{ title: "Invalid" }]),
    (s) => (s.milestones = [{ id: "unknown", week: 0 }]),
  ]) {
    const s = structuredClone(base);
    corrupt(s);
    assert.throws(() => g.restoreGame(s));
  }
});
test("combined housing, family, creative and sandbox lives round trip throughout a long simulation", () => {
  let s = g.rentHome(couple(), "family");
  s = g.adoptPet(s, "cat", "Fern");
  s = next(s);
  s = g.familyAction(clear(s), "child", { name: "Robin" });
  s = g.purchaseHome(s, "townhouse");
  s = g.toggleDebug(s, true);
  s = g.debugEdit(s, { hobbySkills: { art: 60 } });
  s.pastimes.hobbies.art.sessions = 20;
  s = next(s);
  s = g.startHobbyProject(clear(s), "art", "Garden prints");
  for (let i = 0; i < 180; i++) {
    s = next(s);
    assert.deepEqual(g.restoreGame(JSON.stringify(s)), s);
  }
  assert.equal(s.family.children.length, 1);
  assert.ok(s.pastimes.totalIncome > 0);
  assert.ok(s.debug.used);
  assert.ok(s.log.length <= 40);
});
test("a landlord can give notice and reclaim a property only at the scheduled end of a lease", () => {
  let s = g.purchaseHome(wealthy(), "starter");
  const p = s.housing.properties[0];
  p.tenant = true;
  p.nextTenantWeek = s.week + 3;
  s = g.manageProperty(s, p.id, "endlease");
  assert.equal(s.housing.properties[0].endLease, true);
  assert.throws(() => g.manageProperty(s, p.id, "move"));
  s = weeks(s, 2);
  assert.equal(s.housing.properties[0].tenant, true);
  s = next(s);
  assert.equal(s.housing.properties[0].tenant, false);
  s = g.manageProperty(clear(s), p.id, "move");
  assert.equal(s.housing.residence, p.id);
  assert.deepEqual(g.restoreGame(s), s);
});
test("contextual events use trusted rewards and keep family, reputation and save data finite", () => {
  let s = g.adoptPet(wealthy(), "dog", "Milo");
  assert.ok(g.everydayEvents(s).every((e) => e.context === "pet"));
  for (const event of g.EVERYDAY_EVENTS) {
    const sample = structuredClone(s);
    sample.event = structuredClone(event);
    sample.event.options[0].cost = -1e9;
    const restored = g.restoreGame(JSON.stringify(sample));
    const cost = event.options[0].cost || 0;
    const result = g.resolveEvent(restored, 0);
    assert.equal(result.money, sample.money - cost);
    assert.ok(Number.isFinite(result.fame.reputation));
    assert.deepEqual(g.restoreGame(JSON.stringify(result)), result);
  }
  s = weeks(s, 30);
  assert.deepEqual(g.restoreGame(JSON.stringify(s)), s);
});
test("a companion lifespan ends support costs and leaves a memory rather than an immortal pet", () => {
  let s = g.adoptPet(wealthy(), "dog", "Milo");
  s.week = 13 * 52 - 1;
  s.family.pets[0].nextVetWeek = s.week + 26;
  s = next(s);
  assert.equal(s.family.pets.length, 0);
  assert.equal(s.family.petMemories[0].name, "Milo");
  assert.equal(g.householdCosts(s), 0);
  assert.deepEqual(g.restoreGame(s), s);
});
test("original shop homes count their actual bedroom capacity for new household choices", () => {
  for (const [id, bedrooms] of Object.entries(g.LEGACY_BEDROOMS)) {
    const s = g.buy(wealthy(), id);
    assert.equal(g.homeBedrooms(s), bedrooms);
    assert.deepEqual(g.restoreGame(s), s);
  }
  const family = g.buy(couple(), "country-house");
  const planned = g.familyAction(family, "child", { name: "Robin" });
  assert.equal(planned.family.pending.name, "Robin");
  const studio = g.buy(couple(), "studio-home");
  assert.throws(
    () => g.familyAction(studio, "child", { name: "Robin" }),
    /family-sized/,
  );
});
