import { NextRequest, NextResponse } from "next/server";
import { finalizeSuccessfulPayment } from "@/lib/payments/payment-service";
import {
  appendPaymentLog,
  getPaymentByOrderId,
  listInvoices,
  listPaymentLogs,
  listPayments,
  listSubscriptions,
  savePaymentRecord,
} from "@/lib/payments/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [payments, subscriptions, invoices, paymentLogs] = await Promise.all([
      listPayments(),
      listSubscriptions(),
      listInvoices(),
      listPaymentLogs(),
    ]);

    const totalRevenueInr = payments
      .filter((p) => p.status === "Success")
      .reduce((sum, p) => sum + p.amountInr, 0);
    const refundedAmountInr = payments
      .filter((p) => p.status === "Refunded")
      .reduce((sum, p) => sum + p.amountInr, 0);
    const activeSubscriptionsCount = subscriptions.filter(
      (s) => s.status === "active" && s.plan !== "free"
    ).length;
    const pendingVerificationCount = payments.filter(
      (p) => p.status === "Pending" || p.status === "Processing"
    ).length;

    return NextResponse.json({
      analytics: {
        totalRevenueInr,
        refundedAmountInr,
        netRevenueInr: Math.max(0, totalRevenueInr - refundedAmountInr),
        totalTransactions: payments.length,
        successfulCount: payments.filter((p) => p.status === "Success").length,
        pendingVerificationCount,
        failedOrExpiredCount: payments.filter(
          (p) => p.status === "Failed" || p.status === "Expired"
        ).length,
        activeSubscriptionsCount,
      },
      payments,
      subscriptions,
      invoices,
      paymentLogs,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load admin payments." },
      { status: 500 }
    );
  }
}

/**
 * Admin reconciliation actions: approve ("RECONCILED") or reject ("REJECTED") a transaction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action: "approve" | "reject";
      orderId: string;
      utr?: string;
      adminEmail?: string;
    };

    if (!body.orderId || !body.action) {
      return NextResponse.json(
        { error: "orderId and action are required." },
        { status: 400 }
      );
    }

    const payment = await getPaymentByOrderId(body.orderId);
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    const adminEmail = body.adminEmail || "admin@resumepro.ai";
    const now = new Date().toISOString();

    if (body.action === "approve") {
      const finalized = await finalizeSuccessfulPayment(
        {
          ...payment,
          status: "Success",
          rawGatewayStatus: "RECONCILED",
          settlementState: "RECONCILED",
          utr: body.utr?.trim() || payment.utr || `REC-${Date.now().toString().slice(-8)}`,
          reconciledBy: adminEmail,
          reconciledAt: now,
          updatedAt: now,
        },
        "ADMIN_PAYMENT_RECONCILED"
      );

      return NextResponse.json({ success: true, ...finalized });
    }

    const rejected = {
      ...payment,
      status: "Failed" as const,
      rawGatewayStatus: "REJECTED",
      settlementState: "REJECTED" as const,
      reconciledBy: adminEmail,
      reconciledAt: now,
      updatedAt: now,
    };
    await savePaymentRecord(rejected);

    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: rejected.orderId,
      paymentId: rejected.id,
      event: "ADMIN_PAYMENT_REJECTED",
      level: "warn",
      provider: rejected.provider,
      message: `Admin ${adminEmail} rejected payment ${rejected.orderId} during reconciliation.`,
      timestamp: now,
    });

    return NextResponse.json({ success: true, payment: rejected });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reconciliation update failed." },
      { status: 500 }
    );
  }
}
