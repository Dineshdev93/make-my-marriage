import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { connectToDatabase } from "@/lib/db";
import { ExpenseModel } from "@/modules/expenses/model";
import { TaskModel } from "@/modules/tasks/model";
import { FunctionModel } from "./model";
import { createFunction, deleteFunction, getFunction, listFunctions, updateFunction } from "./service";

let mongo: MongoMemoryReplSet | undefined;
const runMongoIntegrationTests = process.platform !== "win32" || process.env.RUN_MONGO_MEMORY_TESTS === "1";
const actorId = new Types.ObjectId();
const makeContext = (weddingId: Types.ObjectId, userId = actorId.toString()) => ({ weddingId: weddingId.toString(), userId, role: "editor" as const });

beforeAll(async () => {
  if (!runMongoIntegrationTests) return;
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  await Promise.all([FunctionModel.init(), ExpenseModel.init(), TaskModel.init()]);
});

afterEach(async () => {
  vi.restoreAllMocks();
  if (!mongo) return;
  await Promise.all([FunctionModel.deleteMany({}), ExpenseModel.deleteMany({}), TaskModel.deleteMany({})]);
});

afterAll(async () => {
  if (!mongo) return;
  await mongoose.disconnect();
  await mongo.stop();
});

describe.skipIf(!runMongoIntegrationTests)("functions service integration", () => {
  it("creates functions, sorts by date and name, and clears an empty venue", async () => {
    const weddingId = new Types.ObjectId();
    const context = makeContext(weddingId);
    const later = await createFunction(context, { name: "Reception", date: "2027-03-14" });
    await createFunction(context, { name: "Pheras", date: "2027-03-14", venue: "Mandap" });
    await createFunction(context, { name: "Haldi", date: "2027-03-12" });

    expect((await listFunctions(context)).map(({ name }) => name)).toEqual(["Haldi", "Pheras", "Reception"]);
    const cleared = await updateFunction(context, later.id, { venue: "" });
    expect(cleared.venue).toBeUndefined();
    expect((await getFunction(context, later.id)).name).toBe("Reception");
  });

  it("does not allow a different wedding to read, update, or delete a function", async () => {
    const weddingA = new Types.ObjectId();
    const weddingB = new Types.ObjectId();
    const functionA = await createFunction(makeContext(weddingA), { name: "Haldi", date: "2027-03-12" });
    const contextB = makeContext(weddingB, new Types.ObjectId().toString());

    await expect(getFunction(contextB, functionA.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(updateFunction(contextB, functionA.id, { name: "Changed" })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(deleteFunction(contextB, functionA.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    expect((await getFunction(makeContext(weddingA), functionA.id)).name).toBe("Haldi");
  });

  it("rejects viewer writes for create, update, and delete", async () => {
    const context = makeContext(new Types.ObjectId());
    const functionRecord = await createFunction(context, { name: "Haldi", date: "2027-03-12" });
    const viewer = { ...context, role: "viewer" as const };
    await expect(createFunction(viewer, { name: "Mehendi", date: "2027-03-13" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateFunction(viewer, functionRecord.id, { name: "Changed" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deleteFunction(viewer, functionRecord.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("clears only same-wedding task and expense references and keeps those records", async () => {
    const weddingA = new Types.ObjectId();
    const weddingB = new Types.ObjectId();
    const contextA = makeContext(weddingA);
    const contextB = makeContext(weddingB, new Types.ObjectId().toString());
    const functionA = await createFunction(contextA, { name: "Haldi", date: "2027-03-12" });
    const functionB = await createFunction(contextB, { name: "Reception", date: "2027-03-14" });

    const [expenseA, expenseB] = await ExpenseModel.create([
      { weddingId: weddingA, amountPaise: 100, category: "Venue", description: "A expense", expenseDate: "2027-03-12", functionId: functionA.id, createdBy: actorId, updatedBy: actorId },
      { weddingId: weddingB, amountPaise: 100, category: "Venue", description: "B expense", expenseDate: "2027-03-14", functionId: functionB.id, createdBy: actorId, updatedBy: actorId },
    ]);
    const [taskA, taskB] = await TaskModel.create([
      { weddingId: weddingA, title: "A task", dueDate: "2027-03-12", functionId: functionA.id, createdBy: actorId, updatedBy: actorId },
      { weddingId: weddingB, title: "B task", dueDate: "2027-03-14", functionId: functionB.id, createdBy: actorId, updatedBy: actorId },
    ]);

    await deleteFunction(contextA, functionA.id);
    expect((await ExpenseModel.findById(expenseA?._id))?.functionId).toBeNull();
    expect((await TaskModel.findById(taskA?._id))?.functionId).toBeNull();
    expect((await ExpenseModel.findById(expenseA?._id))?.description).toBe("A expense");
    expect((await TaskModel.findById(taskA?._id))?.title).toBe("A task");
    expect((await ExpenseModel.findById(expenseB?._id))?.functionId?.toString()).toBe(functionB.id);
    expect((await TaskModel.findById(taskB?._id))?.functionId?.toString()).toBe(functionB.id);
    await expect(getFunction(contextA, functionA.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rolls back all reference changes when an operation inside the transaction fails", async () => {
    const context = makeContext(new Types.ObjectId());
    const functionRecord = await createFunction(context, { name: "Haldi", date: "2027-03-12" });
    const expense = await ExpenseModel.create({
      weddingId: context.weddingId,
      amountPaise: 100,
      category: "Venue",
      description: "Linked expense",
      expenseDate: "2027-03-12",
      functionId: functionRecord.id,
      createdBy: actorId,
      updatedBy: actorId,
    });
    vi.spyOn(TaskModel, "updateMany").mockRejectedValueOnce(new Error("Injected task update failure"));

    await expect(deleteFunction(context, functionRecord.id)).rejects.toThrow("Injected task update failure");
    expect((await getFunction(context, functionRecord.id)).id).toBe(functionRecord.id);
    expect((await ExpenseModel.findById(expense._id))?.functionId?.toString()).toBe(functionRecord.id);
  });
});
