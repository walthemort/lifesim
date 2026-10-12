import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
import {
  professional,
  musician,
  weeks,
  labelOffer,
  sportsOffer,
  endorsementOffer,
  contactReady,
  challengeOffer,
} from "../depth-fixtures.js";
const KEY = "lifesim-save-v1";
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
async function load(page, state) {
  await page.addInitScript(
    ({ key, state }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(state));
    },
    { key: KEY, state },
  );
  await page.goto("/");
}
const nav = (page, name) =>
  page.getByRole("button", { name, exact: true }).click();
async function week(page) {
  await page
    .getByRole("button", { name: /^(Next week|Make a choice)$/ })
    .click();
  if (await page.getByRole("dialog").isVisible())
    await page.locator(".event-option").last().click();
}
for (const id of g.CONTRACT_SPORTS) {
  test(`${id}: lawyer advice, pending signing and negotiated image rights work in the sport screen`, async ({
    page,
  }) => {
    const s = professional(id),
      o = sportsOffer(s, id);
    s.contracts.seed = 1;
    await load(page, s);
    await nav(page, "Sport & development");
    await page
      .locator(`[data-action="sport-offer"][data-id="${o.id}"]`)
      .click();
    await expect(page.getByRole("dialog")).toContainText("4 weeks");
    await page
      .getByRole("combobox", { name: "Lawyer approach" })
      .selectOption("rights");
    await nav(page, "Hire lawyer & counter clauses");
    expect((await saved(page)).money).toBe(s.money - 250);
    await page
      .locator(`[data-action="sport-offer"][data-id="${o.id}"]`)
      .click();
    await expect(
      page.getByRole("button", { name: "Accept invitation" }),
    ).toBeDisabled();
    await nav(page, "Close dialog");
    await week(page);
    await week(page);
    await page
      .locator(`[data-action="sport-offer"][data-id="${o.id}"]`)
      .click();
    await expect(page.getByRole("dialog")).toContainText("10%");
    await nav(page, "Accept invitation");
    const r = await saved(page);
    expect(r.contracts.current[id].imageShare).toBe(0.1);
    await page.reload();
    await nav(page, "Work & education");
    await expect(page.locator("[data-depth-contracts]")).toContainText("10%");
    expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
  });
}
test("an exclusive label discloses delivery terms, blocks client work and exposes a concrete buyout", async ({
  page,
}) => {
  const s = musician(),
    o = labelOffer(s);
  await load(page, s);
  await nav(page, "Music & creativity");
  await page.locator(`[data-action="label-offer"][data-id="${o.id}"]`).click();
  await expect(page.getByRole("dialog")).toContainText("two owned releases");
  await expect(page.getByRole("dialog")).toContainText("exclusive recording");
  await nav(page, "Sign label agreement");
  await expect(page.locator("[data-depth-contracts]")).toContainText("0/2");
  await nav(page, "Review label buyout");
  await expect(page.getByRole("dialog")).toContainText("$1,250");
  const before = (await saved(page)).money;
  await nav(page, "Pay label buyout");
  const r = await saved(page);
  expect(r.money).toBeCloseTo(before - 1250, 2);
  expect(r.music.label).toBe(null);
  await page.reload();
  await nav(page, "Music & creativity");
  await expect(page.locator("[data-depth-contracts]")).toContainText("ended");
});
test("an endorsement pays its balance only after two scheduled appearances and keeps category exclusivity", async ({
  page,
}) => {
  const s = professional("basketball"),
    o = endorsementOffer(s, "basketball");
  await load(page, s);
  await nav(page, "Work & education");
  await page
    .locator(`[data-action="depth-endorsement-review"][data-id="${o.id}"]`)
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "two public appearances",
  );
  await nav(page, "Sign endorsement");
  let r = await saved(page),
    id = r.contracts.endorsements[0].id;
  expect(r.contracts.endorsements[0].grossPaid).toBe(500);
  expect(r.contracts.endorsements[0].imagePaid).toBe(100);
  await page
    .locator(`[data-action="depth-endorsement-book"][data-id="${id}"]`)
    .click();
  await week(page);
  r = await saved(page);
  expect(r.contracts.endorsements[0].delivered).toBe(1);
  expect(r.contracts.endorsements[0].grossPaid).toBe(500);
  await page
    .locator(`[data-action="depth-endorsement-book"][data-id="${id}"]`)
    .click();
  await week(page);
  r = await saved(page);
  expect(r.contracts.endorsements[0].grossPaid).toBe(1000);
  expect(r.contracts.endorsements[0].status).toBe("fulfilled");
  await expect(page.locator("[data-depth-contracts]")).toContainText(
    "exclusivity until",
  );
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("campaign cancellation reviews the exact advance repayment before ending delivery", async ({
  page,
}) => {
  let s = musician(),
    o = endorsementOffer(s, "music");
  s = g.acceptEndorsement(s, o.id);
  await load(page, s);
  await nav(page, "Music & creativity");
  await nav(page, "Review campaign cancellation");
  await expect(page.getByRole("dialog")).toContainText("$500");
  await nav(page, "Repay and cancel campaign");
  const r = await saved(page);
  expect(r.money).toBe(s.money - 500);
  expect(r.contracts.endorsements[0].status).toBe("cancelled");
  await expect(page.locator("[data-depth-contracts]")).toContainText(
    "gross advance repaid",
  );
});
for (const [id, kind] of [
  ["racing", "test"],
  ["tennis", "qualifier"],
]) {
  test(`${id}: distinct assessments disclose costs, reserve time and record their actual outcome`, async ({
    page,
  }) => {
    const s = professional(id),
      o = challengeOffer(s, id, kind);
    s.careerMilestones.seed = 1;
    await load(page, s);
    await nav(page, "Sport & development");
    const panel = page.locator(`[data-depth-milestones="${id}"]`);
    await panel
      .locator(`[data-action="depth-challenge-book"][data-id="${o.id}"]`)
      .click();
    const cost = kind === "test" ? 500 : 150;
    await expect(page.getByRole("dialog")).toContainText(`$${cost}`);
    await nav(page, "Enter career opportunity");
    let r = await saved(page);
    expect(r.money).toBe(s.money - cost);
    expect(g.milestoneHours(r, r.week + 1)).toBe(kind === "test" ? 6 : 8);
    await week(page);
    r = await saved(page);
    expect(
      r.careerMilestones.paths[id].opportunities.find((x) => x.id === o.id)
        .status,
    ).toBe("completed");
    await panel.getByText("Career history", { exact: true }).click();
    await expect(panel).toContainText("Assessment completed");
    await page.reload();
    expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
  });
}
test("basketball draft entry follows development and produces a separate contract invitation", async ({
  page,
}) => {
  const s = g.createGame({ age: 19, career: "basketball", seed: 8 });
  s.week = 26;
  s.money = 10000;
  s.sports.basketball.experience = 104;
  s.sports.basketball.events = 40;
  s.sports.basketball.ability = 85;
  s.skills.athletics = 85;
  const o = challengeOffer(s, "basketball", "draft");
  s.careerMilestones.seed = 1;
  await load(page, s);
  await nav(page, "Sport & development");
  await page
    .locator(`[data-action="depth-challenge-book"][data-id="${o.id}"]`)
    .click();
  await expect(page.getByRole("dialog")).toContainText("week 30");
  await nav(page, "Enter career opportunity");
  for (let i = 0; i < 4; i++) await week(page);
  const r = await saved(page);
  expect(r.employment).toBe(null);
  expect(
    r.sports.basketball.offers.some(
      (o) => o.id.startsWith("milestone:") && o.status === "offered",
    ),
  ).toBe(true);
  await expect(
    page.locator('[data-depth-milestones="basketball"]'),
  ).toContainText("Draft selection");
});
test("producer showcases build a career record and audience through an actual scheduled performance", async ({
  page,
}) => {
  const s = musician("producer"),
    o = challengeOffer(s, "music", "showcase");
  s.careerMilestones.seed = 1;
  await load(page, s);
  await nav(page, "Music & creativity");
  await page
    .locator(`[data-action="depth-challenge-book"][data-id="${o.id}"]`)
    .click();
  await nav(page, "Enter career opportunity");
  await week(page);
  const r = await saved(page);
  expect(r.careerMilestones.paths.music.unlocks).toContain("music:showcase");
  await expect(page.locator('[data-depth-milestones="music"]')).toContainText(
    "Successful audition or showcase",
  );
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("trusted contact introductions create qualified applications rather than an instant job", async ({
  page,
}) => {
  const s = g.createGame({ age: 23, seed: 8 }),
    id = contactReady(s, "office");
  s.livingWorld.seed = 1;
  await load(page, s);
  await nav(page, "Relationships");
  const card = page.locator(`[data-contact-career="${id}"]`);
  await card.getByRole("button", { name: "Ask for an introduction" }).click();
  await expect(
    card.getByRole("button", { name: "Catch up on their life" }),
  ).toBeDisabled();
  await week(page);
  await week(page);
  const r = await saved(page),
    o = r.livingWorld.opportunities[0];
  expect(o.status).toBe("introduced");
  expect(r.vacancies.some((v) => v.id === o.resultId)).toBe(true);
  expect(r.employment).toBe(null);
  await expect(page.locator("[data-living-world]")).toContainText("introduced");
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("contact support changes their own career and a later promotion changes their actual work", async ({
  page,
}) => {
  const s = g.createGame({ age: 23, seed: 8 }),
    id = contactReady(s, "business", 1);
  s.livingWorld.people[id].nextReviewWeek = s.week + 1;
  s.livingWorld.seed = 1;
  await load(page, s);
  await nav(page, "Relationships");
  await page
    .locator(`[data-contact-career="${id}"]`)
    .getByRole("button", { name: "Support their development" })
    .click();
  expect((await saved(page)).money).toBe(s.money - 100);
  await week(page);
  const r = await saved(page);
  expect(r.livingWorld.people[id].level).toBe(2);
  expect(r.connections.profiles[id].job).toBe("Small business owner");
  await expect(page.locator(`[data-contact-career="${id}"]`)).toContainText(
    "Small business owner",
  );
  await expect(page.locator(`[data-contact-career="${id}"]`)).toContainText(
    "$650",
  );
});
test("investor introductions disclose ordinary board fees and transfer no free equity", async ({
  page,
}) => {
  const s = g.createGame({ age: 23, seed: 8 }),
    id = contactReady(s, "investor");
  s.money = 1000000;
  s.livingWorld.seed = 1;
  await load(page, s);
  await nav(page, "Relationships");
  await page
    .locator(`[data-contact-career="${id}"]`)
    .getByRole("button", { name: "Ask for an introduction" })
    .click();
  await week(page);
  await week(page);
  await nav(page, "Review owner introduction");
  await expect(page.getByRole("dialog")).toContainText(
    "paid now and not refunded",
  );
  await expect(page.getByRole("dialog")).toContainText("premium");
  expect((await saved(page)).ownership).toEqual(s.ownership);
});
test("authentic v9 migration keeps the original life records and an exact pre-v11 backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v9-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const r = await saved(page);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") expect(r[key]).toEqual(value);
  expect(r.contracts.current).toEqual({});
  expect(Array.isArray(r.milestones)).toBe(true);
  await nav(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await nav(page, "Export pre-update save");
  const d = await pending;
  expect(d.suggestedFilename()).toBe("lifesim-before-v11.json");
  expect(JSON.parse(fs.readFileSync(await d.path(), "utf8"))).toEqual(old);
});
test("contract, milestone and evolving-contact panels fit phones without browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  const s = professional("racing");
  endorsementOffer(s, "racing");
  await load(page, s);
  for (const view of [
    "Work & education",
    "Sport & development",
    "Relationships",
  ]) {
    await nav(page, view);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  const m = musician();
  labelOffer(m);
  endorsementOffer(m, "music");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: KEY, state: m },
  );
  await page.reload();
  await nav(page, "Music & creativity");
  await expect(page.locator("[data-depth-contracts]")).toBeVisible();
  await expect(page.locator('[data-depth-milestones="music"]')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
