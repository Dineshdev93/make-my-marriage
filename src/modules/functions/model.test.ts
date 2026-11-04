import { describe, expect, it } from "vitest";
import { FunctionModel } from "./model";

describe("Function model", () => {
  it("indexes functions by wedding and date and requires audit fields", () => {
    expect(FunctionModel.schema.indexes()).toContainEqual([{ weddingId: 1, date: 1 }, {}]);
    for (const path of ["weddingId", "name", "date", "createdBy", "updatedBy"]) {
      expect(FunctionModel.schema.path(path).options.required).toBe(true);
    }
    expect(FunctionModel.schema.path("venue").options.maxlength).toBe(200);
  });
});
