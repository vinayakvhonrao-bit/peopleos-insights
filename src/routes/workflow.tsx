import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, StatusBadge } from "@/components/layout/AppShell";
import { LOCATION_LIST, LEVEL_LIST, fmtUSD, fmtPct, type Level, type Location } from "@/lib/data";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  submitJobChange,
  seedApprovalSteps,
  approveNextStep,
  listBusinessProcesses,
  getCandidateEmployee,
} from "@/lib/workflow.functions";

export const Route = createFileRoute("/workflow")({
  head: () => ({
    meta: [
      { title: "Worker Data Change — NeoCloud PeopleOS" },
      { name: "description", content: "Workday-style business process: job change + comp change writes effective-dated records to the database." },
    ],
  }),
  component: WorkflowPage,
});

interface CandidateEmp {
  id: string;
  first_name: string;
  last_name: string;
  salary: number;
  salary_usd: number;
  currency: string;
  status: string;
  levels: { code: string } | { code: string }[] | null;
  locations: { name: string } | { name: string }[] | null;
  departments: { name: string } | { name: string }[] | null;
  job_profiles: { name: string } | { name: string }[] | null;
  manager: { id: string; first_name: string; last_name: string } | null;
}

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

interface StepDef { name: string; role: string; condition?: string }

function buildSteps(salaryIncreasePct: number, goesIntl: boolean): StepDef[] {
  const out: StepDef[] = [
    { name: "Manager Initiation", role: "Manager" },
    { name: "Skip-Level Manager Approval", role: "Skip-Level Manager" },
  ];
  if (salaryIncreasePct > 0.15) out.push({ name: "CFO Approval", role: "CFO", condition: "Salary Δ > 15%" });
  if (goesIntl) out.push({ name: "Payroll Review", role: "Payroll Partner", condition: "International location change" });
  out.push({ name: "HR Partner Approval", role: "HR Business Partner" });
  out.push({ name: "People Ops Completion", role: "People Operations" });
  return out;
}

const ROLE_ACTORS: Record<string, string> = {
  "Manager": "Reporting Manager",
  "Skip-Level Manager": "Priya Shah",
  "HR Business Partner": "Marcus Lee",
  "People Operations": "Jordan Mehta",
  "CFO": "Dana Park",
  "Payroll Partner": "Aiko Tanaka",
};

function WorkflowPage() {
  const queryClient = useQueryClient();
  const submitFn = useServerFn(submitJobChange);
  const seedFn = useServerFn(seedApprovalSteps);
  const approveFn = useServerFn(approveNextStep);
  const listFn = useServerFn(listBusinessProcesses);
  const candidateFn = useServerFn(getCandidateEmployee);

  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [candidate, setCandidate] = useState<CandidateEmp | null>(null);
  const [proposedLevel, setProposedLevel] = useState<Level>("IC5");
  const [proposedLocation, setProposedLocation] = useState<Location>("SF");
  const [proposedSalary, setProposedSalary] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState("2026-07-01");

  // Load a candidate on mount and whenever we ask for a new one
  const candidateQ = useQuery({
    queryKey: ["workflow-candidate", usedIds.join(",")],
    queryFn: () => candidateFn({ data: { excludeIds: usedIds } }),
  });

  useEffect(() => {
    const c = candidateQ.data as CandidateEmp | null | undefined;
    if (c && c.id !== candidate?.id) {
      setCandidate(c);
      setProposedLevel("IC5");
      const locName = (pickOne(c.locations)?.name as Location) ?? "SF";
      setProposedLocation(locName);
      setProposedSalary(Math.round(Number(c.salary) * 1.12));
    }
  }, [candidateQ.data, candidate?.id]);

  const bpListQ = useQuery({
    queryKey: ["bp-list"],
    queryFn: () => listFn(),
  });

  const currentCurrency = candidate?.currency ?? "USD";
  const currentSalary = Number(candidate?.salary ?? 0);
  const increase = currentSalary > 0 ? (proposedSalary - currentSalary) / currentSalary : 0;
  const currentLocName = pickOne(candidate?.locations)?.name ?? "—";
  const internationalLocs: Location[] = ["Toronto", "London", "Bangalore"];
  const goesIntl = !internationalLocs.includes(currentLocName as Location) && internationalLocs.includes(proposedLocation);
  const steps = useMemo(() => buildSteps(increase, goesIntl), [increase, goesIntl]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!candidate) throw new Error("No candidate");
      const { businessProcessId } = await submitFn({
        data: {
          employeeId: candidate.id,
          proposedLevelCode: proposedLevel,
          proposedLocationName: proposedLocation,
          proposedSalary,
          effectiveDate,
          reason: "Promotion + comp adjustment",
        },
      });
      await seedFn({
        data: {
          businessProcessId,
          steps: steps.map((s, i) => ({
            stepOrder: i + 1,
            stepName: s.name,
            approverLabel: ROLE_ACTORS[s.role] ?? s.role,
          })),
        },
      });
      // Auto-approve the first "Manager Initiation" step since submitting == initiating
      await approveFn({
        data: { businessProcessId, approverLabel: ROLE_ACTORS["Manager"], comments: "Initiated by manager" },
      });
      return businessProcessId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bp-list"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (vars: { bpId: string; approverLabel: string }) =>
      approveFn({ data: { businessProcessId: vars.bpId, approverLabel: vars.approverLabel } }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bp-list"] });
      // If completed, advance to a new sample candidate
      if (res?.completed && candidate) {
        setUsedIds((prev) => [...prev, candidate.id]);
      }
    },
  });

  const handleNewCandidate = () => {
    if (candidate) setUsedIds((prev) => prev.includes(candidate.id) ? prev : [...prev, candidate.id]);
  };

  if (!candidate) {
    return (
      <AppShell title="Worker Data Change" subtitle="Business Process · Job Change">
        <SectionCard title="Loading candidate…">
          <div className="text-sm text-muted-foreground">Fetching a sample employee from the database…</div>
        </SectionCard>
      </AppShell>
    );
  }

  const candidateName = `${candidate.first_name} ${candidate.last_name}`;
  const candidateLevel = pickOne(candidate.levels)?.code ?? "—";
  const candidateDept = pickOne(candidate.departments)?.name ?? "—";
  const candidateJobProfile = pickOne(candidate.job_profiles)?.name ?? "—";
  const managerName = candidate.manager ? `${candidate.manager.first_name} ${candidate.manager.last_name}` : "—";

  return (
    <AppShell title="Worker Data Change" subtitle="Business Process · Job Change writes to DB on completion">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Subject Worker"
          actions={
            <button onClick={handleNewCandidate} className="text-xs px-2 py-1 border border-border rounded-md hover:bg-accent inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> New Sample
            </button>
          }
        >
          <div className="text-sm space-y-1.5">
            <div className="text-xs font-mono text-muted-foreground">{candidate.id}</div>
            <div className="text-base font-semibold">{candidateName}</div>
            <div className="text-muted-foreground">{candidateJobProfile}</div>
            <div className="pt-2 border-t border-border space-y-1.5">
              <Row label="Department" value={candidateDept} />
              <Row label="Manager" value={managerName} />
              <Row label="Current Level" value={candidateLevel} />
              <Row label="Current Location" value={currentLocName} />
              <Row label="Current Salary" value={`${currentCurrency} ${currentSalary.toLocaleString()}`} />
              <Row label="Status" value={<StatusBadge status={candidate.status as never} />} />
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
            <Field label={`Proposed Salary (${currentCurrency})`}>
              <input type="number" value={proposedSalary} onChange={(e) => setProposedSalary(Number(e.target.value))} className="border border-border rounded-md px-2 py-1 text-sm bg-background w-32 text-right tabular-nums" />
            </Field>
            <Field label="Effective Date">
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="border border-border rounded-md px-2 py-1 text-sm bg-background" />
            </Field>
            <div className="pt-2 mt-2 border-t border-border space-y-1.5">
              <Row label="Salary Δ" value={<span className={increase > 0.15 ? "text-rose-700 font-medium" : ""}>{fmtPct(increase, 2)}</span>} />
              <Row label="Annualized Δ" value={`${currentCurrency} ${(proposedSalary - currentSalary).toLocaleString()}`} />
            </div>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full mt-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {submitMutation.isPending ? "Submitting…" : "Submit for Approval"}
            </button>
            {submitMutation.isError && (
              <div className="text-xs text-rose-700">{(submitMutation.error as Error).message}</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Routing Triggers">
          <ul className="space-y-2 text-sm">
            <RoutingRow ok={increase <= 0.15} label="CFO approval (salary increase > 15%)" hit={increase > 0.15} />
            <RoutingRow ok={!goesIntl} label="Payroll review (international location change)" hit={goesIntl} />
            <RoutingRow ok label="Manager + Skip-Level + HRP + People Ops (always)" />
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            On submit, a <strong>business_processes</strong> row is created with these approval steps. When the final step is approved, <strong>compensation_history</strong> and <strong>job_history</strong> records are written effective {effectiveDate}, and the employee snapshot is updated.
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Submitted Business Processes"
        description="All transactions submitted from this session. Each can be advanced through its approval chain — completion writes effective-dated history rows."
      >
        {bpListQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (bpListQ.data ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">No business processes yet. Submit one above to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">BP ID</th>
                  <th className="px-3 py-2 text-left font-medium">Worker</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Effective</th>
                  <th className="px-3 py-2 text-left font-medium">Change</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Approval Chain</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(bpListQ.data ?? []).map((bp) => {
                  const emp = pickOne(bp.employees as never);
                  const before = bp.payload_before as { level?: string; salary?: number; currency?: string } | null;
                  const after = bp.payload_after as { level?: string; salary?: number; currency?: string } | null;
                  const approvals = (bp.business_process_approvals ?? []) as Array<{ id: string; step_order: number; step_name: string; approver_label: string | null; decision: string; decided_at: string | null }>;
                  const sortedApprovals = [...approvals].sort((a, b) => a.step_order - b.step_order);
                  const nextPending = sortedApprovals.find((a) => a.decision === "Pending");
                  const empLabel = emp ? `${(emp as { first_name: string }).first_name} ${(emp as { last_name: string }).last_name}` : "—";
                  const empId = (emp as { id?: string } | null)?.id ?? (bp.employees ? (bp.employees as never as { id: string }).id : "—");
                  return (
                    <tr key={bp.id} className="border-t border-border align-top">
                      <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{bp.id.slice(0, 8)}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{empLabel}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{empId}</div>
                      </td>
                      <td className="px-3 py-2">{bp.process_type}</td>
                      <td className="px-3 py-2 font-mono">{bp.effective_date}</td>
                      <td className="px-3 py-2">
                        <div>{before?.level} → <strong>{after?.level}</strong></div>
                        <div className="text-muted-foreground">
                          {after?.currency} {Number(before?.salary ?? 0).toLocaleString()} → <strong>{Number(after?.salary ?? 0).toLocaleString()}</strong>
                        </div>
                      </td>
                      <td className="px-3 py-2"><BPStatusBadge status={bp.status} /></td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          {sortedApprovals.map((a) => (
                            <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                              {a.decision === "Approved" ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> :
                                a.decision === "Pending" ? <Clock className="h-3 w-3 text-sky-600" /> :
                                <Circle className="h-3 w-3 text-muted-foreground" />}
                              <span className={a.decision === "Approved" ? "line-through text-muted-foreground" : ""}>
                                {a.step_order}. {a.step_name}
                              </span>
                              {a.approver_label && a.decision === "Approved" && (
                                <span className="text-[10px] text-muted-foreground">— {a.approver_label}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {nextPending && bp.status !== "Completed" ? (
                          <button
                            onClick={() => approveMutation.mutate({ bpId: bp.id, approverLabel: nextPending.approver_label ?? "Approver" })}
                            disabled={approveMutation.isPending}
                            className="text-[11px] px-2 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          >
                            Approve: {nextPending.step_name}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">{bp.completed_at ? `Done ${new Date(bp.completed_at).toLocaleDateString()}` : "—"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
function BPStatusBadge({ status }: { status: string }) {
  const cls = status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "Pending Approval" ? "bg-sky-50 text-sky-700 border-sky-200"
    : status === "Denied" || status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-muted text-muted-foreground border-border";
  return <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${cls}`}>{status}</span>;
}

// fmtUSD is kept imported (used elsewhere). Reference to silence unused warning if needed.
void fmtUSD;
