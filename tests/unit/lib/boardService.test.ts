import { BoardService, BoardRepository } from "@/lib/board/boardService";
import type { Board } from "@/types";

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "board-1",
    name: "Test Board",
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
    it("trims whitespace from name", async () => {
      const board = makeBoard({ name: "Trimmed" });
      const repo = makeRepo({ create: jest.fn().mockResolvedValue(board) });
      const service = new BoardService(repo);
      await service.createBoard("  Trimmed  ");
      expect(repo.create).toHaveBeenCalledWith({ name: "Trimmed" });
    });

    it("throws when name is blank", async () => {
      const service = new BoardService(makeRepo());
      await expect(service.createBoard("   ")).rejects.toThrow("cannot be empty");
    });
  });

  describe("renameBoard", () => {
    it("returns the renamed board", async () => {
      const board = makeBoard({ name: "Renamed" });
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(board) });
      const service = new BoardService(repo);
      await expect(service.renameBoard("board-1", "Renamed")).resolves.toEqual(board);
    });

    it("throws when board is not found", async () => {
      const repo = makeRepo({ update: jest.fn().mockResolvedValue(null) });
      const service = new BoardService(repo);
      await expect(service.renameBoard("missing", "x")).rejects.toThrow("not found");
    });

    it("throws when name is blank", async () => {
      const service = new BoardService(makeRepo());
      await expect(service.renameBoard("board-1", "   ")).rejects.toThrow("cannot be empty");
    });
  });

  describe("deleteBoard", () => {
    it("resolves without error when deletion succeeds", async () => {
      const repo = makeRepo({ delete: jest.fn().mockResolvedValue(true) });
      const service = new BoardService(repo);
      await expect(service.deleteBoard("board-1")).resolves.toBeUndefined();
    });

    it("throws when board is not found", async () => {
      const repo = makeRepo({ delete: jest.fn().mockResolvedValue(false) });
      const service = new BoardService(repo);
      await expect(service.deleteBoard("missing")).rejects.toThrow("not found");
    });
  });
});
