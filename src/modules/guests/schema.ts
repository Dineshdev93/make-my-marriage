import { z } from "zod";
import { INVITATION_STATUSES } from "./constants";

const guestFields = {
  name: z.string().trim().min(1, "Enter the guest's name.").max(100, "Name must be 100 characters or fewer."),
  phone: z.string().transform((value) => value.replace(/[\s-]/g, "")).pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number.")),
  group: z.string().trim().min(1, "Enter a family or group.").max(100, "Family or group must be 100 characters or fewer."),
  invitationStatus: z.enum(INVITATION_STATUSES),
};

export const createGuestSchema = z.object({
  ...guestFields,
  invitationStatus: guestFields.invitationStatus.default("Not invited"),
}).strip();

export const updateGuestSchema = z.object({
  name: guestFields.name.optional(),
  phone: guestFields.phone.optional(),
  group: guestFields.group.optional(),
  invitationStatus: guestFields.invitationStatus.optional(),
}).strip().refine((input) => Object.keys(input).length > 0, { message: "Provide at least one guest field to update." });

export type CreateGuestInput = z.input<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
