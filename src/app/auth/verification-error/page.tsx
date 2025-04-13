import Link from "next/link";

export const metadata = {
  title: "Verification Error | NextJS Boilerplate",
  description: "Email verification failed",
};

export default function VerificationErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Verification Error
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            There was a problem verifying your email address
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="flex flex-col items-center space-y-4 pt-6 px-6 pb-8">
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
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                We couldn't verify your email address. The verification link may
                be expired or invalid.
              </p>
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-center space-x-4">
            <Link
              href="/auth/resend-verification"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Resend Verification Email
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
