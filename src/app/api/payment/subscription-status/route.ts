import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getProviderForUser } from "@/lib/payment";
import { getSubscriptionPlan } from "@/config/subscriptionPlans";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to access subscription status" },
        { status: 401 }
      );
    }

    // Connect to DB
    await connectDB();

    // Find the user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Find all payment customers for this user
    const paymentCustomers = await PaymentCustomer.find({
      userId: user._id,
    }).sort({ updatedAt: -1 }); // Sort by most recently updated

    // Look for active subscriptions first
    const activeCustomer = paymentCustomers.find(
      (pc) =>
        pc.subscriptionStatus === "active" ||
        pc.subscriptionStatus === "trialing"
    );

    // If we have an active customer, return their subscription
    if (activeCustomer) {
      const planDetails = getSubscriptionPlan(activeCustomer.subscriptionPlan);

      return NextResponse.json({
        hasActiveSubscription: true,
        provider: activeCustomer.provider,
        subscriptionId: activeCustomer.subscriptionId,
        status: activeCustomer.subscriptionStatus,
        plan: activeCustomer.subscriptionPlan,
        planDetails: planDetails,
        currentPeriodEnd: activeCustomer.subscriptionCurrentPeriodEnd,
      });
    }

    // If no active subscription, return the most recent one if it exists
    if (paymentCustomers.length > 0) {
      const recentCustomer = paymentCustomers[0];
      const planDetails = getSubscriptionPlan(recentCustomer.subscriptionPlan);

      return NextResponse.json({
        hasActiveSubscription: false,
        provider: recentCustomer.provider,
        subscriptionId: recentCustomer.subscriptionId,
        status: recentCustomer.subscriptionStatus,
        plan: recentCustomer.subscriptionPlan,
        planDetails: planDetails,
        currentPeriodEnd: recentCustomer.subscriptionCurrentPeriodEnd,
      });
    }

    // No subscription found at all
    return NextResponse.json({
      hasActiveSubscription: false,
      provider: null,
      subscriptionId: null,
      status: null,
      plan: null,
      planDetails: null,
      currentPeriodEnd: null,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error getting subscription status:", errorMessage);
    return NextResponse.json(
      { message: `Error getting subscription status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
