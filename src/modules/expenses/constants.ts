export const EXPENSE_CATEGORIES = [
  "Venue",
  "Catering",
  "Decoration",
  "Photography",
  "Clothing and Jewellery",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
