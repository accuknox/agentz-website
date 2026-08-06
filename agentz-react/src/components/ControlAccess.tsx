import { Icon } from './ui/Icon'

/**
 * Guardrails diagram. An agent reaches every tool through AgentZ, and AgentZ
 * gates each capability: read and scan pass, mutate and delete are denied by
 * default. This is the per-capability view of Zero Trust, distinct from the
 * role tree in OrgChart which gates who can act.
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
]

export function ControlAccess() {
  return (
    <section className="ctrl feature" id="guardrails">
      <div className="wrap">
        <div className="ctrl-grid">
          <div className="ctrl-copy">
            <span className="section-eyebrow">Guardrails</span>
            <h2 className="section-h2">Give each agent only the access it needs.</h2>
            <p className="ctrl-lead">
              Fine-grained control down to the single capability. Read and scan pass. Mutate, push and delete are
              denied by default, so a prompt injection cannot turn a lookup into a teardown.
            </p>
            <ul className="ctrl-points">
              <li>
                <Icon name="check" className="ico-sm" />
                Scope every tool call before it leaves the sandbox
              </li>
              <li>
                <Icon name="check" className="ico-sm" />
                Default deny, allow only what the task requires
              </li>
              <li>
                <Icon name="check" className="ico-sm" />
                Every allow and every block lands in the trace
              </li>
            </ul>
          </div>

          <div className="ctrl-diagram" aria-hidden="true">
            <div className="ctrl-source">
              <span className="ctrl-agent">Agent</span>
              <span className="ctrl-wire" />
              <span className="ctrl-hub">
                <img src="./assets/img/agentz-logo.svg" alt="" width={26} height={26} />
              </span>
            </div>

            <div className="ctrl-lanes">
              {LANES.map((lane) => (
                <div className="ctrl-lane" key={lane.name}>
                  <span className="ctrl-tool">
                    <img
                      className={lane.mono ? 'logo-img logo-img--mono' : 'logo-img'}
                      src={`./assets/img/logos/${lane.logo}.svg`}
                      alt=""
                      width={26}
                      height={26}
                    />
                    {lane.name}
                  </span>
                  <ul className="ctrl-caps">
                    {lane.caps.map((c) => (
                      <li key={c.label} className={c.allow ? 'cap cap-allow' : 'cap cap-deny'}>
                        <Icon name={c.allow ? 'check' : 'close'} className="ico-sm" />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
