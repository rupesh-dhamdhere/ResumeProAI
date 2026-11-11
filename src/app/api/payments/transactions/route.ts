import { NextRequest, NextResponse } from "next/server";
import {
  listInvoices,
  listPayments,
  listSubscriptions,
} from "@/lib/payments/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: "email query parameter is required." },
      { status: 400 }
    );
  }

  try {
    const [payments, subscriptions, invoices] = await Promise.all([
      listPayments(email),
      listSubscriptions(email),
      listInvoices(email),
    ]);

    return NextResponse.json({
      payments,
      subscription: subscriptions[0] ?? null,
      invoices,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load user transactions." },
      { status: 500 }
    );
  }
}
