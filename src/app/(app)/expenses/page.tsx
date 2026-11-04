import { redirect } from "next/navigation";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { getEditorContext, requireUser } from "@/lib/access";
import { getBudgetSummary, listExpenses } from "@/modules/expenses/service";
import { listFunctions } from "@/modules/functions/service";

export default async function ExpensesPage() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const [expenses, summary, functions] = await Promise.all([
    listExpenses(context),
    getBudgetSummary(context),
    listFunctions(context),
  ]);
  return <ExpensesClient expenses={expenses} summary={summary} functions={functions} />;
}
