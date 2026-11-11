import crypto from "node:crypto";
import QRCode from "qrcode";
import { sendPaymentConfirmationEmail } from "@/lib/payments/email-service";
import { generateInvoiceForPayment } from "@/lib/payments/invoice-service";
import {
  appendPaymentLog,
  getPaymentByGatewayId,
  getPaymentByOrderId,
  listPayments,
  savePaymentRecord,
} from "@/lib/payments/store";
import {
  activateSubscriptionFromPayment,
  markSubscriptionRefunded,
} from "@/lib/payments/subscription-service";
import type {
  InvoiceRecord,
  PaymentGatewayProvider,
  PaymentRecord,
  PaymentStatus,
  SubscriptionRecord,
} from "@/types/payment";

export const PLAN_CATALOG = {
  pro: {
    plan: "pro" as const,
    name: "Pro Plan",
    amountInr: 749,
    amountFormatted: "749.00",
    amountUsd: "$9/mo",
  },
  premium: {
    plan: "premium" as const,
    name: "Premium Plan",
    amountInr: 1599,
    amountFormatted: "1599.00",
    amountUsd: "$19/mo",
  },
};

export interface UpiDeepLinks {
  generic: string;
  gpay: string;
  phonepe: string;
  paytm: string;
  bhim: string;
  cred: string;
}

export interface CreateSessionInput {
  plan: "pro" | "premium";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  userId?: string;
  forceNew?: boolean;
}

export interface CreateSessionResult {
  payment: PaymentRecord;
  upiDeepLinks: UpiDeepLinks;
  youpiAvailable: boolean;
  fallbackRequired: boolean;
  fallbackOptions: Array<"razorpay" | "manual-upi">;
  razorpayConfigured: boolean;
  reusedExistingOrder: boolean;
  errorMessage?: string;
}

/**
 * Normalizes raw gateway strings (YouPI-PG / Razorpay / Manual) into canonical PaymentStatus values.
 */
export function mapGatewayStatusToPaymentStatus(rawStatus: string): PaymentStatus {
  const normalized = rawStatus.trim().toUpperCase();
  if (
    normalized === "RECONCILED" ||
    normalized === "OBSERVED_SUCCESS" ||
    normalized === "CAPTURED" ||
    normalized === "PAID" ||
    normalized === "SUCCESS"
  ) {
    return "Success";
  }
  if (
    normalized === "PROCESSING" ||
    normalized === "INITIATED" ||
    normalized === "PENDING_VERIFICATION" ||
    normalized === "AWAITING_VERIFICATION"
  ) {
    return "Processing";
  }
  if (normalized === "EXPIRED" || normalized === "TIMEOUT") {
    return "Expired";
  }
  if (normalized === "REFUNDED") {
    return "Refunded";
  }
  if (
    normalized === "FAILED" ||
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "REJECTED"
  ) {
    return "Failed";
  }
  return "Pending";
}

/**
 * Generates standard UPI intent URI plus app-specific deep links for major Indian UPI apps.
 */
export function buildUpiUri(params: {
  vpa?: string;
  payeeName?: string;
  amountFormatted: string;
  orderId: string;
}): string {
  const vpa =
    params.vpa ||
    process.env.YOUPI_PAYEE_VPA ||
    process.env.NEXT_PUBLIC_MANUAL_UPI_VPA ||
    "merchant@upi";
  const pn = encodeURIComponent(
    params.payeeName || process.env.NEXT_PUBLIC_MANUAL_UPI_NAME || "ResumePro AI"
  );
  const tn = encodeURIComponent(`ResumePro ${params.orderId}`);
  return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${pn}&am=${params.amountFormatted}&cu=INR&tr=${encodeURIComponent(params.orderId)}&tn=${tn}`;
}

export function buildUpiDeepLinks(upiUri: string): UpiDeepLinks {
  const query = upiUri.includes("?") ? upiUri.slice(upiUri.indexOf("?")) : "";
  return {
    generic: upiUri,
    gpay: `tez://upi/pay${query}`,
    phonepe: `phonepe://pay${query}`,
    paytm: `paytmmp://pay${query}`,
    bhim: `bhim://upi/pay${query}`,
    cred: `credpay://upi/pay${query}`,
  };
}

export async function generateQrDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    width: 280,
    margin: 2,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

/**
 * Finalizes a verified Success payment once: activates subscription, issues invoice, sends email.
 */
export async function finalizeSuccessfulPayment(
  payment: PaymentRecord,
  triggerEvent: string
): Promise<{
  payment: PaymentRecord;
  subscription: SubscriptionRecord;
  invoice: InvoiceRecord;
}> {
  const subscription = await activateSubscriptionFromPayment(payment);
  const invoice = await generateInvoiceForPayment(payment, "Paid");

  const updatedPayment: PaymentRecord = {
    ...payment,
    status: "Success",
    invoiceId: invoice.id,
    updatedAt: new Date().toISOString(),
  };
  await savePaymentRecord(updatedPayment);

  if (!updatedPayment.emailSent) {
    await sendPaymentConfirmationEmail(updatedPayment, invoice);
    updatedPayment.emailSent = true;
  }

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: payment.orderId,
    paymentId: payment.id,
    event: triggerEvent,
    level: "info",
    provider: payment.provider,
    message: `Payment finalized for order ${payment.orderId} (${payment.amountInr} INR). Subscription active & invoice ${invoice.invoiceNumber} ready.`,
    metadata: {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
    },
    timestamp: new Date().toISOString(),
  });

  return { payment: updatedPayment, subscription, invoice };
}

/**
 * Creates a YouPI-PG dynamic UPI payment request & QR code, preventing duplicate active pending orders.
 * Falls back cleanly to Razorpay / Manual UPI when YouPI-PG is unavailable.
 */
export async function createYoupiPaymentSession(
  input: CreateSessionInput
): Promise<CreateSessionResult> {
  const spec = PLAN_CATALOG[input.plan];
  const email = input.customerEmail.trim().toLowerCase();
  const name = input.customerName.trim() || "ResumePro User";
  const phone = (input.customerPhone || "9999999999").replace(/[^0-9+]/g, "").slice(0, 15);
  const userId = input.userId || `usr-${crypto.createHash("sha1").update(email).digest("hex").slice(0, 10)}`;
  const razorpayConfigured = Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );

  // Duplicate active order prevention (unless user explicitly forces a new order)
  if (!input.forceNew) {
    const existingList = await listPayments(email);
    const activePending = existingList.find(
      (p) =>
        p.plan === input.plan &&
        (p.status === "Pending" || p.status === "Processing") &&
        new Date(p.expiresAt).getTime() > Date.now() + 60_000
    );
    if (activePending) {
      const qrDataUrl = activePending.qrDataUrl || (await generateQrDataUrl(activePending.upiUri));
      return {
        payment: { ...activePending, qrDataUrl },
        upiDeepLinks: buildUpiDeepLinks(activePending.upiUri),
        youpiAvailable: activePending.provider === "youpi-pg",
        fallbackRequired: activePending.provider !== "youpi-pg",
        fallbackOptions: ["razorpay", "manual-upi"],
        razorpayConfigured,
        reusedExistingOrder: true,
      };
    }
  }

  const orderId = `RPA-${input.plan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const upiUri = buildUpiUri({ amountFormatted: spec.amountFormatted, orderId });
  const qrDataUrl = await generateQrDataUrl(upiUri);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  const youpiApiUrl = (process.env.YOUPI_API_URL || "http://localhost:6100").replace(/\/+$/, "");
  const merchantId =
    process.env.YOUPI_MERCHANT_ID || "00000000-0000-0000-0000-000000000001";
  const merchantApiKey = process.env.YOUPI_MERCHANT_API_KEY?.trim() || "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );

  let gatewayPaymentId = `local-${crypto.randomUUID()}`;
  let checkoutUrl: string | null = null;
  let provider: PaymentGatewayProvider = "youpi-pg";
  let rawGatewayStatus = "PENDING";
  let youpiAvailable = false;
  let errorMessage: string | undefined;

  if (!merchantApiKey) {
    errorMessage = "YouPI-PG merchant API key is not configured on the server.";
  } else {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${youpiApiUrl}/api/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Id": merchantId,
          "X-Merchant-Key": merchantApiKey,
          "Idempotency-Key": `idem-${orderId}`,
        },
        body: JSON.stringify({
          orderId,
          amount: spec.amountFormatted,
          currency: "INR",
          customer: {
            name,
            email,
            phone,
          },
          returnUrl: `${siteUrl}/checkout/success?orderId=${encodeURIComponent(orderId)}`,
          metadata: {
            plan: input.plan,
            userId,
            product: "ResumePro AI",
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();
      if (response.ok && data?.paymentId) {
        youpiAvailable = true;
        gatewayPaymentId = String(data.paymentId);
        checkoutUrl = data.checkoutUrl || null;
        rawGatewayStatus = String(data.status || "PENDING");
      } else {
        errorMessage = data?.error || data?.message || `YouPI-PG returned HTTP ${response.status}`;
      }
    } catch (err) {
      errorMessage =
        err instanceof Error
          ? `YouPI-PG service unreachable (${err.message})`
          : "YouPI-PG service unreachable";
    }
  }

  if (!youpiAvailable) {
    provider = razorpayConfigured ? "razorpay-fallback" : "manual-upi-fallback";
  }

  const record: PaymentRecord = {
    id: `pay-${orderId.toLowerCase()}`,
    orderId,
    gatewayPaymentId,
    userId,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    plan: input.plan,
    amountInr: spec.amountInr,
    amountFormatted: spec.amountFormatted,
    amountUsd: spec.amountUsd,
    currency: "INR",
    provider,
    status: "Pending",
    rawGatewayStatus,
    settlementState: "PENDING",
    upiUri,
    qrDataUrl,
    checkoutUrl,
    emailSent: false,
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await savePaymentRecord(record);

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId,
    paymentId: record.id,
    event: youpiAvailable ? "PAYMENT_SESSION_CREATED" : "YOUPI_UNAVAILABLE_FALLBACK_READY",
    level: youpiAvailable ? "info" : "warn",
    provider,
    message: youpiAvailable
      ? `Created YouPI-PG session ${gatewayPaymentId} for ${email} (${spec.plan}, INR ${spec.amountFormatted}).`
      : `YouPI-PG unavailable (${errorMessage}). Enabled fallback payment options for ${orderId}.`,
    metadata: {
      gatewayPaymentId,
      plan: input.plan,
      amountInr: spec.amountInr,
      youpiAvailable,
    },
    timestamp: now.toISOString(),
  });

  return {
    payment: record,
    upiDeepLinks: buildUpiDeepLinks(upiUri),
    youpiAvailable,
    fallbackRequired: !youpiAvailable,
    fallbackOptions: ["razorpay", "manual-upi"],
    razorpayConfigured,
    reusedExistingOrder: false,
    errorMessage,
  };
}

/**
 * Checks live payment status from YouPI-PG (when applicable), handles expiration,
 * and finalizes subscription + invoice + email once verified.
 */
export async function verifyAndSyncPaymentStatus(orderIdOrPaymentId: string): Promise<{
  payment: PaymentRecord | null;
  subscription?: SubscriptionRecord;
  invoice?: InvoiceRecord;
  youpiReachable: boolean;
}> {
  let payment =
    (await getPaymentByOrderId(orderIdOrPaymentId)) ??
    (await getPaymentByGatewayId(orderIdOrPaymentId));

  if (!payment) {
    return { payment: null, youpiReachable: false };
  }

  let youpiReachable = payment.provider === "youpi-pg";

  // Check expiration for unpaid sessions
  if (
    (payment.status === "Pending" || payment.status === "Processing") &&
    Date.now() > new Date(payment.expiresAt).getTime()
  ) {
    payment = {
      ...payment,
      status: "Expired",
      rawGatewayStatus: "EXPIRED",
      settlementState: "REJECTED",
      updatedAt: new Date().toISOString(),
    };
    await savePaymentRecord(payment);
    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: payment.orderId,
      paymentId: payment.id,
      event: "PAYMENT_EXPIRED",
      level: "warn",
      provider: payment.provider,
      message: `Payment window expired for order ${payment.orderId}.`,
      timestamp: new Date().toISOString(),
    });
    return { payment, youpiReachable };
  }

  // Poll YouPI-PG when payment is still in progress
  if (
    payment.provider === "youpi-pg" &&
    (payment.status === "Pending" || payment.status === "Processing") &&
    !payment.gatewayPaymentId.startsWith("local-")
  ) {
    const youpiApiUrl = (process.env.YOUPI_API_URL || "http://localhost:6100").replace(
      /\/+$/,
      ""
    );
    const merchantId =
      process.env.YOUPI_MERCHANT_ID || "00000000-0000-0000-0000-000000000001";
    const merchantApiKey = process.env.YOUPI_MERCHANT_API_KEY?.trim() || "";

    if (merchantApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `${youpiApiUrl}/api/v1/payments/${encodeURIComponent(payment.gatewayPaymentId)}`,
          {
            headers: {
              "X-Merchant-Id": merchantId,
              "X-Merchant-Key": merchantApiKey,
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const remote = await res.json();
          const remoteRaw = String(remote.status || payment.rawGatewayStatus);
          const mapped = mapGatewayStatusToPaymentStatus(remoteRaw);

          // Amount validation guard against tampering
          if (remote.amount && Number(remote.amount) !== payment.amountInr) {
            await appendPaymentLog({
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              orderId: payment.orderId,
              paymentId: payment.id,
              event: "AMOUNT_MISMATCH_BLOCKED",
              level: "security",
              provider: "youpi-pg",
              message: `Gateway amount ${remote.amount} mismatched expected ${payment.amountInr} INR.`,
              timestamp: new Date().toISOString(),
            });
            return { payment, youpiReachable: true };
          }

          if (mapped !== payment.status || remoteRaw !== payment.rawGatewayStatus) {
            payment = {
              ...payment,
              status: mapped,
              rawGatewayStatus: remoteRaw,
              settlementState:
                remoteRaw.toUpperCase() === "RECONCILED"
                  ? "RECONCILED"
                  : mapped === "Success"
                    ? "NOT_RECONCILED"
                    : mapped === "Failed"
                      ? "REJECTED"
                      : payment.settlementState,
              utr: remote.utr || payment.utr,
              updatedAt: new Date().toISOString(),
            };
            await savePaymentRecord(payment);
          }
        } else {
          youpiReachable = false;
        }
      } catch {
        youpiReachable = false;
      }
    }
  }

  let subscription: SubscriptionRecord | undefined;
  let invoice: InvoiceRecord | undefined;

  if (payment.status === "Success") {
    const finalized = await finalizeSuccessfulPayment(payment, "PAYMENT_STATUS_VERIFIED");
    payment = finalized.payment;
    subscription = finalized.subscription;
    invoice = finalized.invoice;
  } else if (payment.invoiceId) {
    invoice = await generateInvoiceForPayment(payment);
  }

  return { payment, subscription, invoice, youpiReachable };
}

/**
 * Processes an admin refund request for a successful payment.
 */
export async function processPaymentRefund(
  orderId: string,
  reason: string,
  adminEmail: string
): Promise<PaymentRecord | null> {
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return null;

  if (payment.status === "Refunded") {
    return payment;
  }

  const now = new Date().toISOString();
  const refunded: PaymentRecord = {
    ...payment,
    status: "Refunded",
    rawGatewayStatus: "REFUNDED",
    settlementState: "REFUNDED",
    refundReason: reason || "Admin initiated refund",
    refundedAt: now,
    reconciledBy: adminEmail,
    reconciledAt: now,
    updatedAt: now,
  };

  await savePaymentRecord(refunded);
  await generateInvoiceForPayment(refunded, "Refunded");
  await markSubscriptionRefunded(refunded, refunded.refundReason || "Refunded");

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: refunded.orderId,
    paymentId: refunded.id,
    event: "PAYMENT_REFUNDED",
    level: "warn",
    provider: refunded.provider,
    message: `Payment ${refunded.orderId} marked Refunded by ${adminEmail}. Reason: ${refunded.refundReason}`,
    timestamp: now,
  });

  return refunded;
}
