import { describe, expect, it } from "vitest";
import { createFunctionSchema, updateFunctionSchema } from "./schema";

const validFunction = { name: "  Haldi  ", date: "2027-03-12" };

describe("function schemas", () => {
  it("trims strings and strips unknown and protected fields", () => {
    expect(createFunctionSchema.parse({
      ...validFunction,
      venue: "  The Courtyard  ",
      weddingId: "untrusted",
      functionId: "untrusted",
      extra: true,
    })).toEqual({ name: "Haldi", date: "2027-03-12", venue: "The Courtyard" });
  });

  it("accepts an empty venue so updates can clear it", () => {
    expect(createFunctionSchema.parse({ ...validFunction, venue: "   " }).venue).toBe("");
    expect(updateFunctionSchema.parse({ venue: "" })).toEqual({ venue: "" });
  });

  it("validates function name, calendar date, and venue limits", () => {
    expect(createFunctionSchema.safeParse({ ...validFunction, name: " " }).success).toBe(false);
    expect(createFunctionSchema.safeParse({ ...validFunction, name: "x".repeat(101) }).success).toBe(false);
    expect(createFunctionSchema.safeParse({ ...validFunction, date: "2026-02-30" }).success).toBe(false);
    expect(createFunctionSchema.safeParse({ ...validFunction, venue: "x".repeat(201) }).success).toBe(false);
  });

  it("requires at least one known field in updates and strips unknown fields", () => {
    expect(updateFunctionSchema.safeParse({}).success).toBe(false);
    expect(updateFunctionSchema.safeParse({ weddingId: "untrusted" }).success).toBe(false);
    expect(updateFunctionSchema.parse({ name: " Reception ", weddingId: "untrusted" })).toEqual({ name: "Reception" });
  });
});
