import { model, models, Schema, Types } from "mongoose";
import { isDateString } from "@/lib/dates";
import { MAX_AMOUNT_PAISE } from "@/lib/money";

export interface PartnerInvite {
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: Types.ObjectId;
}

export interface WeddingDocument {
  _id: Types.ObjectId;
  name: string;
  coupleNames: string;
  weddingDate: string;
  totalBudgetPaise: number;
  editorIds: Types.ObjectId[];
  familyTokenHash?: string | null;
  partnerInvite?: PartnerInvite | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const partnerInviteSchema = new Schema<PartnerInvite>({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { _id: false });

const weddingSchema = new Schema<WeddingDocument>({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  coupleNames: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
  weddingDate: {
    type: String,
    required: true,
    validate: { validator: isDateString, message: "Wedding date must be a real date in YYYY-MM-DD format." },
  },
  totalBudgetPaise: { type: Number, required: true, min: 100, max: MAX_AMOUNT_PAISE, validate: Number.isSafeInteger },
  editorIds: {
    type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    required: true,
    validate: {
      validator: (editorIds: Types.ObjectId[]) => editorIds.length >= 1 && editorIds.length <= 2,
      message: "A wedding must have one or two editors.",
    },
  },
  familyTokenHash: { type: String, default: undefined },
  partnerInvite: { type: partnerInviteSchema, default: null },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { timestamps: true, collection: "weddings" });

weddingSchema.index({ editorIds: 1 }, { unique: true });
weddingSchema.index({ familyTokenHash: 1 }, { unique: true, sparse: true });
weddingSchema.index({ "partnerInvite.tokenHash": 1 }, { unique: true, sparse: true });

export const WeddingModel = models.Wedding ?? model<WeddingDocument>("Wedding", weddingSchema);
