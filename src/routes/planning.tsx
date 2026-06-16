import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, KpiCard } from "@/components/layout/AppShell";
import {
  SCENARIOS, DEPARTMENTS, LOCATION_LIST, LEVEL_LIST,
  fmtUSD, fmtNum, fmtPct, type Department, type Location, type Level,
} from "@/lib/data";
import {
  MONTHS, BASELINE, BASELINE_PROJECTION, projectScenario, seedEventsForAllScenarios,
  flagNeedsApproval, avgSalaryFor,
  type PlanEvent, type MonthLabel, type EventStatus, type EventKind,
  type HireEvent, type TermEvent, type TransferEvent, type CompEvent, type AttritionType, type CompChangeType,
} from "@/lib/planning";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Workforce Planning — NeoCloud PeopleOS" },
      { name: "description", content: "Model hires, terminations, transfers and comp changes across 12-month scenarios." },
    ],
  }),
  component: PlanningPage,
});

const STATUSES: EventStatus[] = ["Planned", "Approved", "Deferred"];
const KINDS: EventKind[] = ["Hire", "Termination", "Transfer", "Compensation"];
const ATTR_TYPES: AttritionType[] = ["Assumed attrition", "Planned termination", "Backfill required", "No backfill"];
const COMP_TYPES: CompChangeType[] = ["Merit", "Promotion", "Market adjustment", "Retention adjustment"];

function statusTone(s: EventStatus): "ok" | "warn" | "danger" | "neutral" {
  if (s === "Approved") return "ok";
  if (s === "Deferred") return "neutral";
  return "warn";
}
function badgeClass(tone: ReturnType<typeof statusTone>) {
  if (tone === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (tone === "warn") return "bg-amber-50 text-amber-700 border-amber-200";
  if (tone === "danger") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function PlanningPage() {
  const [events, setEvents] = useState<PlanEvent[]>(() => seedEventsForAllScenarios());
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const [showAdd, setShowAdd] = useState(false);

  const scenarioResults = useMemo(() => {
    return SCENARIOS.map((s) => {
      const evts = events.filter((e) => e.scenarioId === s.id);
      const proj = projectScenario(evts);
      return { scenario: s, events: evts, projection: proj };
    });
  }, [events]);

  const active = scenarioResults.find((r) => r.scenario.id === activeId)!;

  // KPIs from active scenario
  const lastRow = active.projection[active.projection.length - 1];
  const baselineLast = BASELINE_PROJECTION[BASELINE_PROJECTION.length - 1];
  const totalBurn12 = active.projection.reduce((s, r) => s + r.fullyBurdened, 0);
  const baselineBurn12 = BASELINE_PROJECTION.reduce((s, r) => s + r.fullyBurdened, 0);

  const addEvent = (e: PlanEvent) => setEvents((prev) => [...prev, e]);
  const updateStatus = (id: string, status: EventStatus) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? ({ ...e, status } as PlanEvent) : e)));
  const removeEvent = (id: string) => setEvents((prev) => prev.filter((e) => e.id !== id));

  return (
    <AppShell title="Workforce Planning" subtitle="12-Month Scenario Modeling · Conservative IPO vs AI Growth">
      {/* Scenario selector strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold text-muted-foreground">Scenario</span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                activeId === s.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground hover:bg-accent"
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={() => setActiveId("baseline")}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              activeId === "baseline"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:bg-accent"
            }`}
          >
            Baseline (no events)
          </button>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={activeId === "baseline"}>
              <Plus className="h-4 w-4 mr-1" /> Add planning event
            </Button>
          </DialogTrigger>
          <AddEventDialog
            scenarioId={activeId === "baseline" ? SCENARIOS[0].id : activeId}
            onClose={() => setShowAdd(false)}
            onCreate={(e) => { addEvent(e); setShowAdd(false); }}
          />
        </Dialog>
      </div>

      {/* KPI strip */}
      {activeId !== "baseline" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <KpiCard label="Baseline HC" value={fmtNum(BASELINE.headcount)} />
          <KpiCard
            label="Ending HC (Jun 27)"
            value={fmtNum(lastRow.endingHC)}
            hint={`${lastRow.endingHC >= baselineLast.endingHC ? "+" : ""}${fmtNum(lastRow.endingHC - baselineLast.endingHC)} vs baseline`}
            tone={lastRow.endingHC > baselineLast.endingHC ? "warn" : "neutral"}
          />
          <KpiCard label="Monthly Burn" value={fmtUSD(lastRow.fullyBurdened)} hint="Fully burdened" />
          <KpiCard
            label="12-Mo Burn"
            value={fmtUSD(totalBurn12)}
            hint={`+${fmtUSD(totalBurn12 - baselineBurn12)} vs baseline`}
            tone="warn"
          />
          <KpiCard
            label="Gross Payroll (mo)"
            value={fmtUSD(lastRow.grossPayroll)}
            hint={`Taxes ${fmtUSD(lastRow.employerTaxes)} · Benefits ${fmtUSD(lastRow.benefits)}`}
          />
          <KpiCard
            label="Events in plan"
            value={fmtNum(active.events.length)}
            hint={`${active.events.filter((e) => e.status === "Approved").length} approved · ${active.events.filter((e) => flagNeedsApproval(e)).length} need approval`}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <KpiCard label="Baseline HC" value={fmtNum(BASELINE.headcount)} />
          <KpiCard label="Gross Annual" value={fmtUSD(BASELINE.grossAnnual)} />
          <KpiCard label="Fully Burdened (annual)" value={fmtUSD(BASELINE.burdenedAnnual)} />
          <KpiCard label="Monthly Run Rate" value={fmtUSD(BASELINE.burdenedAnnual / 12)} />
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Planning Events</TabsTrigger>
          <TabsTrigger value="projection">12-Month Projection</TabsTrigger>
          <TabsTrigger value="compare">Scenario Compare</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
        </TabsList>

        {/* ---------------- OVERVIEW ---------------- */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Headcount Trend — All Scenarios">
              <ChartHcTrend scenarioResults={scenarioResults} />
            </SectionCard>
            <SectionCard title="Monthly Fully Burdened Cost — All Scenarios">
              <ChartCostTrend scenarioResults={scenarioResults} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Department Headcount Delta vs Baseline">
              <ChartDeptHcDelta scenarioResults={scenarioResults} />
            </SectionCard>
            <SectionCard title="Department Cost Delta vs Baseline (monthly burdened)">
              <ChartDeptCostDelta scenarioResults={scenarioResults} />
            </SectionCard>
          </div>

          <SectionCard title="Executive Summary" description="Auto-generated from scenario projections">
            <ExecutiveSummary scenarioResults={scenarioResults} />
          </SectionCard>
        </TabsContent>

        {/* ---------------- EVENTS ---------------- */}
        <TabsContent value="events" className="mt-4">
          <SectionCard
            title={`Planning Events — ${activeId === "baseline" ? "Baseline (none)" : active.scenario.name}`}
            description="Each event is a forecasted change. Master worker data is not modified until approved & posted."
          >
            {activeId === "baseline" ? (
              <div className="text-sm text-muted-foreground">Baseline has no planning events. Switch to a scenario to view or add events.</div>
            ) : (
              <EventsTable
                events={active.events}
                onStatusChange={updateStatus}
                onDelete={removeEvent}
              />
            )}
          </SectionCard>
        </TabsContent>

        {/* ---------------- PROJECTION ---------------- */}
        <TabsContent value="projection" className="mt-4 space-y-4">
          <SectionCard
            title={`12-Month Projection — ${activeId === "baseline" ? "Baseline" : active.scenario.name}`}
            description="Starting HC, hires, exits, transfers, ending HC, gross payroll, employer taxes, benefits, fully burdened cost, monthly burn, and Δ vs baseline."
          >
            <ProjectionTable rows={activeId === "baseline" ? BASELINE_PROJECTION : active.projection} />
          </SectionCard>

          <SectionCard title="Monthly Burn Impact vs Baseline">
            <ChartBurnImpact
              scenarioRows={activeId === "baseline" ? BASELINE_PROJECTION : active.projection}
              scenarioName={activeId === "baseline" ? "Baseline" : active.scenario.name}
            />
          </SectionCard>
        </TabsContent>

        {/* ---------------- COMPARE ---------------- */}
        <TabsContent value="compare" className="mt-4">
          <SectionCard title="Baseline vs Conservative IPO vs AI Growth" description="Side-by-side comparison of the 12-month outputs">
            <CompareTable scenarioResults={scenarioResults} />
          </SectionCard>
        </TabsContent>

        {/* ---------------- ASSUMPTIONS ---------------- */}
        <TabsContent value="assumptions" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {SCENARIOS.map((s) => (
              <SectionCard key={s.id} title={`${s.name} — Assumptions`} description={s.description}>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Annual Attrition by Department</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DEPARTMENTS.map((d) => (
                        <div key={d} className="flex justify-between border-b border-border py-1">
                          <span className="text-muted-foreground">{d}</span>
                          <span className="tabular-nums font-medium">{fmtPct(s.attrition[d])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Merit Increase by Level (effective {s.meritEffective})</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(s.meritByLevel).map(([lv, v]) => (
                        <div key={lv} className="flex justify-between border-b border-border py-1">
                          <span className="text-muted-foreground">{lv}</span>
                          <span className="tabular-nums font-medium">{fmtPct(v as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t border-border pt-2">
                    Owner: <span className="text-foreground font-medium">{s.owner}</span>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

// ----------------- Sub-components -----------------

function EventsTable({
  events, onStatusChange, onDelete,
}: { events: PlanEvent[]; onStatusChange: (id: string, s: EventStatus) => void; onDelete: (id: string) => void }) {
  const [kindFilter, setKindFilter] = useState<EventKind | "All">("All");
  const filtered = events.filter((e) => kindFilter === "All" || e.kind === kindFilter);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs uppercase font-semibold text-muted-foreground">Filter</span>
        {(["All", ...KINDS] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKindFilter(k as EventKind | "All")}
            className={`px-2.5 py-1 text-xs rounded-md border ${
              kindFilter === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Event ID</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Details</th>
              <th className="px-3 py-2 text-left font-medium">Effective</th>
              <th className="px-3 py-2 text-right font-medium">Count</th>
              <th className="px-3 py-2 text-right font-medium">Comp Impact (annual)</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Flag</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const flagged = flagNeedsApproval(e);
              return (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-mono text-xs">{e.id}</td>
                  <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{e.kind}</Badge></td>
                  <td className="px-3 py-2">{describeEvent(e)}</td>
                  <td className="px-3 py-2 tabular-nums">{effectiveMonth(e)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{eventCount(e)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{compImpactLabel(e)}</td>
                  <td className="px-3 py-2">
                    <Select value={e.status} onValueChange={(v) => onStatusChange(e.id, v as EventStatus)}>
                      <SelectTrigger className={`h-7 w-32 text-xs ${badgeClass(statusTone(e.status))}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    {flagged ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" /> Needs additional approval
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onDelete(e.id)}>Delete</Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground text-sm">No events</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function describeEvent(e: PlanEvent): string {
  if (e.kind === "Hire") return `${e.count}× ${e.level} ${e.department} @ ${e.location} · ${fmtUSD(e.annualSalaryUSD)}/yr`;
  if (e.kind === "Termination") return `${e.count}× ${e.level} ${e.department} @ ${e.location} · ${e.attritionType}${e.backfillMonth ? ` → backfill ${e.backfillMonth}` : ""}`;
  if (e.kind === "Transfer") return `${e.worker} · ${e.fromDept}/${e.fromLocation} → ${e.toDept}/${e.toLocation} · Δ comp ${fmtPct(e.compChangePct)}`;
  return `${e.population} · ${e.changeType} +${fmtPct(e.increasePct)} → ${fmtUSD(e.newAnnualSalaryUSD)} (${e.affectedCount} ppl)`;
}
function effectiveMonth(e: PlanEvent): string {
  if (e.kind === "Hire") return e.startMonth;
  return (e as TermEvent | TransferEvent | CompEvent).month;
}
function eventCount(e: PlanEvent): number {
  if (e.kind === "Hire" || e.kind === "Termination") return e.count;
  if (e.kind === "Transfer") return 1;
  return e.affectedCount;
}
function compImpactLabel(e: PlanEvent): string {
  if (e.kind === "Hire") return `+${fmtUSD(e.count * e.annualSalaryUSD)}`;
  if (e.kind === "Termination") {
    const drop = e.count * e.exitingSalaryUSD;
    if (e.attritionType === "Backfill required") return `−${fmtUSD(drop)} / +${fmtUSD(drop)}`;
    return `−${fmtUSD(drop)}`;
  }
  if (e.kind === "Transfer") return `+${fmtUSD(e.currentSalaryUSD * e.compChangePct)}`;
  return `+${fmtUSD(e.affectedCount * e.newAnnualSalaryUSD * e.increasePct / (1 + e.increasePct))}`;
}

function ProjectionTable({ rows }: { rows: ReturnType<typeof projectScenario> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-2 py-2 text-left font-medium">Month</th>
            <th className="px-2 py-2 text-right font-medium">Start HC</th>
            <th className="px-2 py-2 text-right font-medium">Hires</th>
            <th className="px-2 py-2 text-right font-medium">Exits</th>
            <th className="px-2 py-2 text-right font-medium">Trans In</th>
            <th className="px-2 py-2 text-right font-medium">Trans Out</th>
            <th className="px-2 py-2 text-right font-medium">End HC</th>
            <th className="px-2 py-2 text-right font-medium">Gross Payroll</th>
            <th className="px-2 py-2 text-right font-medium">Employer Tax</th>
            <th className="px-2 py-2 text-right font-medium">Benefits</th>
            <th className="px-2 py-2 text-right font-medium">Fully Burdened</th>
            <th className="px-2 py-2 text-right font-medium">Monthly Burn</th>
            <th className="px-2 py-2 text-right font-medium">Δ vs Baseline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month} className="border-t border-border">
              <td className="px-2 py-1.5 font-medium">{r.month}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{fmtNum(r.startingHC)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-emerald-700">{r.hires ? `+${r.hires}` : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums text-rose-700">{r.exits ? `−${r.exits}` : "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.transfersIn || "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{r.transfersOut || "—"}</td>
              <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{fmtNum(r.endingHC)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{fmtUSD(r.grossPayroll)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{fmtUSD(r.employerTaxes)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{fmtUSD(r.benefits)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums font-semibold">{fmtUSD(r.fullyBurdened)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{fmtUSD(r.monthlyBurn)}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums ${r.changeVsBaseline > 0 ? "text-amber-700" : r.changeVsBaseline < 0 ? "text-emerald-700" : ""}`}>
                {r.changeVsBaseline === 0 ? "—" : `${r.changeVsBaseline > 0 ? "+" : ""}${fmtUSD(r.changeVsBaseline)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Charts ----
const SCENARIO_COLORS: Record<string, string> = {
  "sc-conservative": "#1e3a5f",
  "sc-growth": "#cf8a3a",
  baseline: "#64748b",
};

function ChartHcTrend({ scenarioResults }: { scenarioResults: Array<{ scenario: { id: string; name: string }; projection: ReturnType<typeof projectScenario> }> }) {
  const data = MONTHS.map((m, i) => {
    const row: Record<string, string | number> = { month: m, Baseline: BASELINE_PROJECTION[i].endingHC };
    for (const r of scenarioResults) row[r.scenario.name] = r.projection[i].endingHC;
    return row;
  });
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Baseline" stroke="#64748b" strokeDasharray="4 4" strokeWidth={2} dot={false} />
          {scenarioResults.map((r) => (
            <Line key={r.scenario.id} type="monotone" dataKey={r.scenario.name} stroke={SCENARIO_COLORS[r.scenario.id]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartCostTrend({ scenarioResults }: { scenarioResults: Array<{ scenario: { id: string; name: string }; projection: ReturnType<typeof projectScenario> }> }) {
  const data = MONTHS.map((m, i) => {
    const row: Record<string, string | number> = { month: m, Baseline: BASELINE_PROJECTION[i].fullyBurdened };
    for (const r of scenarioResults) row[r.scenario.name] = r.projection[i].fullyBurdened;
    return row;
  });
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
          <Tooltip formatter={(v: number) => fmtUSD(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Baseline" stroke="#64748b" strokeDasharray="4 4" strokeWidth={2} dot={false} />
          {scenarioResults.map((r) => (
            <Line key={r.scenario.id} type="monotone" dataKey={r.scenario.name} stroke={SCENARIO_COLORS[r.scenario.id]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartDeptHcDelta({ scenarioResults }: { scenarioResults: Array<{ scenario: { id: string; name: string }; projection: ReturnType<typeof projectScenario> }> }) {
  const data = DEPARTMENTS.map((d) => {
    const row: Record<string, string | number> = { name: d };
    for (const r of scenarioResults) {
      const last = r.projection[r.projection.length - 1];
      row[r.scenario.name] = last.byDept[d].hc - BASELINE.byDept[d].hc;
    }
    return row;
  });
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {scenarioResults.map((r) => (
            <Bar key={r.scenario.id} dataKey={r.scenario.name} fill={SCENARIO_COLORS[r.scenario.id]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartDeptCostDelta({ scenarioResults }: { scenarioResults: Array<{ scenario: { id: string; name: string }; projection: ReturnType<typeof projectScenario> }> }) {
  const data = DEPARTMENTS.map((d) => {
    const row: Record<string, string | number> = { name: d };
    const baseDept = BASELINE_PROJECTION[BASELINE_PROJECTION.length - 1].byDept[d].burdened;
    for (const r of scenarioResults) {
      const last = r.projection[r.projection.length - 1];
      row[r.scenario.name] = last.byDept[d].burdened - baseDept;
    }
    return row;
  });
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
          <Tooltip formatter={(v: number) => fmtUSD(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {scenarioResults.map((r) => (
            <Bar key={r.scenario.id} dataKey={r.scenario.name} fill={SCENARIO_COLORS[r.scenario.id]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartBurnImpact({ scenarioRows, scenarioName }: { scenarioRows: ReturnType<typeof projectScenario>; scenarioName: string }) {
  const data = scenarioRows.map((r, i) => ({
    month: r.month,
    [scenarioName]: r.fullyBurdened,
    Baseline: BASELINE_PROJECTION[i].fullyBurdened,
    Delta: r.fullyBurdened - BASELINE_PROJECTION[i].fullyBurdened,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
          <Tooltip formatter={(v: number) => fmtUSD(v)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Delta" fill="#cf8a3a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Compare table ----
function CompareTable({ scenarioResults }: { scenarioResults: Array<{ scenario: { id: string; name: string; owner: string }; events: PlanEvent[]; projection: ReturnType<typeof projectScenario> }> }) {
  const all = [
    { name: "Baseline", owner: "—", events: [] as PlanEvent[], projection: BASELINE_PROJECTION },
    ...scenarioResults.map((r) => ({ name: r.scenario.name, owner: r.scenario.owner, events: r.events, projection: r.projection })),
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Scenario</th>
            <th className="px-3 py-2 text-left font-medium">Owner</th>
            <th className="px-3 py-2 text-right font-medium">Events</th>
            <th className="px-3 py-2 text-right font-medium">Ending HC</th>
            <th className="px-3 py-2 text-right font-medium">Δ HC</th>
            <th className="px-3 py-2 text-right font-medium">Ending Monthly Burn</th>
            <th className="px-3 py-2 text-right font-medium">12-Mo Burn</th>
            <th className="px-3 py-2 text-right font-medium">Δ vs Baseline</th>
            <th className="px-3 py-2 text-right font-medium">$/HC (monthly)</th>
          </tr>
        </thead>
        <tbody>
          {all.map((a) => {
            const last = a.projection[a.projection.length - 1];
            const baseLast = BASELINE_PROJECTION[BASELINE_PROJECTION.length - 1];
            const total12 = a.projection.reduce((s, r) => s + r.fullyBurdened, 0);
            const baseTotal = BASELINE_PROJECTION.reduce((s, r) => s + r.fullyBurdened, 0);
            return (
              <tr key={a.name} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{a.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{a.owner}</td>
                <td className="px-3 py-2 text-right tabular-nums">{a.events.length}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNum(last.endingHC)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{last.endingHC === baseLast.endingHC ? "—" : `${last.endingHC > baseLast.endingHC ? "+" : ""}${last.endingHC - baseLast.endingHC}`}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(last.fullyBurdened)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(total12)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{total12 === baseTotal ? "—" : `${total12 > baseTotal ? "+" : ""}${fmtUSD(total12 - baseTotal)}`}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(Math.round(last.fullyBurdened / Math.max(1, last.endingHC)))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Executive summary ----
function ExecutiveSummary({ scenarioResults }: { scenarioResults: Array<{ scenario: { id: string; name: string }; events: PlanEvent[]; projection: ReturnType<typeof projectScenario> }> }) {
  const baseLast = BASELINE_PROJECTION[BASELINE_PROJECTION.length - 1];
  const baseTotal = BASELINE_PROJECTION.reduce((s, r) => s + r.fullyBurdened, 0);

  const summaries = scenarioResults.map((r) => {
    const last = r.projection[r.projection.length - 1];
    const total = r.projection.reduce((s, m) => s + m.fullyBurdened, 0);
    const hcDelta = last.endingHC - baseLast.endingHC;
    const burnDelta = total - baseTotal;
    const hcPct = hcDelta / baseLast.endingHC;
    const costPct = burnDelta / baseTotal;
    const topDept = [...DEPARTMENTS].sort((a, b) =>
      (last.byDept[b].burdened - baseLast.byDept[b].burdened) - (last.byDept[a].burdened - baseLast.byDept[a].burdened)
    )[0];
    const flagged = r.events.filter(flagNeedsApproval);
    const usHires = r.events.filter((e) => e.kind === "Hire" && (e.location === "SF" || e.location === "San Jose"))
      .reduce((s, e) => s + (e as HireEvent).count, 0);
    return { name: r.scenario.name, last, total, hcDelta, burnDelta, hcPct, costPct, topDept, flagged, usHires };
  });

  const mostHc = [...summaries].sort((a, b) => b.hcDelta - a.hcDelta)[0];
  const mostCostDept = [...summaries].sort((a, b) =>
    (b.last.byDept[b.topDept].burdened) - (a.last.byDept[a.topDept].burdened)
  )[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="border border-border rounded-md p-3 bg-card">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Headcount Story</div>
          <div className="text-sm">
            <span className="font-semibold">{mostHc.name}</span> adds the most headcount:
            <span className="font-semibold text-amber-700"> +{fmtNum(mostHc.hcDelta)}</span> ({fmtPct(mostHc.hcPct)}) vs baseline by Jun 27.
          </div>
        </div>
        <div className="border border-border rounded-md p-3 bg-card">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Cost Driver</div>
          <div className="text-sm">
            <span className="font-semibold">{mostCostDept.topDept}</span> drives the largest payroll cost increase in{" "}
            <span className="font-semibold">{mostCostDept.name}</span>.
          </div>
        </div>
        <div className="border border-border rounded-md p-3 bg-card">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Cost vs HC Growth</div>
          <ul className="text-sm space-y-1">
            {summaries.map((s) => {
              const fasterCost = s.costPct > s.hcPct;
              return (
                <li key={s.name} className="flex items-center gap-2">
                  {fasterCost ? <TrendingUp className="h-3.5 w-3.5 text-rose-600" /> : <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />}
                  <span className="font-medium">{s.name}:</span>
                  <span className="text-muted-foreground">
                    cost {fmtPct(s.costPct)} {fasterCost ? "outpaces" : "trails"} HC {fmtPct(s.hcPct)}
                    {fasterCost ? " — comp inflation per head" : " — efficient scaling"}.
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="space-y-3">
        <div className="border border-border rounded-md p-3 bg-card">
          <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Key Risks</div>
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            {summaries.map((s) => (
              <li key={s.name}>
                <span className="font-medium">{s.name}:</span>{" "}
                {s.usHires > 10 && <>high-cost US hiring ({s.usHires} SF/San Jose hires) · </>}
                {s.flagged.length > 0 && <>{s.flagged.length} comp change(s) &gt; 15% pending senior approval · </>}
                {s.events.some((e) => e.kind === "Hire" && ((e as HireEvent).location === "London" || (e as HireEvent).location === "Bangalore" || (e as HireEvent).location === "Toronto")) && <>international expansion adds tax-rule complexity · </>}
                attrition assumptions drive {fmtNum(Math.round(s.last.endingHC * 0.1))} of HC volatility.
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-amber-200 bg-amber-50 rounded-md p-3 text-xs text-amber-900">
          <div className="font-semibold mb-1">Forecast is scenario-based.</div>
          Planning events do not modify worker master data. Approved events post to HR master data only when promoted through the worker-change business process.
        </div>
      </div>
    </div>
  );
}

// ---- Add Event Dialog ----
function AddEventDialog({ scenarioId, onCreate, onClose }: { scenarioId: string; onCreate: (e: PlanEvent) => void; onClose: () => void }) {
  const [kind, setKind] = useState<EventKind>("Hire");
  const [department, setDepartment] = useState<Department>("Engineering");
  const [location, setLocation] = useState<Location>("SF");
  const [level, setLevel] = useState<Level>("IC4");
  const [month, setMonth] = useState<MonthLabel>(MONTHS[2]);
  const [count, setCount] = useState(1);
  const [salary, setSalary] = useState<number>(180000);
  const [status, setStatus] = useState<EventStatus>("Planned");

  // Term-specific
  const [attrType, setAttrType] = useState<AttritionType>("Planned termination");
  const [backfillMonth, setBackfillMonth] = useState<MonthLabel>(MONTHS[5]);

  // Transfer-specific
  const [toDept, setToDept] = useState<Department>("GPU Cloud");
  const [toLoc, setToLoc] = useState<Location>("San Jose");
  const [compChange, setCompChange] = useState(0.05);

  // Comp-specific
  const [compType, setCompType] = useState<CompChangeType>("Merit");
  const [increase, setIncrease] = useState(0.04);
  const [affected, setAffected] = useState(1);

  const id = `EVT-NEW-${Date.now().toString(36).toUpperCase()}`;
  const baseFields = { id, scenarioId, status, createdAt: "2026-06-15", createdBy: "Current User" };

  const create = () => {
    let e: PlanEvent;
    if (kind === "Hire") {
      e = { ...baseFields, kind: "Hire", department, location, level, startMonth: month, count, annualSalaryUSD: salary };
    } else if (kind === "Termination") {
      e = {
        ...baseFields, kind: "Termination", department, location, level, month, count,
        attritionType: attrType, exitingSalaryUSD: salary,
        ...(attrType === "Backfill required" ? { backfillMonth } : {}),
      };
    } else if (kind === "Transfer") {
      e = {
        ...baseFields, kind: "Transfer",
        worker: `New transfer (${level})`,
        fromDept: department, toDept, fromLocation: location, toLocation: toLoc,
        level, month, compChangePct: compChange, currentSalaryUSD: salary,
      };
    } else {
      const newSal = Math.round(salary * (1 + increase));
      e = {
        ...baseFields, kind: "Compensation",
        population: `Cohort ${department}/${level}`,
        department, level, month, changeType: compType,
        increasePct: increase, newAnnualSalaryUSD: newSal, affectedCount: affected,
      };
    }
    onCreate(e);
  };

  // Update default salary when dept/level/loc changes
  const suggestSalary = () => setSalary(avgSalaryFor(department, level, location));

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add Planning Event</DialogTitle>
        <DialogDescription>Events change the forecast only. Worker records update after the change is posted through Worker Changes.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Event Type">
          <Select value={kind} onValueChange={(v) => setKind(v as EventKind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={kind === "Transfer" ? "From Department" : "Department"}>
          <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={kind === "Transfer" ? "From Location" : "Location"}>
          <Select value={location} onValueChange={(v) => setLocation(v as Location)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LOCATION_LIST.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Job Level">
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LEVEL_LIST.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={kind === "Hire" ? "Start Month" : "Effective Month"}>
          <Select value={month} onValueChange={(v) => setMonth(v as MonthLabel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>

        {kind !== "Transfer" && kind !== "Compensation" && (
          <Field label="Count">
            <Input type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </Field>
        )}

        <Field label={kind === "Compensation" ? "Current Avg Salary (USD)" : "Annual Salary (USD)"}>
          <div className="flex gap-1">
            <Input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
            <Button type="button" size="sm" variant="outline" onClick={suggestSalary} className="text-xs whitespace-nowrap">Suggest</Button>
          </div>
        </Field>

        {kind === "Termination" && (
          <>
            <Field label="Attrition Type">
              <Select value={attrType} onValueChange={(v) => setAttrType(v as AttritionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ATTR_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            {attrType === "Backfill required" && (
              <Field label="Backfill Month">
                <Select value={backfillMonth} onValueChange={(v) => setBackfillMonth(v as MonthLabel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}
          </>
        )}

        {kind === "Transfer" && (
          <>
            <Field label="To Department">
              <Select value={toDept} onValueChange={(v) => setToDept(v as Department)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="To Location">
              <Select value={toLoc} onValueChange={(v) => setToLoc(v as Location)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LOCATION_LIST.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Comp Change %">
              <Input type="number" step="0.01" value={compChange} onChange={(e) => setCompChange(Number(e.target.value))} />
            </Field>
          </>
        )}

        {kind === "Compensation" && (
          <>
            <Field label="Change Type">
              <Select value={compType} onValueChange={(v) => setCompType(v as CompChangeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COMP_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Increase %">
              <Input type="number" step="0.01" value={increase} onChange={(e) => setIncrease(Number(e.target.value))} />
            </Field>
            <Field label="Affected Population">
              <Input type="number" min={1} value={affected} onChange={(e) => setAffected(Number(e.target.value))} />
            </Field>
          </>
        )}
      </div>

      {kind === "Compensation" && increase > 0.15 && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1.5 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" /> Increase &gt; 15% will require additional approval.
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={create}>Create event</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
