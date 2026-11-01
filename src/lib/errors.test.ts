import { describe, expect, it } from "vitest";
import { AppError, errorResponse } from "./errors";

describe("app errors", () => {
  it("maps errors to API status and body", async () => {
    const response = errorResponse(new AppError("VALIDATION_ERROR", "Invalid input", { name: "Required" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: {
      code: "VALIDATION_ERROR", message: "Invalid input", fields: { name: "Required" },
    } });
  });

  it("hides unknown error details", async () => {
    const response = errorResponse(new Error("secret"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: {
      code: "INTERNAL_ERROR", message: "An unexpected error occurred.",
    } });
  });
});
