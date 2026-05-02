import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/task/taskService";
import { PrismaTaskRepository } from "@/lib/task/prismaTaskRepository";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

function getTaskService(): TaskService {
  return new TaskService(new PrismaTaskRepository(prisma));
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "tasks:list");
  if (limited) return limited;

  const boardId = request.nextUrl.searchParams.get("boardId");
  if (!boardId) return NextResponse.json({ error: "boardId is required" }, { status: 400 });

  try {
    const tasks = await getTaskService().getTasksForBoard(boardId);
    return NextResponse.json({ tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "tasks:create", 30, 60_000);
  if (limited) return limited;

  try {
    const { boardId, title, description, assigneeId, status } = await request.json();
    if (!boardId) return NextResponse.json({ error: "boardId is required" }, { status: 400 });
    const task = await getTaskService().createTask(boardId, title, { description, assigneeId, status });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("cannot be empty") || message.includes("cannot exceed") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
