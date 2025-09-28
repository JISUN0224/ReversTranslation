import React, { useState, useEffect, useRef } from 'react';
import { STEPS } from '../types/index.ts';
import type { StepType, Problem, CompletedTranslation, AIFeedback, ImprovementResult } from '../types/index.ts';
import { calculateScore, calculateSessionStats, analyzeImprovement, getDifficultyStats } from '../utils/translationUtils.ts';
import { getAIFeedback } from '../utils/aiFeedback.ts';
import { ScoreLineChart } from './ScoreLineChart';
import { AccuracyDonut } from './AccuracyDonut';
import { DifficultyBarChart } from './DifficultyBarChart';
import RadarChart from './RadarChart';
import ProblemGenerator from './ProblemGenerator';
import TranslationComparison from './TranslationComparison';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { ProfileModal } from './ProfileModal';
import type { ProfileModalRef } from './ProfileModal';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ChatbotWidget from './ChatbotWidget';

const ReverseTranslation: React.FC = () => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<StepType>(STEPS.START);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemIndex, setProblemIndex] = useState(0);
  const [userKoToZh, setUserKoToZh] = useState('');
  const [userZhToKo, setUserZhToKo] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedTranslations, setCompletedTranslations] = useState<CompletedTranslation[]>([]);

  // 인증 관련 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const profileModalRef = useRef<ProfileModalRef>(null);
  
  // 저장 상태 알림
  const [saveMessage, setSaveMessage] = useState('');

  // 개선 입력 및 결과 상태 (한→중)
  const [koToZhImproved, setKoToZhImproved] = useState('');
  const [koToZhImprovementResult, setKoToZhImprovementResult] = useState<ImprovementResult | null>(null);
  const [koToZhImprovementLoading, setKoToZhImprovementLoading] = useState(false);
  const [koToZhImprovementError, setKoToZhImprovementError] = useState<string | null>(null);
  const [showKoZhImprovement, setShowKoZhImprovement] = useState(false);

  // 개선 입력 및 결과 상태 (중→한)
  const [zhToKoImproved, setZhToKoImproved] = useState('');
  const [zhToKoImprovementResult, setZhToKoImprovementResult] = useState<ImprovementResult | null>(null);
  const [zhToKoImprovementLoading, setZhToKoImprovementLoading] = useState(false);
  const [zhToKoImprovementError, setZhToKoImprovementError] = useState<string | null>(null);
  const [showZhKoImprovement, setShowZhKoImprovement] = useState(false);

  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // AI 피드백 상태
  const [koToZhFeedback, setKoToZhFeedback] = useState<AIFeedback | null>(null);
  const [zhToKoFeedback, setZhToKoFeedback] = useState<AIFeedback | null>(null);

  // AI 문제 생성 상태
  const [showProblemGenerator, setShowProblemGenerator] = useState(false);
  
  // 메인 화면 문제 생성 옵션 상태
  const [selectedLanguage, setSelectedLanguage] = useState<'한국어' | '중국어'>('한국어');
  const [selectedField, setSelectedField] = useState('일상');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'상' | '중' | '하'>('중');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 문제 로딩 - AI 문제 생성으로 변경
  useEffect(() => {
    // 기본적으로 빈 배열로 시작, 사용자가 AI 문제 생성 버튼을 클릭해야 함
    setProblems([]);
    setLoading(false);
  }, []);

  // AI 문제 생성 핸들러
  const handleProblemsGenerated = (newProblems: Problem[]) => {
    setProblems(newProblems);
    setProblemIndex(0);
    setLoading(false);
    // 문제 생성 완료 후 자동으로 챌린지 시작
    startChallenge();
  };

  // 메인 화면에서 직접 문제 생성
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const { generateTranslationProblem } = await import('../utils/problemGenerator.ts');
      const newProblem = await generateTranslationProblem(
        selectedLanguage,
        selectedField,
        selectedDifficulty,
        customPrompt || undefined
      );

      if (!newProblem) {
        throw new Error('문제 생성에 실패했습니다. 다시 시도해주세요.');
      }

      setProblems([newProblem]);
      setProblemIndex(0);
      startChallenge();
      } catch (error) {
      console.error('문제 생성 실패:', error);
      alert(error instanceof Error ? error.message : '문제 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 번역 결과를 Firebase에 저장
  const saveTranslationToFirebase = async (
    originalText: string,
    userTranslation: string,
    referenceTranslation: string,
    score: number,
    direction: 'ko-to-zh' | 'zh-to-ko',
    feedback?: any
  ) => {
    if (!currentUser) {
      console.log('로그인이 필요합니다. 번역 결과가 저장되지 않습니다.');
      return;
    }

    try {
      await addDoc(collection(db, 'reverseTranslations'), {
        userId: currentUser.uid,
        originalText,
        userTranslation,
        referenceTranslation,
        score,
        direction,
        feedback,
        timestamp: new Date()
      });
      console.log('✅ 번역 결과가 Firebase에 저장되었습니다.');
      
      // 저장 성공 메시지 표시
      setSaveMessage('✅ 번역 결과가 저장되었습니다!');
      setTimeout(() => setSaveMessage(''), 3000);
      
      // 프로필 모달이 열려있다면 번역 목록 새로고침
      if (profileModalRef.current) {
        profileModalRef.current.refreshTranslations();
      }
    } catch (error) {
      console.error('❌ Firebase 저장 오류:', error);
      setSaveMessage('❌ 저장 중 오류가 발생했습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // 새 문제 생성 (챌린지 리셋)
  const resetChallenge = () => {
    setStep(STEPS.START);
        setProblems([]);
    setProblemIndex(0);
    setScore(0);
    setStreak(0);
    setCompletedTranslations([]);
    setKoToZhFeedback(null);
    setZhToKoFeedback(null);
  };

  // 홈으로 이동
  const goToHome = () => {
    setStep(STEPS.START);
    setProblems([]);
    setProblemIndex(0);
    setScore(0);
    setStreak(0);
    setCompletedTranslations([]);
    setKoToZhFeedback(null);
    setZhToKoFeedback(null);
    setUserKoToZh('');
    setUserZhToKo('');
  };

  // AI 피드백 생성 (1단계)
  const generateKoToZhFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const feedback = await getAIFeedback(current?.korean || '', userKoToZh, 'ko-to-zh');
      setKoToZhFeedback(feedback);
    } catch (err) {
      console.error('AI 피드백 생성 실패:', err);
      // 에러가 발생해도 기본 피드백을 제공
      setKoToZhFeedback({
        error: 'AI 서버가 일시적으로 사용할 수 없습니다.',
        improvement: '기본 점수와 참고번역을 비교해보세요.',
        hint: '잠시 후 다시 시도해보세요.',
        완전성: 0, 가독성: 0, 정확성: 0, 스타일: 0,
        완전성피드백: 'AI 서버 오류', 가독성피드백: 'AI 서버 오류',
        정확성피드백: 'AI 서버 오류', 스타일피드백: 'AI 서버 오류'
      });
      } finally {
      setFeedbackLoading(false);
    }
  };

  // AI 피드백 생성 (2단계)
  const generateZhToKoFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const feedback = await getAIFeedback(mainAnswer, userZhToKo, 'zh-to-ko');
      setZhToKoFeedback(feedback);
    } catch (err) {
      console.error('AI 피드백 생성 실패:', err);
      // 에러가 발생해도 기본 피드백을 제공
      setZhToKoFeedback({
        error: 'AI 서버가 일시적으로 사용할 수 없습니다.',
        improvement: '기본 점수와 참고번역을 비교해보세요.',
        hint: '잠시 후 다시 시도해보세요.',
        완전성: 0, 가독성: 0, 정확성: 0, 스타일: 0,
        완전성피드백: 'AI 서버 오류', 가독성피드백: 'AI 서버 오류',
        정확성피드백: 'AI 서버 오류', 스타일피드백: 'AI 서버 오류'
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // 1단계 번역 저장
  const saveKoToZhTranslation = async () => {
    if (!current) return;
    
    await saveTranslationToFirebase(
      current.korean,
      userKoToZh,
      current.chinese,
      koToZhFeedback?.score || 0,
      'ko-to-zh',
      koToZhFeedback
    );
  };

  // 2단계 번역 저장
  const saveZhToKoTranslation = async () => {
    if (!current) return;
    
    await saveTranslationToFirebase(
      mainAnswer,
      userZhToKo,
      current.korean,
      zhToKoFeedback?.score || 0,
      'zh-to-ko',
      zhToKoFeedback
    );
  };

  // 현재 문제
  const current = problems[problemIndex];
  const mainAnswer = current?.ChatGPT_번역 || current?.chinese || '';

  // 챌린지 시작
  const startChallenge = () => {
    setStep(STEPS.KO_TO_ZH);
    setUserKoToZh('');
    setUserZhToKo('');
  };

  // 개선된 번역 점수 계산 함수
  const getFinalKoToZhScore = () => {
    if (koToZhImprovementResult && koToZhImproved.trim()) {
      return calculateScore(koToZhImproved, mainAnswer, current?.difficulty || '중');
    }
    return koToZhFeedback?.score || 0;
  };

  const getFinalZhToKoScore = () => {
    if (zhToKoImprovementResult && zhToKoImproved.trim()) {
      return calculateScore(zhToKoImproved, current?.korean || '', current?.difficulty || '중');
    }
    return zhToKoFeedback?.score || 0;
  };

  // 최종 번역 텍스트 가져오기
  const getFinalKoToZhText = () => {
    return (koToZhImproved.trim() && showKoZhImprovement) ? koToZhImproved : userKoToZh;
  };

  const getFinalZhToKoText = () => {
    return (zhToKoImproved.trim() && showZhKoImprovement) ? zhToKoImproved : userZhToKo;
  };

  // 챗봇 위젯용 컨텍스트 생성
  const getChatbotContext = () => {
    switch (step) {
      case STEPS.START:
        return `메인 화면 - 번역 연습을 시작할 준비가 되었습니다. 분야: ${selectedField}, 난이도: ${selectedDifficulty}`;
      
      case STEPS.KO_TO_ZH:
        return `1단계 한국어 → 중국어 번역 중
원문: ${current?.korean || ''}
내 번역: ${userKoToZh || '(아직 번역하지 않음)'}`;
      
      case STEPS.KO_ZH_RESULT:
        return `1단계 결과 - 한국어 → 중국어 번역 완료
원문: ${current?.korean || ''}
내 번역: ${userKoToZh || ''}
정답: ${current?.chinese || ''}
${koToZhFeedback ? `AI 점수: ${koToZhFeedback.score}점` : 'AI 분석 대기 중'}`;
      
      case STEPS.ZH_TO_KO:
        return `2단계 중국어 → 한국어 번역 중
원문: ${mainAnswer || ''}
내 번역: ${userZhToKo || '(아직 번역하지 않음)'}`;
      
      case STEPS.ZH_KO_RESULT:
        return `2단계 결과 - 중국어 → 한국어 번역 완료
원문: ${mainAnswer || ''}
내 번역: ${userZhToKo || ''}
정답: ${current?.korean || ''}
${zhToKoFeedback ? `AI 점수: ${zhToKoFeedback.score}점` : 'AI 분석 대기 중'}`;
      
      case STEPS.FINAL_RESULT:
        return `최종 결과 - 양방향 번역 완료
1단계 점수: ${getFinalKoToZhScore()}/100점
2단계 점수: ${getFinalZhToKoScore()}/100점
총점: ${getFinalKoToZhScore() + getFinalZhToKoScore()}/200점`;
      
      default:
        return '번역 연습 중';
    }
  };

  // 한→중 번역 제출 (AI 피드백)
  const handleKoToZhSubmit = async () => {
    if (!userKoToZh.trim()) {
      alert('중국어 번역을 입력해주세요!');
      return;
    }
    setKoToZhFeedback(null); // AI 피드백 초기화
    setStep(STEPS.KO_ZH_RESULT);
  };

  // 한→중 개선 제출
  const handleKoZhImprovementSubmit = async () => {
    if (!koToZhImproved.trim()) {
      alert('개선된 번역을 입력해주세요!');
      return;
    }
    setKoToZhImprovementLoading(true);
    setKoToZhImprovementError(null);
    try {
      const result = analyzeImprovement(userKoToZh, koToZhImproved, mainAnswer);
      setKoToZhImprovementResult(result);
      setShowKoZhImprovement(true);
    } catch (err) {
      setKoToZhImprovementError('AI 피드백을 불러오는데 실패했습니다.');
    } finally {
      setKoToZhImprovementLoading(false);
    }
  };

  // 중→한 번역 제출 (AI 피드백)
  const handleZhToKoSubmit = async () => {
    if (!userZhToKo.trim()) {
      alert('한국어 번역을 입력해주세요!');
      return;
    }
    setZhToKoFeedback(null); // AI 피드백 초기화
    setStep(STEPS.ZH_KO_RESULT);
  };

  // 중→한 개선 제출
  const handleZhKoImprovementSubmit = async () => {
    if (!zhToKoImproved.trim()) {
      alert('개선된 번역을 입력해주세요!');
      return;
    }
    setZhToKoImprovementLoading(true);
    setZhToKoImprovementError(null);
    try {
      const result = analyzeImprovement(userZhToKo, zhToKoImproved, current?.korean || '');
      setZhToKoImprovementResult(result);
      setShowZhKoImprovement(true);
    } catch (err) {
      setZhToKoImprovementError('AI 피드백을 불러오는데 실패했습니다.');
    } finally {
      setZhToKoImprovementLoading(false);
    }
  };

  // 다음 문제로 이동
  const nextProblem = () => {
    // 현재 문제를 완료된 번역 목록에 추가
    if (current) {
      const finalKoZhScore = getFinalKoToZhScore();
      const finalZhKoScore = getFinalZhToKoScore();
      const finalKoZhText = getFinalKoToZhText();
      const finalZhKoText = getFinalZhToKoText();
      
      const completed: CompletedTranslation = {
        id: current.id,
        originalKorean: current.korean,
        correctChinese: mainAnswer,
        userKoToZh: finalKoZhText,
        userZhToKo: finalZhKoText,
        koToZhScore: finalKoZhScore,
        zhToKoScore: finalZhKoScore,
        difficulty: current.difficulty,
        field: current.field,
        completedAt: new Date(),
        timeSpent: 0
      };
      setCompletedTranslations(prev => [...prev, completed]);
      setScore(prev => prev + finalKoZhScore + finalZhKoScore);
      if (finalKoZhScore >= 70 && finalZhKoScore >= 70) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
    }

    if (problemIndex < problems.length - 1) {
      setProblemIndex(i => i + 1);
      setStep(STEPS.KO_TO_ZH);
      setUserKoToZh('');
      setUserZhToKo('');
      setKoToZhFeedback(null);
      setZhToKoFeedback(null);
      // 개선 상태 초기화
      setKoToZhImproved('');
      setZhToKoImproved('');
      setKoToZhImprovementResult(null);
      setZhToKoImprovementResult(null);
      setShowKoZhImprovement(false);
      setShowZhKoImprovement(false);
    } else {
      // 마지막 문제면 재시작
      setProblemIndex(0);
      setStep(STEPS.START);
      setScore(0);
      setStreak(0);
      setCompletedTranslations([]);
    }
    setActiveTab('result');
  };

  const sessionStats = calculateSessionStats(completedTranslations);

  // 이전 스텝으로 이동
  const goToPrevStep = () => {
    switch (step) {
      case STEPS.KO_TO_ZH:
        setStep(STEPS.START);
        break;
      case STEPS.KO_ZH_RESULT:
        setStep(STEPS.KO_TO_ZH);
        break;
      case STEPS.ZH_TO_KO:
        setStep(STEPS.KO_ZH_RESULT);
        break;
      case STEPS.FINAL_RESULT:
        setStep(STEPS.ZH_TO_KO);
        break;
      default:
        break;
    }
  };

  // 메인 레이아웃
  return (
    <>
      {/* AI 피드백 로딩 오버레이 */}
      {feedbackLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-10 bg-white/80 rounded-2xl shadow-2xl border-2 border-purple-300">
            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-purple-600 mb-2"></div>
            <div className="text-xl font-bold text-purple-700">AI피드백을 불러오는 중입니다..</div>
          </div>
        </div>
      )}
      
      {/* 저장 상태 토스트 알림 */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white border-2 border-green-500 text-green-700 px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          {saveMessage}
        </div>
      )}
      
      {/* AI 문제 생성 모달 */}
      {showProblemGenerator && (
        <ProblemGenerator
          onProblemsGenerated={handleProblemsGenerated}
          onClose={() => setShowProblemGenerator(false)}
        />
      )}
      
      <div className="min-h-screen bg-gray-50 py-10 px-0">
        <div className="w-full max-w-[50vw] mx-auto">
          {/* 네비게이션 바 (START 제외) */}
          {step !== STEPS.START && (
            <div className="flex items-center justify-between mb-8 px-2 py-3 bg-white/30 backdrop-blur-md rounded-xl shadow-md">
              <button
                className="flex items-center gap-1 text-lg font-bold text-gray-700 hover:text-blue-700 px-4 py-2 rounded transition"
                onClick={goToPrevStep}
              >
                <span className="text-2xl">←</span>
                <span>이전</span>
              </button>
              <button
                className="flex items-center gap-1 text-lg font-bold text-gray-700 hover:text-green-700 px-4 py-2 rounded transition"
                onClick={goToHome}
              >
                <span className="text-2xl">🏠</span>
                <span>홈으로</span>
              </button>
            </div>
          )}
          
          
          {/* 헤더 - 전체 너비 사용 */}
          {step === STEPS.START && (
            <div className="text-center mb-12">
              <div className="flex justify-between items-center mb-4 max-w-[50vw] mx-auto px-0">
                <div className="flex-1"></div> {/* 왼쪽 공간 */}
                <h1 className="text-5xl font-bold text-gray-800">🔄 4.3.4. AI양방향 번역 시스템</h1>
                <div className="flex-1 flex justify-end gap-2">
                  <button
                    onClick={() => (window as any).navigateTo('/dashboard')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors whitespace-nowrap"
                  >
                    📊 대시보드
                  </button>
                  {currentUser ? (
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-500 font-bold">
                        {currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </div>
                      <span className="text-sm">프로필</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap"
                    >
                      로그인
                    </button>
                  )}
              </div>
              </div>
              <p className="text-xl text-gray-600">한 문장, 두 방향으로 완벽하게!</p>
            </div>
          )}
          
          {/* 카드 영역 */}
          <div className="w-full max-w-[50vw] mx-auto">
            {/* 시작 화면 */}
            {step === STEPS.START && (
              <div className="w-full px-0">
                <div className="flex gap-4 w-full">
                  {/* 문제 생성 옵션 (더 넓게) */}
                  <div className="flex-none" style={{ width: '60%' }}>
                    <div className="bg-white rounded-2xl shadow-lg p-12" style={{ height: '800px', display: 'flex', flexDirection: 'column' }}>
                  <h2 className="text-4xl font-bold text-gray-800 mb-6 text-center">AI 맞춤 문제 생성</h2>
                  
                  {/* 분야 선택 */}
                  <div className="mb-8">
                    <label className="block text-lg font-bold text-gray-700 mb-3">
                      📚 분야 선택
                    </label>
                    <select
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg text-xl focus:border-blue-300 focus:outline-none"
                    >
                      <option value="일상">일상</option>
                      <option value="비즈니스">비즈니스</option>
                      <option value="여행">여행</option>
                      <option value="음식">음식</option>
                      <option value="문화">문화</option>
                      <option value="기술">기술</option>
                      <option value="교육">교육</option>
                      <option value="건강">건강</option>
                      <option value="환경">환경</option>
                      <option value="스포츠">스포츠</option>
                    </select>
                  </div>

                  {/* 난이도 선택 */}
                  <div className="mb-8">
                    <label className="block text-lg font-bold text-gray-700 mb-3">
                      🎯 난이도 선택
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['하', '중', '상'] as const).map(difficulty => (
                        <label key={difficulty} className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                          <input
                            type="radio"
                            value={difficulty}
                            checked={selectedDifficulty === difficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value as '상' | '중' | '하')}
                            className="mr-2"
                          />
                          <span className={`font-bold text-xl ${
                            difficulty === '상' ? 'text-red-600' :
                            difficulty === '중' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {difficulty}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 추가 요청사항 */}
                  <div className="mb-16">
                    <label className="block text-lg font-bold text-gray-700 mb-3">
                      📝 추가 요청사항 (선택)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="예: 특정 문법 구조 포함, 비즈니스 용어 사용, 일상 대화체 등..."
                      className="w-full p-4 border-2 border-gray-200 rounded-lg text-xl h-24 resize-none focus:border-blue-300 focus:outline-none"
                    />
                  </div>

                  {/* 시작 버튼 */}
                <div className="mt-auto">
                <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-2xl font-bold shadow-lg transition-colors"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          AI가 3-4문장 문제를 생성하는 중...
                        </div>
                      ) : (
                        '🚀 번역 연습 시작'
                      )}
                  </button>
                </div>
                    </div>
                  </div>

                  {/* 사용 가이드 (40%) */}
                  <div className="flex-none" style={{ width: '40%' }}>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-10 border border-blue-100" style={{ height: '800px', display: 'flex', flexDirection: 'column' }}>
                      <h3 className="text-3xl font-bold text-gray-800 mb-4 flex items-center">
                        📋 <span className="ml-2">사용 가이드</span>
                      </h3>
                      
                      {/* 문제 생성 방법 */}
                      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-orange-400">
                        <h4 className="font-bold text-orange-700 mb-2 flex items-center text-lg">
                          ⚙️ <span className="ml-2">문제 생성 방법</span>
                        </h4>
                        <p className="text-base text-gray-600 leading-relaxed">
                          원하는 분야와 난이도를 선택하세요.<br />
                          이 외의 요청사항은 '추가 요청사항'칸에 직접 입력합니다
                        </p>
                      </div>
                      
                      {/* 양방향 번역 챌린지 */}
                      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-400">
                        <h4 className="font-bold text-blue-700 mb-2 flex items-center text-lg">
                          🔄 <span className="ml-2">양방향 번역 챌린지</span>
                        </h4>
                        <p className="text-base text-gray-600 leading-relaxed">
                          한국어 → 중국어 → 한국어 순서로<br />
                          두 번의 번역을 진행합니다
                        </p>
                      </div>
                      
                      {/* 평가 기준 */}
                      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-green-400">
                        <h4 className="font-bold text-green-700 mb-3 flex items-center text-lg">
                          📊 <span className="ml-2">평가 기준</span>
                        </h4>
                        <div className="space-y-2 text-base">
                          <div className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span><span className="font-medium text-blue-600">완전성:</span> 모든 내용이 번역되었는지</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span><span className="font-medium text-green-600">가독성:</span> 자연스럽게 읽히는지</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span><span className="font-medium text-red-600">정확성:</span> 문법과 의미가 정확한지</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span><span className="font-medium text-purple-600">스타일:</span> 원문의 톤과 문체가 유지되는지</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 팁 */}
                      <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-400 flex-1">
                        <h4 className="font-bold text-yellow-700 mb-3 flex items-center text-lg">
                          💡 <span className="ml-2">팁</span>
                        </h4>
                        <div className="space-y-2 text-base text-gray-600">
                          <div className="flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            <span>2단계에서는 1단계의 참조 답안을 원문으로 번역합니다</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            <span>AI가 상세한 피드백을 제공합니다</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            <span>클릭하면 번역에서 해당 부분이 하이라이트됩니다</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 1단계: 한국어 → 중국어 */}
            {step === STEPS.KO_TO_ZH && current && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">1단계: 한국어 → 중국어</h2>
                  <p className="text-gray-600">아래 한국어 문장을 중국어로 번역해주세요</p>
                </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-gray-800 mb-4">🇰🇷 한국어</div>
                    <div className="bg-blue-50 p-6 rounded-lg text-xl font-medium text-blue-900 border-2 border-blue-200">
                      {current.korean}
                    </div>
                </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-gray-800 mb-4">🇨🇳 중국어 번역</div>
                  <textarea
                      className="w-full p-6 border-2 border-gray-300 rounded-lg text-xl min-h-[120px] resize-none"
                    value={userKoToZh}
                    onChange={e => setUserKoToZh(e.target.value)}
                      placeholder="여기에 중국어 번역을 입력하세요..."
                  />
                </div>
                  
                <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-2xl font-bold shadow-lg"
                  onClick={handleKoToZhSubmit}
                  disabled={!userKoToZh.trim()}
                >
                    {userKoToZh.trim() ? '번역 완료' : '번역을 입력해주세요'}
                </button>
                </div>
              </div>
            )}
            
            {/* 1단계 결과 */}
            {step === STEPS.KO_ZH_RESULT && current && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">✅ 1단계 완료!</h2>
                  <p className="text-gray-600 mb-2">AI 분석을 받은 후 2단계로 진행하세요</p>
                  <p className="text-sm text-gray-500">💡 순서: AI 분석 → 2단계 역방향 번역</p>
                    </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  {koToZhFeedback ? (
                    <TranslationComparison
                      userTranslation={userKoToZh}
                      referenceTranslation={current?.korean || ''}
                      detailedAnalysis={koToZhFeedback.detailedAnalysis || []}
                      score={koToZhFeedback.score}
                      완전성={koToZhFeedback.완전성}
                      가독성={koToZhFeedback.가독성}
                      정확성={koToZhFeedback.정확성}
                      스타일={koToZhFeedback.스타일}
                      완전성피드백={koToZhFeedback.완전성피드백}
                      가독성피드백={koToZhFeedback.가독성피드백}
                      정확성피드백={koToZhFeedback.정확성피드백}
                      스타일피드백={koToZhFeedback.스타일피드백}
                      referenceLabel="📖 원문"
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700 mb-3">🇨🇳 내 번역</div>
                          <div className="bg-blue-50 p-4 rounded-lg text-lg border-2 border-blue-200">
                            {userKoToZh}
                    </div>
                    </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700 mb-3">📖 원문</div>
                          <div className="bg-green-50 p-4 rounded-lg text-lg border-2 border-green-200">
                            {current?.korean || ''}
                    </div>
                  </div>
                </div>
                
                  </div>
                )}
                
                  <div className="flex gap-4 mt-6">
                    {!koToZhFeedback && (
                    <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-bold shadow-lg"
                        onClick={generateKoToZhFeedback}
                        disabled={feedbackLoading}
                      >
                        {feedbackLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            AI 분석 중...
                          </div>
                        ) : (
                          '🤖 AI 상세 분석 보기'
                        )}
                    </button>
                    )}
                    {koToZhFeedback && (
                      currentUser ? (
                        <button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-bold shadow-lg"
                          onClick={saveKoToZhTranslation}
                        >
                          💾 내 번역 저장하기
                        </button>
                      ) : (
                        <button
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl text-lg font-bold shadow-lg"
                          onClick={() => setShowLoginModal(true)}
                        >
                          🔐 로그인하여 저장하기
                        </button>
                      )
                    )}
                    <button
                      className={`flex-1 py-4 rounded-xl text-lg font-bold shadow-lg transition-colors ${
                        koToZhFeedback 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer' 
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                      onClick={() => koToZhFeedback && setStep(STEPS.ZH_TO_KO)}
                      disabled={!koToZhFeedback}
                      title={koToZhFeedback ? '2단계로 진행합니다' : '먼저 AI 분석을 받아주세요'}
                    >
                      🔄 2단계: 역방향 번역
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 2단계: 중국어 → 한국어 */}
            {step === STEPS.ZH_TO_KO && current && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">2단계: 중국어 → 한국어</h2>
                  <p className="text-gray-600">아래 중국어 문장을 한국어로 번역해주세요</p>
                </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-gray-800 mb-4">🇨🇳 중국어</div>
                    <div className="bg-purple-50 p-6 rounded-lg text-xl font-medium text-purple-900 border-2 border-purple-200">
                      {mainAnswer}
                    </div>
                </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-gray-800 mb-4">🇰🇷 한국어 번역</div>
                  <textarea
                      className="w-full p-6 border-2 border-gray-300 rounded-lg text-xl min-h-[120px] resize-none"
                    value={userZhToKo}
                    onChange={e => setUserZhToKo(e.target.value)}
                      placeholder="여기에 한국어 번역을 입력하세요..."
                  />
                </div>
                  
                <button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl text-2xl font-bold shadow-lg"
                  onClick={handleZhToKoSubmit}
                  disabled={!userZhToKo.trim()}
                >
                    {userZhToKo.trim() ? '번역 완료' : '번역을 입력해주세요'}
                </button>
                </div>
              </div>
            )}
            
            {/* 2단계 결과 */}
            {step === STEPS.ZH_KO_RESULT && current && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">✅ 2단계 완료!</h2>
                  <p className="text-gray-600 mb-2">AI 분석을 받은 후 최종 결과를 확인하세요</p>
                  <p className="text-sm text-gray-500">💡 순서: AI 분석 → 최종 종합 평가</p>
                    </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  {zhToKoFeedback ? (
                    <TranslationComparison
                      userTranslation={userZhToKo}
                      referenceTranslation={mainAnswer}
                      detailedAnalysis={zhToKoFeedback.detailedAnalysis || []}
                      score={zhToKoFeedback.score}
                      완전성={zhToKoFeedback.완전성}
                      가독성={zhToKoFeedback.가독성}
                      정확성={zhToKoFeedback.정확성}
                      스타일={zhToKoFeedback.스타일}
                      완전성피드백={zhToKoFeedback.완전성피드백}
                      가독성피드백={zhToKoFeedback.가독성피드백}
                      정확성피드백={zhToKoFeedback.정확성피드백}
                      스타일피드백={zhToKoFeedback.스타일피드백}
                      referenceLabel="📖 원문"
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700 mb-3">🇰🇷 내 번역</div>
                          <div className="bg-purple-50 p-4 rounded-lg text-lg border-2 border-purple-200">
                            {userZhToKo}
                    </div>
                  </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700 mb-3">📖 원문</div>
                          <div className="bg-green-50 p-4 rounded-lg text-lg border-2 border-green-200">
                            {mainAnswer}
                    </div>
                  </div>
                </div>
                
                  </div>
                )}
                
                  <div className="flex gap-4 mt-6">
                    {!zhToKoFeedback && (
                    <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-lg font-bold shadow-lg"
                        onClick={generateZhToKoFeedback}
                        disabled={feedbackLoading}
                      >
                        {feedbackLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            AI 분석 중...
                  </div>
                        ) : (
                          '🤖 AI 상세 분석 보기'
                        )}
                      </button>
                    )}
                    {zhToKoFeedback && (
                      currentUser ? (
                      <button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-bold shadow-lg"
                          onClick={saveZhToKoTranslation}
                      >
                          💾 내 번역 저장하기
                      </button>
                      ) : (
                      <button
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-xl text-lg font-bold shadow-lg"
                          onClick={() => setShowLoginModal(true)}
                      >
                          🔐 로그인하여 저장하기
                      </button>
                      )
                    )}
                      <button
                      className={`flex-1 py-4 rounded-xl text-lg font-bold shadow-lg transition-colors ${
                        zhToKoFeedback 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer' 
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                        onClick={() => zhToKoFeedback && setStep(STEPS.FINAL_RESULT)}
                        disabled={!zhToKoFeedback}
                        title={zhToKoFeedback ? '최종 결과를 확인합니다' : '먼저 AI 분석을 받아주세요'}
                      >
                      🎯 최종 결과 보기
                      </button>
                    </div>
                  </div>
              </div>
            )}
            
            {/* 최종 결과 */}
            {step === STEPS.FINAL_RESULT && current && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">🎉 양방향 번역 완료!</h2>
                  <p className="text-gray-600">총 점수를 확인해보세요</p>
                </div>
                
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="text-center mb-8">
                    <div className="text-6xl font-bold text-yellow-600 mb-4">
                      {getFinalKoToZhScore() + getFinalZhToKoScore()}<span className="text-4xl text-gray-500">/200</span>
                          </div>
                    <div className="text-xl text-gray-600">
                      1단계: {getFinalKoToZhScore()}/100점 | 2단계: {getFinalZhToKoScore()}/100점
                          </div>
                      </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-blue-800 mb-4">🇰🇷→🇨🇳 한국어 → 중국어</h3>
                      <div className="space-y-6">
                          <div>
                          <p className="font-bold text-blue-700 mb-3 text-xl">📝 내 번역:</p>
                          <p className="text-lg bg-blue-100 p-4 rounded-lg border border-blue-300">{getFinalKoToZhText()}</p>
                          </div>
                          <div>
                          <p className="font-bold text-green-700 mb-3 text-xl">✅ 정답:</p>
                          <p className="text-lg bg-green-100 p-4 rounded-lg border border-green-300">{mainAnswer}</p>
                          </div>
                        <div className="text-center">
                          <span className="text-3xl font-bold text-blue-600">{getFinalKoToZhScore()}/100점</span>
                        </div>
                        </div>
                      </div>

                    <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                      <h3 className="text-lg font-bold text-purple-800 mb-4">🇨🇳→🇰🇷 중국어 → 한국어</h3>
                      <div className="space-y-6">
                          <div>
                          <p className="font-bold text-purple-700 mb-3 text-xl">📝 내 번역:</p>
                          <p className="text-lg bg-purple-100 p-4 rounded-lg border border-purple-300">{getFinalZhToKoText()}</p>
                          </div>
                          <div>
                          <p className="font-bold text-green-700 mb-3 text-xl">✅ 정답:</p>
                          <p className="text-lg bg-green-100 p-4 rounded-lg border border-green-300">{current.korean}</p>
                          </div>
                        <div className="text-center">
                          <span className="text-3xl font-bold text-purple-600">{getFinalZhToKoScore()}/100점</span>
                        </div>
                        </div>
                          </div>
                      </div>

                  {/* 레이더 차트 섹션 */}
                  <div className="mt-12 mb-8">
                    <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">📊 상세 평가 분석</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* 1단계 레이더 차트 */}
                      {koToZhFeedback && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                          <h4 className="text-2xl font-bold text-blue-800 mb-6 text-center">🇰🇷→🇨🇳 1단계 평가</h4>
                          <div className="flex justify-center">
                            <RadarChart 
                              data={{
                                완전성: koToZhFeedback.완전성 || 0,
                                가독성: koToZhFeedback.가독성 || 0,
                                정확성: koToZhFeedback.정확성 || 0,
                                스타일: koToZhFeedback.스타일 || 0
                              }} 
                              size={280} 
                            />
                        </div>
                      </div>
                      )}
                      
                      {/* 2단계 레이더 차트 */}
                      {zhToKoFeedback && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
                          <h4 className="text-2xl font-bold text-purple-800 mb-6 text-center">🇨🇳→🇰🇷 2단계 평가</h4>
                          <div className="flex justify-center">
                            <RadarChart 
                              data={{
                                완전성: zhToKoFeedback.완전성 || 0,
                                가독성: zhToKoFeedback.가독성 || 0,
                                정확성: zhToKoFeedback.정확성 || 0,
                                스타일: zhToKoFeedback.스타일 || 0
                              }} 
                              size={280} 
                            />
                      </div>
                          </div>
                      )}
                          </div>
                        </div>
                        
                  <div className="flex gap-4">
                        <button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-xl font-bold shadow-lg"
                      onClick={resetChallenge}
                        >
                      새 문제 생성
                        </button>
                                  </div>
                                  </div>
                                </div>
            )}
                              </div>
                          </div>
                        </div>

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 프로필 모달 */}
      <ProfileModal
        ref={profileModalRef}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 챗봇 위젯 */}
      <ChatbotWidget 
        initialContext={getChatbotContext()}
        currentStep={step}
      />
    </>
  );
};

export default ReverseTranslation;
