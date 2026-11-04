import { describe, expect, it } from "vitest";
import type { TaskRecord } from "@/modules/tasks/service";
import { filterTasks, getTaskTabCounts } from "./task-view";

const makeTask = (id: string, status: TaskRecord["status"]): TaskRecord => ({
  id,
  weddingId: "wedding",
  title: id,
  dueDate: "2027-03-12",
  completed: status === "completed",
  completedAt: status === "completed" ? "2027-03-10T00:00:00.000Z" : null,
  functionId: null,
  status,
  createdBy: "user",
  updatedBy: "user",
  createdAt: "2027-03-10T00:00:00.000Z",
  updatedAt: "2027-03-10T00:00:00.000Z",
});

describe("task view helpers", () => {
  const tasks = [makeTask("pending-a", "pending"), makeTask("overdue-a", "overdue"), makeTask("completed-a", "completed")];

  it("counts each tab and filters tasks in the browser", () => {
    expect(getTaskTabCounts(tasks)).toEqual({ all: 3, pending: 1, overdue: 1, completed: 1 });
    expect(filterTasks(tasks, "overdue").map(({ id }) => id)).toEqual(["overdue-a"]);
    expect(filterTasks(tasks, "all")).toHaveLength(3);
  });
});
