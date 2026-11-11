"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Printer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateRenderer } from "@/components/resume/template-renderer";
import { loadLocalResumes } from "@/lib/storage";
import { SAMPLE_RESUME_DATA } from "@/lib/sample-data";
import { getTemplateById } from "@/lib/templates-data";
import { exportResumeToPDF } from "@/lib/export-pdf";
import type { SavedResume } from "@/types/resume";

export default function SharedResumePage() {
  const params = useParams<{ id: string }>();
  const [resume, setResume] = useState<SavedResume | null>(null);

  useEffect(() => {
    const all = loadLocalResumes();
    const match = all.find(
      (r) => r.shareSlug === params.id || r.id === params.id
    );
    setResume(match || all[0] || null);
  }, [params.id]);

  const data = resume?.data || SAMPLE_RESUME_DATA;
  const template = getTemplateById(resume?.templateId || "modern-cobalt");

  return (
    <div className="container py-10 max-w-4xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2.5">
          <Badge variant="accent">Shared ATS Resume</Badge>
          <span className="text-sm font-medium">
            {data.personalInfo.fullName} — {data.personalInfo.jobTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              exportResumeToPDF(data, template, resume?.title || "Resume")
            }
          >
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Link href="/builder">
            <Button size="sm" variant="accent" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Build Yours
            </Button>
          </Link>
        </div>
      </div>

      <TemplateRenderer data={data} template={template} />
    </div>
  );
}
