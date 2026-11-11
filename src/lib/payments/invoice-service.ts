import {
  appendPaymentLog,
  getInvoiceById,
  listInvoices,
  saveInvoiceRecord,
  savePaymentRecord,
} from "@/lib/payments/store";
import type { InvoiceRecord, PaymentRecord } from "@/types/payment";

/**
 * Computes GST-inclusive 18% breakdown (subtotal + 18% IGST/CGST+SGST) from total INR amount.
 */
function calculateGstBreakdown(totalInr: number): { subtotalInr: number; taxInr: number } {
  const subtotal = Math.round((totalInr / 1.18) * 100) / 100;
  const tax = Math.round((totalInr - subtotal) * 100) / 100;
  return { subtotalInr: subtotal, taxInr: tax };
}

/**
 * Generates or returns the existing invoice for a payment record.
 */
export async function generateInvoiceForPayment(
  payment: PaymentRecord,
  statusOverride?: InvoiceRecord["status"]
): Promise<InvoiceRecord> {
  if (payment.invoiceId) {
    const existing = await getInvoiceById(payment.invoiceId);
    if (existing) {
      if (statusOverride && existing.status !== statusOverride) {
        const updated: InvoiceRecord = {
          ...existing,
          status: statusOverride,
          utr: payment.utr ?? existing.utr,
        };
        await saveInvoiceRecord(updated);
        return updated;
      }
      return existing;
    }
  }

  const allInvoices = await listInvoices();
  const byOrder = allInvoices.find((inv) => inv.orderId === payment.orderId);
  if (byOrder) {
    return byOrder;
  }

  const year = new Date().getFullYear();
  const sequence = String(allInvoices.length + 1).padStart(4, "0");
  const { subtotalInr, taxInr } = calculateGstBreakdown(payment.amountInr);

  const invoiceStatus: InvoiceRecord["status"] =
    statusOverride ??
    (payment.status === "Refunded"
      ? "Refunded"
      : payment.status === "Success"
        ? "Paid"
        : "Pending Verification");

  const invoice: InvoiceRecord = {
    id: `inv-${payment.orderId.toLowerCase()}`,
    invoiceNumber: `INV-${year}-${sequence}`,
    orderId: payment.orderId,
    paymentId: payment.id,
    userId: payment.userId,
    customerName: payment.customerName,
    customerEmail: payment.customerEmail,
    plan: payment.plan,
    description:
      payment.plan === "premium"
        ? "ResumePro AI — Premium Monthly Subscription (Unlimited ATS, AI Suite & Branding Removal)"
        : "ResumePro AI — Pro Monthly Subscription (Unlimited ATS, AI & PDF/DOCX Export)",
    subtotalInr,
    taxInr,
    totalInr: payment.amountInr,
    currency: "INR",
    utr: payment.utr,
    provider: payment.provider,
    status: invoiceStatus,
    issuedAt: new Date().toISOString(),
  };

  await saveInvoiceRecord(invoice);

  if (payment.invoiceId !== invoice.id) {
    await savePaymentRecord({
      ...payment,
      invoiceId: invoice.id,
      updatedAt: new Date().toISOString(),
    });
  }

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: payment.orderId,
    paymentId: payment.id,
    event: "INVOICE_GENERATED",
    level: "info",
    provider: payment.provider,
    message: `Generated invoice ${invoice.invoiceNumber} (${invoice.status}) for ₹${invoice.totalInr}.`,
    metadata: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    timestamp: new Date().toISOString(),
  });

  return invoice;
}
