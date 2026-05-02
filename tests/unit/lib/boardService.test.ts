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
});
