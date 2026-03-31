export interface PageContext {
  title: string
  pathname: string
  host: string
}

export function getPageContext(): PageContext {
  return {
    title: document.title,
    pathname: window.location.pathname,
    host: window.location.host
  }
}
