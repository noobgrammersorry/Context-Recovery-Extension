import { monitorFormChanges, readFormSignals } from "~src/content/formSignals"
import type { ExtensionMessage } from "~src/types/messages"

let formTouched = false
const ENABLE_DEBUG_BADGE = false

monitorFormChanges((snapshot) => {
  if (snapshot.changedFieldCount > 0 && !formTouched) {
    formTouched = true
    chrome.runtime.sendMessage({
      type: "FORM_TOUCHED",
      url: window.location.href,
      snapshot
    }).catch(() => {
      // Ignore errors if background is not ready
    })
  }
})

window.addEventListener("beforeunload", () => {
  const currentSnapshot = readFormSignals()
  if (currentSnapshot.touched && currentSnapshot.changedFieldCount > 0) {
    chrome.runtime.sendMessage({
      type: "UNFINISHED_FORM_DETECTED",
      url: window.location.href,
      snapshot: currentSnapshot
    }).catch(() => {
      // Ignore errors if background is not ready
    })
  }
})

// Listen for interruption notifications from background
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender) => {
  if (sender.id !== chrome.runtime.id) return
  if (message.type === "NOTIFY_INTERRUPTION" && message.task) {
    showDebugBadge(`Notification received: ${message.task.taskLabel}`)
    showInterruptionNotification(message.task)
  }
})

interface TaskCandidate {
  id: string
  taskLabel: string
  relatedDomains: string[]
  urls: string[]
  confidence: number
}

function showInterruptionNotification(task: TaskCandidate) {
  // Remove existing notification if present
  const existing = document.getElementById("context-recovery-notification")
  if (existing) {
    existing.remove()
  }

  // Create notification container
  const notif = document.createElement("div")
  notif.id = "context-recovery-notification"
  notif.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-width: calc(100vw - 40px);
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
    background: white;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    animation: slideIn 0.3s ease-out;
  `

  notif.innerHTML = `
    <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div>
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">
            You have unfinished work
          </h3>
        </div>
        <button id="cr-close-btn" style="
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        " title="Dismiss">
          ✕
        </button>
      </div>
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
        ${escapeHtml(task.taskLabel)}
      </p>
      <div style="display: flex; gap: 8px;">
        <button id="cr-open-btn" style="
          flex: 1;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        ">
          Open Dashboard
        </button>
        <button id="cr-dismiss-btn" style="
          padding: 8px 12px;
          background: #e5e7eb;
          color: #374151;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        ">
          Dismiss
        </button>
      </div>
    </div>
  `

  // Add animation styles if not present
  if (!document.getElementById("cr-animation-styles")) {
    const style = document.createElement("style")
    style.id = "cr-animation-styles"
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(20px);
        }
      }
      #context-recovery-notification.closing {
        animation: slideOut 0.3s ease-out;
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(notif)

  // Event handlers
  const closeBtn = notif.querySelector("#cr-close-btn") as HTMLButtonElement
  const openBtn = notif.querySelector("#cr-open-btn") as HTMLButtonElement
  const dismissBtn = notif.querySelector("#cr-dismiss-btn") as HTMLButtonElement
  const timer = setTimeout(() => removeNotification(), 8000)

  const removeNotification = () => {
    clearTimeout(timer)
    notif.classList.add("closing")
    setTimeout(() => {
      if (notif.parentNode) {
        notif.remove()
      }
    }, 300)
  }

  closeBtn?.addEventListener("click", removeNotification)
  dismissBtn?.addEventListener("click", removeNotification)
  openBtn?.addEventListener("click", () => {
    // Open the extension sidepanel
    showDebugBadge("Open Dashboard clicked")
    chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL" })
      .then(() => showDebugBadge("Sidepanel open request sent"))
      .catch(() => showDebugBadge("Sidepanel open request failed", true))
    removeNotification()
  })
}

function showDebugBadge(message: string, isError = false): void {
  if (!ENABLE_DEBUG_BADGE) return

  const rootId = "context-recovery-debug-root"
  const itemId = `context-recovery-debug-${Date.now()}`

  let root = document.getElementById(rootId)
  if (!root) {
    root = document.createElement("div")
    root.id = rootId
    root.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: min(420px, calc(100vw - 32px));
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `
    document.body.appendChild(root)
  }

  const item = document.createElement("div")
  item.id = itemId
  item.style.cssText = `
    border: 1px solid ${isError ? "#fecaca" : "#bae6fd"};
    background: ${isError ? "#fef2f2" : "#f0f9ff"};
    color: ${isError ? "#991b1b" : "#0f172a"};
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(2, 6, 23, 0.14);
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.4;
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 180ms ease, transform 180ms ease;
  `
  item.textContent = `[ContextRecoveryDebug] ${message}`
  root.appendChild(item)

  requestAnimationFrame(() => {
    item.style.opacity = "1"
    item.style.transform = "translateY(0)"
  })

  setTimeout(() => {
    item.style.opacity = "0"
    item.style.transform = "translateY(-4px)"
    setTimeout(() => {
      item.remove()
      if (root && root.children.length === 0) {
        root.remove()
      }
    }, 180)
  }, 3600)
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
