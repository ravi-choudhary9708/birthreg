import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { hashPassword } from "@/libs/auth";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function PATCH(request, { params }) {
  try {
    const role = request.headers.get("x-user-role");
    if (role !== "operator") {
      throw new apiError(403, "Access denied. Only District Operators can modify verifiers.");
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive, password, authorityName, designation, contactNumber, email, facility } = body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });
    if (!existing || existing.role !== "verifier") {
      throw new apiError(404, "Verifier account not found");
    }

    const updateData = {};

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        throw new apiError(400, "Password must be at least 6 characters long");
      }
      updateData.password = await hashPassword(password.trim());
    }

    if (authorityName !== undefined) updateData.authorityName = authorityName?.trim() || null;
    if (designation !== undefined) updateData.designation = designation?.trim() || null;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (facility !== undefined && facility.trim()) updateData.facility = facility.trim();

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
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
    });

    const statusMsg =
      typeof isActive === "boolean"
        ? isActive
          ? `सत्यापनकर्ता '${updated.username}' को सफलतापूर्वक सक्रिय (Active) कर दिया गया है।`
          : `सत्यापनकर्ता '${updated.username}' को सफलतापूर्वक निष्क्रिय (Inactive) कर दिया गया है।`
        : "सत्यापनकर्ता का विवरण सफलतापूर्वक अद्यतन कर दिया गया।";

    return NextResponse.json(
      new apiResponse(200, updated, statusMsg),
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/admin/verifiers/[id] error:", error);
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update verifier account" },
      { status: statusCode }
    );
  }
}
