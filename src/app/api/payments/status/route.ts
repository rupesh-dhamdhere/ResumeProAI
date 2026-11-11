import { NextRequest, NextResponse } from "next/server";
import { verifyAndSyncPaymentStatus } from "@/lib/payments/payment-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") || searchParams.get("paymentId");

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId or paymentId query parameter is required." },
      { status: 400 }
    );
  }

  try {
    const result = await verifyAndSyncPaymentStatus(orderId);
    if (!result.payment) {
      return NextResponse.json(
        { error: "Payment order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to verify payment status.",
      },
      { status: 500 }
    );
  }
}
