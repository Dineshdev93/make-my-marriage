import { describe, expect, it } from "vitest";
import { MAX_AMOUNT_PAISE } from "@/lib/money";
import { createWeddingSchema, updateWeddingSchema } from "./schema";

const validWedding = {
  name: "  Meera and Aarav's Wedding  ",
  coupleNames: "  Meera and Aarav  ",
  weddingDate: "2026-11-03",
  totalBudgetPaise: 100,
};

describe("wedding schemas", () => {
  it("trims values and strips unknown and protected fields", () => {
    const result = createWeddingSchema.parse({
      ...validWedding,
      weddingId: "attacker-controlled",
      editorIds: ["attacker-controlled"],
      familyTokenHash: "secret",
      partnerInvite: { tokenHash: "secret" },
      extra: true,
    });
    expect(result).toEqual({
      name: "Meera and Aarav's Wedding",
      coupleNames: "Meera and Aarav",
      weddingDate: "2026-11-03",
      totalBudgetPaise: 100,
    });
  });

  it("accepts the one rupee minimum and 100 crore cap", () => {
    expect(createWeddingSchema.safeParse({ ...validWedding, totalBudgetPaise: 100 }).success).toBe(true);
    expect(createWeddingSchema.safeParse({ ...validWedding, totalBudgetPaise: MAX_AMOUNT_PAISE }).success).toBe(true);
  });

  it.each([0, -1, 99, 100.5, MAX_AMOUNT_PAISE + 1])("rejects invalid budget %s", (amount) => {
    expect(createWeddingSchema.safeParse({ ...validWedding, totalBudgetPaise: amount }).success).toBe(false);
  });

  it("rejects impossible dates but accepts past dates", () => {
    expect(createWeddingSchema.safeParse({ ...validWedding, weddingDate: "2026-02-30" }).success).toBe(false);
    expect(createWeddingSchema.safeParse({ ...validWedding, weddingDate: "2000-01-01" }).success).toBe(true);
  });

  it("requires at least one known field for updates and strips unknown-only input", () => {
    expect(updateWeddingSchema.safeParse({}).success).toBe(false);
    expect(updateWeddingSchema.safeParse({ weddingId: "not-accepted" }).success).toBe(false);
    expect(updateWeddingSchema.parse({ name: "  New name  ", weddingId: "not-accepted" })).toEqual({ name: "New name" });
  });
});
