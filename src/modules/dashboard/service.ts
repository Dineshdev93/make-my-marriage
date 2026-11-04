import { daysUntil, getTodayIST } from "@/lib/dates";
import type { AccessContext } from "@/lib/access-context";
import { getBudgetSummary, type BudgetSummary } from "@/modules/expenses/service";
import { listFunctions, type FunctionRecord } from "@/modules/functions/service";
import { listTasks, type TaskRecord } from "@/modules/tasks/service";
import { getWedding } from "@/modules/wedding/service";

export interface DashboardData {
  wedding: {
    name: string;
    coupleNames: string;
    weddingDate: string;
  };
  countdownDays: number;
  budget: BudgetSummary;
  upcomingFunctions: FunctionRecord[];
  upcomingTasks: TaskRecord[];
  pendingTaskCount: number;
  overdueTaskCount: number;
}

export async function getDashboard(context: AccessContext, now = new Date()): Promise<DashboardData> {
  const todayIST = getTodayIST(now);
  const [wedding, budget, functions, tasks] = await Promise.all([
    getWedding(context),
    getBudgetSummary(context),
    listFunctions(context),
    listTasks(context, todayIST),
  ]);

  const incompleteTasks = tasks.filter((task) => !task.completed);
  const upcomingTasks = [...incompleteTasks]
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt);
    })
    .slice(0, 5);

  return {
    wedding: { name: wedding.name, coupleNames: wedding.coupleNames, weddingDate: wedding.weddingDate },
    countdownDays: daysUntil(wedding.weddingDate, now),
    budget,
    upcomingFunctions: functions.filter((item) => item.date >= todayIST).slice(0, 5),
    upcomingTasks,
    pendingTaskCount: incompleteTasks.filter((task) => task.status === "pending").length,
    overdueTaskCount: incompleteTasks.filter((task) => task.status === "overdue").length,
  };
}
