import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";
import { generateToken } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";
import { getDefaultProviderName } from "@/lib/payment";

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

    // Get default payment provider
    const defaultProvider = getDefaultProviderName();

    try {
      // Create a placeholder PaymentCustomer record
      // Note: The customerId will be set when the user first interacts with the payment system
      await PaymentCustomer.create({
        userId: user._id,
        provider: defaultProvider,
        customerId: `pending_${user._id}_${Date.now()}`, // Temporary ID until a real one is assigned
      });

      console.log(
        `Created initial PaymentCustomer record for new user ${user._id}`
      );
    } catch (paymentError) {
      // Log error but don't fail registration if this part fails
      console.error("Error creating PaymentCustomer record:", paymentError);
    }

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
