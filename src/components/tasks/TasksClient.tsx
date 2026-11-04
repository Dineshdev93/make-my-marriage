"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
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
import { formatDisplayDate } from "@/lib/dates";
import { filterTasks, getTaskTabCounts, type TaskTab } from "@/lib/task-view";
import type { FunctionRecord } from "@/modules/functions/service";
import { createTaskSchema, updateTaskSchema } from "@/modules/tasks/schema";
import type { TaskRecord } from "@/modules/tasks/service";

interface ApiResponse {
  error?: { message?: string; fields?: Record<string, string> };
}

interface TaskValues {
  title: string;
  dueDate: string;
  functionId: string;
}

const blankValues: TaskValues = { title: "", dueDate: "", functionId: "" };
const tabs: { id: TaskTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

export function TasksClient({ tasks, functions, todayIST }: { tasks: TaskRecord[]; functions: FunctionRecord[]; todayIST: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<TaskTab>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [values, setValues] = useState<TaskValues>(blankValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TaskRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastId, setToastId] = useState(0);

  const counts = useMemo(() => getTaskTabCounts(tasks), [tasks]);
  const visibleTasks = useMemo(() => filterTasks(tasks, tab), [tasks, tab]);
  const functionNames = useMemo(() => new Map(functions.map((item) => [item.id, item.name])), [functions]);

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

  function beginEdit(task: TaskRecord) {
    setEditing(task);
    setValues({ title: task.title, dueDate: task.dueDate, functionId: task.functionId ?? "" });
    setFieldErrors({});
    setServerError("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
  }

  function updateField(field: keyof TaskValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError("");
    const data = { title: values.title, dueDate: values.dueDate, ...(values.functionId ? { functionId: values.functionId } : {}) };
    let payload: Record<string, unknown>;
    if (editing) {
      payload = {};
      if (values.title.trim() !== editing.title) payload.title = values.title;
      if (values.dueDate !== editing.dueDate) payload.dueDate = values.dueDate;
      const newFunctionId = values.functionId || null;
      if (newFunctionId !== editing.functionId) payload.functionId = newFunctionId;
      if (Object.keys(payload).length === 0) {
        setServerError("Make a change before saving.");
        return;
      }
      const parsed = updateTaskSchema.safeParse(payload);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
        setFieldErrors(errors);
        return;
      }
      payload = parsed.data;
    } else {
      const parsed = createTaskSchema.safeParse(data);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
        setFieldErrors(errors);
        return;
      }
      payload = parsed.data;
    }

    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/tasks/${editing.id}` : "/api/tasks", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        setFieldErrors(result.error?.fields ?? {});
        setServerError(result.error?.message ?? "We couldn't save this task. Please try again.");
        return;
      }
      setDrawerOpen(false);
      router.refresh();
    } catch {
      setServerError("We couldn't save this task. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: TaskRecord) {
    setPendingTaskId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        showError(result.error?.message ?? "We couldn't update this task. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      showError("We couldn't update this task. Please try again.");
    } finally {
      setPendingTaskId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const response = await fetch(`/api/tasks/${deleting.id}`, { method: "DELETE" });
      const result = await response.json() as ApiResponse;
      if (!response.ok) {
        setDeleting(null);
        showError(result.error?.message ?? "We couldn't delete this task. Please try again.");
        return;
      }
      setDeleting(null);
      router.refresh();
    } catch {
      setDeleting(null);
      showError("We couldn't delete this task. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const addButton = <Button onClick={beginCreate} type="button"><Icon name="plus" size={18} />Add task</Button>;
  const emptyTabText: Record<TaskTab, string> = { all: "Add your first task to start your checklist.", pending: "No pending tasks.", overdue: "Nothing is overdue.", completed: "No completed tasks yet." };

  return (
    <>
      <section className="space-y-6" data-today-ist={todayIST}>
        <header className="flex min-w-0 items-center justify-between gap-4">
          <h1 className="min-w-0 truncate font-heading text-3xl tracking-tight">Tasks</h1>{addButton}
        </header>

        <div aria-label="Filter tasks" className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {tabs.map((item) => (
            <button aria-selected={tab === item.id} className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm ${tab === item.id ? "border-primary bg-primary text-background" : "border-border bg-card text-muted hover:text-foreground"}`} key={item.id} onClick={() => setTab(item.id)} role="tab" type="button">
              {item.label}<span className="tabular-nums">{counts[item.id]}</span>
            </button>
          ))}
        </div>

        {tasks.length === 0 ? (
          <EmptyState action={addButton} description="Add your first task to start your checklist." title="No tasks yet" />
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted">{emptyTabText[tab]}</div>
        ) : (
          <div className="divide-y divide-border rounded-2xl border border-border bg-card px-4 sm:px-7">
            {visibleTasks.map((task) => (
              <article className="flex min-w-0 items-start gap-3 py-4 sm:items-center sm:gap-4" key={task.id}>
                <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
                  <input aria-label={`Mark ${task.title} ${task.completed ? "pending" : "complete"}`} checked={task.completed} className="h-5 w-5 accent-primary disabled:opacity-55" disabled={pendingTaskId === task.id} onChange={() => { void toggleTask(task); }} type="checkbox" />
                  {pendingTaskId === task.id ? <span className="whitespace-nowrap text-xs text-muted">Saving…</span> : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className={`break-words text-sm font-medium ${task.completed ? "text-muted line-through" : "text-foreground"}`}>{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {task.functionId && functionNames.has(task.functionId) ? <Pill>{functionNames.get(task.functionId)}</Pill> : null}
                      <span className={`text-xs ${task.completed ? "text-muted/75" : "text-muted"}`}>{formatDisplayDate(task.dueDate)}</span>
                      {task.status === "overdue" ? <Pill className="border-[#4A6074]/30 bg-[#4A6074]/5 text-[#4A6074]">Overdue</Pill> : null}
                      {task.status === "completed" ? <Pill className="border-[#9FB09A]/50 bg-[#9FB09A]/15 text-foreground">Completed</Pill> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                    <button aria-label={`Edit ${task.title}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => beginEdit(task)} type="button"><Icon name="edit" size={17} /></button>
                    <button aria-label={`Delete ${task.title}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-background hover:text-primary" onClick={() => setDeleting(task)} type="button"><Icon name="trash" size={17} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Drawer onClose={closeDrawer} open={drawerOpen} title={editing ? "Edit task" : "Add task"}>
        <form className="flex flex-col gap-5" noValidate onSubmit={saveTask}>
          {serverError ? <FormMessage>{serverError}</FormMessage> : null}
          <FormField error={fieldErrors.title} htmlFor="task-title" label="Task title">
            <Input autoFocus id="task-title" maxLength={200} onChange={(event) => updateField("title", event.target.value)} placeholder="For example, Book the venue" required value={values.title} />
          </FormField>
          <FormField error={fieldErrors.dueDate} htmlFor="task-due-date" label="Due date">
            <Input id="task-due-date" onChange={(event) => updateField("dueDate", event.target.value)} required type="date" value={values.dueDate} />
          </FormField>
          <FormField error={fieldErrors.functionId} htmlFor="task-function" label="Linked function">
            <Select id="task-function" onChange={(event) => updateField("functionId", event.target.value)} value={values.functionId}><option value="">None</option>{functions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          </FormField>
          <div className="mt-3 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
            <Button disabled={saving} onClick={closeDrawer} type="button" variant="ghost">Cancel</Button>
            <Button disabled={saving} type="submit">{saving ? "Saving…" : "Save task"}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog busy={deleteBusy} confirmLabel="Delete" description="This can't be undone." onCancel={() => setDeleting(null)} onConfirm={() => { void confirmDelete(); }} open={deleting !== null} title="Delete this task?" />
      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </>
  );
}
