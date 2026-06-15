import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, StatusBadge } from "@/components/layout/AppShell";
import { EMPLOYEES, LOCATION_LIST, LEVEL_LIST, fmtCur, fmtPct, fmtUSD, type Employee, type Level, type Location } from "@/lib/data";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Worker Data Change — NeoCloud PeopleOS" },
      { name: "description", content: "Workday-style business process for promotion and compensation change with conditional routing and audit." },
    ],
  }),
  component: WorkflowPage,
});

interface StepDef {
  id: string;
  name: string;
  role: string;
  required: boolean;
  condition?: string;
}

function WorkflowPage() {
  const candidate = EMPLOYEES.find((e) => e.level === "IC4" && e.location === "SF" && e.status === "Active") ?? EMPLOYEES[0];
  const [proposedLevel, setProposedLevel] = useState<Level>("IC5");
  const [proposedLocation, setProposedLocation] = useState<Location>(candidate.location);
  const [proposedSalary, setProposedSalary] = useState<number>(Math.round(candidate.salary * 1.12));
  const [effectiveDate, setEffectiveDate] = useState("2026-07-01");
  const [currentStepIdx, setCurrentStepIdx] = useState(2);

  const increase = (proposedSalary - candidate.salary) / candidate.salary;
  const internationalLocs: Location[] = ["Toronto", "London", "Bangalore"];
  const goesIntl = !internationalLocs.includes(candidate.location) && internationalLocs.includes(proposedLocation);
  const needsCFO = increase > 0.15;
  const needsPayrollReview = goesIntl;

  const steps = useMemo<StepDef[]>(() => {
    const base: StepDef[] = [
      { id: "init", name: "Manager Initiation", role: "Manager", required: true },
      { id: "skip", name: "Next-Level Manager Approval", role: "Skip-Level Manager", required: true },
    ];
    if (needsCFO) base.push({ id: "cfo", name: "CFO Approval", role: "CFO", required: true, condition: "Salary Δ > 15%" });
    if (needsPayrollReview) base.push({ id: "payroll", name: "Payroll Review", role: "Payroll Partner", required: true, condition: "International location change" });
    base.push({ id: "hrp", name: "HR Partner Approval", role: "HR Business Partner", required: true });
    base.push({ id: "ops", name: "People Ops Completion", role: "People Operations", required: true });
    return base;
  }, [needsCFO, needsPayrollReview]);

  const audit = buildAudit(candidate, { proposedLevel, proposedLocation, proposedSalary, effectiveDate, steps, currentStepIdx });

  return (
    <AppShell title="Worker Data Change" subtitle="Business Process · Promotion + Comp Change">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Subject Worker">
          <div className="text-sm space-y-1.5">
            <div className="text-xs font-mono text-muted-foreground">{candidate.id}</div>
            <div className="text-base font-semibold">{candidate.name}</div>
            <div className="text-muted-foreground">{candidate.jobProfile}</div>
            <div className="pt-2 border-t border-border space-y-1.5">
              <Row label="Department" value={candidate.department} />
              <Row label="Manager" value={candidate.managerName} />
              <Row label="Current Level" value={candidate.level} />
              <Row label="Current Location" value={candidate.location} />
              <Row label="Current Salary" value={fmtCur(candidate.salary, candidate.currency)} />
              <Row label="Status" value={<StatusBadge status={candidate.status} />} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Proposed Change">
          <div className="space-y-2.5 text-sm">
            <Field label="Proposed Level">
              <select value={proposedLevel} onChange={(e) => setProposedLevel(e.target.value as Level)} className="border border-border rounded-md px-2 py-1 text-sm bg-background">
                {LEVEL_LIST.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Proposed Location">
              <select value={proposedLocation} onChange={(e) => setProposedLocation(e.target.value as Location)} className="border border-border rounded-md px-2 py-1 text-sm bg-background">
                {LOCATION_LIST.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Proposed Salary">
              <input type="number" value={proposedSalary} onChange={(e) => setProposedSalary(Number(e.target.value))} className="border border-border rounded-md px-2 py-1 text-sm bg-background w-32 text-right tabular-nums" />
            </Field>
            <Field label="Effective Date">
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="border border-border rounded-md px-2 py-1 text-sm bg-background" />
            </Field>
            <div className="pt-2 mt-2 border-t border-border space-y-1.5">
              <Row label="Salary Δ" value={<span className={increase > 0.15 ? "text-rose-700 font-medium" : ""}>{fmtPct(increase, 2)}</span>} />
              <Row label="Annualized $ Δ" value={fmtUSD(proposedSalary - candidate.salary)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Routing Triggers">
          <ul className="space-y-2 text-sm">
            <RoutingRow ok={!needsCFO} label="CFO approval (salary increase > 15%)" hit={needsCFO} />
            <RoutingRow ok={!needsPayrollReview} label="Payroll review (international location change)" hit={needsPayrollReview} />
            <RoutingRow ok label="Manager + Skip-Level + HRP + People Ops (always)" />
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            Routing rules are configured in the Business Process Framework. Both conditions are evaluated at submission and at re-routing events.
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Business Process Status" description={`Current step: ${steps[currentStepIdx]?.name ?? "—"}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))} className="text-xs px-2.5 py-1 border border-border rounded-md hover:bg-accent">Send Back</button>
            <button onClick={() => setCurrentStepIdx((i) => Math.min(steps.length, i + 1))} className="text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Approve & Advance</button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {steps.map((s, i) => {
            const state = i < currentStepIdx ? "Complete" : i === currentStepIdx ? "In Progress" : "Pending";
            const Icon = state === "Complete" ? CheckCircle2 : state === "In Progress" ? Clock : Circle;
            const cls = state === "Complete" ? "text-emerald-700 border-emerald-200 bg-emerald-50"
              : state === "In Progress" ? "text-sky-700 border-sky-200 bg-sky-50"
              : "text-muted-foreground border-border bg-muted/30";
            return (
              <div key={s.id} className={`flex items-start gap-2 border rounded-md px-3 py-2 min-w-[200px] ${cls}`}>
                <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-muted-foreground">{s.role}</div>
                  {s.condition && <div className="mt-0.5 italic text-[11px]">Triggered by: {s.condition}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Audit Trail" description="Immutable — all actions are timestamped and signed.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Timestamp</th>
                <th className="px-3 py-2 text-left font-medium">Actor</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
                <th className="px-3 py-2 text-left font-medium">Action</th>
                <th className="px-3 py-2 text-left font-medium">Field</th>
                <th className="px-3 py-2 text-left font-medium">Old Value</th>
                <th className="px-3 py-2 text-left font-medium">New Value</th>
                <th className="px-3 py-2 text-left font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{a.timestamp}</td>
                  <td className="px-3 py-2">{a.actor}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.role}</td>
                  <td className="px-3 py-2">{a.action}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.field ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.oldValue ?? "—"}</td>
                  <td className="px-3 py-2">{a.newValue ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between items-center"><span className="text-muted-foreground">{label}</span>{children}</div>;
}
function RoutingRow({ label, hit = false, ok }: { label: string; hit?: boolean; ok: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-1 h-2 w-2 rounded-full ${hit ? "bg-amber-500" : ok ? "bg-emerald-500" : "bg-muted-foreground"}`} />
      <span className={hit ? "text-amber-800 font-medium" : "text-foreground"}>{label}{hit && " — required"}</span>
    </li>
  );
}

function buildAudit(emp: Employee, ctx: {
  proposedLevel: Level; proposedLocation: Location; proposedSalary: number; effectiveDate: string;
  steps: StepDef[]; currentStepIdx: number;
}) {
  const baseDate = "2026-06-10";
  const actors: Record<string, string> = {
    "Manager": emp.managerName,
    "Skip-Level Manager": "Priya Shah",
    "HR Business Partner": "Marcus Lee",
    "People Operations": "Jordan Mehta",
    "CFO": "Dana Park",
    "Payroll Partner": "Aiko Tanaka",
  };
  const entries: Array<{
    timestamp: string; actor: string; role: string; action: string; comment: string;
    field?: string; oldValue?: string; newValue?: string;
  }> = [];

  entries.push({
    timestamp: `${baseDate} 09:14`, actor: emp.managerName, role: "Manager",
    action: "Initiated change", comment: "Promotion + comp adjustment for FY26 performance.",
  });
  entries.push({
    timestamp: `${baseDate} 09:14`, actor: emp.managerName, role: "Manager",
    action: "Proposed change", field: "Level", oldValue: emp.level, newValue: ctx.proposedLevel, comment: "Effective " + ctx.effectiveDate,
  });
  entries.push({
    timestamp: `${baseDate} 09:15`, actor: emp.managerName, role: "Manager",
    action: "Proposed change", field: "Salary", oldValue: fmtCur(emp.salary, emp.currency), newValue: fmtCur(ctx.proposedSalary, emp.currency), comment: "Within job profile guidance.",
  });
  if (ctx.proposedLocation !== emp.location) {
    entries.push({
      timestamp: `${baseDate} 09:15`, actor: emp.managerName, role: "Manager",
      action: "Proposed change", field: "Location", oldValue: emp.location, newValue: ctx.proposedLocation, comment: "Worker relocation approved by hiring manager.",
    });
  }

  for (let i = 0; i < Math.min(ctx.currentStepIdx, ctx.steps.length); i++) {
    if (i === 0) continue;
    const step = ctx.steps[i];
    const actor = actors[step.role] ?? "—";
    entries.push({
      timestamp: `2026-06-${10 + i} ${10 + i}:02`, actor, role: step.role,
      action: "Approved", comment: step.condition ? `Conditional review passed (${step.condition}).` : "No concerns.",
    });
  }
  return entries;
}
