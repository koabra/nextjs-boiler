import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import {
  createOrRetrieveCustomer,
  createOneTimeCheckoutSession,
} from "@/lib/stripe";
import connectDB from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to make a purchase" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { amount, name, description } = data;

    // Validate required fields
    if (!amount || !name) {
      return NextResponse.json(
        { message: "Amount and name are required" },
        { status: 400 }
      );
    }

    // Connect to DB
    await connectDB();

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
    const checkoutSession = await createOneTimeCheckoutSession({
      customerId,
      amount: parseInt(amount.toString(), 10),
      name,
      description: description || "",
      successUrl,
      cancelUrl,
    });

    // Return the checkout URL to redirect the user
    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: `Error creating checkout: ${error.message}` },
      { status: 500 }
    );
  }
}
