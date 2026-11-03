import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getEnv } from "@/lib/env";
import { generateToken, hashToken } from "@/lib/tokens";
import { PasswordResetModel, UserModel, type UserDocument } from "./model";
import type { RegisterInput } from "./schema";

const BCRYPT_COST = 12;
const PASSWORD_RESET_LIFETIME_MS = 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = "$2b$12$6yBWvZAKUSWfTPKzPr0ed.StzCXhgo7eXg6bJ6PrnHcN0ka9NFJlC";
const RESET_MESSAGE = "If an account exists for that email, a reset link is on its way.";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function emailTakenError(): AppError {
  return new AppError("EMAIL_TAKEN", "An account with this email already exists.");
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  await connectToDatabase();
  if (await UserModel.exists({ email: input.email })) throw emailTakenError();

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  try {
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    return { id: user._id.toString(), name: user.name, email: user.email };
  } catch (error) {
    if (isDuplicateKeyError(error)) throw emailTakenError();
    throw error;
  }
}

export async function verifyCredentials(email: string, password: string): Promise<UserDocument | null> {
  await connectToDatabase();
  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  return user && passwordMatches ? user : null;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await connectToDatabase();
  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) return;

  const token = generateToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_LIFETIME_MS);
  await PasswordResetModel.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt,
    usedAt: null,
  });

  const env = getEnv();
  const resetUrl = new URL("/reset-password", env.AUTH_URL);
  resetUrl.searchParams.set("token", token);

  if (env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: env.EMAIL_FROM ?? "Make My Marriage <onboarding@resend.dev>",
        to: [user.email],
        subject: "Reset your Make My Marriage password",
        html: `<p>Use this link to choose a new password. It expires in one hour.</p><p><a href="${resetUrl.toString()}">Reset password</a></p>`,
      });
      if (result.error) console.error("Unable to send password reset email.", result.error.name);
    } catch {
      console.error("Unable to send password reset email.");
    }
  } else if (process.env.NODE_ENV === "development") {
    console.info(`Password reset link: ${resetUrl.toString()}`);
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await connectToDatabase();
  const now = new Date();
  const reset = await PasswordResetModel.findOne({ tokenHash: hashToken(token) });
  if (!reset || reset.usedAt || reset.expiresAt.getTime() <= now.getTime()) {
    throw new AppError("LINK_EXPIRED", "This link has expired or was already used.");
  }

  const claimed = await PasswordResetModel.updateOne(
    { _id: reset._id, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
  );
  if (claimed.modifiedCount !== 1) {
    throw new AppError("LINK_EXPIRED", "This link has expired or was already used.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await UserModel.findByIdAndUpdate(reset.userId, { $set: { passwordHash } });
  if (!user) throw new AppError("LINK_EXPIRED", "This link has expired or was already used.");

  await PasswordResetModel.updateMany(
    { userId: reset.userId, _id: { $ne: reset._id }, usedAt: null },
    { $set: { usedAt: now } },
  );
}

export { RESET_MESSAGE };
