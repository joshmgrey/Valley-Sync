import { TaskService, TaskRepository } from "@/lib/task/taskService";
import type { Task } from "@/types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    boardId: "board-1",
    title: "Test task",
    status: "todo",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRepo(overrides: Partial<TaskRepository> = {}): TaskRepository {
  return {
    findById: jest.fn(),
    findByBoard: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

describe("TaskService", () => {
  describe("getTask", () => {
    it("returns task when found", async () => {
      const task = makeTask();
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(task) });
      const service = new TaskService(repo);
      await expect(service.getTask("task-1")).resolves.toEqual(task);
    });

    it("throws when task is not found", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new TaskService(repo);
      await expect(service.getTask("missing")).rejects.toThrow("not found");
    });
  });

  describe("getTasksForBoard", () => {
    it("returns all tasks for a board", async () => {
      const tasks = [makeTask(), makeTask({ id: "task-2" })];
      const repo = makeRepo({ findByBoard: jest.fn().mockResolvedValue(tasks) });
      const service = new TaskService(repo);
      await expect(service.getTasksForBoard("board-1")).resolves.toEqual(tasks);
    });
  });

  describe("createTask", () => {
    it("creates a task with the given title and defaults to 'todo' status", async () => {
      const task = makeTask();
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(task) });
      const service = new TaskService(repo);

      const result = await service.createTask("board-1", "Test task");

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ boardId: "board-1", title: "Test task", status: "todo" })
      );
      expect(result).toEqual(task);
    });

    it("throws when title is empty", async () => {
      const service = new TaskService(makeRepo());
      await expect(service.createTask("board-1", "   ")).rejects.toThrow("cannot be empty");
    });

    it("throws when title exceeds 200 characters", async () => {
      const service = new TaskService(makeRepo());
      await expect(service.createTask("board-1", "a".repeat(201))).rejects.toThrow("cannot exceed");
    });

    it("throws when description exceeds 1000 characters", async () => {
      const service = new TaskService(makeRepo());
      await expect(
        service.createTask("board-1", "Title", { description: "a".repeat(1001) })
      ).rejects.toThrow("cannot exceed");
    });
  });

  describe("updateTask", () => {
    it("returns the updated task", async () => {
      const updated = makeTask({ title: "Updated" });
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(updated) });
      const service = new TaskService(repo);
      await expect(service.updateTask("task-1", { title: "Updated" })).resolves.toEqual(updated);
    });

    it("throws when task is not found", async () => {
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(null) });
      const service = new TaskService(repo);
      await expect(service.updateTask("missing", { title: "x" })).rejects.toThrow("not found");
    });

    it("throws when updated title is blank", async () => {
      const service = new TaskService(makeRepo());
      await expect(service.updateTask("task-1", { title: "   " })).rejects.toThrow("cannot be empty");
    });

    it("throws when updated title exceeds 200 characters", async () => {
      const service = new TaskService(makeRepo());
      await expect(service.updateTask("task-1", { title: "a".repeat(201) })).rejects.toThrow("cannot exceed");
    });

    it("throws when updated description exceeds 1000 characters", async () => {
      const service = new TaskService(makeRepo());
      await expect(
        service.updateTask("task-1", { description: "a".repeat(1001) })
      ).rejects.toThrow("cannot exceed");
    });
  });

  describe("deleteTask", () => {
    it("resolves without error when deletion succeeds", async () => {
      const repo = makeRepo({ delete: jest.fn().mockResolvedValue(true) });
      const service = new TaskService(repo);
      await expect(service.deleteTask("task-1")).resolves.toBeUndefined();
    });

    it("throws when task is not found", async () => {
      const repo = makeRepo({ delete: jest.fn().mockResolvedValue(false) });
      const service = new TaskService(repo);
      await expect(service.deleteTask("missing")).rejects.toThrow("not found");
    });
  });
});
