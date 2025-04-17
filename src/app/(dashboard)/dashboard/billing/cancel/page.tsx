"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentCancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle countdown
  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          setShouldRedirect(true);
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle redirection in a separate effect
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/pricing");
    }
  }, [shouldRedirect, router]);

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center">
        <div className="rounded-full bg-yellow-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Payment Cancelled
        </h1>

        <p className="mt-2 text-gray-600">
          Your payment was cancelled and you have not been charged.
        </p>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to pricing in {countdown} seconds...
          </p>

          <div className="space-x-4">
            <Link
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Plans
            </Link>

            <Link
              href="/dashboard"
              className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
