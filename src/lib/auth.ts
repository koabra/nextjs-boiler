import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import type { NextAuthOptions } from "next-auth";

/**
 * Get the user ID from the session
 * This utility function extracts the user ID from the NextAuth session
 */
export async function getUserId(): Promise<string | null> {
  // Get the session with complete token information
  const session = await getServerSession(authOptions as NextAuthOptions);

  // If user ID exists in session, return it
  if (session?.user?.id) {
    return session.user.id;
  }

  // No user ID found
  console.log("No user ID found in session");
  return null;
}

/**
 * Check if the user is authenticated
 * Returns authenticated status and user ID if available
 */
export async function isAuthenticated(): Promise<{
  authenticated: boolean;
  userId: string | null;
}> {
  const userId = await getUserId();
  return {
    authenticated: !!userId,
    userId,
  };
}
