import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { PricingSection } from "@/components/home/pricing-section";
import { FAQSection } from "@/components/home/faq-section";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare ResumePro AI plans: Free Plan, Pro Plan ($9/month), and Premium Plan ($19/month).",
};

const COMPARISON = [
  { feature: "Saved Resumes & Versions", free: "Up to 2", pro: "Unlimited", premium: "Unlimited" },
  { feature: "ATS-Safe Templates", free: "8 Core", pro: "All 22+", premium: "All 22+ & Early Drops" },
  { feature: "Live ATS Score (0–100)", free: true, pro: true, premium: true },
  { feature: "AI Summary & Bullet Writer", free: "3/mo", pro: "Unlimited", premium: "Unlimited" },
  { feature: "Job Description Matcher", free: "Basic", pro: "Full Reports", premium: "Full + Auto-Tailor" },
  { feature: "AI Cover Letter Generator", free: false, pro: "5/mo", premium: "Unlimited" },
  { feature: "DOCX Word Export", free: false, pro: true, premium: true },
  { feature: "Custom Branding Removal", free: false, pro: true, premium: true },
  { feature: "LinkedIn Profile Import", free: true, pro: true, premium: true },
];

export default function PricingPage() {
  const renderCell = (val: boolean | string) => {
    if (typeof val === "string") return <span className="text-sm font-medium">{val}</span>;
    return val ? (
      <Check className="h-4 w-4 text-emerald-500 mx-auto" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
    );
  };

  return (
    <div>
      <PricingSection />

      <section className="py-16 border-b">
        <div className="container max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">
              Plan Comparison
            </h2>
            <p className="text-sm text-muted-foreground">
              Every plan includes SSL encryption, Supabase cloud sync, and drag-and-drop editing.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold">Free</th>
                  <th className="px-4 py-3 text-center font-semibold text-primary">Pro ($9/mo)</th>
                  <th className="px-4 py-3 text-center font-semibold text-brand-teal">Premium ($19/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-3 font-medium">{row.feature}</td>
                    <td className="px-4 py-3 text-center">{renderCell(row.free)}</td>
                    <td className="px-4 py-3 text-center">{renderCell(row.pro)}</td>
                    <td className="px-4 py-3 text-center">{renderCell(row.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FAQSection />
    </div>
  );
}
