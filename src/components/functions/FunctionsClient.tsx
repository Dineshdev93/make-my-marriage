"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { formatDisplayDate } from "@/lib/dates";
import type { FunctionRecord } from "@/modules/functions/service";
import { createFunctionSchema, updateFunctionSchema } from "@/modules/functions/schema";

interface ApiResponse {
  error?: { message?: string; fields?: Record<string, string> };
}

interface FunctionValues {
  name: string;
  date: string;
  venue: string;
}

const quickPicks = ["Haldi", "Mehendi", "Sangeet", "Pheras", "Reception", "Nikah", "Anand Karaj"];
const blankValues: FunctionValues = { name: "", date: "", venue: "" };

export function FunctionsClient({ functions }: { functions: FunctionRecord[] }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<FunctionRecord | null>(null);
  const [values, setValues] = useState<FunctionValues>(blankValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<FunctionRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);

  function beginCreate() {
    setEditing(null);
    setValues(blankValues);
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
  }

  function beginEdit(record: FunctionRecord) {
    setEditing(record);
    setValues({ name: record.name, date: record.date, venue: record.venue ?? "" });
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
    setMobileMenuId(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
    setServerError("");
    setFieldErrors({});
  }

  function updateField(field: keyof FunctionValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function saveFunction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError("");
    const schema = editing ? updateFunctionSchema : createFunctionSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/functions/${editing.id}` : "/api/functions", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        setFieldErrors(payload.error?.fields ?? {});
        setServerError(payload.error?.message ?? "We couldn't save this function. Please try again.");
        return;
      }

      setDrawerOpen(false);
      setToast({ id: 1, text: editing ? "Function updated." : "Function added.", variant: "success" });
      router.refresh();
    } catch {
      setServerError("We couldn't save this function. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(`/api/functions/${deleting.id}`, { method: "DELETE" });
      const payload = await response.json() as ApiResponse;
      if (!response.ok) {
        setDeleting(null);
        setToast({ id: 1, text: payload.error?.message ?? "We couldn't delete this function. Please try again.", variant: "error" });
        return;
      }
      setDeleting(null);
      setToast({ id: 1, text: "Function deleted.", variant: "success" });
      router.refresh();
    } catch {
      setDeleting(null);
      setToast({ id: 1, text: "We couldn't delete this function. Please try again.", variant: "error" });
    } finally {
      setDeleteBusy(false);
    }
  }

  const addFunctionButton = <Button onClick={beginCreate} type="button"><Icon name="plus" size={18} />Add function</Button>;

  return (
    <>
      <section>
        <header className="mb-6 flex min-w-0 items-center justify-between gap-4">
          <h2 className="min-w-0 truncate font-heading text-3xl tracking-tight">Functions</h2>
          {addFunctionButton}
        </header>

        {functions.length === 0 ? (
          <EmptyState action={addFunctionButton} description="Add Haldi, Mehendi or any function to begin." title="No functions yet" />
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-7">
            {functions.map((record) => (
              <article className="relative flex min-w-0 flex-col gap-3 py-5 pr-12 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:pr-0" key={record.id}>
                <div className="min-w-0">
                  <h3 className="break-words font-heading text-xl">{record.name}</h3>
                  <p className="mt-1 break-words text-sm text-muted">
                    {formatDisplayDate(record.date)}{record.venue ? <><span aria-hidden="true"> · </span>{record.venue}</> : null}
                  </p>
                </div>

                <div className="hidden shrink-0 items-center gap-1 sm:flex">
                  <button aria-label={`Edit ${record.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => beginEdit(record)} title="Edit function" type="button"><Icon name="edit" /></button>
                  <button aria-label={`Delete ${record.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => setDeleting(record)} title="Delete function" type="button"><Icon name="trash" /></button>
                </div>

                <div className="absolute right-0 top-4 sm:hidden">
                  <button aria-expanded={mobileMenuId === record.id} aria-label={`Actions for ${record.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background" onClick={() => setMobileMenuId((current) => current === record.id ? null : record.id)} type="button"><Icon name="more" /></button>
                  {mobileMenuId === record.id ? (
                    <div className="absolute right-0 top-10 z-10 min-w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
                      <button className="flex h-10 w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm hover:bg-background" onClick={() => beginEdit(record)} type="button"><Icon name="edit" size={17} />Edit</button>
                      <button className="flex h-10 w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm hover:bg-background" onClick={() => { setDeleting(record); setMobileMenuId(null); }} type="button"><Icon name="trash" size={17} />Delete</button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Drawer onClose={closeDrawer} open={drawerOpen} title={editing ? "Edit function" : "Add function"}>
        <form className="flex flex-col gap-5" noValidate onSubmit={saveFunction}>
          {serverError ? <FormMessage>{serverError}</FormMessage> : null}
          <FormField error={fieldErrors.name} htmlFor="function-name" label="Function name">
            <Input autoFocus id="function-name" maxLength={100} onChange={(event) => updateField("name", event.target.value)} placeholder="For example, Haldi" required value={values.name} />
          </FormField>
          <div className="-mt-2 flex flex-wrap gap-2" aria-label="Common function names">
            {quickPicks.map((name) => <Button className="h-8 min-h-8 px-3 py-1 text-xs" key={name} onClick={() => updateField("name", name)} type="button" variant="outline">{name}</Button>)}
          </div>
          <FormField error={fieldErrors.date} htmlFor="function-date" label="Date">
            <Input id="function-date" onChange={(event) => updateField("date", event.target.value)} required type="date" value={values.date} />
          </FormField>
          <FormField error={fieldErrors.venue} htmlFor="function-venue" label="Venue">
            <Input id="function-venue" maxLength={200} onChange={(event) => updateField("venue", event.target.value)} placeholder="Optional" value={values.venue} />
          </FormField>
          <div className="mt-3 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button disabled={saving} onClick={closeDrawer} type="button" variant="ghost">Cancel</Button>
            <Button disabled={saving} type="submit">{saving ? "Saving…" : "Save function"}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        busy={deleteBusy}
        confirmLabel="Delete"
        description="Linked tasks and expenses will be kept. Only the link to this function is removed."
        onCancel={() => setDeleting(null)}
        onConfirm={() => { void confirmDelete(); }}
        open={deleting !== null}
        title="Delete this function?"
      />
      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </>
  );
}
