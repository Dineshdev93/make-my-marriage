import { describe, expect, it } from "vitest";
import { TaskModel } from "./model";

describe("Task model", () => {
  it("defines the documented indexes, status defaults, and optional function link", () => {
    expect(TaskModel.schema.indexes()).toContainEqual([{ weddingId: 1, dueDate: 1 }, {}]);
    expect(TaskModel.schema.indexes()).toContainEqual([{ weddingId: 1, functionId: 1 }, {}]);
    for (const path of ["weddingId", "title", "dueDate", "createdBy", "updatedBy"]) {
      expect(TaskModel.schema.path(path).options.required).toBe(true);
    }
    expect(TaskModel.schema.path("completed").options.default).toBe(false);
    expect(TaskModel.schema.path("completedAt").options.default).toBeNull();
    expect(TaskModel.schema.path("functionId").options.default).toBeNull();
  });
});
