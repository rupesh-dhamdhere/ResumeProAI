import type {
  ATSAnalysisResult,
  ATSCheckItem,
  JobMatchResult,
  ResumeData,
} from "@/types/resume";
import { generateId } from "@/lib/utils";

const STRONG_ACTION_VERBS = [
  "accelerated",
  "achieved",
  "architected",
  "automated",
  "boosted",
  "built",
  "championed",
  "consolidated",
  "created",
  "decreased",
  "delivered",
  "designed",
  "developed",
  "directed",
  "drove",
  "eliminated",
  "engineered",
  "established",
  "expanded",
  "generated",
  "grew",
  "implemented",
  "improved",
  "increased",
  "initiated",
  "launched",
  "led",
  "managed",
  "mentored",
  "migrated",
  "modernized",
  "negotiated",
  "optimized",
  "orchestrated",
  "outperformed",
  "pioneered",
  "reduced",
  "redesigned",
  "refactored",
  "scaled",
  "spearheaded",
  "streamlined",
  "transformed",
];

const WEAK_PHRASES = [
  "responsible for",
  "duties included",
  "helped with",
  "worked on",
  "assisted in",
  "tasked with",
  "hardworking",
  "team player",
  "detail-oriented",
  "self-starter",
  "references available upon request",
];

const ROLE_SKILL_BENCHMARKS: Record<string, string[]> = {
  engineer: [
    "TypeScript",
    "React",
    "Node.js",
    "Python",
    "AWS",
    "Docker",
    "CI/CD",
    "PostgreSQL",
    "System Design",
    "REST APIs",
    "GraphQL",
    "Unit Testing",
  ],
  developer: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Git",
    "SQL",
    "REST APIs",
    "Agile",
    "CI/CD",
    "Cloud",
  ],
  product: [
    "Product Strategy",
    "Roadmapping",
    "A/B Testing",
    "SQL",
    "User Research",
    "KPIs",
    "Agile",
    "Stakeholder Management",
    "Go-to-Market",
    "Analytics",
  ],
  marketing: [
    "SEO",
    "SEM",
    "Google Analytics",
    "HubSpot",
    "Demand Generation",
    "Content Strategy",
    "CRM",
    "Conversion Rate Optimization",
    "Lifecycle Marketing",
    "CAC / LTV",
  ],
  data: [
    "Python",
    "SQL",
    "Machine Learning",
    "Pandas",
    "TensorFlow",
    "Spark",
    "Tableau",
    "A/B Testing",
    "ETL",
    "Statistics",
  ],
  design: [
    "Figma",
    "Design Systems",
    "User Research",
    "Prototyping",
    "Wireframing",
    "Accessibility (WCAG)",
    "Usability Testing",
    "UI/UX",
  ],
  default: [
    "Project Management",
    "Cross-Functional Collaboration",
    "Data Analysis",
    "Strategic Planning",
    "Communication",
    "Process Optimization",
    "Leadership",
    "Stakeholder Management",
  ],
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "our",
  "will",
  "have",
  "has",
  "can",
  "not",
  "all",
  "who",
  "what",
  "when",
  "where",
  "how",
  "about",
  "into",
  "over",
  "more",
  "than",
  "also",
  "their",
  "they",
  "been",
  "were",
  "was",
  "being",
  "work",
  "role",
  "team",
  "years",
  "year",
  "experience",
  "required",
  "preferred",
  "ability",
  "strong",
  "skills",
  "using",
  "including",
  "such",
  "well",
  "other",
  "both",
  "must",
  "join",
  "looking",
  "company",
  "position",
  "responsibilities",
  "requirements",
  "qualifications",
]);

function flattenResumeText(data: ResumeData): string {
  const parts: string[] = [
    data.personalInfo.fullName,
    data.personalInfo.jobTitle,
    data.personalInfo.location,
    data.summary,
    data.skills.join(" "),
  ];

  for (const exp of data.experience) {
    parts.push(exp.role, exp.company, exp.location, ...exp.bullets);
  }
  for (const edu of data.education) {
    parts.push(edu.degree, edu.field, edu.institution, edu.highlights);
  }
  for (const proj of data.projects) {
    parts.push(proj.name, proj.role, proj.techStack, proj.description);
  }
  for (const cert of data.certifications) {
    parts.push(cert.name, cert.issuer);
  }
  for (const ach of data.achievements) {
    parts.push(ach.title, ach.organization, ach.description);
  }
  return parts.filter(Boolean).join(" ");
}

function getBenchmarkSkills(jobTitle: string): string[] {
  const lower = jobTitle.toLowerCase();
  if (/(engineer|software|frontend|backend|fullstack|devops|sre)/.test(lower)) {
    return ROLE_SKILL_BENCHMARKS.engineer;
  }
  if (/(developer|programmer|coder)/.test(lower)) {
    return ROLE_SKILL_BENCHMARKS.developer;
  }
  if (/(product manager|pm|product owner)/.test(lower)) {
    return ROLE_SKILL_BENCHMARKS.product;
  }
  if (/(marketing|growth|seo|brand|content|demand)/.test(lower)) {
    return ROLE_SKILL_BENCHMARKS.marketing;
  }
  if (/(data|machine learning|ml|ai|analyst|scientist)/.test(lower)) {
    return ROLE_SKILL_BENCHMARKS.data;
  }
  if (/(design|ux|ui|creative)/.test(lower)) {
    return ROLE_SKILL_BENCHMARKS.design;
  }
  return ROLE_SKILL_BENCHMARKS.default;
}

export function analyzeResumeATS(data: ResumeData): ATSAnalysisResult {
  const fullText = flattenResumeText(data);
  const lowerText = fullText.toLowerCase();
  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedReadingSeconds = Math.max(10, Math.round((wordCount / 220) * 60));

  const checks: ATSCheckItem[] = [];

  // 1. Contact Info Completeness (15 pts)
  const hasName = data.personalInfo.fullName.trim().length > 1;
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    data.personalInfo.email.trim()
  );
  const hasPhone = data.personalInfo.phone.trim().length >= 7;
  const hasLocation = data.personalInfo.location.trim().length >= 2;
  const hasLink =
    Boolean(data.personalInfo.linkedin.trim()) ||
    Boolean(data.personalInfo.github.trim()) ||
    Boolean(data.personalInfo.website.trim());

  const contactScore =
    (hasName ? 4 : 0) +
    (hasEmail ? 4 : 0) +
    (hasPhone ? 3 : 0) +
    (hasLocation ? 2 : 0) +
    (hasLink ? 2 : 0);

  checks.push({
    id: "contact-info",
    category: "Completeness",
    label: "Contact & Header Completeness",
    passed: contactScore >= 13,
    severity: contactScore >= 13 ? "good" : contactScore >= 9 ? "warning" : "critical",
    message:
      contactScore >= 13
        ? "All essential contact fields (name, email, phone, location, LinkedIn/portfolio) are present."
        : "Include full name, valid email, phone, city/state, and LinkedIn or portfolio URL.",
    pointsEarned: contactScore,
    pointsMax: 15,
  });

  // 2. Professional Summary (10 pts)
  const summaryWords = data.summary.trim().split(/\s+/).filter(Boolean).length;
  const summaryScore =
    summaryWords >= 25 && summaryWords <= 85
      ? 10
      : summaryWords >= 12
        ? 6
        : 0;
  checks.push({
    id: "summary-quality",
    category: "Completeness",
    label: "Targeted Professional Summary",
    passed: summaryScore === 10,
    severity: summaryScore === 10 ? "good" : summaryScore > 0 ? "warning" : "critical",
    message:
      summaryScore === 10
        ? `Strong summary length (${summaryWords} words) tailored to your target role.`
        : summaryWords === 0
          ? "Add a 30–70 word professional summary highlighting your target role and top achievements."
          : `Summary is ${summaryWords} words. Aim for 25–85 crisp, keyword-rich words.`,
    pointsEarned: summaryScore,
    pointsMax: 10,
  });

  // 3. Work Experience & Bullet Depth (15 pts)
  const expCount = data.experience.length;
  const allBullets = data.experience.flatMap((e) =>
    e.bullets.map((b) => b.trim()).filter(Boolean)
  );
  const expScore =
    expCount >= 2 && allBullets.length >= 6
      ? 15
      : expCount >= 1 && allBullets.length >= 3
        ? 10
        : expCount >= 1
          ? 5
          : 0;

  checks.push({
    id: "experience-depth",
    category: "Completeness",
    label: "Work Experience Depth",
    passed: expScore >= 12,
    severity: expScore >= 12 ? "good" : expScore > 0 ? "warning" : "critical",
    message:
      expScore >= 12
        ? `${expCount} roles with ${allBullets.length} achievement bullets provide rich context.`
        : "Include 3–5 concise bullet points per role detailing scope and outcomes.",
    pointsEarned: expScore,
    pointsMax: 15,
  });

  // 4. Education & Skills Sections (10 pts)
  const hasEdu = data.education.length > 0;
  const skillsCount = data.skills.length;
  const eduSkillsScore = (hasEdu ? 4 : 0) + (skillsCount >= 8 ? 6 : skillsCount >= 4 ? 3 : 0);
  checks.push({
    id: "edu-skills",
    category: "Completeness",
    label: "Education & Core Skills Coverage",
    passed: eduSkillsScore >= 9,
    severity: eduSkillsScore >= 9 ? "good" : "warning",
    message:
      eduSkillsScore >= 9
        ? `Education present and ${skillsCount} skills indexed for ATS matching.`
        : `Add education details and list at least 8–12 role-relevant hard skills (currently ${skillsCount}).`,
    pointsEarned: eduSkillsScore,
    pointsMax: 10,
  });

  // 5. Quantified Metrics & Impact (15 pts)
  const quantifiedBullets = allBullets.filter((b) =>
    /(\d+%|\$\d+|\d+x|\d+\+|\d{2,})/i.test(b)
  );
  const quantifiedBulletRatio =
    allBullets.length > 0 ? quantifiedBullets.length / allBullets.length : 0;
  const quantifiedPoints =
    quantifiedBulletRatio >= 0.5
      ? 15
      : quantifiedBulletRatio >= 0.3
        ? 11
        : quantifiedBulletRatio > 0
          ? 6
          : 0;

  checks.push({
    id: "quantified-impact",
    category: "Impact",
    label: "Quantified Achievements & Metrics",
    passed: quantifiedPoints >= 11,
    severity: quantifiedPoints >= 11 ? "good" : quantifiedPoints > 0 ? "warning" : "critical",
    message:
      quantifiedPoints >= 11
        ? `${quantifiedBullets.length} of ${allBullets.length} bullets include measurable numbers, %, or $ impact.`
        : "Quantify at least 40–50% of your bullets with %, $, time saved, or scale metrics.",
    pointsEarned: quantifiedPoints,
    pointsMax: 15,
  });

  // 6. Strong Action Verbs & No Weak Clichés (10 pts)
  const strongVerbsFound = STRONG_ACTION_VERBS.filter((verb) =>
    new RegExp(`\\b${verb}\\b`, "i").test(lowerText)
  );
  const weakPhrasesFound = WEAK_PHRASES.filter((phrase) =>
    lowerText.includes(phrase)
  );
  const verbPoints = Math.min(7, strongVerbsFound.length);
  const clichePenalty = Math.min(3, weakPhrasesFound.length);
  const verbScore = Math.max(0, verbPoints + (3 - clichePenalty));

  checks.push({
    id: "action-verbs",
    category: "Impact",
    label: "Action Verbs & Concise Phrasing",
    passed: verbScore >= 8 && weakPhrasesFound.length === 0,
    severity:
      verbScore >= 8 && weakPhrasesFound.length === 0
        ? "good"
        : weakPhrasesFound.length > 0
          ? "warning"
          : "warning",
    message:
      weakPhrasesFound.length > 0
        ? `Replace passive phrases (${weakPhrasesFound.slice(0, 3).join(", ")}) with strong action verbs.`
        : `Found ${strongVerbsFound.length} strong action verbs across your bullets.`,
    pointsEarned: verbScore,
    pointsMax: 10,
  });

  // 7. Readability & Length (10 pts)
  const idealWordCount = wordCount >= 280 && wordCount <= 850;
  const avgBulletWords =
    allBullets.length > 0
      ? allBullets.reduce((acc, b) => acc + b.split(/\s+/).length, 0) /
        allBullets.length
      : 0;
  const goodBulletLen = avgBulletWords >= 8 && avgBulletWords <= 28;
  const readabilityPoints =
    (idealWordCount ? 6 : wordCount >= 160 ? 3 : 1) +
    (goodBulletLen ? 4 : allBullets.length > 0 ? 2 : 0);

  checks.push({
    id: "readability-length",
    category: "Readability",
    label: "Optimal Length & Scannability",
    passed: readabilityPoints >= 8,
    severity: readabilityPoints >= 8 ? "good" : "warning",
    message: idealWordCount
      ? `Ideal length (${wordCount} words) for a clean 1–2 page ATS scan.`
      : wordCount < 280
        ? `Resume is brief (${wordCount} words). Aim for 350–750 words for stronger keyword density.`
        : `Resume is long (${wordCount} words). Trim older bullets to stay under 850 words.`,
    pointsEarned: readabilityPoints,
    pointsMax: 10,
  });

  // 8. Keyword Optimization vs Target Job Title (15 pts)
  const benchmarkSkills = getBenchmarkSkills(data.personalInfo.jobTitle || "");
  const detectedKeywords = benchmarkSkills.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  );
  const missingSkills = benchmarkSkills.filter(
    (skill) => !lowerText.includes(skill.toLowerCase())
  );
  const keywordRatio =
    benchmarkSkills.length > 0
      ? detectedKeywords.length / Math.min(8, benchmarkSkills.length)
      : 0;
  const keywordPoints = Math.min(
    15,
    Math.round(keywordRatio * 10 + Math.min(5, data.skills.length * 0.5))
  );

  checks.push({
    id: "keyword-optimization",
    category: "Keywords",
    label: "Role-Specific Keyword Density",
    passed: keywordPoints >= 11,
    severity: keywordPoints >= 11 ? "good" : keywordPoints >= 7 ? "warning" : "critical",
    message:
      keywordPoints >= 11
        ? `Strong keyword alignment with ${data.personalInfo.jobTitle || "target role"} standards.`
        : `Consider incorporating high-signal terms like ${missingSkills.slice(0, 4).join(", ")}.`,
    pointsEarned: keywordPoints,
    pointsMax: 15,
  });

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      checks.reduce((sum, item) => sum + item.pointsEarned, 0)
    )
  );

  const completenessEarned = checks
    .filter((c) => c.category === "Completeness")
    .reduce((s, c) => s + c.pointsEarned, 0);
  const completenessMax = checks
    .filter((c) => c.category === "Completeness")
    .reduce((s, c) => s + c.pointsMax, 0);

  const impactEarned = checks
    .filter((c) => c.category === "Impact")
    .reduce((s, c) => s + c.pointsEarned, 0);
  const impactMax = checks
    .filter((c) => c.category === "Impact")
    .reduce((s, c) => s + c.pointsMax, 0);

  const completenessScore = Math.round((completenessEarned / completenessMax) * 100);
  const impactScore = Math.round((impactEarned / impactMax) * 100);
  const readabilityScore = Math.round((readabilityPoints / 10) * 100);
  const keywordScore = Math.round((keywordPoints / 15) * 100);
  const formattingScore = 98; // Single-column ATS structure built into ResumePro templates

  const suggestions: string[] = [];
  for (const c of checks) {
    if (!c.passed) {
      suggestions.push(c.message);
    }
  }
  if (data.projects.length === 0 && data.certifications.length === 0) {
    suggestions.push(
      "Add at least 1–2 notable Projects or Certifications to differentiate your profile."
    );
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "Your resume is highly ATS-optimized! Run a Job Description Match before each application to tailor top keywords."
    );
  }

  return {
    overallScore,
    completenessScore,
    readabilityScore,
    keywordScore,
    impactScore,
    formattingScore,
    wordCount,
    estimatedReadingSeconds,
    checks,
    suggestions,
    missingSkills: missingSkills.slice(0, 8),
    detectedKeywords: [
      ...new Set([...data.skills.slice(0, 12), ...detectedKeywords]),
    ],
    recommendedKeywords: missingSkills.slice(0, 6),
    strongVerbsFound: strongVerbsFound.slice(0, 10),
    weakPhrasesFound,
    quantifiedBulletRatio: Math.round(quantifiedBulletRatio * 100),
  };
}

export function matchResumeToJobDescription(
  resume: ResumeData,
  jobDescription: string,
  jobTitle = "Target Role",
  company = ""
): JobMatchResult {
  const resumeText = flattenResumeText(resume).toLowerCase();
  const jdClean = jobDescription.trim();

  // Extract capitalized multi-word tech/skill terms and significant keywords
  const knownTerms = [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Java",
    "Go",
    "Rust",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "AWS",
    "GCP",
    "Azure",
    "Docker",
    "Kubernetes",
    "Terraform",
    "CI/CD",
    "GraphQL",
    "REST",
    "Microservices",
    "System Design",
    "Machine Learning",
    "LLM",
    "AI",
    "Tailwind",
    "Figma",
    "Agile",
    "Scrum",
    "SEO",
    "SEM",
    "CRM",
    "HubSpot",
    "Salesforce",
    "Analytics",
    "A/B Testing",
    "Product Strategy",
    "Roadmapping",
    "Stakeholder Management",
    "Leadership",
    "Communication",
    "Git",
    "Linux",
    "Security",
    "Compliance",
    "Tableau",
    "Power BI",
    "Excel",
  ];

  const jdLower = jdClean.toLowerCase();
  const extractedSkills = knownTerms.filter((term) =>
    jdLower.includes(term.toLowerCase())
  );

  // Also extract top frequent meaningful words from JD
  const jdTokens = jdLower
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const freqMap = new Map<string, number>();
  for (const token of jdTokens) {
    freqMap.set(token, (freqMap.get(token) ?? 0) + 1);
  }
  const topTokens = [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word]) => word);

  const allTargetKeywords = Array.from(
    new Set([
      ...extractedSkills,
      ...topTokens.filter(
        (t) => !extractedSkills.some((s) => s.toLowerCase() === t)
      ),
    ])
  ).slice(0, 22);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of allTargetKeywords) {
    if (resumeText.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const matchedSkills = extractedSkills.filter((s) =>
    resumeText.includes(s.toLowerCase())
  );
  const missingSkills = extractedSkills.filter(
    (s) => !resumeText.includes(s.toLowerCase())
  );

  const matchPercentage =
    allTargetKeywords.length > 0
      ? Math.min(
          98,
          Math.max(
            18,
            Math.round((matchedKeywords.length / allTargetKeywords.length) * 100)
          )
        )
      : 50;

  const suggestions: string[] = [];
  if (missingSkills.length > 0) {
    suggestions.push(
      `Add verified skills from the job posting into your Skills & Experience sections: ${missingSkills
        .slice(0, 5)
        .join(", ")}.`
    );
  }
  if (
    jobTitle &&
    !resume.personalInfo.jobTitle
      .toLowerCase()
      .includes(jobTitle.toLowerCase())
  ) {
    suggestions.push(
      `Align your resume headline closer to "${jobTitle}" so recruiters and ATS filters immediately recognize role fit.`
    );
  }
  if (missingKeywords.length > 0) {
    suggestions.push(
      `Weave high-frequency role terms (${missingKeywords
        .slice(0, 4)
        .join(", ")}) naturally into your summary and recent work bullets.`
    );
  }
  if (matchPercentage >= 75) {
    suggestions.push(
      "Strong match! Double-check that your top 3 bullets quantify outcomes directly relevant to this role."
    );
  }

  return {
    id: generateId("match"),
    jobTitle: jobTitle || "Target Role",
    company: company || "Target Company",
    matchPercentage,
    matchedKeywords,
    missingKeywords,
    matchedSkills,
    missingSkills,
    suggestions,
    createdAt: new Date().toISOString(),
  };
}
