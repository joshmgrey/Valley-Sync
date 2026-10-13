/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/auth", () => ({ auth: jest.fn().mockResolvedValue(null) }));
jest.mock("@/lib/prisma", () => ({ prisma: {} }));

import * as boards from "@/app/api/boards/route";
import * as board from "@/app/api/boards/[id]/route";
import * as tasks from "@/app/api/tasks/route";
import * as task from "@/app/api/tasks/[id]/route";

const params = { params: Promise.resolve({ id: "some-id" }) };
const req = (method: string) =>
  new NextRequest("http://localhost:3000/api/x?boardId=b1", {
    method,
    body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify({}),
  });

// Each handler must reject a signed-out request with 401 on its own, even if
// the middleware is misconfigured, rather than crashing on a missing session.
describe("API routes without a session", () => {
  const cases: [string, () => Promise<Response>][] = [
    ["GET /api/boards", () => boards.GET()],
    ["POST /api/boards", () => boards.POST(req("POST"))],
    ["GET /api/boards/:id", () => board.GET(req("GET"), params)],
    ["PATCH /api/boards/:id", () => board.PATCH(req("PATCH"), params)],
    ["DELETE /api/boards/:id", () => board.DELETE(req("DELETE"), params)],
    ["GET /api/tasks", () => tasks.GET(req("GET"))],
    ["POST /api/tasks", () => tasks.POST(req("POST"))],
    ["GET /api/tasks/:id", () => task.GET(req("GET"), params)],
    ["PATCH /api/tasks/:id", () => task.PATCH(req("PATCH"), params)],
    ["DELETE /api/tasks/:id", () => task.DELETE(req("DELETE"), params)],
  ];

  it.each(cases)("%s returns 401", async (_name, call) => {
    const res = await call();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
