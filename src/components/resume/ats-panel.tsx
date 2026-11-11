"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  BookOpen,
  Target,
  Zap,
} from "lucide-react";
import type { ATSAnalysisResult } from "@/types/resume";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceDisclaimerBanner } from "@/components/compliance/disclaimer-banner";

interface ATSPanelProps {
  analysis: ATSAnalysisResult;
  onAddSkill?: (skill: string) => void;
  onRunAIImprove?: () => void;
  aiLoading?: boolean;
}

export function ATSPanel({
  analysis,
  onAddSkill,
  onRunAIImprove,
  aiLoading,
}: ATSPanelProps) {
  const scoreColor =
    analysis.overallScore >= 85
      ? "text-emerald-500"
      : analysis.overallScore >= 65
        ? "text-amber-500"
        : "text-rose-500";

  const scoreLabel =
    analysis.overallScore >= 85
      ? "ATS Ready"
      : analysis.overallScore >= 65
        ? "Good Foundation"
        : "Needs Optimization";

  return (
    <div className="space-y-4">
      {/* Score Overview */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Live ATS Score
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`font-heading text-4xl font-bold ${scoreColor}`}>
                {analysis.overallScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <Badge
              variant={
                analysis.overallScore >= 85
                  ? "success"
                  : analysis.overallScore >= 65
                    ? "warning"
                    : "destructive"
              }
              className="mt-2"
            >
              {scoreLabel}
            </Badge>
          </div>

          <div className="text-right space-y-1 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">{analysis.wordCount}</strong> words
            </p>
            <p>
              ~<strong className="text-foreground">{analysis.estimatedReadingSeconds}s</strong> scan time
            </p>
            <p>
              <strong className="text-foreground">{analysis.quantifiedBulletRatio}%</strong> quantified
            </p>
          </div>
        </div>

        {/* Sub-metrics */}
        <div className="mt-4 space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-primary" /> Completeness
              </span>
              <span className="font-medium">{analysis.completenessScore}%</span>
            </div>
            <Progress value={analysis.completenessScore} />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-brand-teal" /> Keywords
              </span>
              <span className="font-medium">{analysis.keywordScore}%</span>
            </div>
            <Progress value={analysis.keywordScore} indicatorClassName="bg-brand-teal" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Impact & Verbs
              </span>
              <span className="font-medium">{analysis.impactScore}%</span>
            </div>
            <Progress value={analysis.impactScore} indicatorClassName="bg-amber-500" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Readability
              </span>
              <span className="font-medium">{analysis.readabilityScore}%</span>
            </div>
            <Progress value={analysis.readabilityScore} indicatorClassName="bg-indigo-500" />
          </div>
        </div>

        {onRunAIImprove && (
          <Button
            size="sm"
            variant="accent"
            className="mt-4 w-full gap-1.5"
            onClick={onRunAIImprove}
            disabled={aiLoading}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiLoading ? "Analyzing with AI..." : "Get AI Improvement Plan"}
          </Button>
        )}
      </div>

      {/* Missing Skills Recommendations */}
      {analysis.missingSkills.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended Role Keywords
          </p>
          <p className="text-xs text-muted-foreground">
            Click any verified skill below to add it to your resume:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.missingSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => onAddSkill?.(skill)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Checks */}
      <div className="rounded-xl border bg-card p-4 space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ATS Audit Checklist
        </p>
        <div className="space-y-2">
          {analysis.checks.map((check) => (
            <div
              key={check.id}
              className="flex items-start gap-2.5 rounded-lg border p-2.5 text-xs"
            >
              {check.severity === "good" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : check.severity === "warning" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              )}
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {check.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {check.pointsEarned}/{check.pointsMax}
                  </span>
                </div>
                <p className="text-muted-foreground leading-snug">
                  {check.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ComplianceDisclaimerBanner variant="both" />
    </div>
  );
}
