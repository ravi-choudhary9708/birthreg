import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { hashPassword } from "@/libs/auth";

import { VERIFIER_ACCOUNTS } from "@/utils/constants";

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
