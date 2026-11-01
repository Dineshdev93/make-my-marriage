import { describe, expect, it } from "vitest";
import { daysUntil, getTodayIST, isDateString, isOverdue } from "./dates";

describe("date helpers", () => {
  it("validates actual calendar dates", () => {
    expect(isDateString("2024-02-29")).toBe(true);
    expect(isDateString("2025-02-29")).toBe(false);
    expect(isDateString("2025-2-03")).toBe(false);
  });

  it("computes today and countdown in IST", () => {
    const now = new Date("2025-01-01T20:00:00.000Z");
    expect(getTodayIST(now)).toBe("2025-01-02");
    expect(daysUntil("2025-01-01", now)).toBe(-1);
    expect(daysUntil("2025-01-04", now)).toBe(2);
  });

  it("marks only incomplete past tasks overdue", () => {
    const now = new Date("2025-01-01T20:00:00.000Z");
    expect(isOverdue("2025-01-01", false, now)).toBe(true);
    expect(isOverdue("2025-01-01", true, now)).toBe(false);
    expect(isOverdue("2025-01-02", false, now)).toBe(false);
  });
});
