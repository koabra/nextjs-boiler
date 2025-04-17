"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { toast } from "sonner";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      // Redirect to sign in if not logged in
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/pricing")}`);
      return;
    }

    try {
      setIsLoading(planId);

      // Create subscription checkout session
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

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        router.push(data.checkoutUrl);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {Object.values(subscriptionPlans).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border ${
                plan.popular
                  ? "border-blue-200 bg-blue-50 shadow-lg"
                  : "border-gray-200 bg-white"
              } p-8 shadow-sm transition-all hover:shadow`}
            >
              {plan.popular && (
                <div className="mb-4">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                    Most Popular
                  </span>
                </div>
              )}

              <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-2 text-gray-600">{plan.description}</p>

              <div className="mt-6">
                <p className="text-5xl font-extrabold text-gray-900">
                  {plan.priceDisplay}
                </p>
                <p className="mt-1 text-gray-600">per month</p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="h-6 w-6 flex-shrink-0 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading === plan.id}
                  className={`w-full rounded-lg py-3 px-4 text-center text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {isLoading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="ml-2">Processing...</span>
                    </span>
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Have questions? Contact our{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
