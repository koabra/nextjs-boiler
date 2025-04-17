"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const sessionId = searchParams.get("session_id");

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
      router.push("/dashboard/billing");
    }
  }, [shouldRedirect, router]);

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center">
        <div className="rounded-full bg-green-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Payment Successful!
        </h1>

        <p className="mt-2 text-gray-600">
          {sessionId
            ? "Your payment has been processed successfully."
            : "Thank you for your payment."}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Session ID: {sessionId || "N/A"}
        </p>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to billing in {countdown} seconds...
          </p>

          <Link
            href="/dashboard/billing"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
