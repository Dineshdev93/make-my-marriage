import { describe, expect, it } from "vitest";
import { computeTaskStatus } from "./status";

describe("computeTaskStatus", () => {
  const today = "2027-03-12";

  it("marks incomplete tasks due before today as overdue", () => {
    expect(computeTaskStatus({ dueDate: "2027-03-11", completed: false }, today)).toBe("overdue");
  });

  it("keeps tasks due today or later pending", () => {
    expect(computeTaskStatus({ dueDate: today, completed: false }, today)).toBe("pending");
    expect(computeTaskStatus({ dueDate: "2027-03-13", completed: false }, today)).toBe("pending");
  });

  it("keeps completed tasks completed after their due date", () => {
    expect(computeTaskStatus({ dueDate: "2027-03-01", completed: true }, today)).toBe("completed");
  });
});
