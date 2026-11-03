import { describe, expect, it } from "vitest";
import { WeddingModel } from "./model";

describe("Wedding model indexes", () => {
  it("enforces one wedding per editor and unique share tokens", () => {
    const indexes = WeddingModel.schema.indexes();
    expect(indexes).toContainEqual([{ editorIds: 1 }, { unique: true }]);
    expect(indexes).toContainEqual([{ familyTokenHash: 1 }, { unique: true, sparse: true }]);
    expect(indexes).toContainEqual([{ "partnerInvite.tokenHash": 1 }, { unique: true, sparse: true }]);
  });
});
