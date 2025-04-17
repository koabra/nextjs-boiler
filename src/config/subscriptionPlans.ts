export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  priceDisplay: string;
  popular?: boolean;

  // Provider-specific price IDs
  priceIds: {
    stripe?: string;
    paypal?: string;
    braintree?: string;
    [key: string]: string | undefined;
  };
};

export type SubscriptionPlans = {
  [key: string]: SubscriptionPlan;
};

// Get prices from environment variables
const basicPrice = process.env.NEXT_PUBLIC_PRICE_BASIC
  ? parseInt(process.env.NEXT_PUBLIC_PRICE_BASIC, 10)
  : 499;

const premiumPrice = process.env.NEXT_PUBLIC_PRICE_PREMIUM
  ? parseInt(process.env.NEXT_PUBLIC_PRICE_PREMIUM, 10)
  : 999;

// Format price for display
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / 100);
};

export const subscriptionPlans: SubscriptionPlans = {
  basic: {
    id: "basic",
    name: "Basic Plan",
    description: "Perfect for individuals and small projects",
    price: basicPrice,
    priceDisplay: formatPrice(basicPrice),
    features: [
      "Access to basic features",
      "Limited storage (5GB)",
      "Email support",
      "Up to 3 projects",
    ],
    priceIds: {}, // Will be populated by initialization
  },
  premium: {
    id: "premium",
    name: "Premium Plan",
    description: "Ideal for professionals and teams",
    price: premiumPrice,
    priceDisplay: formatPrice(premiumPrice),
    popular: true,
    features: [
      "All basic features",
      "Unlimited storage",
      "Priority support",
      "Unlimited projects",
      "Advanced analytics",
      "Team collaboration tools",
    ],
    priceIds: {}, // Will be populated by initialization
  },
};

export const getSubscriptionPlan = (
  planId: string | null | undefined
): SubscriptionPlan | null => {
  if (!planId) return null;
  return subscriptionPlans[planId] || null;
};

export default subscriptionPlans;
