import {
  Component,
  Suspense,
  lazy,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { formatDuration, formatTimestamp } from "~src/lib/time"
import { sendExtensionMessage } from "~src/lib/messageClient"
import type { BrowserEvent, WorkSession } from "~src/lib/models"
import type { ActivityLogPayload } from "~src/types/messages"

type EventFilter = BrowserEvent["eventType"] | "all"
type SessionFilter = WorkSession["status"] | "all"
type ItemsPerPage = 5 | 10 | 25 | 50
type TimeSpanFilter = "all" | "1h" | "6h" | "24h" | "7d" | "30d"
type DayFilter = "all" | "today" | "yesterday" | "custom"

const DropdownMultiCalendarLazy = lazy(async () => {
  const module = await import("@/components/ui/dropdown-multi-calendar")
  return { default: module.DropdownMultiCalendar }
})

const EVENT_FILTERS: EventFilter[] = [
  "all",
  "tab_open",
  "tab_update",
  "tab_switch",
  "tab_close",
  "window_focus",
  "window_blur"
]

const SESSION_FILTERS: SessionFilter[] = [
  "all",
  "active",
  "idle",
  "interrupted",
  "resumed",
  "done"
]

const FRIENDLY_EVENT_NAMES: Record<EventFilter, string> = {
  all: "All events",
  tab_open: "Tab opened",
  tab_update: "Tab updated",
  tab_switch: "Tab switched",
  tab_close: "Tab closed",
  window_focus: "Window focused",
  window_blur: "Window minimized"
}

const FRIENDLY_SESSION_NAMES: Record<SessionFilter, string> = {
  all: "All sessions",
  active: "Currently active",
  idle: "On break",
  interrupted: "Interrupted",
  resumed: "Reopened",
  done: "Completed"
}

const TIME_SPAN_OPTIONS: Array<{ value: TimeSpanFilter; label: string; durationMs?: number }> = [
  { value: "all", label: "All time" },
  { value: "1h", label: "Last 1 hour", durationMs: 60 * 60 * 1000 },
  { value: "6h", label: "Last 6 hours", durationMs: 6 * 60 * 60 * 1000 },
  { value: "24h", label: "Last 24 hours", durationMs: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "Last 7 days", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { value: "30d", label: "Last 30 days", durationMs: 30 * 24 * 60 * 60 * 1000 }
]

const DAY_FILTER_OPTIONS: Array<{ value: DayFilter; label: string }> = [
  { value: "all", label: "Any day" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "custom", label: "Pick a day" }
]

function toLocalDateKey(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const BROWSER_ICONS: Record<string, string> = {
  chrome: "🔵",
  firefox: "🦊",
  edge: "💙",
  safari: "🧭",
  brave: "🦁",
  unknown: "🌐"
}

function getBrowserIcon(browserName?: string): string {
  if (!browserName) return "🌐"
  const lower = browserName.toLowerCase()
  return BROWSER_ICONS[lower] || BROWSER_ICONS["unknown"]
}

function getMinutesSince(timestamp?: number): string {
  if (!timestamp) return "n/a"
  const msAgo = Date.now() - timestamp
  const mins = Math.max(0, Math.floor(msAgo / 60000))
  return `${mins}m ago`
}

async function fetchActivityLog(): Promise<ActivityLogPayload> {
  const response = await sendExtensionMessage({
    type: "GET_ACTIVITY_LOG",
    eventLimit: 200,
    sessionLimit: 50
  })

  if (!response.ok || !response.data) {
    throw new Error(response.error ?? "Failed to load activity log")
  }

  return response.data
}

class InlineCalendarErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Inline calendar failed, using native date fallback", {
      error,
      errorInfo
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export default function ActivityLog() {
  const [events, setEvents] = useState<BrowserEvent[]>([])
  const [sessions, setSessions] = useState<WorkSession[]>([])
  const [eventFilter, setEventFilter] = useState<EventFilter>("all")
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>("all")
  const [error, setError] = useState<string>()
  const [diagnostics, setDiagnostics] = useState<ActivityLogPayload["diagnostics"]>({
    activeSessions: 0,
    idleSessions: 0,
    avgSessionDurationMs: 0,
    lastEventAt: undefined
  })
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [eventPage, setEventPage] = useState(1)
  const [sessionPage, setSessionPage] = useState(1)
  const [eventsPerPage, setEventsPerPage] = useState<ItemsPerPage>(10)
  const [sessionsPerPage, setSessionsPerPage] = useState<ItemsPerPage>(10)
  const [timeSpanFilter, setTimeSpanFilter] = useState<TimeSpanFilter>("24h")
  const [dayFilter, setDayFilter] = useState<DayFilter>("all")
  const [customDays, setCustomDays] = useState<string[]>([])
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [hasNewInterruption, setHasNewInterruption] = useState(false)
  const filterPopupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const payload = await fetchActivityLog()

        if (!mounted) return
        setEvents(payload.events)
        setSessions(payload.sessions)
        setDiagnostics(payload.diagnostics)
        setError(undefined)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : "Unable to load activity")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 5000)

    const detectInterval = window.setInterval(() => {
      void sendExtensionMessage({ type: "RUN_INTERRUPTION_DETECTION" })
    }, 5000)

    // Load dark mode preference from localStorage
    const isDark = localStorage.getItem("darkMode") === "true"
    setDarkMode(isDark)

    return () => {
      mounted = false
      window.clearInterval(interval)
      window.clearInterval(detectInterval)
    }
  }, [])

  // Toggle dark mode and persist preference
  const toggleDarkMode = () => {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem("darkMode", String(newValue))
    if (newValue) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const openUrl = async (url?: string) => {
    if (!url) return
    try {
      await chrome.tabs.create({ url })
    } catch {
      window.open(url, "_blank")
    }
  }

  const handleSessionOpen = async (session: WorkSession) => {
    const target = session.urls[session.urls.length - 1] ?? session.urls[0]
    await openUrl(target)
  }

  const handleEventOpen = async (event: BrowserEvent) => {
    if (event.tabId !== undefined) {
      try {
        await chrome.tabs.update(event.tabId, { active: true })
        if (event.windowId !== undefined) {
          await chrome.windows.update(event.windowId, { focused: true })
        }
        return
      } catch {
        // Fall back to opening URL when tab no longer exists
      }
    }

    await openUrl(event.url)
  }

  // Apply dark mode on component mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    }
  }, [darkMode])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!filterPopupRef.current) return
      if (event.target instanceof Node && !filterPopupRef.current.contains(event.target)) {
        setIsFilterPopupOpen(false)
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  useEffect(() => {
    let mounted = true

    const loadFlag = async () => {
      const result = await chrome.storage.local.get("hasNewInterruption")
      if (!mounted) return
      setHasNewInterruption(Boolean(result.hasNewInterruption))
    }

    void loadFlag()

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local") return
      if (!changes.hasNewInterruption) return
      setHasNewInterruption(Boolean(changes.hasNewInterruption.newValue))
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      mounted = false
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const activeRangeStart = useMemo(() => {
    const now = Date.now()
    const selectedRange = TIME_SPAN_OPTIONS.find((option) => option.value === timeSpanFilter)
    if (!selectedRange?.durationMs) return 0
    return now - selectedRange.durationMs
  }, [timeSpanFilter])

  const matchesDayFilter = (timestamp: number) => {
    if (dayFilter === "all") return true

    const now = new Date()
    const todayKey = toLocalDateKey(now.getTime())
    if (dayFilter === "today") {
      return toLocalDateKey(timestamp) === todayKey
    }

    if (dayFilter === "yesterday") {
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      return toLocalDateKey(timestamp) === toLocalDateKey(yesterday.getTime())
    }

    if (dayFilter === "custom") {
      if (customDays.length === 0) return true
      return customDays.includes(toLocalDateKey(timestamp))
    }

    return true
  }

  const matchesTimeFilters = (timestamp: number) => {
    const inRange = timeSpanFilter === "all" ? true : timestamp >= activeRangeStart
    return inRange && matchesDayFilter(timestamp)
  }

  const activeFilterSummary = useMemo(() => {
    const timeLabel = TIME_SPAN_OPTIONS.find((option) => option.value === timeSpanFilter)?.label ?? "All time"

    let dayLabel = "Any day"
    if (dayFilter === "today") dayLabel = "Today"
    if (dayFilter === "yesterday") dayLabel = "Yesterday"
    if (dayFilter === "custom") dayLabel = customDays.length > 0 ? `${customDays.length} custom day(s)` : "Custom day"

    return `${timeLabel} • ${dayLabel}`
  }, [customDays, dayFilter, timeSpanFilter])

  const selectedCustomDates = useMemo(
    () =>
      customDays
        .map((value) => {
          const [year, month, day] = value.split("-").map(Number)
          if (!year || !month || !day) return undefined
          return new Date(year, month - 1, day)
        })
        .filter((date): date is Date => Boolean(date)),
    [customDays]
  )

  const filteredEvents = useMemo(
    () =>
      (eventFilter === "all"
        ? events
        : events.filter((event) => event.eventType === eventFilter)
      ).filter((event) => matchesTimeFilters(event.timestamp)),
    [activeRangeStart, customDays, dayFilter, eventFilter, events, timeSpanFilter]
  )

  const filteredSessions = useMemo(
    () =>
      (sessionFilter === "all"
        ? sessions
        : sessions.filter((session) => session.status === sessionFilter)
      ).filter((session) => matchesTimeFilters(session.startTime)),
    [activeRangeStart, customDays, dayFilter, sessionFilter, sessions, timeSpanFilter]
  )

  // Pagination logic for events
  const totalEventPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const paginatedEvents = useMemo(() => {
    const start = (eventPage - 1) * eventsPerPage
    return filteredEvents.slice(start, start + eventsPerPage)
  }, [filteredEvents, eventPage, eventsPerPage])

  // Pagination logic for sessions
  const totalSessionPages = Math.ceil(filteredSessions.length / sessionsPerPage)
  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionsPerPage
    return filteredSessions.slice(start, start + sessionsPerPage)
  }, [filteredSessions, sessionPage, sessionsPerPage])

  const eventsPerMinute = useMemo(() => {
    if (events.length < 2) return 0
    const newest = events[0].timestamp
    const oldest = events[events.length - 1].timestamp
    const minutes = Math.max((newest - oldest) / 60000, 1)
    return Number((events.length / minutes).toFixed(1))
  }, [events])

  return (
    <main className={`min-h-screen transition-colors ${darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}`}>
      {/* Navigation Header */}
      <header className={`border-b ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-0 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 flex-1">
            <nav className="flex gap-0 -mb-px">
              <a
                href="#dashboard"
                className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  darkMode
                    ? "border-transparent text-slate-400 hover:text-slate-300"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}>
                <span className="inline-flex items-center gap-1.5">
                  Dashboard
                  {hasNewInterruption ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
                  ) : null}
                </span>
              </a>
              <a
                href="#activity-log"
                className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  darkMode
                    ? "border-teal-500 text-teal-400"
                    : "border-teal-600 text-teal-600"
                }`}>
                Activity Log
              </a>
            </nav>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative h-9 w-9 overflow-hidden rounded-full border transition-all duration-300 hover:scale-105 ${
              darkMode
                ? "border-slate-600 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-900"
            }`}
            title="Toggle dark mode"
            type="button">
            <span
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                darkMode ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
              }`}>
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                darkMode ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
              }`}>
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className={`flex items-center justify-center py-16 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          <div className="flex flex-col items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${darkMode ? "bg-slate-500" : "bg-slate-300"}`} />
            <p className="text-sm">Analyzing your activity...</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className={`mx-4 mt-4 p-4 rounded-lg border ${darkMode ? "bg-rose-950/40 border-rose-800 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          {error}
        </div>
      ) : null}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        <section className="flex items-start sm:items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className={`text-2xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Activity Log</h2>
            <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Timeline of browser activity and grouped work sessions
            </p>
          </div>
          <div className="relative w-full sm:w-auto" ref={filterPopupRef}>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <span className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{activeFilterSummary}</span>
              <button
                className={`px-3 py-2 rounded text-xs font-medium border transition-colors ${
                  darkMode
                    ? "bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setIsFilterPopupOpen((prev) => !prev)}
                type="button">
                Time Filters
              </button>
            </div>

            {isFilterPopupOpen ? (
              <div className={`absolute right-0 top-11 z-20 w-[min(20rem,calc(100vw-2rem))] max-w-full p-3 rounded-lg border shadow-lg ${darkMode ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`} htmlFor="time-span-filter">
                      Time span
                    </label>
                    <select
                      id="time-span-filter"
                      className={`w-full px-3 py-2 rounded text-xs border transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300 text-slate-900"}`}
                      value={timeSpanFilter}
                      onChange={(e) => {
                        setTimeSpanFilter(e.target.value as TimeSpanFilter)
                        setEventPage(1)
                        setSessionPage(1)
                      }}>
                      {TIME_SPAN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`} htmlFor="day-filter">
                      Day
                    </label>
                    <select
                      id="day-filter"
                      className={`w-full px-3 py-2 rounded text-xs border transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-white border-slate-300 text-slate-900"}`}
                      value={dayFilter}
                      onChange={(e) => {
                        const nextDayFilter = e.target.value as DayFilter
                        setDayFilter(nextDayFilter)
                        setIsCalendarOpen(nextDayFilter === "custom")
                        setEventPage(1)
                        setSessionPage(1)
                      }}>
                      {DAY_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs mb-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`} htmlFor="custom-day-filter">
                      Custom date(s)
                    </label>
                    <button
                      id="custom-day-filter"
                      className={`w-full px-3 py-2 rounded text-xs border text-left transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100 hover:bg-slate-600" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-50"}`}
                      onClick={() => {
                        setDayFilter("custom")
                        setIsCalendarOpen((prev) => !prev)
                      }}
                      type="button">
                      {customDays.length > 0 ? `${customDays.length} date(s) selected` : "Pick dates"}
                    </button>

                    {isCalendarOpen ? (
                      <div className="mt-2">
                        <InlineCalendarErrorBoundary
                          fallback={
                            <div className={`rounded-lg border p-3 ${darkMode ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
                              <label className={`mb-2 block text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`} htmlFor="custom-day-fallback">
                                Fallback custom date
                              </label>
                              <input
                                id="custom-day-fallback"
                                className={`w-full rounded border px-3 py-2 text-xs ${darkMode ? "border-slate-600 bg-slate-700 text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
                                type="date"
                                onChange={(event) => {
                                  if (!event.target.value) return
                                  setDayFilter("custom")
                                  setCustomDays([event.target.value])
                                  setEventPage(1)
                                  setSessionPage(1)
                                  setIsCalendarOpen(false)
                                }}
                              />
                            </div>
                          }>
                          <Suspense
                            fallback={
                              <div className={`rounded-lg border p-3 text-xs ${darkMode ? "border-slate-600 bg-slate-800 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
                                Loading calendar...
                              </div>
                            }>
                            <DropdownMultiCalendarLazy
                              className={darkMode ? "bg-slate-800" : "bg-white"}
                              initialDates={selectedCustomDates}
                              onCancel={() => setIsCalendarOpen(false)}
                              onConfirm={(dates) => {
                                const nextCustomDays = dates
                                  .map((date) => toLocalDateKey(date.getTime()))
                                  .sort((a, b) => a.localeCompare(b))

                                setDayFilter("custom")
                                setCustomDays(nextCustomDays)
                                setEventPage(1)
                                setSessionPage(1)
                                setIsCalendarOpen(false)
                              }}
                            />
                          </Suspense>
                        </InlineCalendarErrorBoundary>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Diagnostics Grid */}
        <section className={`grid grid-cols-2 md:grid-cols-4 gap-3`}>
          {[
            {
              label: "Activity Level",
              value: `${eventsPerMinute}`,
              subtext: "events/min"
            },
            { label: "On Break", value: `${diagnostics.idleSessions}`, subtext: "sessions" },
            { label: "Avg Session", value: formatDuration(diagnostics.avgSessionDurationMs), subtext: "" },
            { label: "Last Active", value: getMinutesSince(diagnostics.lastEventAt), subtext: "" }
          ].map((stat, idx) => (
            <div
              key={idx}
                className={`p-4 rounded-lg border transition-all ${
                darkMode
                  ? "bg-slate-800/80 border-slate-600 hover:border-slate-500"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              }`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                {stat.label}
              </p>
              <p className={`text-xl font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{stat.value}</p>
              {stat.subtext && (
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{stat.subtext}</p>
              )}
            </div>
          ))}
        </section>

        {/* Sessions Section */}
        <section className={`rounded-lg border p-4 ${darkMode ? "border-slate-700 bg-slate-800/40" : "border-slate-200 bg-white"}`}>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <h2 className={`text-base font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Work Sessions</h2>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <select
                className={`w-full px-3 py-2 rounded text-xs border transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-100 border-slate-300 text-slate-900"}`}
                value={sessionFilter}
                onChange={(e) => {
                  setSessionFilter(e.target.value as SessionFilter)
                  setSessionPage(1)
                }}>
                {SESSION_FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {FRIENDLY_SESSION_NAMES[filter]}
                  </option>
                ))}
              </select>
              <select
                className={`w-full px-3 py-2 rounded text-xs border transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-100 border-slate-300 text-slate-900"}`}
                value={sessionsPerPage}
                onChange={(e) => {
                  setSessionsPerPage(Number(e.target.value) as ItemsPerPage)
                  setSessionPage(1)
                }}>
                {[5, 10, 25, 50].map((num) => (
                  <option key={num} value={num}>
                    Show {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {filteredSessions.length === 0 ? (
              <p className={`text-center py-6 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                No sessions in this category.
              </p>
            ) : null}

            {paginatedSessions.map((session) => (
              <div
                key={session.id}
                className={`cursor-pointer rounded p-3 border-b transition-all ${darkMode ? "border-slate-700 hover:bg-slate-800/40" : "border-slate-200 hover:bg-slate-50"}`}
                onClick={() => void handleSessionOpen(session)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    void handleSessionOpen(session)
                  }
                }}
                role="button"
                tabIndex={0}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase ${
                    session.status === "active"
                      ? "text-emerald-600"
                      : session.status === "idle"
                        ? "text-amber-600"
                        : "text-slate-600"
                  }`}>
                    {session.status === "idle" ? "On break" : session.status === "active" ? "Currently active" : session.status}
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Started: {formatTimestamp(session.startTime)} • Worked for {formatDuration(session.totalDurationMs)}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {session.urls.length} {session.urls.length === 1 ? "page" : "pages"} • {session.switchCount} tab switches • {session.revisitCount} revisits
                </p>
              </div>
            ))}

            {/* Pagination controls for sessions */}
            {totalSessionPages > 1 && (
              <div className={`pt-3 border-t flex items-center justify-between ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Page {sessionPage} of {totalSessionPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSessionPage(Math.max(1, sessionPage - 1))}
                    disabled={sessionPage === 1}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sessionPage === 1
                        ? darkMode
                          ? "bg-slate-700 text-slate-600 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : darkMode
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    type="button">
                    ← Prev
                  </button>
                  <button
                    onClick={() => setSessionPage(Math.min(totalSessionPages, sessionPage + 1))}
                    disabled={sessionPage === totalSessionPages}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sessionPage === totalSessionPages
                        ? darkMode
                          ? "bg-slate-700 text-slate-600 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : darkMode
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    type="button">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Events Section */}
        <section className={`rounded-lg border p-4 ${darkMode ? "border-slate-700 bg-slate-800/40" : "border-slate-200 bg-white"}`}>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <h2 className={`text-base font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Activity Timeline</h2>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <select
                className={`w-full px-3 py-2 rounded text-xs border transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-100 border-slate-300 text-slate-900"}`}
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value as EventFilter)
                  setEventPage(1)
                }}>
                {EVENT_FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {FRIENDLY_EVENT_NAMES[filter]}
                  </option>
                ))}
              </select>
              <select
                className={`w-full px-3 py-2 rounded text-xs border transition-colors ${darkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-100 border-slate-300 text-slate-900"}`}
                value={eventsPerPage}
                onChange={(e) => {
                  setEventsPerPage(Number(e.target.value) as ItemsPerPage)
                  setEventPage(1)
                }}>
                {[5, 10, 25, 50].map((num) => (
                  <option key={num} value={num}>
                    Show {num}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {filteredEvents.length === 0 ? (
              <p className={`text-center py-6 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                No activity in this category.
              </p>
            ) : null}

            {paginatedEvents.map((event) => (
              <div
                key={event.id}
                className={`cursor-pointer rounded p-3 border-b transition-all ${darkMode ? "border-slate-700 hover:bg-slate-800/40" : "border-slate-200 hover:bg-slate-50"}`}
                onClick={() => void handleEventOpen(event)}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                    keyEvent.preventDefault()
                    void handleEventOpen(event)
                  }
                }}
                role="button"
                tabIndex={0}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                        {FRIENDLY_EVENT_NAMES[event.eventType as EventFilter] || event.eventType}
                      </span>
                      {event.browserName && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                          Chrome
                        </span>
                      )}
                    </div>
                    {event.title && <p className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{event.title}</p>}
                    {event.url && <p className={`text-xs truncate ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{event.url}</p>}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{formatTimestamp(event.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Pagination controls for events */}
            {totalEventPages > 1 && (
              <div className={`pt-3 border-t flex items-center justify-between ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
                <span className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Page {eventPage} of {totalEventPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEventPage(Math.max(1, eventPage - 1))}
                    disabled={eventPage === 1}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      eventPage === 1
                        ? darkMode
                          ? "bg-slate-700 text-slate-600 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : darkMode
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    type="button">
                    ← Prev
                  </button>
                  <button
                    onClick={() => setEventPage(Math.min(totalEventPages, eventPage + 1))}
                    disabled={eventPage === totalEventPages}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      eventPage === totalEventPages
                        ? darkMode
                          ? "bg-slate-700 text-slate-600 cursor-not-allowed"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : darkMode
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    type="button">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
