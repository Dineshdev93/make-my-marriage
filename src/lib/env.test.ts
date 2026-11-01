import { describe, expect, it } from "vitest";
import { getEnv } from "./env";

describe("getEnv", () => {
  it("validates required settings and accepts optional settings", () => {
    expect(getEnv({ MONGODB_URI: "mongodb://localhost/test", AUTH_SECRET: "secret", AUTH_URL: "http://localhost:3000" })).toEqual({
      MONGODB_URI: "mongodb://localhost/test", AUTH_SECRET: "secret", AUTH_URL: "http://localhost:3000",
    });
  });

  it("rejects missing and malformed required settings", () => {
    expect(() => getEnv({})).toThrow();
    expect(() => getEnv({ MONGODB_URI: "x", AUTH_SECRET: "y", AUTH_URL: "bad" })).toThrow();
  });
});
