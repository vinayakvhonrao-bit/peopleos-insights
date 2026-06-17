import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/layout/AppShell";
import { useFDM, fdmStore, ENTITY_META, type FDMEntity, type FDMRow } from "@/lib/fdm";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, RotateCcw, Database } from "lucide-react";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Foundation Data — NeoCloud PeopleOS" },
      { name: "description", content: "Manage reference values: departments, locations, job profiles, cost centers, and compensation grades." },
    ],
  }),
  component: SetupPage,
});

const ENTITIES: FDMEntity[] = ["departments", "locations", "jobProfiles", "jobLevels", "costCenters", "compGrades", "payGroups"];

function SetupPage() {
  const fdm = useFDM();
  const [tab, setTab] = useState<FDMEntity>("departments");
  const [editing, setEditing] = useState<FDMRow | null>(null);
  const [creating, setCreating] = useState(false);

  const meta = ENTITY_META[tab];
  const rows = fdm[tab];

  return (
    <AppShell title="Foundation Data Management" subtitle="Setup · Tenant Configuration">
      <div className="mb-4 rounded-lg border border-border bg-card p-4 flex items-start gap-3">
        <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Reference data store.</span> These values
          back every transactional object in the system (positions, hires, payroll postings,
          security domains). In Workday these map to <em>Supervisory Organizations</em>,{" "}
          <em>Locations</em>, <em>Job Profiles</em>, <em>Cost Centers</em>, and{" "}
          <em>Compensation Grades</em>. Changes are persisted locally for the prototype and would
          flow through effective-dated business processes in production.
        </div>
        <button
          onClick={() => { if (confirm("Reset all foundation data to seed values?")) fdmStore.reset(); }}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
        >
          <RotateCcw className="h-3 w-3" /> Reset seed
        </button>
      </div>

      <div className="border-b border-border mb-4 flex gap-1 overflow-x-auto">
        {ENTITIES.map((e) => (
          <button
            key={e}
            onClick={() => setTab(e)}
            className={[
              "px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap",
              tab === e
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {ENTITY_META[e].label}
            <span className="ml-2 text-xs text-muted-foreground">({fdm[e].length})</span>
          </button>
        ))}
      </div>

      <SectionCard
        title={meta.label}
        description={`Workday object: ${meta.workdayObject}`}
        actions={
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> New {meta.singular}
          </button>
        }
      >
        <div className="overflow-x-auto border border-border rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Code</th>
                <th className="px-3 py-2.5 text-left font-medium">Name</th>
                {meta.attributeFields.map((f) => (
                  <th key={f.key} className="px-3 py-2.5 text-left font-medium">{f.label}</th>
                ))}
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-left font-medium">Created</th>
                <th className="px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  {meta.attributeFields.map((f) => (
                    <td key={f.key} className="px-3 py-2 text-muted-foreground">{r.attributes[f.key] ?? "—"}</td>
                  ))}
                  <td className="px-3 py-2">
                    <span className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                      r.active
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-slate-50 text-slate-600 ring-slate-200",
                    ].join(" ")}>{r.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{r.createdAt}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => setEditing(r)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete ${r.name}?`)) fdmStore.remove(tab, r.id); }}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5 + meta.attributeFields.length} className="px-3 py-6 text-center text-muted-foreground text-xs">
                    No {meta.label.toLowerCase()} defined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {(creating || editing) && (
        <RowEditor
          entity={tab}
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </AppShell>
  );
}

function RowEditor({ entity, existing, onClose }: { entity: FDMEntity; existing: FDMRow | null; onClose: () => void }) {
  const meta = ENTITY_META[entity];
  const [code, setCode] = useState(existing?.code ?? "");
  const [name, setName] = useState(existing?.name ?? "");
  const [active, setActive] = useState(existing?.active ?? true);
  const [attrs, setAttrs] = useState<Record<string, string>>(existing?.attributes ?? {});

  const save = () => {
    if (!code.trim() || !name.trim()) return;
    if (existing) {
      fdmStore.update(entity, existing.id, { code: code.trim(), name: name.trim(), active, attributes: attrs });
    } else {
      fdmStore.add(entity, { code: code.trim(), name: name.trim(), active, attributes: attrs });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog">
      <div className="flex-1 bg-foreground/20" onClick={onClose} />
      <aside className="w-full max-w-[440px] bg-card border-l border-border h-full overflow-y-auto">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{existing ? "Edit" : "New"}</div>
            <h2 className="text-lg font-semibold">{meta.singular}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <FieldInput label="Code" value={code} onChange={setCode} placeholder="ENG" mono />
          <FieldInput label="Name" value={name} onChange={setName} placeholder={meta.singular} />
          {meta.attributeFields.map((f) => (
            <FieldInput
              key={f.key}
              label={f.label}
              value={attrs[f.key] ?? ""}
              onChange={(v) => setAttrs((p) => ({ ...p, [f.key]: v }))}
              placeholder={f.placeholder}
            />
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!code.trim() || !name.trim()}
            className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
          >
            {existing ? "Save changes" : "Create"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, mono }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border border-border rounded-md bg-background ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
