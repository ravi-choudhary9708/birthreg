import { NextResponse } from "next/server";
import { apiResponse } from "@/utils/apiResponse";

export async function POST() {
    const response = NextResponse.json(
        new apiResponse(200, null, "Logged out successfully"),
        { status: 200 }
    );

    response.cookies.set("auth_token", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
    });

    return response;
}
