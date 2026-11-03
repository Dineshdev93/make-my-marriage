import { redirect } from "next/navigation";
import { WeddingSettingsForm } from "@/components/wedding/WeddingSettingsForm";
import { getEditorContext, requireUser } from "@/lib/access";
import { getWedding } from "@/modules/wedding/service";

export default async function SettingsPage() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const wedding = await getWedding(context);
  return <WeddingSettingsForm wedding={wedding} />;
}
