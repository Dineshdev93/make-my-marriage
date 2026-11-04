import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { createTask, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  createTask: vi.fn(), getEditorContext: vi.fn(), requireUser: vi.fn(), assertSameOrigin: vi.fn(),
}));
vi.mock("@/modules/tasks/service", () => ({ createTask }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { POST } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "task-id", title: "Book venue", dueDate: "2027-03-12", completed: false, status: "pending" };
const input = { title: "Book venue", dueDate: "2027-03-12" };
const request = (body: unknown) => new Request("http://localhost:3000/api/tasks", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  createTask.mockResolvedValue(record);
});

describe("POST /api/tasks", () => {
  it("returns a created task and applies schema defaults", async () => {
    const response = await POST(request({ ...input, unknown: true }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: record });
    expect(createTask).toHaveBeenCalledWith(context, { ...input, completed: false });
  });

  it("returns validation, authentication, and origin errors", async () => {
    expect((await POST(request({ ...input, dueDate: "2026-02-30" }))).status).toBe(400);
    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED", "Please log in."));
    expect((await POST(request(input))).status).toBe(401);
    assertSameOrigin.mockImplementation(() => { throw new AppError("FORBIDDEN", "Invalid origin."); });
    expect((await POST(request(input))).status).toBe(403);
  });
});
