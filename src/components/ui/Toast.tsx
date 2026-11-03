"use client";

import { Icon } from "./Icon";

export interface ToastMessage {
  id: number;
  text: string;
  variant: "success" | "error";
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div aria-live={toast.variant === "error" ? "assertive" : "polite"} className="fixed bottom-5 right-5 z-[70] flex max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg" role={toast.variant === "error" ? "alert" : "status"}>
      <span className="shrink-0 text-primary"><Icon name={toast.variant === "success" ? "check" : "info"} size={18} /></span>
      <span className="min-w-0">{toast.text}</span>
      <button aria-label="Dismiss message" className="ml-2 shrink-0 text-muted hover:text-foreground" onClick={onDismiss} type="button"><Icon name="close" size={16} /></button>
    </div>
  );
}
