import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Creates and returns a PrismaClient instance configured with the
 * Neon serverless PostgreSQL adapter.
 *
 * Uses PrismaNeon with a connectionString config object — the modern
 * approach that lets the adapter manage connections internally.
 */

const connectionString = process.env.DATABASE_URL!;

const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

export default prisma;
