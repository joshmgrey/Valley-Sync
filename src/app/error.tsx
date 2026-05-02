"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <p style={{ fontSize: 48, lineHeight: 1 }}>Something went wrong</p>
      <p style={{ color: "#64748b", fontSize: 14 }}>{error.message}</p>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "8px 20px",
            background: "none",
            border: "1px solid #334155",
            color: "#94a3b8",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
