import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const MOCK_QUESTIONS = [
  "どうすれば「わかっているのに」という認知と行動のズレを縮められるか？",
  "緊張や油断が生まれる「瞬間」を本人が自覚できるようにするために何ができるか？",
  "事故が起きやすい状況を、事前に察知して回避する仕組みをどう作れるか？",
];

export async function POST(req: NextRequest) {
  const { insightCandidate, contradictionType, existingHmw, theme } = await req.json();

  if (!insightCandidate) {
    return Response.json({ error: "インサイト候補を指定してください" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (process.env.MOCK_MODE === "true" || !apiKey || apiKey === "your_api_key_here") {
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ questions: MOCK_QUESTIONS });
  }

  const client = new Anthropic({ apiKey });
  const themeSection = theme?.trim() ? `\n## リサーチテーマ\n${theme}\n` : "";
  const existingSection =
    existingHmw?.length > 0
      ? `\n## 既存のHMW（これとは異なる視点で）\n${existingHmw.map((q: string) => `- ${q}`).join("\n")}\n`
      : "";

  const prompt = `あなたはデザインシンキングのファシリテーターです。
${themeSection}
## 矛盾のタイプ
${contradictionType}

## インサイト候補
${insightCandidate}
${existingSection}
---

上記のインサイトに対して、既存のHMWとは異なる視点・切り口から「How Might We」を2〜3個生成してください。

ルール:
- 「どうすれば〜できるか？」または「〜ために何ができるか？」の形式
- 既存のHMWと重複しない新しい切り口
- 広すぎず・狭すぎない「ちょうどいいスコープ」

JSONのみ出力してください（説明文不要）：
["問い1", "問い2", "問い3"]`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 512,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    let jsonText = "";
    for (const block of response.content) {
      if (block.type === "text") jsonText += block.text;
    }

    const cleaned = jsonText
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    const questions = JSON.parse(cleaned);

    return Response.json({ questions });
  } catch {
    return Response.json({ error: "HMWの生成に失敗しました" }, { status: 500 });
  }
}
