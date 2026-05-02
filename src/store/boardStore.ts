import { create } from "zustand";
import type { Board, Task, TaskStatus } from "@/types";

interface BoardState {
  boards: Board[];
  activeBoard: Board | null;

  setBoards: (boards: Board[]) => void;
  setActiveBoard: (board: Board) => void;

  // Optimistic socket handlers
  addTask: (task: Task) => void;
  updateTask: (taskId: string, changes: Partial<Omit<Task, "id" | "boardId" | "createdAt">>) => void;
  removeTask: (taskId: string) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  activeBoard: null,

  setBoards: (boards) => set({ boards }),

  setActiveBoard: (board) => set({ activeBoard: board }),

  addTask: (task) =>
    set((state) => {
      if (!state.activeBoard || state.activeBoard.id !== task.boardId) return state;
      return {
        activeBoard: {
          ...state.activeBoard,
          tasks: [...state.activeBoard.tasks, task],
        },
      };
    }),

  updateTask: (taskId, changes) =>
    set((state) => {
      if (!state.activeBoard) return state;
      return {
        activeBoard: {
          ...state.activeBoard,
          tasks: state.activeBoard.tasks.map((t) =>
            t.id === taskId ? { ...t, ...changes } : t
          ),
        },
      };
    }),

  removeTask: (taskId) =>
    set((state) => {
      if (!state.activeBoard) return state;
      return {
        activeBoard: {
          ...state.activeBoard,
          tasks: state.activeBoard.tasks.filter((t) => t.id !== taskId),
        },
      };
    }),
}));

// Selector: tasks grouped by status
export function selectColumns(board: Board): Record<TaskStatus, Task[]> {
  const columns: Record<TaskStatus, Task[]> = {
    "todo": [],
    "in-progress": [],
    "done": [],
  };
  for (const task of board.tasks) {
    columns[task.status].push(task);
  }
  return columns;
}
