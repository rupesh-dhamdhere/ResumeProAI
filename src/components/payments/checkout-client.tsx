"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  loadDemoUser,
  saveDemoUser,
  upsertPaymentOrder,
} from "@/lib/storage";
import type { CreateSessionResult, UpiDeepLinks } from "@/lib/payments/payment-service";
import type { PaymentRecord } from "@/types/payment";

const COMPLIANCE_DISCLAIMER =
  "This payment system uses open-source payment infrastructure. Payments are subject to banking and UPI network availability.";

const PLAN_DETAILS: Record<
  "pro" | "premium",
  { name: string; usd: string; inr: string; features: string[] }
> = {
  pro: {
    name: "Pro Plan",
    usd: "$9/month",
    inr: "₹749.00",
    features: [
      "Unlimited Resumes & Saved Versions",
      "All 22+ ATS-Friendly Templates",
      "AI Summary, Experience & Keyword Optimizer",
      "Job Description Match & Gap Report",
      "Remove ResumePro AI Watermark & Branding",
    ],
  },
  premium: {
    name: "Premium Plan",
    usd: "$19/month",
    inr: "₹1,599.00",
    features: [
      "Everything in Pro Plan",
      "AI Cover Letter Generator",
      "Priority ATS Scoring & Rewrite Insights",
      "LinkedIn Profile Data Sync",
      "Full Data Portability & Priority Support",
    ],
  },
};

const UPI_APP_BUTTONS: Array<{
  key: keyof UpiDeepLinks;
  label: string;
  accent: string;
}> = [
  { key: "gpay", label: "Google Pay", accent: "border-blue-500/30 hover:bg-blue-500/10" },
  { key: "phonepe", label: "PhonePe", accent: "border-purple-500/30 hover:bg-purple-500/10" },
  { key: "paytm", label: "Paytm", accent: "border-sky-500/30 hover:bg-sky-500/10" },
  { key: "bhim", label: "BHIM", accent: "border-orange-500/30 hover:bg-orange-500/10" },
  { key: "cred", label: "CRED", accent: "border-slate-500/30 hover:bg-slate-500/10" },
  { key: "generic", label: "Any UPI App", accent: "border-teal-500/30 hover:bg-teal-500/10" },
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function syncOrderToLocalStorage(payment: PaymentRecord) {
  upsertPaymentOrder({
    id: payment.id,
    orderId: payment.orderId,
    paymentId: payment.gatewayPaymentId,
    plan: payment.plan,
    amountInr: payment.amountFormatted,
    amountUsd: payment.amountUsd,
    currency: payment.currency,
    customerEmail: payment.customerEmail,
    customerName: payment.customerName,
    status:
      payment.status === "Success"
        ? "RECONCILED"
        : payment.status === "Failed"
          ? "FAILED"
          : payment.status === "Expired"
            ? "EXPIRED"
            : "PROCESSING",
    settlementState:
      payment.settlementState === "RECONCILED"
        ? "RECONCILED"
        : payment.settlementState === "REJECTED"
          ? "REJECTED"
          : "NOT_RECONCILED",
    mode: payment.provider === "youpi-pg" ? "youpi-pg" : "sandbox-preview",
    utr: payment.utr,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  });
}

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlanParam = searchParams.get("plan");
  const initialPlan: "pro" | "premium" =
    initialPlanParam === "premium" ? "premium" : "pro";

  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium">(initialPlan);
  const [name, setName] = useState("Alex Rivera");
  const [email, setEmail] = useState("alex.rivera@example.com");
  const [phone, setPhone] = useState("9876543210");
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const [creating, setCreating] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CreateSessionResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900);

  // Automatic fallback UI controls
  const [showFallbackPanel, setShowFallbackPanel] = useState(false);
  const [fallbackTab, setFallbackTab] = useState<"manual-upi" | "razorpay">("manual-upi");
  const [manualUtr, setManualUtr] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [submittingFallback, setSubmittingFallback] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  useEffect(() => {
    const user = loadDemoUser();
    if (user) {
      setName(user.fullName);
      setEmail(user.email);
      setUserId(user.id);
    }
  }, []);

  // Countdown timer for active payment session
  useEffect(() => {
    if (!session?.payment?.expiresAt) return;
    const updateClock = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(session.payment.expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(diff);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [session?.payment?.expiresAt]);

  const handlePaymentSuccess = useCallback(
    (payment: PaymentRecord) => {
      syncOrderToLocalStorage(payment);
      const user = loadDemoUser();
      if (user) {
        saveDemoUser({ ...user, plan: payment.plan });
      } else {
        saveDemoUser({
          id: payment.userId || "usr-demo",
          email: payment.customerEmail,
          fullName: payment.customerName,
          role: "user",
          plan: payment.plan,
          provider: "demo",
          createdAt: new Date().toISOString(),
        });
      }
      router.push(`/checkout/success?orderId=${encodeURIComponent(payment.orderId)}`);
    },
    [router]
  );

  const checkStatus = useCallback(async () => {
    if (!session?.payment?.orderId) return;
    setPolling(true);
    try {
      const res = await fetch(
        `/api/payments/status?orderId=${encodeURIComponent(session.payment.orderId)}`
      );
      const data = await res.json();
      if (!res.ok || !data.payment) return;

      const updated = data.payment as PaymentRecord;
      setSession((prev) => (prev ? { ...prev, payment: updated } : prev));
      syncOrderToLocalStorage(updated);

      if (data.youpiReachable === false && updated.provider === "youpi-pg") {
        setShowFallbackPanel(true);
      }

      if (updated.status === "Success") {
        handlePaymentSuccess(updated);
      } else if (updated.status === "Failed" || updated.status === "Expired") {
        router.push(
          `/checkout/failure?orderId=${encodeURIComponent(updated.orderId)}&reason=${encodeURIComponent(updated.status)}`
        );
      }
    } finally {
      setPolling(false);
    }
  }, [session?.payment?.orderId, handlePaymentSuccess, router]);

  // Automatic status polling every 4 seconds for active YouPI-PG orders
  useEffect(() => {
    const status = session?.payment?.status;
    if (!session?.payment?.orderId || (status !== "Pending" && status !== "Processing")) {
      return;
    }
    const interval = setInterval(() => {
      void checkStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [session?.payment?.orderId, session?.payment?.status, checkStatus]);

  async function handleStartCheckout(forceNew = false) {
    setError(null);
    setFallbackNotice(null);
    setCreating(true);
    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          userId,
          forceNew,
        }),
      });
      const data = (await res.json()) as CreateSessionResult & { error?: string };
      if (!res.ok || !data.payment) {
        setError(data.error || "Unable to initiate payment session.");
        return;
      }

      setSession(data);
      syncOrderToLocalStorage(data.payment);

      if (data.fallbackRequired || !data.youpiAvailable) {
        setShowFallbackPanel(true);
        setFallbackTab(data.razorpayConfigured ? "razorpay" : "manual-upi");
        setFallbackNotice(
          data.errorMessage ||
            "YouPI-PG gateway is unreachable right now. Automatic fallback options are ready below."
        );
      } else {
        setShowFallbackPanel(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error during checkout.");
      setShowFallbackPanel(true);
    } finally {
      setCreating(false);
    }
  }

  async function handleManualUpiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.payment?.orderId) return;
    setSubmittingFallback(true);
    setFallbackNotice(null);
    try {
      const res = await fetch("/api/payments/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual-upi-submit",
          orderId: session.payment.orderId,
          utr: manualUtr,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFallbackNotice(data.error || "Could not submit UTR.");
        return;
      }
      if (data.payment) {
        const updated = data.payment as PaymentRecord;
        setSession((prev) => (prev ? { ...prev, payment: updated } : prev));
        syncOrderToLocalStorage(updated);
        setFallbackNotice(
          `UTR ${updated.utr} recorded. Status is now Processing for admin reconciliation.`
        );
      }
    } finally {
      setSubmittingFallback(false);
    }
  }

  async function handleRazorpayCheckout() {
    if (!session?.payment?.orderId) return;
    setSubmittingFallback(true);
    setFallbackNotice(null);
    try {
      const res = await fetch("/api/payments/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "razorpay-create",
          orderId: session.payment.orderId,
        }),
      });
      const data = await res.json();
      if (!data.configured) {
        setFallbackNotice(
          data.error ||
            "Razorpay keys are not configured. Switching to Manual UPI QR Payment."
        );
        setFallbackTab("manual-upi");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setFallbackNotice(
          "Could not load Razorpay Checkout SDK. Please use Manual UPI QR Payment."
        );
        setFallbackTab("manual-upi");
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amountPaise,
        currency: data.currency,
        name: "ResumePro AI",
        description: `${PLAN_DETAILS[selectedPlan].name} Subscription`,
        order_id: data.razorpayOrderId,
        prefill: { name, email, contact: phone },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payments/fallback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "razorpay-verify",
              orderId: session.payment.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (verifyRes.ok && verifyJson.payment) {
            handlePaymentSuccess(verifyJson.payment as PaymentRecord);
          } else {
            setFallbackNotice(verifyJson.error || "Razorpay payment verification failed.");
          }
        },
      });
      rzp.open();
    } finally {
      setSubmittingFallback(false);
    }
  }

  async function handleCancelSession() {
    if (!session?.payment) return;
    await fetch("/api/payments/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: session.payment.orderId,
        paymentId: session.payment.gatewayPaymentId,
      }),
    });
    router.push(
      `/checkout/failure?orderId=${encodeURIComponent(session.payment.orderId)}&reason=Cancelled`
    );
  }

  const planInfo = PLAN_DETAILS[selectedPlan];
  const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const secs = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/15">
              YouPI-PG Primary Gateway + Automatic Fallback
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              Upgrade to ResumePro AI {planInfo.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan the dynamic UPI QR code or tap any supported Indian UPI app. Your subscription,
              GST invoice, and confirmation email trigger automatically upon verification.
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              Compare All Plans
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Plan & Billing Form */}
          <div className="space-y-6 lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Subscription Plan</CardTitle>
                <CardDescription>
                  Instant upgrade for unlimited resumes, ATS analysis & branding removal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["pro", "premium"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(tier);
                        setSession(null);
                        setShowFallbackPanel(false);
                      }}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        selectedPlan === tier
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "hover:border-primary/40"
                      }`}
                    >
                      <div className="text-sm font-semibold">
                        {PLAN_DETAILS[tier].name}
                      </div>
                      <div className="mt-1 text-lg font-bold text-primary">
                        {PLAN_DETAILS[tier].inr}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {PLAN_DETAILS[tier].usd}
                      </div>
                    </button>
                  ))}
                </div>

                <ul className="space-y-2 rounded-lg bg-muted/40 p-3.5 text-xs">
                  {planInfo.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Billing & Invoice Details</CardTitle>
                <CardDescription>
                  Used to issue your GST invoice and payment confirmation email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-name">Full Name</Label>
                  <Input
                    id="checkout-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-email">Email Address</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-phone">Mobile Number (for UPI receipts)</Label>
                  <Input
                    id="checkout-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleStartCheckout(Boolean(session))}
                  disabled={creating || !name.trim() || !email.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Dynamic UPI Request...
                    </>
                  ) : session ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate UPI Payment Request ({planInfo.inr})
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Pay {planInfo.inr} via UPI
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Dynamic QR, UPI App Buttons, Hosted Iframe & Automatic Fallback */}
          <div className="space-y-6 lg:col-span-7">
            <Card className="overflow-hidden border-2">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <QrCode className="h-5 w-5 text-primary" />
                      Dynamic UPI Payment Terminal
                    </CardTitle>
                    <CardDescription>
                      Scan with any UPI app or launch Google Pay, PhonePe, Paytm, BHIM, or CRED
                    </CardDescription>
                  </div>
                  {session?.payment && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1 font-mono text-xs">
                        <Clock className="h-3 w-3" />
                        {mins}:{secs}
                      </Badge>
                      <Badge
                        variant={
                          session.payment.status === "Success"
                            ? "default"
                            : session.payment.status === "Processing"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {session.payment.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {!session ? (
                  <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold">Ready to Generate Dynamic UPI QR</h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Click <strong>Pay {planInfo.inr} via UPI</strong> to create an order on YouPI-PG
                      with an encrypted webhook signature, dynamic QR code, and instant UPI app intents.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Order Summary & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Order ID:</span>{" "}
                        <span className="font-mono font-semibold">{session.payment.orderId}</span>
                        {session.reusedExistingOrder && (
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            Active Session Resumed
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void checkStatus()}
                          disabled={polling}
                        >
                          {polling ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Verify Status
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleCancelSession()}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>

                    {/* Dynamic QR Code + UPI Deep Links */}
                    <div className="grid gap-6 md:grid-cols-12">
                      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-5 text-slate-900 md:col-span-5">
                        {session.payment.qrDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={session.payment.qrDataUrl}
                            alt={`Dynamic UPI QR Code for ${session.payment.orderId}`}
                            className="h-52 w-52 rounded-lg border"
                          />
                        ) : (
                          <div className="flex h-52 w-52 items-center justify-center rounded-lg border bg-slate-100 text-xs text-slate-500">
                            QR Generating...
                          </div>
                        )}
                        <div className="mt-3 text-center">
                          <p className="text-sm font-bold">
                            Pay ₹{session.payment.amountFormatted}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Order {session.payment.orderId}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 md:col-span-7">
                        <div>
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                            <Smartphone className="h-4 w-4 text-primary" />
                            Pay Instantly via UPI App
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {UPI_APP_BUTTONS.map((app) => (
                              <a
                                key={app.key}
                                href={session.upiDeepLinks[app.key]}
                                className={`flex items-center justify-center rounded-lg border px-3 py-2.5 text-xs font-medium transition ${app.accent}`}
                              >
                                {app.label}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-muted-foreground">UPI Payment URI</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => {
                                void navigator.clipboard.writeText(session.payment.upiUri);
                                setCopiedVpa(true);
                                setTimeout(() => setCopiedVpa(false), 2000);
                              }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              {copiedVpa ? "Copied" : "Copy UPI Link"}
                            </Button>
                          </div>
                          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                            {session.payment.upiUri}
                          </p>
                        </div>

                        {session.youpiAvailable && session.payment.checkoutUrl && (
                          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                            <span>YouPI-PG Hosted Session Active</span>
                            <a
                              href={session.payment.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                            >
                              Open Full Gateway
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hosted YouPI-PG Iframe when gateway server is live */}
                    {session.youpiAvailable && session.payment.checkoutUrl && (
                      <div className="overflow-hidden rounded-xl border bg-white">
                        <iframe
                          title="YouPI-PG Checkout Portal"
                          src={session.payment.checkoutUrl}
                          className="h-[400px] w-full border-0"
                        />
                      </div>
                    )}

                    {/* Automatic Fallback Trigger Banner */}
                    {!showFallbackPanel && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-4 py-2.5 text-xs">
                        <span className="text-muted-foreground">
                          Having trouble with YouPI-PG verification or app intent?
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => setShowFallbackPanel(true)}
                        >
                          Switch to Razorpay / Manual UPI Fallback
                        </Button>
                      </div>
                    )}

                    {/* Fallback Payment Panel */}
                    {showFallbackPanel && (
                      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Automatic Fallback Payment Options
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={fallbackTab === "manual-upi" ? "default" : "outline"}
                              onClick={() => setFallbackTab("manual-upi")}
                            >
                              <QrCode className="mr-1.5 h-3.5 w-3.5" />
                              Manual UPI QR
                            </Button>
                            <Button
                              size="sm"
                              variant={fallbackTab === "razorpay" ? "default" : "outline"}
                              onClick={() => setFallbackTab("razorpay")}
                            >
                              <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                              Razorpay
                            </Button>
                          </div>
                        </div>

                        {fallbackNotice && (
                          <p className="mb-3 rounded-md bg-background/80 p-2.5 text-xs text-muted-foreground">
                            {fallbackNotice}
                          </p>
                        )}

                        {fallbackTab === "manual-upi" ? (
                          <form onSubmit={handleManualUpiSubmit} className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Scan the QR code above using any UPI app, transfer{" "}
                              <strong>₹{session.payment.amountFormatted}</strong>, then enter your
                              12-digit UTR / UPI Transaction Reference below for verification.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={manualUtr}
                                onChange={(e) => setManualUtr(e.target.value)}
                                placeholder="Enter 12-digit UPI Ref / UTR (e.g., 431298765432)"
                                required
                              />
                              <Button type="submit" disabled={submittingFallback}>
                                {submittingFallback ? (
                                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                ) : null}
                                Submit UTR
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                              Complete payment securely through Razorpay Checkout (Cards, UPI,
                              NetBanking). Subscription & invoice activate immediately upon verified
                              signature.
                            </p>
                            <Button
                              onClick={() => void handleRazorpayCheckout()}
                              disabled={submittingFallback}
                            >
                              {submittingFallback ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CreditCard className="mr-2 h-4 w-4" />
                              )}
                              Launch Razorpay Checkout (₹{session.payment.amountFormatted})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mandatory Compliance Disclaimer */}
            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Payment Infrastructure Notice</p>
                <p>{COMPLIANCE_DISCLAIMER}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
