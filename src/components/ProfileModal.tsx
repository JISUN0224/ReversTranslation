import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ProfileModalRef {
  refreshTranslations: () => void;
}

interface SavedTranslation {
  id: string;
  originalText: string;
  userTranslation: string;
  referenceTranslation: string;
  score: number;
  timestamp: string;
  direction: 'ko-to-zh' | 'zh-to-ko';
  feedback?: any;
}

export const ProfileModal = forwardRef<ProfileModalRef, ProfileModalProps>(({ isOpen, onClose }, ref) => {
  const { currentUser, logout } = useAuth();
  const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'translations'>('profile');
  const [selectedTranslations, setSelectedTranslations] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      // 모달이 열릴 때 자동으로 번역 탭으로 이동하고 데이터 로드
      setActiveTab('translations');
      loadSavedTranslations();
    }
  }, [isOpen, currentUser]);

  const loadSavedTranslations = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Firebase에서 실제 저장된 번역 데이터 가져오기
      const translationsRef = collection(db, 'reverseTranslations');
      const q = query(
        translationsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const translations: SavedTranslation[] = [];
      
      console.log('Firebase 쿼리 결과:', querySnapshot.size, '개 문서');
      console.log('현재 사용자 ID:', currentUser.uid);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('문서 데이터:', doc.id, data);
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
      
      console.log('파싱된 번역 데이터:', translations);
      
      // 클라이언트에서 시간순 정렬
      translations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setSavedTranslations(translations);
    } catch (error) {
      console.error('저장된 번역 로드 오류:', error);
      setSavedTranslations([]);
    } finally {
      setLoading(false);
    }
  };

  // ref를 통해 외부에서 호출할 수 있는 함수들
  useImperativeHandle(ref, () => ({
    refreshTranslations: loadSavedTranslations
  }));

  // 선택된 번역 토글
  const toggleSelection = (translationId: string) => {
    const newSelected = new Set(selectedTranslations);
    if (newSelected.has(translationId)) {
      newSelected.delete(translationId);
    } else {
      newSelected.add(translationId);
    }
    setSelectedTranslations(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedTranslations.size === savedTranslations.length) {
      setSelectedTranslations(new Set());
    } else {
      setSelectedTranslations(new Set(savedTranslations.map(t => t.id)));
    }
  };

  // 선택된 번역 삭제
  const deleteSelectedTranslations = async () => {
    if (selectedTranslations.size === 0) {
      alert('삭제할 번역을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedTranslations.size}개의 번역을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      
      const deletePromises = Array.from(selectedTranslations).map(translationId => 
        deleteDoc(doc(db, 'reverseTranslations', translationId))
      );
      
      await Promise.all(deletePromises);
      
      alert(`${selectedTranslations.size}개의 번역이 삭제되었습니다.`);
      setSelectedTranslations(new Set());
      loadSavedTranslations(); // 목록 새로고침
    } catch (error) {
      console.error('번역 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentUser?.email}</h2>
              <p className="text-sm text-gray-500">
                {activeTab === 'translations' ? `저장된 번역: ${savedTranslations.length}개` : '프로필'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 토글 탭 */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            프로필
          </button>
          <button
            onClick={() => setActiveTab('translations')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'translations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            내 번역 보기
          </button>
        </div>

        {/* 프로필 탭 */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">계정 정보</h3>
              <p className="text-sm text-gray-600">이메일: {currentUser?.email}</p>
              <p className="text-sm text-gray-600">가입일: {currentUser?.metadata?.creationTime ? 
                new Date(currentUser.metadata.creationTime).toLocaleDateString('ko-KR') : '알 수 없음'}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}

        {/* 번역 목록 탭 */}
        {activeTab === 'translations' && (
          <div className="space-y-4">
            {/* 헤더 및 버튼들 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">저장된 번역</h3>
              <div className="flex gap-2">
                <button
                  onClick={loadSavedTranslations}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                >
                  {loading ? '로딩 중...' : '새로고침'}
                </button>
                {selectedTranslations.size > 0 && (
                  <button
                    onClick={deleteSelectedTranslations}
                    disabled={isDeleting}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 transition-colors"
                  >
                    {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedTranslations.size})`}
                  </button>
                )}
              </div>
            </div>

            {/* 전체 선택 체크박스 */}
            {savedTranslations.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedTranslations.size === savedTranslations.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  전체 선택 ({selectedTranslations.size}/{savedTranslations.length})
                </span>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">로딩 중...</div>
              </div>
            ) : savedTranslations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">저장된 번역이 없습니다.</div>
                <p className="text-sm text-gray-400 mt-2">번역을 작성하고 저장해보세요!</p>
              </div>
            ) : (
              savedTranslations.map((translation) => (
                <div key={translation.id} className={`border rounded-lg p-4 transition-colors ${
                  selectedTranslations.has(translation.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {/* 체크박스 */}
                    <input
                      type="checkbox"
                      checked={selectedTranslations.has(translation.id)}
                      onChange={() => toggleSelection(translation.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                    />
                    
                    {/* 번역 내용 */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            {formatDate(translation.timestamp)}
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              {translation.direction === 'ko-to-zh' ? '한→중' : '중→한'}
                            </span>
                          </div>
                          <div className="font-medium text-gray-900 mb-2">
                            원문: {translation.originalText}
                          </div>
                          <div className="text-blue-600 mb-1">
                            내 번역: {translation.userTranslation}
                          </div>
                          <div className="text-green-600 text-sm">
                            참고 번역: {translation.referenceTranslation}
                          </div>
                          {/* AI 피드백 표시 */}
                          {translation.feedback && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-semibold text-gray-700 mb-2">🤖 AI 피드백</div>
                              
                              {/* 4개 평가 기준 */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {translation.feedback.완전성 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium text-blue-600">완전성:</span> {translation.feedback.완전성}/5점
                                  </div>
                                )}
                                {translation.feedback.가독성 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium text-green-600">가독성:</span> {translation.feedback.가독성}/5점
                                  </div>
                                )}
                                {translation.feedback.정확성 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium text-red-600">정확성:</span> {translation.feedback.정확성}/5점
                                  </div>
                                )}
                                {translation.feedback.스타일 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium text-purple-600">스타일:</span> {translation.feedback.스타일}/5점
                                  </div>
                                )}
                              </div>

                              {/* 상세 피드백 */}
                              <div className="space-y-1">
                                {translation.feedback.완전성피드백 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">완전성:</span> {translation.feedback.완전성피드백}
                                  </div>
                                )}
                                {translation.feedback.가독성피드백 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">가독성:</span> {translation.feedback.가독성피드백}
                                  </div>
                                )}
                                {translation.feedback.정확성피드백 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">정확성:</span> {translation.feedback.정확성피드백}
                                  </div>
                                )}
                                {translation.feedback.스타일피드백 && (
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">스타일:</span> {translation.feedback.스타일피드백}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">점수</div>
                          <div className="text-lg font-bold text-green-600">
                            {translation.score}점
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default ProfileModal;
