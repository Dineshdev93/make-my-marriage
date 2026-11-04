import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateGuest, deleteGuest, getEditorContext, requireUser, assertSameOrigin } = vi.hoisted(() => ({
  updateGuest: vi.fn(), deleteGuest: vi.fn(), getEditorContext: vi.fn(), requireUser: vi.fn(), assertSameOrigin: vi.fn(),
}));
vi.mock("@/modules/guests/service", () => ({ updateGuest, deleteGuest }));
vi.mock("@/lib/access", () => ({ getEditorContext, requireUser }));
vi.mock("@/lib/origin", () => ({ assertSameOrigin }));

import { DELETE, PATCH } from "./route";

const user = { id: "user-id", name: "Meera", email: "meera@example.com" };
const context = { weddingId: "wedding-id", userId: "user-id", role: "editor" as const };
const record = { id: "guest-id", name: "Asha", phone: "9876543210", group: "Family", invitationStatus: "Confirmed" };
const route = { params: Promise.resolve({ id: record.id }) };
const request = (method: string, body?: unknown) => new Request(`http://localhost:3000/api/guests/${record.id}`, { method, headers: { origin: "http://localhost:3000", "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

beforeEach(() => {
  vi.clearAllMocks();
  requireUser.mockResolvedValue(user);
  getEditorContext.mockResolvedValue(context);
  updateGuest.mockResolvedValue(record);
  deleteGuest.mockResolvedValue({ id: record.id });
});

describe("guest item routes", () => {
  it("updates status and deletes with data responses", async () => {
    const response = await PATCH(request("PATCH", { invitationStatus: "Confirmed" }), route);
    expect(response.status).toBe(200);
    expect(updateGuest).toHaveBeenCalledWith(context, record.id, { invitationStatus: "Confirmed" });
    expect(await response.json()).toEqual({ data: record });
    const deleted = await DELETE(request("DELETE"), route);
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ data: { id: record.id } });
  });

  it("rejects invalid update bodies", async () => {
    expect((await PATCH(request("PATCH", { invitationStatus: "RSVP" }), route)).status).toBe(400);
  });
});
