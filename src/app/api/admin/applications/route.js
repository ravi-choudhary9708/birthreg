import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { serializeApplication, applicationIncludeRelations } from "@/libs/applicationSerializer";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function GET(request) {
    try {
        const role = request.headers.get("x-user-role");
        const facility = request.headers.get("x-user-facility");
        const { searchParams } = new URL(request.url);
        const facilityFilter = searchParams.get("facility");
        const statusFilter = searchParams.get("status");
        const querySearch = searchParams.get("q");

        let where = {};

        if (role === "verifier") {
            const userId = request.headers.get("x-user-id");
            if (userId) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { isActive: true },
                });
                if (user && user.isActive === false) {
                    return NextResponse.json(
                        { success: false, message: "Your verifier account has been deactivated by Operator Central." },
                        { status: 401 }
                    );
                }
            }

            // Verifier strictly sees only applications for their assigned facility (case-insensitive)
            where = {
                facility: {
                    equals: facility || "",
                    mode: "insensitive",
                }
            };
            if (statusFilter && statusFilter !== "ALL") {
                where.status = statusFilter;
            }
        } else if (role === "operator") {
            // Central operator has district-wide supervisory audit access across all 39 facilities
            where = {};
            if (facilityFilter && facilityFilter !== "ALL") {
                where.facility = {
                    equals: facilityFilter,
                    mode: "insensitive",
                };
            }
            if (statusFilter && statusFilter !== "ALL") {
                where.status = statusFilter;
            }
        } else {
            throw new apiError(403, "Access denied");
        }

        if (querySearch && querySearch.trim()) {
            const q = querySearch.trim();
            where.OR = [
                { applicationNumber: { contains: q, mode: "insensitive" } },
                { child: { name: { contains: q, mode: "insensitive" } } },
                { informant: { name: { contains: q, mode: "insensitive" } } },
            ];
        }

        const orderBy = {
            createdAt: role === "verifier" ? "asc" : "desc"
        };

        let rawApplications;
        try {
            rawApplications = await prisma.application.findMany({
                where,
                orderBy,
                include: applicationIncludeRelations,
            });
        } catch (dbErr) {
            console.warn("Retrying prisma.application.findMany on transient DB error:", dbErr.message);
            await new Promise((resolve) => setTimeout(resolve, 800));
            rawApplications = await prisma.application.findMany({
                where,
                orderBy,
                include: applicationIncludeRelations,
            });
        }

        const applications = rawApplications.map(serializeApplication);

        return NextResponse.json(
            new apiResponse(200, {
                applications,
                facility: facility || "",
                role,
            }, "Applications fetched successfully"),
            { status: 200 }
        );

    } catch (error) {
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
            { success: false, message: error.message },
            { status: statusCode }
        );
    }
}
