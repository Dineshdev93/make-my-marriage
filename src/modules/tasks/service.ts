import { Types } from "mongoose";
import { assertEditor, type AccessContext } from "@/lib/access-context";
import { connectToDatabase } from "@/lib/db";
import { getTodayIST } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { FunctionModel } from "@/modules/functions/model";
import { TaskModel, type TaskDocument } from "./model";
import type { CreateTaskInput, UpdateTaskInput } from "./schema";
import { computeTaskStatus, type TaskStatus } from "./status";

export interface TaskRecord {
  id: string;
  weddingId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  functionId: string | null;
  status: TaskStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

type TaskSource = Omit<TaskDocument, "_id" | "weddingId" | "completedAt" | "functionId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  completedAt: Date | null;
  functionId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function serializeTask(task: TaskSource, todayIST: string): TaskRecord {
  return {
    id: task._id.toString(),
    weddingId: task.weddingId.toString(),
    title: task.title,
    dueDate: task.dueDate,
    completed: task.completed,
    completedAt: task.completedAt?.toISOString() ?? null,
    functionId: task.functionId?.toString() ?? null,
    status: computeTaskStatus(task, todayIST),
    createdBy: task.createdBy.toString(),
    updatedBy: task.updatedBy.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function validObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

function notFound(): AppError {
  return new AppError("NOT_FOUND", "Task not found.");
}

function editorActor(context: AccessContext): Types.ObjectId {
  assertEditor(context);
  if (!context.userId || !validObjectId(context.userId)) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  return new Types.ObjectId(context.userId);
}

function functionValidationError(): AppError {
  return new AppError("VALIDATION_ERROR", "Choose a function from this wedding.", { functionId: "Choose a function from this wedding." });
}

async function assertFunctionInWedding(weddingId: Types.ObjectId, functionId: string): Promise<void> {
  if (!validObjectId(functionId)) throw functionValidationError();
  const exists = await FunctionModel.exists({ _id: new Types.ObjectId(functionId), weddingId });
  if (!exists) throw functionValidationError();
}

export async function listTasks(context: AccessContext, todayIST = getTodayIST()): Promise<TaskRecord[]> {
  await connectToDatabase();
  const tasks = await TaskModel.find({ weddingId: new Types.ObjectId(context.weddingId) })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();
  return tasks.map((task) => serializeTask(task as TaskSource, todayIST));
}

export async function createTask(context: AccessContext, input: CreateTaskInput): Promise<TaskRecord> {
  const actorId = editorActor(context);
  await connectToDatabase();
  const weddingId = new Types.ObjectId(context.weddingId);
  if (input.functionId) await assertFunctionInWedding(weddingId, input.functionId);
  const completed = input.completed ?? false;
  const task = await TaskModel.create({
    ...input,
    completed,
    completedAt: completed ? new Date() : null,
    functionId: input.functionId ? new Types.ObjectId(input.functionId) : null,
    weddingId,
    createdBy: actorId,
    updatedBy: actorId,
  });
  return serializeTask(task as TaskSource, getTodayIST());
}

export async function updateTask(context: AccessContext, id: string, input: UpdateTaskInput): Promise<TaskRecord> {
  const actorId = editorActor(context);
  if (!validObjectId(id)) throw notFound();
  await connectToDatabase();
  const weddingId = new Types.ObjectId(context.weddingId);
  const existing = await TaskModel.findOne({ _id: new Types.ObjectId(id), weddingId }).lean();
  if (!existing) throw notFound();
  if (input.functionId) await assertFunctionInWedding(weddingId, input.functionId);

  const fields: Record<string, unknown> = { updatedBy: actorId };
  if (input.title !== undefined) fields.title = input.title;
  if (input.dueDate !== undefined) fields.dueDate = input.dueDate;
  if (input.functionId !== undefined) fields.functionId = input.functionId === null ? null : new Types.ObjectId(input.functionId);
  if (input.completed !== undefined && input.completed !== existing.completed) {
    fields.completed = input.completed;
    fields.completedAt = input.completed ? new Date() : null;
  }

  const task = await TaskModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id), weddingId },
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();
  if (!task) throw notFound();
  return serializeTask(task as TaskSource, getTodayIST());
}

export async function deleteTask(context: AccessContext, id: string): Promise<{ id: string }> {
  editorActor(context);
  if (!validObjectId(id)) throw notFound();
  await connectToDatabase();
  const task = await TaskModel.findOneAndDelete({ _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(context.weddingId) }).lean();
  if (!task) throw notFound();
  return { id: task._id.toString() };
}
