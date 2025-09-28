import React from 'react';

interface RadarChartProps {
  data: {
    완전성: number;
    가독성: number;
    정확성: number;
    스타일: number;
  };
  size?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, size = 300 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  
  // 4개 축의 각도 (90도씩)
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const labels = ['완전성', '가독성', '정확성', '스타일'];
  
  // 데이터 포인트 계산 (0-5점을 0-1로 정규화)
  const normalizedData = Object.values(data).map(value => value / 5);
  
  // 레이더 차트의 점들 계산
  const points = normalizedData.map((value, index) => {
    const angle = angles[index];
    const x = centerX + Math.cos(angle - Math.PI / 2) * value * radius;
    const y = centerY + Math.sin(angle - Math.PI / 2) * value * radius;
    return { x, y };
  });
  
  // 폴리곤 경로 생성
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';
  
  // 그리드 라인 생성 (1, 2, 3, 4, 5점)
  const gridLines = [];
  for (let i = 1; i <= 5; i++) {
    const gridRadius = (i / 5) * radius;
    const gridPath = angles.map((angle, index) => {
      const x = centerX + Math.cos(angle - Math.PI / 2) * gridRadius;
      const y = centerY + Math.sin(angle - Math.PI / 2) * gridRadius;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
    gridLines.push({ path: gridPath, score: i }); // 점수 정보도 함께 저장
  }
  
  // 축 라인 생성
  const axisLines = angles.map(angle => {
    const x = centerX + Math.cos(angle - Math.PI / 2) * radius;
    const y = centerY + Math.sin(angle - Math.PI / 2) * radius;
    return { x1: centerX, y1: centerY, x2: x, y2: y };
  });
  
  // 라벨 위치 계산 (그래프와 더 가깝게)
  const labelPositions = angles.map(angle => {
    const labelRadius = radius + 50; // 100 → 50으로 줄여서 그래프와 더 가깝게
    const x = centerX + Math.cos(angle - Math.PI / 2) * labelRadius;
    const y = centerY + Math.sin(angle - Math.PI / 2) * labelRadius;
    return { x, y };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size + 200} height={size + 200} className="mb-4" viewBox={`-100 -100 ${size + 200} ${size + 200}`}>
        {/* 그리드 라인 */}
        {gridLines.map((gridLine, index) => (
          <path
            key={index}
            d={gridLine.path}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            opacity="0.6"
          />
        ))}
        
        {/* 축 라인 */}
        {axisLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#9ca3af"
            strokeWidth="2"
          />
        ))}
        
        {/* 데이터 영역 */}
        <path
          d={pathData}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="rgb(59, 130, 246)"
          strokeWidth="3"
        />
        
        {/* 데이터 포인트 */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="6"
            fill="rgb(59, 130, 246)"
            stroke="white"
            strokeWidth="3"
          />
        ))}
        
        {/* 라벨 */}
        {labelPositions.map((pos, index) => (
          <text
            key={index}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-base font-bold fill-gray-800"
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          >
            {labels[index]}
          </text>
        ))}
        
        {/* 점수 라벨 */}
        {gridLines.map((gridLine, index) => {
          const score = gridLine.score; // 저장된 점수 사용
          const labelRadius = (score / 5) * radius; // 정확한 위치 계산
          const x = centerX + Math.cos(-Math.PI / 2) * labelRadius;
          const y = centerY + Math.sin(-Math.PI / 2) * labelRadius + 15; // -15 → +15로 변경하여 아래로 내림
          return (
            <text
              key={index}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-sm font-bold fill-gray-600"
              style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
              {score}
            </text>
          );
        })}
      </svg>
      
      {/* 점수 표시 */}
      <div className="grid grid-cols-2 gap-6 text-base">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="font-bold text-gray-800 text-lg">{key}</span>
            <span className="text-blue-600 font-bold text-xl">{value}/5</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
