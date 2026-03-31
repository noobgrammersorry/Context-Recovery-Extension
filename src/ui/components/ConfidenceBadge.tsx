interface ConfidenceBadgeProps {
  score: number
}

export default function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  const level = score >= 0.75 ? "High" : score >= 0.5 ? "Medium" : "Low"
  const color = score >= 0.75 ? "bg-emerald-100 text-emerald-700" : score >= 0.5 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"

  return <span className={`rounded px-2 py-1 text-xs font-medium ${color}`}>{level} ({Math.round(score * 100)}%)</span>
}
