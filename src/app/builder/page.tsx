import type { Metadata } from "next";
import { Suspense } from "react";
import { BuilderClient } from "@/components/resume/builder-client";

export const metadata: Metadata = {
  title: "Resume Builder",
  description:
    "Multi-step ATS resume builder with live preview, drag-and-drop section reordering, AI bullet generation, job matching, and PDF/DOCX export.",
};

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center text-sm text-muted-foreground">
          Loading ResumePro AI Builder...
        </div>
      }
    >
      <BuilderClient />
    </Suspense>
  );
}
