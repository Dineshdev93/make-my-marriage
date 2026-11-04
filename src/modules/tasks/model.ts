import { model, models, Schema, Types } from "mongoose";
import { isDateString } from "@/lib/dates";

export interface TaskDocument {
  _id: Types.ObjectId;
  weddingId: Types.ObjectId;
  title: string;
  dueDate: string;
  completed: boolean;
  completedAt: Date | null;
  functionId: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<TaskDocument>({
  weddingId: { type: Schema.Types.ObjectId, required: true, ref: "Wedding" },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
  dueDate: {
    type: String,
    required: true,
    validate: { validator: isDateString, message: "Due date must be a real date in YYYY-MM-DD format." },
  },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  functionId: { type: Schema.Types.ObjectId, ref: "Function", default: null },
  createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
}, { timestamps: true, collection: "tasks" });

taskSchema.index({ weddingId: 1, dueDate: 1 });
taskSchema.index({ weddingId: 1, functionId: 1 });

export const TaskModel = models.Task ?? model<TaskDocument>("Task", taskSchema);
