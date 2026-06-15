import { createFileRoute } from "@tanstack/react-router";
import { AppShell, SectionCard } from "@/components/layout/AppShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About This Prototype — NeoCloud PeopleOS" },
      { name: "description", content: "Architecture notes, AI approach, assumptions, and Workday implementation mapping for the NeoCloud PeopleOS prototype." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell title="About This Prototype" subtitle="Architecture Notes · Implementation Mapping">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Purpose">
          <p className="text-sm leading-relaxed">
            NeoCloud PeopleOS is a take-home prototype demonstrating what a modern, AI-enhanced People Operations and Workforce Planning experience could look like for a pre-IPO AI infrastructure company currently running on Rippling and spreadsheets. It is intentionally scoped to feel like a tool a CHRO, CFO, HR Ops, Payroll, and People Systems leader would use side-by-side with Workday — not a flashy generative-AI dashboard.
          </p>
        </SectionCard>

        <SectionCard title="Technology Choices">
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            <li><strong>React + TanStack Start (TanStack Router):</strong> file-based routing, SSR-friendly, typed loaders.</li>
            <li><strong>Tailwind CSS v4 + shadcn-style tokens:</strong> consistent enterprise palette and typography.</li>
            <li><strong>Recharts:</strong> functional, restrained data visualization (bar/line/pie).</li>
            <li><strong>Deterministic data layer:</strong> 350 synthetic workers generated from a seeded RNG so all KPIs, payroll, scenarios, and GL are reproducible.</li>
            <li><strong>AI Gateway (planned wiring):</strong> Lovable AI Gateway with Gemini 3 Flash class for executive commentary only — read-only over structured outputs.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Data Model (Conceptual)">
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>Worker Master Data — identity, status, contact, employment class</li>
            <li>Position Data — job profile, level, cost center, location</li>
            <li>Supervisory Organization — manager hierarchy by department</li>
            <li>Department / Cost Center — Engineering, GPU Cloud, On-Prem, G&A</li>
            <li>Location & Currency — SF, San Jose, Remote-US, Toronto, London, Bangalore</li>
            <li>Job Profile — title + level + comp band</li>
            <li>Compensation History — effective-dated</li>
            <li>Worker Events — hire, comp change, location change, leave, termination</li>
            <li>Business Process Instances + Steps — initiation, conditional routing, approvals</li>
            <li>Audit Logs — actor, role, action, field, old/new value, timestamp</li>
            <li>Scenario Assumptions — hire plan, attrition, merit, effective date</li>
            <li>Payroll Results, Anomalies, GL Postings</li>
          </ul>
        </SectionCard>

        <SectionCard title="AI / ML Approach">
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            <li><strong>Bounded role.</strong> AI never makes employment decisions, calculates pay, or invents numbers.</li>
            <li><strong>Inputs.</strong> Only aggregated KPIs, scenario results, and anomaly type/counts are surfaced to the model.</li>
            <li><strong>Outputs.</strong> Plain-language commentary for CFO/CHRO, anomaly explanations, and risk narration.</li>
            <li><strong>PII handling.</strong> Worker names are excluded; employee IDs only when control follow-up requires identification.</li>
            <li><strong>Determinism.</strong> All metrics that drive the narrative come from app logic — re-running narrative does not change underlying values.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Assumptions">
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            <li>~350 synthetic employees; distributions match the brief.</li>
            <li>Semi-monthly payroll period ending 2026-06-15.</li>
            <li>FX rates: USD 1.00, CAD 0.74, GBP 1.27, INR 0.012 — frozen for prototype.</li>
            <li>US employer tax ~8.65% (FICA + simplified unemployment); UK NI 13.8%; Canada blended 7.5%; India PF effective 6% (12% of 50% of gross).</li>
            <li>Benefits load 10% (US) / 5% (international).</li>
            <li>Compensation bands derived from per-level USD midpoints adjusted by location multiplier.</li>
            <li>Workflow conditional routing thresholds: salary increase &gt; 15% requires CFO; international relocation requires Payroll Review.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Known Limitations">
          <ul className="text-sm space-y-1.5 list-disc pl-5">
            <li>No authentication, RBAC, or domain security — single-persona demo.</li>
            <li>No persistence — synthetic data is regenerated deterministically on every load.</li>
            <li>Payroll math is simplified and not a substitute for a real payroll engine.</li>
            <li>Workflow advances are in-memory only; no real notifications or SLA timers.</li>
            <li>Scenario engine projects at department aggregate, not per-position.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Workday Implementation Mapping">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Group title="Foundation Data">
              <Item k="Supervisory Organizations" v="Mirror department hierarchy with one Sup Org per dept; M-level managers own subordinate Sup Orgs." />
              <Item k="Job Profiles" v="One per (jobProfile × level) with comp grade attached." />
              <Item k="Positions" v="Position management for filled + approved-to-hire roles; scenarios become approved-headcount requests." />
              <Item k="Locations" v="6 locations; tied to country, currency, holiday calendar, payroll provider." />
              <Item k="Cost Centers" v="CC-1000/2000/3000/9000 — feeds GL via Worktag." />
              <Item k="Compensation Grades & Bands" v="Per-level low/mid/high USD, with location multiplier as comp grade modifier." />
            </Group>
            <Group title="Process & Security">
              <Item k="Business Process Framework" v="Promotion + Comp Change BP with Initiation → Manager → Skip-Level → HRP → People Ops." />
              <Item k="Conditional Routing" v="Custom BP condition rules: (Salary Δ &gt; 15%) ⇒ add CFO step; (Intl location change) ⇒ add Payroll step." />
              <Item k="Security Groups" v="Role-based (Manager, HRBP, Payroll Partner, People Ops, CFO) constrained by Sup Org." />
              <Item k="Domain Security" v="Compensation, Payroll, Personal Data domains gated per role." />
              <Item k="Audit Trails" v="BP audit + Worker history reports for SOX evidence." />
              <Item k="SOX Controls" v="Segregation of duties between initiator and final approver; auto-fail if same person." />
            </Group>
            <Group title="Payroll & Integrations">
              <Item k="Payroll Parallel Testing" v="Run Workday Payroll in parallel with Rippling for 2+ cycles before cutover, reconcile to the cent." />
              <Item k="Integrations" v="Outbound: GL to NetSuite/SAP. Inbound: applicant data from Greenhouse. International providers via Payroll Connect." />
              <Item k="Reporting" v="Standard reports for headcount, comp ratio, anomaly review; Worksheets for scenario modeling pre-Adaptive." />
            </Group>
            <Group title="Cutover Readiness">
              <Item k="Data Migration" v="Workers, Positions, Comp History, Effective-Dated Events loaded via EIB; reconcile counts and totals." />
              <Item k="Change Management" v="Manager + HRBP enablement; approval inbox training; security walkthroughs." />
              <Item k="Post-Go-Live" v="Hypercare for 2 cycles; anomaly dashboard from this prototype becomes a Workday report." />
            </Group>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-sm border-b border-border pb-1.5 last:border-0">
      <div className="font-medium">{k}</div>
      <div className="text-muted-foreground text-xs leading-snug">{v}</div>
    </div>
  );
}
