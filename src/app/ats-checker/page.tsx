import type { Metadata } from "next";
import { ATSCheckerClient } from "@/components/ats/ats-checker-client";

export const metadata: Metadata = {
  title: "ATS Score Checker & Job Matcher",
  description:
    "Analyze your resume against ATS standards out of 100, detect missing skills, check readability, and match keywords against any job description.",
};

export default function ATSCheckerPage() {
  return <ATSCheckerClient />;
}
