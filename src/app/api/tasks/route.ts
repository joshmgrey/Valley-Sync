import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/task/taskService";
import { PrismaTaskRepository } from "@/lib/task/prismaTaskRepository";
import { prisma } from "@/lib/prisma";

function getTaskService(): TaskService {
  return new TaskService(new PrismaTaskRepository(prisma));
}

export async function GET(request: NextRequest) {
  const boardId = request.nextUrl.searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }
  try {
    const service = getTaskService();
    const tasks = await service.getTasksForBoard(boardId);
    return NextResponse.json({ tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { boardId, title, description, assigneeId, status } = await request.json();
    if (!boardId) return NextResponse.json({ error: "boardId is required" }, { status: 400 });
    const service = getTaskService();
    const task = await service.createTask(boardId, title, { description, assigneeId, status });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("cannot be empty") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
