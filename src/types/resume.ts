export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "references";

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  highlights: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  techStack: string;
  link: string;
  description: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  date: string;
  description: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: "Native" | "Fluent" | "Professional" | "Intermediate" | "Basic";
}

export interface ReferenceItem {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

export interface CustomSectionConfig {
  id: SectionKey;
  label: string;
  enabled: boolean;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
  languages: LanguageItem[];
  references: ReferenceItem[];
  sectionOrder: SectionKey[];
  hiddenSections: SectionKey[];
  removeBranding: boolean;
}

export interface ResumeVersion {
  id: string;
  versionNumber: number;
  label: string;
  createdAt: string;
  atsScore: number;
  data: ResumeData;
}

export interface SavedResume {
  id: string;
  title: string;
  templateId: string;
  data: ResumeData;
  atsScore: number;
  updatedAt: string;
  createdAt: string;
  isPublic: boolean;
  shareSlug: string;
  viewsCount: number;
  downloadsCount: number;
  versions: ResumeVersion[];
}

export type TemplateCategory =
  | "Modern"
  | "Professional"
  | "Executive"
  | "Fresher"
  | "Tech"
  | "Marketing";

export type TemplateLayout =
  | "classic-single"
  | "modern-header"
  | "executive-serif"
  | "tech-mono-accent"
  | "minimal-clean"
  | "two-tone-band"
  | "compact-dense";

export interface ResumeTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  accentColor: string;
  secondaryColor: string;
  layout: TemplateLayout;
  fontStyle: "sans" | "serif" | "mono-header";
  isPremium: boolean;
  isActive: boolean;
  atsCompatibility: number;
  usageCount: number;
  tags: string[];
}

export interface ATSCheckItem {
  id: string;
  category: "Completeness" | "Readability" | "Keywords" | "Impact" | "Formatting";
  label: string;
  passed: boolean;
  severity: "critical" | "warning" | "good";
  message: string;
  pointsEarned: number;
  pointsMax: number;
}

export interface ATSAnalysisResult {
  overallScore: number;
  completenessScore: number;
  readabilityScore: number;
  keywordScore: number;
  impactScore: number;
  formattingScore: number;
  wordCount: number;
  estimatedReadingSeconds: number;
  checks: ATSCheckItem[];
  suggestions: string[];
  missingSkills: string[];
  detectedKeywords: string[];
  recommendedKeywords: string[];
  strongVerbsFound: string[];
  weakPhrasesFound: string[];
  quantifiedBulletRatio: number;
}

export interface JobMatchResult {
  id: string;
  jobTitle: string;
  company: string;
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  createdAt: string;
}

export interface ATSHistoryEntry {
  id: string;
  resumeId: string;
  resumeTitle: string;
  overallScore: number;
  readabilityScore: number;
  completenessScore: number;
  keywordScore: number;
  createdAt: string;
}

export type SubscriptionPlan = "free" | "pro" | "premium";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  plan: SubscriptionPlan;
  role: "user" | "admin";
  provider: "email" | "google" | "linkedin" | "demo";
  createdAt: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  plan: SubscriptionPlan;
  status: "active" | "suspended";
  resumesCount: number;
  joinedAt: string;
  lastActive: string;
}

export interface DataPrivacyRequest {
  id: string;
  email: string;
  fullName: string;
  requestType: "deletion" | "export" | "correction";
  regulation: "DPDP_2023" | "GDPR";
  reason: string;
  status: "pending" | "processing" | "completed";
  createdAt: string;
  completedAt?: string;
}

export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  preferences: boolean;
  consentedAt: string;
  regulationNotice: string;
}

export interface PaymentOrderRecord {
  id: string;
  orderId: string;
  paymentId: string;
  plan: "pro" | "premium";
  amountInr: string;
  amountUsd: string;
  currency: "INR";
  customerEmail: string;
  customerName: string;
  status:
    | "INITIATED"
    | "ACTIVE"
    | "QUEUED"
    | "PROCESSING"
    | "MANUAL_REVIEW"
    | "OBSERVED_SUCCESS"
    | "RECONCILED"
    | "SUCCESS"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED";
  settlementState: "PENDING" | "NOT_RECONCILED" | "RECONCILED" | "REJECTED";
  utr?: string;
  verificationLevel?: number;
  checkoutUrl?: string | null;
  mode: "youpi-pg" | "sandbox-preview";
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
  };
  content: string[];
}
