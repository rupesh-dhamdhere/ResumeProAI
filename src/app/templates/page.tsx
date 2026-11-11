import type { Metadata } from "next";
import { TemplatesClient } from "@/components/templates/templates-client";

export const metadata: Metadata = {
  title: "22+ ATS-Friendly Resume Templates",
  description:
    "Browse 22+ ATS-verified resume templates across Modern, Professional, Executive, Fresher, Tech, and Marketing styles with live preview.",
};

export default function TemplatesPage() {
  return <TemplatesClient />;
}
