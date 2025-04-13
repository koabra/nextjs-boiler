import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Only apply middleware to dashboard routes
  if (!path.startsWith("/(dashboard)") && !path.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Check for authentication
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "NextAuth secret not found" },
      { status: 500 }
    );
  }

  const token = await getToken({
    req: request,
    secret: secret,
  });

  // Log token information for debugging
  console.log(`Middleware checking path: ${path}`, {
    hasToken: !!token,
    tokenId: token?.id,
    tokenSub: token?.sub,
    tokenUserId: token?.userId,
  });

  // If not authenticated, redirect to sign-in
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(signInUrl);
  }

  // Add user ID to request headers for server components
  const response = NextResponse.next();

  // Set headers with user information from token
  response.headers.set(
    "x-user-id",
    token.id || token.userId || token.sub || ""
  );
  response.headers.set("x-user-email", token.email || "");

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ["/(dashboard)/:path*", "/dashboard/:path*"],
};
