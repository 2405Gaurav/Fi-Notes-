import { config } from "../config/index.js";
import generatedPrismaClient from "../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";
import type { PrismaClient } from "../generated/prisma/client.js";

const { PrismaClient: PrismaClientCtor } = generatedPrismaClient as {
  PrismaClient: new (...args: ConstructorParameters<typeof PrismaClient>) => PrismaClient;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({
    connectionString: config.databaseUrl,
  });
  return new PrismaClientCtor({
    adapter,
    log: config.isProduction ? ["error"] : ["query", "error", "warn"],
  });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma
