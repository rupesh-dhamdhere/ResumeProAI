"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ATSPanel } from "@/components/resume/ats-panel";
import { ComplianceDisclaimerBanner } from "@/components/compliance/disclaimer-banner";
import { analyzeResumeATS, matchResumeToJobDescription } from "@/lib/ats-engine";
import { SAMPLE_RESUME_DATA } from "@/lib/sample-data";
import {
  addATSHistoryEntry,
  addJobMatchEntry,
  loadLocalResumes,
} from "@/lib/storage";
import { generateId } from "@/lib/utils";
import type { JobMatchResult, ResumeData, SavedResume } from "@/types/resume";

export function ATSCheckerClient() {
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [inputMode, setInputMode] = useState<"saved" | "paste">("saved");
  const [pastedTitle, setPastedTitle] = useState("Software Engineer");
  const [pastedText, setPastedText] = useState("");

  const [jobTitle, setJobTitle] = useState("Senior Full-Stack Engineer");
  const [company, setCompany] = useState("Vercel");
  const [jobDescription, setJobDescription] = useState(
    "We are looking for a Senior Full-Stack Engineer proficient in TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, CI/CD, and AWS. Experience designing scalable REST APIs, Redis caching, and automated testing is strongly preferred."
  );
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null);

  useEffect(() => {
    const list = loadLocalResumes();
    setSavedResumes(list);
    if (list[0]) {
      setSelectedResumeId(list[0].id);
    }
  }, []);

  const targetResumeData: ResumeData = useMemo(() => {
    if (inputMode === "saved") {
      const found = savedResumes.find((r) => r.id === selectedResumeId);
      return found ? found.data : SAMPLE_RESUME_DATA;
    }

    const lines = pastedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const emailMatch = pastedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const bullets = lines.filter((l) => l.length > 25).slice(0, 8);

    return {
      ...SAMPLE_RESUME_DATA,
      personalInfo: {
        fullName: lines[0] || "Pasted Candidate",
        jobTitle: pastedTitle,
        email: emailMatch ? emailMatch[0] : "",
        phone: pastedText.match(/\+?\d[\d\s().-]{7,}/)?.[0] || "",
        location: "United States",
        linkedin: pastedText.includes("linkedin") ? "linkedin.com/in/profile" : "",
        github: "",
        website: "",
      },
      summary: lines.slice(1, 4).join(" ").slice(0, 320),
      experience: bullets.length
        ? [
            {
              id: "pasted-exp",
              company: "Parsed Experience",
              role: pastedTitle,
              location: "",
              startDate: "2022",
              endDate: "Present",
              current: true,
              bullets,
            },
          ]
        : [],
      skills: pastedText
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 28)
        .slice(0, 14),
    };
  }, [inputMode, savedResumes, selectedResumeId, pastedText, pastedTitle]);

  const analysis = useMemo(() => analyzeResumeATS(targetResumeData), [targetResumeData]);

  const handleAnalyzeMatch = () => {
    const res = matchResumeToJobDescription(
      targetResumeData,
      jobDescription,
      jobTitle,
      company
    );
    setMatchResult(res);
    addJobMatchEntry(res);
    addATSHistoryEntry({
      id: generateId("atsh"),
      resumeId: selectedResumeId || "custom",
      resumeTitle:
        inputMode === "saved"
          ? savedResumes.find((r) => r.id === selectedResumeId)?.title || "Resume"
          : `Pasted (${pastedTitle})`,
      overallScore: analysis.overallScore,
      readabilityScore: analysis.readabilityScore,
      completenessScore: analysis.completenessScore,
      keywordScore: analysis.keywordScore,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="container py-12 space-y-8">
      <div className="max-w-3xl space-y-3">
        <Badge variant="accent">
          <FileSearch className="mr-1.5 h-3.5 w-3.5" />
          ATS Optimization & Job Matching Engine
        </Badge>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
          ATS Score Checker & Job Description Matcher
        </h1>
        <p className="text-muted-foreground">
          Audit your resume against Applicant Tracking System standards out of 100 and compare it directly against any target job posting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input + Job Match */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-sm">
            <h2 className="font-heading text-lg font-bold">1. Select Resume Source</h2>
            <Tabs
              value={inputMode}
              onValueChange={(v) => setInputMode(v as "saved" | "paste")}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="saved">Saved Resume</TabsTrigger>
                <TabsTrigger value="paste">Paste Resume Text</TabsTrigger>
              </TabsList>

              <TabsContent value="saved" className="space-y-3 pt-2">
                <Label>Choose a Saved Resume from Your Workspace</Label>
                <Select
                  value={selectedResumeId}
                  onValueChange={setSelectedResumeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedResumes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title} (ATS: {r.atsScore}/100)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end">
                  <Link href={`/builder?id=${selectedResumeId}`}>
                    <Button variant="link" size="sm" className="px-0 gap-1">
                      Open in Resume Builder <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="paste" className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>Target Job Title</Label>
                  <Input
                    value={pastedTitle}
                    onChange={(e) => setPastedTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Paste Full Resume Content</Label>
                  <Textarea
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste your entire resume text here to run an instant ATS audit..."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Job Description Matching */}
          <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                2. Job Description Match
              </h2>
              {matchResult && (
                <Badge
                  variant={matchResult.matchPercentage >= 75 ? "success" : "warning"}
                  className="text-sm px-3 py-1"
                >
                  {matchResult.matchPercentage}% Match
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Target Job Description</Label>
              <Textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <Button onClick={handleAnalyzeMatch} className="w-full gap-2" size="lg">
              <Sparkles className="h-4 w-4" />
              Run ATS & Job Description Match
            </Button>

            {matchResult && (
              <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                      Matched Keywords ({matchResult.matchedKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matchedKeywords.map((kw) => (
                        <Badge key={kw} variant="success">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                      Missing Keywords ({matchResult.missingKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingKeywords.map((kw) => (
                        <Badge key={kw} variant="warning">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tailoring Suggestions
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {matchResult.suggestions.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <ComplianceDisclaimerBanner variant="ats" />
        </div>

        {/* Right: Detailed ATS Panel */}
        <div className="lg:col-span-5">
          <ATSPanel analysis={analysis} />
        </div>
      </div>
    </div>
  );
}
