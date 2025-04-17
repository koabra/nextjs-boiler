import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { PaymentProviderName } from "@/interfaces/PaymentProvider";
import type { IPaymentCustomer } from "./PaymentCustomer";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
  getPaymentCustomer: (
    provider: PaymentProviderName
  ) => Promise<IPaymentCustomer | null>;
  hasActiveSubscription: () => Promise<boolean>;
  getActivePaymentMethod: () => Promise<{
    provider: PaymentProviderName;
    customerId: string;
  } | null>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password by default
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: mongoose.Schema.Types.Mixed,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || "", salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password || "");
};

// Get payment customer for a specific provider
UserSchema.methods.getPaymentCustomer = async function (
  provider: PaymentProviderName
): Promise<IPaymentCustomer | null> {
  const PaymentCustomer = mongoose.models.PaymentCustomer;

  if (!PaymentCustomer) {
    // Import dynamically without assigning to 'module'
    const PaymentCustomerModule = await import("@/models/PaymentCustomer");
    return await PaymentCustomerModule.default.findOne({
      userId: this._id,
      provider: provider,
    });
  }

  return await PaymentCustomer.findOne({
    userId: this._id,
    provider: provider,
  });
};

// Check if user has an active subscription with any provider
UserSchema.methods.hasActiveSubscription = async function () {
  // Check using the payment model
  const PaymentCustomer = mongoose.models.PaymentCustomer;

  if (PaymentCustomer) {
    const activeCustomer = await PaymentCustomer.findOne({
      userId: this._id,
      subscriptionStatus: "active",
    });

    if (activeCustomer) return true;

    // Also check for trialing status
    const trialingCustomer = await PaymentCustomer.findOne({
      userId: this._id,
      subscriptionStatus: "trialing",
    });

    if (trialingCustomer) return true;
  }

  return false;
};

// Get the active payment method (provider and customerId)
UserSchema.methods.getActivePaymentMethod = async function () {
  // Check using the payment model
  const PaymentCustomer = mongoose.models.PaymentCustomer;

  if (PaymentCustomer) {
    const customer = await PaymentCustomer.findOne({
      userId: this._id,
      customerId: { $exists: true },
    });

    if (customer) {
      return {
        provider: customer.provider,
        customerId: customer.customerId,
      };
    }
  }

  return null;
};

// Prevent mongoose from creating Users model multiple times during hot reloads
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
