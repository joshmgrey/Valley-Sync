import { NextResponse } from "next/server";
import { BoardService } from "@/lib/board/boardService";
import { PrismaBoardRepository } from "@/lib/board/prismaBoardRepository";
import { prisma } from "@/lib/prisma";

function getBoardService(): BoardService {
  return new BoardService(new PrismaBoardRepository(prisma));
}

export async function GET() {
  try {
    const service = getBoardService();
    const boards = await service.listBoards();
    return NextResponse.json({ boards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const service = getBoardService();
    const board = await service.createBoard(name);
    return NextResponse.json({ board }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("cannot be empty") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
