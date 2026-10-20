import { gameDate } from "../dates.js";
import { form, select, panel } from "./screens.js";
import {
  KART_CHASSIS,
  KART_ENGINES,
  DISCIPLINES,
  superLicencePoints,
} from "./racing.js";
export function raceEngineeringScreen(s, u) {
  const d = s.simulation.racing,
    w = d.weekends.find((w) => w.id === d.current),
    upcoming = s.seasons.racing.fixtures.filter(
      (f) => f.week > s.week && f.week <= s.week + 2,
    );
  const title = u.title(
    "THE RACE ENGINEERING DESK",
    "Every lap has a reason.",
    "Prepare, practise and qualify for scheduled races. Your equipment, setup, weather and component condition shape the classification.",
  );
  if (!d.active)
    return (
      title +
      panel(
        u,
        "Weekend",
        "Begin detailed motorsport",
        "Join motorsport development first. Detailed racing requires a prepared weekend and funded kart entries from the next race onward.",
        form(s, "racing-detail", "", "Open race engineering", 6) +
          '<button class="text-button" data-view="sports">Motorsport development & contracts</button>',
      )
    );
  return (
    title +
    panel(
      u,
      "Weekend",
      "Next race weekend",
      "Start within two weeks of the race. Practice and qualifying are separate sessions. Engineering feedback and setup changes are optional decisions.",
      `${form(s, "race-weekend", select(u, "fixture", "Upcoming race", Object.fromEntries(upcoming.map((f) => [f.id, `${f.opponent} · ${gameDate(f.week, s)}`]))), "Open the weekend plan", 6)}${w ? `<h3>${u.e(w.name)}</h3><p>${gameDate(w.week, s)} · ${w.weather} forecast · ${w.status} · ${w.practice} practice sessions · qualifying ${w.qualifying === null ? "not run" : `${w.qualifying}s reference lap`}</p>${w.feedback ? `<p>${u.e(w.feedback.finding)} · suggested balance ${w.feedback.balance} · confidence ${Math.round(w.feedback.confidence)}</p>` : ""}${w.status === "preparing" ? `${form(s, "race-practice", "", "Run reference practice · three hours", 6)}${form(s, "race-feedback", "", "Discuss engineering feedback · two hours", 6)}${form(s, "race-setup", `<label class="field-label">Balance<input name="balance" type="number" min="20" max="80" value="${w.setup.balance}" required></label><label class="field-label">Downforce<input name="downforce" type="number" min="20" max="80" value="${w.setup.downforce}" required></label>` + select(u, "strategy", "Race approach", { balanced: "Balanced pace", push: "Push: faster, more wear and risk", conserve: "Conserve equipment" }, w.strategy) + select(u, "tyre", "Starting tyres", { soft: "Soft", medium: "Medium", hard: "Hard", wet: "Wet" }, w.tyre) + select(u, "teamOrder", "Team instructions", { comply: "Follow team instructions", race: "Race for your own result" }, w.teamOrder), "Confirm race setup", 6)}${form(s, "race-qualifying", "", "Run qualifying · two hours", 6)}` : ""}` : "<p>No current weekend.</p>"}`,
    ) +
    panel(
      u,
      "Reports",
      "Race control",
      "Detailed lap records feed the actual championship result. Neutralisations, stops, retirements and team orders have consequences.",
      d.weekends
        .filter((w) => w.status !== "preparing")
        .map(
          (w) =>
            `<article class="career-brief"><h3>${u.e(w.name)} · ${w.status}</h3><p>Position ${w.position || "—"}${w.retired ? " · retired" : ""} · race costs ${u.money(w.cost)}</p><div class="table-scroll"><table><thead><tr><th>Lap / stage</th><th>Position</th><th>Elapsed</th><th>Race control</th></tr></thead><tbody>${w.laps.map((l) => `<tr><td>${l.lap}</td><td>${l.position || "—"}</td><td>${l.time.toFixed(2)}s</td><td>${u.e(l.event)}</td></tr>`).join("")}</tbody></table></div></article>`,
        )
        .join("") ||
        "<p>Race reports appear after your prepared race date.</p>",
    ) +
    panel(
      u,
      "Kart budget",
      "A season you can afford",
      "Entries, tyres, travel and a repair reserve are itemised. Children need an actual parent with sufficient wealth. Component servicing uses available season escrow first. Unused escrow returns to its original payer at year end.",
      `${form(s, "kart-budget", "", "Reserve the remaining kart season budget", 6)}${d.seasons
        .slice(0, 4)
        .map(
          (b) =>
            `<article class="career-brief"><h3>${s.startingYear + b.year} · ${b.status}</h3><p>Entries ${u.money(b.entries)} · tyres ${u.money(b.tyres)} · travel ${u.money(b.travel)} · repair reserve ${u.money(b.repairs)}</p><p>Original funding ${u.money(b.total)} · spent ${u.money(b.spent)} · remaining ${u.money(b.balance)} · returned ${u.money(b.refunded)}</p>${b.transactions
              .slice(-5)
              .map(
                (t) =>
                  `<p>${gameDate(t.week, s)} · entry ${u.money(t.entry)} / travel ${u.money(t.travel)} / tyres ${u.money(t.tyres)}</p>`,
              )
              .join("")}</article>`,
        )
        .join(
          "",
        )}${form(s, "kart-equipment", select(u, "chassis", "Kart chassis", Object.fromEntries(Object.entries(KART_CHASSIS).map(([id, d]) => [id, `${d.name} · ${u.money(Math.max(200, d.cost))} if changed`])), d.chassis) + select(u, "engine", "Kart engine", Object.fromEntries(Object.entries(KART_ENGINES).map(([id, d]) => [id, `${d.name} · ${u.money(Math.max(120, d.cost))} if changed`])), d.engine), "Pay for legal kart equipment (refit minimums apply)", 6)}`,
    ) +
    panel(
      u,
      "Components",
      "Keep the machinery running",
      "Condition declines through actual sessions and laps. Worn components add time and retirement risk; a rebuild costs real funds.",
      Object.entries(d.components)
        .map(
          ([id, value]) =>
            `<article class="career-brief"><h3>${id} · ${value.toFixed(1)}%</h3>${form(s, "race-service", `<input name="component" type="hidden" value="${id}">`, "Pay for component service", 6)}</article>`,
        )
        .join(""),
    ) +
    panel(
      u,
      "Career",
      "Licences, duties & disciplines",
      "Super Licence eligibility needs age 18 and 40 points earned across the latest three seasons. A licence still does not create a vacant F1 seat.",
      `<p>Super Licence points ${superLicencePoints(s)}/40 · team trust ${Math.round(d.trust)}</p>${d.superPoints.map((p) => `<p>${s.startingYear + p.year} ${p.tier.toUpperCase()} · P${p.position} · ${p.points} points</p>`).join("")}<button class="text-button" data-view="career">Licence courses & qualifications</button>${form(s, "race-reserve", "", "Request a reserve-driver placement", 18)}${d.reserve ? `<p>${d.reserve.status} · ${d.reserve.delivered} delivered duties · through ${gameDate(d.reserve.ends, s)}</p>` : ""}${form(s, "reserve-duty", select(u, "kind", "Reserve assignment", { simulator: "Simulator correlation · four hours", briefing: "Engineering briefing · four hours", test: "Supervised test · eight hours / $100" }), "Deliver reserve duties", 18)}${form(s, "race-discipline", select(u, "discipline", "Racing discipline", DISCIPLINES, d.discipline), "Change discipline between contracts · $250", 16)}<p>Endurance uses longer races, stint reviews and tyre stops. Rally uses timed stages. Results outside single-seaters do not award formula ladder promotions or Super Licence points.</p>`,
    )
  );
}
