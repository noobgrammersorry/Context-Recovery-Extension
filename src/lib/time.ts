export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000
}

export function isIdleGap(lastTimestamp: number, nextTimestamp: number, idleMs: number): boolean {
  return nextTimestamp - lastTimestamp >= idleMs
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString()
}

export function isRecent(timestamp: number, windowMs: number): boolean {
  return Date.now() - timestamp <= windowMs
}
