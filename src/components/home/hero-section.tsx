import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b bg-grid-pattern">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <div className="container relative py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <Badge variant="accent" className="px-3.5 py-1 text-xs font-semibold">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            ATS-Verified AI Resume Engine • 22+ Recruiter Templates
          </Badge>

          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Build an{" "}
            <span className="bg-gradient-to-r from-brand-blue via-blue-500 to-brand-teal bg-clip-text text-transparent">
              ATS-Friendly Resume
            </span>{" "}
            Tailored to Every Role
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            ResumePro AI helps you format clean single-column resumes, review heuristic ATS readability &amp; keyword scores, draft metric-driven bullets, and align your skills to any job description—while you retain 100% ownership of your data.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/builder">
              <Button size="lg" className="gap-2 shadow-md shadow-primary/20">
                Build My ATS Resume Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/ats-checker">
              <Button size="lg" variant="outline" className="gap-2">
                <Upload className="h-4 w-4 text-brand-teal" />
                Check My ATS Score
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-teal" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              DPDP Act 2023 &amp; GDPR compliant • Encrypted storage
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-teal" />
              You own 100% of your resume data
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
