import Stripe from "stripe";
import {
  PaymentProvider,
  PaymentProviderName,
  Customer,
  Subscription,
  CheckoutSession,
} from "@/interfaces/PaymentProvider";
import { SubscriptionPlan } from "@/config/subscriptionPlans";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  name: PaymentProviderName = "stripe";

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }

  // Customer management
  async createCustomer(
    userId: string,
    email: string,
    name?: string
  ): Promise<string> {
    try {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // First check if the user already has a PaymentCustomer for Stripe
      let paymentCustomer = await PaymentCustomer.findOne({
        userId: user._id,
        provider: "stripe",
      });

      if (paymentCustomer?.customerId) {
        // Verify customer still exists in Stripe
        try {
          const customer = await this.stripe.customers.retrieve(
            paymentCustomer.customerId
          );
          if (customer && !customer.deleted) {
            return paymentCustomer.customerId;
          }
        } catch (error) {
          console.log(
            "Error retrieving Stripe customer, will create a new one"
          );
        }
      }

      // Create a new customer in Stripe
      const stripeCustomer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      // Create or update a record in our PaymentCustomer collection
      // Using findOneAndUpdate with upsert to avoid duplicate key errors
      await PaymentCustomer.findOneAndUpdate(
        { userId: user._id, provider: "stripe" },
        { customerId: stripeCustomer.id },
        { upsert: true, new: true }
      );

      return stripeCustomer.id;
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new Error("Customer was deleted");
      }

      return {
        id: customer.id,
        email: customer.email || "",
        name: customer.name || undefined,
        metadata: customer.metadata as Record<string, string>,
      };
    } catch (error) {
      console.error("Error retrieving Stripe customer:", error);
      throw error;
    }
  }

  // Subscription management
  async createSubscriptionCheckout(params: {
    customerId: string;
    plan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
    trial?: boolean;
    trialDays?: number;
  }): Promise<CheckoutSession> {
    try {
      const { customerId, plan, successUrl, cancelUrl, trial, trialDays } =
        params;

      if (!plan.priceIds?.stripe) {
        throw new Error(`No Stripe Price ID available for plan ${plan.id}`);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.priceIds.stripe,
            quantity: 1,
          },
        ],
        mode: "subscription",
        subscription_data:
          trial && trialDays && trialDays > 0
            ? { trial_period_days: trialDays }
            : undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          planId: plan.id,
        },
      });

      return {
        id: session.id,
        url: session.url || "",
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        subscriptionId
      );

      // Get plan ID from the metadata of the first price
      const item = subscription.items.data[0];
      const planId = item.price.metadata?.planId || "";

      return {
        id: subscription.id,
        status: subscription.status as any,
        current_period_end: subscription.current_period_end,
        plan_id: planId,
        customer_id: subscription.customer as string,
      };
    } catch (error) {
      console.error("Error retrieving subscription:", error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(
        subscriptionId
      );

      // Get plan ID from the metadata of the first price
      const item = subscription.items.data[0];
      const planId = item.price.metadata?.planId || "";

      return {
        id: subscription.id,
        status: subscription.status as any,
        current_period_end: subscription.current_period_end,
        plan_id: planId,
        customer_id: subscription.customer as string,
      };
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  }

  // One-time payment
  async createOneTimeCheckout(params: {
    customerId: string;
    amount: number;
    name: string;
    description: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    try {
      const { customerId, amount, name, description, successUrl, cancelUrl } =
        params;

      const session = await this.stripe.checkout.sessions.create({
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

      return {
        id: session.id,
        url: session.url || "",
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
    } catch (error) {
      console.error("Error creating one-time checkout:", error);
      throw error;
    }
  }

  // Webhook signature verification
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret
      );
      return !!event;
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  // Plan/price management
  async createOrUpdatePrice(
    planId: string,
    planPrice: number,
    isRecurring: boolean = true
  ): Promise<string> {
    try {
      // Check if a product with this plan ID already exists
      let product;
      try {
        const products = await this.stripe.products.list({ active: true });
        product = products.data.find((p) => p.metadata.planId === planId);
      } catch (error) {
        console.log("Error checking existing products:", error);
      }

      // If product doesn't exist, create it
      if (!product) {
        product = await this.stripe.products.create({
          name: `Plan: ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
          metadata: {
            planId,
          },
        });
      }

      // Create a new price for the product
      const price = await this.stripe.prices.create({
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
      console.error(`Error creating/updating price for plan ${planId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export function createStripeProvider(): StripeProvider {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  return new StripeProvider(process.env.STRIPE_SECRET_KEY);
}
