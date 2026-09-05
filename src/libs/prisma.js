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
        connectionTimeoutMillis: 5000,
    };

    // Disable SSL for local database unless explicitly required
    if (isLocalhost && !connectionString.includes("sslmode=require") && !connectionString.includes("sslmode=verify-full")) {
        poolConfig.ssl = false;
    }

    const pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
