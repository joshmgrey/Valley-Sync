"use client";

import { useState } from "react";
import type { TaskStatus } from "@/types";
import { useSocket } from "@/hooks/useSocket";

interface Props {
  boardId: string;
  status: TaskStatus;
}

export function AddTaskForm({ boardId, status }: Props) {
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const socket = useSocket(boardId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    socket.emit("task:create", { boardId, title: title.trim(), status });
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "8px",
          background: "none",
          border: "1px dashed #334155",
          borderRadius: 6,
          color: "#475569",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        + Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Task title…"
        style={{
          padding: "8px 10px",
          background: "#0f172a",
          border: "1px solid #6366f1",
          borderRadius: 6,
          color: "#e2e8f0",
          fontSize: 13,
          outline: "none",
        }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="submit"
          disabled={!title.trim()}
          style={{
            flex: 1,
            padding: "7px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: title.trim() ? "pointer" : "not-allowed",
            opacity: title.trim() ? 1 : 0.5,
          }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: "7px 12px",
            background: "none",
            border: "1px solid #334155",
            borderRadius: 6,
            color: "#64748b",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
