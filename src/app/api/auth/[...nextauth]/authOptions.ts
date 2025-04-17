import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";
import connectDB from "@/lib/db";
import { getDefaultProviderName } from "@/lib/payment";

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
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        await connectDB();

        // Check if this user already exists in our database
        const existingUser = await User.findOne({ email: user.email });

        // If this is a new user (first time OAuth sign-in)
        if (!existingUser && account?.provider !== "credentials") {
          console.log(
            `New OAuth user sign-up: ${user.email} via ${account?.provider}`
          );

          // Create a new user with verified email (OAuth emails are pre-verified)
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: true,
          });

          // Assign the new MongoDB ID to the user object
          user.id = newUser._id.toString();

          // Get default payment provider
          const defaultProvider = getDefaultProviderName();

          // Create a placeholder PaymentCustomer record
          try {
            await PaymentCustomer.create({
              userId: newUser._id,
              provider: defaultProvider,
              customerId: `pending_oauth_${newUser._id}_${Date.now()}`, // Temporary ID until a real one is assigned
            });

            console.log(
              `Created initial PaymentCustomer record for new OAuth user ${newUser._id}`
            );
          } catch (paymentError) {
            // Log error but don't fail sign-in if this part fails
            console.error(
              "Error creating PaymentCustomer record for OAuth user:",
              paymentError
            );
          }
        }
        // If user exists but we haven't created a PaymentCustomer record yet
        else if (existingUser) {
          // Check if user already has a PaymentCustomer record
          const existingPaymentCustomer = await PaymentCustomer.findOne({
            userId: existingUser._id,
          });

          // If no PaymentCustomer record exists, create one
          if (!existingPaymentCustomer) {
            const defaultProvider = getDefaultProviderName();

            await PaymentCustomer.create({
              userId: existingUser._id,
              provider: defaultProvider,
              customerId: `pending_oauth_${existingUser._id}_${Date.now()}`, // Temporary ID
            });

            console.log(
              `Created PaymentCustomer record for existing OAuth user ${existingUser._id}`
            );
          }

          // Ensure user.id is set to our database ID for proper session management
          user.id = existingUser._id.toString();
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
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

            // Update the token with the user's subscription information
            // Only use the PaymentCustomer model, no legacy fields
            const activePaymentCustomer = await PaymentCustomer.findOne({
              userId: dbUser._id,
              subscriptionStatus: { $in: ["active", "trialing"] },
            });

            if (activePaymentCustomer) {
              token.subscription = {
                id: activePaymentCustomer.subscriptionId || null,
                status: activePaymentCustomer.subscriptionStatus || null,
                plan: activePaymentCustomer.subscriptionPlan || null,
                currentPeriodEnd:
                  activePaymentCustomer.subscriptionCurrentPeriodEnd || null,
                provider: activePaymentCustomer.provider,
              };
            } else {
              // If no active subscription found, check for the most recent one
              const recentPaymentCustomer = await PaymentCustomer.findOne({
                userId: dbUser._id,
              }).sort({ updatedAt: -1 });

              token.subscription = recentPaymentCustomer
                ? {
                    id: recentPaymentCustomer.subscriptionId || null,
                    status: recentPaymentCustomer.subscriptionStatus || null,
                    plan: recentPaymentCustomer.subscriptionPlan || null,
                    currentPeriodEnd:
                      recentPaymentCustomer.subscriptionCurrentPeriodEnd ||
                      null,
                    provider: recentPaymentCustomer.provider,
                  }
                : {
                    id: null,
                    status: null,
                    plan: null,
                    currentPeriodEnd: null,
                    provider: null,
                  };
            }
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

        // Add subscription information to the session
        session.user.subscription = token.subscription;
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
