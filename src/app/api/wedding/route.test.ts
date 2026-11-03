import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { createWedding, updateWedding, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  createWedding: vi.fn(),
  updateWedding: vi.fn(),
  getEditorContext: vi.fn(),
  requireUser: vi.fn(),
  assertSameOrigin: vi.fn(),
}));

vi.mock("@/modules/wedding/service", () => ({ createWedding, updateWedding }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { PATCH, POST } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const payload = {
  name: "Wedding",
  coupleNames: "Meera and Aarav",
  weddingDate: "2027-03-14",
  totalBudgetPaise: 150_000_000,
};

function jsonRequest(method: string, body: unknown): Request {
  return new Request("http://localhost:3000/api/wedding", {
    method,
    headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  createWedding.mockResolvedValue({ id: "wedding-id", ...payload });
  updateWedding.mockResolvedValue({ id: "wedding-id", ...payload, name: "Updated" });
});

describe("wedding routes", () => {
  it("creates a wedding with 201 and wraps the record in data", async () => {
    const response = await POST(jsonRequest("POST", payload));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: { id: "wedding-id", ...payload } });
    expect(createWedding).toHaveBeenCalledWith("user-id", payload);
  });

  it("returns validation errors for invalid creation bodies", async () => {
    const response = await POST(jsonRequest("POST", { ...payload, weddingDate: "2026-02-30" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    expect(createWedding).not.toHaveBeenCalled();
  });

  it("updates an editor wedding with 200", async () => {
    const response = await PATCH(jsonRequest("PATCH", { name: "Updated" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: "wedding-id", ...payload, name: "Updated" } });
    expect(updateWedding).toHaveBeenCalledWith(context, { name: "Updated" });
  });

  it("returns not found when an authenticated user has no wedding", async () => {
    getEditorContext.mockResolvedValue(null);
    const response = await PATCH(jsonRequest("PATCH", { name: "Updated" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(updateWedding).not.toHaveBeenCalled();
  });

  it("returns auth and origin errors without writing", async () => {
    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED", "Please log in."));
    const unauthenticated = await POST(jsonRequest("POST", payload));
    expect(unauthenticated.status).toBe(401);

    requireUser.mockResolvedValue(user);
    assertSameOrigin.mockImplementation(() => { throw new AppError("FORBIDDEN", "Invalid origin."); });
    const wrongOrigin = await POST(jsonRequest("POST", payload));
    expect(wrongOrigin.status).toBe(403);
    expect(createWedding).not.toHaveBeenCalled();
  });
});
