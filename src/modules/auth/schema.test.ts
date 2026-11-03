import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "./schema";

describe("auth schemas", () => {
  it("trims and lowercases registration emails and names", () => {
    expect(registerSchema.parse({ name: " Meera ", email: " MEERA@EXAMPLE.COM ", password: "password" })).toEqual({
      name: "Meera", email: "meera@example.com", password: "password",
    });
  });

  it("enforces password length by UTF-8 bytes", () => {
    expect(registerSchema.safeParse({ name: "Meera", email: "meera@example.com", password: "é".repeat(4) }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "token", password: "é".repeat(37) }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "M".repeat(101), email: "meera@example.com", password: "password" }).success).toBe(false);
  });

  it("exports the forgot password body schema", () => {
    expect(forgotPasswordSchema.parse({ email: " USER@example.com " })).toEqual({ email: "user@example.com" });
    expect(forgotPasswordSchema.safeParse({ email: "invalid" }).success).toBe(false);
  });
});
