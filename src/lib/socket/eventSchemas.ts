import { z } from "zod";

const taskStatus = z.enum(["todo", "in-progress", "done"]);
const uuid = z.string().uuid();

export const TaskCreateSchema = z.object({
  boardId: uuid,
  title: z.string().min(1, "Title cannot be empty").max(200, "Title cannot exceed 200 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional(),
  status: taskStatus.optional(),
  assigneeId: z.string().optional(),
});

export const TaskUpdateSchema = z.object({
  taskId: uuid,
  changes: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: taskStatus.optional(),
    assigneeId: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
});

export const TaskDeleteSchema = z.object({
  taskId: uuid,
});

export const BoardJoinSchema = z.object({
  boardId: uuid,
});
