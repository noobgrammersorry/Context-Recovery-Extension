import { useEffect, useState } from "react"

import type { TaskCandidate } from "~src/lib/models"
import { sendExtensionMessage } from "~src/lib/messageClient"
import { computeRecoveryUrgency } from "~src/lib/scoring"
import TaskCard from "~src/ui/components/TaskCard"
import EmptyState from "~src/ui/components/EmptyState"
import InterruptionNotification from "~src/ui/components/InterruptionNotification"
import { ScrollReveal, ScrollRevealList } from "~src/ui/components/animations/ScrollReveal"
import { AnimatedCard } from "~src/ui/components/animations/AnimatedComponents"
import { GradientBackground, ParallaxSection } from "~src/ui/components/animations/ParallaxEffects"

export default function Dashboard() {
  const [tasks, setTasks] = useState<TaskCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [darkMode, setDarkMode] = useState(false)

  const loadTasks = async () => {
    setLoading(true)
    const detectResponse = await sendExtensionMessage({ type: "RUN_INTERRUPTION_DETECTION" })
    if (!detectResponse.ok) {
      setError(detectResponse.error ?? "couldn't load tasks")
      setLoading(false)
      return
    }

    const tasksResponse = await sendExtensionMessage({ type: "GET_TASKS", limit: 50 })
    if (!tasksResponse.ok || !tasksResponse.data) {
      setError(tasksResponse.error ?? "couldn't load tasks")
      setLoading(false)
      return
    }

    const sortedTasks = [...tasksResponse.data].sort((a, b) => {
      const urgencyDiff = computeRecoveryUrgency(b).score - computeRecoveryUrgency(a).score
      if (urgencyDiff !== 0) return urgencyDiff
      return b.lastActiveAt - a.lastActiveAt
    })

    setTasks(sortedTasks)
    setError(undefined)
    setLoading(false)
  }

  useEffect(() => {
    void loadTasks()
    void chrome.storage.local.set({ hasNewInterruption: false })
    
    // Load dark mode preference
    const isDark = localStorage.getItem("darkMode") === "true"
    setDarkMode(isDark)
    
    // Listen for dark mode changes
    const handleDarkModeChange = () => {
      setDarkMode(localStorage.getItem("darkMode") === "true")
    }
    window.addEventListener("storage", handleDarkModeChange)
    
    return () => window.removeEventListener("storage", handleDarkModeChange)
  }, [])

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

  const applyTaskAction = async (
    type: "RESUME_TASK" | "DISMISS_TASK" | "SNOOZE_TASK" | "MARK_DONE",
    taskId: string
  ) => {
    const response = await sendExtensionMessage({ type, taskId })
    if (!response.ok) {
      setError(response.error ?? "Action failed")
      return
    }

    await loadTasks()
  }

  const handleOpenDashboard = () => {
    // Already on dashboard, just scroll to top
    window.scrollTo(0, 0)
  }

  const mustRecoverCount = tasks.filter((task) => {
    const urgency = computeRecoveryUrgency(task)
    return urgency.level === "critical" || urgency.level === "high"
  }).length

  return (
    <>
      <InterruptionNotification onOpenDashboard={handleOpenDashboard} />
      <main className={`min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-white via-slate-50 to-teal-50/30"
      }`}>
        {/* Animated background */}
        <GradientBackground animated={true} />

        <div className="relative z-10">
          {/* Premium Header */}
          <header className={`border-b backdrop-blur-xl transition-all duration-300 ${
            darkMode
              ? "border-slate-700/50 bg-slate-900/40"
              : "border-slate-200/50 bg-white/40"
          }`}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8 flex-1">
                  <nav className="flex gap-0 -mb-px">
                    <a
                      href="#dashboard"
                      className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-300 relative group ${
                        darkMode
                          ? "border-teal-500 text-teal-400"
                          : "border-teal-600 text-teal-600"
                      }`}>
                      Dashboard
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full" />
                    </a>
                    <a
                      href="#activity-log"
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                        darkMode
                          ? "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <ScrollReveal delay={50} threshold={0.3}>
              <div className="mb-8">
                <h2 className={`text-3xl font-bold mb-2 ${
                  darkMode ? "text-slate-100" : "text-slate-900"
                }`}>
                  Recovery Dashboard
                </h2>
                <p className={`text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-600"
                }`}>
                  {loading
                    ? "Analyzing your activity..."
                    : tasks.length === 0
                      ? "No unfinished work detected"
                      : `${mustRecoverCount} must-recover • ${tasks.length} total task${tasks.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </ScrollReveal>

            {loading ? (
              <ScrollReveal delay={100} threshold={0.3}>
                <AnimatedCard className="p-12 flex justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 animate-spin" style={{
                        maskImage: "conic-gradient(transparent 0deg, transparent 180deg, black 180deg, black 360deg)"
                      }} />
                      <div className={`absolute inset-1 rounded-full ${
                        darkMode ? "bg-slate-900" : "bg-white"
                      }`} />
                    </div>
                    <p className={`text-sm font-medium ${
                      darkMode ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Analyzing your activity...
                    </p>
                  </div>
                </AnimatedCard>
              </ScrollReveal>
            ) : error ? (
              <ScrollReveal delay={100} threshold={0.3}>
                <AnimatedCard className={`p-4 border-2 ${
                  darkMode
                    ? "border-rose-800/50 bg-rose-950/20"
                    : "border-rose-300 bg-rose-50/80"
                }`}>
                  <p className={`text-sm font-bold mb-1 ${
                    darkMode ? "text-rose-400" : "text-rose-700"
                  }`}>
                    Error
                  </p>
                  <p className={`text-sm ${
                    darkMode ? "text-rose-300" : "text-rose-600"
                  }`}>
                    {error}
                  </p>
                </AnimatedCard>
              </ScrollReveal>
            ) : tasks.length === 0 ? (
              <ScrollReveal delay={100} threshold={0.3}>
                <AnimatedCard className={`border-2 border-dashed p-12 text-center backdrop-blur ${
                  darkMode
                    ? "border-slate-700 bg-slate-800/20"
                    : "border-slate-300 bg-slate-100/20"
                }`}>
                  <div className="animate-float mb-4 text-4xl">✨</div>
                  <p className={`text-lg font-bold mb-2 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}>
                    All caught up!
                  </p>
                  <p className={`text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}>
                    No unfinished work found. Amazing work keeping up with your tasks!
                  </p>
                </AnimatedCard>
              </ScrollReveal>
            ) : (
              <div className="space-y-4">
                <ScrollRevealList staggerDelay={75}>
                  {tasks.map((task) => (
                    <div key={task.id} className="animate-reveal" style={{ animationFillMode: "both" }}>
                      <TaskCard
                        task={task}
                        onResume={(taskId) => void applyTaskAction("RESUME_TASK", taskId)}
                        onDismiss={(taskId) => void applyTaskAction("DISMISS_TASK", taskId)}
                        onSnooze={(taskId) => void applyTaskAction("SNOOZE_TASK", taskId)}
                        onDone={(taskId) => void applyTaskAction("MARK_DONE", taskId)}
                      />
                    </div>
                  ))}
                </ScrollRevealList>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
