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

      <SectionCard
        title="Employee-Level Payroll Preview"
        description={`${fmtNum(rows.length)} rows · Semi-Monthly Period Ending 2026-06-15`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      <SectionCard title="Employer Tax Composition (Period Total)" description="Roll-up of period employer taxes by component across all included workers.">
        {(() => {
          const totals = PAYROLL.reduce(
            (acc, r) => {
              acc.fica += r.taxBreakdown.fica;
              acc.sui += r.taxBreakdown.sui;
              acc.futa += r.taxBreakdown.futa;
              acc.ukNI += r.taxBreakdown.ukNI;
              acc.caCppEi += r.taxBreakdown.caCppEi;
              acc.inPF += r.taxBreakdown.inPF;
              return acc;
            },
            { fica: 0, sui: 0, futa: 0, ukNI: 0, caCppEi: 0, inPF: 0 },
          );
          const components = [
            { label: "US FICA (7.65%)", value: totals.fica, rule: "Cap $168,600" },
            { label: "CA SUI (6.2%)", value: totals.sui, rule: "Cap $7,000" },
            { label: "US FUTA (0.6%)", value: totals.futa, rule: "Cap $7,000" },
            { label: "UK Employer NI (13.8%)", value: totals.ukNI, rule: "Above ~$11,557 threshold" },
            { label: "Canada CPP + EI (~7.5%)", value: totals.caCppEi, rule: "Blended approximation" },
            { label: "India PF (12% of basic)", value: totals.inPF, rule: "Basic = 50% of gross" },
          ];
          const grand = components.reduce((s, c) => s + c.value, 0) || 1;
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {components.map((c) => (
                <div key={c.label} className="border border-border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-lg font-semibold tabular-nums mt-0.5">{fmtUSD(c.value)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.rule}</div>
                  <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(c.value / grand) * 100}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">{((c.value / grand) * 100).toFixed(1)}% of employer taxes</div>
                </div>
              ))}
            </div>
          );
        })()}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Employer Tax & Benefits Methodology"
          description="Approximations applied per worker location. Annual employer tax computed with statutory caps, then spread evenly across 24 semi-monthly periods."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Jurisdiction</th>
                  <th className="px-3 py-2 text-left font-medium">Applies to</th>
                  <th className="px-3 py-2 text-left font-medium">Employer Tax Rule</th>
                  <th className="px-3 py-2 text-left font-medium">Benefits</th>
                  <th className="px-3 py-2 text-right font-medium">Workers</th>
                  <th className="px-3 py-2 text-right font-medium">Period Taxes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { j: "US — California (SF, San Jose)", a: "FICA + CA SUI + FUTA", rule: "7.65% on first $168,600 + 6.2% on first $7,000 + 0.6% on first $7,000", ben: "10% of gross", locs: ["SF","San Jose"] },
                  { j: "US — Other (Remote-US)", a: "FICA + FUTA", rule: "7.65% on first $168,600 + 0.6% on first $7,000", ben: "10% of gross", locs: ["Remote-US"] },
                  { j: "United Kingdom — London", a: "Employer NI", rule: "13.8% on wages above ~$11,557 (≈ £9,100) secondary threshold", ben: "5% of gross", locs: ["London"] },
                  { j: "Canada — Toronto", a: "CPP + EI employer portion", rule: "~7.5% blended approximation of gross", ben: "5% of gross", locs: ["Toronto"] },
                  { j: "India — Bangalore", a: "Employer PF", rule: "12% of basic; basic = 50% of gross → 6% of gross", ben: "5% of gross", locs: ["Bangalore"] },
                ].map((r) => {
                  const subset = PAYROLL.filter((p) => r.locs.includes(p.location));
                  const workers = subset.filter((p) => p.included).length;
                  const taxes = subset.reduce((s, p) => s + p.employerTaxes, 0);
                  return (
                    <tr key={r.j} className="border-t border-border align-top">
                      <td className="px-3 py-2 font-medium">{r.j}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.a}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.rule}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.ben}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNum(workers)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(taxes)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Approximations only — not modeling statutory minutiae. Per-period taxes = annual employer tax with wage caps applied, divided by 24 semi-monthly periods. In Workday this maps to Payroll Tax Authorities, Tax Elections by Location, and Earning/Deduction setup per pay group.
          </p>
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
      </div>

      <SectionCard
        title="US Tax Detail — Full Composition"
        description="Decomposition of US payroll taxes for this period. Employer-side amounts flow into the burdened cost above; employee-side withholdings are shown for completeness (they reduce net pay, not employer cost)."
      >
        {(() => {
          const us = PAYROLL.filter((p) => ["SF","San Jose","Remote-US"].includes(p.location) && p.included);
          const ca = us.filter((p) => p.location === "SF" || p.location === "San Jose");
          // Employer side (derive SS/Medicare split from FICA 7.65% = 6.2 + 1.45)
          const ficaTotal = us.reduce((s, p) => s + p.taxBreakdown.fica, 0);
          const ss = ficaTotal * (6.2 / 7.65);
          const medicare = ficaTotal * (1.45 / 7.65);
          const futa = us.reduce((s, p) => s + p.taxBreakdown.futa, 0);
          const sui = ca.reduce((s, p) => s + p.taxBreakdown.sui, 0);
          // CA ETT: 0.1% on first $7,000 (employer)
          const ett = ca.reduce((s, p) => {
            const emp = EMPLOYEES.find((e) => e.id === p.employeeId);
            if (!emp) return s;
            return s + (Math.min(emp.salaryUSD, 7000) * 0.001) / 24;
          }, 0);

          // Employee side estimates (period, USD). Informational only — Workday Payroll computes via tax engine.
          const periodGrossUS = us.reduce((s, p) => s + p.grossPay, 0);
          const periodGrossCA = ca.reduce((s, p) => s + p.grossPay, 0);
          // Federal income tax: very rough effective ~18% on supplemental wages assumption for prototype
          const eeFedIncome = us.reduce((s, p) => {
            const emp = EMPLOYEES.find((e) => e.id === p.employeeId);
            if (!emp) return s;
            const annual = emp.salaryUSD;
            // Effective rate buckets (married filing jointly approximation)
            const eff = annual < 100000 ? 0.12 : annual < 200000 ? 0.18 : annual < 400000 ? 0.24 : 0.30;
            return s + p.grossPay * eff;
          }, 0);
          const eeSS = periodGrossUS * (6.2 / 7.65) * 0 + ficaTotal * (6.2 / 7.65); // mirror of employer SS
          const eeMedicare = ficaTotal * (1.45 / 7.65);
          const eeAddlMedicare = us.reduce((s, p) => {
            const emp = EMPLOYEES.find((e) => e.id === p.employeeId);
            if (!emp) return s;
            // 0.9% on wages above $200k (single threshold)
            const over = Math.max(0, emp.salaryUSD - 200000);
            return s + (over * 0.009) / 24;
          }, 0);
          // CA PIT: tiered effective ~6%
          const eeCAPIT = ca.reduce((s, p) => {
            const emp = EMPLOYEES.find((e) => e.id === p.employeeId);
            if (!emp) return s;
            const eff = emp.salaryUSD < 150000 ? 0.05 : emp.salaryUSD < 300000 ? 0.075 : 0.093;
            return s + p.grossPay * eff;
          }, 0);
          // CA SDI: 1.1% no cap as of 2024+
          const eeCASDI = periodGrossCA * 0.011;

          const employer = [
            { label: "Federal — Social Security (OASDI)", rate: "6.20%", base: "First $168,600 of wages", value: ss },
            { label: "Federal — Medicare (HI)", rate: "1.45%", base: "All wages, no cap", value: medicare },
            { label: "Federal — FUTA", rate: "0.60%", base: "First $7,000 of wages", value: futa },
            { label: "California — SUI", rate: "6.20%", base: "First $7,000 (CA workers only)", value: sui },
            { label: "California — ETT (Employment Training Tax)", rate: "0.10%", base: "First $7,000 (CA workers only)", value: ett },
          ];
          const employerTotal = employer.reduce((s, c) => s + c.value, 0) || 1;

          const employee = [
            { label: "Federal Income Tax Withholding", rate: "~12–30% tiered", base: "Supplemental withholding approximation by salary band", value: eeFedIncome },
            { label: "Employee Social Security", rate: "6.20%", base: "First $168,600 of wages", value: eeSS },
            { label: "Employee Medicare", rate: "1.45%", base: "All wages, no cap", value: eeMedicare },
            { label: "Additional Medicare", rate: "0.90%", base: "Wages above $200,000 (single)", value: eeAddlMedicare },
            { label: "California PIT (State Income Tax)", rate: "~5–9.3% tiered", base: "CA workers only", value: eeCAPIT },
            { label: "California SDI", rate: "1.10%", base: "All CA wages, no cap (2024+)", value: eeCASDI },
          ];
          const employeeTotal = employee.reduce((s, c) => s + c.value, 0);

          return (
            <div className="space-y-5">
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="text-sm font-semibold">Employer-Paid (included in burdened cost)</h4>
                  <div className="text-xs text-muted-foreground">Period total: <span className="font-semibold tabular-nums text-foreground">{fmtUSD(employerTotal)}</span></div>
                </div>
                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Component</th>
                        <th className="px-3 py-2 text-left font-medium">Rate</th>
                        <th className="px-3 py-2 text-left font-medium">Wage Base</th>
                        <th className="px-3 py-2 text-right font-medium">Period Amount</th>
                        <th className="px-3 py-2 text-right font-medium">% of US Employer Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employer.map((c) => (
                        <tr key={c.label} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{c.label}</td>
                          <td className="px-3 py-2 tabular-nums">{c.rate}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.base}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(c.value)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{((c.value / employerTotal) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h4 className="text-sm font-semibold">Employee-Paid Withholdings <span className="text-xs font-normal text-muted-foreground">(informational — reduce net pay, not employer cost)</span></h4>
                  <div className="text-xs text-muted-foreground">Period total: <span className="font-semibold tabular-nums text-foreground">{fmtUSD(employeeTotal)}</span></div>
                </div>
                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Component</th>
                        <th className="px-3 py-2 text-left font-medium">Rate</th>
                        <th className="px-3 py-2 text-left font-medium">Wage Base / Notes</th>
                        <th className="px-3 py-2 text-right font-medium">Period Estimate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.map((c) => (
                        <tr key={c.label} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{c.label}</td>
                          <td className="px-3 py-2 tabular-nums">{c.rate}</td>
                          <td className="px-3 py-2 text-muted-foreground">{c.base}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(c.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Estimates use simplified effective-rate bands for prototype clarity. In Workday Payroll, employee withholdings are computed by the embedded tax engine driven by Federal W-4 elections, state withholding certificates (CA DE 4), and local tax authorities mapped per Pay Group and Work Location.
                </p>
              </div>
            </div>
          );
        })()}
      </SectionCard>
    </AppShell>
  );
}
