export interface TaskStatusInput {
  dueDate: string;
  completed: boolean;
}

export type TaskStatus = "completed" | "overdue" | "pending";

export function computeTaskStatus(task: TaskStatusInput, todayIST: string): TaskStatus {
  if (task.completed) return "completed";
  return task.dueDate < todayIST ? "overdue" : "pending";
}
