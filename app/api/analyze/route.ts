import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  Contradiction,
} from "@/lib/prompts";
import { getCaseById } from "@/lib/cases";
import { TRAFFIC_MOCK_CONTRADICTIONS } from "@/lib/cases/traffic";

export async function POST(req: NextRequest) {
  const { transcript, theme, caseId } = await req.json();

  if (!transcript || transcript.trim().length === 0) {
    return NextResponse.json(
      { error: "テキストを入力してください" },
      { status: 400 }
    );
  }

  // モックモード: MOCK_MODE=true または APIキー未設定の場合
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (process.env.MOCK_MODE === "true" || !apiKey || apiKey === "your_api_key_here") {
    const caseConfig = caseId ? getCaseById(caseId) : undefined;
    const mockContradictions: Contradiction[] = caseConfig?.mockContradictions ?? TRAFFIC_MOCK_CONTRADICTIONS;

    const mockStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        await new Promise((r) => setTimeout(r, 1500));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ contradictions: mockContradictions })}\n\n`)
        );
        controller.close();
      },
    });
    return new Response(mockStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const response = await client.messages.create({
          model: "claude-opus-4-6",
          max_tokens: 4096,
          thinking: { type: "adaptive" },
          system: ANALYSIS_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: buildAnalysisPrompt(transcript, theme),
            },
          ],
        });

        let jsonText = "";
        for (const block of response.content) {
          if (block.type === "text") {
            jsonText += block.text;
          }
        }

        let contradictions: Contradiction[] = [];
        try {
          const cleaned = jsonText
            .replace(/^```(?:json)?\n?/m, "")
            .replace(/\n?```$/m, "")
            .trim();
          contradictions = JSON.parse(cleaned);
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "AIの応答を解析できませんでした" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ contradictions })}\n\n`)
        );
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "不明なエラーが発生しました";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
