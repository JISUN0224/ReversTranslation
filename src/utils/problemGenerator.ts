// AI 문제 생성 유틸리티
import type { Problem } from '../types/index.ts';

// 모델 fallback 설정 (사용자 요청 순서로 정렬)
const modelConfigs = [
  {
    name: 'gemini-2.5-flash-lite',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    config: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512
    }
  },
  {
    name: 'gemini-1.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    config: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512
    }
  },
  {
    name: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    config: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512
    }
  },
  {
    name: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    config: {
      temperature: 0.3,
      max_tokens: 512
    }
  },
  {
    name: 'gpt-3.5-turbo-0125',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    config: {
      temperature: 0.3,
      max_tokens: 512
    }
  },
  {
    name: 'gpt-4.1-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    config: {
      temperature: 0.3,
      max_tokens: 512
    }
  }
];

// Gemini API 호출 함수
const callGeminiAPI = async (modelConfig: typeof modelConfigs[0], prompt: string, apiKey: string) => {
  console.log(`🔄 ${modelConfig.name} 모델로 시도 중...`);
  
  const response = await fetch(`${modelConfig.endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: modelConfig.config
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || response.statusText;
    
    // API limit 관련 에러인지 확인
    const isLimitError = errorMessage.includes('quota') || 
                        errorMessage.includes('limit') || 
                        errorMessage.includes('rate') ||
                        errorMessage.includes('overloaded') ||
                        errorMessage.includes('unavailable') ||
                        response.status === 429 ||
                        response.status === 403 ||
                        response.status === 503;
    
    if (isLimitError) {
      console.log(`⚠️ ${modelConfig.name} 모델 사용 불가 (다른 모델로 전환): ${errorMessage}`);
      throw new Error(`LIMIT_ERROR: ${errorMessage}`);
    } else {
      console.log(`❌ ${modelConfig.name} 모델 에러: ${errorMessage}`);
      throw new Error(`API_ERROR: ${errorMessage}`);
    }
  }

  const data = await response.json();
  console.log(`✅ ${modelConfig.name} 모델 성공!`);
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('API 응답에 candidates가 없습니다.');
  }

  return data;
};

// GPT API 호출 함수
const callGPTAPI = async (modelConfig: typeof modelConfigs[0], prompt: string, apiKey: string) => {
  console.log(`🔄 ${modelConfig.name} 모델로 시도 중...`);
  
  const response = await fetch(modelConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelConfig.name,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: modelConfig.config.temperature,
      max_tokens: modelConfig.config.max_tokens
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = errorData.error?.message || response.statusText;
    
    // API limit 관련 에러인지 확인
    const isLimitError = errorMessage.includes('quota') || 
                        errorMessage.includes('limit') || 
                        errorMessage.includes('rate') ||
                        errorMessage.includes('overloaded') ||
                        errorMessage.includes('unavailable') ||
                        response.status === 429 ||
                        response.status === 403 ||
                        response.status === 503;
    
    if (isLimitError) {
      console.log(`⚠️ ${modelConfig.name} 모델 사용 불가 (다른 모델로 전환): ${errorMessage}`);
      throw new Error(`LIMIT_ERROR: ${errorMessage}`);
    } else {
      console.log(`❌ ${modelConfig.name} 모델 에러: ${errorMessage}`);
      throw new Error(`API_ERROR: ${errorMessage}`);
    }
  }

  const data = await response.json();
  console.log(`✅ ${modelConfig.name} 모델 성공!`);
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('API 응답에 choices가 없습니다.');
  }

  return data;
};

// 번역 문제 생성 함수
export const generateTranslationProblem = async (
  language: '한국어' | '중국어',
  field: string,
  difficulty: '상' | '중' | '하',
  customPrompt?: string
): Promise<Problem> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  // 프롬프트 생성
  const prompt = `Create a ${language} paragraph (3-4 sentences) about ${field} with ${difficulty} difficulty.

${customPrompt ? `Include: ${customPrompt}` : ''}

Return JSON:
{
  "korean": "한국어 문단",
  "chinese": "중국어 번역",
  "difficulty": "${difficulty}",
  "field": "${field}"
}`;

  // console.log('프롬프트:', prompt); // 민감 정보 숨김

  // 모델들을 순차적으로 시도
  let lastError: Error | null = null;
  let data: any = null;
  let successfulModel: string | null = null;

  for (const modelConfig of modelConfigs) {
    try {
      // 모델에 따라 적절한 API 호출
      if (modelConfig.name.startsWith('gemini')) {
        data = await callGeminiAPI(modelConfig, prompt, apiKey);
      } else if (modelConfig.name.startsWith('gpt')) {
        // GPT 모델의 경우 OpenAI API 키 필요
        const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!openaiApiKey) {
          console.log(`⚠️ ${modelConfig.name} 모델 사용 불가: OpenAI API 키가 설정되지 않음`);
          throw new Error(`LIMIT_ERROR: OpenAI API 키가 설정되지 않았습니다.`);
        }
        data = await callGPTAPI(modelConfig, prompt, openaiApiKey);
      }
      successfulModel = modelConfig.name;
      break; // 성공하면 루프 종료
    } catch (error) {
      lastError = error as Error;
      
      // API limit 에러가 아니면 다음 모델 시도하지 않음
      if (!lastError.message.startsWith('LIMIT_ERROR:')) {
        console.log(`❌ ${modelConfig.name} 모델에서 치명적 에러 발생, 다음 모델 시도 중단`);
        break;
      }
      
      console.log(`🔄 ${modelConfig.name} 모델 실패, 다음 모델 시도...`);
    }
  }

  // 모든 모델이 실패한 경우
  if (!data) {
    const errorMessage = lastError?.message || '모든 모델에서 API 호출이 실패했습니다.';
    if (errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
      throw new Error('현재 AI 서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
    }
    throw lastError || new Error('문제 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
  }

  console.log(`✅ ${successfulModel} 모델로 문제 생성 성공!`);

  let generatedText: string;
  
  if (successfulModel?.startsWith('gemini')) {
    // Gemini 응답 처리
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      throw new Error('API 응답 구조가 올바르지 않습니다.');
    }
    generatedText = candidate.content.parts[0].text;
  } else if (successfulModel?.startsWith('gpt')) {
    // GPT 응답 처리
    const choice = data.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new Error('API 응답 구조가 올바르지 않습니다.');
    }
    generatedText = choice.message.content;
  } else {
    throw new Error('알 수 없는 모델 응답 형식입니다.');
  }
  // console.log('생성된 텍스트:', generatedText); // 민감 정보 숨김
  
  if (!generatedText) {
    throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
  }

  // JSON 파싱 시도
  try {
    // JSON 부분만 추출 (```json ... ``` 형태일 수 있음)
    const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     generatedText.match(/\{[\s\S]*\}/);
    
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
    const problemData = JSON.parse(jsonText);
    
    // 데이터 검증 및 정리
    const problem: Problem = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      korean: problemData.korean || problemData.original || '',
      chinese: problemData.chinese || problemData.translation || '',
      ChatGPT_번역: problemData.chinese || problemData.translation || '',
      difficulty: problemData.difficulty || difficulty,
      field: problemData.field || field
    };

    // 필수 필드 검증
    if (!problem.korean || !problem.chinese) {
      throw new Error('생성된 문제에 필수 필드가 누락되었습니다.');
    }

    return problem;
  } catch (parseError) {
    console.error('JSON 파싱 실패:', parseError);
    // console.log('원본 텍스트:', generatedText); // 민감 정보 숨김
    
    // JSON 파싱 실패 시 기본 구조로 문제 생성
    const lines = generatedText.split('\n').filter((line: string) => line.trim());
    const koreanLine = lines.find((line: string) => /[가-힣]/.test(line)) || '';
    const chineseLine = lines.find((line: string) => /[\u4e00-\u9fff]/.test(line)) || '';
    
    if (!koreanLine && !chineseLine) {
      throw new Error('생성된 텍스트에서 한국어나 중국어를 찾을 수 없습니다.');
    }

    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      korean: koreanLine || '샘플 한국어 문장',
      chinese: chineseLine || '샘플 중국어 문장',
      ChatGPT_번역: chineseLine || '샘플 중국어 문장',
      difficulty,
      field
    };
  }
};

// 여러 문제 일괄 생성
export const generateMultipleProblems = async (
  count: number,
  language: '한국어' | '중국어',
  field: string,
  difficulty: '상' | '중' | '하',
  customPrompt?: string
): Promise<Problem[]> => {
  const problems: Problem[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const problem = await generateTranslationProblem(language, field, difficulty, customPrompt);
      problems.push(problem);
      
      // API 호출 간격 조절 (과부하 방지)
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`문제 ${i + 1} 생성 실패:`, error);
      // 실패한 문제는 건너뛰고 계속 진행
    }
  }
  
  return problems;
};
