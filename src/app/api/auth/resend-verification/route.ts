import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateToken } from "@/lib/utils";
import { sendResendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, we've sent a verification link.",
        },
        { status: 200 }
      );
    }

    // Check if the user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Your email is already verified. Please sign in." },
        { status: 400 }
      );
    }

    // Generate a new verification token
    const verificationToken = generateToken();
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    await sendResendVerificationEmail(user.email, user.name, verificationToken);

    return NextResponse.json(
      {
        message:
          "Verification email sent. Please check your inbox and spam folder.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
