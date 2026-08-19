import { Icon } from './ui/Icon'

/**
 * Model portability. Credentials and policy live on the platform, not the
 * agent, so the model underneath can change without re-wiring anything. Right
 * side is a hub-and-spoke: the AgentZ mark fans out to the models it can run,
 * drawn with a single SVG connector fan.
 */
const POINTS = [
  'Credentials, scopes, and tenant policy stay on the platform. No reconnect per engineer.',
  'Runs on any model: frontier APIs or a self-hosted open weight, on the same key.',
  'Pilot a model on one workload, then roll it out. Same tools, no migration.',
]

const SPOKES = [
  { file: 'openai', mono: true },
  { file: 'anthropic', mono: true },
  { file: 'gemini' },
  { file: 'mistral', mono: true },
  { file: 'qwen', mono: true },
  { file: 'kimi', mono: true },
  { file: 'deepseek', mono: true },
]

export function SwapModels() {
  return (
    <section className="swap feature alt" id="models">
      <div className="wrap">
        <div className="swap-grid">
          <div className="swap-copy">
            <h2 className="section-h2">Stay on the best model.</h2>
            <p className="swap-lead">
              Connections and policy live on AgentZ, not on the agent. When a stronger model ships, switch without
              re-wiring credentials, scopes, or security.
            </p>
            <ul className="swap-points">
              {POINTS.map((p) => (
                <li key={p}>
                  <Icon name="check" className="ico-sm" />
                  {p}
                </li>
              ))}
            </ul>
            <a className="swap-cta" href="https://agentzharness.ai/" target="_blank" rel="noopener">
              Try AgentZ
              <Icon name="arrow" className="ico-sm" />
            </a>
          </div>

          <div className="swap-hub" aria-hidden="true">
            <span className="swap-node swap-root">
              <img src="./assets/img/agentz-logo.svg" alt="" width={34} height={34} />
            </span>
            <svg className="swap-fan" viewBox="0 0 600 130" preserveAspectRatio="none">
              {[30, 120, 210, 300, 390, 480, 570].map((x, i) => (
                <path key={i} className="swap-line" d={`M 300 4 C 300 72, ${x} 44, ${x} 126`} />
              ))}
            </svg>
            <div className="swap-spokes">
              {SPOKES.map((s) => (
                <span className="swap-node swap-leaf" key={s.file}>
                  <img
                    className={s.mono ? 'logo-img logo-img--mono' : 'logo-img'}
                    src={`./assets/img/logos/${s.file}.svg`}
                    alt=""
                    width={26}
                    height={26}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
