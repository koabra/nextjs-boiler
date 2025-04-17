"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InitializePlansPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function initializePlans() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/stripe/initialize-plans");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to initialize plans");
        }

        const data = await response.json();
        setResults(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
        console.error("Failed to initialize plans:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initializePlans();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Initialize Stripe Plans</h1>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Initializing Stripe plans...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Pricing
          </Link>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-700 mb-2">Success</h2>
          <p className="text-green-600 mb-4">
            {results?.message || "Stripe plans initialized successfully"}
          </p>

          {results?.plans && (
            <div className="mt-4 mb-6">
              <h3 className="text-lg font-medium mb-2">Plan Price IDs</h3>
              <div className="bg-white rounded-lg shadow border border-gray-100 p-4 overflow-auto">
                <pre className="text-sm">
                  {JSON.stringify(results.plans, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Link
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Pricing
            </Link>
            <button
              onClick={() => router.refresh()}
              className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Reinitialize Plans
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">What This Does</h2>
        <p className="text-gray-600 mb-4">
          This page initializes the Stripe plans defined in your application. It
          creates the necessary products and prices in your Stripe account, and
          associates them with your plan configurations.
        </p>
        <p className="text-gray-600 mb-4">You should run this whenever:</p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-1">
          <li>You&apos;re setting up the application for the first time</li>
          <li>You&apos;ve made changes to your plan configurations</li>
          <li>You need to create new price IDs in Stripe</li>
        </ul>
        <p className="text-gray-600">
          Once the plans are initialized, you can use the pricing page to allow
          users to subscribe to these plans.
        </p>
      </div>
    </div>
  );
}
