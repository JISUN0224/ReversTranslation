import type { CompletedTranslation } from '../types/index.ts';

interface ScoreLineChartProps {
  translations: CompletedTranslation[];
}

export function ScoreLineChart({ translations }: ScoreLineChartProps) {
  if (!translations.length) {
    return <div className="text-gray-400 text-center py-8">아직 데이터가 없습니다.</div>;
  }
  
  const width = 400;
  const height = 100;
  const pad = 30;
  
  const points = translations.map((t, i) => [
    pad + ((width - 2 * pad) * i) / (translations.length - 1 || 1),
    height - pad - ((height - 2 * pad) * ((t.koToZhScore + t.zhToKoScore) / 2)) / 100
  ]);
  
  const path = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  
  return (
    <svg width={width} height={height} className="w-full max-w-xl">
      <rect x={0} y={0} width={width} height={height} rx={16} fill="#f3f4f6" />
      <polyline 
        fill="none" 
        stroke="#7c3aed" 
        strokeWidth={3} 
        points={points.map(([x, y]) => `${x},${y}`).join(' ')} 
      />
      <path d={path} fill="none" stroke="#6366f1" strokeWidth={2} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#a5b4fc" />
      ))}
      <text x={pad} y={height - 5} fontSize={12} fill="#888">1</text>
      <text x={width - pad} y={height - 5} fontSize={12} fill="#888">{translations.length}</text>
      <text x={pad} y={pad - 10} fontSize={12} fill="#888">100</text>
      <text x={pad} y={height - pad + 15} fontSize={12} fill="#888">0</text>
    </svg>
  );
}
