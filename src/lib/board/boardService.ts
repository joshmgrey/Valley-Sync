import type { Board, Task } from "@/types";

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

  async createBoard(name: string): Promise<Board> {
    if (!name.trim()) throw new Error("Board name cannot be empty");
    return this.repo.create({ name: name.trim() });
  }

  async renameBoard(id: string, name: string): Promise<Board> {
    if (!name.trim()) throw new Error("Board name cannot be empty");
    const board = await this.repo.update(id, { name: name.trim() });
    if (!board) throw new Error(`Board ${id} not found`);
    return board;
  }

  async deleteBoard(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new Error(`Board ${id} not found`);
  }
}
