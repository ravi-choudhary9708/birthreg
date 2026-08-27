import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { User } from "@/models/user.model";

// Facility list for verifiers
const VERIFIER_ACCOUNTS = [
  { username: "verifier_sadar", facility: "Sadar Hospital Madhubani" },
  { username: "verifier_pandaul", facility: "PHC Pandaul" },
  { username: "verifier_kaluahi", facility: "PHC Kaluahi" },
  { username: "verifier_babubarhi", facility: "PHC Babubarhi" },
  { username: "verifier_jhanjharpur", facility: "PHC Jhanjharpur" },
  { username: "verifier_khajauli", facility: "PHC Khajauli" },
  { username: "verifier_benipatti", facility: "PHC Benipatti" },
  { username: "verifier_madhwapur", facility: "PHC Madhwapur" },
  { username: "verifier_madhepur", facility: "PHC Madhepur" },
  { username: "verifier_ladaniya", facility: "CHC Ladaniya" },
  { username: "verifier_jaynagar", facility: "CHC Jaynagar" },
  { username: "verifier_khutauna", facility: "CHC Khutauna" },
  { username: "verifier_bisffi", facility: "CHC Bisffi" },
  { username: "verifier_ghoghardiha", facility: "CHC Ghoghardiha" },
  { username: "verifier_phulparas", facility: "CHC Phulparas" },
  { username: "verifier_rajnagar", facility: "CHC Rajnagar" },
  { username: "verifier_basopatti", facility: "CHC Basopatti" },
  { username: "verifier_andhrarthari", facility: "CHC Andhrarthari" },
  { username: "verifier_harlakhi", facility: "CHC Harlakhi" },
  { username: "verifier_laukahi", facility: "CHC Laukahi" },
  { username: "verifier_rahika", facility: "CHC Rahika" },
  { username: "verifier_sdh_benipatti", facility: "Sub-Divisional Hospital Benipatti" },
  { username: "verifier_sdh_jhanjharpur", facility: "Sub-Divisional Hospital Jhanjharpur" },
  { username: "verifier_sdh_phulparas", facility: "Sub-Divisional Hospital Phulparas" },
  { username: "verifier_rh_madhepur", facility: "Referral Hospital Madhepur" },
];

export async function GET() {
  try {
    await dbConnect();

    const operatorExists = await User.findOne({ username: "operator_central" });
    if (operatorExists) {
      return NextResponse.json({
        message: `Users already seeded. Skipping seed.`,
      });
    }

    const defaultPassword = "Madhubani@2024";
    const createdUsers = [];

    // Create one Verifier per facility
    for (const v of VERIFIER_ACCOUNTS) {
      await User.create({ ...v, password: defaultPassword, role: "verifier" });
      createdUsers.push(v.username);
    }

    // Create one central Operator
    await User.create({
      username: "operator_central",
      password: defaultPassword,
      role: "operator",
      facility: "Central Operator",
    });
    createdUsers.push("operator_central");

    return NextResponse.json({
      message: `✅ Seeded ${createdUsers.length} accounts successfully!`,
      defaultPassword,
      accounts: createdUsers,
      warning: "⚠️ Please change the default passwords immediately after first login!",
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
