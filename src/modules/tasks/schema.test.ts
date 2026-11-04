import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "./schema";

const validTask = { title: "  Book the venue  ", dueDate: "2027-03-10" };

describe("task schemas", () => {
  it("trims titles, defaults completion, and strips unknown fields", () => {
    expect(createTaskSchema.parse({ ...validTask, weddingId: "ignored", extra: true })).toEqual({ title: "Book the venue", dueDate: "2027-03-10", completed: false });
    expect(createTaskSchema.parse({ ...validTask, completed: true }).completed).toBe(true);
  });

  it("validates title limits and real dates", () => {
    expect(createTaskSchema.safeParse({ ...validTask, title: " " }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...validTask, title: "x".repeat(201) }).success).toBe(false);
    expect(createTaskSchema.safeParse({ ...validTask, dueDate: "2026-02-30" }).success).toBe(false);
  });

  it("allows null function links and requires a known update field", () => {
    expect(updateTaskSchema.parse({ functionId: null, untrusted: true })).toEqual({ functionId: null });
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
    expect(updateTaskSchema.safeParse({ functionId: "not-an-object-id" }).success).toBe(false);
  });
});
