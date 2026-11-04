import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FunctionRecord } from "@/modules/functions/service";
import type { TaskRecord } from "@/modules/tasks/service";
import type { WeddingRecord } from "@/modules/wedding/service";

const { getWedding, getBudgetSummary, listFunctions, listTasks } = vi.hoisted(() => ({
  getWedding: vi.fn(),
  getBudgetSummary: vi.fn(),
  listFunctions: vi.fn(),
  listTasks: vi.fn(),
}));
vi.mock("@/modules/wedding/service", () => ({ getWedding }));
vi.mock("@/modules/expenses/service", () => ({ getBudgetSummary }));
vi.mock("@/modules/functions/service", () => ({ listFunctions }));
vi.mock("@/modules/tasks/service", () => ({ listTasks }));

import { getDashboard } from "./service";

const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const wedding: WeddingRecord = {
  id: context.weddingId, name: "Aarav and Meera's Wedding", coupleNames: "Aarav and Meera", weddingDate: "2027-03-14",
  totalBudgetPaise: 1_500_000, editorIds: [context.userId], createdBy: context.userId, updatedBy: context.userId,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const budget = { totalBudgetPaise: 1_500_000, totalExpensesPaise: 942_000, remainingPaise: 558_000, exceededPaise: 0, usedPercent: 63 };

function makeFunction(id: string, date: string): FunctionRecord {
  return { id, weddingId: context.weddingId, name: id, date, createdBy: context.userId, updatedBy: context.userId, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

function makeTask(id: string, dueDate: string, status: TaskRecord["status"], completed = false): TaskRecord {
  return { id, weddingId: context.weddingId, title: id, dueDate, completed, completedAt: null, functionId: null, status, createdBy: context.userId, updatedBy: context.userId, createdAt: `${dueDate}T00:00:00.000Z`, updatedAt: `${dueDate}T00:00:00.000Z` };
}

beforeEach(() => {
  vi.clearAllMocks();
  getWedding.mockResolvedValue(wedding);
  getBudgetSummary.mockResolvedValue(budget);
  listFunctions.mockResolvedValue([
    makeFunction("past", "2027-03-11"), makeFunction("today", "2027-03-12"),
    makeFunction("future-a", "2027-03-13"), makeFunction("future-b", "2027-03-14"),
    makeFunction("future-c", "2027-03-15"), makeFunction("future-d", "2027-03-16"),
    makeFunction("future-e", "2027-03-17"),
  ]);
  listTasks.mockResolvedValue([
    makeTask("pending", "2027-03-12", "pending"),
    makeTask("overdue-later", "2027-03-11", "overdue"),
    makeTask("overdue-sooner", "2027-03-10", "overdue"),
    makeTask("completed", "2027-03-01", "completed", true),
    makeTask("pending-later", "2027-03-13", "pending"),
    makeTask("pending-last", "2027-03-14", "pending"),
    makeTask("pending-extra", "2027-03-15", "pending"),
  ]);
});

describe("getDashboard", () => {
  it("combines wedding and budget data with the next five functions and incomplete tasks", async () => {
    const now = new Date("2027-03-12T05:00:00.000Z");
    const dashboard = await getDashboard(context, now);

    expect(dashboard.wedding).toEqual({ name: wedding.name, coupleNames: wedding.coupleNames, weddingDate: wedding.weddingDate });
    expect(dashboard.countdownDays).toBe(2);
    expect(dashboard.budget).toEqual(budget);
    expect(dashboard.upcomingFunctions.map(({ id }) => id)).toEqual(["today", "future-a", "future-b", "future-c", "future-d"]);
    expect(dashboard.upcomingTasks.map(({ id }) => id)).toEqual(["overdue-sooner", "overdue-later", "pending", "pending-later", "pending-last"]);
    expect(dashboard.pendingTaskCount).toBe(4);
    expect(dashboard.overdueTaskCount).toBe(2);
    expect(listTasks).toHaveBeenCalledWith(context, "2027-03-12");
  });
});
