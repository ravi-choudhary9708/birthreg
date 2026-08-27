import { NextResponse } from "next/server";
import dbConnect from "@/libs/dbConnect";
import { Application } from "@/models/application.model";
import { apiResponse } from "@/utils/apiResponse";
import { apiError } from "@/utils/apiError";

export async function GET(request) {
    try {
        await dbConnect();

        const role = request.headers.get("x-user-role");
        const facility = request.headers.get("x-user-facility");

        let query = {};

        if (role === "verifier") {
            // Verifier sees all applications for their facility
            query = { facility: facility };
        } else if (role === "operator") {
            // Central operator sees all applications that have been verified
            query = {
                status: { $in: ["PENDING_OPERATOR", "APPLIED_ON_CSC", "COMPLETED", "REJECTED_BY_OPERATOR"] }
            };
        } else {
            throw new apiError(403, "Access denied");
        }

        const sortQuery = role === "verifier" ? { createdAt: 1 } : { createdAt: -1 };

        const applications = await Application.find(query)
            .sort(sortQuery);

        return NextResponse.json(
            new apiResponse(200, applications, "Applications fetched successfully"),
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
