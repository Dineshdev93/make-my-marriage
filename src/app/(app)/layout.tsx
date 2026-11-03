import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getCurrentUser, getEditorContext } from "@/lib/access";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await getEditorContext(user))) redirect("/setup");

  return (
    <div className="min-h-screen">
      <header className="flex justify-end border-b border-border px-6 py-3">
        <SignOutButton />
      </header>
      <main>{children}</main>
    </div>
  );
}
