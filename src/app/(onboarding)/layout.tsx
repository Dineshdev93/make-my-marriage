import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getEditorContext } from "@/lib/access";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (await getEditorContext(user)) redirect("/dashboard");
  return children;
}
