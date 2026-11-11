import { NextRequest, NextResponse } from "next/server";
import { createYoupiPaymentSession } from "@/lib/payments/payment-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      plan?: "pro" | "premium";
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      userId?: string;
      forceNew?: boolean;
    };

    const plan = body.plan === "premium" ? "premium" : "pro";
    const customerEmail = (body.customerEmail || "guest@resumepro.ai").trim();
    const customerName = (body.customerName || "ResumePro User").trim();

    if (!customerEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid customer email is required to initiate payment." },
        { status: 400 }
      );
    }

    const result = await createYoupiPaymentSession({
      plan,
      customerName,
      customerEmail,
      customerPhone: body.customerPhone,
      userId: body.userId,
      forceNew: body.forceNew,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to initialize payment session.",
      },
      { status: 500 }
    );
  }
}
