import { Fragment, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Icon } from './ui/Icon'
import { NoiseBackground } from './ui/aceternity/NoiseBackground'
import { LazyVideo } from './ui/LazyVideo'
import { PointerHighlight } from './ui/aceternity/PointerHighlight'

const CAPS = [
  { icon: 'skills', label: 'Skills' },
  { icon: 'workflows', label: 'Workflows' },
  { icon: 'teams', label: 'Teams' },
  { icon: 'guardrails', label: 'Guardrails' },
]

/** The four capabilities as a live signal chain: a pulse travels through,
 *  lighting each stage in turn (skills → workflows → teams → secured). */
function HeroCapabilities() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(reduce ? -1 : 0)

  useEffect(() => {
    if (reduce) return
    // cycle 0→3, then a beat of rest before the pulse restarts
    const id = setInterval(() => setActive((a) => (a + 1) % (CAPS.length + 1)), 1100)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div className="cap-flow" role="list">
      {CAPS.map((c, i) => (
        <Fragment key={c.label}>
          {i > 0 && (
            <span className="cap-conn" aria-hidden="true">
              <motion.span
                className="cap-conn-fill"
                initial={false}
                animate={{ scaleX: active >= i && active < CAPS.length ? 1 : 0 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              />
            </span>
          )}
          <motion.span
            role="listitem"
            className={`pill cap-pill${active === i ? ' is-live' : ''}`}
            initial={false}
            animate={{ y: active === i ? -4 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          >
            <Icon name={c.icon} />
            {c.label}
          </motion.span>
        </Fragment>
      ))}
    </div>
  )
}

export function Hero() {
  const [triedAgentZ, setTriedAgentZ] = useState(false)
  return (
    <section className="hero" id="top">
      <NoiseBackground className="hero-noise" />
      <div className="wrap hero-inner">
        <a className="brandby" href="https://accuknox.com" target="_blank" rel="noopener">
          <span>Built by</span>
          <img className="ak-light" src="./assets/img/accuknox-logo.webp" alt="AccuKnox" width={118} height={28} />
          <img className="ak-dark" src="./assets/img/accuknox-logo-dark.webp" alt="AccuKnox" width={118} height={28} />
        </a>
        <h1 className="hero-brand">
          <span>Agent</span>
          <img className="hero-brand-mark" src="./assets/img/agentz-logo.svg" alt="Z" />
        </h1>
        <p className="hero-title">Zero Trust Agentic AI Platform</p>
        <p className="hero-sub">
          Build, run, and govern{' '}
          <PointerHighlight>production agents</PointerHighlight>. Secure by design.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="https://github.com/accuknox/agentZ" target="_blank" rel="noopener">
            <Icon name="github" />
            View Github
          </a>
          <span className="soon-wrap">
            <button
              type="button"
              className="btn btn-line btn-lg btn-soon"
              onClick={() => setTriedAgentZ(true)}
              aria-label="Try AgentZ"
            >
              Try AgentZ
            </button>
            {triedAgentZ && (
              <span className="soon-inline" aria-live="polite">Coming soon!</span>
            )}
          </span>
        </div>
        <HeroCapabilities />
        <div className="vw vw-hero hero-vid">
          <LazyVideo
            src="./assets/video/hero-workflow-graph.mp4"
            poster="./assets/video/hero-workflow-graph.jpg"
            label="A workflow running live in AgentZ, steps moving through running and succeeded"
          />
        </div>
      </div>
    </section>
  )
}
