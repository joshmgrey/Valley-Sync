import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "@/lib/socket/socketManager";
import { TaskService } from "@/lib/task/taskService";
import { PrismaTaskRepository } from "@/lib/task/prismaTaskRepository";
import { prisma } from "@/lib/prisma";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
// Always bind to 0.0.0.0 so Railway (and other platforms) can route traffic in.
// HOSTNAME from the environment is the container ID, not a valid bind address.
const hostname = "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const taskService = new TaskService(new PrismaTaskRepository(prisma));

  initSocketServer(httpServer, taskService);

  httpServer.listen(port, hostname, () => {
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
