import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("./model", () => ({
  WeddingModel: {
    exists: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

import { WeddingModel } from "./model";
import { createWedding, getWedding, updateWedding } from "./service";

const userId = new Types.ObjectId().toString();
const weddingId = new Types.ObjectId().toString();
const source = {
  _id: new Types.ObjectId(weddingId),
  name: "Wedding",
  coupleNames: "Meera and Aarav",
  weddingDate: "2027-03-14",
  totalBudgetPaise: 150_000_000,
  editorIds: [new Types.ObjectId(userId)],
  createdBy: new Types.ObjectId(userId),
  updatedBy: new Types.ObjectId(userId),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("wedding service without a database", () => {
  it("creates a wedding with exactly one editor and audit ids", async () => {
    vi.mocked(WeddingModel.exists).mockResolvedValue(null as never);
    vi.mocked(WeddingModel.create).mockResolvedValue(source as never);
    const result = await createWedding(userId, {
      name: "Wedding", coupleNames: "Meera and Aarav", weddingDate: "2027-03-14", totalBudgetPaise: 150_000_000,
    });
    expect(vi.mocked(WeddingModel.create).mock.calls[0]?.[0]).toMatchObject({
      editorIds: [expect.any(Types.ObjectId)],
      createdBy: expect.any(Types.ObjectId),
      updatedBy: expect.any(Types.ObjectId),
    });
    expect(result).toMatchObject({ id: weddingId, name: "Wedding", editorIds: [userId] });
    expect(result).not.toHaveProperty("familyTokenHash");
    expect(result).not.toHaveProperty("partnerInvite");
  });

  it("maps pre-existing membership and duplicate-key races to WEDDING_EXISTS", async () => {
    vi.mocked(WeddingModel.exists).mockResolvedValue({ _id: weddingId } as never);
    await expect(createWedding(userId, {
      name: "Wedding", coupleNames: "Meera and Aarav", weddingDate: "2027-03-14", totalBudgetPaise: 100,
    })).rejects.toMatchObject({ code: "WEDDING_EXISTS", status: 409 });

    vi.mocked(WeddingModel.exists).mockResolvedValue(null as never);
    vi.mocked(WeddingModel.create).mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    await expect(createWedding(userId, {
      name: "Wedding", coupleNames: "Meera and Aarav", weddingDate: "2027-03-14", totalBudgetPaise: 100,
    })).rejects.toMatchObject({ code: "WEDDING_EXISTS", status: 409 });
  });

  it.each(["editor", "viewer"] as const)("reads a wedding for a %s context", async (role) => {
    vi.mocked(WeddingModel.findOne).mockReturnValue({ lean: () => Promise.resolve(source) } as never);
    const result = await getWedding({ weddingId, role });
    expect(vi.mocked(WeddingModel.findOne)).toHaveBeenCalledWith({ _id: weddingId });
    expect(result.id).toBe(weddingId);
  });

  it("updates only sent fields, records the editor, and scopes by context wedding", async () => {
    vi.mocked(WeddingModel.findOneAndUpdate).mockReturnValue({ lean: () => Promise.resolve(source) } as never);
    await updateWedding({ weddingId, userId, role: "editor" }, { name: "Updated name" });
    expect(vi.mocked(WeddingModel.findOneAndUpdate)).toHaveBeenCalledWith(
      { _id: weddingId },
      { $set: { name: "Updated name", updatedBy: expect.any(Types.ObjectId) } },
      { new: true, runValidators: true },
    );
  });

  it("rejects viewer writes before querying the model", async () => {
    await expect(updateWedding({ weddingId, role: "viewer" }, { name: "Forbidden" }))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(WeddingModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
