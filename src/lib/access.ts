import { AppError } from "./errors";
import { auth } from "@/auth";
import { connectToDatabase } from "./db";
import { WeddingModel } from "@/modules/wedding/model";

export interface AccessContext {
  weddingId: string;
  userId?: string;
  role: "editor" | "viewer";
}

export function assertEditor(context: AccessContext): void {
  if (context.role !== "editor") {
    throw new AppError("FORBIDDEN", "Only wedding editors can make changes.");
  }
}

export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { id: user.id, name: user.name ?? null, email: user.email ?? null };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED", "Please log in to continue.");
  return user;
}

export async function getEditorContext(user?: CurrentUser): Promise<AccessContext | null> {
  const currentUser = user ?? await getCurrentUser();
  if (!currentUser) return null;
  await connectToDatabase();
  const wedding = await WeddingModel.findOne({ editorIds: currentUser.id }).select("_id").lean();
  if (!wedding) return null;
  return { weddingId: wedding._id.toString(), userId: currentUser.id, role: "editor" };
}
