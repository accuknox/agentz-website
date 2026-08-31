import { useEffect, useRef, useState } from 'react'

/**
 * A photographic ground behind a section.
 *
 * The four plates are the Devrel workbench landscapes, re-graded to the AgentZ
 * blue system: every pixel is mapped through a navy `#000025` to electric blue
 * `#2f4bd6` ramp, so no green survives the conversion and the plate sits inside
 * the palette rather than beside it.
 *
 * The src is held back until the section is within 300px of the viewport, the
 * same way Deck arms its ten slides. Four plates is roughly 360KB, and a CSS
 * background on an in-layout element is fetched whether or not the section is
 * on screen, which would spend that at first paint. An IntersectionObserver is
 * used rather than loading="lazy" because the browser's own heuristic decides
 * when a lazy image is near enough on its own terms, and the plates need to be
 * decoded before the band scrolls in, not as it arrives.
 */
type Plate = 'masthead' | 'climb' | 'field' | 'horizon'

export function PhotoGround({ plate, className }: { plate: Plate; className?: string }) {
  const host = useRef<HTMLSpanElement>(null)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const el = host.current
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
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <span className={`pground${className ? ` ${className}` : ''}`} aria-hidden="true" data-audit-ground="" ref={host}>
      {armed && <img src={`./assets/img/texture/${plate}.webp`} alt="" decoding="async" />}
    </span>
  )
}
