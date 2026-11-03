import { afterEach, describe, expect, it } from "vitest";
import { assertSameOrigin } from "./origin";

afterEach(() => {
  delete process.env.AUTH_URL;
  delete process.env.MONGODB_URI;
  delete process.env.AUTH_SECRET;
});

describe("assertSameOrigin", () => {
  it("allows requests from AUTH_URL origin", () => {
    process.env.AUTH_URL = "http://localhost:3000";
    process.env.MONGODB_URI = "mongodb://localhost/test";
    process.env.AUTH_SECRET = "test-secret";
    expect(() => assertSameOrigin(new Request("http://localhost:3000/api/auth/register", {
      headers: { origin: "http://localhost:3000" },
    }))).not.toThrow();
  });

  it("rejects cross-origin and missing Origin headers", () => {
    process.env.AUTH_URL = "http://localhost:3000";
    process.env.MONGODB_URI = "mongodb://localhost/test";
    process.env.AUTH_SECRET = "test-secret";
    expect(() => assertSameOrigin(new Request("http://localhost:3000/api/auth/register", {
      headers: { origin: "https://elsewhere.example" },
    }))).toThrow();
    expect(() => assertSameOrigin(new Request("http://localhost:3000/api/auth/register"))).toThrow();
  });
});
