import { describe, expect, it } from "vitest";
import type { GuestRecord } from "@/modules/guests/service";
import { filterGuests, getGuestTabCounts } from "./guest-view";
import { formatPhone } from "./phone";

const makeGuest = (id: string, group: string, invitationStatus: GuestRecord["invitationStatus"]): GuestRecord => ({
  id,
  weddingId: "wedding",
  name: id,
  phone: "9876543210",
  group,
  invitationStatus,
  functionIds: [],
  createdBy: "user",
  updatedBy: "user",
  createdAt: "2027-03-10T00:00:00.000Z",
  updatedAt: "2027-03-10T00:00:00.000Z",
});

describe("guest view helpers", () => {
  const guests = [
    makeGuest("Asha Sharma", "Sharma family", "Not invited"),
    makeGuest("Mina Patel", "Patel family", "Invited"),
    makeGuest("Ravi Sharma", "Sharma family", "Confirmed"),
  ];

  it("formats Indian mobile numbers and counts invitation tabs", () => {
    expect(formatPhone("9876543210")).toBe("98765 43210");
    expect(getGuestTabCounts(guests)).toEqual({ all: 3, "Not invited": 1, Invited: 1, Confirmed: 1 });
  });

  it("filters by case-insensitive name, group, and status", () => {
    expect(filterGuests(guests, { query: "asha", group: "all", status: "all" }).map(({ name }) => name)).toEqual(["Asha Sharma"]);
    expect(filterGuests(guests, { query: "", group: "Sharma family", status: "Confirmed" }).map(({ name }) => name)).toEqual(["Ravi Sharma"]);
    expect(filterGuests(guests, { query: "patel", group: "Sharma family", status: "all" })).toEqual([]);
  });
});
