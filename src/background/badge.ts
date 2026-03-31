import { listOpenTaskCandidates } from "~src/lib/storage"

export async function refreshActionBadge(): Promise<void> {
  const openTasks = await listOpenTaskCandidates(200)
  const count = openTasks.length

  if (count <= 0) {
    await chrome.action.setBadgeText({ text: "" })
    return
  }

  await chrome.action.setBadgeBackgroundColor({ color: "#0f766e" })
  await chrome.action.setBadgeText({ text: count > 99 ? "99+" : String(count) })
}
