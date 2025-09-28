import React, { useState, useEffect } from 'react';
import type { DetailedAnalysisItem } from '../types/index.ts';
import RadarChart from './RadarChart';

interface TranslationComparisonProps {
  userTranslation: string;
  referenceTranslation: string;
  detailedAnalysis: DetailedAnalysisItem[];
  score?: number;
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
  // 라벨 커스터마이징
  referenceLabel?: string;
}

const TranslationComparison: React.FC<TranslationComparisonProps> = ({
  userTranslation,
  referenceTranslation,
  detailedAnalysis,
  score,
  완전성,
  가독성,
  정확성,
  스타일,
  완전성피드백,
  가독성피드백,
  정확성피드백,
  스타일피드백,
  referenceLabel = '📖 참고번역'
}) => {
  const [highlightedTerm, setHighlightedTerm] = useState<string>('');

  // 클릭 이벤트 핸들러
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('highlightable-text')) {
        const highlightTerm = target.getAttribute('data-highlight');
        if (highlightTerm) {
          setHighlightedTerm(highlightTerm);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  const getAnalysisColor = (type: string) => {
    switch (type) {
      case 'correct':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'incorrect':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor_improvement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'style_mismatch':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'correct':
        return '✅';
      case 'incorrect':
        return '❌';
      case 'missing':
        return '⚠️';
      case 'minor_improvement':
        return '💡';
      case 'style_mismatch':
        return '🎭';
      default:
        return '📝';
    }
  };

  // 피드백 텍스트에서 작은따옴표로 둘러싸인 부분을 찾아서 하이라이트 가능한 텍스트로 변환
  const renderHighlightableText = (text: string, targetText: string) => {
    const quotedParts = text.match(/'([^']+)'/g);
    if (!quotedParts) return text;

    let result = text;
    quotedParts.forEach((quoted, index) => {
      const content = quoted.slice(1, -1); // 작은따옴표 제거
      const isInTarget = targetText.includes(content);
      
      if (isInTarget) {
        result = result.replace(quoted, 
          `<span class="highlightable-text bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300 transition-colors font-bold" 
                   data-highlight="${content}" 
                   title="클릭하면 원문/번역문에서 하이라이트">${quoted}</span>`
        );
      }
    });
    
    return result;
  };

  // 하이라이트 함수
  const highlightText = (text: string, highlightTerm: string) => {
    if (!highlightTerm) return text;
    const regex = new RegExp(`(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300 px-1 rounded font-bold">$1</mark>');
  };

  // 레이더 차트 데이터 준비
  const radarData = {
    완전성: 완전성 || 0,
    가독성: 가독성 || 0,
    정확성: 정확성 || 0,
    스타일: 스타일 || 0
  };

  return (
    <div className="space-y-6">
      {/* 점수 표시 */}
      {score && (
        <div className="text-center">
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {score}점
          </div>
          <div className="text-lg text-gray-600">
            {score >= 90 ? '완벽해요! 🎉' : 
             score >= 80 ? '잘했어요! 👍' : 
             score >= 70 ? '좋아요! 😊' : 
             '더 연습해보세요! 💪'}
          </div>
        </div>
      )}

      {/* 레이더 차트 */}
      {(완전성 || 가독성 || 정확성 || 스타일) && (
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <h3 className="text-4xl font-bold text-gray-800 mb-6 text-center">📊 평가 결과</h3>
          <div className="flex justify-center w-full">
            <div className="w-full max-w-7xl">
              <RadarChart data={radarData} size={350} />
            </div>
          </div>
        </div>
      )}

      {/* 4개 평가 기준 상세 피드백 */}
      {(완전성피드백 || 가독성피드백 || 정확성피드백 || 스타일피드백) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">📋 상세 평가</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {완전성피드백 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <span className="font-bold text-blue-800 text-xl">완전성 ({완전성}/5)</span>
                </div>
                <p 
                  className="text-lg text-gray-700" 
                  dangerouslySetInnerHTML={{ 
                    __html: renderHighlightableText(완전성피드백 || '', userTranslation + ' ' + referenceTranslation)
                  }}
                />
              </div>
            )}
            {가독성피드백 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📖</span>
                  <span className="font-bold text-green-800 text-xl">가독성 ({가독성}/5)</span>
                </div>
                <p 
                  className="text-lg text-gray-700" 
                  dangerouslySetInnerHTML={{ 
                    __html: renderHighlightableText(가독성피드백 || '', userTranslation + ' ' + referenceTranslation)
                  }}
                />
              </div>
            )}
            {정확성피드백 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎯</span>
                  <span className="font-bold text-red-800 text-xl">정확성 ({정확성}/5)</span>
                </div>
                <p 
                  className="text-lg text-gray-700" 
                  dangerouslySetInnerHTML={{ 
                    __html: renderHighlightableText(정확성피드백 || '', userTranslation + ' ' + referenceTranslation)
                  }}
                />
              </div>
            )}
            {스타일피드백 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎭</span>
                  <span className="font-bold text-purple-800 text-xl">스타일 ({스타일}/5)</span>
                </div>
                <p 
                  className="text-lg text-gray-700" 
                  dangerouslySetInnerHTML={{ 
                    __html: renderHighlightableText(스타일피드백 || '', userTranslation + ' ' + referenceTranslation)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하이라이트 초기화 버튼 */}
      {highlightedTerm && (
        <div className="text-center mb-4">
          <button
            onClick={() => setHighlightedTerm('')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-lg font-medium transition-colors"
          >
            하이라이트 초기화
          </button>
        </div>
      )}

      {/* 번역 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 내 번역 */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-blue-800 mb-3">🇨🇳 내 번역</h3>
          <div 
            className="text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: highlightText(userTranslation, highlightedTerm)
            }}
          />
        </div>

        {/* 참고번역/원문 */}
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="text-2xl font-bold text-green-800 mb-3">{referenceLabel}</h3>
          <div 
            className="text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: highlightText(referenceTranslation, highlightedTerm)
            }}
          />
        </div>
      </div>

      {/* 상세 분석 */}
      {detailedAnalysis && detailedAnalysis.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-3xl font-bold text-gray-800 mb-4">📊 상세 분석</h3>
          <div className="space-y-3">
            {(() => {
              // 피드백 항목들을 논리적인 순서로 정렬
              const sortedAnalysis = [...detailedAnalysis].sort((a, b) => {
                const typeOrder = {
                  'correct': 1,
                  'incorrect': 2,
                  'missing': 2,
                  'minor_improvement': 3,
                  'style_mismatch': 4
                };
                return (typeOrder[a.type as keyof typeof typeOrder] || 5) - (typeOrder[b.type as keyof typeof typeOrder] || 5);
              });

              return sortedAnalysis.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getAnalysisColor(item.type)}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getAnalysisIcon(item.type)}</span>
                    <div className="flex-1">
                     <div className="font-semibold mb-1 text-xl">
                       {item.type === 'correct' && '정확한 부분'}
                       {item.type === 'incorrect' && '개선이 필요한 부분'}
                       {item.type === 'missing' && '누락된 부분'}
                       {item.type === 'minor_improvement' && '개선 제안'}
                       {item.type === 'style_mismatch' && '문체 불일치'}
                     </div>
                    <div className="text-lg mb-2">
                        <span 
                          className="font-bold highlightable-text bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300 transition-colors" 
                          data-highlight={item.text}
                          title="클릭하면 원문/번역문에서 하이라이트"
                        >
                          "{item.text}"
                        </span>
                        {item.suggestion && (
                          <span className="ml-2 text-green-600">
                            → <span 
                              className="highlightable-text bg-green-200 px-1 rounded cursor-pointer hover:bg-green-300 transition-colors font-bold" 
                              data-highlight={item.suggestion}
                              title="클릭하면 원문/번역문에서 하이라이트"
                            >
                              "{item.suggestion}"
                            </span> 권장
                          </span>
                        )}
                      </div>
                      {item.comment && item.comment !== '정확한 번역' && (
                      <div className="text-lg opacity-80">
                        {item.comment}
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

    </div>
  );
};

export default TranslationComparison;
