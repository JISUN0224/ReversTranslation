# 양방향 번역 챌린지

한국어와 중국어 간의 양방향 번역을 연습할 수 있는 React 애플리케이션입니다.

## 기능

- 🔄 **양방향 번역**: 한국어→중국어, 중국어→한국어 순차 번역
- 🤖 **AI 피드백**: Gemini API를 통한 실시간 번역 피드백
- 📊 **점수 시스템**: 유사도 기반 점수 계산
- ✨ **개선 기능**: 정답 참고 후 번역 개선
- 📈 **세션 분석**: 통계 및 차트 표시
- 🎯 **진행 상태 관리**: 단계별 UI 흐름

## 기술 스택

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env` 파일을 생성하고 다음 API 키들을 설정하세요:
```
# Gemini AI API Key (필수)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (선택사항 - GPT 모델 폴백용)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration (필수)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

⚠️ **보안 주의사항**: `.env` 파일은 절대 Git에 커밋하지 마세요!

3. 개발 서버 실행:
```bash
npm run dev
```

## 사용법

1. **챌린지 시작**: "챌린지 시작" 버튼을 클릭하여 번역 연습을 시작합니다.

2. **한국어→중국어 번역**: 
   - 주어진 한국어 문장을 중국어로 번역합니다.
   - 번역을 제출하면 AI 피드백을 받을 수 있습니다.
   - 정답을 참고하여 번역을 개선할 수 있습니다.

3. **중국어→한국어 번역**:
   - 이전 단계의 중국어 번역을 한국어로 다시 번역합니다.
   - 마찬가지로 AI 피드백과 개선 기능을 제공합니다.

4. **세션 분석**:
   - 번역 결과와 통계를 확인할 수 있습니다.
   - 점수 추이, 정확도, 난이도별 성과 등을 차트로 표시합니다.

## API 설정

Gemini AI API를 사용하려면 Google AI Studio에서 API 키를 발급받아야 합니다:

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. API 키 생성
3. `.env` 파일에 `VITE_GEMINI_API_KEY`로 설정

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── ReverseTranslation.tsx
│   ├── ScoreLineChart.tsx
│   ├── AccuracyDonut.tsx
│   └── DifficultyBarChart.tsx
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── utils/              # 유틸리티 함수
│   ├── translationUtils.ts
│   └── aiFeedback.ts
├── data/               # 샘플 데이터
│   └── sampleProblems.ts
└── App.tsx
```

## 라이선스

MIT License