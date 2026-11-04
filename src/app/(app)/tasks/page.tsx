import { redirect } from "next/navigation";
import { TasksClient } from "@/components/tasks/TasksClient";
import { getEditorContext, requireUser } from "@/lib/access";
import { getTodayIST } from "@/lib/dates";
import { listFunctions } from "@/modules/functions/service";
import { listTasks } from "@/modules/tasks/service";

export default async function TasksPage() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const todayIST = getTodayIST();
  const [tasks, functions] = await Promise.all([listTasks(context, todayIST), listFunctions(context)]);
  return <TasksClient tasks={tasks} functions={functions} todayIST={todayIST} />;
}
