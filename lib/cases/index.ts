import { Contradiction, IdeaItem } from "@/lib/prompts";

export interface CaseConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  tag: string;
  tagColor: string;
  sampleTheme: string;
  sampleTranscript: string;
  mockContradictions: Contradiction[];
  mockIdeasByHmw: Record<string, IdeaItem[]>;
}

export { TRAFFIC_MOCK_CONTRADICTIONS, TRAFFIC_MOCK_IDEAS_BY_HMW, TRAFFIC_SAMPLE_THEME, TRAFFIC_SAMPLE_TRANSCRIPT } from "./traffic";
export { INSURANCE_MOCK_CONTRADICTIONS, INSURANCE_MOCK_IDEAS_BY_HMW, INSURANCE_SAMPLE_THEME, INSURANCE_SAMPLE_TRANSCRIPT } from "./insurance";

import {
  TRAFFIC_MOCK_CONTRADICTIONS,
  TRAFFIC_MOCK_IDEAS_BY_HMW,
  TRAFFIC_SAMPLE_THEME,
  TRAFFIC_SAMPLE_TRANSCRIPT,
} from "./traffic";
import {
  INSURANCE_MOCK_CONTRADICTIONS,
  INSURANCE_MOCK_IDEAS_BY_HMW,
  INSURANCE_SAMPLE_THEME,
  INSURANCE_SAMPLE_TRANSCRIPT,
} from "./insurance";

export const CASES: CaseConfig[] = [
  {
    id: "traffic",
    title: "交通事故インタビュー",
    shortTitle: "交通事故",
    description: "事故体験者へのインタビューをもとに、「わかっているのになぜ事故は起きるのか」を探る。",
    tag: "モビリティ",
    tagColor: "bg-amber-900/40 text-amber-400",
    sampleTheme: TRAFFIC_SAMPLE_THEME,
    sampleTranscript: TRAFFIC_SAMPLE_TRANSCRIPT,
    mockContradictions: TRAFFIC_MOCK_CONTRADICTIONS,
    mockIdeasByHmw: TRAFFIC_MOCK_IDEAS_BY_HMW,
  },
  {
    id: "insurance",
    title: "ダイレクト損保 契約体験",
    shortTitle: "ダイレクト損保",
    description: "ダイレクト損保の契約からアフターサポートまでの体験を調査し、あるべき保険体験をリデザインする。",
    tag: "インシュアテック",
    tagColor: "bg-blue-900/40 text-blue-400",
    sampleTheme: INSURANCE_SAMPLE_THEME,
    sampleTranscript: INSURANCE_SAMPLE_TRANSCRIPT,
    mockContradictions: INSURANCE_MOCK_CONTRADICTIONS,
    mockIdeasByHmw: INSURANCE_MOCK_IDEAS_BY_HMW,
  },
];

export function getCaseById(id: string): CaseConfig | undefined {
  return CASES.find((c) => c.id === id);
}
