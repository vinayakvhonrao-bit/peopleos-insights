// Workforce planning engine — events, projections, scenario comparison.
import {
  EMPLOYEES, DEPARTMENTS, SCENARIOS, type Department, type Location, type Level,
} from "./data";

export const MONTHS = [
  "Jul 26","Aug 26","Sep 26","Oct 26","Nov 26","Dec 26",
  "Jan 27","Feb 27","Mar 27","Apr 27","May 27","Jun 27",
] as const;
export type MonthLabel = typeof MONTHS[number];

export type EventStatus = "Planned" | "Approved" | "Deferred";
export type EventKind = "Hire" | "Termination" | "Transfer" | "Compensation";

interface BaseEvent {
  id: string;
  scenarioId: string;
  kind: EventKind;
  status: EventStatus;
  createdAt: string;
  createdBy: string;
  note?: string;
  needsApproval?: boolean;
}

export interface HireEvent extends BaseEvent {
  kind: "Hire";
  department: Department;
  location: Location;
  level: Level;
  startMonth: MonthLabel;
  count: number;
  annualSalaryUSD: number;
}

export type AttritionType = "Assumed attrition" | "Planned termination" | "Backfill required" | "No backfill";
export interface TermEvent extends BaseEvent {
  kind: "Termination";
  department: Department;
  location: Location;
  level: Level;
  month: MonthLabel;
  count: number;
  attritionPct?: number; // % of current dept headcount (input); count is derived
  attritionType: AttritionType;
  backfillMonth?: MonthLabel;
  exitingSalaryUSD: number;
}

export interface TransferEvent extends BaseEvent {
  kind: "Transfer";
  worker: string;
  fromDept: Department;
  toDept: Department;
  fromLocation: Location;
  toLocation: Location;
  level: Level;
  month: MonthLabel;
  compChangePct: number;
  currentSalaryUSD: number;
}

export type CompChangeType = "Merit" | "Promotion" | "Market adjustment" | "Retention adjustment";
export interface CompEvent extends BaseEvent {
  kind: "Compensation";
  population: string; // worker name or "Eng IC4 cohort"
  department: Department;
  level: Level;
  month: MonthLabel;
  changeType: CompChangeType;
  increasePct: number;
  newAnnualSalaryUSD: number;
  affectedCount: number;
}

export type PlanEvent = HireEvent | TermEvent | TransferEvent | CompEvent;

// ---- Tax / benefit rates (employer-side, blended annual)
const TAX_RATE: Record<Location, number> = {
  SF: 0.092, "San Jose": 0.092, "Remote-US": 0.082,
  Toronto: 0.075, London: 0.138, Bangalore: 0.060,
};
const BEN_RATE: Record<Location, number> = {
  SF: 0.10, "San Jose": 0.10, "Remote-US": 0.10,
  Toronto: 0.05, London: 0.05, Bangalore: 0.05,
};

export function burdenedRates(loc: Location) {
  return { tax: TAX_RATE[loc], benefits: BEN_RATE[loc] };
}

export function monthIndex(m: MonthLabel): number {
  return MONTHS.indexOf(m);
}

// ---- Baseline (active workforce as of plan start)
function baselineActive() {
  return EMPLOYEES.filter((e) => e.status === "Active" || e.status === "On Leave");
}

export function baselineSnapshot() {
  const active = baselineActive();
  const headcount = active.length;
  const grossAnnual = active.reduce((s, e) => s + e.salaryUSD, 0);
  let taxAnnual = 0, benAnnual = 0;
  for (const e of active) {
    taxAnnual += e.salaryUSD * TAX_RATE[e.location];
    benAnnual += e.salaryUSD * BEN_RATE[e.location];
  }
  const burdenedAnnual = grossAnnual + taxAnnual + benAnnual;
  const byDept = Object.fromEntries(DEPARTMENTS.map((d) => {
    const list = active.filter((e) => e.department === d);
    const gross = list.reduce((s, e) => s + e.salaryUSD, 0);
    let tax = 0, ben = 0;
    for (const e of list) { tax += e.salaryUSD * TAX_RATE[e.location]; ben += e.salaryUSD * BEN_RATE[e.location]; }
    return [d, { hc: list.length, gross, burdened: gross + tax + ben }];
  })) as Record<Department, { hc: number; gross: number; burdened: number }>;
  return { headcount, grossAnnual, taxAnnual, benAnnual, burdenedAnnual, byDept };
}

export const BASELINE = baselineSnapshot();

// Average baseline salary by dept+level (USD) for defaulting form inputs.
export function avgSalaryFor(department: Department, level: Level, location?: Location): number {
  const pool = baselineActive().filter(
    (e) => e.department === department && e.level === level && (!location || e.location === location),
  );
  if (!pool.length) {
    const broad = baselineActive().filter((e) => e.level === level);
    if (broad.length) return Math.round(broad.reduce((s, e) => s + e.salaryUSD, 0) / broad.length);
    return 180000;
  }
  return Math.round(pool.reduce((s, e) => s + e.salaryUSD, 0) / pool.length);
}

// ---- Projection ----
export interface ProjectionRow {
  month: MonthLabel;
  startingHC: number;
  hires: number;
  exits: number;
  transfersIn: number;
  transfersOut: number;
  endingHC: number;
  grossPayroll: number;       // monthly
  employerTaxes: number;
  benefits: number;
  fullyBurdened: number;
  monthlyBurn: number;
  changeVsBaseline: number;   // burdened delta vs baseline monthly
  byDept: Record<Department, { hc: number; gross: number; burdened: number }>;
}

interface DeptState { hc: number; grossAnnual: number; taxAnnual: number; benAnnual: number }

function emptyDeptState(): Record<Department, DeptState> {
  return Object.fromEntries(DEPARTMENTS.map((d) => [d, { hc: 0, grossAnnual: 0, taxAnnual: 0, benAnnual: 0 }])) as Record<Department, DeptState>;
}

export function projectScenario(events: PlanEvent[]): ProjectionRow[] {
  // initialize state with baseline
  const state = emptyDeptState();
  for (const d of DEPARTMENTS) {
    state[d].hc = BASELINE.byDept[d].hc;
    state[d].grossAnnual = BASELINE.byDept[d].gross;
    // assume baseline locations distributed; use blended tax/ben from baseline
    state[d].taxAnnual = BASELINE.byDept[d].burdened - BASELINE.byDept[d].gross - 0; // tax+ben combined
    state[d].benAnnual = 0; // we'll keep tax+ben combined in taxAnnual to avoid double-counting
  }

  // Bucket events by month
  const active = events.filter((e) => e.status !== "Deferred");

  const baselineMonthly = BASELINE.burdenedAnnual / 12;

  const rows: ProjectionRow[] = [];
  for (const month of MONTHS) {
    const starting = DEPARTMENTS.reduce((s, d) => s + state[d].hc, 0);
    let hires = 0, exits = 0, tIn = 0, tOut = 0;

    for (const ev of active) {
      if (ev.kind === "Hire" && ev.startMonth === month) {
        const taxR = TAX_RATE[ev.location], benR = BEN_RATE[ev.location];
        const grossDelta = ev.count * ev.annualSalaryUSD;
        state[ev.department].hc += ev.count;
        state[ev.department].grossAnnual += grossDelta;
        state[ev.department].taxAnnual += grossDelta * taxR;
        state[ev.department].benAnnual += grossDelta * benR;
        hires += ev.count;
      }
      if (ev.kind === "Termination" && ev.month === month) {
        const taxR = TAX_RATE[ev.location], benR = BEN_RATE[ev.location];
        const grossDelta = ev.count * ev.exitingSalaryUSD;
        state[ev.department].hc -= ev.count;
        state[ev.department].grossAnnual -= grossDelta;
        state[ev.department].taxAnnual -= grossDelta * taxR;
        state[ev.department].benAnnual -= grossDelta * benR;
        exits += ev.count;
      }
      if (ev.kind === "Termination" && ev.attritionType === "Backfill required" && ev.backfillMonth === month) {
        const taxR = TAX_RATE[ev.location], benR = BEN_RATE[ev.location];
        const grossDelta = ev.count * ev.exitingSalaryUSD;
        state[ev.department].hc += ev.count;
        state[ev.department].grossAnnual += grossDelta;
        state[ev.department].taxAnnual += grossDelta * taxR;
        state[ev.department].benAnnual += grossDelta * benR;
        hires += ev.count;
      }
      if (ev.kind === "Transfer" && ev.month === month) {
        const oldTax = TAX_RATE[ev.fromLocation], oldBen = BEN_RATE[ev.fromLocation];
        const newTax = TAX_RATE[ev.toLocation], newBen = BEN_RATE[ev.toLocation];
        const oldSalary = ev.currentSalaryUSD;
        const newSalary = ev.currentSalaryUSD * (1 + ev.compChangePct);
        // Remove from old dept
        state[ev.fromDept].hc -= 1;
        state[ev.fromDept].grossAnnual -= oldSalary;
        state[ev.fromDept].taxAnnual -= oldSalary * oldTax;
        state[ev.fromDept].benAnnual -= oldSalary * oldBen;
        // Add to new dept
        state[ev.toDept].hc += 1;
        state[ev.toDept].grossAnnual += newSalary;
        state[ev.toDept].taxAnnual += newSalary * newTax;
        state[ev.toDept].benAnnual += newSalary * newBen;
        tIn += 1; tOut += 1;
      }
      if (ev.kind === "Compensation" && ev.month === month) {
        // Apply increase to affected population using blended dept rates
        const baseGross = ev.affectedCount * ev.newAnnualSalaryUSD / (1 + ev.increasePct);
        const newGross = ev.affectedCount * ev.newAnnualSalaryUSD;
        const grossDelta = newGross - baseGross;
        // Use US blended for tax/ben if unknown; pick remote-US as proxy
        const taxR = 0.085, benR = 0.09;
        state[ev.department].grossAnnual += grossDelta;
        state[ev.department].taxAnnual += grossDelta * taxR;
        state[ev.department].benAnnual += grossDelta * benR;
      }
    }

    const endingHC = DEPARTMENTS.reduce((s, d) => s + state[d].hc, 0);
    const grossAnnual = DEPARTMENTS.reduce((s, d) => s + state[d].grossAnnual, 0);
    const taxAnnual = DEPARTMENTS.reduce((s, d) => s + state[d].taxAnnual, 0);
    const benAnnual = DEPARTMENTS.reduce((s, d) => s + state[d].benAnnual, 0);
    const burdenedAnnual = grossAnnual + taxAnnual + benAnnual;
    const burdenedMonthly = burdenedAnnual / 12;

    const byDept = Object.fromEntries(DEPARTMENTS.map((d) => [d, {
      hc: Math.round(state[d].hc),
      gross: Math.round(state[d].grossAnnual / 12),
      burdened: Math.round((state[d].grossAnnual + state[d].taxAnnual + state[d].benAnnual) / 12),
    }])) as ProjectionRow["byDept"];

    rows.push({
      month,
      startingHC: Math.round(starting),
      hires,
      exits,
      transfersIn: tIn,
      transfersOut: tOut,
      endingHC: Math.round(endingHC),
      grossPayroll: Math.round(grossAnnual / 12),
      employerTaxes: Math.round(taxAnnual / 12),
      benefits: Math.round(benAnnual / 12),
      fullyBurdened: Math.round(burdenedMonthly),
      monthlyBurn: Math.round(burdenedMonthly),
      changeVsBaseline: Math.round(burdenedMonthly - baselineMonthly),
      byDept,
    });
  }
  return rows;
}

// ---- Seed events derived from existing SCENARIOS plus richer event mix.

const QUARTER_TO_MONTH: Record<string, MonthLabel> = {
  "Q3 2026": "Jul 26", "Q4 2026": "Oct 26", "Q1 2027": "Jan 27", "Q2 2027": "Apr 27",
};

let seq = 1;
const nextId = (kind: string) => `EVT-${kind}-${String(seq++).padStart(4, "0")}`;

function seedFor(scenarioId: string): PlanEvent[] {
  const sc = SCENARIOS.find((s) => s.id === scenarioId);
  if (!sc) return [];
  const out: PlanEvent[] = [];
  for (const h of sc.hires) {
    out.push({
      id: nextId("HIR"), scenarioId, kind: "Hire", status: "Planned",
      createdAt: "2026-06-10", createdBy: sc.owner,
      department: h.department, location: h.location, level: h.level,
      startMonth: QUARTER_TO_MONTH[h.quarter],
      count: h.count,
      annualSalaryUSD: avgSalaryFor(h.department, h.level, h.location),
    });
  }
  // Add a few terminations
  out.push({
    id: nextId("TRM"), scenarioId, kind: "Termination", status: "Approved",
    createdAt: "2026-06-12", createdBy: "People Partner",
    department: "Engineering", location: "Remote-US", level: "IC4",
    month: "Aug 26", count: 3,
    attritionType: "Backfill required", backfillMonth: "Nov 26",
    exitingSalaryUSD: avgSalaryFor("Engineering", "IC4", "Remote-US"),
  });
  out.push({
    id: nextId("TRM"), scenarioId, kind: "Termination", status: "Planned",
    createdAt: "2026-06-12", createdBy: "People Partner",
    department: "G&A", location: "SF", level: "M4",
    month: "Sep 26", count: 1,
    attritionType: "No backfill",
    exitingSalaryUSD: avgSalaryFor("G&A", "M4", "SF"),
  });
  // Transfer
  out.push({
    id: nextId("TRF"), scenarioId, kind: "Transfer", status: "Approved",
    createdAt: "2026-06-13", createdBy: "HRBP",
    worker: "E100214 — Internal Move",
    fromDept: "Engineering", toDept: "GPU Cloud",
    fromLocation: "Remote-US", toLocation: "San Jose",
    level: "IC5", month: "Oct 26",
    compChangePct: 0.08,
    currentSalaryUSD: avgSalaryFor("Engineering", "IC5", "Remote-US"),
  });
  // Comp change
  const isGrowth = scenarioId === "sc-growth";
  out.push({
    id: nextId("CMP"), scenarioId, kind: "Compensation", status: "Approved",
    createdAt: "2026-06-14", createdBy: "Comp Team",
    population: "Annual merit — all eligible",
    department: "Engineering", level: "IC4",
    month: "Jan 27", changeType: "Merit",
    increasePct: isGrowth ? 0.05 : 0.035,
    newAnnualSalaryUSD: Math.round(avgSalaryFor("Engineering","IC4") * (1 + (isGrowth ? 0.05 : 0.035))),
    affectedCount: 42,
  });
  if (isGrowth) {
    out.push({
      id: nextId("CMP"), scenarioId, kind: "Compensation", status: "Planned",
      createdAt: "2026-06-14", createdBy: "CHRO",
      population: "GPU Cloud retention pool",
      department: "GPU Cloud", level: "IC5",
      month: "Oct 26", changeType: "Retention adjustment",
      increasePct: 0.18,
      newAnnualSalaryUSD: Math.round(avgSalaryFor("GPU Cloud","IC5") * 1.18),
      affectedCount: 8,
      needsApproval: true,
    });
  }
  return out;
}

export function seedEventsForAllScenarios(): PlanEvent[] {
  return SCENARIOS.flatMap((s) => seedFor(s.id));
}

export function flagNeedsApproval(e: PlanEvent): boolean {
  if (e.needsApproval) return true;
  if (e.kind === "Compensation" && e.increasePct > 0.15) return true;
  if (e.kind === "Transfer" && e.compChangePct > 0.15) return true;
  return false;
}

// Baseline projection: zero events
export const BASELINE_PROJECTION = projectScenario([]);
