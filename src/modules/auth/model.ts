import { model, models, Schema, Types } from "mongoose";

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true },
}, { timestamps: true, collection: "users" });

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = models.User ?? model<UserDocument>("User", userSchema);

export interface PasswordResetDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

const passwordResetSchema = new Schema<PasswordResetDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { collection: "passwordResets" });

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetSchema.index({ tokenHash: 1 });

export const PasswordResetModel = models.PasswordReset ?? model<PasswordResetDocument>("PasswordReset", passwordResetSchema);
