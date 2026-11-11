export type PaymentStatus =
  | "Pending"
  | "Processing"
  | "Success"
  | "Failed"
  | "Refunded"
  | "Expired";

export type PaymentGatewayProvider =
  | "youpi-pg"
  | "razorpay-fallback"
  | "manual-upi-fallback";

export type SubscriptionPlanTier = "free" | "pro" | "premium";

export interface PaymentRecord {
  id: string;
  orderId: string;
  gatewayPaymentId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  plan: "pro" | "premium";
  amountInr: number;
  amountFormatted: string;
  amountUsd: string;
  currency: "INR";
  provider: PaymentGatewayProvider;
  status: PaymentStatus;
  rawGatewayStatus: string;
  settlementState: "PENDING" | "NOT_RECONCILED" | "RECONCILED" | "REFUNDED" | "REJECTED";
  upiUri: string;
  qrDataUrl?: string;
  checkoutUrl?: string | null;
  utr?: string;
  invoiceId?: string;
  refundReason?: string;
  refundedAt?: string;
  emailSent?: boolean;
  reconciledBy?: string;
  reconciledAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: SubscriptionPlanTier;
  status: "active" | "canceled" | "past_due" | "refunded" | "expired";
  provider: PaymentGatewayProvider;
  latestOrderId?: string;
  latestPaymentId?: string;
  amountInr: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  removeBrandingEnabled: boolean;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  plan: "pro" | "premium";
  description: string;
  subtotalInr: number;
  taxInr: number;
  totalInr: number;
  currency: "INR";
  utr?: string;
  provider: PaymentGatewayProvider;
  status: "Paid" | "Pending Verification" | "Refunded";
  issuedAt: string;
}

export interface PaymentLogRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  event: string;
  level: "info" | "warn" | "error" | "security";
  provider: PaymentGatewayProvider | "system";
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
