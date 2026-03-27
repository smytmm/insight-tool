"use client";

import { useRouter } from "next/navigation";
import { CASES } from "@/lib/cases";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <h1 className="text-base font-semibold tracking-tight">Insight Discovery</h1>
        <p className="text-xs text-gray-500 mt-0.5">矛盾からインサイトを見つける</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Heading */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">案件を選ぶ</p>
          <h2 className="text-2xl font-bold tracking-tight">どの案件を分析しますか？</h2>
          <p className="text-sm text-gray-400">
            案件ごとにサンプルデータとモックが用意されています。
          </p>
        </div>

        {/* Case cards */}
        <div className="grid grid-cols-1 gap-4">
          {CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/cases/${c.id}`)}
              className="group text-left bg-gray-900 border border-white/10 rounded-2xl p-6 hover:border-white/25 hover:bg-gray-800/60 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${c.tagColor}`}>
                      {c.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-white transition">
                    {c.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{c.description}</p>
                  <p className="text-xs text-gray-600 italic mt-1">
                    テーマ: {c.sampleTheme}
                  </p>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition mt-1">
                  <span className="text-gray-400 group-hover:text-white text-sm transition">→</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <div className="bg-gray-900/50 border border-white/5 rounded-2xl p-5">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-400">新しい案件を追加するには？</strong>
            <br />
            <code className="text-gray-400 bg-gray-800 px-1 rounded">lib/cases/</code> にケース定義ファイルを追加し、
            <code className="text-gray-400 bg-gray-800 px-1 rounded">lib/cases/index.ts</code> の <code className="text-gray-400 bg-gray-800 px-1 rounded">CASES</code> 配列に登録してください。
          </p>
        </div>
      </div>
    </main>
  );
}
