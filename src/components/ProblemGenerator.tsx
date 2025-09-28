import React, { useState } from 'react';
import { generateTranslationProblem, generateMultipleProblems } from '../utils/problemGenerator.ts';
import type { Problem } from '../types/index.ts';

interface ProblemGeneratorProps {
  onProblemsGenerated: (problems: Problem[]) => void;
  onClose: () => void;
}

const ProblemGenerator: React.FC<ProblemGeneratorProps> = ({ onProblemsGenerated, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'한국어' | '중국어'>('한국어');
  const [selectedField, setSelectedField] = useState('일상');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'상' | '중' | '하'>('중');
  const [customPrompt, setCustomPrompt] = useState('');
  const [problemCount, setProblemCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = [
    '일상', '비즈니스', '여행', '음식', '문화', '기술', '교육', '건강', '환경', '스포츠'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const problems = await generateMultipleProblems(
        problemCount,
        selectedLanguage,
        selectedField,
        selectedDifficulty,
        customPrompt || undefined
      );

      if (problems.length === 0) {
        throw new Error('문제 생성에 실패했습니다. 다시 시도해주세요.');
      }

      onProblemsGenerated(problems);
      onClose();
    } catch (error) {
      console.error('문제 생성 실패:', error);
      setError(error instanceof Error ? error.message : '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🤖 AI 문제 생성</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 언어 선택 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🌐 언어 선택
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="한국어"
                  checked={selectedLanguage === '한국어'}
                  onChange={(e) => setSelectedLanguage(e.target.value as '한국어')}
                  className="mr-2"
                />
                한국어 → 중국어
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="중국어"
                  checked={selectedLanguage === '중국어'}
                  onChange={(e) => setSelectedLanguage(e.target.value as '중국어')}
                  className="mr-2"
                />
                중국어 → 한국어
              </label>
            </div>
          </div>

          {/* 분야 선택 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📚 분야 선택
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg"
            >
              {fields.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>

          {/* 난이도 선택 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🎯 난이도 선택
            </label>
            <div className="flex gap-4">
              {(['하', '중', '상'] as const).map(difficulty => (
                <label key={difficulty} className="flex items-center">
                  <input
                    type="radio"
                    value={difficulty}
                    checked={selectedDifficulty === difficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as '상' | '중' | '하')}
                    className="mr-2"
                  />
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    difficulty === '상' ? 'bg-red-100 text-red-700' :
                    difficulty === '중' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {difficulty}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 문제 개수 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📊 문제 개수
            </label>
            <select
              value={problemCount}
              onChange={(e) => setProblemCount(Number(e.target.value))}
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg"
            >
              <option value={1}>1개 (빠른 연습)</option>
              <option value={3}>3개 (권장)</option>
              <option value={5}>5개</option>
              <option value={10}>10개 (집중 연습)</option>
            </select>
          </div>

          {/* 추가 요청사항 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📝 추가 요청사항 (선택)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="예: 특정 문법 구조 포함, 비즈니스 용어 사용, 일상 대화체 등..."
              className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg h-24 resize-none"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">⚠️</span>
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                닫기
              </button>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg text-lg font-bold"
            >
              취소
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex-1 py-3 rounded-lg text-lg font-bold ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  생성 중...
                </div>
              ) : (
                `🚀 ${problemCount}개 문제 생성`
              )}
            </button>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>팁:</strong> AI가 선택한 조건에 맞는 맞춤형 번역 문제를 생성합니다. 
            생성 시간은 문제 개수에 따라 1-3분 정도 소요될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProblemGenerator;
