/**
 * Migration script to move users from legacy Stripe fields to the new payment provider model
 *
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/migrate-payment-providers.ts
 */

import "dotenv/config";
import connectDB from "@/lib/db";
import User from "@/models/User";
import PaymentCustomer from "@/models/PaymentCustomer";

async function migrateUsers() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Connected to database.");

    // Find all users with Stripe customer IDs
    console.log("Finding users with Stripe customer IDs...");
    const users = await User.find({
      stripeCustomerId: { $exists: true, $ne: null },
    });

    console.log(`Found ${users.length} users with Stripe customer IDs.`);

    // Process each user
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Check if this user already has a payment customer record for Stripe
        const existingRecord = await PaymentCustomer.findOne({
          userId: user._id,
          provider: "stripe",
        });

        if (existingRecord) {
          console.log(
            `User ${user._id} already has a payment customer record. Skipping.`
          );
          skipped++;
          continue;
        }

        // Create a new payment customer record
        const paymentCustomer = new PaymentCustomer({
          userId: user._id,
          provider: "stripe",
          customerId: user.stripeCustomerId,
          subscriptionId: user.subscriptionId,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        });

        await paymentCustomer.save();

        console.log(
          `Migrated user ${user._id} with Stripe customer ID ${user.stripeCustomerId}`
        );
        migrated++;
      } catch (error) {
        console.error(`Error migrating user ${user._id}:`, error);
        errors++;
      }
    }

    console.log("\nMigration complete!");
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    // Close connection
    if (typeof (mongoose as any).connection.close === "function") {
      await (mongoose as any).connection.close();
    }
    console.log("Database connection closed.");
  }
}

migrateUsers().catch(console.error);
