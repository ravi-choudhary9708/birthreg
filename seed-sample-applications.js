require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SAMPLE_DATA = [
  // 1. Sadar Hospital: Overdue (> 7 days)
  {
    facility: "SADAR HOSPITAL MADHUBANI",
    childName: "Aarav Kumar",
    gender: "Male",
    status: "PENDING_VERIFIER",
    daysAgo: 9,
  },
  // 2. Sadar Hospital: On-track (<= 7 days)
  {
    facility: "SADAR HOSPITAL MADHUBANI",
    childName: "Pooja Kumari",
    gender: "Female",
    status: "PENDING_VERIFIER",
    daysAgo: 2,
  },
  // 3. Sadar Hospital: Ready for CRS (Verified by Verifier)
  {
    facility: "SADAR HOSPITAL MADHUBANI",
    childName: "Vikram Malhotra",
    gender: "Male",
    status: "PENDING_OPERATOR",
    daysAgo: 4,
    verifiedDaysAfter: 1,
    remarks: "Verified against hospital labor room register Page 42, Entry #18.",
  },
  // 4. Sadar Hospital: Applied on CRS by Verifier
  {
    facility: "SADAR HOSPITAL MADHUBANI",
    childName: "Meera Sen",
    gender: "Female",
    status: "APPLIED_ON_CRS",
    daysAgo: 6,
    verifiedDaysAfter: 2,
    remarks: "Applied on CRS Portal | Ack No: CRS-BR-2026-08942",
  },
  // 5. Sadar Hospital: Completed with Certificate Uploaded
  {
    facility: "SADAR HOSPITAL MADHUBANI",
    childName: "Arjun Verma",
    gender: "Male",
    status: "COMPLETED",
    daysAgo: 10,
    verifiedDaysAfter: 1,
    certificateUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
    remarks: "Certificate issued and emailed to parents.",
  },
  // 6. Sadar Hospital: Rejected with Reason for Operator Audit
  {
    facility: "SADAR HOSPITAL MADHUBANI",
    childName: "Sanjay Sahani",
    gender: "Male",
    status: "REJECTED_BY_VERIFIER",
    daysAgo: 7,
    verifiedDaysAfter: 1,
    remarks: "Discharge summary hospital slip blurred and unreadable. Please re-upload clear copy with doctor stamp.",
  },
  // 7. Jhanjharpur SDH: Critical Overdue (> 14 days)
  {
    facility: "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR",
    childName: "Rahul Singh",
    gender: "Male",
    status: "PENDING_VERIFIER",
    daysAgo: 13,
  },
  // 8. Jhanjharpur SDH: On-track
  {
    facility: "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR",
    childName: "Sneha Roy",
    gender: "Female",
    status: "PENDING_VERIFIER",
    daysAgo: 3,
  },
  // 9. Jhanjharpur SDH: Rejected with Reason
  {
    facility: "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR",
    childName: "Amitabh Thakur",
    gender: "Male",
    status: "REJECTED_BY_VERIFIER",
    daysAgo: 8,
    verifiedDaysAfter: 3,
    remarks: "Parent Aadhaar card copy is invalid or mismatch in father's name with hospital admission record.",
  },
  // 10. Jhanjharpur SDH: Completed
  {
    facility: "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR",
    childName: "Kavita Yadav",
    gender: "Female",
    status: "COMPLETED",
    daysAgo: 11,
    verifiedDaysAfter: 2,
    certificateUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
    remarks: "Digital certificate signed and issued.",
  },
  // 11. Jaynagar SDH: Applied on CRS
  {
    facility: "SUB DIVISIONAL HOSPITAL, JAYNAGAR",
    childName: "Rohan Jha",
    gender: "Male",
    status: "APPLIED_ON_CRS",
    daysAgo: 5,
    verifiedDaysAfter: 2,
    remarks: "Applied on CRS Portal | Ack No: CRS-BR-2026-11429",
  },
  // 12. Jaynagar SDH: Completed
  {
    facility: "SUB DIVISIONAL HOSPITAL, JAYNAGAR",
    childName: "Priyanka Mandal",
    gender: "Female",
    status: "COMPLETED",
    daysAgo: 8,
    verifiedDaysAfter: 2,
    certificateUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
  },
  // 13. Benipatti PHC: Fresh On-track
  {
    facility: "PHC BENIPATTI MADHUBANI",
    childName: "Ananya Mishra",
    gender: "Female",
    status: "PENDING_VERIFIER",
    daysAgo: 1,
  },
  // 14. Benipatti PHC: Rejected
  {
    facility: "PHC BENIPATTI MADHUBANI",
    childName: "Kunal Jha",
    gender: "Male",
    status: "REJECTED_BY_VERIFIER",
    daysAgo: 6,
    verifiedDaysAfter: 2,
    remarks: "Duplicate registration detected for this child at another block facility.",
  },
  // 15. Bisfi PHC: Overdue
  {
    facility: "PRIMARI HEALTH CENTRE BISFI",
    childName: "Neha Sharma",
    gender: "Female",
    status: "PENDING_VERIFIER",
    daysAgo: 11,
  },
  // 16. Bisfi PHC: Rejected
  {
    facility: "PRIMARI HEALTH CENTRE BISFI",
    childName: "Divya Paswan",
    gender: "Female",
    status: "REJECTED_BY_VERIFIER",
    daysAgo: 5,
    verifiedDaysAfter: 2,
    remarks: "Applicant details incomplete - missing permanent residential address and informant declaration.",
  },
  // 17. Babubarhi PHC: On-track
  {
    facility: "PHC BABUBARHI MADHUBANI",
    childName: "Gaurav Choudhary",
    gender: "Male",
    status: "PENDING_VERIFIER",
    daysAgo: 2,
  },
  // 18. Babubarhi PHC: Applied on CRS
  {
    facility: "PHC BABUBARHI MADHUBANI",
    childName: "Kiran Kumari",
    gender: "Female",
    status: "APPLIED_ON_CRS",
    daysAgo: 4,
    verifiedDaysAfter: 1,
    remarks: "Applied on CRS Portal | Ack No: CRS-BR-2026-30219",
  },
  // 19. Rajnagar PHC: Overdue
  {
    facility: "PHC RAJNAGAR MADHUBANI",
    childName: "Mohit Das",
    gender: "Male",
    status: "PENDING_VERIFIER",
    daysAgo: 8,
  },
  // 20. Khutauna PHC: Completed
  {
    facility: "PHC KHUTAUNA MADHUBANI",
    childName: "Tanvi Roy",
    gender: "Female",
    status: "COMPLETED",
    daysAgo: 6,
    verifiedDaysAfter: 1,
    certificateUrl: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
    remarks: "Delivered at Khutauna PHC labor ward. Certificate generated.",
  },
];

async function seedSamples() {
  console.log("Seeding sample hospital monitoring data...");
  const now = new Date();

  for (let i = 0; i < SAMPLE_DATA.length; i++) {
    const item = SAMPLE_DATA[i];
    const created = new Date(now.getTime() - item.daysAgo * 24 * 60 * 60 * 1000);
    const updated = item.verifiedDaysAfter
      ? new Date(created.getTime() + item.verifiedDaysAfter * 24 * 60 * 60 * 1000)
      : created;

    const appNumber = `APP-2026-DEMO${String(i + 1).padStart(3, '0')}`;

    await prisma.application.upsert({
      where: { applicationNumber: appNumber },
      update: {
        facility: item.facility,
        status: item.status,
        certificateUrl: item.certificateUrl || null,
        remarks: item.remarks || null,
        createdAt: created,
        updatedAt: updated,
      },
      create: {
        applicationNumber: appNumber,
        facility: item.facility,
        status: item.status,
        certificateUrl: item.certificateUrl || null,
        remarks: item.remarks || null,
        createdAt: created,
        updatedAt: updated,
        child: {
          create: {
            name: item.childName,
            dateOfBirth: new Date(created.getTime() - 10 * 24 * 60 * 60 * 1000),
            gender: item.gender,
            adharNumber: "1234-5678-9012",
            weight: 3.1,
            placeOfBirth: "Hospital",
            birthVillage: "Madhubani",
            birthSubDistrict: "Madhubani",
            birthDistrict: "Madhubani",
            birthState: "Bihar",
            birthPinCode: "847211",
          }
        },
        parents: {
          create: {
            motherName: "Smt. Devi",
            motherAdhar: "4321-8765-2109",
            motherMobile: "9876543210",
            fatherName: "Shri Kumar",
            fatherAdhar: "9876-5432-1098",
            fatherMobile: "9876543211",
            presentVillage: "Madhubani",
            presentSubDistrict: "Madhubani",
            presentDistrict: "Madhubani",
            presentState: "Bihar",
            presentPinCode: "847211",
            permVillage: "Madhubani",
            permSubDistrict: "Madhubani",
            permDistrict: "Madhubani",
            permState: "Bihar",
            permPinCode: "847211",
          }
        },
        informant: {
          create: {
            name: "Shri Kumar",
            mobileNumber: "9876543210",
            providedInformation: true,
            informantVillage: "Madhubani",
            informantSubDistrict: "Madhubani",
            informantDistrict: "Madhubani",
            informantState: "Bihar",
            informantPinCode: "847211",
            motherCity: "Madhubani",
            motherSubDistrict: "Madhubani",
            motherDistrict: "Madhubani",
            motherState: "Bihar",
            motherPinCode: "847211",
            motherReligion: "Hindu",
            fatherReligion: "Hindu",
            declarationAccepted: true,
          }
        }
      }
    });
  }

  console.log("✅ Successfully seeded sample applications with realistic 7-day SLA variations!");
  await pool.end();
  process.exit(0);
}

seedSamples().catch(err => {
  console.error("Error seeding sample data:", err);
  pool.end();
  process.exit(1);
});
