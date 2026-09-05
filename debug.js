require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("❌ DATABASE_URL is not defined in .env.local or .env");
        process.exit(1);
    }

    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log("Connecting to PostgreSQL...");
        const userCount = await prisma.user.count();
        const appCount = await prisma.application.count();
        console.log(`✅ Connected successfully! Users: ${userCount}, Applications: ${appCount}`);

        const sampleUsers = await prisma.user.findMany({ take: 5 });
        console.log("Sample users:");
        sampleUsers.forEach(u => console.log(`- ${u.username} (${u.role}) - ${u.facility}`));

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Database connection error:", err.message);
        await pool.end();
        process.exit(1);
    }
}

run();
