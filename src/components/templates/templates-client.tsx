"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, Search, ShieldCheck, Sparkles } from "lucide-react";
import { RESUME_TEMPLATES } from "@/lib/templates-data";
import { SAMPLE_RESUME_DATA } from "@/lib/sample-data";
import { TemplateRenderer } from "@/components/resume/template-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ResumeTemplate, TemplateCategory } from "@/types/resume";

const CATEGORIES: ("All" | TemplateCategory)[] = [
  "All",
  "Modern",
  "Professional",
  "Executive",
  "Fresher",
  "Tech",
  "Marketing",
];

export function TemplatesClient() {
  const [category, setCategory] = useState<"All" | TemplateCategory>("All");
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(
    null
  );

  const filtered = useMemo(() => {
    return RESUME_TEMPLATES.filter((t) => {
      const matchesCat = category === "All" || t.category === category;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [category, search]);

  return (
    <div className="container py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <Badge variant="accent">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {RESUME_TEMPLATES.length} ATS-Verified Templates
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Recruiter-Tested, ATS-Safe Resume Templates
          </h1>
          <p className="text-muted-foreground">
            Every template is engineered with linear DOM order, standard headings, and zero parsing traps—tested across Workday, Greenhouse, and Lever.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by style, role, tag..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              category === cat
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 text-xs opacity-75">
                ({RESUME_TEMPLATES.filter((t) => t.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="group flex flex-col rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/40 transition-all"
          >
            {/* Scaled Live Thumbnail */}
            <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-900 p-4 border-b">
              <div className="origin-top-left scale-[0.46] w-[217%] pointer-events-none select-none">
                <TemplateRenderer
                  data={SAMPLE_RESUME_DATA}
                  template={tpl}
                  compactPreview
                />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-slate-950/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5"
                  onClick={() => setPreviewTemplate(tpl)}
                >
                  <Eye className="h-3.5 w-3.5" /> Live Preview
                </Button>
                <Link href={`/builder?template=${tpl.id}`}>
                  <Button size="sm" className="gap-1.5">
                    Use Template <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="absolute top-3 left-3 flex gap-1.5">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                  {tpl.category}
                </Badge>
                {tpl.isPremium && (
                  <Badge variant="default" className="gap-1">
                    <Sparkles className="h-3 w-3" /> Pro
                  </Badge>
                )}
              </div>

              <Badge
                variant="success"
                className="absolute top-3 right-3 bg-emerald-600 text-white border-0"
              >
                {tpl.atsCompatibility}% ATS
              </Badge>
            </div>

            {/* Metadata */}
            <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-bold">{tpl.name}</h3>
                  <span
                    className="h-3.5 w-3.5 rounded-full border"
                    style={{ backgroundColor: tpl.accentColor }}
                    title={`Accent ${tpl.accentColor}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setPreviewTemplate(tpl)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                  <Link href={`/builder?template=${tpl.id}`} className="flex-1">
                    <Button size="sm" className="w-full gap-1">
                      Use Now <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Live Preview Modal */}
      <Dialog
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-4xl">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {previewTemplate.name}
                  <Badge variant="accent">{previewTemplate.category}</Badge>
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {previewTemplate.atsCompatibility}% ATS Safe
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {previewTemplate.description}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto rounded-lg bg-muted p-4">
                <TemplateRenderer
                  data={SAMPLE_RESUME_DATA}
                  template={previewTemplate}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
                <Link href={`/builder?template=${previewTemplate.id}`}>
                  <Button className="gap-1.5">
                    Switch to This Template <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
