import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeATS, matchResumeToJobDescription } from "@/lib/ats-engine";
import type { ResumeData } from "@/types/resume";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      resume: ResumeData;
      jobDescription?: string;
      jobTitle?: string;
      company?: string;
    };

    if (!body?.resume) {
      return NextResponse.json(
        { error: "Missing resume payload" },
        { status: 400 }
      );
    }

    const analysis = analyzeResumeATS(body.resume);
    const jobMatch =
      body.jobDescription && body.jobDescription.trim().length > 15
        ? matchResumeToJobDescription(
            body.resume,
            body.jobDescription,
            body.jobTitle,
            body.company
          )
        : null;

    return NextResponse.json({
      analysis,
      jobMatch,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to analyze resume" },
      { status: 400 }
    );
  }
}
