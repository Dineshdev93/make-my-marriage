import { describe, expect, it } from "vitest";
import { ExpenseModel } from "./model";

describe("Expense model", () => {
  it("defines the documented indexes and required relationship and audit fields", () => {
    expect(ExpenseModel.schema.indexes()).toContainEqual([{ weddingId: 1, expenseDate: 1 }, {}]);
    expect(ExpenseModel.schema.indexes()).toContainEqual([{ weddingId: 1, functionId: 1 }, {}]);
    for (const path of ["weddingId", "amountPaise", "category", "description", "expenseDate", "createdBy", "updatedBy"]) {
      expect(ExpenseModel.schema.path(path).options.required).toBe(true);
    }
    expect(ExpenseModel.schema.path("functionId").options.default).toBeNull();
  });
});
