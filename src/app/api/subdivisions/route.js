import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { SUB_DIVISIONS_AND_BLOCKS } from "@/utils/subdivisions";

export async function GET() {
  try {
    const subDivisions = await prisma.subDivision.findMany({
      include: {
        blocks: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    if (subDivisions && subDivisions.length > 0) {
      return NextResponse.json({
        success: true,
        data: subDivisions,
      });
    }

    // Fallback to static master data
    return NextResponse.json({
      success: true,
      data: SUB_DIVISIONS_AND_BLOCKS,
    });
  } catch (error) {
    console.error("Failed to fetch subdivisions from database, returning fallback:", error);
    return NextResponse.json({
      success: true,
      data: SUB_DIVISIONS_AND_BLOCKS,
    });
  }
}
