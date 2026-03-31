import { useEffect, useState } from "react"

import type { TaskCandidate } from "~src/lib/models"
import { computeRecoveryUrgency } from "~src/lib/scoring"

import ConfidenceBadge from "./ConfidenceBadge"
import DomainTagList from "./DomainTagList"
import { AnimatedCard, PremiumButton } from "./animations/AnimatedComponents"

interface TaskCardProps {
  task: TaskCandidate
  onResume?: (taskId: string) => void
  onDismiss?: (taskId: string) => void
  onSnooze?: (taskId: string) => void
  onDone?: (taskId: string) => void
}

export default function TaskCard({
  task,
  onResume,
  onDismiss,
  onSnooze,
  onDone
}: TaskCardProps) {
  const [darkMode, setDarkMode] = useState(false)
  const urgency = computeRecoveryUrgency(task)

  const urgencyColor =
    urgency.level === "critical"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : urgency.level === "high"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : urgency.level === "medium"
          ? "bg-sky-100 text-sky-700 border-sky-200"
          : "bg-slate-100 text-slate-600 border-slate-200"

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true" || document.documentElement.classList.contains("dark")
    setDarkMode(isDark)

    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true" || document.documentElement.classList.contains("dark"))
    }

    window.addEventListener("storage", handleStorageChange)
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      observer.disconnect()
    }
  }, [])

  return (
    <AnimatedCard
      className={`p-5 sm:p-6 border-2 transition-all group ${
        darkMode
          ? "border-slate-700/50 bg-slate-800/40 hover:border-teal-500/30"
          : "border-slate-200/50 bg-white/50 hover:border-teal-400/50"
      }`}
      hoverEffect="glow">
      {/* Header with title and confidence */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className={`text-base font-bold mb-1 transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400 ${
            darkMode ? "text-slate-100" : "text-slate-900"
          }`}>
            {task.taskLabel}
          </h3>
          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{urgency.guidance}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded border px-2 py-1 text-[11px] font-semibold ${urgencyColor}`}>
            {urgency.label}
          </span>
          <ConfidenceBadge score={task.confidenceScore} />
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-1 mb-4">
        <p className={`text-xs font-medium ${
          darkMode ? "text-slate-400" : "text-slate-600"
        }`}>
          📅 {new Date(task.lastActiveAt).toLocaleDateString()} at{" "}
          {new Date(task.lastActiveAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className={`text-xs ${
          darkMode ? "text-slate-500" : "text-slate-500"
        }`}>
          🔍 Detection: {task.reasonDetected.join(", ") || "Unknown"}
        </p>
      </div>

      {/* Related domains */}
      <div className="mb-5">
        <DomainTagList domains={task.relatedDomains} />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <PremiumButton
          variant="primary"
          size="sm"
          onClick={() => onResume?.(task.id)}>
          ↩️ Resume
        </PremiumButton>
        <PremiumButton
          variant="secondary"
          size="sm"
          onClick={() => onSnooze?.(task.id)}>
          💤 Snooze
        </PremiumButton>
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={() => onDismiss?.(task.id)}>
          ✕ Dismiss
        </PremiumButton>
        <PremiumButton
          variant="primary"
          size="sm"
          onClick={() => onDone?.(task.id)}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:shadow-lg hover:shadow-emerald-500/50">
          ✓ Done
        </PremiumButton>
      </div>
    </AnimatedCard>
  )
}
