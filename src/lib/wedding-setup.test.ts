import { describe, expect, it } from "vitest";
import { formatRupeesWhileTyping, formatWeddingDatePreview, getWeddingCountdownText } from "./wedding-setup";

describe("wedding setup preview helpers", () => {
  it("groups whole rupees with Indian digit grouping as the user types", () => {
    expect(formatRupeesWhileTyping("1500000")).toBe("15,00,000");
    expect(formatRupeesWhileTyping("1,20,00,000")).toBe("1,20,00,000");
    expect(formatRupeesWhileTyping("₹ 001500")).toBe("1,500");
    expect(formatRupeesWhileTyping("")).toBe("");
  });

  it("formats date-only values without local timezone drift", () => {
    expect(formatWeddingDatePreview("2027-03-14")).toBe("Sunday, 14 March 2027");
    expect(formatWeddingDatePreview("2026-02-30")).toBe("");
  });

  it("computes countdown language in IST for future, today, and past dates", () => {
    const now = new Date("2026-11-02T20:00:00.000Z"); // 3 November in IST
    expect(getWeddingCountdownText("2026-11-05", now)).toBe("2 days to go");
    expect(getWeddingCountdownText("2026-11-03", now)).toBe("Today");
    expect(getWeddingCountdownText("2026-11-01", now)).toBe("2 days ago");
  });
});
