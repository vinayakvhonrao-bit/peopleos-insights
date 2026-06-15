import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/layout/AppShell";
import {
  PAYROLL, EMPLOYEES, SCENARIOS, computeScenario, DEPARTMENTS, monthlyRunRate,
  fmtUSD, fmtNum, fmtPct,
} from "@/lib/data";
import { Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — NeoCloud PeopleOS" },
      { name: "description", content: "AI-generated executive commentary over deterministic People Ops and payroll outputs." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const anomalies = useMemo(() => PAYROLL.filter((r) => r.anomaly), []);
  const byType = anomalies.reduce<Record<string, number>>((acc, r) => {
    if (!r.anomaly) return acc;
    acc[r.anomaly] = (acc[r.anomaly] ?? 0) + 1;
    return acc;
  }, {});
  const conservative = computeScenario(SCENARIOS[0]);
  const growth = computeScenario(SCENARIOS[1]);
  const runRate = monthlyRunRate();
  const intlPct = EMPLOYEES.filter((e) => ["Toronto","London","Bangalore"].includes(e.location)).length / EMPLOYEES.length;

  const topDeptGrowth = DEPARTMENTS
    .map((d) => ({ d, delta: growth.byDepartment[d].deltaCost }))
    .sort((a, b) => b.delta - a.delta)[0];

  return (
    <AppShell title="AI Insights · Executive Commentary" subtitle="Bounded AI — summarizes structured outputs only">
      <div className="rounded-md border border-border bg-sky-50/50 text-sm px-4 py-3 mb-5 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 mt-0.5 text-sky-700 shrink-0" />
        <div>
          <span className="font-medium text-sky-900">Guardrail.</span>{" "}
          <span className="text-sky-900/80">
            AI does not make employment decisions or calculate payroll. All metrics, anomalies, scenario outputs, and GL postings are produced by deterministic application logic. AI summarizes only those structured outputs.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Executive Summary — CFO / CHRO Brief">
          <div className="prose prose-sm max-w-none text-sm leading-relaxed">
            <p>
              As of the 2026-06-15 semi-monthly period, NeoCloud has <strong>{fmtNum(EMPLOYEES.filter(e => e.status === "Active").length)} active workers</strong> across {fmtNum(EMPLOYEES.length)} total worker records. Burdened monthly payroll run rate is <strong>{fmtUSD(runRate)}</strong>, with international workforce representing <strong>{fmtPct(intlPct)}</strong> of headcount.
            </p>
            <p>
              The Conservative IPO Plan ends FY at <strong>{fmtNum(conservative.endingHeadcount)}</strong> workers and <strong>{fmtUSD(conservative.annualCompUSD)}</strong> annual comp ({fmtPct(conservative.percentDelta)} vs. baseline). The AI Growth Plan ends at <strong>{fmtNum(growth.endingHeadcount)}</strong> and <strong>{fmtUSD(growth.annualCompUSD)}</strong> ({fmtPct(growth.percentDelta)} vs. baseline), driven primarily by <strong>{topDeptGrowth.d}</strong> hiring.
            </p>
            <p>
              Control posture is acceptable for IPO readiness with <strong>{fmtNum(anomalies.length)}</strong> open payroll exceptions to clear before sign-off. No anomaly is yet material to the period total burdened cost.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Generated from deterministic metrics. Drafting model: Lovable AI Gateway (Gemini 3 Flash class). No employee names referenced; employee IDs used only where required for control follow-up.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Payroll Anomaly Detection" description={`${anomalies.length} exceptions flagged this period`}>
          <ul className="space-y-2.5 text-sm">
            {Object.entries(byType).map(([k, v]) => (
              <li key={k} className="flex items-start gap-2 border-b border-border pb-2 last:border-0">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{k}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ruleExplanation(k)}
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-amber-800 bg-amber-50 rounded px-2 py-0.5 ring-1 ring-inset ring-amber-200">{v}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Scenario Commentary">
          <div className="text-sm space-y-3 leading-relaxed">
            <p>
              <strong>Conservative IPO Plan</strong> adds {fmtNum(SCENARIOS[0].hires.reduce((s, h) => s + h.count, 0))} hires across 12 months with disciplined emphasis on Engineering and GPU Cloud. Projected ending headcount of {fmtNum(conservative.endingHeadcount)} keeps annual comp growth bounded to {fmtPct(conservative.percentDelta)}.
            </p>
            <p>
              <strong>AI Growth Plan</strong> adds {fmtNum(SCENARIOS[1].hires.reduce((s, h) => s + h.count, 0))} hires and front-loads GPU Cloud capacity with {fmtNum(SCENARIOS[1].hires.filter(h => h.department === "GPU Cloud").reduce((s, h) => s + h.count, 0))} GPU Cloud roles. Material P&L impact: <strong>{fmtUSD(growth.dollarDelta - conservative.dollarDelta)}</strong> incremental annual comp vs. Conservative.
            </p>
            <p>
              Bangalore concentration in the Growth plan ({fmtNum(SCENARIOS[1].hires.filter(h => h.location === "Bangalore").reduce((s, h) => s + h.count, 0))} hires) materially shifts the international mix and warrants Finance + Payroll capacity review.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Key Workforce & Payroll Risks">
          <ol className="text-sm list-decimal pl-5 space-y-2">
            <li><span className="font-medium">Compensation band drift.</span> {fmtNum(EMPLOYEES.filter(e => e.bandStatus === "Above Band").length)} workers are above band; refresh band review before next merit cycle.</li>
            <li><span className="font-medium">Termination Pending in payroll.</span> {fmtNum(EMPLOYEES.filter(e => e.status === "Termination Pending").length)} workers are still included this period — confirm last-day overrides with People Ops.</li>
            <li><span className="font-medium">International payroll variance.</span> Bangalore PF and UK NI calculations are simplified in this preview. Reconcile against local provider statements before posting.</li>
            <li><span className="font-medium">Scenario divergence.</span> The Growth plan's monthly run rate exits 12 months at <strong>{fmtUSD(growth.monthlyRunRateUSD)}</strong> vs. <strong>{fmtUSD(conservative.monthlyRunRateUSD)}</strong> — Finance to align with FP&A model.</li>
            <li><span className="font-medium">Data quality.</span> Manager assignment, cost center, and job profile coverage are 100% in the prototype; Workday migration should preserve these as required fields.</li>
          </ol>
        </SectionCard>
      </div>

      <SectionCard title="Generation Trigger"
        description="Outputs above are derived deterministically and re-summarized on demand. AI never authors numbers."
        actions={
          <button className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md inline-flex items-center gap-1.5 hover:bg-primary/90">
            <Sparkles className="h-3 w-3" /> Regenerate Commentary
          </button>
        }
      >
        <div className="text-xs text-muted-foreground">
          Inputs surfaced to the model: aggregated KPIs, scenario results, anomaly type/counts. PII excluded. Worker names are not passed to the model; employee IDs are passed only when control follow-up requires identification.
        </div>
      </SectionCard>
    </AppShell>
  );
}

function ruleExplanation(rule: string): string {
  const map: Record<string, string> = {
    "Termination Pending worker included in payroll": "Worker is still active in payroll but has a pending termination event. Confirm last-day and prorate.",
    "Pay deviation > 20% from expected": "This period's gross pay exceeds 120% of expected semi-monthly pay. Verify off-cycle, bonus, or true-up entries.",
    "New hire mid-period — prorate review": "Hire date falls inside the current period. Confirm proration logic and first-period inclusion.",
    "Salary above compensation band": "Worker's annual salary exceeds the comp band high. Trigger comp band review.",
    "Department-level cost deviation": "Worker's semi-monthly pay deviates materially from department average. Verify level, location, or off-cycle.",
  };
  return map[rule] ?? "Rule-based anomaly. Review supporting documentation.";
}
