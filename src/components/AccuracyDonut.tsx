interface AccuracyDonutProps {
  accuracy: number;
}

export function AccuracyDonut({ accuracy }: AccuracyDonutProps) {
  const percent = Math.round(accuracy * 100);
  const r = 36;
  const c = 2 * Math.PI * r;
  
  return (
    <svg width={100} height={100} className="mx-auto block">
      <circle cx={50} cy={50} r={r} fill="#f3f4f6" />
      <circle 
        cx={50} 
        cy={50} 
        r={r} 
        fill="none" 
        stroke="#a5b4fc" 
        strokeWidth={12} 
        strokeDasharray={c} 
        strokeDashoffset={c * (1 - accuracy)} 
        strokeLinecap="round" 
      />
      <text 
        x={50} 
        y={56} 
        textAnchor="middle" 
        fontSize={26} 
        fontWeight="bold" 
        fill="#7c3aed"
      >
        {percent}%
      </text>
    </svg>
  );
}
