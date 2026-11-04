import { Types } from "mongoose";
import { assertEditor, type AccessContext } from "@/lib/access-context";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { MAX_AMOUNT_PAISE } from "@/lib/money";
import { FunctionModel } from "@/modules/functions/model";
import { getWedding } from "@/modules/wedding/service";
import { ExpenseModel, type ExpenseDocument } from "./model";
import type { CreateExpenseInput, UpdateExpenseInput } from "./schema";

export interface ExpenseRecord {
  id: string;
  weddingId: string;
  amountPaise: number;
  category: ExpenseDocument["category"];
  description: string;
  expenseDate: string;
  functionId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalBudgetPaise: number;
  totalExpensesPaise: number;
  remainingPaise: number;
  exceededPaise: number;
  usedPercent: number;
}

type ExpenseSource = Omit<ExpenseDocument, "_id" | "weddingId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt" | "functionId"> & {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  functionId: Types.ObjectId | null;
};

function serializeExpense(record: ExpenseSource): ExpenseRecord {
  return {
    id: record._id.toString(),
    weddingId: record.weddingId.toString(),
    amountPaise: record.amountPaise,
    category: record.category,
    description: record.description,
    expenseDate: record.expenseDate,
    functionId: record.functionId?.toString() ?? null,
    createdBy: record.createdBy.toString(),
    updatedBy: record.updatedBy.toString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function validObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

function notFound(): AppError {
  return new AppError("NOT_FOUND", "Expense not found.");
}

function editorActor(context: AccessContext): Types.ObjectId {
  assertEditor(context);
  if (!context.userId || !validObjectId(context.userId)) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  return new Types.ObjectId(context.userId);
}

function assertAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 100 || amount > MAX_AMOUNT_PAISE) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid whole-rupee expense amount.", { amountPaise: "Enter a valid whole-rupee expense amount." });
  }
}

async function assertFunctionInWedding(weddingId: Types.ObjectId, functionId: string): Promise<void> {
  if (!validObjectId(functionId)) throw functionValidationError();
  const exists = await FunctionModel.exists({ _id: new Types.ObjectId(functionId), weddingId });
  if (!exists) throw functionValidationError();
}

function functionValidationError(): AppError {
  return new AppError("VALIDATION_ERROR", "Choose a function from this wedding.", { functionId: "Choose a function from this wedding." });
}

export async function listExpenses(context: AccessContext): Promise<ExpenseRecord[]> {
  await connectToDatabase();
  const records = await ExpenseModel.find({ weddingId: new Types.ObjectId(context.weddingId) })
    .sort({ expenseDate: -1, createdAt: -1 })
    .lean();
  return records.map((record) => serializeExpense(record as ExpenseSource));
}

export async function getBudgetSummary(context: AccessContext): Promise<BudgetSummary> {
  await connectToDatabase();
  const wedding = await getWedding(context);
  const [result] = await ExpenseModel.aggregate<{ totalExpensesPaise: number }>([
    { $match: { weddingId: new Types.ObjectId(context.weddingId) } },
    { $group: { _id: null, totalExpensesPaise: { $sum: "$amountPaise" } } },
  ]);
  const totalExpensesPaise = result?.totalExpensesPaise ?? 0;
  if (!Number.isSafeInteger(totalExpensesPaise)) throw new AppError("INTERNAL_ERROR", "Expense total exceeds the supported amount.");
  const totalBudgetPaise = wedding.totalBudgetPaise;
  const remainingPaise = totalBudgetPaise - totalExpensesPaise;
  const exceededPaise = Math.max(0, totalExpensesPaise - totalBudgetPaise);
  const usedPercent = Number((BigInt(totalExpensesPaise) * BigInt(100) + BigInt(totalBudgetPaise) / BigInt(2)) / BigInt(totalBudgetPaise));
  return { totalBudgetPaise, totalExpensesPaise, remainingPaise, exceededPaise, usedPercent };
}

export async function createExpense(context: AccessContext, input: CreateExpenseInput): Promise<ExpenseRecord> {
  const actorId = editorActor(context);
  assertAmount(input.amountPaise);
  await connectToDatabase();
  const weddingId = new Types.ObjectId(context.weddingId);
  if (input.functionId) await assertFunctionInWedding(weddingId, input.functionId);
  const record = await ExpenseModel.create({
    ...input,
    functionId: input.functionId ? new Types.ObjectId(input.functionId) : null,
    weddingId,
    createdBy: actorId,
    updatedBy: actorId,
  });
  return serializeExpense(record as ExpenseSource);
}

export async function updateExpense(context: AccessContext, id: string, input: UpdateExpenseInput): Promise<ExpenseRecord> {
  const actorId = editorActor(context);
  if (!validObjectId(id)) throw notFound();
  if (input.amountPaise !== undefined) assertAmount(input.amountPaise);
  await connectToDatabase();
  const weddingId = new Types.ObjectId(context.weddingId);
  const existing = await ExpenseModel.exists({ _id: new Types.ObjectId(id), weddingId });
  if (!existing) throw notFound();
  if (input.functionId) await assertFunctionInWedding(weddingId, input.functionId);
  const fields: Record<string, unknown> = { updatedBy: actorId };
  if (input.amountPaise !== undefined) fields.amountPaise = input.amountPaise;
  if (input.category !== undefined) fields.category = input.category;
  if (input.description !== undefined) fields.description = input.description;
  if (input.expenseDate !== undefined) fields.expenseDate = input.expenseDate;
  if (input.functionId !== undefined) fields.functionId = input.functionId === null ? null : new Types.ObjectId(input.functionId);
  const record = await ExpenseModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id), weddingId },
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();
  if (!record) throw notFound();
  return serializeExpense(record as ExpenseSource);
}

export async function deleteExpense(context: AccessContext, id: string): Promise<{ id: string }> {
  editorActor(context);
  if (!validObjectId(id)) throw notFound();
  await connectToDatabase();
  const record = await ExpenseModel.findOneAndDelete({ _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(context.weddingId) }).lean();
  if (!record) throw notFound();
  return { id: record._id.toString() };
}
