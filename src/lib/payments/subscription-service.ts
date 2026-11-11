import {
  appendPaymentLog,
  listSubscriptions,
  saveSubscriptionRecord,
} from "@/lib/payments/store";
import type { PaymentRecord, SubscriptionRecord } from "@/types/payment";

/**
 * Activates or renews a user's Pro/Premium subscription for 30 days upon verified payment.
 */
export async function activateSubscriptionFromPayment(
  payment: PaymentRecord
): Promise<SubscriptionRecord> {
  const existing = await listSubscriptions(payment.customerEmail);
  const current = existing.find(
    (s) =>
      s.userEmail.toLowerCase() === payment.customerEmail.toLowerCase() ||
      s.userId === payment.userId
  );

  const now = new Date();
  const nextMonth = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

  const subscription: SubscriptionRecord = {
    id: current?.id ?? `sub-${payment.userId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    userId: payment.userId,
    userEmail: payment.customerEmail,
    userName: payment.customerName,
    plan: payment.plan,
    status: "active",
    provider: payment.provider,
    latestOrderId: payment.orderId,
    latestPaymentId: payment.id,
    amountInr: payment.amountInr,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    removeBrandingEnabled: true,
    updatedAt: now.toISOString(),
  };

  await saveSubscriptionRecord(subscription);

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: payment.orderId,
    paymentId: payment.id,
    event: "SUBSCRIPTION_ACTIVATED",
    level: "info",
    provider: payment.provider,
    message: `Activated ${subscription.plan.toUpperCase()} subscription for ${subscription.userEmail} until ${nextMonth.toISOString().slice(0, 10)}.`,
    metadata: {
      subscriptionId: subscription.id,
      plan: subscription.plan,
    },
    timestamp: now.toISOString(),
  });

  return subscription;
}

/**
 * Updates a subscription when a payment is refunded by admin.
 */
export async function markSubscriptionRefunded(
  payment: PaymentRecord,
  reason: string
): Promise<SubscriptionRecord | null> {
  const subs = await listSubscriptions(payment.customerEmail);
  const target =
    subs.find((s) => s.latestOrderId === payment.orderId) ??
    subs.find((s) => s.userEmail.toLowerCase() === payment.customerEmail.toLowerCase());

  if (!target) return null;

  const updated: SubscriptionRecord = {
    ...target,
    plan: "free",
    status: "refunded",
    removeBrandingEnabled: false,
    updatedAt: new Date().toISOString(),
  };

  await saveSubscriptionRecord(updated);

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: payment.orderId,
    paymentId: payment.id,
    event: "SUBSCRIPTION_REFUNDED",
    level: "warn",
    provider: payment.provider,
    message: `Reverted subscription ${updated.id} to free after refund (${reason}).`,
    timestamp: new Date().toISOString(),
  });

  return updated;
}
