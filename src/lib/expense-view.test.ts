import { describe, expect, it } from "vitest";
import { filterAndSortExpenses, getExpenseSaveToastMessage } from "./expense-view";
import type { ExpenseRecord } from "@/modules/expenses/service";

const makeExpense = (id: string, date: string, amountPaise: number, category: ExpenseRecord["category"], functionId: string | null): ExpenseRecord => ({
  id,
  weddingId: "wedding",
  amountPaise,
  category,
  description: id,
  expenseDate: date,
  functionId,
  createdBy: "user",
  updatedBy: "user",
  createdAt: `${date}T00:00:00.000Z`,
  updatedAt: `${date}T00:00:00.000Z`,
});

describe("expense view helpers", () => {
  const expenses = [
    makeExpense("old", "2027-03-10", 500, "Venue", "function-a"),
    makeExpense("new", "2027-03-12", 1_500, "Catering", null),
    makeExpense("middle", "2027-03-11", 1_000, "Venue", "function-a"),
  ];

  it("filters by category and function, and sorts by date or amount", () => {
    expect(filterAndSortExpenses(expenses, { category: "Venue", functionId: "function-a", sort: "newest" }).map(({ id }) => id)).toEqual(["middle", "old"]);
    expect(filterAndSortExpenses(expenses, { category: "all", functionId: "all", sort: "highest" }).map(({ id }) => id)).toEqual(["new", "middle", "old"]);
    expect(filterAndSortExpenses(expenses, { category: "all", functionId: "all", sort: "oldest" }).map(({ id }) => id)).toEqual(["old", "middle", "new"]);
  });

  it("builds the over-budget toast only after the projected save is applied", () => {
    expect(getExpenseSaveToastMessage(10_000, 9_000, 500)).toBe("Expense saved.");
    expect(getExpenseSaveToastMessage(10_000, 9_000, 2_000)).toBe("Saved. You are now ₹10 over budget.");
  });
});
