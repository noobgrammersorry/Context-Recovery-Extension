import type { WorkSession } from "~src/lib/models"
import { formatDuration, formatTimestamp } from "~src/lib/time"

interface SessionCardProps {
  session: WorkSession
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-medium">{session.status.toUpperCase()}</p>
      <p>Start: {formatTimestamp(session.startTime)}</p>
      <p>Duration: {formatDuration(session.totalDurationMs)}</p>
    </article>
  )
}
