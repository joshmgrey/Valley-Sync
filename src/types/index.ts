export type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  name: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

// Socket event payloads
export interface TaskCreatedPayload {
  task: Task;
}

export interface TaskUpdatedPayload {
  taskId: string;
  changes: Partial<Omit<Task, "id" | "boardId" | "createdAt">>;
}

export interface TaskDeletedPayload {
  taskId: string;
}

export interface UserJoinedPayload {
  user: User;
  boardId: string;
}

export type ServerToClientEvents = {
  "task:created": (payload: TaskCreatedPayload) => void;
  "task:updated": (payload: TaskUpdatedPayload) => void;
  "task:deleted": (payload: TaskDeletedPayload) => void;
  "user:joined": (payload: UserJoinedPayload) => void;
  "user:left": (payload: { userId: string }) => void;
};

export type ClientToServerEvents = {
  "board:join": (boardId: string) => void;
  "board:leave": (boardId: string) => void;
  "task:create": (payload: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  "task:update": (payload: TaskUpdatedPayload) => void;
  "task:delete": (payload: TaskDeletedPayload) => void;
};
