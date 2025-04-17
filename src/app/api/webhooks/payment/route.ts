import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payment";
import connectDB from "@/lib/db";
import PaymentCustomer from "@/models/PaymentCustomer";
import { PaymentProviderName } from "@/interfaces/PaymentProvider";

// Define interface for subscription data
interface SubscriptionEventData {
  id: string;
  customer: string;
  status: string;
  plan_id?: string;
  current_period_end: number;
  [key: string]: unknown; // For other properties we might not explicitly handle
}

// Define interface for checkout data
interface CheckoutEventData {
  id: string;
  mode: string;
  subscription?: string;
  [key: string]: unknown; // For other properties we might not explicitly handle
}

// Handle subscription events
async function handleSubscriptionEvent(
  data: SubscriptionEventData,
  providerName: PaymentProviderName
) {
  try {
    const provider = getPaymentProvider(providerName);
    const customerId = data.customer;

    // Find the payment customer record
    let paymentCustomer = await PaymentCustomer.findOne({
      provider: providerName,
      customerId: customerId,
    });

    if (!paymentCustomer) {
      console.log(
        `No payment customer found with ID: ${customerId} for provider ${providerName}. Attempting to find user from metadata.`
      );

      // Try to get the customer from the provider to get user ID from metadata
      try {
        const customer = await provider.getCustomer(customerId);
        const userId = customer.metadata?.userId;

        if (userId) {
          // Create PaymentCustomer record using findOneAndUpdate with upsert
          paymentCustomer = await PaymentCustomer.findOneAndUpdate(
            { userId, provider: providerName },
            {
              customerId,
              subscriptionId: data.id,
              subscriptionStatus: data.status,
              subscriptionPlan: data.plan_id || null,
              subscriptionCurrentPeriodEnd: new Date(
                data.current_period_end * 1000
              ),
            },
            { upsert: true, new: true }
          );

          console.log(
            `Created PaymentCustomer record for user ${userId} with provider ${providerName}`
          );
        } else {
          console.error(
            `Customer metadata does not contain userId for customer ${customerId}`
          );
          return false;
        }
      } catch (customerError) {
        console.error(
          `Error retrieving customer from provider:`,
          customerError
        );
        return false;
      }
    } else {
      // Update existing payment customer information
      paymentCustomer.subscriptionId = data.id;
      paymentCustomer.subscriptionStatus = data.status;

      if (data.plan_id) {
        paymentCustomer.subscriptionPlan = data.plan_id;
      }

      paymentCustomer.subscriptionCurrentPeriodEnd = new Date(
        data.current_period_end * 1000
      );

      // Save updated payment customer
      await paymentCustomer.save();
    }

    console.log(
      `Updated subscription status for payment customer ${paymentCustomer._id} to ${data.status}`
    );
    return true;
  } catch (error) {
    console.error("Error handling subscription event:", error);
    return false;
  }
}

// Handle checkout completion events
async function handleCheckoutCompleted(
  data: CheckoutEventData,
  providerName: PaymentProviderName
) {
  try {
    const provider = getPaymentProvider(providerName);

    if (data.mode === "subscription" && data.subscription) {
      // This is a subscription checkout
      const subscription = await provider.getSubscription(data.subscription);

      // First convert to unknown, then to Record for type safety
      const subscriptionObj = subscription as unknown as Record<
        string,
        unknown
      >;

      // Ensure the subscription has all required fields before passing it to handleSubscriptionEvent
      const subscriptionData: SubscriptionEventData = {
        id: String(subscriptionObj.id || ""),
        customer: String(subscriptionObj.customer || ""),
        status: String(subscriptionObj.status || ""),
        plan_id: subscriptionObj.plan_id
          ? String(subscriptionObj.plan_id)
          : undefined,
        current_period_end: Number(subscriptionObj.current_period_end || 0),
      };

      return await handleSubscriptionEvent(subscriptionData, providerName);
    } else if (data.mode === "payment") {
      // This is a one-time payment
      // Handle one-time payments as needed
      console.log(`One-time payment completed for session ${data.id}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error handling checkout completion:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get provider name from the URL
    const searchParams = request.nextUrl.searchParams;
    const providerName = searchParams.get("provider") as PaymentProviderName;

    if (!providerName) {
      return NextResponse.json(
        { message: "Missing payment provider name" },
        { status: 400 }
      );
    }

    // Get the appropriate payment provider
    const provider = getPaymentProvider(providerName);

    // Get the request body and signature
    const body = await request.text();
    const signature = request.headers.get(
      `${providerName}-signature`
    ) as string;

    if (!signature) {
      return NextResponse.json(
        { message: `Missing ${providerName} signature` },
        { status: 400 }
      );
    }

    // Get the webhook secret for this provider
    const webhookSecret =
      process.env[`${providerName.toUpperCase()}_WEBHOOK_SECRET`] || "";

    // Verify webhook signature
    const isValid = await provider.verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    );
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse the event data
    const eventData = JSON.parse(body);
    const eventType = eventData.type;
    const eventObject = eventData.data?.object;

    // Handle different event types
    let handled = false;

    if (eventType.includes("subscription")) {
      // Handle subscription events
      handled = await handleSubscriptionEvent(eventObject, providerName);
    } else if (eventType.includes("checkout.session.completed")) {
      // Handle checkout completion
      handled = await handleCheckoutCompleted(eventObject, providerName);
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }

    // Return success response
    return NextResponse.json({
      received: true,
      handled: handled,
      type: eventType,
      provider: providerName,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook error: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
