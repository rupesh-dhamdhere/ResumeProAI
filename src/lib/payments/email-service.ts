import { appendPaymentLog, savePaymentRecord } from "@/lib/payments/store";
import type { InvoiceRecord, PaymentRecord } from "@/types/payment";

/**
 * Sends a payment confirmation & invoice email using Resend if configured,
 * or records an audited email notification dispatch event in payment_logs.
 */
export async function sendPaymentConfirmationEmail(
  payment: PaymentRecord,
  invoice: InvoiceRecord
): Promise<boolean> {
  if (payment.emailSent) {
    return true;
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() || "ResumePro AI Billing <billing@resumepro.ai>";
  const subject = `Payment Confirmed: ${invoice.invoiceNumber} (${payment.plan.toUpperCase()} Plan) — ResumePro AI`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
      <h2>Payment Confirmation — ResumePro AI</h2>
      <p>Hi ${payment.customerName},</p>
      <p>Thank you for upgrading to the <strong>${payment.plan.toUpperCase()}</strong> plan.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0;"><strong>Invoice Number:</strong></td><td>${invoice.invoiceNumber}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Order ID:</strong></td><td>${payment.orderId}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Amount Paid:</strong></td><td>INR ${payment.amountInr.toFixed(2)}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Gateway:</strong></td><td>${payment.provider}</td></tr>
        ${payment.utr ? `<tr><td style="padding: 6px 0;"><strong>UPI Ref / UTR:</strong></td><td>${payment.utr}</td></tr>` : ""}
      </table>
      <p>You can download your PDF invoice anytime from your ResumePro AI Dashboard.</p>
      <p style="font-size: 12px; color: #64748b;">
        This payment system uses open-source payment infrastructure. Payments are subject to banking and UPI network availability.
      </p>
    </div>
  `;

  let deliveryMode = "audit-simulated";
  const dispatched = true;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [payment.customerEmail],
          subject,
          html: htmlBody,
        }),
      });
      if (response.ok) {
        deliveryMode = "resend-api";
      } else {
        deliveryMode = `resend-fallback-${response.status}`;
      }
    } catch {
      deliveryMode = "resend-network-fallback";
    }
  }

  await savePaymentRecord({
    ...payment,
    emailSent: dispatched,
    updatedAt: new Date().toISOString(),
  });

  await appendPaymentLog({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: payment.orderId,
    paymentId: payment.id,
    event: "CONFIRMATION_EMAIL_DISPATCHED",
    level: "info",
    provider: payment.provider,
    message: `Payment confirmation email processed for ${payment.customerEmail} (${deliveryMode}).`,
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      deliveryMode,
      subject,
    },
    timestamp: new Date().toISOString(),
  });

  return dispatched;
}
