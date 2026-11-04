import { z } from "zod";
import { isDateString } from "@/lib/dates";
import { MAX_AMOUNT_PAISE } from "@/lib/money";
import { EXPENSE_CATEGORIES } from "./constants";

const amountPaise = z.number().int().safe().min(100, "Amount must be at least ₹1.").max(MAX_AMOUNT_PAISE, "Amount cannot exceed ₹100 crore.");
const category = z.enum(EXPENSE_CATEGORIES);
const description = z.string().trim().min(1, "Enter a description.").max(500, "Description must be 500 characters or fewer.");
const expenseDate = z.string().refine(isDateString, "Enter a real expense date.");
const functionId = z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid function.").nullable().optional();

export const createExpenseSchema = z.object({ amountPaise, category, description, expenseDate, functionId }).strip();

export const updateExpenseSchema = z.object({
  amountPaise: amountPaise.optional(),
  category: category.optional(),
  description: description.optional(),
  expenseDate: expenseDate.optional(),
  functionId,
}).strip().refine((input) => Object.keys(input).length > 0, { message: "Provide at least one expense field to update." });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
