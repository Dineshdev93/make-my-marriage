import { z } from "zod";
import { isDateString } from "@/lib/dates";

const functionFields = {
  name: z.string().trim().min(1, "Enter a function name.").max(100, "Function name must be 100 characters or fewer."),
  date: z.string().refine(isDateString, "Enter a real function date."),
  venue: z.string().trim().max(200, "Venue must be 200 characters or fewer.").optional(),
};

export const createFunctionSchema = z.object(functionFields).strip();

export const updateFunctionSchema = z.object({
  name: functionFields.name.optional(),
  date: functionFields.date.optional(),
  venue: functionFields.venue,
}).strip().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one function field to update.",
});

export type CreateFunctionInput = z.infer<typeof createFunctionSchema>;
export type UpdateFunctionInput = z.infer<typeof updateFunctionSchema>;
