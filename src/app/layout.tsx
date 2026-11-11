import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/compliance/cookie-consent-banner";

export const metadata: Metadata = {
  title: {
    default: "ResumePro AI — ATS-Friendly Resume Maker & Job Match Engine",
    template: "%s | ResumePro AI",
  },
  description:
    "Create ATS-optimized resumes in minutes with ResumePro AI. Real-time ATS score out of 100, AI bullet writer, 22+ ATS-safe templates, Job Description matching, PDF & DOCX export.",
  keywords: [
    "ATS resume builder",
    "AI resume maker",
    "ATS score checker",
    "job description matcher",
    "ATS-friendly resume templates",
    "ResumePro AI",
  ],
  openGraph: {
    title: "ResumePro AI — Beat ATS Filters & Land More Interviews",
    description:
      "Build, score, and tailor ATS-friendly resumes with AI-powered optimization and 22+ recruiter-verified templates.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
