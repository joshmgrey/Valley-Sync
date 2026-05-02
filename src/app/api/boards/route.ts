import { NextResponse } from "next/server";
import { BoardService } from "@/lib/board/boardService";
import { PrismaBoardRepository } from "@/lib/board/prismaBoardRepository";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

function getBoardService(): BoardService {
  return new BoardService(new PrismaBoardRepository(prisma));
}

export async function GET() {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "boards:list");
  if (limited) return limited;

  try {
    const boards = await getBoardService().listBoards();
    return NextResponse.json({ boards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "boards:create", 20, 60_000);
  if (limited) return limited;

  try {
    const { name } = await request.json();
    const board = await getBoardService().createBoard(name, session!.user.id);
    return NextResponse.json({ board }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("cannot be empty") || message.includes("cannot exceed") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
