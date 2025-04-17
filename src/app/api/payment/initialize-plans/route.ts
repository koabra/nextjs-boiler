import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { initializeAllPlans, getAllPriceIds } from "@/lib/payment/plans";
import connectDB from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // This endpoint should only be accessible by administrators in production
    const session = await getServerSession(authOptions);

    // Verify user is authenticated and has admin privileges (implement your own admin check)
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to DB (necessary for some operations)
    await connectDB();

    // Initialize plans for all payment providers
    await initializeAllPlans();

    // Get current price IDs
    const priceIds = getAllPriceIds();

    return NextResponse.json(
      {
        message: "Payment plans initialized successfully",
        plans: priceIds,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error initializing payment plans:", error);
    return NextResponse.json(
      { message: `Error initializing payment plans: ${error.message}` },
      { status: 500 }
    );
  }
}
