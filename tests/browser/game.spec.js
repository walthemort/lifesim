import { tap, interact, reveal } from "./mobile-helpers.js";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
const KEY = "lifesim-save-v1"; // Keep the old key so existing lives upgrade in place.
const nav = [
  "Overview",
  "Work & education",
  "Sport & development",
  "Music & creativity",
  "Social media & fame",
  "Relationships",
  "Family & pets",
  "Homes & property",
  "Hobbies & journal",
  "Investments",
  "Lifestyle & shopping",
  "Businesses & clubs",
];
async function load(
  page,
  state = g.createGame({ seed: 1, age: 18, career: "office" }),
) {
  await page.addInitScript(
    ({ state, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { state, key: KEY },
  );
  await page.goto("/");
}
async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
}
async function week(page) {
  await interact(
    page,
    page.getByRole("button", {
      name: /^(Next week|Make a choice)$/,
      includeHidden: true,
    }),
    "click",
  );
  if (await page.getByRole("dialog").isVisible())
    await interact(page, page.locator(".event-option").last(), "click");
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return g.advanceWeek(s);
}
function hired() {
  let s = g.createGame({ seed: 1, age: 18, career: "office" });
  s = g.applyForJob(s, s.vacancies[0].id);
  s = next(next(s));
  s = g.acceptJobOffer(s, s.applications[0].id);
  return s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
}

test("all screens load without browser errors and instant career switching is gone", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await load(page);
  await reveal(
    page,
    page.getByRole("heading", {
      name: "Looking for work",
      includeHidden: true,
    }),
  );
  await expect(
    page.getByRole("heading", {
      name: "Looking for work",
      includeHidden: true,
    }),
  ).toBeVisible();
  for (const name of nav) {
    await tap(page, name);
    await reveal(page, page.locator("main h1"));
    await expect(page.locator("main h1")).toBeVisible();
  }
  expect(await page.locator('[data-action="join-career"]').count()).toBe(0);
  expect(errors).toEqual([]);
});
test("new characters start at birth with deferred interests and no qualifications", async ({
  page,
}) => {
  await load(page);
  await interact(
    page,
    page.getByRole("button", {
      name: "Save & settings",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Enable debug mode",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  await tap(page, "Overview");
  await interact(
    page,
    page.getByRole("button", {
      name: "Your character",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Create a new character",
      includeHidden: true,
    }),
    "click",
  );
  await interact(page, page.getByLabel("Your name"), "fill", "Riley Andersen");
  await interact(
    page,
    page.getByLabel("Home city"),
    "selectOption",
    "Copenhagen",
  );
  await interact(
    page,
    page.getByLabel("Life path / interest"),
    "selectOption",
    "racing",
  );
  expect(await page.getByLabel("Starting age").count()).toBe(1);
  expect(await page.getByLabel("Starting education").count()).toBe(0);
  await interact(
    page,
    page.getByRole("button", { name: "Begin my story", includeHidden: true }),
    "click",
  );
  await reveal(
    page,
    page.getByRole("heading", {
      name: "Your early years.",
      includeHidden: true,
    }),
  );
  await expect(
    page.getByRole("heading", {
      name: "Your early years.",
      includeHidden: true,
    }),
  ).toBeVisible();
  await week(page);
  await week(page);
  await page.reload();
  const s = await saved(page);
  expect(s.startAge).toBe(0);
  expect(s.money).toBe(0);
  expect(s.career).toBe("unemployed");
  expect(s.aspiration).toBe("racing");
  expect(s.sports.racing.stage).toBe("none");
  expect(s.education.completed).toEqual([]);
  expect(s.city).toBe("Copenhagen");
  expect(s.week).toBe(2);
  expect(s.version).toBe(g.VERSION);
});
test("application decisions, offer acceptance, and actual contract wages work in the browser", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Work & education");
  await interact(
    page,
    page.locator('[data-action="apply-job"][data-id="office-0:0"]'),
    "click",
  );
  await expect(page.locator(".application-list")).toContainText(
    "Decision in 2 weeks",
  );
  expect((await saved(page)).employment).toBeNull();
  await week(page);
  await week(page);
  await interact(
    page,
    page.getByRole("button", { name: "Review offer", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", { name: "Accept this job", includeHidden: true }),
    "click",
  );
  await reveal(
    page,
    page
      .getByRole("heading", {
        name: "Office assistant",
        exact: true,
        includeHidden: true,
      })
      .first(),
  );
  await expect(
    page
      .getByRole("heading", {
        name: "Office assistant",
        exact: true,
        includeHidden: true,
      })
      .first(),
  ).toBeVisible();
  let s = await saved(page);
  expect(s.employment.jobId).toBe("office-0");
  const cash = s.money,
    pay = s.employment.weeklyPay;
  await week(page);
  s = await saved(page);
  expect(s.money).toBe(cash + pay - 280 - s.banking.tax.lastWeekly);
  expect(s.progress.office.weeks).toBe(1);
});
test("finishing education unlocks a vacancy, while an incomplete credential blocks application", async ({
  page,
}) => {
  let s = hired();
  s.week = 105;
  s.money = 100000;
  s.progress.office.weeks = 52;
  s.skills.business = 45;
  s = g.enrolEducation(s, "business-cert");
  s.education.active.progress = 25.5;
  s.activity = "study";
  s.vacancies = [
    {
      id: "office-1:105",
      jobId: "office-1",
      postedWeek: 105,
      expiresWeek: 109,
      exceptional: false,
    },
  ];
  await load(page, s);
  await tap(page, "Work & education");
  await expect(page.locator('[data-action="apply-job"]')).toBeDisabled();
  await expect(page.locator(".vacancy-card")).toContainText("Still needed");
  await week(page);
  await expect(page.locator('[data-action="apply-job"]')).toBeEnabled();
  await interact(page, page.locator('[data-action="apply-job"]'), "click");
  expect((await saved(page)).applications.at(-1).status).toBe("pending");
});
test("enrolment costs, part-time progress, and withdrawal are visible and persistent", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Work & education");
  await interact(
    page,
    page.locator('[data-action="enrol"][data-id="business-cert"]'),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Enrol in programme",
      includeHidden: true,
    }),
    "click",
  );
  await week(page);
  await expect(page.locator(".enrolment")).toContainText("0.5 / 26");
  expect((await saved(page)).money).toBe(12500 - 280 - 35);
  await interact(
    page,
    page.getByRole("button", {
      name: "Withdraw from programme",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Confirm withdrawal",
      includeHidden: true,
    }),
    "click",
  );
  expect((await saved(page)).education.active).toBeNull();
});
test("salary discussions can raise pay without changing jobs and then disable repeat requests", async ({
  page,
}) => {
  const s = hired();
  s.week = s.employment.nextRaiseWeek;
  s.seed = 1;
  s.employment.performance = 100;
  s.skills.charisma = 100;
  await load(page, s);
  await tap(page, "Work & education");
  await interact(
    page,
    page.getByRole("button", { name: "Discuss a raise", includeHidden: true }),
    "click",
  );
  const r = await saved(page);
  expect(r.employment.jobId).toBe("office-0");
  expect(r.employment.weeklyPay).toBeGreaterThan(s.employment.weeklyPay);
  await expect(
    page.getByRole("button", { name: "Discuss a raise", includeHidden: true }),
  ).toBeDisabled();
});
test("fractional crypto and company shares trade, while shopping and relationships still work", async ({
  page,
}) => {
  await load(page);
  await tap(page, "Investments");
  await interact(
    page,
    page.locator('[data-action="trade"][data-id="crypto"]'),
    "click",
  );
  await interact(page, page.getByLabel("Number of units"), "fill", "0.1");
  await interact(
    page,
    page.getByRole("button", { name: "Confirm trade", includeHidden: true }),
    "click",
  );
  expect((await saved(page)).holdings.crypto).toBe(0.1);
  await interact(
    page,
    page.locator('[data-action="trade"][data-id="tech"]'),
    "click",
  );
  await interact(page, page.getByLabel("Number of units"), "fill", "10");
  await interact(
    page,
    page.getByRole("button", { name: "Confirm trade", includeHidden: true }),
    "click",
  );
  await expect(
    page.locator(".market-row").filter({ hasText: "Horizon Technologies" }),
  ).toContainText("10 shares");
  await expect(
    page.locator(".market-row").filter({ hasText: "Horizon Technologies" }),
  ).toContainText("0.000010% owned");
  await tap(page, "Lifestyle & shopping");
  await interact(
    page,
    page.locator('[data-action="retail-store"][data-id="Home & hobbies"]'),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Shopping category"),
    "selectOption",
    "Style",
  );
  await interact(
    page,
    page.locator('[data-action="buy"][data-id="watch"]'),
    "click",
  );
  await expect(
    page.locator(".shop-card").filter({ hasText: "The everyday watch" }),
  ).toContainText("Owned");
  await tap(page, "Relationships");
  await interact(
    page,
    page.getByRole("button", { name: "Meet someone", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.locator('[data-action="connect"][data-id="sam"]'),
    "click",
  );
  expect((await saved(page)).actions).toBe(1);
});
test("a real owner introduction, premium bid, acceptance, and closing acquire a company", async ({
  page,
}) => {
  let candidate;
  for (let seed = 1; seed < 40; seed++) {
    const s = g.createGame({ seed: 1, age: 18, career: "office" });
    s.seed = seed;
    s.money = 1000000;
    s.skills.charisma = 100;
    let trial = g.requestBoardMeeting(s, "cafe");
    trial = next(next(trial));
    if (trial.negotiations[0].status === "open") {
      candidate = s;
      break;
    }
  }
  expect(candidate).toBeTruthy();
  await load(page, candidate);
  await tap(page, "Businesses & clubs");
  await interact(
    page,
    page.locator('[data-action="approach"][data-id="cafe"]'),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Pay for introduction request",
      includeHidden: true,
    }),
    "click",
  );
  await week(page);
  await week(page);
  await interact(page, page.locator('[data-action="review-bid"]'), "click");
  await interact(
    page,
    page.getByLabel("Stake to acquire"),
    "selectOption",
    "100",
  );
  await interact(page, page.getByLabel("Your cash offer"), "fill", "400000");
  await interact(
    page,
    page.getByRole("button", {
      name: "Submit funded offer",
      includeHidden: true,
    }),
    "click",
  );
  expect(g.reservedCash(await saved(page))).toBe(400000);
  await week(page);
  await week(page);
  await interact(page, page.locator('[data-action="review-bid"]'), "click");
  await interact(
    page,
    page.getByRole("button", {
      name: "Complete acquisition",
      includeHidden: true,
    }),
    "click",
  );
  const result = await saved(page);
  expect(g.stakePercent(result, "cafe")).toBe(100);
  expect(g.reservedCash(result)).toBe(0);
  await expect(page.locator('[data-business="cafe"]')).toContainText(
    "100.000%",
  );
  await reveal(
    page,
    page.locator('[data-business="cafe"] [data-business-strategy]'),
  );
  await expect(
    page.locator('[data-business="cafe"] [data-business-strategy]'),
  ).toBeVisible();
});
test("football club sale windows transfer ownership and expose per-business management", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18, career: "office" });
  s.money = 2000000;
  s.opportunities = [
    {
      id: "sale:football-team:0",
      targetId: "football-team",
      stake: 100,
      askingPrice: 850000,
      expiresWeek: 6,
    },
  ];
  await load(page, s);
  await tap(page, "Businesses & clubs");
  await interact(
    page,
    page.getByRole("button", { name: "Review sale", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Acquire offered stake",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.locator('[data-business-strategy="football-team"]'),
    "selectOption",
    "development",
  );
  await week(page);
  const r = await saved(page);
  expect(r.ownership["football-team"].stake).toBe(100);
  expect(r.businessResults["football-team"].strategy).toBe("development");
  expect(r.teams["football-team"].races).toBe(1);
  await reveal(page, page.locator('[data-business="f1-team"]'));
  await expect(page.locator('[data-business="f1-team"]')).toBeVisible();
  await reveal(page, page.locator('[data-business="gt-team"]'));
  await expect(page.locator('[data-business="gt-team"]')).toBeVisible();
});
test("collectible auctions can leave high-reserve lots unsold", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18, career: "office" });
  s.collectibles.listings = [
    { id: "card:0", collectibleId: "rookie-card", price: 850, expiresWeek: 8 },
  ];
  await load(page, s);
  await tap(page, "Investments");
  await interact(
    page,
    page.locator('[data-action="collectible"][data-id="card:0"]'),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", {
      name: "Purchase collectible",
      includeHidden: true,
    }),
    "click",
  );
  await interact(
    page,
    page.locator('[data-action="consign"][data-id="rookie-card"]'),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Minimum acceptable bid"),
    "fill",
    "100000",
  );
  await interact(
    page,
    page
      .getByRole("dialog", { includeHidden: true })
      .getByRole("button", { name: "Consign to auction", includeHidden: true }),
    "click",
  );
  await week(page);
  await week(page);
  const r = await saved(page);
  expect(r.collectibles.auctions[0].status).toBe("unsold");
  expect(r.collectibles.owned["rookie-card"]).toBeTruthy();
  await expect(
    page
      .locator(".collectible-card")
      .filter({ hasText: "Signed rookie football card" }),
  ).toContainText("Last auction found no qualifying buyer");
});
test("an employee leaves the current career before founding and developing a company", async ({
  page,
}) => {
  const s = hired();
  s.skills.business = 35;
  await load(page, s);
  await tap(page, "Start & run a company");
  await expect(page.locator("[data-career-commitment]")).toContainText(
    "Leave your Office work",
  );
  await page
    .getByRole("button", { name: "Leave this path", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm leaving current path" })
    .click();
  expect((await saved(page)).employment).toBeNull();
  await interact(
    page,
    page.getByRole("button", { name: "Plan a company", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Company name"),
    "fill",
    "Northstar Labs",
  );
  await interact(
    page,
    page.getByRole("button", { name: "Launch company", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.getByRole("button", { name: "Manage company", includeHidden: true }),
    "click",
  );
  await interact(
    page,
    page.getByLabel("Company strategy"),
    "selectOption",
    "reinvest",
  );
  await interact(
    page,
    page.getByRole("button", { name: "Set my direction", includeHidden: true }),
    "click",
  );
  await week(page);
  const r = await saved(page);
  expect(r.company.name).toBe("Northstar Labs");
  expect(r.company.strategy).toBe("reinvest");
  expect(r.employment).toBeNull();
  expect(r.career).toBe("business");
  expect(r.company.revenue).not.toBe(400);
});
test("v1 lives migrate in the browser with a downloadable pre-update backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v1-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const r = await saved(page);
  expect(r.version).toBe(g.VERSION);
  expect(r.money).toBe(old.money);
  expect(r.employment.weeklyPay).toBe(2100);
  expect(r.ownership["football-team"].stake).toBe(100);
  await interact(
    page,
    page.getByRole("button", { name: "Save & settings", includeHidden: true }),
    "click",
  );
  const downloaded = page.waitForEvent("download");
  await interact(
    page,
    page.getByRole("button", {
      name: "Export pre-update save",
      includeHidden: true,
    }),
    "click",
  );
  expect((await downloaded).suggestedFilename()).toBe(
    "lifesim-before-v16.json",
  );
});
test("export/import and unreadable-save recovery remain usable", async ({
  page,
}) => {
  await load(page);
  await week(page);
  await interact(
    page,
    page.getByRole("button", { name: "Save & settings", includeHidden: true }),
    "click",
  );
  const downloaded = page.waitForEvent("download");
  await interact(
    page,
    page.getByRole("button", {
      name: "Export save",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  expect((await downloaded).suggestedFilename()).toBe("lifesim-save.json");
  const current = JSON.stringify(await saved(page));
  await page.locator("#import-save").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "invalid",
  );
  await page.locator("#import-save").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(current),
  });
  await interact(
    page,
    page.getByRole("button", {
      name: "Replace current save",
      includeHidden: true,
    }),
    "click",
  );
  expect((await saved(page)).week).toBe(1);
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"version":99,"name":"Old life"}'),
    KEY,
  );
  await page.reload();
  await expect(page.locator(".warning")).toContainText("recovery copy");
  await interact(
    page,
    page.getByRole("button", { name: "Save & settings", includeHidden: true }),
    "click",
  );
  await reveal(
    page,
    page.getByRole("button", {
      name: "Export recovery copy",
      includeHidden: true,
    }),
  );
  await expect(
    page.getByRole("button", {
      name: "Export recovery copy",
      includeHidden: true,
    }),
  ).toBeVisible();
});
test("all screens fit on a phone, including large balances and controlled companies", async ({
  page,
}) => {
  const s = g.createGame({ seed: 1, age: 18, career: "office" });
  s.money = 3000000000;
  s.holdings.tech = 60000000;
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, s);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const name of nav) {
    await tap(page, name);
    const sizes = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
    }));
    expect(sizes.scroll, name).toBeLessThanOrEqual(sizes.width);
  }
  expect(errors).toEqual([]);
});
