import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, KpiCard } from "@/components/layout/AppShell";
import {
  SCENARIOS, computeScenario, DEPARTMENTS, fmtUSD, fmtNum, fmtPct,
} from "@/lib/data";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
} from "recharts";
import { useState } from "react";

export const Route = createFileRoute("/planning")({
  head: () => ({
    meta: [
      { title: "Workforce Planning — NeoCloud PeopleOS" },
      { name: "description", content: "Model 12-month workforce scenarios with hire plans, attrition, and merit assumptions." },
    ],
  }),
  component: PlanningPage,
});

function PlanningPage() {
  const results = SCENARIOS.map((s) => ({ scenario: s, result: computeScenario(s) }));
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const active = results.find((r) => r.scenario.id === activeId)!;

  const consBurn = results[0].result.monthlyPayroll.reduce((s, m) => s + m.cost, 0);
  const growthBurn = results[1].result.monthlyPayroll.reduce((s, m) => s + m.cost, 0);

  const combinedHc = results[0].result.monthlyHeadcount.map((m, i) => ({
    month: m.month,
    Conservative: m.headcount,
    Growth: results[1].result.monthlyHeadcount[i].headcount,
  }));
  const combinedCost = results[0].result.monthlyPayroll.map((m, i) => ({
    month: m.month,
    Conservative: m.cost,
    Growth: results[1].result.monthlyPayroll[i].cost,
  }));
  const deltaByDept = DEPARTMENTS.map((d) => ({
    name: d,
    Conservative: results[0].result.byDepartment[d].deltaCost,
    Growth: results[1].result.byDepartment[d].deltaCost,
  }));

  return (
    <AppShell title="Workforce Planning Scenarios" subtitle="Strategic Finance · People Planning">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Baseline Active HC" value={fmtNum(results[0].result.baselineHeadcount)} />
        <KpiCard label="Conservative — Ending HC" value={fmtNum(results[0].result.endingHeadcount)} hint={`Δ ${fmtPct(results[0].result.percentDelta)} annual comp`} />
        <KpiCard label="Conservative — 12-Mo Burn" value={fmtUSD(consBurn)} hint="Cumulative payroll cost" />
        <KpiCard label="Growth — Ending HC" value={fmtNum(results[1].result.endingHeadcount)} hint={`Δ ${fmtPct(results[1].result.percentDelta)} annual comp`} tone="warn" />
        <KpiCard label="Growth — 12-Mo Burn" value={fmtUSD(growthBurn)} hint={`+${fmtUSD(growthBurn - consBurn)} vs Conservative`} tone="warn" />
      </div>


      <SectionCard title="Scenario Comparison" description="12-month projection ending Jun 2027">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Scenario</th>
                <th className="px-3 py-2.5 text-left font-medium">Owner</th>
                <th className="px-3 py-2.5 text-right font-medium">Baseline HC</th>
                <th className="px-3 py-2.5 text-right font-medium">Ending HC</th>
                <th className="px-3 py-2.5 text-right font-medium">Annual Comp</th>
                <th className="px-3 py-2.5 text-right font-medium">Monthly Run Rate</th>
                <th className="px-3 py-2.5 text-right font-medium">$ Δ</th>
                <th className="px-3 py-2.5 text-right font-medium">% Δ</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ scenario, result }) => (
                <tr key={scenario.id} className="border-t border-border">
                  <td className="px-3 py-2.5 font-medium">{scenario.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{scenario.owner}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(result.baselineHeadcount)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(result.endingHeadcount)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtUSD(result.annualCompUSD)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtUSD(result.monthlyRunRateUSD)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtUSD(result.dollarDelta)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(result.percentDelta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SectionCard title="Headcount Trend by Scenario">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedHc}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Conservative" stroke="#1e3a5f" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Growth" stroke="#cf8a3a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Monthly Payroll Cost (USD)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedCost}>
                <CartesianGrid stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v/1_000_000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => fmtUSD(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Conservative" stroke="#1e3a5f" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Growth" stroke="#cf8a3a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Department Cost Delta" description="Change in annualized comp cost vs. baseline" >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deltaByDept}>
              <CartesianGrid stroke="#eef2f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v/1_000_000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => fmtUSD(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Conservative" fill="#1e3a5f" />
              <Bar dataKey="Growth" fill="#cf8a3a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="mt-4">
        <div className="flex gap-2 mb-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`px-3 py-1.5 text-sm rounded-md border ${activeId === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:bg-accent"}`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title={`${active.scenario.name} — Hire Plan`} description={active.scenario.description}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Department</th>
                    <th className="px-3 py-2 text-left font-medium">Quarter</th>
                    <th className="px-3 py-2 text-left font-medium">Level</th>
                    <th className="px-3 py-2 text-left font-medium">Location</th>
                    <th className="px-3 py-2 text-right font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {active.scenario.hires.map((h, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">{h.department}</td>
                      <td className="px-3 py-2">{h.quarter}</td>
                      <td className="px-3 py-2">{h.level}</td>
                      <td className="px-3 py-2">{h.location}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{h.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Assumptions">
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Annual Attrition</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEPARTMENTS.map((d) => (
                    <div key={d} className="flex justify-between border-b border-border py-1">
                      <span className="text-muted-foreground">{d}</span>
                      <span className="tabular-nums font-medium">{fmtPct(active.scenario.attrition[d])}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Merit Increase by Level</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(active.scenario.meritByLevel).map(([lv, v]) => (
                    <div key={lv} className="flex justify-between border-b border-border py-1">
                      <span className="text-muted-foreground">{lv}</span>
                      <span className="tabular-nums font-medium">{fmtPct(v as number)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Effective {active.scenario.meritEffective}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
