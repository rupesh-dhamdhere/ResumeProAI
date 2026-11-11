import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeaturesGrid } from "@/components/home/features-grid";
import { HowItWorksSection } from "@/components/home/how-it-works";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore ResumePro AI's ATS Optimization Engine, AI bullet & cover letter writer, 22+ templates, Job Description matching, and DOCX/PDF export.",
};

export default function FeaturesPage() {
  return (
    <div>
      <section className="border-b bg-grid-pattern py-16 md:py-20">
        <div className="container max-w-4xl text-center space-y-5">
          <Badge variant="accent">Platform Capabilities</Badge>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight">
            Built to Outperform Every ATS Filter
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            From real-time ATS scoring and LinkedIn imports to drag-and-drop section reordering and AI cover letters, every workflow is streamlined for speed and precision.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/builder">
              <Button size="lg" className="gap-2">
                Launch Resume Builder <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/ats-checker">
              <Button size="lg" variant="outline">
                Try ATS Checker
              </Button>
            </Link>
          </div>
          <div className="pt-3 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-teal" /> 10-Step Guided Builder
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-teal" /> Multi-Version History
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-brand-teal" /> Instant PDF & DOCX
            </span>
          </div>
        </div>
      </section>

      <FeaturesGrid />
      <HowItWorksSection />
    </div>
  );
}
