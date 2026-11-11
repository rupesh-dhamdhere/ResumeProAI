import { NextRequest, NextResponse } from "next/server";
import {
  appendPaymentLog,
  getPaymentByGatewayId,
  getPaymentByOrderId,
  savePaymentRecord,
} from "@/lib/payments/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { orderId?: string; paymentId?: string };
    const lookup = body.orderId || body.paymentId;

    if (!lookup) {
      return NextResponse.json(
        { error: "orderId or paymentId is required" },
        { status: 400 }
      );
    }

    const existing =
      (await getPaymentByOrderId(lookup)) ?? (await getPaymentByGatewayId(lookup));

    const youpiApiUrl = (
      process.env.YOUPI_API_URL || "http://localhost:6100"
    ).replace(/\/+$/, "");
    const merchantKey = process.env.YOUPI_MERCHANT_API_KEY?.trim() || "";
    const targetGatewayId = existing?.gatewayPaymentId || body.paymentId;

    if (
      merchantKey &&
      targetGatewayId &&
      !targetGatewayId.startsWith("local-")
    ) {
      try {
        await fetch(
          `${youpiApiUrl}/api/v1/checkout/${encodeURIComponent(targetGatewayId)}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Merchant-Key": merchantKey,
            },
            signal: AbortSignal.timeout(3500),
          }
        );
      } catch {
        // Proceed with local cancellation even when daemon is offline
      }
    }

    if (existing && (existing.status === "Pending" || existing.status === "Processing")) {
      const updated = {
        ...existing,
        status: "Failed" as const,
        rawGatewayStatus: "CANCELLED",
        settlementState: "REJECTED" as const,
        updatedAt: new Date().toISOString(),
      };
      await savePaymentRecord(updated);
      await appendPaymentLog({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId: existing.orderId,
        paymentId: existing.id,
        event: "PAYMENT_CANCELLED",
        level: "warn",
        provider: existing.provider,
        message: `User cancelled payment session ${existing.orderId}.`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, status: "Failed" });
  } catch {
    return NextResponse.json(
      { error: "Failed to cancel payment session" },
      { status: 400 }
    );
  }
}
