require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');

async function seedPostOffices() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Connecting to database...');
  try {
    const rawData = fs.readFileSync('/tmp/madhubani_post_offices.json', 'utf8');
    const postOffices = JSON.parse(rawData);

    console.log(`Seeding ${postOffices.length} post offices into PostgreSQL...`);

    let inserted = 0;
    let updated = 0;

    for (const po of postOffices) {
      const record = await prisma.postOffice.upsert({
        where: {
          pincode_name: {
            pincode: String(po.pincode).trim(),
            name: String(po.name).trim(),
          },
        },
        update: {
          district: String(po.district || 'MADHUBANI').trim(),
        },
        create: {
          name: String(po.name).trim(),
          pincode: String(po.pincode).trim(),
          district: String(po.district || 'MADHUBANI').trim(),
        },
      });
      if (record) inserted++;
    }

    const totalInDb = await prisma.postOffice.count();
    console.log(`✓ Successfully seeded post offices! Total in DB: ${totalInDb}`);

  } catch (error) {
    console.error('Error seeding post offices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedPostOffices();
