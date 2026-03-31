import { buildTaskLabel } from "~src/lib/labeling"
import type { TaskCandidate } from "~src/lib/models"
import { evaluateInterruptionRules } from "~src/lib/rules"
import { computeConfidenceScore } from "~src/lib/scoring"
import { isIdleGap, minutesToMs } from "~src/lib/time"
import {
  getActiveSession,
  getSettings,
  getTaskCandidateBySessionId,
  listClosedSessions,
  saveTaskCandidate,
  upsertSession
} from "~src/lib/storage"
import { refreshActionBadge } from "./badge"

const DEBUG_PREFIX = "[ContextRecoveryDebug]"
const NOTIFICATION_COOLDOWN_MINUTES = 30
const NOTIFICATION_STATE_KEY = "interruptionNotificationStateBySession"
const NEW_INTERRUPTION_FLAG_KEY = "hasNewInterruption"
const MUST_RECOVER_CONFIDENCE_THRESHOLD = 0.75
const MUST_RECOVER_MIN_REASONS = 3
const DASHBOARD_NOTIFICATIONS_ENABLED = false
const NOTIFICATION_CONFIDENCE_THRESHOLD = 0.8

interface NotificationStateBySession {
  [sessionId: string]: number
}

function debugLog(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.debug(`${DEBUG_PREFIX} ${message}`, data)
    return
  }

  console.debug(`${DEBUG_PREFIX} ${message}`)
}

async function notifyContentScript(task: TaskCandidate): Promise<boolean> {
  // Try active tab first; fall back to another regular web tab in current window.
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true })
    const sortedTabs = [...tabs].sort((a, b) => Number(b.active) - Number(a.active))

    const payload = {
      type: "NOTIFY_INTERRUPTION" as const,
      task: {
        id: task.id,
        taskLabel: task.taskLabel,
        relatedDomains: task.relatedDomains,
        urls: task.relatedUrls,
        confidence: task.confidenceScore
      }
    }

    for (const tab of sortedTabs) {
      if (!tab.id || !tab.url) continue
      if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) continue

      try {
        await chrome.tabs.sendMessage(tab.id, payload)
        debugLog("Notification delivered to tab", {
          tabId: tab.id,
          url: tab.url,
          taskId: task.id
        })
        return true
      } catch {
        debugLog("Notification failed for tab, trying next", {
          tabId: tab.id,
          url: tab.url,
          taskId: task.id
        })
        // Keep trying next candidate tab.
      }
    }
  } catch (error) {
    console.debug("Could not notify content script:", error)
  }

  return false
}

async function shouldNotifySession(sessionId: string): Promise<boolean> {
  const now = Date.now()
  const data = await chrome.storage.local.get(NOTIFICATION_STATE_KEY)
  const state = (data[NOTIFICATION_STATE_KEY] as NotificationStateBySession | undefined) ?? {}
  const lastNotifiedAt = state[sessionId] ?? 0
  const cooldownMs = NOTIFICATION_COOLDOWN_MINUTES * 60 * 1000

  if (now - lastNotifiedAt < cooldownMs) {
    debugLog("Skipping notification due to cooldown", {
      sessionId,
      lastNotifiedAt,
      nextAllowedAt: lastNotifiedAt + cooldownMs
    })
    return false
  }

  return true
}

async function recordNotification(sessionId: string): Promise<void> {
  const now = Date.now()
  const data = await chrome.storage.local.get(NOTIFICATION_STATE_KEY)
  const state = (data[NOTIFICATION_STATE_KEY] as NotificationStateBySession | undefined) ?? {}
  state[sessionId] = now
  await chrome.storage.local.set({ [NOTIFICATION_STATE_KEY]: state })
}

async function maybeNotifyTask(task: TaskCandidate): Promise<void> {
  if (!DASHBOARD_NOTIFICATIONS_ENABLED) {
    debugLog("Skipping notification because dashboard notifications are disabled", {
      taskId: task.id,
      sessionId: task.sessionId
    })
    return
  }

  if (task.confidenceScore < NOTIFICATION_CONFIDENCE_THRESHOLD) {
    debugLog("Skipping notification because confidence is below notification threshold", {
      taskId: task.id,
      sessionId: task.sessionId,
      confidenceScore: task.confidenceScore,
      notificationThreshold: NOTIFICATION_CONFIDENCE_THRESHOLD
    })
    return
  }

  const allowNotify = await shouldNotifySession(task.sessionId)
  if (!allowNotify) return

  const delivered = await notifyContentScript(task)
  if (!delivered) return

  await recordNotification(task.sessionId)
}

async function closeActiveSessionIfIdle(): Promise<void> {
  const [settings, activeSession] = await Promise.all([getSettings(), getActiveSession()])
  if (!activeSession) return

  const idleMs = minutesToMs(settings.idleTimeoutMinutes)
  const now = Date.now()
  if (!isIdleGap(activeSession.lastEventAt, now, idleMs)) return

  debugLog("Auto-closing idle active session", {
    sessionId: activeSession.id,
    idleTimeoutMinutes: settings.idleTimeoutMinutes,
    lastEventAt: activeSession.lastEventAt,
    now
  })

  await upsertSession({
    ...activeSession,
    endTime: activeSession.lastEventAt,
    totalDurationMs: activeSession.lastEventAt - activeSession.startTime,
    status: "idle"
  })
}

export async function runInterruptionDetection(limit = 50): Promise<{ created: number }> {
  await closeActiveSessionIfIdle()

  const sessions = await listClosedSessions(limit)
  let created = 0

  debugLog("Running interruption detection", { limit, closedSessions: sessions.length })

  for (const session of sessions) {
    const existing = await getTaskCandidateBySessionId(session.id)
    if (existing) {
      if (existing.state === "open") {
        await maybeNotifyTask(existing)
      }
      continue
    }

    const evaluation = evaluateInterruptionRules(session)
    if (!evaluation.passed) continue

    const confidenceScore = computeConfidenceScore(session)
    if (
      confidenceScore < MUST_RECOVER_CONFIDENCE_THRESHOLD ||
      evaluation.reasons.length < MUST_RECOVER_MIN_REASONS
    ) {
      debugLog("Skipping candidate because session is below must-recover threshold", {
        sessionId: session.id,
        confidenceScore,
        requiredConfidence: MUST_RECOVER_CONFIDENCE_THRESHOLD,
        reasonCount: evaluation.reasons.length,
        requiredReasons: MUST_RECOVER_MIN_REASONS
      })
      continue
    }

    const candidate = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      taskLabel: buildTaskLabel(session),
      confidenceScore,
      reasonDetected: evaluation.reasons,
      relatedUrls: session.urls,
      relatedDomains: session.domains,
      lastActiveAt: session.lastEventAt,
      nextSuggestedAction: "Reopen related tabs",
      state: "open" as const
    }

    await saveTaskCandidate(candidate)
    await upsertSession({ ...session, status: "interrupted" })
    await chrome.storage.local.set({ [NEW_INTERRUPTION_FLAG_KEY]: true })
    await refreshActionBadge()

    debugLog("Task candidate created", {
      taskId: candidate.id,
      sessionId: candidate.sessionId,
      reasons: candidate.reasonDetected,
      confidenceScore: candidate.confidenceScore
    })
    
    // Notify content script with cooldown protection.
    await maybeNotifyTask(candidate)
    
    created += 1
  }

  return { created }
}
