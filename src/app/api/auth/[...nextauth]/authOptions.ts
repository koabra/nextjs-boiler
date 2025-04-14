import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import connectDB from "@/lib/db";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!nextAuthSecret) {
  console.error("NextAuth secret not found");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await connectDB();

          // Find user by email and include the password field
          const user = await User.findOne({
            email: credentials.email,
          }).select("+password");

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check if the user's email is verified
          if (user.emailVerified === false) {
            throw new Error(
              "Please verify your email address before signing in"
            );
          }

          // Compare password
          const isMatch = await user.comparePassword(credentials.password);

          if (!isMatch) {
            throw new Error("Invalid email or password");
          }

          // Return user without password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      // Always fetch the latest user data from the database
      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.image;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  secret: nextAuthSecret || "",
};
