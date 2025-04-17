"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle2, Menu, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Function to update local state from session
  const updateUserInfo = useCallback(() => {
    if (session?.user) {
      setUserName(session.user.name || "");
      setUserEmail(session.user.email || "");
    }
  }, [session]);

  // Update local state whenever session changes
  useEffect(() => {
    updateUserInfo();
  }, [updateUserInfo]);

  // Listen for session-updated events from other components
  useEffect(() => {
    const handleSessionUpdate = async () => {
      // Force refresh the session
      await update();
      // Update local state
      updateUserInfo();
    };

    // Add event listener
    window.addEventListener("session-updated", handleSessionUpdate);

    // Clean up
    return () => {
      window.removeEventListener("session-updated", handleSessionUpdate);
    };
  }, [update, updateUserInfo]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-bold text-xl text-blue-600">
                NextJS Boilerplate
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/")
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  isActive("/pricing")
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Pricing
              </Link>
              {session && (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      isActive("/dashboard")
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      isActive("/dashboard/billing")
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    Billing
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {userName || userEmail}
                </span>
                {session?.user?.subscription?.status === "active" && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {session.user.subscription.plan === "premium"
                      ? "Premium"
                      : "Basic"}
                  </span>
                )}
                <div className="relative">
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    {session.user.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={session.user.image}
                        alt={userName || "Profile"}
                      />
                    ) : (
                      <UserCircle2 className="h-8 w-8 text-gray-400" />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={cn(
                "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                isActive("/")
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              Home
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                isActive("/pricing")
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              Pricing
            </Link>
            {session && (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                    isActive("/dashboard")
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/billing"
                  className={cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                    isActive("/dashboard/billing")
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  )}
                >
                  Billing
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {session ? (
              <div>
                <div className="flex items-center px-4">
                  {session.user.image ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={session.user.image}
                      alt={userName || "Profile"}
                    />
                  ) : (
                    <UserCircle2 className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {userName || ""}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {userEmail || ""}
                    </div>
                    {session?.user?.subscription?.status === "active" && (
                      <div className="text-xs mt-1 font-medium text-green-700">
                        {session.user.subscription.plan === "premium"
                          ? "Premium Plan"
                          : "Basic Plan"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleSignOut}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 px-4">
                <Link
                  href="/auth/signin"
                  className="block text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="block text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 py-2"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
