import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | NextJS Boilerplate",
  description: "User dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:space-x-8">
        <aside className="w-full md:w-64 mb-8 md:mb-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Dashboard
            </h2>
            <nav className="space-y-2">
              <a
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 bg-gray-100"
              >
                Overview
              </a>
              <a
                href="/dashboard/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Profile
              </a>
              <a
                href="/dashboard/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Settings
              </a>
            </nav>
          </div>
        </aside>
        <main className="flex-1 bg-white shadow rounded-lg p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
