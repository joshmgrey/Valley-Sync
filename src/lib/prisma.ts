import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL!);
  const sslmode = url.searchParams.get("sslmode");
  const wantsSsl = sslmode !== null && sslmode !== "disable";

  // Pass discrete params rather than `connectionString`: `pg` lets a connection
  // string's `sslmode` override an explicit `ssl` option, and it now reads
  // `sslmode=require` as `verify-full`, which rejects RDS's cert chain
  // ("self-signed certificate in certificate chain"). Prisma's migrate engine
  // uses lenient TLS, so migrations succeed but the app didn't. Transport stays
  // encrypted; we just don't verify the chain.
  const adapter = new PrismaPg({
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Prevent multiple PrismaClient instances in Next.js dev (hot reload creates new modules)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
