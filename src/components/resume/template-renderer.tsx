"use client";

import React from "react";
import type { ResumeData, ResumeTemplate, SectionKey } from "@/types/resume";
import { cn } from "@/lib/utils";

interface TemplateRendererProps {
  data: ResumeData;
  template: ResumeTemplate;
  compactPreview?: boolean;
  className?: string;
}

export function TemplateRenderer({
  data,
  template,
  compactPreview = false,
  className,
}: TemplateRendererProps) {
  const hidden = new Set(data.hiddenSections || []);
  const accent = template.accentColor;
  const secondary = template.secondaryColor;

  const isSerif = template.fontStyle === "serif";
  const isMonoHeader = template.fontStyle === "mono-header";
  const isDense = template.layout === "compact-dense";
  const isTwoTone = template.layout === "two-tone-band";
  const isCenteredHeader =
    template.layout === "classic-single" || template.layout === "executive-serif";

  const contacts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
    data.personalInfo.github,
    data.personalInfo.website,
  ].filter(Boolean);

  const SectionHeading = ({ title }: { title: string }) => (
    <div className="mb-1.5 mt-3 first:mt-0">
      <h2
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.12em]",
          isMonoHeader && "font-mono",
          isSerif && "font-serif tracking-[0.08em]"
        )}
        style={{ color: accent }}
      >
        {title}
      </h2>
      <div
        className="mt-0.5 h-[1.5px] w-full opacity-80"
        style={{ backgroundColor: accent }}
      />
    </div>
  );

  const renderSection = (key: SectionKey) => {
    if (hidden.has(key)) return null;

    switch (key) {
      case "summary":
        if (!data.summary.trim()) return null;
        return (
          <section key="summary">
            <SectionHeading title="Professional Summary" />
            <p className="text-[10.5px] leading-[1.48] text-slate-700">
              {data.summary}
            </p>
          </section>
        );

      case "experience":
        if (data.experience.length === 0) return null;
        return (
          <section key="experience">
            <SectionHeading title="Work Experience" />
            <div className={cn("space-y-2.5", isDense && "space-y-2")}>
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-900">
                      {exp.role || "Role Title"}
                      {exp.company ? (
                        <span className="font-semibold text-slate-700">
                          {" "}
                          — {exp.company}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[9.5px] font-medium text-slate-500">
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                      {exp.location ? ` | ${exp.location}` : ""}
                    </p>
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[10px] leading-[1.42] text-slate-700">
                    {exp.bullets
                      .filter((b) => b.trim())
                      .map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );

      case "education":
        if (data.education.length === 0) return null;
        return (
          <section key="education">
            <SectionHeading title="Education" />
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[10.8px] font-bold text-slate-900">
                      {edu.degree}
                      {edu.field ? ` in ${edu.field}` : ""}
                      {edu.institution ? (
                        <span className="font-normal text-slate-700">
                          {" "}
                          — {edu.institution}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[9.5px] text-slate-500">
                      {edu.startDate} – {edu.endDate}
                    </p>
                  </div>
                  {(edu.gpa || edu.highlights || edu.location) && (
                    <p className="text-[9.8px] text-slate-600">
                      {[
                        edu.location,
                        edu.gpa ? `GPA: ${edu.gpa}` : "",
                        edu.highlights,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "skills":
        if (data.skills.length === 0) return null;
        return (
          <section key="skills">
            <SectionHeading title="Skills" />
            {template.layout === "modern-header" ||
            template.layout === "tech-mono-accent" ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {data.skills.map((skill, idx) => (
                  <span
                    key={`${skill}-${idx}`}
                    className="rounded border px-1.5 py-0.5 text-[9.5px] font-medium text-slate-800"
                    style={{
                      borderColor: `${accent}35`,
                      backgroundColor: `${accent}0D`,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] leading-[1.45] text-slate-700">
                {data.skills.join("  •  ")}
              </p>
            )}
          </section>
        );

      case "projects":
        if (data.projects.length === 0) return null;
        return (
          <section key="projects">
            <SectionHeading title="Projects" />
            <div className="space-y-1.5">
              {data.projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[10.5px] font-bold text-slate-900">
                      {proj.name}
                      {proj.role ? (
                        <span className="font-normal text-slate-600">
                          {" "}
                          ({proj.role})
                        </span>
                      ) : null}
                    </p>
                    {proj.techStack && (
                      <span className="text-[9.5px] font-medium text-slate-500">
                        {proj.techStack}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-[10px] leading-[1.4] text-slate-700">
                      {proj.description}
                    </p>
                  )}
                  {proj.link && (
                    <p className="text-[9.2px]" style={{ color: accent }}>
                      {proj.link}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "certifications":
        if (data.certifications.length === 0) return null;
        return (
          <section key="certifications">
            <SectionHeading title="Certifications" />
            <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-slate-700">
              {data.certifications.map((cert) => (
                <li key={cert.id}>
                  <span className="font-semibold text-slate-900">
                    {cert.name}
                  </span>
                  {cert.issuer ? ` — ${cert.issuer}` : ""}
                  {cert.date ? ` (${cert.date})` : ""}
                  {cert.credentialId ? ` • ID: ${cert.credentialId}` : ""}
                </li>
              ))}
            </ul>
          </section>
        );

      case "achievements":
        if (data.achievements.length === 0) return null;
        return (
          <section key="achievements">
            <SectionHeading title="Achievements & Awards" />
            <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-slate-700">
              {data.achievements.map((ach) => (
                <li key={ach.id}>
                  <span className="font-semibold text-slate-900">
                    {ach.title}
                  </span>
                  {ach.organization ? ` — ${ach.organization}` : ""}
                  {ach.date ? ` (${ach.date})` : ""}
                  {ach.description ? `: ${ach.description}` : ""}
                </li>
              ))}
            </ul>
          </section>
        );

      case "languages":
        if (data.languages.length === 0) return null;
        return (
          <section key="languages">
            <SectionHeading title="Languages" />
            <p className="text-[10px] text-slate-700">
              {data.languages
                .map((l) => `${l.name} (${l.proficiency})`)
                .join("  •  ")}
            </p>
          </section>
        );

      case "references":
        if (data.references.length === 0) return null;
        return (
          <section key="references">
            <SectionHeading title="References" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.references.map((ref) => (
                <div key={ref.id} className="text-[9.8px] text-slate-700">
                  <p className="font-semibold text-slate-900">{ref.name}</p>
                  <p>
                    {ref.title}
                    {ref.company ? `, ${ref.company}` : ""}
                  </p>
                  <p className="text-slate-500">
                    {[ref.email, ref.phone].filter(Boolean).join(" | ")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
    }
  };

  return (
    <div
      className={cn(
        "print-only-resume w-full bg-white text-slate-900 shadow-lg border border-slate-200 rounded-md overflow-hidden",
        isSerif ? "font-serif" : "font-sans",
        compactPreview ? "p-5 text-[9px]" : "p-7 sm:p-9",
        className
      )}
    >
      {/* Header */}
      {isTwoTone ? (
        <div
          className="-mx-7 -mt-7 sm:-mx-9 sm:-mt-9 mb-4 px-7 py-5 sm:px-9 text-white"
          style={{ backgroundColor: secondary }}
        >
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {data.personalInfo.fullName || "Your Full Name"}
          </h1>
          {data.personalInfo.jobTitle && (
            <p
              className="mt-0.5 text-xs sm:text-sm font-semibold"
              style={{ color: accent === secondary ? "#93C5FD" : accent }}
            >
              {data.personalInfo.jobTitle}
            </p>
          )}
          {contacts.length > 0 && (
            <p className="mt-2 text-[9.5px] text-slate-200 leading-relaxed">
              {contacts.join("  |  ")}
            </p>
          )}
        </div>
      ) : (
        <header
          className={cn(
            "mb-3 pb-2.5 border-b",
            isCenteredHeader ? "text-center" : "text-left"
          )}
          style={{ borderColor: `${accent}30` }}
        >
          <h1
            className={cn(
              "text-xl sm:text-2xl font-bold tracking-tight text-slate-900",
              isMonoHeader && "font-mono"
            )}
          >
            {data.personalInfo.fullName || "Your Full Name"}
          </h1>
          {data.personalInfo.jobTitle && (
            <p
              className="mt-0.5 text-xs sm:text-sm font-semibold"
              style={{ color: accent }}
            >
              {data.personalInfo.jobTitle}
            </p>
          )}
          {contacts.length > 0 && (
            <p className="mt-1.5 text-[9.5px] text-slate-600 leading-relaxed">
              {contacts.join("  |  ")}
            </p>
          )}
        </header>
      )}

      {/* Body Sections */}
      <div className="space-y-2.5">
        {data.sectionOrder.map((sec) => renderSection(sec))}
      </div>

      {/* Optional Footer Branding */}
      {!data.removeBranding && (
        <div className="mt-5 pt-2 border-t border-slate-100 flex items-center justify-between text-[8.5px] text-slate-400">
          <span>Created with ResumePro AI</span>
          <span>ATS-Verified Single-Column Format</span>
        </div>
      )}
    </div>
  );
}
