import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { FACILITIES } from "@/utils/constants";
import { apiResponse } from "@/utils/apiResponse";

export async function GET() {
  try {
    const [verifiers, dbFacilities] = await Promise.all([
      prisma.user.findMany({
        where: { role: "verifier" },
        select: {
          facility: true,
          isActive: true,
        },
      }),
      prisma.facility.findMany({
        select: { name: true },
      }),
    ]);

    const facilityList =
      dbFacilities && dbFacilities.length > 0
        ? dbFacilities.map((f) => f.name)
        : FACILITIES;

    const facilityStatusMap = {};

    for (const fac of facilityList) {
      facilityStatusMap[fac] = {
        name: fac,
        isActive: true,
        hasVerifiers: false,
        activeVerifiersCount: 0,
        totalVerifiersCount: 0,
      };
    }

    for (const v of verifiers) {
      const facName = v.facility?.trim();
      if (!facName) continue;

      if (!facilityStatusMap[facName]) {
        facilityStatusMap[facName] = {
          name: facName,
          isActive: true,
          hasVerifiers: true,
          activeVerifiersCount: 0,
          totalVerifiersCount: 0,
        };
      }

      facilityStatusMap[facName].hasVerifiers = true;
      facilityStatusMap[facName].totalVerifiersCount += 1;
      if (v.isActive) {
        facilityStatusMap[facName].activeVerifiersCount += 1;
      }
    }

    // A facility is inactive if it has verifiers and NONE of them are active
    for (const facName of Object.keys(facilityStatusMap)) {
      const item = facilityStatusMap[facName];
      if (item.hasVerifiers && item.activeVerifiersCount === 0) {
        item.isActive = false;
        item.reason = "अस्पताल सत्यापन इकाई निष्क्रिय है (Facility verification unit is inactive)";
      }
    }

    return NextResponse.json(
      new apiResponse(200, facilityStatusMap, "Facility status retrieved successfully"),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/facilities/status error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch facility status" },
      { status: 500 }
    );
  }
}
