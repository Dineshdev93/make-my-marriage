import { model, models, Schema, Types } from "mongoose";
import { INVITATION_STATUSES, type InvitationStatus } from "./constants";

export interface GuestDocument {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  name: string;
  phone: string;
  group: string;
  invitationStatus: InvitationStatus;
  functionIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const guestSchema = new Schema<GuestDocument>({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  group: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  invitationStatus: { type: String, enum: INVITATION_STATUSES, required: true, default: "Not invited" },
  functionIds: { type: [{ type: Schema.Types.ObjectId, ref: "Function" }], required: true, default: [] },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { timestamps: true, collection: "guests" });

guestSchema.index({ weddingId: 1, name: 1 });

export const GuestModel = models.Guest ?? model<GuestDocument>("Guest", guestSchema);
