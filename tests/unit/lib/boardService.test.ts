import { BoardService, BoardRepository } from "@/lib/board/boardService";
import type { Board } from "@/types";

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    name: "Test Board",
    userId: "user-1",
    tasks: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRepo(overrides: Partial<BoardRepository> = {}): BoardRepository {
  return {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

describe("BoardService", () => {
  describe("getBoard", () => {
    it("returns board when found", async () => {
      const board = makeBoard();
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(board) });
      const service = new BoardService(repo);
      await expect(service.getBoard("board-1")).resolves.toEqual(board);
    });

    it("throws when board is not found", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new BoardService(repo);
      await expect(service.getBoard("missing")).rejects.toThrow("not found");
    });
  });

  describe("listBoards", () => {
    it("returns all boards", async () => {
      const boards = [makeBoard(), makeBoard({ id: "board-2" })];
      const repo = makeRepo({ findAll: jest.fn().mockResolvedValue(boards) });
      const service = new BoardService(repo);
      await expect(service.listBoards()).resolves.toEqual(boards);
    });
  });

  describe("createBoard", () => {
    it("trims whitespace and stores userId", async () => {
      const board = makeBoard({ name: "Trimmed" });
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(board) });
      const service = new BoardService(repo);
      await service.createBoard("  Trimmed  ", "user-1");
      expect(repo.create).toHaveBeenCalledWith({ name: "Trimmed", userId: "user-1" });
    });

    it("throws when name is blank", async () => {
      const service = new BoardService(makeRepo());
      await expect(service.createBoard("   ", "user-1")).rejects.toThrow("cannot be empty");
    });

    it("throws when name exceeds 100 characters", async () => {
      const service = new BoardService(makeRepo());
      await expect(service.createBoard("a".repeat(101), "user-1")).rejects.toThrow("cannot exceed");
    });
  });

  describe("renameBoard", () => {
    it("returns the renamed board", async () => {
      const board = makeBoard({ name: "Renamed" });
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(makeBoard()),
        update: jest.fn().mockResolvedValue(board),
      });
      const service = new BoardService(repo);
      await expect(service.renameBoard("board-1", "Renamed", "user-1")).resolves.toEqual(board);
    });

    it("throws when board is not found", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new BoardService(repo);
      await expect(service.renameBoard("missing", "x", "user-1")).rejects.toThrow("not found");
    });

    it("throws when name is blank", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(makeBoard()) });
      const service = new BoardService(repo);
      await expect(service.renameBoard("board-1", "   ", "user-1")).rejects.toThrow("cannot be empty");
    });

    it("throws Forbidden when user does not own the board", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(makeBoard({ userId: "other-user" })) });
      const service = new BoardService(repo);
      await expect(service.renameBoard("board-1", "New", "user-1")).rejects.toThrow("Forbidden");
    });
  });

  describe("deleteBoard", () => {
    it("resolves without error when deletion succeeds", async () => {
      const repo = makeRepo({
        findById: jest.fn().mockResolvedValue(makeBoard()),
        delete: jest.fn().mockResolvedValue(true),
      });
      const service = new BoardService(repo);
      await expect(service.deleteBoard("board-1", "user-1")).resolves.toBeUndefined();
    });

    it("throws when board is not found", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
      const service = new BoardService(repo);
      await expect(service.deleteBoard("missing", "user-1")).rejects.toThrow("not found");
    });

    it("throws Forbidden when user does not own the board", async () => {
      const repo = makeRepo({ findById: jest.fn().mockResolvedValue(makeBoard({ userId: "other-user" })) });
      const service = new BoardService(repo);
      await expect(service.deleteBoard("board-1", "user-1")).rejects.toThrow("Forbidden");
    });
  });
});
