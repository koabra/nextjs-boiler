import { subscriptionPlans } from "@/config/subscriptionPlans";
import { getPaymentProvider, getAvailableProviders } from "./index";

/**
 * Initialize prices for all subscription plans across all enabled payment providers
 * This should be run once when the application starts or when plan information changes
 */
export async function initializeAllPlans() {
  try {
    console.log("Initializing plans for all payment providers...");
    const providers = getAvailableProviders();

    const results = await Promise.all(
      providers.map(async (providerName) => {
        try {
          const provider = getPaymentProvider(providerName);

          console.log(`Initializing plans for ${providerName}...`);
          const planPromises = Object.values(subscriptionPlans).map(
            async (plan) => {
              try {
                const priceId = await provider.createOrUpdatePrice(
                  plan.id,
                  plan.price
                );
                console.log(
                  `Created/updated price for ${plan.id} on ${providerName}: ${priceId}`
                );

                // Update the priceIds in the plan object
                if (!plan.priceIds) plan.priceIds = {};
                plan.priceIds[providerName] = priceId;

                return { plan: plan.id, priceId, provider: providerName };
              } catch (error) {
                console.error(
                  `Failed to create price for plan ${plan.id} on ${providerName}:`,
                  error
                );
                return { plan: plan.id, error, provider: providerName };
              }
            }
          );

          return await Promise.all(planPromises);
        } catch (error) {
          console.error(
            `Error initializing plans for provider ${providerName}:`,
            error
          );
          return [{ provider: providerName, error }];
        }
      })
    );

    console.log("All payment provider plans initialized.");
    return results.flat();
  } catch (error) {
    console.error("Error initializing plans:", error);
    throw error;
  }
}

/**
 * Get the current price IDs for all plans across all providers
 */
export function getAllPriceIds() {
  const priceIds = Object.values(subscriptionPlans).map((plan) => ({
    plan: plan.id,
    priceIds: plan.priceIds || {},
  }));

  return priceIds;
}

/**
 * Helper function to ensure all plans have valid price IDs for a specific provider
 */
export function plansHavePriceIdsForProvider(providerName: string): boolean {
  return Object.values(subscriptionPlans).every(
    (plan) => !!(plan.priceIds && plan.priceIds[providerName])
  );
}

/**
 * Ensure all plans have valid price IDs for a specific provider
 * before creating subscription checkouts
 */
export async function ensurePlansInitializedForProvider(providerName: string) {
  if (!plansHavePriceIdsForProvider(providerName)) {
    const provider = getPaymentProvider(providerName);

    await Promise.all(
      Object.values(subscriptionPlans).map(async (plan) => {
        if (!plan.priceIds || !plan.priceIds[providerName]) {
          try {
            const priceId = await provider.createOrUpdatePrice(
              plan.id,
              plan.price
            );
            if (!plan.priceIds) plan.priceIds = {};
            plan.priceIds[providerName] = priceId;
          } catch (error) {
            console.error(
              `Failed to create price for plan ${plan.id} on ${providerName}:`,
              error
            );
          }
        }
      })
    );
  }

  return plansHavePriceIdsForProvider(providerName);
}

/**
 * Set up backward compatibility with legacy stripe-plans functions
 */
export function getStripePriceIds() {
  return Object.values(subscriptionPlans).map((plan) => ({
    plan: plan.id,
    priceId: plan.priceIds?.stripe || null,
  }));
}

export function allPlansHavePriceIds(): boolean {
  return plansHavePriceIdsForProvider("stripe");
}

export async function ensureStripePlansInitialized() {
  return await ensurePlansInitializedForProvider("stripe");
}

// Legacy function - redirects to the new system
export async function initializeStripePlans() {
  await ensurePlansInitializedForProvider("stripe");
  return getStripePriceIds();
}
