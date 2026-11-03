import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { assertEditor } from "./access";

describe("assertEditor", () => {
  it("allows editors and rejects viewers", () => {
    expect(() => assertEditor({ weddingId: "w1", role: "editor" })).not.toThrow();
    expect(() => assertEditor({ weddingId: "w1", role: "viewer" })).toThrow("Only wedding editors can make changes.");
  });
});
