import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "./tokens";

describe("token helpers", () => {
  it("generates 32-byte URL-safe tokens", () => {
    const token = generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("returns a stable SHA-256 hash", () => {
    expect(hashToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });
});
