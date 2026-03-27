"use client";

import { useState } from "react";
import { IdeaItem } from "@/lib/prompts";

interface Props {
  hmwQuestion: string;
  insightCandidate: string;
  contradictionType: string;
  theme?: string;
  caseId?: string;
  onClose: () => void;
  onSave?: (ideas: IdeaItem[]) => void;
}

type IdeaStatus = "idle" | "loading" | "done" | "error";

export default function IdeationPanel({
  hmwQuestion,
  insightCandidate,
  contradictionType,
  theme,
  caseId,
  onClose,
  onSave,
}: Props) {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [ideaStatus, setIdeaStatus] = useState<IdeaStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [selectedIdeas, setSelectedIdeas] = useState<Set<number>>(new Set());

  const generateIdeas = async () => {
    setIdeaStatus("loading");
    setIdeas([]);
    setErrorMsg("");

    try {
      const res = await fetch("/api/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hmwQuestion, insightCandidate, theme, caseId }),
      });

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        if (!reader) throw new Error("読み込み失敗");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const json = JSON.parse(line.slice(6));
              if (json.error) { setErrorMsg(json.error); setIdeaStatus("error"); return; }
              if (json.ideas) { setIdeas(json.ideas); setIdeaStatus("done"); }
            }
          }
        }
      } else {
        const json = await res.json();
        if (json.error) { setErrorMsg(json.error); setIdeaStatus("error"); return; }
        if (json.ideas) { setIdeas(json.ideas); setIdeaStatus("done"); }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "エラーが発生しました");
      setIdeaStatus("error");
    }
  };

  const toggleSelect = (i: number) => {
    setSelectedIdeas((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                Ideation — {contradictionType}
              </p>
              <h2 className="text-white text-lg font-bold leading-snug max-w-xl">
                {hmwQuestion}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition shrink-0 ml-4 mt-1"
            >
              ✕ 閉じる
            </button>
          </div>

          {/* Insight context */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              もとのインサイト
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">{insightCandidate}</p>
          </div>

          {/* Generate button */}
          {ideaStatus === "idle" || ideaStatus === "error" ? (
            <button
              onClick={generateIdeas}
              className="w-full py-4 rounded-2xl font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 transition"
            >
              ✦ AIでアイデアの種を生成する
            </button>
          ) : ideaStatus === "loading" ? (
            <div className="w-full py-4 rounded-2xl bg-white/10 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="inline-block w-4 h-4 border-2 border-gray-500 border-t-gray-200 rounded-full animate-spin" />
              アイデアを考えています...
            </div>
          ) : null}

          {ideaStatus === "error" && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          {/* AI ideas */}
          {ideas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  💡 AIが出したアイデアの種
                </p>
                <button
                  onClick={generateIdeas}
                  className="text-xs text-gray-500 hover:text-white transition border border-white/10 px-3 py-1 rounded-lg"
                >
                  再生成
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ideas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`text-left rounded-2xl p-4 border transition-all ${
                      selectedIdeas.has(i)
                        ? "bg-white text-gray-900 border-white"
                        : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <p className={`text-xs font-bold mb-1 ${selectedIdeas.has(i) ? "text-gray-500" : "text-gray-400"}`}>
                      {selectedIdeas.has(i) ? "✓ 選択中" : `#${i + 1}`}
                    </p>
                    <p className="text-sm font-semibold leading-tight mb-1">{idea.title}</p>
                    <p className={`text-xs leading-relaxed ${selectedIdeas.has(i) ? "text-gray-600" : "text-gray-400"}`}>
                      {idea.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User notes */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              📝 自分のアイデア・メモ
            </p>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="自由にアイデアを書き出してみてください。AIの案を参考にしても、全然別の発想でも。"
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 leading-relaxed"
            />
          </div>

          {/* Save to export */}
          {selectedIdeas.size > 0 && onSave && (
            <button
              onClick={() => {
                const selected = ideas.filter((_, i) => selectedIdeas.has(i));
                onSave(selected);
              }}
              className="w-full py-4 rounded-2xl font-semibold text-sm bg-white text-gray-900 hover:bg-gray-100 transition"
            >
              ✓ {selectedIdeas.size}件 をクライアントまとめに追加 →
            </button>
          )}

          {/* Bottom close */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm text-gray-500 hover:text-white border border-white/10 hover:border-white/20 transition"
          >
            ← インサイト一覧に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
