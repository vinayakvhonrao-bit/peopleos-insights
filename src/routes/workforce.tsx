import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard, StatusBadge } from "@/components/layout/AppShell";
import {
  EMPLOYEES, DEPARTMENTS, LOCATION_LIST, LEVEL_LIST, STATUS_LIST, MANAGER_LIST,
  fmtCur, fmtNum, tenureYears, tenureBand,
  type Employee,
} from "@/lib/data";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

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
      return true;
    });
  }, [q, dept, loc, lvl, status, tband, bstatus]);

  const clearAll = () => { setQ(""); setDept(""); setLoc(""); setLvl(""); setStatus(""); setTband(""); setBstatus(""); };

  return (
    <AppShell title="Workforce Explorer" subtitle="People Data · Worker Search">
      <SectionCard
        title={`${fmtNum(filtered.length)} of ${fmtNum(EMPLOYEES.length)} workers`}
        description="Filter and search the active worker population."
        actions={
          <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <X className="h-3 w-3" /> Clear filters
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <div className="relative md:col-span-2">
            <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or employee ID"
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background"
            />
          </div>
          <Select value={dept} onChange={setDept} options={DEPARTMENTS} placeholder="All Departments" />
          <Select value={loc} onChange={setLoc} options={LOCATION_LIST as readonly string[]} placeholder="All Locations" />
          <Select value={lvl} onChange={setLvl} options={LEVEL_LIST as readonly string[]} placeholder="All Levels" />
          <Select value={status} onChange={setStatus} options={STATUS_LIST as readonly string[]} placeholder="All Statuses" />
          <Select value={tband} onChange={setTband} options={TENURE_BANDS as readonly string[]} placeholder="All Tenure Bands" />
          <Select value={bstatus} onChange={setBstatus} options={BAND_STATUSES as readonly string[]} placeholder="All Comp Bands" />
        </div>

        <div className="overflow-x-auto border border-border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Employee ID</Th>
                <Th>Worker</Th>
                <Th>Job Profile</Th>
                <Th>Supervisory Org</Th>
                <Th>Department</Th>
                <Th>Location</Th>
                <Th>Level</Th>
                <Th className="text-right">Salary</Th>
                <Th>Cur.</Th>
                <Th>Manager</Th>
                <Th>Hire Date</Th>
                <Th className="text-right">Tenure</Th>
                <Th>Status</Th>
                <Th>Comp Band</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="cursor-pointer border-t border-border hover:bg-accent/50"
                >
                  <Td className="font-mono text-xs">{e.id}</Td>
                  <Td className="font-medium">{e.name}</Td>
                  <Td>{e.jobProfile}</Td>
                  <Td className="text-muted-foreground text-xs">{e.supervisoryOrg}</Td>
                  <Td>{e.department}</Td>
                  <Td>{e.location}</Td>
                  <Td>{e.level}</Td>
                  <Td className="text-right tabular-nums">{fmtCur(e.salary, e.currency)}</Td>
                  <Td>{e.currency}</Td>
                  <Td className="text-muted-foreground">{e.managerName}</Td>
                  <Td className="text-muted-foreground">{e.hireDate}</Td>
                  <Td className="text-right tabular-nums">{tenureYears(e.hireDate).toFixed(1)}y</Td>
                  <Td><StatusBadge status={e.status} /></Td>
                  <Td><StatusBadge status={e.bandStatus} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
              Showing first 200 of {fmtNum(filtered.length)} results. Refine filters to narrow.
            </div>
          )}
        </div>
      </SectionCard>

      {selected && <WorkerDetailDrawer employee={selected} onClose={() => setSelected(null)} />}
    </AppShell>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function Select({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function WorkerDetailDrawer({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const e = employee;
  const tenure = tenureYears(e.hireDate);
  const events = [
    { date: e.hireDate, kind: "Hire", detail: `Hired as ${e.jobProfile}, ${e.level}` },
    { date: "2025-04-01", kind: "Comp Change", detail: "Annual merit increase, +3.5%" },
    { date: "2025-09-15", kind: "Location Change", detail: `Reassigned to ${e.location}` },
  ];
  return (
    <div className="fixed inset-0 z-40 flex" role="dialog">
      <div className="flex-1 bg-foreground/20" onClick={onClose} />
      <aside className="w-full max-w-[480px] bg-card border-l border-border h-full overflow-y-auto">
        <div className="px-5 py-4 border-b border-border flex justify-between items-start">
          <div>
            <div className="text-xs text-muted-foreground font-mono">{e.id}</div>
            <h2 className="text-lg font-semibold">{e.name}</h2>
            <div className="text-sm text-muted-foreground">{e.jobProfile} · {e.level}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <Field label="Status" value={<StatusBadge status={e.status} />} />
          <Section title="Job & Position">
            <Field label="Job Profile" value={e.jobProfile} />
            <Field label="Job Family" value={e.jobFamily} />
            <Field label="Level" value={e.level} />
            <Field label="Position ID" value={<span className="font-mono text-xs">P-{e.id.slice(1)}</span>} />
          </Section>
          <Section title="Supervisory Organization">
            <Field label="Sup Org" value={<span className="text-xs text-right">{e.supervisoryOrg}</span>} />
            <Field label="Department" value={e.department} />
            <Field label="Cost Center" value={e.costCenter} />
            <Field label="Location" value={e.location} />
            <Field label="Manager" value={e.managerName} />
          </Section>
          <Section title="Compensation">
            <Field label="Annual Salary" value={`${fmtCur(e.salary, e.currency)} (${fmtCur(e.salaryUSD, "USD" as never)})`} />
            <Field label="Currency" value={e.currency} />
            <Field label="Compensation Band" value={<StatusBadge status={e.bandStatus} />} />
          </Section>
          <Section title="Tenure">
            <Field label="Hire Date" value={e.hireDate} />
            <Field label="Tenure" value={`${tenure.toFixed(1)} years (${tenureBand(tenure)})`} />
          </Section>
          <Section title="Recent Worker Events (effective-dated)">
            <ul className="text-sm space-y-2">
              {events.map((ev) => (
                <li key={ev.date + ev.kind} className="flex gap-3 border-l-2 border-border pl-3">
                  <div className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ev.date}</div>
                  <div>
                    <div className="font-medium">{ev.kind}</div>
                    <div className="text-muted-foreground text-xs">{ev.detail}</div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
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
