import Link from "next/link";
import { AlertCircle, ShieldCheck } from "lucide-react";

export function ComplianceDisclaimerBanner({
  variant = "both",
}: {
  variant?: "ai" | "ats" | "both";
}) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs text-muted-foreground space-y-1.5">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          {(variant === "ats" || variant === "both") && (
            <p>
              <strong className="text-foreground">ATS Score Disclaimer:</strong>{" "}
              Scores out of 100 and job match percentages are heuristic, informational estimates. They do not guarantee passing any employer&apos;s Applicant Tracking System, securing interviews, or receiving job offers.
            </p>
          )}
          {(variant === "ai" || variant === "both") && (
            <p>
              <strong className="text-foreground">AI Content Disclaimer:</strong>{" "}
              AI-generated summaries, bullet points, and cover letters are assistive drafts only. Please verify all facts, metrics, and dates before submitting.
            </p>
          )}
          <p className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-teal" />
            <span>
              You retain 100% ownership of your resume data. Protected under DPDP Act 2023 &amp; GDPR.{" "}
              <Link href="/terms" className="text-primary underline">
                Terms
              </Link>{" "}
              •{" "}
              <Link href="/data-request" className="text-primary underline">
                Export / Delete Data
              </Link>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
