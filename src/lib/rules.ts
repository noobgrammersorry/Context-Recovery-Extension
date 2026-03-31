import type { WorkSession } from "./models"

export interface RuleEvaluation {
  passed: boolean
  reasons: string[]
}

export function evaluateInterruptionRules(session: WorkSession): RuleEvaluation {
  const reasons: string[] = []

  // Minimum 5 minutes: must be substantial work
  const minDurationMs = 5 * 60 * 1000
  if (session.totalDurationMs >= minDurationMs) {
    reasons.push("session duration 5+ minutes")
  }

  // 4+ unique URLs: indicates multi-step workflow
  if (session.urls.length >= 4) {
    reasons.push("4+ unique URLs visited")
  }

  // 2+ tab switches: indicates active navigation/work
  if (session.switchCount >= 2) {
    reasons.push("2+ tab switches")
  }

  // 2+ revisits: indicates returning to same work
  if (session.revisitCount >= 2) {
    reasons.push("2+ revisits to same page")
  }

  // Multiple domains: indicates cross-domain workflow (e.g. docs + code + research)
  if (session.domains.length >= 3) {
    reasons.push("work across 3+ domains")
  }

  // Require at least 2 strong signals to flag as interrupted
  // This reduces false positives from brief browsing sessions
  return {
    passed: reasons.length >= 2,
    reasons
  }
}

