import { createFileRoute } from "@tanstack/react-router";
import { AppShell, KpiCard, SectionCard } from "@/components/layout/AppShell";
import {
  EMPLOYEES, DEPARTMENTS, LOCATION_LIST, LEVEL_LIST, PAYROLL,
  monthlyRunRate, fmtUSD, fmtNum, tenureYears, tenureBand,
} from "@/lib/data";
import { BASELINE_PROJECTION, seedEventsForAllScenarios, flagNeedsApproval } from "@/lib/planning";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — NeoCloud PeopleOS" },
      { name: "description", content: "CHRO/CFO view of headcount, payroll run rate, attrition, and planning actions for NeoCloud Inc." },
    ],
  }),
  component: Dashboard,
});

// Enterprise, muted palette — navy / slate / steel with a single accent.
const C_NAVY = "#1e3a5f";
const C_STEEL = "#3b82a3";
const C_MIST = "#7aa6c2";
const C_FOG = "#bcd2e0";
const C_AMBER = "#cf8a3a";
const C_CLAY = "#8a5a3b";
const C_GRID = "#e5e9ef";
const C_AXIS = "#94a3b8";
const LEVEL_COLORS = [C_NAVY, "#26527d", C_STEEL, "#5f97b4", C_MIST, "#9bbcd0", C_FOG, "#d3e1eb"];

function Dashboard() {
  const total = EMPLOYEES.length;
  const active = EMPLOYEES.filter((e) => e.status === "Active").length;
  const intl = EMPLOYEES.filter((e) => ["Toronto", "London", "Bangalore"].includes(e.location)).length;
  const intlPct = (intl / total) * 100;
  const runRate = monthlyRunRate();
  const exceptions = PAYROLL.filter((r) => r.anomaly).length;
  const termPending = EMPLOYEES.filter((e) => e.status === "Termination Pending").length;

  // Trailing 12-month attrition: assumed ~9% annualized baseline + pending terms (deterministic).
  const trailingExits = Math.round(active * 0.092) + termPending;
  const attritionPct = (trailingExits / active) * 100;

  // Open planning actions = planned/approved events flagged for approval.
  const allEvents = seedEventsForAllScenarios();
  const openActions = allEvents.filter(flagNeedsApproval).length;

  const byDept = DEPARTMENTS.map((d) => ({
    name: d,
    headcount: EMPLOYEES.filter((e) => e.department === d).length,
  }));
  const byLoc = LOCATION_LIST.map((l) => ({
    name: l,
    headcount: EMPLOYEES.filter((e) => e.location === l).length,
  }));
  const byLevel = LEVEL_LIST.map((lv) => ({
    name: lv,
    headcount: EMPLOYEES.filter((e) => e.level === lv).length,
  }));
  const tenureBands = ["<1y", "1-3y", "3-5y", "5y+"] as const;
  const byTenure = tenureBands.map((b) => ({
    name: b,
    headcount: EMPLOYEES.filter((e) => tenureBand(tenureYears(e.hireDate)) === b).length,
  }));
  const payrollByDept = DEPARTMENTS.map((d) => ({
    name: d,
    cost: PAYROLL.filter((r) => r.department === d).reduce((s, r) => s + r.totalBurdened, 0) * 2,
  }));

  // 12-month projected headcount trend, baseline + light growth assumption layered on top.
  const trend = BASELINE_PROJECTION.map((row, i) => ({
    month: row.month,
    baseline: row.endingHC,
    planned: Math.round(row.endingHC * (1 + i * 0.006)), // gentle planned growth band
  }));

  return (
    <AppShell title="Executive Dashboard" subtitle="People Operations · CHRO & CFO View">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        <KpiCard label="Total Workers" value={fmtNum(total)} hint="All worker types" />
        <KpiCard label="Active Headcount" value={fmtNum(active)} hint={`${((active / total) * 100).toFixed(1)}% of workers`} />
        <KpiCard label="Monthly Run Rate" value={fmtUSD(runRate)} hint="Burdened, USD" />
        <KpiCard label="International HC" value={`${intlPct.toFixed(1)}%`} hint="Non-US locations" />
        <KpiCard label="Trailing Attrition" value={`${attritionPct.toFixed(1)}%`} hint="L12M, annualized" tone={attritionPct > 12 ? "warn" : "default"} />
        <KpiCard label="Payroll Exceptions" value={fmtNum(exceptions)} tone={exceptions > 0 ? "warn" : "good"} hint="Current preview period" />
        <KpiCard label="Open Planning Actions" value={fmtNum(openActions)} hint="Awaiting approval" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Headcount by Department" description="All worker types, current period">
          <ChartFrame>
            <BarChart data={byDept} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C_GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={C_AXIS} />
              <YAxis tick={{ fontSize: 12 }} stroke={C_AXIS} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(30,58,95,0.06)" }} />
              <Bar dataKey="headcount" fill={C_NAVY} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Headcount by Location" description="Distribution across regions">
          <ChartFrame>
            <BarChart data={byLoc} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C_GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={C_AXIS} />
              <YAxis tick={{ fontSize: 12 }} stroke={C_AXIS} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(30,58,95,0.06)" }} />
              <Bar dataKey="headcount" fill={C_STEEL} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Level Distribution" description="IC and management mix">
          <ChartFrame>
            <PieChart>
              <Pie data={byLevel} dataKey="headcount" nameKey="name" outerRadius={90} innerRadius={55} stroke="#fff" strokeWidth={1}>
                {byLevel.map((_, i) => (
                  <Cell key={i} fill={LEVEL_COLORS[i % LEVEL_COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip />
            </PieChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Tenure Distribution" description="Years with NeoCloud">
          <ChartFrame>
            <BarChart data={byTenure} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C_GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={C_AXIS} />
              <YAxis tick={{ fontSize: 12 }} stroke={C_AXIS} allowDecimals={false} />
              <Tooltip cursor={{ fill: "rgba(30,58,95,0.06)" }} />
              <Bar dataKey="headcount" fill={C_MIST} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="Payroll Cost by Department" description="Monthly burdened, USD">
          <ChartFrame>
            <BarChart data={payrollByDept} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C_GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={C_AXIS} />
              <YAxis tick={{ fontSize: 11 }} stroke={C_AXIS} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => fmtUSD(v)} cursor={{ fill: "rgba(30,58,95,0.06)" }} />
              <Bar dataKey="cost" fill={C_CLAY} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </SectionCard>

        <SectionCard title="12-Month Projected Headcount" description="Baseline vs. planned trajectory">
          <ChartFrame>
            <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke={C_GRID} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke={C_AXIS} />
              <YAxis tick={{ fontSize: 12 }} stroke={C_AXIS} allowDecimals={false} domain={["dataMin - 10", "dataMax + 10"]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="baseline" stroke={C_NAVY} strokeWidth={2} dot={{ r: 2 }} name="Baseline HC" />
              <Line type="monotone" dataKey="planned" stroke={C_AMBER} strokeWidth={2} dot={{ r: 2 }} name="Planned HC" />
            </LineChart>
          </ChartFrame>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function ChartFrame({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}
