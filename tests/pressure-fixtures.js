import * as g from "../src/engine.js";
import { professional, musician } from "./career-world-fixtures.js";

export function owned(id = "football-team", stake = 100) {
  let s = g.createGame({ seed: 1, age: 30 });
  s.money = 1e9;
  const b = g.BUSINESSES.find((b) => b.id === id);
  s.opportunities.push({
    id: `owned:${id}`,
    targetId: id,
    stake,
    askingPrice: (b.value * stake) / 100,
    expiresWeek: 4,
  });
  return g.acquireOpportunity(s, `owned:${id}`);
}
export function parent(path = "football") {
  let s = path === "music" ? musician("singer") : professional(path);
  s = g.rentHome(s, "family");
  s.week = 61;
  s.relationships[0].role = "Spouse";
  s.family.partnerId = s.relationships[0].id;
  s.family.sinceWeek = 10;
  s.family.children = [
    {
      id: "child:fixture",
      name: "Jamie",
      parentId: s.family.partnerId,
      bornWeek: 10,
      bond: 75,
      wellbeing: 80,
      education: 10,
      interest: "music",
      club: "none",
      schoolType: "state",
      confidence: 60,
      independence: 50,
      future: "undecided",
      support: false,
      lastSupportWeek: 61,
    },
  ];
  s.event = null;
  for (const id of g.SEASON_SPORTS) g.syncSeason(s, id);
  g.initializeOwnershipPlay(s);
  g.initializePressure(s);
  return s;
}
