import { DefaultSession } from "next-auth";

// Define subscription interface
interface Subscription {
  id: string | null;
  status: string | null;
  plan: string | null;
  currentPeriodEnd: Date | null;
  provider: string | null; // Payment provider (stripe, paypal, etc.)
}

// Extend the Session and User types from next-auth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscription?: Subscription;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: boolean;
    subscription?: Subscription;
  }
}

// Extend JWT type to include user ID and subscription
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    userId?: string;
    subscription?: Subscription;
  }
}

// User registration data
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}

// User sign-in data
export interface UserSignInData {
  email: string;
  password: string;
}

// Password reset request data
export interface PasswordResetRequestData {
  email: string;
}

// Password reset data
export interface PasswordResetData {
  password: string;
  token: string;
}

// Email verification data
export interface EmailVerificationData {
  token: string;
}
