"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Award,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  GraduationCap,
  GripVertical,
  History,
  Languages,
  Linkedin,
  Mail,
  Plus,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  User,
  Users,
  Wand2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateRenderer } from "@/components/resume/template-renderer";
import { ATSPanel } from "@/components/resume/ats-panel";
import { ComplianceDisclaimerBanner } from "@/components/compliance/disclaimer-banner";
import { analyzeResumeATS, matchResumeToJobDescription } from "@/lib/ats-engine";
import { RESUME_TEMPLATES, getTemplateById } from "@/lib/templates-data";
import { exportResumeToPDF } from "@/lib/export-pdf";
import { exportResumeToDOCX } from "@/lib/export-docx";
import {
  SAMPLE_RESUME_DATA,
  parseLinkedInProfileText,
} from "@/lib/sample-data";
import {
  addATSHistoryEntry,
  addJobMatchEntry,
  getActiveResumeId,
  loadDemoUser,
  loadLocalResumes,
  saveLocalResumes,
  setActiveResumeId,
  syncResumeToSupabase,
} from "@/lib/storage";
import { cn, generateId, slugify } from "@/lib/utils";
import type {
  JobMatchResult,
  ResumeData,
  SavedResume,
  SectionKey,
} from "@/types/resume";

type BuilderStepKey = "personal" | SectionKey;

const STEPS: { key: BuilderStepKey; label: string; icon: React.ElementType }[] = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "summary", label: "Summary", icon: FileText },
  { key: "experience", label: "Experience", icon: Briefcase },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "certifications", label: "Certifications", icon: ShieldCheck },
  { key: "projects", label: "Projects", icon: FolderGit2 },
  { key: "achievements", label: "Achievements", icon: Award },
  { key: "languages", label: "Languages", icon: Languages },
  { key: "references", label: "References", icon: Users },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Core Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements & Awards",
  languages: "Languages",
  references: "References",
};

function SortableSectionItem({
  id,
  hidden,
  onToggleHidden,
}: {
  id: SectionKey;
  hidden: boolean;
  onToggleHidden: (id: SectionKey) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={`Drag ${SECTION_LABELS[id]}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className={cn("font-medium", hidden && "line-through text-muted-foreground")}>
          {SECTION_LABELS[id]}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onToggleHidden(id)}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        title={hidden ? "Show section" : "Hide section"}
      >
        {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function BuilderClient() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get("template");
  const requestedResumeId = searchParams.get("id");

  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [activeId, setActiveId] = useState<string>("res-senior-swe");
  const [title, setTitle] = useState("Senior Full-Stack Engineer (2026)");
  const [templateId, setTemplateId] = useState("modern-cobalt");
  const [data, setData] = useState<ResumeData>(SAMPLE_RESUME_DATA);

  const [stepIndex, setStepIndex] = useState(0);
  const [rightTab, setRightTab] = useState<"preview" | "ats" | "jd" | "order">(
    "preview"
  );

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [skillInput, setSkillInput] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiTips, setAiTips] = useState<string[]>([]);

  // Cover letter modal
  const [coverLetterOpen, setCoverLetterOpen] = useState(false);
  const [coverCompany, setCoverCompany] = useState("");
  const [coverRole, setCoverRole] = useState("");
  const [coverText, setCoverText] = useState("");

  // LinkedIn import modal
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [linkedinRaw, setLinkedinRaw] = useState("");

  // Version history modal
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");

  // Share toast
  const [copiedShare, setCopiedShare] = useState(false);

  // Job Description matcher
  const [jdRole, setJdRole] = useState("Senior Full-Stack Engineer");
  const [jdCompany, setJdCompany] = useState("Acme Cloud");
  const [jdText, setJdText] = useState("");
  const [jdResult, setJdResult] = useState<JobMatchResult | null>(null);

  const [userPlan, setUserPlan] = useState<"free" | "pro" | "premium">("pro");

  // Initial load from storage
  useEffect(() => {
    const loaded = loadLocalResumes();
    setResumes(loaded);

    const user = loadDemoUser();
    if (user) {
      setUserPlan(user.plan);
    }

    const targetId =
      requestedResumeId || getActiveResumeId() || loaded[0]?.id || "res-senior-swe";
    const found = loaded.find((r) => r.id === targetId) || loaded[0];

    if (found) {
      setActiveId(found.id);
      setTitle(found.title);
      setTemplateId(requestedTemplate || found.templateId);
      setData(found.data);
      setActiveResumeId(found.id);
    } else if (requestedTemplate) {
      setTemplateId(requestedTemplate);
    }
  }, [requestedResumeId, requestedTemplate]);

  const analysis = useMemo(() => analyzeResumeATS(data), [data]);
  const template = useMemo(() => getTemplateById(templateId), [templateId]);

  // Auto-save debounced
  useEffect(() => {
    if (resumes.length === 0) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      const updatedAt = new Date().toISOString();
      const next = resumes.map((r) =>
        r.id === activeId
          ? {
              ...r,
              title,
              templateId,
              data,
              atsScore: analysis.overallScore,
              updatedAt,
            }
          : r
      );
      setResumes(next);
      saveLocalResumes(next);
      const current = next.find((r) => r.id === activeId);
      if (current) {
        void syncResumeToSupabase(current);
      }
      setSaveStatus("saved");
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, title, templateId, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.sectionOrder.indexOf(active.id as SectionKey);
        const newIndex = prev.sectionOrder.indexOf(over.id as SectionKey);
        return {
          ...prev,
          sectionOrder: arrayMove(prev.sectionOrder, oldIndex, newIndex),
        };
      });
    }
  };

  const toggleSectionVisibility = (key: SectionKey) => {
    setData((prev) => {
      const exists = prev.hiddenSections.includes(key);
      return {
        ...prev,
        hiddenSections: exists
          ? prev.hiddenSections.filter((s) => s !== key)
          : [...prev.hiddenSections, key],
      };
    });
  };

  const callAI = async (
    action: "summary" | "experience" | "keywords" | "cover_letter" | "improvements",
    extra?: { company?: string; jobTitle?: string; expId?: string }
  ) => {
    setAiLoading(action);
    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          jobTitle: extra?.jobTitle || data.personalInfo.jobTitle,
          company: extra?.company || "",
          resume: data,
        }),
      });
      const json = await resp.json();
      if (action === "summary" && json.result) {
        setData((prev) => ({ ...prev, summary: json.result }));
      } else if (action === "experience" && extra?.expId && Array.isArray(json.items)) {
        setData((prev) => ({
          ...prev,
          experience: prev.experience.map((e) =>
            e.id === extra.expId ? { ...e, bullets: json.items } : e
          ),
        }));
      } else if (action === "keywords" && Array.isArray(json.items)) {
        setData((prev) => ({
          ...prev,
          skills: Array.from(new Set([...prev.skills, ...json.items])).slice(0, 24),
        }));
      } else if (action === "cover_letter" && json.result) {
        setCoverText(json.result);
      } else if (action === "improvements" && Array.isArray(json.items)) {
        setAiTips(json.items);
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleSaveSnapshot = () => {
    const label = versionLabel.trim() || `Snapshot (${analysis.overallScore}/100)`;
    const next = resumes.map((r) => {
      if (r.id !== activeId) return r;
      const nextNum = (r.versions?.length ?? 0) + 1;
      return {
        ...r,
        versions: [
          {
            id: generateId("ver"),
            versionNumber: nextNum,
            label,
            createdAt: new Date().toISOString(),
            atsScore: analysis.overallScore,
            data: JSON.parse(JSON.stringify(data)) as ResumeData,
          },
          ...(r.versions || []),
        ],
      };
    });
    setResumes(next);
    saveLocalResumes(next);
    setVersionLabel("");
  };

  const handleCreateNewResume = () => {
    const id = generateId("res");
    const newRes: SavedResume = {
      id,
      title: `Untitled Resume ${resumes.length + 1}`,
      templateId,
      data: {
        ...SAMPLE_RESUME_DATA,
        personalInfo: {
          ...SAMPLE_RESUME_DATA.personalInfo,
          fullName: "Your Name",
          jobTitle: "Target Job Title",
        },
      },
      atsScore: 85,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isPublic: false,
      shareSlug: `${slugify("resume")}-${id.slice(-5)}`,
      viewsCount: 0,
      downloadsCount: 0,
      versions: [],
    };
    const next = [newRes, ...resumes];
    setResumes(next);
    saveLocalResumes(next);
    setActiveId(newRes.id);
    setActiveResumeId(newRes.id);
    setTitle(newRes.title);
    setData(newRes.data);
  };

  const handleSelectResume = (id: string) => {
    const found = resumes.find((r) => r.id === id);
    if (!found) return;
    setActiveId(found.id);
    setActiveResumeId(found.id);
    setTitle(found.title);
    setTemplateId(found.templateId);
    setData(found.data);
  };

  const handleCopyShareLink = () => {
    const current = resumes.find((r) => r.id === activeId);
    const slug = current?.shareSlug || "alex-rivera-swe";
    // Mark public in local store
    const next = resumes.map((r) =>
      r.id === activeId ? { ...r, isPublic: true } : r
    );
    setResumes(next);
    saveLocalResumes(next);

    const url = `${window.location.origin}/share/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleRunJDMatch = () => {
    if (!jdText.trim()) return;
    const match = matchResumeToJobDescription(data, jdText, jdRole, jdCompany);
    setJdResult(match);
    addJobMatchEntry(match);
    addATSHistoryEntry({
      id: generateId("atsh"),
      resumeId: activeId,
      resumeTitle: title,
      overallScore: analysis.overallScore,
      readabilityScore: analysis.readabilityScore,
      completenessScore: analysis.completenessScore,
      keywordScore: analysis.keywordScore,
      createdAt: new Date().toISOString(),
    });
  };

  const handleImportLinkedIn = () => {
    const parsed = parseLinkedInProfileText(linkedinRaw);
    setData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        ...parsed.personalInfo,
      },
      summary: parsed.summary || prev.summary,
      skills:
        parsed.skills && parsed.skills.length > 0
          ? Array.from(new Set([...parsed.skills, ...prev.skills])).slice(0, 20)
          : prev.skills,
    }));
    setLinkedinOpen(false);
    setLinkedinRaw("");
  };

  const activeStep = STEPS[stepIndex];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20">
      {/* Top Workspace Toolbar */}
      <div className="no-print border-b bg-card/95 backdrop-blur sticky top-16 z-30">
        <div className="container py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={activeId} onValueChange={handleSelectResume}>
              <SelectTrigger className="w-[210px] h-9 text-xs font-medium">
                <SelectValue placeholder="Select resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-[200px] sm:w-[230px] text-xs font-medium"
              aria-label="Resume document title"
            />

            <Button variant="outline" size="sm" onClick={handleCreateNewResume} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> New
            </Button>

            <Badge
              variant={saveStatus === "saved" ? "success" : "warning"}
              className="text-[11px]"
            >
              {saveStatus === "saved" ? "Auto-saved" : "Saving..."}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template switcher */}
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {RESUME_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setLinkedinOpen(true)}
            >
              <Linkedin className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">Import LinkedIn</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setVersionsOpen(true)}
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Versions</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setCoverRole(data.personalInfo.jobTitle);
                setCoverLetterOpen(true);
              }}
            >
              <Mail className="h-3.5 w-3.5 text-brand-teal" />
              <span className="hidden sm:inline">Cover Letter</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => exportResumeToPDF(data, template, title)}
                >
                  <FileText className="h-4 w-4 text-rose-500" />
                  Download ATS PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportResumeToDOCX(data, title)}
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  Download Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 text-slate-600" />
                  Print Resume
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyShareLink}>
                  <Share2 className="h-4 w-4 text-brand-teal" />
                  {copiedShare ? "Link Copied!" : "Copy Shareable Link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Split Builder Workspace */}
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Multi-Step Editor */}
          <div className="no-print lg:col-span-6 space-y-4">
            {/* Step Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const active = idx === stepIndex;
                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {step.label}
                  </button>
                );
              })}
            </div>

            {/* Active Step Card */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Step {stepIndex + 1} of {STEPS.length}
                  </p>
                  <h2 className="font-heading text-xl font-bold">
                    {activeStep.label}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={stepIndex === STEPS.length - 1}
                    onClick={() =>
                      setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
                    }
                    aria-label="Next step"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 1. PERSONAL INFO */}
              {activeStep.key === "personal" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input
                      value={data.personalInfo.fullName}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, fullName: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Job Title</Label>
                    <Input
                      value={data.personalInfo.jobTitle}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, jobTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={data.personalInfo.email}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, email: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      value={data.personalInfo.phone}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, phone: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location (City, State / Remote)</Label>
                    <Input
                      value={data.personalInfo.location}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, location: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn URL</Label>
                    <Input
                      value={data.personalInfo.linkedin}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, linkedin: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>GitHub / Portfolio</Label>
                    <Input
                      value={data.personalInfo.github}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, github: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input
                      value={data.personalInfo.website}
                      onChange={(e) =>
                        setData((p) => ({
                          ...p,
                          personalInfo: { ...p.personalInfo, website: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* 2. SUMMARY */}
              {activeStep.key === "summary" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Professional Summary (25–85 words optimal)</Label>
                    <Button
                      size="sm"
                      variant="accent"
                      className="gap-1.5"
                      disabled={aiLoading === "summary"}
                      onClick={() => callAI("summary")}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      {aiLoading === "summary"
                        ? "Writing..."
                        : "AI Generate Summary"}
                    </Button>
                  </div>
                  <Textarea
                    rows={5}
                    value={data.summary}
                    onChange={(e) =>
                      setData((p) => ({ ...p, summary: e.target.value }))
                    }
                    placeholder="Summarize your years of experience, core domain expertise, and top measurable achievements..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Word count:{" "}
                    <strong>
                      {data.summary.trim().split(/\s+/).filter(Boolean).length}
                    </strong>{" "}
                    words
                  </p>
                </div>
              )}

              {/* 3. WORK EXPERIENCE */}
              {activeStep.key === "experience" && (
                <div className="space-y-4">
                  {data.experience.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="rounded-xl border bg-muted/20 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary">
                          Role #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            disabled={aiLoading === "experience"}
                            onClick={() =>
                              callAI("experience", {
                                jobTitle: exp.role || data.personalInfo.jobTitle,
                                company: exp.company,
                                expId: exp.id,
                              })
                            }
                          >
                            <Sparkles className="h-3 w-3 text-brand-teal" />
                            AI Bullets
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              setData((p) => ({
                                ...p,
                                experience: p.experience.filter(
                                  (item) => item.id !== exp.id
                                ),
                              }))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Role / Job Title</Label>
                          <Input
                            value={exp.role}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                experience: p.experience.map((it) =>
                                  it.id === exp.id
                                    ? { ...it, role: e.target.value }
                                    : it
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                experience: p.experience.map((it) =>
                                  it.id === exp.id
                                    ? { ...it, company: e.target.value }
                                    : it
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Start Date</Label>
                          <Input
                            value={exp.startDate}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                experience: p.experience.map((it) =>
                                  it.id === exp.id
                                    ? { ...it, startDate: e.target.value }
                                    : it
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>End Date</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              disabled={exp.current}
                              value={exp.current ? "Present" : exp.endDate}
                              onChange={(e) =>
                                setData((p) => ({
                                  ...p,
                                  experience: p.experience.map((it) =>
                                    it.id === exp.id
                                      ? { ...it, endDate: e.target.value }
                                      : it
                                  ),
                                }))
                              }
                            />
                            <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                              <Switch
                                checked={exp.current}
                                onCheckedChange={(checked) =>
                                  setData((p) => ({
                                    ...p,
                                    experience: p.experience.map((it) =>
                                      it.id === exp.id
                                        ? { ...it, current: checked }
                                        : it
                                    ),
                                  }))
                                }
                              />
                              Current
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Achievement Bullets (1 per line)</Label>
                        <Textarea
                          rows={4}
                          value={exp.bullets.join("\n")}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              experience: p.experience.map((it) =>
                                it.id === exp.id
                                  ? { ...it, bullets: e.target.value.split("\n") }
                                  : it
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        experience: [
                          ...p.experience,
                          {
                            id: generateId("exp"),
                            company: "",
                            role: "",
                            location: "",
                            startDate: "Jan 2024",
                            endDate: "Present",
                            current: true,
                            bullets: [""],
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Work Experience
                  </Button>
                </div>
              )}

              {/* 4. EDUCATION */}
              {activeStep.key === "education" && (
                <div className="space-y-4">
                  {data.education.map((edu) => (
                    <div key={edu.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">
                          Education Entry
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              education: p.education.filter((i) => i.id !== edu.id),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Institution</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                education: p.education.map((i) =>
                                  i.id === edu.id ? { ...i, institution: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Degree</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                education: p.education.map((i) =>
                                  i.id === edu.id ? { ...i, degree: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Field of Study</Label>
                          <Input
                            value={edu.field}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                education: p.education.map((i) =>
                                  i.id === edu.id ? { ...i, field: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>GPA (Optional)</Label>
                          <Input
                            value={edu.gpa}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                education: p.education.map((i) =>
                                  i.id === edu.id ? { ...i, gpa: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Start Year</Label>
                          <Input
                            value={edu.startDate}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                education: p.education.map((i) =>
                                  i.id === edu.id ? { ...i, startDate: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>End Year</Label>
                          <Input
                            value={edu.endDate}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                education: p.education.map((i) =>
                                  i.id === edu.id ? { ...i, endDate: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Honors / Coursework</Label>
                        <Input
                          value={edu.highlights}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              education: p.education.map((i) =>
                                i.id === edu.id ? { ...i, highlights: e.target.value } : i
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        education: [
                          ...p.education,
                          {
                            id: generateId("edu"),
                            institution: "",
                            degree: "Bachelor of Science",
                            field: "",
                            location: "",
                            startDate: "2018",
                            endDate: "2022",
                            gpa: "",
                            highlights: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Education
                  </Button>
                </div>
              )}

              {/* 5. SKILLS */}
              {activeStep.key === "skills" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Add Skills & Keywords</Label>
                    <Button
                      size="sm"
                      variant="accent"
                      className="gap-1.5"
                      disabled={aiLoading === "keywords"}
                      onClick={() => callAI("keywords")}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiLoading === "keywords"
                        ? "Suggesting..."
                        : "AI Keyword Suggestions"}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      placeholder="Type a skill (e.g., Kubernetes) and press Enter"
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && skillInput.trim()) {
                          e.preventDefault();
                          const val = skillInput.trim();
                          if (!data.skills.includes(val)) {
                            setData((p) => ({ ...p, skills: [...p.skills, val] }));
                          }
                          setSkillInput("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (!skillInput.trim()) return;
                        const val = skillInput.trim();
                        if (!data.skills.includes(val)) {
                          setData((p) => ({ ...p, skills: [...p.skills, val] }));
                        }
                        setSkillInput("");
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="gap-1.5 px-3 py-1 text-xs"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              skills: p.skills.filter((s) => s !== skill),
                            }))
                          }
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${skill}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. CERTIFICATIONS */}
              {activeStep.key === "certifications" && (
                <div className="space-y-4">
                  {data.certifications.map((cert) => (
                    <div key={cert.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Certification</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              certifications: p.certifications.filter((c) => c.id !== cert.id),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Certification Name</Label>
                          <Input
                            value={cert.name}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                certifications: p.certifications.map((c) =>
                                  c.id === cert.id ? { ...c, name: e.target.value } : c
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Issuing Organization</Label>
                          <Input
                            value={cert.issuer}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                certifications: p.certifications.map((c) =>
                                  c.id === cert.id ? { ...c, issuer: e.target.value } : c
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Year / Date</Label>
                          <Input
                            value={cert.date}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                certifications: p.certifications.map((c) =>
                                  c.id === cert.id ? { ...c, date: e.target.value } : c
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Credential ID</Label>
                          <Input
                            value={cert.credentialId}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                certifications: p.certifications.map((c) =>
                                  c.id === cert.id ? { ...c, credentialId: e.target.value } : c
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        certifications: [
                          ...p.certifications,
                          {
                            id: generateId("cert"),
                            name: "",
                            issuer: "",
                            date: "2026",
                            credentialId: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Certification
                  </Button>
                </div>
              )}

              {/* 7. PROJECTS */}
              {activeStep.key === "projects" && (
                <div className="space-y-4">
                  {data.projects.map((proj) => (
                    <div key={proj.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Project</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              projects: p.projects.filter((i) => i.id !== proj.id),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Project Name</Label>
                          <Input
                            value={proj.name}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                projects: p.projects.map((i) =>
                                  i.id === proj.id ? { ...i, name: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Tech Stack</Label>
                          <Input
                            value={proj.techStack}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                projects: p.projects.map((i) =>
                                  i.id === proj.id ? { ...i, techStack: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label>URL / Repository</Label>
                          <Input
                            value={proj.link}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                projects: p.projects.map((i) =>
                                  i.id === proj.id ? { ...i, link: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label>Description & Outcome</Label>
                          <Textarea
                            rows={2}
                            value={proj.description}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                projects: p.projects.map((i) =>
                                  i.id === proj.id ? { ...i, description: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        projects: [
                          ...p.projects,
                          {
                            id: generateId("proj"),
                            name: "",
                            role: "",
                            techStack: "",
                            link: "",
                            description: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Project
                  </Button>
                </div>
              )}

              {/* 8. ACHIEVEMENTS */}
              {activeStep.key === "achievements" && (
                <div className="space-y-4">
                  {data.achievements.map((ach) => (
                    <div key={ach.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Achievement</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              achievements: p.achievements.filter((i) => i.id !== ach.id),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Title</Label>
                          <Input
                            value={ach.title}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                achievements: p.achievements.map((i) =>
                                  i.id === ach.id ? { ...i, title: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Organization / Year</Label>
                          <Input
                            value={ach.organization}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                achievements: p.achievements.map((i) =>
                                  i.id === ach.id ? { ...i, organization: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label>Impact Description</Label>
                          <Input
                            value={ach.description}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                achievements: p.achievements.map((i) =>
                                  i.id === ach.id ? { ...i, description: e.target.value } : i
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        achievements: [
                          ...p.achievements,
                          {
                            id: generateId("ach"),
                            title: "",
                            organization: "",
                            date: "2026",
                            description: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Achievement
                  </Button>
                </div>
              )}

              {/* 9. LANGUAGES */}
              {activeStep.key === "languages" && (
                <div className="space-y-4">
                  {data.languages.map((lang) => (
                    <div key={lang.id} className="flex items-center gap-2">
                      <Input
                        value={lang.name}
                        placeholder="Language (e.g. English)"
                        onChange={(e) =>
                          setData((p) => ({
                            ...p,
                            languages: p.languages.map((l) =>
                              l.id === lang.id ? { ...l, name: e.target.value } : l
                            ),
                          }))
                        }
                      />
                      <Select
                        value={lang.proficiency}
                        onValueChange={(val) =>
                          setData((p) => ({
                            ...p,
                            languages: p.languages.map((l) =>
                              l.id === lang.id
                                ? { ...l, proficiency: val as typeof lang.proficiency }
                                : l
                            ),
                          }))
                        }
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Native", "Fluent", "Professional", "Intermediate", "Basic"].map(
                            (level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive shrink-0"
                        onClick={() =>
                          setData((p) => ({
                            ...p,
                            languages: p.languages.filter((l) => l.id !== lang.id),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        languages: [
                          ...p.languages,
                          {
                            id: generateId("lang"),
                            name: "",
                            proficiency: "Professional",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Language
                  </Button>
                </div>
              )}

              {/* 10. REFERENCES */}
              {activeStep.key === "references" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-xs">
                    <span>Include References section on exported resume</span>
                    <Switch
                      checked={!data.hiddenSections.includes("references")}
                      onCheckedChange={() => toggleSectionVisibility("references")}
                    />
                  </div>
                  {data.references.map((ref) => (
                    <div key={ref.id} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary">Reference</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() =>
                            setData((p) => ({
                              ...p,
                              references: p.references.filter((r) => r.id !== ref.id),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          placeholder="Full Name"
                          value={ref.name}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              references: p.references.map((r) =>
                                r.id === ref.id ? { ...r, name: e.target.value } : r
                              ),
                            }))
                          }
                        />
                        <Input
                          placeholder="Title"
                          value={ref.title}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              references: p.references.map((r) =>
                                r.id === ref.id ? { ...r, title: e.target.value } : r
                              ),
                            }))
                          }
                        />
                        <Input
                          placeholder="Company"
                          value={ref.company}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              references: p.references.map((r) =>
                                r.id === ref.id ? { ...r, company: e.target.value } : r
                              ),
                            }))
                          }
                        />
                        <Input
                          placeholder="Email"
                          value={ref.email}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              references: p.references.map((r) =>
                                r.id === ref.id ? { ...r, email: e.target.value } : r
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        references: [
                          ...p.references,
                          {
                            id: generateId("ref"),
                            name: "",
                            title: "",
                            company: "",
                            email: "",
                            phone: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Reference
                  </Button>
                </div>
              )}

              {/* Step Footer Nav */}
              <div className="flex items-center justify-between border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                >
                  ← Previous
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={data.removeBranding}
                    onCheckedChange={(checked) =>
                      setData((p) => ({
                        ...p,
                        removeBranding: userPlan === "free" ? false : checked,
                      }))
                    }
                  />
                  <span>
                    Remove Branding{" "}
                    {userPlan === "free" && (
                      <a href="/checkout?plan=pro" className="ml-1 inline-block">
                        <Badge variant="outline" className="text-[10px] hover:border-primary hover:text-primary">
                          Upgrade to Pro
                        </Badge>
                      </a>
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={stepIndex === STEPS.length - 1}
                  onClick={() =>
                    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
                  }
                >
                  Next →
                </Button>
              </div>
            </div>

            <ComplianceDisclaimerBanner variant="both" />
          </div>

          {/* RIGHT: Live Preview + ATS Engine + Job Match + DnD Reordering */}
          <div className="lg:col-span-6 space-y-4">
            <Tabs
              value={rightTab}
              onValueChange={(v) => setRightTab(v as typeof rightTab)}
            >
              <TabsList className="no-print w-full grid grid-cols-4">
                <TabsTrigger value="preview" className="text-xs sm:text-sm">
                  Live Preview
                </TabsTrigger>
                <TabsTrigger value="ats" className="text-xs sm:text-sm gap-1">
                  ATS Score
                  <Badge
                    variant={analysis.overallScore >= 85 ? "success" : "warning"}
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {analysis.overallScore}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="jd" className="text-xs sm:text-sm">
                  Job Match
                </TabsTrigger>
                <TabsTrigger value="order" className="text-xs sm:text-sm">
                  Reorder
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-3">
                <TemplateRenderer data={data} template={template} />
              </TabsContent>

              <TabsContent value="ats" className="no-print mt-3 space-y-4">
                <ATSPanel
                  analysis={analysis}
                  onAddSkill={(skill) => {
                    if (!data.skills.includes(skill)) {
                      setData((p) => ({ ...p, skills: [...p.skills, skill] }));
                    }
                  }}
                  aiLoading={aiLoading === "improvements"}
                  onRunAIImprove={() => callAI("improvements")}
                />
                {aiTips.length > 0 && (
                  <div className="rounded-xl border border-brand-teal/40 bg-brand-teal/5 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> AI Improvement Recommendations
                    </p>
                    <ul className="space-y-1.5 text-xs text-foreground">
                      {aiTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-brand-teal shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="jd" className="no-print mt-3">
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <div>
                    <h3 className="font-heading font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Job Description Match Analyzer
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste a target job posting to calculate match percentage and uncover missing keywords.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Target Role</Label>
                      <Input
                        value={jdRole}
                        onChange={(e) => setJdRole(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Company</Label>
                      <Input
                        value={jdCompany}
                        onChange={(e) => setJdCompany(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Paste Job Description</Label>
                    <Textarea
                      rows={5}
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste full job requirements and responsibilities here..."
                    />
                  </div>

                  <Button onClick={handleRunJDMatch} className="w-full gap-1.5">
                    <Target className="h-4 w-4" />
                    Calculate Match Score
                  </Button>

                  {jdResult && (
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          Match Score vs {jdResult.jobTitle}
                        </span>
                        <Badge
                          variant={
                            jdResult.matchPercentage >= 75 ? "success" : "warning"
                          }
                          className="text-sm px-2.5 py-0.5"
                        >
                          {jdResult.matchPercentage}% Match
                        </Badge>
                      </div>

                      {jdResult.missingKeywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                            Missing Keywords (click to add to Skills):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {jdResult.missingKeywords.map((kw) => (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => {
                                  if (!data.skills.includes(kw)) {
                                    setData((p) => ({
                                      ...p,
                                      skills: [...p.skills, kw],
                                    }));
                                  }
                                }}
                                className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                              >
                                + {kw}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {jdResult.matchedKeywords.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                            Matched Keywords:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {jdResult.matchedKeywords.map((kw) => (
                              <Badge key={kw} variant="success">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="order" className="no-print mt-3">
                <div className="rounded-xl border bg-card p-5 space-y-4">
                  <div>
                    <h3 className="font-heading font-semibold">
                      Drag-and-Drop Section Reordering
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag any section handle to reorder how sections appear on your resume, or toggle visibility.
                    </p>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={data.sectionOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {data.sectionOrder.map((sec) => (
                          <SortableSectionItem
                            key={sec}
                            id={sec}
                            hidden={data.hiddenSections.includes(sec)}
                            onToggleHidden={toggleSectionVisibility}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* AI Cover Letter Dialog */}
      <Dialog open={coverLetterOpen} onOpenChange={setCoverLetterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Cover Letter Generator</DialogTitle>
            <DialogDescription>
              Generate a tailored cover letter synced with your current resume skills and experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Target Role</Label>
                <Input
                  value={coverRole}
                  onChange={(e) => setCoverRole(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Company Name</Label>
                <Input
                  value={coverCompany}
                  placeholder="e.g. Stripe"
                  onChange={(e) => setCoverCompany(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={() =>
                callAI("cover_letter", {
                  jobTitle: coverRole,
                  company: coverCompany,
                })
              }
              disabled={aiLoading === "cover_letter"}
              className="w-full gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              {aiLoading === "cover_letter"
                ? "Generating Cover Letter..."
                : "Generate Tailored Cover Letter"}
            </Button>
            {coverText && (
              <div className="space-y-2">
                <Textarea
                  rows={11}
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => navigator.clipboard?.writeText(coverText)}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Cover Letter
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Import Dialog */}
      <Dialog open={linkedinOpen} onOpenChange={setLinkedinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import LinkedIn Profile</DialogTitle>
            <DialogDescription>
              Paste your LinkedIn profile text or exported JSON below to auto-fill your name, headline, summary, and skills.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={8}
              value={linkedinRaw}
              onChange={(e) => setLinkedinRaw(e.target.value)}
              placeholder={`Alex Rivera\nSenior Full-Stack Engineer\nSan Francisco, CA\nAbout\nExperienced software engineer...\nSkills\nTypeScript, React, Next.js, Node.js, AWS`}
            />
            <Button onClick={handleImportLinkedIn} className="w-full gap-1.5">
              <Linkedin className="h-4 w-4" />
              Parse & Import Into Resume
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Version History Dialog */}
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Version History</DialogTitle>
            <DialogDescription>
              Save named snapshots of your resume before tailoring for different roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Snapshot label (e.g., Tailored for Stripe)"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
              <Button onClick={handleSaveSnapshot}>Save Version</Button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(resumes.find((r) => r.id === activeId)?.versions || []).map(
                (ver) => (
                  <div
                    key={ver.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        v{ver.versionNumber}: {ver.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ATS Score: {ver.atsScore}/100 •{" "}
                        {new Date(ver.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setData(ver.data);
                        setVersionsOpen(false);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
