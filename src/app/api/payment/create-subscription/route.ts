import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { getProviderForUser, getPaymentProvider } from "@/lib/payment";
import { PaymentProviderName } from "@/interfaces/PaymentProvider";
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
    const { planId, trialDays = 0, providerName } = data;

    // Validate plan ID
    if (!planId || !subscriptionPlans[planId]) {
      return NextResponse.json(
        { message: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

    // Get the payment provider - use specified provider or get the appropriate one for the user
    let paymentProvider;
    if (providerName) {
      paymentProvider = getPaymentProvider(providerName as PaymentProviderName);
    } else {
      paymentProvider = await getProviderForUser(session.user.id);
    }

    // Get the plan
    const plan = subscriptionPlans[planId];

    // Create or retrieve customer with the payment provider
    const customerId = await paymentProvider.createCustomer(
      session.user.id,
      session.user.email || "",
      session.user.name || ""
    );

    // Prepare success and cancel URLs with the domain from the request
    const baseUrl = new URL(request.url).origin;
    const successUrl = `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/billing/cancel`;

    // Create checkout session
    const checkoutSession = await paymentProvider.createSubscriptionCheckout({
      customerId,
      plan,
      successUrl,
      cancelUrl,
      trial: trialDays > 0,
      trialDays,
    });

    // Return the checkout URL and provider used
    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      provider: paymentProvider.name,
    });
  } catch (error: any) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { message: `Error creating subscription: ${error.message}` },
      { status: 500 }
    );
  }
}
