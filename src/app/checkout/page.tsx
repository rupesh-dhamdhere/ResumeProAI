import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "@/components/payments/checkout-client";

export const metadata: Metadata = {
  title: "Checkout — YouPI-PG UPI Gateway",
  description:
    "Upgrade to ResumePro AI Pro or Premium using the self-hosted YouPI-PG UPI payment gateway.",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-sm text-muted-foreground">
          Loading YouPI-PG Checkout...
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
