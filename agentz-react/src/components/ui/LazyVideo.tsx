import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

/**
 * A product clip that costs nothing until it is nearly on screen.
 *
 * The `<video>` renders with no `src` and no `poster`, so a browser parsing the
 * page has nothing to fetch. Two observers then stage the cost:
 *
 *   1. at POSTER_MARGIN the poster JPEG is attached, so the still is painted
 *      well before the clip scrolls up,
 *   2. at SRC_MARGIN the mp4 is attached and playback starts.
 *
 * Offscreen clips are paused, so at most a couple decode at a time.
 *
 * `autoPlay` is deliberately absent. `preload="none"` is only a hint and
 * browsers override it when `autoplay` is set on a muted video, which is how
 * every clip on the page ended up downloading in full on first paint.
 */

const POSTER_MARGIN = '800px 0px'
const SRC_MARGIN = '250px 0px'
const PLAYBACK_RATE = 0.75

type NetworkInformation = { saveData?: boolean; effectiveType?: string }

/** Data Saver, 2G, and slow 3G get the poster and nothing else. */
function metered(): boolean {
  const c = (navigator as unknown as { connection?: NetworkInformation }).connection
  if (!c) return false
  return Boolean(c.saveData) || c.effectiveType === 'slow-2g' || c.effectiveType === '2g'
}

export type LazyVideoProps = {
  /** path to the mp4 */
  src: string
  /** path to the poster still; strongly recommended, it is what shows until playback */
  poster?: string
  label: string
  className?: string
}

export function LazyVideo({ src, poster, label, className }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const holdBack = reduce || metered()
    const observers: IntersectionObserver[] = []

    if (poster) {
      const po = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return
          if (!v.getAttribute('poster')) v.setAttribute('poster', poster)
          po.disconnect()
        },
        { rootMargin: POSTER_MARGIN },
      )
      po.observe(v)
      observers.push(po)
    }

    // Reduced motion and metered connections never pull the mp4 on their own.
    // The lightbox can still force it, since the path stays on data-src.
    if (!holdBack) {
      const so = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              if (!v.src) {
                v.src = src
                v.load()
              }
              v.playbackRate = PLAYBACK_RATE
              void v.play().catch(() => {})
            } else if (v.src && !v.paused) {
              v.pause()
            }
          }
        },
        { rootMargin: SRC_MARGIN },
      )
      so.observe(v)
      observers.push(so)
    }

    return () => observers.forEach((o) => o.disconnect())
  }, [src, poster])

  return (
    <>
      <video
        ref={ref}
        data-src={src}
        data-poster={poster}
        className={className}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {/* A still clip is indistinguishable from a screenshot, which is the whole
          reason this is here. It is a cue, not a second control: the container
          around every clip is already a button that opens it full screen and
          plays it, so this stays out of the a11y tree and off the hit target
          rather than nesting a button inside a button. For reduced-motion and
          Data Saver visitors, who never get inline playback, it is permanent. */}
      <span className={playing ? 'vw-play is-off' : 'vw-play'} aria-hidden="true">
        <Icon name="play" />
      </span>
    </>
  )
}
