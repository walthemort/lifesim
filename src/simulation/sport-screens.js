import { escapeHtml } from "./screens.js";
import { gameDate } from "../dates.js";
import { form, select, panel } from "./screens.js";
import { TENNIS_ENTRIES } from "./sports.js";
export function detailedSportScreen(s, u) {
  const q = s.simulation.sports;
  return (
    u.title(
      "THE DETAILS CHANGE THE GAME",
      "Inside your sport.",
      "Match records feed the existing results and standings. One active career path still applies.",
    ) +
    ["football", "basketball", "tennis"]
      .map((id) => {
        const d = q[id],
          p = id === "football" ? s.football : s.sports[id],
          tab = id[0].toUpperCase() + id.slice(1);
        if (!d.active)
          return panel(
            u,
            tab,
            `${tab} detail`,
            ["none", "retired"].includes(p.stage)
              ? "Join the development path before opening detailed match records."
              : "Start persistent detailed match records from your next fixture.",
            form(
              s,
              "sport-detail",
              `<input name="sport" value="${escapeHtml(id)}" type="hidden">`,
              "Open detailed " + id,
              6,
            ) +
              '<button class="text-button" data-view="sports">Sport development & contracts</button>',
          );
        return (
          panel(
            u,
            tab,
            `${tab} match room`,
            id === "football"
              ? `Cautions ${d.yellow} · suspension ${d.suspended} fixtures. Starts and substitute appearances have different playing time.`
              : id === "basketball"
                ? `Squad payroll ${u.money(d.roster.filter((p) => p.expires > s.week).reduce((n, p) => n + p.salary, 0))} / ${u.money(d.cap)} annual limit. Young non-starters can request four weeks of development games.`
                : `Rolling 52-week points ${d.points} · ranking ${d.ranking ?? "unranked"}. Tournament entry is required before the fixture.`,
            id === "football"
              ? `${form(s, "combination", select(u, "teammate", "Combination partner", Object.fromEntries(d.roster.filter((p) => p.id !== "player").map((p) => [p.id, p.name]))), "Practise a passing combination", 6)}${d.suspended ? form(s, "card-appeal", "", "Submit disciplinary appeal", 6) : ""}${d.links.map((l) => `<p>${u.e(d.roster.find((p) => p.id === l.b)?.name)} · trust ${Math.round(l.trust)} · ${l.completed}/${l.passes} passes completed</p>`).join("")}`
              : id === "basketball"
                ? `${form(s, "basketball-assignment", "", "Request development assignment", 12)}${d.assignment ? `<p>Assignment through ${gameDate(d.assignment.until, s)} · ${d.assignment.appearances} games · ${d.assignment.points} points</p>` : ""}${d.roster.map((p) => `<p>${u.e(p.name)} · ${u.e(p.role)} · ${u.money(p.salary)}/year · ${p.guaranteed ? "guaranteed" : "non-guaranteed"} · ends ${gameDate(p.expires, s)}</p>`).join("")}`
                : `${form(s, "tennis-entry", select(u, "fixture", "Upcoming tournament", Object.fromEntries(s.seasons.tennis.fixtures.filter((f) => f.week > s.week && f.week <= s.week + 8).map((f) => [f.id, `${f.opponent} · ${gameDate(f.week, s)}`]))) + select(u, "draw", "Entry route", Object.fromEntries(Object.entries(TENNIS_ENTRIES).map(([id, d]) => [id, `${d.name} · ${u.money(d.fee)}`]))), "Pay tournament entry", 6)}${d.entries
                    .slice(-6)
                    .map(
                      (e) =>
                        `<p>${TENNIS_ENTRIES[e.draw].name} · ${e.status} · ${gameDate(e.week, s)}</p>`,
                    )
                    .join(
                      "",
                    )}${d.results.map((r) => `<article class="career-brief"><h3>${gameDate(r.week, s)} · ${r.points} ranking points</h3>${r.rounds.map((m, i) => `<p>Round ${i + 1}: ${m.sets.map((set) => `${set.a}–${set.b}${set.tiebreak ? ` (${set.tiebreak.join("–")})` : ""}`).join(", ")} · ${m.pointsPlayed} points played</p>`).join("")}</article>`).join("")}`,
          ) +
          (id !== "tennis"
            ? panel(
                u,
                tab,
                "Match reports",
                "Playing time, possessions, passing and discipline are recorded against the actual scheduled fixture.",
                d.matches
                  .map(
                    (m) =>
                      `<article class="career-brief"><h3>${gameDate(m.week, s)} · ${u.e(m.opponent)} · ${m.own}–${m.other}</h3><p>${m.stats.minutes} minutes · ${id === "football" ? `${m.stats.completed}/${m.stats.passes} passes · ${m.stats.fouls} cautions` : `${m.stats.points} points · ${m.stats.assists} assists · ${m.stats.rebounds} rebounds · ${m.stats.turnovers} turnovers · ${m.stats.fouls} fouls`}</p>${m.events
                        .slice(-8)
                        .map((e) => `<p>${e.minute}′ ${u.e(e.text)}</p>`)
                        .join("")}</article>`,
                  )
                  .join("") ||
                  "<p>Your next scheduled fixture will generate a detailed report.</p>",
              )
            : "")
        );
      })
      .join("") +
    panel(
      u,
      "Motorsport",
      "The race engineering desk",
      "Practice, qualifying, lap records, component lifetimes and funded seasons.",
      '<button class="button primary" data-view="race-engineering">Open race engineering</button>',
    ) +
    panel(
      u,
      "Boxing",
      "The boxing pathway",
      "Supervised gym work leads to matched amateur bouts, medical checks and eventually a professional licence. Age, recovery, training and the active-path restriction apply.",
      (() => {
        const b = q.boxing;
        return `<p>${b.stage} · ${b.training} training weeks · technique ${b.technique.toFixed(1)} · defence ${b.defence.toFixed(1)} · conditioning ${b.conditioning.toFixed(1)}</p>${["none", "retired"].includes(b.stage) ? form(s, "boxing-join", "", "Join supervised boxing · $30", 8) : `${form(s, "boxing-train", select(u, "focus", "Boxing focus", { technique: "Technique", defence: "Defence", conditioning: "Conditioning" }), "Train this week · $10 / four hours", 8)}${form(s, "boxing-medical", "", "Book medical clearance · $80", 12)}${form(s, "boxing-bout", "", "Ask the matchmaker for a bout", 12)}${b.stage === "amateur" ? form(s, "boxing-licence", "", "Apply for professional licence · $250", 18) : ""}${form(s, "boxing-leave", "", "Leave the boxing path", 8)}`}<p>Medical clearance through ${gameDate(b.medicalUntil, s)}${b.injuryUntil > s.week ? ` · suspended for recovery through ${gameDate(b.injuryUntil, s)}` : ""}</p>${b.offer ? `<p>${u.e(b.offer.opponent)} · ${b.offer.rounds} rounds · ${b.offer.status} · ${gameDate(b.offer.week, s)} · purse ${u.money(b.offer.purse)}</p>` : ""}${b.bouts.map((f) => `<article class="career-brief"><h3>${u.e(f.opponent)} · ${f.won ? "win" : "loss"}</h3><p>${gameDate(f.week, s)} · ${f.method} · ${f.rounds.map((r) => `${r.ours}–${r.theirs}`).join(", ")}</p></article>`).join("")}`;
      })(),
    )
  );
}
