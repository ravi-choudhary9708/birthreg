import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { MADHUBANI_POST_OFFICES, getPostOfficesForPincode } from "@/utils/postOffices";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode")?.trim();

    if (!prisma?.postOffice) {
      const fallbackData = pincode
        ? getPostOfficesForPincode(pincode)
        : MADHUBANI_POST_OFFICES;
      return NextResponse.json({
        success: true,
        data: fallbackData,
      });
    }

    const where = pincode ? { pincode } : undefined;
    const postOffices = await prisma.postOffice.findMany({
      where,
      orderBy: { name: "asc" },
    });

    if (postOffices && postOffices.length > 0) {
      return NextResponse.json({
        success: true,
        data: postOffices,
      });
    }

    // Fallback if table was empty
    const fallbackData = pincode
      ? getPostOfficesForPincode(pincode)
      : MADHUBANI_POST_OFFICES;
    return NextResponse.json({
      success: true,
      data: fallbackData,
    });
  } catch (error) {
    console.error("Failed to fetch post offices from database, using fallback:", error);
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get("pincode")?.trim();
    const fallbackData = pincode
      ? getPostOfficesForPincode(pincode)
      : MADHUBANI_POST_OFFICES;
    return NextResponse.json({
      success: true,
      data: fallbackData,
    });
  }
}
