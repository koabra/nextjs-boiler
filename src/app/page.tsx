import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            NextJS Boilerplate
          </h1>
          <p className="mt-3 max-w-md mx-auto text-lg text-blue-100 sm:text-xl md:mt-5 md:max-w-3xl">
            A complete starter template for your Next.js projects with
            authentication, layouts, and more.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/auth/register"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 md:text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700 md:text-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Features
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Everything you need to build modern web applications
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">
                Authentication
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Complete authentication system with email verification, password
                reset, and social logins.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">
                UI Components
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Responsive UI components built with Tailwind CSS for beautiful,
                customizable interfaces.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">API Routes</h3>
              <p className="mt-2 text-base text-gray-500">
                Ready-to-use API routes for handling user authentication and
                data management.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">
                Database Integration
              </h3>
              <p className="mt-2 text-base text-gray-500">
                MongoDB integration with Mongoose for efficient data storage and
                retrieval.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">
                Form Validation
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Client-side form validation with React Hook Form and Zod for
                type-safe validation.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="border border-gray-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900">TypeScript</h3>
              <p className="mt-2 text-base text-gray-500">
                Full TypeScript support for better developer experience and code
                quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Ready to get started?
          </h2>
          <p className="mt-4 max-w-md mx-auto text-xl text-gray-500">
            Create your account now and start building amazing applications.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/register"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
