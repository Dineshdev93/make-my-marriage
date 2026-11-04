import type { ReactNode } from "react";

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted ${className}`}>
      {children}
    </span>
  );
}
