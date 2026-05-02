"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "@/types";
import { useBoardStore } from "@/store/boardStore";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function TaskCard({ task }: { task: Task }) {
  const updateTask = useBoardStore((s) => s.updateTask);
  const removeTask = useBoardStore((s) => s.removeTask);

  async function handleStatusChange(status: TaskStatus) {
    updateTask(task.id, { status }); // optimistic
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete() {
    removeTask(task.id); // optimistic
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
  }

  return (
    <div
      style={{
        background: "#0f172a",
        borderRadius: 8,
        padding: "12px 14px",
        border: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>{task.title}</span>
        <button
          onClick={handleDelete}
          aria-label="Delete task"
          style={{
            background: "none",
            border: "none",
            color: "#475569",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
            flexShrink: 0,
            padding: 2,
          }}
        >
          ×
        </button>
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{task.description}</p>
      )}

      <select
        value={task.status}
        onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
        style={{
          fontSize: 11,
          padding: "4px 6px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 4,
          color: "#94a3b8",
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
