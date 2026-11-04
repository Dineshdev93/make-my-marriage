import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
import { Icon } from "@/components/ui/Icon";
import { getEditorContext, requireUser } from "@/lib/access";
import { formatDisplayDate } from "@/lib/dates";
import { formatPaise } from "@/lib/money";
import { getDashboard } from "@/modules/dashboard/service";

const quickActionClasses = {
  primary: "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-transparent bg-primary px-5 text-sm font-medium text-background transition-colors hover:bg-primary-hover",
  secondary: "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-primary bg-transparent px-5 text-sm font-medium text-primary transition-colors hover:bg-background",
};

function countdownText(days: number): string {
  if (days === 0) return "Today";
  return days > 0 ? `${days} days to go` : `${Math.abs(days)} days ago`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const dashboard = await getDashboard(context);
  const overBudget = dashboard.budget.exceededPaise > 0;

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 text-foreground">
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="break-words font-heading text-[30px] leading-tight tracking-tight sm:text-[32px]">{dashboard.wedding.name}</h1>
          <p className="text-sm text-muted">{dashboard.wedding.coupleNames}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted"><Icon name="calendar" size={17} />{formatDisplayDate(dashboard.wedding.weddingDate)}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 self-start rounded-xl border border-border bg-background px-5 py-3.5 sm:self-auto">
          <span className="font-heading text-[40px] font-light leading-none text-primary sm:text-[44px]">{Math.abs(dashboard.countdownDays)}</span>
          <span className="font-heading text-lg font-light italic text-muted">{countdownText(dashboard.countdownDays)}</span>
        </div>
      </section>

      <nav aria-label="Quick actions" className="flex flex-wrap items-center gap-3">
        <Link className={quickActionClasses.primary} href="/expenses"><Icon name="plus" size={18} />Add Expense</Link>
        <Link className={quickActionClasses.secondary} href="/functions"><Icon name="plus" size={18} />Add Function</Link>
        <Link className={quickActionClasses.secondary} href="/tasks"><Icon name="plus" size={18} />Add Task</Link>
        <Link className={quickActionClasses.secondary} href="/guests"><Icon name="plus" size={18} />Add Guest</Link>
      </nav>

      <section aria-label="Budget summary" className="flex flex-col gap-3">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="flex min-h-44 flex-col justify-between rounded-2xl border border-border bg-card p-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Total budget</p>
            <p className="mt-3 font-heading text-3xl tracking-tight tabular-nums">{formatPaise(dashboard.budget.totalBudgetPaise)}</p>
          </article>
          <article className="flex min-h-44 flex-col justify-between rounded-2xl border border-border bg-card p-6">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Recorded expenses</p><p className="mt-3 font-heading text-3xl tracking-tight tabular-nums">{formatPaise(dashboard.budget.totalExpensesPaise)}</p></div>
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted">{dashboard.budget.usedPercent}% of the budget used</p>
          </article>
          <article className="flex min-h-44 flex-col justify-between rounded-2xl border border-border bg-card p-6">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Remaining budget</p><p className={`mt-3 font-heading text-3xl tracking-tight tabular-nums ${overBudget ? "text-[#4A6074]" : "text-primary"}`}>{overBudget ? `Over budget by ${formatPaise(dashboard.budget.exceededPaise)}` : formatPaise(dashboard.budget.remainingPaise)}</p></div>
            <div className="mt-4 border-t border-border pt-3"><div aria-label={`${Math.min(dashboard.budget.usedPercent, 100)}% of budget used`} className="h-1.5 w-full overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(dashboard.budget.usedPercent, 100)}%` }} /></div></div>
          </article>
        </div>
        <p className="flex items-center gap-2.5 rounded-[10px] border border-[#D3DFE8] bg-[#F1F5F8] px-4 py-2.5 text-xs leading-5 text-[#4A6074]">
          <Icon className="shrink-0" name="info" size={16} />
          {overBudget ? `Your recorded expenses are ${formatPaise(dashboard.budget.exceededPaise)} above your budget.` : "If spending goes over budget, the amount exceeded appears here."}
        </p>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <header className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-4">
            <h2 className="font-heading text-[22px]">Upcoming functions</h2>
            <Link className="whitespace-nowrap text-sm text-primary underline-offset-4 hover:underline" href="/functions">View all</Link>
          </header>
          {dashboard.upcomingFunctions.length === 0 ? <p className="py-8 text-center text-sm text-muted">No upcoming functions.</p> : (
            <div className="divide-y divide-border">
              {dashboard.upcomingFunctions.map((item) => <article className="flex flex-col py-3.5" key={item.id}>
                <h3 className="break-words text-sm font-medium">{item.name}</h3>
                <p className="mt-0.5 break-words text-[13px] text-muted">{formatDisplayDate(item.date)}{item.venue ? <> <span aria-hidden="true">·</span> {item.venue}</> : null}</p>
              </article>)}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <header className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <h2 className="font-heading text-[22px]">Upcoming tasks</h2>
            <div className="flex flex-wrap items-center gap-2">
              {dashboard.overdueTaskCount > 0 ? <span className="whitespace-nowrap rounded-md border border-[#4A6074]/30 bg-[#4A6074]/10 px-2 py-1 text-xs font-medium text-[#4A6074]">{dashboard.overdueTaskCount} overdue</span> : null}
              <span className="whitespace-nowrap text-xs text-muted">{dashboard.pendingTaskCount} pending</span>
              <Link className="ml-1 whitespace-nowrap text-sm text-primary underline-offset-4 hover:underline" href="/tasks">View all</Link>
            </div>
          </header>
          <DashboardTasks tasks={dashboard.upcomingTasks} />
        </section>
      </div>
    </main>
  );
}
