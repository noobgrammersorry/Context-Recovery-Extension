import type { BrowserEvent, WorkSession } from "~src/lib/models"
import { getSettings, getActiveSession, upsertSession } from "~src/lib/storage"
import { isIdleGap, minutesToMs } from "~src/lib/time"

function uniquePush(list: string[], value: string): string[] {
  if (!value || list.includes(value)) return list
  return [...list, value]
}

function createSessionFromEvent(event: BrowserEvent): WorkSession {
  return {
    id: crypto.randomUUID(),
    startTime: event.timestamp,
    endTime: undefined,
    eventIds: [event.id],
    urls: event.url ? [event.url] : [],
    domains: event.domain ? [event.domain] : [],
    titles: event.title ? [event.title] : [],
    switchCount: event.eventType === "tab_switch" ? 1 : 0,
    revisitCount: 0,
    totalDurationMs: 0,
    status: "active",
    lastEventAt: event.timestamp,
    browserHistory: event.browserName ? [{ browserName: event.browserName, timestamp: event.timestamp }] : []
  }
}

function appendEventToSession(session: WorkSession, event: BrowserEvent): WorkSession {
  const hasSeenUrl = event.url ? session.urls.includes(event.url) : false
  
  // Track browser switches
  const lastBrowser = session.browserHistory?.[session.browserHistory.length - 1]?.browserName
  const browserHistory = [...(session.browserHistory || [])]
  if (event.browserName && event.browserName !== lastBrowser) {
    browserHistory.push({ browserName: event.browserName, timestamp: event.timestamp })
  }

  return {
    ...session,
    eventIds: [...session.eventIds, event.id],
    urls: event.url ? uniquePush(session.urls, event.url) : session.urls,
    domains: event.domain ? uniquePush(session.domains, event.domain) : session.domains,
    titles: event.title ? uniquePush(session.titles, event.title) : session.titles,
    switchCount: session.switchCount + (event.eventType === "tab_switch" ? 1 : 0),
    revisitCount: session.revisitCount + (hasSeenUrl ? 1 : 0),
    totalDurationMs: event.timestamp - session.startTime,
    lastEventAt: event.timestamp,
    status: "active",
    browserHistory
  }
}

function closeSession(session: WorkSession, endedAt: number): WorkSession {
  return {
    ...session,
    endTime: endedAt,
    totalDurationMs: endedAt - session.startTime,
    status: "idle"
  }
}

export async function ingestBrowserEvent(event: BrowserEvent): Promise<WorkSession> {
  const settings = await getSettings()
  const idleMs = minutesToMs(settings.idleTimeoutMinutes)
  const activeSession = await getActiveSession()

  if (!activeSession) {
    const newSession = createSessionFromEvent(event)
    await upsertSession(newSession)
    return newSession
  }

  if (isIdleGap(activeSession.lastEventAt, event.timestamp, idleMs)) {
    const closed = closeSession(activeSession, activeSession.lastEventAt)
    await upsertSession(closed)

    const reopened = createSessionFromEvent(event)
    await upsertSession(reopened)
    return reopened
  }

  const updated = appendEventToSession(activeSession, event)
  await upsertSession(updated)
  return updated
}
