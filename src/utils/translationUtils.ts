import type { CompletedTranslation, SessionStats, Difficulty, ImprovementResult } from '../types/index.ts';

// 텍스트 유사도 계산 (개선된 버전)
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  if (text1 === text2) return 1;
  
  // 중국어와 한국어, 영어 모두 포함하여 단어 분리
  const words1 = text1.trim()
    .replace(/[\s()（）【】\[\].,。，？！?!]/g, ' ')  // 구두점을 공백으로
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  const words2 = text2.trim()
    .replace(/[\s()（）【】\[\].,。，？！?!]/g, ' ')  // 구두점을 공백으로
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// 점수 계산
export function calculateScore(userText: string, correctText: string, difficulty: string): number {
  const similarity = calculateSimilarity(userText, correctText);
  let baseScore = 10;
  if (difficulty === '상') baseScore = 20;
  else if (difficulty === '중') baseScore = 15;
  if (similarity >= 0.9) return baseScore + 10;
  if (similarity >= 0.7) return baseScore;
  if (similarity >= 0.5) return Math.floor(baseScore * 0.7);
  return 0;
}

// 최고 연속 정답 계산
export function calculateBestStreak(completed: CompletedTranslation[]): number {
  let best = 0, current = 0;
  for (const t of completed) {
    // 평균 점수가 70점 이상이면 연속으로 카운트
    if (((t.koToZhScore + t.zhToKoScore) / 2) >= 70) current++;
    else current = 0;
    if (current > best) best = current;
  }
  return best;
}

// 세션 통계 계산
export function calculateSessionStats(completedTranslations: CompletedTranslation[]): SessionStats {
  if (completedTranslations.length === 0) {
    return {
      totalProblems: 0,
      totalScore: 0,
      averageScore: 0,
      bestStreak: 0,
      timeSpent: 0,
      accuracyRate: 0,
      difficultyStats: { 상: { attempted: 0, average: 0 }, 중: { attempted: 0, average: 0 }, 하: { attempted: 0, average: 0 } },
      weakWords: [],
      strongFields: []
    };
  }
  
  const totalScore = completedTranslations.reduce((sum, t) => sum + t.koToZhScore + t.zhToKoScore, 0);
  const averageScore = totalScore / (completedTranslations.length * 2);
  const timeSpent = completedTranslations.reduce((sum, t) => sum + t.timeSpent, 0);
  
  // 정확도 계산: 각 번역별로 평균 70점 이상이면 정답으로 인정
  const goodScores = completedTranslations.filter(t => ((t.koToZhScore + t.zhToKoScore) / 2) >= 70).length;
  const accuracyRate = goodScores / completedTranslations.length;
  
  const difficultyStats = { 상: { attempted: 0, average: 0 }, 중: { attempted: 0, average: 0 }, 하: { attempted: 0, average: 0 } };
  ['상', '중', '하'].forEach(difficulty => {
    const filtered = completedTranslations.filter(t => t.difficulty === difficulty);
    if (filtered.length > 0) {
      difficultyStats[difficulty as Difficulty].attempted = filtered.length;
      difficultyStats[difficulty as Difficulty].average = filtered.reduce((sum, t) => sum + (t.koToZhScore + t.zhToKoScore) / 2, 0) / filtered.length;
    }
  });
  
  const weakTranslations = completedTranslations.filter(t => t.koToZhScore < 70 || t.zhToKoScore < 70);
  const weakWords = [...new Set(
    weakTranslations.flatMap(t => [
      ...(t.userKoToZh.match(/[\u4e00-\u9fff]+/g) || []),
      ...(t.userZhToKo.match(/[가-힣]+/g) || [])
    ])
  )].slice(0, 10);
  
  const strongTranslations = completedTranslations.filter(t => t.koToZhScore >= 80 && t.zhToKoScore >= 80);
  const strongFields = [...new Set(strongTranslations.map(t => t.field))];
  
  return {
    totalProblems: completedTranslations.length,
    totalScore,
    averageScore,
    bestStreak: calculateBestStreak(completedTranslations),
    timeSpent,
    accuracyRate,
    difficultyStats,
    weakWords,
    strongFields
  };
}

// 개선 분석
export function analyzeImprovement(original: string, improved: string, correct: string): ImprovementResult {
  const originalScore = calculateSimilarity(original, correct);
  const improvedScore = calculateSimilarity(improved, correct);
  const improvement = improvedScore - originalScore;
  
  return {
    originalScore: Math.round(originalScore * 100),
    improvedScore: Math.round(improvedScore * 100),
    improvement: Math.round(improvement * 100),
    hasImproved: improvement > 0.1,
    message: improvement > 0.2 ? "🎉 크게 개선되었습니다!" :
             improvement > 0.1 ? "👍 조금 개선되었네요!" :
             improvement > -0.1 ? "🤔 비슷한 수준이에요" :
             "😅 다시 한번 시도해보세요"
  };
}

// Helper for type-safe access
export const getDifficultyStats = (
  stats: Record<Difficulty, { attempted: number; average: number }>,
  difficulty: Difficulty
) => stats[difficulty];

// Helper for type guard
export function isDifficultyKey(key: string): key is Difficulty {
  return key === '상' || key === '중' || key === '하';
}
