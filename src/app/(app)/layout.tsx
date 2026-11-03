import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser, getEditorContext } from "@/lib/access";
import { getWedding } from "@/modules/wedding/service";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const context = await getEditorContext(user);
  if (!context) redirect("/setup");
  const wedding = await getWedding(context);

  return <AppShell userName={user.name ?? user.email ?? "Editor"} wedding={wedding}>{children}</AppShell>;
}
