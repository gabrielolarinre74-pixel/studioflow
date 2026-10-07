export function ProgressRing({ value, color, size = 36 }: { value: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(value * 100)}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-muted" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={4}
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-foreground text-[9px] font-semibold">
        {Math.round(value * 100)}
      </text>
    </svg>
  );
}
