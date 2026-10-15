/**
 * X conversion tracking for CTA clicks.
 *
 * Each click fires the web pixel and posts to /api/x-conversion with the same
 * conversion_id, so X counts the event once. The access token never reaches
 * the browser: the Vercel function in api/x-conversion.ts holds it.
 */

/** Event IDs from X Events Manager (pixel ogujv). */
const EVENTS = {
  signup: 'tw-ogujv-rhbbo', // Sign Up Click
  signin: 'tw-ogujv-rhbbq', // Sign In Click
} as const

type EventKey = keyof typeof EVENTS

declare global {
  interface Window {
    twq?: (...args: unknown[]) => void
  }
}

const TWCLID_KEY = 'x-twclid'

function twclid(): string | undefined {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('twclid')
    if (fromUrl) sessionStorage.setItem(TWCLID_KEY, fromUrl)
    return sessionStorage.getItem(TWCLID_KEY) ?? undefined
  } catch {
    return undefined
  }
}

/** Maps a clicked element to an event. Returns undefined for non-CTA clicks. */
function eventFor(target: Element): EventKey | undefined {
  if (target.closest('[data-tally-open]')) return 'signup'
  const link = target.closest<HTMLAnchorElement>('a[href^="https://agentzharness.ai"]')
  if (!link) return undefined
  return link.closest('footer') ? 'signin' : 'signup'
}

export function initXTracking(): void {
  twclid()
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const key = target && eventFor(target)
    if (!key) return

    const conversionId = crypto.randomUUID()
    window.twq?.('event', EVENTS[key], { conversion_id: conversionId })
    void fetch('/api/x-conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: key,
        conversionId,
        sourceUrl: window.location.href,
        twclid: twclid(),
      }),
      keepalive: true,
    }).catch(() => {})
  })
}
