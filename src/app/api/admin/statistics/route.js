import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { FACILITIES } from "@/utils/constants";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function GET(request) {
    try {
        const role = request.headers.get("x-user-role");
        if (role !== "operator") {
            throw new apiError(403, "Access restricted to Operator Central only");
        }

        // Fetch all applications
        const applications = await prisma.application.findMany({
            select: {
                id: true,
                applicationNumber: true,
                facility: true,
                status: true,
                remarks: true,
                createdAt: true,
                updatedAt: true,
                child: {
                    select: {
                        name: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const now = new Date();
        const SLA_DAYS = 7;
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        // Fetch all facilities from database
        const dbFacilities = await prisma.facility.findMany({ select: { name: true } });
        const allFacilityNames = dbFacilities && dbFacilities.length > 0 ? dbFacilities.map((f) => f.name) : FACILITIES;

        // Initialize map for facilities
        const facilityStatsMap = {};
        for (const fac of allFacilityNames) {
            facilityStatsMap[fac.toUpperCase()] = {
                facility: fac,
                totalReceived: 0,
                pendingVerifier: 0,
                overdueVerifier: 0, // > 7 days pending
                onTrackVerifier: 0, // <= 7 days pending
                verifiedCount: 0,
                verifiedWithinSLA: 0,
                verifiedLate: 0,
                verifiedAwaitingCRS: 0,
                appliedCRSCount: 0,
                rejectedCount: 0,
                completedCount: 0,
                totalTurnaroundDays: 0,
                rejections: [],
                overdueApplications: [],
            };
        }

        let totalApplications = applications.length;
        let totalPendingVerifier = 0;
        let totalOverdueVerifier = 0;
        let totalOnTrackVerifier = 0;
        let totalPendingOperator = 0;
        let totalAppliedCRS = 0;
        let totalCompleted = 0;
        let totalRejected = 0;

        // 7-day SLA Aging Buckets
        const agingBuckets = {
            "0-2 Days": 0,
            "3-5 Days": 0,
            "6-7 Days": 0,
            "8-14 Days (Overdue)": 0,
            "> 14 Days (Critical)": 0,
        };

        for (const app of applications) {
            const facKey = (app.facility || "OTHER").toUpperCase();
            if (!facilityStatsMap[facKey]) {
                facilityStatsMap[facKey] = {
                    facility: app.facility,
                    totalReceived: 0,
                    pendingVerifier: 0,
                    overdueVerifier: 0,
                    onTrackVerifier: 0,
                    verifiedCount: 0,
                    verifiedWithinSLA: 0,
                    verifiedLate: 0,
                    verifiedAwaitingCRS: 0,
                    appliedCRSCount: 0,
                    rejectedCount: 0,
                    completedCount: 0,
                    totalTurnaroundDays: 0,
                    rejections: [],
                    overdueApplications: [],
                };
            }

            const fac = facilityStatsMap[facKey];
            fac.totalReceived += 1;

            const createdTime = new Date(app.createdAt).getTime();
            const ageInDays = Math.max(0, Math.floor((now.getTime() - createdTime) / MS_PER_DAY));

            if (app.status === "PENDING_VERIFIER") {
                totalPendingVerifier += 1;
                fac.pendingVerifier += 1;

                if (ageInDays > SLA_DAYS) {
                    totalOverdueVerifier += 1;
                    fac.overdueVerifier += 1;
                    fac.overdueApplications.push({
                        applicationNumber: app.applicationNumber,
                        daysPending: ageInDays,
                        createdAt: app.createdAt,
                    });
                } else {
                    totalOnTrackVerifier += 1;
                    fac.onTrackVerifier += 1;
                }

                // Aging distribution
                if (ageInDays <= 2) agingBuckets["0-2 Days"] += 1;
                else if (ageInDays <= 5) agingBuckets["3-5 Days"] += 1;
                else if (ageInDays <= 7) agingBuckets["6-7 Days"] += 1;
                else if (ageInDays <= 14) agingBuckets["8-14 Days (Overdue)"] += 1;
                else agingBuckets["> 14 Days (Critical)"] += 1;
            } else {
                // Application has been processed by verifier
                const updatedTime = new Date(app.updatedAt).getTime();
                const turnaroundDays = Math.max(0, (updatedTime - createdTime) / MS_PER_DAY);
                fac.totalTurnaroundDays += turnaroundDays;

                if (app.status === "REJECTED_BY_VERIFIER" || app.status === "REJECTED_BY_OPERATOR") {
                    totalRejected += 1;
                    fac.rejectedCount += 1;
                    fac.rejections.push({
                        id: app.id,
                        applicationNumber: app.applicationNumber,
                        childName: app.child?.name || "N/A",
                        reason: app.remarks || "No reason recorded",
                        status: app.status,
                        date: app.updatedAt,
                    });
                } else {
                    fac.verifiedCount += 1;
                    if (turnaroundDays <= SLA_DAYS) {
                        fac.verifiedWithinSLA += 1;
                    } else {
                        fac.verifiedLate += 1;
                    }

                    if (app.status === "PENDING_OPERATOR") {
                        totalPendingOperator += 1;
                        fac.verifiedAwaitingCRS += 1;
                    } else if (app.status === "APPLIED_ON_CRS" || app.status === "APPLIED_ON_CSC") {
                        totalAppliedCRS += 1;
                        fac.appliedCRSCount += 1;
                    } else if (app.status === "COMPLETED") {
                        totalCompleted += 1;
                        fac.completedCount += 1;
                    }
                }
            }
        }

        // Calculate averages and SLA compliance rates per facility
        const facilityList = Object.values(facilityStatsMap).map(f => {
            const processed = f.verifiedCount + f.rejectedCount;
            const avgDays = processed > 0 ? (f.totalTurnaroundDays / processed).toFixed(1) : "—";
            const complianceRate = (f.totalReceived > 0)
                ? Math.max(0, Math.round(((f.totalReceived - f.overdueVerifier) / f.totalReceived) * 100))
                : 100;

            let alertLevel = "COMPLIANT";
            if (f.overdueVerifier > 0) {
                alertLevel = f.overdueVerifier >= 3 ? "CRITICAL" : "WARNING";
            } else if (f.pendingVerifier > 0) {
                alertLevel = "IN_PROGRESS";
            }

            return {
                facility: f.facility,
                totalReceived: f.totalReceived,
                pendingVerifier: f.pendingVerifier,
                overdueVerifier: f.overdueVerifier,
                onTrackVerifier: f.onTrackVerifier,
                verifiedCount: f.verifiedCount,
                verifiedAwaitingCRS: f.verifiedAwaitingCRS,
                appliedCRSCount: f.appliedCRSCount,
                rejectedCount: f.rejectedCount,
                completedCount: f.completedCount,
                avgTurnaroundDays: avgDays,
                complianceRate,
                alertLevel,
                rejections: f.rejections,
                overdueApplications: f.overdueApplications.slice(0, 5),
            };
        });

        // Sort: Facilities with overdue verifications first, then by total received
        facilityList.sort((a, b) => {
            if (b.overdueVerifier !== a.overdueVerifier) {
                return b.overdueVerifier - a.overdueVerifier;
            }
            if (b.pendingVerifier !== a.pendingVerifier) {
                return b.pendingVerifier - a.pendingVerifier;
            }
            return b.totalReceived - a.totalReceived;
        });

        // Summary metrics
        const districtComplianceRate = totalApplications > 0
            ? Math.round(((totalApplications - totalOverdueVerifier) / totalApplications) * 100)
            : 100;

        const hospitalsWithBacklog = facilityList.filter(f => f.overdueVerifier > 0).length;
        const hospitalsCompliant = facilityList.length - hospitalsWithBacklog;

        // Daily trend for last 14 days
        const last14Days = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            last14Days.push({ date: dateStr, label, received: 0, verified: 0, completed: 0 });
        }

        const dateMap = {};
        last14Days.forEach(item => { dateMap[item.date] = item; });

        for (const app of applications) {
            const cDate = new Date(app.createdAt).toISOString().split("T")[0];
            if (dateMap[cDate]) {
                dateMap[cDate].received += 1;
            }
            if (app.status !== "PENDING_VERIFIER") {
                const uDate = new Date(app.updatedAt).toISOString().split("T")[0];
                if (dateMap[uDate]) {
                    dateMap[uDate].verified += 1;
                    if (app.status === "COMPLETED") {
                        dateMap[uDate].completed += 1;
                    }
                }
            }
        }

        return NextResponse.json(
            new apiResponse(200, {
                summary: {
                    totalApplications,
                    totalPendingVerifier,
                    totalOverdueVerifier,
                    totalOnTrackVerifier,
                    totalPendingOperator,
                    totalAppliedCRS,
                    totalCompleted,
                    totalRejected,
                    districtComplianceRate,
                    totalHospitals: facilityList.length,
                    hospitalsWithBacklog,
                    hospitalsCompliant,
                    slaDaysLimit: SLA_DAYS,
                },
                facilities: facilityList,
                agingBuckets: Object.entries(agingBuckets).map(([range, count]) => ({ range, count })),
                statusDistribution: [
                    { name: "Verified (<=7d)", value: totalApplications - totalPendingVerifier - totalRejected, color: "#10b981" },
                    { name: "On-Track Pending (<=7d)", value: totalOnTrackVerifier, color: "#3b82f6" },
                    { name: "Delayed / Overdue (>7d)", value: totalOverdueVerifier, color: "#ef4444" },
                    { name: "Rejected", value: totalRejected, color: "#9ca3af" },
                ].filter(d => d.value > 0),
                trend: last14Days,
            }, "Statistics fetched successfully"),
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
