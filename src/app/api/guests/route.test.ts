import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const { createGuest, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  createGuest: vi.fn(), getEditorContext: vi.fn(), requireUser: vi.fn(), assertSameOrigin: vi.fn(),
}));
vi.mock("@/modules/guests/service", () => ({ createGuest }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { POST } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "guest-id", name: "Asha", phone: "9876543210", group: "Family", invitationStatus: "Not invited" };
const input = { name: "Asha", phone: "98765 43210", group: "Family" };
const request = (body: unknown) => new Request("http://localhost:3000/api/guests", { method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  createGuest.mockResolvedValue(record);
});

describe("POST /api/guests", () => {
  it("normalizes input and returns the created guest", async () => {
    const response = await POST(request({ ...input, functionIds: ["ignored"] }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: record });
    expect(createGuest).toHaveBeenCalledWith(context, { ...input, phone: "9876543210", invitationStatus: "Not invited" });
  });

  it("returns validation, authentication, and origin errors", async () => {
    expect((await POST(request({ ...input, phone: "5876543210" }))).status).toBe(400);
    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED", "Please log in."));
    expect((await POST(request(input))).status).toBe(401);
    assertSameOrigin.mockImplementation(() => { throw new AppError("FORBIDDEN", "Invalid origin."); });
    expect((await POST(request(input))).status).toBe(403);
  });
});
