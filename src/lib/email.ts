// Configuration for Plunk email service
const PLUNK_CONFIG = {
  apiKey: process.env.PLUNK_API_KEY || "",
  baseApiUrl: process.env.PLUNK_BASE_API_URL,
  appUrl: process.env.NEXTAUTH_URL || "",
};

// Email events and templates mapping
export const EMAIL_EVENTS = {
  USER_SIGNUP: "user-signup",
  PASSWORD_RESET: "password-reset",
  WELCOME: "welcome",
  RESEND_VERIFICATION: "resend-verification",
};

/**
 * Core function to send emails via Plunk API
 * @param event The event name for tracking
 * @param email Recipient email address
 * @param data Object containing all variables needed for the email template
 * @param options Additional options for the email
 * @returns Promise<Response> The fetch response
 */
export async function sendEmail(
  event: string,
  email: string,
  data: Record<string, unknown>,
  options: {
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    attachments?: Array<{ name: string; content: string }>;
  } = {}
): Promise<Response> {
  if (!PLUNK_CONFIG.apiKey || !PLUNK_CONFIG.baseApiUrl) {
    throw new Error("Plunk API key or base URL not configured");
  }

  try {
    const payload = {
      event,
      email,
      data,
      ...(options.cc && { cc: options.cc }),
      ...(options.bcc && { bcc: options.bcc }),
      ...(options.replyTo && { replyTo: options.replyTo }),
      ...(options.attachments && { attachments: options.attachments }),
    };

    // Make the API request using fetch directly, like in the reference app
    const response = await fetch(`${PLUNK_CONFIG.baseApiUrl}/v1/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PLUNK_CONFIG.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("response url", `${PLUNK_CONFIG.baseApiUrl}/v1/track`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Email sending failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

/**
 * Sends email verification link
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<Response> {
  const verificationUrl = `${PLUNK_CONFIG.appUrl}/auth/verify-email?token=${verificationToken}`;

  return sendEmail(EMAIL_EVENTS.USER_SIGNUP, email, {
    name,
    verificationUrl,
  });
}

/**
 * Sends password reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<Response> {
  const resetUrl = `${PLUNK_CONFIG.appUrl}/auth/reset-password?token=${resetToken}`;

  return sendEmail(EMAIL_EVENTS.PASSWORD_RESET, email, {
    name,
    resetUrl,
  });
}

/**
 * Sends welcome email after account verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<Response> {
  return sendEmail(EMAIL_EVENTS.WELCOME, email, {
    name,
  });
}

/**
 * Sends resend verification email
 */
export async function sendResendVerificationEmail(
  email: string,
  name: string,
  verificationToken: string
): Promise<Response> {
  const verificationUrl = `${PLUNK_CONFIG.appUrl}/auth/verify-email?token=${verificationToken}`;

  return sendEmail(EMAIL_EVENTS.RESEND_VERIFICATION, email, {
    name,
    verificationUrl,
  });
}

/**
 * Utility to send batch emails (useful for notifications)
 * @param event The event type
 * @param recipients Array of recipient objects containing email and data
 */
export async function sendBatchEmails(
  event: string,
  recipients: Array<{ email: string; data: Record<string, unknown> }>,
  options: {
    batchSize?: number;
    delayMs?: number;
    replyTo?: string;
  } = {}
): Promise<Response[]> {
  const batchSize = options.batchSize || 10; // Default batch size
  const delayMs = options.delayMs || 500; // Default delay between batches
  const results: Response[] = [];

  // Process emails in batches to avoid overwhelming the API
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    // Send emails in current batch concurrently
    const batchPromises = batch.map(({ email, data }) =>
      sendEmail(event, email, data, { replyTo: options.replyTo })
    );

    const batchResults = await Promise.allSettled(batchPromises);

    // Add successful responses to results
    batchResults.forEach((result) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    });

    // If there are more batches, add a delay
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Export email service for convenient import
export const emailService = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendResendVerificationEmail,
  sendBatchEmails,
};
