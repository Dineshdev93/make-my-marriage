import type { ZodError } from "zod";
import { AppError } from "./errors";

export function validationAppError(error: ZodError): AppError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    fields[field] ??= issue.message;
  }
  return new AppError("VALIDATION_ERROR", "Please fix the highlighted fields.", fields);
}
