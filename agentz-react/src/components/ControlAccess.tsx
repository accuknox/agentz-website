import { useEffect, useRef, type CSSProperties } from 'react'
import { Icon } from './ui/Icon'
import '../styles/sections.css'

/**
 * Least privilege, per capability. An agent reaches each tool through AgentZ,
 * and AgentZ gates every action: read and scan pass, mutate and delete stay
 * denied. When the diagram comes into view a request runs down each lane;
 * allowed actions light in blue, denied ones shake once and stay struck.
 */
type Cap = { label: string; allow: boolean }
type Lane = { logo: string; name: string; mono?: boolean; caps: Cap[] }

const LANES: Lane[] = [
  {
    logo: 'aws',
    name: 'AWS',
    mono: true,
    caps: [
      { label: 'Scan', allow: true },
      { label: 'Read config', allow: true },
      { label: 'Delete', allow: false },
    ],
  },
  {
    logo: 'kubernetes',
    name: 'Kubernetes',
    caps: [
      { label: 'Inspect', allow: true },
      { label: 'Patch', allow: false },
      { label: 'Drain node', allow: false },
    ],
  },
  {
    logo: 'github',
    name: 'GitHub',
    mono: true,
    caps: [
      { label: 'Read', allow: true },
      { label: 'Comment', allow: true },
      { label: 'Force push', allow: false },
    ],
  },
]

export function ControlAccess() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return el.classList.add('is-live')
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-live', e.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="ca" id="guardrails" aria-labelledby="ca-h">
      <div className="wrap ca-grid">
        <header className="ca-copy">
          <h2 className="sx-h" id="ca-h">
            Least privilege, down to each tool action.
          </h2>
          <p className="sx-sub">Read and scan pass. Mutate, push and delete stay denied until you allow them.</p>
        </header>

        <div className="ca-diagram" ref={ref} aria-label="AWS scan and read config allowed, delete denied. Kubernetes inspect allowed, patch and drain node denied. GitHub read and comment allowed, force push denied.">
          <div className="ca-source" aria-hidden="true">
            <span className="ca-agent">
              <Icon name="d-model" className="duo hue-violet" />
              Agent
            </span>
            <span className="ca-wire" />
            <span className="ca-hub">
              <img src="./assets/img/agentz-logo.svg" alt="" width={26} height={26} />
            </span>
          </div>

          <div className="ca-lanes" aria-hidden="true">
            {LANES.map((lane, li) => (
              <div className="ca-lane" key={lane.name}>
                <span className="ca-tool">
                  <img className={lane.mono ? 'pa-logo is-mono' : 'pa-logo'} src={`./assets/img/logos/${lane.logo}.svg`} alt="" width={26} height={26} />
                  {lane.name}
                </span>
                <ul className="ca-caps">
                  {lane.caps.map((c, ci) => (
                    <li
                      key={c.label}
                      className={c.allow ? 'is-allow hue-blue' : 'is-deny hue-red'}
                      style={{ '--i': li * 3 + ci } as CSSProperties}
                    >
                      <Icon name={c.allow ? 'check' : 'close'} className="ca-mark" />
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
