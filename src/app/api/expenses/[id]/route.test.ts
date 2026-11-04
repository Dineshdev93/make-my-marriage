import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { updateExpense, deleteExpense, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  updateExpense: vi.fn(), deleteExpense: vi.fn(), getEditorContext: vi.fn(), requireUser: vi.fn(), assertSameOrigin: vi.fn(),
}));
vi.mock("@/modules/expenses/service", () => ({ updateExpense, deleteExpense }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { DELETE, PATCH } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "expense-id", amountPaise: 100, category: "Venue", description: "Deposit" };
const route = { params: Promise.resolve({ id: record.id }) };
const request = (method: string, body?: unknown) => new Request(`http://localhost:3000/api/expenses/${record.id}`, { method, headers: { origin: "http://localhost:3000", "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  updateExpense.mockResolvedValue(record);
  deleteExpense.mockResolvedValue({ id: record.id });
});

describe("expense item routes", () => {
  it("updates and deletes with a data response", async () => {
    const updated = await PATCH(request("PATCH", { description: "Changed" }), route);
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({ data: record });
    expect(updateExpense).toHaveBeenCalledWith(context, record.id, { description: "Changed" });
    const deleted = await DELETE(request("DELETE"), route);
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ data: { id: record.id } });
  });

  it("handles invalid bodies, missing wedding, and not-found errors", async () => {
    expect((await PATCH(request("PATCH", {}), route)).status).toBe(400);
    getEditorContext.mockResolvedValue(null);
    expect((await DELETE(request("DELETE"), route)).status).toBe(404);
    getEditorContext.mockResolvedValue(context);
    deleteExpense.mockRejectedValue(new AppError("NOT_FOUND", "Expense not found."));
    expect((await DELETE(request("DELETE"), route)).status).toBe(404);
  });
});
