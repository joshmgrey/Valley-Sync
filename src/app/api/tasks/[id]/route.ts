import { NextRequest, NextResponse } from "next/server";
import { TaskService } from "@/lib/task/taskService";
import { PrismaTaskRepository } from "@/lib/task/prismaTaskRepository";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

function getTaskService(): TaskService {
  return new TaskService(new PrismaTaskRepository(prisma));
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "tasks:get");
  if (limited) return limited;

  const { id } = await params;
  try {
    const task = await getTaskService().getTask(id);
    return NextResponse.json({ task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "tasks:update", 60, 60_000);
  if (limited) return limited;

  const { id } = await params;
  try {
    const changes = await req.json();
    const task = await getTaskService().updateTask(id, changes);
    return NextResponse.json({ task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : message.includes("cannot") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const limited = rateLimit(session!.user.id, "tasks:delete", 30, 60_000);
  if (limited) return limited;

  const { id } = await params;
  try {
    await getTaskService().deleteTask(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
}
