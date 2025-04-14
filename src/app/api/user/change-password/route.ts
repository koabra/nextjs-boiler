import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import connectDB from "@/lib/db";
import User from "@/models/User";

// PUT /api/user/change-password - Change user password
export async function PUT(request: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectDB();

    // Parse the request body
    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find the user by ID with password included
    const user = await User.findById(session.user.id).select("+password");

    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Update the user's password - let the pre-save hook handle hashing
    user.password = newPassword;
    await user.save();

    // Return success response
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password change error:", error);

    return NextResponse.json(
      {
        message: `Error changing password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
