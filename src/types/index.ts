// 단계 상수
export const STEPS = {
  START: 'start',
  KO_TO_ZH: 'ko-to-zh',
  KO_ZH_RESULT: 'ko-zh-result',
  KO_ZH_IMPROVE: 'ko-zh-improve',
  ZH_TO_KO: 'zh-to-ko',
  ZH_KO_RESULT: 'zh-ko-result',
  ZH_KO_IMPROVE: 'zh-ko-improve',
  FINAL_RESULT: 'final-result',
} as const;

export type StepType = typeof STEPS[keyof typeof STEPS];

// 문제 인터페이스
export interface Problem {
  id: string;
  korean: string;
  chinese: string;
  ChatGPT_번역?: string;
  difficulty: string;
  field: string;
}

// 완료된 번역 인터페이스
export interface CompletedTranslation {
  id: string;
  originalKorean: string;
  correctChinese: string;
  userKoToZh: string;
  userZhToKo: string;
  koToZhScore: number;
  zhToKoScore: number;
  difficulty: string;
  field: string;
  completedAt: Date;
  timeSpent: number;
}

// 세션 통계 인터페이스
export interface SessionStats {
  totalProblems: number;
  totalScore: number;
  averageScore: number;
  bestStreak: number;
  timeSpent: number;
  accuracyRate: number;
  difficultyStats: Record<'상'|'중'|'하', { attempted: number; average: number }>;
  weakWords: string[];
  strongFields: string[];
}

// 상세 분석 항목 인터페이스
export interface DetailedAnalysisItem {
  type: 'correct' | 'incorrect' | 'missing' | 'minor_improvement' | 'style_mismatch';
  text: string;
  suggestion?: string;
  comment: string;
}

// AI 피드백 인터페이스
export interface AIFeedback {
  error: string;
  improvement: string;
  hint: string;
  score?: number;
  detailedAnalysis?: DetailedAnalysisItem[];
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  // 4개 평가 기준
  완전성?: number;
  가독성?: number;
  정확성?: number;
  스타일?: number;
  // 각 기준별 상세 피드백
  완전성피드백?: string;
  가독성피드백?: string;
  정확성피드백?: string;
  스타일피드백?: string;
}

// 개선 분석 결과 인터페이스
export interface ImprovementResult {
  originalScore: number;
  improvedScore: number;
  improvement: number;
  hasImproved: boolean;
  message: string;
}

// 난이도 타입
export type Difficulty = '상' | '중' | '하';

// 번역 방향 타입
export type TranslationDirection = 'ko-to-zh' | 'zh-to-ko';
