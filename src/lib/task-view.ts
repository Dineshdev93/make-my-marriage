import type { TaskRecord } from "@/modules/tasks/service";
import type { TaskStatus } from "@/modules/tasks/status";

export type TaskTab = "all" | TaskStatus;

export function getTaskTabCounts(tasks: TaskRecord[]): Record<TaskTab, number> {
  return {
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    overdue: tasks.filter((task) => task.status === "overdue").length,
    completed: tasks.filter((task) => task.status === "completed").length,
  };
}

export function filterTasks(tasks: TaskRecord[], tab: TaskTab): TaskRecord[] {
  return tab === "all" ? tasks : tasks.filter((task) => task.status === tab);
}
