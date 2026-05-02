import type { Board, Task } from "@/types";

const NAME_MAX = 100;

export interface BoardRepository {
  findById(id: string): Promise<Board | null>;
  findAll(): Promise<Board[]>;
  create(data: Omit<Board, "id" | "tasks" | "createdAt" | "updatedAt">): Promise<Board>;
  update(id: string, data: Partial<Pick<Board, "name">>): Promise<Board | null>;
  delete(id: string): Promise<boolean>;
}

export class BoardService {
  constructor(private readonly repo: BoardRepository) {}

  async getBoard(id: string): Promise<Board> {
    const board = await this.repo.findById(id);
    if (!board) throw new Error(`Board ${id} not found`);
    return board;
  }

  async listBoards(): Promise<Board[]> {
    return this.repo.findAll();
  }

  async createBoard(name: string, userId: string): Promise<Board> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Board name cannot be empty");
    if (trimmed.length > NAME_MAX) throw new Error(`Board name cannot exceed ${NAME_MAX} characters`);
    return this.repo.create({ name: trimmed, userId });
  }

  async renameBoard(id: string, name: string, userId: string): Promise<Board> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Board name cannot be empty");
    if (trimmed.length > NAME_MAX) throw new Error(`Board name cannot exceed ${NAME_MAX} characters`);
    const board = await this.repo.findById(id);
    if (!board) throw new Error(`Board ${id} not found`);
    if (board.userId && board.userId !== userId) throw new Error("Forbidden");
    const updated = await this.repo.update(id, { name: trimmed });
    return updated!;
  }

  async deleteBoard(id: string, userId: string): Promise<void> {
    const board = await this.repo.findById(id);
    if (!board) throw new Error(`Board ${id} not found`);
    if (board.userId && board.userId !== userId) throw new Error("Forbidden");
    await this.repo.delete(id);
  }
}
