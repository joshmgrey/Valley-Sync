"use client";

import Image from "next/image";
import { signOut } from "next-auth/react";

interface Props {
  name?: string | null;
  image?: string | null;
}

export function UserNav({ name, image }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {image && (
        <Image
          src={image}
          alt={name ?? "User"}
          width={32}
          height={32}
          style={{ borderRadius: "50%", border: "2px solid #334155" }}
        />
      )}
      <span style={{ fontSize: 14, color: "#94a3b8" }}>{name}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{
          padding: "6px 14px",
          background: "none",
          border: "1px solid #334155",
          borderRadius: 6,
          color: "#64748b",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
