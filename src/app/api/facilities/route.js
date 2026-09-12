import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { apiResponse } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const block = searchParams.get("block")?.trim();
    const category = searchParams.get("category")?.trim();
    const search = searchParams.get("search")?.trim()?.toLowerCase();

    // Query all facilities ordered by sr asc
    const facilities = await prisma.facility.findMany({
      orderBy: { sr: "asc" },
    });

    if (!facilities || facilities.length === 0) {
      return NextResponse.json(
        new apiResponse(200, {
          facilities: [],
          counts: { ALL: 0, DH: 0, SDH: 0, CHC: 0, PHC: 0, HSC: 0 },
          blocks: [],
          total: 0,
        }, "No facilities found in database"),
        { status: 200 }
      );
    }

    // Compute category counts and block list from DB records
    const counts = {
      ALL: facilities.length,
      DH: facilities.filter((f) => f.categoryKey === "DH" || f.type === "DH").length,
      SDH: facilities.filter((f) => f.categoryKey === "SDH" || f.type === "SDH").length,
      CHC: facilities.filter((f) => f.categoryKey === "CHC" || f.type === "CHC").length,
      PHC: facilities.filter((f) => f.categoryKey === "PHC" || f.type === "PHC" || f.type === "APHC").length,
      HSC: facilities.filter((f) => f.categoryKey === "HSC" || f.type === "HSC" || f.type === "HWC" || f.type === "UHWC").length,
    };

    const blocks = Array.from(new Set(facilities.map((f) => f.block).filter(Boolean))).sort();

    // Apply filters if provided
    let filtered = facilities;
    if (category && category !== "ALL") {
      filtered = filtered.filter((f) => f.categoryKey === category);
    }
    if (block && block !== "ALL") {
      filtered = filtered.filter((f) => f.block.toLowerCase() === block.toLowerCase());
    }
    if (search) {
      filtered = filtered.filter((f) => {
        return (
          f.name?.toLowerCase().includes(search) ||
          f.block?.toLowerCase().includes(search) ||
          f.address?.toLowerCase().includes(search) ||
          f.pin?.includes(search) ||
          f.phone?.toLowerCase().includes(search) ||
          f.type?.toLowerCase().includes(search)
        );
      });
    }

    return NextResponse.json(
      new apiResponse(200, {
        facilities: filtered,
        counts,
        blocks,
        total: facilities.length,
        filteredCount: filtered.length,
      }, "Facilities retrieved successfully from database"),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching facilities from database:", error);
    return NextResponse.json(
      new apiResponse(500, null, "Failed to retrieve facilities from database"),
      { status: 500 }
    );
  }
}
