import { NextRequest, NextResponse } from "next/server";
import { BoardService } from "@/lib/board/boardService";
import { PrismaBoardRepository } from "@/lib/board/prismaBoardRepository";
import { prisma } from "@/lib/prisma";

function getBoardService(): BoardService {
  return new BoardService(new PrismaBoardRepository(prisma));
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const board = await getBoardService().getBoard(id);
    return NextResponse.json({ board });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { name } = await req.json();
    const board = await getBoardService().renameBoard(id, name);
    return NextResponse.json({ board });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : message.includes("cannot be empty") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await getBoardService().deleteBoard(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
