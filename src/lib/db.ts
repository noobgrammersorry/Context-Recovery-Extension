import Dexie, { type Table } from "dexie"

import type {
  BrowserEvent,
  ExtensionDbSettings,
  TaskCandidate,
  WorkSession
} from "./models"

class ContextRecoveryDb extends Dexie {
  events!: Table<BrowserEvent, string>
  sessions!: Table<WorkSession, string>
  taskCandidates!: Table<TaskCandidate, string>
  settings!: Table<ExtensionDbSettings, string>

  constructor() {
    super("contextRecoveryDb")

    this.version(1).stores({
      events: "id, timestamp, eventType, domain, tabId",
      sessions: "id, startTime, endTime, status, lastEventAt",
      taskCandidates: "id, sessionId, state, confidenceScore, lastActiveAt",
      settings: "id"
    })
  }
}

export const db = new ContextRecoveryDb()
