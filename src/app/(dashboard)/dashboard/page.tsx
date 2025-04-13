import { getUserId } from "@/lib/auth";

export default async function DashboardPage() {
  // Get user ID from session
  const userId = await getUserId();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <p className="text-blue-700">
          Welcome to your dashboard! This is a protected page only accessible to
          authenticated users.
        </p>
        <p className="text-blue-700 mt-2">Your user ID: {userId}</p>
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
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <div className="text-gray-500 italic">No recent activity found.</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Update Profile
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
            View Settings
          </button>
        </div>
      </div>
    </div>
  );
}
