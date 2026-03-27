"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ContradictionCard from "@/components/ContradictionCard";
import ExportView from "@/components/ExportView";
import IdeationPanel from "@/components/IdeationPanel";
import { Contradiction, IdeaItem } from "@/lib/prompts";
import { getCaseById } from "@/lib/cases";

type Status = "idle" | "loading" | "done" | "error";
type VoiceStatus = "idle" | "listening";

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = typeof params.caseId === "string" ? params.caseId : "";
  const caseConfig = getCaseById(caseId);

  const [theme, setTheme] = useState("");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [selectedHmw, setSelectedHmw] = useState<{
    question: string;
    insightCandidate: string;
    contradictionType: string;
  } | null>(null);
  const [savedIdeations, setSavedIdeations] = useState<Record<string, IdeaItem[]>>({});

  if (!caseConfig) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-sm">案件が見つかりませんでした</p>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-white border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition"
          >
            ← 案件一覧へ戻る
          </button>
        </div>
      </main>
    );
  }

  const startVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("このブラウザは音声入力に対応していません。Chrome をお使いください。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setVoiceStatus("listening");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTheme((prev: string) => (prev ? prev + " " + result : result));
    };
    recognition.onend = () => setVoiceStatus("idle");
    recognition.onerror = () => setVoiceStatus("idle");

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setVoiceStatus("idle");
  };

  const analyze = async () => {
    if (!transcript.trim()) return;
    setStatus("loading");
    setContradictions([]);
    setErrorMsg("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, theme, caseId }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("レスポンスの読み込みに失敗しました");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = JSON.parse(line.slice(6));
            if (json.error) {
              setErrorMsg(json.error);
              setStatus("error");
            } else if (json.contradictions) {
              setContradictions(json.contradictions);
              setStatus("done");
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "エラーが発生しました");
      setStatus("error");
    }
  };

  const loadSample = () => {
    setTheme(caseConfig.sampleTheme);
    setTranscript(caseConfig.sampleTranscript);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {showExport && contradictions.length > 0 && (
        <ExportView
          contradictions={contradictions}
          theme={theme}
          savedIdeations={savedIdeations}
          onClose={() => setShowExport(false)}
        />
      )}

      {selectedHmw && (
        <IdeationPanel
          hmwQuestion={selectedHmw.question}
          insightCandidate={selectedHmw.insightCandidate}
          contradictionType={selectedHmw.contradictionType}
          theme={theme}
          caseId={caseId}
          onClose={() => setSelectedHmw(null)}
          onSave={(ideas) => {
            setSavedIdeations((prev) => ({ ...prev, [selectedHmw.question]: ideas }));
            setSelectedHmw(null);
          }}
        />
      )}

      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-white transition text-sm"
          >
            ←
          </button>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              Insight Discovery
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {caseConfig.shortTitle} — 矛盾からインサイトを見つける
            </p>
          </div>
        </div>
        {contradictions.length > 0 && (
          <button
            onClick={() => setShowExport(true)}
            className="text-xs bg-white text-gray-900 px-4 py-1.5 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            クライアント向けに整理 →
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Step 1: Theme */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center">1</span>
                <h2 className="text-base font-semibold">リサーチテーマ・目的</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-7">
                このリサーチは何を明らかにしたいか？テーマを伝えると分析精度が上がります
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 30代会社員の健康行動。なぜ意識が高いのに行動が伴わないのかを探りたい"
              className="w-full bg-gray-900 border border-white/10 rounded-2xl px-5 py-4 pr-14 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              onClick={voiceStatus === "listening" ? stopVoice : startVoice}
              title={voiceStatus === "listening" ? "録音停止" : "音声入力"}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl transition
                ${voiceStatus === "listening"
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
            >
              {voiceStatus === "listening" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <rect x="6" y="6" width="8" height="8" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H10.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>
              )}
            </button>
          </div>
          {voiceStatus === "listening" && (
            <p className="text-xs text-red-400 ml-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              聞き取り中... 話し終わったら自動で停止します
            </p>
          )}
        </section>

        {/* Step 2: Transcript */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center">2</span>
                <h2 className="text-base font-semibold">インタビュー記録を貼り付ける</h2>
              </div>
              <p className="text-sm text-gray-400 mt-1 ml-7">
                インタビューの書き起こし、観察メモ、調査データを入力してください
              </p>
            </div>
            <button
              onClick={loadSample}
              className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition shrink-0"
            >
              サンプルを使う
            </button>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="インタビューの書き起こしや観察メモをここに貼り付けてください..."
            rows={12}
            className="w-full bg-gray-900 border border-white/10 rounded-2xl p-5 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 leading-relaxed"
          />

          <button
            onClick={analyze}
            disabled={!transcript.trim() || status === "loading"}
            className="w-full py-4 rounded-2xl font-semibold text-sm transition-all
              bg-white text-gray-900 hover:bg-gray-100
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                AI が矛盾を探しています...
              </span>
            ) : (
              "矛盾を分析する"
            )}
          </button>
        </section>

        {/* Error */}
        {status === "error" && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-2xl p-5 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Results */}
        {status === "done" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                {contradictions.length === 0
                  ? "矛盾は見つかりませんでした"
                  : `${contradictions.length} 件の矛盾を発見`}
              </h2>
              {contradictions.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  各カードの「インサイト候補」と「How Might We」を起点に、さらに深掘りしてみてください
                </p>
              )}
            </div>

            {contradictions.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                <p>テキストから矛盾のパターンを検出できませんでした。</p>
                <p className="mt-1">より具体的な行動や発言が含まれるデータを試してください。</p>
              </div>
            ) : (
              <div className="space-y-5">
                {contradictions.map((c, i) => (
                  <ContradictionCard
                    key={i}
                    contradiction={c}
                    index={i}
                    theme={theme}
                    caseId={caseId}
                    onSelectHmw={(question) =>
                      setSelectedHmw({
                        question,
                        insightCandidate: c.insight_candidate,
                        contradictionType: c.type,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/5 pt-8">
          <div className="bg-gray-900 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-medium">
                インサイトの定義
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                &ldquo;人間の行動・感情に関する
                <strong className="text-white">非自明な真実</strong>
                であり、言語化された瞬間に明白に感じられ、新しいデザイン機会を生み出すもの&rdquo;
              </p>
              <p className="text-xs text-gray-600 mt-2">— Stanford d.school / IDEO</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-medium">
                How Might We とは
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                インサイトを起点に、解決策を探索するための
                <strong className="text-white">開かれた問い</strong>
                。広すぎず・狭すぎない「ちょうどいいスコープ」で、多様なアイデアを引き出す。
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
