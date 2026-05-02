"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";
import { useBoardStore } from "@/store/boardStore";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

function getSocket(): AppSocket {
  if (!socket) {
    socket = io({ path: "/api/socket" });
  }
  return socket;
}

export function useSocket(boardId: string): AppSocket {
  const addTask = useBoardStore((s) => s.addTask);
  const updateTask = useBoardStore((s) => s.updateTask);
  const removeTask = useBoardStore((s) => s.removeTask);

  useEffect(() => {
    const s = getSocket();

    s.emit("board:join", boardId);

    s.on("task:created", ({ task }) => addTask(task));
    s.on("task:updated", ({ taskId, changes }) => updateTask(taskId, changes));
    s.on("task:deleted", ({ taskId }) => removeTask(taskId));

    return () => {
      s.emit("board:leave", boardId);
      s.off("task:created");
      s.off("task:updated");
      s.off("task:deleted");
    };
  }, [boardId, addTask, updateTask, removeTask]);

  return getSocket();
}
