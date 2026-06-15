import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  GitBranch,
  Calculator,
  Sparkles,
  FileText,
  Building2,
} from "lucide-react";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: typeof Users; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Executive Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/workforce", label: "Workforce Explorer", icon: Users },
  { to: "/planning", label: "Workforce Planning", icon: TrendingUp },
  { to: "/workflow", label: "Worker Data Change", icon: GitBranch },
  { to: "/payroll", label: "Payroll Preview", icon: Calculator },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/about", label: "About This Prototype", icon: FileText },
];

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">NeoCloud</div>
            <div className="text-xs text-muted-foreground leading-tight">PeopleOS</div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          <div className="font-medium text-foreground">Tenant</div>
          <div>NeoCloud Inc. · Prod (Preview)</div>
          <div className="mt-1">Period: Jun 1–15, 2026</div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{subtitle ?? "People Operations"}</div>
            <h1 className="text-lg font-semibold leading-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Signed in as</span>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-medium">JM</div>
              <div className="hidden sm:block">
                <div className="text-foreground font-medium leading-tight">Jordan Mehta</div>
                <div className="leading-tight">VP, People Operations</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

// Common building blocks

export function KpiCard({
  label, value, hint, tone = "default",
}: { label: string; value: string; hint?: string; tone?: "default" | "warn" | "good" }) {
  const toneCls =
    tone === "warn" ? "text-amber-700" :
    tone === "good" ? "text-emerald-700" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`mt-1.5 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function SectionCard({
  title, description, children, actions,
}: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "On Leave": "bg-amber-50 text-amber-700 ring-amber-200",
    "Termination Pending": "bg-rose-50 text-rose-700 ring-rose-200",
    Contractor: "bg-sky-50 text-sky-700 ring-sky-200",
    "Within Band": "bg-slate-50 text-slate-700 ring-slate-200",
    "Above Band": "bg-rose-50 text-rose-700 ring-rose-200",
    "Below Band": "bg-amber-50 text-amber-700 ring-amber-200",
    Complete: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "In Progress": "bg-sky-50 text-sky-700 ring-sky-200",
    Pending: "bg-slate-50 text-slate-600 ring-slate-200",
    Skipped: "bg-slate-50 text-slate-500 ring-slate-200",
  };
  const cls = map[status] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  );
}
