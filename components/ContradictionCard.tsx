"use client";

import { useState } from "react";
import { Contradiction, ContradictionType, QUOTE_LABELS } from "@/lib/prompts";

const TYPE_CONFIG: Record<
  ContradictionType,
  { color: string; bgColor: string; borderColor: string; icon: string }
> = {
  "言ったこと vs やったこと": {
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    icon: "💬",
  },
  "思っていること vs 感じていること": {
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    icon: "🧠",
  },
  "ニーズ vs 行動": {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "⚡",
  },
  "色眼鏡・固定概念": {
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    icon: "🕶",
  },
  "過去 vs 現在（価値観の変化）": {
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    icon: "⏳",
  },
  "通念 vs 個人の実態": {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: "🌍",
  },
  "語られた理由 vs 隠れた目的（アドラー目的論）": {
    color: "text-fuchsia-700",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200",
    icon: "🎯",
  },
};

const FALLBACK_CONFIG = {
  color: "text-gray-700",
  bgColor: "bg-gray-50",
  borderColor: "border-gray-200",
  icon: "🔍",
};

interface Props {
  contradiction: Contradiction;
  index: number;
  theme?: string;
  caseId?: string;
  onSelectHmw?: (question: string) => void;
}

export default function ContradictionCard({ contradiction, index, theme, caseId, onSelectHmw }: Props) {
  const config = TYPE_CONFIG[contradiction.type] ?? FALLBACK_CONFIG;
  const labels = QUOTE_LABELS[contradiction.type] ?? { a: "A", b: "B" };
  const [extraHmw, setExtraHmw] = useState<string[]>([]);
  const [hmwLoading, setHmwLoading] = useState(false);

  const generateMoreHmw = async () => {
    setHmwLoading(true);
    try {
      const res = await fetch("/api/hmw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insightCandidate: contradiction.insight_candidate,
          contradictionType: contradiction.type,
          existingHmw: [...contradiction.hmw_questions, ...extraHmw],
          theme,
          caseId,
        }),
      });
      const json = await res.json();
      if (json.questions) setExtraHmw((prev) => [...prev, ...json.questions]);
    } finally {
      setHmwLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 space-y-4 shadow-sm`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{config.icon}</span>
        <span className={`text-xs font-semibold tracking-wide ${config.color}`}>
          {contradiction.type}
        </span>
        <span className="ml-auto text-xs text-gray-400">#{index + 1}</span>
      </div>

      {/* Quotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">
            {labels.a}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            &ldquo;{contradiction.quote_a}&rdquo;
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">
            {labels.b}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            &ldquo;{contradiction.quote_b}&rdquo;
          </p>
        </div>
      </div>

      {/* Tension */}
      <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-medium">
          緊張・葛藤
        </p>
        <p className="text-sm text-gray-800 font-medium">{contradiction.tension}</p>
      </div>

      {/* Insight candidate */}
      <div className={`rounded-xl p-4 border ${config.borderColor}`}>
        <p className={`text-[10px] uppercase tracking-widest mb-1 font-bold ${config.color}`}>
          ✦ インサイト候補
        </p>
        <p className="text-sm text-gray-900 leading-relaxed font-medium">
          {contradiction.insight_candidate}
        </p>
      </div>

      {/* HMW questions */}
      {contradiction.hmw_questions && contradiction.hmw_questions.length > 0 && (
        <div className="rounded-xl p-4 bg-gray-900 border border-white/10">
          <p className="text-[10px] uppercase tracking-widest mb-2 font-bold text-gray-400">
            💡 How Might We
          </p>
          <ul className="space-y-2">
            {contradiction.hmw_questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 group">
                <span className="text-gray-500 shrink-0 mt-0.5">›</span>
                <span className="text-sm text-gray-100 leading-relaxed flex-1">{q}</span>
                {onSelectHmw && (
                  <button
                    onClick={() => onSelectHmw(q)}
                    className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-gray-400 hover:bg-white hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
                  >
                    発散する →
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Extra HMW */}
          {extraHmw.length > 0 && (
            <ul className="space-y-2 mt-3 pt-3 border-t border-white/10">
              {extraHmw.map((q, i) => (
                <li key={i} className="flex items-start gap-2 group">
                  <span className="text-indigo-400 shrink-0 mt-0.5 text-xs">✦</span>
                  <span className="text-sm text-gray-200 leading-relaxed flex-1">{q}</span>
                  {onSelectHmw && (
                    <button
                      onClick={() => onSelectHmw(q)}
                      className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-gray-400 hover:bg-white hover:text-gray-900 transition opacity-0 group-hover:opacity-100"
                    >
                      発散する →
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Generate more */}
          <button
            onClick={generateMoreHmw}
            disabled={hmwLoading}
            className="mt-3 w-full text-xs text-gray-500 hover:text-gray-300 border border-white/10 hover:border-white/20 rounded-lg py-1.5 transition disabled:opacity-40"
          >
            {hmwLoading ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="inline-block w-3 h-3 border border-gray-500 border-t-gray-300 rounded-full animate-spin" />
                別の視点を考えています...
              </span>
            ) : (
              "↻ 別のHMWを提案"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
