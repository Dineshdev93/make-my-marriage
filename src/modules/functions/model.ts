import { model, models, Schema, Types } from "mongoose";
import { isDateString } from "@/lib/dates";

export interface FunctionDocument {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  name: string;
  date: string;
  venue?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const functionSchema = new Schema<FunctionDocument>({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  date: {
    type: String,
    required: true,
    validate: { validator: isDateString, message: "Function date must be a real date in YYYY-MM-DD format." },
  },
  venue: { type: String, trim: true, maxlength: 200 },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { timestamps: true, collection: "functions" });

functionSchema.index({ weddingId: 1, date: 1 });

export const FunctionModel = models.Function ?? model<FunctionDocument>("Function", functionSchema);
