import NextAuth from "next-auth";
import { authOptions } from "./authOptions";
import connectDB from "@/lib/db";

// Connect to MongoDB and initialize NextAuth
async function init() {
  try {
    await connectDB();
    console.log("Connected to MongoDB in NextAuth route handler");
  } catch (error) {
    console.error(
      "Failed to connect to MongoDB in NextAuth route handler",
      error
    );
  }
}

// Initialize auth handler
const handler = NextAuth(authOptions);

// Export the handler with init() called before each request
export async function GET(req: Request, ctx: any) {
  await init();
  return handler(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  await init();
  return handler(req, ctx);
}
