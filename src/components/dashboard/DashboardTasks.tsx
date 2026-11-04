"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { Toast, type ToastMessage } from "@/components/ui/Toast";
import { formatDisplayDate } from "@/lib/dates";
import type { TaskRecord } from "@/modules/tasks/service";

interface ApiResponse {
  error?: { message?: string };
}

export function DashboardTasks({ tasks }: { tasks: TaskRecord[] }) {
  const router = useRouter();
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastId, setToastId] = useState(0);

  function showError(text: string) {
    setToastId((id) => id + 1);
    setToast({ id: toastId + 1, text, variant: "error" });
  }

  async function completeTask(task: TaskRecord) {
    setPendingTaskId(task.id);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
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

  return (
    <>
      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No upcoming tasks. You’re all caught up.</p>
      ) : (
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <div className="flex items-start justify-between gap-4 py-3.5 sm:items-center" key={task.id}>
              <label className="flex min-w-0 cursor-pointer items-start gap-3">
                <input aria-label={`Mark ${task.title} complete`} checked={task.completed} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-primary" disabled={pendingTaskId === task.id} onChange={() => { void completeTask(task); }} type="checkbox" />
                <span className="flex min-w-0 flex-col">
                  <span className="break-words text-sm font-medium leading-tight text-foreground">{task.title}</span>
                  <span className="mt-1 text-xs text-muted">Due {formatDisplayDate(task.dueDate)}{pendingTaskId === task.id ? <span className="ml-2">Saving…</span> : null}</span>
                </span>
              </label>
              {task.status === "overdue" ? <Pill className="shrink-0 border-[#4A6074]/30 bg-[#4A6074]/10 text-[#4A6074]">Overdue</Pill> : null}
              {task.status === "completed" ? <Pill className="shrink-0 border-[#9FB09A]/50 bg-[#9FB09A]/15 text-foreground"><Icon className="mr-1" name="check" size={13} />Completed</Pill> : null}
            </div>
          ))}
        </div>
      )}
      <Toast onDismiss={() => setToast(null)} toast={toast} />
    </>
  );
}
