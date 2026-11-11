import { NextRequest, NextResponse } from "next/server";
import { processPaymentRefund } from "@/lib/payments/payment-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      reason?: string;
      adminEmail?: string;
    };

    if (!body.orderId) {
      return NextResponse.json({ error: "orderId is required." }, { status: 400 });
    }

    const refunded = await processPaymentRefund(
      body.orderId,
      body.reason || "Admin initiated refund",
      body.adminEmail || "admin@resumepro.ai"
    );

    if (!refunded) {
      return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment: refunded });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund operation failed." },
      { status: 500 }
    );
  }
}
