import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
import {
  athlete,
  professional,
  moveOffer,
  musician,
  musicOffer,
} from "../career-world-fixtures.js";
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
for (const id of g.WORLD_SPORTS) {
  test(`${id}: qualified career talks, review, household plan and signing persist`, async ({
    page,
  }) => {
    const { seed } = moveOffer(id),
      s = professional(id, seed),
      oldClub = athlete(s, id).club;
    await load(page, s);
    await nav(page, "Work & education");
    const panel = page.locator(`[data-sport-world="${id}"]`),
      form = panel.locator("#sport-move-form");
    await form
      .locator('[name="destination"]')
      .selectOption(g.SPORT_DESTINATIONS[id][1].name);
    await form.locator('[name="role"]').selectOption("starter");
    await form.getByRole("button").click();
    expect(athlete(await saved(page), id).club).toBe(oldClub);
    await expect(panel).toContainText("pending");
    await week(page);
    await week(page);
    await expect(
      panel.getByRole("button", { name: "Review career move" }),
    ).toBeVisible();
    await panel.getByRole("button", { name: "Review career move" }).click();
    await expect(page.getByRole("dialog")).toContainText("Household plan");
    await expect(page.getByRole("dialog")).toContainText("funding");
    await nav(page, "Sign career move");
    const r = await saved(page);
    expect(athlete(r, id).club).toBe(g.SPORT_DESTINATIONS[id][1].name);
    expect(r.employment.employer).toBe(athlete(r, id).club);
    expect(r.careerWorld.sports[id].travel).toBe(true);
    await page.reload();
    await nav(page, "Work & education");
    await expect(panel).toContainText("Copenhagen");
    await expect(panel).toContainText("travel");
    expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
  });
}
test("a transfer opened from the existing invitation list uses the same household and negotiation flow", async ({
  page,
}) => {
  const { s, o } = moveOffer("football");
  await load(page, s);
  await nav(page, "Sport & development");
  await page.locator(`[data-action="sport-offer"][data-id="${o.id}"]`).click();
  await expect(page.getByRole("dialog")).toContainText("Household plan");
  await page
    .getByRole("combobox", { name: "Contract approach" })
    .selectOption("security");
  await nav(page, "Send counteroffer");
  const panel = page.locator('[data-sport-world="football"]');
  await panel.getByRole("button", { name: "Review career move" }).click();
  await expect(
    page.getByRole("button", { name: "Sign career move" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await week(page);
  await week(page);
  await panel.getByRole("button", { name: "Review career move" }).click();
  await expect(
    page.getByRole("button", { name: "Sign career move" }),
  ).toBeEnabled();
  await nav(page, "Sign career move");
  expect((await saved(page)).football.club).toBe(o.club);
});
test("basketball loans disclose the parent return contract and survive a browser reload", async ({
  page,
}) => {
  const { s, o } = moveOffer("basketball", "loan");
  await load(page, s);
  await nav(page, "Sport & development");
  await page
    .locator('[data-sport-world="basketball"]')
    .getByRole("button", { name: "Review career move" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("twenty-six weeks");
  await nav(page, "Sign career move");
  const r = await saved(page);
  expect(r.careerWorld.sports.basketball.loan.returnWeek).toBe(r.week + 26);
  expect(r.sports.basketball.club).toBe(o.club);
  await page.reload();
  await nav(page, "Sport & development");
  await expect(page.locator('[data-sport-world="basketball"]')).toContainText(
    "return",
  );
  await week(page);
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("race engineers, physiotherapists and engineering debriefs work from the career panel", async ({
  page,
}) => {
  const s = professional("racing");
  await load(page, s);
  await nav(page, "Work & education");
  const panel = page.locator('[data-sport-world="racing"]');
  await panel
    .locator('[data-action="world-staff-hire"][data-id="coach"]')
    .click();
  await panel
    .locator('[data-action="world-staff-hire"][data-id="physio"]')
    .click();
  await panel
    .locator('[data-action="world-sport-activity"][data-kind="team"]')
    .click();
  let r = await saved(page);
  expect(r.money).toBe(s.money - 550);
  expect(r.careerWorld.sports.racing.staff).toEqual(["coach", "physio"]);
  expect(r.careerWorld.sports.racing.chemistry).toBe(52);
  await page.reload();
  await nav(page, "Work & education");
  await panel
    .locator('[data-action="world-staff-dismiss"][data-id="coach"]')
    .click();
  r = await saved(page);
  expect(r.careerWorld.sports.racing.staff).toEqual(["physio"]);
});
test("international tennis appearances reserve time and resolve through the weekly calendar", async ({
  page,
}) => {
  const s = professional("tennis");
  s.careerWorld.sports.tennis.invitations.push({
    id: "test-invitation",
    name: "National tennis exhibition",
    fee: 150,
    status: "offered",
    expiresWeek: s.week + 3,
    performanceWeek: null,
  });
  await load(page, s);
  await nav(page, "Sport & development");
  await page.locator('[data-action="world-international"]').click();
  let r = await saved(page);
  expect(g.careerWorldHours(r, r.week + 1)).toBe(8);
  await nav(page, "Weekly calendar");
  await expect(page.locator("main")).toContainText("8");
  await week(page);
  r = await saved(page);
  expect(["completed", "missed"]).toContain(
    r.careerWorld.sports.tennis.invitations[0].status,
  );
  expect(g.restoreGame(r)).toEqual(r);
});
test("collaboration recording displays ownership and produces a shared release", async ({
  page,
}) => {
  const s = musician("singer"),
    o = musicOffer(s);
  await load(page, s);
  await nav(page, "Music & creativity");
  const panel = page.locator("[data-music-world]");
  await expect(panel).toContainText("70%");
  await panel.getByRole("button", { name: "Record project" }).click();
  await page
    .getByRole("textbox", { name: "Project title" })
    .fill("Together in the city");
  await nav(page, "Start agreed recording");
  expect((await saved(page)).careerWorld.music.offers[0].status).toBe(
    "accepted",
  );
  for (let i = 0; i < 4; i++) await week(page);
  const r = await saved(page),
    id = r.careerWorld.music.offers[0].projectId;
  expect(r.careerWorld.music.offers[0].status).toBe("released");
  expect(g.musicReleaseShare(r, id)).toBe(0.7);
  await expect(page.locator("main")).toContainText("Together in the city");
  await page.reload();
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("music counteroffers settle before recording and cannot be repeated", async ({
  page,
}) => {
  const s = musician(),
    o = musicOffer(s);
  await load(page, s);
  await nav(page, "Work & education");
  const panel = page.locator("[data-music-world]");
  await panel.getByRole("button", { name: "Discuss terms" }).click();
  await expect(
    panel.getByRole("button", { name: "Record project" }),
  ).toBeDisabled();
  await expect(
    panel.getByRole("button", { name: "Discuss terms" }),
  ).toBeDisabled();
  await week(page);
  await week(page);
  await expect(
    panel.getByRole("button", { name: "Record project" }),
  ).toBeEnabled();
  expect(["agreed", "refused"]).toContain(
    (await saved(page)).careerWorld.music.offers.find((x) => x.id === o.id)
      .negotiation.status,
  );
});
test("owned tracks can be mastered into an album without duplicating the catalogue", async ({
  page,
}) => {
  const s = musician();
  await load(page, s);
  await nav(page, "Music & creativity");
  await page
    .getByRole("textbox", { name: "Album title" })
    .fill("My first chapter");
  for (const checkbox of await page
    .locator('#world-album-form input[type="checkbox"]')
    .all())
    await checkbox.check();
  await nav(page, "Master an album");
  let r = await saved(page);
  expect(r.money).toBe(s.money - 250);
  expect(r.careerWorld.music.albums[0].status).toBe("mastering");
  await week(page);
  await week(page);
  r = await saved(page);
  expect(r.careerWorld.music.albums[0].status).toBe("released");
  expect(r.music.releases.length).toBe(s.music.releases.length);
  await page.reload();
  await nav(page, "Music & creativity");
  await expect(page.locator("[data-music-world]")).toContainText(
    "My first chapter",
  );
});
test("tour rehearsal, live crew budgeting, actual shows and concrete cancellation work together", async ({
  page,
}) => {
  const s = musician();
  await load(page, s);
  await nav(page, "Work & education");
  const panel = page.locator("[data-music-world]");
  await panel.getByRole("button", { name: "Rehearse live set" }).click();
  await panel.getByRole("combobox", { name: "Live team" }).selectOption("band");
  await panel.getByRole("button", { name: "Plan tour" }).click();
  let r = await saved(page);
  expect(r.careerWorld.music.tours[0].stops[0].cost).toBe(280);
  expect(r.careerWorld.music.liveReadiness).toBe(26);
  await week(page);
  await week(page);
  r = await saved(page);
  expect(["performed", "missed"]).toContain(
    r.careerWorld.music.tours[0].stops[0].status,
  );
  expect(r.careerWorld.music.tours[0].costs).toBe(400);
  await panel.getByRole("button", { name: "Review tour cancellation" }).click();
  await expect(page.getByRole("dialog")).toContainText("$140");
  const cash = r.money;
  await nav(page, "Cancel remaining tour");
  r = await saved(page);
  expect(r.money).toBe(cash - 140);
  expect(r.careerWorld.music.activeTour).toBe(null);
  await page.reload();
  await nav(page, "Work & education");
  await expect(panel).toContainText("cancelled");
  expect(g.restoreGame(await saved(page))).toEqual(await saved(page));
});
test("authentic v8 saves migrate and provide an exact downloadable pre-update backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v8-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const r = await saved(page);
  expect(r.version).toBe(g.VERSION);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") expect(r[key]).toEqual(value);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(`${key}-before-v11`)),
      KEY,
    ),
  ).toEqual(old);
  await nav(page, "Save & settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export pre-update save" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("lifesim-before-v11.json");
  expect(JSON.parse(fs.readFileSync(await file.path(), "utf8"))).toEqual(old);
});
test("expanded sport and music panels fit a phone and load without browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, professional("football"));
  for (const id of g.WORLD_SPORTS) {
    const s = professional(id);
    await page.evaluate(
      ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
      { key: KEY, state: s },
    );
    await page.reload();
    await nav(page, "Sport & development");
    await expect(page.locator(`[data-sport-world="${id}"]`)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  const artist = musician();
  artist.music.fans = 10000;
  const s = g.startMusicTour(artist, {
    route: "international",
    crew: "production",
  });
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
    { key: KEY, state: { ...s } },
  );
  await page.reload();
  await nav(page, "Music & creativity");
  await expect(page.locator("[data-music-world]")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
