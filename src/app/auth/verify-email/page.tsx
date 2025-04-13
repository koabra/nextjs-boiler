"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// This component uses useSearchParams and is wrapped in Suspense
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    // Redirect to the API route with the token
    // The API will handle the verification and redirect back to signin
    router.push(`/api/auth/verify-email?token=${token}`);
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Email Verification
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We're verifying your email address
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="flex flex-col items-center space-y-4 pt-6 px-6 pb-8">
            {status === "loading" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-center">Verifying your email address...</p>
              </>
            )}
            {status === "success" && (
              <>
                <svg
                  className="h-12 w-12 text-green-500"
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
                <p className="text-center">{message}</p>
              </>
            )}
            {status === "error" && (
              <>
                <svg
                  className="h-12 w-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <p className="text-center">{message}</p>
              </>
            )}
          </div>
          <div className="px-6 pb-6 flex justify-center">
            {status === "success" && (
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </Link>
            )}
            {status === "error" && (
              <Link
                href="/auth/resend-verification"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Resend Verification Email
              </Link>
            )}
            {status === "loading" && (
              <button
                disabled
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md font-semibold text-white bg-blue-600 opacity-50 cursor-not-allowed"
              >
                Please wait...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the content with Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Email Verification
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Loading verification page...
              </p>
            </div>
            <div className="bg-white shadow rounded-lg">
              <div className="flex flex-col items-center space-y-4 pt-6 px-6 pb-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-center">Loading verification page...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
