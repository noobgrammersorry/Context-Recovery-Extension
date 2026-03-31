import {
  clearAllData,
  getSettings,
  listOpenTaskCandidates,
  listRecentEvents,
  listRecentSessions,
  saveSettings,
  updateSessionStatus,
  updateTaskCandidateState
} from "~src/lib/storage"
import type {
  ExtensionMessage,
  ExtensionMessageResponse,
  ExtensionMessageResponseMap
} from "~src/types/messages"

import { runInterruptionDetection } from "./interruptionDetector"
import { resumeTaskById } from "./resumeActions"
import { refreshActionBadge } from "./badge"

const DEBUG_PREFIX = "[ContextRecoveryDebug]"

function debugLog(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.debug(`${DEBUG_PREFIX} ${message}`, data)
    return
  }

  console.debug(`${DEBUG_PREFIX} ${message}`)
}

async function handleMessage(
  message: ExtensionMessage
): Promise<ExtensionMessageResponse<ExtensionMessageResponseMap[keyof ExtensionMessageResponseMap]>> {
  switch (message.type) {
    case "GET_ACTIVITY_LOG": {
      const [events, sessions] = await Promise.all([
        listRecentEvents(message.eventLimit ?? 100),
        listRecentSessions(message.sessionLimit ?? 30)
      ])

      const activeSessions = sessions.filter((session) => session.status === "active").length
      const idleSessions = sessions.filter((session) => session.status === "idle").length
      const avgSessionDurationMs =
        sessions.length > 0
          ? Math.round(sessions.reduce((acc, session) => acc + session.totalDurationMs, 0) / sessions.length)
          : 0

      return {
        ok: true,
        data: {
          events,
          sessions,
          diagnostics: {
            activeSessions,
            idleSessions,
            avgSessionDurationMs,
            lastEventAt: events[0]?.timestamp
          }
        }
      }
    }

    case "GET_TASKS": {
      return { ok: true, data: await listOpenTaskCandidates(message.limit ?? 25) }
    }

    case "RUN_INTERRUPTION_DETECTION": {
      return { ok: true, data: await runInterruptionDetection() }
    }

    case "RESUME_TASK": {
      const resumed = await resumeTaskById(message.taskId)
      if (resumed) {
        const tasks = await listOpenTaskCandidates(100)
        const resumedTask = tasks.find((task) => task.id === message.taskId)
        await updateTaskCandidateState(message.taskId, "done")
        if (resumedTask) {
          await updateSessionStatus(resumedTask.sessionId, "resumed")
        }
        await refreshActionBadge()
      }
      return { ok: true, data: { resumed } }
    }

    case "DISMISS_TASK": {
      await updateTaskCandidateState(message.taskId, "dismissed")
      await refreshActionBadge()
      return { ok: true, data: { updated: true } }
    }

    case "SNOOZE_TASK": {
      await updateTaskCandidateState(message.taskId, "snoozed")
      await refreshActionBadge()
      return { ok: true, data: { updated: true } }
    }

    case "MARK_DONE": {
      await updateTaskCandidateState(message.taskId, "done")
      await refreshActionBadge()
      return { ok: true, data: { updated: true } }
    }

    case "GET_SETTINGS": {
      return { ok: true, data: await getSettings() }
    }

    case "SET_SETTINGS": {
      await saveSettings(message.settings)
      return { ok: true, data: { saved: true } }
    }

    case "CLEAR_DATA": {
      await clearAllData()
      await refreshActionBadge()
      return { ok: true, data: { cleared: true } }
    }

    case "OPEN_SIDEPANEL": {
      // Get the current active tab and open sidepanel for it
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const activeTab = tabs[0]
      debugLog("OPEN_SIDEPANEL received", {
        hasActiveTab: Boolean(activeTab),
        tabId: activeTab?.id,
        windowId: activeTab?.windowId,
        url: activeTab?.url
      })
      if (activeTab?.id) {
        try {
          debugLog("Attempting sidePanel.open by tabId", { tabId: activeTab.id })
          await chrome.sidePanel.open({ tabId: activeTab.id })
          debugLog("sidePanel.open by tabId succeeded", { tabId: activeTab.id })
        } catch (error) {
          try {
            const windowId =
              activeTab.windowId ??
              (await chrome.windows.getCurrent()).id
            if (windowId !== undefined) {
              debugLog("Falling back to sidePanel.open by windowId", { windowId })
              await chrome.sidePanel.open({ windowId })
              debugLog("sidePanel.open by windowId succeeded", { windowId })
            }
          } catch (fallbackError) {
            debugLog("sidePanel.open fallback failed", {
              tabId: activeTab.id,
              windowId: activeTab.windowId,
              error: fallbackError
            })
            console.error("Failed to open sidepanel:", fallbackError)
          }
        }
      }
      return { ok: true, data: { ok: true } }
    }

    default:
      return { ok: false, error: "Unknown message type" }
  }
}

function isTrustedSender(sender: chrome.runtime.MessageSender): boolean {
  // Accept only messages from this extension's own contexts.
  return sender.id === chrome.runtime.id
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isSafeLimit(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
}

function isValidTaskId(value: unknown): boolean {
  return typeof value === "string" && value.length >= 8 && value.length <= 128
}

function isValidUserSettings(value: unknown): boolean {
  if (!isPlainObject(value)) return false

  const trackingEnabled = value.trackingEnabled
  const privacyMode = value.privacyMode
  const idleTimeoutMinutes = value.idleTimeoutMinutes
  const excludedDomains = value.excludedDomains

  if (typeof trackingEnabled !== "boolean") return false
  if (typeof privacyMode !== "boolean") return false
  if (!isSafeLimit(idleTimeoutMinutes, 1, 120)) return false
  if (!Array.isArray(excludedDomains)) return false
  if (!excludedDomains.every((domain) => typeof domain === "string" && domain.length <= 253)) return false

  return true
}

function parseInboundMessage(message: unknown): ExtensionMessage | null {
  if (!isPlainObject(message)) return null
  if (typeof message.type !== "string") return null

  switch (message.type) {
    case "GET_TASKS": {
      if (message.limit === undefined) return { type: "GET_TASKS" }
      if (!isSafeLimit(message.limit, 1, 200)) return null
      return { type: "GET_TASKS", limit: message.limit }
    }

    case "GET_ACTIVITY_LOG": {
      if (message.eventLimit !== undefined && !isSafeLimit(message.eventLimit, 1, 5000)) return null
      if (message.sessionLimit !== undefined && !isSafeLimit(message.sessionLimit, 1, 1000)) return null
      return {
        type: "GET_ACTIVITY_LOG",
        eventLimit: message.eventLimit as number | undefined,
        sessionLimit: message.sessionLimit as number | undefined
      }
    }

    case "RUN_INTERRUPTION_DETECTION":
      return { type: "RUN_INTERRUPTION_DETECTION" }

    case "RESUME_TASK":
    case "DISMISS_TASK":
    case "SNOOZE_TASK":
    case "MARK_DONE": {
      if (!isValidTaskId(message.taskId)) return null
      return { type: message.type, taskId: message.taskId }
    }

    case "GET_SETTINGS":
      return { type: "GET_SETTINGS" }

    case "SET_SETTINGS": {
      if (!isValidUserSettings(message.settings)) return null
      return { type: "SET_SETTINGS", settings: message.settings }
    }

    case "CLEAR_DATA":
      return { type: "CLEAR_DATA" }

    case "OPEN_SIDEPANEL":
      return { type: "OPEN_SIDEPANEL" }

    // NOTIFY_INTERRUPTION is outbound-only from background to content script.
    case "NOTIFY_INTERRUPTION":
      return null

    default:
      return null
  }
}

function isExtensionPageSender(sender: chrome.runtime.MessageSender): boolean {
  if (!sender.url) return false
  const extensionOrigin = chrome.runtime.getURL("")
  return sender.url.startsWith(extensionOrigin)
}

function isAuthorizedForMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): boolean {
  const extensionPage = isExtensionPageSender(sender)
  const contentScript = Boolean(sender.tab?.id)

  switch (message.type) {
    case "OPEN_SIDEPANEL":
      // Allow sidepanel-open request from extension pages and content script notifications.
      return extensionPage || contentScript

    case "GET_TASKS":
    case "GET_ACTIVITY_LOG":
    case "RUN_INTERRUPTION_DETECTION":
    case "RESUME_TASK":
    case "DISMISS_TASK":
    case "SNOOZE_TASK":
    case "MARK_DONE":
    case "GET_SETTINGS":
    case "SET_SETTINGS":
    case "CLEAR_DATA":
      // Restrict state mutation and data reads to extension pages only.
      return extensionPage

    default:
      return false
  }
}

export function registerMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isTrustedSender(sender)) {
      sendResponse({ ok: false, error: "Unauthorized message sender" })
      return false
    }

    const parsedMessage = parseInboundMessage(message)
    if (!parsedMessage) {
      sendResponse({ ok: false, error: "Invalid message payload" })
      return false
    }

    if (!isAuthorizedForMessage(parsedMessage, sender)) {
      sendResponse({ ok: false, error: "Unauthorized sender context" })
      return false
    }

    void handleMessage(parsedMessage)
      .then((response) => sendResponse(response))
      .catch((error: unknown) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unhandled background error"
        })
      })

    return true
  })
}
