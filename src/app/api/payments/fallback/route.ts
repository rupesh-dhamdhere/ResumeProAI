import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { generateInvoiceForPayment } from "@/lib/payments/invoice-service";
import { finalizeSuccessfulPayment } from "@/lib/payments/payment-service";
import {
  appendPaymentLog,
  getPaymentByOrderId,
  savePaymentRecord,
} from "@/lib/payments/store";

export const runtime = "nodejs";

/**
 * Handles automatic fallback payment flows when YouPI-PG is unavailable or failed:
 * 1. action = "manual-upi-submit": Customer submits 12-digit UTR for admin reconciliation (Processing)
 * 2. action = "razorpay-create": Creates a Razorpay order via Razorpay REST API when configured
 * 3. action = "razorpay-verify": Verifies Razorpay HMAC signature strictly and activates subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action: "manual-upi-submit" | "razorpay-create" | "razorpay-verify";
      orderId: string;
      utr?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };

    const payment = await getPaymentByOrderId(body.orderId);
    if (!payment) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (body.action === "manual-upi-submit") {
      const cleanUtr = (body.utr || "").trim();
      if (!/^[a-zA-Z0-9]{8,22}$/.test(cleanUtr)) {
        return NextResponse.json(
          { error: "Please enter a valid 8–22 character UPI Reference / UTR number." },
          { status: 400 }
        );
      }

      const updated = {
        ...payment,
        provider: "manual-upi-fallback" as const,
        status: "Processing" as const,
        rawGatewayStatus: "AWAITING_RECONCILIATION",
        settlementState: "NOT_RECONCILED" as const,
        utr: cleanUtr,
        updatedAt: new Date().toISOString(),
      };
      await savePaymentRecord(updated);
      const invoice = await generateInvoiceForPayment(updated, "Pending Verification");

      await appendPaymentLog({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        orderId: updated.orderId,
        paymentId: updated.id,
        event: "MANUAL_UPI_UTR_SUBMITTED",
        level: "info",
        provider: "manual-upi-fallback",
        message: `Submitted fallback Manual UPI UTR (${cleanUtr}) for reconciliation.`,
        metadata: { utr: cleanUtr },
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        payment: updated,
        invoice,
      });
    }

    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

    if (body.action === "razorpay-create") {
      if (!rzpKey || !rzpSecret) {
        return NextResponse.json(
          {
            configured: false,
            error: "Razorpay keys are not configured. Please use Manual UPI QR Payment fallback.",
          },
          { status: 200 }
        );
      }

      const authHeader = Buffer.from(`${rzpKey}:${rzpSecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(payment.amountInr * 100),
          currency: "INR",
          receipt: payment.orderId,
          notes: {
            plan: payment.plan,
            customerEmail: payment.customerEmail,
          },
        }),
      });
      const orderJson = await rzpRes.json();
      if (!rzpRes.ok || !orderJson.id) {
        return NextResponse.json(
          { configured: true, error: orderJson?.error?.description || "Razorpay order creation failed." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        configured: true,
        keyId: rzpKey,
        razorpayOrderId: orderJson.id,
        amountPaise: orderJson.amount,
        currency: orderJson.currency,
      });
    }

    if (body.action === "razorpay-verify") {
      if (!rzpSecret || !body.razorpayOrderId || !body.razorpayPaymentId || !body.razorpaySignature) {
        return NextResponse.json(
          { error: "Missing Razorpay verification parameters." },
          { status: 400 }
        );
      }

      const expectedSig = crypto
        .createHmac("sha256", rzpSecret)
        .update(`${body.razorpayOrderId}|${body.razorpayPaymentId}`)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSig, "utf8");
      const actualBuf = Buffer.from(body.razorpaySignature.trim(), "utf8");
      if (
        expectedBuf.length !== actualBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, actualBuf)
      ) {
        await appendPaymentLog({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          orderId: payment.orderId,
          paymentId: payment.id,
          event: "RAZORPAY_INVALID_SIGNATURE",
          level: "security",
          provider: "razorpay-fallback",
          message: `Blocked forged Razorpay verification attempt for ${payment.orderId}.`,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 401 });
      }

      const finalized = await finalizeSuccessfulPayment(
        {
          ...payment,
          provider: "razorpay-fallback",
          gatewayPaymentId: body.razorpayPaymentId,
          status: "Success",
          rawGatewayStatus: "CAPTURED",
          settlementState: "RECONCILED",
          utr: body.razorpayPaymentId,
          updatedAt: new Date().toISOString(),
        },
        "RAZORPAY_FALLBACK_VERIFIED"
      );

      return NextResponse.json({
        success: true,
        ...finalized,
      });
    }

    return NextResponse.json({ error: "Unsupported fallback action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Fallback payment request failed.",
      },
      { status: 500 }
    );
  }
}
