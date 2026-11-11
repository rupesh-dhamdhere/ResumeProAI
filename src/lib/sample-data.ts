import type {
  ATSHistoryEntry,
  AdminUserRecord,
  BlogPost,
  JobMatchResult,
  ResumeData,
  SavedResume,
} from "@/types/resume";

export const SAMPLE_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "Alex Rivera",
    jobTitle: "Senior Full-Stack Software Engineer",
    email: "alex.rivera@example.com",
    phone: "+1 (415) 890-4321",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexrivera",
    github: "github.com/alexrivera",
    website: "alexrivera.dev",
  },
  summary:
    "Senior Full-Stack Software Engineer with 6+ years of experience architecting high-throughput web applications in TypeScript, React, Next.js, and Node.js. Proven track record of reducing API latency by 45%, scaling cloud microservices to 2M+ monthly active users, and mentoring cross-functional engineering squads.",
  experience: [
    {
      id: "exp-1",
      company: "CloudScale Systems",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "Mar 2023",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected a Next.js 15 & TypeScript customer analytics platform serving 1.8M monthly active users with 99.98% uptime.",
        "Reduced PostgreSQL query latency by 47% by redesigning indexing strategies and introducing Redis read-through caching.",
        "Led CI/CD migration to GitHub Actions and Docker, cutting deployment lead times from 42 minutes to 9 minutes.",
        "Mentored 4 mid-level engineers via weekly architecture reviews and standardized automated end-to-end test coverage to 88%.",
      ],
    },
    {
      id: "exp-2",
      company: "FinPulse Technologies",
      role: "Full-Stack Engineer",
      location: "Austin, TX",
      startDate: "Jun 2020",
      endDate: "Feb 2023",
      current: false,
      bullets: [
        "Built real-time billing reconciliation REST APIs in Node.js and PostgreSQL processing $42M+ in annual transaction volume.",
        "Redesigned checkout UI components in React and Tailwind CSS, increasing mobile conversion rate by 19%.",
        "Implemented automated anomaly detection alerts on AWS CloudWatch, decreasing mean time to resolution by 35%.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of California, Berkeley",
      degree: "Bachelor of Science",
      field: "Computer Science",
      location: "Berkeley, CA",
      startDate: "2016",
      endDate: "2020",
      gpa: "3.85 / 4.0",
      highlights: "Dean's Honors List, ACM Programming Contest Finalist",
    },
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
    "AWS",
    "Docker",
    "GraphQL",
    "REST APIs",
    "Redis",
    "CI/CD",
    "System Design",
    "Tailwind CSS",
    "Unit Testing",
  ],
  projects: [
    {
      id: "proj-1",
      name: "OpenTrace APM",
      role: "Creator & Maintainer",
      techStack: "TypeScript, OpenTelemetry, ClickHouse, React",
      link: "github.com/alexrivera/opentrace",
      description:
        "Open-source lightweight distributed tracing dashboard with 1.4k+ GitHub stars and sub-100ms trace search.",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2024",
      credentialId: "AWS-SAA-90482",
    },
  ],
  achievements: [
    {
      id: "ach-1",
      title: "Engineering Excellence Award",
      organization: "CloudScale Systems",
      date: "2024",
      description: "Recognized among top 5% of engineers for zero-downtime database sharding migration.",
    },
  ],
  languages: [
    { id: "lang-1", name: "English", proficiency: "Native" },
    { id: "lang-2", name: "Spanish", proficiency: "Professional" },
  ],
  references: [
    {
      id: "ref-1",
      name: "Elena Vance",
      title: "VP of Engineering",
      company: "CloudScale Systems",
      email: "elena.vance@cloudscale.example.com",
      phone: "+1 (415) 555-0192",
    },
  ],
  sectionOrder: [
    "summary",
    "experience",
    "skills",
    "projects",
    "education",
    "certifications",
    "achievements",
    "languages",
    "references",
  ],
  hiddenSections: ["references"],
  removeBranding: false,
};

export const INITIAL_SAVED_RESUMES: SavedResume[] = [
  {
    id: "res-senior-swe",
    title: "Senior Full-Stack Engineer (2026)",
    templateId: "modern-cobalt",
    data: SAMPLE_RESUME_DATA,
    atsScore: 94,
    updatedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    isPublic: true,
    shareSlug: "alex-rivera-swe",
    viewsCount: 128,
    downloadsCount: 14,
    versions: [
      {
        id: "ver-1",
        versionNumber: 1,
        label: "Initial Draft",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        atsScore: 79,
        data: SAMPLE_RESUME_DATA,
      },
      {
        id: "ver-2",
        versionNumber: 2,
        label: "Quantified Metrics Pass",
        createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
        atsScore: 94,
        data: SAMPLE_RESUME_DATA,
      },
    ],
  },
  {
    id: "res-staff-platform",
    title: "Staff Platform Engineer — Stripe Application",
    templateId: "tech-silicon-stack",
    data: {
      ...SAMPLE_RESUME_DATA,
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        jobTitle: "Staff Platform Software Engineer",
      },
    },
    atsScore: 91,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    isPublic: false,
    shareSlug: "alex-rivera-staff",
    viewsCount: 42,
    downloadsCount: 6,
    versions: [
      {
        id: "ver-s1",
        versionNumber: 1,
        label: "Tailored for Payments Infra",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        atsScore: 91,
        data: SAMPLE_RESUME_DATA,
      },
    ],
  },
];

export const INITIAL_ATS_HISTORY: ATSHistoryEntry[] = [
  {
    id: "ats-h-1",
    resumeId: "res-senior-swe",
    resumeTitle: "Senior Full-Stack Engineer (2026)",
    overallScore: 94,
    readabilityScore: 96,
    completenessScore: 95,
    keywordScore: 91,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "ats-h-2",
    resumeId: "res-staff-platform",
    resumeTitle: "Staff Platform Engineer — Stripe Application",
    overallScore: 91,
    readabilityScore: 92,
    completenessScore: 94,
    keywordScore: 87,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 27).toISOString(),
  },
  {
    id: "ats-h-3",
    resumeId: "res-senior-swe",
    resumeTitle: "Senior Full-Stack Engineer (v1)",
    overallScore: 79,
    readabilityScore: 84,
    completenessScore: 85,
    keywordScore: 70,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
];

export const INITIAL_JOB_MATCHES: JobMatchResult[] = [
  {
    id: "jm-1",
    jobTitle: "Senior Full-Stack Engineer, AI Platform",
    company: "Vercel",
    matchPercentage: 89,
    matchedKeywords: ["TypeScript", "Next.js", "React", "Node.js", "PostgreSQL", "CI/CD"],
    missingKeywords: ["Edge Runtime", "Kubernetes", "Turborepo"],
    matchedSkills: ["TypeScript", "Next.js", "React", "Node.js", "PostgreSQL"],
    missingSkills: ["Kubernetes"],
    suggestions: [
      "Mention experience with monorepo build pipelines or Edge caching if applicable.",
      "Highlight Next.js App Router SSR optimization metrics in your top bullet.",
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "jm-2",
    jobTitle: "Lead Frontend Architect",
    company: "Linear",
    matchPercentage: 84,
    matchedKeywords: ["TypeScript", "React", "System Design", "Tailwind CSS"],
    missingKeywords: ["WebSockets", "IndexedDB", "GraphQL Subscriptions"],
    matchedSkills: ["TypeScript", "React", "System Design"],
    missingSkills: ["WebSockets"],
    suggestions: [
      "Add client-side performance and local-first state sync details to your summary.",
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const PRICING_PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "\$0",
    period: "/forever",
    description: "Essential tools to build and test an ATS-friendly resume.",
    badge: null,
    cta: "Start Free",
    features: [
      "Up to 2 saved resumes",
      "8+ Core ATS-friendly templates",
      "Real-time ATS Score & basic checks",
      "PDF & Print export (with ResumePro badge)",
      "Auto-save & drag-and-drop sections",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "\$9",
    period: "/month",
    description: "Everything active job seekers need to beat ATS filters and land interviews.",
    badge: "Most Popular",
    cta: "Upgrade to Pro",
    features: [
      "Unlimited resumes & version history",
      "All 22+ ATS-verified templates",
      "AI Summary, Experience & Keyword writer",
      "Job Description Matcher & gap analysis",
      "PDF, DOCX & Print export (no branding)",
      "Shareable live resume links & analytics",
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: "\$19",
    period: "/month",
    description: "Advanced AI career suite for executives, consultants, and power applicants.",
    badge: "Best Value",
    cta: "Go Premium",
    features: [
      "Everything in Pro, unlimited usage",
      "AI Cover Letter Generator per job post",
      "LinkedIn Profile 1-click import & sync",
      "Deep readability & line-by-line AI rewrite",
      "Priority template drops & custom branding",
      "Full ATS & Job Match history archive",
    ],
  },
];

export const TESTIMONIALS = [
  {
    name: "Priya Nair",
    role: "Staff Product Manager at Stripe",
    quote:
      "My callback rate jumped from 8% to 38% in two weeks. The job description matcher surfaced four missing keywords I had overlooked.",
    scoreBefore: 64,
    scoreAfter: 95,
  },
  {
    name: "Marcus Holloway",
    role: "Senior Backend Engineer at Datadog",
    quote:
      "Most resume builders break Workday and Greenhouse parsers with multi-column tables. ResumePro AI exports razor-clean, text-selectable PDFs that parse flawlessly.",
    scoreBefore: 71,
    scoreAfter: 97,
  },
  {
    name: "Sophia Chen",
    role: "Growth Marketing Lead at Figma",
    quote:
      "The AI experience bullet generator turned vague campaign tasks into quantified ROI statements in seconds. Worth every penny of the Pro plan.",
    scoreBefore: 68,
    scoreAfter: 93,
  },
];

export const FAQS = [
  {
    q: "What makes a resume truly ATS-friendly?",
    a: "Applicant Tracking Systems (like Workday, Greenhouse, Lever, and Taleo) extract text linearly. Resumes with text boxes, multi-column graphics, skill rating bars, or embedded images often scramble your data. All 22+ ResumePro AI templates use clean semantic hierarchy and text-selectable PDF/DOCX output for 99–100% parse accuracy.",
  },
  {
    q: "How is the ATS Score out of 100 calculated?",
    a: "Our ATS Optimization Engine evaluates five weighted pillars: Section Completeness (headers, summary, experience, education, skills), Quantified Impact (metrics & percentages), Action Verbs & Clarity, Readability & Optimal Length, and Role-Specific Keyword Density.",
  },
  {
    q: "Can I import my existing LinkedIn profile?",
    a: "Yes! Inside the Resume Builder, click 'Import LinkedIn' to paste your LinkedIn profile text or JSON export and automatically populate your headline, summary, experience, education, and skills.",
  },
  {
    q: "Can I remove ResumePro AI branding when downloading?",
    a: "Yes. Both Pro (\$9/month) and Premium (\$19/month) plans include one-click custom branding removal across PDF, DOCX, print, and public share links.",
  },
  {
    q: "Is my resume data secure and private?",
    a: "Your resumes are protected by Supabase Row-Level Security (RLS) so only you can view or edit your documents unless you explicitly toggle a public shareable link.",
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-ats-parsers-actually-read-your-resume-in-2026",
    title: "How ATS Parsers Actually Read Your Resume in 2026 (And 7 Formatting Traps to Avoid)",
    excerpt:
      "Understand how Greenhouse, Lever, and Workday tokenize PDFs—and why two-column Canva templates silently kill qualified applications.",
    category: "ATS Strategy",
    readTime: "6 min read",
    publishedAt: "Nov 4, 2026",
    author: { name: "Dr. Elena Rostova", role: "Head of Talent Science" },
    content: [
      "Over 97% of Fortune 500 companies rely on Applicant Tracking Systems (ATS) to parse, index, and rank incoming resumes before a human recruiter ever opens the file.",
      "The biggest misconception among job seekers is that ATS software 'rejects' resumes visually. In reality, legacy parsers extract raw text streams left-to-right, top-to-bottom. When a template uses decorative sidebars or tables, your job title from column A gets merged with dates from column B.",
      "To guarantee 100% parse fidelity: stick to standard section headers ('Work Experience', 'Education', 'Skills'), avoid icons or skill progress bars, and export as a genuine text-selectable PDF or DOCX rather than a flattened image.",
      "Every template inside ResumePro AI is stress-tested against modern LLM-assisted screeners and traditional keyword indexers alike.",
    ],
  },
  {
    slug: "quantifying-impact-with-the-xyz-resume-formula",
    title: "The Google X-Y-Z Formula: Turn Duties Into High-Scoring Resume Bullets",
    excerpt:
      "Learn how to rewrite passive job descriptions into measurable accomplishments that boost both your ATS score and recruiter response rate.",
    category: "Resume Writing",
    readTime: "5 min read",
    publishedAt: "Oct 28, 2026",
    author: { name: "Liam O'Connor", role: "Principal Career Coach" },
    content: [
      "Recruiters spend an average of 6 to 8 seconds on an initial resume scan. Listing 'Responsible for managing APIs' tells them what your job description said, not how well you performed.",
      "Use the X-Y-Z framework: Accomplished [X] as measured by [Y], by doing [Z]. For example: 'Reduced checkout API latency by 47% (Y) across 1.8M monthly users (X) by redesigning PostgreSQL indexes and adding Redis caching (Z).'",
      "ResumePro AI automatically tracks your quantified bullet ratio and flags passive phrases like 'responsible for' or 'worked on', helping you lift your impact score past 90/100.",
    ],
  },
  {
    slug: "tailoring-keywords-without-stuffing",
    title: "Keyword Optimization Without Stuffing: Matching Any Job Description in 3 Minutes",
    excerpt:
      "A practical workflow for extracting hard skills, domain terminology, and seniority signals from any job posting.",
    category: "Job Search",
    readTime: "4 min read",
    publishedAt: "Oct 16, 2026",
    author: { name: "Aria Patel", role: "Lead Product Designer" },
    content: [
      "Modern recruiting teams search candidate databases using exact boolean skill queries—such as ('TypeScript' AND 'Next.js' AND 'PostgreSQL'). If your resume only says 'Modern Web Stack', you may never appear in search results.",
      "Instead of copying entire paragraphs from a job description, paste the posting into ResumePro AI's Job Description Matcher. Review the missing skills list, verify which ones you genuinely possess, and weave them naturally into your Skills grid and 2–3 relevant work bullets.",
      "Aim for a 75%+ job match score before submitting—this consistently places candidates in the top decile of screened applicants.",
    ],
  },
];

export const ADMIN_MOCK_USERS: AdminUserRecord[] = [
  {
    id: "usr-1",
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    plan: "pro",
    status: "active",
    resumesCount: 4,
    joinedAt: "2026-08-12",
    lastActive: "12 mins ago",
  },
  {
    id: "usr-2",
    name: "Priya Nair",
    email: "priya.nair@stripe-demo.com",
    plan: "premium",
    status: "active",
    resumesCount: 7,
    joinedAt: "2026-07-03",
    lastActive: "1 hour ago",
  },
  {
    id: "usr-3",
    name: "Marcus Holloway",
    email: "m.holloway@clouddev.io",
    plan: "pro",
    status: "active",
    resumesCount: 3,
    joinedAt: "2026-09-19",
    lastActive: "Yesterday",
  },
  {
    id: "usr-4",
    name: "Hannah Abbott",
    email: "hannah.a@university.edu",
    plan: "free",
    status: "active",
    resumesCount: 2,
    joinedAt: "2026-10-25",
    lastActive: "2 days ago",
  },
  {
    id: "usr-5",
    name: "Devon Brooks",
    email: "devon.brooks@agency.co",
    plan: "premium",
    status: "active",
    resumesCount: 11,
    joinedAt: "2026-06-14",
    lastActive: "3 hours ago",
  },
];

export function parseLinkedInProfileText(rawText: string): Partial<ResumeData> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return {};

  // Support JSON paste or plain LinkedIn profile copy-paste
  if (rawText.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawText);
      return {
        personalInfo: {
          fullName: parsed.fullName || parsed.name || "Alex Rivera",
          jobTitle: parsed.headline || parsed.jobTitle || "Software Engineer",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          linkedin: parsed.linkedin || "",
          github: parsed.github || "",
          website: parsed.website || "",
        },
        summary: parsed.summary || parsed.about || "",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      };
    } catch {
      // fall through to text parser
    }
  }

  const fullName = lines[0]?.slice(0, 60) || "Imported Candidate";
  const jobTitle = lines[1]?.slice(0, 90) || "Product & Engineering Leader";
  const locationLine = lines.find((l) =>
    /(, [A-Z]{2}|United States|Remote|India|UK|Canada|San Francisco|New York|London)/i.test(l)
  );
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);

  const aboutIndex = lines.findIndex((l) => /^(about|summary)$/i.test(l));
  const summary =
    aboutIndex >= 0 && lines[aboutIndex + 1]
      ? lines.slice(aboutIndex + 1, aboutIndex + 3).join(" ")
      : lines.slice(2, 5).join(" ").slice(0, 360);

  const skillsIndex = lines.findIndex((l) => /^skills$/i.test(l));
  const parsedSkills =
    skillsIndex >= 0
      ? lines
          .slice(skillsIndex + 1, skillsIndex + 10)
          .flatMap((l) => l.split(/[,•|]/))
          .map((s) => s.trim())
          .filter((s) => s.length > 1 && s.length < 36)
      : ["Leadership", "Product Strategy", "TypeScript", "SQL", "Cross-Functional Delivery"];

  return {
    personalInfo: {
      fullName,
      jobTitle,
      email: emailMatch ? emailMatch[0] : "candidate@example.com",
      phone: "",
      location: locationLine || "Remote",
      linkedin: linkedinMatch ? linkedinMatch[0] : "",
      github: "",
      website: "",
    },
    summary,
    skills: Array.from(new Set(parsedSkills)).slice(0, 14),
  };
}
