import { z } from "zod";
import { isDateString } from "@/lib/dates";

const taskFields = {
  title: z.string().trim().min(1, "Enter a task title.").max(200, "Task title must be 200 characters or fewer."),
  dueDate: z.string().refine(isDateString, "Enter a real due date."),
  functionId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid function.").nullable().optional(),
  completed: z.boolean().optional(),
};

export const createTaskSchema = z.object({
  ...taskFields,
  completed: z.boolean().default(false),
}).strip();

export const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  dueDate: taskFields.dueDate.optional(),
  functionId: taskFields.functionId,
  completed: taskFields.completed,
}).strip().refine((input) => Object.keys(input).length > 0, { message: "Provide at least one task field to update." });

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
