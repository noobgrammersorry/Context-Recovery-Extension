import { db } from "./db"
import type {
  BrowserEvent,
  TaskCandidate,
  UserSettings,
  WorkSession
} from "./models"

const DEFAULT_SETTINGS: UserSettings = {
  trackingEnabled: true,
  excludedDomains: [],
  idleTimeoutMinutes: 5,
  privacyMode: false
}

function normalizeSettings(settings: Partial<UserSettings> | undefined): UserSettings {
  return {
    trackingEnabled:
      typeof settings?.trackingEnabled === "boolean"
        ? settings.trackingEnabled
        : DEFAULT_SETTINGS.trackingEnabled,
    excludedDomains: Array.isArray(settings?.excludedDomains)
      ? settings.excludedDomains.filter((domain) => typeof domain === "string")
      : DEFAULT_SETTINGS.excludedDomains,
    idleTimeoutMinutes:
      typeof settings?.idleTimeoutMinutes === "number" && Number.isFinite(settings.idleTimeoutMinutes)
        ? Math.min(120, Math.max(1, Math.round(settings.idleTimeoutMinutes)))
        : DEFAULT_SETTINGS.idleTimeoutMinutes,
    privacyMode:
      typeof settings?.privacyMode === "boolean" ? settings.privacyMode : DEFAULT_SETTINGS.privacyMode
  }
}

export async function saveEvent(event: BrowserEvent): Promise<void> {
  await db.events.put(event)
}

export async function listRecentEvents(limit = 100): Promise<BrowserEvent[]> {
  const items = await db.events.orderBy("timestamp").reverse().limit(limit).toArray()
  return items
}

export async function upsertSession(session: WorkSession): Promise<void> {
  await db.sessions.put(session)
}

export async function listRecentSessions(limit = 25): Promise<WorkSession[]> {
  const items = await db.sessions.orderBy("startTime").reverse().limit(limit).toArray()
  return items
}

export async function listClosedSessions(limit = 50): Promise<WorkSession[]> {
  return db.sessions
    .where("status")
    .equals("idle")
    .reverse()
    .sortBy("lastEventAt")
    .then((items) => items.slice(0, limit))
}

export async function getSessionById(sessionId: string): Promise<WorkSession | undefined> {
  return db.sessions.get(sessionId)
}

export async function getActiveSession(): Promise<WorkSession | undefined> {
  return db.sessions.where("status").equals("active").last()
}

export async function getSettings(): Promise<UserSettings> {
  const record = await db.settings.get("user")
  return normalizeSettings(record?.value)
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put({ id: "user", value: normalizeSettings(settings) })
}

export async function saveTaskCandidate(task: TaskCandidate): Promise<void> {
  await db.taskCandidates.put(task)
}

export async function getTaskCandidateById(taskId: string): Promise<TaskCandidate | undefined> {
  return db.taskCandidates.get(taskId)
}

export async function getTaskCandidateBySessionId(
  sessionId: string
): Promise<TaskCandidate | undefined> {
  return db.taskCandidates.where("sessionId").equals(sessionId).first()
}

export async function listTaskCandidates(limit = 100): Promise<TaskCandidate[]> {
  const items = await db.taskCandidates.orderBy("lastActiveAt").reverse().limit(limit).toArray()
  return items
}

export async function listOpenTaskCandidates(limit = 25): Promise<TaskCandidate[]> {
  return db.taskCandidates
    .where("state")
    .equals("open")
    .reverse()
    .sortBy("lastActiveAt")
    .then((items) => items.slice(0, limit))
}

export async function updateTaskCandidateState(
  taskId: string,
  state: TaskCandidate["state"]
): Promise<void> {
  await db.taskCandidates.update(taskId, { state })
}

export async function updateSessionStatus(
  sessionId: string,
  status: WorkSession["status"]
): Promise<void> {
  await db.sessions.update(sessionId, { status })
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.events, db.sessions, db.taskCandidates, async () => {
    await db.events.clear()
    await db.sessions.clear()
    await db.taskCandidates.clear()
  })
}
