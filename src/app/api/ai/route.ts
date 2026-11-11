import { NextRequest, NextResponse } from "next/server";
import { runBuiltInAI, type AIRequestPayload } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AIRequestPayload;
    if (!body?.action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 }
      );
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey.trim().length > 10) {
      try {
        const prompt = buildPrompt(body);
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert ATS resume writer and executive career coach. Return crisp, high-impact, metric-driven career content.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.6,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            const items = text
              .split(/\r?\n/)
              .map((line: string) => line.replace(/^[-•*\d.)\s]+/, "").trim())
              .filter(Boolean);
            return NextResponse.json({
              result: text,
              items,
              provider: "openai",
            });
          }
        }
      } catch {
        // Fallback gracefully to built-in engine
      }
    }

    const fallback = await runBuiltInAI(body);
    return NextResponse.json({
      ...fallback,
      provider: "builtin",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}

function buildPrompt(payload: AIRequestPayload): string {
  const role = payload.jobTitle || payload.resume?.personalInfo.jobTitle || "Professional";
  const skills = payload.resume?.skills.join(", ") || "";
  switch (payload.action) {
    case "summary":
      return `Write a concise 45-65 word ATS-optimized professional summary for a ${role}. Highlight skills: ${skills}. Return only the paragraph.`;
    case "experience":
      return `Write 4 quantified, action-verb-led resume bullet points for a ${role} at ${payload.company || "a technology company"}. Context: ${payload.experienceContext || "high-impact delivery"}. Return one bullet per line.`;
    case "keywords":
      return `List 10 high-value ATS resume keywords for a ${role}. Return comma-separated terms only.`;
    case "cover_letter":
      return `Write a concise, tailored cover letter for ${payload.resume?.personalInfo.fullName || "the candidate"} applying for ${role} at ${payload.company || "the company"}. Skills: ${skills}.`;
    case "improvements":
      return `Provide 4 specific, actionable ATS resume improvement suggestions for a ${role} with summary: "${payload.resume?.summary || ""}".`;
  }
}
