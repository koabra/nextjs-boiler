import mongoose from "mongoose";
import { PaymentProviderName } from "@/interfaces/PaymentProvider";

export interface IPaymentCustomer extends mongoose.Document {
  userId: mongoose.Schema.Types.ObjectId;
  provider: PaymentProviderName;
  customerId: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionCurrentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentCustomerSchema = new mongoose.Schema<IPaymentCustomer>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "braintree"],
      required: [true, "Payment provider is required"],
    },
    customerId: {
      type: String,
      required: [true, "Customer ID is required"],
    },
    subscriptionId: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
        "incomplete_expired",
        "unpaid",
        "paused",
        null,
      ],
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "premium", null],
      default: null,
    },
    subscriptionCurrentPeriodEnd: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only have one payment customer per provider
PaymentCustomerSchema.index({ userId: 1, provider: 1 }, { unique: true });

// Prevent mongoose from creating the model multiple times during hot reloads
const PaymentCustomer =
  mongoose.models.PaymentCustomer ||
  mongoose.model<IPaymentCustomer>("PaymentCustomer", PaymentCustomerSchema);

export default PaymentCustomer;
