"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateBoardForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New board name…"
        style={{
          flex: 1,
          padding: "10px 14px",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          color: "#e2e8f0",
          fontSize: 14,
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        style={{
          padding: "10px 20px",
          background: "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading || !name.trim() ? 0.6 : 1,
        }}
      >
        {loading ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
