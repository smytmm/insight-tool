"use client";

import { useState } from "react";
import { Contradiction, IdeaItem } from "@/lib/prompts";

interface Props {
  contradictions: Contradiction[];
  theme?: string;
  savedIdeations?: Record<string, IdeaItem[]>;
  onClose: () => void;
}

const TYPE_EMOJI: Record<string, string> = {
  "言ったこと vs やったこと": "💬",
  "思っていること vs 感じていること": "🧠",
  "ニーズ vs 行動": "⚡",
  "色眼鏡・固定概念": "🕶",
  "過去 vs 現在（価値観の変化）": "⏳",
  "通念 vs 個人の実態": "🌍",
};

export default function ExportView({ contradictions, theme, savedIdeations, onClose }: Props) {
  const handlePrint = () => window.print();

  // Track which insights are excluded (by original index)
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());

  const toggleExclude = (idx: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // Group by type, preserving original index
  const typeGroups = contradictions.reduce<
    Record<string, { c: Contradiction; idx: number }[]>
  >((acc, c, idx) => {
    acc[c.type] = acc[c.type] ?? [];
    acc[c.type].push({ c, idx });
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Controls (non-printable) */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-sm flex items-center gap-1"
            >
              ← 戻る
            </button>
            <button
              onClick={handlePrint}
              className="bg-white text-gray-900 px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition"
            >
              印刷 / PDF保存
            </button>
          </div>

          {/* Report card */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 space-y-10 print:shadow-none print:rounded-none">
            {/* Header */}
            <div className="border-b pb-8">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                Design Research — Insight Report
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                発見されたインサイト
              </h1>
              {theme ? (
                <p className="text-gray-700 text-sm font-medium bg-gray-100 rounded-lg px-3 py-2 mt-2 inline-block">
                  🎯 {theme}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">
                  矛盾から読み解く、潜在的なユーザーインサイト
                </p>
              )}
            </div>

            {/* Insights by type */}
            {Object.entries(typeGroups).map(([type, items]) => {
              const visibleItems = items.filter(({ idx }) => !excludedIndices.has(idx));
              // In print, skip entire section if all excluded
              if (visibleItems.length === 0 && excludedIndices.size > 0) {
                return (
                  <section key={type} className="space-y-3 print:hidden">
                    <h2 className="text-base font-bold text-gray-300 flex items-center gap-2">
                      <span>{TYPE_EMOJI[type]}</span>
                      <span>{type}</span>
                    </h2>
                    {items.map(({ c, idx }) => (
                      <div key={idx} className="border border-gray-100 rounded-2xl px-5 py-3 bg-gray-50 flex items-center justify-between opacity-40">
                        <p className="text-sm text-gray-500 leading-snug truncate flex-1 mr-4">{c.insight_candidate}</p>
                        <button
                          onClick={() => toggleExclude(idx)}
                          className="shrink-0 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-3 py-1 rounded-lg transition"
                        >
                          含める
                        </button>
                      </div>
                    ))}
                  </section>
                );
              }

              return (
                <section key={type} className="space-y-6">
                  <h2 className="text-base font-bold text-gray-700 flex items-center gap-2 print:text-gray-700">
                    <span>{TYPE_EMOJI[type]}</span>
                    <span>{type}</span>
                  </h2>
                  {items.map(({ c, idx }, i) => {
                    const excluded = excludedIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`border border-gray-100 rounded-2xl p-6 space-y-4 bg-gray-50 transition-opacity ${excluded ? "opacity-40 print:hidden" : ""}`}
                      >
                        {/* Insight headline */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="bg-white rounded-xl p-4 border-l-4 border-gray-900 flex-1">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                              Insight #{i + 1}
                            </p>
                            <p className="text-base font-semibold text-gray-900 leading-snug">
                              {c.insight_candidate}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleExclude(idx)}
                            className={`print:hidden shrink-0 text-xs px-3 py-1.5 rounded-lg border transition mt-1 ${
                              excluded
                                ? "text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                                : "text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500"
                            }`}
                          >
                            {excluded ? "含める" : "除外"}
                          </button>
                        </div>

                        {!excluded && (
                          <>
                            {/* Evidence */}
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                              <div className="bg-white rounded-lg p-3 border border-gray-100">
                                <p className="text-[9px] uppercase text-gray-400 mb-1">A</p>
                                <p>&ldquo;{c.quote_a}&rdquo;</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-gray-100">
                                <p className="text-[9px] uppercase text-gray-400 mb-1">B</p>
                                <p>&ldquo;{c.quote_b}&rdquo;</p>
                              </div>
                            </div>

                            {/* Tension */}
                            <p className="text-xs text-gray-500 italic">
                              緊張: {c.tension}
                            </p>

                            {/* HMW */}
                            {c.hmw_questions && c.hmw_questions.length > 0 && (
                              <div className="bg-gray-900 rounded-xl p-4">
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-2 font-bold">
                                  💡 How Might We
                                </p>
                                <ul className="space-y-1.5">
                                  {c.hmw_questions.map((q, qi) => (
                                    <li key={qi} className="text-sm text-white leading-relaxed flex gap-2">
                                      <span className="text-gray-500 shrink-0">›</span>
                                      <span>{q}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Ideation results */}
                            {c.hmw_questions?.some((q) => savedIdeations?.[q]?.length) && (
                              <div className="space-y-3">
                                {c.hmw_questions
                                  .filter((q) => savedIdeations?.[q]?.length)
                                  .map((q, qi) => (
                                    <div key={qi} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                                      <p className="text-[9px] uppercase tracking-widest text-indigo-400 mb-1 font-bold">
                                        ✦ 発散アイデア
                                      </p>
                                      <p className="text-xs text-indigo-700 mb-3 leading-relaxed italic">
                                        › {q}
                                      </p>
                                      <div className="grid grid-cols-2 gap-2">
                                        {savedIdeations![q].map((idea, ii) => (
                                          <div
                                            key={ii}
                                            className="bg-white rounded-lg p-3 border border-indigo-100"
                                          >
                                            <p className="text-xs font-bold text-gray-800 mb-1">{idea.title}</p>
                                            <p className="text-xs text-gray-500 leading-relaxed">{idea.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}

            {/* Footer */}
            <div className="border-t pt-6 text-xs text-gray-400 flex justify-between">
              <span>Generated with Insight Discovery Tool</span>
              <span>{new Date().toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
