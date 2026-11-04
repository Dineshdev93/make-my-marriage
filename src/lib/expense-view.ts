import type { ExpenseRecord } from "@/modules/expenses/service";
import { formatPaise } from "./money";

export type ExpenseSort = "newest" | "oldest" | "highest" | "lowest";

export interface ExpenseFilters {
  category: string;
  functionId: string;
  sort: ExpenseSort;
}

export function filterAndSortExpenses(expenses: ExpenseRecord[], filters: ExpenseFilters): ExpenseRecord[] {
  return expenses
    .filter((expense) => filters.category === "all" || expense.category === filters.category)
    .filter((expense) => filters.functionId === "all" || expense.functionId === filters.functionId)
    .sort((a, b) => {
      if (filters.sort === "newest") return b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt);
      if (filters.sort === "oldest") return a.expenseDate.localeCompare(b.expenseDate) || a.createdAt.localeCompare(b.createdAt);
      if (filters.sort === "highest") return b.amountPaise - a.amountPaise || b.expenseDate.localeCompare(a.expenseDate);
      return a.amountPaise - b.amountPaise || a.expenseDate.localeCompare(b.expenseDate);
    });
}

export function getExpenseSaveToastMessage(totalBudgetPaise: number, currentTotalPaise: number, changePaise: number): string {
  const exceededPaise = currentTotalPaise + changePaise - totalBudgetPaise;
  return exceededPaise > 0
    ? `Saved. You are now ${formatPaise(exceededPaise)} over budget.`
    : "Expense saved.";
}
