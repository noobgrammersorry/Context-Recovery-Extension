import { useEffect, useState } from "react"

import { sendExtensionMessage } from "~src/lib/messageClient"
import type { TaskCandidate } from "~src/lib/models"

interface InterruptionNotificationProps {
  onOpenDashboard: () => void
}

export default function InterruptionNotification({ onOpenDashboard }: InterruptionNotificationProps) {
  const [task, setTask] = useState<TaskCandidate | null>(null)
  const [show, setShow] = useState(false)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    const check = async () => {
      const response = await sendExtensionMessage({ type: "GET_TASKS", limit: 1 })
      if (response.ok && response.data && response.data.length > 0) {
        setTask(response.data[0])
        setShow(true)

        // Auto-hide after 8 seconds
        const timer = setTimeout(() => setShow(false), 8000)
        return () => clearTimeout(timer)
      }
    }

    // Check immediately and every 10 seconds
    void check()
    const interval = setInterval(() => void check(), 10000)

    return () => clearInterval(interval)
  }, [])

  if (!show || !task) return null

  const handleOpenTask = async () => {
    if (!task || opening) return
    setOpening(true)
    const response = await sendExtensionMessage({ type: "RESUME_TASK", taskId: task.id })

    if (!response.ok || !response.data?.resumed) {
      onOpenDashboard()
    }

    setShow(false)
    setOpening(false)
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[140] w-[350px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-slate-200 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">You have unfinished work</h3>
          <button
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            onClick={() => setShow(false)}
            type="button">
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">{task.taskLabel}</p>

        <div className="flex gap-2">
          <button
            className="flex-1 rounded border border-slate-300 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:border-slate-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            onClick={() => void handleOpenTask()}
            type="button">
            {opening ? "Opening..." : "View Task"}
          </button>
          <button
            className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => setShow(false)}
            type="button">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
