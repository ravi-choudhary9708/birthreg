import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { hashPassword } from "@/libs/auth";

const VERIFIER_ACCOUNTS = [
  { username: "verifier_rh_andhrathari", facility: "REFERRAL HOSPITAL ANDHRATHARI" },
  { username: "verifier_phc_andhrathadhi", facility: "PHC ANDHRATHADHI" },
  { username: "verifier_phc_babubarhi", facility: "PHC BABUBARHI" },
  { username: "verifier_chc_babubarhi", facility: "CHC BABUBARHI" },
  { username: "verifier_phc_basopatti", facility: "PRIMARY HEALTH CENTRE BASOPATTI" },
  { username: "verifier_phc_benipatti", facility: "PHC BENIPATTI MADHUBANI" },
  { username: "verifier_phc_bisfi", facility: "PRIMARI HEALTH CENTRE BISFI" },
  { username: "verifier_chc_bisfi", facility: "CHC BISFI" },
  { username: "verifier_phc_ghoghardiha", facility: "PHC GHOGHARDIHA" },
  { username: "verifier_phc_harlakhi", facility: "PHC HARLAKHI" },
  { username: "verifier_chc_harlakhi", facility: "CHC HARLAKHI" },
  { username: "verifier_sdh_jaynagar", facility: "SUB DIVISIONAL HOSPITAL, JAYNAGAR" },
  { username: "verifier_phc_jaynagar", facility: "PRIMARY HEALTH CENTRE JAYNAGAR" },
  { username: "verifier_sdh_jhanjharpur", facility: "SUPRITENDENT SUB DIVISIONAL HOSPITAL JHANJHARPUR" },
  { username: "verifier_phc_jhanjharpur", facility: "PRIMARY HEALTH CENTRE JHANJHARPUR" },
  { username: "verifier_phc_kaluahi", facility: "PHC KALUAHI" },
  { username: "verifier_chc_kaluahi", facility: "CHC KALUAHI" },
  { username: "verifier_phc_khajauli", facility: "PRIMARY HEALTH CENTRE KHAJAULI" },
  { username: "verifier_chc_khajauli", facility: "CHC KHAJAULI" },
  { username: "verifier_phc_khutauna", facility: "PHC KHUTAUNA" },
  { username: "verifier_chc_khutauna", facility: "CHC KHUTAUNA" },
  { username: "verifier_phc_ladania", facility: "PRIMARY HEALTH CENTRE LADANIA" },
  { username: "verifier_chc_ladania", facility: "CHC LADANIA" },
  { username: "verifier_phc_lakhnaur", facility: "PRIMARY HEALTH CENTRE LAKHNAUR" },
  { username: "verifier_chc_lakhnaur", facility: "CHC LAKHNAUR" },
  { username: "verifier_phc_laukahi", facility: "PHC LAUKAHI MADHUBANI" },
  { username: "verifier_chc_laukahi", facility: "CHC LAUKAHI" },
  { username: "verifier_phc_madhepur", facility: "PRIMARY HEALTH CENTRE MADHEPUR" },
  { username: "verifier_sadar", facility: "SADAR HOSPITAL MADHUBANI" },
  { username: "verifier_phc_madhwapur", facility: "PRIMARY HEALTH CENTRE MADHWAPUR" },
  { username: "verifier_chc_madhwapur", facility: "CHC MADHWAPUR" },
  { username: "verifier_aphc_mahrail", facility: "APHC MAHRAIL" },
  { username: "verifier_phc_pandaul", facility: "PRIMARY HEALTH CENTRE PANDAUL" },
  { username: "verifier_sdh_phulparas", facility: "SUPRITENDENT SUB DIVISIONAL HOSPITAL PHULPARAS" },
  { username: "verifier_phc_phulparas", facility: "PRIMARY HEALTH CENTRE PHULPARAS" },
  { username: "verifier_phc_rahika", facility: "PRIMARY HEALTH CENTER RAHIKA" },
  { username: "verifier_chc_rahika", facility: "CHC RAHIKA" },
  { username: "verifier_phc_rajnagar", facility: "PRIMARY HEALTH CENTRE RAJNAGAR" },
  { username: "verifier_chc_rajnagar", facility: "CHC RAJNAGAR" },
];

export async function GET() {
  try {
    const defaultPassword = "Madhubani@2024";
    const hashedPassword = await hashPassword(defaultPassword);
    const processedUsers = [];

    // Create or update one Verifier per facility in PostgreSQL
    for (const v of VERIFIER_ACCOUNTS) {
      await prisma.user.upsert({
        where: { username: v.username },
        update: { facility: v.facility },
        create: {
          username: v.username,
          facility: v.facility,
          role: "verifier",
          password: hashedPassword,
        },
      });
      processedUsers.push(v.username);
    }

    // Ensure central Operator exists in PostgreSQL
    await prisma.user.upsert({
      where: { username: "operator_central" },
      update: { facility: "Central Operator" },
      create: {
        username: "operator_central",
        facility: "Central Operator",
        role: "operator",
        password: hashedPassword,
      },
    });
    processedUsers.push("operator_central");

    return NextResponse.json({
      message: `✅ Seeded ${processedUsers.length} accounts in PostgreSQL successfully!`,
      defaultPassword,
      accounts: processedUsers,
      warning: "⚠️ Please change the default passwords immediately after first login!",
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
