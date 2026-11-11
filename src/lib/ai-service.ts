import type { ResumeData } from "@/types/resume";

export type AIActionType =
  | "summary"
  | "experience"
  | "keywords"
  | "cover_letter"
  | "improvements";

export interface AIRequestPayload {
  action: AIActionType;
  jobTitle?: string;
  company?: string;
  industry?: string;
  experienceContext?: string;
  jobDescription?: string;
  resume?: ResumeData;
}

export async function runBuiltInAI(payload: AIRequestPayload): Promise<{
  result: string;
  items?: string[];
}> {
  const title = payload.jobTitle?.trim() || payload.resume?.personalInfo.jobTitle || "Software Engineer";
  const skillsList = payload.resume?.skills?.slice(0, 6).join(", ") || "cross-functional execution, system design, and data-driven delivery";
  const years = Math.max(2, (payload.resume?.experience?.length ?? 1) * 2 + 1);

  switch (payload.action) {
    case "summary": {
      const summary = `Results-driven ${title} with ${years}+ years of experience architecting scalable solutions and delivering measurable business impact. Proven expertise in ${skillsList}, with a strong track record of streamlining workflows, accelerating delivery velocity by 30%+, and collaborating across product and engineering teams to ship high-reliability initiatives.`;
      return { result: summary };
    }

    case "experience": {
      const role = payload.jobTitle?.trim() || "Specialist";
      const company = payload.company?.trim() || "the organization";
      const bullets = [
        `Spearheaded end-to-end delivery of core ${role} initiatives at ${company}, improving operational efficiency by 34% and reducing turnaround time by 25%.`,
        `Architected and automated scalable workflows using modern tooling, saving 12+ engineering hours per week while maintaining 99.9% reliability.`,
        `Collaborated with cross-functional product, design, and executive stakeholders to ship 4 major releases ahead of schedule, driving a 22% lift in user engagement.`,
        `Mentored 3+ junior team members through structured code/process reviews and standardized documentation practices across the department.`,
      ];
      return {
        result: bullets.join("\n"),
        items: bullets,
      };
    }

    case "keywords": {
      const lower = title.toLowerCase();
      let keywords: string[] = [];
      if (/(engineer|developer|software|frontend|backend|fullstack|devops)/.test(lower)) {
        keywords = [
          "TypeScript",
          "React",
          "Next.js",
          "Node.js",
          "PostgreSQL",
          "AWS",
          "Docker",
          "CI/CD",
          "System Design",
          "Microservices",
          "REST APIs",
          "Automated Testing",
        ];
      } else if (/(product|pm)/.test(lower)) {
        keywords = [
          "Product Strategy",
          "Roadmapping",
          "A/B Testing",
          "SQL",
          "OKRs & KPIs",
          "User Discovery",
          "Go-to-Market",
          "PRDs",
          "Cross-Functional Leadership",
          "Retention Optimization",
        ];
      } else if (/(marketing|growth|seo|brand)/.test(lower)) {
        keywords = [
          "Demand Generation",
          "SEO / SEM",
          "Conversion Optimization",
          "HubSpot / Marketo",
          "Google Analytics 4",
          "Paid Acquisition",
          "CAC / LTV",
          "Lifecycle Campaigns",
          "B2B SaaS GTM",
          "Attribution Modeling",
        ];
      } else if (/(data|ai|ml|analyst|scientist)/.test(lower)) {
        keywords = [
          "Python",
          "SQL",
          "Machine Learning",
          "LLMs & RAG",
          "PyTorch",
          "ETL Pipelines",
          "Snowflake",
          "Experimentation",
          "Statistical Modeling",
          "Data Visualization",
        ];
      } else {
        keywords = [
          "Strategic Planning",
          "Process Improvement",
          "Stakeholder Alignment",
          "Data-Driven Decision Making",
          "Project Delivery",
          "Cross-Functional Leadership",
          "KPI Tracking",
          "Budget Ownership",
        ];
      }
      return {
        result: keywords.join(", "),
        items: keywords,
      };
    }

    case "cover_letter": {
      const name = payload.resume?.personalInfo.fullName || "Candidate";
      const email = payload.resume?.personalInfo.email || "email@example.com";
      const companyName = payload.company?.trim() || "your team";
      const targetRole = payload.jobTitle?.trim() || title;
      const topExp = payload.resume?.experience?.[0];
      const highlight =
        topExp?.bullets?.[0] ||
        `delivered measurable improvements across core product and operational metrics`;

      const letter = `Dear Hiring Manager at ${companyName},

I am excited to apply for the ${targetRole} position at ${companyName}. With ${years}+ years of hands-on experience spanning ${skillsList}, I thrive in high-ownership environments where technical rigor and measurable business outcomes go hand in hand.

In my most recent role${topExp ? ` as ${topExp.role} at ${topExp.company}` : ""}, I ${highlight.charAt(0).toLowerCase() + highlight.slice(1)} This experience sharpened my ability to translate ambiguous business goals into crisp execution plans and reliable, scalable results.

What draws me to ${companyName} is your commitment to building impactful, customer-centric solutions. I would welcome the opportunity to bring my background in ${skillsList} to help accelerate your upcoming roadmap.

Thank you for your time and consideration. I look forward to discussing how I can contribute to ${companyName}.

Best regards,
${name}
${email}`;
      return { result: letter };
    }

    case "improvements": {
      const tips = [
        "Lead every experience bullet with a high-impact action verb (e.g., Architected, Accelerated, Spearheaded, Reduced) instead of passive phrasing.",
        "Attach concrete metrics (%, $, latency reduction, hours saved, or user scale) to at least half of your bullet points.",
        `Mirror exact terminology from your target ${title} job postings inside both your Summary and Skills sections.`,
        "Keep bullet points concise (1–2 lines max) and maintain a clean single-column layout without tables or text boxes for 100% ATS parsing.",
      ];
      return {
        result: tips.join("\n"),
        items: tips,
      };
    }
  }
}
