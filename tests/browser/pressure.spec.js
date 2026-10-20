import { tap, interact, reveal } from "./mobile-helpers.js";
import { gameDate } from "../../src/dates.js";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import * as g from "../../src/engine.js";
import { owned, parent } from "../pressure-fixtures.js";
import { professional, musician, weeks } from "../career-world-fixtures.js";
const KEY = "lifesim-save-v1",
  saved = (page) =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY),
  nav = (page, name) => tap(page, name);
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
for (const id of ["football-team", "harbor-fc", "gt-team", "f1-team"]) {
  test(`${id} owners can view real standings and next-week results`, async ({
    page,
  }) => {
    await load(page, weeks(owned(id), 3));
    await nav(page, "Businesses & clubs");
    const table = page.locator(`[data-owner-standings="${id}"]`);
    await expect(table.locator("tbody tr")).toHaveCount(
      ["gt-team", "f1-team"].includes(id) ? 10 : 20,
    );
    await expect(table.locator("tbody .your-side")).toHaveCount(1);
    const before = (await saved(page)).ownershipPlay.competitions[id].table[0]
      .played;
    await week(page);
    await week(page);
    expect(
      (await saved(page)).ownershipPlay.competitions[id].table[0].played,
    ).toBeGreaterThan(before);
    if (id === "f1-team")
      await expect(page.locator("[data-owner-drivers] tbody tr")).toHaveCount(
        20,
      );
  });
}
test("minority owners get reports and standings without management controls", async ({
  page,
}) => {
  await load(page, owned("football-team", 25));
  await nav(page, "Businesses & clubs");
  await expect(
    page.locator('[data-owner-standings="football-team"] tbody tr'),
  ).toHaveCount(20);
  await expect(page.locator("[data-ownership-dashboard]")).toContainText(
    "Minority shareholder",
  );
  await expect(
    page.getByRole("button", {
      name: "Commission facility upgrade",
      exact: true,
      includeHidden: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Operating budget")).toHaveCount(0);
});
test("management uses company cash for staff, operating plans and construction", async ({
  page,
}) => {
  const s = owned("cafe");
  await load(page, s);
  await nav(page, "Businesses & clubs");
  const dashboard = page.locator("[data-ownership-dashboard]");
  await interact(
    page,
    dashboard.getByLabel("Operating budget"),
    "selectOption",
    "ambitious",
  );
  await interact(
    page,
    dashboard.getByLabel("Ownership goal"),
    "selectOption",
    "development",
  );
  await nav(page, "Review operating plan");
  await interact(
    page,
    dashboard
      .getByRole("button", {
        name: "Recruit appointment",
        exact: true,
        includeHidden: true,
      })
      .first(),
    "click",
  );
  const recruited = await saved(page);
  expect(recruited.money).toBe(s.money);
  expect(recruited.ownershipPlay.management.cafe.staff).toHaveLength(1);
  expect(recruited.businessResults.cafe.cash).toBeLessThan(
    s.businessResults.cafe.cash,
  );
  await week(page);
  await nav(page, "Commission facility upgrade");
  expect(
    (await saved(page)).ownershipPlay.management.cafe.project,
  ).toBeTruthy();
  await expect(dashboard).toContainText("Construction completes in 4 weeks");
  for (let i = 0; i < 4; i++) await week(page);
  await expect(dashboard).toContainText("Facility level 1/3");
});
for (const [path, name] of [
  ["football", "Football"],
  ["racing", "Motorsport"],
  ["basketball", "Basketball"],
  ["tennis", "Tennis"],
]) {
  test(`${name} has real fixture preparation and decision outcomes`, async ({
    page,
  }) => {
    const s = professional(path),
      fixture = g.nextPerformance(s, path);
    await load(page, s);
    await nav(page, "Sport & development");
    const panel = page.locator(`[data-performance="${path}"]`);
    await interact(
      page,
      panel.getByLabel(`${name} approach`, { exact: true }),
      "selectOption",
      "attack",
    );
    await interact(
      page,
      panel.getByRole("button", {
        name: "Prepare performance plan",
        exact: true,
        includeHidden: true,
      }),
      "click",
    );
    await expect(panel).toContainText("Prepared:");
    for (let i = s.week; i < fixture.week; i++) await week(page);
    expect(["delivered", "missed"]).toContain(
      (await saved(page)).nextChapter.plans[path].status,
    );
    await expect(panel).toContainText(gameDate(fixture.week));
  });
}
test("inbox reminders can be read and archived without spending cash or accepting offers", async ({
  page,
}) => {
  await load(page, professional("racing"));
  await nav(page, "Messages & decisions");
  const message = page.locator('[data-inbox-id^="performance:"]').first(),
    before = await saved(page);
  await interact(
    page,
    message.getByRole("button", {
      name: "Mark read",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  expect((await saved(page)).money).toBe(before.money);
  expect((await saved(page)).actions).toBe(before.actions);
  await interact(
    page,
    message.getByRole("button", {
      name: "Open relevant category",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  await expect(page.locator(".sport-section").first()).toHaveAttribute(
    "id",
    "sport-section-racing",
  );
  await nav(page, "Messages & decisions");
  await interact(
    page,
    message.getByRole("button", {
      name: "Archive",
      exact: true,
      includeHidden: true,
    }),
    "click",
  );
  await nav(page, "Show archived messages");
  await expect(page.locator(".inbox-message")).toHaveCount(1);
});
test("family discussions protect a birthday and excuse the conflicting appearance", async ({
  page,
}) => {
  await load(page, parent());
  await nav(page, "Messages & decisions");
  await interact(
    page,
    page
      .locator("[data-family-conflicts] .everyday-card")
      .filter({ hasText: "Jamie’s birthday" })
      .getByLabel("Family compromise", { exact: true }),
    "selectOption",
    "attend",
  );
  await interact(
    page,
    page
      .locator("[data-family-conflicts] .everyday-card")
      .filter({ hasText: "Jamie’s birthday" })
      .getByRole("button", {
        name: "Discuss family compromise",
        exact: true,
        includeHidden: true,
      }),
    "click",
  );
  expect(
    (await saved(page)).nextChapter.familyRequests.find(
      (r) => r.kind === "birthday",
    ).status,
  ).toBe("agreed");
  await week(page);
  const s = await saved(page);
  expect(
    s.nextChapter.familyRequests.find((r) => r.kind === "birthday").status,
  ).toBe("completed");
  expect(s.seasons.football.fixtures.find((f) => f.week === 62).status).toBe(
    "unavailable",
  );
});
test("pre-release promotion funds a real unreleased recording without duplicating its project", async ({
  page,
}) => {
  let s = musician("producer");
  s = g.startPlannedRecording(s, {
    title: "Owner of the moment",
    budget: "standard",
    guest: "session",
    marketing: "none",
  });
  const before = s.money,
    projects = s.music.projects.length;
  await load(page, s);
  await nav(page, "Music & creativity");
  await page.getByRole("tab", { name: "Promote", exact: true }).click();
  await page
    .locator('#music-rollout-form [name="projectId"]')
    .selectOption(s.music.projects.at(-1).id);
  await page
    .locator('#music-rollout-form [name="kind"]')
    .selectOption("focused");
  await page
    .getByRole("button", { name: "Plan pre-release promotion" })
    .click();
  const result = await saved(page);
  expect(result.money).toBe(before - 150);
  expect(result.experience.music.campaigns[0].cost).toBe(150);
  expect(result.music.projects).toHaveLength(projects);
  await expect(page.locator("[data-music-promotion]")).toContainText(
    "Owner of the moment",
  );
});

test("creators research and edit planned videos while retaining account limits", async ({
  page,
}) => {
  let s = g.createGame({ age: 18, seed: 1 });
  s = g.buy(s, "phone");
  s = g.openSocialAccount(s, "tube");
  s = weeks(s, 1);
  await load(page, s);
  await nav(page, "Social media & fame");
  await nav(page, "Plan content production");
  await interact(
    page,
    page.getByLabel("Content budget"),
    "selectOption",
    "standard",
  );
  await interact(
    page,
    page.getByLabel("Topic research"),
    "selectOption",
    "true",
  );
  await interact(
    page,
    page.getByLabel("Production topic"),
    "selectOption",
    g.currentTrend(s),
  );
  await nav(page, "Produce planned content");
  const after = await saved(page);
  expect(after.money).toBe(s.money - 70);
  expect(Object.values(after.nextChapter.content)[0].researched).toBe(true);
  await week(page);
  expect((await saved(page)).social.posts.at(-1).status).toBe("resolved");
});
test("public replies create explicit promises and a community session delivers one", async ({
  page,
}) => {
  const s = g.createGame({ age: 23, career: "football", seed: 1 });
  s.fame.recognition = 30;
  g.refreshInbox(s);
  await load(page, s);
  await nav(page, "Messages & decisions");
  await interact(
    page,
    page.getByLabel("Public response"),
    "selectOption",
    "promise",
  );
  await nav(page, "Send public response");
  expect((await saved(page)).nextChapter.promises).toHaveLength(1);
  await nav(page, "Host community session · $50 / three hours");
  await week(page);
  expect((await saved(page)).nextChapter.promises[0].status).toBe("delivered");
});
test("v11 imports preserve all prior fields and export an exact pre-v15 backup", async ({
  page,
}) => {
  const old = JSON.parse(
    fs.readFileSync(
      new URL("../fixtures/v11-save.json", import.meta.url),
      "utf8",
    ),
  );
  await load(page, old);
  const s = await saved(page);
  for (const [key, value] of Object.entries(old))
    if (key !== "version") expect(s[key]).toEqual(value);
  expect(s.version).toBe(g.VERSION);
  await nav(page, "Save & settings");
  const pending = page.waitForEvent("download");
  await nav(page, "Export pre-update save");
  const d = await pending;
  expect(d.suggestedFilename()).toBe("lifesim-before-v16.json");
  expect(JSON.parse(fs.readFileSync(await d.path(), "utf8"))).toEqual(old);
});
test("ownership standings and inbox fit a phone without browser errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await load(page, weeks(owned("f1-team"), 3));
  await nav(page, "Businesses & clubs");
  await expect(page.locator("[data-owner-drivers] tbody tr")).toHaveCount(20);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await nav(page, "Messages & decisions");
  await expect(page.locator("main h1")).toHaveText("Your personal inbox.");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
