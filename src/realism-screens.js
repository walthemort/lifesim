import {
  localProfile,
  localCurrency,
  residenceCode,
  economyProfile,
  rentTerms,
} from "./economy.js";
import { country } from "./geography.js";
import { jointShare, PRODUCT_TYPES, productType } from "./realism.js";
import { gameDate } from "./dates.js";
const off = (s) =>
  !s.actions || s.ended || s.event || s.globalLife.crime.prison
    ? "disabled"
    : "";
export function realismScreen(s, u) {
  const { e, title, panelHeading, money } = u,
    w = s.realWorld,
    p = localProfile(s),
    h = w.household,
    j = h.joint,
    partner = s.family.partnerId && s.connections.profiles[s.family.partnerId];
  return `${title("YOUR WORLD IN MOTION", "A life with consequences.", "Regional money, shared responsibilities, rivals and the choices that follow setbacks.")}<section class="panel" data-local-economy>${panelHeading("Your local economy", `${s.city}, ${country(residenceCode(s)).name}`)}<div class="life-metrics"><div><span>Local cash equivalent</span><strong>${e(localCurrency(s, s.money))}</strong><small>${money(s.money, 2)} in the USD ledger</small></div><div><span>Wage index</span><strong>${Math.round(p.wage * 100)}%</strong></div><div><span>Housing / retail</span><strong>${Math.round(p.housing * 100)}% / ${Math.round(p.retail * 100)}%</strong></div></div><p class="muted">Local currencies use simulated exchange quotes, updated quarterly. The game keeps one USD ledger so moving never duplicates or converts your balance twice. Salary differences apply to newly accepted local jobs; existing contracts keep their agreed pay. Housing quotes and ordinary purchases reflect your region. Domestic taxes are simplified game policies, recorded separately when you move. Unlisted countries use regional economic assumptions.</p><div class="application-list">${Object.values(
    w.economy.taxBuckets,
  )
    .filter((b) => b.year === s.banking.tax.year)
    .map(
      (b) =>
        `<div class="application-row"><strong>${e(country(b.country).name)}${b.legacy ? " · imported tax terms" : ""}</strong><small>${money(b.earned, 2)} taxable earnings · ${money(b.withheld, 2)} withheld</small></div>`,
    )
    .join(
      "",
    )}</div></section><section class="panel" data-household-finance>${panelHeading("Household money", "Joint savings have recorded contributions; your partner has their own funds.")}<p>${partner ? `Partner wealth: ${money(partner.wealth, 2)} · income ${money(partner.weeklyPay)}/week · ${Math.round(partner.trust)} trust.` : "A cohabiting partnership with mutual trust can open a shared account."}</p>${j ? `<div class="life-metrics"><div><span>Joint balance</span><strong>${money(j.balance, 2)}</strong></div><div><span>Your share</span><strong>${money(jointShare(s), 2)}</strong></div></div><form id="joint-transfer-form"><label class="field-label">Joint transfer<select name="direction"><option value="deposit">Contribute your cash</option><option value="partner">Ask partner to contribute</option><option value="withdraw">Withdraw your share</option></select></label><label class="field-label">Amount in USD<input type="number" name="amount" min="10" step="0.01" required></label><button class="button primary" ${off(s)}>Confirm joint transfer</button></form>` : `<button class="button secondary" data-action="joint-open" ${!partner || !s.family.livingTogether || partner.trust < 65 || off(s) ? "disabled" : ""}>Open joint account</button>`}<p class="muted">Transfers use an action and time. A partner contribution comes from their actual wealth and needs consent. Existing weekly partner contributions go into an open shared account. Withdrawals are limited to your share.</p><div class="inline-actions">${[4, 8, 13].map((n) => `<button class="button secondary" data-action="parental-leave" data-id="${n}" ${off(s)}>Request ${n}-week parental leave</button>`).join("")}${s.family.partnerId ? `<button class="button secondary" data-action="separation-review" ${off(s)}>Review separation & custody</button>` : ""}</div><p class="muted">Leave requires ordinary employment and a child welcomed within the last year. Work time and income are reduced; job reviews pause. Active leave: ${h.parentalLeave ? `through ${gameDate(h.parentalLeave.untilWeek, s)}` : "none"}.</p>${h.support.map((a) => `<p>${e(s.family.children.find((c) => c.id === a.childId)?.name || "Child")} · ${a.weekly >= 0 ? "pay" : "receive"} ${money(Math.abs(a.weekly))}/week · unpaid support ${money(a.arrears, 2)}</p>`).join("")}${h.separations.map((a) => `<p class="muted">${gameDate(a.week, s)} · ${e(a.custody)} care · ${money(a.playerSettlement)} joint savings returned · ${money(a.fee)} mediation fee.</p>`).join("")}</section><section class="panel" data-setbacks>${panelHeading("Setbacks & rebuilding", "A recovery plan helps confidence; it cannot restore a lost contract or erase a review.")}<div class="everyday-grid">${w.setbacks.map((b) => `<article class="everyday-card"><h3>${e(b.path)}</h3><p>${e(b.text)}</p><small>${gameDate(b.week, s)} · ${b.sessions}/4 recovery sessions · ${e(b.status)}</small>${b.status === "open" ? `<button class="button secondary" data-action="setback-work" data-id="${e(b.id)}" ${off(s)}>Work on recovery plan</button>` : ""}</article>`).join("") || '<p class="muted">Meaningful career setbacks will appear here as they happen.</p>'}</div></section>`;
}
export function rivalsScreen(s, u, path) {
  const { e, panelHeading } = u,
    p = path === "football" ? s.football : s.sports[path],
    level = p.contract ? Number(p.contract.jobId.slice(-1)) : 0,
    r = s.realWorld.rivals,
    rows = r.athletes.filter((a) => a.path === path && a.level === level);
  return `<section class="panel" data-rivals="${path}">${panelHeading("Rivals & available places", "Athletes age, develop, recover, retire and sign new contracts. Vacancies have to exist before a generated offer arrives.")}<div class="standings-scroll"><table class="owner-table"><thead><tr><th>Athlete</th><th>Club / team</th><th>Age</th><th>Ability</th><th>Contract</th></tr></thead><tbody>${rows.map((a) => `<tr><td>${e(a.player ? s.name : a.name)}</td><td>${e(a.club)}</td><td>${a.bornAge + Math.floor((s.week - a.startWeek) / 52)}</td><td>${Math.round(a.ability)}</td><td>${a.player ? "Your place" : a.status === "contracted" ? `${a.injuryUntil > s.week ? "Injured · " : ""}${gameDate(a.contractUntil, s)}` : a.status === "retired" ? "Retired · place open" : "Available place"}</td></tr>`).join("")}</tbody></table></div><div class="application-list">${r.history
    .filter((x) => x.text.includes(path))
    .slice(0, 5)
    .map((x) => `<p class="muted">${gameDate(x.week, s)} · ${e(x.text)}</p>`)
    .join("")}</div></section>`;
}
export function productsScreen(s, u) {
  if (!s.company) return "";
  const { e, money, panelHeading } = u,
    d = PRODUCT_TYPES[productType(s.company.sector)];
  return `<section class="panel" data-business-products>${panelHeading("Products & customers", "Development, delivery costs and sales feed actual company profit.")}<form id="product-start-form"><label class="field-label">Product name<input name="name" maxlength="60" required placeholder="${e(d.name)}"></label><label class="field-label">Project scope<select name="scope"><option value="lean">Lean · 60% budget</option><option value="standard" selected>Standard</option><option value="ambitious">Ambitious · 180% budget</option></select></label><label class="field-label">Product price in USD<input name="price" type="number" min="${d.unitCost}" max="${d.price * 5}" value="${d.price}" step="0.01" required></label><p class="muted">Standard budget ${money(d.budget)} · ${d.weeks} development units · ${money(d.unitCost)} delivery cost per sale. Preparation adds half a unit per session; normal operations advance a quarter unit weekly. Sales compete on price and quality. Products need company cash for delivery.</p><button class="button primary" ${s.realWorld.products.some((p) => p.status === "developing") || off(s) ? "disabled" : ""}>Begin product development</button></form><div class="everyday-grid">${s.realWorld.products.map((p) => `<article class="everyday-card"><h3>${e(p.name)}</h3><p>${e(p.status)} · ${p.progress}/${p.required} development · ${Math.round(p.quality)}/100 quality</p><p>${p.sales} sales · ${money(p.revenue)} gross receipts · ${money(p.costs)} development/delivery costs</p>${p.status === "developing" ? `<button class="button secondary" data-action="product-develop" data-id="${e(p.id)}" ${off(s)}>Work on product</button>` : p.status === "selling" ? `<form data-form="product-price" data-id="${e(p.id)}"><label class="field-label">Price in USD<input name="price" type="number" value="${p.price}" min="${p.unitCost}" step="0.01" required></label><button class="button secondary" ${off(s)}>Change product price</button></form><button class="text-button" data-action="product-stop" data-id="${e(p.id)}">Withdraw product</button>` : ""}<p>${p.reviews.map((r) => `${gameDate(r.week, s)}: ${r.rating}/100 review`).join("<br>")}</p></article>`).join("")}</div></section>`;
}
export function rightsScreen(s, u) {
  const { panelHeading, e, money } = u;
  return `<section class="panel" data-music-rights>${panelHeading("Masters, licences & catalogue", "Music ownership continues after stepping back from new work.")}<div class="application-list">${
    Object.values(s.realWorld.rights)
      .map(
        (r) =>
          `<article class="everyday-card"><h3>${e(s.music.projects.find((p) => p.id === r.id)?.title || s.music.releases.find((p) => p.id === r.id)?.title || "Recording")}</h3><p>${e(r.licence)} beat · ${Math.round(r.ownerShare * 100)}% artist share · ${Math.round(r.producerShare * 100)}% producer split</p><small>${money(r.producerPaid, 2)} paid to the producer before label terms.</small>${r.licence === "non-exclusive" ? `<p>Permission until ${gameDate(r.expiresWeek, s)} or ${r.streamLimit.toLocaleString()} total streams · ${r.blocked ? "distribution paused" : "active"}</p><button class="button secondary" data-action="beat-renew" data-id="${e(r.id)}" ${off(s)}>Renew beat licence · $100</button>` : ""}</article>`,
      )
      .join("") ||
    '<p class="muted">Tracks made in the workshop record their beat licence and royalty splits here. Existing recordings retain their earlier rights.</p>'
  }</div><button class="button secondary" data-action="${s.realWorld.retiredMusic ? "music-resume" : "music-retire"}" ${off(s)}>${s.realWorld.retiredMusic ? "Resume new music work" : "Retire from new music work"}</button><p class="muted">Finish current recordings, booked performances and tours first. Royalties continue while rights allow them; retirement does not release unreleased tracks.</p></section>`;
}
export function separationDialog(s, u) {
  const { money } = u,
    j = s.realWorld.household.joint,
    share = jointShare(s);
  return `<h2>Review separation.</h2><p>Your share of joint savings: ${money(share)}. Your partner receives ${money(j ? j.balance - share : 0)}. Personal property and business ownership remain separate; this simulation settles the explicitly shared account. Mediation costs ${money(s.relationships.find((r) => r.id === s.family.partnerId)?.role === "Spouse" ? 400 : 100)}.</p><form id="separation-form"><label class="field-label">Agreed child care<select name="custody"><option value="shared">Shared care</option><option value="primary">Children primarily with you</option><option value="other">Children primarily with other parent</option></select></label><p class="muted">Shared care reserves half of normal childcare time. Child support follows relative incomes and agreed care until adulthood. Unpaid amounts remain debt. A pending birth/adoption must be resolved first.</p><button class="button primary">Confirm separation agreement</button></form>`;
}
