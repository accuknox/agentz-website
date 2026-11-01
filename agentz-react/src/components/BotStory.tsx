import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Bot, BotState } from '../lib/bot3d'
import { Icon } from './ui/Icon'
import '../styles/botstory.css'

/**
 * A live agent run, as the enforcement layer sees it.
 *
 * The bot stands in the page in 3D. To its left, the event stream the
 * sandbox emits: every tool call, syscall, egress attempt and key swap, with
 * the verdict policy gave it. To its right, run telemetry that counts up while
 * the run is on screen. A segmented control plays six chapters of one run on
 * its own, and the stream, the counters and the bot all follow the chapter.
 * No cards: the data itself is the visual.
 *
 * three.js loads only when the section is a screen away, and the render loop
 * stops when it leaves. Reduced motion gets still 3D frames, but the data keeps updating.
 */

type Verdict = 'allow' | 'deny' | 'warn' | 'info'
type Ev = [kind: string, text: string, verdict: Verdict, label: string]

type Chapter = {
  id: string
  tab: string
  icon: string
  caption: string
  beats: [BotState, number][]
  ms: number
  events: Ev[]
  /** counter growth per second while this chapter plays */
  rate: { calls: number; syscalls: number; denied: number }
}

const CHAPTERS: Chapter[] = [
  {
    id: 'wake',
    tab: 'Trigger',
    icon: 'clock',
    caption: 'Cron 0 9 * * 1 fires. A fresh sandbox boots with the default-deny profile.',
    beats: [['sleeping', 0], ['greeting', 1100]],
    ms: 3400,
    rate: { calls: 0, syscalls: 900, denied: 0 },
    events: [
      ['cron', '0 9 * * 1 fired', 'info', 'run'],
      ['k8s', 'pod agent-7f3c scheduled', 'info', 'ok'],
      ['kubearmor', 'policy agent-default applied', 'allow', 'enforce'],
      ['cilium', 'egress allowlist: 2 FQDNs', 'allow', 'enforce'],
      ['vault', '2 scoped tokens mapped', 'allow', 'ready'],
    ],
  },
  {
    id: 'plan',
    tab: 'Plan',
    icon: 'model',
    caption: 'The skill loads, and the model you bring plans three tool calls.',
    beats: [['listening', 0], ['thinking', 1200]],
    ms: 3400,
    rate: { calls: 1, syscalls: 1400, denied: 0 },
    events: [
      ['skill', 'weekly-ticket-summary v3', 'info', 'load'],
      ['model', 'claude-sonnet via BYOK', 'allow', 'route'],
      ['plan', 'jira.search → summarize → slack.post', 'info', '3 steps'],
      ['context', '18.2K tokens, 0 secrets', 'allow', 'clean'],
    ],
  },
  {
    id: 'act',
    tab: 'Tool calls',
    icon: 'search',
    caption: 'Each call leaves through the gateway. The proxy swaps placeholders for vault keys.',
    beats: [['processing', 0]],
    ms: 3800,
    rate: { calls: 7, syscalls: 3200, denied: 0 },
    events: [
      ['mcp', 'jira.search_issues project=OPS', 'allow', 'allow'],
      ['proxy', 'JIRA_KEY → vault/jira [*.atlassian.net]', 'allow', 'swap'],
      ['cilium', 'acme.atlassian.net:443', 'allow', 'allow'],
      ['file', 'write /work/tickets.json', 'allow', 'allow'],
      ['span', '#7 jira.search_issues 412 ms', 'info', 'traced'],
    ],
  },
  {
    id: 'attack',
    tab: 'Injection',
    icon: 'lock',
    caption: 'Ticket 318 hides rm -rf /. KubeArmor kills the process and Cilium drops the exfil.',
    beats: [['threat', 0]],
    ms: 4400,
    rate: { calls: 2, syscalls: 2600, denied: 3 },
    events: [
      ['guard', 'prompt injection in ticket 318', 'warn', 'LLM01'],
      ['mcp', 'shell.exec "rm -rf /"', 'deny', 'deny'],
      ['kubearmor', 'process /bin/rm', 'deny', 'block'],
      ['cilium', 'paste.example:443', 'deny', 'drop'],
      ['trace', 'span #9 flagged for review', 'warn', 'flag'],
    ],
  },
  {
    id: 'recover',
    tab: 'Retry',
    icon: 'replay',
    caption: 'Slack rate-limits the post. The run backs off, quarantines 318 and retries.',
    beats: [['error', 0], ['speaking', 1700]],
    ms: 3800,
    rate: { calls: 3, syscalls: 1800, denied: 0 },
    events: [
      ['mcp', 'slack.chat_postMessage', 'warn', '429'],
      ['retry', 'backoff 2s, attempt 2 of 3', 'info', 'wait'],
      ['quarantine', 'ticket 318 excluded', 'allow', 'ok'],
      ['mcp', 'slack.chat_postMessage #ops', 'allow', '200'],
    ],
  },
  {
    id: 'done',
    tab: 'Audit',
    icon: 'verdict',
    caption: 'The span tree is signed and shipped to your SIEM. Replay any step.',
    beats: [['success', 0], ['idle', 2400]],
    ms: 3400,
    rate: { calls: 0, syscalls: 400, denied: 0 },
    events: [
      ['trace', '14 spans, signed', 'allow', 'sealed'],
      ['siem', 'exported 3 alerts', 'allow', 'sent'],
      ['run', 'completed in 3m 12s', 'allow', 'success'],
      ['audit', 'secrets in context: 0', 'allow', 'clean'],
    ],
  },
]

const START = { calls: 1180, syscalls: 48210, denied: 34 }

type Line = { id: number; t: string; e: Ev }

const rnd = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo))
const HEARTBEATS: (() => Ev)[] = [
  () => ['kubearmor', `audited ${rnd(80, 640)} syscalls, pid ${rnd(1200, 1900)}`, 'info', 'audit'],
  () => ['cilium', `flow 10.42.${rnd(0, 9)}.${rnd(2, 250)} → 10.42.0.1:53 dns`, 'allow', 'allow'],
  () => ['gateway', `policy check ${rnd(1, 4)}.${rnd(0, 9)} ms`, 'info', 'ok'],
  () => ['file', `read /work/cache/${rnd(100, 999)}.json`, 'allow', 'allow'],
  () => ['otel', `span exported, ${rnd(2, 40)} attrs`, 'info', 'ok'],
  () => ['proxy', `token cache hit, ttl ${rnd(120, 900)} s`, 'info', 'ok'],
]
const heartbeat = () => HEARTBEATS[rnd(0, HEARTBEATS.length)]()

const stamp = (ms: number) => {
  const s = 9 * 3600 + Math.floor(ms / 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}.${String(ms % 1000).padStart(3, '0')}`
}

/** The event stream: new lines arrive at the bottom and old ones fade out the top. */
function Stream({ chapter, playing }: { chapter: number; playing: boolean }) {
  const [lines, setLines] = useState<Line[]>([])
  const seq = useRef(0)
  const clock = useRef(0)
  const shown = useRef(-1)
  useEffect(() => {
    const pool = CHAPTERS[chapter].events
    // resuming the same chapter (after scrolling away and back) continues
    // with background lines instead of replaying its events
    let i = shown.current === chapter ? pool.length : 0
    shown.current = chapter
    const push = () => {
      // each chapter event appears once, then the stream falls back to the
      // steady background a real sandbox emits, so no line ever repeats
      const e = i < pool.length ? pool[i] : heartbeat()
      i++
      clock.current += 180 + Math.floor(Math.random() * 520)
      const line = { id: seq.current++, t: stamp(clock.current), e }
      setLines((ls) => [...ls.slice(-15), line])
    }
    push()
    if (!playing) {
      pool.slice(1).forEach(push)
      return
    }
    const id = window.setInterval(push, 380)
    return () => window.clearInterval(id)
  }, [chapter, playing])

  const LEVEL: Record<Verdict, string> = { allow: 'ALLOW', deny: 'DENY', warn: 'WARN', info: 'INFO' }
  return (
    <div className="lv" aria-label="Sandbox event stream">
      <div className="lv-bar">
        <span className="lv-live">
          <i />
          Live
        </span>
        <code>agentz logs -f run/1284</code>
        <span className="lv-scope">sandbox, gateway, proxy</span>
      </div>
      <ol className="ev">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.li
              key={l.id}
              layout="position"
              className={`ev-line is-${l.e[2]}`}
              initial={{ opacity: 0, backgroundColor: 'rgba(120,140,255,0.16)' }}
              animate={{ opacity: 1, backgroundColor: 'rgba(120,140,255,0)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <time>{l.t}</time>
              <b className="ev-level">{LEVEL[l.e[2]]}</b>
              <span className="ev-kind">{l.e[0]}</span>
              <span className="ev-text">
                {l.e[1]}
                <em>{l.e[3]}</em>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
      <div className="lv-foot">
        <span>{(lines.length ? lines[lines.length - 1].id + 1 : 0).toLocaleString('en-US')} events</span>
        <span>policy p99 4 ms</span>
        <span>trace: signed</span>
      </div>
    </div>
  )
}

/** Run telemetry that counts up while the run plays. */
function Telemetry({ chapter, playing }: { chapter: number; playing: boolean }) {
  const [v, setV] = useState(START)
  const rate = useRef(CHAPTERS[chapter].rate)
  rate.current = CHAPTERS[chapter].rate
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let acc = { calls: 0, syscalls: 0, denied: 0 }
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const r = rate.current
      acc = { calls: acc.calls + r.calls * dt, syscalls: acc.syscalls + r.syscalls * dt, denied: acc.denied + r.denied * dt }
      const whole = { calls: Math.floor(acc.calls), syscalls: Math.floor(acc.syscalls), denied: Math.floor(acc.denied) }
      if (whole.calls || whole.syscalls || whole.denied) {
        acc = { calls: acc.calls - whole.calls, syscalls: acc.syscalls - whole.syscalls, denied: acc.denied - whole.denied }
        setV((p) => ({ calls: p.calls + whole.calls, syscalls: p.syscalls + whole.syscalls, denied: p.denied + whole.denied }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const n = (x: number) => x.toLocaleString('en-US')
  const hot = CHAPTERS[chapter].id === 'attack'
  return (
    <dl className="tm">
      <div>
        <dt>Tool calls gated</dt>
        <dd>{n(v.calls)}</dd>
      </div>
      <div>
        <dt>Syscalls audited</dt>
        <dd>{n(v.syscalls)}</dd>
      </div>
      <div className={hot ? 'is-hot' : ''}>
        <dt>Actions denied</dt>
        <dd>{n(v.denied)}</dd>
      </div>
      <div className="is-zero">
        <dt>Secrets in agent context</dt>
        <dd>0</dd>
      </div>
    </dl>
  )
}

/* ── section ── */

export function BotStory() {
  const reduced = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const bot = useRef<Bot | null>(null)
  const [chapter, setChapter] = useState(0)
  const [beat, setBeat] = useState(0)
  const [run, setRun] = useState(0) // bumps on every jump, so timers restart
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = section.current
    if (!el) return
    let loading = false
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting && e.intersectionRatio > 0.2)
        if (e.isIntersecting && !loading) {
          loading = true
          import('../lib/bot3d')
            .then(({ createBot }) => {
              if (!canvas.current) return
              bot.current = createBot(canvas.current)
              setReady(true)
            })
            .catch(() => setFailed(true))
        }
      },
      { rootMargin: '100% 0px', threshold: [0, 0.2, 0.5] },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      bot.current?.dispose()
      bot.current = null
    }
  }, [])

  useEffect(() => {
    const b = bot.current
    if (!b) return
    if (reduced) b.renderOnce()
    else if (visible) b.start()
    else b.stop()
  }, [visible, ready, reduced])

  useEffect(() => {
    if (!ready) return
    const c = CHAPTERS[chapter]
    setBeat(0)
    const timers = c.beats.slice(1).map(([, at], i) => window.setTimeout(() => setBeat(i + 1), at))
    if (visible) {
      timers.push(window.setTimeout(() => setChapter((n) => (n + 1) % CHAPTERS.length), c.ms))
    }
    return () => timers.forEach(window.clearTimeout)
  }, [chapter, run, ready, visible])

  useEffect(() => {
    const b = bot.current
    if (!b) return
    b.setState(CHAPTERS[chapter].beats[Math.min(beat, CHAPTERS[chapter].beats.length - 1)][0])
    if (reduced) b.renderOnce()
  }, [chapter, beat, ready, reduced])

  function onMove(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect()
    bot.current?.setPointer(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
  }

  const c = CHAPTERS[chapter]
  const state = c.beats[Math.min(beat, c.beats.length - 1)][0]
  // reduced motion stops movement, not data: the stream, the counters and the
  // chapters keep updating, only the 3D loop and the transitions hold still
  const playing = ready && visible

  return (
    <section className={`bots is-${state} ch-${c.id}`} id="run" ref={section} aria-labelledby="bots-h">
      <div className="wrap bots-head">
        <h2 className="bots-h" id="bots-h">
          One run, start to finish.
        </h2>
        <p className="bots-sub">KubeArmor gates processes and files. Cilium gates egress. The proxy holds the keys.</p>

        <div className="seg" role="tablist" aria-label="Stages of the run">
          {CHAPTERS.map((ch, i) => {
            const on = i === chapter
            return (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={`seg-tab${on ? ' is-on' : ''}${ch.id === 'attack' ? ' hue-red' : ' hue-blue'}`}
                onClick={() => {
                  setChapter(i)
                  setRun((r) => r + 1)
                }}
              >
                {on && (
                  <motion.span className="seg-pill" layoutId="seg-pill" transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
                    {playing && <b key={`${chapter}-${run}`} style={{ animationDuration: `${ch.ms}ms` }} />}
                  </motion.span>
                )}
                <Icon name={`d-${ch.icon}`} className="duo seg-ico" />
                <span className="seg-label">{ch.tab}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={c.id}
            className="stage-caption"
            aria-live="polite"
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {c.caption}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="stage" onPointerMove={onMove} onPointerLeave={() => bot.current?.setPointer(0, 0)}>
        <canvas
          ref={canvas}
          className={`stage-canvas${ready ? ' is-ready' : ''}`}
          role="img"
          aria-label={`The AgentZ bot. ${c.caption}`}
        />
        {failed && <FlatBot />}

        <Stream chapter={chapter} playing={playing} />
        <Telemetry chapter={chapter} playing={playing} />

        <div className="stage-lanes">

          <AnimatePresence mode="wait">
            <motion.div key={c.id} className="stage-fx" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
              {c.id === 'act' && (
                <div className="fx-feed" aria-hidden="true">
                  {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} style={{ '--i': i } as CSSProperties}>
                      <Icon name="d-ticket" className="duo hue-cyan" />
                    </span>
                  ))}
                </div>
              )}
              {c.id === 'attack' && (
                <>
                  <div className="fx-danger" aria-hidden="true" />
                  <div className="fx-shield" aria-hidden="true">
                    <span className="fx-impact" />
                  </div>
                  <motion.code
                    className="fx-evil"
                    aria-hidden="true"
                    initial={{ opacity: 0, x: 120 }}
                    animate={{ opacity: 1, x: [120, 0, -56, 10, 0], transition: { duration: 1.8, times: [0, 0.35, 0.55, 0.75, 1], ease: 'easeOut' } }}
                  >
                    rm -rf /
                  </motion.code>
                </>
              )}
              {c.id === 'wake' && <div className="fx-boot" aria-hidden="true" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </section>
  )
}

/** The idle frame from the flat mascot kit, for browsers without WebGL. */
function FlatBot() {
  return (
    <svg className="stage-flat" viewBox="-20 -40 222 236" aria-hidden="true">
      <defs>
        <linearGradient id="bots-ag" x1="14.88" y1="106.46" x2="178.12" y2="139.92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C80019" />
          <stop offset="0.495" stopColor="#6464FF" />
          <stop offset="1" stopColor="#0000C8" />
        </linearGradient>
      </defs>
      <ellipse cx="94.68" cy="94.68" rx="83.86" ry="81.15" fill="url(#bots-ag)" />
      <path
        d="M181.24 89.27C181.24 138.57 140.67 148.78 90.62 148.78C40.57 148.78 0 138.57 0 89.27C0 39.97 40.57 0 90.62 0C140.67 0 181.24 39.97 181.24 89.27Z"
        fill="#E7E9EB"
      />
      <path
        d="M124.52 54.4C97.27 52.07 63.98 63.36 64.94 89.06C65.88 114.23 97.99 124.6 124.52 121.05C144.93 118.32 163.71 118.39 167.08 91.72C171.12 59.73 154.19 56.93 124.52 54.4Z"
        fill="#000"
      />
      <ellipse cx="100.09" cy="89.27" rx="10.82" ry="13.53" fill="#35CCFC" />
      <ellipse cx="148.78" cy="89.27" rx="10.82" ry="13.53" fill="#35CCFC" />
      <ellipse cx="29.75" cy="89.27" rx="24.35" ry="29.76" fill="#FFF" />
      <ellipse cx="29.76" cy="89.27" rx="16.23" ry="18.94" fill="#0C0CA8" />
      <ellipse cx="29.76" cy="89.27" rx="8.12" ry="10.82" fill="#9696FF" />
    </svg>
  )
}
