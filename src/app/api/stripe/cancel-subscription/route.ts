import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { cancelSubscription } from "@/lib/stripe";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";

// Define interface for better type safety
interface CancelledSubscriptionResponse {
  id: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to cancel a subscription" },
        { status: 401 }
      );
    }

    // Connect to DB
    await connectDB();

    // Get the user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Find the active payment customer record
    const activeCustomer = await PaymentCustomer.findOne({
      userId: user._id,
      subscriptionStatus: "active",
    });

    // If no active subscription found
    if (!activeCustomer) {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 400 }
      );
    }

    // Verify the subscription exists
    if (!activeCustomer.subscriptionId) {
      return NextResponse.json(
        { message: "No subscription ID found for this customer" },
        { status: 400 }
      );
    }

    // Cancel subscription at period end
    const canceledSubscription = await cancelSubscription(
      activeCustomer.subscriptionId
    );

    // Extract relevant fields for response
    const responseData: CancelledSubscriptionResponse = {
      id: canceledSubscription.id,
      status: canceledSubscription.status,
      provider: activeCustomer.provider,
    };

    // Add optional fields if they exist
    if ("current_period_end" in canceledSubscription) {
      responseData.current_period_end = (
        canceledSubscription as any
      ).current_period_end;
    }
    if ("cancel_at_period_end" in canceledSubscription) {
      responseData.cancel_at_period_end = (
        canceledSubscription as any
      ).cancel_at_period_end;
    }

    // Update payment customer record
    activeCustomer.subscriptionStatus = "canceled";
    await activeCustomer.save();

    return NextResponse.json({
      message: "Subscription canceled successfully",
      subscription: responseData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Subscription cancellation error:", errorMessage);
    return NextResponse.json(
      { message: `Error canceling subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}
