import "~src/ui/styles/globals.css"

import { useEffect, useState } from "react"

import type { TaskCandidate, UserSettings } from "~src/lib/models"
import { sendExtensionMessage } from "~src/lib/messageClient"
import ConfidenceBadge from "~src/ui/components/ConfidenceBadge"
import DomainTagList from "~src/ui/components/DomainTagList"

export default function Popup() {
  const [task, setTask] = useState<TaskCandidate | null>(null)
  const [taskCount, setTaskCount] = useState(0)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [resuming, setResuming] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [tasksResponse, settingsResponse] = await Promise.all([
        sendExtensionMessage({ type: "GET_TASKS", limit: 50 }),
        sendExtensionMessage({ type: "GET_SETTINGS" })
      ])

      if (!tasksResponse.ok || !tasksResponse.data || tasksResponse.data.length === 0) {
        setTask(null)
        setTaskCount(0)
      } else {
        setTask(tasksResponse.data[0])
        setTaskCount(tasksResponse.data.length)
      }

      if (settingsResponse.ok && settingsResponse.data) {
        setSettings(settingsResponse.data)
      }

      setLoading(false)
    }

    void load()
  }, [])

  const handleResume = async () => {
    if (!task) return
    setResuming(true)
    const response = await sendExtensionMessage({ type: "RESUME_TASK", taskId: task.id })
    setResuming(false)

    if (response.ok) {
      window.close()
    } else {
      setError(response.error ?? "Resume failed")
    }
  }

  const handleDashboard = () => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
    setTimeout(() => window.close(), 100)
  }

  const handleToggleTracking = async () => {
    if (!settings) return

    const updated = {
      ...settings,
      trackingEnabled: !settings.trackingEnabled
    }

    setSettings(updated)
    setSavingSettings(true)
    const response = await sendExtensionMessage({ type: "SET_SETTINGS", settings: updated })
    setSavingSettings(false)

    if (!response.ok) {
      setSettings(settings)
      setError(response.error ?? "Failed to update tracking")
    }
  }

  return (
    <main className="w-[360px] bg-slate-50 p-4 text-slate-800">
      <header className="mb-3">
        <h1 className="text-base font-semibold">Context Recovery</h1>
        <p className="mt-1 text-xs text-slate-600">
          {taskCount} interrupted task{taskCount === 1 ? "" : "s"}
          {settings && !settings.trackingEnabled ? " • tracking paused" : ""}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600">Loading tasks...</p>
      ) : error ? (
        <p className="rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p>
      ) : task ? (
        <article className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <h2 className="text-sm font-semibold">{task.taskLabel}</h2>
            <div className="mt-2">
              <ConfidenceBadge score={task.confidenceScore} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Reasons: {task.reasonDetected.join(", ") || "n/a"}
            </p>
            <div className="mt-2">
              <DomainTagList domains={task.relatedDomains.slice(0, 3)} />
            </div>
          </div>

          <button
            className="w-full rounded bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            onClick={handleResume}
            disabled={resuming}
            type="button">
            {resuming ? "Resuming..." : "Quick Resume"}
          </button>
        </article>
      ) : (
        <p className="text-sm text-slate-600">No interrupted tasks. Everything caught up!</p>
      )}

      <div className="mt-3 space-y-2">
        <button
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          onClick={handleToggleTracking}
          disabled={!settings || savingSettings}
          type="button">
          {savingSettings
            ? "Saving..."
            : settings?.trackingEnabled
              ? "Pause Tracking"
              : "Resume Tracking"}
        </button>

        <button
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          onClick={handleDashboard}
          type="button">
          Open Dashboard
        </button>
      </div>
    </main>
  )
}
