import { availableCash, rng } from "./world.js";
import { spendTime } from "./calendar.js";
import { receiveIncome } from "./banking.js";
import { AGENTS } from "./seasons.js";
import {
  currentMusicManager,
  musicManagerCommission,
} from "./career-support.js";

export const CONTRACT_SPORTS = ["football", "racing", "basketball", "tennis"];
export const ENDORSEMENT_BRANDS = [
  { name: "Stride Athletics", category: "sportswear" },
  { name: "Vector Sport", category: "sportswear" },
  { name: "Signal Audio", category: "equipment" },
  { name: "Northline Devices", category: "technology" },
];
const age = (s) => s.startAge + Math.floor(s.week / 52);
const round = (n) => Math.round(n * 100) / 100;
const actor = (s, id) => (id === "football" ? s.football : s.sports[id]);
function remember(s, text) {
  s.contracts.history.unshift({ week: s.week, text });
  s.contracts.history = s.contracts.history.slice(0, 40);
  s.log.unshift({ week: s.week, text, kind: "info" });
  s.log = s.log.slice(0, 40);
}
function action(state, hours, label) {
  if (state.ended || state.event || !state.actions)
    throw new Error(
      "Resolve your life choice and make time for contract business.",
    );
  const s = structuredClone(state);
  spendTime(s, hours, label);
  s.actions--;
  return s;
}
export function initializeContracts(s) {
  s.contracts = {
    seed: (s.seed ^ 0xc0ffee) >>> 0,
    current: {},
    reviews: [],
    offers: [],
    endorsements: [],
    history: [],
    nextOfferWeek: s.week + 13,
    serial: 0,
  };
}
export function contractOffer(s, sector, id) {
  return sector === "music"
    ? s.music.labelOffers.find((o) => o.id === id)
    : actor(s, sector)?.offers.find(
        (o) => o.id === id && o.kind === "contract",
      );
}
export function contractProposal(s, sector, id) {
  const o = contractOffer(s, sector, id);
  if (!o) return null;
  const music = sector === "music";
  const terms = {
    releaseWeeks: music ? 0 : 4,
    imageShare: music ? 0 : 0.2,
    exitFee: music ? Math.max(250, round(o.advance * 0.25)) : 0,
    exclusive: music,
    royaltyShare: 0.5,
    deliveriesRequired: music ? 2 : 0,
  };
  const review = s.contracts?.reviews.find(
    (r) => r.sector === sector && r.offerId === id,
  );
  if (review?.status === "agreed") {
    if (review.approach === "exit") {
      terms.releaseWeeks = music ? 0 : 2;
      terms.exitFee = round(terms.exitFee / 2);
      if (music) terms.royaltyShare = 0.45;
      else terms.imageShare = 0.25;
    } else if (review.approach === "rights") terms.imageShare = 0.1;
    else {
      terms.exclusive = false;
      terms.royaltyShare = 0.4;
    }
  }
  return terms;
}
export function reviewContract(state, sector, offerId, approach) {
  const o = contractOffer(state, sector, offerId);
  if (
    age(state) < (sector === "music" ? 18 : 16) ||
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week ||
    !["music", ...CONTRACT_SPORTS].includes(sector) ||
    !(
      sector === "music" ? ["exit", "flexibility"] : ["exit", "rights"]
    ).includes(approach)
  )
    throw new Error(
      "Choose a live contract and an appropriate legal approach.",
    );
  if (state.careerWorld?.sports[sector]?.moves[offerId]?.kind === "loan")
    throw new Error(
      "A loan retains your parent agreement; its clauses cannot be replaced.",
    );
  if (
    state.contracts.reviews.some(
      (r) => r.sector === sector && r.offerId === offerId,
    )
  )
    throw new Error("This offer has already had a legal counterproposal.");
  if (availableCash(state) < 250)
    throw new Error("Independent legal advice costs $250.");
  const s = action(state, 3, "Legal advice and contract clauses");
  s.money -= 250;
  contractOffer(s, sector, offerId).expiresWeek = Math.max(
    o.expiresWeek,
    s.week + 4,
  );
  s.contracts.reviews.push({
    sector,
    offerId,
    approach,
    status: "pending",
    decisionWeek: s.week + 2,
  });
  s.contracts.reviews = s.contracts.reviews.slice(-20);
  remember(
    s,
    "A lawyer submitted your clause counterproposal. Advice is paid for; agreement is uncertain and takes two weeks.",
  );
  return s;
}
export function checkContractReview(s, sector, id) {
  if (
    s.contracts?.reviews.some(
      (r) => r.sector === sector && r.offerId === id && r.status === "pending",
    )
  )
    throw new Error(
      "Wait for the legal counterproposal to settle before signing.",
    );
}
export function sportExitCost(s, id) {
  const c = s.contracts?.current[id];
  return c?.status === "active" &&
    c.expiresWeek > s.week &&
    actor(s, id)?.contract
    ? round(Math.min(c.releaseWeeks, c.expiresWeek - s.week) * c.weeklyPay)
    : 0;
}
export const allSportExitCosts = (s) =>
  CONTRACT_SPORTS.reduce((sum, id) => sum + sportExitCost(s, id), 0);
export function releaseSportAgreement(
  s,
  id,
  { consent = false, automatic = false } = {},
) {
  const c = s.contracts?.current[id];
  if (!c || c.status !== "active") return;
  const cost = consent || automatic ? 0 : sportExitCost(s, id);
  if (cost > 0 && availableCash(s) < cost)
    throw new Error(
      `Your ${id} release clause costs $${cost}. Build available cash or wait for an agreed move or contract expiry.`,
    );
  s.money = round(s.money - cost);
  c.status = "ended";
  remember(
    s,
    `Your ${id} agreement with ${c.party} ended${cost ? `; the release clause cost $${cost}` : " by consent or expiry"}.`,
  );
}
export function prepareSportReplacement(s, sector, o) {
  checkContractReview(s, sector, o.id);
  const meta = s.careerWorld?.sports[sector]?.moves[o.id];
  if (meta?.kind === "loan") return;
  releaseSportAgreement(s, sector, {
    consent: !!meta || s.contracts?.current[sector]?.party === o.club,
  });
}
export function registerSportAgreement(s, sector, o) {
  if (
    !s.contracts ||
    s.careerWorld?.sports[sector]?.moves[o.id]?.kind === "loan"
  )
    return;
  const terms = contractProposal(s, sector, o.id);
  s.contracts.current[sector] = {
    ...terms,
    sector,
    offerId: o.id,
    party: o.club,
    signedWeek: s.week,
    expiresWeek: actor(s, sector).contract.expiresWeek,
    weeklyPay: o.pay,
    status: "active",
    deadlineWeek: 0,
    deliveriesDone: 0,
    penaltyCharged: false,
    catalogue: [],
  };
}
export function registerMusicAgreement(s, o) {
  if (!s.contracts) return;
  const terms = contractProposal(s, "music", o.id);
  s.music.label.share = terms.royaltyShare;
  s.contracts.current.music = {
    ...terms,
    sector: "music",
    offerId: o.id,
    party: o.name,
    signedWeek: s.week,
    expiresWeek: s.music.label.expiresWeek,
    weeklyPay: 0,
    status: "active",
    deadlineWeek: s.week + 39,
    deliveriesDone: 0,
    penaltyCharged: false,
    catalogue: s.music.releases.map((r) => r.id),
  };
}
export function checkMusicOutsideWork(s) {
  const c = s.contracts?.current.music;
  if (c?.status === "active" && c.expiresWeek > s.week && c.exclusive)
    throw new Error(
      "Your label's exclusive recording agreement blocks outside collaborations and client masters. Negotiate flexibility before signing, buy out the label, or wait for expiry.",
    );
}
export function musicBuyoutCost(s) {
  const c = s.contracts?.current.music;
  return c?.status === "active" && s.music.label
    ? round(c.exitFee + s.music.label.unrecouped)
    : 0;
}
export function buyOutMusicAgreement(state) {
  const c = state.contracts.current.music;
  if (
    !c ||
    c.status !== "active" ||
    !state.music.label ||
    c.expiresWeek <= state.week
  )
    throw new Error("There is no new label agreement to buy out.");
  const fee = musicBuyoutCost(state);
  if (availableCash(state) < fee)
    throw new Error(
      "Build available cash for the exit fee and remaining unrecouped advance.",
    );
  const s = action(state, 2, "Settle a label buyout");
  s.money = round(s.money - fee);
  s.music.label = null;
  s.contracts.current.music.status = "ended";
  remember(
    s,
    `Bought out your label agreement for $${fee}, including the remaining advance. Future recordings are independent.`,
  );
  return s;
}
export function endorsementEligibility(s, sector) {
  if (age(s) < 18) return false;
  if (CONTRACT_SPORTS.includes(sector))
    return (
      !!actor(s, sector)?.contract &&
      s.career === sector &&
      actor(s, sector).reputation >= 25
    );
  if (sector === "music")
    return s.music.active && s.music.fans >= 100 && s.music.releases.length > 0;
  return (
    sector === "creator" &&
    Object.values(s.social.profiles).some(
      (p) => p.active && p.followers >= 1000,
    )
  );
}
function imageReceipt(s, sector, gross) {
  const athleteAgreement = s.contracts.current[s.career];
  const imageFee =
    CONTRACT_SPORTS.includes(s.career) &&
    athleteAgreement?.status === "active" &&
    athleteAgreement.expiresWeek > s.week
      ? round(gross * athleteAgreement.imageShare)
      : 0;
  const personal = gross - imageFee;
  const agent = CONTRACT_SPORTS.includes(sector)
    ? AGENTS.find((a) => a.id === s.seasons[sector].agent?.id)
    : null;
  const management =
    sector === "music"
      ? musicManagerCommission(s, personal)
      : round(personal * (agent?.rate || 0));
  receiveIncome(s, gross, "earned", { deduction: imageFee + management });
  s.money = round(s.money - imageFee - management);
  return { imageFee, management };
}
export function acceptEndorsement(state, id) {
  const o = state.contracts.offers.find((o) => o.id === id);
  if (
    !o ||
    o.status !== "offered" ||
    o.expiresWeek <= state.week ||
    !endorsementEligibility(state, o.sector)
  )
    throw new Error(
      "Choose a current endorsement for an established adult career.",
    );
  if (
    state.contracts.endorsements.some(
      (d) =>
        ["active", "fulfilled"].includes(d.status) &&
        d.exclusiveUntil > state.week &&
        d.category === o.category,
    )
  )
    throw new Error(
      "An existing agreement has category exclusivity, even after its appearances are delivered.",
    );
  const s = action(state, 2, "Agree image rights and sponsor obligations");
  s.contracts.offers.find((x) => x.id === id).status = "accepted";
  const advance = round(o.fee / 2);
  const deductions = imageReceipt(s, o.sector, advance);
  s.contracts.endorsements.push({
    ...o,
    id: `endorsement:${s.contracts.serial++}`,
    status: "active",
    advance,
    delivered: 0,
    deadlineWeek: s.week + 6,
    exclusiveUntil: s.week + 13,
    bookedWeek: null,
    lastDeliveryWeek: -1,
    grossPaid: advance,
    imagePaid: deductions.imageFee,
    managementPaid: deductions.management,
  });
  s.contracts.endorsements = s.contracts.endorsements.slice(-20);
  remember(
    s,
    `Signed ${o.brand}: two public appearances in six weeks, thirteen-week ${o.category} exclusivity, and $${advance} gross upfront. Missing delivery claws back that advance.`,
  );
  return s;
}
export function bookEndorsementAppearance(state, id) {
  const d = state.contracts.endorsements.find((d) => d.id === id);
  if (
    !d ||
    d.status !== "active" ||
    d.bookedWeek !== null ||
    d.deadlineWeek <= state.week ||
    state.social.privacy !== "public"
  )
    throw new Error(
      "Book a live public campaign with an available delivery week; at most one appearance per campaign each week.",
    );
  const s = action(state, 2, "Prepare a sponsor campaign appearance");
  s.contracts.endorsements.find((d) => d.id === id).bookedWeek = s.week + 1;
  return s;
}
export function cancelEndorsement(state, id) {
  const d = state.contracts.endorsements.find((d) => d.id === id);
  if (state.ended || !d || d.status !== "active")
    throw new Error("Choose an unfinished endorsement.");
  if (availableCash(state) < d.advance)
    throw new Error("Cancellation needs the gross advance repayment.");
  const s = structuredClone(state);
  s.money = round(s.money - d.advance);
  const q = s.contracts.endorsements.find((d) => d.id === id);
  q.status = "cancelled";
  q.bookedWeek = null;
  remember(
    s,
    `Cancelled ${q.brand} and repaid its $${q.advance} gross advance. Commission and image-rights costs remain spent.`,
  );
  return s;
}
export const contractHours = (s, week = s.week) =>
  (s.contracts?.endorsements || []).reduce(
    (n, d) => n + (d.status === "active" && d.bookedWeek === week ? 3 : 0),
    0,
  );
export function advanceContracts(s) {
  const c = s.contracts;
  for (const r of c.reviews)
    if (r.status === "pending" && r.decisionWeek <= s.week) {
      const o = contractOffer(s, r.sector, r.offerId);
      if (!o || o.status !== "offered" || o.expiresWeek <= s.week)
        r.status = "expired";
      else {
        const representative =
          r.sector === "music"
            ? currentMusicManager(s)
            : AGENTS.find((a) => a.id === s.seasons[r.sector].agent?.id);
        r.status =
          rng(s.contracts) < Math.min(0.85, 0.4 + (representative?.skill || 0))
            ? "agreed"
            : "refused";
      }
      remember(
        s,
        `The ${r.sector} clause counterproposal was ${r.status}. Original terms remain if it was refused.`,
      );
    }
  for (const [id, a] of Object.entries(c.current))
    if (a.status === "active") {
      if (
        a.expiresWeek <= s.week ||
        (id === "music" ? !s.music.label : !actor(s, id).contract)
      ) {
        a.status = "ended";
        continue;
      }
      if (id === "music") {
        a.deliveriesDone = Math.max(
          a.deliveriesDone,
          s.music.releases.filter(
            (r) =>
              r.releasedWeek >= a.signedWeek &&
              !a.catalogue.includes(r.id) &&
              (s.careerWorld.music.rights[r.id]?.share ?? 1) > 0,
          ).length,
        );
        if (
          !a.penaltyCharged &&
          a.deadlineWeek <= s.week &&
          a.deliveriesDone < a.deliveriesRequired
        ) {
          const penalty = round(s.music.label.advance * 0.1);
          s.money = round(s.money - penalty);
          s.fame.reputation = Math.max(0, s.fame.reputation - 5);
          a.penaltyCharged = true;
          remember(
            s,
            `Missed your label's two-release delivery obligation. A $${penalty} contractual penalty was charged once; your agreement continues.`,
          );
        }
      }
    }
  for (const o of c.offers)
    if (o.status === "offered" && o.expiresWeek <= s.week) o.status = "expired";
  for (const d of c.endorsements) {
    if (
      d.status === "active" &&
      d.bookedWeek !== null &&
      d.bookedWeek <= s.week
    ) {
      d.bookedWeek = null;
      const performed =
        s.energy >= 15 &&
        s.social.privacy === "public" &&
        s.calendar.last?.mandatory <= 168;
      if (performed) {
        d.delivered++;
        d.lastDeliveryWeek = s.week;
        s.energy = Math.max(0, s.energy - 4);
        if (d.delivered === 2) {
          const balance = round(d.fee - d.advance),
            paid = imageReceipt(s, d.sector, balance);
          d.grossPaid = d.fee;
          d.imagePaid = round(d.imagePaid + paid.imageFee);
          d.managementPaid = round(d.managementPaid + paid.management);
          d.status = "fulfilled";
          remember(
            s,
            `Delivered ${d.brand}'s campaign and earned its $${balance} gross balance. Category exclusivity lasts until week ${d.exclusiveUntil}.`,
          );
        }
      } else
        remember(
          s,
          `Missed the ${d.brand} appearance because of privacy, energy or commitments. The delivery deadline still applies.`,
        );
    }
    if (d.status === "active" && d.deadlineWeek <= s.week) {
      s.money = round(s.money - d.advance);
      d.status = "breached";
      d.bookedWeek = null;
      s.fame.reputation = Math.max(0, s.fame.reputation - 4);
      remember(
        s,
        `Missed ${d.brand}'s campaign deadline; its $${d.advance} gross advance was clawed back. Unpaid obligations can leave debt.`,
      );
    }
    if (d.status === "fulfilled" && d.exclusiveUntil <= s.week)
      d.status = "completed";
  }
  if (s.week >= c.nextOfferWeek) {
    c.nextOfferWeek = s.week + 13;
    const sectors = [...CONTRACT_SPORTS, "music", "creator"].filter((id) =>
      endorsementEligibility(s, id),
    );
    if (
      sectors.length &&
      !c.offers.some((o) => o.status === "offered") &&
      rng(s.contracts) < 0.35
    ) {
      const sector = sectors[Math.floor(rng(s.contracts) * sectors.length)],
        brand =
          ENDORSEMENT_BRANDS[
            Math.floor(rng(s.contracts) * ENDORSEMENT_BRANDS.length)
          ];
      const reach = CONTRACT_SPORTS.includes(sector)
        ? actor(s, sector).reputation
        : sector === "music"
          ? Math.min(100, s.music.fans / 50)
          : Math.min(
              100,
              Object.values(s.social.profiles).reduce(
                (n, p) => n + p.followers,
                0,
              ) / 500,
            );
      c.offers.push({
        id: `image:${s.week}:${c.serial++}`,
        sector,
        brand: brand.name,
        category: brand.category,
        fee: Math.round(200 + reach * 12),
        status: "offered",
        expiresWeek: s.week + 4,
      });
      c.offers = c.offers.slice(-20);
      remember(
        s,
        `${brand.name} offered an endorsement. Review delivery obligations, exclusivity and image-rights deductions before signing.`,
      );
    }
  }
}
export function validateContracts(s) {
  const c = s.contracts,
    n = (v, max = 1e12) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max,
    w = (v) => n(v) && Number.isInteger(v),
    str = (v) => typeof v === "string" && v.length > 0 && v.length <= 500,
    list = (v, max) => Array.isArray(v) && v.length <= max,
    object = (v) => v && typeof v === "object" && !Array.isArray(v);
  const fail = () => {
    throw new Error("Invalid contract clauses or endorsement data in save.");
  };
  if (
    !object(c) ||
    !w(c.seed) ||
    c.seed > 4294967295 ||
    !object(c.current) ||
    Object.keys(c.current).length > 5 ||
    !list(c.reviews, 20) ||
    !list(c.offers, 20) ||
    !list(c.endorsements, 20) ||
    !list(c.history, 40) ||
    !w(c.serial) ||
    !w(c.nextOfferWeek)
  )
    fail();
  for (const [id, a] of Object.entries(c.current))
    if (
      !object(a) ||
      ![...CONTRACT_SPORTS, "music"].includes(id) ||
      a.sector !== id ||
      !str(a.party) ||
      !str(a.offerId) ||
      !w(a.signedWeek) ||
      a.signedWeek > s.week ||
      !w(a.expiresWeek) ||
      a.expiresWeek <= a.signedWeek ||
      !n(a.weeklyPay) ||
      ![0, 2, 4].includes(a.releaseWeeks) ||
      !n(a.imageShare, 0.25) ||
      !n(a.exitFee) ||
      typeof a.exclusive !== "boolean" ||
      !n(a.royaltyShare, 1) ||
      ![0, 2].includes(a.deliveriesRequired) ||
      !w(a.deliveriesDone) ||
      !w(a.deadlineWeek) ||
      typeof a.penaltyCharged !== "boolean" ||
      !list(a.catalogue, 20) ||
      a.catalogue.some((x) => !str(x)) ||
      !["active", "ended"].includes(a.status) ||
      (id === "music"
        ? a.releaseWeeks !== 0 ||
          a.imageShare !== 0 ||
          a.weeklyPay !== 0 ||
          a.deliveriesRequired !== 2 ||
          a.deadlineWeek !== a.signedWeek + 39
        : ![2, 4].includes(a.releaseWeeks) ||
          a.exclusive ||
          a.exitFee !== 0 ||
          a.deliveriesRequired !== 0 ||
          a.deliveriesDone !== 0)
    )
      fail();
  for (const r of c.reviews)
    if (
      !object(r) ||
      ![...CONTRACT_SPORTS, "music"].includes(r.sector) ||
      !str(r.offerId) ||
      !(
        r.sector === "music" ? ["exit", "flexibility"] : ["exit", "rights"]
      ).includes(r.approach) ||
      !["pending", "agreed", "refused", "expired"].includes(r.status) ||
      !w(r.decisionWeek)
    )
      fail();
  for (const o of [...c.offers, ...c.endorsements])
    if (
      !object(o) ||
      !str(o.id) ||
      ![...CONTRACT_SPORTS, "music", "creator"].includes(o.sector) ||
      !ENDORSEMENT_BRANDS.some(
        (b) => b.name === o.brand && b.category === o.category,
      ) ||
      !n(o.fee) ||
      !w(o.expiresWeek) ||
      ![
        "offered",
        "accepted",
        "expired",
        "active",
        "fulfilled",
        "completed",
        "cancelled",
        "breached",
      ].includes(o.status)
    )
      fail();
  for (const d of c.endorsements)
    if (
      !["active", "fulfilled", "completed", "cancelled", "breached"].includes(
        d.status,
      ) ||
      !n(d.advance) ||
      d.advance !== round(d.fee / 2) ||
      !w(d.delivered) ||
      d.delivered > 2 ||
      !w(d.deadlineWeek) ||
      !w(d.exclusiveUntil) ||
      (d.bookedWeek !== null && !w(d.bookedWeek)) ||
      !Number.isInteger(d.lastDeliveryWeek) ||
      d.lastDeliveryWeek < -1 ||
      d.lastDeliveryWeek > s.week ||
      !n(d.grossPaid) ||
      ![d.advance, d.fee].includes(d.grossPaid) ||
      d.grossPaid !== (d.delivered === 2 ? d.fee : d.advance) ||
      (d.status !== "active" && d.bookedWeek !== null) ||
      !n(d.imagePaid, d.grossPaid) ||
      !n(d.managementPaid, d.grossPaid) ||
      (["fulfilled", "completed"].includes(d.status) && d.delivered !== 2)
    )
      fail();
  if (c.history.some((x) => !w(x.week) || x.week > s.week || !str(x.text)))
    fail();
}
