import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

// A Proxy defers both the PrismaClient construction AND the process.env read
// above until the first actual property access (e.g. prisma.club.findMany),
// not at module import time. Next.js's build-time "collecting page data"
// step can otherwise mistake module-level side effects like this for a
// signal that a route wants static generation, and execute it during the
// build - which is what was causing routes to intermittently hit the
// database (and fail) during Vercel's build specifically.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrismaClient() as any)[prop];
  },
});