import { PrismaClient, TaskStatus as PrismaTaskStatus } from "@prisma/client";
import type { Board, Task, TaskStatus } from "@/types";
import type { BoardRepository } from "./boardService";

function toAppStatus(s: PrismaTaskStatus): TaskStatus {
  const map: Record<PrismaTaskStatus, TaskStatus> = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    DONE: "done",
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

function toBoard(p: {
  id: string;
  name: string;
  tasks: Parameters<typeof toTask>[0][];
  createdAt: Date;
  updatedAt: Date;
}): Board {
  return {
    id: p.id,
    name: p.name,
    tasks: p.tasks.map(toTask),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const withTasks = { tasks: { orderBy: { createdAt: "asc" as const } } };

export class PrismaBoardRepository implements BoardRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Board | null> {
    const row = await this.db.board.findUnique({ where: { id }, include: withTasks });
    return row ? toBoard(row) : null;
  }

  async findAll(): Promise<Board[]> {
    const rows = await this.db.board.findMany({
      include: withTasks,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toBoard);
  }

  async create(data: Omit<Board, "id" | "tasks" | "createdAt" | "updatedAt">): Promise<Board> {
    const row = await this.db.board.create({
      data: { name: data.name },
      include: withTasks,
    });
    return toBoard(row);
  }

  async update(id: string, data: Partial<Pick<Board, "name">>): Promise<Board | null> {
    try {
      const row = await this.db.board.update({
        where: { id },
        data,
        include: withTasks,
      });
      return toBoard(row);
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2025") return null;
      throw e;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.db.board.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2025") return false;
      throw e;
    }
  }
}
