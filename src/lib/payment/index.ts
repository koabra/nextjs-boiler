import {
  PaymentProvider,
  PaymentProviderName,
} from "@/interfaces/PaymentProvider";
import { StripeProvider, createStripeProvider } from "./StripeProvider";

// Add more providers here as they are implemented
// import { PayPalProvider, createPayPalProvider } from "./PayPalProvider";
// import { BraintreeProvider, createBraintreeProvider } from "./BraintreeProvider";

// Cache provider instances to avoid recreating them
const providerCache: Record<PaymentProviderName, PaymentProvider> = {} as any;

/**
 * Get the default payment provider name from environment variables
 * This allows configuring the default provider at deployment time
 */
export function getDefaultProviderName(): PaymentProviderName {
  return (
    (process.env.DEFAULT_PAYMENT_PROVIDER as PaymentProviderName) || "stripe"
  );
}

/**
 * Get a payment provider instance by name
 * @param name The payment provider name
 * @returns A PaymentProvider instance
 */
export function getPaymentProvider(
  name?: PaymentProviderName
): PaymentProvider {
  const providerName = name || getDefaultProviderName();

  // Return from cache if available
  if (providerCache[providerName]) {
    return providerCache[providerName];
  }

  // Create new instance based on provider name
  let provider: PaymentProvider;

  switch (providerName) {
    case "stripe":
      provider = createStripeProvider();
      break;
    // Add cases for other providers as they are implemented
    // case "paypal":
    //   provider = createPayPalProvider();
    //   break;
    // case "braintree":
    //   provider = createBraintreeProvider();
    //   break;
    default:
      // Default to Stripe if an unknown provider is requested
      provider = createStripeProvider();
  }

  // Cache the provider instance
  providerCache[providerName] = provider;

  return provider;
}

/**
 * Get all available payment providers
 * @returns A list of available payment provider names
 */
export function getAvailableProviders(): PaymentProviderName[] {
  const providers: PaymentProviderName[] = ["stripe"];

  // Add other providers as they are implemented and enabled
  // if (process.env.ENABLE_PAYPAL === "true") providers.push("paypal");
  // if (process.env.ENABLE_BRAINTREE === "true") providers.push("braintree");

  return providers;
}

/**
 * Get a provider for a specific user based on their preference or active payment method
 * @param userId The user ID
 * @returns A payment provider instance
 */
export async function getProviderForUser(
  userId: string
): Promise<PaymentProvider> {
  try {
    // Import dynamically to avoid circular dependencies
    const { default: User } = await import("@/models/User");

    const user = await User.findById(userId);
    if (!user) {
      return getPaymentProvider(); // Return default provider
    }

    // Get user's active payment method
    const activeMethod = await user.getActivePaymentMethod();
    if (activeMethod) {
      return getPaymentProvider(activeMethod.provider);
    }

    // No active method, return default provider
    return getPaymentProvider();
  } catch (error) {
    console.error("Error getting provider for user:", error);
    return getPaymentProvider(); // Return default provider on error
  }
}

// Export commonly used types
export type { PaymentProvider, PaymentProviderName };
export type {
  Customer,
  Subscription,
  CheckoutSession,
} from "@/interfaces/PaymentProvider";
