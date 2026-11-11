import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ResumeData, SectionKey } from "@/types/resume";

export async function exportResumeToDOCX(data: ResumeData, fileName?: string) {
  const children: Paragraph[] = [];

  // Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: data.personalInfo.fullName || "Your Name",
          bold: true,
          size: 34,
          color: "0F172A",
        }),
      ],
    })
  );

  // Job Title
  if (data.personalInfo.jobTitle) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: data.personalInfo.jobTitle,
            bold: true,
            size: 22,
            color: "2563EB",
          }),
        ],
      })
    );
  }

  // Contact line
  const contacts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
    data.personalInfo.github,
    data.personalInfo.website,
  ].filter(Boolean);

  if (contacts.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: contacts.join("  |  "),
            size: 18,
            color: "475569",
          }),
        ],
      })
    );
  }

  const addHeading = (label: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 },
        border: {
          bottom: {
            color: "2563EB",
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        children: [
          new TextRun({
            text: label.toUpperCase(),
            bold: true,
            size: 20,
            color: "2563EB",
          }),
        ],
      })
    );
  };

  const hidden = new Set(data.hiddenSections || []);

  const renderSection = (key: SectionKey) => {
    if (hidden.has(key)) return;

    switch (key) {
      case "summary":
        if (!data.summary.trim()) return;
        addHeading("Professional Summary");
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: data.summary, size: 20 })],
          })
        );
        break;

      case "experience":
        if (data.experience.length === 0) return;
        addHeading("Work Experience");
        for (const exp of data.experience) {
          children.push(
            new Paragraph({
              spacing: { before: 80, after: 40 },
              children: [
                new TextRun({
                  text: `${exp.role} — ${exp.company}`,
                  bold: true,
                  size: 21,
                }),
                new TextRun({
                  text: `   (${exp.startDate} – ${exp.current ? "Present" : exp.endDate})`,
                  size: 19,
                  color: "475569",
                }),
              ],
            })
          );
          for (const bullet of exp.bullets.filter((b) => b.trim())) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [new TextRun({ text: bullet, size: 19.5 })],
              })
            );
          }
        }
        break;

      case "education":
        if (data.education.length === 0) return;
        addHeading("Education");
        for (const edu of data.education) {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 40 },
              children: [
                new TextRun({
                  text: `${edu.degree}${edu.field ? ` in ${edu.field}` : ""} — ${edu.institution}`,
                  bold: true,
                  size: 20,
                }),
                new TextRun({
                  text: `  (${edu.startDate} – ${edu.endDate})`,
                  size: 19,
                  color: "475569",
                }),
              ],
            })
          );
          const extra = [edu.gpa ? `GPA: ${edu.gpa}` : "", edu.highlights]
            .filter(Boolean)
            .join(" | ");
          if (extra) {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: extra, size: 18.5, color: "475569" })],
              })
            );
          }
        }
        break;

      case "skills":
        if (data.skills.length === 0) return;
        addHeading("Core Skills");
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: data.skills.join("  •  "), size: 19.5 }),
            ],
          })
        );
        break;

      case "projects":
        if (data.projects.length === 0) return;
        addHeading("Projects");
        for (const proj of data.projects) {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 30 },
              children: [
                new TextRun({
                  text: `${proj.name}${proj.techStack ? ` — ${proj.techStack}` : ""}`,
                  bold: true,
                  size: 20,
                }),
              ],
            })
          );
          if (proj.description) {
            children.push(
              new Paragraph({
                spacing: { after: 50 },
                children: [new TextRun({ text: proj.description, size: 19 })],
              })
            );
          }
        }
        break;

      case "certifications":
        if (data.certifications.length === 0) return;
        addHeading("Certifications");
        for (const cert of data.certifications) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: `${cert.name} — ${cert.issuer}${cert.date ? ` (${cert.date})` : ""}`,
                  size: 19.5,
                }),
              ],
            })
          );
        }
        break;

      case "achievements":
        if (data.achievements.length === 0) return;
        addHeading("Achievements");
        for (const ach of data.achievements) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: `${ach.title}${ach.organization ? ` — ${ach.organization}` : ""}${ach.description ? `: ${ach.description}` : ""}`,
                  size: 19.5,
                }),
              ],
            })
          );
        }
        break;

      case "languages":
        if (data.languages.length === 0) return;
        addHeading("Languages");
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: data.languages
                  .map((l) => `${l.name} (${l.proficiency})`)
                  .join("  •  "),
                size: 19.5,
              }),
            ],
          })
        );
        break;

      case "references":
        if (data.references.length === 0) return;
        addHeading("References");
        for (const ref of data.references) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: `${ref.name} — ${ref.title}, ${ref.company} (${[ref.email, ref.phone].filter(Boolean).join(" | ")})`,
                  size: 19,
                }),
              ],
            })
          );
        }
        break;
    }
  };

  for (const sec of data.sectionOrder) {
    renderSection(sec);
  }

  if (!data.removeBranding) {
    children.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: "Generated by ResumePro AI",
            size: 15,
            color: "94A3B8",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeName = (
    fileName || `${data.personalInfo.fullName || "Resume"}-ATS-Resume`
  )
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  a.href = url;
  a.download = `${safeName}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
