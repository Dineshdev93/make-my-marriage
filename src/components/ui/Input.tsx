import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 w-full min-w-0 rounded-[10px] border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted/65 focus:border-primary focus:outline-none disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
