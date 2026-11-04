import { redirect } from "next/navigation";
import { GuestsClient } from "@/components/guests/GuestsClient";
import { getEditorContext, requireUser } from "@/lib/access";
import { getGuestSummary, listGuests } from "@/modules/guests/service";

export default async function GuestsPage() {
  const user = await requireUser();
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const [guests, summary] = await Promise.all([listGuests(context), getGuestSummary(context)]);
  return <GuestsClient guests={guests} summary={summary} />;
}
