import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectToDatabase } from "@/lib/db";
import { FunctionModel } from "@/modules/functions/model";
import { WeddingModel } from "@/modules/wedding/model";
import { ExpenseModel } from "./model";
import { createExpense, deleteExpense, getBudgetSummary, listExpenses, updateExpense } from "./service";

let mongo: MongoMemoryServer | undefined;
const runMongoIntegrationTests = process.platform !== "win32" || process.env.RUN_MONGO_MEMORY_TESTS === "1";
const makeContext = (weddingId: Types.ObjectId, userId = new Types.ObjectId().toString()) => ({ weddingId: weddingId.toString(), userId, role: "editor" as const });
const createWedding = async (weddingId: Types.ObjectId, context: ReturnType<typeof makeContext>, budget = 10_000) => WeddingModel.create({
  _id: weddingId,
  name: "Test wedding",
  coupleNames: "A and B",
  weddingDate: "2027-03-14",
  totalBudgetPaise: budget,
  editorIds: [new Types.ObjectId(context.userId)],
  createdBy: new Types.ObjectId(context.userId),
  updatedBy: new Types.ObjectId(context.userId),
});
const expenseInput = { amountPaise: 1_000, category: "Venue" as const, description: "Deposit", expenseDate: "2027-03-12" };

beforeAll(async () => {
  if (!runMongoIntegrationTests) return;
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  await Promise.all([WeddingModel.init(), FunctionModel.init(), ExpenseModel.init()]);
});

afterEach(async () => {
  if (!mongo) return;
  await Promise.all([ExpenseModel.deleteMany({}), FunctionModel.deleteMany({}), WeddingModel.deleteMany({})]);
});

afterAll(async () => {
  if (!mongo) return;
  await mongoose.disconnect();
  await mongo.stop();
});

describe.skipIf(!runMongoIntegrationTests)("expense service integration", () => {
  it("creates, partially updates, deletes and always summarizes saved amounts", async () => {
    const weddingId = new Types.ObjectId();
    const context = makeContext(weddingId);
    await createWedding(weddingId, context);
    const expense = await createExpense(context, expenseInput);
    expect(expense.createdBy).toBe(context.userId);
    expect((await getBudgetSummary(context)).totalExpensesPaise).toBe(1_000);

    await updateExpense(context, expense.id, { amountPaise: 2_000, category: "Catering" });
    expect((await getBudgetSummary(context)).totalExpensesPaise).toBe(2_000);
    expect((await listExpenses(context))[0]).toMatchObject({ amountPaise: 2_000, category: "Catering" });
    await deleteExpense(context, expense.id);
    expect((await getBudgetSummary(context)).totalExpensesPaise).toBe(0);
  });

  it("orders newest expense dates first and rejects function links from another wedding", async () => {
    const contextA = makeContext(new Types.ObjectId());
    const contextB = makeContext(new Types.ObjectId());
    await createWedding(new Types.ObjectId(contextA.weddingId), contextA);
    await createWedding(new Types.ObjectId(contextB.weddingId), contextB);
    const later = await createExpense(contextA, { ...expenseInput, expenseDate: "2027-03-14" });
    const earlier = await createExpense(contextA, { ...expenseInput, expenseDate: "2027-03-12" });
    expect((await listExpenses(contextA)).map(({ id }) => id)).toEqual([later.id, earlier.id]);
    const foreignFunction = await FunctionModel.create({ weddingId: contextB.weddingId, name: "Haldi", date: "2027-03-12", createdBy: contextB.userId, updatedBy: contextB.userId });
    await expect(createExpense(contextA, { ...expenseInput, functionId: foreignFunction._id.toString() })).rejects.toMatchObject({ code: "VALIDATION_ERROR", fields: { functionId: expect.any(String) } });
  });

  it("calculates under, equal and over budget and never blocks an over-budget save", async () => {
    const weddingId = new Types.ObjectId();
    const context = makeContext(weddingId);
    await createWedding(weddingId, context, 1_000);
    expect(await getBudgetSummary(context)).toMatchObject({ remainingPaise: 1_000, exceededPaise: 0, usedPercent: 0 });
    await createExpense(context, { ...expenseInput, amountPaise: 1_000 });
    expect(await getBudgetSummary(context)).toMatchObject({ remainingPaise: 0, exceededPaise: 0, usedPercent: 100 });
    await createExpense(context, { ...expenseInput, amountPaise: 500 });
    expect(await getBudgetSummary(context)).toMatchObject({ remainingPaise: -500, exceededPaise: 500, usedPercent: 150 });
  });

  it("never reads, updates or deletes another wedding's expense and rejects viewer writes", async () => {
    const contextA = makeContext(new Types.ObjectId());
    const contextB = makeContext(new Types.ObjectId());
    await createWedding(new Types.ObjectId(contextA.weddingId), contextA);
    await createWedding(new Types.ObjectId(contextB.weddingId), contextB);
    const expense = await createExpense(contextA, expenseInput);
    const viewer = { ...contextA, role: "viewer" as const };
    await expect(updateExpense(viewer, expense.id, { description: "Denied" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deleteExpense(viewer, expense.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateExpense(contextB, expense.id, { description: "Denied" })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(deleteExpense(contextB, expense.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(updateExpense(contextB, "not-an-id", { description: "Denied" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await listExpenses(contextB)).length).toBe(0);
    expect((await listExpenses(contextA))[0]?.description).toBe("Deposit");
  });
});
