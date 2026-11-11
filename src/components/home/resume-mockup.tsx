"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
  Wand2,
  ArrowRight,
  FileText,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SAMPLE_RESUME_DATA } from "@/lib/sample-data";
import { RESUME_TEMPLATES } from "@/lib/templates-data";
import { analyzeResumeATS } from "@/lib/ats-engine";
import { TemplateRenderer } from "@/components/resume/template-renderer";

export function ResumeMockupSection() {
  const [selectedTemplateId, setSelectedTemplateId] = useState("modern-cobalt");
  const [optimized, setOptimized] = useState(true);

  const demoData = useMemo(() => {
    if (optimized) return SAMPLE_RESUME_DATA;
    return {
      ...SAMPLE_RESUME_DATA,
      summary: "Software engineer looking for a good role in web development.",
      skills: ["JavaScript", "HTML", "CSS"],
      experience: SAMPLE_RESUME_DATA.experience.map((e) => ({
        ...e,
        bullets: [
          "Responsible for working on web applications.",
          "Helped with backend APIs and database tasks.",
        ],
      })),
    };
  }, [optimized]);

  const analysis = useMemo(() => analyzeResumeATS(demoData), [demoData]);
  const template = useMemo(
    () =>
      RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      RESUME_TEMPLATES[0],
    [selectedTemplateId]
  );

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-b">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive ATS Score Demo Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <Badge variant="outline" className="text-primary border-primary/30">
                Interactive ATS Demonstration
              </Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
                See How ATS Optimization Doubles Your Score
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Toggle between a standard unoptimized draft and an AI-optimized resume, or switch templates below to inspect live ATS parsing quality.
              </p>
            </div>

            {/* Toggle Optimization State */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    ATS Score Demo
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`font-heading text-4xl font-extrabold ${
                        analysis.overallScore >= 85
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }`}
                    >
                      {analysis.overallScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={optimized ? "outline" : "default"}
                  onClick={() => setOptimized((v) => !v)}
                  className="gap-1.5"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {optimized ? "View Unoptimized Draft" : "Apply AI Optimization"}
                </Button>
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Section Completeness</span>
                    <span className="font-semibold">{analysis.completenessScore}%</span>
                  </div>
                  <Progress value={analysis.completenessScore} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Role Keyword Match</span>
                    <span className="font-semibold">{analysis.keywordScore}%</span>
                  </div>
                  <Progress value={analysis.keywordScore} indicatorClassName="bg-brand-teal" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Quantified Impact</span>
                    <span className="font-semibold">{analysis.impactScore}%</span>
                  </div>
                  <Progress value={analysis.impactScore} indicatorClassName="bg-indigo-500" />
                </div>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-xs space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5 text-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  {optimized ? "Passed ATS Checks:" : "Top Issues Detected:"}
                </p>
                {optimized ? (
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Strong action verbs, {analysis.quantifiedBulletRatio}% quantified metrics, and {analysis.detectedKeywords.length} indexed role keywords.
                  </p>
                ) : (
                  <p className="text-amber-600 dark:text-amber-400">
                    {analysis.suggestions[0]}
                  </p>
                )}
              </div>
            </div>

            {/* 1-click template preview switcher */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                One-Click Template Preview
              </p>
              <div className="flex flex-wrap gap-2">
                {RESUME_TEMPLATES.slice(0, 5).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedTemplateId === tpl.id
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/builder?template=${selectedTemplateId}`}>
                <Button className="gap-2">
                  <FileText className="h-4 w-4" />
                  Customize This Resume
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="ghost" className="gap-1.5">
                  Browse All 22 Templates
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Live Resume Mockup Card */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border bg-slate-100/80 dark:bg-slate-900/70 p-3 sm:p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between px-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Live Preview — {template.name} ({template.category})
                </span>
                <Badge variant="success">ATS Parse: {template.atsCompatibility}%</Badge>
              </div>
              <div className="max-h-[600px] overflow-y-auto rounded-lg">
                <TemplateRenderer data={demoData} template={template} compactPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
