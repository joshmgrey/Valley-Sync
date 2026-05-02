import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "@/lib/socket/socketManager";
import { TaskService } from "@/lib/task/taskService";
import { PrismaTaskRepository } from "@/lib/task/prismaTaskRepository";
import { prisma } from "@/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

// Next.js needs a resolvable hostname for internal requests — use localhost.
// The TCP server binds to 0.0.0.0 so Railway's proxy can reach it.
const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const taskService = new TaskService(new PrismaTaskRepository(prisma));

  initSocketServer(httpServer, taskService);

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on port ${port} [${dev ? "dev" : "prod"}]`);
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
    } else {
      console.error("Server error:", err);
    }
    process.exit(1);
  });
});
