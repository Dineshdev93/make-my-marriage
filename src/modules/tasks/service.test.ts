import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectToDatabase } from "@/lib/db";
import { ExpenseModel } from "@/modules/expenses/model";
import { FunctionModel } from "@/modules/functions/model";
import { deleteFunction } from "@/modules/functions/service";
import { TaskModel } from "./model";
import { createTask, deleteTask, listTasks, updateTask } from "./service";

let mongo: MongoMemoryReplSet | undefined;
const runMongoIntegrationTests = process.platform !== "win32" || process.env.RUN_MONGO_MEMORY_TESTS === "1";
const makeContext = (weddingId: Types.ObjectId, userId = new Types.ObjectId().toString()) => ({ weddingId: weddingId.toString(), userId, role: "editor" as const });
const taskInput = { title: "Book the venue", dueDate: "2027-03-12" };

beforeAll(async () => {
  if (!runMongoIntegrationTests) return;
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  await Promise.all([TaskModel.init(), FunctionModel.init(), ExpenseModel.init()]);
});

afterEach(async () => {
  if (!mongo) return;
  await Promise.all([TaskModel.deleteMany({}), FunctionModel.deleteMany({}), ExpenseModel.deleteMany({})]);
});

afterAll(async () => {
  if (!mongo) return;
  await mongoose.disconnect();
  await mongo.stop();
});

describe.skipIf(!runMongoIntegrationTests)("task service integration", () => {
  it("creates and partially updates a task, setting and clearing completedAt", async () => {
    const context = makeContext(new Types.ObjectId());
    const task = await createTask(context, taskInput);
    expect(task).toMatchObject({ title: "Book the venue", completed: false, completedAt: null, status: "pending" });
    const completed = await updateTask(context, task.id, { completed: true });
    expect(completed.completedAt).not.toBeNull();
    expect(completed.completed).toBe(true);
    const reopened = await updateTask(context, task.id, { completed: false });
    expect(reopened.completedAt).toBeNull();
    expect(reopened.completed).toBe(false);
    expect((await updateTask(context, task.id, { title: "Pay venue deposit" })).title).toBe("Pay venue deposit");
  });

  it("keeps completedAt unchanged when completion is set to its existing value", async () => {
    const context = makeContext(new Types.ObjectId());
    const task = await createTask(context, { ...taskInput, completed: true });
    const before = task.completedAt;
    const after = await updateTask(context, task.id, { completed: true });
    expect(after.completedAt).toBe(before);
  });

  it("lists by due date, validates function ownership, and keeps tasks when a function is deleted", async () => {
    const contextA = makeContext(new Types.ObjectId());
    const contextB = makeContext(new Types.ObjectId());
    const ownFunction = await FunctionModel.create({ weddingId: contextA.weddingId, name: "Haldi", date: "2027-03-12", createdBy: contextA.userId, updatedBy: contextA.userId });
    const foreignFunction = await FunctionModel.create({ weddingId: contextB.weddingId, name: "Reception", date: "2027-03-14", createdBy: contextB.userId, updatedBy: contextB.userId });
    const later = await createTask(contextA, { ...taskInput, dueDate: "2027-03-14", functionId: ownFunction._id.toString() });
    const earlier = await createTask(contextA, { ...taskInput, dueDate: "2027-03-10" });
    expect((await listTasks(contextA, "2027-03-01")).map(({ id }) => id)).toEqual([earlier.id, later.id]);
    await expect(createTask(contextA, { ...taskInput, functionId: foreignFunction._id.toString() })).rejects.toMatchObject({ code: "VALIDATION_ERROR", fields: { functionId: expect.any(String) } });
    await deleteFunction(contextA, ownFunction._id.toString());
    expect((await listTasks(contextA, "2027-03-01")).find(({ id }) => id === later.id)).toMatchObject({ functionId: null });
  });

  it("isolates records by wedding and rejects every viewer write", async () => {
    const contextA = makeContext(new Types.ObjectId());
    const contextB = makeContext(new Types.ObjectId());
    const task = await createTask(contextA, taskInput);
    const viewer = { ...contextA, role: "viewer" as const };
    await expect(createTask(viewer, taskInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateTask(viewer, task.id, { completed: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deleteTask(viewer, task.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateTask(contextB, task.id, { title: "Denied" })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(deleteTask(contextB, task.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(deleteTask(contextB, "invalid-id")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await listTasks(contextB)).toEqual([]);
    expect((await listTasks(contextA))[0]?.id).toBe(task.id);
  });
});
