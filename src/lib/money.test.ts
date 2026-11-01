import { describe, expect, it } from "vitest";
import { formatPaise, parseRupeesToPaise } from "./money";

describe("money helpers", () => {
  it("parses Indian grouped rupees using integer arithmetic", () => {
    expect(parseRupeesToPaise("15,00,000")).toBe(150_000_000);
    expect(parseRupeesToPaise("250")).toBe(25_000);
    expect(parseRupeesToPaise("1,00,00,00,000")).toBe(100_000_000_000);
  });

  it("rejects malformed, non-positive, and over-limit input", () => {
    for (const value of ["0", "-1", "1.5", "15,000,000", "1000000001"]) {
      expect(() => parseRupeesToPaise(value)).toThrow();
    }
  });

  it("formats paise with Indian grouping", () => {
    expect(formatPaise(150_000_000)).toBe("₹15,00,000");
    expect(formatPaise(12_345_678)).toBe("₹1,23,456.78");
  });
});
