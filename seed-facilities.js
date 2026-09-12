require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const { FACILITIES_DATA } = require('./src/utils/facilitiesData');

// Comprehensive verified directory data for all facilities in Madhubani District
const FACILITY_CONTACTS = {
  "REFERRAL HOSPITAL ANDHRATHARI": {
    block: "Andhrathari",
    pin: "847401",
    phone: "06276-284201",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Andhrathari Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery", "Referral Care", "Immunization", "CRS Registration"],
  },
  "PHC ANDHRATHADHI": {
    block: "Andhrathari",
    pin: "847401",
    phone: "06276-284201",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Andhrathadhi, Madhubani",
    timing: "24x7 Emergency & Delivery / 9 AM - 5 PM Registry",
    features: ["Delivery Wing", "Primary Healthcare", "CRS Registration"],
  },
  "PHC BABUBARHI": {
    block: "Babubarhi",
    pin: "847224",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "PHC Campus, Babubarhi Block HQ, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Primary Outpatient", "CRS Registration"],
  },
  "CHC BABUBARHI": {
    block: "Babubarhi",
    pin: "847224",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Community Health Centre, Babubarhi Market Road, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery", "SNCU Support", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE BASOPATTI": {
    block: "Basopatti",
    pin: "847225",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Basopatti Block, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Immunization", "CRS Registration"],
  },
  "PHC BENIPATTI MADHUBANI": {
    block: "Benipatti",
    pin: "847223",
    phone: "06271-222078",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "SH-52, Benipatti Sub-Division, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Sub-Divisional Hub", "24x7 Maternity", "Emergency Wing", "CRS Registration"],
  },
  "PRIMARI HEALTH CENTRE BISFI": {
    block: "Bisfi",
    pin: "847122",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Block Headquarters Road, Bisfi, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Delivery Wing", "Child Healthcare", "CRS Registration"],
  },
  "CHC BISFI": {
    block: "Bisfi",
    pin: "847122",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Complex, Near Block Office, Bisfi, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Maternity Care", "CRS Registration"],
  },
  "PHC GHOGHARDIHA": {
    block: "Ghoghardiha",
    pin: "847402",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Chowk, Ghoghardiha, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Primary Outpatient", "24x7 Delivery Wing", "Immunization", "CRS Registration"],
  },
  "CHC HARLAKHI": {
    block: "Harlakhi",
    pin: "847240",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Indo-Nepal Border Road, Umgaon, Harlakhi, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Care", "Maternity Wing", "Ambulance Hub", "CRS Registration"],
  },
  "SUB DIVISIONAL HOSPITAL, JAYNAGAR": {
    block: "Jaynagar",
    pin: "847226",
    phone: "06274-222234",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Station Road, Jaynagar Sub-Division, Madhubani",
    timing: "24x7 Emergency, Trauma & Maternity / 9 AM - 5 PM Registry",
    features: ["Sub-Divisional Hospital", "Blood Storage", "Specialist Doctors", "24x7 Emergency", "CRS Registration"],
  },
  "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR": {
    block: "Jhanjharpur",
    pin: "847404",
    phone: "06273-222222",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Hospital Road, Jhanjharpur Sub-Division, Madhubani",
    timing: "24x7 Emergency, Surgery & Maternity / 9 AM - 5 PM Registry",
    features: ["Sub-Divisional Apex", "Surgical Theatre", "SNCU", "Blood Storage", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE JHANJHARPUR": {
    block: "Jhanjharpur",
    pin: "847404",
    phone: "06273-222222",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Old PHC Campus, Near Block HQ, Jhanjharpur, Madhubani",
    timing: "24x7 Emergency & Delivery / 9 AM - 5 PM Registry",
    features: ["Primary Outpatient", "Maternity Care", "Immunization Hub", "CRS Registration"],
  },
  "CHC KALUAHI": {
    block: "Kaluahi",
    pin: "847229",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Block Road, Kaluahi Market, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery", "Inpatient Beds", "Lab Diagnostics", "CRS Registration"],
  },
  "CHC KHAJAULI": {
    block: "Khajauli",
    pin: "847228",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Railway Station Road, Khajauli, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Maternity Hub", "Inpatient Wards", "Immunization", "CRS Registration"],
  },
  "CHC LADANIA": {
    block: "Ladania",
    pin: "847232",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Block Campus, Ladania, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery", "Inpatient Care", "CRS Registration"],
  },
  "CHC LAKHNAUR": {
    block: "Lakhnaur",
    pin: "847403",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Lakhnaur Main Road, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery", "CRS Registration"],
  },
  "CHC KHUTAUNA": {
    block: "Khutauna",
    pin: "847227",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Khutauna Block Road, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery Hub", "Inpatient Care", "CRS Registration"],
  },
  "CHC LAUKAHI": {
    block: "Laukahi",
    pin: "847108",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Near Block Office, Laukahi, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Maternity Care", "Inpatient Beds", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE MADHEPUR": {
    block: "Madhepur",
    pin: "847408",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Madhepur Block Road, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Primary Healthcare", "Delivery Hub", "CRS Registration"],
  },
  "SADAR HOSPITAL MADHUBANI": {
    block: "Rahika",
    pin: "847211",
    phone: "06276-222244",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Sadar Hospital Road, Madhubani Town, Bihar - 847211",
    timing: "24x7 Emergency, Trauma, ICU & Maternity / 9 AM - 5 PM Registry",
    features: ["Apex District Hospital", "Blood Bank", "SNCU / ICU", "24x7 Delivery", "Surgical Wing", "CRS Registration"],
  },
  "CHC MADHWAPUR": {
    block: "Madhwapur",
    pin: "847305",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Madhwapur Market Road, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["24x7 Delivery", "Inpatient Care", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE PANDAUL": {
    block: "Pandaul",
    pin: "847234",
    phone: "+91 9470003434",
    altPhone: "06276-224425",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Sakri-Pandaul Road, Pandaul, Madhubani",
    timing: "24x7 Emergency & Maternity / 9 AM - 5 PM Registry",
    features: ["Primary Outpatient", "24x7 Delivery Hub", "CRS Registration"],
  },
  "SUPRITENDENT SUB DIVISIONAL HOSPITAL PHULPARAS": {
    block: "Phulparas",
    pin: "847409",
    phone: "06277-222201",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "NH-57 By-Pass Road, Phulparas Sub-Division, Madhubani",
    timing: "24x7 Emergency, Surgery & Maternity / 9 AM - 5 PM Registry",
    features: ["Sub-Divisional Hospital", "Emergency Care", "Specialist Wing", "CRS Registration"],
  },
  "PRIMARY HEALTH CENTRE PHULPARAS": {
    block: "Phulparas",
    pin: "847409",
    phone: "06277-222201",
    altPhone: "+91 9470003434",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Old PHC Campus, Phulparas, Madhubani",
    timing: "24x7 Emergency & Delivery / 9 AM - 5 PM Registry",
    features: ["Primary Care", "Maternity Outpatient", "CRS Registration"],
  },
  "CHC RAHIKA": {
    block: "Rahika",
    pin: "847238",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "Rahika Block Campus, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
  "CHC RAJNAGAR": {
    block: "Rajnagar",
    pin: "847235",
    phone: "+91 9470003434",
    altPhone: "06276-222050",
    emergency: "102 / 104",
    email: "cs-madhubani-bih@gov.in",
    address: "CHC Complex, Main Market, Rajnagar Block, Madhubani",
    timing: "24x7 Emergency & Inpatient / 9 AM - 5 PM Registry",
    features: ["Inpatient Beds", "24x7 Delivery Hub", "CRS Registration"],
  },
};

const FACILITY_NAME_ALIASES = {
  "CHC Andhrathari Madhubani": "REFERRAL HOSPITAL ANDHRATHARI",
  "APHC Mahrail Madhubani": "APHC MAHRAIL",
  "CHC Babubarhi Madhubani": "CHC BABUBARHI",
  "CHC Basopatti Madhubani": "PRIMARY HEALTH CENTRE BASOPATTI",
  "SDH Benipatti Madhubani": "PHC BENIPATTI MADHUBANI",
  "PHC Benipatti Madhubani": "PHC BENIPATTI MADHUBANI",
  "CHC Bisfi Madhubani": "CHC BISFI",
  "PHC Ghoghardiha Madhubani": "PHC GHOGHARDIHA",
  "CHC Harlakhi Madhubani": "CHC HARLAKHI",
  "SDH Jaynagar Madhubani": "SUB DIVISIONAL HOSPITAL, JAYNAGAR",
  "SDH Jhanjharpur Madhubani": "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR",
  "PHC Jhanjharpur Madhubani": "PRIMARY HEALTH CENTRE JHANJHARPUR",
  "CHC Kaluahi Madhubani": "CHC KALUAHI",
  "CHC Khajauli Madhubani": "CHC KHAJAULI",
  "CHC Ladania Madhubani": "CHC LADANIA",
  "CHC Lakhnaur Madhubani": "CHC LAKHNAUR",
  "CHC Khutauna Madhubani": "CHC KHUTAUNA",
  "CHC Laukahi Madhubani": "CHC LAUKAHI",
  "CHC Madhepur Madhubani": "PRIMARY HEALTH CENTRE MADHEPUR",
  "District Hospital Madhubani": "SADAR HOSPITAL MADHUBANI",
  "CHC Madhwapur Madhubani": "CHC MADHWAPUR",
  "CHC Pandaul Madhubani": "PRIMARY HEALTH CENTRE PANDAUL",
  "SDH Phulparas Madhubani": "SUPRITENDENT SUB DIVISIONAL HOSPITAL PHULPARAS",
  "PHC Phulparas Madhubani": "PRIMARY HEALTH CENTRE PHULPARAS",
  "CHC Rahika Madhubani": "CHC RAHIKA",
  "CHC Rajnagar Madhubani": "CHC RAJNAGAR",
};

function getFacilityMeta(item) {
  const name = item.name;
  const block = item.block || "Madhubani";
  const type = item.type || "HSC";
  const category = item.category || "NA";
  const pin = item.pin || "847211";

  const rawContact = FACILITY_CONTACTS[name] || (FACILITY_NAME_ALIASES[name] ? FACILITY_CONTACTS[FACILITY_NAME_ALIASES[name]] : null);

  const contact = {
    block,
    pin,
    phone: rawContact?.phone || "+91 9470003434",
    altPhone: rawContact?.altPhone || "06276-222050",
    emergency: rawContact?.emergency || "102 / 104",
    email: rawContact?.email || "cs-madhubani-bih@gov.in",
    address: rawContact?.address
      ? (rawContact.address.includes(pin) ? rawContact.address : `${rawContact.address} - ${pin}`)
      : `${name}, Block ${block}, District Madhubani, Bihar - ${pin}`,
    timing: rawContact?.timing || (
      (type === "DH" || type === "SDH" || type === "CHC")
        ? "24x7 Emergency & Maternity / 9 AM - 5 PM Registry"
        : "9 AM - 5 PM Registry & Outpatient / Emergency 102/104"
    ),
    features: rawContact?.features || (
      (type === "DH" || type === "SDH" || type === "CHC")
        ? ["24x7 Delivery", "Inpatient Care", "CRS Birth Registration", "Immunization"]
        : ["Maternity Care", "Primary Health Registry", "CRS Birth Registration"]
    ),
  };

  if (type === "DH" || name.includes("SADAR HOSPITAL")) {
    return {
      categoryKey: "DH",
      type: "District Hospital",
      tag: "District Hospital (DH)",
      badgeColor: "#92400e",
      badgeBg: "#fef3c7",
      badgeBorder: "#fde68a",
      icon: "🏥",
      level: "District Civil Hospital",
      ...contact,
    };
  }

  if (type === "SDH" || name.includes("SUB DIVISIONAL") || name.includes("REFERRAL")) {
    return {
      categoryKey: "SDH",
      type: "Sub-Divisional Hospital (SDH)",
      tag: "SDH / Sub-Divisional Hospital",
      badgeColor: "#6b21a8",
      badgeBg: "#f3e8ff",
      badgeBorder: "#e9d5ff",
      icon: "🏛️",
      level: "Secondary Referral Hub",
      ...contact,
    };
  }

  if (type === "CHC" || name.startsWith("CHC ") || name.includes(" CHC")) {
    return {
      categoryKey: "CHC",
      type: "Community Health Centre (CHC)",
      tag: "CHC (Community Health Centre)",
      badgeColor: "#065f46",
      badgeBg: "#ecfdf5",
      badgeBorder: "#a7f3d0",
      icon: "🏨",
      level: "Community Health Centre",
      ...contact,
    };
  }

  if (type === "PHC" || type === "APHC" || name.includes("PHC") || name.includes("APHC")) {
    const isAPHC = type === "APHC" || name.includes("APHC");
    return {
      categoryKey: "PHC",
      type: isAPHC ? "Additional Primary Health Centre (APHC)" : "Primary Health Centre (PHC)",
      tag: isAPHC ? "APHC" : "PHC (Primary Care)",
      badgeColor: "#1e40af",
      badgeBg: "#eff6ff",
      badgeBorder: "#bfdbfe",
      icon: "🩺",
      level: "Primary Care Registry",
      ...contact,
    };
  }

  const isUHWC = category === "UHWC";
  const isHWC = category === "HWC" || name.startsWith("HWC");
  return {
    categoryKey: "HSC",
    type: isUHWC ? "Urban Health & Wellness Centre (UHWC)" : isHWC ? "Health & Wellness Centre (HWC)" : "Health Sub Centre (HSC)",
    tag: isUHWC ? "UHWC" : isHWC ? "HWC" : "HSC (Health Sub-Centre)",
    badgeColor: isUHWC ? "#0f766e" : "#0284c7",
    badgeBg: isUHWC ? "#f0fdfa" : "#f0f9ff",
    badgeBorder: isUHWC ? "#99f6e4" : "#bae6fd",
    icon: "🏠",
    level: "Grassroots Health & Wellness Registry",
    ...contact,
  };
}

async function seedFacilities() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing in environment");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 25000,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`🏥 Preparing ${FACILITIES_DATA.length} facilities for PostgreSQL...`);

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

    console.log("⚡ Inserting facilities in chunks into PostgreSQL...");
    const CHUNK_SIZE = 50;
    for (let i = 0; i < facilitiesToInsert.length; i += CHUNK_SIZE) {
      const chunk = facilitiesToInsert.slice(i, i + CHUNK_SIZE);
      await prisma.facility.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      console.log(`   Seeded ${Math.min(i + CHUNK_SIZE, facilitiesToInsert.length)} / ${facilitiesToInsert.length} facilities...`);
    }

    const count = await prisma.facility.count();
    console.log(`✅ Finished seeding facilities! Total in database: ${count}`);

    await pool.end();
  } catch (err) {
    console.error("❌ Failed to seed facilities:", err);
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  seedFacilities();
}

module.exports = { seedFacilities, getFacilityMeta, FACILITY_CONTACTS, FACILITY_NAME_ALIASES };
