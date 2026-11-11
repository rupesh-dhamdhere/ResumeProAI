"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { downloadInvoicePdf } from "@/lib/payments/invoice-pdf";
import { loadDemoUser, saveDemoUser } from "@/lib/storage";
import type { InvoiceRecord, PaymentRecord, SubscriptionRecord } from "@/types/payment";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Missing orderId reference.");
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.payment) {
          setError(data.error || "Unable to verify payment receipt.");
          return;
        }
        setPayment(data.payment);
        setSubscription(data.subscription || null);
        setInvoice(data.invoice || null);

        if (data.payment.status === "Success") {
          const user = loadDemoUser();
          if (user) {
            saveDemoUser({ ...user, plan: data.payment.plan });
          } else {
            saveDemoUser({
              id: data.payment.userId || "usr-demo",
              email: data.payment.customerEmail,
              fullName: data.payment.customerName,
              role: "user",
              plan: data.payment.plan,
              provider: "demo",
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        if (!cancelled) setError("Network error while verifying order.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying payment receipt and invoice...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="container max-w-xl py-16">
        <Card>
          <CardHeader>
            <CardTitle>Order Verification Unavailable</CardTitle>
            <CardDescription>{error || "Payment order could not be found."}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/checkout">
              <Button>Return to Checkout</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12">
      <Card className="overflow-hidden border-2 border-teal-500/30">
        <CardHeader className="border-b bg-teal-500/5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/15 text-teal-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <Badge className="mx-auto mb-2 w-fit bg-teal-600 text-white">
            Payment {payment.status}
          </Badge>
          <CardTitle className="text-2xl">
            {payment.status === "Success"
              ? "Subscription Activated!"
              : "Payment Submitted for Verification"}
          </CardTitle>
          <CardDescription>
            Order <span className="font-mono font-semibold">{payment.orderId}</span> •{" "}
            {payment.plan.toUpperCase()} Plan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="font-medium">{payment.customerName}</p>
              <p className="text-xs text-muted-foreground">{payment.customerEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="text-lg font-bold text-primary">₹{payment.amountFormatted} INR</p>
              <p className="text-xs text-muted-foreground">
                Gateway: {payment.provider} {payment.utr ? `• UTR: ${payment.utr}` : ""}
              </p>
            </div>
          </div>

          {subscription && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-primary/5 p-4 text-sm">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">
                    {subscription.plan.toUpperCase()} Plan ({subscription.status})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active until {new Date(subscription.currentPeriodEnd).toLocaleDateString()} •
                    Custom Branding Removal Enabled
                  </p>
                </div>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
          )}

          {invoice && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Invoice #{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    Total ₹{invoice.totalInr.toFixed(2)} (incl. 18% GST ₹{invoice.taxInr.toFixed(2)})
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => downloadInvoicePdf(invoice)}>
                <Download className="mr-1.5 h-4 w-4" />
                Download PDF Invoice
              </Button>
            </div>
          )}

          {payment.emailSent && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MailCheck className="h-4 w-4 text-teal-600" />
              <span>
                Confirmation email & receipt logged for{" "}
                <strong>{payment.customerEmail}</strong>.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/builder">
              <Button>Open Resume Builder</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">View Billing & Resumes</Button>
            </Link>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              This payment system uses open-source payment infrastructure. Payments are subject to
              banking and UPI network availability.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-sm text-muted-foreground">
          Loading payment confirmation...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
