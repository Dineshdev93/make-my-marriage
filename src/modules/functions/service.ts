import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { assertEditor, type AccessContext } from "@/lib/access-context";
import { AppError } from "@/lib/errors";
import { ExpenseModel } from "@/modules/expenses/model";
import { TaskModel } from "@/modules/tasks/model";
import { FunctionModel, type FunctionDocument } from "./model";
import type { CreateFunctionInput, UpdateFunctionInput } from "./schema";

export interface FunctionRecord {
  id: string;
  weddingId: string;
  name: string;
  date: string;
  venue?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface FunctionSource extends Omit<FunctionDocument, "_id" | "weddingId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"> {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

function serializeFunction(record: FunctionSource): FunctionRecord {
  return {
    id: record._id.toString(),
    weddingId: record.weddingId.toString(),
    name: record.name,
    date: record.date,
    ...(record.venue ? { venue: record.venue } : {}),
    createdBy: record.createdBy.toString(),
    updatedBy: record.updatedBy.toString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

function assertEditorActor(context: AccessContext): Types.ObjectId {
  assertEditor(context);
  if (!context.userId) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  return new Types.ObjectId(context.userId);
}

function notFound(): AppError {
  return new AppError("NOT_FOUND", "Function not found.");
}

export async function listFunctions(context: AccessContext): Promise<FunctionRecord[]> {
  await connectToDatabase();
  const records = await FunctionModel.find({ weddingId: new Types.ObjectId(context.weddingId) })
    .sort({ date: 1, name: 1 })
    .lean();
  return records.map((record) => serializeFunction(record as FunctionSource));
}

export async function getFunction(context: AccessContext, id: string): Promise<FunctionRecord> {
  await connectToDatabase();
  if (!isValidObjectId(id)) throw notFound();
  const record = await FunctionModel.findOne({ _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(context.weddingId) }).lean();
  if (!record) throw notFound();
  return serializeFunction(record as FunctionSource);
}

export async function createFunction(context: AccessContext, input: CreateFunctionInput): Promise<FunctionRecord> {
  const actorId = assertEditorActor(context);
  await connectToDatabase();
  const record = await FunctionModel.create({
    ...input,
    ...(input.venue ? { venue: input.venue } : { venue: undefined }),
    weddingId: new Types.ObjectId(context.weddingId),
    createdBy: actorId,
    updatedBy: actorId,
  });
  return serializeFunction(record);
}

export async function updateFunction(context: AccessContext, id: string, input: UpdateFunctionInput): Promise<FunctionRecord> {
  const actorId = assertEditorActor(context);
  if (!isValidObjectId(id)) throw notFound();
  await connectToDatabase();

  const fields: { name?: string; date?: string; venue?: string } = {};
  if (input.name !== undefined) fields.name = input.name;
  if (input.date !== undefined) fields.date = input.date;
  if (input.venue !== undefined && input.venue !== "") fields.venue = input.venue;
  const update = {
    $set: { ...fields, updatedBy: actorId },
    ...(input.venue === "" ? { $unset: { venue: 1 } } : {}),
  };

  const record = await FunctionModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(context.weddingId) },
    update,
    { new: true, runValidators: true },
  ).lean();
  if (!record) throw notFound();
  return serializeFunction(record as FunctionSource);
}

export async function deleteFunction(context: AccessContext, id: string): Promise<{ id: string }> {
  assertEditor(context);
  if (!context.userId) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  if (!isValidObjectId(id)) throw notFound();
  await connectToDatabase();

  const functionId = new Types.ObjectId(id);
  const weddingId = new Types.ObjectId(context.weddingId);
  const session = await mongoose.startSession();
  let deletedId: string | null = null;
  try {
    await session.withTransaction(async () => {
      const existing = await FunctionModel.findOne({ _id: functionId, weddingId }).session(session).lean();
      if (!existing) throw notFound();

      await ExpenseModel.updateMany(
        { weddingId, functionId },
        { $set: { functionId: null } },
        { session },
      );
      await TaskModel.updateMany(
        { weddingId, functionId },
        { $set: { functionId: null } },
        { session },
      );
      const deleted = await FunctionModel.findOneAndDelete({ _id: functionId, weddingId }, { session }).lean();
      if (!deleted) throw notFound();
      deletedId = deleted._id.toString();
    });
  } finally {
    await session.endSession();
  }
  if (!deletedId) throw notFound();
  return { id: deletedId };
}
