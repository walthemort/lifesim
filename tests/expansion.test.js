import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as g from "../src/engine.js";
import { gameDate, displayDates } from "../src/dates.js";
import { careerCockpit } from "../src/expansion-screens.js";
const fresh = (opts = {}) => g.createGame({ age: 18, seed: 1, ...opts });
const next = (s) =>
  g.advanceWeek(s.event ? g.resolveEvent(s, s.event.options.length - 1) : s);
const weeks = (s, n) => {
  for (let i = 0; i < n; i++) s = next(s);
  return s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
};
const studio = () => {
  let s = fresh({ career: "music" });
  s = g.buy(s, "phone");
  s = g.buy(s, "laptop");
  s.music.sessions = 8;
  s.music.skills = { vocals: 65, lyrics: 60, production: 55 };
  return s;
};
const work = (s, id) => {
  while (
    ["beat", "lyrics", "vocals"].includes(
      s.globalLife.tracks.find((t) => t.id === id).stage,
    )
  ) {
    if (!s.actions || s.event) s = next(s);
    s = g.workTrack(s, id);
  }
  return s;
};
test("the world catalogue covers 250 countries/territories and over 150,000 named settlements", () => {
  assert.equal(g.COUNTRIES.length, 250);
  assert.ok(
    Object.values(g.CITY_CATALOGUE).reduce((n, a) => n + a.length, 0) > 150000,
  );
  for (const [code, city] of [
    ["DK", "Copenhagen"],
    ["JP", "Tokyo"],
    ["BR", "São Paulo"],
    ["NG", "Lagos"],
    ["US", "New York"],
  ])
    assert.ok(g.validPlace(code, city));
  assert.equal(g.validPlace("DK", "New York"), false);
});
test("a global birthplace generates local opportunities and round-trips without fabricating citizenship history", () => {
  const s = fresh({ city: "Tokyo", country: "JP" });
  assert.equal(s.city, "Tokyo");
  assert.equal(s.globalLife.birthCountry, "JP");
  assert.deepEqual(s.globalLife.citizenships, ["JP"]);
  assert.equal(s.characterLife.profile.nationality, "Japanese");
  assert.deepEqual(g.restoreGame(s), s);
  const r = weeks(s, 14);
  assert.ok(r.characterLife.localOffers.some((o) => o.city === "Tokyo"));
  assert.deepEqual(g.restoreGame(r), r);
});
test("ordinary characters are random; Pro creation starts at birth and derives citizenship from the chosen birthplace", () => {
  const free = fresh();
  assert.throws(
    () => g.createCustomCharacter(free, { name: "New baby" }),
    /Debug or Pro/,
  );
  let pro = g.setProPreview(g.toggleDebug(free, true), true);
  pro = g.toggleDebug(pro, false);
  const baby = g.createCustomCharacter(pro, {
    name: "Aiko",
    country: "JP",
    birthplace: "Tokyo",
    city: "Tokyo",
    hairstyle: "Braids",
    face: "Round",
    eyebrows: "Thick",
    garment: "Hoodie",
  });
  assert.equal(baby.startAge, 0);
  assert.equal(baby.money, 0);
  assert.equal(baby.city, "Tokyo");
  assert.equal(baby.characterLife.profile.hairstyle, "Braids");
  assert.deepEqual(baby.globalLife.citizenships, ["JP"]);
  assert.deepEqual(g.restoreGame(baby), baby);
  assert.throws(
    () => g.editCharacterProfile(pro, { nationality: "American" }),
    /citizenship/,
  );
  assert.throws(
    () => g.editCharacterProfile(pro, { birthplace: "Monaco" }),
    /history/,
  );
});
test("visa applications require a route and real funds; citizenship is not needed to move", () => {
  let s = fresh();
  assert.throws(
    () => g.moveCountry(s, { country: "US", city: "New York" }),
    /residence permission/,
  );
  assert.throws(
    () => g.applyImmigration(s, { country: "US", route: "work" }),
    /employment/,
  );
  assert.throws(
    () => g.applyImmigration(s, { country: "US", route: "investor" }),
    /250,000/,
  );
  s.money = 300000;
  s.globalLife.seed = 0;
  const before = s.money;
  s = g.applyImmigration(s, { country: "US", route: "investor" });
  assert.equal(s.money, before - 450);
  assert.equal(s.globalLife.applications[0].status, "pending");
  s = weeks(s, 26);
  assert.equal(s.globalLife.applications[0].status, "approved");
  const cash = s.money;
  s = g.moveCountry(s, { country: "US", city: "New York" });
  assert.equal(s.money, cash - 1000);
  assert.equal(s.globalLife.residence.country, "US");
  assert.equal(s.characterLife.profile.birthplace, "London");
  assert.deepEqual(s.globalLife.citizenships, ["GB"]);
  assert.ok(s.globalLife.permits[0].endsWeek > s.week);
  assert.deepEqual(g.restoreGame(s), s);
});
test("EU freedom of movement works without silently converting a Danish passport to German citizenship", () => {
  const s = fresh({ city: "Copenhagen", country: "DK" }),
    r = g.moveCountry(s, { country: "DE", city: "Berlin" });
  assert.equal(r.city, "Berlin");
  assert.deepEqual(r.globalLife.citizenships, ["DK"]);
  assert.equal(r.globalLife.permits.length, 0);
  assert.deepEqual(g.restoreGame(r), r);
});
test("naturalisation is a delayed application after residence and civic knowledge, preserving the original passport", () => {
  let s = fresh({ city: "Copenhagen", country: "DK" });
  s.money = 300000;
  s = g.moveCountry(s, { country: "DE", city: "Berlin" });
  assert.throws(
    () => g.applyImmigration(s, { country: "DE", route: "citizenship" }),
    /years|civic/,
  );
  s = weeks(s, 260);
  s.globalLife.language = 60;
  s.globalLife.seed = 0;
  s = g.applyImmigration(s, { country: "DE", route: "citizenship" });
  assert.deepEqual(s.globalLife.citizenships, ["DK"]);
  s = weeks(s, 20);
  assert.deepEqual(s.globalLife.citizenships, ["DK", "DE"]);
  assert.equal(s.characterLife.profile.birthplace, "Copenhagen");
  assert.deepEqual(g.restoreGame(s), s);
});
test("relocation contacts require Pro/Debug and cannot erase criminal records or immigration qualifications", () => {
  let s = fresh();
  s.money = 300000;
  assert.throws(
    () => g.moveCountry(s, { country: "US", city: "New York", contact: true }),
    /Pro or Debug/,
  );
  s = g.toggleDebug(s, true);
  const r = g.moveCountry(s, {
    country: "US",
    city: "New York",
    contact: true,
  });
  assert.equal(r.money, s.money - 2500);
  assert.deepEqual(r.globalLife.citizenships, ["GB"]);
  s.globalLife.seed = 0;
  s = g.commitCrime(s, "fraud");
  while (s.globalLife.crime.prison) s = next(s);
  assert.throws(
    () => g.moveCountry(s, { country: "US", city: "New York", contact: true }),
    /cannot bypass/,
  );
  assert.ok(s.globalLife.crime.record.length);
  assert.deepEqual(g.restoreGame(s), s);
});
test("custody blocks shopping, work applications and ordinary preparation while time, markets and rehabilitation continue", () => {
  let s = fresh();
  s.globalLife.seed = 0;
  s = g.commitCrime(s, "theft");
  assert.ok(s.globalLife.crime.prison);
  assert.equal(s.actions, 0);
  assert.equal(s.employment, null);
  assert.throws(() => g.buy(s, "phone"), /custody/);
  assert.throws(() => g.practiseMusic(s), /actions/);
  s = g.prisonActivity(s, "rehabilitation");
  assert.equal(s.globalLife.crime.rehabilitation, 1);
  assert.throws(() => g.prisonActivity(s, "exercise"), /One supervised/);
  assert.deepEqual(g.restoreGame(s), s);
  const oldPrice = s.market.tech;
  s = next(s);
  assert.notEqual(s.market.tech, oldPrice);
  s = weeks(s, 25);
  assert.equal(s.globalLife.crime.prison, null);
  assert.equal(s.actions, 3);
  assert.equal(s.globalLife.crime.record.length, 1);
  assert.deepEqual(g.restoreGame(s), s);
});
test("buying and wearing outfits uses cash once, while premium hairstyles have a Pro gate", () => {
  let s = fresh();
  const old = s.money;
  s = g.buyClothing(s, "tee");
  assert.equal(s.money, old - 18);
  assert.equal(s.globalLife.wearing, "tee");
  assert.equal(s.characterLife.profile.garment, "T-shirt");
  const r = g.wearClothing(s, "tee");
  assert.equal(r.money, s.money);
  assert.equal(r.actions, s.actions);
  assert.throws(() => g.wearClothing(s, "suit"), /Purchase/);
  assert.throws(
    () => g.visitBarber(s, { hairstyle: "Braids", hair: "Black" }),
    /Pro or Debug/,
  );
  s = g.visitBarber(s, { hairstyle: "Fade", hair: "Brown", tier: "local" });
  assert.equal(s.money, old - 38);
  assert.equal(s.characterLife.profile.hairstyle, "Fade");
  assert.deepEqual(g.restoreGame(s), s);
});
test("a staged track rates beats, lyrics and performances and remains unreleased after mixing", () => {
  let s = studio();
  s = g.setArtistName(s, "Northstar");
  s = g.startTrack(s, {
    title: "Homebound",
    beat: "lease",
    theme: "Personal",
    ambition: "lean",
  });
  const id = s.globalLife.tracks[0].id;
  assert.equal(s.globalLife.tracks[0].stage, "lyrics");
  assert.equal(s.music.releases.length, 0);
  s = work(s, id);
  assert.equal(s.globalLife.tracks[0].stage, "mixing");
  assert.equal(s.music.projects.at(-1).manualRelease, true);
  s = weeks(s, 4);
  assert.equal(s.globalLife.tracks[0].stage, "ready");
  assert.equal(s.music.projects.at(-1).status, "ready");
  assert.equal(s.music.releases.length, 0);
  assert.equal(s.music.totalIncome, 0);
  assert.deepEqual(g.restoreGame(s), s);
  s = g.releaseTrack(s, id);
  assert.equal(s.music.releases.length, 0);
  s = next(s);
  assert.equal(s.music.releases.length, 1);
  assert.equal(s.music.releases[0].title, "Homebound");
  assert.ok(s.music.releases[0].quality > 0);
  assert.ok(s.music.releases[0].totalStreams > 0);
  assert.throws(() => g.releaseTrack(s, id), /Finish production/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("an instrumental still requires production and performance; a self-produced beat needs a computer", () => {
  let s = studio();
  s.inventory = s.inventory.filter((id) => id !== "laptop");
  assert.throws(
    () => g.startTrack(s, { title: "Loop", beat: "produce" }),
    /computer/,
  );
  s = g.buy(s, "laptop");
  s = g.startTrack(s, {
    title: "Loop",
    beat: "produce",
    theme: "Instrumental",
    ambition: "lean",
  });
  s = work(s, s.globalLife.tracks[0].id);
  assert.ok(s.globalLife.tracks[0].beatQuality > 0);
  assert.equal(
    s.globalLife.tracks[0].lyricQuality,
    s.globalLife.tracks[0].beatQuality,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("an album can sequence unreleased tracks and creates one catalogue record per track", () => {
  let s = studio();
  const ids = [];
  for (let i = 0; i < 3; i++) {
    if (!s.actions) s = next(s);
    s = g.startTrack(s, {
      title: `Album track ${i}`,
      beat: "lease",
      ambition: "lean",
    });
    s = work(s, s.globalLife.tracks.at(-1).id);
    s = weeks(s, 4);
    ids.push(s.music.projects.at(-1).id);
  }
  assert.equal(s.music.releases.length, 0);
  s = g.assembleAlbum(s, { title: "First album", tracks: ids });
  s = weeks(s, 2);
  assert.equal(s.careerWorld.music.albums[0].status, "released");
  assert.equal(s.music.releases.length, 3);
  assert.equal(new Set(s.music.releases.map((r) => r.id)).size, 3);
  assert.deepEqual(g.restoreGame(s), s);
});
test("company industries have their own capital needs and development is paid only from company cash", () => {
  let s = fresh();
  s.skills.business = 50;
  assert.equal(g.INDUSTRIES.length, 24);
  assert.throws(
    () => g.foundCompany(s, { name: "Cars", sector: "Car dealership" }),
    /75,000/,
  );
  s = g.foundCompany(s, {
    name: "Market Coffee",
    sector: "Coffee shop",
    model: "retail",
    price: "budget",
  });
  assert.equal(s.money, 500);
  assert.equal(s.company.cash, 12000);
  const cash = s.money,
    company = s.company.cash;
  s = g.businessDevelopment(s, "quality");
  assert.equal(s.money, cash);
  assert.equal(s.company.cash, company - 300);
  assert.equal(s.globalLife.companyPlan.quality, 52);
  assert.throws(() => g.businessDevelopment(s, "marketing"), /per week/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("date rendering keeps durations while converting absolute contract timestamps beyond year one", () => {
  assert.equal(gameDate(1224), "21 Jun 2049");
  assert.equal(
    displayDates("ends at week 1224; lasts 104 weeks; Week 52"),
    "ends at 21 Jun 2049; lasts 104 weeks; 4 Jan 2027",
  );
});
test("v12 migration preserves original identity and every existing field with additive global systems", () => {
  const old = JSON.parse(
      fs.readFileSync(
        new URL("./fixtures/v12-save.json", import.meta.url),
        "utf8",
      ),
    ),
    s = g.restoreGame(old);
  assert.equal(s.version, 13);
  for (const [k, v] of Object.entries(old))
    if (k !== "version") assert.deepEqual(s[k], v, k);
  assert.deepEqual(g.restoreGame(s), s);
  assert.equal(s.globalLife.moves.length, 0);
  assert.equal(s.globalLife.crime.record.length, 0);
});
test("save validation rejects forged locations, citizenships, retail ownership, crimes and studio ratings", () => {
  const s = fresh();
  for (const edit of [
    (r) => (r.globalLife.residence.country = "ZZ"),
    (r) => (r.globalLife.residence.city = "Tokyo"),
    (r) => r.globalLife.citizenships.push("ZZ"),
    (r) => (r.globalLife.language = 1000),
    (r) => r.globalLife.wardrobe.push("fake"),
    (r) =>
      (r.globalLife.crime.prison = {
        startsWeek: 0,
        releaseWeek: 52,
        crime: "fraud",
      }),
    (r) => (r.globalLife.companyPlan = { model: "free money" }),
  ]) {
    const r = structuredClone(s);
    edit(r);
    assert.throws(() => g.restoreGame(r), /Invalid/);
  }
});

test("founder funding conserves net worth and industry pivots cannot bypass higher capital requirements", () => {
  let s = fresh();
  s.skills.business = 50;
  s.money = 150000;
  s = g.foundCompany(s, { name: "Pivot Co", sector: "Technology" });
  const wealth = g.netWorth(s),
    cash = s.money;
  assert.throws(
    () =>
      g.configureCompany(s, {
        name: s.company.name,
        sector: "Car dealership",
        strategy: "balanced",
      }),
    /company cash/,
  );
  s = g.fundFounder(s, 100000);
  assert.equal(s.money, cash - 100000);
  assert.equal(s.company.cash, 105000);
  assert.equal(g.netWorth(s), wealth);
  s = g.configureCompany(s, {
    name: s.company.name,
    sector: "Car dealership",
    strategy: "balanced",
  });
  assert.equal(s.company.cash, 27500);
  assert.equal(s.company.sector, "Car dealership");
  assert.equal(s.globalLife.companyPlan.customers, 0);
  assert.deepEqual(g.restoreGame(s), s);
});
