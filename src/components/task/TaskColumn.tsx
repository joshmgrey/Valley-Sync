import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";
import { AddTaskForm } from "./AddTaskForm";

const STATUS_COLOR: Record<TaskStatus, string> = {
  "todo": "#6366f1",
  "in-progress": "#f59e0b",
  "done": "#10b981",
};

interface Props {
  label: string;
  status: TaskStatus;
  tasks: Task[];
  boardId: string;
}

export function TaskColumn({ label, status, tasks, boardId }: Props) {
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 12,
        padding: 16,
        border: "1px solid #334155",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: STATUS_COLOR[status],
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>
          {label}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569", fontWeight: 600 }}>
          {tasks.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      <AddTaskForm boardId={boardId} status={status} />
    </div>
  );
}
