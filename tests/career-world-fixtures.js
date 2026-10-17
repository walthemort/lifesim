import * as g from "../src/engine.js";

export const athlete = (s, id) =>
  id === "football" ? s.football : s.sports[id];
export const clear = (s) =>
  s.event ? g.resolveEvent(s, s.event.options.length - 1) : s;
export const next = (s) => clear(g.advanceWeek(clear(s)));
export function weeks(s, count) {
  for (let i = 0; i < count; i++) s = next(s);
  return s;
}
export function professional(id, seed = 1) {
  let s = g.createGame({ age: 23, career: id, seed });
  s.money = 1000000;
  s.skills[g.TRACK_SKILLS[id]] = 90;
  s.progress[id].weeks = 52;
  for (const licence of ["school", "racing-license", "international-license"])
    if (!s.education.completed.includes(licence))
      s.education.completed.push(licence);
  const p = athlete(s, id),
    j = g.jobDefinition(`${id}-1`);
  p.ability = 85;
  p.discipline = 90;
  p.reputation = 80;
  const o = {
    id: `${id}:fixture`,
    kind: "contract",
    club: j.employer,
    jobId: j.id,
    pay: j.pay,
    duration: 104,
    status: "offered",
    expiresWeek: 4,
  };
  g.enhanceSportOffer(s, id, o);
  p.offers.push(o);
  s =
    id === "football"
      ? g.acceptFootballOffer(s, o.id)
      : g.acceptSportOffer(s, id, o.id);
  // An explicitly open transfer market keeps these existing fixtures focused on contract rules.
  for (const destination of g.SPORT_DESTINATIONS[id])
    for (let level = 1; level <= 4; level++) {
      const seat = s.realWorld.rivals.athletes.find(
        (a) =>
          a.path === id && a.level === level && a.club === destination.name,
      );
      if (seat) {
        seat.status = "free";
        seat.availableSince = s.week;
      }
    }
  return next(s);
}
export function moveOffer(
  id,
  kind = "transfer",
  destination = g.SPORT_DESTINATIONS[id][1].name,
) {
  for (let seed = 1; seed <= 50; seed++) {
    let s = professional(id, seed);
    s = g.requestSportMove(s, id, { kind, destination, role: "starter" });
    s = weeks(
      s,
      s.careerWorld.sports[id].requests.at(-1).decisionWeek - s.week,
    );
    const o = athlete(s, id).offers.find(
      (o) => o.status === "offered" && s.careerWorld.sports[id].moves[o.id],
    );
    if (o) return { s, o, seed };
  }
  throw new Error(`No ${id} move offer across deterministic seeds.`);
}
export function musician(role = "producer", count = 3) {
  let s = g.createGame({ age: 23, career: "music", seed: 8 });
  s = g.configureMusic(s, { role, genre: "Electronic" });
  s.money = 100000;
  s.music.sessions = 24;
  s.music.skills = { production: 80, lyrics: 80, vocals: 80 };
  s.music.fans = 1000;
  s = g.buy(s, "workstation");
  s = g.buy(s, "microphone");
  s = next(s);
  for (let i = 0; i < count; i++) {
    s = g.startMusicProject(s, { title: `Catalogue track ${i + 1}` });
    s = weeks(s, 4);
  }
  s.music.fans = 1000;
  return s;
}
export function musicOffer(s, kind = "collaboration") {
  const artist = g.COLLABORATORS[0];
  const o = {
    id: `fixture:${kind}:${s.week}`,
    kind,
    artist: artist.name,
    skill: artist.skill,
    fee: kind === "client" ? 0 : artist.fee,
    royalty: kind === "client" ? 1 : artist.share,
    audience: artist.fans * 10,
    clientPay: kind === "client" ? 620 : 0,
    minimumQuality: kind === "client" ? 40 : 0,
    status: "offered",
    expiresWeek: s.week + 4,
    deadline: s.week + 10,
    projectId: null,
    negotiation: null,
  };
  s.careerWorld.music.offers = [o];
  return o;
}
