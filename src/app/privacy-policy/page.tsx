import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy Policy (DPDP Act 2023 & GDPR)",
  description:
    "How ResumePro AI collects, encrypts, processes, and protects personal data in compliance with India's Digital Personal Data Protection Act 2023 and the EU GDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-14 space-y-8">
      <header className="space-y-3 border-b pb-6">
        <Badge variant="accent">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          DPDP Act (India) 2023 &amp; GDPR Compliant
        </Badge>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Effective Date: November 11, 2026 • Data Fiduciary / Controller: ResumePro AI
        </p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
        <section className="rounded-xl border bg-card p-5 space-y-2">
          <h2 className="font-heading text-lg font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> 1. 100% User Ownership of Resume Data
          </h2>
          <p>
            <strong>You own all uploaded, imported, and created resume data.</strong> ResumePro AI claims zero ownership rights over your career history, contact details, cover letters, or uploaded files. We never sell, rent, or trade your personal data to recruiters, data brokers, or third-party advertisers, and we never use your private resumes to train public AI models without explicit opt-in consent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold">
            2. Personal Data We Collect &amp; Purpose Limitation
          </h2>
          <p>
            In accordance with the <strong>Digital Personal Data Protection Act, 2023 (India)</strong> (Section 5 &amp; Section 6) and <strong>GDPR Article 5 &amp; Article 6</strong>, we collect only the minimum personal data strictly necessary for the service you request:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li>
              <strong>Account &amp; Authentication Data:</strong> Email address, display name, and OAuth identifier (Google or LinkedIn) via encrypted Supabase Auth.
            </li>
            <li>
              <strong>Resume &amp; Career Content:</strong> Work history, education, skills, certifications, projects, and optional job descriptions you voluntarily enter to build, score, or export resumes.
            </li>
            <li>
              <strong>Consent &amp; Audit Logs:</strong> Timestamped cookie preferences and privacy request logs maintained for regulatory accountability.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold">
            3. Encrypted Storage &amp; Security Measures
          </h2>
          <p>
            All data transmitted between your browser and our servers is encrypted using <strong>TLS 1.3 (HTTPS)</strong>. Stored database records in Supabase PostgreSQL are protected with <strong>AES-256 encryption at rest</strong> and enforced by strict <strong>Row-Level Security (RLS)</strong> policies so only the authenticated owner can access or modify their resumes. Public share links are disabled by default and only activated when explicitly enabled by you.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold">
            4. Your Rights Under DPDP Act 2023 &amp; GDPR
          </h2>
          <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
            <li><strong>Right to Access &amp; Portability (GDPR Art. 15 &amp; 20 / DPDP Sec. 11):</strong> Export a machine-readable JSON copy of all your resumes, ATS reports, and profile metadata at any time.</li>
            <li><strong>Right to Correction &amp; Updating (GDPR Art. 16 / DPDP Sec. 12):</strong> Edit or correct any personal data directly in the Resume Builder or request assistance.</li>
            <li><strong>Right to Erasure / Deletion (GDPR Art. 17 / DPDP Sec. 12):</strong> Permanently delete your account, resumes, and associated history via our self-service portal.</li>
            <li><strong>Right to Withdraw Consent (GDPR Art. 7 / DPDP Sec. 6):</strong> Withdraw optional cookie or AI processing consent at any time without affecting essential access.</li>
            <li><strong>Right to Grievance Redressal (DPDP Sec. 13):</strong> Contact our Grievance Officer / Data Protection Officer directly.</li>
          </ul>
          <p className="pt-2">
            Exercise any of these rights immediately on our{" "}
            <Link href="/data-request" className="text-primary font-medium underline">
              Data Export &amp; Deletion Request Page
            </Link>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-heading text-lg font-bold">
            5. Data Retention &amp; Cross-Border Transfers
          </h2>
          <p>
            We retain your resume data only for as long as your account remains active or as needed to provide the service. Upon a verified deletion request, personal records are purged from active databases within 72 hours (and backups within 30 days). Where cloud sub-processors operate outside India or the EEA, transfers rely on Standard Contractual Clauses (SCCs) and equivalent safeguards.
          </p>
        </section>

        <section className="rounded-xl border bg-muted/40 p-5 space-y-1.5">
          <h2 className="font-heading text-base font-bold">
            6. Grievance Officer &amp; Data Protection Officer (DPO)
          </h2>
          <p className="text-muted-foreground">
            For DPDP Act 2023 grievances or GDPR inquiries, contact: <strong>dpo@resumepro.ai</strong> (Response SLA: within 48 hours; resolution within 15 days). You may also reach us via our{" "}
            <Link href="/contact" className="text-primary underline">Contact Page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
