import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { ResumeMockupSection } from "@/components/home/resume-mockup";
import { FeaturesGrid } from "@/components/home/features-grid";
import { HowItWorksSection } from "@/components/home/how-it-works";
import { TestimonialsSection } from "@/components/home/testimonials";
import { PricingSection } from "@/components/home/pricing-section";
import { FAQSection } from "@/components/home/faq-section";

export const metadata: Metadata = {
  title: "ResumePro AI — ATS-Friendly Resume Maker & Job Match Engine",
  description:
    "Create ATS-optimized resumes in minutes. Get a live ATS score out of 100, AI bullet suggestions, 22+ ATS-safe templates, Job Description matching, and PDF/DOCX export.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ResumeMockupSection />
      <FeaturesGrid />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
    </>
  );
}
