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
 * every clip on the page ended up downloading in full on first paint. The
 * observer below starts playback instead, which gets the same result on screen
 * without handing the fetch decision to the browser.
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
  /**
   * When the play cue is drawn over the clip.
   *
   * `'paused'` (the default) draws it any time the clip is not running, which
   * is what a grid of cards wants: most of them are stopped most of the time,
   * and a stopped clip is indistinguishable from a screenshot.
   *
   * `'held'` draws it only for a visitor who never gets inline playback at all,
   * meaning reduced motion or a metered connection. Use it on the clips that
   * are meant to run by themselves the moment they arrive, so nothing sits on
   * top of them while they play.
   */
  cue?: 'paused' | 'held'
}

export function LazyVideo({ src, poster, label, className, cue = 'paused' }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  /** true once this visitor is known to get no inline playback at all */
  const [held, setHeld] = useState(false)
  /** the clip is on screen and should be running, whether or not it managed to */
  const wants = useRef(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const holdBack = reduce || metered()
    setHeld(holdBack)
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
              wants.current = true
              if (!v.src) {
                v.src = src
                v.load()
              }
              v.playbackRate = PLAYBACK_RATE
              void v.play().catch(() => {})
            } else if (v.src && !v.paused) {
              wants.current = false
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

  /* The first play() lands while the clip is still opening, and a browser is
     free to reject it with an AbortError and leave the clip parked on its
     poster. Asking again once there are frames to show is what makes a clip
     reliably start by itself rather than only usually. */
  function retry() {
    const v = ref.current
    if (!v || !wants.current || !v.paused) return
    v.playbackRate = PLAYBACK_RATE
    void v.play().catch(() => {})
  }

  /* A clip told to run by itself only carries a cue when this visitor gets no
     playback at all; otherwise the cue would sit over a clip that is playing. */
  const showCue = cue === 'held' ? held : !playing

  return (
    <>
      <video
        ref={ref}
        data-src={src}
        data-poster={poster}
        data-cue={cue}
        className={className}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedData={retry}
        onCanPlay={retry}
      />
      {/* A still clip is indistinguishable from a screenshot, which is the whole
          reason this is here. It is a cue, not a second control: the container
          around every clip is already a button that opens it full screen and
          plays it, so this stays out of the a11y tree and off the hit target
          rather than nesting a button inside a button. For reduced-motion and
          Data Saver visitors, who never get inline playback, it is permanent. */}
      <span className={showCue ? 'vw-play' : 'vw-play is-off'} aria-hidden="true">
        <Icon name="play" />
      </span>
    </>
  )
}
