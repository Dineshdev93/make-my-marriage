import mongoose, { Types } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("./model", () => ({
  FunctionModel: {
    find: vi.fn(), findOne: vi.fn(), create: vi.fn(), findOneAndUpdate: vi.fn(), findOneAndDelete: vi.fn(),
  },
}));
vi.mock("@/modules/expenses/model", () => ({ ExpenseModel: { updateMany: vi.fn() } }));
vi.mock("@/modules/tasks/model", () => ({ TaskModel: { updateMany: vi.fn() } }));

import { ExpenseModel } from "@/modules/expenses/model";
import { TaskModel } from "@/modules/tasks/model";
import { FunctionModel } from "./model";
import { createFunction, deleteFunction, getFunction, listFunctions, updateFunction } from "./service";

const weddingId = new Types.ObjectId().toString();
const userId = new Types.ObjectId().toString();
const functionId = new Types.ObjectId().toString();
const context = { weddingId, userId, role: "editor" as const };
const source = {
  _id: new Types.ObjectId(functionId),
  weddingId: new Types.ObjectId(weddingId),
  name: "Haldi",
  date: "2027-03-12",
  venue: "The Courtyard",
  createdBy: new Types.ObjectId(userId),
  updatedBy: new Types.ObjectId(userId),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(mongoose, "startSession");
});
afterEach(() => vi.restoreAllMocks());

describe("functions service without a database", () => {
  it("creates records scoped to the context wedding with audit ids", async () => {
    vi.mocked(FunctionModel.create).mockResolvedValue(source as never);
    await createFunction(context, { name: "Haldi", date: "2027-03-12", venue: "The Courtyard" });
    expect(FunctionModel.create).toHaveBeenCalledWith(expect.objectContaining({
      weddingId: expect.any(Types.ObjectId),
      createdBy: expect.any(Types.ObjectId),
      updatedBy: expect.any(Types.ObjectId),
    }));
  });

  it("lists by date and then name inside the context wedding", async () => {
    const sort = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([source]) });
    vi.mocked(FunctionModel.find).mockReturnValue({ sort } as never);
    await listFunctions(context);
    expect(FunctionModel.find).toHaveBeenCalledWith({ weddingId: expect.any(Types.ObjectId) });
    expect(sort).toHaveBeenCalledWith({ date: 1, name: 1 });
  });

  it("clears venue with $unset and updates only the sent fields", async () => {
    vi.mocked(FunctionModel.findOneAndUpdate).mockReturnValue({ lean: () => Promise.resolve({ ...source, venue: undefined }) } as never);
    const result = await updateFunction(context, functionId, { venue: "" });
    expect(result.venue).toBeUndefined();
    expect(FunctionModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: expect.any(Types.ObjectId), weddingId: expect.any(Types.ObjectId) },
      { $set: { updatedBy: expect.any(Types.ObjectId) }, $unset: { venue: 1 } },
      { new: true, runValidators: true },
    );
  });

  it("returns NOT_FOUND for malformed ids and records outside the wedding", async () => {
    await expect(getFunction(context, "malformed")).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    vi.mocked(FunctionModel.findOne).mockReturnValue({ lean: () => Promise.resolve(null) } as never);
    await expect(getFunction(context, new Types.ObjectId().toString())).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    vi.mocked(FunctionModel.findOneAndUpdate).mockReturnValue({ lean: () => Promise.resolve(null) } as never);
    await expect(updateFunction(context, functionId, { name: "Other wedding" })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("rejects every viewer write before touching models", async () => {
    const viewer = { ...context, role: "viewer" as const };
    await expect(createFunction(viewer, { name: "Haldi", date: "2027-03-12" })).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    await expect(updateFunction(viewer, functionId, { name: "Updated" })).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    await expect(deleteFunction(viewer, functionId)).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(FunctionModel.create).not.toHaveBeenCalled();
    expect(FunctionModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mongoose.startSession).not.toHaveBeenCalled();
  });

  it("clears same-wedding references and deletes within a transaction", async () => {
    const session = { withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()), endSession: vi.fn() };
    vi.spyOn(mongoose, "startSession").mockResolvedValue(session as never);
    vi.mocked(FunctionModel.findOne).mockReturnValue({ session: () => ({ lean: () => Promise.resolve(source) }) } as never);
    vi.mocked(FunctionModel.findOneAndDelete).mockReturnValue({ lean: () => Promise.resolve(source) } as never);
    vi.mocked(ExpenseModel.updateMany).mockResolvedValue({ modifiedCount: 1 } as never);
    vi.mocked(TaskModel.updateMany).mockResolvedValue({ modifiedCount: 1 } as never);

    await expect(deleteFunction(context, functionId)).resolves.toEqual({ id: functionId });
    expect(ExpenseModel.updateMany).toHaveBeenCalledWith(
      { weddingId: expect.any(Types.ObjectId), functionId: expect.any(Types.ObjectId) },
      { $set: { functionId: null } },
      { session },
    );
    expect(TaskModel.updateMany).toHaveBeenCalledWith(
      { weddingId: expect.any(Types.ObjectId), functionId: expect.any(Types.ObjectId) },
      { $set: { functionId: null } },
      { session },
    );
    expect(session.endSession).toHaveBeenCalled();
  });
});
