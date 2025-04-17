import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSubscription } from "@/lib/stripe";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getSubscriptionPlan } from "@/config/subscriptionPlans";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to view subscription status" },
        { status: 401 }
      );
    }

    // Connect to DB
    await connectDB();

    // Get user with subscription details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("User subscription data:", {
      userId: user._id,
      stripeCustomerId: user.stripeCustomerId,
      subscriptionId: user.subscriptionId,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
    });

    // Get subscription details
    let stripeSubscription = null;
    if (user.subscriptionId && user.subscriptionStatus === "active") {
      try {
        stripeSubscription = await getSubscription(user.subscriptionId);
        console.log("Stripe subscription retrieved:", stripeSubscription.id);
      } catch (error) {
        console.error("Error fetching subscription from Stripe:", error);
        // Continue without Stripe data - use DB cached data
      }
    } else if (user.subscriptionId) {
      console.log(
        "User has subscriptionId but status is not active:",
        user.subscriptionStatus
      );
    } else if (user.stripeCustomerId) {
      console.log("User has stripeCustomerId but no subscriptionId");

      // Let's try to retrieve customer information from Stripe
      try {
        const { stripe } = await import("@/lib/stripe");
        const customer = await stripe.customers.retrieve(
          user.stripeCustomerId,
          {
            expand: ["subscriptions"],
          }
        );
        console.log("Stripe customer retrieved:", {
          id: customer.id,
          hasSubscriptions: !!(customer as any).subscriptions?.data?.length,
        });
      } catch (error) {
        console.error("Error fetching customer from Stripe:", error);
      }
    }

    // Get plan details
    const plan = getSubscriptionPlan(user.subscriptionPlan);

    return NextResponse.json({
      status: user.subscriptionStatus || null,
      plan: user.subscriptionPlan || null,
      planDetails: plan,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
      stripeSubscription: stripeSubscription
        ? {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_end: stripeSubscription.current_period_end,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { message: `Error fetching subscription status: ${error.message}` },
      { status: 500 }
    );
  }
}
