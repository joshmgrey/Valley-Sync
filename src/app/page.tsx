import Link from "next/link";
import { BoardService } from "@/lib/board/boardService";
import { PrismaBoardRepository } from "@/lib/board/prismaBoardRepository";
import { prisma } from "@/lib/prisma";
import { CreateBoardForm } from "@/components/board/CreateBoardForm";
import { UserNav } from "@/components/ui/UserNav";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function getBoards() {
  const service = new BoardService(new PrismaBoardRepository(prisma));
  return service.listBoards();
}

export default async function HomePage() {
  const [boards, session] = await Promise.all([getBoards(), auth()]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Valley Sync</h1>
        <UserNav name={session?.user?.name} image={session?.user?.image} />
      </div>
      <p style={{ color: "#94a3b8", marginBottom: 36 }}>Real-time collaborative task boards</p>

      <CreateBoardForm />

      {boards.length > 0 && (
        <ul style={{ listStyle: "none", marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          {boards.map((board) => (
            <li key={board.id}>
              <Link
                href={`/boards/${board.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "#1e293b",
                  borderRadius: 10,
                  border: "1px solid #334155",
                }}
              >
                <span style={{ fontWeight: 500 }}>{board.name}</span>
                <span style={{ color: "#64748b", fontSize: 13 }}>
                  {board.tasks.length} task{board.tasks.length !== 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {boards.length === 0 && (
        <p style={{ color: "#475569", marginTop: 32, textAlign: "center" }}>
          No boards yet — create one above.
        </p>
      )}
    </main>
  );
}
