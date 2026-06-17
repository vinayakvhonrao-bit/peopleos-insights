import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  GitBranch,
  Calculator,
  Sparkles,
  FileText,
  Settings,
  Search,
  Bell,
  Inbox,
  Grid3x3,
} from "lucide-react";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: typeof Users; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/setup", label: "Foundation Data", icon: Settings },
  { to: "/workforce", label: "Workforce Explorer", icon: Users },
  { to: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/planning", label: "Workforce Planning", icon: TrendingUp },
  { to: "/workflow", label: "Worker Data Change", icon: GitBranch },
  { to: "/payroll", label: "Payroll Preview", icon: Calculator },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/about", label: "About / Architecture", icon: FileText },
];

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col w-full bg-muted/40">
      {/* Workday-style global brand bar */}
      <header
        className="h-14 shrink-0 flex items-center justify-between px-5 text-white"
        style={{ background: "linear-gradient(180deg, var(--wd-navy) 0%, var(--wd-navy-deep) 100%)" }}
      >
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--wd-orange)", color: "white" }}
            >
              N
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight">NeoCloud</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/60">PeopleOS</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={[
                    "px-3 py-1.5 rounded text-[13px] transition-colors",
                    active
                      ? "bg-white/15 text-white font-medium"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-md px-3 h-9 w-72 transition-colors">
            <Search className="h-4 w-4 text-white/70" />
            <input
              placeholder="Search workers, tasks, reports…"
              className="bg-transparent text-sm placeholder:text-white/50 outline-none flex-1"
            />
          </div>
          <button className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-white/10" aria-label="Apps">
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-white/10 relative" aria-label="Inbox">
            <Inbox className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--wd-orange)" }} />
          </button>
          <button className="h-9 w-9 rounded-md flex items-center justify-center hover:bg-white/10" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <div className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-semibold ml-1">
            JM
          </div>
        </div>
      </header>

      {/* Sub-header with page title + breadcrumb */}
      <div className="border-b border-border bg-card px-6 h-14 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.12em]">{subtitle ?? "People Operations"}</div>
          <h1 className="text-[17px] font-semibold leading-tight text-foreground">{title}</h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span>NeoCloud Inc.</span>
          <span className="text-border">·</span>
          <span>Period: Jun 1–15, 2026</span>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
      </main>
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
