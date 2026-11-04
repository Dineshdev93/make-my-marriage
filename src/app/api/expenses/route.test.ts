import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { createExpense, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  createExpense: vi.fn(),
  getEditorContext: vi.fn(),
  requireUser: vi.fn(),
  assertSameOrigin: vi.fn(),
}));

vi.mock("@/modules/expenses/service", () => ({ createExpense }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { POST } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "expense-id", amountPaise: 100, category: "Venue", description: "Deposit" };
const input = { amountPaise: 100, category: "Venue", description: "Deposit", expenseDate: "2027-03-12" };
const request = (body: unknown) => new Request("http://localhost:3000/api/expenses", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  createExpense.mockResolvedValue(record);
});

describe("POST /api/expenses", () => {
  it("validates and returns a created record", async () => {
    const response = await POST(request({ ...input, weddingId: "ignored" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: record });
    expect(createExpense).toHaveBeenCalledWith(context, input);
  });

  it("returns validation, auth, and origin errors", async () => {
    expect((await POST(request({ ...input, amountPaise: 99 }))).status).toBe(400);
    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED", "Please log in."));
    expect((await POST(request(input))).status).toBe(401);
    assertSameOrigin.mockImplementation(() => { throw new AppError("FORBIDDEN", "Invalid origin."); });
    expect((await POST(request(input))).status).toBe(403);
  });
});
