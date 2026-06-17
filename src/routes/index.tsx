import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  GitBranch,
  Calculator,
  Sparkles,
  Settings,
  FileText,
  Inbox,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { EMPLOYEES, PAYROLL, monthlyRunRate, fmtUSD, fmtNum } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — NeoCloud PeopleOS" },
      { name: "description", content: "Your workday at NeoCloud. Quick access to people, payroll, planning, and approvals." },
    ],
  }),
  component: HomePage,
});

type Worklet = {
  to: string;
  label: string;
  icon: typeof Users;
  color: string; // css var
  description: string;
};

const WORKLETS: Worklet[] = [
  { to: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard, color: "var(--wd-blue)", description: "Headcount, payroll & IPO readiness" },
  { to: "/workforce", label: "Workforce Explorer", icon: Users, color: "var(--wd-teal)", description: "Browse and filter all workers" },
  { to: "/planning", label: "Workforce Planning", icon: TrendingUp, color: "var(--wd-green)", description: "Scenarios & 12-month projections" },
  { to: "/workflow", label: "Worker Data Change", icon: GitBranch, color: "var(--wd-orange)", description: "Business processes & approvals" },
  { to: "/payroll", label: "Payroll Preview", icon: Calculator, color: "var(--wd-purple)", description: "Run preview & anomaly review" },
  { to: "/insights", label: "AI Insights", icon: Sparkles, color: "var(--wd-pink)", description: "Trends, risks & recommendations" },
  { to: "/setup", label: "Foundation Data", icon: Settings, color: "var(--wd-navy)", description: "Org, jobs, locations, levels" },
  { to: "/about", label: "About This Prototype", icon: FileText, color: "oklch(0.55 0.04 250)", description: "Architecture & data model" },
];

function HomePage() {
  const active = EMPLOYEES.filter((e) => e.status === "Active").length;
  const anomalies = PAYROLL.filter((r) => r.anomaly).length;
  const runRate = monthlyRunRate();

  // Pick a real HR employee as the signed-in user (deterministic, from generated roster)
  const hrUser =
    EMPLOYEES.find((e) => e.jobProfile === "People Partner" && e.status === "Active") ??
    EMPLOYEES.find((e) => e.department === "G&A" && e.status === "Active");

  const greetingName = hrUser ? hrUser.firstName : "there";

  const announcements = [
    { tag: "Comp", title: "FY26 merit cycle planning kickoff", date: "Jun 18" },
    { tag: "Payroll", title: "International payroll cutover window", date: "Jun 22" },
    { tag: "IPO", title: "SOX walkthrough — People controls", date: "Jun 30" },
  ];

  const tasks = [
    { icon: Clock, label: "Approve: Ava Chen — Job Change to IC5", who: "Awaiting your decision", status: "pending" as const },
    { icon: Clock, label: "Approve: Marcus Lee — Comp change +12%", who: "Awaiting your decision", status: "pending" as const },
    { icon: CheckCircle2, label: "Reviewed: Q2 headcount plan v3", who: "Completed yesterday", status: "done" as const },
  ];

  return (
    <AppShell title={`Welcome back, ${greetingName}`} subtitle="Home">

      {/* Hero banner */}
      <div
        className="rounded-xl p-7 mb-6 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--wd-navy-deep) 0%, var(--wd-blue) 70%, var(--wd-teal) 130%)",
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">Monday, June 15, 2026</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Your people data at a glance</h2>
          <p className="mt-1.5 text-sm text-white/80">
            {fmtNum(active)} active workers · {fmtUSD(runRate)} monthly run rate ·{" "}
            {anomalies > 0 ? `${anomalies} payroll anomalies need review` : "no payroll anomalies"}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/workflow"
              className="inline-flex items-center gap-1.5 rounded-md bg-white text-[13px] font-medium px-3.5 h-9 hover:bg-white/90 transition-colors"
              style={{ color: "var(--wd-navy-deep)" }}
            >
              Start a worker change <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/30 text-[13px] font-medium px-3.5 h-9 hover:bg-white/10 transition-colors"
            >
              Open dashboard
            </Link>
          </div>
        </div>
        <div
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, var(--wd-orange) 0%, transparent 60%)" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Worklets */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Applications</h3>
            <span className="text-xs text-muted-foreground">{WORKLETS.length} worklets</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {WORKLETS.map((w) => {
              const Icon = w.icon;
              return (
                <Link
                  key={w.to}
                  to={w.to as never}
                  className="group rounded-lg border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="h-11 w-11 rounded-lg flex items-center justify-center text-white mb-3"
                    style={{ background: w.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-[13px] font-semibold text-foreground leading-tight">{w.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{w.description}</div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Right column: Inbox + Announcements */}
        <aside className="space-y-6">
          <section className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Your Inbox</h3>
              </div>
              <Link to="/workflow" className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {tasks.map((t, i) => {
                const Icon = t.icon;
                return (
                  <li key={i} className="px-4 py-3 flex items-start gap-3">
                    <Icon
                      className={`h-4 w-4 mt-0.5 ${t.status === "pending" ? "text-amber-600" : "text-emerald-600"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground leading-snug">{t.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.who}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Announcements</h3>
            </div>
            <ul className="divide-y divide-border">
              {announcements.map((a, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    >
                      {a.tag}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">{a.date}</span>
                  </div>
                  <div className="text-[13px] font-medium text-foreground mt-1.5 leading-snug">{a.title}</div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
