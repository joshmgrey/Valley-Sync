import { randomUUID } from "crypto";
import type { Task, TaskStatus, TaskUpdatedPayload } from "@/types";

const TITLE_MAX = 200;
const DESC_MAX = 1000;

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByBoard(boardId: string): Promise<Task[]>;
  create(task: Task): Promise<Task>;
  update(id: string, changes: TaskUpdatedPayload["changes"]): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
}

export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  async getTask(id: string): Promise<Task> {
    const task = await this.repo.findById(id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  }

  async getTasksForBoard(boardId: string): Promise<Task[]> {
    return this.repo.findByBoard(boardId);
  }

  async createTask(
    boardId: string,
    title: string,
    options: { description?: string; assigneeId?: string; status?: TaskStatus } = {}
  ): Promise<Task> {
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Task title cannot be empty");
    if (trimmed.length > TITLE_MAX) throw new Error(`Task title cannot exceed ${TITLE_MAX} characters`);
    if (options.description && options.description.length > DESC_MAX) {
      throw new Error(`Task description cannot exceed ${DESC_MAX} characters`);
    }
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      boardId,
      title: trimmed,
      description: options.description,
      assigneeId: options.assigneeId,
      status: options.status ?? "todo",
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.create(task);
  }

  async updateTask(id: string, changes: TaskUpdatedPayload["changes"]): Promise<Task> {
    if (changes.title !== undefined) {
      const trimmed = changes.title.trim();
      if (!trimmed) throw new Error("Task title cannot be empty");
      if (trimmed.length > TITLE_MAX) throw new Error(`Task title cannot exceed ${TITLE_MAX} characters`);
      changes = { ...changes, title: trimmed };
    }
    if (changes.description && changes.description.length > DESC_MAX) {
      throw new Error(`Task description cannot exceed ${DESC_MAX} characters`);
    }
    const updated = await this.repo.update(id, {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new Error(`Task ${id} not found`);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Task ${id} not found`);
  }
}
