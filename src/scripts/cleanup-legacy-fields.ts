/**
 * This script helps clean up legacy subscription fields in the User model
 * Run this script when you are ready to fully remove the legacy fields
 * Make sure all user data has been migrated to the new PaymentCustomer model first
 *
 * Usage:
 * - `npm run cleanup-legacy-fields` - Prints what would be done without making changes
 * - `npm run cleanup-legacy-fields -- --execute` - Actually performs the cleanup
 */

import mongoose from "mongoose";
import User from "../models/User";
import PaymentCustomer from "../models/PaymentCustomer";
import connectDB from "../lib/db";

const EXECUTE_MODE = process.argv.includes("--execute");

async function main() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log(`Running in ${EXECUTE_MODE ? "EXECUTE" : "DRY RUN"} mode`);
    console.log("EXECUTE=false means no changes will be made to your database");

    // Step 1: Find users with legacy subscription fields
    const usersWithLegacyFields = await User.find({
      $or: [
        { stripeCustomerId: { $exists: true, $ne: null } },
        { subscriptionId: { $exists: true, $ne: null } },
        { subscriptionStatus: { $exists: true, $ne: null } },
        { subscriptionPlan: { $exists: true, $ne: null } },
        { subscriptionCurrentPeriodEnd: { $exists: true, $ne: null } },
      ],
    });

    console.log(
      `Found ${usersWithLegacyFields.length} users with legacy subscription fields`
    );

    // Step 2: Check for active subscriptions
    const usersWithActiveSubscriptions = usersWithLegacyFields.filter(
      (user) =>
        user.subscriptionStatus === "active" ||
        user.subscriptionStatus === "trialing"
    );

    if (usersWithActiveSubscriptions.length > 0) {
      console.error(
        `WARNING: Found ${usersWithActiveSubscriptions.length} users with ACTIVE legacy subscriptions`
      );
      console.error("These users may still be paying for subscriptions!");
      console.error(
        "Please migrate these users to the new PaymentCustomer model before cleaning up"
      );

      usersWithActiveSubscriptions.forEach((user) => {
        console.error(
          `- User ID: ${user._id}, Email: ${user.email}, Status: ${user.subscriptionStatus}`
        );
      });

      if (!EXECUTE_MODE) {
        console.log(
          "\nSafety check: To proceed anyway, run with --execute flag"
        );
        process.exit(1);
      }
    }

    // Step 3: Verify all users have PaymentCustomer records
    const usersWithoutPaymentCustomer = [];

    for (const user of usersWithLegacyFields) {
      const paymentCustomer = await PaymentCustomer.findOne({
        userId: user._id,
      });
      if (!paymentCustomer) {
        usersWithoutPaymentCustomer.push(user);
      }
    }

    if (usersWithoutPaymentCustomer.length > 0) {
      console.error(
        `WARNING: Found ${usersWithoutPaymentCustomer.length} users without PaymentCustomer records`
      );
      usersWithoutPaymentCustomer.forEach((user) => {
        console.error(`- User ID: ${user._id}, Email: ${user.email}`);
      });

      if (!EXECUTE_MODE) {
        console.log(
          "\nSafety check: To proceed anyway, run with --execute flag"
        );
        process.exit(1);
      }
    }

    // Step 4: Clean up legacy fields if in execute mode
    if (EXECUTE_MODE) {
      console.log("Cleaning up legacy fields...");

      const updateResult = await User.updateMany(
        { _id: { $in: usersWithLegacyFields.map((u) => u._id) } },
        {
          $unset: {
            stripeCustomerId: "",
            subscriptionId: "",
            subscriptionStatus: "",
            subscriptionPlan: "",
            subscriptionCurrentPeriodEnd: "",
          },
        }
      );

      console.log(`Updated ${updateResult.modifiedCount} users`);
      console.log("Legacy fields have been removed");
    } else {
      console.log("\nDRY RUN COMPLETE");
      console.log("To clean up legacy fields, run with --execute flag");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
}

main();
