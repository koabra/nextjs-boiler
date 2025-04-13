import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";

// Helper function to get base URL
function getBaseUrl(requestUrl: string) {
  // First try NEXTAUTH_URL from environment
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    return nextAuthUrl;
  }

  // Fallback to request origin
  const url = new URL(requestUrl);
  return url.origin;
}

// For handling GET requests with token as query parameter
export async function GET(req: NextRequest) {
  console.log("[GET] Email verification process started");
  const baseUrl = getBaseUrl(req.url);

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      console.log("[GET] No token provided in request");
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find user with verification token
    let user = await User.findOne({ verificationToken: token });

    if (!user) {
      console.log("[GET] No user found with the provided verification token");

      // Check if user was already verified
      const verifiedUser = await User.findOne({
        verificationToken: token,
      }).select("email");

      if (verifiedUser?.email) {
        user = await User.findOne({
          email: verifiedUser.email,
          emailVerified: { $exists: true },
          verificationToken: null,
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified !== false) {
      console.log("[GET] User was already verified");
      const redirectUrl = new URL("/auth/signin", baseUrl);
      redirectUrl.searchParams.set("verified", "true");
      redirectUrl.searchParams.set("email", user.email);
      redirectUrl.searchParams.set("alreadyVerified", "true");

      return NextResponse.redirect(redirectUrl);
    }

    // Mark email as verified and remove verification token
    user.emailVerified = new Date();
    user.verificationToken = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Redirect to sign-in page with success message
    const redirectUrl = new URL("/auth/signin", baseUrl);
    redirectUrl.searchParams.set("verified", "true");
    redirectUrl.searchParams.set("email", user.email);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[GET] Email verification error:", error);

    // Redirect to error page
    const errorUrl = new URL("/auth/verification-error", baseUrl);
    return NextResponse.redirect(errorUrl);
  }
}

// For handling POST requests with token in body
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

    if (!body.token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const token = body.token;

    // Connect to database
    await connectDB();

    // Find user with verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified !== false) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // Mark email as verified and remove verification token
    user.emailVerified = new Date();
    user.verificationToken = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during email verification",
      },
      { status: 500 }
    );
  }
}
