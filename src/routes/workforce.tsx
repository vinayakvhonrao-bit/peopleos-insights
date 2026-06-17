import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, StatusBadge } from "@/components/layout/AppShell";
import {
  EMPLOYEES, DEPARTMENTS, LOCATION_LIST, LEVEL_LIST, STATUS_LIST, MANAGER_LIST,
  fmtCur, fmtNum, tenureYears, tenureBand,
  type Employee,
} from "@/lib/data";
import { useMemo, useState } from "react";
import { Search, X, User, Building2, MapPin, Briefcase, DollarSign, Filter } from "lucide-react";

export const Route = createFileRoute("/workforce")({
  head: () => ({
    meta: [
      { title: "Workforce Explorer — NeoCloud PeopleOS" },
      { name: "description", content: "Search and filter the NeoCloud worker population by department, location, level, and status." },
    ],
  }),
  component: WorkforcePage,
});

const TENURE_BANDS = ["<1y", "1-3y", "3-5y", "5y+"] as const;
const BAND_STATUSES = ["Below Band", "Within Band", "Above Band"] as const;

function WorkforcePage() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("");
  const [loc, setLoc] = useState<string>("");
  const [lvl, setLvl] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tband, setTband] = useState<string>("");
  const [bstatus, setBstatus] = useState<string>("");
  const [mgr, setMgr] = useState<string>("");
  const [selected, setSelected] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return EMPLOYEES.filter((e) => {
      if (q) {
        const s = q.toLowerCase();
        if (!e.name.toLowerCase().includes(s) && !e.id.toLowerCase().includes(s)) return false;
      }
      if (dept && e.department !== dept) return false;
      if (loc && e.location !== loc) return false;
      if (lvl && e.level !== lvl) return false;
      if (status && e.status !== status) return false;
      if (bstatus && e.bandStatus !== bstatus) return false;
      if (tband && tenureBand(tenureYears(e.hireDate)) !== tband) return false;
      if (mgr && e.managerName !== mgr) return false;
      return true;
    });
  }, [q, dept, loc, lvl, status, tband, bstatus, mgr]);

  const activeChips: Array<{ label: string; clear: () => void }> = [];
  if (dept) activeChips.push({ label: `Dept: ${dept}`, clear: () => setDept("") });
  if (loc) activeChips.push({ label: `Loc: ${loc}`, clear: () => setLoc("") });
  if (lvl) activeChips.push({ label: `Level: ${lvl}`, clear: () => setLvl("") });
  if (status) activeChips.push({ label: `Status: ${status}`, clear: () => setStatus("") });
  if (mgr) activeChips.push({ label: `Mgr: ${mgr}`, clear: () => setMgr("") });
  if (tband) activeChips.push({ label: `Tenure: ${tband}`, clear: () => setTband("") });
  if (bstatus) activeChips.push({ label: `Comp: ${bstatus}`, clear: () => setBstatus("") });

  const clearAll = () => { setQ(""); setDept(""); setLoc(""); setLvl(""); setStatus(""); setTband(""); setBstatus(""); setMgr(""); };

  return (
    <AppShell title="Workforce Explorer" subtitle="People Data · Worker Search">
      <SectionCard
        title={`${fmtNum(filtered.length)} of ${fmtNum(EMPLOYEES.length)} workers`}
        description="Search and filter active workers. Select a row to open the worker profile."
        actions={
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <X className="h-3 w-3" /> Clear filters
          </button>
        }
      >
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by worker name or employee ID (e.g. E-100042)"
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <Select value={dept} onChange={setDept} options={DEPARTMENTS} placeholder="Department" />
            <Select value={loc} onChange={setLoc} options={LOCATION_LIST as readonly string[]} placeholder="Location" />
            <Select value={lvl} onChange={setLvl} options={LEVEL_LIST as readonly string[]} placeholder="Job Level" />
            <Select value={status} onChange={setStatus} options={STATUS_LIST as readonly string[]} placeholder="Status" />
            <Select value={tband} onChange={setTband} options={TENURE_BANDS as readonly string[]} placeholder="Tenure Band" />
            <Select value={mgr} onChange={setMgr} options={MANAGER_LIST as readonly string[]} placeholder="Manager" />
            <Select value={bstatus} onChange={setBstatus} options={BAND_STATUSES as readonly string[]} placeholder="Comp Band" />
          </div>
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Filter className="h-3 w-3 text-muted-foreground" />
              {activeChips.map((c) => (
                <button
                  key={c.label}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs hover:bg-accent/80"
                >
                  {c.label} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-border rounded-md max-h-[640px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/70 backdrop-blur text-xs uppercase tracking-wide text-muted-foreground sticky top-0 z-10">
              <tr>
                <Th>Employee ID</Th>
                <Th>Worker</Th>
                <Th>Department</Th>
                <Th>Location</Th>
                <Th>Level</Th>
                <Th className="text-right">Salary</Th>
                <Th>Cur.</Th>
                <Th>Manager</Th>
                <Th>Hire Date</Th>
                <Th className="text-right">Tenure</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((e) => {
                const isSel = selected?.id === e.id;
                return (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    className={`cursor-pointer border-t border-border hover:bg-accent/50 ${isSel ? "bg-accent/60" : ""}`}
                  >
                    <Td className="font-mono text-xs">{e.id}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={e.name} />
                        <div>
                          <div className="font-medium leading-tight">{e.name}</div>
                          <div className="text-xs text-muted-foreground">{e.jobProfile}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{e.department}</Td>
                    <Td>{e.location}</Td>
                    <Td>{e.level}</Td>
                    <Td className="text-right tabular-nums">{fmtCur(e.salary, e.currency)}</Td>
                    <Td className="text-muted-foreground">{e.currency}</Td>
                    <Td className="text-muted-foreground">{e.managerName}</Td>
                    <Td className="text-muted-foreground tabular-nums">{e.hireDate}</Td>
                    <Td className="text-right tabular-nums">{tenureYears(e.hireDate).toFixed(1)}y</Td>
                    <Td><StatusBadge status={e.status} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30 sticky bottom-0">
              Showing first 200 of {fmtNum(filtered.length)} results. Refine filters to narrow.
            </div>
          )}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No workers match the current filters.
            </div>
          )}
        </div>
      </SectionCard>

      {selected && <WorkerDetailDrawer employee={selected} onClose={() => setSelected(null)} />}
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-left font-medium whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`}>{children}</td>;
}

function Select({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-2 text-sm border border-border rounded-md bg-background"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const hue = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
      style={{ backgroundColor: `hsl(${hue} 55% 45%)` }}
    >
      {initials}
    </div>
  );
}

// Deterministic pseudo-random helpers so each worker has stable derived data.
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function pick<T>(seed: number, arr: readonly T[]): T {
  return arr[seed % arr.length];
}
function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function buildHistory(e: Employee) {
  const h = hashStr(e.id);
  const items: Array<{ effective: string; event: string; from: string; to: string }> = [];
  items.push({ effective: e.hireDate, event: "Hire", from: "—", to: `${e.jobProfile} · ${e.level}` });
  const t = tenureYears(e.hireDate);
  if (t > 1.2) {
    items.push({
      effective: addYears(e.hireDate, 1),
      event: "Compensation Change",
      from: `${fmtCur(Math.round(e.salary * 0.94), e.currency)}`,
      to: `${fmtCur(Math.round(e.salary * 0.97), e.currency)}`,
    });
  }
  if (t > 2.5 && h % 3 === 0) {
    items.push({ effective: addYears(e.hireDate, 2), event: "Promotion", from: e.level, to: e.level.replace(/(\d)/, (m) => String(Number(m) + 1)) });
  }
  if (t > 1.8 && h % 4 === 1) {
    items.push({ effective: addYears(e.hireDate, 2), event: "Location Change", from: pick(h, LOCATION_LIST as readonly string[]), to: e.location });
  }
  items.push({
    effective: "2026-04-01",
    event: "Merit Increase",
    from: `${fmtCur(Math.round(e.salary * 0.965), e.currency)}`,
    to: `${fmtCur(e.salary, e.currency)}`,
  });
  return items.sort((a, b) => (a.effective < b.effective ? 1 : -1));
}

function buildEvents(e: Employee) {
  const h = hashStr(e.id);
  const base = [
    { date: "2026-05-12", kind: "Performance Review", detail: "Mid-year check-in completed" },
    { date: "2026-03-04", kind: "Time Off", detail: "5 days PTO approved" },
    { date: "2026-02-18", kind: "Training", detail: "Completed Security Awareness 2026" },
  ];
  if (e.status === "On Leave") base.unshift({ date: "2026-06-01", kind: "Leave of Absence", detail: "Approved · returning 2026-08-15" });
  if (e.bandStatus === "Above Band") base.unshift({ date: "2026-05-20", kind: "Comp Flag", detail: "Salary above band — requires VP review" });
  return base.slice(0, 4 + (h % 2));
}

function buildProcesses(e: Employee) {
  const procs: Array<{ name: string; status: "In Progress" | "Completed" | "Pending"; step: string; initiator: string }> = [
    { name: "Annual Compensation Review", status: "In Progress", step: "Awaiting Manager Approval", initiator: "HR Partner" },
  ];
  if (e.status === "Termination Pending") {
    procs.unshift({ name: "Termination", status: "In Progress", step: "Final Pay Calculation", initiator: e.managerName });
  }
  if (hashStr(e.id) % 5 === 0) {
    procs.push({ name: "Job Change", status: "Pending", step: "Position Approval", initiator: e.managerName });
  }
  procs.push({ name: "Benefits Open Enrollment 2026", status: "Completed", step: "Elections Submitted", initiator: e.name });
  return procs;
}

function WorkerDetailDrawer({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const e = employee;
  const tenure = tenureYears(e.hireDate);
  const history = buildHistory(e);
  const events = buildEvents(e);
  const processes = buildProcesses(e);

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-label="Worker profile">
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-[560px] bg-card border-l border-border h-full overflow-y-auto shadow-2xl">
        <div className="px-5 py-4 border-b border-border bg-muted/30 sticky top-0 z-10 backdrop-blur">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 shrink-0"><Avatar name={e.name} /></div>
              <div className="min-w-0">
                <div className="text-[11px] text-muted-foreground font-mono">{e.id} · {e.positionId}</div>
                <h2 className="text-lg font-semibold leading-tight truncate">{e.name}</h2>
                <div className="text-sm text-muted-foreground truncate">{e.jobProfile} · {e.level} · {e.location}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <StatusBadge status={e.status} />
            <StatusBadge status={e.bandStatus} />
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{tenureBand(tenure)} tenure</span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <Section icon={<Briefcase className="h-3.5 w-3.5" />} title="Current Position">
            <Field label="Job Profile" value={e.jobProfile} />
            <Field label="Job Family" value={e.jobFamily} />
            <Field label="Job Level" value={e.level} />
            <Field label="Position ID" value={<span className="font-mono text-xs">{e.positionId}</span>} />
            <Field label="Supervisory Org" value={<span className="text-xs text-right">{e.supervisoryOrg}</span>} />
          </Section>

          <Section icon={<Building2 className="h-3.5 w-3.5" />} title="Organization">
            <Field label="Department" value={e.department} />
            <Field label="Cost Center" value={e.costCenter} />
            <Field label="Location" value={<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>} />
          </Section>

          <Section icon={<User className="h-3.5 w-3.5" />} title="Manager & Reporting">
            <Field label="Manager" value={e.managerName} />
            <Field label="Hire Date" value={e.hireDate} />
            <Field label="Tenure" value={`${tenure.toFixed(1)} years`} />
          </Section>

          <Section icon={<DollarSign className="h-3.5 w-3.5" />} title="Compensation">
            <Field label="Annual Salary" value={fmtCur(e.salary, e.currency)} />
            <Field label="USD Equivalent" value={fmtCur(e.salaryUSD, "USD" as never)} />
            <Field label="Currency" value={e.currency} />
            <Field label="Band Status" value={<StatusBadge status={e.bandStatus} />} />
          </Section>

          <Section title="Effective-Dated History">
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left px-2.5 py-1.5 font-medium">Effective</th>
                    <th className="text-left px-2.5 py-1.5 font-medium">Event</th>
                    <th className="text-left px-2.5 py-1.5 font-medium">From → To</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2.5 py-1.5 font-mono">{h.effective}</td>
                      <td className="px-2.5 py-1.5 font-medium">{h.event}</td>
                      <td className="px-2.5 py-1.5 text-muted-foreground">{h.from} → <span className="text-foreground">{h.to}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Recent Worker Events">
            <ul className="text-sm space-y-2">
              {events.map((ev) => (
                <li key={ev.date + ev.kind} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                  <div className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ev.date}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{ev.kind}</div>
                    <div className="text-muted-foreground text-xs">{ev.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Related Business Processes">
            <ul className="space-y-2">
              {processes.map((p, i) => (
                <li key={i} className="border border-border rounded-md p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">Step: {p.step}</div>
                      <div className="text-xs text-muted-foreground">Initiated by {p.initiator}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
        {icon}{title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
