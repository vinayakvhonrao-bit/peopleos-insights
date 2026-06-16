import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/layout/AppShell";
import {
  PAYROLL, EMPLOYEES, SCENARIOS, computeScenario, DEPARTMENTS, monthlyRunRate,
  fmtUSD, fmtNum, fmtPct,
} from "@/lib/data";
import { Sparkles, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateInsights, type InsightsInput } from "@/lib/insights.functions";

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
  const consBurn = conservative.monthlyPayroll.reduce((s, m) => s + m.cost, 0);
  const growthBurn = growth.monthlyPayroll.reduce((s, m) => s + m.cost, 0);

  const topDeptGrowth = DEPARTMENTS
    .map((d) => ({ d, delta: growth.byDepartment[d].deltaCost }))
    .sort((a, b) => b.delta - a.delta)[0];

  const generateFn = useServerFn(generateInsights);
  const [commentary, setCommentary] = useState<string>("");
  const mutation = useMutation({
    mutationFn: (input: InsightsInput) => generateFn({ data: input }),
    onSuccess: (res) => {
      if (res.ok) setCommentary(res.commentary);
      else setCommentary(`⚠️ ${res.error}`);
    },
  });

  const runAi = () => {
    mutation.mutate({
      period: "2026-06-15 (semi-monthly)",
      activeWorkers: EMPLOYEES.filter((e) => e.status === "Active").length,
      totalWorkers: EMPLOYEES.length,
      monthlyRunRateUSD: runRate,
      intlPct,
      anomalyCount: anomalies.length,
      anomalyBreakdown: Object.entries(byType).map(([type, count]) => ({ type, count })),
      conservative: {
        endingHeadcount: conservative.endingHeadcount,
        annualCompUSD: conservative.annualCompUSD,
        percentDelta: conservative.percentDelta,
        cumulativeBurnUSD: consBurn,
      },
      growth: {
        endingHeadcount: growth.endingHeadcount,
        annualCompUSD: growth.annualCompUSD,
        percentDelta: growth.percentDelta,
        cumulativeBurnUSD: growthBurn,
      },
      topGrowthDept: { dept: topDeptGrowth.d, deltaCost: topDeptGrowth.delta },
    });
  };

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

      <SectionCard
        title="AI-Generated Executive Brief"
        description="Live call to Lovable AI Gateway (google/gemini-2.5-flash). Inputs: aggregated KPIs only. No PII."
        actions={
          <button
            onClick={runAi}
            disabled={mutation.isPending}
            className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md inline-flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {commentary ? "Regenerate" : "Generate Commentary"}
          </button>
        }
      >
        {!commentary && !mutation.isPending && (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-md">
            Click <strong>Generate Commentary</strong> to call the AI Gateway with the deterministic metrics below.
          </div>
        )}
        {mutation.isPending && (
          <div className="text-sm text-muted-foreground py-6 text-center inline-flex items-center justify-center gap-2 w-full">
            <Loader2 className="h-4 w-4 animate-spin" /> Generating executive brief…
          </div>
        )}
        {commentary && (
          <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {renderMarkdownLite(commentary)}
            <p className="text-xs text-muted-foreground mt-4 not-prose">
              Generated by Lovable AI Gateway. Re-run for a fresh paraphrase — underlying numbers do not change.
            </p>
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Deterministic Inputs Surfaced to AI">
          <ul className="text-sm space-y-1.5">
            <li><strong>Period:</strong> 2026-06-15 (semi-monthly)</li>
            <li><strong>Active workers:</strong> {fmtNum(EMPLOYEES.filter(e => e.status === "Active").length)} of {fmtNum(EMPLOYEES.length)}</li>
            <li><strong>Monthly run rate:</strong> {fmtUSD(runRate)}</li>
            <li><strong>International mix:</strong> {fmtPct(intlPct)}</li>
            <li><strong>Anomalies flagged:</strong> {fmtNum(anomalies.length)}</li>
            <li><strong>Conservative 12-mo burn:</strong> {fmtUSD(consBurn)} · ending HC {fmtNum(conservative.endingHeadcount)}</li>
            <li><strong>Growth 12-mo burn:</strong> {fmtUSD(growthBurn)} · ending HC {fmtNum(growth.endingHeadcount)}</li>
            <li><strong>Top growth dept:</strong> {topDeptGrowth.d} ({fmtUSD(topDeptGrowth.delta)})</li>
          </ul>
        </SectionCard>

        <SectionCard title="Payroll Anomaly Detection" description={`${anomalies.length} exceptions flagged this period`}>
          <ul className="space-y-2.5 text-sm">
            {Object.entries(byType).map(([k, v]) => (
              <li key={k} className="flex items-start gap-2 border-b border-border pb-2 last:border-0">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{k}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ruleExplanation(k)}</div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-amber-800 bg-amber-50 rounded px-2 py-0.5 ring-1 ring-inset ring-amber-200">{v}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function renderMarkdownLite(text: string) {
  // minimal: split paragraphs, bold **x**
  return text.split(/\n{2,}/).map((para, i) => (
    <p key={i}>
      {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
        chunk.startsWith("**") && chunk.endsWith("**")
          ? <strong key={j}>{chunk.slice(2, -2)}</strong>
          : <span key={j}>{chunk}</span>
      )}
    </p>
  ));
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
