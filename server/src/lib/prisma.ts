import { config } from "../config/index.js"
import { PrismaClient } from '../generated/prisma/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  })
  return new PrismaClient({
    adapter,
    log: config.isProduction ? ['error'] : ['query', 'error', 'warn'],
  })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (!config.isProduction) {
  globalForPrisma.prisma = prisma
}

export default prisma
