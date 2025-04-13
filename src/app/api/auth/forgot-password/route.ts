import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email";

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

    // Don't reveal if a user exists or not
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account exists with this email, we've sent a password reset link.",
        },
        { status: 200 }
      );
    }

    // Check if the user's email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Please verify your email address before resetting your password.",
        },
        { status: 400 }
      );
    }

    // Generate reset token and set expiration (1 hour from now)
    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return NextResponse.json(
      {
        message: "Password reset email sent. Please check your inbox.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to send password reset email" },
      { status: 500 }
    );
  }
}
