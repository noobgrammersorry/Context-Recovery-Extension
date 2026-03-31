
import type { BrowserEvent, TaskCandidate, UserSettings, WorkSession } from "~src/lib/models"

export type ExtensionMessage =
  | { type: "GET_TASKS"; limit?: number }
  | { type: "GET_ACTIVITY_LOG"; eventLimit?: number; sessionLimit?: number }
  | { type: "RUN_INTERRUPTION_DETECTION" }
  | { type: "RESUME_TASK"; taskId: string }
  | { type: "DISMISS_TASK"; taskId: string }
  | { type: "SNOOZE_TASK"; taskId: string }
  | { type: "MARK_DONE"; taskId: string }
  | { type: "GET_SETTINGS" }
  | { type: "SET_SETTINGS"; settings: UserSettings }
  | { type: "CLEAR_DATA" }
  | { type: "NOTIFY_INTERRUPTION"; task: TaskCandidate }
  | { type: "OPEN_SIDEPANEL" }

export interface ActivityLogPayload {
  events: BrowserEvent[]
  sessions: WorkSession[]
  diagnostics: {
    activeSessions: number
    idleSessions: number
    avgSessionDurationMs: number
    lastEventAt?: number
  }
}

export interface ExtensionMessageResponseMap {
  GET_TASKS: TaskCandidate[]
  GET_ACTIVITY_LOG: ActivityLogPayload
  RUN_INTERRUPTION_DETECTION: { created: number }
  RESUME_TASK: { resumed: boolean }
  DISMISS_TASK: { updated: boolean }
  SNOOZE_TASK: { updated: boolean }
  MARK_DONE: { updated: boolean }
  GET_SETTINGS: UserSettings
  SET_SETTINGS: { saved: boolean }
  CLEAR_DATA: { cleared: boolean }
  OPEN_SIDEPANEL: { ok: true }
}

export interface ExtensionMessageResponse<T = unknown> {
  ok: boolean
  error?: string
  data?: T
}
