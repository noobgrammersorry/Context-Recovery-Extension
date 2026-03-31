import { extractDomain, isNoisyUrl, normalizeUrl } from "~src/lib/domain"
import type { BrowserEvent, BrowserEventType } from "~src/lib/models"
import { getSettings, saveEvent } from "~src/lib/storage"

import { ingestBrowserEvent } from "./sessionManager"

type TrackCallback = (event: BrowserEvent) => void | Promise<void>

function isExcludedDomain(domain: string, excludedDomains: string[]): boolean {
  const normalizedDomain = domain.toLowerCase()
  return excludedDomains.some((entry) => {
    const normalizedEntry = entry.trim().toLowerCase()
    if (!normalizedEntry) return false
    return (
      normalizedDomain === normalizedEntry ||
      normalizedDomain.endsWith(`.${normalizedEntry}`)
    )
  })
}

function detectBrowserName(): string {
  // Chrome MV3 extensions run only in Chrome
  return "Chrome"
}

async function createBrowserEvent(eventType: BrowserEventType, tab?: chrome.tabs.Tab): Promise<BrowserEvent | null> {
  const settings = await getSettings()
  if (!settings.trackingEnabled) return null

  const url = normalizeUrl(tab?.url)
  if (isNoisyUrl(url)) return null

  const domain = extractDomain(url)
  if (domain && isExcludedDomain(domain, settings.excludedDomains)) return null

  const isPrivacyMode = settings.privacyMode

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    tabId: tab?.id,
    windowId: tab?.windowId,
    url: isPrivacyMode ? "" : url,
    domain,
    title: isPrivacyMode ? "Private tab" : tab?.title ?? "Untitled tab",
    eventType,
    browserName: detectBrowserName()
  }
}

async function persistEvent(event: BrowserEvent, callback?: TrackCallback): Promise<void> {
  await saveEvent(event)
  await ingestBrowserEvent(event)
  if (callback) await callback(event)
}

export function startTabTracking(callback?: TrackCallback): void {
  chrome.tabs.onCreated.addListener(async (tab) => {
    const event = await createBrowserEvent("tab_open", tab)
    if (!event) return
    await persistEvent(event, callback)
  })

  chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
    if (!changeInfo.url && changeInfo.status !== "complete") return
    const event = await createBrowserEvent("tab_update", tab)
    if (!event) return
    await persistEvent(event, callback)
  })

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId)
    const event = await createBrowserEvent("tab_switch", tab)
    if (!event) return
    await persistEvent(event, callback)
  })

  chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    const settings = await getSettings()
    if (!settings.trackingEnabled) return

    const event: BrowserEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tabId,
      windowId: removeInfo.windowId,
      url: "",
      domain: "",
      title: "Closed tab",
      eventType: "tab_close",
      browserName: detectBrowserName()
    }
    await persistEvent(event, callback)
  })

  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    const settings = await getSettings()
    if (!settings.trackingEnabled) return

    const event: BrowserEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      windowId,
      url: "",
      domain: "",
      title: windowId === chrome.windows.WINDOW_ID_NONE ? "Window blur" : "Window focus",
      eventType: windowId === chrome.windows.WINDOW_ID_NONE ? "window_blur" : "window_focus",
      browserName: detectBrowserName()
    }
    await persistEvent(event, callback)
  })
}
