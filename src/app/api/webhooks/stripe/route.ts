import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentCustomer, { IPaymentCustomer } from "@/models/PaymentCustomer";
import Stripe from "stripe";

// Define interface for better type safety
interface SubscriptionWithPeriodEnd extends Stripe.Subscription {
  current_period_end: number;
}

// Function to handle subscription created or updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get customer ID from the subscription
    const customerId = subscription.customer as string;

    // Find the PaymentCustomer with this customer ID
    const paymentCustomer = await PaymentCustomer.findOne({
      customerId: customerId,
      provider: "stripe",
    });

    if (!paymentCustomer) {
      console.error(
        `No payment customer found with Stripe customer ID: ${customerId}`
      );

      // Try to get user from metadata
      const stripeCustomer = await stripe.customers.retrieve(customerId);
      const userId = (stripeCustomer as Stripe.Customer).metadata?.userId;

      if (!userId) {
        console.error(
          `No user ID found in Stripe customer metadata for customer ${customerId}`
        );
        return false;
      }

      // Find user to create new payment customer
      const user = await User.findById(userId);
      if (!user) {
        console.error(`No user found with ID: ${userId}`);
        return false;
      }

      // Create a new PaymentCustomer record
      const newPaymentCustomer = new PaymentCustomer({
        userId: user._id,
        provider: "stripe",
        customerId: customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });

      // Get the first item to determine the plan
      const item = subscription.items.data[0];
      // Extract metadata to determine which plan this is
      const planId = item.price.metadata?.planId;
      if (planId) {
        newPaymentCustomer.subscriptionPlan = planId;
      }

      // Cast to access current_period_end
      const subscriptionWithEnd =
        subscription as unknown as SubscriptionWithPeriodEnd;

      // Make sure current_period_end is valid before creating a Date object
      if (subscriptionWithEnd.current_period_end) {
        newPaymentCustomer.subscriptionCurrentPeriodEnd = new Date(
          subscriptionWithEnd.current_period_end * 1000
        );
      }

      await newPaymentCustomer.save();
      console.log(
        `Created new PaymentCustomer record for user ${user._id} with subscription ${subscription.id}`
      );
      return true;
    }

    // Get the user from the payment customer record
    const user = await User.findById(paymentCustomer.userId);
    if (!user) {
      console.error(
        `No user found for payment customer ${paymentCustomer._id}`
      );
      return false;
    }

    // Get the first item to determine the plan
    const item = subscription.items.data[0];

    // Extract metadata to determine which plan this is
    const planId = item.price.metadata?.planId;

    // Cast to access current_period_end
    const subscriptionWithEnd =
      subscription as unknown as SubscriptionWithPeriodEnd;

    // Update PaymentCustomer with subscription information
    paymentCustomer.subscriptionId = subscription.id;
    paymentCustomer.subscriptionStatus = subscription.status;
    paymentCustomer.subscriptionPlan = planId || null;

    // Make sure current_period_end is valid before creating a Date object
    if (subscriptionWithEnd.current_period_end) {
      paymentCustomer.subscriptionCurrentPeriodEnd = new Date(
        subscriptionWithEnd.current_period_end * 1000
      );
    }

    // Save the PaymentCustomer record
    await paymentCustomer.save();
    console.log(
      `Updated PaymentCustomer record for user ${user._id} with subscription ${subscription.id}`
    );

    return true;
  } catch (error) {
    console.error("Error handling subscription update:", error);
    return false;
  }
}

// Function to handle subscription canceled
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    // Get customer ID from the subscription
    const customerId = subscription.customer as string;

    // Find the PaymentCustomer with this customer ID
    const paymentCustomer = await PaymentCustomer.findOne({
      customerId: customerId,
      provider: "stripe",
    });

    if (!paymentCustomer) {
      console.error(
        `No payment customer found with Stripe customer ID: ${customerId}`
      );

      // Try to get user from metadata
      const stripeCustomer = await stripe.customers.retrieve(customerId);

      // Check if customer is deleted
      if (stripeCustomer.deleted) {
        console.error(`Stripe customer ${customerId} has been deleted`);
        return false;
      }

      // Access metadata if available
      const userId = (stripeCustomer as Stripe.Customer).metadata?.userId;

      if (!userId) {
        console.error(
          `No user ID found in Stripe customer metadata for customer ${customerId}`
        );
        return false;
      }

      // Find user to create new payment customer
      const user = await User.findById(userId);
      if (!user) {
        console.error(`No user found with ID: ${userId}`);
        return false;
      }

      // Cast to access current_period_end
      const subscriptionWithEnd =
        subscription as unknown as SubscriptionWithPeriodEnd;

      // Create a new PaymentCustomer record with the canceled subscription
      const newCustomer: Partial<IPaymentCustomer> = {
        userId: user._id,
        provider: "stripe",
        customerId: customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      };

      // Only add the date if it's valid
      if (subscriptionWithEnd.current_period_end) {
        newCustomer.subscriptionCurrentPeriodEnd = new Date(
          subscriptionWithEnd.current_period_end * 1000
        );
      }

      await PaymentCustomer.create(newCustomer);
      console.log(
        `Created new PaymentCustomer record for user ${user._id} with canceled subscription ${subscription.id}`
      );
      return true;
    }

    // Update PaymentCustomer with subscription information
    paymentCustomer.subscriptionStatus = subscription.status;

    // Cast to access current_period_end
    const subscriptionWithEnd =
      subscription as unknown as SubscriptionWithPeriodEnd;

    // Make sure current_period_end is valid before creating a Date object
    if (subscriptionWithEnd.current_period_end) {
      paymentCustomer.subscriptionCurrentPeriodEnd = new Date(
        subscriptionWithEnd.current_period_end * 1000
      );
    }

    // Save the PaymentCustomer record
    await paymentCustomer.save();
    console.log(
      `Updated PaymentCustomer record for customer ${paymentCustomer._id} with canceled subscription ${subscription.id}`
    );

    return true;
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
    return false;
  }
}

// Function to handle checkout session completed
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  try {
    // Make sure we have a customerId
    if (!session.customer) {
      console.error("Checkout session has no customer ID");
      return false;
    }

    // Handle both subscription and one-time checkout sessions
    if (session.mode === "subscription" && session.subscription) {
      // This is a subscription checkout
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return await handleSubscriptionUpdated(subscription);
    } else if (session.mode === "payment") {
      // This is a one-time payment
      const customerId = session.customer as string;

      // Try to find an existing PaymentCustomer
      let paymentCustomer = await PaymentCustomer.findOne({
        customerId: customerId,
        provider: "stripe",
      });

      if (paymentCustomer) {
        console.log(
          `Found existing payment customer for one-time payment: ${paymentCustomer._id}`
        );
        return true;
      }

      // No existing PaymentCustomer found, try to get user from metadata
      const stripeCustomer = await stripe.customers.retrieve(customerId);

      // Check if customer is deleted
      if (stripeCustomer.deleted) {
        console.error(`Stripe customer ${customerId} has been deleted`);
        return false;
      }

      // Access metadata if available
      const userId = (stripeCustomer as Stripe.Customer).metadata?.userId;

      if (!userId) {
        console.error(
          `No user ID found in Stripe customer metadata for customer ${customerId}`
        );
        return false;
      }

      // Find user to create new payment customer
      const user = await User.findById(userId);
      if (!user) {
        console.error(`No user found with ID: ${userId}`);
        return false;
      }

      // Create a PaymentCustomer record for this user
      paymentCustomer = await PaymentCustomer.create({
        userId: user._id,
        provider: "stripe",
        customerId: customerId,
      });

      console.log(
        `Created PaymentCustomer record for user ${user._id} for one-time payment`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") as string;

    if (!signature) {
      return NextResponse.json(
        { message: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );
    } catch (err) {
      console.error(
        `Webhook signature verification failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return NextResponse.json(
        {
          message: `Webhook Error: ${
            err instanceof Error ? err.message : String(err)
          }`,
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Handle different event types
    let handled = false;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        handled = await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        handled = await handleSubscriptionCanceled(
          event.data.object as Stripe.Subscription
        );
        break;
      case "checkout.session.completed":
        handled = await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({
      received: true,
      handled,
      type: event.type,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Webhook error: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
