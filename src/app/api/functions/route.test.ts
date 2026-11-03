import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { createFunction, updateFunction, deleteFunction, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  createFunction: vi.fn(),
  updateFunction: vi.fn(),
  deleteFunction: vi.fn(),
  getEditorContext: vi.fn(),
  requireUser: vi.fn(),
  assertSameOrigin: vi.fn(),
}));

vi.mock("@/modules/functions/service", () => ({ createFunction, updateFunction, deleteFunction }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { POST } from "./route";
import { DELETE, PATCH } from "./[id]/route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "function-id", weddingId: "wedding-id", name: "Haldi", date: "2027-03-12", createdBy: "user-id", updatedBy: "user-id" };

function request(method: string, body?: unknown): Request {
  return new Request("http://localhost:3000/api/functions", {
    method,
    headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  createFunction.mockResolvedValue(record);
  updateFunction.mockResolvedValue({ ...record, name: "Updated" });
  deleteFunction.mockResolvedValue({ id: record.id });
});

describe("function routes", () => {
  it("creates with 201 and returns the record in data", async () => {
    const response = await POST(request("POST", { name: "Haldi", date: "2027-03-12", weddingId: "ignored" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: record });
    expect(createFunction).toHaveBeenCalledWith(context, { name: "Haldi", date: "2027-03-12" });
  });

  it("updates with 200 and deletes with the required id response", async () => {
    const route = { params: Promise.resolve({ id: record.id }) };
    const updated = await PATCH(request("PATCH", { name: "Updated" }), route);
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({ data: { ...record, name: "Updated" } });
    expect(updateFunction).toHaveBeenCalledWith(context, record.id, { name: "Updated" });

    const deleted = await DELETE(request("DELETE"), route);
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ data: { id: record.id } });
    expect(deleteFunction).toHaveBeenCalledWith(context, record.id);
  });

  it("returns 400 for invalid bodies, 401 without a session, and 404 without a wedding", async () => {
    const invalid = await POST(request("POST", { name: "Haldi", date: "2026-02-30" }));
    expect(invalid.status).toBe(400);

    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED", "Please log in."));
    const unauthenticated = await POST(request("POST", { name: "Haldi", date: "2027-03-12" }));
    expect(unauthenticated.status).toBe(401);

    requireUser.mockResolvedValue(user);
    getEditorContext.mockResolvedValue(null);
    const noWedding = await POST(request("POST", { name: "Haldi", date: "2027-03-12" }));
    expect(noWedding.status).toBe(404);
    expect(createFunction).not.toHaveBeenCalled();
  });

  it("rejects requests from a different origin", async () => {
    assertSameOrigin.mockImplementation(() => { throw new AppError("FORBIDDEN", "Invalid origin."); });
    const response = await POST(request("POST", { name: "Haldi", date: "2027-03-12" }));
    expect(response.status).toBe(403);
    expect(requireUser).not.toHaveBeenCalled();
  });
});
