"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Board, TaskStatus } from "@/types";
import { useBoardStore, selectColumns } from "@/store/boardStore";
import { useSocket } from "@/hooks/useSocket";
import { TaskColumn } from "@/components/task/TaskColumn";
import { UserNav } from "@/components/ui/UserNav";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in-progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

interface Props {
  initialBoard: Board;
  userName: string | null;
  userImage: string | null;
}

export function BoardView({ initialBoard, userName, userImage }: Props) {
  const { setActiveBoard, activeBoard } = useBoardStore();
  useSocket(initialBoard.id);

  useEffect(() => {
    setActiveBoard(initialBoard);
  }, [initialBoard, setActiveBoard]);

  const board = activeBoard ?? initialBoard;
  const columns = selectColumns(board);

  return (
    <div style={{ padding: "24px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ color: "#64748b", fontSize: 14 }}>← Boards</Link>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>{board.name}</h1>
          </div>
          <UserNav name={userName} image={userImage} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          {COLUMNS.map(({ status, label }) => (
            <TaskColumn
              key={status}
              label={label}
              status={status}
              tasks={columns[status]}
              boardId={board.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
