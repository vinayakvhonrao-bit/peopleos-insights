# NeoCloud PeopleOS — Source Code README

A Workday-style People Operations and Workforce Planning prototype for a pre-IPO AI infrastructure company (~350 employees). Built as a functional demo that a CHRO, CFO, Finance partner, and People Systems leader could use to model headcount, payroll, and business process changes.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start v1 (file-based routing, SSR/SSG, server functions) |
| UI | React 19, Tailwind CSS v4, shadcn/ui primitives (Radix-based) |
| Charts | Recharts |
| Data (live) | Supabase (Postgres) with RLS policies |
| Data (synthetic) | Deterministic seeded RNG generating 350 employees, payroll, scenarios |
| AI | Lovable AI Gateway (`google/gemini-2.5-flash`) for executive commentary |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── AppShell.tsx          # Global nav, brand bar, page chrome
│   └── ui/                        # shadcn/ui primitives (Button, Dialog, Table, etc.)
├── hooks/
│   └── use-mobile.tsx
├── integrations/
│   └── supabase/                  # Auto-generated Supabase client, auth middleware, types
├── lib/
│   ├── data.ts                    # Synthetic data engine (employees, payroll, scenarios)
│   ├── planning.ts                # Workforce planning engine (events → 12-month projections)
│   ├── fdm.ts                     # Foundation Data Management (localStorage-backed reference data)
│   ├── insights.functions.ts      # Server function: AI Gateway commentary generation
│   ├── workflow.functions.ts      # Server functions: BP submit, approve, list, candidate fetch
│   └── utils.ts                   # cn() and helpers
├── routes/                        # TanStack file-based routing
│   ├── __root.tsx                 # Root layout (html shell)
│   ├── index.tsx                  # Home / landing (worklets, inbox, announcements)
│   ├── dashboard.tsx              # Executive KPIs + charts (headcount, payroll, IPO readiness)
│   ├── workforce.tsx              # Searchable worker directory with filters + detail drawer
│   ├── planning.tsx               # 12-month scenario modeling (hires, terms, transfers, comp)
│   ├── workflow.tsx               # Business process demo (job change + conditional approvals)
│   ├── payroll.tsx                # Semi-monthly preview, reconciliation, anomalies, GL posting
│   ├── insights.tsx               # AI-generated executive commentary + planning metrics
│   ├── setup.tsx                  # Foundation Data Management (departments, locations, etc.)
│   └── about.tsx                  # Architecture notes, assumptions, Workday mapping
├── router.tsx                     # TanStack Router bootstrap
├── start.ts                       # TanStack Start instance config
└── styles.css                     # Tailwind v4 theme + Workday-style color tokens

supabase/
└── migrations/                    # SQL migrations (dimensional schema + RLS)
```

---

## Key Design Decisions

### 1. Dual Data Layer
- **Synthetic data** (`src/lib/data.ts`): 350 employees generated deterministically via a seeded Mulberry32 RNG. All KPIs, payroll rows, and GL entries are reproducible on every load. No persistence needed for demo purposes.
- **Live Supabase data**: The Workflow page writes real records to Postgres (business processes, approvals, compensation history, job history). This demonstrates effective-dated transactions and auditability.

### 2. Dimensional Architecture (Workday-style)
The Supabase schema separates master data from transactional history:

| Concept | Tables |
|---------|--------|
| Worker | `employees` |
| Position | `positions` |
| Supervisory Org | `supervisory_orgs` |
| Assignment History | `position_assignments` (effective-dated) |
| Comp History | `compensation_history` (effective-dated) |
| Job History | `job_history` (effective-dated) |
| Business Process | `business_processes` + `business_process_approvals` + `business_process_events` |
| Audit | All tables have RLS; BP events capture actor/action/payload |

### 3. Workforce Planning Engine (`src/lib/planning.ts`)
- Treats each hire, termination, transfer, and comp change as a **planning event**.
- Events are separate from live employee data (scenario-based, not approved yet).
- Computes 12-month projections for: headcount, gross payroll, employer taxes, benefits, fully burdened cost.
- Supports conditional logic: backfill required, attrition assumptions, comp increases >15% flag for approval.

### 4. Conditional Business Process Routing (`src/lib/workflow.functions.ts`)
- Job Change BP dynamically builds its approval chain based on:
  - Salary increase > 15% → adds CFO Approval step
  - International location change → adds Payroll Review step
- On final approval, closes prior open history rows and writes new effective-dated records.

### 5. Payroll Anomaly Detection (`src/lib/data.ts` → `buildPayroll()`)
Five built-in rules flag rows for review:
1. Termination Pending worker included
2. Pay deviation > 20% from expected
3. New hire mid-period (prorate review)
4. Salary above compensation band
5. Department-level cost deviation > 60%

### 6. AI Integration (Bounded)
- Insights page calls `generateInsights` (server function) which hits the Lovable AI Gateway.
- AI receives **only aggregated KPIs** (headcount, run rate, scenario deltas, anomaly counts).
- AI never receives PII, never makes decisions, never calculates pay. Output is plain-language executive commentary.

---

## Page-by-Page Feature Map

| Route | File | What It Does |
|-------|------|--------------|
| `/` | `index.tsx` | Home hub with worklet grid, inbox, announcements |
| `/dashboard` | `dashboard.tsx` | Executive KPIs, headcount charts, IPO readiness checklist |
| `/workforce` | `workforce.tsx` | Searchable directory with 8 filters; worker detail drawer with effective-dated events |
| `/planning` | `planning.tsx` | 12-month scenario modeling (Baseline, Conservative, Growth); event log; Recharts trends |
| `/workflow` | `workflow.tsx` | Submit job changes; conditional routing visualization; advance approvals; audit trail |
| `/payroll` | `payroll.tsx` | Semi-monthly preview; reconciliation; anomaly table; tax composition; GL posting |
| `/insights` | `insights.tsx` | AI commentary generation; planning KPIs; anomaly summary |
| `/setup` | `setup.tsx` | CRUD for foundation data (departments, locations, job profiles, cost centers, comp grades) |
| `/about` | `about.tsx` | Architecture documentation, assumptions, Workday mapping |

---

## Design System

The app uses a **Workday-inspired** color palette defined in `src/styles.css`:

```css
--wd-navy-deep: #0f1d33    /* Primary brand */
--wd-navy: #1e3a5f         /* Nav gradient */
--wd-blue: #3b82a3         /* Secondary actions */
--wd-teal: #3b9ea5         /* Workforce */
--wd-green: #6b9e3b        /* Planning */
--wd-orange: #cf8a3a       /* Alerts / brand accent */
--wd-purple: #6b5b95       /* Payroll */
--wd-pink: #c44d8a         /* AI Insights */
```

All colors are semantic via CSS custom properties. Dark mode tokens are wired but the prototype is optimized for light mode.

---

## Running Locally

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# The app will be available at http://localhost:3000
```

> **Note:** The `workflow` page writes to Supabase. If Supabase is not configured, those writes will fail gracefully with an error message. All other pages work entirely from the synthetic data layer.

---

## Key Files to Understand First

1. **`src/lib/data.ts`** — The synthetic data engine. Everything flows from here.
2. **`src/lib/planning.ts`** — The 12-month projection logic and event types.
3. **`src/lib/workflow.functions.ts`** — Server-side BP orchestration and effective-dated writes.
4. **`src/lib/insights.functions.ts`** — Server-side AI Gateway call with bounded inputs.
5. **`supabase/migrations/20260615071303_*.sql`** — The dimensional schema (supervisory orgs, positions, assignments, audit events).
6. **`src/components/layout/AppShell.tsx`** — Shared page chrome, navigation, and typography hierarchy.

---

## Known Limitations (Documented)

- No authentication / RBAC — single-persona demo.
- Synthetic data regenerates on every load (no persistence for demo workers).
- Payroll math is simplified, not a substitute for a real engine.
- Workflow notifications and SLA timers are not implemented.
- Scenario engine projects at department aggregate, not per-position.

See `src/routes/about.tsx` for the full assumptions and Workday implementation mapping.
