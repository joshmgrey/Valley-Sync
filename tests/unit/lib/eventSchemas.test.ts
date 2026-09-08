import {
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskDeleteSchema,
  BoardJoinSchema,
} from "@/lib/socket/eventSchemas";

const UUID = "123e4567-e89b-12d3-a456-426614174000";

describe("socket event schemas", () => {
  describe("TaskCreateSchema", () => {
    it("accepts a minimal valid payload", () => {
      const result = TaskCreateSchema.safeParse({ boardId: UUID, title: "Ship it" });
      expect(result.success).toBe(true);
    });

    it("accepts optional fields", () => {
      const result = TaskCreateSchema.safeParse({
        boardId: UUID,
        title: "Ship it",
        description: "with detail",
        status: "in-progress",
        assigneeId: "user-1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a non-uuid boardId", () => {
      expect(TaskCreateSchema.safeParse({ boardId: "nope", title: "x" }).success).toBe(false);
    });

    it("rejects an empty title", () => {
      expect(TaskCreateSchema.safeParse({ boardId: UUID, title: "" }).success).toBe(false);
    });

    it("rejects a title over 200 characters", () => {
      expect(
        TaskCreateSchema.safeParse({ boardId: UUID, title: "a".repeat(201) }).success
      ).toBe(false);
    });

    it("rejects a description over 1000 characters", () => {
      expect(
        TaskCreateSchema.safeParse({ boardId: UUID, title: "x", description: "a".repeat(1001) })
          .success
      ).toBe(false);
    });

    it("rejects an unknown status", () => {
      expect(
        TaskCreateSchema.safeParse({ boardId: UUID, title: "x", status: "archived" }).success
      ).toBe(false);
    });
  });

  describe("TaskUpdateSchema", () => {
    it("accepts a partial change set", () => {
      const result = TaskUpdateSchema.safeParse({ taskId: UUID, changes: { status: "done" } });
      expect(result.success).toBe(true);
    });

    it("accepts an empty change set", () => {
      expect(TaskUpdateSchema.safeParse({ taskId: UUID, changes: {} }).success).toBe(true);
    });

    it("rejects a non-uuid taskId", () => {
      expect(TaskUpdateSchema.safeParse({ taskId: "nope", changes: {} }).success).toBe(false);
    });

    it("rejects a blank title in changes", () => {
      expect(
        TaskUpdateSchema.safeParse({ taskId: UUID, changes: { title: "" } }).success
      ).toBe(false);
    });

    it("rejects a missing changes object", () => {
      expect(TaskUpdateSchema.safeParse({ taskId: UUID }).success).toBe(false);
    });
  });

  describe("TaskDeleteSchema", () => {
    it("accepts a uuid taskId", () => {
      expect(TaskDeleteSchema.safeParse({ taskId: UUID }).success).toBe(true);
    });

    it("rejects a non-uuid taskId", () => {
      expect(TaskDeleteSchema.safeParse({ taskId: "1" }).success).toBe(false);
    });
  });

  describe("BoardJoinSchema", () => {
    it("accepts a uuid boardId", () => {
      expect(BoardJoinSchema.safeParse({ boardId: UUID }).success).toBe(true);
    });

    it("rejects a missing boardId", () => {
      expect(BoardJoinSchema.safeParse({}).success).toBe(false);
    });
  });
});
