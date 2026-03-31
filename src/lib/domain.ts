const NOISY_SCHEMES = ["chrome://", "edge://", "about:", "devtools://", "chrome-extension://"]

export function normalizeUrl(rawUrl?: string): string {
  if (!rawUrl) return ""
  try {
    const url = new URL(rawUrl)
    url.hash = ""
    return url.toString()
  } catch {
    return rawUrl
  }
}

export function extractDomain(rawUrl?: string): string {
  if (!rawUrl) return ""
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function isNoisyUrl(rawUrl?: string): boolean {
  if (!rawUrl) return true
  return NOISY_SCHEMES.some((scheme) => rawUrl.startsWith(scheme))
}

export function isWorkLikeDomain(domain: string): boolean {
  if (!domain) return false

  const workHints = [
    "github.com",
    "gitlab.com",
    "notion.so",
    "linear.app",
    "jira",
    "atlassian.net",
    "docs.google.com",
    "stackoverflow.com"
  ]

  return workHints.some((hint) => domain.includes(hint))
}
