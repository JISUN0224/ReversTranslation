import React, { useState, useRef } from 'react';
import axios from 'axios';

interface ChatbotWidgetProps {
  initialContext: string; // 현재 단계별 컨텍스트
  currentStep?: string; // 현재 단계 정보
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 모델 fallback 설정 (다른 AI 모델들과 동일한 순서)
const modelConfigs = [
  {
    name: 'gemini-2.5-flash-lite',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    type: 'gemini',
    config: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  },
  {
    name: 'gemini-1.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    type: 'gemini',
    config: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  },
  {
    name: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    type: 'gemini',
    config: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  },
  {
    name: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    type: 'gpt',
    config: {
      temperature: 0.3,
      max_tokens: 1024
    }
  },
  {
    name: 'gpt-3.5-turbo-0125',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    type: 'gpt',
    config: {
      temperature: 0.3,
      max_tokens: 1024
    }
  },
  {
    name: 'gpt-4.1-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    type: 'gpt',
    config: {
      temperature: 0.3,
      max_tokens: 1024
    }
  }
];

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ initialContext, currentStep }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gemini API 호출 함수
  const callGeminiAPI = async (modelConfig: typeof modelConfigs[0], prompt: string, apiKey: string) => {
    console.log(`🔄 챗봇: ${modelConfig.name} 모델로 시도 중...`);
    
    const response = await axios.post(`${modelConfig.endpoint}?key=${apiKey}`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: modelConfig.config
    }, { headers: { 'Content-Type': 'application/json' } });

    if (!response.data.candidates || !response.data.candidates[0]) {
      throw new Error('API 응답에 candidates가 없습니다.');
    }

    console.log(`✅ 챗봇: ${modelConfig.name} 모델 성공!`);
    return response.data;
  };

  // GPT API 호출 함수
  const callGPTAPI = async (modelConfig: typeof modelConfigs[0], prompt: string, apiKey: string) => {
    console.log(`🔄 챗봇: ${modelConfig.name} 모델로 시도 중...`);
    
    const response = await axios.post(modelConfig.endpoint, {
      model: modelConfig.name,
      messages: [{ role: 'user', content: prompt }],
      temperature: modelConfig.config.temperature,
      max_tokens: modelConfig.config.max_tokens
    }, { 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      } 
    });

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error('API 응답에 choices가 없습니다.');
    }

    console.log(`✅ 챗봇: ${modelConfig.name} 모델 성공!`);
    return response.data;
  };

  // 모델 폴백을 사용한 API 호출
  const sendMessage = async (userMessage: string) => {
    setLoading(true);
    setError(null);
    try {
      // 단계별 프롬프트 생성
      let prompt = '';
      
      if (currentStep === 'ko-to-zh') {
        prompt = `당신은 한국어-중국어 번역 전문가입니다.

【현재 상황】
• 단계: 1단계 한국어 → 중국어 번역
• ${initialContext}

【번역 가이드라인】
• 자연스러운 중국어 표현 사용
• 한국어의 뉘앙스와 문화적 맥락 고려
• 문법적으로 정확한 중국어 문장 구성
• 구어체와 문어체 구분하여 사용

【답변 규칙】
- 간결하고 실용적으로 답변
- 구체적인 번역 예시 제공
- 문법 설명 시 쉽게 이해할 수 있도록 설명
- "**" 같은 강조 기호 사용 금지
- 번호나 • 기호로 구조화

질문: ${userMessage}`;
      } else if (currentStep === 'zh-to-ko') {
        prompt = `당신은 중국어-한국어 번역 전문가입니다.

【현재 상황】
• 단계: 2단계 중국어 → 한국어 번역
• ${initialContext}

【번역 가이드라인】
• 자연스러운 한국어 표현 사용
• 중국어의 의미를 정확히 파악하여 한국어로 전달
• 한국어의 조사와 어미 활용
• 문맥에 맞는 적절한 존댓말/반말 선택

【답변 규칙】
- 간결하고 실용적으로 답변
- 구체적인 번역 예시 제공
- 문법 설명 시 쉽게 이해할 수 있도록 설명
- "**" 같은 강조 기호 사용 금지
- 번호나 • 기호로 구조화

질문: ${userMessage}`;
      } else {
        prompt = `당신은 한국어-중국어 양방향 번역 전문가입니다.

【현재 상황】
• ${initialContext}

【번역 전문 지식】
• 한국어와 중국어의 언어적 차이점
• 문화적 뉘앙스 전달 방법
• 문법 구조 비교 및 변환
• 번역 품질 평가 기준

【답변 규칙】
- 간결하고 실용적으로 답변
- 구체적인 예시와 설명 제공
- 학습자가 이해하기 쉽도록 설명
- "**" 같은 강조 기호 사용 금지
- 번호나 • 기호로 구조화

질문: ${userMessage}`;
      }
      
      // 모델들을 순차적으로 시도
      let lastError: Error | null = null;
      let data: any = null;
      let successfulModel: string | null = null;

      for (const modelConfig of modelConfigs) {
        try {
          // 모델에 따라 적절한 API 호출
          if (modelConfig.type === 'gemini') {
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!geminiApiKey) {
              console.log(`⚠️ ${modelConfig.name} 모델 사용 불가: Gemini API 키가 설정되지 않음`);
              throw new Error('Gemini API 키가 설정되지 않았습니다.');
            }
            data = await callGeminiAPI(modelConfig, prompt, geminiApiKey);
          } else if (modelConfig.type === 'gpt') {
            const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (!openaiApiKey) {
              console.log(`⚠️ ${modelConfig.name} 모델 사용 불가: OpenAI API 키가 설정되지 않음`);
              throw new Error('OpenAI API 키가 설정되지 않았습니다.');
            }
            data = await callGPTAPI(modelConfig, prompt, openaiApiKey);
          }
          successfulModel = modelConfig.name;
          break; // 성공하면 루프 종료
        } catch (error) {
          lastError = error as Error;
          console.log(`🔄 챗봇: ${modelConfig.name} 모델 실패, 다음 모델 시도...`);
        }
      }

      // 모든 모델이 실패한 경우
      if (!data) {
        const errorMessage = lastError?.message || '모든 모델에서 API 호출이 실패했습니다.';
        throw new Error(errorMessage);
      }

      console.log(`✅ 챗봇: ${successfulModel} 모델로 답변 생성 성공!`);

      let answer: string;
      
      if (successfulModel?.startsWith('gemini')) {
        // Gemini 응답 처리
        answer = data.candidates[0].content.parts[0].text;
      } else if (successfulModel?.startsWith('gpt')) {
        // GPT 응답 처리
        answer = data.choices[0].message.content;
      } else {
        throw new Error('알 수 없는 모델 응답 형식입니다.');
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: answer }
      ]);
      setInput('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      setError(`AI 모델 호출에 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 전송 핸들러
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  // 최소화/닫기
  if (!open) {
    return (
      <div style={{ position: 'fixed', right: 32, bottom: 32, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: 8, color: '#2563eb', fontWeight: 600, fontSize: '1.05rem', background: 'rgba(237,242,255,0.95)', borderRadius: 8, padding: '4px 14px', boxShadow: '0 2px 8px #2563eb11' }}>
          번역 도우미
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#2563eb',
            color: '#fff',
            fontSize: '1.5rem',
            boxShadow: '0 2px 12px rgba(30,64,175,0.13)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="번역 도우미 챗봇 열기"
        >
          🤖
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 32,
        bottom: 32,
        width: 360,
        maxWidth: '90vw',
        height: 600,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(30,64,175,0.13)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div style={{
        background: '#2563eb',
        color: '#fff',
        padding: '12px 20px',
        fontWeight: 700,
        fontSize: '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        번역 도우미
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}
          title="닫기"
        >×</button>
      </div>
      {/* 대화 내역 */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#f8fafc' }}>
        <div style={{ color: '#888', fontSize: '0.98em', marginBottom: 10 }}>
          번역에 대해 궁금한 점이 있으시면 언제든 질문해보세요!<br/>
          <span style={{ color: '#2563eb', fontWeight: 600 }}>현재 상황:</span>
          <div style={{ background: '#eef2ff', color: '#222', borderRadius: 8, padding: 8, margin: '8px 0', fontSize: '0.97em', maxHeight: 80, overflow: 'auto' }}>
            {initialContext.slice(0, 400)}{initialContext.length > 400 ? '...' : ''}
          </div>
        </div>
        {messages.length === 0 && (
          <div style={{ color: '#bbb', fontSize: '0.98em', textAlign: 'center', marginTop: 40 }}>
            번역 관련 질문을 입력해보세요!
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: 12,
            textAlign: msg.role === 'user' ? 'right' : 'left',
          }}>
            <div style={{
              display: 'inline-block',
              background: msg.role === 'user' ? '#dbeafe' : '#fff',
              color: '#222',
              borderRadius: 8,
              padding: '8px 12px',
              maxWidth: '80%',
              fontSize: '1em',
              boxShadow: msg.role === 'user' ? '0 1px 4px #93c5fd33' : '0 1px 4px #e0e7ff33',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>
      {/* 입력창 */}
      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid #e5e7eb', background: '#ffffff', padding: 10 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="번역에 대해 질문해보세요..."
          style={{
            flex: 1,
            border: '1px solid #d1d5db',
            outline: 'none',
            background: '#ffffff',
            fontSize: '1em',
            padding: '8px 12px',
            color: '#111827',
            borderRadius: '6px',
            marginRight: '8px',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
          disabled={loading}
        />
        <button
          type="submit"
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '1em',
          }}
          disabled={loading || !input.trim()}
        >
          {loading ? '전송 중...' : '전송'}
        </button>
      </form>
    </div>
  );
};

export default ChatbotWidget;
