// Synthetic People data for NeoCloud PeopleOS prototype.
// Deterministic generation via seeded RNG so renders are stable.

export type Department = "Engineering" | "GPU Cloud" | "On-Prem" | "G&A";
export type Location = "SF" | "San Jose" | "Remote-US" | "Toronto" | "London" | "Bangalore";
export type Status = "Active" | "On Leave" | "Termination Pending" | "Contractor";
export type Level = "IC3" | "IC4" | "IC5" | "IC6" | "M3" | "M4" | "M5" | "M6";
export type Currency = "USD" | "CAD" | "GBP" | "INR";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  department: Department;
  location: Location;
  level: Level;
  salary: number; // in local currency
  salaryUSD: number;
  currency: Currency;
  managerId: string | null;
  managerName: string;
  hireDate: string; // ISO
  status: Status;
  jobProfile: string;
  jobFamily: string;
  costCenter: string;
  supervisoryOrg: string;
  bandStatus: "Below Band" | "Within Band" | "Above Band";
}

const JOB_FAMILY: Record<string, string> = {
  "Software Engineer": "Engineering / Software",
  "Staff Engineer": "Engineering / Software",
  "Engineering Manager": "Engineering / Management",
  "Site Reliability Engineer": "Engineering / SRE",
  "Cloud Platform Engineer": "Cloud Infrastructure",
  "GPU Infrastructure Engineer": "Cloud Infrastructure",
  "Cloud Solutions Architect": "Cloud Architecture",
  "Capacity Planning Lead": "Cloud Operations",
  "Datacenter Engineer": "Datacenter Operations",
  "Hardware Operations": "Datacenter Operations",
  "Network Engineer": "Network Engineering",
  "Field Deployment Engineer": "Field Operations",
  "People Partner": "Human Resources",
  "Finance Analyst": "Finance",
  "Legal Counsel": "Legal",
  "Business Operations": "Business Operations",
  "Recruiter": "Talent Acquisition",
};

const FIRST = [
  "Ava","Noah","Liam","Mia","Ethan","Olivia","Aiden","Sophia","Lucas","Isabella",
  "Mason","Amelia","Logan","Harper","Elijah","Evelyn","James","Abigail","Benjamin","Ella",
  "Jacob","Scarlett","Michael","Grace","Daniel","Chloe","Henry","Victoria","Jackson","Riley",
  "Sebastian","Aria","David","Lily","Joseph","Aubrey","Samuel","Zoey","Carter","Hannah",
  "Owen","Layla","Wyatt","Nora","John","Camila","Jack","Penelope","Luke","Eleanor",
  "Jayden","Anika","Arjun","Priya","Wei","Yuki","Mateo","Sofia","Diego","Valentina",
  "Aarav","Ishaan","Rohan","Kavya","Meera","Vikram","Sanjay","Neha","Rahul","Divya",
  "Oliver","Charlotte","William","Emma","Alexander","Madison","Theo","Ruby","Felix","Iris",
];
const LAST = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
  "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts",
  "Patel","Shah","Singh","Kumar","Khan","Chen","Wang","Liu","Zhang","Kim",
  "Park","Sato","Tanaka","Suzuki","Reyes","Cruz","Mendez","Vargas","Castillo","Ortiz",
];

// Mulberry32 seeded RNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260101);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

const DEPT_WEIGHTS: [Department, number][] = [
  ["Engineering", 0.40],
  ["GPU Cloud", 0.30],
  ["On-Prem", 0.15],
  ["G&A", 0.15],
];

const LOCATIONS: Location[] = ["SF", "San Jose", "Remote-US", "Toronto", "London", "Bangalore"];
const LOC_WEIGHTS: number[] = [0.22, 0.15, 0.25, 0.10, 0.10, 0.18];

const LEVELS: Level[] = ["IC3", "IC4", "IC5", "IC6", "M3", "M4", "M5", "M6"];
const LEVEL_WEIGHTS = [0.20, 0.25, 0.18, 0.08, 0.12, 0.10, 0.05, 0.02];

const STATUSES: Status[] = ["Active", "On Leave", "Termination Pending", "Contractor"];
const STATUS_WEIGHTS = [0.88, 0.04, 0.02, 0.06];

function weighted<T>(items: T[], weights: number[]): T {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

function weightedPairs<T>(pairs: [T, number][]): T {
  const r = rand();
  let acc = 0;
  for (const [v, w] of pairs) {
    acc += w;
    if (r <= acc) return v;
  }
  return pairs[pairs.length - 1][0];
}

const CURRENCY_BY_LOC: Record<Location, Currency> = {
  SF: "USD",
  "San Jose": "USD",
  "Remote-US": "USD",
  Toronto: "CAD",
  London: "GBP",
  Bangalore: "INR",
};

// FX -> USD multiplier
const FX: Record<Currency, number> = {
  USD: 1,
  CAD: 0.74,
  GBP: 1.27,
  INR: 0.012,
};

// Base USD salary band by level
const BAND_USD: Record<Level, { low: number; mid: number; high: number }> = {
  IC3: { low: 130000, mid: 160000, high: 190000 },
  IC4: { low: 170000, mid: 205000, high: 240000 },
  IC5: { low: 210000, mid: 260000, high: 310000 },
  IC6: { low: 260000, mid: 320000, high: 390000 },
  M3: { low: 180000, mid: 220000, high: 260000 },
  M4: { low: 230000, mid: 280000, high: 330000 },
  M5: { low: 290000, mid: 350000, high: 410000 },
  M6: { low: 360000, mid: 440000, high: 520000 },
};

const LOC_MULT: Record<Location, number> = {
  SF: 1.10,
  "San Jose": 1.08,
  "Remote-US": 0.95,
  Toronto: 0.85,
  London: 0.90,
  Bangalore: 0.40,
};

const JOB_PROFILES: Record<Department, string[]> = {
  Engineering: ["Software Engineer", "Staff Engineer", "Engineering Manager", "Site Reliability Engineer"],
  "GPU Cloud": ["Cloud Platform Engineer", "GPU Infrastructure Engineer", "Cloud Solutions Architect", "Capacity Planning Lead"],
  "On-Prem": ["Datacenter Engineer", "Hardware Operations", "Network Engineer", "Field Deployment Engineer"],
  "G&A": ["People Partner", "Finance Analyst", "Legal Counsel", "Business Operations", "Recruiter"],
};

const COST_CENTERS: Record<Department, string> = {
  Engineering: "CC-1000 Engineering",
  "GPU Cloud": "CC-2000 GPU Cloud",
  "On-Prem": "CC-3000 On-Prem",
  "G&A": "CC-9000 G&A",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function randomHireDate(): string {
  const today = new Date("2026-06-15");
  const daysBack = Math.floor(rand() * 365 * 6) + 30; // 1mo to 6y
  const d = new Date(today);
  d.setDate(d.getDate() - daysBack);
  return isoDate(d);
}

function generateEmployees(n: number): Employee[] {
  const employees: Employee[] = [];
  // First, generate managers per dept
  const managersByDept: Record<Department, Employee[]> = {
    Engineering: [], "GPU Cloud": [], "On-Prem": [], "G&A": [],
  };

  for (let i = 0; i < n; i++) {
    const id = `E${String(100001 + i)}`;
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    const department = weightedPairs(DEPT_WEIGHTS);
    const location = weighted(LOCATIONS, LOC_WEIGHTS);
    const level = weighted(LEVELS, LEVEL_WEIGHTS);
    const status = weighted(STATUSES, STATUS_WEIGHTS);
    const currency = CURRENCY_BY_LOC[location];

    const band = BAND_USD[level];
    const baseUSD = band.low + rand() * (band.high - band.low);
    const adjUSD = baseUSD * LOC_MULT[location];
    const salaryUSD = Math.round(adjUSD);
    const salaryLocal = Math.round(salaryUSD / FX[currency] / 100) * 100;

    let bandStatus: Employee["bandStatus"] = "Within Band";
    if (adjUSD < band.low * LOC_MULT[location] * 0.95) bandStatus = "Below Band";
    else if (adjUSD > band.high * LOC_MULT[location] * 1.02) bandStatus = "Above Band";
    // Force some band exceptions
    if (rand() < 0.04) bandStatus = "Above Band";
    if (rand() < 0.03) bandStatus = "Below Band";

    const jobProfile = pick(JOB_PROFILES[department]);

    const emp: Employee = {
      id,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      department,
      location,
      level,
      salary: salaryLocal,
      salaryUSD,
      currency,
      managerId: null,
      managerName: "",
      hireDate: randomHireDate(),
      status,
      jobProfile,
      jobFamily: JOB_FAMILY[jobProfile] ?? department,
      costCenter: COST_CENTERS[department],
      supervisoryOrg: "",
      bandStatus,
    };
    employees.push(emp);
    if (level === "M4" || level === "M5" || level === "M6") {
      managersByDept[department].push(emp);
    }
  }

  // Ensure at least one manager per dept
  for (const d of Object.keys(managersByDept) as Department[]) {
    if (managersByDept[d].length === 0) {
      const e = employees.find((x) => x.department === d);
      if (e) {
        e.level = "M5";
        managersByDept[d].push(e);
      }
    }
  }

  // Assign managers
  for (const emp of employees) {
    const pool = managersByDept[emp.department].filter((m) => m.id !== emp.id);
    if (pool.length) {
      const m = pool[Math.floor(rand() * pool.length)];
      emp.managerId = m.id;
      emp.managerName = m.name;
      emp.supervisoryOrg = `${emp.department} — ${m.name.split(" ")[1] ?? m.name} Team (${m.id})`;
    } else {
      emp.managerName = "—";
      emp.supervisoryOrg = `${emp.department} — Leadership`;
    }
  }
  return employees;
}

export const EMPLOYEES: Employee[] = generateEmployees(350);

export const DEPARTMENTS: Department[] = ["Engineering", "GPU Cloud", "On-Prem", "G&A"];
export const LOCATION_LIST = LOCATIONS;
export const LEVEL_LIST = LEVELS;
export const STATUS_LIST = STATUSES;

// ---------- Aggregations ----------

export function tenureYears(hireDate: string): number {
  const today = new Date("2026-06-15").getTime();
  const h = new Date(hireDate).getTime();
  return (today - h) / (365.25 * 24 * 3600 * 1000);
}

export function tenureBand(years: number): "<1y" | "1-3y" | "3-5y" | "5y+" {
  if (years < 1) return "<1y";
  if (years < 3) return "1-3y";
  if (years < 5) return "3-5y";
  return "5y+";
}

export function countBy<K extends string>(arr: Employee[], key: (e: Employee) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const e of arr) {
    const k = key(e);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

// ---------- Payroll ----------

export interface PayrollRow {
  employeeId: string;
  name: string;
  department: Department;
  location: Location;
  status: Status;
  grossPay: number; // USD, semi-monthly
  employerTaxes: number;
  benefits: number;
  totalBurdened: number;
  included: boolean;
  anomaly: string | null;
}

const US_LOCS: Location[] = ["SF", "San Jose", "Remote-US"];

function employerTaxRate(loc: Location): number {
  if (US_LOCS.includes(loc)) return 0.0865; // FICA + simplified unemployment
  if (loc === "London") return 0.138;
  if (loc === "Toronto") return 0.075;
  return 0.12 * 0.5; // India PF: 12% of 50% gross => 6%
}

function benefitsRate(loc: Location): number {
  return US_LOCS.includes(loc) ? 0.10 : 0.05;
}

export function buildPayroll(): PayrollRow[] {
  const rows: PayrollRow[] = [];
  // Compute department-level avg pay for anomaly comparison
  const deptAvg: Record<Department, number> = {} as Record<Department, number>;
  for (const d of DEPARTMENTS) {
    const list = EMPLOYEES.filter((e) => e.department === d && e.status === "Active");
    deptAvg[d] = list.reduce((s, e) => s + e.salaryUSD, 0) / Math.max(1, list.length) / 24;
  }

  for (const e of EMPLOYEES) {
    const semi = e.salaryUSD / 24;
    let included = true;
    let anomaly: string | null = null;

    // Inclusion rules
    if (e.status === "Termination Pending") {
      included = true; // included but flagged
      anomaly = "Termination Pending worker included in payroll";
    } else if (e.status === "On Leave") {
      included = false;
    } else if (e.status === "Contractor") {
      included = false;
    }

    // Slight per-period jitter for anomaly seeding (deterministic by id)
    const idNum = Number(e.id.replace(/\D/g, ""));
    const jitter = ((idNum * 9301 + 49297) % 233280) / 233280;
    let gross = semi;
    if (jitter < 0.02) gross = semi * 1.25; // > 20% deviation anomaly
    if (!anomaly && gross > semi * 1.2) anomaly = "Pay deviation > 20% from expected";

    // New hire mid-period
    const hire = new Date(e.hireDate);
    const periodStart = new Date("2026-06-01");
    if (hire > periodStart && hire <= new Date("2026-06-15")) {
      if (!anomaly) anomaly = "New hire mid-period — prorate review";
    }

    if (!anomaly && e.bandStatus === "Above Band") {
      anomaly = "Salary above compensation band";
    }

    if (!anomaly && Math.abs(gross - deptAvg[e.department]) / deptAvg[e.department] > 0.6) {
      anomaly = "Department-level cost deviation";
    }

    const taxRate = employerTaxRate(e.location);
    const benRate = benefitsRate(e.location);

    const grossPay = included ? Math.round(gross) : 0;
    const employerTaxes = Math.round(grossPay * taxRate);
    const benefits = Math.round(grossPay * benRate);
    const totalBurdened = grossPay + employerTaxes + benefits;

    rows.push({
      employeeId: e.id,
      name: e.name,
      department: e.department,
      location: e.location,
      status: e.status,
      grossPay,
      employerTaxes,
      benefits,
      totalBurdened,
      included,
      anomaly: included ? anomaly : null,
    });
  }
  return rows;
}

export const PAYROLL = buildPayroll();

export function monthlyRunRate(): number {
  // Semi-monthly burdened * 2
  return PAYROLL.reduce((s, r) => s + r.totalBurdened, 0) * 2;
}

// ---------- Scenarios ----------

export interface ScenarioHire {
  department: Department;
  quarter: "Q3 2026" | "Q4 2026" | "Q1 2027" | "Q2 2027";
  level: Level;
  location: Location;
  count: number;
}

export interface Scenario {
  id: string;
  name: string;
  owner: string;
  description: string;
  hires: ScenarioHire[];
  attrition: Record<Department, number>; // annual %
  meritByLevel: Partial<Record<Level, number>>;
  meritEffective: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "sc-conservative",
    name: "Conservative IPO Plan",
    owner: "CFO Office",
    description: "Disciplined headcount expansion focused on revenue-generating and IPO-critical roles.",
    hires: [
      { department: "Engineering", quarter: "Q3 2026", level: "IC4", location: "Remote-US", count: 6 },
      { department: "Engineering", quarter: "Q4 2026", level: "IC5", location: "SF", count: 4 },
      { department: "GPU Cloud", quarter: "Q3 2026", level: "IC5", location: "San Jose", count: 5 },
      { department: "GPU Cloud", quarter: "Q1 2027", level: "M4", location: "SF", count: 2 },
      { department: "G&A", quarter: "Q3 2026", level: "IC4", location: "Remote-US", count: 4 },
      { department: "G&A", quarter: "Q4 2026", level: "M4", location: "SF", count: 2 },
      { department: "On-Prem", quarter: "Q2 2027", level: "IC4", location: "Bangalore", count: 3 },
    ],
    attrition: { Engineering: 0.10, "GPU Cloud": 0.08, "On-Prem": 0.12, "G&A": 0.09 },
    meritByLevel: { IC3: 0.03, IC4: 0.035, IC5: 0.04, IC6: 0.04, M3: 0.035, M4: 0.04, M5: 0.045, M6: 0.05 },
    meritEffective: "2027-01-01",
  },
  {
    id: "sc-growth",
    name: "AI Growth Plan",
    owner: "CEO / CHRO",
    description: "Aggressive build-out of GPU Cloud and Engineering ahead of post-IPO scale.",
    hires: [
      { department: "Engineering", quarter: "Q3 2026", level: "IC5", location: "SF", count: 14 },
      { department: "Engineering", quarter: "Q4 2026", level: "IC4", location: "Remote-US", count: 18 },
      { department: "Engineering", quarter: "Q1 2027", level: "IC5", location: "Toronto", count: 8 },
      { department: "GPU Cloud", quarter: "Q3 2026", level: "IC5", location: "San Jose", count: 12 },
      { department: "GPU Cloud", quarter: "Q4 2026", level: "M5", location: "SF", count: 4 },
      { department: "GPU Cloud", quarter: "Q1 2027", level: "IC4", location: "Bangalore", count: 16 },
      { department: "On-Prem", quarter: "Q3 2026", level: "IC4", location: "London", count: 6 },
      { department: "On-Prem", quarter: "Q4 2026", level: "IC5", location: "San Jose", count: 5 },
      { department: "G&A", quarter: "Q4 2026", level: "M4", location: "SF", count: 4 },
      { department: "G&A", quarter: "Q1 2027", level: "IC4", location: "Remote-US", count: 6 },
    ],
    attrition: { Engineering: 0.12, "GPU Cloud": 0.10, "On-Prem": 0.14, "G&A": 0.10 },
    meritByLevel: { IC3: 0.04, IC4: 0.045, IC5: 0.05, IC6: 0.05, M3: 0.045, M4: 0.05, M5: 0.05, M6: 0.055 },
    meritEffective: "2027-01-01",
  },
];

export interface ScenarioResult {
  baselineHeadcount: number;
  endingHeadcount: number;
  annualCompUSD: number;
  monthlyRunRateUSD: number;
  dollarDelta: number;
  percentDelta: number;
  byDepartment: Record<Department, { baseline: number; ending: number; deltaCost: number }>;
  monthlyHeadcount: { month: string; headcount: number }[];
  monthlyPayroll: { month: string; cost: number }[];
}

function levelMidUSD(level: Level, location: Location) {
  return BAND_USD[level].mid * LOC_MULT[location];
}

function quarterStartMonth(q: ScenarioHire["quarter"]): number {
  // months from index 0 = Jun 2026
  const map: Record<ScenarioHire["quarter"], number> = {
    "Q3 2026": 1, // Jul
    "Q4 2026": 4, // Oct
    "Q1 2027": 7, // Jan
    "Q2 2027": 10, // Apr
  };
  return map[q];
}

export function computeScenario(s: Scenario): ScenarioResult {
  const baseline = EMPLOYEES.filter((e) => e.status === "Active" || e.status === "On Leave").length;
  const baselineAnnualUSD = EMPLOYEES.filter((e) => e.status !== "Contractor")
    .reduce((sum, e) => sum + e.salaryUSD, 0);

  // 12-month projection from Jun 2026
  const months: { month: string; headcount: number; cost: number }[] = [];
  const monthLabels = [
    "Jun 26","Jul 26","Aug 26","Sep 26","Oct 26","Nov 26","Dec 26",
    "Jan 27","Feb 27","Mar 27","Apr 27","May 27","Jun 27",
  ];
  let hc = baseline;
  let annualComp = baselineAnnualUSD;
  const deptHc: Record<Department, number> = {
    Engineering: EMPLOYEES.filter((e) => e.department === "Engineering" && e.status !== "Contractor").length,
    "GPU Cloud": EMPLOYEES.filter((e) => e.department === "GPU Cloud" && e.status !== "Contractor").length,
    "On-Prem": EMPLOYEES.filter((e) => e.department === "On-Prem" && e.status !== "Contractor").length,
    "G&A": EMPLOYEES.filter((e) => e.department === "G&A" && e.status !== "Contractor").length,
  };
  const deptCost: Record<Department, number> = { Engineering: 0, "GPU Cloud": 0, "On-Prem": 0, "G&A": 0 };
  for (const d of DEPARTMENTS) {
    deptCost[d] = EMPLOYEES.filter((e) => e.department === d && e.status !== "Contractor")
      .reduce((s, e) => s + e.salaryUSD, 0);
  }
  const baselineDeptHc = { ...deptHc };
  const baselineDeptCost = { ...deptCost };

  for (let m = 0; m < monthLabels.length; m++) {
    // Apply hires at quarter starts
    for (const h of s.hires) {
      if (quarterStartMonth(h.quarter) === m) {
        hc += h.count;
        deptHc[h.department] += h.count;
        const cost = h.count * levelMidUSD(h.level, h.location);
        annualComp += cost;
        deptCost[h.department] += cost;
      }
    }
    // Monthly attrition (per dept)
    for (const d of DEPARTMENTS) {
      const monthly = s.attrition[d] / 12;
      const loss = deptHc[d] * monthly;
      deptHc[d] -= loss;
      hc -= loss;
      const costLoss = deptCost[d] * monthly;
      deptCost[d] -= costLoss;
      annualComp -= costLoss;
    }
    // Merit at effective date (Jan 27 ~ m=7)
    if (monthLabels[m] === "Jan 27") {
      // Approximate uniform merit across population at avg of level merits
      const meritVals = Object.values(s.meritByLevel) as number[];
      const avgMerit = meritVals.reduce((a, b) => a + b, 0) / meritVals.length;
      for (const d of DEPARTMENTS) {
        deptCost[d] *= 1 + avgMerit;
      }
      annualComp *= 1 + avgMerit;
    }

    months.push({
      month: monthLabels[m],
      headcount: Math.round(hc),
      cost: Math.round(annualComp / 12),
    });
  }

  const ending = Math.round(hc);
  const annual = Math.round(annualComp);
  const byDepartment: ScenarioResult["byDepartment"] = {} as ScenarioResult["byDepartment"];
  for (const d of DEPARTMENTS) {
    byDepartment[d] = {
      baseline: baselineDeptHc[d],
      ending: Math.round(deptHc[d]),
      deltaCost: Math.round(deptCost[d] - baselineDeptCost[d]),
    };
  }

  return {
    baselineHeadcount: baseline,
    endingHeadcount: ending,
    annualCompUSD: annual,
    monthlyRunRateUSD: Math.round(annual / 12),
    dollarDelta: annual - baselineAnnualUSD,
    percentDelta: (annual - baselineAnnualUSD) / baselineAnnualUSD,
    byDepartment,
    monthlyHeadcount: months.map((m) => ({ month: m.month, headcount: m.headcount })),
    monthlyPayroll: months.map((m) => ({ month: m.month, cost: m.cost })),
  };
}

// ---------- Workflow ----------

export interface WorkflowStep {
  id: string;
  name: string;
  role: string;
  status: "Complete" | "In Progress" | "Pending" | "Skipped";
  completedAt?: string;
  actor?: string;
}

export interface AuditEntry {
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  comment: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

// ---------- GL ----------

export interface GLEntry {
  costCenter: string;
  account: "Wages" | "Employer Taxes" | "Benefits" | "Payroll Clearing";
  debit: number;
  credit: number;
  description: string;
}

export function buildGL(): GLEntry[] {
  const out: GLEntry[] = [];
  for (const d of DEPARTMENTS) {
    const rows = PAYROLL.filter((r) => r.department === d && r.included);
    const wages = rows.reduce((s, r) => s + r.grossPay, 0);
    const taxes = rows.reduce((s, r) => s + r.employerTaxes, 0);
    const benefits = rows.reduce((s, r) => s + r.benefits, 0);
    const cc = COST_CENTERS[d];
    out.push({ costCenter: cc, account: "Wages", debit: wages, credit: 0, description: `${d} semi-monthly wages` });
    out.push({ costCenter: cc, account: "Employer Taxes", debit: taxes, credit: 0, description: `${d} employer taxes` });
    out.push({ costCenter: cc, account: "Benefits", debit: benefits, credit: 0, description: `${d} benefits load` });
    out.push({ costCenter: cc, account: "Payroll Clearing", debit: 0, credit: wages + taxes + benefits, description: `${d} clearing offset` });
  }
  return out;
}

export const GL_ENTRIES = buildGL();

// Currency formatting helpers
export function fmtUSD(n: number, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, ...opts }).format(n);
}
export function fmtNum(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
export function fmtCur(n: number, c: Currency): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);
}
export function fmtPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}
