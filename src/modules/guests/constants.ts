export const INVITATION_STATUSES = ["Not invited", "Invited", "Confirmed"] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];
