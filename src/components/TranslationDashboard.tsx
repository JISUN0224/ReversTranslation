import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TranslationData {
  id: string;
  originalText: string;
  userTranslation: string;
  referenceTranslation: string;
  score: number;
  timestamp: string;
  direction: 'ko-to-zh' | 'zh-to-ko';
  feedback?: any;
}

// 예시 데이터 생성
const createDemoData = () => ({
  totalTranslations: 15,
  completedTranslations: 12,
  averageScore: 87.3,
  totalStudyTime: 12540, // 초단위 (3시간 29분)
  totalSessions: 28,
  streakDays: 8,
  weeklyGoal: 75,
  dailyStudyTime: [25, 32, 45, 38, 47, 52, 28],
  weeklyProgress: [
    { week: '1월 1주차', averageScore: 82, totalTranslations: 3, studyTime: 120, improvement: '+8%' },
    { week: '1월 2주차', averageScore: 85, totalTranslations: 4, studyTime: 135, improvement: '+4%' },
    { week: '1월 3주차', averageScore: 88, totalTranslations: 3, studyTime: 145, improvement: '+3%' },
    { week: '1월 4주차', averageScore: 91, totalTranslations: 2, studyTime: 158, improvement: '+3%' }
  ],
  directionRanking: [
    { direction: '한국어→중국어', averageScore: 92.5, translationCount: 7, rank: 1 },
    { direction: '중국어→한국어', averageScore: 89.2, translationCount: 5, rank: 2 }
  ],
  recentActivities: [
    { originalText: '오늘 날씨가 정말 좋네요', direction: '한→중', difficulty: '쉬움', studyTime: 300, averageScore: 94, date: '2025-01-20T14:30:00' },
    { originalText: '비즈니스 미팅 준비가 필요합니다', direction: '한→중', difficulty: '보통', studyTime: 450, averageScore: 88, date: '2025-01-20T10:15:00' },
    { originalText: '今天天气很好', direction: '중→한', difficulty: '쉬움', studyTime: 200, averageScore: 91, date: '2025-01-19T16:45:00' },
    { originalText: '我们需要准备商务会议', direction: '중→한', difficulty: '보통', studyTime: 380, averageScore: 85, date: '2025-01-19T09:20:00' }
  ],
  insights: [
    '한국어→중국어 번역에서 탁월한 성과를 보이고 있어요! 평균 92.5점을 달성했습니다.',
    '8일 연속 학습! 꾸준함이 실력 향상의 비결입니다.',
    '최근 성과가 15% 향상되었어요! 노력의 결과가 나타나고 있습니다.'
  ]
});

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

const getDirectionIcon = (direction: string) => {
  const icons: Record<string, { icon: string; bg: string }> = {
    '한국어→중국어': { icon: '🇰🇷→🇨🇳', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
    '중국어→한국어': { icon: '🇨🇳→🇰🇷', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' }
  };
  return icons[direction] || { icon: '🔄', bg: 'linear-gradient(135deg, #667eea, #764ba2)' };
};

const TranslationDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [translationData, setTranslationData] = useState<TranslationData[]>([]);

  // 사용자 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          
          // Firebase에서 번역 데이터 로드
          const translationsRef = collection(db, 'reverseTranslations');
          const q = query(
            translationsRef,
            where('userId', '==', currentUser.uid)
          );
          
          const querySnapshot = await getDocs(q);
          const translations: TranslationData[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            translations.push({
              id: doc.id,
              originalText: data.originalText || '',
              userTranslation: data.userTranslation || '',
              referenceTranslation: data.referenceTranslation || '',
              score: data.score || 0,
              timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
              direction: data.direction || 'ko-to-zh',
              feedback: data.feedback || null
            });
          });
          
          // 클라이언트에서 timestamp 기준으로 정렬
          translations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setTranslationData(translations);
          setShowLoginPrompt(false);
          console.log('📊 번역 데이터 로드 성공:', translations.length, '개');
          // console.log('📊 로드된 번역 데이터:', translations); // 민감 정보 숨김
        } catch (error) {
          console.error('번역 데이터 로드 실패:', error);
        }
      } else {
        setShowLoginPrompt(true);
      }
      setLoading(false);
    };
    
    loadUserData();
  }, [currentUser]);

  // 실제 데이터 또는 예시 데이터 사용
  const stats = useMemo(() => {
    console.log('📊 stats 계산 시작:', { currentUser: !!currentUser, translationDataLength: translationData.length });
    
    if (currentUser) {
      // 실제 Firebase 데이터 사용 (데이터가 있는 경우)
      if (translationData.length > 0) {
        console.log('📊 실제 Firebase 데이터 사용');
        // console.log('📊 번역 데이터 상세:', translationData); // 민감 정보 숨김
        
        const totalTranslations = translationData.length;
        const completedTranslations = translationData.length;
        
        // 평균 점수 계산
        const averageScore = Math.round(translationData.reduce((sum, t) => sum + t.score, 0) / translationData.length * 10) / 10;
        console.log('📊 계산된 평균 점수:', averageScore);
      
      // 총 학습 시간 (번역당 평균 5분으로 가정)
      const totalStudyTime = translationData.length * 300; // 5분 * 번역 수
      
      // 연속 학습일 계산
      const uniqueDays = [...new Set(translationData.map(t => t.timestamp.split('T')[0]))];
      uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      let streakDays = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);
      for (let i = 0; i < uniqueDays.length; i++) {
        const sessionDate = currentDate.toISOString().split('T')[0];
        if (uniqueDays.includes(sessionDate)) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      // 주간 목표 진행도 (이번 주 번역 수)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const thisWeekTranslations = translationData.filter(t => new Date(t.timestamp) >= weekStart);
      const weeklyGoal = Math.min((thisWeekTranslations.length / 5) * 100, 100);
      console.log('📊 주간 목표 계산:', { thisWeekTranslations: thisWeekTranslations.length, weeklyGoal });

      // 일일 학습 시간 (최근 7일)
      const dailyStudyTime = Array(7).fill(0);
      translationData.forEach((translation) => {
        const translationDate = new Date(translation.timestamp);
        const daysDiff = Math.floor((new Date().getTime() - translationDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          dailyStudyTime[6 - daysDiff] += 5; // 번역당 5분
        }
      });
      console.log('📊 일일 학습 시간 계산:', dailyStudyTime);

      // 주간 성과 추이
      const weeklyData: Record<string, { scores: number[]; translations: number; time: number }> = {};
      translationData.forEach((translation) => {
        const date = new Date(translation.timestamp);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { scores: [], translations: 0, time: 0 };
        }
        weeklyData[weekKey].scores.push(translation.score);
        weeklyData[weekKey].translations += 1;
        weeklyData[weekKey].time += 300; // 5분
      });

      const weeklyProgress = Object.entries(weeklyData)
        .map(([week, data]) => ({
          week: `${new Date(week).getMonth() + 1}월 ${Math.ceil(new Date(week).getDate() / 7)}주차`,
          averageScore: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length * 10) / 10,
          totalTranslations: data.translations,
          studyTime: data.time,
          improvement: '+3%'
        }))
        .sort((a, b) => b.week.localeCompare(a.week))
        .slice(0, 4);

      // 방향별 성과
      const directionStats = translationData.reduce((acc: any, translation) => {
        const direction = translation.direction === 'ko-to-zh' ? '한국어→중국어' : '중국어→한국어';
        if (!acc[direction]) {
          acc[direction] = { scores: [], translationCount: 0 };
        }
        acc[direction].scores.push(translation.score);
        acc[direction].translationCount += 1;
        return acc;
      }, {});

      const directionRanking = Object.entries(directionStats).map(([direction, data]: [string, any]) => ({
        direction,
        averageScore: Math.round(data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length * 10) / 10,
        translationCount: data.translationCount,
        rank: 0
      })).sort((a, b) => b.averageScore - a.averageScore);

      directionRanking.forEach((item, index) => {
        item.rank = index + 1;
      });

      // 최근 활동
      const recentActivities = translationData.slice(0, 4).map((translation) => ({
        originalText: translation.originalText.length > 20 
          ? translation.originalText.substring(0, 20) + '...' 
          : translation.originalText,
        direction: translation.direction === 'ko-to-zh' ? '한→중' : '중→한',
        difficulty: translation.score >= 90 ? '쉬움' : translation.score >= 80 ? '보통' : '어려움',
        studyTime: 300, // 5분
        averageScore: translation.score,
        date: translation.timestamp
      }));

      // 인사이트
      const insights = [];
      
      if (translationData.length > 0) {
        insights.push(`총 ${translationData.length}개 번역을 완료하셨네요! 꾸준한 학습이 인상적입니다.`);
        
        if (streakDays > 0) {
          insights.push(`${streakDays}일 연속 학습! 꾸준함이 실력 향상의 비결입니다.`);
        }
        
        if (averageScore > 0) {
          if (averageScore >= 90) {
            insights.push(`평균 ${averageScore}점! 탁월한 번역 실력을 보여주고 있어요!`);
          } else if (averageScore >= 80) {
            insights.push(`평균 ${averageScore}점! 좋은 성과를 내고 있습니다!`);
          } else if (averageScore >= 70) {
            insights.push(`평균 ${averageScore}점! 꾸준히 연습하면 더욱 향상될 거예요!`);
          } else {
            insights.push(`평균 ${averageScore}점! 더 많은 연습으로 실력을 키워보세요!`);
          }
        }
        
        if (directionRanking.length > 0) {
          const topDirection = directionRanking[0];
          insights.push(`${topDirection.direction}에서 가장 좋은 성과를 보이고 있어요! (평균 ${topDirection.averageScore}점)`);
        }
        
        const totalMinutes = Math.floor(totalStudyTime / 60);
        if (totalMinutes > 0) {
          if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            insights.push(`총 ${hours}시간 ${minutes}분 학습하셨네요! 정말 대단합니다!`);
          } else {
            insights.push(`총 ${totalMinutes}분 학습하셨네요! 꾸준한 노력이 느껴집니다!`);
          }
        }
      } else {
        insights.push(`${currentUser.displayName || '사용자'}님, 환영합니다! 첫 번째 번역을 시작해보세요.`);
        insights.push('다양한 문장으로 번역 실력을 키워보세요.');
        insights.push('AI가 제공하는 상세한 피드백으로 효과적인 학습이 가능합니다.');
      }

        return {
          totalTranslations,
          completedTranslations,
          averageScore,
          totalStudyTime,
          totalSessions: translationData.length,
          streakDays,
          weeklyGoal,
          dailyStudyTime,
          weeklyProgress,
          directionRanking,
          recentActivities,
          insights
        };
      } else {
        // 로그인했지만 데이터가 없는 경우 - 예시 데이터 사용
        console.log('📊 로그인했지만 데이터 없음 - 예시 데이터 사용');
        return createDemoData();
      }
    } else {
      // 로그인 안한 경우 - 예시 데이터 사용
      console.log('📊 로그인 안함 - 예시 데이터 사용');
      return createDemoData();
    }
  }, [currentUser, translationData]);

  // 차트 데이터
  const dailyChartData = useMemo(() => ({
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        label: '학습 시간',
        data: stats.dailyStudyTime,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 6,
      },
    ],
  }), [stats]);

  const weeklyChartData = useMemo(() => ({
    labels: stats.weeklyProgress.map(w => w.week),
    datasets: [
      {
        label: '번역 정확도',
        data: stats.weeklyProgress.map(w => w.averageScore),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: '#667eea',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: '학습 시간',
        data: stats.weeklyProgress.map(w => Math.round(w.studyTime / 60)),
        backgroundColor: 'rgba(118, 75, 162, 0.8)',
        borderColor: '#764ba2',
        borderWidth: 2,
        borderRadius: 8,
        yAxisID: 'y1',
      },
    ],
  }), [stats]);

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '학습자';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-blue-600 text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-purple-100 py-8">
      {/* 로그인 안내 오버레이 */}
      {showLoginPrompt && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-5">🔒</div>
            <h2 className="text-3xl text-gray-800 mb-4 font-bold">
              아직 로그인을 안 하셨네요?
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              아래 화면은 대시보드 예시입니다.<br/>
              로그인하시면 <strong>개인별 번역 학습 대시보드</strong>가 제공됩니다.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-xl px-8 py-4 text-lg font-semibold cursor-pointer shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1"
                onClick={() => (window as any).navigateTo('/')}
              >
                🚀 지금 로그인하기
              </button>
              <button 
                className="bg-transparent text-blue-600 border-2 border-blue-600 rounded-xl px-8 py-4 text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 hover:text-white"
                onClick={() => setShowLoginPrompt(false)}
              >
                👀 예시 먼저 보기
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-5">
              💡 팁: 로그인하면 번역 진도, 성과 분석, 개인별 학습 인사이트 등 더 많은 기능을 이용할 수 있어요!
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white bg-opacity-95 rounded-3xl p-8 shadow-2xl backdrop-blur-lg" id="dashboard-root">
        {/* 홈으로 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => (window as any).navigateTo('/')}
            className="flex items-center gap-2 text-lg font-bold text-gray-700 hover:text-blue-700 px-4 py-2 rounded transition"
          >
            <span className="text-2xl">🏠</span>
            <span>홈으로</span>
          </button>
        </div>

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-5 pb-4 border-b-2 border-gray-100">
          <div>
            <h1 className="text-3xl text-gray-800 mb-2 font-bold">안녕하세요, {userName}님! 👋</h1>
            <p className="text-gray-600 text-sm">오늘의 양방향 번역 학습 현황을 확인해보세요</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-3 rounded-xl text-center shadow-lg">
              <div className="text-xl font-bold mb-1">{stats.streakDays}</div>
              <div className="text-xs opacity-90">연속 학습일</div>
            </div>
          </div>
        </div>

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* 통계 카드들 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xl mb-3 text-white">🔄</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{stats.totalTranslations}</div>
              <div className="text-gray-600 text-xs">총 번역 수</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xl mb-3 text-white">✅</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{stats.completedTranslations}</div>
              <div className="text-gray-600 text-xs">완료한 번역</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xl mb-3 text-white">🎯</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{stats.averageScore}점</div>
              <div className="text-gray-600 text-xs">평균 점수</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xl mb-3 text-white">⏱️</div>
              <div className="text-3xl font-bold text-gray-800 mb-2">{formatTime(stats.totalStudyTime)}</div>
              <div className="text-gray-600 text-xs">총 학습 시간</div>
            </div>
          </div>

          {/* 주간 목표 진행도 */}
          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 주간 목표 진행도</h3>
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-40 h-40 transform -rotate-90">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="70" stroke="#e2e8f0" strokeWidth="10" fill="none" />
                <circle cx="80" cy="80" r="70" stroke="url(#progressGradient)" strokeWidth="10" fill="none" 
                  strokeDasharray={2 * Math.PI * 70} 
                  strokeDashoffset={2 * Math.PI * 70 * (1 - stats.weeklyGoal / 100)} 
                  strokeLinecap="round" />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(stats.weeklyGoal)}%</div>
                <div className="text-xs text-gray-600 mt-1">목표 달성</div>
              </div>
            </div>
          </div>

          {/* 일일 학습 시간 차트 */}
          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 일일 학습 시간</h3>
            <div className="h-48">
              <Line data={dailyChartData} options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: { 
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#718096' } }, 
                  x: { grid: { display: false }, ticks: { color: '#718096' } } 
                } 
              }} />
            </div>
          </div>
        </div>

        {/* 성과 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 주간 성과 추이</h3>
            <div className="h-72">
              <Bar data={weeklyChartData} options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'top', labels: { usePointStyle: true, color: '#718096' } } }, 
                scales: { 
                  y: { type: 'linear', display: true, position: 'left', grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#718096' } }, 
                  y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#718096' } }, 
                  x: { grid: { display: false }, ticks: { color: '#718096' } } 
                } 
              }} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 번역 방향별 성과 랭킹</h3>
            {stats.directionRanking.map((item, i) => (
              <div key={i} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 text-sm ${
                  item.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-800' :
                  item.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700' :
                  item.rank === 3 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {item.rank}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm">{item.direction}</div>
                  <div className="text-xs text-gray-600">{item.translationCount}번역 완료</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{item.averageScore}</div>
                  <div className="text-xs text-gray-600">점</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 활동 & AI 인사이트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 최근 번역 활동</h3>
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((item, i) => {
                const { icon, bg } = getDirectionIcon(item.direction);
                return (
                  <div key={i} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mr-3 text-white" style={{ background: bg }}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm">{item.originalText}</div>
                      <div className="text-xs text-gray-600">{item.direction} • {item.difficulty} • {formatTime(item.studyTime)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">{item.averageScore}점</div>
                      <div className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  🚀
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">첫 번째 번역을 시작해보세요!</h4>
                <p className="text-gray-600 mb-4">
                  AI가 제공하는 다양한 문장으로 번역 실력을 키워보세요.
                </p>
                <button
                  onClick={() => (window as any).navigateTo('/')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  번역 학습 시작하기
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 학습 인사이트</h3>
            {stats.insights.map((text, i) => (
              <div key={i} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-3 relative overflow-hidden">
                <div className="text-xs leading-relaxed relative z-10">{text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 다시 로그인 버튼 (로그인 안된 경우에만) */}
        {!currentUser && (
          <div className="mt-8 text-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
            <h3 className="text-xl text-gray-700 mb-2 font-semibold">
              🎯 나만의 번역 학습 대시보드가 필요하신가요?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              지금 로그인하시면 개인별 맞춤 번역 분석과 학습 진도를 관리할 수 있어요!
            </p>
            <button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-xl px-6 py-3 text-lg font-semibold cursor-pointer shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1"
              onClick={() => (window as any).navigateTo('/')}
            >
              💫 나만의 대시보드 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationDashboard;
