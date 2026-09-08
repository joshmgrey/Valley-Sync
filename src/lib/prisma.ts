import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;

  // RDS enforces TLS (rds.force_ssl). `pg` now treats `sslmode=require` in the
  // URL as `verify-full`, and RDS's regional intermediate CA isn't in the base
  // trust store, so the strict verify fails where Prisma's migrate engine (which
  // uses lenient TLS) succeeds. Pass an explicit lenient TLS config for any
  // sslmode other than `disable`; transport stays encrypted.
  const wantsSsl =
    /[?&]sslmode=/.test(connectionString) &&
    !/[?&]sslmode=disable\b/.test(connectionString);

  const adapter = new PrismaPg({
    connectionString,
    ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
  });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Prevent multiple PrismaClient instances in Next.js dev (hot reload creates new modules)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
