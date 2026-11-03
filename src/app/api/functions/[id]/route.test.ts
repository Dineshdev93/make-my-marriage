import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { updateFunction, deleteFunction, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  updateFunction: vi.fn(),
  deleteFunction: vi.fn(),
  getEditorContext: vi.fn(),
  requireUser: vi.fn(),
  assertSameOrigin: vi.fn(),
}));

vi.mock("@/modules/functions/service", () => ({ updateFunction, deleteFunction }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { DELETE, PATCH } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "function-id", name: "Reception", date: "2027-03-14" };
const route = { params: Promise.resolve({ id: record.id }) };

function request(method: string, body?: unknown): Request {
  return new Request(`http://localhost:3000/api/functions/${record.id}`, {
    method,
    headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  updateFunction.mockResolvedValue(record);
  deleteFunction.mockResolvedValue({ id: record.id });
});

describe("function item routes", () => {
  it("patches a function and returns the record in data", async () => {
    const response = await PATCH(request("PATCH", { name: "Reception" }), route);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: record });
    expect(updateFunction).toHaveBeenCalledWith(context, record.id, { name: "Reception" });
  });

  it("returns validation and not-found responses", async () => {
    const invalid = await PATCH(request("PATCH", { date: "2026-02-30" }), route);
    expect(invalid.status).toBe(400);

    deleteFunction.mockRejectedValue(new AppError("NOT_FOUND", "Function not found."));
    const missing = await DELETE(request("DELETE"), route);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("returns 401 without a session and 404 when no wedding is available", async () => {
    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED", "Please log in."));
    const unauthenticated = await DELETE(request("DELETE"), route);
    expect(unauthenticated.status).toBe(401);

    requireUser.mockResolvedValue(user);
    getEditorContext.mockResolvedValue(null);
    const noWedding = await PATCH(request("PATCH", { name: "Changed" }), route);
    expect(noWedding.status).toBe(404);
    expect(updateFunction).not.toHaveBeenCalled();
  });

  it("enforces the request origin", async () => {
    assertSameOrigin.mockImplementation(() => { throw new AppError("FORBIDDEN", "Invalid origin."); });
    const response = await DELETE(request("DELETE"), route);
    expect(response.status).toBe(403);
    expect(requireUser).not.toHaveBeenCalled();
  });
});
