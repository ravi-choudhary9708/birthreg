import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis;

import dotenv from "dotenv";
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: ".env.local" });
}

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set in environment variables");
    }

    const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    const poolConfig = {
        connectionString,
        max: 10,
        connectionTimeoutMillis: 20000, // 20s allows Neon compute cold-start without timeout
        idleTimeoutMillis: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    };

    // Configure SSL: disable for local Postgres unless explicitly required; enable with rejectUnauthorized: false for cloud DBs (Neon, Supabase, Render, etc.)
    if (isLocalhost && !connectionString.includes("sslmode=require") && !connectionString.includes("sslmode=verify-full")) {
        poolConfig.ssl = false;
    } else {
        poolConfig.ssl = { rejectUnauthorized: false };
    }

    if (globalForPrisma.pgPool) {
        try {
            globalForPrisma.pgPool.end();
        } catch {
            // ignore
        }
    }

    const pool = new pg.Pool(poolConfig);
    pool.on("error", (err) => {
        // Neon compute auto-suspend / idle disconnect notification
        console.warn("PostgreSQL pool idle connection notice:", err.message);
    });
    globalForPrisma.pgPool = pool;

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

// In development, clear cached instance if schema has been updated
const PRISMA_SCHEMA_BUILD = "2026-09-12-facility-table-v1";
if (process.env.NODE_ENV !== "production") {
    if (globalForPrisma.__prisma_schema_build !== PRISMA_SCHEMA_BUILD) {
        globalForPrisma.prisma = undefined;
        globalForPrisma.__prisma_schema_build = PRISMA_SCHEMA_BUILD;
    }
}

export const prisma =
    globalForPrisma.prisma &&
    globalForPrisma.prisma.subDivision &&
    globalForPrisma.prisma.postOffice &&
    globalForPrisma.prisma.otpVerification &&
    globalForPrisma.prisma.facility
        ? globalForPrisma.prisma
        : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
