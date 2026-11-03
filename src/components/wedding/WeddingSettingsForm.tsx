"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormField";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { WeddingFields, type WeddingFieldValues } from "@/components/wedding/WeddingFields";
import { parseRupeesToPaise } from "@/lib/money";
import { formatRupeesWhileTyping } from "@/lib/wedding-setup";
import type { WeddingRecord } from "@/modules/wedding/service";
import { updateWeddingSchema } from "@/modules/wedding/schema";

interface ApiResponse {
  error?: { message?: string; fields?: Record<string, string> };
}

export function WeddingSettingsForm({ wedding }: { wedding: WeddingRecord }) {
  const router = useRouter();
  const [values, setValues] = useState<WeddingFieldValues>({
    name: wedding.name,
    coupleNames: wedding.coupleNames,
    weddingDate: wedding.weddingDate,
    budgetRupees: formatRupeesWhileTyping(String(Math.floor(wedding.totalBudgetPaise / 100))),
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function updateField(field: keyof WeddingFieldValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setToast(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError("");
    setToast(null);

    let totalBudgetPaise: number | undefined;
    let budgetParseError = "";
    try {
      totalBudgetPaise = values.budgetRupees ? parseRupeesToPaise(values.budgetRupees) : undefined;
    } catch (error) {
      budgetParseError = error instanceof Error ? error.message : "Enter a valid whole-rupee budget.";
    }

    const parsed = updateWeddingSchema.safeParse({
      name: values.name,
      coupleNames: values.coupleNames,
      weddingDate: values.weddingDate,
      totalBudgetPaise,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        errors[field] ??= issue.message;
      }
      if (budgetParseError) errors.totalBudgetPaise = budgetParseError;
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/wedding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        setFieldErrors(payload.error?.fields ?? {});
        setServerError(payload.error?.message ?? "We couldn't save your changes. Please try again.");
        return;
      }
      setToast({ id: 1, text: "Wedding details saved.", variant: "success" });
      router.refresh();
    } catch {
      setServerError("We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="max-w-3xl">
        <p className="mb-6 text-sm leading-6 text-muted">Update the details for your wedding workspace.</p>
        <form className="rounded-2xl border border-border bg-card p-6 sm:p-8" noValidate onSubmit={submit}>
          {serverError ? <div className="mb-5"><FormMessage>{serverError}</FormMessage></div> : null}
          <WeddingFields errors={fieldErrors} onChange={updateField} values={values} />
          <Button className="mt-7" disabled={saving} type="submit">{saving ? "Saving changes…" : "Save changes"}</Button>
        </form>
      </section>
      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </>
  );
}
