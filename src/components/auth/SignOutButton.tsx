"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-[10px] border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-card"
      onClick={() => signOut({ redirectTo: "/login" })}
      type="button"
    >
      Log out
    </button>
  );
}
