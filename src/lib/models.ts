export type BrowserEventType =
  | "tab_open"
  | "tab_update"
  | "tab_switch"
  | "tab_close"
  | "window_focus"
  | "window_blur"

export interface BrowserEvent {
  id: string
  timestamp: number
  tabId?: number
  windowId?: number
  url: string
  domain: string
  title: string
  eventType: BrowserEventType
  browserName?: string // "Chrome", "Firefox", "Edge", etc.
}

export type WorkSessionStatus = "active" | "idle" | "interrupted" | "resumed" | "done"

export interface WorkSession {
  id: string
  startTime: number
  endTime?: number
  eventIds: string[]
  urls: string[]
  domains: string[]
  titles: string[]
  switchCount: number
  revisitCount: number
  totalDurationMs: number
  status: WorkSessionStatus
  lastEventAt: number
  browserHistory: Array<{ browserName: string; timestamp: number }> // Track browser switches
}

export type TaskState = "open" | "dismissed" | "snoozed" | "done"

export interface TaskCandidate {
  id: string
  sessionId: string
  taskLabel: string
  confidenceScore: number
  reasonDetected: string[]
  relatedUrls: string[]
  relatedDomains: string[]
  lastActiveAt: number
  nextSuggestedAction: string
  state: TaskState
}

export interface UserSettings {
  trackingEnabled: boolean
  excludedDomains: string[]
  idleTimeoutMinutes: number
  privacyMode: boolean
}

export interface ExtensionDbSettings {
  id: "user"
  value: UserSettings
}
