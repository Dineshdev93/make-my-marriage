import { SignOutButton } from "@/components/auth/SignOutButton";

export default function SetupPage() {
  return (
    <main className="p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl">Set up your wedding</h1>
        <SignOutButton />
      </header>
    </main>
  );
}
