import { JOBS, jobDefinition, isSportingJob } from "../world.js";
import { MARKETS } from "../engine.js";
import { act, clamp, round, roll, hash, uid, note, once, num, str, bool, one, arr, obj, stamps } from "./common.js";
export const SPECIALTIES = { general: "General practice", emergency: "Emergency medicine", surgery: "Surgical training" };
export const PRACTICE_METHODS = {
  medicine: { history: "Review history & follow-up", escalate: "Seek senior review", continuity: "Coordinate continuity of care" },
  nursing: { acuity: "Prioritise by care needs", handover: "Complete structured handover", escalate: "Escalate staffing concerns" },
  teaching: { explain: "Teach the core concept", practise: "Supervise independent practice", support: "Adapt for individual learning needs", parents: "Arrange parent conversations" },
  engineering: { model: "Review design & requirements", prototype: "Build a prototype", test: "Run verification tests", review: "Request independent review" },
  trades: { survey: "Survey the job", quote: "Prepare a checked quotation", materials: "Source specified materials", deliver: "Complete supervised work", inspect: "Arrange final inspection" },
  hospitality: { stock: "Check stock & bookings", prepare: "Prepare for service", service: "Run the booked service", inspect: "Complete hygiene inspection" },
  law: { evidence: "Review the evidence", negotiate: "Attempt a settlement", file: "File the prepared brief", hearing: "Attend the scheduled hearing" },
  office: { plan: "Review the project brief", coordinate: "Coordinate the team", deliver: "Present the completed work" },
  racing: { safety: "Review safety & equipment", coaching: "Supervise a learner session", review: "Review learner progress" },
};
export function initializeProfessions(s) {
  return { active: false, lastWeek: s.week, jobId: null, employer: "", employerCash: 25000, cases: [], class: [], clients: [], specialisation: null, references: [], vacancy: null, actions: {}, history: [], lastEmployment: null };
}
function currentJob(s) { const j = jobDefinition(s.employment?.jobId); if (!j || isSportingJob(j)) throw new Error("Professional practice requires a current ordinary employment contract."); return j; }
function desk(s) { const j = currentJob(s); if (!s.simulation.professions.active || s.simulation.professions.jobId !== j.id) throw new Error("Open the practice desk for your current job first."); return j; }
export function recordWorkReference(s, employment = s.employment) {
  const p = s.simulation?.professions; if (!p || !employment || isSportingJob(jobDefinition(employment.jobId))) return;
  const job = jobDefinition(employment.jobId); if (!job) return;
  const old = p.references.find((r) => r.jobId === job.id && r.week === s.week); if (old) return;
  const score = Math.round(clamp(employment.performance * .65 + (s.workLife?.managerBond || 50) * .35));
  p.references.unshift({ jobId: job.id, employer: job.employer, track: job.track, week: s.week, tenure: employment.tenure || 0, score, text: score >= 75 ? "Reliable delivery and constructive working relationships" : score >= 50 ? "Satisfactory delivery; some development needs" : "Significant concerns about sustained performance" }); p.references = p.references.slice(0, 20);
  if (p.lastEmployment?.jobId === employment.jobId) p.lastEmployment = null;
}
export function openProfessionalDesk(state) {
  const j = currentJob(state), s = act(state, { minAge: 18, hours: 0, label: "During paid work: review professional practice" }), p = s.simulation.professions;
  if (p.active && p.jobId === j.id) throw new Error("This professional desk is already open.");
  p.active = true; p.jobId = j.id; p.employer = j.employer; p.lastEmployment = { ...s.employment };
  for (const c of p.cases.filter((c) => c.status === "open")) c.status = "abandoned";
  p.class = j.track === "teaching" || j.track === "racing" ? Array.from({ length: 24 }, (_, i) => ({ id: `learner:${i}`, name: ["Alex", "Noor", "Sam", "Avery", "Jules", "Robin"][i % 6] + ` ${["Chen", "Okafor", "Jensen", "Rossi"][Math.floor(i / 6)]}`, grade: 35 + hash(`${s.simulation.originSeed}:${i}`) % 40, attendance: 75 + i % 25, needsSupport: i % 5 === 0, confidence: 50 })) : [];
  p.clients = j.track === "investor" ? Array.from({ length: 3 }, (_, i) => ({ id: `client:${s.simulation.serial++}`, name: ["Morgan Family", "Riverside Foundation", "Lee Retirement Account"][i], mandate: ["balanced", "cautious", "growth"][i], cash: [50000, 100000, 75000][i], holdings: Object.fromEntries(MARKETS.map((m) => [m.id, 0])), basis: Object.fromEntries(MARKETS.map((m) => [m.id, 0])), taxRate: [.15, 0, 0][i], taxPaid: 0, losses: 0, startValue: [50000, 100000, 75000][i], fees: 0, lastValue: [50000, 100000, 75000][i] })) : [];
  p.vacancy = null; note(s, `Opened the ${j.employer} practice desk. Work is within your current role; it does not grant a licence or transfer employer/client money to you.`); return s;
}
export function beginSpecialisation(state, field) {
  const j = desk(state); if (j.track !== "medicine" || !Object.hasOwn(SPECIALTIES, field) || !state.education.completed.includes('medical-license') || state.simulation.professions.specialisation) throw new Error("Specialisation requires clinical registration, medical employment and no existing training record.");
  const s = act(state, { minAge: 18, cost: 250, hours: 1 }), p = s.simulation.professions;
  p.specialisation = { field, since: s.week, delivered: 0, lastPractice: -1, status: "training", assessment: null }; note(s, "Supervised specialisation began. Record 104 delivered clinical weeks before requesting a final assessment."); return s;
}
export function assessSpecialisation(state) {
  const j = desk(state), record = state.simulation.professions.specialisation; if (j.track !== "medicine" || !record || record.delivered < 104 || record.status === "certified") throw new Error("Complete 104 supervised clinical weeks first.");
  const s = act(state, { minAge: 18, cost: 250, hours: 3 }), p = s.simulation.professions; once(s, p.actions, "specialist-exam", 13);
  const passed = s.skills.knowledge >= 75 && s.skills.empathy >= 55 && roll(s) < .4 + s.skills.knowledge / 200;
  p.specialisation.assessment = s.week; p.specialisation.status = passed ? "certified" : "training"; note(s, passed ? "Specialist assessment passed. Senior vacancies still require an application and a suitable opening." : "The specialist assessment requires further supervised development."); return s;
}
export function newProfessionalCase(state) {
  const j = desk(state), p = state.simulation.professions;
  if (j.track === "investor") throw new Error("Use client portfolio mandates for investment work.");
  if (p.cases.some((c) => c.status === "open" && c.jobId === j.id)) throw new Error("Complete your current case or project first.");
  const s = act(state, { minAge: 18, hours: 0, label: "During paid work: accept a case" }), n = s.simulation.professions; once(s, n.actions, "new-case", 4);
  const kind = j.track, budget = kind === "engineering" ? 3000 : kind === "trades" ? 1200 : ["hospitality", "nursing"].includes(kind) ? 800 : 0;
  n.cases.unshift({ id: uid(s, "professional-case"), jobId: j.id, kind, since: s.week, deadline: s.week + (kind === "law" ? 12 : 8), status: "open", stage: 0, quality: 35, defects: 3, evidence: 0, budget, spent: 0, authorised: false, readyWeek: 0, outcome: "", severity: 30 + Math.floor(roll(s) * 50), staff: 2 + Math.floor(roll(s) * 4), demand: 12 + Math.floor(roll(s) * 25), stock: 0, hygiene: 50, customerPaid: false });
  n.cases = [...n.cases.filter((c) => c.status === "open"), ...n.cases.filter((c) => c.status !== "open").slice(0, 20)]; return s;
}
function performance(s, amount, text) { if (s.employment) s.employment.performance = clamp(s.employment.performance + amount); s.workLife.managerBond = clamp(s.workLife.managerBond + Math.sign(amount)); note(s, text, amount < 0 ? "warning" : "positive"); }
export function professionalPractice(state, method) {
  const j = desk(state), methods = PRACTICE_METHODS[j.track] || PRACTICE_METHODS.office;
  if (!Object.hasOwn(methods, method)) throw new Error("Choose a method belonging to this profession.");
  const s = act(state, { minAge: 18, hours: 0, energy: 5, label: "During paid work: professional practice" }), p = s.simulation.professions; once(s, p.actions, "practice");
  const c = p.cases.find((c) => c.status === "open" && c.jobId === j.id);
  if (!c) throw new Error("Accept a case or project first.");
  const skill = ({medicine:"knowledge", nursing:"empathy", teaching:"knowledge", engineering:"technical", trades:"technical", hospitality:"charisma", law:"knowledge", racing:"driving"})[j.track] || "business";
  const mastery = clamp(s.skills[skill] * .65 + s.energy * .15 + s.workLife.colleagueBond * .2);
  const spendEmployer = (cost) => { if (p.employerCash < cost || c.spent + cost > c.budget) throw new Error("The employer's approved project budget cannot cover this step."); p.employerCash = round(p.employerCash - cost); c.spent = round(c.spent + cost); };
  const finish = (success, text) => { c.status = success ? "delivered" : "review-needed"; c.outcome = text; performance(s, success ? 3 : -2, text); };
  if (j.track === "medicine") {
    c.quality = clamp(c.quality + mastery / 8 + (method === "escalate" && c.severity > 60 ? 10 : 3)); c.stage++;
    if (p.specialisation?.status === "training" && c.quality >= 55) { p.specialisation.delivered++; p.specialisation.lastPractice = s.week; }
    if (c.stage >= 3) finish(c.quality >= 60, "Supervised clinical case reviewed for safety, escalation and continuity.");
  } else if (j.track === "nursing") {
    const load = c.demand / c.staff, best = load > 9 ? "escalate" : c.severity > 60 ? "acuity" : "handover";
    c.quality = clamp(c.quality + mastery / 9 + (method === best ? 12 : 2)); if (method === "escalate" && c.staff < 6) { spendEmployer(250); c.staff++; } c.stage++;
    if (c.stage >= 3) finish(c.quality >= 65, `Ward review completed: ${c.demand} care needs, ${c.staff} staff, quality ${Math.round(c.quality)}.`);
  } else if (j.track === "teaching" || j.track === "racing") {
    for (const pupil of p.class) { const match = pupil.needsSupport ? method === "support" || method === "review" : method === "practise" || method === "coaching"; pupil.grade = clamp(pupil.grade + mastery / 100 + (match ? .6 : .1)); if (method === "parents" || method === "safety") pupil.attendance = clamp(pupil.attendance + 3); pupil.confidence = clamp(pupil.confidence + (match ? 1 : .2)); }
    c.stage++; c.quality = round(p.class.reduce((n, p) => n + p.grade * p.attendance / 100, 0) / p.class.length); if (c.stage >= 4) finish(c.quality >= 45 && (j.track !== "teaching" || p.class.filter((p) => p.needsSupport).every((p) => p.confidence >= 52)), "The class assessment recorded each learner's progress, attendance and support needs.");
  } else if (j.track === "engineering") {
    if (method === "model") { c.quality = clamp(c.quality + mastery / 7); c.stage = Math.max(c.stage, 1); if (c.authorised) c.defects = Math.max(0, c.defects - 1); }
    else if (method === "prototype") { if (c.stage < 1) throw new Error("Review the design brief before prototyping."); spendEmployer(800); c.stage = 2; }
    else if (method === "test") { if (c.stage < 2) throw new Error("Build a prototype before testing."); spendEmployer(150); c.authorised = true; c.evidence++; c.defects = Math.max(0, c.defects - (mastery >= 65 ? 1 : 0)); c.stage = 3; }
    else { if (c.stage < 3 || !c.authorised) throw new Error("Verification evidence is required for independent review."); finish(c.defects === 0 && c.quality >= 55, `Independent engineering review: ${c.defects} unresolved defects, quality ${Math.round(c.quality)}.`); }
  } else if (j.track === "trades") {
    const required = ["survey", "quote", "materials", "deliver", "inspect"][c.stage]; if (method !== required) throw new Error(`Next required job stage: ${methods[required]}.`);
    if (method === "materials") { spendEmployer(500); c.stock = 1; }
    c.quality = clamp(c.quality + mastery / 12); c.stage++;
    if (method === "inspect") { const safe = c.quality >= 60 && c.stock > 0; finish(safe, safe ? "The quoted work passed final inspection; the employer invoiced the customer." : "Inspection identified work requiring supervised remediation."); if (safe) { p.employerCash += 1200; c.customerPaid = true; } }
  } else if (j.track === "hospitality") {
    if (method === "stock") { spendEmployer(200); c.stock += 30; c.stage = Math.max(1, c.stage); }
    else if (method === "prepare") { if (!c.stock) throw new Error("Stock the service first."); c.quality = clamp(c.quality + mastery / 8); c.hygiene = clamp(c.hygiene + 10); c.stage = 2; }
    else if (method === "service") { if (c.stage < 2 || c.stock < c.demand) throw new Error("Meet bookings with enough stock and preparation."); c.stock -= c.demand; p.employerCash += c.demand * 18; c.hygiene = clamp(c.hygiene - 10); c.stage = 3; }
    else { if (c.stage < 3) throw new Error("Complete the booked service before the inspection review."); finish(c.hygiene >= 50 && c.quality >= 50, "Service and hygiene review recorded the actual bookings, food stock and customer experience."); }
  } else if (j.track === "law") {
    if (method === "evidence") { c.evidence++; c.quality = clamp(c.quality + mastery / 9); }
    else if (method === "negotiate") { if (!c.evidence) throw new Error("Review evidence before negotiations."); if (roll(s) < .2 + c.quality / 180) finish(true, "The parties agreed a settlement after reviewing the prepared evidence."); else note(s, "No settlement was agreed; court preparation remains available."); }
    else if (method === "file") { if (c.evidence < 2) throw new Error("Prepare two evidence reviews before filing."); c.readyWeek = s.week + 3; c.authorised = true; note(s, "The court scheduled a hearing three weeks after filing."); }
    else { if (!c.authorised || s.week < c.readyWeek) throw new Error("Attend on or after the scheduled hearing date."); const success = roll(s) < Math.min(.95, .15 + c.quality / 150 + c.evidence * .04); finish(success, success ? "The court accepted the supported position; the employer closed the case." : "The court ruled against the prepared position; a supervisor will review the outcome."); }
  } else { c.stage++; c.quality = clamp(c.quality + mastery / 7); if (c.stage >= 3) finish(c.quality >= 60, "The internal project review recorded delivery quality and team coordination."); }
  return s;
}
export function tradeForClient(state, clientId, asset, amount) {
  const j = desk(state); if (j.track !== "investor") throw new Error("Client dealing requires professional investment employment.");
  const m = MARKETS.find((m) => m.id === asset), client = state.simulation.professions.clients.find((c) => c.id === clientId);
  if (!m || !client || !Number.isFinite(amount) || amount === 0 || !m.fractional && !Number.isInteger(amount)) throw new Error("Choose a client, asset and valid signed unit amount.");
  const price = state.market[asset], total = client.cash + MARKETS.reduce((n, m) => n + client.holdings[m.id] * state.market[m.id], 0), value = amount * price;
  if (amount > 0 && value > client.cash || amount < 0 && -amount > client.holdings[asset]) throw new Error("The client must fund the trade and own units being sold.");
  const risky = m.type === "Crypto" || m.type === "Listed company", cap = m.type === "Crypto" ? client.mandate === "cautious" ? 0 : .1 : client.mandate === "cautious" ? .15 : .4;
  if (amount > 0 && risky && (client.holdings[asset] + amount) * price > total * cap) throw new Error("This trade exceeds the client's concentration or risk mandate.");
  const riskTotal = MARKETS.filter((m) => ["Crypto", "Listed company"].includes(m.type)).reduce((n,m)=>n+client.holdings[m.id]*state.market[m.id],0);
  if(amount>0&&risky&&riskTotal+value>total*(client.mandate==='cautious'?.3:.8))throw new Error("The total risky allocation exceeds this client's mandate.");
  if (Math.abs(value) < 1 || Math.abs(amount) > m.volume * .01 || (state.tradeVolumes[asset] || 0) + Math.abs(amount) > m.volume) throw new Error("Client trades require $1 value and available weekly liquidity.");
  const s = act(state, { minAge: 18, hours: 0, label: "During paid work: client dealing" }), c = s.simulation.professions.clients.find((c) => c.id === clientId); once(s, s.simulation.professions.actions, `client:${clientId}`);
  if (amount > 0) c.basis[asset] = round(c.basis[asset] + value);
  else { const basis = c.basis[asset] * -amount / c.holdings[asset], gain = -value - basis; c.basis[asset] = round(c.basis[asset] - basis); if (gain < 0) c.losses = round(c.losses - gain); else { const offset = Math.min(c.losses, gain); c.losses = round(c.losses - offset); const tax = round((gain - offset) * c.taxRate); c.cash -= tax; c.taxPaid += tax; } }
  c.cash = round(c.cash - value); c.holdings[asset] += amount; s.tradeVolumes[asset] = (s.tradeVolumes[asset] || 0) + Math.abs(amount);
  note(s, `Client portfolio trade completed for ${c.name}; personal cash and ownership were unchanged.`); return s;
}
export function reviewInternalVacancy(state) {
  const j = desk(state), target = JOBS.find((n) => n.track === j.track && n.level === j.level + 1 && n.employer === j.employer); if (!target) throw new Error("This employer has no higher internal position in your track.");
  const s = act(state, { minAge: 18, hours: 1 }), p = s.simulation.professions; once(s, p.actions, "vacancy-review", 13);
  const draw = hash(`${j.employer}:${Math.floor(s.week / 13)}`) % 4, open = draw === 0 || s.employment.tenure >= 104 && draw === 1;
  p.vacancy = { jobId: target.id, reviewed: s.week, closes: s.week + 13, status: open ? "open" : "filled", winner: null, competitors: Array.from({length:3},(_,i)=>({ name:["Alex Rivera","Sam Okafor","Morgan Lee"][i], score:50 + hash(`${j.id}:${i}:${Math.floor(s.week/13)}`)%36 })) };
  note(s, open ? `An internal ${target.title} opening has three other candidates. Qualifications and the ordinary promotion review still apply.` : "The next internal position is currently occupied; review another quarter or apply externally."); return s;
}
export function professionalPromotionReason(s) {
  const p = s.simulation?.professions; if (!p?.active || p.jobId !== s.employment?.jobId) return null;
  return !p.vacancy || p.vacancy.status !== "open" || p.vacancy.closes < s.week ? "Review a real open internal vacancy before requesting promotion." : null;
}
export function referenceModifier(s, track) { if (!s.simulation?.professions.active) return 0; const refs = (s.simulation?.professions.references || []).filter((r)=>r.track===track).slice(0,3); return refs.length ? Math.max(-.12, Math.min(.08, refs.reduce((n,r)=>n+r.score-60,0)/refs.length/250)) : 0; }
export function promotionCompetition(s) { const p = s.simulation?.professions, v = p?.vacancy; if (!p?.active || p.jobId !== s.employment?.jobId || !v || v.status !== "open" || v.closes < s.week) return 0; return Math.max(-.15, Math.min(.1, (s.employment.performance - Math.max(...v.competitors.map((c)=>c.score)))/200)); }
export function creditClientDividend(s, asset, perUnit) {
  for (const c of s.simulation?.professions.clients || []) { const gross = round(c.holdings[asset] * perUnit); if (gross <= 0) continue; const tax = round(gross * c.taxRate); c.cash = round(c.cash + gross - tax); c.taxPaid = round(c.taxPaid + tax); }
}
export function advanceProfessions(s) {
  const p = s.simulation.professions; if (p.lastWeek === s.week) return; p.lastWeek = s.week;
  if (p.lastEmployment && p.lastEmployment.jobId !== s.employment?.jobId) { recordWorkReference(s, p.lastEmployment); p.lastEmployment = null; for (const c of p.cases.filter((c)=>c.status==='open')) c.status='abandoned'; }
  if (!p.active || p.jobId !== s.employment?.jobId || s.globalLife.crime.prison) return;
  if (p.vacancy?.status === "open" && p.vacancy.closes < s.week && !["pending", "offer"].includes(s.workLife.promotion?.status)) { p.vacancy.status = "filled"; p.vacancy.winner = p.vacancy.competitors.slice().sort((a,b)=>b.score-a.score)[0]?.name || null; note(s, `The internal opening closed${p.vacancy.winner ? `; ${p.vacancy.winner} was selected` : ""}.`); }
  p.lastEmployment = { ...s.employment };
  for (const c of p.cases.filter((c)=>c.status==='open'&&c.deadline<s.week)) { c.status='missed'; c.outcome='The case deadline passed without completed delivery.'; performance(s,-3,c.outcome); }
  if (s.week % 13 === 0) {
    p.employerCash = round(Math.min(250000, p.employerCash + 5000));
    for (const c of p.clients) { const value=c.cash+MARKETS.reduce((n,m)=>n+c.holdings[m.id]*s.market[m.id],0), fee=round(Math.min(c.cash,value*.01/4));c.cash-=fee;c.fees+=fee;c.lastValue=round(value-fee);p.employerCash+=fee; }
    p.history.unshift({week:s.week,quality:s.employment.performance,employerCash:p.employerCash});p.history=p.history.slice(0,20);
  }
}
export function validateProfessions(s) {
  const p=obj(s.simulation.professions);bool(p.active);num(p.lastWeek,0,s.week,true);if(p.jobId!==null){str(p.jobId,100);if(!jobDefinition(p.jobId))throw new Error('Invalid professional role.');}str(p.employer,100);num(p.employerCash);stamps(p.actions,s.week);
  for(const c of arr(p.cases,22)){obj(c);str(c.id,100);if(!jobDefinition(c.jobId))throw new Error('Invalid case role.');str(c.kind,30);num(c.since,0,s.week,true);num(c.deadline,c.since,s.week+12,true);one(c.status,['open','delivered','review-needed','abandoned','missed']);for(const k of ['stage','quality','defects','evidence','budget','spent','readyWeek','severity','staff','demand','stock','hygiene'])num(c[k]);bool(c.authorised);bool(c.customerPaid);str(c.outcome,250);}
  for(const c of arr(p.class,24)){str(c.id,100);str(c.name,100);for(const k of ['grade','attendance','confidence'])num(c[k],0,100);bool(c.needsSupport);}
  for(const c of arr(p.clients,3)){str(c.id,100);str(c.name,100);one(c.mandate,['cautious','balanced','growth']);for(const k of ['cash','startValue','fees','lastValue','taxPaid','losses'])num(c[k]);num(c.taxRate,0,.5);obj(c.holdings);obj(c.basis);for(const m of MARKETS){num(c.holdings[m.id],0,1e9,!m.fractional);num(c.basis[m.id]);}}
  if(p.specialisation){const a=obj(p.specialisation);one(a.field,Object.keys(SPECIALTIES));num(a.since,0,s.week,true);num(a.delivered,0,10000,true);num(a.lastPractice,-1,s.week,true);one(a.status,['training','certified']);if(a.assessment!==null)num(a.assessment,0,s.week,true);if(a.status==='certified'&&a.delivered<104)throw new Error('Invalid specialist certification.');}
  for(const r of arr(p.references,20)){str(r.jobId,100);str(r.employer,100);str(r.track,30);num(r.week,0,s.week,true);num(r.tenure,0,10000,true);num(r.score,0,100);str(r.text,200);}
  if(p.vacancy){const v=obj(p.vacancy);str(v.jobId,100);num(v.reviewed,0,s.week,true);num(v.closes,v.reviewed,s.week+13,true);one(v.status,['open','filled']);if(v.winner!==null)str(v.winner,100);for(const c of arr(v.competitors,3)){str(c.name,100);num(c.score,0,100);}}
  for(const h of arr(p.history,20)){num(h.week,0,s.week,true);num(h.quality,0,100);num(h.employerCash);}
  if(p.lastEmployment){obj(p.lastEmployment);str(p.lastEmployment.jobId,100);num(p.lastEmployment.performance,0,100);num(p.lastEmployment.tenure,0,10000,true);}
}
