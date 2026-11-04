"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/25" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-label={title} aria-modal="true" className="flex h-full w-full max-w-[480px] flex-col border-l border-border bg-background shadow-2xl" role="dialog">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-5 sm:px-7">
          <h2 className="font-heading text-2xl">{title}</h2>
          <button aria-label="Close drawer" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-card hover:text-foreground" onClick={onClose} type="button">
            <Icon name="close" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">{children}</div>
      </section>
    </div>
  );
}
