import { getTaskCandidateById } from "~src/lib/storage"

const MAX_RESUME_TABS = 20

function isSafeNavigableUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

export async function resumeTaskById(taskId: string): Promise<boolean> {
  const task = await getTaskCandidateById(taskId)
  if (!task || task.relatedUrls.length === 0) return false

  const safeUrls = task.relatedUrls.filter(isSafeNavigableUrl).slice(0, MAX_RESUME_TABS)
  if (safeUrls.length === 0) return false

  const [firstUrl, ...restUrls] = safeUrls
  const firstTab = await chrome.tabs.create({ url: firstUrl, active: true })

  for (const url of restUrls) {
    await chrome.tabs.create({ url, active: false, windowId: firstTab.windowId })
  }

  if (firstTab.id) {
    await chrome.tabs.update(firstTab.id, { active: true })
  }

  return true
}
