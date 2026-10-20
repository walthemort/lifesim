import test from "node:test";
import assert from "node:assert/strict";
import * as g from "../src/engine.js";
import {
  creativeRecordingReady,
  creativeRoyaltyFactor,
  creativeDiscovery,
  recordLocalShow,
  localMusicDemand,
} from "../src/simulation/creativity.js";
function artist() {
  let s = g.createGame({ age: 25, seed: 8 });
  s.money = 1e7;
  s = g.configureMusic(s, { role: "singer", genre: "Pop" });
  s = g.buy(s, "phone");
  s.music.sessions = 20;
  s.music.skills = { vocals: 80, lyrics: 80, production: 80 };
  return g.openCreativeStudio(s);
}
function next(s) {
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  s = g.advanceWeek(s);
  if (s.event) s = g.resolveEvent(s, s.event.options.length - 1);
  return s;
}
function weeks(s, n) {
  for (let i = 0; i < n; i++) {
    s = next(s);
    g.restoreGame(s);
  }
  return s;
}
function recording(s = artist()) {
  s = g.startMusicProject(s, { title: "Real Recording" });
  return s;
}
test("publishing assigns only composition receipts, pays once and preserves master rights", () => {
  let s = recording(),
    id = s.music.projects[0].id;
  s = g.agreeWritingSplit(s, id, 0.5);
  s = next(s);
  const cash = s.money;
  s = g.assignPublishing(s, id);
  assert.equal(s.money > cash, true);
  assert.ok(
    creativeRoyaltyFactor(s, id) > 0.85 && creativeRoyaltyFactor(s, id) < 1,
  );
  assert.equal(g.musicReleaseShare(s, id), 1);
  assert.throws(() => g.assignPublishing(s, id), /already/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("a sample request blocks release until permission and the actual quoted payment", () => {
  let s = recording(),
    id = s.music.projects[0].id;
  s = g.requestSampleClearance(s, id, "Cedar Archive");
  assert.equal(creativeRecordingReady(s, id), false);
  s.simulation.seed = 0;
  s = weeks(s, 2);
  const sample = s.simulation.creativity.samples[0];
  assert.equal(sample.status, "offered");
  const cash = s.money;
  s = g.resolveSample(s, sample.id, "license");
  assert.equal(s.money, cash - sample.fee);
  assert.equal(creativeRecordingReady(s, id), true);
  assert.equal(creativeRoyaltyFactor(s, id), 0.9);
  assert.throws(() => g.resolveSample(s, sample.id, "license"), /unresolved/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("an alternate version requires new recording work and shares its original composition", () => {
  let s = weeks(recording(), 4),
    original = s.music.projects[0].id;
  s = g.createRecordingVersion(s, original, "acoustic");
  const id = s.music.projects.at(-1).id;
  assert.equal(creativeRecordingReady(s, id), false);
  s = next(s);
  s = g.workRecordingVersion(s, id);
  s = next(s);
  s = g.workRecordingVersion(s, id);
  s = weeks(s, 2);
  assert.equal(s.music.projects.find((p) => p.id === id).status, "ready");
  s = g.scheduleCreativeVersion(s, id);
  s = next(s);
  assert.ok(s.music.releases.some((r) => r.id === id));
  assert.equal(s.simulation.creativity.versions[0].composition, original);
  assert.deepEqual(g.restoreGame(s), s);
});
test("group ownership persists after leaving while new solo recordings remain solo", () => {
  let s = artist();
  s = g.formMusicGroup(s, "The Cedars");
  s = g.startMusicProject(s, { title: "Group Master" });
  const id = s.music.projects[0].id;
  assert.equal(s.simulation.creativity.rights[id].groupShare, 1 / 3);
  s = next(s);
  s = g.leaveMusicGroup(s);
  assert.equal(creativeRoyaltyFactor(s, id), 1 / 3);
  s = weeks(s, 3);
  s = g.startMusicProject(s, { title: "Solo Master" });
  assert.equal(
    s.simulation.creativity.rights[s.music.projects.at(-1).id].groupShare,
    1,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("videos spend staged production budgets and support the same release", () => {
  let s = recording(),
    id = s.music.projects[0].id;
  s = next(s);
  const cash = s.money;
  s = g.startMusicVideo(s, id, "home");
  assert.equal(s.money, cash - 50);
  const v = s.simulation.creativity.videos[0];
  assert.throws(() => g.workMusicVideo(s, v.id, "edit"), /storyboard/);
  for (const method of ["storyboard", "shoot", "edit"]) {
    s = next(s);
    s = g.workMusicVideo(s, v.id, method);
  }
  assert.equal(s.simulation.creativity.videos[0].paid, 200);
  assert.equal(s.simulation.creativity.videos[0].status, "released");
  assert.equal(creativeDiscovery(s, id), 1.15);
  assert.equal(s.music.releases.length, 1);
  assert.deepEqual(g.restoreGame(s), s);
});
test("city fans influence actual local demand with bounded discovery effects", () => {
  const s = artist();
  s.music.fans = 1000;
  const before = localMusicDemand(s, s.city);
  recordLocalShow(s, s.city, 400);
  assert.ok(localMusicDemand(s, s.city) > before);
  assert.equal(s.simulation.creativity.fanbases[0].fans, 20);
  assert.deepEqual(g.restoreGame(s), s);
});
test("live community has real cost, viewers, members and once-weekly controls", () => {
  let s = artist();
  s = g.openSocialAccount(s, "stream");
  s.social.profiles.stream.followers = 10000;
  s = next(s);
  s = g.goLive(s, "Production session");
  const live = s.simulation.creativity.community.streams[0];
  assert.ok(live.viewers > 0);
  assert.ok(live.joined > 0);
  assert.ok(live.tips > 0);
  assert.equal(s.simulation.creativity.community.lastLive, s.week);
  assert.throws(() => g.goLive(s, "Another stream"), /Wait/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("production staff charge wages and require approval for additional work", () => {
  let s = recording();
  s = next(s);
  s = g.hireCreativeTeam(s, "editor");
  s = weeks(s, 4 - (s.week % 4));
  const t = s.simulation.creativity.team[0];
  assert.equal(t.proposal.status, "pending");
  const quality = s.music.projects[0].quality;
  s = g.approveCreativeProposal(s, t.id);
  assert.equal(s.simulation.creativity.team[0].proposal.status, "approved");
  assert.equal(s.music.projects[0].quality, quality);
  assert.throws(() => g.approveCreativeProposal(s, t.id), /pending/);
  assert.deepEqual(g.restoreGame(s), s);
});
test("geographic touring charges actual travel once and does not grant foreign entry", () => {
  let s = weeks(recording(), 4);
  s = g.startMusicProject(s, { title: "Second Recording" });
  s = weeks(s, 4);
  s.music.fans = 1000;
  s = g.startMusicTour(s, { route: "local", crew: "solo" });
  const tour = s.careerWorld.music.tours.at(-1),
    cash = s.money;
  s = g.planTourGeography(s, tour.id, [s.city, s.city, s.city]);
  assert.equal(s.money, cash - 120);
  assert.equal(s.careerWorld.music.tours.at(-1).costs, tour.costs + 120);
  assert.throws(
    () => g.planTourGeography(s, tour.id, ["New York", "New York", "New York"]),
    /once per tour/,
  );
  assert.deepEqual(g.restoreGame(s), s);
});
test("creative save validation rejects invalid shares, negative audiences and invoices", () => {
  for (const change of [
    (s) => (s.simulation.creativity.community.subscribers = -1),
    (s) => (s.simulation.creativity.team = [{ id: "x", role: "unknown" }]),
    (s) =>
      (s.simulation.creativity.rights.x = {
        id: "x",
        writerShare: 2,
        groupShare: 1,
        publishing: null,
      }),
  ]) {
    const s = artist();
    change(s);
    assert.throws(() => g.restoreGame(s));
  }
});
