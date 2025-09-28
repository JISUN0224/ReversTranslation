import type { AIFeedback, TranslationDirection } from '../types/index.ts';

// Gemini AI 피드백 함수 (fetch 사용)
export async function getAIFeedback(
  originalText: string,
  userTranslation: string,
  direction: TranslationDirection
): Promise<AIFeedback> {
  let prompt = '';
  
  if (direction === 'ko-to-zh') {
      prompt = `한국어 원문: ${originalText}
사용자 번역: ${userTranslation}

한국어를 중국어로 번역한 결과를 4개 기준으로 상세히 분석해서 완전한 JSON으로 답하세요 (중간에 끊지 마세요):

중요: 만약 번역이 실제로 좋다면 솔직하게 높은 점수를 주고 긍정적으로 평가하세요. 굳이 문제를 찾아내려고 하지 마세요. 별로 지적할 게 없으면 그대로 두고 장점을 강조하세요.

분석 시 고려사항:
- 한국어의 조사/어미와 중국어의 어순 차이점
- 한국어의 존댓말/반말과 중국어의 격식 표현 차이
- 한국어의 한자어와 중국어의 간체자 사용 차이
- 한국어의 문장 구조와 중국어의 어순 특성
- 한국어의 문화적 뉘앙스와 중국어 표현의 적절성
- 한국어의 문체와 중국어의 문체 차이점

{
  "score": 85,
  "완전성": 4,
  "가독성": 5,
  "정확성": 3,
  "스타일": 4,
  "완전성피드백": "원문의 '○○○' 부분이 누락되었습니다. 원문: '○○○' → 번역에서 빠진 부분. 한국어의 특정 표현이 중국어로 번역될 때 의미가 축약되거나 생략된 것 같습니다.",
  "가독성피드백": "중국어로 자연스럽게 읽히지만 '○○○' 부분에서 어색함이 있습니다. 한국어의 어순을 그대로 따라 번역하여 중국어다운 표현이 되지 못했습니다.",
  "정확성피드백": "'○○○'에서 문법 오류가 있습니다. '○○○' → '○○○'로 수정 필요. 한국어의 문법 구조를 중국어 문법에 맞게 조정해야 합니다.",
  "스타일피드백": "원문의 격식체 문체가 '○○○' 부분에서 구어체로 바뀌었습니다. 한국어의 문어체 표현을 중국어의 적절한 문체로 번역해야 합니다.",
  "detailed_analysis": [
    {"type": "correct", "text": "今天", "comment": "한국어 '오늘'을 중국어 '今天'으로 정확하게 번역"},
    {"type": "incorrect", "text": "写", "suggestion": "撰写", "comment": "한국어 '쓰다'의 맥락상 '撰写'가 더 적절한 중국어 표현"},
    {"type": "missing", "text": "원문의 '○○○'", "comment": "한국어 원문의 이 부분이 중국어 번역에서 누락됨"},
    {"type": "style_mismatch", "text": "○○○", "suggestion": "○○○", "comment": "한국어의 격식체를 중국어의 적절한 문체로 번역해야 함"},
    {"type": "minor_improvement", "text": "○○○", "suggestion": "○○○", "comment": "한국어 표현을 더 자연스러운 중국어로 개선 가능"}
  ],
  "strengths": ["한국어 원문의 의미를 정확히 전달한 부분들", "중국어다운 자연스러운 표현들"],
  "weaknesses": ["한국어 어순을 그대로 따라 번역한 부분들", "중국어 문법에 맞지 않는 표현들"],
  "suggestions": ["한국어의 문장 구조를 중국어 어순에 맞게 재배열", "중국어의 적절한 조사와 어미 활용", "한국어의 문화적 뉘앙스를 중국어로 자연스럽게 표현"]
}`;
  } else {
      prompt = `중국어 원문: ${originalText}
사용자 번역: ${userTranslation}

중국어를 한국어로 번역한 결과를 4개 기준으로 상세히 분석해서 완전한 JSON으로 답하세요 (중간에 끊지 마세요):

중요: 만약 번역이 실제로 좋다면 솔직하게 높은 점수를 주고 긍정적으로 평가하세요. 굳이 문제를 찾아내려고 하지 마세요. 별로 지적할 게 없으면 그대로 두고 장점을 강조하세요.

분석 시 고려사항:
- 중국어의 어순과 한국어의 어순 차이점
- 중국어의 간체자와 한국어의 한자 사용 차이
- 중국어의 문장 구조와 한국어의 조사/어미 사용
- 중국어의 문화적 뉘앙스와 한국어 표현의 적절성
- 중국어의 문체와 한국어의 문체 차이점

{
  "score": 85,
  "완전성": 4,
  "가독성": 5,
  "정확성": 3,
  "스타일": 4,
  "완전성피드백": "원문의 '○○○' 부분이 누락되었습니다. 원문: '○○○' → 번역에서 빠진 부분. 중국어의 특정 표현이 한국어로 번역될 때 의미가 축약되거나 생략된 것 같습니다.",
  "가독성피드백": "한국어로 자연스럽게 읽히지만 '○○○' 부분에서 어색함이 있습니다. 중국어의 어순을 그대로 따라 번역하여 한국어다운 표현이 되지 못했습니다.",
  "정확성피드백": "'○○○'에서 문법 오류가 있습니다. '○○○' → '○○○'로 수정 필요. 중국어의 문법 구조를 한국어 문법에 맞게 조정해야 합니다.",
  "스타일피드백": "원문의 격식체 문체가 '○○○' 부분에서 구어체로 바뀌었습니다. 중국어의 문어체 표현을 한국어의 적절한 문체로 번역해야 합니다.",
  "detailed_analysis": [
    {"type": "correct", "text": "오늘", "comment": "중국어 '今天'을 한국어 '오늘'로 정확하게 번역"},
    {"type": "incorrect", "text": "쓰다", "suggestion": "작성하다", "comment": "중국어 '写'의 맥락상 '작성하다'가 더 적절한 한국어 표현"},
    {"type": "missing", "text": "원문의 '○○○'", "comment": "중국어 원문의 이 부분이 한국어 번역에서 누락됨"},
    {"type": "style_mismatch", "text": "○○○", "suggestion": "○○○", "comment": "중국어의 격식체를 한국어의 적절한 문체로 번역해야 함"},
    {"type": "minor_improvement", "text": "○○○", "suggestion": "○○○", "comment": "중국어 표현을 더 자연스러운 한국어로 개선 가능"}
  ],
  "strengths": ["중국어 원문의 의미를 정확히 전달한 부분들", "한국어다운 자연스러운 표현들"],
  "weaknesses": ["중국어 어순을 그대로 따라 번역한 부분들", "한국어 문법에 맞지 않는 표현들"],
  "suggestions": ["중국어의 문장 구조를 한국어 어순에 맞게 재배열", "한국어의 조사와 어미를 적절히 활용", "중국어의 문화적 뉘앙스를 한국어로 자연스럽게 표현"]
}`;
  }
  
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    // 모델 fallback 설정 (사용자 요청 순서로 정렬)
    const modelConfigs = [
      {
        name: 'gemini-2.5-flash-lite',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
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
        config: {
          temperature: 0.3,
          max_tokens: 1024
        }
      },
      {
        name: 'gpt-3.5-turbo-0125',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        config: {
          temperature: 0.3,
          max_tokens: 1024
        }
      },
      {
        name: 'gpt-4.1-mini',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        config: {
          temperature: 0.3,
          max_tokens: 1024
        }
      }
    ];

    // Gemini API 호출 함수
    const callGeminiAPI = async (modelConfig: typeof modelConfigs[0]) => {
      console.log(`🔄 AI 피드백: ${modelConfig.name} 모델로 시도 중...`);
      
      const response = await fetch(`${modelConfig.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: modelConfig.config
        })
      });

      if (!response.ok) {
        const errorMessage = `HTTP error! status: ${response.status}`;
        console.log(`⚠️ ${modelConfig.name} 모델 사용 불가: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(`✅ AI 피드백: ${modelConfig.name} 모델 성공!`);
      return response;
    };

    // GPT API 호출 함수
    const callGPTAPI = async (modelConfig: typeof modelConfigs[0]) => {
      console.log(`🔄 AI 피드백: ${modelConfig.name} 모델로 시도 중...`);
      
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.log(`⚠️ ${modelConfig.name} 모델 사용 불가: OpenAI API 키가 설정되지 않음`);
        throw new Error('OpenAI API 키가 설정되지 않았습니다.');
      }
      
      const response = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
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
        const errorMessage = `HTTP error! status: ${response.status}`;
        console.log(`⚠️ ${modelConfig.name} 모델 사용 불가: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(`✅ AI 피드백: ${modelConfig.name} 모델 성공!`);
      return response;
    };

    // 모델들을 순차적으로 시도
    let lastError: Error | null = null;
    let response: Response | null = null;
    let successfulModel: string | null = null;

    for (const modelConfig of modelConfigs) {
      try {
        // 모델에 따라 적절한 API 호출
        if (modelConfig.name.startsWith('gemini')) {
          response = await callGeminiAPI(modelConfig);
        } else if (modelConfig.name.startsWith('gpt')) {
          response = await callGPTAPI(modelConfig);
        }
        successfulModel = modelConfig.name;
        break; // 성공하면 루프 종료
      } catch (error) {
        lastError = error as Error;
        console.log(`🔄 ${modelConfig.name} 모델 실패, 다음 모델 시도...`);
      }
    }

    // 모든 모델이 실패한 경우
    if (!response) {
      const errorMessage = lastError?.message || '모든 모델에서 API 호출이 실패했습니다.';
      if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('unavailable')) {
        throw new Error('현재 AI 서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.');
      }
      throw lastError || new Error('AI 피드백 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }

    console.log(`✅ AI 피드백: ${successfulModel} 모델로 성공!`);
    
    const data = await response.json();
    let text = '';
    
    if (successfulModel?.startsWith('gemini')) {
      // Gemini 응답 처리
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (successfulModel?.startsWith('gpt')) {
      // GPT 응답 처리
      text = data.choices?.[0]?.message?.content || '';
    }
    
    // JSON 파싱 시도
    try {
      // console.log('AI 응답 원본:', text); // 민감 정보 숨김
      
      // JSON 부분 추출
      let jsonText = '';
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        jsonText = jsonMatch[1] || jsonMatch[0];
      } else {
        // JSON 마커가 없으면 전체 텍스트에서 JSON 찾기
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonText = text.substring(jsonStart, jsonEnd + 1);
        } else {
          jsonText = text;
        }
      }
      
      // console.log('추출된 JSON:', jsonText); // 민감 정보 숨김
      
      // JSON 수정 시도 (불완전한 JSON 수정)
      let cleanedJson = jsonText
        .replace(/,\s*}/g, '}')  // 마지막 쉼표 제거
        .replace(/,\s*]/g, ']')  // 배열 마지막 쉼표 제거
        .replace(/([^\\])\\([^\\])/g, '$1\\\\$2')  // 이스케이프 문자 수정
        .trim();
      
      // 불완전한 JSON 수정 (중간에 잘린 경우)
      if (!cleanedJson.endsWith('}')) {
        // 마지막 완전한 객체나 배열을 찾아서 잘라내기
        const lastCompleteBrace = cleanedJson.lastIndexOf('}');
        const lastCompleteBracket = cleanedJson.lastIndexOf(']');
        const lastComplete = Math.max(lastCompleteBrace, lastCompleteBracket);
        
        if (lastComplete > 0) {
          cleanedJson = cleanedJson.substring(0, lastComplete + 1);
        }
        
        // 불완전한 배열이나 객체 수정
        cleanedJson = cleanedJson
          .replace(/,\s*$/, '') // 마지막 쉼표 제거
          .replace(/,\s*$/, '') // 중복 쉼표 제거
          .replace(/,\s*$/, ''); // 한 번 더 제거
        
        // detailed_analysis 배열이 불완전한 경우 수정
        if (cleanedJson.includes('"detailed_analysis": [') && !cleanedJson.includes('"detailed_analysis": []')) {
          const analysisStart = cleanedJson.indexOf('"detailed_analysis": [');
          const afterAnalysis = cleanedJson.substring(analysisStart);
          const analysisEnd = afterAnalysis.indexOf(']');
          
          if (analysisEnd === -1) {
            // detailed_analysis 배열이 완료되지 않은 경우
            const beforeAnalysis = cleanedJson.substring(0, analysisStart);
            const afterAnalysisStart = afterAnalysis.indexOf('[') + 1;
            const analysisContent = afterAnalysis.substring(afterAnalysisStart);
            
            // 마지막 완전한 객체 찾기
            const lastCompleteObject = analysisContent.lastIndexOf('}');
            if (lastCompleteObject > 0) {
              const completeAnalysis = analysisContent.substring(0, lastCompleteObject + 1);
              cleanedJson = beforeAnalysis + '"detailed_analysis": [' + completeAnalysis + ']';
            } else {
              cleanedJson = beforeAnalysis + '"detailed_analysis": []';
            }
          }
        }
        
        // JSON 구조 완성
        if (!cleanedJson.endsWith('}')) {
          cleanedJson += '}';
        }
      }
      
      // console.log('수정된 JSON:', cleanedJson); // 민감 정보 숨김
      
      // JSON 파싱
      let feedbackData;
      try {
        feedbackData = JSON.parse(cleanedJson);
      } catch (parseError) {
        // console.log('JSON 파싱 재시도 중...'); // 민감 정보 숨김
        
        // 더 강력한 JSON 복구 로직
        let recoveredJson = cleanedJson;
        
        // detailed_analysis 배열이 불완전한 경우 처리
        if (recoveredJson.includes('"detailed_analysis": [') && !recoveredJson.includes('"detailed_analysis": []')) {
          const analysisStart = recoveredJson.indexOf('"detailed_analysis": [');
          const beforeAnalysis = recoveredJson.substring(0, analysisStart);
          const afterAnalysis = recoveredJson.substring(analysisStart);
          
          // 배열 내용 추출
          const arrayContent = afterAnalysis.match(/"detailed_analysis": \[([\s\S]*?)(?=\]|$)/);
          if (arrayContent) {
            let arrayItems = arrayContent[1];
            
            // 완전하지 않은 마지막 객체 제거
            const lastCompleteBrace = arrayItems.lastIndexOf('}');
            if (lastCompleteBrace > 0) {
              arrayItems = arrayItems.substring(0, lastCompleteBrace + 1);
            }
            
            // 배열 닫기
            recoveredJson = beforeAnalysis + '"detailed_analysis": [' + arrayItems + ']';
          }
        }
        
        // JSON 닫기
        if (!recoveredJson.endsWith('}')) {
          recoveredJson = recoveredJson.replace(/,\s*$/, '') + '}';
        }
        
        feedbackData = JSON.parse(recoveredJson);
      }
      
      return {
        score: feedbackData.score || 0,
        detailedAnalysis: feedbackData.detailed_analysis || [],
        strengths: feedbackData.strengths || [],
        weaknesses: feedbackData.weaknesses || [],
        suggestions: feedbackData.suggestions || [],
        // 4개 평가 기준
        완전성: feedbackData.완전성 || 0,
        가독성: feedbackData.가독성 || 0,
        정확성: feedbackData.정확성 || 0,
        스타일: feedbackData.스타일 || 0,
        // 각 기준별 상세 피드백
        완전성피드백: feedbackData.완전성피드백 || '분석 중...',
        가독성피드백: feedbackData.가독성피드백 || '분석 중...',
        정확성피드백: feedbackData.정확성피드백 || '분석 중...',
        스타일피드백: feedbackData.스타일피드백 || '분석 중...',
        error: feedbackData.weaknesses?.[0] || '분석 완료',
        improvement: feedbackData.suggestions?.[0] || '계속 연습하세요',
        hint: feedbackData.suggestions?.[1] || '다음에 더 신중하게 번역해보세요'
      };
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      // console.log('파싱 실패한 텍스트:', text); // 민감 정보 숨김
      
      // JSON 파싱 실패 시 텍스트에서 정보 추출
      const lines = text.split('\n').filter((line: string) => line.trim());
      
      // 점수 추출 시도
      let score = 0;
      const scoreMatch = text.match(/"score":\s*(\d+)/);
      if (scoreMatch) {
        score = parseInt(scoreMatch[1]);
      }
      
      // 4개 평가 기준 추출 시도
             let 완전성 = 0, 가독성 = 0, 정확성 = 0, 스타일 = 0;
             const 완전성Match = text.match(/"완전성":\s*(\d+)/);
             const 가독성Match = text.match(/"가독성":\s*(\d+)/);
             const 정확성Match = text.match(/"정확성":\s*(\d+)/);
             const 스타일Match = text.match(/"스타일":\s*(\d+)/);

             if (완전성Match) 완전성 = parseInt(완전성Match[1]);
             if (가독성Match) 가독성 = parseInt(가독성Match[1]);
             if (정확성Match) 정확성 = parseInt(정확성Match[1]);
             if (스타일Match) 스타일 = parseInt(스타일Match[1]);
      
      // 4개 평가 기준 피드백 추출 시도
             let 완전성피드백 = '', 가독성피드백 = '', 정확성피드백 = '', 스타일피드백 = '';
             const 완전성피드백Match = text.match(/"완전성피드백":\s*"([^"]*)"/);
             const 가독성피드백Match = text.match(/"가독성피드백":\s*"([^"]*)"/);
             const 정확성피드백Match = text.match(/"정확성피드백":\s*"([^"]*)"/);
             const 스타일피드백Match = text.match(/"스타일피드백":\s*"([^"]*)"/);

             if (완전성피드백Match) 완전성피드백 = 완전성피드백Match[1];
             if (가독성피드백Match) 가독성피드백 = 가독성피드백Match[1];
             if (정확성피드백Match) 정확성피드백 = 정확성피드백Match[1];
             if (스타일피드백Match) 스타일피드백 = 스타일피드백Match[1];
      
      // 상세 분석 추출 시도 (더 강화된 방법)
      const detailedAnalysis: any[] = [];
      
      // detailed_analysis 배열에서 개별 항목 추출
      const analysisItems = text.match(/"detailed_analysis":\s*\[([\s\S]*?)\]/);
      if (analysisItems) {
        const analysisText = analysisItems[1];
        
        // 각 분석 항목을 개별적으로 추출
        const itemMatches = analysisText.match(/\{[^}]*"type":\s*"([^"]*)"[^}]*"text":\s*"([^"]*)"[^}]*"comment":\s*"([^"]*)"[^}]*\}/g);
        
        if (itemMatches) {
          itemMatches.forEach(item => {
            try {
              const typeMatch = item.match(/"type":\s*"([^"]*)"/);
              const textMatch = item.match(/"text":\s*"([^"]*)"/);
              const commentMatch = item.match(/"comment":\s*"([^"]*)"/);
              const suggestionMatch = item.match(/"suggestion":\s*"([^"]*)"/);
              
              if (typeMatch && textMatch && commentMatch) {
                detailedAnalysis.push({
                  type: typeMatch[1],
                  text: textMatch[1],
                  comment: commentMatch[1],
                  suggestion: suggestionMatch ? suggestionMatch[1] : undefined
                });
              }
            } catch (e) {
              console.log('개별 분석 항목 파싱 실패:', e);
            }
          });
        }
      }
      
      // 기본 형식으로 fallback
      const error = lines.find((line: string) => line.includes('오류:'))?.replace('오류:', '').trim() || 
                   lines.find((line: string) => line.includes('error:'))?.replace('error:', '').trim() || 
                   '분석 완료';
      const improvement = lines.find((line: string) => line.includes('개선점:'))?.replace('개선점:', '').trim() || 
                         lines.find((line: string) => line.includes('improvement:'))?.replace('improvement:', '').trim() || 
                         '계속 연습하세요';
      const hint = lines.find((line: string) => line.includes('힌트:'))?.replace('힌트:', '').trim() || 
                  lines.find((line: string) => line.includes('hint:'))?.replace('hint:', '').trim() || 
                  '다음에 더 신중하게 번역해보세요';
      
      return { 
        score,
        detailedAnalysis,
        strengths: [],
        weaknesses: [],
        suggestions: [],
        // 4개 평가 기준 (추출된 값 또는 기본값)
        완전성: 완전성 || 3,
        가독성: 가독성 || 3,
        정확성: 정확성 || 3,
        스타일: 스타일 || 3,
        // 각 기준별 상세 피드백 (추출된 값 또는 기본값)
        완전성피드백: 완전성피드백 || '기본 분석 완료',
        가독성피드백: 가독성피드백 || '기본 분석 완료',
        정확성피드백: 정확성피드백 || '기본 분석 완료',
        스타일피드백: 스타일피드백 || '기본 분석 완료',
        error, 
        improvement, 
        hint 
      };
    }
  } catch (err) {
    console.error('AI 피드백 요청 실패:', err);
    
    // 서버 과부하나 일시적 오류인 경우
    if (err instanceof Error && (err.message.includes('503') || err.message.includes('과부하'))) {
      return {
        error: '현재 AI 서버가 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
        improvement: '기본 점수와 참고번역을 비교해보세요.',
        hint: '잠시 후 "AI 상세 분석 보기" 버튼을 다시 클릭해보세요.',
        완전성: 0, 가독성: 0, 정확성: 0, 스타일: 0,
        완전성피드백: 'AI 서버 오류', 가독성피드백: 'AI 서버 오류',
        정확성피드백: 'AI 서버 오류', 스타일피드백: 'AI 서버 오류'
      };
    }
    
    // 일반적인 오류
    return {
      error: 'AI 피드백을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
      improvement: '정답과 비교하며 차이점을 찾아보세요',
      hint: '핵심 단어의 정확한 의미를 파악해보세요',
      완전성: 0, 가독성: 0, 정확성: 0, 스타일: 0,
      완전성피드백: 'AI 피드백 오류', 가독성피드백: 'AI 피드백 오류',
      정확성피드백: 'AI 피드백 오류', 스타일피드백: 'AI 피드백 오류'
    };
  }
}
