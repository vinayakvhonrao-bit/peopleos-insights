import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, KpiCard, StatusBadge } from "@/components/layout/AppShell";
import {
  PAYROLL, GL_ENTRIES, DEPARTMENTS, LOCATION_LIST, EMPLOYEES, fmtUSD, fmtNum,
} from "@/lib/data";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll Preview & GL Posting — NeoCloud PeopleOS" },
      { name: "description", content: "Semi-monthly payroll preview, reconciliation, and GL posting for NeoCloud." },
    ],
  }),
  component: PayrollPage,
});

function PayrollPage() {
  const [onlyAnoms, setOnlyAnoms] = useState(false);
  const [dept, setDept] = useState<string>("");

  const rows = useMemo(() => PAYROLL.filter((r) => {
    if (onlyAnoms && !r.anomaly) return false;
    if (dept && r.department !== dept) return false;
    return true;
  }), [onlyAnoms, dept]);

  const totalGross = PAYROLL.reduce((s, r) => s + r.grossPay, 0);
  const totalTaxes = PAYROLL.reduce((s, r) => s + r.employerTaxes, 0);
  const totalBen = PAYROLL.reduce((s, r) => s + r.benefits, 0);
  const totalBurdened = PAYROLL.reduce((s, r) => s + r.totalBurdened, 0);
  const anomalyCount = PAYROLL.filter((r) => r.anomaly).length;
  const includedCount = PAYROLL.filter((r) => r.included).length;
  const activeCount = EMPLOYEES.filter((e) => e.status === "Active").length;

  const byDept = DEPARTMENTS.map((d) => {
    const r = PAYROLL.filter((x) => x.department === d);
    return {
      name: d,
      gross: r.reduce((s, x) => s + x.grossPay, 0),
      taxes: r.reduce((s, x) => s + x.employerTaxes, 0),
      benefits: r.reduce((s, x) => s + x.benefits, 0),
      burdened: r.reduce((s, x) => s + x.totalBurdened, 0),
    };
  });
  const byLoc = LOCATION_LIST.map((l) => {
    const r = PAYROLL.filter((x) => x.location === l);
    return {
      name: l,
      burdened: r.reduce((s, x) => s + x.totalBurdened, 0),
      count: r.filter((x) => x.included).length,
    };
  });

  return (
    <AppShell title="Payroll Preview & GL Posting" subtitle="Semi-Monthly · Period Ending 2026-06-15">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Period Gross" value={fmtUSD(totalGross)} hint="USD, all included workers" />
        <KpiCard label="Employer Taxes" value={fmtUSD(totalTaxes)} />
        <KpiCard label="Benefits Load" value={fmtUSD(totalBen)} />
        <KpiCard label="Total Burdened" value={fmtUSD(totalBurdened)} tone="good" />
        <KpiCard label="Anomalies Flagged" value={fmtNum(anomalyCount)} tone="warn" hint="Review before posting" />
      </div>

      <SectionCard title="Payroll Reconciliation" description="Compare active worker counts to payroll inclusion.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Metric</th>
                <th className="px-3 py-2 text-right font-medium">Count</th>
                <th className="px-3 py-2 text-left font-medium">Explanation</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border"><td className="px-3 py-2">Active workers</td><td className="px-3 py-2 text-right tabular-nums">{fmtNum(activeCount)}</td><td className="px-3 py-2 text-muted-foreground">From worker master data (status = Active)</td></tr>
              <tr className="border-t border-border"><td className="px-3 py-2">Workers included in payroll</td><td className="px-3 py-2 text-right tabular-nums">{fmtNum(includedCount)}</td><td className="px-3 py-2 text-muted-foreground">Active + Termination Pending</td></tr>
              <tr className="border-t border-border bg-muted/30">
                <td className="px-3 py-2 font-semibold">Difference</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtNum(includedCount - activeCount)}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  Contractors excluded ({EMPLOYEES.filter(e => e.status === "Contractor").length}) ·
                  On Leave excluded ({EMPLOYEES.filter(e => e.status === "On Leave").length}) ·
                  Termination Pending included ({EMPLOYEES.filter(e => e.status === "Termination Pending").length})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SectionCard title="Payroll Cost by Department">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2 text-left font-medium">Department</th><th className="px-3 py-2 text-right font-medium">Gross</th><th className="px-3 py-2 text-right font-medium">Taxes</th><th className="px-3 py-2 text-right font-medium">Benefits</th><th className="px-3 py-2 text-right font-medium">Burdened</th></tr>
            </thead>
            <tbody>
              {byDept.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(r.gross)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(r.taxes)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(r.benefits)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtUSD(r.burdened)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Payroll Cost by Location">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2 text-left font-medium">Location</th><th className="px-3 py-2 text-right font-medium">Workers</th><th className="px-3 py-2 text-right font-medium">Burdened (USD)</th></tr>
            </thead>
            <tbody>
              {byLoc.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.count)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(r.burdened)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      <SectionCard
        title="Employee-Level Payroll Preview"
        description={`${fmtNum(rows.length)} rows`}
        actions={
          <div className="flex items-center gap-3 text-xs">
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="border border-border rounded-md px-2 py-1 bg-background">
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <label className="inline-flex items-center gap-1.5">
              <input type="checkbox" checked={onlyAnoms} onChange={(e) => setOnlyAnoms(e.target.checked)} />
              Anomalies only
            </label>
          </div>
        }
      >
        <div className="overflow-x-auto border border-border rounded-md max-h-[520px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Emp ID</th>
                <th className="px-3 py-2 text-left font-medium">Worker</th>
                <th className="px-3 py-2 text-left font-medium">Dept</th>
                <th className="px-3 py-2 text-left font-medium">Location</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Gross</th>
                <th className="px-3 py-2 text-right font-medium">Taxes</th>
                <th className="px-3 py-2 text-right font-medium">Benefits</th>
                <th className="px-3 py-2 text-right font-medium">Burdened</th>
                <th className="px-3 py-2 text-left font-medium">Inclusion</th>
                <th className="px-3 py-2 text-left font-medium">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((r) => (
                <tr key={r.employeeId} className={`border-t border-border ${r.anomaly ? "bg-amber-50/40" : ""}`}>
                  <td className="px-3 py-1.5 font-mono">{r.employeeId}</td>
                  <td className="px-3 py-1.5 font-medium">{r.name}</td>
                  <td className="px-3 py-1.5">{r.department}</td>
                  <td className="px-3 py-1.5">{r.location}</td>
                  <td className="px-3 py-1.5"><StatusBadge status={r.status} /></td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.grossPay)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.employerTaxes)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtUSD(r.benefits)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">{fmtUSD(r.totalBurdened)}</td>
                  <td className="px-3 py-1.5">{r.included ? <span className="text-emerald-700">Included</span> : <span className="text-muted-foreground">Excluded</span>}</td>
                  <td className="px-3 py-1.5">
                    {r.anomaly ? (
                      <span className="inline-flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> {r.anomaly}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="General Ledger Posting" description="Period 2026-06-15 · Posted to ERP after sign-off">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Cost Center</th>
                <th className="px-3 py-2 text-left font-medium">Account</th>
                <th className="px-3 py-2 text-right font-medium">Debit</th>
                <th className="px-3 py-2 text-right font-medium">Credit</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {GL_ENTRIES.map((g, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{g.costCenter}</td>
                  <td className="px-3 py-2">{g.account}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.debit ? fmtUSD(g.debit) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.credit ? fmtUSD(g.credit) : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{g.description}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-muted/40 font-medium">
                <td className="px-3 py-2" colSpan={2}>Totals</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(GL_ENTRIES.reduce((s, g) => s + g.debit, 0))}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(GL_ENTRIES.reduce((s, g) => s + g.credit, 0))}</td>
                <td className="px-3 py-2 text-muted-foreground">Balanced posting</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
