import { describe, expect, it } from "vitest";
import { MAX_AMOUNT_PAISE } from "@/lib/money";
import { EXPENSE_CATEGORIES } from "./constants";
import { createExpenseSchema, updateExpenseSchema } from "./schema";

const validExpense = { amountPaise: 100, category: "Venue", description: " Venue deposit ", expenseDate: "2026-06-30" };

describe("expense schemas", () => {
  it("accepts amount boundaries and rejects invalid amounts", () => {
    for (const amount of [100, MAX_AMOUNT_PAISE]) expect(createExpenseSchema.safeParse({ ...validExpense, amountPaise: amount }).success).toBe(true);
    for (const amount of [99, MAX_AMOUNT_PAISE + 1, 0, -100, 100.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(createExpenseSchema.safeParse({ ...validExpense, amountPaise: amount }).success).toBe(false);
    }
  });

  it("accepts all categories and rejects unsupported categories", () => {
    for (const value of EXPENSE_CATEGORIES) expect(createExpenseSchema.safeParse({ ...validExpense, category: value }).success).toBe(true);
    expect(createExpenseSchema.safeParse({ ...validExpense, category: "Food" }).success).toBe(false);
  });

  it("trims descriptions, validates dates, accepts null links, and strips unknown fields", () => {
    expect(createExpenseSchema.parse({ ...validExpense, functionId: null, weddingId: "untrusted" })).toEqual({ ...validExpense, description: "Venue deposit", functionId: null });
    expect(createExpenseSchema.safeParse({ ...validExpense, description: "  " }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...validExpense, description: "x".repeat(501) }).success).toBe(false);
    expect(createExpenseSchema.safeParse({ ...validExpense, expenseDate: "2026-02-30" }).success).toBe(false);
  });

  it("requires at least one known field for updates and strips unknown fields", () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(false);
    expect(updateExpenseSchema.parse({ functionId: null, weddingId: "untrusted" })).toEqual({ functionId: null });
  });
});
