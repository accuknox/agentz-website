import { Icon } from './ui/Icon'

/**
 * Copy-paste prompt cards. Concrete, security-flavoured jobs an operator can
 * drop into AgentZ and watch run end to end. Each card names the real tools the
 * agent touches via small logo chips, echoing the run in SeeInAction.
 */
type Prompt = { logos: string[]; text: string; label: string }

const PROMPTS: Prompt[] = [
  {
    logos: ['aws', 'opentelemetry', 'slack'],
    text:
      '“Triage this CSPM finding — pull the CloudTrail events, correlate with the runtime alert, and open a war room in #sec-incidents.”',
    label: 'Triage a finding',
  },
  {
    logos: ['kubernetes', 'github', 'slack'],
    text:
      '“Onboard a new agent — scope it read-only on the staging cluster, wire its GitHub checks, and post the access grant to #platform.”',
    label: 'Onboard an agent',
  },
  {
    logos: ['opentelemetry', 'github', 'slack'],
    text:
      '“Investigate a runtime alert on payments-svc — trace the process, find the image and deploy, file the fix, ping #eng-payments.”',
    label: 'Investigate an alert',
  },
  {
    logos: ['aws', 'jira', 'notion'],
    text:
      '“Assemble Q1 SOC2 evidence — access reviews plus cloud policy config — in Notion for the auditor.”',
    label: 'Compliance evidence',
  },
]

export function Prompts() {
  return (
    <section className="prompts feature" id="prompts">
      <div className="wrap">
        <div className="fhead">
          <span className="section-eyebrow">Try these</span>
          <h2 className="fhead-h">Prompts to run right now.</h2>
          <p className="fhead-p">Open AgentZ, paste, and watch it run end to end across your stack.</p>
        </div>

        <div className="prompt-grid">
          {PROMPTS.map((p) => (
            <article className="prompt-card" key={p.label}>
              <div className="prompt-logos">
                {p.logos.map((l, i) => (
                  <span className="prompt-chip" key={l} style={{ zIndex: p.logos.length - i }}>
                    <img
                      className={l === 'aws' || l === 'github' || l === 'notion' ? 'logo-img logo-img--mono' : 'logo-img'}
                      src={`./assets/img/logos/${l}.svg`}
                      alt=""
                      width={22}
                      height={22}
                    />
                  </span>
                ))}
              </div>
              <p className="prompt-text">{p.text}</p>
              <div className="prompt-foot">
                <span className="prompt-label">{p.label}</span>
                <Icon name="arrow" className="ico-sm" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
