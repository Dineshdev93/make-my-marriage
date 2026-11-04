import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-11 w-full min-w-0 rounded-[10px] border border-border bg-card px-4 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
