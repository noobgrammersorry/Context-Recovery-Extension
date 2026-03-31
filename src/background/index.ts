import { startTabTracking } from "./trackTabs"
import { runInterruptionDetection } from "./interruptionDetector"
import { registerMessageHandlers } from "./messageHandlers"
import { refreshActionBadge } from "./badge"

let initialized = false
const INTERRUPTION_ALARM = "context-recovery-run-interruption-detection"

function registerDetectionAlarm(): void {
  chrome.alarms.create(INTERRUPTION_ALARM, { periodInMinutes: 1 })

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== INTERRUPTION_ALARM) return
    void runInterruptionDetection(20)
  })
}

function initializeBackground(): void {
  if (initialized) return
  initialized = true

  registerMessageHandlers()
  registerDetectionAlarm()
  void refreshActionBadge()

  startTabTracking(async () => {
    await runInterruptionDetection(20)
  })
}

initializeBackground()
