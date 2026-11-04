import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTask, deleteTask, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  updateTask: vi.fn(), deleteTask: vi.fn(), getEditorContext: vi.fn(), requireUser: vi.fn(), assertSameOrigin: vi.fn(),
}));
vi.mock("@/modules/tasks/service", () => ({ updateTask, deleteTask }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { DELETE, PATCH } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "task-id", title: "Book venue", dueDate: "2027-03-12", completed: false, status: "pending" };
const route = { params: Promise.resolve({ id: record.id }) };
const request = (method: string, body?: unknown) => new Request(`http://localhost:3000/api/tasks/${record.id}`, { method, headers: { origin: "http://localhost:3000", "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  updateTask.mockResolvedValue(record);
  deleteTask.mockResolvedValue({ id: record.id });
});

describe("task item routes", () => {
  it("patches and deletes tasks with data responses", async () => {
    const response = await PATCH(request("PATCH", { completed: true }), route);
    expect(response.status).toBe(200);
    expect(updateTask).toHaveBeenCalledWith(context, record.id, { completed: true });
    expect(await response.json()).toEqual({ data: record });
    const deleted = await DELETE(request("DELETE"), route);
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ data: { id: record.id } });
  });

  it("returns validation and missing-wedding errors", async () => {
    expect((await PATCH(request("PATCH", {}), route)).status).toBe(400);
    getEditorContext.mockResolvedValue(null);
    expect((await DELETE(request("DELETE"), route)).status).toBe(404);
  });
});
