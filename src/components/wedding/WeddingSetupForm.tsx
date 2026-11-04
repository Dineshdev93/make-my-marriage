"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormField";
import { WeddingFields, type WeddingFieldValues } from "@/components/wedding/WeddingFields";
import { parseRupeesToPaise } from "@/lib/money";
import { formatWeddingDatePreview, getWeddingCountdownText } from "@/lib/wedding-setup";
import { createWeddingSchema } from "@/modules/wedding/schema";

interface ApiResponse {
  error?: { message?: string; fields?: Record<string, string> };
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg aria-hidden="true" className="h-8 w-10 shrink-0 text-primary" viewBox="0 0 40 28" fill="none">
        <circle cx="15" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="25" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="font-heading text-xl tracking-tight">Make My Marriage</span>
    </div>
  );
}

export function WeddingSetupForm() {
  const router = useRouter();
  const [values, setValues] = useState<WeddingFieldValues>({ name: "", coupleNames: "", weddingDate: "", budgetRupees: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const datePreview = formatWeddingDatePreview(values.weddingDate);
  const countdown = getWeddingCountdownText(values.weddingDate);

  function updateField(field: keyof WeddingFieldValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError("");

    let totalBudgetPaise: number | undefined;
    let budgetParseError = "";
    try {
      totalBudgetPaise = values.budgetRupees ? parseRupeesToPaise(values.budgetRupees) : undefined;
    } catch (error) {
      totalBudgetPaise = undefined;
      budgetParseError = error instanceof Error ? error.message : "Enter a valid whole-rupee budget.";
    }

    const parsed = createWeddingSchema.safeParse({ name: values.name, coupleNames: values.coupleNames, weddingDate: values.weddingDate, totalBudgetPaise });
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

    setSubmitting(true);
    try {
      const response = await fetch("/api/wedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        setFieldErrors(payload.error?.fields ?? {});
        setServerError(payload.error?.message ?? "We couldn't create your wedding. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setServerError("We couldn't create your wedding. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="relative mx-auto flex max-w-[1360px] items-center justify-center px-5 py-6 sm:px-8">
        <Logo />
        <div className="absolute right-5 sm:right-8"><SignOutButton /></div>
      </header>

      <main className="mx-auto grid w-full max-w-[1360px] gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:pt-16">
        <section>
          <header className="mb-8">
            <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">Let&apos;s set up your wedding</h1>
            <p className="mt-3 text-base leading-7 text-muted">Four details to begin. You can change any of them later.</p>
          </header>

          <form className="rounded-2xl border border-border bg-card p-6 sm:p-8" noValidate onSubmit={submit}>
            {serverError ? <FormMessage>{serverError}</FormMessage> : null}
            <div className="flex flex-col gap-5">
              <WeddingFields errors={fieldErrors} onChange={updateField} values={values} />
              <Button className="mt-1 h-12" disabled={submitting} type="submit">
                {submitting ? "Creating wedding…" : "Create my wedding"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="lg:pt-2">
          <header className="mb-5">
            <h2 className="font-heading text-2xl">Your dashboard preview</h2>
            <p className="mt-2 text-sm leading-6 text-muted">This is how your wedding overview will look once created.</p>
          </header>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted">Celebration</span>
              <h3 className="mt-1 break-words font-heading text-3xl leading-tight">{values.name.trim() || "Your wedding name"}</h3>
              <p className="mt-2 text-sm text-muted">{values.coupleNames.trim() || "Couple names"}</p>
              <p className="mt-1 text-sm text-muted">{datePreview || "Wedding date will appear here"}</p>
              <div className="mt-6 rounded-[10px] border border-border bg-background px-4 py-4">
                <span className="text-xs uppercase tracking-widest text-muted">Countdown</span>
                <p className="mt-1 font-heading text-3xl text-primary sm:text-4xl">{countdown || "Countdown appears here"}</p>
              </div>
            </div>
            <hr className="my-6 border-border" />
            <div>
              <span className="text-xs uppercase tracking-widest text-muted">Total budget</span>
              <p className="mt-1 break-all font-heading text-4xl font-light tracking-tight sm:text-5xl">{values.budgetRupees ? `₹${values.budgetRupees}` : "Your budget will appear here"}</p>
              <p className="mt-2 text-sm text-muted">Your total wedding budget</p>
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <p className="flex items-start gap-2 text-sm italic leading-6 text-muted">
                <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 7v4M8 4.75h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
                <span>Functions, tasks and guests come next, on your dashboard.</span>
              </p>
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}

