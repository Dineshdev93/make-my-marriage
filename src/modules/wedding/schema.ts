import { z } from "zod";
import { isDateString } from "@/lib/dates";
import { MAX_AMOUNT_PAISE } from "@/lib/money";

const weddingFields = {
  name: z.string().trim().min(1, "Enter a wedding name.").max(100, "Wedding name must be 100 characters or fewer."),
  coupleNames: z.string().trim().min(1, "Enter the couple names.").max(150, "Couple names must be 150 characters or fewer."),
  weddingDate: z.string().refine(isDateString, "Enter a real wedding date."),
  totalBudgetPaise: z.number()
    .int("Budget must be a whole number of paise.")
    .min(100, "Budget must be at least ₹1.")
    .max(MAX_AMOUNT_PAISE, "Budget cannot exceed ₹100 crore."),
};

export const createWeddingSchema = z.object(weddingFields).strip();

export const updateWeddingSchema = z.object({
  name: weddingFields.name.optional(),
  coupleNames: weddingFields.coupleNames.optional(),
  weddingDate: weddingFields.weddingDate.optional(),
  totalBudgetPaise: weddingFields.totalBudgetPaise.optional(),
}).strip().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one wedding field to update.",
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;
