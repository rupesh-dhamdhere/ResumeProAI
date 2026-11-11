import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  finalizeSuccessfulPayment,
  mapGatewayStatusToPaymentStatus,
} from "@/lib/payments/payment-service";
import {
  appendPaymentLog,
  getPaymentByGatewayId,
  getPaymentByOrderId,
  hasProcessedDelivery,
  markProcessedDelivery,
  savePaymentRecord,
} from "@/lib/payments/store";

export const runtime = "nodejs";

const MAX_TIMESTAMP_DRIFT_MS = 60 * 60 * 1000; // 60 minutes replay guard

function timingSafeHexMatch(expectedHex: string, actualHex: string): boolean {
  const a = Buffer.from(expectedHex.trim().toLowerCase(), "utf8");
  const b = Buffer.from(actualHex.trim().toLowerCase(), "utf8");
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function parseSignatureValue(headerVal: string): string {
  const trimmed = headerVal.trim();
  return trimmed.startsWith("sha256=") ? trimmed.slice(7) : trimmed;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const webhookSecret = process.env.YOUPI_WEBHOOK_SECRET?.trim() || "";

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook verification secret is not configured." },
      { status: 503 }
    );
  }

  const sigV2 = request.headers.get("x-gateway-signature-v2");
  const sigV1 = request.headers.get("x-gateway-signature");
  const timestampHeader = request.headers.get("x-gateway-timestamp");
  const deliveryId = request.headers.get("x-gateway-delivery-id") || "";

  // Replay-attack timestamp validation
  if (timestampHeader) {
    const parsedTs = /^\d+$/.test(timestampHeader)
      ? Number(timestampHeader)
      : Date.parse(timestampHeader);
    if (!Number.isFinite(parsedTs) || Math.abs(Date.now() - parsedTs) > MAX_TIMESTAMP_DRIFT_MS) {
      await appendPaymentLog({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId: "UNKNOWN",
        event: "WEBHOOK_REPLAY_REJECTED",
        level: "security",
        provider: "youpi-pg",
        message: `Rejected webhook delivery ${deliveryId || "n/a"} due to stale or invalid timestamp (${timestampHeader}).`,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Stale or invalid webhook timestamp." },
        { status: 401 }
      );
    }
  }

  // Verify HMAC-SHA256 signature (V2 signed "<timestamp>.<rawBody>" preferred, V1 rawBody supported)
  let verified = false;
  if (sigV2 && timestampHeader) {
    const expectedV2 = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestampHeader}.${rawBody}`)
      .digest("hex");
    verified = timingSafeHexMatch(expectedV2, parseSignatureValue(sigV2));
  }
  if (!verified && sigV1) {
    const expectedV1 = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    verified = timingSafeHexMatch(expectedV1, parseSignatureValue(sigV1));
  }

  if (!verified) {
    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: "UNKNOWN",
      event: "WEBHOOK_INVALID_SIGNATURE",
      level: "security",
      provider: "youpi-pg",
      message: `Rejected webhook ${deliveryId || "n/a"} due to invalid HMAC signature.`,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 }
    );
  }

  // Prevent replay / duplicate delivery processing
  if (deliveryId && (await hasProcessedDelivery(deliveryId))) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const dataNode =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : payload;

  const orderId = String(dataNode.orderId || payload.orderId || "");
  const gatewayPaymentId = String(
    dataNode.paymentId || dataNode.id || payload.paymentId || ""
  );
  const rawStatus = String(
    dataNode.status || payload.status || payload.event || "PENDING"
  );
  const amountRaw = dataNode.amount ?? payload.amount;
  const currency = String(dataNode.currency || payload.currency || "INR").toUpperCase();
  const utr = dataNode.utr ? String(dataNode.utr) : undefined;

  const existing =
    (orderId ? await getPaymentByOrderId(orderId) : null) ??
    (gatewayPaymentId ? await getPaymentByGatewayId(gatewayPaymentId) : null);

  if (!existing) {
    if (deliveryId) await markProcessedDelivery(deliveryId);
    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: orderId || "UNKNOWN",
      paymentId: gatewayPaymentId || undefined,
      event: "WEBHOOK_UNKNOWN_ORDER",
      level: "warn",
      provider: "youpi-pg",
      message: `Verified webhook received for unknown orderId=${orderId} paymentId=${gatewayPaymentId}.`,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  }

  // Strictly validate amount & currency before accepting payment state transition
  if (amountRaw !== undefined && Number(amountRaw) !== existing.amountInr) {
    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: existing.orderId,
      paymentId: existing.id,
      event: "WEBHOOK_AMOUNT_MISMATCH",
      level: "security",
      provider: "youpi-pg",
      message: `Blocked webhook: payload amount ${amountRaw} != expected ${existing.amountInr}.`,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Webhook amount mismatch." },
      { status: 400 }
    );
  }

  if (currency !== existing.currency) {
    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: existing.orderId,
      paymentId: existing.id,
      event: "WEBHOOK_CURRENCY_MISMATCH",
      level: "security",
      provider: "youpi-pg",
      message: `Blocked webhook: currency ${currency} != expected ${existing.currency}.`,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Webhook currency mismatch." },
      { status: 400 }
    );
  }

  const nextStatus = mapGatewayStatusToPaymentStatus(rawStatus);
  const updated = {
    ...existing,
    status: nextStatus,
    rawGatewayStatus: rawStatus,
    settlementState:
      rawStatus.toUpperCase() === "RECONCILED"
        ? ("RECONCILED" as const)
        : nextStatus === "Success"
          ? ("NOT_RECONCILED" as const)
          : nextStatus === "Failed" || nextStatus === "Expired"
            ? ("REJECTED" as const)
            : existing.settlementState,
    utr: utr || existing.utr,
    updatedAt: new Date().toISOString(),
  };

  await savePaymentRecord(updated);

  if (deliveryId) {
    await markProcessedDelivery(deliveryId);
  }

  if (nextStatus === "Success") {
    await finalizeSuccessfulPayment(updated, "WEBHOOK_PAYMENT_VERIFIED");
  } else {
    await appendPaymentLog({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderId: updated.orderId,
      paymentId: updated.id,
      event: `WEBHOOK_STATUS_${nextStatus.toUpperCase()}`,
      level: nextStatus === "Failed" ? "warn" : "info",
      provider: "youpi-pg",
      message: `Processed verified webhook (${rawStatus} -> ${nextStatus}) for ${updated.orderId}.`,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true, orderId: updated.orderId, status: updated.status });
}
