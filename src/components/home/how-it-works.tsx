import { Check, FileUp, LayoutTemplate, Sparkles, Target } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: FileUp,
    title: "Start Fresh or Import LinkedIn",
    description:
      "Enter your details step-by-step or paste your LinkedIn profile to populate Experience, Education, and Skills instantly.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Enhance with AI & Reorder Sections",
    description:
      "Generate quantified work bullets and summaries with AI, then drag-and-drop sections to match your career stage.",
  },
  {
    step: "03",
    icon: Target,
    title: "Score & Match Job Descriptions",
    description:
      "Run the ATS Engine (0–100) and paste a target job description to close missing keyword and skill gaps.",
  },
  {
    step: "04",
    icon: LayoutTemplate,
    title: "Switch Templates & Export",
    description:
      "Preview 22+ ATS-safe designs in 1 click and download clean PDF, DOCX, print-ready pages, or a shareable link.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center space-y-3 mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/20 px-3 py-1 text-xs font-semibold text-brand-teal">
            <Check className="h-3.5 w-3.5" /> 4-Step Workflow
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white">
            From Blank Page to 95+ ATS Score in Under 10 Minutes
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            No formatting headaches, no broken columns—just clean, measurable career storytelling.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-heading text-2xl font-bold text-white/25">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
