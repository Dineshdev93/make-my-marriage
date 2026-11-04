"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { filterGuests, getGuestTabCounts, type GuestTab } from "@/lib/guest-view";
import { formatPhone } from "@/lib/phone";
import { INVITATION_STATUSES, type InvitationStatus } from "@/modules/guests/constants";
import { createGuestSchema, updateGuestSchema } from "@/modules/guests/schema";
import type { GuestRecord, GuestSummary } from "@/modules/guests/service";

interface ApiResponse {
  error?: { message?: string; fields?: Record<string, string> };
}

interface GuestValues {
  name: string;
  phone: string;
  group: string;
  invitationStatus: InvitationStatus;
}

const blankValues: GuestValues = { name: "", phone: "", group: "", invitationStatus: "Not invited" };
const tabs: { id: GuestTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Not invited", label: "Not invited" },
  { id: "Invited", label: "Invited" },
  { id: "Confirmed", label: "Confirmed" },
];

export function GuestsClient({ guests, summary }: { guests: GuestRecord[]; summary: GuestSummary }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [tab, setTab] = useState<GuestTab>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<GuestRecord | null>(null);
  const [values, setValues] = useState<GuestValues>(blankValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openStatusGuestId, setOpenStatusGuestId] = useState<string | null>(null);
  const [pendingStatusGuestId, setPendingStatusGuestId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<GuestRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastId, setToastId] = useState(0);

  const counts = useMemo(() => getGuestTabCounts(guests), [guests]);
  const groups = useMemo(() => [...new Set(guests.map((guest) => guest.group))].sort((a, b) => a.localeCompare(b, "en")), [guests]);
  const visibleGuests = useMemo(() => filterGuests(guests, { query, group: groupFilter, status: tab }), [guests, query, groupFilter, tab]);

  function showError(text: string) {
    setToastId((id) => id + 1);
    setToast({ id: toastId + 1, text, variant: "error" });
  }

  function beginCreate() {
    setEditing(null);
    setValues(blankValues);
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
  }

  function beginEdit(guest: GuestRecord) {
    setEditing(guest);
    setValues({ name: guest.name, phone: guest.phone, group: guest.group, invitationStatus: guest.invitationStatus });
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
    setOpenStatusGuestId(null);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
  }

  function updateField(field: keyof GuestValues, value: string) {
    const safeValue = field === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setValues((current) => ({ ...current, [field]: safeValue }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function saveGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError("");
    let payload: Record<string, unknown>;
    if (editing) {
      payload = {};
      if (values.name.trim() !== editing.name) payload.name = values.name;
      if (values.phone !== editing.phone) payload.phone = values.phone;
      if (values.group.trim() !== editing.group) payload.group = values.group;
      if (values.invitationStatus !== editing.invitationStatus) payload.invitationStatus = values.invitationStatus;
      if (Object.keys(payload).length === 0) {
        setServerError("Make a change before saving.");
        return;
      }
    } else {
      payload = { ...values };
    }

    const parsed = editing ? updateGuestSchema.safeParse(payload) : createGuestSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/guests/${editing.id}` : "/api/guests", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        setFieldErrors(result.error?.fields ?? {});
        setServerError(result.error?.message ?? "We couldn't save this guest. Please try again.");
        return;
      }
      setDrawerOpen(false);
      router.refresh();
    } catch {
      setServerError("We couldn't save this guest. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(guest: GuestRecord, invitationStatus: InvitationStatus) {
    if (guest.invitationStatus === invitationStatus) {
      setOpenStatusGuestId(null);
      return;
    }
    setPendingStatusGuestId(guest.id);
    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationStatus }),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        showError(result.error?.message ?? "We couldn't update the invitation status. Please try again.");
        return;
      }
      setOpenStatusGuestId(null);
      router.refresh();
    } catch {
      showError("We couldn't update the invitation status. Please try again.");
    } finally {
      setPendingStatusGuestId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(`/api/guests/${deleting.id}`, { method: "DELETE" });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        setDeleting(null);
        showError(result.error?.message ?? "We couldn't delete this guest. Please try again.");
        return;
      }
      setDeleting(null);
      router.refresh();
    } catch {
      setDeleting(null);
      showError("We couldn't delete this guest. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function statusControl(guest: GuestRecord) {
    const isOpen = openStatusGuestId === guest.id;
    return <div className="relative inline-flex">
      <button aria-expanded={isOpen} aria-label={`Invitation status: ${guest.invitationStatus}`} className="rounded-full disabled:opacity-60" disabled={pendingStatusGuestId === guest.id} onClick={() => setOpenStatusGuestId(isOpen ? null : guest.id)} type="button">
        <Pill className={guest.invitationStatus === "Confirmed" ? "border-[#9FB09A]/50 bg-[#9FB09A]/15 text-foreground" : ""}>{guest.invitationStatus}</Pill>
      </button>
      {isOpen ? <div className="absolute right-0 top-full z-20 mt-2 min-w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
        {INVITATION_STATUSES.map((status) => <button className="block w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm hover:bg-background" key={status} onClick={() => { void changeStatus(guest, status); }} type="button">{status}</button>)}
      </div> : null}
    </div>;
  }

  const addButton = <Button onClick={beginCreate} type="button"><Icon name="plus" size={18} />Add guest</Button>;

  return (
    <>
      <section className="space-y-6">
        <header className="flex min-w-0 items-center justify-between gap-4">
          <h1 className="min-w-0 truncate font-heading text-3xl tracking-tight">Guests</h1>{addButton}
        </header>

        <div className="grid grid-cols-3 gap-3">
          <article className="rounded-2xl border border-border bg-card p-4 sm:p-5"><p className="text-xs text-muted sm:text-sm">Not invited</p><p className="mt-2 font-heading text-2xl tabular-nums">{summary.notInvited}</p></article>
          <article className="rounded-2xl border border-border bg-card p-4 sm:p-5"><p className="text-xs text-muted sm:text-sm">Invited</p><p className="mt-2 font-heading text-2xl tabular-nums">{summary.invited}</p></article>
          <article className="rounded-2xl border border-border bg-card p-4 sm:p-5"><p className="text-xs text-muted sm:text-sm">Confirmed</p><p className="mt-2 font-heading text-2xl tabular-nums">{summary.confirmed}</p></article>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,260px)]">
          <Input aria-label="Search by name" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" value={query} />
          <Select aria-label="Filter by group" onChange={(event) => setGroupFilter(event.target.value)} value={groupFilter}>
            <option value="all">All groups</option>{groups.map((group) => <option key={group} value={group}>{group}</option>)}
          </Select>
        </div>

        <div aria-label="Filter guests by invitation status" className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {tabs.map((item) => <button aria-selected={tab === item.id} className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm ${tab === item.id ? "border-primary bg-primary text-background" : "border-border bg-card text-muted hover:text-foreground"}`} key={item.id} onClick={() => setTab(item.id)} role="tab" type="button">{item.label}<span className="tabular-nums">{counts[item.id]}</span></button>)}
        </div>

        {guests.length === 0 ? <EmptyState action={addButton} description="Add your first guest to start your list." title="No guests yet" /> : visibleGuests.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted">No guests match your search and filters.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead className="border-b border-border bg-background/70 text-xs font-medium uppercase tracking-wide text-muted"><tr>
                  <th className="px-5 py-4">Guest name</th><th className="px-5 py-4">Phone</th><th className="px-5 py-4">Family or group</th><th className="px-5 py-4">Invitation status</th><th className="px-3 py-4"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody className="divide-y divide-border">{visibleGuests.map((guest) => <tr key={guest.id}>
                  <td className="max-w-56 break-words px-5 py-4 text-sm font-medium">{guest.name}</td><td className="whitespace-nowrap px-5 py-4 text-sm text-muted">{formatPhone(guest.phone)}</td><td className="max-w-56 break-words px-5 py-4 text-sm text-muted">{guest.group}</td>
                  <td className="px-5 py-4">{statusControl(guest)}</td>
                  <td className="px-3 py-4"><div className="flex items-center"><button aria-label={`Edit ${guest.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => beginEdit(guest)} type="button"><Icon name="edit" size={17} /></button><button aria-label={`Delete ${guest.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => setDeleting(guest)} type="button"><Icon name="trash" size={17} /></button></div></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="divide-y divide-border md:hidden">{visibleGuests.map((guest) => <article className="flex items-start justify-between gap-3 p-4" key={guest.id}>
              <div className="min-w-0"><p className="break-words text-sm font-medium">{guest.name}</p><p className="mt-1 text-sm text-muted">{formatPhone(guest.phone)}</p><p className="mt-1 break-words text-xs text-muted">{guest.group}</p><div className="mt-2 flex gap-1"><button aria-label={`Edit ${guest.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => beginEdit(guest)} type="button"><Icon name="edit" size={17} /></button><button aria-label={`Delete ${guest.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => setDeleting(guest)} type="button"><Icon name="trash" size={17} /></button></div></div>
              <div className="shrink-0">{statusControl(guest)}</div>
            </article>)}</div>
            <footer className="border-t border-border bg-background/60 px-5 py-4 text-sm text-muted">Showing {visibleGuests.length} of {guests.length} guests</footer>
          </div>
        )}
      </section>

      <Drawer onClose={closeDrawer} open={drawerOpen} title={editing ? "Edit guest" : "Add guest"}>
        <form className="flex flex-col gap-5" noValidate onSubmit={saveGuest}>
          {serverError ? <FormMessage>{serverError}</FormMessage> : null}
          <FormField error={fieldErrors.name} htmlFor="guest-name" label="Guest name"><Input autoFocus id="guest-name" maxLength={100} onChange={(event) => updateField("name", event.target.value)} placeholder="Guest name" required value={values.name} /></FormField>
          <FormField error={fieldErrors.phone} htmlFor="guest-phone" label="Phone">
            <div className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="whitespace-nowrap text-sm text-muted">+91</span><Input autoComplete="tel-national" id="guest-phone" inputMode="numeric" maxLength={10} onChange={(event) => updateField("phone", event.target.value)} placeholder="10-digit mobile number" required type="tel" value={values.phone} /></div>
          </FormField>
          <FormField error={fieldErrors.group} htmlFor="guest-group" label="Family or group">
            <Input id="guest-group" list="guest-groups" maxLength={100} onChange={(event) => updateField("group", event.target.value)} placeholder="For example, Sharma family" required value={values.group} />
            <datalist id="guest-groups">{groups.map((group) => <option key={group} value={group} />)}</datalist>
          </FormField>
          <FormField error={fieldErrors.invitationStatus} htmlFor="guest-status" label="Invitation status">
            <Select id="guest-status" onChange={(event) => updateField("invitationStatus", event.target.value)} value={values.invitationStatus}>{INVITATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</Select>
          </FormField>
          <div className="mt-3 flex flex-wrap justify-end gap-3 border-t border-border pt-5"><Button disabled={saving} onClick={closeDrawer} type="button" variant="ghost">Cancel</Button><Button disabled={saving} type="submit">{saving ? "Saving…" : "Save guest"}</Button></div>
        </form>
      </Drawer>

      <ConfirmDialog busy={deleteBusy} confirmLabel="Delete" description="This can't be undone." onCancel={() => setDeleting(null)} onConfirm={() => { void confirmDelete(); }} open={deleting !== null} title="Delete this guest?" />
      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </>
  );
}
