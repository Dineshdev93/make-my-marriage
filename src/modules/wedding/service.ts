import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { assertEditor, type AccessContext } from "@/lib/access-context";
import { AppError } from "@/lib/errors";
import { WeddingModel, type WeddingDocument } from "./model";
import type { CreateWeddingInput, UpdateWeddingInput } from "./schema";

export interface WeddingRecord {
  id: string;
  name: string;
  coupleNames: string;
  weddingDate: string;
  totalBudgetPaise: number;
  editorIds: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

type WeddingSource = WeddingDocument | (Omit<WeddingDocument, "_id" | "editorIds" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  editorIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
});

function serializeWedding(wedding: WeddingSource): WeddingRecord {
  return {
    id: wedding._id.toString(),
    name: wedding.name,
    coupleNames: wedding.coupleNames,
    weddingDate: wedding.weddingDate,
    totalBudgetPaise: wedding.totalBudgetPaise,
    editorIds: wedding.editorIds.map((id) => id.toString()),
    createdBy: wedding.createdBy.toString(),
    updatedBy: wedding.updatedBy.toString(),
    createdAt: wedding.createdAt.toISOString(),
    updatedAt: wedding.updatedAt.toISOString(),
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function weddingExistsError(): AppError {
  return new AppError("WEDDING_EXISTS", "This account already belongs to a wedding.");
}

function notFoundError(): AppError {
  return new AppError("NOT_FOUND", "Wedding not found.");
}

export async function createWedding(userId: string, input: CreateWeddingInput): Promise<WeddingRecord> {
  await connectToDatabase();
  if (await WeddingModel.exists({ editorIds: userId })) throw weddingExistsError();

  try {
    const wedding = await WeddingModel.create({
      ...input,
      editorIds: [new Types.ObjectId(userId)],
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });
    return serializeWedding(wedding);
  } catch (error) {
    if (isDuplicateKeyError(error)) throw weddingExistsError();
    throw error;
  }
}

export async function getWedding(context: AccessContext): Promise<WeddingRecord> {
  await connectToDatabase();
  const wedding = await WeddingModel.findOne({ _id: context.weddingId }).lean();
  if (!wedding) throw notFoundError();
  return serializeWedding(wedding as WeddingSource);
}

export async function updateWedding(context: AccessContext, input: UpdateWeddingInput): Promise<WeddingRecord> {
  assertEditor(context);
  if (!context.userId) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");

  await connectToDatabase();
  const wedding = await WeddingModel.findOneAndUpdate(
    { _id: context.weddingId },
    { $set: { ...input, updatedBy: new Types.ObjectId(context.userId) } },
    { new: true, runValidators: true },
  ).lean();
  if (!wedding) throw notFoundError();
  return serializeWedding(wedding as WeddingSource);
}
