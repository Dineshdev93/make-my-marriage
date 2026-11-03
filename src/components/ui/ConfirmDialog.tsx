"use client";

import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/25 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section aria-labelledby="confirm-dialog-title" aria-modal="true" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" role="dialog">
        <h2 className="font-heading text-2xl" id="confirm-dialog-title">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button disabled={busy} onClick={onCancel} type="button" variant="outline">Cancel</Button>
          <Button disabled={busy} onClick={onConfirm} type="button">{busy ? "Please wait…" : confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}
