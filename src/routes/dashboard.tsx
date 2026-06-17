import { createFileRoute } from "@tanstack/react-router";
import { AppShell, KpiCard, SectionCard } from "@/components/layout/AppShell";
import {
  EMPLOYEES, DEPARTMENTS, LOCATION_LIST, LEVEL_LIST, PAYROLL,
  monthlyRunRate, fmtUSD, fmtNum,
} from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — NeoCloud PeopleOS" },
      { name: "description", content: "People Ops, headcount and payroll summary for NeoCloud Inc. IPO readiness." },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["#1e3a5f", "#3b82a3", "#7aa6c2", "#bcd2e0", "#cf8a3a", "#8a5a3b"];

function Dashboard() {
  const active = EMPLOYEES.filter((e) => e.status === "Active").length;
  const total = EMPLOYEES.length;
  const intl = EMPLOYEES.filter((e) => ["Toronto","London","Bangalore"].includes(e.location)).length;
  const intlPct = (intl / total) * 100;
  const anomalies = PAYROLL.filter((r) => r.anomaly).length;
  const runRate = monthlyRunRate();
  const termPending = EMPLOYEES.filter((e) => e.status === "Termination Pending").length;
  const byStatus = [
    { name: "Active", count: EMPLOYEES.filter((e) => e.status === "Active").length },
    { name: "On Leave", count: EMPLOYEES.filter((e) => e.status === "On Leave").length },
    { name: "Termination Pending", count: EMPLOYEES.filter((e) => e.status === "Termination Pending").length },
    { name: "Contractor", count: EMPLOYEES.filter((e) => e.status === "Contractor").length },
  ];
  const termByDept = DEPARTMENTS.map((d) => ({
    name: d,
    count: EMPLOYEES.filter((e) => e.department === d && e.status === "Termination Pending").length,
  }));

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
  const payrollByDept = DEPARTMENTS.map((d) => ({
    name: d,
    cost: PAYROLL.filter((r) => r.department === d).reduce((s, r) => s + r.totalBurdened, 0) * 2,
  }));


  return (
    <AppShell title="Executive Dashboard" subtitle="People Operations · IPO Readiness">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <KpiCard label="Total Workers" value={fmtNum(total)} hint="All worker types" />
        <KpiCard label="Active Headcount" value={fmtNum(active)} hint={`${((active/total)*100).toFixed(1)}% of workers`} />
        <KpiCard label="Monthly Payroll Run Rate" value={fmtUSD(runRate)} hint="Burdened, USD" />
        <KpiCard label="International HC %" value={`${intlPct.toFixed(1)}%`} hint="Toronto, London, Bangalore" />
        <KpiCard label="Payroll Anomalies" value={fmtNum(anomalies)} tone="warn" hint="Current preview period" />
        <KpiCard label="Open Requisitions" value={fmtNum(openReqs)} hint="Approved, not yet filled" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Headcount by Department" description="All worker types, current period">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="headcount" fill="#1e3a5f" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Headcount by Location">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byLoc} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="headcount" fill="#3b82a3" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Level Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byLevel} dataKey="headcount" nameKey="name" outerRadius={90} innerRadius={50}>
                  {byLevel.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Worker Status Overview" description="Active, On Leave, Termination Pending, Contractor">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#8a5a3b" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Termination Pending by Department" description="Requires action before next payroll cycle">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termByDept} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#cf8a3a" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Monthly Payroll Cost by Department" description="Burdened, USD">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollByDept} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v/1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => fmtUSD(v)} />
                <Bar dataKey="cost" fill="#cf8a3a" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="IPO Readiness Notes" description="Curated indicators reviewed weekly">
          <ul className="text-sm space-y-2.5 text-foreground">
            <li className="flex justify-between gap-4 border-b border-border pb-2"><span className="text-muted-foreground">Compensation bands reviewed</span><span className="font-medium">Q1 2026 ✓</span></li>
            <li className="flex justify-between gap-4 border-b border-border pb-2"><span className="text-muted-foreground">SOX Payroll controls in place</span><span className="font-medium">Yes — Audit log live</span></li>
            <li className="flex justify-between gap-4 border-b border-border pb-2"><span className="text-muted-foreground">Workday migration cutover</span><span className="font-medium">Target 2026-12-01</span></li>
            <li className="flex justify-between gap-4 border-b border-border pb-2"><span className="text-muted-foreground">Pending data quality issues</span><span className="font-medium text-amber-700">{anomalies} flagged</span></li>
            <li className="flex justify-between gap-4"><span className="text-muted-foreground">International payroll providers</span><span className="font-medium">3 in production</span></li>
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
