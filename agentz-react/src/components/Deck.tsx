import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Icon } from './ui/Icon'

/**
 * The product tour, as a 3D coverflow deck.
 *
 * Ten square slides sit on an arc in a single perspective stage. The centre
 * card faces you flat, the neighbours rotate away on Y and fall back on Z, so
 * the row reads as depth rather than as a strip of thumbnails.
 *
 * Built on CSS 3D transforms, not WebGL. The slides carry small type, and a
 * texture-mapped quad softens it; a transformed <img> stays on the browser's
 * own rasteriser and keeps every label readable. It also costs no library and
 * degrades to a plain row when the visitor asks for reduced motion.
 *
 * Drive it by drag, trackpad swipe, arrow keys, the two arrows, or the rail of
 * titles underneath. Position is fractional while you drag, so the whole arc
 * tracks the pointer instead of snapping between slots.
 */

type Slide = {
  src: string
  title: string
  alt: string
}

const SLIDES: Slide[] = [
  {
    src: './assets/img/carousel/slide-01.webp',
    title: 'Zero Trust Agentic AI Platform',
    alt: 'AgentZ title slide, built by AccuKnox: build, run and govern production agents, secure by design',
  },
  {
    src: './assets/img/carousel/slide-02.webp',
    title: 'Any LLM, in a sandbox with memory',
    alt: 'Model picker listing GLM, Claude, Gemini, Kimi and GPT models available to an agent',
  },
  {
    src: './assets/img/carousel/slide-03.webp',
    title: 'Fine grained sandbox permissions',
    alt: 'Update sandbox screen with a per-tool toggle for every tool the Composio and AccuKnox MCP servers expose',
  },
  {
    src: './assets/img/carousel/slide-04.webp',
    title: 'MCP server support',
    alt: 'MCP connection form with Slack, GitHub, Notion, Linear, Asana, Figma and Atlassian servers',
  },
  {
    src: './assets/img/carousel/slide-05.webp',
    title: 'Workflow runs, from chat',
    alt: 'An agent chat session working out which connector permissions a workflow needs, beside the files it wrote',
  },
  {
    src: './assets/img/carousel/slide-06.webp',
    title: 'Crons and schedules',
    alt: 'Schedule editor with a cron expression, timeout and run history limits',
  },
  {
    src: './assets/img/carousel/slide-07.webp',
    title: 'Live workflow graph',
    alt: 'Workflow run graph with the prepare step running, beside a step inspector showing status, timings and instructions',
  },
  {
    src: './assets/img/carousel/slide-08.webp',
    title: 'Logs and traces, span by span',
    alt: 'Span list with model calls, bash and webfetch, and a token breakdown for one call',
  },
  {
    src: './assets/img/carousel/slide-09.webp',
    title: 'MCP tool usage, profiled',
    alt: 'Graph of MCP tools called by an agent, with latency and last-used age per tool',
  },
  {
    src: './assets/img/carousel/slide-10.webp',
    title: 'See it for yourself',
    alt: 'AccuKnox and AgentZ closing slide: see us in action at support@accuknox.com',
  },
]

/** How far a card travels per step, as a share of its own width. */
const SPREAD = 0.62
/** Depth added per step away from centre, in px. */
const DEPTH = 180
/**
 * Y rotation, in degrees, as a saturating curve rather than a fixed step.
 * A flat 32deg per step sends the third card past 90deg, where it turns edge-on
 * and then shows its own back. This eases toward MAX_TILT instead: 34, 46, 53.
 */
const MAX_TILT = 72
const tiltAt = (n: number) => MAX_TILT * (1 - 1 / (1 + n * 0.9))
/** Cards further out than this are folded away and dropped from the arc. */
const VISIBLE = 3
const AUTOPLAY_MS = 5200
/**
 * The deck rests on the second slide, not the first. Parked at index 0 there is
 * nothing to the left, so the arc opens with two cards and reads as a strip
 * that only travels one way. From here it opens with three, the cover peeking
 * in from the left, which says at a glance that the deck moves both ways.
 */
const START_INDEX = 1

export function Deck() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(START_INDEX)
  const [drag, setDrag] = useState(0) // live pointer travel, in px
  const [zoom, setZoom] = useState(-1) // slide open full screen, -1 for none
  const [paused, setPaused] = useState(false)

  const stage = useRef<HTMLDivElement>(null)
  const pointer = useRef({ id: -1, x: 0, moved: false, card: -1 })
  /* set when a pointer release already acted, so the synthetic click that some
     browsers still deliver afterwards does not act a second time */
  const handledAt = useRef(0)
  const step = useRef(320) // px of travel that equals one slide

  const clamp = (n: number) => Math.max(0, Math.min(SLIDES.length - 1, n))
  const go = useCallback((n: number) => setIndex(clamp(n)), [])

  /* One slide of travel is measured off the real card, so a drag feels the
     same on a phone as it does on a 27in monitor. */
  const measure = useCallback(() => {
    const card = stage.current?.querySelector('.deck-card')
    if (card) step.current = card.getBoundingClientRect().width * SPREAD
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  /* Autoplay only while the deck is on screen, unhovered, and not zoomed. It
     stops for good the moment someone takes over with a drag or a key. */
  const [seen, setSeen] = useState(false)
  const [manual, setManual] = useState(false)
  useEffect(() => {
    const el = stage.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((e) => setSeen(e[0].isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* Ten slides is 340KB, and the deck sits close enough to the fold that
     Chrome's own loading="lazy" heuristic fetches four of them before the
     visitor has scrolled at all, which puts first paint over budget. Hold the
     src back until the deck is within 200px of the viewport. */
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setArmed(true)
      return
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          setArmed(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (reduce || manual || paused || !seen || zoom >= 0) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [reduce, manual, paused, seen, zoom])

  const takeOver = () => setManual(true)

  /* ── pointer drag ──
     The stage captures the pointer so a drag survives leaving the card, but
     capture also moves the following click to the stage, which is why the
     arrows and the cards used to swallow their own taps. So: the discrete
     controls opt out of capture entirely, and a tap on a card is resolved here
     on release rather than by waiting for a click that never arrives. */
  function onDown(e: React.PointerEvent) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const t = e.target as HTMLElement
    if (t.closest('.deck-arrow, .deck-tick')) return
    const card = t.closest('.deck-card') as HTMLElement | null
    pointer.current = {
      id: e.pointerId,
      x: e.clientX,
      moved: false,
      card: card ? Number(card.dataset.i) : -1,
    }
    measure()
    takeOver()
    // throws if the pointer is already gone; the drag still works without it
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* no capture, no problem */
    }
  }
  function onMove(e: React.PointerEvent) {
    if (pointer.current.id !== e.pointerId) return
    const dx = e.clientX - pointer.current.x
    if (Math.abs(dx) > 4) pointer.current.moved = true
    // resist past the two ends so the deck feels bounded, not broken
    const raw = -dx / step.current
    const over = index + raw < 0 || index + raw > SLIDES.length - 1
    setDrag(over ? raw * 0.32 : raw)
  }
  function onUp(e: React.PointerEvent) {
    if (pointer.current.id !== e.pointerId) return
    const { moved, card } = pointer.current
    pointer.current.id = -1
    const landed = Math.round(index + drag)
    setDrag(0)
    if (!moved && card >= 0) {
      handledAt.current = Date.now()
      if (card === index) setZoom(card)
      else go(card)
      return
    }
    go(landed)
  }

  /* ── trackpad: horizontal intent only, so the page keeps scrolling ── */
  const wheelLock = useRef(0)
  function onWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.4) return
    const now = Date.now()
    if (now - wheelLock.current < 320) return
    wheelLock.current = now
    takeOver()
    go(index + (e.deltaX > 0 ? 1 : -1))
  }

  /* Arrow keys steer the deck whenever it is the thing on screen, not only
     once it has been clicked into focus. Left and right never scroll a page
     that has no horizontal overflow, so nothing is taken away. */
  useEffect(() => {
    if (zoom >= 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      /* measured rather than observed: an IntersectionObserver that never
         fires would leave the keys dead, and the rect is the truth anyway */
      const r = stage.current?.getBoundingClientRect()
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return
      const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
      if (e.key in map) {
        e.preventDefault()
        takeOver()
        setIndex((i) => clamp(i + map[e.key]))
      } else if (e.key === 'Home') {
        takeOver()
        setIndex(0)
      } else if (e.key === 'End') {
        takeOver()
        setIndex(SLIDES.length - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  /* ── zoom overlay ── */
  useEffect(() => {
    if (zoom < 0) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(-1)
      if (e.key === 'ArrowRight') setZoom((z) => Math.min(SLIDES.length - 1, z + 1))
      if (e.key === 'ArrowLeft') setZoom((z) => Math.max(0, z - 1))
    }
    document.addEventListener('keydown', onEsc)
    document.body.classList.add('lb-lock')
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.classList.remove('lb-lock')
    }
  }, [zoom])

  const pos = index + drag
  const dragging = pointer.current.id !== -1

  return (
    <section className="deck" id="tour" aria-roledescription="carousel" aria-label="AgentZ product tour">
      <div className="wrap">
        <div className="deck-head">
          <span className="section-eyebrow">The tour</span>
          <h2 className="section-h2">
            The whole platform, <span className="hl hl-a">ten screens</span>.
          </h2>
          <p className="deck-lead">
            Real screens from AgentZ. Drag the deck, swipe it, or use the arrow keys.
          </p>
        </div>
      </div>

      <div
        className={`deck-stage${dragging ? ' is-dragging' : ''}${reduce ? ' is-flat' : ''}`}
        ref={stage}
        role="group"
        aria-label={`Slide ${index + 1} of ${SLIDES.length}: ${SLIDES[index].title}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={onWheel}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="deck-arc" data-audit-offstage="3d carousel: cards sit off-viewport by design">
          {SLIDES.map((s, i) => {
            const off = i - pos
            const abs = Math.abs(off)
            const dir = off < 0 ? -1 : 1
            const capped = Math.min(abs, VISIBLE)
            /* Reduced motion keeps the same deck, flat: the cards slide on one
               plane with no rotation and no depth, so nothing swings past. */
            const style = reduce
              ? {
                  transform: `translate3d(${off * 104}%,0,0)`,
                  opacity: abs > 1.1 ? 0 : 1,
                  zIndex: 100 - Math.round(abs * 10),
                  pointerEvents: abs > 1.1 ? ('none' as const) : undefined,
                }
              : {
                  transform: `translate3d(${off * SPREAD * 100}%,0,${-capped * DEPTH}px) rotateY(${-dir * tiltAt(capped)}deg) scale(${1 - capped * 0.055})`,
                  /* Cards stay fully opaque out to the last visible slot. A
                     translucent card shows every card stacked behind it, and
                     with 38% of each card covered by its neighbour that reads
                     as one smeared image rather than as a deck. Depth comes
                     from brightness and saturation instead, which keep the
                     card solid. Only the outermost slot fades, and it does so
                     under the stage's own edge mask. */
                  opacity: abs > VISIBLE + 0.4 ? 0 : Math.min(1, Math.max(0, (VISIBLE + 0.4 - abs) / 0.4)),
                  zIndex: 100 - Math.round(abs * 10),
                  filter: `saturate(${1 - capped * 0.13}) brightness(${1 - capped * 0.1})`,
                  pointerEvents: abs > VISIBLE + 0.4 ? ('none' as const) : undefined,
                }
            const current = Math.round(pos) === i
            return (
              <figure className="deck-card" key={s.src} data-i={i} style={style} aria-hidden={abs > 0.5}>
                <button
                  type="button"
                  className="deck-hit"
                  tabIndex={current ? 0 : -1}
                  aria-label={current ? `Open ${s.title} full screen` : `Go to ${s.title}`}
                  onClick={() => {
                    // pointer taps are resolved in onUp; this is the keyboard path
                    if (Date.now() - handledAt.current < 400) return
                    takeOver()
                    if (current) setZoom(i)
                    else go(i)
                  }}
                >
                  <img
                    src={armed ? s.src : undefined}
                    alt={s.alt}
                    width={1000}
                    height={1000}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  <span className="deck-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="deck-zoom" aria-hidden="true">
                    <Icon name="expand" />
                  </span>
                </button>
              </figure>
            )
          })}
        </div>

        <button
          type="button"
          className="deck-arrow deck-prev"
          aria-label="Previous slide"
          disabled={index === 0}
          onClick={() => {
            takeOver()
            go(index - 1)
          }}
        >
          <Icon name="chev" />
        </button>
        <button
          type="button"
          className="deck-arrow deck-next"
          aria-label="Next slide"
          disabled={index === SLIDES.length - 1}
          onClick={() => {
            takeOver()
            go(index + 1)
          }}
        >
          <Icon name="chev" />
        </button>
      </div>

      <div className="wrap">
        <div className="deck-foot">
          <p className="deck-caption" aria-live="polite">
            <span className="deck-count">
              {String(index + 1).padStart(2, '0')}
              <span>/{SLIDES.length}</span>
            </span>
            {SLIDES[index].title}
          </p>
          <div className="deck-rail" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.title}
                className={`deck-tick${i === index ? ' is-on' : ''}`}
                onClick={() => {
                  takeOver()
                  go(i)
                }}
              >
                <span />
              </button>
            ))}
          </div>
        </div>
      </div>

      {zoom >= 0 && (
        <div
          className="deck-lb is-open"
          role="dialog"
          aria-modal="true"
          aria-label={SLIDES[zoom].title}
          onClick={() => setZoom(-1)}
        >
          <button type="button" className="deck-lb-close" aria-label="Close">
            <Icon name="close" />
          </button>
          <img src={SLIDES[zoom].src} alt={SLIDES[zoom].alt} width={1000} height={1000} />
          <p className="deck-lb-cap">{SLIDES[zoom].title}</p>
        </div>
      )}
    </section>
  )
}
