"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PaymentRecord } from "@/types/payment";

function FailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const reasonParam = searchParams.get("reason") || "Failed";
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.payment) setPayment(data.payment as PaymentRecord);
      })
      .catch(() => {});
  }, [orderId]);

  const statusLabel = payment?.status || reasonParam;

  return (
    <div className="container max-w-2xl py-12">
      <Card className="border-2 border-destructive/30">
        <CardHeader className="border-b bg-destructive/5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <XCircle className="h-8 w-8" />
          </div>
          <Badge variant="destructive" className="mx-auto mb-2 w-fit">
            Payment {statusLabel}
          </Badge>
          <CardTitle className="text-2xl">Payment Was Not Completed</CardTitle>
          <CardDescription>
            {orderId ? (
              <>
                Order <span className="font-mono font-semibold">{orderId}</span> could not be
                confirmed.
              </>
            ) : (
              "Your UPI transaction was cancelled, expired, or declined by the UPI app."
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-foreground">No subscription charge applied</p>
              <p className="mt-1">
                If money was debited from your bank account due to a UPI network delay, it is
                either auto-reversed by your bank or can be reconciled using your 12-digit UTR in
                checkout.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={payment ? `/checkout?plan=${payment.plan}` : "/checkout"}>
              <Button>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Payment or Use Fallback
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
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

export default function CheckoutFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-sm text-muted-foreground">
          Loading payment status...
        </div>
      }
    >
      <FailureContent />
    </Suspense>
  );
}
