import { redirect } from "next/navigation";
import { FunctionsClient } from "@/components/functions/FunctionsClient";
import { getEditorContext, requireUser } from "@/lib/access";
import { listFunctions } from "@/modules/functions/service";

export default async function FunctionsPage() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const functions = await listFunctions(context);
  return <FunctionsClient functions={functions} />;
}
