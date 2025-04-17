import { SubscriptionPlan } from "@/config/subscriptionPlans";

export type PaymentProviderName = "stripe" | "paypal" | "braintree";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface CheckoutSession {
  id: string;
  url: string;
  mode: "subscription" | "payment";
  success_url: string;
  cancel_url: string;
}

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  current_period_end: number; // Unix timestamp
  plan_id: string;
  customer_id: string;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface PaymentProvider {
  name: PaymentProviderName;

  // Customer management
  createCustomer(userId: string, email: string, name?: string): Promise<string>;
  getCustomer(customerId: string): Promise<Customer>;

  // Subscription management
  createSubscriptionCheckout(params: {
    customerId: string;
    plan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
    trial?: boolean;
    trialDays?: number;
  }): Promise<CheckoutSession>;

  getSubscription(subscriptionId: string): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<Subscription>;

  // One-time payment
  createOneTimeCheckout(params: {
    customerId: string;
    amount: number;
    name: string;
    description: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  // Webhook signature verification
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean>;

  // Plan/price management
  createOrUpdatePrice(
    planId: string,
    planPrice: number,
    isRecurring?: boolean
  ): Promise<string>;
}
