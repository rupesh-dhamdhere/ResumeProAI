import { jsPDF } from "jspdf";
import type { ResumeData, ResumeTemplate, SectionKey } from "@/types/resume";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [37, 99, 235];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

export function exportResumeToPDF(
  data: ResumeData,
  template: ResumeTemplate,
  fileName?: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 46;
  const maxWidth = pageWidth - marginX * 2;
  let y = 48;

  const [ar, ag, ab] = hexToRgb(template.accentColor);
  const fontFamily = template.fontStyle === "serif" ? "times" : "helvetica";

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  const addSectionHeader = (title: string) => {
    ensureSpace(30);
    y += 10;
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(ar, ag, ab);
    doc.text(title.toUpperCase(), marginX, y);
    y += 4;
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(0.9);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 14;
    doc.setTextColor(15, 23, 42);
  };

  const addWrappedText = (
    text: string,
    size = 9.5,
    style: "normal" | "bold" | "italic" = "normal",
    color: [number, number, number] = [30, 41, 59],
    indent = 0
  ) => {
    if (!text.trim()) return;
    doc.setFont(fontFamily, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth - indent) as string[];
    const lineHeight = size * 1.38;
    ensureSpace(lines.length * lineHeight + 4);
    for (const line of lines) {
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    }
  };

  // Header
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(data.personalInfo.fullName || "Your Name", marginX, y);
  y += 18;

  if (data.personalInfo.jobTitle) {
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(ar, ag, ab);
    doc.text(data.personalInfo.jobTitle, marginX, y);
    y += 15;
  }

  const contactItems = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
    data.personalInfo.github,
    data.personalInfo.website,
  ].filter(Boolean);

  if (contactItems.length > 0) {
    addWrappedText(contactItems.join("  |  "), 8.8, "normal", [71, 85, 105]);
    y += 4;
  }

  const hidden = new Set(data.hiddenSections || []);
  const renderSection = (key: SectionKey) => {
    if (hidden.has(key)) return;

    switch (key) {
      case "summary": {
        if (!data.summary.trim()) return;
        addSectionHeader("Professional Summary");
        addWrappedText(data.summary, 9.5);
        break;
      }
      case "experience": {
        if (data.experience.length === 0) return;
        addSectionHeader("Work Experience");
        for (const exp of data.experience) {
          ensureSpace(40);
          doc.setFont(fontFamily, "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`${exp.role} — ${exp.company}`, marginX, y);

          const dateText = `${exp.startDate} – ${exp.current ? "Present" : exp.endDate}`;
          doc.setFont(fontFamily, "normal");
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          const dateWidth = doc.getTextWidth(dateText);
          doc.text(dateText, pageWidth - marginX - dateWidth, y);
          y += 13;

          if (exp.location) {
            addWrappedText(exp.location, 8.8, "italic", [100, 116, 139]);
          }

          for (const bullet of exp.bullets.filter((b) => b.trim())) {
            addWrappedText(`•  ${bullet}`, 9.3, "normal", [30, 41, 59], 8);
          }
          y += 6;
        }
        break;
      }
      case "education": {
        if (data.education.length === 0) return;
        addSectionHeader("Education");
        for (const edu of data.education) {
          ensureSpace(32);
          doc.setFont(fontFamily, "bold");
          doc.setFontSize(10.2);
          doc.setTextColor(15, 23, 42);
          doc.text(
            `${edu.degree}${edu.field ? ` in ${edu.field}` : ""} — ${edu.institution}`,
            marginX,
            y
          );
          const dates = `${edu.startDate} – ${edu.endDate}`;
          doc.setFont(fontFamily, "normal");
          doc.setFontSize(9);
          doc.setTextColor(71, 85, 105);
          doc.text(dates, pageWidth - marginX - doc.getTextWidth(dates), y);
          y += 13;

          const sub = [
            edu.location,
            edu.gpa ? `GPA: ${edu.gpa}` : "",
            edu.highlights,
          ]
            .filter(Boolean)
            .join("  •  ");
          if (sub) {
            addWrappedText(sub, 9, "normal", [71, 85, 105]);
          }
          y += 4;
        }
        break;
      }
      case "skills": {
        if (data.skills.length === 0) return;
        addSectionHeader("Core Skills");
        addWrappedText(data.skills.join("  •  "), 9.3, "normal", [30, 41, 59]);
        break;
      }
      case "projects": {
        if (data.projects.length === 0) return;
        addSectionHeader("Projects");
        for (const proj of data.projects) {
          ensureSpace(30);
          addWrappedText(
            `${proj.name}${proj.role ? ` (${proj.role})` : ""}${proj.techStack ? ` — ${proj.techStack}` : ""}`,
            9.8,
            "bold",
            [15, 23, 42]
          );
          if (proj.description) {
            addWrappedText(proj.description, 9.2, "normal", [51, 65, 85], 6);
          }
          if (proj.link) {
            addWrappedText(proj.link, 8.5, "italic", [ar, ag, ab], 6);
          }
          y += 4;
        }
        break;
      }
      case "certifications": {
        if (data.certifications.length === 0) return;
        addSectionHeader("Certifications");
        for (const cert of data.certifications) {
          addWrappedText(
            `•  ${cert.name} — ${cert.issuer}${cert.date ? ` (${cert.date})` : ""}${cert.credentialId ? ` [ID: ${cert.credentialId}]` : ""}`,
            9.2
          );
        }
        break;
      }
      case "achievements": {
        if (data.achievements.length === 0) return;
        addSectionHeader("Achievements & Awards");
        for (const ach of data.achievements) {
          addWrappedText(
            `•  ${ach.title}${ach.organization ? ` — ${ach.organization}` : ""}${ach.date ? ` (${ach.date})` : ""}${ach.description ? `: ${ach.description}` : ""}`,
            9.2
          );
        }
        break;
      }
      case "languages": {
        if (data.languages.length === 0) return;
        addSectionHeader("Languages");
        addWrappedText(
          data.languages.map((l) => `${l.name} (${l.proficiency})`).join("   •   "),
          9.2
        );
        break;
      }
      case "references": {
        if (data.references.length === 0) return;
        addSectionHeader("References");
        for (const ref of data.references) {
          addWrappedText(
            `•  ${ref.name} — ${ref.title}, ${ref.company} (${[ref.email, ref.phone].filter(Boolean).join(" | ")})`,
            9.1
          );
        }
        break;
      }
    }
  };

  for (const section of data.sectionOrder) {
    renderSection(section);
  }

  if (!data.removeBranding) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Created with ResumePro AI — ATS-Optimized", marginX, pageHeight - 20);
  }

  const safeName = (
    fileName ||
    `${data.personalInfo.fullName || "Resume"}-ATS-Resume`
  )
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  doc.save(`${safeName}.pdf`);
}
