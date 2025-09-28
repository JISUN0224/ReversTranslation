import type { Problem } from '../types/index.ts';

export const sampleProblems: Problem[] = [
  {
    id: '1',
    korean: '안녕하세요, 오늘 날씨가 정말 좋네요.',
    chinese: '你好，今天天气真好。',
    ChatGPT_번역: '你好，今天天气真好。',
    difficulty: '하',
    field: '일상'
  },
  {
    id: '2',
    korean: '저는 한국어를 배우고 있는 중국 학생입니다.',
    chinese: '我是一名正在学习韩语的中国学生。',
    ChatGPT_번역: '我是一名正在学习韩语的中国学生。',
    difficulty: '중',
    field: '학습'
  },
  {
    id: '3',
    korean: '이번 주말에 친구들과 함께 영화를 보러 갈 예정입니다.',
    chinese: '这个周末我计划和朋友们一起去看电影。',
    ChatGPT_번역: '这个周末我计划和朋友们一起去看电影。',
    difficulty: '중',
    field: '일상'
  },
  {
    id: '4',
    korean: '경제 발전과 환경 보호 사이의 균형을 찾는 것이 중요합니다.',
    chinese: '在经济发展和环境保护之间找到平衡是很重要的。',
    ChatGPT_번역: '在经济发展和环境保护之间找到平衡是很重要的。',
    difficulty: '상',
    field: '사회'
  },
  {
    id: '5',
    korean: '새로운 기술이 우리의 일상생활을 어떻게 변화시키고 있는지 관찰해보세요.',
    chinese: '观察新技术如何改变我们的日常生活。',
    ChatGPT_번역: '观察新技术如何改变我们的日常生活。',
    difficulty: '상',
    field: '기술'
  }
];
