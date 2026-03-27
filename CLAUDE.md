# Insight Discovery Tool

デザインリサーチのインタビュー記録から矛盾を発見し、インサイト候補とHow Might Weを生成するツール。
クライアントへの報告書エクスポート機能・アイデア発散機能を含む。

## 技術スタック

- **Next.js 14 App Router** + TypeScript + Tailwind CSS v4
- **Anthropic Claude API** (`claude-opus-4-6`, adaptive thinking) — 分析・発散・HMW生成に使用
- SSE（Server-Sent Events）でストリーミング応答
- `MOCK_MODE=true` でAPIなしのダミーデータ動作

## ディレクトリ構成

```
app/
  page.tsx                  # ケースセレクター（トップページ）
  cases/[caseId]/page.tsx   # 案件別の分析ツール本体
  api/
    analyze/route.ts        # インタビュー → 矛盾・インサイト抽出
    ideate/route.ts         # HMW → アイデア発散
    hmw/route.ts            # 別のHMW候補を生成

components/
  ContradictionCard.tsx     # インサイトカード（HMW・アドラー発散ボタン含む）
  IdeationPanel.tsx         # アイデア発散パネル（チェック選択・保存機能）
  ExportView.tsx            # クライアント向けエクスポートビュー（印刷対応）

lib/
  prompts.ts                # 型定義・プロンプト・分析6+1視点の定義
  cases/
    index.ts                # CaseConfig型 + CASESレジストリ
    traffic.ts              # 交通事故ケースのサンプル・モックデータ
    insurance.ts            # ダイレクト損保ケースのサンプル・モックデータ
```

## インサイト分析の7視点

`lib/prompts.ts` の `buildAnalysisPrompt` に定義。根拠があるものだけ出力、視点の省略可。

| # | 視点 | 見るもの |
|---|------|----------|
| 1 | 言ったこと vs やったこと | 発言と行動のギャップ |
| 2 | 思っていること vs 感じていること | 頭の理解と感情のギャップ |
| 3 | ニーズ vs 行動 | 「〜したい」のに実際はそうしていない |
| 4 | 色眼鏡・固定概念 | 無意識の前提・バイアス |
| 5 | 過去 vs 現在（価値観の変化） | 時間軸での変化 |
| 6 | 通念 vs 個人の実態 | 世間の常識とこの人の体験のズレ（AIが通念を設定してよい） |
| 7 | 語られた理由 vs 隠れた目的（アドラー目的論） | 「できない」を「しない」として読み替え、行動が達成している目的を問う |

**インサイト候補の表現形式（必須）:**
> 「実は〜は、〜という意外なものだったのかもしれない」
> 「〜な人は、実は〜なのかもしれない」

## 案件（ケース）の追加方法

1. `lib/cases/` に `newcase.ts` を作成
   - `NEWCASE_SAMPLE_THEME` — リサーチテーマ文字列
   - `NEWCASE_SAMPLE_TRANSCRIPT` — サンプルインタビュー記録
   - `NEWCASE_MOCK_CONTRADICTIONS: Contradiction[]` — 7視点のモック矛盾（各6〜7件）
   - `NEWCASE_MOCK_IDEAS_BY_HMW: Record<string, IdeaItem[]>` — HMW文字列をキーにしたモックアイデア（各6件）

2. `lib/cases/index.ts` の `CASES` 配列にエントリを追加

```ts
{
  id: "newcase",
  title: "表示タイトル",
  shortTitle: "短いタイトル",
  description: "案件の説明文",
  tag: "タグ名",
  tagColor: "bg-green-900/40 text-green-400",
  sampleTheme: NEWCASE_SAMPLE_THEME,
  sampleTranscript: NEWCASE_SAMPLE_TRANSCRIPT,
  mockContradictions: NEWCASE_MOCK_CONTRADICTIONS,
  mockIdeasByHmw: NEWCASE_MOCK_IDEAS_BY_HMW,
}
```

3. URLは `/cases/newcase` で自動生成される

## 既存ケース

| ID | テーマ |
|----|--------|
| `traffic` | 交通事故はなぜ起こるのか？（事故体験者インタビュー） |
| `insurance` | ダイレクト損保の契約体験から導くあるべき保険体験のリデザイン |

## ContradictionCard の色設定

`components/ContradictionCard.tsx` の `TYPE_CONFIG` で視点ごとに色・アイコンを定義。

| 視点 | 色 | アイコン |
|------|----|---------|
| 言ったこと vs やったこと | rose | 💬 |
| 思っていること vs 感じていること | violet | 🧠 |
| ニーズ vs 行動 | amber | ⚡ |
| 色眼鏡・固定概念 | teal | 🕶 |
| 過去 vs 現在 | sky | ⏳ |
| 通念 vs 個人の実態 | orange | 🌍 |
| アドラー目的論 | fuchsia | 🎯 |

## 環境変数

```
ANTHROPIC_API_KEY=sk-ant-...   # Claude APIキー（MOCK_MODEがtrueなら不要）
MOCK_MODE=true                  # trueにするとAPIを呼ばずモックデータで動作
```

**本番（Vercel）は `MOCK_MODE=true`、APIキーなしで動作する。**

## デプロイ

- GitHub: https://github.com/smytmm/insight-tool
- Vercel: https://insight-tool-mu.vercel.app
- `main` ブランチへのプッシュで自動デプロイ

```bash
# ローカル確認
npm run dev

# 型チェック
npx tsc --noEmit

# デプロイ（Vercelへの再デプロイ）
npx vercel --prod
```

## 注意事項

- `.env.local` は `.gitignore` で除外済み。APIキーをコミットしないこと
- Anthropicクライアントはモック判定後に初期化（APIキーなしでも起動エラーにならない）
- `MOCK_IDEAS_BY_HMW` のキーはHMW問いの文字列と**完全一致**が必要。一致しない場合は `FALLBACK_IDEAS` が返る
- ExportViewはCSSの `print:hidden` クラスで印刷非表示を制御
