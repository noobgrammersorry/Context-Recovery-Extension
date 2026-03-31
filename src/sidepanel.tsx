import "~src/ui/styles/globals.css"

import {
  Component,
  Suspense,
  lazy,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState
} from "react"

const Dashboard = lazy(() => import("~src/ui/pages/Dashboard"))
const ActivityLog = lazy(() => import("~src/ui/pages/ActivityLog"))

type SidepanelView = "dashboard" | "activity"

const SIDEPANEL_VIEW_KEY = "sidepanelLastView"

function getViewFromHash(hash: string): SidepanelView {
  return hash === "#activity-log" ? "activity" : "dashboard"
}

function getSavedView(): SidepanelView {
  const saved = localStorage.getItem(SIDEPANEL_VIEW_KEY)
  return (saved as SidepanelView) || "dashboard"
}

interface SidepanelErrorBoundaryProps {
  children: ReactNode
  onResetToDashboard: () => void
}

interface SidepanelErrorBoundaryState {
  hasError: boolean
}

class SidepanelErrorBoundary extends Component<
  SidepanelErrorBoundaryProps,
  SidepanelErrorBoundaryState
> {
  constructor(props: SidepanelErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): SidepanelErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Sidepanel view crashed", { error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-slate-100 p-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          <div className="mx-auto max-w-md rounded-lg border border-rose-300 bg-white p-4 shadow-sm dark:border-rose-700 dark:bg-slate-800">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">We hit a render error.</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Resetting to Dashboard usually fixes this after an update.
            </p>
            <button
              className="mt-3 rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-slate-900"
              onClick={this.props.onResetToDashboard}
              type="button">
              Reset to Dashboard
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

export default function Sidepanel() {
  const [view, setView] = useState<SidepanelView>(() => {
    // First check if there's a hash (direct navigation)
    if (window.location.hash) {
      return getViewFromHash(window.location.hash)
    }
    // Otherwise use saved preference
    return getSavedView()
  })

  useEffect(() => {
    const handleHashChange = () => {
      const newView = getViewFromHash(window.location.hash)
      setView(newView)
      localStorage.setItem(SIDEPANEL_VIEW_KEY, newView)
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Save view preference when it changes (for page reloads)
  useEffect(() => {
    localStorage.setItem(SIDEPANEL_VIEW_KEY, view)
  }, [view])

  return (
    <SidepanelErrorBoundary
      onResetToDashboard={() => {
        setView("dashboard")
        localStorage.setItem(SIDEPANEL_VIEW_KEY, "dashboard")
        window.location.hash = "#dashboard"
      }}>
      <Suspense
        fallback={
          <main className="min-h-screen bg-slate-100 p-4 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <p className="text-sm">Loading view...</p>
          </main>
        }>
        <main>{view === "dashboard" ? <Dashboard /> : <ActivityLog />}</main>
      </Suspense>
    </SidepanelErrorBoundary>
  )
}
