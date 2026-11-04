import { model, models, Schema, Types } from "mongoose";
import { isDateString } from "@/lib/dates";
import { MAX_AMOUNT_PAISE } from "@/lib/money";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "./constants";

export interface ExpenseDocument {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  amountPaise: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  functionId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<ExpenseDocument>({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  amountPaise: {
    type: Number,
    required: true,
    min: 100,
    max: MAX_AMOUNT_PAISE,
    validate: Number.isSafeInteger,
  },
  category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
  description: { type: String, required: true, trim: true, minlength: 1, maxlength: 500 },
  expenseDate: {
    type: String,
    required: true,
    validate: { validator: isDateString, message: "Expense date must be a real date in YYYY-MM-DD format." },
  },
  functionId: { type: Schema.Types.ObjectId, ref: "Function", default: null },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { timestamps: true, collection: "expenses" });

expenseSchema.index({ weddingId: 1, expenseDate: 1 });
expenseSchema.index({ weddingId: 1, functionId: 1 });

export const ExpenseModel = models.Expense ?? model<ExpenseDocument>("Expense", expenseSchema);
