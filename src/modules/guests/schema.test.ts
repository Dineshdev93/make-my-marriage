import { describe, expect, it } from "vitest";
import { INVITATION_STATUSES } from "./constants";
import { createGuestSchema, updateGuestSchema } from "./schema";

const validGuest = { name: "  Asha Sharma ", phone: "98765-43210", group: "  Sharma family  " };

describe("guest schemas", () => {
  it("trims text, normalizes phone digits, and defaults invitation status", () => {
    expect(createGuestSchema.parse({ ...validGuest, functionIds: ["untrusted"], other: true })).toEqual({
      name: "Asha Sharma", phone: "9876543210", group: "Sharma family", invitationStatus: "Not invited",
    });
    expect(createGuestSchema.parse({ ...validGuest, phone: "98765 43210" }).phone).toBe("9876543210");
  });

  it("rejects invalid Indian mobile numbers", () => {
    for (const phone of ["123456789", "98765432101", "5876543210", "abcdefghij"]) {
      expect(createGuestSchema.safeParse({ ...validGuest, phone }).success).toBe(false);
    }
  });

  it("accepts every invitation status and validates name and group bounds", () => {
    for (const invitationStatus of INVITATION_STATUSES) {
      expect(createGuestSchema.safeParse({ ...validGuest, invitationStatus }).success).toBe(true);
    }
    expect(createGuestSchema.safeParse({ ...validGuest, name: " " }).success).toBe(false);
    expect(createGuestSchema.safeParse({ ...validGuest, name: "x".repeat(101) }).success).toBe(false);
    expect(createGuestSchema.safeParse({ ...validGuest, group: "x".repeat(101) }).success).toBe(false);
  });

  it("strips functionIds from updates and requires at least one known field", () => {
    expect(updateGuestSchema.safeParse({ functionIds: ["ignored"] }).success).toBe(false);
    expect(updateGuestSchema.parse({ invitationStatus: "Confirmed", functionIds: ["ignored"] })).toEqual({ invitationStatus: "Confirmed" });
    expect(updateGuestSchema.safeParse({}).success).toBe(false);
  });
});
