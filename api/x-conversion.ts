/**
 * Vercel Function: forwards a CTA click to the X Conversion API.
 * The access token comes from the X_PIXEL_TOKEN environment variable.
 */

const PIXEL_ID = 'ogujv'
const ENDPOINT = `https://ads-api.x.com/12/measurement/conversions/${PIXEL_ID}`

const EVENT_IDS: Record<string, string> = {
  signup: 'tw-ogujv-rhbbo',
  signin: 'tw-ogujv-rhbbq',
}

type Body = { event?: unknown; conversionId?: unknown; sourceUrl?: unknown; twclid?: unknown }

const str = (value: unknown, max: number) =>
  typeof value === 'string' && value.length > 0 && value.length <= max ? value : undefined

export async function handle(request: Request, token = process.env.X_PIXEL_TOKEN): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405 })

  const body = (await request.json().catch(() => null)) as Body | null
  const event = str(body?.event, 20)
  const eventId = event && Object.hasOwn(EVENT_IDS, event) ? EVENT_IDS[event] : undefined
  const conversionId = str(body?.conversionId, 100)
  if (!eventId || !conversionId) return new Response(null, { status: 400 })

  // Without a token the site still works. Conversions are skipped.
  if (!token) return new Response(null, { status: 204 })

  const identifier: Record<string, string> = {}
  const twclid = str(body?.twclid, 200)
  if (twclid) identifier.twclid = twclid
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const userAgent = request.headers.get('user-agent')
  if (ip && userAgent) {
    identifier.ip_address = ip
    identifier.user_agent = userAgent
  }
  if (Object.keys(identifier).length === 0) return new Response(null, { status: 204 })

  const sourceUrl = str(body?.sourceUrl, 2048)
  const payload = {
    conversions: [
      {
        conversion_time: new Date().toISOString(),
        event_id: eventId,
        ...(sourceUrl && { event_source_url: sourceUrl }),
        conversion_id: conversionId,
        identifiers: [identifier],
      },
    ],
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'X-Pixel-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) console.error('x-conversion rejected', response.status, await response.text())
  } catch (error) {
    console.error('x-conversion failed', error)
  }
  return new Response(null, { status: 204 })
}

export default { fetch: (request: Request) => handle(request) }
