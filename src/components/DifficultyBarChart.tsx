import type { Difficulty } from '../types/index.ts';

interface DifficultyBarChartProps {
  stats: Record<Difficulty, { attempted: number; average: number }>;
}

export function DifficultyBarChart({ stats }: DifficultyBarChartProps) {
  const levels: Difficulty[] = ['상', '중', '하'];
  const colors: Record<Difficulty, string> = { 
    '상': '#f472b6', 
    '중': '#818cf8', 
    '하': '#34d399' 
  };
  
  return (
    <div className="space-y-3">
      {levels.map(lv => (
        <div key={lv} className="flex items-center gap-3">
          <span className="w-10 text-sm font-bold text-gray-700">{lv}</span>
          <div className="flex-1 bg-gray-100 rounded h-6 relative">
            <div 
              className="absolute left-0 top-0 h-6 rounded bg-opacity-80" 
              style={{ 
                width: `${stats[lv].attempted * 10}px`, 
                background: colors[lv], 
                minWidth: 8, 
                transition: 'width 0.5s' 
              }} 
            />
            <div 
              className="absolute left-0 top-0 h-6 rounded bg-opacity-40" 
              style={{ 
                width: `${stats[lv].average}px`, 
                background: colors[lv], 
                minWidth: 8, 
                opacity: 0.5, 
                transition: 'width 0.5s' 
              }} 
            />
          </div>
          <span className="w-16 text-xs text-gray-500">{stats[lv].attempted}회</span>
          <span className="w-12 text-xs text-gray-700 font-bold">{Math.round(stats[lv].average)}점</span>
        </div>
      ))}
    </div>
  );
}
