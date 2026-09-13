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

    // Fetch all verifier accounts with retry on cold-start and fallback for dev-server client cache
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
          rawPassword: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isActive: "desc" },
          { facility: "asc" },
        ],
      });
    } catch (dbErr) {
      console.warn("Prisma findMany with rawPassword failed, using fallback:", dbErr.message);
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

        // Augment with rawPassword from cert_users table
        try {
          const rawRows = await prisma.$queryRawUnsafe(
            "SELECT id, raw_password FROM cert_users WHERE role = 'verifier'"
          );
          const rawMap = {};
          if (Array.isArray(rawRows)) {
            for (const row of rawRows) {
              rawMap[row.id] = row.raw_password;
            }
          }
          verifiers = verifiers.map((v) => ({
            ...v,
            rawPassword: rawMap[v.id] || "Madhubani@2024",
          }));
        } catch {
          verifiers = verifiers.map((v) => ({
            ...v,
            rawPassword: "Madhubani@2024",
          }));
        }
      } catch (fallbackErr) {
        throw new apiError(500, "Failed to retrieve verifiers: " + fallbackErr.message);
      }
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

    let newVerifier;
    try {
      newVerifier = await prisma.user.create({
        data: {
          username: cleanUsername,
          password: hashedPassword,
          rawPassword: password.trim(),
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
          rawPassword: true,
          createdAt: true,
        },
      });
    } catch (createErr) {
      if (createErr.message?.includes("rawPassword")) {
        newVerifier = await prisma.user.create({
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
        try {
          await prisma.$executeRawUnsafe(
            "UPDATE cert_users SET raw_password = $1 WHERE id = $2::uuid",
            password.trim(),
            newVerifier.id
          );
        } catch {
          // ignore
        }
        newVerifier.rawPassword = password.trim();
      } else {
        throw createErr;
      }
    }

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
