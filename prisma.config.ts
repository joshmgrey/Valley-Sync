import { defineConfig } from "prisma/config";
import "dotenv/config"; // loads .env in dev; no-op in production where vars are injected
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
