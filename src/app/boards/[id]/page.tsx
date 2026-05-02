import { notFound } from "next/navigation";
import { BoardService } from "@/lib/board/boardService";
import { PrismaBoardRepository } from "@/lib/board/prismaBoardRepository";
import { prisma } from "@/lib/prisma";
import { BoardView } from "@/components/board/BoardView";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function BoardPage({ params }: Props) {
  const { id } = await params;
  const service = new BoardService(new PrismaBoardRepository(prisma));

  let board;
  try {
    board = await service.getBoard(id);
  } catch {
    notFound();
  }

  const session = await auth();

  return (
    <BoardView
      initialBoard={board}
      userName={session?.user?.name ?? null}
      userImage={session?.user?.image ?? null}
    />
  );
}
