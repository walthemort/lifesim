import { country } from "../geography.js";
import { CRIMES } from "../expansion-data.js";
import { releaseSportAgreement } from "../contracts.js";
import { recordWorkReference } from "./professions.js";
import {
  act,
  age,
  clamp,
  round,
  roll,
  uid,
  note,
  once,
  num,
  str,
  bool,
  one,
  arr,
  obj,
  stamps,
} from "./common.js";
export function initializeJustice(s) {
  return {
    active: false,
    lastWeek: s.week,
    cases: [],
    supervision: null,
    lastCustody: s.globalLife.crime.prison
      ? { ...s.globalLife.crime.prison }
      : null,
    parole: null,
    actions: {},
  };
}
export function openJusticeRecord(state) {
  if (state.ended || age(state) < 12 || state.simulation.justice.active)
    throw new Error(
      "Legal records require an ongoing life aged twelve or older.",
    );
  const s = structuredClone(state);
  s.simulation.justice.active = true;
  return s;
}
export function investigatedCrime(state, id) {
  const d = CRIMES[id],
    j = state.simulation.justice;
  if (
    !d ||
    !j.active ||
    j.cases.filter(
      (c) => !["closed", "acquitted", "convicted"].includes(c.status),
    ).length >= 3
  )
    throw new Error(
      "Choose an available scenario with fewer than three unresolved cases.",
    );
  const s = act(state, { minAge: d.age, hours: 3, energy: 5 }),
    n = s.simulation.justice,
    c = s.globalLife.crime;
  c.attempts++;
  c.heat = clamp(c.heat + 15);
  const succeeded = roll(s) > 0.25,
    gain = succeeded ? d.gain : 0;
  s.money = round(s.money + gain);
  n.cases.unshift({
    id: uid(s, "investigation"),
    crime: id,
    since: s.week,
    due: s.week + 2,
    hearing: null,
    status: "investigating",
    evidence: clamp(d.risk * 65 + c.heat * 0.25 + roll(s) * 25),
    lawyer: false,
    plea: "trial",
    gain,
    restitution: 0,
    outcome: "",
  });
  n.cases = [
    ...n.cases.filter(
      (c) => !["closed", "acquitted", "convicted"].includes(c.status),
    ),
    ...n.cases
      .filter((c) => ["closed", "acquitted", "convicted"].includes(c.status))
      .slice(0, 27),
  ];
  note(
    s,
    `${d.name}: ${gain ? `$${gain} received` : "the attempt failed"}. Witness and financial evidence may lead to an investigation. Consequences can arrive later.`,
    "warning",
  );
  return s;
}
export function respondToCase(state, id, choice) {
  const c = state.simulation.justice.cases.find((c) => c.id === id);
  if (
    !c ||
    !["interview", "charged"].includes(c.status) ||
    !["lawyer", "guilty", "trial"].includes(choice) ||
    (choice === "lawyer" && c.lawyer)
  )
    throw new Error("Choose an available response to an interview or charge.");
  const s = act(state, {
      minAge: 12,
      cost: choice === "lawyer" ? 500 : 0,
      hours: 2,
    }),
    n = s.simulation.justice.cases.find((c) => c.id === id);
  once(s, s.simulation.justice.actions, `response:${id}`, 1);
  if (choice === "lawyer") {
    n.lawyer = true;
    note(
      s,
      "A solicitor reviewed the case. Advice can challenge weak procedure; it cannot guarantee an acquittal.",
    );
  } else {
    n.plea = choice;
    note(
      s,
      choice === "guilty"
        ? "Recorded a guilty plea. A sentence reduction may apply; fines and restitution remain."
        : "Requested a contested hearing on the evidence.",
    );
  }
  return s;
}
function enterCustody(s, crime, weeks) {
  recordWorkReference(s);
  s.globalLife.crime.prison = {
    startsWeek: s.week,
    releaseWeek: s.week + Math.max(1, weeks),
    crime,
  };
  s.actions = 0;
  s.event = null;
  s.employment = null;
  s.career =
    s.company && !s.profession.company.delegated ? "business" : "unemployed";
  for (const id of ["football", "racing", "basketball", "tennis"]) {
    const p = id === "football" ? s.football : s.sports[id];
    if (p.contract) releaseSportAgreement(s, id, { automatic: true });
    p.contract = null;
    if (!["none", "retired"].includes(p.stage))
      p.stage = id === "football" ? "community" : "local";
    p.trial = null;
    for (const o of p.offers) if (o.status === "offered") o.status = "declined";
  }
  const b = s.simulation.sports.boxing;
  if (b.offer?.status === "booked") b.offer.status = "cancelled";
}
function convict(s, c) {
  const d = CRIMES[c.crime],
    juvenile = age(s) < 18,
    sentence = Math.max(
      1,
      Math.ceil(
        d.sentence * (juvenile ? 0.5 : 1) * (c.plea === "guilty" ? 0.75 : 1),
      ),
    );
  s.globalLife.crime.record.push({
    id: uid(s, "conviction"),
    crime: c.crime,
    severity: d.severity,
    week: s.week,
    sentence,
    fine: d.fine,
    juvenile,
  });
  s.globalLife.crime.record = s.globalLife.crime.record.slice(-40);
  c.restitution = c.gain;
  s.money = round(s.money - d.fine - c.restitution);
  c.status = "convicted";
  c.outcome = `${sentence} weeks custody; $${d.fine} fine and $${c.restitution} restitution`;
  s.fame.reputation = clamp(s.fame.reputation - d.severity * 10);
  enterCustody(s, c.crime, sentence);
  s.simulation.justice.lastCustody = { ...s.globalLife.crime.prison };
  note(
    s,
    `Court decision: ${c.outcome}. The criminal record remains relevant to hiring and immigration.`,
    "warning",
  );
}
export function requestParole(state) {
  const p = state.globalLife.crime.prison,
    j = state.simulation.justice;
  if (
    !j.active ||
    !p ||
    state.ended ||
    age(state) < 18 ||
    state.week - p.startsWeek < (p.releaseWeek - p.startsWeek) / 2 ||
    state.globalLife.crime.rehabilitation < 10 ||
    j.parole?.status === "pending"
  )
    throw new Error(
      "Parole review requires adulthood, at least half the sentence served and rehabilitation 10.",
    );
  const s = structuredClone(state);
  if (s.globalLife.crime.activityWeek === s.week)
    throw new Error("One supervised activity per week.");
  s.globalLife.crime.activityWeek = s.week;
  once(s, s.simulation.justice.actions, "parole", 13);
  s.simulation.justice.parole = {
    since: s.week,
    due: s.week + 2,
    status: "pending",
    originalRelease: p.releaseWeek,
  };
  return s;
}
export function attendSupervision(state) {
  const p = state.simulation.justice.supervision;
  if (!p || p.status !== "active" || state.globalLife.crime.prison)
    throw new Error("No active community-supervision appointment.");
  const s = act(state, { minAge: 12, hours: 2 });
  once(s, s.simulation.justice.actions, "check-in");
  s.simulation.justice.supervision.lastAttended = s.week;
  s.simulation.justice.supervision.nextCheck = s.week + 4;
  s.simulation.justice.supervision.attended++;
  note(
    s,
    "Attended the community-supervision appointment. Travel permission and the criminal record remain separate.",
  );
  return s;
}
export function requestSupervisedTravel(state, code) {
  const p = state.simulation.justice.supervision;
  if (!p || p.status !== "active" || !country(code))
    throw new Error("Choose a country while under active supervision.");
  const s = act(state, { minAge: 18, hours: 2 }),
    n = s.simulation.justice.supervision;
  once(s, s.simulation.justice.actions, "travel-permission", 4);
  if (p.missed === 0 && p.attended >= 1) {
    n.travel = { country: code, until: s.week + 4 };
    note(
      s,
      "Supervision approved a four-week destination-specific travel permission. Entry visas and residence rules still apply.",
    );
  } else
    note(
      s,
      "Travel permission was refused until supervision compliance is established.",
    );
  return s;
}
export function supervisionTravelReason(s, code) {
  const p = s.simulation?.justice.supervision;
  return p?.status === "active" &&
    code !== s.globalLife.residence.country &&
    !(p.travel?.country === code && p.travel.until >= s.week)
    ? "Community supervision requires destination-specific travel permission before relocating or touring abroad."
    : null;
}
function supervision(s, kind, crime, until) {
  s.simulation.justice.supervision = {
    kind,
    crime,
    since: s.week,
    until,
    nextCheck: s.week + 4,
    lastAttended: s.week,
    attended: 0,
    missed: 0,
    status: "active",
    travel: null,
  };
  note(
    s,
    `${kind === "parole" ? "Parole" : "Post-release supervision"} began. Attend every four weeks and request permission before international travel.`,
  );
}
export function advanceJustice(s) {
  const j = s.simulation.justice;
  if (j.lastWeek === s.week) return;
  j.lastWeek = s.week;
  if (!j.active) return;
  const prison = s.globalLife.crime.prison;
  if (prison) j.lastCustody = { ...prison };
  else if (j.lastCustody) {
    if (!j.supervision || j.supervision.status !== "active")
      supervision(s, "probation", j.lastCustody.crime, s.week + 26);
    j.lastCustody = null;
  }
  for (const c of j.cases.filter(
    (c) => !["closed", "convicted", "acquitted"].includes(c.status),
  )) {
    if (s.globalLife.crime.prison) break;
    if (c.status === "investigating" && c.due <= s.week) {
      if (c.evidence < 35) {
        c.status = "closed";
        c.outcome = "Insufficient evidence to pursue a charge.";
      } else {
        c.status = "interview";
        c.due = s.week + 2;
        note(
          s,
          "An investigator requested an interview. Review the case and decide whether to retain a solicitor.",
          "warning",
        );
      }
    } else if (c.status === "interview" && c.due <= s.week) {
      const threshold = c.lawyer ? 52 : 42;
      if (c.evidence < threshold) {
        c.status = "closed";
        c.outcome = "The available evidence did not support a charge.";
      } else {
        c.status = "charged";
        c.hearing = s.week + 3;
        note(
          s,
          "A charge was filed and a court date set for three weeks from now.",
          "warning",
        );
      }
    } else if (c.status === "charged" && c.hearing <= s.week) {
      const chance = clamp(
        0.15 + c.evidence / 130 - (c.lawyer ? 0.12 : 0),
        0.1,
        0.95,
      );
      if (c.plea === "guilty" || roll(s) < chance) convict(s, c);
      else {
        c.status = "acquitted";
        c.outcome = "The prosecution did not establish the case at trial.";
        note(s, "The court acquitted you. Legal fees were retained.");
      }
    }
  }
  const r = j.parole;
  if (r?.status === "pending" && r.due <= s.week) {
    if (!s.globalLife.crime.prison) r.status = "expired";
    else if (roll(s) < 0.15 + s.globalLife.crime.rehabilitation / 150) {
      r.status = "approved";
      const crime = s.globalLife.crime.prison.crime;
      s.globalLife.crime.prison = null;
      s.actions = 3;
      j.lastCustody = null;
      supervision(s, "parole", crime, r.originalRelease);
    } else {
      r.status = "refused";
      note(
        s,
        "The parole panel refused release. The original sentence continues.",
      );
    }
  }
  const p = j.supervision;
  if (p?.status === "active" && !s.globalLife.crime.prison) {
    if (s.week >= p.until) {
      p.status = "completed";
      note(s, "Community supervision ended. The conviction record remains.");
    } else if (s.week > p.nextCheck) {
      p.missed++;
      p.nextCheck = s.week + 4;
      note(
        s,
        "A required supervision appointment was missed. Repeated breaches can return you to custody.",
        "warning",
      );
      if (p.missed >= 2) {
        p.status = "revoked";
        enterCustody(s, p.crime, Math.min(26, Math.max(4, p.until - s.week)));
        j.lastCustody = { ...s.globalLife.crime.prison };
      }
    }
  }
}
export function validateJustice(s) {
  const j = obj(s.simulation.justice);
  bool(j.active);
  num(j.lastWeek, 0, s.week, true);
  stamps(j.actions, s.week);
  for (const c of arr(j.cases, 30)) {
    str(c.id, 100);
    one(c.crime, Object.keys(CRIMES));
    num(c.since, 0, s.week, true);
    num(c.due, 0, s.week + 2, true);
    if (c.hearing !== null) num(c.hearing, 0, s.week + 3, true);
    one(c.status, [
      "investigating",
      "interview",
      "charged",
      "closed",
      "acquitted",
      "convicted",
    ]);
    num(c.evidence, 0, 100);
    bool(c.lawyer);
    one(c.plea, ["guilty", "trial"]);
    num(c.gain);
    num(c.restitution);
    str(c.outcome, 250);
  }
  if (j.lastCustody) {
    num(j.lastCustody.startsWeek, 0, s.week, true);
    num(j.lastCustody.releaseWeek, 0, s.week + 1000, true);
    one(j.lastCustody.crime, Object.keys(CRIMES));
  }
  if (j.parole) {
    num(j.parole.since, 0, s.week, true);
    num(j.parole.due, 0, s.week + 2, true);
    one(j.parole.status, ["pending", "approved", "refused", "expired"]);
    num(j.parole.originalRelease, 0, s.week + 1000, true);
  }
  if (j.supervision) {
    const p = j.supervision;
    one(p.kind, ["parole", "probation"]);
    one(p.crime, Object.keys(CRIMES));
    num(p.since, 0, s.week, true);
    num(p.until, p.since, s.week + 1000, true);
    num(p.nextCheck, 0, s.week + 4, true);
    num(p.lastAttended, 0, s.week, true);
    num(p.attended, 0, 1000, true);
    num(p.missed, 0, 100, true);
    one(p.status, ["active", "completed", "revoked"]);
    if (p.travel) {
      if (!country(p.travel.country))
        throw new Error("Invalid supervised travel destination.");
      num(p.travel.until, 0, s.week + 4, true);
    }
  }
}
