/**
 * Transfer-size audit.
 *
 * Drives a headless Chrome over the built site and measures what actually goes
 * over the wire, split into what a visitor pays on first paint versus what they
 * pay only if they scroll the whole page. Video is the thing worth watching:
 * every clip must stay unfetched until it is near the viewport, because an
 * autoplaying <video> is downloaded in full by the browser regardless of
 * preload="none", which is what put the site over its egress quota.
 *
 *   npm run build
 *   npm run preview -- --port 4173
 *   node test/bandwidth-audit.mjs [http://localhost:4173]
 *
 * Needs a Chrome/Chromium on PATH or CHROME_PATH. Exits non-zero on failure.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'

if (typeof WebSocket === 'undefined') {
  const r = spawnSync(
    process.execPath,
    ['--experimental-websocket', '--no-warnings', new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), ...process.argv.slice(2)],
    { stdio: 'inherit' },
  )
  process.exit(r.status ?? 2)
}

const BASE = process.argv[2] || 'http://localhost:4173'

/**
 * Budgets, in KB of same-origin transfer, for a 1440x900 desktop visitor.
 * Headroom over the current numbers is deliberately thin: this exists to catch
 * a clip or a raw PNG being added back, not to be comfortable.
 */
const BUDGET = {
  /** everything fetched before the visitor scrolls at all */
  initial: 1500,
  /** video fetched before the visitor scrolls at all: the hero clip, and only it */
  initialVideo: 1200,
  /** the whole page, every clip loaded, i.e. the worst case a reader can reach */
  full: 14000,
}

const kb = (n) => Math.round(n / 1024)

async function main() {
  const bin = chromePath()
  if (!bin) {
    console.error('No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.')
    process.exit(2)
  }
  const port = await freePort()
  const chrome = spawn(
    bin,
    ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'],
    { stdio: 'ignore' },
  )

  const cdp = await connect(port)
  const hits = new Map() // url -> bytes on the wire
  const phaseOf = new Map() // url -> 'initial' | 'scroll'
  let phase = 'initial'

  cdp.on('Network.responseReceived', (p) => {
    if (!phaseOf.has(p.response.url)) phaseOf.set(p.response.url, phase)
  })
  cdp.on('Network.loadingFinished', (p) => {
    const url = cdp.urlFor(p.requestId)
    // First fetch per URL wins. The cache is disabled so we see a cold visitor,
    // but a real cold visitor still has a working HTTP cache within the page, so
    // a clip used by two components costs its bytes once, not twice.
    if (url && !hits.has(url)) hits.set(url, p.encodedDataLength)
  })

  try {
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
    // Headless Chrome reports prefers-reduced-motion: reduce by default, and
    // LazyVideo honours that by never fetching an mp4. Pin the ordinary case
    // here or this measures the wrong visitor. The reduce path is asserted in
    // its own pass below.
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    await cdp.send('Page.navigate', { url: BASE })
    await cdp.settled()
    // give any above-the-fold observer time to fire and finish its fetch
    await new Promise((r) => setTimeout(r, 2500))

    // Only same-origin bytes count: third-party scripts are served by someone
    // else and never touch this site's egress quota, which is what blew up.
    const mine = () => [...hits.entries()].filter(([u]) => u.startsWith(BASE))
    const initial = mine()
    const initialBytes = initial.reduce((a, [, b]) => a + b, 0)
    const initialVideo = initial.filter(([u]) => u.endsWith('.mp4'))

    phase = 'scroll'
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        const H = document.documentElement.scrollHeight, VH = window.innerHeight
        for (let y = 0; y <= H - VH; y += Math.round(VH * 0.6)) {
          window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 450))
        }
        window.scrollTo(0, H); await new Promise((r) => setTimeout(r, 1500))
      })()`,
      awaitPromise: true,
    })
    await new Promise((r) => setTimeout(r, 2000))

    const all = mine()
    const fullBytes = all.reduce((a, [, b]) => a + b, 0)
    const videos = all.filter(([u]) => u.endsWith('.mp4'))

    console.log(`\n── first paint (no scroll) ──`)
    console.log(`  total          ${kb(initialBytes)} KB   (budget ${BUDGET.initial} KB)`)
    console.log(`  of which video ${kb(initialVideo.reduce((a, [, b]) => a + b, 0))} KB   (budget ${BUDGET.initialVideo} KB)`)
    for (const [u, b] of initial.sort((a, c) => c[1] - a[1]).slice(0, 8)) {
      console.log(`    ${String(kb(b)).padStart(5)} KB  ${u.split('/').pop()}`)
    }

    console.log(`\n── after scrolling the whole page ──`)
    console.log(`  total          ${kb(fullBytes)} KB   (budget ${BUDGET.full} KB)`)
    console.log(`  clips loaded   ${videos.length}`)
    for (const [u, b] of videos.sort((a, c) => c[1] - a[1])) {
      console.log(`    ${String(kb(b)).padStart(5)} KB  ${(phaseOf.get(u) || '?').padEnd(7)}  ${u.split('/').pop()}`)
    }

    const fails = []
    if (kb(initialBytes) > BUDGET.initial) fails.push(`first paint ${kb(initialBytes)} KB over budget ${BUDGET.initial} KB`)
    const iv = kb(initialVideo.reduce((a, [, b]) => a + b, 0))
    if (iv > BUDGET.initialVideo) fails.push(`first-paint video ${iv} KB over budget ${BUDGET.initialVideo} KB`)
    if (kb(fullBytes) > BUDGET.full) fails.push(`full page ${kb(fullBytes)} KB over budget ${BUDGET.full} KB`)
    // the point of the whole exercise: clips must arrive on scroll, not up front
    const eager = initialVideo.filter(([u]) => !u.includes('hero-workflow-graph'))
    if (eager.length) fails.push(`${eager.length} clip(s) fetched before any scroll: ${eager.map(([u]) => u.split('/').pop()).join(', ')}`)

    // ── the clips that did load must actually be playing ──
    // Lazy loading is only correct if it still ends in a playing clip; a silent
    // regression here would look identical in the byte counts above.
    const { result: playback } = await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        // park on the stepper, whose clips are unambiguously in view
        const step = document.querySelector('.step .vw video')
        step && step.scrollIntoView({ block: 'center' })
        await new Promise((r) => setTimeout(r, 2000))
        const vs = [...document.querySelectorAll('video')].filter((v) => v.getAttribute('src'))
        const onscreen = vs.filter((v) => {
          const r = v.getBoundingClientRect()
          return r.top < innerHeight && r.bottom > 0 && r.width > 0
        })
        return JSON.stringify({
          loaded: vs.length,
          onscreen: onscreen.length,
          playing: onscreen.filter((v) => !v.paused && v.currentTime > 0).length,
          rate: onscreen.length ? onscreen[0].playbackRate : null,
        })
      })()`,
      awaitPromise: true,
      returnByValue: true,
    })
    const pb = JSON.parse(playback.value)
    console.log(`\n── playback ──`)
    console.log(`  loaded ${pb.loaded}, on screen ${pb.onscreen}, playing ${pb.playing}, rate ${pb.rate}`)
    if (pb.onscreen && pb.playing < pb.onscreen) {
      fails.push(`${pb.onscreen - pb.playing} on-screen clip(s) loaded but never started playing`)
    }
    if (pb.onscreen && pb.rate !== 0.75) fails.push(`playback rate is ${pb.rate}, expected 0.75`)

    // ── second pass: a reduced-motion visitor must never be sent an mp4 ──
    hits.clear()
    phaseOf.clear()
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await cdp.send('Page.navigate', { url: BASE })
    await cdp.settled()
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        const H = document.documentElement.scrollHeight, VH = window.innerHeight
        for (let y = 0; y <= H - VH; y += Math.round(VH * 0.6)) {
          window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 300))
        }
        window.scrollTo(0, H); await new Promise((r) => setTimeout(r, 1200))
      })()`,
      awaitPromise: true,
    })
    await new Promise((r) => setTimeout(r, 1500))
    const reduceVideos = [...hits.keys()].filter((u) => u.endsWith('.mp4'))
    console.log(`\n── reduced-motion visitor, whole page scrolled ──`)
    console.log(`  clips loaded   ${reduceVideos.length}  (must be 0)`)
    if (reduceVideos.length) fails.push(`reduced-motion visitor was sent ${reduceVideos.length} clip(s)`)

    if (fails.length) {
      console.log('\nFAIL')
      fails.forEach((f) => console.log('  ' + f))
      process.exit(1)
    }
    console.log('\nWithin budget.')
    process.exit(0)
  } finally {
    chrome.kill()
  }
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const local = process.env.LOCALAPPDATA
  const guesses = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    local && `${local}/Google/Chrome/Application/chrome.exe`,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  return guesses.find((p) => existsSync(p))
}

const freePort = () =>
  new Promise((res) => {
    const s = net.createServer()
    s.listen(0, () => {
      const { port } = s.address()
      s.close(() => res(port))
    })
  })

async function connect(port) {
  let target
  for (let i = 0; i < 60; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())
      target = list.find((t) => t.type === 'page')
      if (target) break
    } catch {
      /* chrome still starting */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!target) throw new Error('Could not reach Chrome DevTools endpoint')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })

  let id = 0
  const pending = new Map()
  const handlers = new Map()
  const urls = new Map() // requestId -> url, so loadingFinished can be attributed
  let loadResolve = null

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result)
      return
    }
    if (msg.method === 'Network.requestWillBeSent') urls.set(msg.params.requestId, msg.params.request.url)
    if (msg.method === 'Page.loadEventFired' && loadResolve) {
      loadResolve()
      loadResolve = null
    }
    const h = handlers.get(msg.method)
    if (h) h(msg.params)
  }

  const send = (method, params) =>
    new Promise((res, rej) => {
      const n = ++id
      pending.set(n, { res, rej })
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  await send('Page.enable')
  await send('Runtime.enable')
  return {
    send,
    on: (method, fn) => handlers.set(method, fn),
    urlFor: (requestId) => urls.get(requestId),
    settled: () =>
      new Promise((res) => {
        loadResolve = res
        setTimeout(() => {
          loadResolve = null
          res()
        }, 12000)
      }),
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
