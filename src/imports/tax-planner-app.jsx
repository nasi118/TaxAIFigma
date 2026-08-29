import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  Plus, Copy, Trash2, Award, TrendingDown, ChevronDown, ChevronRight,
  RotateCcw, FileText, X, Maximize2, Layers, CalendarRange, BookOpen,
  ShieldAlert, ShieldCheck, Shield, TrendingUp, Sparkles, PiggyBank, Library,
  LayoutDashboard, ArrowRight, CheckCircle2, AlertTriangle, Lightbulb,
} from "lucide-react";

/* ============================================================================
   TAX ENGINE — 2025 individual income tax (post-OBBBA figures)
   ========================================================================== */
const STD_DEDUCTION = { single: 15750, mfj: 31500, mfs: 15750, hoh: 23625 };
const BRACKETS = {
  single: [[0,.10],[11925,.12],[48475,.22],[103350,.24],[197300,.32],[250525,.35],[626350,.37]],
  mfj:    [[0,.10],[23850,.12],[96950,.22],[206700,.24],[394600,.32],[501050,.35],[751600,.37]],
  mfs:    [[0,.10],[11925,.12],[48475,.22],[103350,.24],[197300,.32],[250525,.35],[375800,.37]],
  hoh:    [[0,.10],[17000,.12],[64850,.22],[103350,.24],[197300,.32],[250500,.35],[626350,.37]],
};
const LTCG = {
  single: { zero: 48350, fifteen: 533400 }, mfj: { zero: 96700, fifteen: 600050 },
  mfs: { zero: 48350, fifteen: 300000 }, hoh: { zero: 64750, fifteen: 566700 },
};
const NIIT_THRESHOLD = { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 };
const ADDL_MED_THRESHOLD = { single: 200000, mfj: 250000, mfs: 125000, hoh: 200000 };
const SALT_CAP = { single: 40000, mfj: 40000, mfs: 20000, hoh: 40000 };
const SALT_PHASEOUT_MAGI = { single: 500000, mfj: 500000, mfs: 250000, hoh: 500000 };
const SALT_FLOOR = { single: 10000, mfj: 10000, mfs: 5000, hoh: 10000 };
const QBI_THRESHOLD = { single: 197300, mfj: 394600, mfs: 197300, hoh: 197300 };
const SS_WAGE_BASE = 176100;
// 2025 planning limits (retirement, HSA)
const EMP_401K_DEFERRAL = 23500;   // employee elective deferral
const CATCHUP_401K_50 = 7500;      // age 50+ 401(k) catch-up
const ADDITIONS_LIMIT = 70000;     // overall §415(c) additions limit
const HSA_SELF = 4300, HSA_FAMILY = 8550, HSA_CATCHUP_55 = 1000;

const num = (v) => (v === "" || v === "-" || v == null || isNaN(v) ? 0 : Number(v));

function ordinaryTax(ti, status, infl = 1) {
  if (ti <= 0) return 0;
  const b = BRACKETS[status]; let tax = 0;
  for (let i = 0; i < b.length; i++) {
    const floor = b[i][0] * infl, rate = b[i][1], ceil = i + 1 < b.length ? b[i + 1][0] * infl : Infinity;
    if (ti > floor) tax += (Math.min(ti, ceil) - floor) * rate; else break;
  }
  return tax;
}
function marginalRate(ti, status, infl = 1) {
  const b = BRACKETS[status]; let r = b[0][1];
  for (let i = 0; i < b.length; i++) if (ti > b[i][0] * infl) r = b[i][1];
  return r;
}
function capitalGainsTax(ordinaryTaxable, pref, status, infl = 1) {
  if (pref <= 0) return 0;
  const b = LTCG[status], start = Math.max(0, ordinaryTaxable), end = start + pref;
  const zero = b.zero * infl, fifteen = b.fifteen * infl;
  let tax = 0;
  tax += Math.max(0, Math.min(end, fifteen) - Math.max(start, zero)) * 0.15;
  tax += Math.max(0, end - Math.max(start, fifteen)) * 0.20;
  return tax;
}

/* ---- Schedule roll-up helpers ---- */
const businessNet = (b) =>
  num(b.grossReceipts) - num(b.returns) - num(b.cogs) -
  (b.expenses || []).reduce((a, e) => a + num(e.amount), 0);
const schedCTotal = (sc) => (sc.businesses || []).reduce((a, b) => a + businessNet(b), 0);
const largestBiz = (sc) => {
  let best = null, bestNet = -Infinity;
  (sc?.businesses || []).forEach((b) => { const n = businessNet(b); if (n > bestNet) { bestNet = n; best = b; } });
  return bestNet > 0 ? best : null;
};
const ptTotal = (pt) =>
  (pt.entities || []).reduce((a, e) => a + num(e.ordinary) + num(e.rental), 0);
const s1IncomeTotal = (s1) =>
  num(s1.stateRefund) + num(s1.unemployment) + num(s1.gambling) +
  num(s1.cancellationDebt) + num(s1.otherIncome);
// Schedule 1 Part II items OTHER than retirement / HSA / SEHI (those live in the Planning module)
const s1OtherAdjTotal = (s1) =>
  num(s1.studentLoanInterest) + num(s1.educatorExpenses) +
  num(s1.earlyWithdrawalPenalty) + num(s1.alimonyPaid) + num(s1.otherAdjustments);

/* ---- Planning strategies: retirement, HSA, self-employed health insurance ----
   netSEEarnings = Schedule C net − ½ SE tax (base for sole-prop employer share).
   sCorpComp = S-corp reasonable comp (base for 25% employer share). */
function computePlanning(s, netSEEarnings, sCorpComp) {
  const p = s.planning || {};
  const age = num(p.age);
  const catch401 = age >= 50 ? CATCHUP_401K_50 : 0;
  const additionsCap = ADDITIONS_LIMIT + catch401;
  const empDeferralCap = EMP_401K_DEFERRAL + catch401;

  let employer = 0, employee = 0;
  if (p.planType === "solo401k" || p.planType === "sep") {
    employer = p.employerMode === "manual"
      ? num(p.employerManual)
      : 0.20 * Math.max(0, netSEEarnings) + 0.25 * Math.max(0, sCorpComp);
    if (p.planType === "solo401k") employee = Math.min(num(p.employeeDeferral), empDeferralCap);
  }
  const retirement = Math.max(0, Math.min(employer + employee, additionsCap));

  const hsaLimit = (p.hsaCoverage === "family" ? HSA_FAMILY : HSA_SELF) + (age >= 55 ? HSA_CATCHUP_55 : 0);
  let hsa = 0;
  if (p.hsaMode === "max") hsa = hsaLimit;
  else if (p.hsaMode === "manual") hsa = Math.min(num(p.hsaManual), hsaLimit);

  const seHealth = Math.max(0, num(p.seHealth));
  return {
    retirement, employer, employee, hsa, hsaLimit, seHealth,
    additionsCap, empDeferralCap,
    total: retirement + hsa + seHealth,
  };
}

function schedATotal(a, agi, status, infl = 1) {
  const medItems = (a.medical || []).reduce((x, i) => x + num(i.amount), 0);
  const medical = Math.max(0, medItems - 0.075 * agi);
  const saltRaw = num(a.stateIncomeTax) + num(a.realEstateTax) + num(a.personalPropertyTax) + num(a.salesTax);
  let cap = SALT_CAP[status] * infl;
  cap = Math.max(SALT_FLOOR[status] * infl, cap - 0.30 * Math.max(0, agi - SALT_PHASEOUT_MAGI[status] * infl));
  const salt = Math.min(saltRaw, cap);
  const interest = num(a.mortgageInterest) + num(a.points) + num(a.investmentInterest);
  const charity = Math.min(
    num(a.charityCash) + num(a.charityNonCash) + num(a.charityCarryover),
    0.60 * Math.max(0, agi)
  );
  const other = (a.other || []).reduce((x, i) => x + num(i.amount), 0);
  return { total: medical + salt + interest + charity + other, medical, salt, saltCap: cap, interest, charity, other, saltRaw };
}

function computeQBI(qbi, tiBeforeQBI, netCapGain, status, infl = 1) {
  const cap = 0.20 * Math.max(0, tiBeforeQBI - netCapGain);
  if (qbi.useManual) {
    const d = Math.min(num(qbi.manualAmount), cap);
    return { deduction: Math.max(0, d), component: num(qbi.manualAmount), cap };
  }
  const ents = qbi.entities || [];
  const highIncome = tiBeforeQBI > QBI_THRESHOLD[status] * infl;
  let component;
  if (qbi.aggregate) {
    const inc = ents.reduce((a, e) => a + num(e.income), 0);
    const w2 = ents.reduce((a, e) => a + num(e.w2), 0);
    const ubia = ents.reduce((a, e) => a + num(e.ubia), 0);
    const base = 0.20 * inc;
    const wageLimit = Math.max(0.5 * w2, 0.25 * w2 + 0.025 * ubia);
    component = highIncome ? Math.min(base, wageLimit) : base;
  } else {
    component = ents.reduce((acc, e) => {
      const base = 0.20 * num(e.income);
      const wageLimit = Math.max(0.5 * num(e.w2), 0.25 * num(e.w2) + 0.025 * num(e.ubia));
      return acc + (highIncome ? (base > 0 ? Math.min(base, wageLimit) : base) : base);
    }, 0);
  }
  component = Math.max(0, component);
  return { deduction: Math.min(component, cap), component, cap, highIncome };
}

function computeScenario(s, status, infl = 1) {
  const wagesW2 = num(s.w2Wages), sCorpComp = num(s.sCorpComp);
  const interest = num(s.taxableInterest), ordDiv = num(s.ordinaryDividends), qualDiv = num(s.qualifiedDividends);
  const stGains = num(s.shortTermGains), ltGains = num(s.longTermGains), sCorpK1 = num(s.sCorpK1);
  const schedC = schedCTotal(s.schedC), passthrough = ptTotal(s.passthrough);
  const s1Income = s1IncomeTotal(s.schedule1), other = num(s.otherIncome);

  const grossIncome = wagesW2 + sCorpComp + interest + ordDiv + stGains + ltGains +
    schedC + passthrough + sCorpK1 + s1Income + other;

  const ssBase = SS_WAGE_BASE * infl;
  const netSE = schedC > 0 ? schedC * 0.9235 : 0;
  const otherSSWages = Math.min(wagesW2 + sCorpComp, ssBase);
  const ssBaseLeft = Math.max(0, ssBase - otherSSWages);
  const seSS = Math.min(netSE, ssBaseLeft) * 0.124;
  const seMedicare = netSE * 0.029;
  const seTax = seSS + seMedicare;
  const seDeduction = seTax * 0.5;
  const sCorpFICA = sCorpComp > 0 ? Math.min(sCorpComp, ssBase) * 0.124 + sCorpComp * 0.029 : 0;
  // NIIT & Additional Medicare thresholds are fixed by statute (never inflation-indexed)
  const addlMedicare = Math.max(0, (wagesW2 + sCorpComp + netSE) - ADDL_MED_THRESHOLD[status]) * 0.009;

  const s1AdjOther = s1OtherAdjTotal(s.schedule1);
  const netSEEarnings = schedC > 0 ? schedC - seDeduction : 0;
  const P = computePlanning(s, netSEEarnings, sCorpComp);
  const s1AdjOnly = s1AdjOther + seDeduction;      // Schedule 1 Part II excl. planning items
  const adjustments = s1AdjOnly + P.total;
  const agi = grossIncome - adjustments;

  const A = schedATotal(s.scheduleA, agi, status, infl);
  const stdDed = STD_DEDUCTION[status] * infl;
  let deductionUsed, deductionKind;
  if (s.deductionMode === "standard") { deductionUsed = stdDed; deductionKind = "Standard"; }
  else if (s.deductionMode === "itemized") { deductionUsed = A.total; deductionKind = "Itemized"; }
  else if (A.total >= stdDed) { deductionUsed = A.total; deductionKind = "Itemized"; }
  else { deductionUsed = stdDed; deductionKind = "Standard"; }

  const tiBeforeQBI = Math.max(0, agi - deductionUsed);
  const netCapGain = Math.max(0, ltGains) + Math.max(0, qualDiv);
  const Q = computeQBI(s.qbi, tiBeforeQBI, netCapGain, status, infl);
  const taxableIncome = Math.max(0, tiBeforeQBI - Q.deduction);

  const pref = Math.min(taxableIncome, netCapGain);
  const ordinaryTaxable = Math.max(0, taxableIncome - pref);
  const fedIncomeTax = ordinaryTax(ordinaryTaxable, status, infl) + capitalGainsTax(ordinaryTaxable, pref, status, infl);

  const investmentIncome = interest + ordDiv + stGains + Math.max(0, ltGains);
  const niit = 0.038 * Math.min(investmentIncome, Math.max(0, agi - NIIT_THRESHOLD[status]));

  const totalTax = fedIncomeTax + seTax + sCorpFICA + addlMedicare + niit;
  return {
    grossIncome, schedC, passthrough, s1Income, adjustments, s1AdjOnly, s1AdjOther,
    planning: P, planningTotal: P.total, netSEEarnings, seDeduction, agi,
    itemized: A.total, A, stdDed, deductionUsed, deductionKind,
    qbi: Q, taxableIncome, fedIncomeTax, seTax, seSS, seMedicare, netSE, sCorpFICA,
    addlMedicare, niit, totalTax,
    ordinaryTaxable, prefIncome: pref, infl,
    incomeParts: {
      wages: wagesW2, sCorpComp, schedC, passthrough, sCorpK1,
      interest, ordDiv, qualDiv, stGains, ltGains, s1Income, other,
    },
    effectiveRate: grossIncome > 0 ? totalTax / grossIncome : 0,
    afterTax: grossIncome - totalTax,
    marginal: marginalRate(ordinaryTaxable, status, infl),
  };
}

/* ---- Multi-year projection ----
   Scales income inputs by an annual growth factor and indexes statutory
   thresholds by an annual inflation factor. Deduction choices are held at
   their nominal planned amounts. */
function scaleScenarioIncome(s, g) {
  const c = structuredClone(s);
  const inc = ["w2Wages", "sCorpComp", "taxableInterest", "ordinaryDividends",
    "qualifiedDividends", "shortTermGains", "longTermGains", "sCorpK1", "otherIncome"];
  inc.forEach((f) => { c[f] = num(s[f]) * g; });
  c.schedC?.businesses?.forEach((b) => {
    b.grossReceipts = num(b.grossReceipts) * g;
    b.returns = num(b.returns) * g;
    b.cogs = num(b.cogs) * g;
    b.expenses?.forEach((e) => { e.amount = num(e.amount) * g; });
    b.w2wages = num(b.w2wages) * g; b.ubia = num(b.ubia) * g;
  });
  c.passthrough?.entities?.forEach((e) => {
    e.ordinary = num(e.ordinary) * g; e.rental = num(e.rental) * g;
    e.w2 = num(e.w2) * g; e.ubia = num(e.ubia) * g;
  });
  ["stateRefund", "unemployment", "gambling", "cancellationDebt", "otherIncome"]
    .forEach((f) => { if (c.schedule1) c.schedule1[f] = num(s.schedule1?.[f]) * g; });
  if (c.qbi) {
    c.qbi.manualAmount = num(s.qbi?.manualAmount) * g;
    c.qbi.entities?.forEach((e) => { e.income = num(e.income) * g; e.w2 = num(e.w2) * g; e.ubia = num(e.ubia) * g; });
  }
  return c;
}
function projectScenario(s, status, opts) {
  const { years, startYear, growth, inflation } = opts;
  const out = [];
  for (let t = 0; t < years; t++) {
    const g = Math.pow(1 + growth, t);
    const infl = Math.pow(1 + inflation, t);
    out.push({ year: startYear + t, r: computeScenario(scaleScenarioIncome(s, g), status, infl) });
  }
  return out;
}

/* ============================================================================
   SEED DATA — David's four scenarios, with full schedule detail
   ========================================================================== */
const uid = () => crypto.randomUUID();

const buzzBusiness = () => ({
  id: uid(), name: "Buzz Property Management, LLC",
  grossReceipts: 57000, returns: 0, cogs: 0, w2wages: 0, ubia: 453750,
  expenses: [
    { id: uid(), label: "Business vehicle depreciation", amount: 20200 },
    { id: uid(), label: "Depreciation (Gwinnett, GA)", amount: 16500 },
    { id: uid(), label: "Mortgage interest (Gwinnett property)", amount: 26255.72 },
    { id: uid(), label: "Business vehicle interest", amount: 3154.15 },
    { id: uid(), label: "Other expenses", amount: 5000 },
  ],
});
const yjBusiness = (special = false) => ({
  id: uid(), name: "Yellow Jackets Goldbuyers, LLC",
  grossReceipts: 2500000, returns: 0, cogs: 1550000, w2wages: 150000, ubia: special ? 131750 : 85000,
  expenses: special
    ? [
        { id: uid(), label: "Operating expenses", amount: 310000 },
        { id: uid(), label: "Wages", amount: 150000 },
        { id: uid(), label: "Special: business use of personal vehicle", amount: 20000 },
        { id: uid(), label: "Special: home office deduction", amount: 6000 },
      ]
    : [
        { id: uid(), label: "Operating expenses", amount: 310000 },
        { id: uid(), label: "Wages", amount: 150000 },
      ],
});

const K1S = () => [
  { id: uid(), name: "521 Village Trace LLC", ordinary: 0, rental: 20000, w2: 0, ubia: 85849, se: false },
  { id: uid(), name: "Launchpad Real Estate", ordinary: 80000, rental: 20000, w2: 50030, ubia: 763822, se: false },
  { id: uid(), name: "Avi Enterprises, LLC", ordinary: 0, rental: 14000, w2: 0, ubia: 299469, se: false },
  { id: uid(), name: "Amresco Georgia Holdco LLC", ordinary: 0, rental: 13000, w2: 0, ubia: 83818, se: false },
  { id: uid(), name: "Hillside Georgia Rentals LLC", ordinary: 0, rental: -15000, w2: 0, ubia: 202003, se: false },
  { id: uid(), name: "Bury The Hatchet Holdings, LLC", ordinary: 0, rental: 5000, w2: 25578, ubia: 28271, se: false },
  { id: uid(), name: "Deal or No Deal", ordinary: 0, rental: -1000, w2: 16414, ubia: 205106, se: false },
  { id: uid(), name: "Mastermind Escape Games", ordinary: 35000, rental: 0, w2: 27870, ubia: 47570, se: false },
];

const emptyScheduleA = () => ({
  medical: [{ id: uid(), label: "Medical & dental", amount: 0 }],
  stateIncomeTax: 0, realEstateTax: 0, personalPropertyTax: 0, salesTax: 5000,
  mortgageInterest: 0, points: 0, investmentInterest: 0,
  charityCash: 35000, charityNonCash: 0, charityCarryover: 8000,
  other: [],
});

const qbiEntitiesFromSchedules = (schedC, passthrough, extra = []) => {
  const fromC = (schedC.businesses || []).map((b) => ({
    id: uid(), name: b.name, income: businessNet(b), w2: b.w2wages, ubia: b.ubia,
  }));
  const fromK1 = (passthrough.entities || []).map((e) => ({
    id: uid(), name: e.name, income: num(e.ordinary) + num(e.rental), w2: e.w2, ubia: e.ubia,
  }));
  return [...fromC, ...fromK1, ...extra];
};

const defaultPlanning = () => ({
  age: 45,
  planType: "none",           // none | solo401k | sep
  employerMode: "auto",       // auto | manual
  employerManual: 0,
  employeeDeferral: 0,
  hsaCoverage: "self",        // self | family
  hsaMode: "off",             // off | max | manual
  hsaManual: 0,
  seHealth: 0,
});

function scenarioV1() {
  const schedC = { businesses: [buzzBusiness(), yjBusiness(false)] };
  const passthrough = { entities: K1S() };
  return {
    id: uid(), name: "Status Quo (Sch C)",
    w2Wages: 1500, sCorpComp: 0, taxableInterest: 16000, ordinaryDividends: 0, qualifiedDividends: 0,
    shortTermGains: 0, longTermGains: 0, sCorpK1: 0, otherIncome: 0,
    schedC, passthrough,
    schedule1: { hsa: 0, iraDeduction: 0, seHealthInsurance: 10000, studentLoanInterest: 0,
      educatorExpenses: 0, earlyWithdrawalPenalty: 0, alimonyPaid: 0, otherAdjustments: 0,
      stateRefund: 0, unemployment: 0, gambling: 0, cancellationDebt: 0, otherIncome: 0 },
    scheduleA: emptyScheduleA(),
    deductionMode: "itemized",
    planning: defaultPlanning(),
    qbi: { aggregate: true, useManual: false, manualAmount: 110042,
      entities: qbiEntitiesFromSchedules(schedC, passthrough) },
  };
}

// Move any legacy Schedule 1 retirement/HSA/SEHI amounts into the Planning module
function migratePlanning(s) {
  const s1 = s.schedule1;
  s.planning = {
    ...defaultPlanning(),
    ...(s.planning || {}),
    planType: num(s1.iraDeduction) > 0 ? "solo401k" : (s.planning?.planType || "none"),
    employerMode: num(s1.iraDeduction) > 0 ? "manual" : (s.planning?.employerMode || "auto"),
    employerManual: num(s1.iraDeduction),
    hsaMode: num(s1.hsa) > 0 ? "manual" : (s.planning?.hsaMode || "off"),
    hsaManual: num(s1.hsa),
    seHealth: num(s1.seHealthInsurance),
  };
  s1.hsa = 0; s1.iraDeduction = 0; s1.seHealthInsurance = 0;
  return s;
}

function deepClone(scn, name) {
  const c = structuredClone(scn);
  c.id = uid(); c.name = name ?? scn.name + " (copy)";
  const regen = (o) => { if (o && o.id) o.id = uid(); };
  c.schedC?.businesses?.forEach((b) => { regen(b); b.expenses?.forEach(regen); });
  c.passthrough?.entities?.forEach(regen);
  c.scheduleA?.medical?.forEach(regen);
  c.scheduleA?.other?.forEach(regen);
  c.qbi?.entities?.forEach(regen);
  return c;
}

function seed() {
  const v1 = scenarioV1();
  v1.name = "Current Year";

  const v2 = deepClone(v1, "Planning Scenario 1");
  v2.w2Wages = 0;
  v2.schedC.businesses[1] = yjBusiness(true);
  v2.schedule1.hsa = 4300; v2.schedule1.iraDeduction = 23500;
  v2.qbi = { aggregate: true, useManual: false, manualAmount: 110042,
    entities: qbiEntitiesFromSchedules(v2.schedC, v2.passthrough) };

  return [v1, v2].map(migratePlanning);
}

/* ---- Planning scenario templates ----
   Each mutates a cloned scenario to apply a specific strategy. `requiresSchedC`
   templates target the largest positive Schedule C business. */
const PLANNING_TEMPLATES = [
  {
    id: "retirement", label: "Max Retirement + HSA", modal: "planning",
    desc: "Solo 401(k) employer + employee deferral, HSA to the limit, and SE health insurance.",
    apply: (c) => {
      c.planning = {
        ...defaultPlanning(), ...(c.planning || {}),
        planType: "solo401k", employerMode: "auto", employeeDeferral: EMP_401K_DEFERRAL,
        hsaMode: "max", hsaCoverage: c.planning?.hsaCoverage || "self", seHealth: c.planning?.seHealth || 0,
      };
    },
  },
  {
    id: "scorp", label: "S-Corp Conversion", requiresSchedC: true,
    desc: "Recharacterize the largest Schedule C as reasonable W-2 comp (~45%) plus distributions to cut self-employment tax.",
    apply: (c) => {
      const biz = largestBiz(c.schedC); if (!biz) return;
      const net = businessNet(biz);
      const comp = Math.max(0, Math.round(net * 0.45 / 1000) * 1000);
      c.sCorpComp = num(c.sCorpComp) + comp;
      c.sCorpK1 = num(c.sCorpK1) + (net - comp);
      c.schedC.businesses = c.schedC.businesses.filter((b) => b.id !== biz.id);
      c.qbi = { ...c.qbi, entities: [...(c.qbi.entities || []), { id: uid(), name: biz.name + " (S-Corp)", income: net - comp, w2: comp, ubia: num(biz.ubia) }] };
    },
  },
  {
    id: "bonus", label: "Bonus Depreciation / §179", requiresSchedC: true, modal: "schedC",
    desc: "Place a heavy (>6,000 lb GVWR) vehicle in service — 100% first-year expensing against the largest business.",
    apply: (c) => {
      const biz = largestBiz(c.schedC); if (!biz) return;
      biz.expenses = [...(biz.expenses || []), { id: uid(), label: "§179 / 100% bonus — heavy vehicle (>6,000 lb GVWR)", amount: 60000 }];
    },
  },
  {
    id: "family", label: "Family Employment", requiresSchedC: true, modal: "schedC",
    desc: "Pay a child a reasonable wage — FICA-exempt under 18 for a sole prop — to shift income out of the SE base.",
    apply: (c) => {
      const biz = largestBiz(c.schedC); if (!biz) return;
      biz.expenses = [...(biz.expenses || []), { id: uid(), label: "Wages — family member (child <18, FICA-exempt / sole prop)", amount: 15000 }];
    },
  },
  {
    id: "charity", label: "Charitable Bunching (DAF)", modal: "schedA",
    desc: "Concentrate two years of giving into one itemizing year via a donor-advised fund.",
    apply: (c) => {
      c.scheduleA = { ...c.scheduleA, charityCash: num(c.scheduleA.charityCash) * 2 };
      c.deductionMode = "itemized";
    },
  },
  {
    id: "blank", label: "Blank planning scenario",
    desc: "Clone the lowest-tax scenario with the Planning module ready to configure from scratch.",
    modal: "planning", apply: () => {},
  },
];

/* ============================================================================
   ANALYSIS ENGINE
   Breaks liability down by tax type and probes for missed opportunities by
   cloning the scenario, applying one change, and re-running the full engine.
   ========================================================================== */
const TAX_TYPES = [
  { key: "fedIncomeTax", label: "Federal income tax", note: "Progressive brackets + preferential rates on LT gains / qualified dividends" },
  { key: "seTax", label: "Self-employment tax", note: "15.3% on 92.35% of Schedule C net, SS portion capped at the wage base" },
  { key: "sCorpFICA", label: "S-Corp payroll (FICA)", note: "Employer + employee Social Security and Medicare on reasonable comp" },
  { key: "addlMedicare", label: "Additional Medicare", note: "0.9% on wages + SE earnings above the statutory threshold (not indexed)" },
  { key: "niit", label: "Net investment income tax", note: "3.8% on investment income above the MAGI threshold (not indexed)" },
];

function taxTypeBreakdown(r) {
  return TAX_TYPES.map((t) => ({
    ...t, amount: r[t.key] || 0,
    share: r.totalTax > 0 ? (r[t.key] || 0) / r.totalTax : 0,
    rate: r.grossIncome > 0 ? (r[t.key] || 0) / r.grossIncome : 0,
  }));
}

/** Bracket-by-bracket fill of ordinary taxable income (mirrors the tax report layout). */
function bracketFill(ordinaryTaxable, status, infl = 1) {
  const b = BRACKETS[status];
  const rows = [];
  for (let i = 0; i < b.length; i++) {
    const floor = b[i][0] * infl, rate = b[i][1];
    const ceil = i + 1 < b.length ? b[i + 1][0] * infl : Infinity;
    const income = Math.max(0, Math.min(ordinaryTaxable, ceil) - floor);
    rows.push({ rate, floor, ceil, income, tax: income * rate });
  }
  const marginalRow = [...rows].reverse().find((r) => r.income > 0) || rows[0];
  const headroom = marginalRow.ceil === Infinity ? Infinity : marginalRow.ceil - ordinaryTaxable;
  return { rows, headroom, marginalRate: marginalRow.rate };
}

/** Income composition by source and by tax character. */
function incomeAnalysis(r) {
  const p = r.incomeParts;
  const bySource = [
    { label: "Wages & S-Corp compensation", amount: p.wages + p.sCorpComp, note: "Subject to FICA withholding" },
    { label: "Schedule C business income", amount: p.schedC, note: "Subject to self-employment tax" },
    { label: "Passthrough / K-1 & S-Corp", amount: p.passthrough + p.sCorpK1, note: "Not subject to SE tax" },
    { label: "Interest & dividends", amount: p.interest + p.ordDiv, note: "Ordinary rates; counts toward NIIT" },
    { label: "Capital gains", amount: p.stGains + p.ltGains, note: "Long-term at preferential rates" },
    { label: "Other income (Sch 1)", amount: p.s1Income + p.other, note: "Ordinary rates" },
  ].filter((x) => x.amount !== 0);
  const pref = Math.max(0, p.ltGains) + Math.max(0, p.qualDiv);
  const byCharacter = [
    { label: "Ordinary-rate income", amount: r.grossIncome - pref },
    { label: "Preferential-rate income", amount: pref, note: "LT gains + qualified dividends (0/15/20%)" },
  ].filter((x) => x.amount !== 0);
  const investment = p.interest + p.ordDiv + p.stGains + Math.max(0, p.ltGains);
  return { bySource, byCharacter, investment, pref };
}

/** Deduction stack: above-the-line, itemized vs standard, QBI. */
function deductionAnalysis(r) {
  const aboveLine = [
    { label: "Deductible half of SE tax", amount: r.seDeduction },
    { label: "Retirement contributions", amount: r.planning.retirement },
    { label: "HSA contribution", amount: r.planning.hsa },
    { label: "Self-employed health insurance", amount: r.planning.seHealth },
    { label: "Other Schedule 1 adjustments", amount: r.s1AdjOther },
  ].filter((x) => x.amount !== 0);
  const itemized = [
    { label: "Medical & dental (after 7.5% floor)", amount: r.A.medical },
    { label: "State & local taxes (after cap)", amount: r.A.salt, note: `capped at ${usd$(r.A.saltCap)}` },
    { label: "Mortgage & investment interest", amount: r.A.interest },
    { label: "Gifts to charity", amount: r.A.charity },
    { label: "Other itemized", amount: r.A.other },
  ].filter((x) => x.amount !== 0);
  return { aboveLine, itemized };
}
function probe(s, status, mutate) {
  const c = structuredClone(s);
  try { mutate(c); } catch { return 0; }
  return computeScenario(s, status).totalTax - computeScenario(c, status).totalTax;
}

function analyzeScenario(s, status) {
  const r = computeScenario(s, status);
  const p = s.planning || {};
  const out = [];
  const add = (o) => { if (o) out.push(o); };
  const age = num(p.age);

  /* --- Retirement --- */
  const retireSavings = probe(s, status, (c) => {
    c.planning = { ...defaultPlanning(), ...c.planning, planType: "solo401k",
      employerMode: "auto", employeeDeferral: EMP_401K_DEFERRAL + (age >= 50 ? CATCHUP_401K_50 : 0) };
  });
  if (retireSavings > 50) {
    add({ id: "retire", cat: "Retirement", risk: "low", savings: retireSavings,
      title: p.planType === "none" ? "No qualified retirement plan in place" : "Retirement contributions below the allowable maximum",
      why: `A Solo 401(k) combining the employer profit-share (20% of net SE earnings / 25% of S-corp comp) with the full $${(EMP_401K_DEFERRAL + (age >= 50 ? CATCHUP_401K_50 : 0)).toLocaleString()} employee deferral would reduce AGI further. Employer contributions also reduce QBI, so net benefit runs below the headline deduction.`,
      action: "Open the Planning module and set plan type to Solo 401(k) with the employer share on Auto.",
      ref: "IRC §401(k), §415(c) · Pub 560" });
  } else if (p.planType !== "none") {
    add({ id: "retire-ok", cat: "Retirement", risk: "low", savings: 0, applied: true,
      title: "Retirement plan is funded at or near the limit",
      why: `Current retirement deduction is ${usd$(r.planning.retirement)} against a ${usd$(r.planning.additionsCap)} additions cap.`,
      action: "No further action — verify the deferral isn't duplicated at a W-2 job.",
      ref: "IRC §415(c)" });
  }

  /* --- HSA --- */
  const hsaSavings = probe(s, status, (c) => { c.planning = { ...defaultPlanning(), ...c.planning, hsaMode: "max" }; });
  if (hsaSavings > 25) {
    add({ id: "hsa", cat: "Health", risk: "low", savings: hsaSavings,
      title: p.hsaMode === "off" ? "HSA not funded" : "HSA funded below the annual limit",
      why: `With an HSA-eligible HDHP, the 2025 limit is $${HSA_SELF.toLocaleString()} self-only / $${HSA_FAMILY.toLocaleString()} family${age >= 55 ? " plus a $1,000 age-55 catch-up" : ""}. Contributions are deductible, grow tax-free, and come out tax-free for medical costs.`,
      action: "Confirm HDHP eligibility, then set HSA to Max in the Planning module.",
      ref: "IRC §223 · Pub 969 · Form 8889" });
  }

  /* --- Self-employed health insurance --- */
  if (r.schedC > 0 && num(p.seHealth) === 0) {
    add({ id: "sehi", cat: "Health", risk: "med", savings: 0, unquantified: true,
      title: "No self-employed health insurance deduction claimed",
      why: "With positive self-employment income, premiums for the taxpayer and family are generally deductible above the line. A >2% S-corp shareholder must run premiums through W-2 Box 1 first.",
      action: "Enter annual premiums in the Planning module; for an S-corp, confirm W-2 Box 1 reporting.",
      ref: "IRC §162(l) · Notice 2008-1 · Form 7206" });
  }

  /* --- Entity structure --- */
  const biz = largestBiz(s.schedC);
  if (biz) {
    const scorpSavings = probe(s, status, (c) => {
      const b = largestBiz(c.schedC); if (!b) return;
      const net = businessNet(b), comp = Math.max(0, Math.round(net * 0.45 / 1000) * 1000);
      c.sCorpComp = num(c.sCorpComp) + comp;
      c.sCorpK1 = num(c.sCorpK1) + (net - comp);
      c.schedC.businesses = c.schedC.businesses.filter((x) => x.id !== b.id);
      c.qbi = { ...c.qbi, entities: [...(c.qbi.entities || []), { id: "probe", name: b.name, income: net - comp, w2: comp, ubia: num(b.ubia) }] };
    });
    if (scorpSavings > 500) {
      add({ id: "scorp", cat: "Entity", risk: "high", savings: scorpSavings,
        title: `Schedule C income is fully exposed to self-employment tax`,
        why: `${biz.name} nets ${usd$(businessNet(biz))} on Schedule C, all subject to SE tax. An S-corp election would split it into reasonable W-2 comp (FICA) and distributions (no SE tax). Wages reduce QBI, so the net gain is smaller than the payroll-tax saving alone.`,
        action: "Model the S-Corp Conversion template, then set comp from a documented reasonable-compensation study.",
        ref: "IRC §1361/§1362 · Form 2553 · reasonable comp is the top S-corp audit issue" });
    }
  }

  /* --- Depreciation --- */
  if (biz) {
    const bonusSavings = probe(s, status, (c) => {
      const b = largestBiz(c.schedC); if (!b) return;
      b.expenses = [...(b.expenses || []), { id: "probe", label: "probe", amount: 60000 }];
    });
    if (bonusSavings > 500) {
      add({ id: "bonus", cat: "Depreciation", risk: "high", savings: bonusSavings,
        title: "Bonus depreciation / §179 capacity not used this year",
        why: `A $60,000 heavy vehicle (>6,000 lb GVWR) or equipment purchase placed in service would be fully expensed — 100% bonus is permanent for property placed in service after Jan 19, 2025. Reduces both income tax and SE tax.`,
        action: "Only pursue with a genuine business need; document GVWR and >50% business use with a mileage log.",
        ref: "IRC §179, §168(k) · Form 4562 · GA/NJ require a bonus add-back" });
    }
  }

  /* --- Deduction method --- */
  if (s.deductionMode === "standard" && r.itemized > r.stdDed) {
    add({ id: "ded", cat: "Deductions", risk: "low", savings: probe(s, status, (c) => { c.deductionMode = "itemized"; }),
      title: "Taking the standard deduction while itemized deductions are larger",
      why: `Itemized deductions total ${usd$(r.itemized)} versus a ${usd$(r.stdDed)} standard deduction.`,
      action: "Switch the deduction method to Auto or Itemized.", ref: "IRC §63" });
  } else if (s.deductionMode === "itemized" && r.stdDed > r.itemized) {
    add({ id: "ded2", cat: "Deductions", risk: "low", savings: probe(s, status, (c) => { c.deductionMode = "standard"; }),
      title: "Itemizing when the standard deduction is larger",
      why: `The ${usd$(r.stdDed)} standard deduction exceeds ${usd$(r.itemized)} of itemized deductions.`,
      action: "Switch the deduction method to Auto or Standard.", ref: "IRC §63" });
  }

  /* --- SALT headroom --- */
  const saltUnused = Math.max(0, r.A.saltCap - r.A.salt);
  if (r.deductionKind === "Itemized" && saltUnused > 2000) {
    add({ id: "salt", cat: "Deductions", risk: "low", savings: 0, unquantified: true,
      title: `${usd$(saltUnused)} of SALT deduction capacity unused`,
      why: `The OBBBA cap for this filing status is ${usd$(r.A.saltCap)} but only ${usd$(r.A.salt)} of state and local tax is claimed. Prepaying Q4 state estimates or property tax before year-end can absorb the headroom while itemizing.`,
      action: "Verify all state income, real-estate, and personal-property taxes are captured on Schedule A.",
      ref: "IRC §164(b)(6) · cap reverts to $10,000 in 2030" });
  }

  /* --- Charitable bunching --- */
  const charity = num(s.scheduleA?.charityCash) + num(s.scheduleA?.charityNonCash);
  if (charity > 0) {
    const bunchSavings = probe(s, status, (c) => {
      c.scheduleA = { ...c.scheduleA, charityCash: num(c.scheduleA.charityCash) * 2 };
      c.deductionMode = "itemized";
    });
    if (bunchSavings > 500) {
      add({ id: "charity", cat: "Charitable", risk: "med", savings: bunchSavings,
        title: "Charitable giving is spread evenly rather than bunched",
        why: `Concentrating roughly two years of giving into one itemizing year through a donor-advised fund accelerates the deduction and — from 2026 — clears the new 0.5%-of-AGI floor only once instead of twice.`,
        action: "Fund a DAF in the bunch year and grant to charities over time; take the standard deduction in the off year.",
        ref: "IRC §170 · Form 8283 · 60% AGI cash limit / 30% appreciated property" });
    }
    if (num(s.scheduleA?.charityNonCash) === 0 && (num(s.longTermGains) > 0 || num(s.qualifiedDividends) > 0)) {
      add({ id: "approp", cat: "Charitable", risk: "med", savings: 0, unquantified: true,
        title: "Giving cash while holding appreciated securities",
        why: "Donating long-term appreciated stock instead of cash deducts fair market value and permanently avoids the embedded capital gain — usually better than selling and donating proceeds.",
        action: "Transfer appreciated positions directly to the charity or DAF before any sale.",
        ref: "IRC §170(e) · Pub 561 · appraisal required over $5,000 non-cash" });
    }
  }

  /* --- QBI --- */
  if (r.qbi.component > r.qbi.deduction + 1) {
    add({ id: "qbicap", cat: "QBI", risk: "high", savings: 0, unquantified: true,
      title: `QBI deduction limited by the taxable-income cap — ${usd$(r.qbi.component - r.qbi.deduction)} lost`,
      why: `The tentative §199A component is ${usd$(r.qbi.component)} but the deduction is capped at 20% of taxable income net of capital gain (${usd$(r.qbi.cap)}). Deductions that lower taxable income also shrink this cap, so stacking them has diminishing returns.`,
      action: "Sequence deductions across years rather than stacking them all into one; consider electing out of bonus depreciation.",
      ref: "IRC §199A(a) · Forms 8995 / 8995-A" });
  }

  /* --- NIIT --- */
  if (r.niit > 0) {
    add({ id: "niit", cat: "Investment", risk: "med", savings: 0, unquantified: true,
      title: `Net investment income tax of ${usd$(r.niit)} is being incurred`,
      why: `The 3.8% surtax applies to investment income once MAGI exceeds ${usd$(NIIT_THRESHOLD[status])}. That threshold is fixed by statute and never indexes for inflation, so exposure grows over time.`,
      action: "Consider municipal bonds, asset location, installment sales, or loss harvesting to reduce net investment income.",
      ref: "IRC §1411 · Form 8960" });
  }

  /* --- Loss harvesting --- */
  const netGains = num(s.shortTermGains) + num(s.longTermGains);
  if (netGains > 0) {
    add({ id: "tlh", cat: "Investment", risk: "med", savings: 0, unquantified: true,
      title: `${usd$(netGains)} of capital gains realized with no harvested losses`,
      why: "Harvesting unrealized losses offsets gains dollar-for-dollar, plus up to $3,000 against ordinary income, with the excess carried forward indefinitely.",
      action: "Review taxable accounts for loss positions; replace with a not-substantially-identical fund to hold exposure.",
      ref: "IRC §1211/§1212 · wash-sale rule spans 61 days across all accounts" });
  }

  /* --- Family employment --- */
  if (biz && businessNet(biz) > 30000) {
    const famSavings = probe(s, status, (c) => {
      const b = largestBiz(c.schedC); if (!b) return;
      b.expenses = [...(b.expenses || []), { id: "probe", label: "probe", amount: 15000 }];
    });
    if (famSavings > 500) {
      add({ id: "family", cat: "Entity", risk: "med", savings: famSavings,
        title: "Family employment not used to shift income",
        why: "Wages paid to a child under 18 by a sole proprietorship are exempt from FICA and FUTA, deductible to the business, and largely sheltered by the child's standard deduction.",
        action: "Only for genuine work at a reasonable rate — keep timesheets, a job description, and real payroll records.",
        ref: "IRC §3121(b)(3)(A) · does not apply to S-corp wages" });
    }
  }

  out.sort((a, b) => (b.savings || 0) - (a.savings || 0));
  return { r, findings: out, breakdown: taxTypeBreakdown(r) };
}
const usd = (v) => { const n = Math.round(num(v)); const s = Math.abs(n).toLocaleString("en-US"); return n < 0 ? `(${s})` : n === 0 ? "—" : s; };
const usd$ = (v) => { const n = Math.round(num(v)); const s = Math.abs(n).toLocaleString("en-US"); return n < 0 ? `($${s})` : `$${s}`; };
const pct = (v) => `${(v * 100).toFixed(1)}%`;

/* ============================================================================
   MAIN COMPONENT
   ========================================================================== */
const TABS = [
  { id: "summary", label: "Summary & Analysis", icon: LayoutDashboard, blurb: "Comparison, tax-type breakdown, missed opportunities, and prioritized recommendations." },
  { id: "scenarios", label: "Scenarios", icon: Layers, blurb: "Build and compare scenarios line by line. Click any highlighted row to drill into that schedule." },
  { id: "projection", label: "Multi-Year Projection", icon: CalendarRange, blurb: "Project each scenario forward with income growth and inflation-indexed thresholds." },
  { id: "guide", label: "Planning Guide", icon: BookOpen, blurb: "Screening checklist of strategies by category, with key figures and audit-risk flags." },
  { id: "library", label: "Tax Library", icon: Library, blurb: "Small-business regulatory reference: authorities, guidance, forms, and retention." },
];

export default function TaxPlanner() {
  const [status, setStatus] = useState("single");
  const [scenarios, setScenarios] = useState(seed);
  const [open, setOpen] = useState({ income: true, ded: true, qbi: true });
  const [modal, setModal] = useState(null);
  const [planMenu, setPlanMenu] = useState(false);
  const [tab, setTab] = useState("summary");

  // Multi-year projection controls
  const [startYear, setStartYear] = useState(2025);
  const [years, setYears] = useState(1);
  const [growth, setGrowth] = useState(3);      // % annual income growth
  const [inflation, setInflation] = useState(2.8); // % annual bracket indexing

  const results = useMemo(
    () => scenarios.map((s) => ({ s, r: computeScenario(s, status) })),
    [scenarios, status]
  );

  const projection = useMemo(
    () => scenarios.map((s) => ({
      s,
      years: projectScenario(s, status, {
        years, startYear, growth: growth / 100, inflation: inflation / 100,
      }),
    })),
    [scenarios, status, years, startYear, growth, inflation]
  );
  const bestId = useMemo(() => {
    if (!results.length) return null;
    return results.reduce((a, b) => (b.r.totalTax < a.r.totalTax ? b : a)).s.id;
  }, [results]);
  const baseline = results[0];

  const update = (id, field, value) =>
    setScenarios((sc) => sc.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const updateSchedule = (id, key, value) =>
    setScenarios((sc) => sc.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  const addScenario = () => setScenarios((sc) => [...sc, deepClone(sc[sc.length - 1], `Scenario ${sc.length + 1}`)]);
  const addPlanningTemplate = (tplId) => {
    const tpl = PLANNING_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    // pick base: lowest-tax scenario; for structural templates prefer one with a Schedule C business
    const lowest = results.reduce((a, b) => (b.r.totalTax < a.r.totalTax ? b : a)).s;
    let src = lowest;
    if (tpl.requiresSchedC && !largestBiz(lowest.schedC)) {
      const withC = scenarios.find((s) => largestBiz(s.schedC));
      if (withC) src = withC;
    }
    const base = src.name.replace(/\s*\+.*$/, "");
    const c = deepClone(src, `${base} + ${tpl.label.replace(/ \(.*/, "")}`);
    tpl.apply(c);
    setScenarios((sc) => [...sc, c]);
    setPlanMenu(false);
    if (tpl.modal) setModal({ scenarioId: c.id, type: tpl.modal });
  };
  const duplicate = (id) =>
    setScenarios((sc) => { const src = sc.find((s) => s.id === id); return [...sc, deepClone(src)]; });
  const remove = (id) =>
    setScenarios((sc) => (sc.length > 1 ? sc.filter((s) => s.id !== id) : sc));
  const reset = () => setScenarios(seed());
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const chartData = results.map(({ s, r }) => ({
    name: s.name,
    "Income tax": Math.round(r.fedIncomeTax),
    "Employment tax": Math.round(r.seTax + r.sCorpFICA + r.addlMedicare),
    NIIT: Math.round(r.niit),
  }));
  const nCols = scenarios.length;
  const modalScenario = modal ? scenarios.find((s) => s.id === modal.scenarioId) : null;
  const modalResult = modal ? results.find((x) => x.s.id === modal.scenarioId)?.r : null;

  return (
    <div className="tp-root">
      <style>{CSS}</style>

      <div className="tp-shell">
        <aside className="tp-side">
          <div className="tp-brand">
            <div className="tp-mark">§</div>
            <div>
              <h1>Tax Planner</h1>
              <p>Scenario modeling &amp; advisory</p>
            </div>
          </div>

          <nav className="tp-nav">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`tp-navitem ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
                  <Icon size={15} /> {t.label}
                </button>
              );
            })}
          </nav>

          <div className="tp-side-controls">
            <label className="tp-field">
              <span>Filing status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="single">Single</option>
                <option value="mfj">Married filing jointly</option>
                <option value="mfs">Married filing separately</option>
                <option value="hoh">Head of household</option>
              </select>
            </label>
            <div className="tp-side-two">
              <label className="tp-field">
                <span>Start year</span>
                <select value={startYear} onChange={(e) => setStartYear(Number(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label className="tp-field">
                <span>Years</span>
                <select value={years} onChange={(e) => setYears(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>
            <button className="tp-btn ghost full" onClick={reset}><RotateCcw size={14} /> Reset example</button>
          </div>

          <div className="tp-side-foot">
            <div className="tp-side-stat">
              <span>Best scenario</span>
              <strong>{results.find((x) => x.s.id === bestId)?.s.name || "—"}</strong>
            </div>
            <div className="tp-side-stat">
              <span>Lowest total tax</span>
              <strong className="green">{usd$(results.find((x) => x.s.id === bestId)?.r.totalTax || 0)}</strong>
            </div>
          </div>
        </aside>

        <main className="tp-main">
          <div className="tp-topbar">
            <h2>{TABS.find((t) => t.id === tab)?.label}</h2>
            <p>{TABS.find((t) => t.id === tab)?.blurb}</p>
          </div>

          {tab === "summary" && (
            <SummaryPage results={results} bestId={bestId} baseline={baseline}
              status={status} projection={projection} years={years} startYear={startYear}
              onGoScenarios={() => setTab("scenarios")} />
          )}

          {tab === "scenarios" && <>
            <section className="tp-verdict">
          {results.map(({ s, r }, i) => {
            const isBest = s.id === bestId;
            const delta = baseline ? r.totalTax - baseline.r.totalTax : 0;
            return (
              <div key={s.id} className={`tp-vcard ${isBest ? "best" : ""}`}>
                {isBest && <div className="tp-badge"><Award size={12} /> Lowest tax</div>}
                <div className="tp-vname">{s.name}</div>
                <div className="tp-vtotal">{usd$(r.totalTax)}</div>
                <div className="tp-vsub">total tax · {pct(r.effectiveRate)} effective</div>
                {i > 0 ? (
                  <div className={`tp-vdelta ${delta < 0 ? "save" : delta > 0 ? "cost" : ""}`}>
                    {delta < 0 ? <TrendingDown size={13} /> : null}
                    {delta === 0 ? "same as baseline" : `${delta < 0 ? "saves " : "costs "}${usd$(Math.abs(delta))} vs. ${baseline.s.name}`}
                  </div>
                ) : <div className="tp-vdelta base">baseline</div>}
              </div>
            );
          })}
        </section>

        <section className="tp-ledger-wrap">
          <div className="tp-ledger" style={{ gridTemplateColumns: `minmax(230px,1.3fr) repeat(${nCols}, minmax(158px,1fr))` }}>
            <div className="tp-cell tp-corner">Line item</div>
            {scenarios.map((s) => (
              <div key={s.id} className={`tp-cell tp-schead ${s.id === bestId ? "best" : ""}`}>
                <input className="tp-name-input" value={s.name} onChange={(e) => update(s.id, "name", e.target.value)} />
                <div className="tp-schead-actions">
                  <button title="Clone scenario" onClick={() => duplicate(s.id)}><Copy size={13} /></button>
                  <button title="Delete" onClick={() => remove(s.id)} disabled={scenarios.length === 1}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}

            <GroupHeader label="Income" k="income" open={open.income} toggle={toggle} span={nCols} />
            {open.income && <>
              <InputRow field="w2Wages" label="W-2 wages" scenarios={scenarios} update={update} />
              <InputRow field="sCorpComp" label="S-Corp reasonable comp (W-2)" scenarios={scenarios} update={update} />
              <InputRow field="taxableInterest" label="Taxable interest" scenarios={scenarios} update={update} />
              <InputRow field="ordinaryDividends" label="Ordinary dividends" scenarios={scenarios} update={update} />
              <InputRow field="qualifiedDividends" label="— of which qualified" indent scenarios={scenarios} update={update} />
              <InputRow field="shortTermGains" label="Short-term capital gains" scenarios={scenarios} update={update} />
              <InputRow field="longTermGains" label="Long-term capital gains" scenarios={scenarios} update={update} />
              <DrillRow label="Schedule C — net" sub="income & expenses" results={results}
                value={(r) => r.schedC} onOpen={(id) => setModal({ scenarioId: id, type: "schedC" })} />
              <DrillRow label="Passthrough / K-1" sub="Schedule E entities" results={results}
                value={(r) => r.passthrough} onOpen={(id) => setModal({ scenarioId: id, type: "passthrough" })} />
              <InputRow field="sCorpK1" label="S-Corp K-1 pass-through" scenarios={scenarios} update={update} />
              <DrillRow label="Other income (Sch 1)" sub="refunds, unemployment…" results={results}
                value={(r) => r.s1Income} onOpen={(id) => setModal({ scenarioId: id, type: "schedule1" })} />
            </>}
            <ComputedRow label="Total income" cls="subtotal" values={results.map(({ r }) => r.grossIncome)} />

            <DrillRow label="Planning strategies" sub="retirement · HSA · SEHI" results={results}
              value={(r) => r.planningTotal} onOpen={(id) => setModal({ scenarioId: id, type: "planning" })} />
            <DrillRow label="Adjustments (Schedule 1)" sub="½ SE tax + above-the-line" results={results}
              value={(r) => r.s1AdjOnly} onOpen={(id) => setModal({ scenarioId: id, type: "schedule1" })} />
            <ComputedRow label="Total adjustments" cls="subtotal" values={results.map(({ r }) => r.adjustments)} />
            <ComputedRow label="Adjusted gross income (AGI)" cls="total" values={results.map(({ r }) => r.agi)} />

            <GroupHeader label="Deductions" k="ded" open={open.ded} toggle={toggle} span={nCols} />
            {open.ded && (
              <Row label="Method" muted>
                {scenarios.map((s) => (
                  <div key={s.id} className="tp-cell tp-calc">
                    <select className="tp-mini-select" value={s.deductionMode} onChange={(e) => update(s.id, "deductionMode", e.target.value)}>
                      <option value="auto">Auto (greater)</option>
                      <option value="standard">Standard</option>
                      <option value="itemized">Itemized</option>
                    </select>
                  </div>
                ))}
              </Row>
            )}
            {open.ded && (
              <DrillRow label="Itemized (Schedule A)" sub="medical, SALT, interest, charity" results={results}
                value={(r) => r.itemized} onOpen={(id) => setModal({ scenarioId: id, type: "schedA" })} />
            )}
            <ComputedRow label="Deduction applied" cls="subtotal"
              values={results.map(({ r }) => r.deductionUsed)} tags={results.map(({ r }) => r.deductionKind)} />

            <GroupHeader label="Qualified business income" k="qbi" open={open.qbi} toggle={toggle} span={nCols} />
            {open.qbi && (
              <DrillRow label="QBI computation" sub="per-entity, 199A limits" results={results}
                value={(r) => r.qbi.component} onOpen={(id) => setModal({ scenarioId: id, type: "qbi" })} />
            )}
            <ComputedRow label="QBI deduction allowed" cls="subtotal" values={results.map(({ r }) => r.qbi.deduction)} />

            <div className="tp-cell tp-group tax" style={{ gridColumn: `1 / ${nCols + 2}` }}>Tax</div>
            <ComputedRow label="Taxable income" cls="total" values={results.map(({ r }) => r.taxableIncome)} />
            <ComputedRow label="Federal income tax" values={results.map(({ r }) => r.fedIncomeTax)} />
            <DrillRow label="Self-employment tax" sub="Schedule SE breakdown" results={results}
              value={(r) => r.seTax} onOpen={(id) => setModal({ scenarioId: id, type: "seTax" })} />
            <ComputedRow label="S-Corp payroll (FICA)" values={results.map(({ r }) => r.sCorpFICA)} />
            <ComputedRow label="Additional Medicare (0.9%)" values={results.map(({ r }) => r.addlMedicare)} />
            <ComputedRow label="Net investment income tax" values={results.map(({ r }) => r.niit)} />
            <ComputedRow label="Total tax liability" cls="grand" values={results.map(({ r }) => r.totalTax)} money />
            <ComputedRow label="Effective rate" cls="rate" values={results.map(({ r }) => r.effectiveRate)} isPct />
            <ComputedRow label="Marginal bracket" cls="rate" values={results.map(({ r }) => r.marginal)} isPct />
            <ComputedRow label="After-tax income" cls="aftertax" values={results.map(({ r }) => r.afterTax)} money />
          </div>
          <div className="tp-add-row">
            <button className="tp-add" onClick={addScenario}><Plus size={15} /> Add scenario</button>
            <div className="tp-planmenu-wrap">
              <button className="tp-add planning" onClick={() => setPlanMenu((v) => !v)}>
                <Sparkles size={15} /> Add planning scenario <ChevronDown size={13} />
              </button>
              {planMenu && (
                <>
                  <div className="tp-planmenu-scrim" onClick={() => setPlanMenu(false)} />
                  <div className="tp-planmenu">
                    <div className="tp-planmenu-head">Strategy templates <em>applied to your lowest-tax scenario</em></div>
                    {PLANNING_TEMPLATES.map((t) => (
                      <button key={t.id} className="tp-planmenu-item" onClick={() => addPlanningTemplate(t.id)}>
                        <PiggyBank size={14} />
                        <span><strong>{t.label}</strong>{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
          </>}

          {tab === "scenarios" && (
        <section className="tp-panel">
          <div className="tp-panel-head">
            <h2>Total tax by scenario</h2>
            <span className="tp-legend">
              <i><span className="sw" style={{ background: "#16202E" }} /> Income tax</i>
              <i><span className="sw" style={{ background: "#4E6E8E" }} /> Employment tax</i>
              <i><span className="sw" style={{ background: "#C9A24B" }} /> NIIT</i>
            </span>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#E3E6EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#4A5568" }} tickLine={false} axisLine={{ stroke: "#E3E6EB" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#4A5568" }} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={(v) => usd$(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E3E6EB", fontFamily: "Inter" }} cursor={{ fill: "rgba(14,124,102,0.06)" }} />
                <Bar dataKey="Income tax" stackId="a" fill="#16202E" />
                <Bar dataKey="Employment tax" stackId="a" fill="#4E6E8E" />
                <Bar dataKey="NIIT" stackId="a" fill="#C9A24B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
          )}

          {tab === "projection" && (
            <MultiYearPanel projection={projection} years={years} startYear={startYear}
              growth={growth} setGrowth={setGrowth} inflation={inflation} setInflation={setInflation} />
          )}

          {tab === "guide" && <TaxPlanningGuide />}

          {tab === "library" && <TaxLibrary />}
        </main>
      </div>

      {modal && modalScenario && (
        <Modal onClose={() => setModal(null)} scenario={modalScenario} type={modal.type} result={modalResult} status={status}
          update={(key, value) => updateSchedule(modalScenario.id, key, value)}
          cloneAndOpen={() => {
            const c = deepClone(modalScenario);
            setScenarios((sc) => [...sc, c]);
            setModal({ scenarioId: c.id, type: modal.type });
          }} />
      )}
    </div>
  );
}

/* ============================================================================
   LEDGER SUB-COMPONENTS
   ========================================================================== */
function GroupHeader({ label, k, open, toggle, span }) {
  return (
    <div className="tp-cell tp-group" style={{ gridColumn: `1 / ${span + 2}` }} onClick={() => toggle(k)}>
      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {label}
    </div>
  );
}
function Row({ label, children, muted, indent }) {
  return (<>
    <div className={`tp-cell tp-label ${muted ? "muted" : ""} ${indent ? "indent" : ""}`}>{label}</div>
    {children}
  </>);
}
function InputRow({ field, label, indent, scenarios, update }) {
  return (
    <Row label={label} indent={indent}>
      {scenarios.map((s) => (
        <div key={s.id} className="tp-cell tp-input">
          <input type="text" inputMode="numeric" value={s[field] === 0 ? "" : s[field]} placeholder="0"
            onChange={(e) => { const v = e.target.value.replace(/[^0-9.\-]/g, ""); update(s.id, field, v === "" ? 0 : v); }} />
        </div>
      ))}
    </Row>
  );
}
function DrillRow({ label, sub, results, value, onOpen, cls = "" }) {
  return (<>
    <div className={`tp-cell tp-label drill ${cls}`}>
      <span>{label}</span>{sub && <em>{sub}</em>}
    </div>
    {results.map(({ s, r }) => (
      <button key={s.id} className={`tp-cell tp-calc drill ${cls}`} onClick={() => onOpen(s.id)}>
        {usd(value(r))} <Maximize2 size={12} className="tp-drill-ico" />
      </button>
    ))}
  </>);
}
function ComputedRow({ label, values, cls = "", tags, money, isPct }) {
  return (<>
    <div className={`tp-cell tp-label calc ${cls}`}>{label}</div>
    {values.map((v, i) => (
      <div key={i} className={`tp-cell tp-calc ${cls}`}>
        {isPct ? pct(v) : money ? usd$(v) : usd(v)}
        {tags && tags[i] && <span className="tp-tag">{tags[i]}</span>}
      </div>
    ))}
  </>);
}

/* ============================================================================
   MODAL SHELL + SCHEDULE EDITORS
   ========================================================================== */
const MODAL_TITLES = {
  schedC: "Schedule C — Profit or Loss from Business",
  passthrough: "Passthrough / K-1 Income (Schedule E)",
  schedule1: "Schedule 1 — Additional Income & Adjustments",
  schedA: "Schedule A — Itemized Deductions",
  qbi: "QBI Deduction — §199A Computation",
  seTax: "Self-Employment Tax — Schedule SE",
  planning: "Planning Strategies — Retirement · HSA · SEHI",
};

function Modal({ onClose, scenario, type, result, status, update, cloneAndOpen }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="tp-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tp-modal">
        <div className="tp-modal-head">
          <div>
            <div className="tp-modal-eyebrow">{scenario.name}</div>
            <h3>{MODAL_TITLES[type]}</h3>
          </div>
          <div className="tp-modal-head-actions">
            <button className="tp-btn ghost sm" onClick={cloneAndOpen}><Layers size={13} /> Clone scenario</button>
            <button className="tp-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
        <div className="tp-modal-body">
          {type === "schedC" && <SchedCEditor scenario={scenario} update={update} />}
          {type === "passthrough" && <PassthroughEditor scenario={scenario} update={update} />}
          {type === "schedule1" && <Schedule1Editor scenario={scenario} update={update} result={result} />}
          {type === "schedA" && <ScheduleAEditor scenario={scenario} update={update} result={result} status={status} />}
          {type === "qbi" && <QBIEditor scenario={scenario} update={update} result={result} status={status} />}
          {type === "seTax" && <SETaxViewer scenario={scenario} result={result} status={status} />}
          {type === "planning" && <PlanningEditor scenario={scenario} update={update} result={result} status={status} />}
        </div>
        <div className="tp-modal-foot">
          <button className="tp-btn solid" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function Money({ value, onChange, dim }) {
  return (
    <input className={`tp-mmoney ${dim ? "dim" : ""}`} type="text" inputMode="numeric"
      value={value === 0 || value === "0" ? "" : value} placeholder="0"
      onChange={(e) => { const v = e.target.value.replace(/[^0-9.\-]/g, ""); onChange(v === "" ? 0 : v); }} />
  );
}
function Field({ label, value, onChange, hint }) {
  return (
    <label className="tp-mfield">
      <span>{label}{hint && <em>{hint}</em>}</span>
      <Money value={value} onChange={onChange} />
    </label>
  );
}
function LineList({ items, onChange, labelPh = "Description" }) {
  const set = (id, key, val) => onChange(items.map((i) => (i.id === id ? { ...i, [key]: val } : i)));
  const add = () => onChange([...items, { id: uid(), label: "", amount: 0 }]);
  const del = (id) => onChange(items.filter((i) => i.id !== id));
  return (
    <div className="tp-linelist">
      {items.map((i) => (
        <div key={i.id} className="tp-linerow">
          <input className="tp-linelabel" placeholder={labelPh} value={i.label} onChange={(e) => set(i.id, "label", e.target.value)} />
          <Money value={i.amount} onChange={(v) => set(i.id, "amount", v)} />
          <button className="tp-linedel" onClick={() => del(i.id)}><Trash2 size={13} /></button>
        </div>
      ))}
      <button className="tp-lineadd" onClick={add}><Plus size={13} /> Add line</button>
    </div>
  );
}
const setBusiness = (scenario, update, bid, key, val) =>
  update("schedC", { ...scenario.schedC, businesses: scenario.schedC.businesses.map((b) => (b.id === bid ? { ...b, [key]: val } : b)) });

function SchedCEditor({ scenario, update }) {
  const sc = scenario.schedC;
  const addBiz = () => update("schedC", { ...sc, businesses: [...sc.businesses, { id: uid(), name: "New business", grossReceipts: 0, returns: 0, cogs: 0, w2wages: 0, ubia: 0, expenses: [] }] });
  const delBiz = (bid) => update("schedC", { ...sc, businesses: sc.businesses.filter((b) => b.id !== bid) });
  const total = schedCTotal(sc);
  return (
    <div className="tp-editor">
      {sc.businesses.map((b) => {
        const net = businessNet(b);
        return (
          <div key={b.id} className="tp-biz">
            <div className="tp-biz-head">
              <input className="tp-biz-name" value={b.name} onChange={(e) => setBusiness(scenario, update, b.id, "name", e.target.value)} />
              <button className="tp-linedel" onClick={() => delBiz(b.id)}><Trash2 size={14} /></button>
            </div>
            <div className="tp-grid2">
              <Field label="Gross receipts / sales" value={b.grossReceipts} onChange={(v) => setBusiness(scenario, update, b.id, "grossReceipts", v)} />
              <Field label="Returns & allowances" value={b.returns} onChange={(v) => setBusiness(scenario, update, b.id, "returns", v)} />
              <Field label="Cost of goods sold" value={b.cogs} onChange={(v) => setBusiness(scenario, update, b.id, "cogs", v)} />
              <div />
            </div>
            <div className="tp-sublabel">Expenses</div>
            <LineList items={b.expenses} onChange={(items) => setBusiness(scenario, update, b.id, "expenses", items)} labelPh="Expense category" />
            <div className="tp-sublabel">For QBI</div>
            <div className="tp-grid2">
              <Field label="W-2 wages paid" value={b.w2wages} onChange={(v) => setBusiness(scenario, update, b.id, "w2wages", v)} />
              <Field label="UBIA of qualified property" value={b.ubia} onChange={(v) => setBusiness(scenario, update, b.id, "ubia", v)} />
            </div>
            <div className={`tp-biz-net ${net < 0 ? "neg" : ""}`}>
              <span>Net profit / (loss)</span><strong>{usd$(net)}</strong>
            </div>
          </div>
        );
      })}
      <button className="tp-add-block" onClick={addBiz}><Plus size={14} /> Add business</button>
      <div className="tp-editor-total"><span>Total Schedule C (subject to SE tax)</span><strong>{usd$(total)}</strong></div>
    </div>
  );
}

function PassthroughEditor({ scenario, update }) {
  const pt = scenario.passthrough;
  const set = (id, key, val) => update("passthrough", { ...pt, entities: pt.entities.map((e) => (e.id === id ? { ...e, [key]: val } : e)) });
  const add = () => update("passthrough", { ...pt, entities: [...pt.entities, { id: uid(), name: "New entity", ordinary: 0, rental: 0, w2: 0, ubia: 0, se: false }] });
  const del = (id) => update("passthrough", { ...pt, entities: pt.entities.filter((e) => e.id !== id) });
  const total = ptTotal(pt);
  return (
    <div className="tp-editor">
      <div className="tp-tbl">
        <div className="tp-tbl-head pt">
          <div>Entity</div><div>Ordinary</div><div>Rental</div><div>W-2 wages</div><div>UBIA</div><div></div>
        </div>
        {pt.entities.map((e) => (
          <div key={e.id} className="tp-tbl-row pt">
            <input className="tp-tbl-name" value={e.name} onChange={(ev) => set(e.id, "name", ev.target.value)} />
            <Money value={e.ordinary} onChange={(v) => set(e.id, "ordinary", v)} />
            <Money value={e.rental} onChange={(v) => set(e.id, "rental", v)} />
            <Money value={e.w2} onChange={(v) => set(e.id, "w2", v)} />
            <Money value={e.ubia} onChange={(v) => set(e.id, "ubia", v)} />
            <button className="tp-linedel" onClick={() => del(e.id)}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <button className="tp-add-block" onClick={add}><Plus size={14} /> Add entity</button>
      <div className="tp-editor-total"><span>Total passthrough income (non-SE)</span><strong>{usd$(total)}</strong></div>
    </div>
  );
}

function Schedule1Editor({ scenario, update, result }) {
  const s1 = scenario.schedule1;
  const set = (key, val) => update("schedule1", { ...s1, [key]: val });
  return (
    <div className="tp-editor">
      <div className="tp-sublabel">Part I — Additional income</div>
      <div className="tp-grid2">
        <Field label="Taxable state / local refunds" value={s1.stateRefund} onChange={(v) => set("stateRefund", v)} />
        <Field label="Unemployment compensation" value={s1.unemployment} onChange={(v) => set("unemployment", v)} />
        <Field label="Gambling / prizes & awards" value={s1.gambling} onChange={(v) => set("gambling", v)} />
        <Field label="Cancellation of debt" value={s1.cancellationDebt} onChange={(v) => set("cancellationDebt", v)} />
        <Field label="Other additional income" value={s1.otherIncome} onChange={(v) => set("otherIncome", v)} />
      </div>
      <div className="tp-subtotal-line"><span>Additional income subtotal</span><strong>{usd$(result.s1Income)}</strong></div>

      <div className="tp-sublabel">Part II — Adjustments to income</div>
      <div className="tp-note-inline">Retirement contributions, HSA, and self-employed health insurance are handled in the <strong>Planning Strategies</strong> module (with 2025 limits applied).</div>
      <div className="tp-grid2">
        <Field label="Student-loan interest" value={s1.studentLoanInterest} onChange={(v) => set("studentLoanInterest", v)} />
        <Field label="Educator expenses" value={s1.educatorExpenses} onChange={(v) => set("educatorExpenses", v)} />
        <Field label="Early-withdrawal penalty" value={s1.earlyWithdrawalPenalty} onChange={(v) => set("earlyWithdrawalPenalty", v)} />
        <Field label="Alimony paid (pre-2019)" value={s1.alimonyPaid} onChange={(v) => set("alimonyPaid", v)} />
        <Field label="Other adjustments" value={s1.otherAdjustments} onChange={(v) => set("otherAdjustments", v)} />
      </div>
      <div className="tp-subtotal-line muted"><span>½ SE tax deduction (auto)</span><strong>{usd$(result.seDeduction)}</strong></div>
      <div className="tp-subtotal-line muted"><span>Planning strategies (from Planning module)</span><strong>{usd$(result.planningTotal)}</strong></div>
      <div className="tp-editor-total"><span>Total adjustments to income</span><strong>{usd$(result.adjustments)}</strong></div>
    </div>
  );
}

function ScheduleAEditor({ scenario, update, result, status }) {
  const a = scenario.scheduleA;
  const set = (key, val) => update("scheduleA", { ...a, [key]: val });
  const A = result.A;
  return (
    <div className="tp-editor">
      <div className="tp-sublabel">Medical & dental <em>deductible above 7.5% of AGI</em></div>
      <LineList items={a.medical} onChange={(items) => set("medical", items)} labelPh="Medical expense" />
      <div className="tp-subtotal-line muted"><span>Deductible after AGI floor</span><strong>{usd$(A.medical)}</strong></div>

      <div className="tp-sublabel">Taxes you paid (SALT)</div>
      <div className="tp-grid2">
        <Field label="State / local income tax" value={a.stateIncomeTax} onChange={(v) => set("stateIncomeTax", v)} />
        <Field label="Real estate tax" value={a.realEstateTax} onChange={(v) => set("realEstateTax", v)} />
        <Field label="Personal property tax" value={a.personalPropertyTax} onChange={(v) => set("personalPropertyTax", v)} />
        <Field label="General sales tax (alt.)" value={a.salesTax} onChange={(v) => set("salesTax", v)} />
      </div>
      <div className="tp-subtotal-line muted"><span>SALT after cap ({usd$(A.saltCap)})</span><strong>{usd$(A.salt)}</strong></div>

      <div className="tp-sublabel">Interest you paid</div>
      <div className="tp-grid2">
        <Field label="Home mortgage interest" value={a.mortgageInterest} onChange={(v) => set("mortgageInterest", v)} />
        <Field label="Points" value={a.points} onChange={(v) => set("points", v)} />
        <Field label="Investment interest (Form 4952)" value={a.investmentInterest} onChange={(v) => set("investmentInterest", v)} />
      </div>

      <div className="tp-sublabel">Charitable contributions <em>cash capped at 60% AGI</em></div>
      <div className="tp-grid2">
        <Field label="Cash contributions" value={a.charityCash} onChange={(v) => set("charityCash", v)} />
        <Field label="Non-cash contributions" value={a.charityNonCash} onChange={(v) => set("charityNonCash", v)} />
        <Field label="Prior-year carryover" value={a.charityCarryover} onChange={(v) => set("charityCarryover", v)} />
      </div>
      <div className="tp-subtotal-line muted"><span>Charitable after AGI limit</span><strong>{usd$(A.charity)}</strong></div>

      <div className="tp-sublabel">Other itemized deductions</div>
      <LineList items={a.other} onChange={(items) => set("other", items)} labelPh="Deduction (e.g., gambling loss)" />

      <div className="tp-editor-total"><span>Total itemized deductions</span><strong>{usd$(A.total)}</strong></div>
      <div className="tp-note-inline">Standard deduction for comparison: {usd$(result.stdDed)} — {A.total >= result.stdDed ? "itemizing is better." : "standard is better."}</div>
    </div>
  );
}

function QBIEditor({ scenario, update, result, status }) {
  const qbi = scenario.qbi;
  const setQ = (patch) => update("qbi", { ...qbi, ...patch });
  const setEnt = (id, key, val) => setQ({ entities: qbi.entities.map((e) => (e.id === id ? { ...e, [key]: val } : e)) });
  const add = () => setQ({ entities: [...qbi.entities, { id: uid(), name: "New entity", income: 0, w2: 0, ubia: 0 }] });
  const del = (id) => setQ({ entities: qbi.entities.filter((e) => e.id !== id) });
  const Q = result.qbi;
  const high = result.taxableIncome > QBI_THRESHOLD[status] || (result.agi - result.deductionUsed) > QBI_THRESHOLD[status];
  return (
    <div className="tp-editor">
      <div className="tp-qbi-controls">
        <label className="tp-check"><input type="checkbox" checked={qbi.aggregate} onChange={(e) => setQ({ aggregate: e.target.checked })} /> Aggregate all entities (§1.199A-4)</label>
        <label className="tp-check"><input type="checkbox" checked={qbi.useManual} onChange={(e) => setQ({ useManual: e.target.checked })} /> Use manual amount from workpaper</label>
      </div>

      {qbi.useManual ? (
        <div className="tp-grid2"><Field label="Manual QBI deduction" value={qbi.manualAmount} onChange={(v) => setQ({ manualAmount: v })} /></div>
      ) : (
        <>
          <div className="tp-note-inline">{high ? "Taxable income is above the §199A threshold — the W-2 wage / UBIA limitation applies." : "Taxable income is below the threshold — full 20% with no wage limit."}</div>
          <div className="tp-tbl">
            <div className="tp-tbl-head qbi"><div>Entity</div><div>QBI income</div><div>W-2 wages</div><div>UBIA</div><div>20% QBI</div><div>Wage/UBIA cap</div><div></div></div>
            {qbi.entities.map((e) => {
              const base = 0.2 * num(e.income);
              const cap = Math.max(0.5 * num(e.w2), 0.25 * num(e.w2) + 0.025 * num(e.ubia));
              return (
                <div key={e.id} className="tp-tbl-row qbi">
                  <input className="tp-tbl-name" value={e.name} onChange={(ev) => setEnt(e.id, "name", ev.target.value)} />
                  <Money value={e.income} onChange={(v) => setEnt(e.id, "income", v)} />
                  <Money value={e.w2} onChange={(v) => setEnt(e.id, "w2", v)} />
                  <Money value={e.ubia} onChange={(v) => setEnt(e.id, "ubia", v)} />
                  <div className="tp-tbl-calc">{usd(base)}</div>
                  <div className="tp-tbl-calc">{usd(cap)}</div>
                  <button className="tp-linedel" onClick={() => del(e.id)}><Trash2 size={13} /></button>
                </div>
              );
            })}
          </div>
          <button className="tp-add-block" onClick={add}><Plus size={14} /> Add entity</button>
        </>
      )}

      <div className="tp-qbi-summary">
        <div><span>Tentative QBI component</span><strong>{usd$(Q.component)}</strong></div>
        <div><span>20% taxable-income cap</span><strong>{usd$(Q.cap)}</strong></div>
        <div className="hl"><span>QBI deduction allowed</span><strong>{usd$(Q.deduction)}</strong></div>
      </div>
    </div>
  );
}

function SETaxViewer({ scenario, result, status }) {
  const schedC = result.schedC;
  const line = (label, val, hint, bold) => (
    <div className={`tp-se-line ${bold ? "bold" : ""}`}><span>{label}{hint && <em>{hint}</em>}</span><strong>{usd$(val)}</strong></div>
  );
  return (
    <div className="tp-editor">
      <div className="tp-note-inline">SE tax applies to Schedule C net income only. S-Corp K-1 and rental/passthrough income are not subject to SE tax.</div>
      {line("Schedule C net income", schedC, "from Schedule C editor")}
      {line("Net earnings from SE", result.netSE, "× 92.35%", true)}
      <div className="tp-se-divider" />
      {line("Social Security portion (12.4%)", result.seSS, `capped at $${SS_WAGE_BASE.toLocaleString()} wage base`)}
      {line("Medicare portion (2.9%)", result.seMedicare, "no cap")}
      {line("Self-employment tax", result.seTax, null, true)}
      <div className="tp-se-divider" />
      {line("½ SE tax deduction", result.seDeduction, "above-the-line (Schedule 1)")}
      {line("Additional Medicare (0.9%)", result.addlMedicare, `on wages + SE over $${ADDL_MED_THRESHOLD[status].toLocaleString()}`)}
      {result.sCorpFICA > 0 && <>
        <div className="tp-se-divider" />
        {line("S-Corp payroll FICA", result.sCorpFICA, "employer + employee on reasonable comp")}
      </>}
    </div>
  );
}

/* ---- Planning strategies editor ---- */
function Seg({ value, onChange, options }) {
  return (
    <div className="tp-seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}
function PlanningEditor({ scenario, update, result, status }) {
  const p = scenario.planning;
  const setP = (patch) => update("planning", { ...p, ...patch });
  const P = result.planning;

  // tax saved vs. no planning strategies
  const noPlan = computeScenario(
    { ...scenario, planning: { ...p, planType: "none", hsaMode: "off", seHealth: 0, employeeDeferral: 0 } },
    status
  );
  const saved = noPlan.totalTax - result.totalTax;
  const age = num(p.age);

  return (
    <div className="tp-editor">
      <div className="tp-note-inline">
        Above-the-line strategies for self-employed / small-business owners. Employer retirement share is computed from
        net SE earnings ({usd$(result.netSEEarnings)}) and S-corp comp; 2025 statutory limits are enforced. Employer
        contributions also reduce QBI, so income-tax savings run below the headline deduction.
      </div>

      <div className="tp-grid2">
        <label className="tp-mfield"><span>Age (drives catch-up)</span>
          <Money value={p.age} onChange={(v) => setP({ age: v })} /></label>
        <div />
      </div>

      {/* Retirement */}
      <div className="tp-sublabel">Retirement plan <em>Solo 401(k) / SEP-IRA</em></div>
      <Seg value={p.planType} onChange={(v) => setP({ planType: v })}
        options={[{ v: "none", l: "None" }, { v: "solo401k", l: "Solo 401(k)" }, { v: "sep", l: "SEP-IRA" }]} />
      {p.planType !== "none" && (
        <>
          <div className="tp-planrow">
            <span>Employer profit-sharing</span>
            <Seg value={p.employerMode} onChange={(v) => setP({ employerMode: v })}
              options={[{ v: "auto", l: "Auto" }, { v: "manual", l: "Manual" }]} />
          </div>
          {p.employerMode === "auto" ? (
            <div className="tp-subtotal-line muted"><span>20% net SE earnings + 25% S-corp comp</span><strong>{usd$(P.employer)}</strong></div>
          ) : (
            <div className="tp-grid2"><Field label="Employer contribution" value={p.employerManual} onChange={(v) => setP({ employerManual: v })} /><div /></div>
          )}
          {p.planType === "solo401k" && (
            <div className="tp-grid2">
              <Field label="Employee deferral" hint={`≤ $${P.empDeferralCap.toLocaleString()}`} value={p.employeeDeferral} onChange={(v) => setP({ employeeDeferral: v })} />
              <div />
            </div>
          )}
          {p.planType === "solo401k" && num(p.employeeDeferral) > 0 && (
            <div className="tp-note-inline sm">The employee deferral is a single per-person limit shared across all 401(k)/403(b) plans — if this deferral is already used at a W-2 job, set this to $0 and rely on the employer profit-share only.</div>
          )}
          <div className="tp-subtotal-line"><span>Retirement contribution{P.retirement >= P.additionsCap ? " (at additions cap)" : ""}</span><strong>{usd$(P.retirement)}</strong></div>
        </>
      )}

      {/* HSA */}
      <div className="tp-sublabel">Health Savings Account <em>triple tax-advantaged</em></div>
      <div className="tp-planrow">
        <Seg value={p.hsaMode} onChange={(v) => setP({ hsaMode: v })}
          options={[{ v: "off", l: "Off" }, { v: "max", l: "Max" }, { v: "manual", l: "Manual" }]} />
        <Seg value={p.hsaCoverage} onChange={(v) => setP({ hsaCoverage: v })}
          options={[{ v: "self", l: "Self" }, { v: "family", l: "Family" }]} />
      </div>
      {p.hsaMode === "manual" && (
        <div className="tp-grid2"><Field label="HSA contribution" hint={`≤ $${P.hsaLimit.toLocaleString()}`} value={p.hsaManual} onChange={(v) => setP({ hsaManual: v })} /><div /></div>
      )}
      <div className="tp-subtotal-line muted"><span>2025 limit {p.hsaCoverage === "family" ? "family" : "self-only"}{age >= 55 ? " + $1,000 catch-up" : ""}</span><strong>{usd$(P.hsaLimit)}</strong></div>

      {/* SE health insurance */}
      <div className="tp-sublabel">Self-employed health insurance</div>
      <div className="tp-grid2">
        <Field label="SEHI premiums (above-the-line)" value={p.seHealth} onChange={(v) => setP({ seHealth: v })} />
        <div />
      </div>

      {/* Summary */}
      <div className="tp-plan-summary">
        <div><span>Retirement</span><strong>{usd$(P.retirement)}</strong></div>
        <div><span>HSA</span><strong>{usd$(P.hsa)}</strong></div>
        <div><span>SE health insurance</span><strong>{usd$(P.seHealth)}</strong></div>
        <div className="sub"><span>Total planning deduction</span><strong>{usd$(P.total)}</strong></div>
        <div className="hl"><span>Est. tax reduction vs. no strategies</span><strong>{usd$(Math.max(0, saved))}</strong></div>
      </div>
    </div>
  );
}


function MultiYearPanel({ projection, years, startYear, growth, setGrowth, inflation, setInflation }) {
  if (!projection.length) return null;
  const yrList = projection[0].years.map((y) => y.year);

  // chart data: one row per year, one key per scenario (total tax)
  const chartData = yrList.map((yr, i) => {
    const row = { year: yr };
    projection.forEach((p, si) => { row[`s${si}`] = Math.round(p.years[i].r.totalTax); });
    return row;
  });

  const cumulative = projection.map((p) => p.years.reduce((a, y) => a + y.r.totalTax, 0));
  const bestCumIdx = cumulative.indexOf(Math.min(...cumulative));

  return (
    <section className="tp-panel">
      <div className="tp-panel-head">
        <h2><CalendarRange size={16} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          Multi-year projection · {startYear}–{startYear + years - 1}</h2>
        <div className="tp-proj-controls">
          <label>Income growth
            <span className="tp-stepper">
              <input type="number" value={growth} step="0.5"
                onChange={(e) => setGrowth(Number(e.target.value))} />%/yr
            </span>
          </label>
          <label>Bracket indexing
            <span className="tp-stepper">
              <input type="number" value={inflation} step="0.1"
                onChange={(e) => setInflation(Number(e.target.value))} />%/yr
            </span>
          </label>
        </div>
      </div>

      {years === 1 ? (
        <p className="tp-proj-hint">Set <strong>Tax years</strong> above 1 (top bar) to project total tax forward — income grows at your assumed rate while brackets, the standard deduction, SALT cap, QBI threshold, and SS wage base index for inflation.</p>
      ) : (
        <>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 20, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="#E3E6EB" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#4A5568" }} tickLine={false} axisLine={{ stroke: "#E3E6EB" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#4A5568" }} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={(v, n, p) => [usd$(v), projection[Number(String(p.dataKey).slice(1))]?.s.name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E3E6EB", fontFamily: "Inter" }} />
                <Legend formatter={(val) => projection[Number(String(val).slice(1))]?.s.name}
                  wrapperStyle={{ fontSize: 11 }} />
                {projection.map((p, si) => (
                  <Line key={p.s.id} type="monotone" dataKey={`s${si}`}
                    stroke={LINE_COLORS[si % LINE_COLORS.length]} strokeWidth={2}
                    dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="tp-proj-tblwrap">
            <table className="tp-proj-tbl">
              <thead>
                <tr>
                  <th>Tax year</th>
                  {projection.map((p, si) => (
                    <th key={p.s.id}><span className="tp-dot" style={{ background: LINE_COLORS[si % LINE_COLORS.length] }} />{p.s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yrList.map((yr, i) => (
                  <tr key={yr}>
                    <td>{yr}</td>
                    {projection.map((p) => <td key={p.s.id}>{usd$(p.years[i].r.totalTax)}</td>)}
                  </tr>
                ))}
                <tr className="tp-proj-cum">
                  <td>Cumulative {years}-yr tax</td>
                  {cumulative.map((c, si) => (
                    <td key={si}>{usd$(c)}{si === bestCumIdx && projection.length > 1 && <span className="tp-proj-best">lowest</span>}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {projection.length > 1 && (
            <p className="tp-proj-hint">
              Over {years} years, <strong>{projection[bestCumIdx].s.name}</strong> is projected to be the lowest-tax path at {usd$(cumulative[bestCumIdx])} cumulative
              {bestCumIdx !== 0 && <> — about {usd$(cumulative[0] - cumulative[bestCumIdx])} less than {projection[0].s.name}</>}.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/* ============================================================================
   TAX PLANNING GUIDE — considerations by category
   Grounded in the client's OBBBA impact analysis, reg-reference workbook,
   and audit-risk matrix. Risk chips: low / med / high.
   ========================================================================== */
const OBBBA_HIGHLIGHTS = [
  { t: "QBI (§199A) made permanent", d: "20% pass-through deduction no longer sunsets; phase-in range widened to $75k single / $150k MFJ above the threshold.", when: "2026" },
  { t: "SALT cap raised to $40,000", d: "Up from $10,000 ($20,000 MFS); phases down 30% above $500k MAGI to a $10k floor, and reverts to $10,000 in 2030.", when: "2025" },
  { t: "100% bonus depreciation restored", d: "Permanent 100% first-year expensing for qualified property placed in service after Jan 19, 2025.", when: "2025" },
  { t: "Estate & gift exemption → $15M", d: "Permanently set at ~$15M per person, removing the scheduled 2026 sunset (‘use it or lose it’ pressure eases).", when: "2026" },
  { t: "Charitable changes for itemizers", d: "New 0.5%-of-AGI floor and a 35% benefit cap at the top bracket begin 2026; new $1,000/$2,000 above-the-line deduction for non-itemizers.", when: "2026" },
  { t: "Car-loan interest & tips/overtime", d: "Temporary deductions (2025–2028): up to $10k interest on U.S.-assembled new-car loans (AGI phase-out), plus limited tip and overtime deductions.", when: "2025–28" },
];

const GUIDE = [
  {
    cat: "Entity structure & employment tax",
    items: [
      { n: "S-Corp election vs. sole proprietor", risk: "high",
        b: "Split profit into reasonable W-2 comp (FICA) + distributions (no SE tax). Commonly saves $5k+/yr once profit clears ~$60k, but wages reduce QBI — model both.",
        meta: "Forms 2553 / 1120-S · IRC §1362 · ~73% of S-corp audits target salary reasonableness" },
      { n: "Reasonable compensation study", risk: "high",
        b: "Document salary with role, hours, and market comp surveys. Service businesses often justify ~45–55% of profit as wages. Too-low salary is the top S-corp audit flag.",
        meta: "Rev. Proc. / IRS reasonable-comp guidance · retain board minutes" },
      { n: "Accountable plan + Augusta Rule", risk: "med",
        b: "Reimburse home office, mileage, phone/internet tax-free through the entity. Rent your home to the S-corp ≤14 days/yr — deductible to the entity, tax-free to you.",
        meta: "IRC §280A(g) · Pub 463 · written plan + comparables required" },
      { n: "PTET / SALT-cap workaround", risk: "low",
        b: "Entity pays state tax and deducts it federally, bypassing the SALT cap. Less compelling now the cap is $40k unless K-1 state tax pushes total SALT over the cap.",
        meta: "IRS Notice 2020-75 · GA PTE / NJ BAIT elections" },
    ],
  },
  {
    cat: "Retirement & deferral",
    items: [
      { n: "Solo 401(k) / SEP-IRA", risk: "low",
        b: "Shelter business income: employer profit-share ≈20% of net SE earnings (sole prop) or 25% of wages (S-corp). 2025 additions limit $70,000. Keeps income under QBI thresholds.",
        meta: "IRC §401(k) · Pub 560 · employer deferral by filing deadline w/ extensions" },
      { n: "HSA — triple tax advantage", risk: "low",
        b: "Deductible in, tax-free growth, tax-free out for medical. 2025: $4,300 self-only / $8,550 family (+$1,000 age 55+). Payroll funding also dodges FICA.",
        meta: "IRC §223 · Form 8889 · must have HDHP, no disqualifying coverage" },
      { n: "Roth conversions in low-bracket years", risk: "low",
        b: "Fill the 12% bracket with conversions in low-income years; pay tax from outside funds. Preserves 0% LTCG headroom and locks in low rates before RMDs.",
        meta: "IRC §408A · Form 8606 · watch bracket ceiling & IRMAA" },
      { n: "Backdoor / mega-backdoor Roth", risk: "med",
        b: "Route around Roth income limits via non-deductible IRA → conversion, or after-tax 401(k) → Roth. Pro-rata rule aggregates existing pre-tax IRA balances.",
        meta: "IRC §408A · Form 8606 · pro-rata trap" },
    ],
  },
  {
    cat: "Investment & capital gains",
    items: [
      { n: "0% LTCG bracket harvesting", risk: "low",
        b: "In low-income years, realize long-term gains taxed at 0% federal (up to ~$48,350 single / $96,700 MFJ taxable income in 2025) and repurchase to step up basis tax-free.",
        meta: "IRC §1(h) · no wash-sale rule on gains · exclude collectibles & §1250" },
      { n: "Tax-loss harvesting", risk: "med",
        b: "Offset gains dollar-for-dollar plus $3,000 of ordinary income; carry the rest forward. Replace with a not-substantially-identical fund to keep exposure.",
        meta: "IRC §1211/1212 · wash-sale 61-day window across all accounts (incl. IRAs)" },
      { n: "Asset location & muni/Treasury shift", risk: "low",
        b: "Hold taxable bonds in tax-deferred accounts; use in-state munis (federal + state exempt) or Treasuries (state exempt) in taxable accounts to cut interest tax.",
        meta: "IRC §103 · watch AMT private-activity bonds" },
      { n: "NIIT management", risk: "med",
        b: "The 3.8% surtax hits investment income once MAGI tops $200k single / $250k MFJ. Manage MAGI (deferral, harvesting, entity structure) to reduce or avoid it.",
        meta: "IRC §1411 · Form 8960 · thresholds are NOT inflation-indexed" },
      { n: "QSBS & Opportunity Zones", risk: "med",
        b: "OBBBA raised the §1202 QSBS exclusion to $15M with tiered holding periods; QOZ program is now permanent with a 30% basis step-up for rural funds.",
        meta: "IRC §1202 / §1400Z-2 · Form 8949 / 8997" },
    ],
  },
  {
    cat: "QBI / §199A",
    items: [
      { n: "Qualified Business Income deduction", risk: "high",
        b: "20% of qualifying pass-through income, capped at 20% of taxable income net of capital gains. 2025 thresholds $197,300 single / $394,600 MFJ; above them, W-2 wage / UBIA limits and SSTB phase-outs apply.",
        meta: "IRC §199A · Forms 8995 / 8995-A · audit-sensitive on W-2 wage claims" },
      { n: "Negative-QBI carryforward", risk: "med",
        b: "A net negative QBI year still requires Form 8995 to memorialize the loss carryforward, which offsets future positive QBI before any deduction resumes.",
        meta: "IRC §199A(c)(2) · file even when QBI is negative" },
      { n: "Bonus-depreciation ↔ QBI interaction", risk: "med",
        b: "Aggressive bonus depreciation in low-bracket years can create QBI you can't monetize. Electing out of bonus or using §179/MACRS can preserve future QBI.",
        meta: "coordinate depreciation elections with §199A" },
    ],
  },
  {
    cat: "Depreciation & business assets",
    items: [
      { n: "100% bonus depreciation", risk: "high",
        b: "Full first-year expensing (permanent post-OBBBA) for property placed in service after Jan 19, 2025. Can create a loss — unlike §179. Watch state non-conformity.",
        meta: "IRC §168(k) · Form 4562 · GA/NJ require bonus add-back" },
      { n: "Section 179 expensing", risk: "med",
        b: "Immediate expensing up to ~$2.5M (2025), can't create a loss. Heavy SUV/truck >6,000 lb GVWR has a ~$31,300 §179 cap, then bonus covers the rest.",
        meta: "IRC §179 · >50% business use · recapture if use drops ≤50%" },
      { n: "Vehicle: mileage vs. actual + GVWR", risk: "med",
        b: "For heavy vehicles used >50% for business, actual-expense + bonus usually beats the standard mileage rate in year one. Keep a contemporaneous mileage log.",
        meta: "IRC §280F · Pub 463 · large first-year vehicle deductions are an audit trigger" },
      { n: "Cost segregation", risk: "high",
        b: "Reclassify building components into 5/7/15-yr lives to accelerate depreciation (and bonus). Best for higher-basis real estate; watch recapture on sale.",
        meta: "Form 3115 · Rev. Proc. 2011-14 · study report retained permanently" },
    ],
  },
  {
    cat: "Charitable & deduction timing",
    items: [
      { n: "Bunching + Donor-Advised Fund", risk: "med",
        b: "Concentrate multiple years of giving into one itemizing year via a DAF; take the standard deduction in off years. Beats spreading gifts once the 0.5% floor arrives in 2026.",
        meta: "IRC §170 · Form 8283 (>$500 non-cash) · appraisal >$5k non-cash" },
      { n: "Gift appreciated securities / crypto", risk: "med",
        b: "Donate long-term appreciated assets to deduct FMV (30% AGI limit) and skip the capital-gains tax. Crypto over $5,000 needs a qualified appraisal.",
        meta: "IRC §170(e) · Pub 561 · check the digital-asset box for crypto gifts" },
      { n: "QCD from IRAs (age 70½+)", risk: "low",
        b: "Direct IRA-to-charity transfers (up to ~$108k in 2025) satisfy RMDs and stay out of AGI — better than a deduction because it lowers AGI-based thresholds and IRMAA.",
        meta: "IRC §408(d)(8) · Pub 590-B" },
      { n: "SALT cap planning ($40k, 2025–2029)", risk: "low",
        b: "Higher cap covers most itemizers through 2029; phases down above $500k MAGI and reverts to $10k in 2030. Time property-tax payments and consider PTET if over the cap.",
        meta: "IRC §164(b)(6) as amended by OBBBA" },
    ],
  },
  {
    cat: "Estate & wealth transfer",
    items: [
      { n: "Assign IRAs to charity, step-up to heirs", risk: "low",
        b: "Name a charity/DAF as beneficiary of pre-tax retirement accounts (IRD, taxable to heirs) and leave step-up-eligible taxable assets to individuals — big income-tax lever.",
        meta: "IRC §691 · update beneficiary designations · Pub 590-B" },
      { n: "Annual exclusion gifting", risk: "low",
        b: "Give up to $19,000 per donee (2025) outside the lifetime exemption. Stacks across donees and years to move appreciation out of the estate.",
        meta: "IRC §2503(b) · Form 709 if over the exclusion" },
      { n: "GRAT / SLAT / ILIT / FLP", risk: "high",
        b: "Advanced freezes and discounting for larger estates. Powerful but valuation-sensitive and among the highest-scrutiny areas — engage counsel and appraisers.",
        meta: "IRC §2702 / §2036 / §2704 · high audit + complexity" },
    ],
  },
  {
    cat: "Multi-state & compliance",
    items: [
      { n: "Real-estate professional status", risk: "med",
        b: "750+ hours and material participation make rental losses non-passive. A §1.469-9(g) grouping election treats all rentals as one activity — document hours annually.",
        meta: "IRC §469 · Reg. §1.469-9(g) · keep contemporaneous time logs" },
      { n: "State depreciation differences ledger", risk: "med",
        b: "GA and NJ disallow federal bonus and require add-backs, so state basis diverges from federal. Maintain a per-asset differences schedule to recover it correctly.",
        meta: "track GA/NJ add-backs & future subtractions per asset" },
      { n: "PTET / composite & estimated taxes", risk: "low",
        b: "Use PTE elections or composite filing to simplify nonresident compliance and convert SALT into an entity deduction. Right-size federal/state estimates to prior-year safe harbors.",
        meta: "GA PTE / NJ BAIT · avoid underpayment penalties" },
      { n: "Substantiation for travel & meals", risk: "med",
        b: "High-audit areas. Keep who/what/when/where/why records: itineraries and business purpose for travel; attendees and purpose for meals.",
        meta: "IRC §274 · Pub 463 · retain 3+ years" },
    ],
  },
];

const RISK_META = {
  low: { label: "Low audit risk", Icon: ShieldCheck, cls: "low" },
  med: { label: "Moderate risk", Icon: Shield, cls: "med" },
  high: { label: "Higher scrutiny", Icon: ShieldAlert, cls: "high" },
};

function TaxPlanningGuide() {
  const [openCats, setOpenCats] = useState(() => ({ [GUIDE[0].cat]: true }));
  const [showLaw, setShowLaw] = useState(true);
  const toggleCat = (c) => setOpenCats((o) => ({ ...o, [c]: !o[c] }));
  return (
    <section className="tp-guide">
      <div className="tp-guide-head">
        <div className="tp-guide-title"><BookOpen size={17} /> Tax Planning Guide &amp; Considerations</div>
        <div className="tp-guide-sub">Screening checklist of strategies — expand a category for the key figures, forms, and audit-risk flags. Directional planning input, not a filed return or formal opinion.</div>
      </div>

      <div className="tp-law">
        <button className="tp-law-toggle" onClick={() => setShowLaw((v) => !v)}>
          {showLaw ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <TrendingUp size={14} /> What changed under OBBBA (2025–2026)
        </button>
        {showLaw && (
          <div className="tp-law-grid">
            {OBBBA_HIGHLIGHTS.map((h) => (
              <div key={h.t} className="tp-law-card">
                <div className="tp-law-when">{h.when}</div>
                <div className="tp-law-t">{h.t}</div>
                <div className="tp-law-d">{h.d}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tp-guide-cats">
        {GUIDE.map((g) => {
          const isOpen = openCats[g.cat];
          return (
            <div key={g.cat} className={`tp-cat ${isOpen ? "open" : ""}`}>
              <button className="tp-cat-head" onClick={() => toggleCat(g.cat)}>
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                <span>{g.cat}</span>
                <em>{g.items.length}</em>
              </button>
              {isOpen && (
                <div className="tp-cat-body">
                  {g.items.map((it) => {
                    const rm = RISK_META[it.risk];
                    const RIcon = rm.Icon;
                    return (
                      <div key={it.n} className="tp-consid">
                        <div className="tp-consid-top">
                          <span className="tp-consid-name">{it.n}</span>
                          <span className={`tp-risk ${rm.cls}`}><RIcon size={11} /> {rm.label}</span>
                        </div>
                        <div className="tp-consid-b">{it.b}</div>
                        <div className="tp-consid-meta">{it.meta}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tp-disclaimer">
        <strong>Advisory disclaimer.</strong> This tool provides directional, illustrative modeling to support planning discussions. It is not a filed return, a formal tax opinion, or legal advice, and it does not verify source-document accuracy. Statutory figures reflect 2025 law as amended by the One Big Beautiful Bill Act; multi-year figures assume simple constant growth and inflation indexing and will differ from final IRS-indexed amounts. Confirm entity facts, basis, state treatment, and documentation with the client's CPA and, where relevant, legal counsel before acting. Several strategies here (S-corp comp, cost segregation, §199A wage claims, estate freezes, travel/meals) sit in higher-scrutiny areas — retain the documentation noted for each.
      </div>
    </section>
  );
}

/* ============================================================================
   SUMMARY & ANALYSIS PAGE
   ========================================================================== */
/* Compare-aware table row: shows A, optional B, and delta */
function CmpRow({ label, note, a, b, cmp, strong, isPct, indent }) {
  const d = cmp ? (b || 0) - (a || 0) : 0;
  return (
    <tr className={strong ? "tot" : ""}>
      <td className={indent ? "ind" : ""}>{label}{note && <em className="tp-rownote">{note}</em>}</td>
      <td className={strong ? "strong" : ""}>{isPct ? pct(a) : usd$(a)}</td>
      {cmp && <td className={strong ? "strong" : ""}>{isPct ? pct(b) : usd$(b)}</td>}
      {cmp && <td className={d < 0 ? "save" : d > 0 ? "cost" : ""}>
        {d === 0 ? "—" : (d > 0 ? "+" : "−") + (isPct ? pct(Math.abs(d)) : usd$(Math.abs(d)))}
      </td>}
    </tr>
  );
}

function SummaryPage({ results, bestId, baseline, status, projection, years, startYear, onGoScenarios }) {
  const [focusId, setFocusId] = useState(null);
  const [cmp, setCmp] = useState(false);
  const [cmpId, setCmpId] = useState(null);

  const focus = results.find((x) => x.s.id === focusId) || results.find((x) => x.s.id === bestId) || results[0];
  const other = results.find((x) => x.s.id === cmpId) || results.find((x) => x.s.id !== focus.s.id) || null;
  const compare = cmp && other && other.s.id !== focus.s.id;
  const B = compare ? other.r : null;

  const analysis = useMemo(() => analyzeScenario(focus.s, status), [focus.s, status]);
  const { findings, breakdown } = analysis;
  const A = focus.r;

  const inc = incomeAnalysis(A), incB = compare ? incomeAnalysis(B) : null;
  const ded = deductionAnalysis(A), dedB = compare ? deductionAnalysis(B) : null;
  const br = bracketFill(A.ordinaryTaxable, status, A.infl);

  const opportunities = findings.filter((f) => !f.applied);
  const quantified = opportunities.filter((f) => f.savings > 0);
  const flagged = opportunities.filter((f) => !f.savings);
  const totalOpportunity = quantified.reduce((a, f) => a + f.savings, 0);
  const captured = baseline ? baseline.r.totalTax - A.totalTax : 0;

  const cumul = projection.map((p) => p.years.reduce((a, y) => a + y.r.totalTax, 0));
  const cumulBest = Math.min(...cumul), cumulBase = cumul[0];

  // paired lookup so compare columns line up even when a line exists in only one scenario
  const pair = (listA, listB) => {
    const labels = [...new Set([...listA.map((x) => x.label), ...(listB || []).map((x) => x.label)])];
    return labels.map((l) => ({
      label: l,
      note: (listA.find((x) => x.label === l) || (listB || []).find((x) => x.label === l))?.note,
      a: listA.find((x) => x.label === l)?.amount || 0,
      b: (listB || []).find((x) => x.label === l)?.amount || 0,
    }));
  };

  return (
    <div className="tp-summary">
      {/* Scenario selector */}
      <div className="tp-selector">
        <label className="tp-sel">
          <span>Analyze scenario</span>
          <select value={focus.s.id} onChange={(e) => setFocusId(e.target.value)}>
            {results.map(({ s }) => <option key={s.id} value={s.id}>{s.name}{s.id === bestId ? "  ★ lowest tax" : ""}</option>)}
          </select>
        </label>
        <label className={`tp-toggle ${compare ? "on" : ""}`}>
          <input type="checkbox" checked={cmp} onChange={(e) => setCmp(e.target.checked)} disabled={results.length < 2} />
          Compare against
        </label>
        <label className="tp-sel" style={{ opacity: cmp ? 1 : .4, pointerEvents: cmp ? "auto" : "none" }}>
          <span>Comparison scenario</span>
          <select value={other?.s.id || ""} onChange={(e) => setCmpId(e.target.value)}>
            {results.filter(({ s }) => s.id !== focus.s.id).map(({ s }) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <button className="tp-btn ghost sm" onClick={onGoScenarios}>Edit scenarios <ArrowRight size={13} /></button>
      </div>

      {/* Key figures */}
      <div className="tp-kpis">
        <div className="tp-kpi"><span>Total income</span><strong>{usd$(A.grossIncome)}</strong><em>{focus.s.name}</em></div>
        <div className="tp-kpi"><span>Total tax</span><strong>{usd$(A.totalTax)}</strong>
          <em>{pct(A.effectiveRate)} effective · {pct(A.marginal)} marginal</em></div>
        <div className="tp-kpi"><span>Taxable income</span><strong>{usd$(A.taxableIncome)}</strong>
          <em>{A.deductionKind} deduction {usd$(A.deductionUsed)}</em></div>
        <div className={`tp-kpi ${totalOpportunity > 0 ? "warn" : "good"}`}>
          <span>Additional opportunity</span><strong>{usd$(totalOpportunity)}</strong>
          <em>{quantified.length} quantified · {flagged.length} to review</em></div>
      </div>

      {compare && (
        <div className="tp-cmpbanner">
          <strong>{focus.s.name}</strong> vs. <strong>{other.s.name}</strong> —
          {B.totalTax < A.totalTax
            ? <> the comparison scenario is <span className="save">{usd$(A.totalTax - B.totalTax)} lower</span> in total tax.</>
            : B.totalTax > A.totalTax
              ? <> the comparison scenario is <span className="cost">{usd$(B.totalTax - A.totalTax)} higher</span> in total tax.</>
              : <> total tax is identical.</>}
        </div>
      )}

      {/* Income analysis */}
      <section className="tp-card">
        <div className="tp-card-head"><h3>Income analysis</h3><span className="tp-card-sub">Composition by source and tax character</span></div>
        <div className="tp-tblwrap">
          <table className="tp-sumtbl">
            <thead><tr><th>Source</th><th>{compare ? focus.s.name : "Amount"}</th>{compare && <th>{other.s.name}</th>}{compare && <th>Δ</th>}{!compare && <th>% of total</th>}{!compare && <th className="wide">Treatment</th>}</tr></thead>
            <tbody>
              {pair(inc.bySource, incB?.bySource).map((x) => (
                compare
                  ? <CmpRow key={x.label} label={x.label} a={x.a} b={x.b} cmp />
                  : <tr key={x.label}>
                      <td>{x.label}</td><td className="strong">{usd$(x.a)}</td>
                      <td><span className="tp-bar"><i style={{ width: `${Math.min(100, Math.abs(x.a) / Math.max(1, A.grossIncome) * 100)}%` }} /></span>{pct(x.a / Math.max(1, A.grossIncome))}</td>
                      <td className="wide note">{inc.bySource.find((s) => s.label === x.label)?.note}</td>
                    </tr>
              ))}
              <CmpRow label="Total income" a={A.grossIncome} b={B?.grossIncome} cmp={compare} strong />
            </tbody>
          </table>
        </div>
        <div className="tp-splitgrid">
          <div>
            <div className="tp-minihead">By tax character</div>
            {inc.byCharacter.map((c) => (
              <div key={c.label} className="tp-miniline"><span>{c.label}</span><strong>{usd$(c.amount)}</strong></div>
            ))}
            <div className="tp-miniline"><span>Investment income (NIIT base)</span><strong>{usd$(inc.investment)}</strong></div>
          </div>
          <div>
            <div className="tp-minihead">Observations</div>
            <ul className="tp-obs">
              {inc.pref > 0
                ? <li>{usd$(inc.pref)} of income qualifies for preferential 0/15/20% rates rather than ordinary rates.</li>
                : <li>No long-term gains or qualified dividends — all income is taxed at ordinary rates. Asset location and gain timing could shift some into preferential treatment.</li>}
              {A.incomeParts.schedC > 0 && <li>{usd$(A.incomeParts.schedC)} of Schedule C income carries self-employment tax on top of income tax.</li>}
              {A.niit > 0 && <li>Investment income of {usd$(inc.investment)} is exposed to the 3.8% NIIT because MAGI exceeds {usd$(NIIT_THRESHOLD[status])}.</li>}
              {A.incomeParts.interest > 0 && <li>{usd$(A.incomeParts.interest)} of taxable interest is fully ordinary-rate income — municipal or Treasury alternatives would change that.</li>}
            </ul>
          </div>
        </div>
      </section>

      {/* Deduction analysis */}
      <section className="tp-card">
        <div className="tp-card-head"><h3>Deduction analysis</h3><span className="tp-card-sub">Above-the-line, itemized, and QBI</span></div>
        <div className="tp-tblwrap">
          <table className="tp-sumtbl">
            <thead><tr><th>Deduction</th><th>{compare ? focus.s.name : "Amount"}</th>{compare && <th>{other.s.name}</th>}{compare && <th>Δ</th>}{!compare && <th className="wide">Note</th>}</tr></thead>
            <tbody>
              <tr className="sec"><td colSpan={compare ? 4 : 3}>Above-the-line (Schedule 1 &amp; Planning)</td></tr>
              {pair(ded.aboveLine, dedB?.aboveLine).map((x) => (
                compare ? <CmpRow key={x.label} label={x.label} a={x.a} b={x.b} cmp indent />
                  : <tr key={x.label}><td className="ind">{x.label}</td><td className="strong">{usd$(x.a)}</td><td className="wide note" /></tr>
              ))}
              <CmpRow label="Total adjustments to income" a={A.adjustments} b={B?.adjustments} cmp={compare} strong />
              <CmpRow label="Adjusted gross income" a={A.agi} b={B?.agi} cmp={compare} strong />

              <tr className="sec"><td colSpan={compare ? 4 : 3}>Schedule A — itemized</td></tr>
              {pair(ded.itemized, dedB?.itemized).map((x) => (
                compare ? <CmpRow key={x.label} label={x.label} a={x.a} b={x.b} cmp indent />
                  : <tr key={x.label}><td className="ind">{x.label}</td><td className="strong">{usd$(x.a)}</td><td className="wide note">{x.note || ""}</td></tr>
              ))}
              <CmpRow label="Total itemized deductions" a={A.itemized} b={B?.itemized} cmp={compare} />
              <CmpRow label="Standard deduction (comparison)" a={A.stdDed} b={B?.stdDed} cmp={compare} />
              <CmpRow label={`Deduction applied — ${A.deductionKind}`} a={A.deductionUsed} b={B?.deductionUsed} cmp={compare} strong />
              <CmpRow label="QBI deduction (§199A)" a={A.qbi.deduction} b={B?.qbi.deduction} cmp={compare} strong />
              <CmpRow label="Taxable income" a={A.taxableIncome} b={B?.taxableIncome} cmp={compare} strong />
            </tbody>
          </table>
        </div>
        <p className="tp-card-note">
          {A.deductionKind === "Itemized"
            ? <>Itemizing exceeds the standard deduction by <strong>{usd$(A.itemized - A.stdDed)}</strong>.</>
            : <>The standard deduction exceeds itemized deductions by <strong>{usd$(A.stdDed - A.itemized)}</strong>.</>}
          {" "}SALT is claimed at {usd$(A.A.salt)} against a {usd$(A.A.saltCap)} cap
          {A.A.saltCap - A.A.salt > 1000 && <> — <strong>{usd$(A.A.saltCap - A.A.salt)} of capacity is unused</strong></>}.
          {A.qbi.component > A.qbi.deduction + 1 && <> The QBI deduction is limited by the 20%-of-taxable-income cap, forfeiting {usd$(A.qbi.component - A.qbi.deduction)}.</>}
        </p>
      </section>

      {/* Tax rate analysis */}
      <section className="tp-card">
        <div className="tp-card-head"><h3>Tax rate analysis</h3><span className="tp-card-sub">How ordinary income fills each bracket</span></div>
        <div className="tp-tblwrap">
          <table className="tp-sumtbl">
            <thead><tr><th>Marginal rate</th><th className="wide">Bracket range</th><th>Income in bracket</th><th>Tax</th><th>% of bracket tax</th></tr></thead>
            <tbody>
              {br.rows.map((row) => {
                const isMarginal = row.rate === br.marginalRate && row.income > 0;
                return (
                  <tr key={row.rate} className={row.income === 0 ? "muted" : isMarginal ? "best" : ""}>
                    <td>{pct(row.rate)}{isMarginal && " ← current"}</td>
                    <td className="wide note">{usd$(row.floor)} – {row.ceil === Infinity ? "above" : usd$(row.ceil)}</td>
                    <td className="strong">{usd$(row.income)}</td>
                    <td>{usd$(row.tax)}</td>
                    <td>{pct(row.tax / Math.max(1, br.rows.reduce((a, r2) => a + r2.tax, 0)))}</td>
                  </tr>
                );
              })}
              <tr className="tot">
                <td>Total ordinary</td><td className="wide" />
                <td className="strong">{usd$(A.ordinaryTaxable)}</td>
                <td className="strong">{usd$(br.rows.reduce((a, r2) => a + r2.tax, 0))}</td>
                <td />
              </tr>
              {A.prefIncome > 0 && (
                <tr>
                  <td>0/15/20%</td><td className="wide note">Preferential — LT gains &amp; qualified dividends</td>
                  <td className="strong">{usd$(A.prefIncome)}</td>
                  <td>{usd$(A.fedIncomeTax - br.rows.reduce((a, r2) => a + r2.tax, 0))}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="tp-card-note">
          The marginal bracket is <strong>{pct(A.marginal)}</strong> while the effective rate across all taxes is <strong>{pct(A.effectiveRate)}</strong>.
          {br.headroom !== Infinity && <> There is <strong>{usd$(br.headroom)}</strong> of room left in the {pct(br.marginalRate)} bracket before income spills into the next one — that headroom is the working space for Roth conversions, gain harvesting, or accelerating income.</>}
        </p>
      </section>

      {/* Tax type analysis */}
      <section className="tp-card">
        <div className="tp-card-head"><h3>Analysis by type of tax</h3><span className="tp-card-sub">{compare ? "Both scenarios" : focus.s.name}</span></div>
        <div className="tp-tblwrap">
          <table className="tp-sumtbl">
            <thead><tr><th>Tax type</th><th>{compare ? focus.s.name : "Amount"}</th>{compare && <th>{other.s.name}</th>}{compare && <th>Δ</th>}{!compare && <th>% of total</th>}{!compare && <th className="wide">What drives it</th>}</tr></thead>
            <tbody>
              {breakdown.map((b) => (
                compare
                  ? <CmpRow key={b.key} label={b.label} a={b.amount} b={B[b.key] || 0} cmp />
                  : <tr key={b.key} className={b.amount === 0 ? "muted" : ""}>
                      <td>{b.label}</td><td className="strong">{usd$(b.amount)}</td>
                      <td><span className="tp-bar"><i style={{ width: `${Math.min(100, b.share * 100)}%` }} /></span>{pct(b.share)}</td>
                      <td className="wide note">{b.note}</td>
                    </tr>
              ))}
              <CmpRow label="Total tax liability" a={A.totalTax} b={B?.totalTax} cmp={compare} strong />
              <CmpRow label="Effective rate" a={A.effectiveRate} b={B?.effectiveRate} cmp={compare} isPct />
            </tbody>
          </table>
        </div>
        <p className="tp-card-note">
          {(() => {
            const top = [...breakdown].sort((x, y) => y.amount - x.amount)[0];
            const employment = A.seTax + A.sCorpFICA + A.addlMedicare;
            return <>The largest component is <strong>{top.label}</strong> at {usd$(top.amount)} ({pct(top.share)} of the total).
              Employment taxes total {usd$(employment)} — these respond to entity structure and reasonable-compensation decisions rather than to deductions.
              {A.niit > 0 && <> NIIT of {usd$(A.niit)} applies because MAGI exceeds the {usd$(NIIT_THRESHOLD[status])} threshold, which is fixed by statute and never indexes.</>}</>;
          })()}
        </p>
      </section>

      {/* Scenario comparison table */}
      <section className="tp-card">
        <div className="tp-card-head"><h3>All scenarios</h3><span className="tp-card-sub">{results.length} modeled</span></div>
        <div className="tp-tblwrap">
          <table className="tp-sumtbl">
            <thead><tr><th>Scenario</th><th>AGI</th><th>Taxable income</th><th>Total tax</th><th>Effective</th><th>After-tax income</th><th>vs. base</th></tr></thead>
            <tbody>
              {results.map(({ s, r }, i) => {
                const d = baseline ? r.totalTax - baseline.r.totalTax : 0;
                return (
                  <tr key={s.id} className={s.id === focus.s.id ? "best" : ""}>
                    <td>{s.id === bestId && <Award size={12} />}{s.name}</td>
                    <td>{usd$(r.agi)}</td><td>{usd$(r.taxableIncome)}</td>
                    <td className="strong">{usd$(r.totalTax)}</td>
                    <td>{pct(r.effectiveRate)}</td><td>{usd$(r.afterTax)}</td>
                    <td className={d < 0 ? "save" : d > 0 ? "cost" : ""}>{i === 0 ? "—" : (d < 0 ? "−" : "+") + usd$(Math.abs(d))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {years > 1 && (
          <p className="tp-card-note">
            Over {years} years ({startYear}–{startYear + years - 1}), the lowest path totals {usd$(cumulBest)} of cumulative tax
            {cumulBase > cumulBest && <> — about <strong>{usd$(cumulBase - cumulBest)}</strong> less than the base path</>}.
          </p>
        )}
      </section>

      {/* Opportunities */}
      <section className="tp-card">
        <div className="tp-card-head">
          <h3>Did we miss anything?</h3>
          <span className="tp-card-sub">{opportunities.length} item{opportunities.length === 1 ? "" : "s"} flagged on {focus.s.name}</span>
        </div>
        {opportunities.length === 0 ? (
          <div className="tp-clean"><CheckCircle2 size={18} /> No further material opportunities detected on this scenario with the inputs provided.</div>
        ) : (
          <div className="tp-findings">
            {opportunities.map((f, i) => (
              <div key={f.id} className={`tp-finding ${f.savings > 0 ? "quant" : "flag"}`}>
                <div className="tp-finding-rank">{f.savings > 0 ? i + 1 : <AlertTriangle size={14} />}</div>
                <div className="tp-finding-body">
                  <div className="tp-finding-top">
                    <span className="tp-finding-title">{f.title}</span>
                    <span className="tp-finding-tags">
                      <span className="tp-tag2">{f.cat}</span>
                      <span className={`tp-risk ${RISK_META[f.risk].cls}`}>{RISK_META[f.risk].label}</span>
                      {f.savings > 0 ? <span className="tp-save">{usd$(f.savings)}/yr</span> : <span className="tp-save neutral">review</span>}
                    </span>
                  </div>
                  <div className="tp-finding-why">{f.why}</div>
                  <div className="tp-finding-act"><Lightbulb size={12} /> {f.action}</div>
                  <div className="tp-finding-ref">{f.ref}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section className="tp-card">
        <div className="tp-card-head"><h3>Recommendations</h3></div>
        <ol className="tp-recs">
          <li>
            <strong>{focus.s.id === bestId ? `${focus.s.name} is the lowest-tax path modeled` : `Compare ${focus.s.name} against the lowest-tax scenario`}.</strong>{" "}
            It produces {usd$(A.totalTax)} of total tax at a {pct(A.effectiveRate)} effective rate
            {captured > 0 && <>, capturing {usd$(captured)} versus {baseline.s.name}</>}.
          </li>
          {quantified.slice(0, 3).map((f) => (
            <li key={f.id}><strong>{f.title}.</strong> Modeled at roughly <strong>{usd$(f.savings)}</strong> of annual tax reduction. {f.action}</li>
          ))}
          {flagged.length > 0 && (
            <li><strong>Review {flagged.length} unquantified item{flagged.length === 1 ? "" : "s"}</strong> — {[...new Set(flagged.map((f) => f.cat))].join(", ")}.
              These depend on facts the model doesn't hold (eligibility, basis, documentation) and need confirmation before they can be sized.</li>
          )}
          {br.headroom !== Infinity && br.headroom > 10000 && (
            <li><strong>Roughly {usd$(br.headroom)} of headroom remains in the {pct(br.marginalRate)} bracket.</strong> If income is expected to rise, filling that space now — Roth conversion or gain realization — converts future higher-rate income into current lower-rate income.</li>
          )}
          {totalOpportunity > 0 && (
            <li><strong>Combined opportunity is about {usd$(totalOpportunity)} per year</strong> before interaction effects.
              Strategies overlap — each deduction lowers taxable income and therefore the 20%-of-taxable-income QBI cap — so stacking all of them delivers less than the sum. Model them together in one scenario before committing.</li>
          )}
          <li><strong>Confirm documentation before acting.</strong> Higher-scrutiny items (reasonable compensation, bonus depreciation, cost segregation, family wages) are sustained or lost on contemporaneous records — comp studies, GVWR and mileage logs, timesheets, and written plans.</li>
        </ol>
        <div className="tp-disclaimer">
          <strong>Basis of analysis.</strong> Figures reflect 2025 federal law as amended by the One Big Beautiful Bill Act and are directional planning estimates, not a filed return or formal opinion. Opportunity amounts are computed by re-running the full engine with a single change applied, holding all other inputs constant; they exclude state tax, implementation cost, and non-tax considerations. State treatment (including bonus-depreciation add-backs and PTET) is not modeled. Confirm entity facts, basis, eligibility, and documentation with the client's CPA before implementation.
        </div>
      </section>
    </div>
  );
}


/* ============================================================================
   TAX LIBRARY — small-business regulatory reference
   Authorities compiled from the client's reg-reference workbook, OBBBA
   analysis, and audit-risk matrix. Educational reference, not tax advice.
   ========================================================================== */
const LIB_CATS = ["Entity & structure", "Retirement & benefits", "Deductions & depreciation", "Income & accounting", "State & multistate", "Compliance & estimates"];

const TAX_LIBRARY = [
  { title: "S-Corporation election & reasonable compensation", cat: "Entity & structure", risk: "high",
    sum: "Electing S status lets an owner split earnings into W-2 wages (subject to FICA) and distributions (no SE tax). Salary must be reasonable for services rendered — the top S-corp audit issue.",
    authority: "IRC §1361, §1362, §1366; Reg. §1.1362-1", guidance: "Rev. Proc. 2013-30 (late-election relief); IRS S-corp compensation guidance", forms: "Form 2553, Form 1120-S, W-2/941", retention: "Permanent (entity records)" },
  { title: "Entity choice & check-the-box", cat: "Entity & structure", risk: "low",
    sum: "An LLC defaults to sole-prop or partnership treatment but may elect corporate/S treatment. Compare SE-tax exposure, QBI, SALT-workaround access, and administrative cost before choosing.",
    authority: "IRC §7701; Reg. §301.7701-3", guidance: "IRS Pub 3402 (LLC taxation)", forms: "Form 8832, Form 2553", retention: "Permanent" },
  { title: "Qualified Business Income deduction (§199A)", cat: "Entity & structure", risk: "high",
    sum: "Up to 20% of qualified pass-through income, capped at 20% of taxable income net of capital gain. Above the threshold, W-2 wage / UBIA limits and SSTB phase-outs apply. Made permanent by OBBBA with a wider phase-in range.",
    authority: "IRC §199A; Reg. §1.199A-1 to -6", guidance: "IRS Notice 2019-07 (rental safe harbor); OBBBA (permanence, $75k/$150k phase-in)", forms: "Form 8995 / 8995-A", retention: "3 yrs (6 if substantial understatement)" },
  { title: "QSBS — §1202 exclusion (C-corp)", cat: "Entity & structure", risk: "med",
    sum: "Gain on qualified small-business C-corp stock can be excluded. OBBBA raised the cap to $15M with a tiered exclusion (50/75/100%) by holding period and a higher gross-asset ceiling.",
    authority: "IRC §1202, §1045", guidance: "OBBBA (2025 expansion)", forms: "Form 8949 / Schedule D", retention: "Permanent (basis & QSBS docs)" },

  { title: "Solo 401(k) & SEP-IRA", cat: "Retirement & benefits", risk: "low",
    sum: "Self-employed plans shelter large amounts: employer profit-share ≈20% of net SE earnings (sole prop) or 25% of W-2 comp (S-corp); Solo 401(k) adds an employee deferral. 2025 additions limit $70,000.",
    authority: "IRC §401(k), §408(k), §415(c)", guidance: "IRS Pub 560; annual COLA notices", forms: "Form 5500-EZ (assets > $250k)", retention: "Permanent (plan records)" },
  { title: "Health Savings Account", cat: "Retirement & benefits", risk: "low",
    sum: "Triple tax-advantaged with an HSA-eligible HDHP. 2025 limits $4,300 self / $8,550 family (+$1,000 age 55+). Payroll funding also avoids FICA.",
    authority: "IRC §223", guidance: "IRS Pub 969; Rev. Proc. 2024-25 (2025 limits)", forms: "Form 8889", retention: "Keep medical receipts (invest-and-reimburse)" },
  { title: "Self-employed health insurance", cat: "Retirement & benefits", risk: "med",
    sum: "Above-the-line deduction for premiums. A >2% S-corp shareholder must run premiums through W-2 Box 1 (not FICA wages), then deduct on the return.",
    authority: "IRC §162(l)", guidance: "IRS Notice 2008-1 (2% shareholder rules)", forms: "Form 7206", retention: "3 yrs" },
  { title: "Accountable plan reimbursements", cat: "Retirement & benefits", risk: "med",
    sum: "A written plan lets the business reimburse owner-employees tax-free for substantiated home-office, mileage, and phone/internet costs — deductible to the entity, not taxable to the owner.",
    authority: "Reg. §1.62-2", guidance: "IRS Pub 463", forms: "Internal expense reports", retention: "3 yrs (substantiation)" },

  { title: "Section 179 & 100% bonus depreciation", cat: "Deductions & depreciation", risk: "high",
    sum: "Immediate expensing of equipment/vehicles. §179 can't create a loss (≈$2.5M 2025 limit); 100% bonus (restored permanently by OBBBA for property placed in service after Jan 19, 2025) can. Heavy SUVs (>6,000 lb GVWR) have a ~$31,300 §179 cap, then bonus.",
    authority: "IRC §179, §168(k); Reg. §1.168(k)-2", guidance: "OBBBA (100% bonus permanent); annual Rev. Proc. limits", forms: "Form 4562", retention: "Permanent (basis records)" },
  { title: "Cost segregation", cat: "Deductions & depreciation", risk: "high",
    sum: "Reclassifies building components into 5/7/15-year lives to accelerate depreciation (and bonus). Highest scrutiny when >40% is allocated to short-life property; watch recapture on sale.",
    authority: "IRC §168, §1245", guidance: "Rev. Proc. 2011-14 (method change)", forms: "Form 3115, Form 4562", retention: "Permanent (study + basis)" },
  { title: "Business vehicle — mileage vs. actual & GVWR", cat: "Deductions & depreciation", risk: "med",
    sum: "Choose the standard mileage rate or actual expenses. Heavy vehicles used >50% for business can take first-year expensing; a contemporaneous mileage log is essential and large first-year deductions are an audit trigger.",
    authority: "IRC §274(d), §280F", guidance: "IRS Pub 463; annual standard-mileage Rev. Proc.", forms: "Form 4562", retention: "3 yrs (mileage logs)" },
  { title: "Home office deduction", cat: "Deductions & depreciation", risk: "med",
    sum: "Exclusive and regular business use of a home area. Actual-expense method or the simplified $5/sq ft (up to 300 sq ft). Depreciation on the office portion may face recapture on sale.",
    authority: "IRC §280A(c)", guidance: "Rev. Proc. 2013-13 (simplified method)", forms: "Form 8829", retention: "3 yrs" },
  { title: "Augusta Rule — 14-day home rental", cat: "Deductions & depreciation", risk: "med",
    sum: "A business may rent the owner's home ≤14 days/yr for bona-fide meetings: deductible to the entity, tax-free to the owner. Needs a written agreement, fair-market comparables, and meeting records.",
    authority: "IRC §280A(g)", guidance: "IRS Pub 527", forms: "Rental agreement / minutes", retention: "3 yrs" },
  { title: "Startup & organizational costs", cat: "Deductions & depreciation", risk: "med",
    sum: "Up to $5,000 of startup and $5,000 of organizational costs deductible in year one (phasing out over $50k), remainder amortized over 180 months. Pre-opening costs must be capitalized, not expensed.",
    authority: "IRC §195, §248, §709", guidance: "Reg. §1.195-1", forms: "Form 4562 (amortization)", retention: "Permanent (until amortized)" },

  { title: "Hobby-loss / profit motive", cat: "Income & accounting", risk: "med",
    sum: "Activities lacking a profit motive can't deduct losses against other income. Document a business plan, separate books, and profit-seeking changes; a large loss with no revenue draws scrutiny.",
    authority: "IRC §183; Reg. §1.183-2", guidance: "IRS ATG (hobby losses)", forms: "Schedule C", retention: "3 yrs (profit-motive evidence)" },
  { title: "Inventory & §263A small-business exception", cat: "Income & accounting", risk: "med",
    sum: "Businesses under the gross-receipts threshold (≈$31M, 2025) may use simplified accounting and are exempt from UNICAP. Choose methods that don't accelerate large pre-revenue deductions.",
    authority: "IRC §471, §263A, §448(c)", guidance: "Rev. Proc. 2018-40; annual §448(c) COLA", forms: "Form 3115 (method change)", retention: "Permanent (method records)" },
  { title: "Accounting-method changes", cat: "Income & accounting", risk: "med",
    sum: "Switching cash/accrual, inventory, or depreciation methods generally requires IRS consent via an automatic or non-automatic change, with a §481(a) adjustment.",
    authority: "IRC §446, §481", guidance: "Rev. Proc. 2015-13; Rev. Proc. 2024-23 (automatic list)", forms: "Form 3115", retention: "Permanent" },
  { title: "Excess business loss limitation", cat: "Income & accounting", risk: "med",
    sum: "Non-corporate business losses above an annual threshold ($313k single / $626k MFJ, 2025) are disallowed and carried forward as an NOL. Coordinate with depreciation timing.",
    authority: "IRC §461(l)", guidance: "annual COLA notices", forms: "Form 461", retention: "Until carryforward absorbed" },

  { title: "PTET / SALT-cap workaround", cat: "State & multistate", risk: "low",
    sum: "A pass-through entity can pay state tax at the entity level and deduct it federally, bypassing the individual SALT cap. Less critical now the cap is $40k unless K-1 state tax pushes total SALT over the cap.",
    authority: "IRC §164; state PTE statutes", guidance: "IRS Notice 2020-75; GA PTE / NJ BAIT elections", forms: "state PTE returns; K-1 credit", retention: "Permanent (entity records)" },
  { title: "Real-estate professional status", cat: "State & multistate", risk: "med",
    sum: "750+ hours and material participation make rental losses non-passive. A grouping election treats all rentals as one activity — keep contemporaneous time logs; consistency across states matters.",
    authority: "IRC §469(c)(7); Reg. §1.469-9", guidance: "IRS ATG (passive activity losses)", forms: "Schedule E; grouping statement", retention: "3 yrs (time logs)" },
  { title: "State depreciation non-conformity", cat: "State & multistate", risk: "med",
    sum: "Many states (e.g., GA, NJ) disallow federal bonus depreciation and require add-backs, so state basis diverges from federal. Maintain a per-asset differences ledger to recover it correctly.",
    authority: "state conformity statutes", guidance: "state DOR bonus-depreciation guidance", forms: "state depreciation schedules", retention: "Permanent (state basis)" },

  { title: "Estimated taxes & safe harbor", cat: "Compliance & estimates", risk: "low",
    sum: "Self-employed owners pay quarterly. Avoid penalties by paying 90% of the current-year tax or 100%/110% of prior-year (by AGI). Right-size after entity or income changes.",
    authority: "IRC §6654", guidance: "IRS Pub 505", forms: "Form 1040-ES", retention: "3 yrs" },
  { title: "Self-employment tax", cat: "Compliance & estimates", risk: "low",
    sum: "15.3% on 92.35% of net SE earnings up to the Social Security wage base ($176,100 in 2025), then 2.9% Medicare with no cap; half is an above-the-line deduction. Additional 0.9% Medicare above threshold.",
    authority: "IRC §1401, §1402", guidance: "IRS Pub 334; Schedule SE instructions", forms: "Schedule SE, Form 8959", retention: "3 yrs" },
  { title: "Worker classification (employee vs. contractor)", cat: "Compliance & estimates", risk: "high",
    sum: "Misclassifying workers creates payroll-tax exposure. Apply the common-law control test; §530 relief may apply with a reasonable basis and consistent 1099 filing.",
    authority: "IRC §3121, §3509; §530 (Rev. Act 1978)", guidance: "Rev. Rul. 87-41; Form SS-8 determinations", forms: "Form SS-8, W-2/1099-NEC", retention: "4 yrs (employment tax)" },
];

const LIB_META = { low: "low", med: "med", high: "high" };

function TaxLibrary() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const q = query.trim().toLowerCase();
  const filtered = TAX_LIBRARY.filter((e) => {
    if (cat !== "All" && e.cat !== cat) return false;
    if (!q) return true;
    return (e.title + " " + e.sum + " " + e.authority + " " + e.guidance + " " + e.forms).toLowerCase().includes(q);
  });
  return (
    <section className="tp-lib">
      <div className="tp-guide-head">
        <div className="tp-guide-title"><Library size={17} /> Tax Library — Small-Business Regulatory Reference</div>
        <div className="tp-guide-sub">Primary authorities, IRS guidance, forms, audit-risk, and record-retention for common small-business positions. Educational reference compiled from the engagement's source materials — not tax advice.</div>
      </div>

      <div className="tp-lib-controls">
        <input className="tp-lib-search" placeholder="Search authorities, forms, topics…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="tp-lib-chips">
          {["All", ...LIB_CATS].map((c) => (
            <button key={c} className={`tp-chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="tp-lib-count">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</div>
      <div className="tp-lib-list">
        {filtered.map((e) => {
          const rm = RISK_META[LIB_META[e.risk]];
          const RIcon = rm.Icon;
          return (
            <div key={e.title} className="tp-lib-card">
              <div className="tp-lib-top">
                <span className="tp-lib-title">{e.title}</span>
                <span className={`tp-risk ${rm.cls}`}><RIcon size={11} /> {rm.label}</span>
              </div>
              <div className="tp-lib-cat">{e.cat}</div>
              <div className="tp-lib-sum">{e.sum}</div>
              <div className="tp-lib-meta">
                <div><span>Authority</span>{e.authority}</div>
                <div><span>Guidance</span>{e.guidance}</div>
                <div><span>Forms</span>{e.forms}</div>
                <div><span>Retention</span>{e.retention}</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="tp-lib-empty">No entries match “{query}”.</div>}
      </div>
    </section>
  );
}

/* ============================================================================
   STYLES
   ========================================================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
.tp-root{--ink:#16202E;--ink-2:#2C3A4C;--paper:#F6F7F9;--line:#E3E6EB;--green:#0E7C66;--green-bg:#E7F1EE;--claret:#A3283B;--blue:#1D4ED8;--gold:#C9A24B;--muted:#7C8794;
  font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--paper);min-height:100vh;font-feature-settings:"tnum" 1;}
.tp-root *{box-sizing:border-box;}
/* Shell: sidebar + main */
.tp-shell{display:grid;grid-template-columns:250px 1fr;min-height:100vh;align-items:start;}
.tp-side{position:sticky;top:0;height:100vh;background:var(--ink);color:#fff;display:flex;flex-direction:column;gap:18px;padding:20px 16px;overflow-y:auto;}
.tp-brand{display:flex;align-items:center;gap:12px;}
.tp-mark{width:38px;height:38px;border:1.5px solid rgba(255,255,255,.35);border-radius:9px;display:grid;place-items:center;font-family:'Fraunces',serif;font-size:22px;color:var(--gold);flex-shrink:0;}
.tp-brand h1{font-family:'Fraunces',serif;font-weight:500;font-size:19px;margin:0;letter-spacing:.2px;}
.tp-brand p{margin:1px 0 0;font-size:11px;color:#A9B4C0;}
.tp-nav{display:flex;flex-direction:column;gap:3px;}
.tp-navitem{display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:8px;border:none;background:transparent;color:#C6D0DB;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;text-align:left;}
.tp-navitem:hover{background:#1E2A3A;color:#fff;}
.tp-navitem.on{background:var(--green);color:#fff;font-weight:600;}
.tp-side-controls{display:flex;flex-direction:column;gap:10px;padding-top:16px;border-top:1px solid #2B3A4D;margin-top:auto;}
.tp-side-two{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.tp-field{display:flex;flex-direction:column;gap:4px;}
.tp-field span{font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:#8D99A6;}
.tp-field select{width:100%;background:#1E2A3A;color:#fff;border:1px solid #33445A;border-radius:7px;padding:7px 9px;font-size:12.5px;font-family:inherit;}
.tp-btn{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:500;border-radius:7px;padding:8px 12px;cursor:pointer;font-family:inherit;border:none;}
.tp-btn.ghost{background:transparent;color:#C6D0DB;border:1px solid #33445A;}
.tp-btn.ghost:hover{background:#1E2A3A;color:#fff;}
.tp-btn.ghost.full{justify-content:center;}
.tp-btn.ghost.sm{padding:6px 10px;font-size:12px;color:var(--ink-2);border-color:var(--line);}
.tp-btn.ghost.sm:hover{background:var(--paper);color:var(--ink);}
.tp-btn.solid{background:var(--ink);color:#fff;padding:9px 18px;}
.tp-btn.solid:hover{background:var(--ink-2);}
.tp-side-foot{display:flex;flex-direction:column;gap:9px;padding-top:14px;border-top:1px solid #2B3A4D;}
.tp-side-stat{display:flex;flex-direction:column;gap:2px;}
.tp-side-stat span{font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;color:#8D99A6;font-weight:600;}
.tp-side-stat strong{font-size:13px;font-weight:600;color:#fff;}
.tp-side-stat strong.green{color:#5FD4B6;font-family:'Fraunces',serif;font-size:17px;font-weight:500;}
.tp-main{padding:26px 30px;max-width:1180px;min-width:0;}
.tp-topbar{margin-bottom:20px;}
.tp-topbar h2{font-family:'Fraunces',serif;font-weight:600;font-size:24px;margin:0;color:var(--ink);}
.tp-topbar p{margin:5px 0 0;font-size:12.5px;color:var(--muted);max-width:720px;line-height:1.5;}
/* Summary page */
.tp-summary{display:flex;flex-direction:column;gap:18px;}
.tp-selector{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;}
.tp-sel{display:flex;flex-direction:column;gap:4px;}
.tp-sel span{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);font-weight:600;}
.tp-sel select{border:1px solid var(--line);border-radius:8px;padding:8px 11px;font-size:13px;font-family:inherit;background:#fff;color:var(--ink);min-width:200px;}
.tp-sel select:focus{outline:none;border-color:var(--blue);}
.tp-toggle{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:var(--ink-2);cursor:pointer;padding-bottom:9px;}
.tp-toggle input{width:15px;height:15px;accent-color:var(--green);}
.tp-toggle.on{color:var(--green);font-weight:600;}
.tp-cmpbanner{background:var(--ink);color:#fff;border-radius:10px;padding:12px 16px;font-size:13px;line-height:1.5;}
.tp-cmpbanner strong{color:var(--gold);}
.tp-cmpbanner .save{color:#5FD4B6;font-weight:700;}
.tp-cmpbanner .cost{color:#F09AA6;font-weight:700;}
.tp-sumtbl tr.sec td{background:var(--paper);font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;font-weight:700;color:var(--ink-2);text-align:left;}
.tp-sumtbl td.ind{padding-left:26px;}
.tp-rownote{display:block;font-style:normal;font-size:10.5px;color:var(--muted);margin-top:2px;}
.tp-splitgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line);}
.tp-minihead{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:var(--muted);margin-bottom:8px;}
.tp-miniline{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;color:var(--ink-2);padding:5px 0;border-bottom:1px solid var(--line);}
.tp-miniline strong{font-variant-numeric:tabular-nums;color:var(--ink);}
.tp-obs{margin:0;padding-left:17px;display:flex;flex-direction:column;gap:7px;}
.tp-obs li{font-size:12px;line-height:1.5;color:var(--ink-2);}
@media (max-width:760px){.tp-splitgrid{grid-template-columns:1fr;}}
.tp-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;}
.tp-kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:15px 16px;display:flex;flex-direction:column;gap:4px;}
.tp-kpi>span{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);font-weight:600;}
.tp-kpi strong{font-family:'Fraunces',serif;font-size:25px;font-weight:500;line-height:1.1;color:var(--ink);}
.tp-kpi strong.sm{font-size:17px;}
.tp-kpi em{font-style:normal;font-size:11px;color:var(--muted);}
.tp-kpi.good{border-color:var(--green);}
.tp-kpi.good strong{color:var(--green);}
.tp-kpi.warn{border-color:var(--gold);}
.tp-kpi.warn strong{color:#9A7616;}
.tp-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;}
.tp-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
.tp-card-head h3{font-family:'Fraunces',serif;font-weight:600;font-size:17px;margin:0;color:var(--ink);}
.tp-card-sub{font-size:11.5px;color:var(--muted);}
.tp-card-note{font-size:12px;color:var(--ink-2);line-height:1.6;margin:12px 0 0;padding-top:12px;border-top:1px solid var(--line);}
.tp-tblwrap{overflow-x:auto;}
.tp-sumtbl{width:100%;border-collapse:collapse;font-size:12.5px;}
.tp-sumtbl th,.tp-sumtbl td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums;white-space:nowrap;}
.tp-sumtbl th:first-child,.tp-sumtbl td:first-child{text-align:left;}
.tp-sumtbl th{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:600;}
.tp-sumtbl td.strong{font-weight:700;color:var(--ink);}
.tp-sumtbl tr.best{background:var(--green-bg);}
.tp-sumtbl tr.best td:first-child{font-weight:700;color:var(--green);}
.tp-sumtbl tr.best td:first-child svg{vertical-align:-2px;margin-right:4px;}
.tp-sumtbl tr.muted td{color:var(--muted);}
.tp-sumtbl tr.tot td{border-top:2px solid var(--ink);border-bottom:none;font-weight:700;background:#FAFBFC;}
.tp-sumtbl td.save{color:var(--green);font-weight:600;}
.tp-sumtbl td.cost{color:var(--claret);font-weight:600;}
.tp-sumtbl th.wide,.tp-sumtbl td.wide{text-align:left;white-space:normal;min-width:250px;}
.tp-sumtbl td.note{font-size:11px;color:var(--muted);line-height:1.45;}
.tp-bar{display:inline-block;width:52px;height:5px;border-radius:3px;background:#EDF0F3;margin-right:8px;vertical-align:middle;overflow:hidden;}
.tp-bar i{display:block;height:100%;background:var(--ink-2);}
/* Findings */
.tp-clean{display:flex;align-items:center;gap:10px;padding:16px;background:var(--green-bg);border-radius:10px;color:var(--green);font-size:13px;font-weight:500;}
.tp-findings{display:flex;flex-direction:column;gap:10px;}
.tp-finding{display:flex;gap:12px;border:1px solid var(--line);border-radius:11px;padding:13px 15px;background:#FBFCFD;}
.tp-finding.quant{border-left:3px solid var(--green);}
.tp-finding.flag{border-left:3px solid var(--gold);}
.tp-finding-rank{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;font-weight:700;flex-shrink:0;background:var(--ink);color:#fff;}
.tp-finding.flag .tp-finding-rank{background:#FBF3DD;color:#8A6D1A;}
.tp-finding-body{flex:1;min-width:0;}
.tp-finding-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.tp-finding-title{font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.35;}
.tp-finding-tags{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.tp-tag2{font-size:9.5px;text-transform:uppercase;letter-spacing:.4px;font-weight:600;color:var(--muted);background:#EDF0F3;padding:3px 7px;border-radius:4px;}
.tp-save{font-size:11.5px;font-weight:700;color:#fff;background:var(--green);padding:3px 9px;border-radius:20px;white-space:nowrap;}
.tp-save.neutral{background:#EDF0F3;color:var(--muted);}
.tp-finding-why{font-size:12px;color:var(--ink-2);line-height:1.55;margin-top:7px;}
.tp-finding-act{display:flex;align-items:flex-start;gap:6px;font-size:12px;color:var(--green);line-height:1.5;margin-top:7px;font-weight:500;}
.tp-finding-act svg{flex-shrink:0;margin-top:2px;}
.tp-finding-ref{font-size:10.5px;color:var(--muted);font-style:italic;margin-top:6px;}
.tp-recs{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:10px;}
.tp-recs li{font-size:12.5px;line-height:1.6;color:var(--ink-2);}
.tp-recs strong{color:var(--ink);}
@media (max-width:900px){.tp-shell{grid-template-columns:1fr;}.tp-side{position:static;height:auto;}.tp-main{padding:18px;}.tp-side-controls{margin-top:0;}}
.tp-verdict{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:22px;}
.tp-vcard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 16px 14px;position:relative;overflow:hidden;}
.tp-vcard.best{border-color:var(--green);box-shadow:0 0 0 1px var(--green);}
.tp-badge{position:absolute;top:0;right:0;background:var(--green);color:#fff;font-size:9.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;padding:3px 9px;border-radius:0 11px 0 9px;display:flex;align-items:center;gap:3px;}
.tp-vname{font-size:12px;color:var(--muted);font-weight:500;margin-bottom:6px;max-width:85%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tp-vtotal{font-family:'Fraunces',serif;font-size:27px;font-weight:500;line-height:1;}
.tp-vsub{font-size:11px;color:var(--muted);margin-top:5px;}
.tp-vdelta{font-size:12px;font-weight:500;margin-top:9px;display:flex;align-items:center;gap:4px;}
.tp-vdelta.save{color:var(--green);}.tp-vdelta.cost{color:var(--claret);}
.tp-vdelta.base,.tp-vdelta:not(.save):not(.cost){color:var(--muted);}
.tp-ledger-wrap{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:22px;}
.tp-ledger{display:grid;overflow-x:auto;}
.tp-cell{padding:8px 12px;font-size:13px;border-bottom:1px solid var(--line);display:flex;align-items:center;min-width:0;}
.tp-corner{background:var(--ink);color:#fff;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.6px;position:sticky;left:0;z-index:5;}
.tp-schead{background:var(--ink);color:#fff;justify-content:space-between;gap:6px;}
.tp-schead.best{background:#0E4C40;}
.tp-name-input{background:transparent;border:none;color:#fff;font-size:12.5px;font-weight:600;font-family:inherit;width:100%;min-width:0;padding:2px 0;border-bottom:1px dashed transparent;}
.tp-name-input:hover,.tp-name-input:focus{border-bottom-color:rgba(255,255,255,.4);outline:none;}
.tp-schead-actions{display:flex;gap:2px;flex-shrink:0;}
.tp-schead-actions button{background:transparent;border:none;color:#8D99A6;cursor:pointer;padding:3px;border-radius:4px;display:grid;place-items:center;}
.tp-schead-actions button:hover{background:rgba(255,255,255,.12);color:#fff;}
.tp-schead-actions button:disabled{opacity:.3;cursor:not-allowed;}
.tp-group{background:var(--paper);font-family:'Fraunces',serif;font-weight:600;font-size:14px;color:var(--ink);cursor:pointer;user-select:none;gap:6px;position:sticky;left:0;}
.tp-group.tax{color:#fff;background:var(--ink-2);cursor:default;}
.tp-label{color:var(--ink-2);position:sticky;left:0;background:#fff;z-index:2;}
.tp-label.muted{color:var(--muted);font-size:12px;}
.tp-label.indent{padding-left:26px;color:var(--muted);font-style:italic;}
.tp-label.calc{font-weight:600;}
.tp-label.drill{flex-direction:column;align-items:flex-start;justify-content:center;gap:0;}
.tp-label.drill span{font-weight:500;color:var(--ink);}
.tp-label.drill em{font-size:10.5px;font-style:normal;color:var(--muted);}
.tp-input{padding:0;}
.tp-input input{width:100%;height:100%;border:none;background:transparent;padding:8px 12px;font-size:13px;font-family:inherit;color:var(--blue);font-weight:500;text-align:right;min-width:0;}
.tp-input input:focus{outline:none;background:#EEF4FF;}
.tp-input input::placeholder{color:#C3CAD3;font-weight:400;}
.tp-calc{justify-content:flex-end;font-variant-numeric:tabular-nums;gap:6px;}
.tp-calc.muted{color:var(--muted);font-size:12px;}
button.tp-calc.drill{background:#FBFCFD;border:none;border-bottom:1px solid var(--line);cursor:pointer;font-family:inherit;font-size:13px;color:var(--ink);font-weight:500;position:relative;transition:background .12s;}
button.tp-calc.drill:hover{background:var(--green-bg);color:var(--green);}
.tp-drill-ico{opacity:.35;flex-shrink:0;}
button.tp-calc.drill:hover .tp-drill-ico{opacity:.9;}
.tp-calc select.tp-mini-select{width:100%;font-size:11.5px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;font-family:inherit;color:var(--ink-2);background:#fff;}
.subtotal .tp-calc,.tp-calc.subtotal{font-weight:600;background:#FAFBFC;}
.tp-label.subtotal{font-weight:600;background:#FAFBFC;}
button.tp-calc.drill.subtotal{background:#FAFBFC;font-weight:600;}
.total .tp-calc,.tp-calc.total{font-weight:700;background:#F0F3F6;}
.tp-label.total{font-weight:700;background:#F0F3F6;}
.tp-calc.grand{font-weight:700;font-size:15px;background:var(--ink);color:#fff;font-family:'Fraunces',serif;}
.tp-label.grand{font-weight:700;background:var(--ink);color:#fff;font-family:'Fraunces',serif;}
.tp-calc.aftertax{font-weight:700;color:var(--green);background:var(--green-bg);}
.tp-label.aftertax{font-weight:700;color:var(--green);background:var(--green-bg);}
.tp-calc.rate{color:var(--ink-2);font-weight:600;}.tp-label.rate{color:var(--ink-2);}
.tp-tag{font-size:9px;text-transform:uppercase;letter-spacing:.4px;font-weight:600;color:var(--muted);background:#EDF0F3;padding:2px 5px;border-radius:4px;}
.tp-panel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px 16px;margin-bottom:22px;}
.tp-panel-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px;}
.tp-panel-head h2{font-family:'Fraunces',serif;font-weight:500;font-size:17px;margin:0;}
.tp-legend{display:flex;align-items:center;gap:12px;font-size:11.5px;color:var(--muted);}
.tp-legend i{font-style:normal;display:inline-flex;align-items:center;gap:4px;}
.tp-legend .sw{width:11px;height:11px;border-radius:3px;display:inline-block;}
.tp-notes{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;}
.tp-notes-head{display:flex;align-items:center;gap:8px;font-family:'Fraunces',serif;font-weight:600;font-size:15px;margin-bottom:12px;}
.tp-notes ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:9px;}
.tp-notes li{font-size:12.5px;line-height:1.55;color:var(--ink-2);}
.tp-notes strong{color:var(--ink);font-weight:600;}
.tp-modal-overlay{position:fixed;inset:0;background:rgba(16,24,34,.55);backdrop-filter:blur(3px);z-index:50;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto;}
.tp-modal{background:var(--paper);border-radius:16px;width:100%;max-width:780px;box-shadow:0 24px 60px rgba(0,0,0,.3);overflow:hidden;margin:auto;}
.tp-modal-head{background:var(--ink);color:#fff;padding:18px 22px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;}
.tp-modal-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--gold);font-weight:600;margin-bottom:3px;}
.tp-modal-head h3{margin:0;font-family:'Fraunces',serif;font-weight:500;font-size:18px;}
.tp-modal-head-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.tp-modal-close{background:rgba(255,255,255,.1);border:none;color:#fff;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;cursor:pointer;}
.tp-modal-close:hover{background:rgba(255,255,255,.2);}
.tp-modal-body{padding:22px;max-height:64vh;overflow-y:auto;}
.tp-modal-foot{padding:14px 22px;background:#fff;border-top:1px solid var(--line);display:flex;justify-content:flex-end;}
.tp-editor{display:flex;flex-direction:column;gap:14px;}
.tp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;}
.tp-mfield{display:flex;flex-direction:column;gap:4px;}
.tp-mfield>span{font-size:11.5px;color:var(--ink-2);font-weight:500;display:flex;justify-content:space-between;gap:8px;}
.tp-mfield>span em{font-style:normal;color:var(--muted);font-size:10.5px;}
.tp-mmoney{border:1px solid var(--line);border-radius:8px;padding:9px 11px;font-size:14px;font-family:inherit;color:var(--blue);font-weight:600;text-align:right;background:#fff;font-variant-numeric:tabular-nums;}
.tp-mmoney:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(29,78,216,.1);}
.tp-mmoney.dim{color:#B7C0CA;}
.tp-sublabel{font-size:11px;text-transform:uppercase;letter-spacing:.6px;font-weight:600;color:var(--ink-2);padding-top:6px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:baseline;}
.tp-sublabel em{font-style:normal;text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted);font-size:11px;}
.tp-linelist{display:flex;flex-direction:column;gap:6px;}
.tp-linerow{display:grid;grid-template-columns:1fr 130px 32px;gap:8px;align-items:center;}
.tp-linelabel{border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;background:#fff;}
.tp-linelabel:focus{outline:none;border-color:var(--blue);}
.tp-linedel{background:transparent;border:none;color:var(--muted);cursor:pointer;display:grid;place-items:center;padding:6px;border-radius:6px;}
.tp-linedel:hover{background:#FCEBED;color:var(--claret);}
.tp-lineadd{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px dashed var(--line);border-radius:7px;padding:6px 11px;font-size:12px;color:var(--ink-2);font-family:inherit;cursor:pointer;}
.tp-lineadd:hover{border-color:var(--green);color:var(--green);}
.tp-biz{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;}
.tp-biz-head{display:flex;align-items:center;gap:10px;}
.tp-biz-name{flex:1;border:none;border-bottom:1.5px solid var(--line);padding:4px 2px;font-size:15px;font-weight:600;font-family:'Fraunces',serif;background:transparent;}
.tp-biz-name:focus{outline:none;border-bottom-color:var(--green);}
.tp-biz-net{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--green-bg);border-radius:8px;font-size:13px;}
.tp-biz-net strong{font-size:15px;color:var(--green);}
.tp-biz-net.neg{background:#FCEBED;}
.tp-biz-net.neg strong{color:var(--claret);}
.tp-add-block{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px dashed var(--line);border-radius:9px;padding:9px 14px;font-size:13px;font-weight:500;color:var(--ink-2);font-family:inherit;cursor:pointer;}
.tp-add-block:hover{border-color:var(--green);color:var(--green);background:var(--green-bg);}
.tp-editor-total{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:var(--ink);color:#fff;border-radius:10px;font-size:13px;font-weight:500;}
.tp-editor-total strong{font-family:'Fraunces',serif;font-size:19px;font-weight:500;}
.tp-subtotal-line{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#F0F3F6;border-radius:8px;font-size:12.5px;font-weight:600;}
.tp-subtotal-line.muted{background:transparent;color:var(--muted);font-weight:500;padding:4px 12px;}
.tp-tbl{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff;}
.tp-tbl-head{display:grid;background:var(--paper);font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;font-weight:600;color:var(--muted);}
.tp-tbl-head.pt{grid-template-columns:1.6fr 1fr 1fr 1fr 1fr 32px;}
.tp-tbl-head.qbi{grid-template-columns:1.6fr 1fr 1fr 1fr .9fr .9fr 32px;}
.tp-tbl-head>div{padding:8px 8px;text-align:right;}
.tp-tbl-head>div:first-child{text-align:left;}
.tp-tbl-row{display:grid;border-top:1px solid var(--line);align-items:center;}
.tp-tbl-row.pt{grid-template-columns:1.6fr 1fr 1fr 1fr 1fr 32px;}
.tp-tbl-row.qbi{grid-template-columns:1.6fr 1fr 1fr 1fr .9fr .9fr 32px;}
.tp-tbl-row .tp-mmoney{border:none;border-left:1px solid var(--line);border-radius:0;padding:8px;font-size:12.5px;}
.tp-tbl-row .tp-mmoney:focus{box-shadow:inset 0 0 0 2px rgba(29,78,216,.15);}
.tp-tbl-name{border:none;padding:8px 10px;font-size:12.5px;font-family:inherit;font-weight:500;background:transparent;min-width:0;}
.tp-tbl-name:focus{outline:none;background:#EEF4FF;}
.tp-tbl-calc{padding:8px;text-align:right;font-size:12px;color:var(--muted);border-left:1px solid var(--line);font-variant-numeric:tabular-nums;}
.tp-qbi-controls{display:flex;gap:20px;flex-wrap:wrap;padding:12px 14px;background:#fff;border:1px solid var(--line);border-radius:10px;}
.tp-check{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink-2);font-weight:500;cursor:pointer;}
.tp-check input{width:15px;height:15px;accent-color:var(--green);}
.tp-qbi-summary{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px;}
.tp-qbi-summary>div{display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-2);}
.tp-qbi-summary .hl{border-top:1px solid var(--line);padding-top:8px;margin-top:2px;font-weight:700;color:var(--ink);}
.tp-qbi-summary .hl strong{color:var(--green);font-size:15px;}
.tp-note-inline{font-size:12px;line-height:1.5;color:var(--ink-2);background:#FFF8EC;border:1px solid #F0E2C4;border-radius:8px;padding:9px 12px;}
.tp-note-inline.sm{font-size:11px;padding:7px 10px;}
.tp-se-line{display:flex;justify-content:space-between;align-items:baseline;padding:8px 4px;font-size:13px;color:var(--ink-2);}
.tp-se-line em{font-style:normal;color:var(--muted);font-size:11px;margin-left:8px;}
.tp-se-line strong{font-variant-numeric:tabular-nums;color:var(--ink);}
.tp-se-line.bold{font-weight:700;color:var(--ink);}
.tp-se-line.bold strong{font-size:15px;}
.tp-se-divider{height:1px;background:var(--line);margin:2px 0;}
/* Add-scenario row + planning button */
.tp-add-row{display:flex;gap:10px;flex-wrap:wrap;margin:12px;}
.tp-add{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;background:#fff;border:1px dashed var(--line);border-radius:8px;color:var(--ink-2);font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;}
.tp-add:hover{border-color:var(--green);color:var(--green);background:var(--green-bg);}
.tp-add.planning{border-style:solid;border-color:var(--green);color:#fff;background:var(--green);}
.tp-add.planning:hover{background:#0C6A58;border-color:#0C6A58;color:#fff;}
/* Planning template menu */
.tp-planmenu-wrap{position:relative;}
.tp-planmenu-scrim{position:fixed;inset:0;z-index:29;}
.tp-planmenu{position:absolute;bottom:calc(100% + 8px);left:0;z-index:30;width:340px;max-width:88vw;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 16px 40px rgba(16,24,34,.18);overflow:hidden;}
.tp-planmenu-head{padding:11px 14px;background:var(--paper);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ink-2);display:flex;justify-content:space-between;align-items:baseline;gap:8px;}
.tp-planmenu-head em{font-style:normal;text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted);font-size:10.5px;}
.tp-planmenu-item{width:100%;display:flex;gap:10px;align-items:flex-start;padding:11px 14px;background:#fff;border:none;border-top:1px solid var(--line);text-align:left;cursor:pointer;font-family:inherit;}
.tp-planmenu-item:hover{background:var(--green-bg);}
.tp-planmenu-item svg{color:var(--green);flex-shrink:0;margin-top:1px;}
.tp-planmenu-item span{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:var(--muted);line-height:1.45;}
.tp-planmenu-item strong{font-size:13px;color:var(--ink);font-weight:600;}
/* Tax Library */
.tp-lib{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:22px;}
.tp-lib-controls{display:flex;flex-direction:column;gap:12px;margin:4px 0 14px;}
.tp-lib-search{width:100%;border:1px solid var(--line);border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:inherit;background:var(--paper);}
.tp-lib-search:focus{outline:none;border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(29,78,216,.08);}
.tp-lib-chips{display:flex;gap:7px;flex-wrap:wrap;}
.tp-chip{border:1px solid var(--line);background:#fff;border-radius:20px;padding:6px 13px;font-size:11.5px;font-family:inherit;font-weight:500;color:var(--ink-2);cursor:pointer;}
.tp-chip:hover{border-color:var(--ink-2);}
.tp-chip.on{background:var(--ink);color:#fff;border-color:var(--ink);}
.tp-lib-count{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:10px;}
.tp-lib-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;}
.tp-lib-card{border:1px solid var(--line);border-radius:11px;padding:14px 15px;background:#FBFCFD;}
.tp-lib-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.tp-lib-title{font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.35;}
.tp-lib-cat{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--muted);font-weight:600;margin-top:5px;}
.tp-lib-sum{font-size:12px;color:var(--ink-2);line-height:1.55;margin:8px 0 10px;}
.tp-lib-meta{display:flex;flex-direction:column;gap:5px;border-top:1px solid var(--line);padding-top:9px;}
.tp-lib-meta>div{font-size:11px;color:var(--ink-2);line-height:1.4;}
.tp-lib-meta span{display:inline-block;min-width:66px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.3px;font-size:9.5px;margin-right:6px;vertical-align:1px;}
.tp-lib-empty{grid-column:1/-1;padding:24px;text-align:center;color:var(--muted);font-size:13px;}
@media (max-width:640px){.tp-lib-list{grid-template-columns:1fr;}}
/* Segmented control */
.tp-seg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#fff;}
.tp-seg button{border:none;background:transparent;padding:7px 13px;font-size:12px;font-family:inherit;font-weight:500;color:var(--ink-2);cursor:pointer;border-right:1px solid var(--line);}
.tp-seg button:last-child{border-right:none;}
.tp-seg button.on{background:var(--ink);color:#fff;}
.tp-planrow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.tp-planrow>span{font-size:12.5px;color:var(--ink-2);font-weight:500;}
.tp-plan-summary{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:13px 15px;margin-top:4px;}
.tp-plan-summary>div{display:flex;justify-content:space-between;font-size:12.5px;color:var(--ink-2);}
.tp-plan-summary .sub{border-top:1px solid var(--line);padding-top:8px;margin-top:2px;font-weight:600;color:var(--ink);}
.tp-plan-summary .hl{font-weight:700;color:var(--ink);}
.tp-plan-summary .hl strong{color:var(--green);font-size:15px;}
/* Multi-year projection */
.tp-proj-controls{display:flex;gap:16px;flex-wrap:wrap;}
.tp-proj-controls label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);font-weight:600;display:flex;flex-direction:column;gap:3px;}
.tp-stepper{display:flex;align-items:center;gap:3px;font-size:12px;text-transform:none;letter-spacing:0;color:var(--ink-2);font-weight:500;}
.tp-stepper input{width:52px;border:1px solid var(--line);border-radius:6px;padding:5px 6px;font-family:inherit;font-size:12.5px;text-align:right;color:var(--blue);font-weight:600;}
.tp-stepper input:focus{outline:none;border-color:var(--blue);}
.tp-proj-hint{font-size:12.5px;color:var(--ink-2);line-height:1.55;margin:10px 2px 2px;}
.tp-proj-tblwrap{overflow-x:auto;margin-top:14px;}
.tp-proj-tbl{width:100%;border-collapse:collapse;font-size:12.5px;}
.tp-proj-tbl th,.tp-proj-tbl td{padding:8px 12px;text-align:right;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums;white-space:nowrap;}
.tp-proj-tbl th:first-child,.tp-proj-tbl td:first-child{text-align:left;}
.tp-proj-tbl thead th{font-size:11px;color:var(--muted);font-weight:600;border-bottom:1.5px solid var(--line);}
.tp-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle;}
.tp-proj-cum td{font-weight:700;border-top:2px solid var(--ink);border-bottom:none;background:#FAFBFC;}
.tp-proj-cum td:first-child{color:var(--ink);}
.tp-proj-best{display:inline-block;margin-left:6px;font-size:9px;text-transform:uppercase;letter-spacing:.4px;font-weight:600;color:#fff;background:var(--green);padding:2px 6px;border-radius:4px;}
/* Guide */
.tp-guide{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:22px;}
.tp-guide-head{margin-bottom:16px;}
.tp-guide-title{display:flex;align-items:center;gap:9px;font-family:'Fraunces',serif;font-weight:600;font-size:19px;color:var(--ink);}
.tp-guide-sub{font-size:12.5px;color:var(--muted);margin-top:6px;line-height:1.5;max-width:760px;}
.tp-law{border:1px solid var(--line);border-radius:11px;overflow:hidden;margin-bottom:18px;background:#FBFCFD;}
.tp-law-toggle{width:100%;display:flex;align-items:center;gap:8px;padding:11px 14px;background:transparent;border:none;font-family:inherit;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;}
.tp-law-toggle svg:last-of-type{color:var(--green);}
.tp-law-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;padding:0 14px 14px;}
.tp-law-card{background:#fff;border:1px solid var(--line);border-radius:9px;padding:11px 12px;position:relative;}
.tp-law-when{position:absolute;top:10px;right:10px;font-size:9px;font-weight:600;letter-spacing:.3px;color:var(--green);background:var(--green-bg);padding:2px 6px;border-radius:4px;}
.tp-law-t{font-size:12.5px;font-weight:700;color:var(--ink);margin-bottom:4px;padding-right:46px;}
.tp-law-d{font-size:11.5px;color:var(--ink-2);line-height:1.5;}
.tp-guide-cats{display:flex;flex-direction:column;gap:8px;}
.tp-cat{border:1px solid var(--line);border-radius:11px;overflow:hidden;}
.tp-cat.open{border-color:#D3DAE2;}
.tp-cat-head{width:100%;display:flex;align-items:center;gap:9px;padding:13px 15px;background:var(--paper);border:none;font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--ink);cursor:pointer;text-align:left;}
.tp-cat-head span{flex:1;}
.tp-cat-head em{font-style:normal;font-family:'Inter';font-size:11px;font-weight:600;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:20px;padding:2px 9px;}
.tp-cat-body{padding:6px 15px 15px;display:flex;flex-direction:column;gap:10px;}
.tp-consid{border-left:2.5px solid var(--line);padding:2px 0 2px 14px;}
.tp-consid-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.tp-consid-name{font-size:13.5px;font-weight:600;color:var(--ink);}
.tp-risk{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;letter-spacing:.2px;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.tp-risk.low{color:var(--green);background:var(--green-bg);}
.tp-risk.med{color:#8A6D1A;background:#FBF3DD;}
.tp-risk.high{color:var(--claret);background:#FBEAEC;}
.tp-consid-b{font-size:12.5px;color:var(--ink-2);line-height:1.55;margin-top:5px;}
.tp-consid-meta{font-size:11px;color:var(--muted);margin-top:5px;font-style:italic;}
.tp-disclaimer{margin-top:16px;padding:14px 16px;background:#FBFCFD;border:1px solid var(--line);border-radius:10px;font-size:11.5px;line-height:1.6;color:var(--muted);}
.tp-disclaimer strong{color:var(--ink-2);}
@media (max-width:640px){.tp-header-inner{padding:14px 16px;}.tp-main{padding:16px;}.tp-controls{width:100%;}.tp-grid2{grid-template-columns:1fr;}.tp-modal-body{max-height:56vh;}.tp-law-grid{grid-template-columns:1fr;}}
`;
