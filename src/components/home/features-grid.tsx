import {
  Bot,
  FileSearch,
  Gauge,
  GripVertical,
  Layers,
  Linkedin,
  Lock,
  Share2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Gauge,
    title: "Real-Time ATS Score (0–100)",
    description:
      "Instant scoring across completeness, readability, action verbs, quantified impact, and role keyword density.",
    color: "text-brand-blue bg-brand-blue/10",
  },
  {
    icon: FileSearch,
    title: "Job Description Matching",
    description:
      "Paste any job posting to compute your match percentage, surface missing keywords, and tailor bullets instantly.",
    color: "text-brand-teal bg-brand-teal/10",
  },
  {
    icon: Bot,
    title: "AI Resume & Cover Letter Writer",
    description:
      "Generate crisp summaries, metric-driven experience bullets, role keywords, and tailored cover letters in one click.",
    color: "text-indigo-500 bg-indigo-500/10",
  },
  {
    icon: GripVertical,
    title: "Drag-and-Drop Section Ordering",
    description:
      "Reorder Experience, Skills, Projects, Education, Certifications, and more dynamically with instant live preview.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Layers,
    title: "22+ ATS-Verified Templates",
    description:
      "Switch effortlessly between Modern, Professional, Executive, Fresher, Tech, and Marketing styles with 1 click.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Share2,
    title: "PDF, DOCX, Print & Share Links",
    description:
      "Export true text-selectable PDFs, editable DOCX files, print-ready pages, or trackable live web links.",
    color: "text-sky-500 bg-sky-500/10",
  },
  {
    icon: Linkedin,
    title: "LinkedIn Import & Auto-Save",
    description:
      "Import your LinkedIn profile in seconds and never lose work with continuous auto-save and multi-version history.",
    color: "text-blue-600 bg-blue-600/10",
  },
  {
    icon: Sparkles,
    title: "Custom Branding Removal",
    description:
      "Remove all ResumePro AI footers across PDF, DOCX, and public share links on Pro and Premium plans.",
    color: "text-purple-500 bg-purple-500/10",
  },
  {
    icon: Lock,
    title: "Supabase Auth & Private Vault",
    description:
      "Sign in securely with Email, Google, or LinkedIn and manage all resume versions, ATS audits, and match reports.",
    color: "text-rose-500 bg-rose-500/10",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Everything Built for Interviews
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Engineered to Pass Both Bots and Hiring Managers
          </h2>
          <p className="text-muted-foreground">
            Every feature inside ResumePro AI solves a real bottleneck in modern automated recruiting pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card
                key={feat.title}
                className="group hover:border-primary/40 hover:shadow-md transition-all"
              >
                <CardHeader className="pb-3">
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${feat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
