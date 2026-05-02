import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { decode } from "next-auth/jwt";
import type { ZodSchema } from "zod";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";
import { TaskService } from "@/lib/task/taskService";
import {
  TaskCreateSchema,
  TaskUpdateSchema,
  TaskDeleteSchema,
} from "./eventSchemas";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents>;

let io: IOServer | null = null;

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

// Validates payload against schema and calls handler, or logs and discards on failure.
function validated<T>(
  schema: ZodSchema<T>,
  handler: (data: T) => Promise<void>
): (payload: unknown) => void {
  return (payload) => {
    const result = schema.safeParse(payload);
    if (!result.success) {
      console.warn("[socket] invalid payload:", result.error.flatten());
      return;
    }
    handler(result.data).catch((err) =>
      console.error("[socket] handler error:", err)
    );
  };
}

export function initSocketServer(httpServer: HTTPServer, taskService: TaskService): IOServer {
  if (io) return io;

  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" },
  });

  // Verify Auth.js session on every connection attempt
  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookies = parseCookies(cookieHeader);
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
    const sessionToken = cookies[cookieName];

    if (!sessionToken) return next(new Error("Unauthorized"));

    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.AUTH_SECRET!,
        salt: cookieName,
      });
      if (!token?.sub) return next(new Error("Unauthorized"));
      socket.data.userId = token.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("board:join", (boardId) => {
      if (typeof boardId !== "string" || !boardId) return;
      socket.join(`board:${boardId}`);
    });

    socket.on("board:leave", (boardId) => {
      if (typeof boardId !== "string" || !boardId) return;
      socket.leave(`board:${boardId}`);
    });

    socket.on(
      "task:create",
      validated(TaskCreateSchema, async (payload) => {
        const task = await taskService.createTask(payload.boardId, payload.title, {
          description: payload.description,
          assigneeId: payload.assigneeId,
          status: payload.status,
        });
        io!.to(`board:${task.boardId}`).emit("task:created", { task });
      })
    );

    socket.on(
      "task:update",
      validated(TaskUpdateSchema, async ({ taskId, changes }) => {
        const task = await taskService.updateTask(taskId, changes);
        io!.to(`board:${task.boardId}`).emit("task:updated", { taskId, changes });
      })
    );

    socket.on(
      "task:delete",
      validated(TaskDeleteSchema, async ({ taskId }) => {
        await taskService.deleteTask(taskId);
        socket.broadcast.emit("task:deleted", { taskId });
      })
    );
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.io server not initialized");
  return io;
}
