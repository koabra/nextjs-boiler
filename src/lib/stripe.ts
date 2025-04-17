import Stripe from "stripe";
import { SubscriptionPlan } from "@/config/subscriptionPlans";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Use the latest stable API version
});

// Create or retrieve a Stripe customer
export async function createOrRetrieveCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  try {
    // Check if the user already has a Stripe customer ID in our database
    const user = await import("@/models/User").then((module) =>
      module.default.findById(userId)
    );

    if (user?.stripeCustomerId) {
      // Retrieve the existing customer to ensure it exists
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (customer.deleted) {
        throw new Error("Customer was deleted in Stripe");
      }
      return user.stripeCustomerId;
    }

    // If no customer ID exists, create a new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    // Update the user with the new Stripe customer ID
    await import("@/models/User").then((module) =>
      module.default.findByIdAndUpdate(userId, {
        stripeCustomerId: customer.id,
      })
    );

    return customer.id;
  } catch (error) {
    console.error("Error creating or retrieving Stripe customer:", error);
    throw error;
  }
}

// Create a checkout session for subscription
export async function createSubscriptionCheckoutSession({
  customerId,
  plan,
  successUrl,
  cancelUrl,
  trial = false,
  trialDays = 0,
}: {
  customerId: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  trial?: boolean;
  trialDays?: number;
}) {
  try {
    // Note: In a production environment, you would create and store these price IDs in your database
    // For this example, we'll create them on the fly
    if (!plan.stripePriceId) {
      throw new Error(`No Stripe Price ID available for plan ${plan.id}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data:
        trial && trialDays > 0 ? { trial_period_days: trialDays } : undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planId: plan.id,
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating subscription checkout session:", error);
    throw error;
  }
}

// Create a checkout session for one-time payment
export async function createOneTimeCheckoutSession({
  customerId,
  amount,
  name,
  description,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  amount: number;
  name: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name,
              description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session;
  } catch (error) {
    console.error("Error creating one-time checkout session:", error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

// Retrieve subscription details
export async function getSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    throw error;
  }
}

// Create price IDs for subscription plans
export async function createOrUpdateStripePrices(
  planId: string,
  planPrice: number,
  isRecurring: boolean = true
) {
  try {
    // First check if a product with this ID already exists
    let product;
    try {
      const products = await stripe.products.list({
        active: true,
      });

      product = products.data.find((p) => p.metadata.planId === planId);
    } catch (e) {
      console.log("Error checking existing products:", e);
    }

    // If product doesn't exist, create it
    if (!product) {
      product = await stripe.products.create({
        name: `Plan: ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
        metadata: {
          planId,
        },
      });
    }

    // Create a new price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: planPrice,
      currency: "usd",
      recurring: isRecurring ? { interval: "month" } : undefined,
      metadata: {
        planId,
      },
    });

    return price.id;
  } catch (error) {
    console.error(
      `Error creating/updating Stripe price for plan ${planId}:`,
      error
    );
    throw error;
  }
}
