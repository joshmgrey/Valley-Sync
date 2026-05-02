import { NextRequest, NextResponse } from "next/server";
import { BoardService } from "@/lib/board/boardService";
import { PrismaBoardRepository } from "@/lib/board/prismaBoardRepository";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

function getBoardService(): BoardService {
  return new BoardService(new PrismaBoardRepository(prisma));
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "boards:get");
  if (limited) return limited;

  const { id } = await params;
  try {
    const board = await getBoardService().getBoard(id);
    return NextResponse.json({ board });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "boards:update", 30, 60_000);
  if (limited) return limited;

  const { id } = await params;
  try {
    const { name } = await req.json();
    const board = await getBoardService().renameBoard(id, name, session!.user.id);
    return NextResponse.json({ board });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : message.includes("Forbidden") ? 403 : message.includes("cannot") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "boards:delete", 10, 60_000);
  if (limited) return limited;

  const { id } = await params;
  try {
    await getBoardService().deleteBoard(id, session!.user.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
