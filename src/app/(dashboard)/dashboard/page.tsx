"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { getSubscriptionPlan } from "@/config/subscriptionPlans";

export default function DashboardPage() {
  const { data: session } = useSession();

  // Get subscription data from session
  const subscription = session?.user?.subscription;
  const subscriptionPlan = subscription?.plan
    ? getSubscriptionPlan(subscription.plan)
    : null;

  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <p className="text-blue-700">
          Welcome to your dashboard! This is a protected page only accessible to
          authenticated users.
        </p>
        <p className="text-blue-700 mt-2">Your user ID: {session?.user?.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">User Stats</h2>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Login</span>
              <span className="font-medium">Today</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created</span>
              <span className="font-medium">June 1, 2023</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Subscription Status</h2>
          {subscription?.status === "active" ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium text-green-700">
                  Active Subscription
                </span>
              </div>
              <div className="text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">
                    {subscriptionPlan?.name || subscription.plan}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">
                    {subscriptionPlan?.priceDisplay || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Renews:</span>
                  <span className="font-medium">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/dashboard/billing"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Manage Subscription
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">
                You don't have an active subscription.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                View Plans
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/profile"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Update Profile
          </Link>
          <Link
            href="/dashboard/billing"
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            Manage Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
