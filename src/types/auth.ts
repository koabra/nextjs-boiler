import { DefaultSession } from "next-auth";

// Extend the Session and User types from next-auth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: boolean;
  }
}

// Extend JWT type to include user ID
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    userId?: string;
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
