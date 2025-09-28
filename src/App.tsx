import { useState, useEffect } from 'react'
import ReverseTranslation from './components/ReverseTranslation.tsx'
import TranslationDashboard from './components/TranslationDashboard.tsx'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname
      if (path === '/dashboard') {
        setCurrentPage('dashboard')
      } else {
        setCurrentPage('home')
      }
    }

    // 초기 로드 시 경로 확인
    handleRouteChange()

    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  // URL 변경 함수
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPage(path === '/dashboard' ? 'dashboard' : 'home')
  }

  // 전역 네비게이션 함수를 window 객체에 추가
  useEffect(() => {
    (window as any).navigateTo = navigateTo
  }, [])

  return (
    <div className="App">
      {currentPage === 'dashboard' ? (
        <TranslationDashboard />
      ) : (
        <ReverseTranslation />
      )}
    </div>
  )
}

export default App
