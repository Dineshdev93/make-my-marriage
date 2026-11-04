import type { GuestRecord } from "@/modules/guests/service";
import type { InvitationStatus } from "@/modules/guests/constants";

export type GuestTab = "all" | InvitationStatus;

export interface GuestFilters {
  query: string;
  group: string;
  status: GuestTab;
}

export function getGuestTabCounts(guests: GuestRecord[]): Record<GuestTab, number> {
  return {
    all: guests.length,
    "Not invited": guests.filter((guest) => guest.invitationStatus === "Not invited").length,
    Invited: guests.filter((guest) => guest.invitationStatus === "Invited").length,
    Confirmed: guests.filter((guest) => guest.invitationStatus === "Confirmed").length,
  };
}

export function filterGuests(guests: GuestRecord[], filters: GuestFilters): GuestRecord[] {
  const query = filters.query.trim().toLocaleLowerCase("en-IN");
  return guests.filter((guest) => {
    const matchesName = !query || guest.name.toLocaleLowerCase("en-IN").includes(query);
    const matchesGroup = filters.group === "all" || guest.group === filters.group;
    const matchesStatus = filters.status === "all" || guest.invitationStatus === filters.status;
    return matchesName && matchesGroup && matchesStatus;
  });
}
