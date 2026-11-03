import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, helper, error, children }: FormFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label className="whitespace-nowrap text-sm font-medium text-foreground" htmlFor={htmlFor}>{label}</label>
      {children}
      {helper ? <p className="text-xs leading-5 text-muted">{helper}</p> : null}
      {error ? (
        <p className="flex items-start gap-1.5 text-sm leading-5 text-primary" role="alert">
          <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4M8 11h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ children, variant = "error" }: { children: ReactNode; variant?: "error" | "helper" }) {
  return (
    <p className={`flex items-start gap-2 text-sm leading-5 ${variant === "error" ? "text-primary" : "text-muted"}`} role={variant === "error" ? "alert" : undefined}>
      {variant === "error" ? (
        <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4.5v4M8 11h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      ) : null}
      <span>{children}</span>
    </p>
  );
}
