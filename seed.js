require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcrypt');

const { VERIFIER_ACCOUNTS } = require('./src/utils/facilitiesData');

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("❌ DATABASE_URL environment variable is required in .env.local or .env");
        process.exit(1);
    }

    const pool = new pg.Pool({
        connectionString,
        connectionTimeoutMillis: 25000,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log(`🚀 Starting database migration and re-seeding with ${VERIFIER_ACCOUNTS.length} facilities...`);
        
        // 1. Wipe old database records
        console.log("🧹 Deleting old applications, child details, parent details, OTPs, and old user accounts...");
        await prisma.childDetail.deleteMany({});
        await prisma.parentDetail.deleteMany({});
        await prisma.informantDetail.deleteMany({});
        await prisma.application.deleteMany({});
        await prisma.otpVerification.deleteMany({});
        await prisma.facility.deleteMany({});
        await prisma.user.deleteMany({});
        console.log("✅ Old database cleared successfully!");

        const defaultPassword = "Madhubani@2024";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 2. Create Central Operator Account
        console.log("👤 Creating central district operator account...");
        await prisma.user.create({
            data: {
                username: "operator_central",
                facility: "Central Operator",
                role: "operator",
                password: hashedPassword,
                isActive: true,
                authorityName: "District Administrative Officer",
                designation: "District System Operator",
            },
        });
        console.log("✅ Operator account 'operator_central' created!");

        // 3. Create 606 Verifier Accounts in batches
        console.log(`🏥 Seeding ${VERIFIER_ACCOUNTS.length} verifier accounts...`);
        const verifiersToInsert = VERIFIER_ACCOUNTS.map((v) => ({
            username: v.username,
            facility: v.facility,
            role: "verifier",
            password: hashedPassword,
            isActive: true,
            authorityName: `${v.block} Registration Unit`,
            designation: `${v.type} In-Charge / Verifier`,
            contactNumber: null,
            email: null,
        }));

        const CHUNK_SIZE = 50;
        for (let i = 0; i < verifiersToInsert.length; i += CHUNK_SIZE) {
            const chunk = verifiersToInsert.slice(i, i + CHUNK_SIZE);
            await prisma.user.createMany({
                data: chunk,
            });
            console.log(`   Seeded ${Math.min(i + CHUNK_SIZE, verifiersToInsert.length)} / ${verifiersToInsert.length} verifiers...`);
        }
        console.log(`✅ All ${verifiersToInsert.length} verifier accounts created successfully!`);

        // Seed Sub-Divisions and Blocks
        const { SUB_DIVISIONS_AND_BLOCKS } = require("./src/utils/subdivisions");
        const { MADHUBANI_POST_OFFICES } = require("./src/utils/postOffices");

        for (const sub of SUB_DIVISIONS_AND_BLOCKS) {
            const subDiv = await prisma.subDivision.upsert({
                where: { code: sub.code },
                update: {
                    name: sub.name,
                    nameHi: sub.nameHi,
                    displayName: sub.displayName,
                    district: "Madhubani",
                },
                create: {
                    code: sub.code,
                    name: sub.name,
                    nameHi: sub.nameHi,
                    displayName: sub.displayName,
                    district: "Madhubani",
                },
            });

            for (const b of sub.blocks) {
                await prisma.block.upsert({
                    where: {
                        subDivisionId_name: {
                            subDivisionId: subDiv.id,
                            name: b.name,
                        },
                    },
                    update: {
                        code: b.code,
                        nameHi: b.nameHi,
                        displayName: b.displayName,
                    },
                    create: {
                        code: b.code,
                        name: b.name,
                        nameHi: b.nameHi,
                        displayName: b.displayName,
                        subDivisionId: subDiv.id,
                    },
                });
            }
        }

        // Seed Post Offices
        for (const po of MADHUBANI_POST_OFFICES) {
            await prisma.postOffice.upsert({
                where: {
                    pincode_name: {
                        pincode: po.pincode,
                        name: po.name,
                    },
                },
                update: {
                    district: po.district || "MADHUBANI",
                },
                create: {
                    name: po.name,
                    pincode: po.pincode,
                    district: po.district || "MADHUBANI",
                },
            });
        }

        // Seed Facilities
        const { getFacilityMeta } = require('./seed-facilities');
        const { FACILITIES_DATA } = require('./src/utils/facilitiesData');
        console.log(`🏥 Seeding ${FACILITIES_DATA.length} healthcare facilities...`);
        const facilitiesToInsert = FACILITIES_DATA.map((f) => {
            const meta = getFacilityMeta(f);
            return {
                sr: f.sr,
                district: f.district || "Madhubani",
                block: f.block,
                name: f.name,
                rawName: f.rawName || f.name,
                type: f.type,
                category: f.category || "NA",
                categoryKey: meta.categoryKey,
                username: f.username,
                pin: f.pin || meta.pin,
                phone: meta.phone,
                altPhone: meta.altPhone,
                emergency: meta.emergency,
                email: meta.email,
                address: meta.address,
                timing: meta.timing,
                features: meta.features,
                icon: meta.icon,
                tag: meta.tag,
                level: meta.level,
                badgeColor: meta.badgeColor,
                badgeBg: meta.badgeBg,
                badgeBorder: meta.badgeBorder,
                isActive: true,
            };
        });

        for (let i = 0; i < facilitiesToInsert.length; i += CHUNK_SIZE) {
            const chunk = facilitiesToInsert.slice(i, i + CHUNK_SIZE);
            await prisma.facility.createMany({
                data: chunk,
                skipDuplicates: true,
            });
        }
        console.log(`✅ All ${facilitiesToInsert.length} facilities created successfully!`);

        console.log(`✅ Seeded ${VERIFIER_ACCOUNTS.length} verifier accounts, central operator, 5 Sub-Divisions, 21 Blocks, ${facilitiesToInsert.length} facilities, and ${MADHUBANI_POST_OFFICES.length} Post Offices into PostgreSQL successfully!`);
        await pool.end();
        process.exit(0);
    } catch (e) {
        console.error("❌ Seed error:", e);
        await pool.end();
        process.exit(1);
    }
}

seed();
