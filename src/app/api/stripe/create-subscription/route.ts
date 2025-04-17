import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  createOrRetrieveCustomer,
  createSubscriptionCheckoutSession,
} from "@/lib/stripe";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { ensureStripePlansInitialized } from "@/lib/stripe-plans";
import connectDB from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to subscribe" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { planId, trialDays = 0 } = data;

    // Validate plan ID
    if (!planId || !subscriptionPlans[planId]) {
      return NextResponse.json(
        { message: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Ensure all Stripe plans are initialized with price IDs
    await ensureStripePlansInitialized();

    // Check if the plan has a valid price ID after initialization
    const plan = subscriptionPlans[planId];
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { message: "Plan is not properly configured with Stripe" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customerId = await createOrRetrieveCustomer(
      session.user.id,
      session.user.email || "",
      session.user.name || ""
    );

    // Prepare success and cancel URLs with the domain from the request
    const baseUrl = new URL(request.url).origin;
    const successUrl = `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/billing/cancel`;

    // Create checkout session
    const checkoutSession = await createSubscriptionCheckoutSession({
      customerId,
      plan,
      successUrl,
      cancelUrl,
      trial: trialDays > 0,
      trialDays,
    });

    // Return the checkout URL to redirect the user
    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { message: `Error creating subscription: ${error.message}` },
      { status: 500 }
    );
  }
}
