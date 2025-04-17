import { subscriptionPlans } from "@/config/subscriptionPlans";
import { createOrUpdateStripePrices } from "./stripe";

/**
 * Initialize Stripe prices for all subscription plans
 * This should be run once when the application starts or
 * when plan information changes
 *
 * @deprecated Use the new payment/plans.ts module instead
 */
export async function initializeStripePlans() {
  try {
    console.warn(
      "DEPRECATED: Using initializeStripePlans is deprecated. Use initializeAllPlans from payment/plans.ts instead."
    );
    console.log("Initializing Stripe plans...");
    const planPromises = Object.values(subscriptionPlans).map(async (plan) => {
      try {
        const priceId = await createOrUpdateStripePrices(plan.id, plan.price);
        console.log(`Created/updated price for ${plan.id}: ${priceId}`);

        // Update the priceIds in the plan object
        if (!plan.priceIds) plan.priceIds = {};
        plan.priceIds.stripe = priceId;

        return { plan: plan.id, priceId };
      } catch (error) {
        console.error(`Failed to create price for plan ${plan.id}:`, error);
        return { plan: plan.id, error };
      }
    });

    const results = await Promise.all(planPromises);
    console.log("Stripe plans initialized:", results);
    return results;
  } catch (error) {
    console.error("Error initializing Stripe plans:", error);
    throw error;
  }
}

/**
 * Get the current price IDs for all plans
 * This is useful to check if the plans are properly initialized
 *
 * @deprecated Use the new payment/plans.ts module instead
 */
export function getStripePriceIds() {
  console.warn(
    "DEPRECATED: Using getStripePriceIds is deprecated. Use getAllPriceIds from payment/plans.ts instead."
  );
  const priceIds = Object.values(subscriptionPlans).map((plan) => ({
    plan: plan.id,
    priceId: plan.priceIds?.stripe || null,
  }));

  return priceIds;
}

/**
 * Helper function to ensure all plans have valid Stripe price IDs
 *
 * @deprecated Use the new payment/plans.ts module instead
 */
export function allPlansHavePriceIds(): boolean {
  console.warn(
    "DEPRECATED: Using allPlansHavePriceIds is deprecated. Use plansHavePriceIdsForProvider from payment/plans.ts instead."
  );
  return Object.values(subscriptionPlans).every(
    (plan) => !!(plan.priceIds && plan.priceIds.stripe)
  );
}

/**
 * Ensure all plans have valid price IDs before creating subscription checkouts
 *
 * @deprecated Use the new payment/plans.ts module instead
 */
export async function ensureStripePlansInitialized() {
  console.warn(
    "DEPRECATED: Using ensureStripePlansInitialized is deprecated. Use ensurePlansInitializedForProvider from payment/plans.ts instead."
  );
  if (!allPlansHavePriceIds()) {
    await initializeStripePlans();
  }
  return allPlansHavePriceIds();
}
