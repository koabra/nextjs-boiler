import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { stripe } from "@/lib/stripe";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";

// Define types for subscription data extracted from Stripe response
type StripeSubscriptionData = {
  id: string;
  status: string;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        metadata?: {
          planId?: string;
        };
      };
    }>;
  };
};

export async function POST() {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to sync subscription data" },
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

    // Find the PaymentCustomer record for Stripe
    const paymentCustomer = await PaymentCustomer.findOne({
      userId: user._id,
      provider: "stripe",
    });

    if (!paymentCustomer || !paymentCustomer.customerId) {
      return NextResponse.json(
        { message: "No Stripe customer ID found for this user" },
        { status: 400 }
      );
    }

    // Retrieve customer from Stripe with subscriptions expanded
    const customer = await stripe.customers.retrieve(
      paymentCustomer.customerId,
      {
        expand: ["subscriptions"],
      }
    );

    // Check if customer was deleted or is in an error state
    if (customer.deleted) {
      return NextResponse.json(
        { message: "Stripe customer has been deleted" },
        { status: 400 }
      );
    }

    // Get subscriptions from the customer object
    const customerWithSubscriptions = customer as unknown as {
      subscriptions?: { data: StripeSubscriptionData[] };
    };
    const subscriptions = customerWithSubscriptions.subscriptions?.data || [];

    // Find the active subscription, if any
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      // No active subscription found, but let's record the most recent subscription if present
      const mostRecentSubscription = subscriptions[0]; // Stripe returns most recent first

      if (mostRecentSubscription) {
        // Update PaymentCustomer with subscription information
        paymentCustomer.subscriptionId = mostRecentSubscription.id;
        paymentCustomer.subscriptionStatus = mostRecentSubscription.status;

        // Try to get the plan ID from metadata
        const item = mostRecentSubscription.items.data[0];
        if (item && item.price && item.price.metadata) {
          paymentCustomer.subscriptionPlan = item.price.metadata.planId || null;
        }

        // Make sure current_period_end is valid before creating Date
        if (mostRecentSubscription.current_period_end) {
          paymentCustomer.subscriptionCurrentPeriodEnd = new Date(
            mostRecentSubscription.current_period_end * 1000
          );
        }

        // Save the updated PaymentCustomer
        await paymentCustomer.save();

        return NextResponse.json({
          message: "Subscription sync completed - found inactive subscription",
          status: mostRecentSubscription.status,
          subscriptionId: mostRecentSubscription.id,
        });
      }

      // Save the PaymentCustomer even if no subscription was found
      await paymentCustomer.save();

      return NextResponse.json(
        { message: "No subscriptions found for this customer" },
        { status: 404 }
      );
    }

    // Update PaymentCustomer with active subscription data
    paymentCustomer.subscriptionId = activeSubscription.id;
    paymentCustomer.subscriptionStatus = activeSubscription.status;

    // Try to get the plan ID from metadata
    const item = activeSubscription.items.data[0];
    if (item && item.price && item.price.metadata) {
      paymentCustomer.subscriptionPlan = item.price.metadata.planId || null;
    }

    // Make sure current_period_end is valid before creating Date
    if (activeSubscription.current_period_end) {
      paymentCustomer.subscriptionCurrentPeriodEnd = new Date(
        activeSubscription.current_period_end * 1000
      );
    }

    // Save the updated PaymentCustomer
    await paymentCustomer.save();

    return NextResponse.json({
      message: "Subscription sync completed successfully",
      status: activeSubscription.status,
      subscriptionId: activeSubscription.id,
      subscriptionPlan: paymentCustomer.subscriptionPlan,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Subscription sync error:", errorMessage);
    return NextResponse.json(
      { message: `Error syncing subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}
