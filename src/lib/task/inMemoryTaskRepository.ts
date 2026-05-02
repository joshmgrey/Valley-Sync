import type { Task } from "@/types";
import type { TaskRepository } from "./taskService";
import type { TaskUpdatedPayload } from "@/types";

export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async findByBoard(boardId: string): Promise<Task[]> {
    return [...this.tasks.values()].filter((t) => t.boardId === boardId);
  }

  async create(task: Task): Promise<Task> {
    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, changes: TaskUpdatedPayload["changes"]): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    const updated: Task = { ...task, ...changes };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}
