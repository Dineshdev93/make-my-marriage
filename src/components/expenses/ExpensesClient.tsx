"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { formatDisplayDate } from "@/lib/dates";
import { filterAndSortExpenses, getExpenseSaveToastMessage, type ExpenseSort } from "@/lib/expense-view";
import { formatPaise, parseRupeesToPaise } from "@/lib/money";
import { formatRupeesWhileTyping } from "@/lib/wedding-setup";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/modules/expenses/constants";
import { createExpenseSchema, updateExpenseSchema } from "@/modules/expenses/schema";
import type { BudgetSummary, ExpenseRecord } from "@/modules/expenses/service";
import type { FunctionRecord } from "@/modules/functions/service";

interface ApiResponse {
  data?: ExpenseRecord | { id: string };
  error?: { message?: string; fields?: Record<string, string> };
}

interface Values {
  amount: string;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  functionId: string;
}

const blankValues: Values = { amount: "", category: "Venue", description: "", expenseDate: "", functionId: "" };

function amountAsRupees(amountPaise: number): string {
  return formatRupeesWhileTyping(String(Math.floor(amountPaise / 100)));
}

export function ExpensesClient({ expenses, summary, functions }: { expenses: ExpenseRecord[]; summary: BudgetSummary; functions: FunctionRecord[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState({ category: "all", functionId: "all", sort: "newest" as ExpenseSort });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRecord | null>(null);
  const [values, setValues] = useState<Values>(blankValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ExpenseRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastId, setToastId] = useState(0);

  const visibleExpenses = useMemo(() => filterAndSortExpenses(expenses, filters), [expenses, filters]);
  const functionNames = useMemo(() => new Map(functions.map((item) => [item.id, item.name])), [functions]);
  const filteredTotal = visibleExpenses.reduce((total, item) => total + item.amountPaise, 0);

  function showToast(text: string, variant: ToastMessage["variant"] = "success") {
    setToastId((id) => id + 1);
    setToast({ id: toastId + 1, text, variant });
  }

  function beginCreate() {
    setEditing(null);
    setValues(blankValues);
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
  }

  function beginEdit(expense: ExpenseRecord) {
    setEditing(expense);
    setValues({ amount: amountAsRupees(expense.amountPaise), category: expense.category, description: expense.description, expenseDate: expense.expenseDate, functionId: expense.functionId ?? "" });
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
    setServerError("");
    setFieldErrors({});
  }

  function updateField(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: field === "amount" ? formatRupeesWhileTyping(value) : value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError("");
    let amountPaise: number;
    try {
      amountPaise = parseRupeesToPaise(values.amount);
    } catch (error) {
      setFieldErrors({ amount: error instanceof Error ? error.message : "Enter a valid whole-rupee amount." });
      return;
    }
    const submitted = {
      amountPaise,
      category: values.category,
      description: values.description,
      expenseDate: values.expenseDate,
      ...(values.functionId ? { functionId: values.functionId } : {}),
    };
    const parsed = createExpenseSchema.safeParse(submitted);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
      setFieldErrors(errors);
      return;
    }

    let update: Record<string, unknown> = parsed.data;
    if (editing) {
      update = {};
      if (amountPaise !== editing.amountPaise) update.amountPaise = amountPaise;
      if (values.category !== editing.category) update.category = values.category;
      if (values.description.trim() !== editing.description) update.description = values.description.trim();
      if (values.expenseDate !== editing.expenseDate) update.expenseDate = values.expenseDate;
      const nextFunctionId = values.functionId || null;
      if (nextFunctionId !== editing.functionId) update.functionId = nextFunctionId;
      if (Object.keys(update).length === 0) {
        setServerError("Make a change before saving.");
        return;
      }
      const validUpdate = updateExpenseSchema.safeParse(update);
      if (!validUpdate.success) {
        setServerError("Please check the expense details and try again.");
        return;
      }
      update = validUpdate.data;
    }

    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/expenses/${editing.id}` : "/api/expenses", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        setFieldErrors(payload.error?.fields ?? {});
        setServerError(payload.error?.message ?? "We couldn't save this expense. Please try again.");
        return;
      }
      const change = amountPaise - (editing?.amountPaise ?? 0);
      setDrawerOpen(false);
      showToast(getExpenseSaveToastMessage(summary.totalBudgetPaise, summary.totalExpensesPaise, change));
      router.refresh();
    } catch {
      setServerError("We couldn't save this expense. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(`/api/expenses/${deleting.id}`, { method: "DELETE" });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        setDeleting(null);
        showToast(payload.error?.message ?? "We couldn't delete this expense. Please try again.", "error");
        return;
      }
      setDeleting(null);
      showToast("Expense deleted.");
      router.refresh();
    } catch {
      setDeleting(null);
      showToast("We couldn't delete this expense. Please try again.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const addButton = <Button className="whitespace-nowrap" onClick={beginCreate} type="button"><Icon name="plus" size={18} />Add expense</Button>;
  const overBudget = summary.exceededPaise > 0;

  return (
    <>
      <section className="space-y-6">
        <header className="flex min-w-0 items-center justify-between gap-4">
          <h1 className="min-w-0 truncate font-heading text-3xl tracking-tight">Budget and Expenses</h1>
          {addButton}
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Total budget</p>
            <p className="mt-2 font-heading text-2xl tabular-nums">{formatPaise(summary.totalBudgetPaise)}</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Recorded expenses</p>
            <p className="mt-2 font-heading text-2xl tabular-nums">{formatPaise(summary.totalExpensesPaise)}</p>
            <p className="mt-1 text-xs text-muted">{summary.usedPercent}% of the budget used</p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Remaining budget</p>
            <p className={`mt-2 font-heading text-2xl tabular-nums ${overBudget ? "text-[#4A6074]" : "text-primary"}`}>
              {overBudget ? `Over budget by ${formatPaise(summary.exceededPaise)}` : formatPaise(summary.remainingPaise)}
            </p>
            <div aria-label={`${Math.min(summary.usedPercent, 100)}% of budget used`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(summary.usedPercent, 100)}%` }} />
            </div>
          </article>
        </div>

        <p className="rounded-xl border border-[#4A6074]/25 bg-[#4A6074]/5 px-4 py-3 text-sm leading-6 text-[#4A6074]">
          {overBudget ? `Your recorded expenses are ${formatPaise(summary.exceededPaise)} above your budget. You can still add expenses.` : "If spending goes over budget, the amount exceeded appears here."}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select aria-label="Filter by category" onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} value={filters.category}>
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </Select>
          <Select aria-label="Filter by function" onChange={(event) => setFilters((current) => ({ ...current, functionId: event.target.value }))} value={filters.functionId}>
            <option value="all">All functions</option>
            {functions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Select aria-label="Sort expenses" onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as ExpenseSort }))} value={filters.sort}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option>
          </Select>
        </div>

        {expenses.length === 0 ? <EmptyState action={addButton} description="Add your first expense to start tracking your budget." title="No expenses yet" /> : visibleExpenses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center text-sm text-muted">No expenses match these filters.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="border-b border-border bg-background/70 text-xs font-medium uppercase tracking-wide text-muted"><tr>
                  <th className="px-5 py-4">Date</th><th className="px-5 py-4">Description</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Function</th><th className="px-5 py-4 text-right">Amount</th><th className="px-3 py-4"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody className="divide-y divide-border">{visibleExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">{formatDisplayDate(expense.expenseDate)}</td>
                    <td className="max-w-64 break-words px-5 py-4 text-sm font-medium">{expense.description}</td>
                    <td className="px-5 py-4"><Pill>{expense.category}</Pill></td>
                    <td className="max-w-40 truncate px-5 py-4 text-sm text-muted">{expense.functionId ? functionNames.get(expense.functionId) ?? "—" : "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-heading text-lg tabular-nums">{formatPaise(expense.amountPaise)}</td>
                    <td className="px-3 py-4"><div className="flex items-center">
                      <button aria-label={`Edit ${expense.description}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => beginEdit(expense)} type="button"><Icon name="edit" size={17} /></button>
                      <button aria-label={`Delete ${expense.description}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => setDeleting(expense)} type="button"><Icon name="trash" size={17} /></button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">{visibleExpenses.map((expense) => (
              <article className="flex items-start justify-between gap-3 p-4" key={expense.id}>
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{expense.description}</p>
                  <p className="mt-1 text-xs text-muted">{formatDisplayDate(expense.expenseDate)} <span aria-hidden="true">·</span> {functionNames.get(expense.functionId ?? "") ?? "—"}</p>
                  <Pill className="mt-2">{expense.category}</Pill>
                  <div className="mt-2 flex gap-1">
                    <button aria-label={`Edit ${expense.description}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => beginEdit(expense)} type="button"><Icon name="edit" size={17} /></button>
                    <button aria-label={`Delete ${expense.description}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => setDeleting(expense)} type="button"><Icon name="trash" size={17} /></button>
                  </div>
                </div>
                <p className="shrink-0 whitespace-nowrap font-heading text-lg tabular-nums">{formatPaise(expense.amountPaise)}</p>
              </article>
            ))}</div>
            <footer className="border-t border-border bg-background/60 px-5 py-4 text-sm text-muted">{visibleExpenses.length} {visibleExpenses.length === 1 ? "expense" : "expenses"} <span aria-hidden="true">·</span> Total <span className="font-heading tabular-nums text-foreground">{formatPaise(filteredTotal)}</span></footer>
          </div>
        )}
      </section>

      <Drawer onClose={closeDrawer} open={drawerOpen} title={editing ? "Edit expense" : "Add expense"}>
        <form className="flex flex-col gap-5" noValidate onSubmit={saveExpense}>
          {serverError ? <FormMessage>{serverError}</FormMessage> : null}
          <FormField error={fieldErrors.amountPaise ?? fieldErrors.amount} helper="Enter the whole amount in rupees" htmlFor="expense-amount" label="Amount">
            <div className="relative flex items-center">
              <span aria-hidden="true" className="pointer-events-none absolute left-4 text-sm text-muted">₹</span>
              <Input autoFocus className="pl-9" id="expense-amount" inputMode="numeric" onChange={(event) => updateField("amount", event.target.value)} placeholder="0" required value={values.amount} />
            </div>
          </FormField>
          <FormField error={fieldErrors.category} htmlFor="expense-category" label="Category">
            <Select id="expense-category" onChange={(event) => updateField("category", event.target.value)} value={values.category}>{EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</Select>
          </FormField>
          <FormField error={fieldErrors.description} htmlFor="expense-description" label="Description">
            <Input id="expense-description" maxLength={500} onChange={(event) => updateField("description", event.target.value)} placeholder="For example, venue advance" required value={values.description} />
          </FormField>
          <FormField error={fieldErrors.expenseDate} htmlFor="expense-date" label="Expense date">
            <Input id="expense-date" onChange={(event) => updateField("expenseDate", event.target.value)} required type="date" value={values.expenseDate} />
          </FormField>
          <FormField error={fieldErrors.functionId} htmlFor="expense-function" label="Linked function">
            <Select id="expense-function" onChange={(event) => updateField("functionId", event.target.value)} value={values.functionId}><option value="">None</option>{functions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          </FormField>
          <div className="mt-3 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button disabled={saving} onClick={closeDrawer} type="button" variant="ghost">Cancel</Button>
            <Button disabled={saving} type="submit">{saving ? "Saving…" : "Save expense"}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog busy={deleteBusy} confirmLabel="Delete" description="This can't be undone." onCancel={() => setDeleting(null)} onConfirm={() => { void confirmDelete(); }} open={deleting !== null} title="Delete this expense?" />
      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </>
  );
}
