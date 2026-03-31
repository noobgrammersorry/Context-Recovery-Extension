import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"

import type { UserSettings } from "~src/lib/models"
import { sendExtensionMessage } from "~src/lib/messageClient"
import { AnimatedCard, PremiumButton } from "~src/ui/components/animations/AnimatedComponents"
import { ScrollReveal } from "~src/ui/components/animations/ScrollReveal"
import { GradientBackground, ParallaxSection } from "~src/ui/components/animations/ParallaxEffects"
import { Carousel } from "~src/ui/components/animations/Carousel"

interface ToggleRowProps {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  animated?: boolean
  icon?: ReactNode
}

function normalizeDomain(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return ""

  const withoutProtocol = trimmed.replace(/^https?:\/\//, "")
  const withoutPath = withoutProtocol.split("/")[0]
  return withoutPath.replace(/^www\./, "")
}

function uniqueOrdered(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const normalized = normalizeDomain(item)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

const HISTORY_UNLOCKED_SESSION_KEY = "historyModeUnlockedForSession"
const SUGGESTION_SCOPE_KEY = "suggestionScope"

function MonoIcon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24">
      {children}
    </svg>
  )
}

function PremiumToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      aria-checked={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 ${
        checked
          ? "border-slate-900 bg-slate-900 dark:border-white dark:bg-white"
          : "border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
      }`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button">
      <span
        className={`absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-slate-900 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

function ToggleRow({ title, description, checked, onChange, animated = true, icon }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-slate-200/70 p-3 dark:border-slate-700/70">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-slate-900 dark:text-white">{icon}</span> : null}
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        </div>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <div className={animated ? "animate-fade-in" : ""}>
        <PremiumToggle checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

function TrackingStatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <div
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-300 ${
        enabled
          ? "border-emerald-400/70 bg-emerald-50 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_0_16px_rgba(16,185,129,0.25)] dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}>
      <span
        className={`relative inline-flex h-2.5 w-2.5 items-center justify-center rounded-full ${
          enabled ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
        }`}>
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${
            enabled ? "animate-ping bg-emerald-400/70" : "animate-pulse bg-slate-400/50 dark:bg-slate-500/50"
          }`}
        />
      </span>
      <span>{enabled ? "Tracking On" : "Tracking Off"}</span>
    </div>
  )
}

function ThemeIconToggle({ darkMode, onToggle }: { darkMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-9 w-9 overflow-hidden rounded-full border transition-all duration-300 hover:scale-105 ${
        darkMode ? "border-slate-600 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-900"
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
  )
}

function TrackingModeGlyph({ enabled }: { enabled: boolean }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <svg
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-300 ${
          enabled ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24">
        <path d="M5 12l4 4L19 6" />
      </svg>
      <svg
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-300 ${
          enabled ? "scale-75 opacity-0" : "scale-100 opacity-100"
        }`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </span>
  )
}

function AnimatedClockIcon({ spinTick }: { spinTick: number }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
      </svg>
      <svg
        key={spinTick}
        aria-hidden="true"
        className="absolute inset-0 h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        style={{ animation: "spin 650ms linear 1" }}>
        <path d="M12 7v5" />
        <path d="M12 12l3 2" />
      </svg>
    </span>
  )
}

function PrivacyEyeIcon({ closed }: { closed: boolean }) {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <svg
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-300 ${
          closed ? "scale-90 opacity-30" : "scale-100 opacity-100"
        }`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24">
        <path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
      <svg
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-300 ${
          closed ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        viewBox="0 0 24 24">
        <path d="M3 12s3-4 9-4 9 4 9 4" />
        <path d="M4 16l16-8" />
      </svg>
    </span>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    trackingEnabled: true,
    excludedDomains: [],
    idleTimeoutMinutes: 5,
    privacyMode: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [domainInput, setDomainInput] = useState("")
  const [knownDomains, setKnownDomains] = useState<string[]>([])
  const [historyDomains, setHistoryDomains] = useState<string[]>([])
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([])
  const [showDomainSuggestions, setShowDomainSuggestions] = useState(false)
  const [domainDropdownStyle, setDomainDropdownStyle] = useState<CSSProperties>({})
  const [suggestionScope, setSuggestionScope] = useState<"local" | "all-with-lock" | "all-always">("local")
  const [historyUnlockedForSession, setHistoryUnlockedForSession] = useState(false)
  const [error, setError] = useState<string>()
  const [darkMode, setDarkMode] = useState(false)
  const [clockSpinTick, setClockSpinTick] = useState(0)
  const domainInputWrapRef = useRef<HTMLDivElement>(null)

  const triggerClockSpin = () => {
    setClockSpinTick((tick) => tick + 1)
  }

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true"
    const sessionUnlocked = sessionStorage.getItem(HISTORY_UNLOCKED_SESSION_KEY) === "true"

    const savedScope = localStorage.getItem(SUGGESTION_SCOPE_KEY)
    if (savedScope === "local" || savedScope === "all-with-lock" || savedScope === "all-always") {
      setSuggestionScope(savedScope)
    } else {
      const oldDomainSource = localStorage.getItem("domainSuggestionSource")
      const oldSecurityMode = localStorage.getItem("securityModeEnabled")

      if (oldDomainSource === "all" && oldSecurityMode !== "false") {
        setSuggestionScope("all-with-lock")
      } else if (oldDomainSource === "all" && oldSecurityMode === "false") {
        setSuggestionScope("all-always")
      } else {
        setSuggestionScope("local")
      }
    }

    setDarkMode(isDark)
    setHistoryUnlockedForSession(sessionUnlocked)
    if (isDark) {
      document.documentElement.classList.add("dark")
    }

    const loadSettings = async () => {
      const [settingsResponse, activityResponse] = await Promise.all([
        sendExtensionMessage({ type: "GET_SETTINGS" }),
        sendExtensionMessage({ type: "GET_ACTIVITY_LOG", eventLimit: 500, sessionLimit: 150 })
      ])

      if (settingsResponse.ok && settingsResponse.data) {
        setSettings(settingsResponse.data)
      }

      if (activityResponse.ok && activityResponse.data) {
        const scores = new Map<string, number>()

        for (const event of activityResponse.data.events) {
          const domain = normalizeDomain(event.domain)
          if (!domain) continue
          scores.set(domain, (scores.get(domain) ?? 0) + 1)
        }

        for (const session of activityResponse.data.sessions) {
          for (const domainValue of session.domains) {
            const domain = normalizeDomain(domainValue)
            if (!domain) continue
            scores.set(domain, (scores.get(domain) ?? 0) + 2)
          }
        }

        const sortedDomains = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([domain]) => domain)

        setKnownDomains(sortedDomains)
      }

      setLoading(false)
    }

    void loadSettings()
  }, [])

  useEffect(() => {
    const loadHistoryDomains = async () => {
      if (suggestionScope === "local") return

      try {
        const hasHistoryPermission = await chrome.permissions.contains({ permissions: ["history"] })
        const granted = hasHistoryPermission
          ? true
          : await chrome.permissions.request({ permissions: ["history"] })

        if (!granted) {
          setHistoryDomains([])
          setError("History suggestions need browser history permission. Please allow access when prompted.")
          return
        }

        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
        const historyItems = await chrome.history.search({
          text: "",
          startTime: ninetyDaysAgo,
          maxResults: 2000
        })

        const scores = new Map<string, number>()
        for (const item of historyItems) {
          const domain = normalizeDomain(item.url ?? "")
          if (!domain) continue
          scores.set(domain, (scores.get(domain) ?? 0) + Math.max(item.visitCount ?? 1, 1))
        }

        const sortedHistoryDomains = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([domain]) => domain)

        setHistoryDomains(sortedHistoryDomains)
        setError(undefined)
      } catch (loadError) {
        setHistoryDomains([])
        setError(loadError instanceof Error ? loadError.message : "Could not read browser history")
      }
    }

    void loadHistoryDomains()
  }, [suggestionScope])

  useEffect(() => {
    const query = normalizeDomain(domainInput)
    const excludedSet = new Set(settings.excludedDomains.map((value) => normalizeDomain(value)))
    const domainPool =
      suggestionScope !== "local" ? uniqueOrdered([...historyDomains, ...knownDomains]) : knownDomains

    const filtered = domainPool.filter((domain) => {
      if (excludedSet.has(domain)) return false
      if (!query) return true
      return domain.includes(query)
    })

    setDomainSuggestions(filtered.slice(0, 8))
  }, [domainInput, knownDomains, historyDomains, suggestionScope, settings.excludedDomains])

  useEffect(() => {
    const updateDropdownPosition = () => {
      const wrap = domainInputWrapRef.current
      if (!wrap || !showDomainSuggestions) return

      const rect = wrap.getBoundingClientRect()
      const viewportPadding = 8
      const gap = 6
      const desiredMaxHeight = 260
      const minVisibleHeight = 120
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
      const spaceAbove = rect.top - viewportPadding
      const placeAbove = spaceBelow < minVisibleHeight && spaceAbove > spaceBelow
      const availableSpace = placeAbove ? spaceAbove : spaceBelow
      const maxHeight = Math.max(100, Math.min(desiredMaxHeight, availableSpace))
      const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2)
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
      )
      const rawTop = placeAbove ? rect.top - maxHeight - gap : rect.bottom + gap
      const top = Math.min(
        Math.max(viewportPadding, rawTop),
        Math.max(viewportPadding, window.innerHeight - maxHeight - viewportPadding)
      )

      setDomainDropdownStyle({
        left,
        top,
        width,
        maxHeight,
        position: "fixed"
      })
    }

    updateDropdownPosition()
    window.addEventListener("resize", updateDropdownPosition)
    window.addEventListener("scroll", updateDropdownPosition, true)

    return () => {
      window.removeEventListener("resize", updateDropdownPosition)
      window.removeEventListener("scroll", updateDropdownPosition, true)
    }
  }, [showDomainSuggestions, domainSuggestions.length, domainInput])

  const handleSuggestionScopeChange = async (nextScope: "local" | "all-with-lock" | "all-always") => {
    if (nextScope === suggestionScope) return

    if (nextScope !== "local") {
      try {
        const manifest = chrome.runtime.getManifest()
        const optionalPermissions = manifest.optional_permissions ?? []
        const requiredPermissions = manifest.permissions ?? []
        const declaresHistoryPermission =
          optionalPermissions.includes("history") || requiredPermissions.includes("history")

        if (!declaresHistoryPermission) {
          setError(
            "This extension build does not declare history permission. Rebuild and reload extension, then try again."
          )
          return
        }

        const hasHistoryPermission = await chrome.permissions.contains({ permissions: ["history"] })
        const granted = hasHistoryPermission
          ? true
          : await chrome.permissions.request({ permissions: ["history"] })

        if (!granted) {
          setError("Browser history access was not granted. Staying with local-only suggestions.")
          return
        }
      } catch (permissionError) {
        setError(
          permissionError instanceof Error
            ? permissionError.message
            : "History permission could not be requested"
        )
        return
      }
    }

    setSuggestionScope(nextScope)
    localStorage.setItem(SUGGESTION_SCOPE_KEY, nextScope)
    setError(undefined)

    if (nextScope === "all-with-lock") {
      sessionStorage.setItem(HISTORY_UNLOCKED_SESSION_KEY, "true")
      setHistoryUnlockedForSession(true)
    }

    if (nextScope !== "all-with-lock" && historyUnlockedForSession) {
      setHistoryUnlockedForSession(false)
      sessionStorage.removeItem(HISTORY_UNLOCKED_SESSION_KEY)
    }
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem("darkMode", String(next))
    if (next) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const response = await sendExtensionMessage({ type: "SET_SETTINGS", settings })
    setSaving(false)

    if (response.ok) {
      setSaved(true)
      setError(undefined)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(response.error ?? "Failed to save settings")
    }
  }

  const handleAddExcludedDomain = () => {
    const domain = normalizeDomain(domainInput)
    if (!domain) return

    if (settings.excludedDomains.includes(domain)) {
      setError("This domain is already in the skip list")
      return
    }

    setSettings({
      ...settings,
      excludedDomains: [...settings.excludedDomains, domain]
    })
    setDomainInput("")
    setError(undefined)
  }

  const handleSelectDomainSuggestion = (domain: string) => {
    if (settings.excludedDomains.includes(domain)) {
      setError("This domain is already in the skip list")
      return
    }

    setSettings({
      ...settings,
      excludedDomains: [...settings.excludedDomains, domain]
    })
    setDomainInput("")
    setShowDomainSuggestions(false)
    setError(undefined)
  }

  const handleRemoveExcludedDomain = (domain: string) => {
    setSettings({
      ...settings,
      excludedDomains: settings.excludedDomains.filter((d) => d !== domain)
    })
  }

  const handleClearData = async () => {
    setClearing(true)
    const response = await sendExtensionMessage({ type: "CLEAR_DATA" })
    setClearing(false)

    if (!response.ok) {
      setError(response.error ?? "Failed to clear local history")
      return
    }

    setSaved(true)
    setError(undefined)
    setTimeout(() => setSaved(false), 2000)
  }

  const scopeOptions: Array<{
    id: "local" | "all-with-lock" | "all-always"
    title: string
    description: string
    selected: boolean
  }> = [
    {
      id: "local",
      title: "Extension Local Only",
      description: "Suggestions based on your tracked activity within this extension only.",
      selected: suggestionScope === "local"
    },
    {
      id: "all-with-lock",
      title: "Browser History (Session Unlock)",
      description: "Includes browser history. Requires unlock each session for extra security.",
      selected: suggestionScope === "all-with-lock"
    },
    {
      id: "all-always",
      title: "Browser History (Always)",
      description: "Full suggestions from browser history, no unlock required.",
      selected: suggestionScope === "all-always"
    }
  ]

  return (
    <main className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>
      <GradientBackground animated={true} />

      <div className="settings-ui-scale relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-5">
        <ScrollReveal threshold={0.2}>
          <header className="relative mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <ParallaxSection speed={0.18}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-slate-200/40 blur-2xl dark:bg-slate-700/30" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-slate-300/30 blur-2xl dark:bg-slate-600/20" />
            </ParallaxSection>

            <div className="relative flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Tracking, privacy, recovery, and domain controls</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeIconToggle darkMode={darkMode} onToggle={toggleDarkMode} />
                <TrackingStatusBadge enabled={settings.trackingEnabled} />
              </div>
            </div>
          </header>
        </ScrollReveal>

        {loading ? (
          <AnimatedCard className="p-8 text-center" hoverEffect="lift">
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading settings...</p>
          </AnimatedCard>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            {saved ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                Settings saved
              </div>
            ) : null}

            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="space-y-2.5">
                <ScrollReveal delay={80} threshold={0.2}>
                  <AnimatedCard className="border border-slate-200 p-5 dark:border-slate-700" hoverEffect="lift" animated={true}>
                <div className="mb-3 flex items-center gap-2">
                  <MonoIcon className="text-slate-900 dark:text-white">
                    <path d="M12 2v20M2 12h20" />
                  </MonoIcon>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Behavior</h2>
                </div>

                <div className="space-y-3">
                  <ToggleRow
                    title="Track my work"
                    description="Capture activity for recovery suggestions."
                    checked={settings.trackingEnabled}
                    onChange={(checked) => setSettings({ ...settings, trackingEnabled: checked })}
                    icon={<TrackingModeGlyph enabled={settings.trackingEnabled} />}
                  />

                  <div className="rounded-md border border-slate-200 p-3.5 transition-all hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white">
                          <AnimatedClockIcon spinTick={clockSpinTick} />
                        </span>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Work break threshold</p>
                      </div>
                      <span className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 dark:border-slate-600 dark:text-slate-200">
                        {settings.idleTimeoutMinutes} min
                      </span>
                    </div>

                    <input
                      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800 dark:bg-slate-700 dark:accent-white"
                      type="range"
                      min={1}
                      max={30}
                      value={settings.idleTimeoutMinutes}
                      onChange={(event) =>
                        (triggerClockSpin(),
                        setSettings({
                          ...settings,
                          idleTimeoutMinutes: Number(event.target.value) || 5
                        }))
                      }
                    />

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[5, 10, 15, 20, 30].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => {
                            triggerClockSpin()
                            setSettings({ ...settings, idleTimeoutMinutes: preset })
                          }}
                          className={`rounded border px-2 py-1 text-xs transition ${
                            settings.idleTimeoutMinutes === preset
                              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          }`}
                          type="button">
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
                  </AnimatedCard>
                </ScrollReveal>

                <div className="space-y-2">
                  <PremiumButton variant="primary" size="lg" onClick={handleSave} loading={saving} className="w-full">
                    {saving ? "Saving..." : "Save settings"}
                  </PremiumButton>

                  <PremiumButton variant="ghost" size="lg" onClick={handleClearData} loading={clearing} className="w-full">
                    {clearing ? "Clearing..." : "Clear local history"}
                  </PremiumButton>
                </div>
              </div>

              <div className="space-y-2.5">
                <ScrollReveal delay={140} threshold={0.2}>
                  <AnimatedCard className="border border-slate-200 p-5 dark:border-slate-700" hoverEffect="lift" animated={true}>
                <div className="mb-3 flex items-center gap-2">
                  <MonoIcon className="text-slate-900 dark:text-white">
                    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                  </MonoIcon>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Privacy</h2>
                </div>

                <div className="space-y-3">
                  <ToggleRow
                    title="Privacy mode"
                    description="Redact URLs and titles in saved activity."
                    checked={settings.privacyMode}
                    onChange={(checked) => setSettings({ ...settings, privacyMode: checked })}
                    icon={<PrivacyEyeIcon closed={settings.privacyMode} />}
                  />

                  <div className="rounded-md border border-slate-200 p-3.5 transition-all hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
                    <div className="mb-2 flex items-center gap-2">
                      <MonoIcon className="text-slate-900 dark:text-white">
                        <path d="M4 7h16M4 12h10M4 17h16" />
                      </MonoIcon>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Suggestion scope</p>
                    </div>

                    <Carousel
                      items={scopeOptions.map((option) => ({
                        id: option.id,
                        content: (
                          <button
                            onClick={() => void handleSuggestionScopeChange(option.id)}
                            className={`w-full rounded-md border p-3 text-left transition ${
                              option.selected
                                ? "border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800"
                                : "border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
                            }`}
                            type="button">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{option.title}</p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                          </button>
                        )
                      }))}
                      autoPlay={false}
                      showIndicators={true}
                    />
                  </div>

                  <div className="rounded-md border border-slate-200 p-3.5 transition-all hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
                    <div className="mb-2 flex items-center gap-2">
                      <MonoIcon className="text-slate-900 dark:text-white">
                        <path d="M3 7h18M6 12h12M9 17h6" />
                      </MonoIcon>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Sites to skip</p>
                    </div>

                    <div className="relative overflow-visible" ref={domainInputWrapRef}>
                      <div className="flex gap-2">
                        <input
                          className="h-9 flex-1 rounded border border-slate-300 bg-white px-2.5 text-sm text-slate-800 focus:border-slate-900 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-white"
                          placeholder="example.com"
                          value={domainInput}
                          onChange={(event) => setDomainInput(event.target.value)}
                          onFocus={() => setShowDomainSuggestions(true)}
                          onBlur={() => {
                            window.setTimeout(() => setShowDomainSuggestions(false), 120)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault()
                              handleAddExcludedDomain()
                            }
                          }}
                          type="text"
                        />

                        <PremiumButton variant="secondary" size="sm" onClick={handleAddExcludedDomain}>
                          Add
                        </PremiumButton>
                      </div>

                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {settings.excludedDomains.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">No excluded domains</p>
                      ) : (
                        settings.excludedDomains.map((domain) => (
                          <span
                            key={domain}
                            className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 dark:border-slate-600 dark:text-slate-200">
                            {domain}
                            <button
                              aria-label={`Remove ${domain}`}
                              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                              onClick={() => handleRemoveExcludedDomain(domain)}
                              type="button">
                              x
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                  </AnimatedCard>
                </ScrollReveal>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDomainSuggestions && typeof document !== "undefined"
        ? createPortal(
            <div
              className="modern-scrollbar z-[9999] overflow-y-auto rounded border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              style={domainDropdownStyle}>
              {domainSuggestions.length > 0 ? (
                domainSuggestions.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => handleSelectDomainSuggestion(domain)}
                    className="mb-1 block w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    type="button">
                    {domain}
                  </button>
                ))
              ) : (
                <p className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">No matching suggestions</p>
              )}
            </div>,
            document.body
          )
        : null}
    </main>
  )
}
