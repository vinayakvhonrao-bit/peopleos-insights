// Foundation Data Management (FDM) — runtime-editable reference values.
// Workday concept: Setup / Tenant Configuration. Persisted to localStorage.
import { useSyncExternalStore } from "react";

export type FDMEntity = "departments" | "locations" | "jobProfiles" | "costCenters" | "compGrades" | "payGroups" | "jobLevels";

export interface FDMRow {
  id: string;
  code: string;
  name: string;
  attributes: Record<string, string>;
  active: boolean;
  createdAt: string;
}

export interface FDMState {
  departments: FDMRow[];
  locations: FDMRow[];
  jobProfiles: FDMRow[];
  costCenters: FDMRow[];
  compGrades: FDMRow[];
  payGroups: FDMRow[];
  jobLevels: FDMRow[];
}

const STORAGE_KEY = "neocloud.fdm.v1";

const SEED: FDMState = {
  departments: [
    { id: "d1", code: "ENG", name: "Engineering", attributes: { owner: "VP Engineering", capitalize: "Yes" }, active: true, createdAt: "2024-01-15" },
    { id: "d2", code: "GPU", name: "GPU Cloud", attributes: { owner: "SVP Cloud", capitalize: "Yes" }, active: true, createdAt: "2024-01-15" },
    { id: "d3", code: "ONP", name: "On-Prem", attributes: { owner: "VP Datacenter", capitalize: "Partial" }, active: true, createdAt: "2024-01-15" },
    { id: "d4", code: "GNA", name: "G&A", attributes: { owner: "CFO", capitalize: "No" }, active: true, createdAt: "2024-01-15" },
  ],
  locations: [
    { id: "l1", code: "SF", name: "San Francisco, CA", attributes: { country: "US", currency: "USD", timezone: "PT" }, active: true, createdAt: "2024-01-15" },
    { id: "l2", code: "SJ", name: "San Jose, CA", attributes: { country: "US", currency: "USD", timezone: "PT" }, active: true, createdAt: "2024-01-15" },
    { id: "l3", code: "REMUS", name: "Remote — US", attributes: { country: "US", currency: "USD", timezone: "Mixed" }, active: true, createdAt: "2024-01-15" },
    { id: "l4", code: "TOR", name: "Toronto, ON", attributes: { country: "CA", currency: "CAD", timezone: "ET" }, active: true, createdAt: "2024-01-15" },
    { id: "l5", code: "LON", name: "London, UK", attributes: { country: "GB", currency: "GBP", timezone: "GMT" }, active: true, createdAt: "2024-01-15" },
    { id: "l6", code: "BLR", name: "Bangalore, IN", attributes: { country: "IN", currency: "INR", timezone: "IST" }, active: true, createdAt: "2024-01-15" },
  ],
  jobProfiles: [
    { id: "j1", code: "SWE", name: "Software Engineer", attributes: { family: "Engineering / Software", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j2", code: "STAFF", name: "Staff Engineer", attributes: { family: "Engineering / Software", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j3", code: "EM", name: "Engineering Manager", attributes: { family: "Engineering / Management", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j4", code: "SRE", name: "Site Reliability Engineer", attributes: { family: "Engineering / SRE", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j5", code: "CPE", name: "Cloud Platform Engineer", attributes: { family: "Cloud Infrastructure", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j6", code: "GPUI", name: "GPU Infrastructure Engineer", attributes: { family: "Cloud Infrastructure", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j7", code: "DCE", name: "Datacenter Engineer", attributes: { family: "Datacenter Operations", flsa: "Non-Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j8", code: "PP", name: "People Partner", attributes: { family: "Human Resources", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j9", code: "FA", name: "Finance Analyst", attributes: { family: "Finance", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
    { id: "j10", code: "REC", name: "Recruiter", attributes: { family: "Talent Acquisition", flsa: "Exempt" }, active: true, createdAt: "2024-01-15" },
  ],
  costCenters: [
    { id: "c1", code: "CC-1000", name: "Engineering", attributes: { owner: "VP Eng", glAccount: "5100" }, active: true, createdAt: "2024-01-15" },
    { id: "c2", code: "CC-2000", name: "GPU Cloud", attributes: { owner: "SVP Cloud", glAccount: "5200" }, active: true, createdAt: "2024-01-15" },
    { id: "c3", code: "CC-3000", name: "On-Prem", attributes: { owner: "VP DC", glAccount: "5300" }, active: true, createdAt: "2024-01-15" },
    { id: "c4", code: "CC-9000", name: "G&A", attributes: { owner: "CFO", glAccount: "5900" }, active: true, createdAt: "2024-01-15" },
  ],
  compGrades: [
    { id: "g1", code: "IC3", name: "IC3 — Senior", attributes: { minUSD: "130000", midUSD: "160000", maxUSD: "190000" }, active: true, createdAt: "2024-01-15" },
    { id: "g2", code: "IC4", name: "IC4 — Staff", attributes: { minUSD: "170000", midUSD: "205000", maxUSD: "240000" }, active: true, createdAt: "2024-01-15" },
    { id: "g3", code: "IC5", name: "IC5 — Principal", attributes: { minUSD: "210000", midUSD: "260000", maxUSD: "310000" }, active: true, createdAt: "2024-01-15" },
    { id: "g4", code: "IC6", name: "IC6 — Distinguished", attributes: { minUSD: "260000", midUSD: "320000", maxUSD: "390000" }, active: true, createdAt: "2024-01-15" },
    { id: "g5", code: "M3", name: "M3 — Manager", attributes: { minUSD: "180000", midUSD: "220000", maxUSD: "260000" }, active: true, createdAt: "2024-01-15" },
    { id: "g6", code: "M4", name: "M4 — Senior Manager", attributes: { minUSD: "230000", midUSD: "280000", maxUSD: "330000" }, active: true, createdAt: "2024-01-15" },
    { id: "g7", code: "M5", name: "M5 — Director", attributes: { minUSD: "290000", midUSD: "350000", maxUSD: "410000" }, active: true, createdAt: "2024-01-15" },
    { id: "g8", code: "M6", name: "M6 — Senior Director", attributes: { minUSD: "360000", midUSD: "440000", maxUSD: "520000" }, active: true, createdAt: "2024-01-15" },
  ],
  payGroups: [
    { id: "pg1", code: "US-SEMI", name: "US Semi-Monthly", attributes: { country: "US", currency: "USD", frequency: "Semi-Monthly", payDays: "15th & last" }, active: true, createdAt: "2024-01-15" },
    { id: "pg2", code: "US-HRLY", name: "US Hourly Biweekly", attributes: { country: "US", currency: "USD", frequency: "Biweekly", payDays: "Every other Friday" }, active: true, createdAt: "2024-01-15" },
    { id: "pg3", code: "CA-BIW", name: "Canada Biweekly", attributes: { country: "CA", currency: "CAD", frequency: "Biweekly", payDays: "Every other Friday" }, active: true, createdAt: "2024-01-15" },
    { id: "pg4", code: "UK-MTH", name: "UK Monthly", attributes: { country: "GB", currency: "GBP", frequency: "Monthly", payDays: "Last working day" }, active: true, createdAt: "2024-01-15" },
    { id: "pg5", code: "IN-MTH", name: "India Monthly", attributes: { country: "IN", currency: "INR", frequency: "Monthly", payDays: "Last working day" }, active: true, createdAt: "2024-01-15" },
  ],
  positions: [
    { id: "p1", code: "P-00142", name: "Staff Software Engineer — Compute Platform", attributes: { jobProfile: "STAFF", department: "ENG", location: "SF", headcount: "1", status: "Filled" }, active: true, createdAt: "2024-02-01" },
    { id: "p2", code: "P-00187", name: "GPU Infrastructure Engineer", attributes: { jobProfile: "GPUI", department: "GPU", location: "SJ", headcount: "1", status: "Open" }, active: true, createdAt: "2024-03-12" },
    { id: "p3", code: "P-00203", name: "Engineering Manager — SRE", attributes: { jobProfile: "EM", department: "ENG", location: "REMUS", headcount: "1", status: "Filled" }, active: true, createdAt: "2024-03-20" },
    { id: "p4", code: "P-00221", name: "Datacenter Engineer II", attributes: { jobProfile: "DCE", department: "ONP", location: "SJ", headcount: "2", status: "Open" }, active: true, createdAt: "2024-04-05" },
    { id: "p5", code: "P-00244", name: "People Partner — Engineering", attributes: { jobProfile: "PP", department: "GNA", location: "SF", headcount: "1", status: "Filled" }, active: true, createdAt: "2024-04-18" },
    { id: "p6", code: "P-00259", name: "Senior Recruiter — Tech", attributes: { jobProfile: "REC", department: "GNA", location: "REMUS", headcount: "1", status: "Open" }, active: true, createdAt: "2024-05-02" },
    { id: "p7", code: "P-00271", name: "Finance Analyst — FP&A", attributes: { jobProfile: "FA", department: "GNA", location: "TOR", headcount: "1", status: "Filled" }, active: true, createdAt: "2024-05-15" },
  ],
  jobLevels: [
    { id: "lv1", code: "L3", name: "L3 — Engineer", attributes: { track: "IC", grade: "IC3", yearsTypical: "2-4" }, active: true, createdAt: "2024-01-15" },
    { id: "lv2", code: "L4", name: "L4 — Senior Engineer", attributes: { track: "IC", grade: "IC3", yearsTypical: "4-7" }, active: true, createdAt: "2024-01-15" },
    { id: "lv3", code: "L5", name: "L5 — Staff Engineer", attributes: { track: "IC", grade: "IC4", yearsTypical: "7-10" }, active: true, createdAt: "2024-01-15" },
    { id: "lv4", code: "L6", name: "L6 — Principal Engineer", attributes: { track: "IC", grade: "IC5", yearsTypical: "10+" }, active: true, createdAt: "2024-01-15" },
    { id: "lv5", code: "L7", name: "L7 — Distinguished Engineer", attributes: { track: "IC", grade: "IC6", yearsTypical: "15+" }, active: true, createdAt: "2024-01-15" },
    { id: "lv6", code: "M4", name: "M4 — Manager", attributes: { track: "Management", grade: "M3", yearsTypical: "8+" }, active: true, createdAt: "2024-01-15" },
    { id: "lv7", code: "M5", name: "M5 — Senior Manager", attributes: { track: "Management", grade: "M4", yearsTypical: "10+" }, active: true, createdAt: "2024-01-15" },
    { id: "lv8", code: "M6", name: "M6 — Director", attributes: { track: "Management", grade: "M5", yearsTypical: "12+" }, active: true, createdAt: "2024-01-15" },
    { id: "lv9", code: "M7", name: "M7 — Senior Director", attributes: { track: "Management", grade: "M6", yearsTypical: "15+" }, active: true, createdAt: "2024-01-15" },
  ],
};

function load(): FDMState {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as FDMState;
  } catch {
    return SEED;
  }
}

let state: FDMState = load();
const listeners = new Set<() => void>();

function save() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const fdmStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(entity: FDMEntity, row: Omit<FDMRow, "id" | "createdAt">) {
    const id = `${entity[0]}${Date.now().toString(36)}`;
    const createdAt = new Date().toISOString().slice(0, 10);
    state = { ...state, [entity]: [...state[entity], { ...row, id, createdAt }] };
    save();
  },
  update(entity: FDMEntity, id: string, patch: Partial<FDMRow>) {
    state = {
      ...state,
      [entity]: state[entity].map((r) => (r.id === id ? { ...r, ...patch } : r)),
    };
    save();
  },
  remove(entity: FDMEntity, id: string) {
    state = { ...state, [entity]: state[entity].filter((r) => r.id !== id) };
    save();
  },
  reset() {
    state = SEED;
    save();
  },
};

export function useFDM(): FDMState {
  return useSyncExternalStore(
    fdmStore.subscribe,
    fdmStore.get,
    () => SEED,
  );
}

export const ENTITY_META: Record<FDMEntity, {
  label: string;
  singular: string;
  workdayObject: string;
  attributeFields: { key: string; label: string; placeholder?: string }[];
}> = {
  departments: {
    label: "Departments",
    singular: "Department",
    workdayObject: "Supervisory Organization root",
    attributeFields: [
      { key: "owner", label: "Org Owner", placeholder: "VP Engineering" },
      { key: "capitalize", label: "Capitalize Labor", placeholder: "Yes / No / Partial" },
    ],
  },
  locations: {
    label: "Locations",
    singular: "Location",
    workdayObject: "Location",
    attributeFields: [
      { key: "country", label: "Country", placeholder: "US" },
      { key: "currency", label: "Currency", placeholder: "USD" },
      { key: "timezone", label: "Timezone", placeholder: "PT" },
    ],
  },
  jobProfiles: {
    label: "Job Profiles",
    singular: "Job Profile",
    workdayObject: "Job Profile",
    attributeFields: [
      { key: "family", label: "Job Family", placeholder: "Engineering / Software" },
      { key: "flsa", label: "FLSA", placeholder: "Exempt / Non-Exempt" },
    ],
  },
  costCenters: {
    label: "Cost Centers",
    singular: "Cost Center",
    workdayObject: "Cost Center (Organization)",
    attributeFields: [
      { key: "owner", label: "Owner", placeholder: "CFO" },
      { key: "glAccount", label: "GL Account", placeholder: "5100" },
    ],
  },
  compGrades: {
    label: "Compensation Grades",
    singular: "Compensation Grade",
    workdayObject: "Compensation Grade / Grade Profile",
    attributeFields: [
      { key: "minUSD", label: "Min (USD)", placeholder: "130000" },
      { key: "midUSD", label: "Mid (USD)", placeholder: "160000" },
      { key: "maxUSD", label: "Max (USD)", placeholder: "190000" },
    ],
  },
  payGroups: {
    label: "Pay Groups",
    singular: "Pay Group",
    workdayObject: "Pay Group",
    attributeFields: [
      { key: "country", label: "Country", placeholder: "US" },
      { key: "currency", label: "Currency", placeholder: "USD" },
      { key: "frequency", label: "Frequency", placeholder: "Semi-Monthly / Biweekly / Monthly" },
      { key: "payDays", label: "Pay Days", placeholder: "15th & last" },
    ],
  },
  positions: {
    label: "Positions",
    singular: "Position",
    workdayObject: "Position (Position Management)",
    attributeFields: [
      { key: "jobProfile", label: "Job Profile", placeholder: "STAFF" },
      { key: "department", label: "Department", placeholder: "ENG" },
      { key: "location", label: "Location", placeholder: "SF" },
      { key: "headcount", label: "Headcount", placeholder: "1" },
      { key: "status", label: "Status", placeholder: "Filled / Open / Frozen" },
    ],
  },
  jobLevels: {
    label: "Job Levels",
    singular: "Job Level",
    workdayObject: "Management Level / Job Level",
    attributeFields: [
      { key: "track", label: "Career Track", placeholder: "IC / Management" },
      { key: "grade", label: "Default Comp Grade", placeholder: "IC4" },
      { key: "yearsTypical", label: "Typical Years Experience", placeholder: "7-10" },
    ],
  },
};
