"use client";

import Link from "next/link";
import { FileCheck2, Lock, ShieldCheck, Sparkles } from "lucide-react";

export function Footer() {
  const openCookieSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-cookie-settings"));
    }
  };

  return (
    <footer className="no-print border-t bg-card/50">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-heading font-bold text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-teal text-white">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <span>
                ResumePro <span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Modern ATS-friendly resume maker built with privacy-by-design. You retain 100% ownership of all uploaded resume data.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-teal" />
                DPDP Act 2023 &amp; GDPR Aligned
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Encrypted Storage
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                22+ Structured Templates
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/builder" className="hover:text-foreground transition-colors">Resume Builder</Link></li>
              <li><Link href="/templates" className="hover:text-foreground transition-colors">ATS Templates</Link></li>
              <li><Link href="/ats-checker" className="hover:text-foreground transition-colors">ATS Score Checker</Link></li>
              <li><Link href="/features" className="hover:text-foreground transition-colors">AI Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">Workspace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">User Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-foreground transition-colors">Admin Panel</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Login / Register</Link></li>
              <li><Link href="/blog" className="hover:text-foreground transition-colors">Career &amp; ATS Blog</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold">Privacy &amp; Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/data-request" className="hover:text-foreground transition-colors">Data Deletion &amp; Export</Link></li>
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t space-y-3 text-xs text-muted-foreground">
          <p className="leading-relaxed">
            <strong>Disclaimer:</strong> ATS scores and AI-generated suggestions are assistive estimates only. ResumePro AI makes no guarantee of job placement, interview callbacks, or passing any third-party ATS. Users own all uploaded resume data.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} ResumePro AI. Built with Next.js 15, Tailwind CSS &amp; Supabase.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/data-request" className="hover:text-foreground">Data Rights</Link>
              <Link href="/sitemap.xml" className="hover:text-foreground">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
