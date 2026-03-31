import type { WorkSession } from "./models"

export function buildTaskLabel(session: WorkSession): string {
  if (session.urls.length >= 5) return "Interrupted research session"
  if (session.revisitCount > 1) return "Unfinished comparison task"
  return "Unfinished follow-up workflow"
}
