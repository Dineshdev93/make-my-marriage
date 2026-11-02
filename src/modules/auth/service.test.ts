import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import { PasswordResetModel, UserModel } from "./model";
import { registerUser, requestPasswordReset, resetPassword, verifyCredentials } from "./service";

let mongo: MongoMemoryServer;
const runMongoIntegrationTests = process.platform !== "win32" || process.env.RUN_MONGO_MEMORY_TESTS === "1";

beforeAll(async () => {
  if (!runMongoIntegrationTests) return;
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.AUTH_SECRET = "test-auth-secret";
  process.env.AUTH_URL = "http://localhost:3000";
  delete process.env.RESEND_API_KEY;
  await connectToDatabase();
  await Promise.all([UserModel.init(), PasswordResetModel.init()]);
});

afterEach(async () => {
  if (!mongo) return;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all([UserModel.deleteMany({}), PasswordResetModel.deleteMany({})]);
});

afterAll(async () => {
  if (!mongo) return;
  await mongoose.disconnect();
  await mongo.stop();
});

describe.skipIf(!runMongoIntegrationTests)("auth service", () => {
  it("registers users with a bcrypt cost 12 hash and handles duplicate email", async () => {
    const user = await registerUser({ name: "Meera", email: "meera@example.com", password: "password" });
    const stored = await UserModel.findById(user.id);
    expect(user).toEqual({ id: user.id, name: "Meera", email: "meera@example.com" });
    expect(stored?.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    await expect(registerUser({ name: "Mira", email: "meera@example.com", password: "password" }))
      .rejects.toMatchObject({ code: "EMAIL_TAKEN", status: 409 });
  });

  it("compares a dummy hash for missing users and rejects bad credentials", async () => {
    await registerUser({ name: "Meera", email: "meera@example.com", password: "correct-pass" });
    await expect(verifyCredentials("meera@example.com", "wrong-pass")).resolves.toBeNull();
    await expect(verifyCredentials("missing@example.com", "wrong-pass")).resolves.toBeNull();
    await expect(verifyCredentials("meera@example.com", "correct-pass")).resolves.toMatchObject({ email: "meera@example.com" });
  });

  it("stores only reset token hashes, resets the password, and invalidates other links", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await registerUser({ name: "Meera", email: "meera@example.com", password: "old-password" });
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await requestPasswordReset(user.email);
    await requestPasswordReset(user.email);
    const links = info.mock.calls.map(([message]) => String(message).match(/https?:\/\/\S+/)?.[0] ?? "");
    const tokens = links.map((link) => new URL(link).searchParams.get("token") ?? "");
    const records = await PasswordResetModel.find({ userId: user.id }).sort({ expiresAt: 1 });
    expect(records).toHaveLength(2);
    expect(records.every((record) => tokens.includes(record.tokenHash) === false)).toBe(true);
    expect(records[0]?.tokenHash).toBe(hashToken(tokens[0] ?? ""));
    expect(records[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now() + 59 * 60 * 1000);

    await resetPassword(tokens[0] ?? "", "new-password");
    expect((await PasswordResetModel.findById(records[1]?._id))?.usedAt).toBeInstanceOf(Date);
    await expect(verifyCredentials(user.email, "old-password")).resolves.toBeNull();
    await expect(verifyCredentials(user.email, "new-password")).resolves.toMatchObject({ email: user.email });
    await expect(resetPassword(tokens[0] ?? "", "another-password"))
      .rejects.toMatchObject({ code: "LINK_EXPIRED", status: 410 });
  });

  it("rejects expired reset tokens", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const user = await registerUser({ name: "Meera", email: "meera@example.com", password: "old-password" });
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await requestPasswordReset(user.email);
    const link = String(info.mock.calls[0]?.[0]).match(/https?:\/\/\S+/)?.[0] ?? "";
    const token = new URL(link).searchParams.get("token") ?? "";
    await PasswordResetModel.updateOne({ tokenHash: hashToken(token) }, { $set: { expiresAt: new Date(Date.now() - 1) } });
    await expect(resetPassword(token, "new-password"))
      .rejects.toMatchObject({ code: "LINK_EXPIRED", status: 410 });
  });
});
