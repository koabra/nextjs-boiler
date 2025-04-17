"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  subscriptionPlans,
  getSubscriptionPlan,
} from "@/config/subscriptionPlans";

type SubscriptionStatus = {
  status: string | null;
  plan: string | null;
  planDetails: any;
  currentPeriodEnd: string | null;
  stripeSubscription: any;
};

export default function BillingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchSubscriptionStatus();
    }
  }, [session]);

  const fetchSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      // const response = await fetch("/api/stripe/subscription-status");
      const response = await fetch("/api/payment/subscription-status");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoadingAction(true);

      // const response = await fetch("/api/stripe/create-subscription", {
      const response = await fetch("/api/payment/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period."
      )
    ) {
      return;
    }

    try {
      setIsLoadingAction(true);

      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel subscription");
      }

      toast.success("Subscription canceled successfully");

      // Refresh subscription data
      await fetchSubscriptionStatus();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Add a new function to manually sync subscription data
  const handleSyncSubscription = async () => {
    try {
      setIsLoadingAction(true);
      toast.info("Syncing subscription data from Stripe...");

      const response = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync subscription");
      }

      toast.success(data.message || "Subscription synced successfully");

      // Refresh subscription data
      await fetchSubscriptionStatus();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const formatDate = (timestamp: string | number | null) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">
          Loading your billing information...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Current subscription info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Subscription Status</h2>
          <button
            onClick={handleSyncSubscription}
            disabled={isLoadingAction}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
          >
            {isLoadingAction ? "Syncing..." : "Sync with Stripe"}
          </button>
        </div>

        {subscriptionData?.status === "active" ? (
          <div>
            <div className="flex items-center mb-4">
              <div className="h-5 w-5 rounded-full bg-green-500 mr-2"></div>
              <span className="font-medium">Active subscription</span>
            </div>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Plan</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {subscriptionData.planDetails?.name ||
                    subscriptionData.plan ||
                    "Unknown plan"}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Price</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {subscriptionData.planDetails?.priceDisplay || "N/A"} / month
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Current Period Ends</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(subscriptionData.currentPeriodEnd)}
                </dd>
              </div>

              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {subscriptionData.stripeSubscription?.cancel_at_period_end
                    ? "Cancels at period end"
                    : "Active"}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <button
                onClick={handleCancelSubscription}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-300 rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                {isLoadingAction ? "Processing..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              {subscriptionData?.status === "canceled"
                ? "Your subscription has been canceled and will end on " +
                  formatDate(subscriptionData.currentPeriodEnd)
                : "You don't have an active subscription."}
            </p>

            <a
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Plans
            </a>
          </div>
        )}
      </div>

      {/* Available plans */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(subscriptionPlans).map((plan) => (
            <div
              key={plan.id}
              className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <span className="text-lg font-bold">{plan.priceDisplay}</span>
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-2">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-sm text-gray-600">
                    +{plan.features.length - 3} more features
                  </li>
                )}
              </ul>

              <div className="mt-4">
                {subscriptionData?.status === "active" &&
                subscriptionData.plan === plan.id ? (
                  <span className="text-sm text-green-600 font-medium">
                    Current plan
                  </span>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoadingAction}
                    className="w-full py-2 text-center text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoadingAction ? "Processing..." : "Subscribe"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
