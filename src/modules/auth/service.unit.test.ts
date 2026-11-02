import bcrypt from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("./model", () => ({
  UserModel: {
    exists: vi.fn(), create: vi.fn(), findOne: vi.fn(), findByIdAndUpdate: vi.fn(),
  },
  PasswordResetModel: {
    create: vi.fn(), findOne: vi.fn(), updateOne: vi.fn(), updateMany: vi.fn(),
  },
}));

import { PasswordResetModel, UserModel } from "./model";
import { registerUser, requestPasswordReset, resetPassword, verifyCredentials } from "./service";

const user = {
  _id: { toString: () => "user-id" },
  id: "user-id",
  name: "Meera",
  email: "meera@example.com",
  passwordHash: "$2b$12$6yBWvZAKUSWfTPKzPr0ed.StzCXhgo7eXg6bJ6PrnHcN0ka9NFJlC",
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("auth service without a database", () => {
  it("uses a cost 12 hash and maps duplicate-key races to EMAIL_TAKEN", async () => {
    vi.mocked(UserModel.exists).mockResolvedValue(null as never);
    vi.mocked(UserModel.create).mockResolvedValue(user as never);
    await expect(registerUser({ name: "Meera", email: "meera@example.com", password: "password" }))
      .resolves.toMatchObject({ id: "user-id", name: "Meera", email: "meera@example.com" });
    expect(vi.mocked(UserModel.create).mock.calls[0]?.[0]).toMatchObject({
      passwordHash: expect.stringMatching(/^\$2[ab]\$12\$/),
    });

    vi.mocked(UserModel.exists).mockResolvedValue(null as never);
    vi.mocked(UserModel.create).mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    await expect(registerUser({ name: "Meera", email: "meera@example.com", password: "password" }))
      .rejects.toMatchObject({ code: "EMAIL_TAKEN", status: 409 });
  });

  it("compares a dummy bcrypt hash when no user exists", async () => {
    vi.mocked(UserModel.findOne).mockResolvedValue(null as never);
    const compare = vi.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(false) as never);
    await expect(verifyCredentials("missing@example.com", "secret-password")).resolves.toBeNull();
    expect(compare).toHaveBeenCalledWith("secret-password", expect.stringMatching(/^\$2b\$12\$/));
  });

  it("stores only a hashed token and sends or logs a one-hour reset link", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://localhost/test");
    vi.stubEnv("AUTH_SECRET", "test-secret");
    vi.stubEnv("AUTH_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.mocked(UserModel.findOne).mockResolvedValue(user as never);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await requestPasswordReset(user.email);

    const resetLink = String(info.mock.calls[0]?.[0]).match(/https?:\/\/\S+/)?.[0] ?? "";
    const token = new URL(resetLink).searchParams.get("token") ?? "";
    const [resetRecord] = vi.mocked(PasswordResetModel.create).mock.calls[0] ?? [];
    expect(resetRecord).toMatchObject({ userId: user._id, usedAt: null });
    expect(resetRecord).not.toHaveProperty("token");
    expect(resetRecord.tokenHash).not.toBe(token);
    expect(resetRecord.expiresAt.getTime()).toBeGreaterThan(Date.now() + 59 * 60 * 1000);
  });

  it("marks a token used, updates the password, and invalidates other links", async () => {
    const reset = { _id: "reset-id", userId: "user-id", expiresAt: new Date(Date.now() + 60_000), usedAt: null };
    vi.mocked(PasswordResetModel.findOne).mockResolvedValue(reset as never);
    vi.mocked(PasswordResetModel.updateOne).mockResolvedValue({ modifiedCount: 1 } as never);
    vi.mocked(UserModel.findByIdAndUpdate).mockResolvedValue(user as never);
    vi.mocked(PasswordResetModel.updateMany).mockResolvedValue({ modifiedCount: 1 } as never);
    await resetPassword("reset-token", "new-password");

    const updatedPasswordHash = vi.mocked(UserModel.findByIdAndUpdate).mock.calls[0]?.[1]?.$set?.passwordHash;
    expect(updatedPasswordHash).toMatch(/^\$2[ab]\$12\$/);
    expect(vi.mocked(PasswordResetModel.updateMany)).toHaveBeenCalledWith(
      { userId: "user-id", _id: { $ne: "reset-id" }, usedAt: null },
      { $set: { usedAt: expect.any(Date) } },
    );
  });
});
