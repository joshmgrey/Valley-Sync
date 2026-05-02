import Link from "next/link";

export default function NotFound() {
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
      <p style={{ fontSize: 64, lineHeight: 1 }}>404</p>
      <p style={{ color: "#64748b" }}>This page does not exist.</p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          padding: "8px 20px",
          background: "#6366f1",
          color: "#fff",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Go home
      </Link>
    </main>
  );
}
