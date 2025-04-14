import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateToken } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with that email already exists" },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = generateToken();

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
      emailVerified: false,
    });

    // Send verification email using Plunk
    await sendVerificationEmail(email, name, verificationToken);

    // Return success response without sensitive data
    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
        userId: user._id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Provide specific error messages for MongoDB authentication issues
    if (error instanceof Error) {
      if (
        error.message.includes("authentication") ||
        error.name === "MongoServerError"
      ) {
        return NextResponse.json(
          {
            message:
              "Database connection error. Please contact the administrator.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message:
          "Error creating user: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}
