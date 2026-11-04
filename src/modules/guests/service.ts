import { Types } from "mongoose";
import { assertEditor, type AccessContext } from "@/lib/access-context";
import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { GuestModel, type GuestDocument } from "./model";
import type { CreateGuestInput, UpdateGuestInput } from "./schema";
import type { InvitationStatus } from "./constants";

export interface GuestRecord {
  id: string;
  weddingId: string;
  name: string;
  phone: string;
  group: string;
  invitationStatus: InvitationStatus;
  functionIds: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestSummary {
  total: number;
  notInvited: number;
  invited: number;
  confirmed: number;
}

type GuestSource = Omit<GuestDocument, "_id" | "weddingId" | "functionIds" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"> & {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  functionIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function serializeGuest(guest: GuestSource): GuestRecord {
  return {
    id: guest._id.toString(),
    weddingId: guest.weddingId.toString(),
    name: guest.name,
    phone: guest.phone,
    group: guest.group,
    invitationStatus: guest.invitationStatus,
    functionIds: guest.functionIds.map((id) => id.toString()),
    createdBy: guest.createdBy.toString(),
    updatedBy: guest.updatedBy.toString(),
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
  };
}

function validObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}

function notFound(): AppError {
  return new AppError("NOT_FOUND", "Guest not found.");
}

function editorActor(context: AccessContext): Types.ObjectId {
  assertEditor(context);
  if (!context.userId || !validObjectId(context.userId)) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  return new Types.ObjectId(context.userId);
}

export async function listGuests(context: AccessContext): Promise<GuestRecord[]> {
  await connectToDatabase();
  const guests = await GuestModel.find({ weddingId: new Types.ObjectId(context.weddingId) })
    .collation({ locale: "en", strength: 2 })
    .sort({ name: 1, _id: 1 })
    .lean();
  return guests.map((guest) => serializeGuest(guest as GuestSource));
}

export async function getGuestSummary(context: AccessContext): Promise<GuestSummary> {
  await connectToDatabase();
  const [summary] = await GuestModel.aggregate<GuestSummary & { _id: null }>([
    { $match: { weddingId: new Types.ObjectId(context.weddingId) } },
    { $group: {
      _id: null,
      total: { $sum: 1 },
      notInvited: { $sum: { $cond: [{ $eq: ["$invitationStatus", "Not invited"] }, 1, 0] } },
      invited: { $sum: { $cond: [{ $eq: ["$invitationStatus", "Invited"] }, 1, 0] } },
      confirmed: { $sum: { $cond: [{ $eq: ["$invitationStatus", "Confirmed"] }, 1, 0] } },
    } },
  ]);
  return summary
    ? { total: summary.total, notInvited: summary.notInvited, invited: summary.invited, confirmed: summary.confirmed }
    : { total: 0, notInvited: 0, invited: 0, confirmed: 0 };
}

export async function createGuest(context: AccessContext, input: CreateGuestInput): Promise<GuestRecord> {
  const actorId = editorActor(context);
  await connectToDatabase();
  const guest = await GuestModel.create({
    ...input,
    phone: input.phone.replace(/[\s-]/g, ""),
    invitationStatus: input.invitationStatus ?? "Not invited",
    functionIds: [],
    weddingId: new Types.ObjectId(context.weddingId),
    createdBy: actorId,
    updatedBy: actorId,
  });
  return serializeGuest(guest as GuestSource);
}

export async function updateGuest(context: AccessContext, id: string, input: UpdateGuestInput): Promise<GuestRecord> {
  const actorId = editorActor(context);
  if (!validObjectId(id)) throw notFound();
  await connectToDatabase();
  const fields: Record<string, unknown> = { updatedBy: actorId };
  if (input.name !== undefined) fields.name = input.name;
  if (input.phone !== undefined) fields.phone = input.phone.replace(/[\s-]/g, "");
  if (input.group !== undefined) fields.group = input.group;
  if (input.invitationStatus !== undefined) fields.invitationStatus = input.invitationStatus;
  const guest = await GuestModel.findOneAndUpdate(
    { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(context.weddingId) },
    { $set: fields },
    { new: true, runValidators: true },
  ).lean();
  if (!guest) throw notFound();
  return serializeGuest(guest as GuestSource);
}

export async function deleteGuest(context: AccessContext, id: string): Promise<{ id: string }> {
  editorActor(context);
  if (!validObjectId(id)) throw notFound();
  await connectToDatabase();
  const guest = await GuestModel.findOneAndDelete({ _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(context.weddingId) }).lean();
  if (!guest) throw notFound();
  return { id: guest._id.toString() };
}
