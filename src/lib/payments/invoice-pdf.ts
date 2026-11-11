"use client";

import { jsPDF } from "jspdf";
import type { InvoiceRecord } from "@/types/payment";

/**
 * Generates and downloads a formatted GST-style PDF invoice in the browser using jsPDF.
 */
export function downloadInvoicePdf(invoice: InvoiceRecord): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 54;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 108, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ResumePro AI", marginX, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text("ATS-Friendly Resume Builder & Career Intelligence", marginX, 66);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("TAX INVOICE", pageWidth - marginX, 46, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`#${invoice.invoiceNumber}`, pageWidth - marginX, 64, { align: "right" });
  doc.text(`Status: ${invoice.status}`, pageWidth - marginX, 80, { align: "right" });

  y = 140;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed To:", marginX, y);
  doc.text("Payment Details:", pageWidth / 2 + 20, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(invoice.customerName, marginX, y);
  doc.text(`Order ID: ${invoice.orderId}`, pageWidth / 2 + 20, y);

  y += 16;
  doc.text(invoice.customerEmail, marginX, y);
  doc.text(
    `Issued: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`,
    pageWidth / 2 + 20,
    y
  );

  y += 16;
  doc.text(`Gateway: ${invoice.provider.toUpperCase()}`, pageWidth / 2 + 20, y);
  if (invoice.utr) {
    y += 16;
    doc.text(`UPI Ref / UTR: ${invoice.utr}`, pageWidth / 2 + 20, y);
  }

  // Table Header
  y += 36;
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, y, pageWidth - marginX * 2, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("Description", marginX + 12, y + 18);
  doc.text("Amount (INR)", pageWidth - marginX - 12, y + 18, { align: "right" });

  // Line Item
  y += 46;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const descLines = doc.splitTextToSize(invoice.description, pageWidth - marginX * 2 - 120);
  doc.text(descLines, marginX + 12, y);
  doc.text(`INR ${invoice.subtotalInr.toFixed(2)}`, pageWidth - marginX - 12, y, {
    align: "right",
  });

  y += descLines.length * 14 + 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Totals
  y += 22;
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal", pageWidth - marginX - 150, y);
  doc.text(`INR ${invoice.subtotalInr.toFixed(2)}`, pageWidth - marginX - 12, y, {
    align: "right",
  });

  y += 18;
  doc.text("GST (18% included)", pageWidth - marginX - 150, y);
  doc.text(`INR ${invoice.taxInr.toFixed(2)}`, pageWidth - marginX - 12, y, {
    align: "right",
  });

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid", pageWidth - marginX - 150, y);
  doc.text(`INR ${invoice.totalInr.toFixed(2)}`, pageWidth - marginX - 12, y, {
    align: "right",
  });

  // Compliance Disclaimer Footer
  y += 64;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const disclaimer =
    "This payment system uses open-source payment infrastructure. Payments are subject to banking and UPI network availability.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - marginX * 2);
  doc.text(disclaimerLines, marginX, y);

  doc.save(`${invoice.invoiceNumber}-${invoice.orderId}.pdf`);
}
