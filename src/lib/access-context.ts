import { AppError } from "./errors";

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
