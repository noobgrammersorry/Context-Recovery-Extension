import type { TaskCandidate, WorkSession } from "./models"
import { isWorkLikeDomain } from "./domain"

export function computeConfidenceScore(session: WorkSession): number {
  let score = 0.3

  score += Math.min(0.2, session.urls.length * 0.03)
  score += Math.min(0.2, session.revisitCount * 0.05)
  score += Math.min(0.2, session.totalDurationMs / (10 * 60 * 1000) * 0.2)

  if (session.domains.some(isWorkLikeDomain)) score += 0.1
  if (session.status === "idle") score += 0.1

  return Math.max(0, Math.min(1, Number(score.toFixed(2))))
}

export type RecoveryUrgencyLevel = "critical" | "high" | "medium" | "low"

export interface RecoveryUrgency {
  level: RecoveryUrgencyLevel
  score: number
  label: string
  guidance: string
}

export function computeRecoveryUrgency(task: TaskCandidate, now = Date.now()): RecoveryUrgency {
  const ageMs = Math.max(0, now - task.lastActiveAt)
  const ageHours = ageMs / (60 * 60 * 1000)

  let score = task.confidenceScore

  if (task.reasonDetected.length >= 4) score += 0.1
  if (task.relatedDomains.length >= 3) score += 0.05

  if (ageHours <= 2) score += 0.08
  else if (ageHours <= 8) score += 0.05
  else if (ageHours > 72) score -= 0.06

  const normalized = Math.max(0, Math.min(1, Number(score.toFixed(2))))

  if (normalized >= 0.85) {
    return {
      level: "critical",
      score: normalized,
      label: "Must Recover",
      guidance: "Strong interruption signals and recent context."
    }
  }

  if (normalized >= 0.75) {
    return {
      level: "high",
      score: normalized,
      label: "High Priority",
      guidance: "Likely unfinished work worth recovering now."
    }
  }

  if (normalized >= 0.62) {
    return {
      level: "medium",
      score: normalized,
      label: "Review Soon",
      guidance: "Useful to review, but not urgent."
    }
  }

  return {
    level: "low",
    score: normalized,
    label: "Low Priority",
    guidance: "Weak signal quality. Safe to ignore for now."
  }
}
