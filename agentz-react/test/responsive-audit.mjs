/**
 * Responsive regression audit.
 *
 * Drives a headless Chrome over the built site at a set of real device
 * viewports, scrolls the whole page at each one, and fails on any layout
 * defect: horizontal overflow, content clipped with no way to reach it,
 * sub-44px tap targets, sub-12px type, fixed chrome sitting on hero content.
 *
 *   npm run build
 *   npm run preview -- --port 4173
 *   node test/responsive-audit.mjs [http://localhost:4173]
 *
 * Needs a Chrome/Chromium on PATH or CHROME_PATH. Exits non-zero on failure.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'

// Node 20 keeps the global WebSocket behind a flag; Node 22+ has it by default.
// Re-exec ourselves with the flag rather than pulling in a dependency.
if (typeof WebSocket === 'undefined') {
  const r = spawnSync(
    process.execPath,
    ['--experimental-websocket', '--no-warnings', new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), ...process.argv.slice(2)],
    { stdio: 'inherit' },
  )
  process.exit(r.status ?? 2)
}

const BASE = process.argv[2] || 'http://localhost:4173'

/** Viewports worth defending. Widths bracket every breakpoint in globals.css. */
const VIEWPORTS = [
  { name: 'iPhone SE (small phone)', w: 320, h: 568 },
  { name: 'Android compact', w: 360, h: 800 },
  { name: 'iPhone SE 3', w: 375, h: 667 },
  { name: 'iPhone 14', w: 390, h: 844 },
  { name: 'iPhone 14 Pro Max', w: 430, h: 932 },
  { name: 'large phone / small tablet', w: 540, h: 960 },
  { name: 'breakpoint edge 640', w: 640, h: 800 },
  { name: 'breakpoint edge 721', w: 721, h: 1000 },
  { name: 'iPad mini portrait', w: 768, h: 1024 },
  { name: 'iPad Air portrait', w: 834, h: 1112 },
  { name: 'phone landscape', w: 844, h: 390 },
  { name: 'small phone landscape', w: 667, h: 375 },
  // Above the 900px width arm, so this one is only covered because its pointer
  // is coarse. It is the case that proves the touch query, not the width query.
  { name: 'iPad Pro portrait (touch)', w: 1024, h: 1366, touch: true },
]

/** Deliberate design choices, not defects. */
const WAIVERS = [
  // the oversized footer wordmark is cropped by design
  /foot-wordmark-wrap/,
  // .sr-only is the standard visually-hidden recipe: a 1px box that clips its
  // own text on purpose, so CLIPPED_X/Y on it is the pattern working
  /CLIPPED_[XY] (span|caption)\.sr-only/,
  // the coverflow deck is an arc wider than any viewport, clipped to the
  // section on purpose; its cards carry [data-audit-offstage] individually
  /CLIPPED_X section#tour\.deck /,
]

const AUDIT = `(() => {
  const nm = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id;
    const c = typeof el.className === 'string' ? el.className : '';
    if (c) s += '.' + c.trim().split(/\\s+/).slice(0, 3).join('.'); return s; };
  const scroller = (el) => { let p = el.parentElement;
    while (p && p !== document.body) { const c = getComputedStyle(p);
      if (/auto|scroll/.test(c.overflowX) && p.scrollWidth > p.clientWidth + 2) return p; p = p.parentElement; }
    return null; };
  const VW = document.documentElement.clientWidth, VH = window.innerHeight, atTop = window.scrollY < 4;
  const out = [];
  if (document.documentElement.scrollWidth > VW + 1)
    out.push('PAGE_H_SCROLL html scrollWidth=' + document.documentElement.scrollWidth + ' viewport=' + VW);
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) continue;
    const sc = scroller(el);
    // painted outside the viewport, and not inside a scroller that can reach it
    // a 3D carousel puts cards outside the viewport by design and clips them
    // at the section; the arc is marked so this stays an opt-in, not a blanket
    if ((r.right > VW + 1 || r.left < -1) && !el.closest('[data-audit-offstage]')) {
      if (sc) { const sr = sc.getBoundingClientRect(); const rel = r.left - sr.left + sc.scrollLeft;
        if (rel < -1.5 || rel + r.width > sc.scrollWidth + 2) out.push('UNREACHABLE ' + nm(el) + ' in ' + nm(sc)); }
      else out.push('OUT_OF_VIEWPORT ' + nm(el) + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    }
    if (/hidden|clip/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2)
      out.push('CLIPPED_X ' + nm(el) + ' ' + el.scrollWidth + '>' + el.clientWidth);
    if (/hidden|clip/.test(cs.overflowY) && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 2)
      out.push('CLIPPED_Y ' + nm(el) + ' ' + el.scrollHeight + '>' + el.clientHeight);
    // an LTR scroller cannot scroll left of its origin, so anything there is lost
    if (/auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2) {
      for (const k of el.querySelectorAll('*')) { const kr = k.getBoundingClientRect();
        if (kr.width && kr.left - r.left + el.scrollLeft < -1.5) { out.push('UNREACHABLE_LEFT ' + nm(el) + ' child=' + nm(k)); break; } }
    }
    const p = el.parentElement;
    if (p && p !== document.body && cs.position === 'static') {
      const pcs = getComputedStyle(p), pr = p.getBoundingClientRect();
      const inner = pr.width - (parseFloat(pcs.paddingLeft) || 0) - (parseFloat(pcs.paddingRight) || 0);
      if (inner > 0 && r.width > inner + 1 && pcs.overflowX === 'visible' && !sc)
        out.push('WIDER_THAN_PARENT ' + nm(el) + ' ' + Math.round(r.width) + '>' + Math.round(inner));
    }
    if (el.matches('a[href],button,summary,[role="button"],input,select,textarea') && cs.pointerEvents !== 'none' && !el.disabled) {
      const inlineLink = el.tagName === 'A' && cs.display.startsWith('inline') && el.closest('p,li,figcaption');
      if (!inlineLink && r.height > 0 && (r.height < 44 || r.width < 44))
        out.push('TAP_TARGET<44 ' + nm(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      const fs = parseFloat(cs.fontSize);
      if (fs < 12) out.push('TEXT<12px ' + nm(el) + ' ' + fs + 'px');
    }
    if (atTop && cs.position === 'fixed' && r.height > 0 && r.height < VH * 0.5) {
      for (const t of document.querySelectorAll('main a[href],main button,main h1,main h2,main img,main p')) {
        const tr = t.getBoundingClientRect(); if (!tr.height || tr.bottom < 0 || tr.top > VH) continue;
        if (Math.min(r.right, tr.right) - Math.max(r.left, tr.left) > 4 &&
            Math.min(r.bottom, tr.bottom) - Math.max(r.top, tr.top) > 4) { out.push('FIXED_OVERLAP ' + nm(el) + ' over ' + nm(t)); break; }
      }
    }
    if (/^(img|video)$/i.test(el.tagName) && r.height > VH * 1.05)
      out.push('MEDIA_TALLER_THAN_VIEWPORT ' + nm(el) + ' ' + Math.round(r.height));
  }
  return out;
})()`

const WALK = `(async () => {
  const H = document.documentElement.scrollHeight, VH = window.innerHeight, found = [];
  for (let y = 0; y <= H - VH; y += Math.round(VH * 0.75)) {
    window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90));
    found.push(...${AUDIT});
  }
  window.scrollTo(0, H); await new Promise((r) => setTimeout(r, 200));
  found.push(...${AUDIT});
  // every scroll-reveal target must actually have revealed by the end; wait out
  // the 600ms reveal transition first so a mid-fade value is not read as stuck
  await new Promise((r) => setTimeout(r, 900));
  const stuck = [...document.querySelectorAll('.vw-hero,.arch-frame,.arch-rail,.org-canvas,.step')]
    .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99)
    .map((el) => 'NEVER_REVEALED ' + el.className);
  window.scrollTo(0, 0);
  return { findings: [...new Set([...found, ...stuck])], pageHeight: H };
})()`

// ── minimal CDP client, so this test needs no extra dependencies ──
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const local = process.env.LOCALAPPDATA
  // any Chromium engine will do; Edge ships on every Windows box
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

async function main() {
  const bin = chromePath()
  if (!bin) {
    console.error('No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.')
    process.exit(2)
  }
  const port = await freePort()
  const chrome = spawn(
    bin,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars', // match a touch device: no classic scrollbar stealing width
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  const cdp = await connect(port)
  let failures = 0

  try {
    for (const vp of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.w,
        height: vp.h,
        deviceScaleFactor: 1,
        mobile: vp.touch ?? vp.w < 900,
      })
      // makes (pointer: coarse) / (hover: none) report true, so touch-only rules
      // are exercised rather than skipped
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: vp.touch ?? vp.w < 900 })
      await cdp.send('Page.navigate', { url: BASE })
      await cdp.settled()
      await new Promise((r) => setTimeout(r, 900))

      const { result } = await cdp.send('Runtime.evaluate', {
        expression: WALK,
        awaitPromise: true,
        returnByValue: true,
      })
      const findings = (result.value?.findings || []).filter((f) => !WAIVERS.some((w) => w.test(f)))
      const label = `${vp.name} — ${vp.w}x${vp.h}`
      if (findings.length) {
        failures += findings.length
        console.log(`FAIL  ${label}`)
        for (const f of findings.slice(0, 12)) console.log(`        ${f}`)
        if (findings.length > 12) console.log(`        ...and ${findings.length - 12} more`)
      } else {
        console.log(`ok    ${label}`)
      }
    }
  } finally {
    chrome.kill()
  }

  console.log(failures ? `\n${failures} responsive defect(s).` : '\nAll viewports clean.')
  process.exit(failures ? 1 : 0)
}

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
  let loadResolve = null
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result)
    } else if (msg.method === 'Page.loadEventFired' && loadResolve) {
      loadResolve()
      loadResolve = null
    }
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
    settled: () => new Promise((res) => {
      loadResolve = res
      setTimeout(() => { loadResolve = null; res() }, 12000)
    }),
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
