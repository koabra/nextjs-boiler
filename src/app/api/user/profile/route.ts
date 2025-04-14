import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import connectDB from "@/lib/db";
import User from "@/models/User";

// PUT /api/user/profile - Update user profile
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
    const { name } = await request.json();

    // Validate input
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // Find the user by ID and update
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return success response with updated user data
    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Profile update error:", error);

    return NextResponse.json(
      { message: `Error updating profile: ${error.message}` },
      { status: 500 }
    );
  }
}
