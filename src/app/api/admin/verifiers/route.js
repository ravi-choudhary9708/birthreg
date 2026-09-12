import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { hashPassword } from "@/libs/auth";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function GET(request) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "operator") {
      throw new apiError(403, "Access denied. Only District Operators can manage verifiers.");
    }

    // Fetch all verifier accounts with retry on cold-start
    let verifiers;
    try {
      verifiers = await prisma.user.findMany({
        where: { role: "verifier" },
        select: {
          id: true,
          username: true,
          facility: true,
          role: true,
          isActive: true,
          authorityName: true,
          designation: true,
          contactNumber: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isActive: "desc" },
          { facility: "asc" },
        ],
      });
    } catch (dbErr) {
      console.warn("Retrying prisma.user.findMany on transient DB error:", dbErr.message);
      await new Promise((resolve) => setTimeout(resolve, 800));
      verifiers = await prisma.user.findMany({
        where: { role: "verifier" },
        select: {
          id: true,
          username: true,
          facility: true,
          role: true,
          isActive: true,
          authorityName: true,
          designation: true,
          contactNumber: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isActive: "desc" },
          { facility: "asc" },
        ],
      });
    }

    // Fetch application counts grouped by facility and status for operational workload metrics
    const statsByFacility = {};
    try {
      const appStats = await prisma.application.groupBy({
        by: ["facility", "status"],
        _count: { id: true },
      });

      for (const stat of appStats) {
        const fac = (stat.facility || "").trim().toUpperCase();
        if (!statsByFacility[fac]) {
          statsByFacility[fac] = {
            total: 0,
            pendingVerifier: 0,
            pendingOperator: 0,
            completed: 0,
            rejected: 0,
          };
        }
        const count = stat._count.id;
        statsByFacility[fac].total += count;
        if (stat.status === "PENDING_VERIFIER") statsByFacility[fac].pendingVerifier += count;
        else if (stat.status === "PENDING_OPERATOR") statsByFacility[fac].pendingOperator += count;
        else if (stat.status === "COMPLETED") statsByFacility[fac].completed += count;
        else if (stat.status === "REJECTED_BY_VERIFIER" || stat.status === "REJECTED_BY_OPERATOR") {
          statsByFacility[fac].rejected += count;
        }
      }
    } catch (statsErr) {
      console.warn("Application stats grouping warning (non-fatal):", statsErr.message);
    }

    const verifiersWithStats = verifiers.map((v) => {
      const facKey = (v.facility || "").trim().toUpperCase();
      const stats = statsByFacility[facKey] || {
        total: 0,
        pendingVerifier: 0,
        pendingOperator: 0,
        completed: 0,
        rejected: 0,
      };
      return {
        ...v,
        stats,
      };
    });

    return NextResponse.json(
      new apiResponse(200, verifiersWithStats, "Verifiers retrieved successfully"),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/verifiers error:", error);
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch verifiers" },
      { status: statusCode }
    );
  }
}

export async function POST(request) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "operator") {
      throw new apiError(403, "Access denied. Only District Operators can register new verifiers.");
    }

    const body = await request.json();
    const { username, password, facility, authorityName, designation, contactNumber, email } = body;

    if (!username || !username.trim()) {
      throw new apiError(400, "Username is required (उपयोगकर्ता नाम आवश्यक है)");
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      throw new apiError(400, "Username must be 3-30 lowercase characters (letters, numbers, underscores)");
    }

    if (!password || password.length < 6) {
      throw new apiError(400, "Password must be at least 6 characters long");
    }

    if (!facility || !facility.trim()) {
      throw new apiError(400, "Health facility selection is required");
    }

    if (!authorityName || !authorityName.trim()) {
      throw new apiError(400, "Name of the verification authority/officer is required");
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      throw new apiError(409, `Username '${cleanUsername}' is already taken. Please choose a different username.`);
    }

    const hashedPassword = await hashPassword(password);

    const newVerifier = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        facility: facility.trim(),
        role: "verifier",
        isActive: true,
        authorityName: authorityName.trim(),
        designation: designation?.trim() || "Facility Verification Officer / MOIC",
        contactNumber: contactNumber?.trim() || null,
        email: email?.trim() || null,
      },
      select: {
        id: true,
        username: true,
        facility: true,
        role: true,
        isActive: true,
        authorityName: true,
        designation: true,
        contactNumber: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      new apiResponse(201, newVerifier, "New verifier account created successfully"),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/verifiers error:", error);
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create verifier account" },
      { status: statusCode }
    );
  }
}
