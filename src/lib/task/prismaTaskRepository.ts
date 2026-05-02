import { PrismaClient, TaskStatus as PrismaTaskStatus } from "@prisma/client";
import type { Task, TaskStatus, TaskUpdatedPayload } from "@/types";
import type { TaskRepository } from "./taskService";

function toAppStatus(s: PrismaTaskStatus): TaskStatus {
  const map: Record<PrismaTaskStatus, TaskStatus> = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    DONE: "done",
  };
  return map[s];
}

function toPrismaStatus(s: TaskStatus): PrismaTaskStatus {
  const map: Record<TaskStatus, PrismaTaskStatus> = {
    todo: "TODO",
    "in-progress": "IN_PROGRESS",
    done: "DONE",
  };
  return map[s];
}

function toTask(p: {
  id: string;
  boardId: string;
  title: string;
  description: string | null;
  status: PrismaTaskStatus;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Task {
  return {
    id: p.id,
    boardId: p.boardId,
    title: p.title,
    description: p.description ?? undefined,
    status: toAppStatus(p.status),
    assigneeId: p.assigneeId ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Task | null> {
    const row = await this.db.task.findUnique({ where: { id } });
    return row ? toTask(row) : null;
  }

  async findByBoard(boardId: string): Promise<Task[]> {
    const rows = await this.db.task.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
  }

  async create(task: Task): Promise<Task> {
    const row = await this.db.task.create({
      data: {
        id: task.id,
        boardId: task.boardId,
        title: task.title,
        description: task.description,
        status: toPrismaStatus(task.status),
        assigneeId: task.assigneeId,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      },
    });
    return toTask(row);
  }

  async update(id: string, changes: TaskUpdatedPayload["changes"]): Promise<Task | null> {
    try {
      const row = await this.db.task.update({
        where: { id },
        data: {
          ...(changes.title !== undefined && { title: changes.title }),
          ...(changes.description !== undefined && { description: changes.description }),
          ...(changes.status !== undefined && { status: toPrismaStatus(changes.status) }),
          ...(changes.assigneeId !== undefined && { assigneeId: changes.assigneeId }),
          ...(changes.updatedAt !== undefined && { updatedAt: new Date(changes.updatedAt) }),
        },
      });
      return toTask(row);
    } catch (e: unknown) {
      // P2025 = record not found
      if ((e as { code?: string }).code === "P2025") return null;
      throw e;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.task.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2025") return false;
      throw e;
    }
  }
}
