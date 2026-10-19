import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient: em dev o hot-reload recria módulos, o que abriria
// muitas conexões. Guardamos a instância no globalThis para reaproveitá-la.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
