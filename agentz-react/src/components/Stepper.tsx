import { LazyVideo } from './ui/LazyVideo'
import { PhotoGround } from './ui/PhotoGround'

const STEPS = [
  {
    n: '01 / 04',
    h: 'Build',
    p: 'Describe the job in a sentence. AgentZ writes the skill and wires every step.',
    src: 'build-create-agent',
    label: 'Setting an agent up in AgentZ: workspace, inference providers and the model picker',
  },
  {
    n: '02 / 04',
    h: 'Run',
    p: 'Chat, API, CLI, or a schedule. Any framework, no redeploy.',
    src: 'run-chat-workflows',
    label: 'Running an agent from chat in AgentZ, from the typed task to the report it writes',
  },
  {
    n: '03 / 04',
    h: 'Automate',
    p: 'Trigger on a cron, an event, or an API call. Skills chain in sequence or parallel, no wiring.',
    src: 'automate-dashboards',
    label: 'A scheduled AgentZ workflow keeping an asset dashboard current, with charts and a date range',
  },
  {
    n: '04 / 04',
    h: 'Govern',
    p: 'Resolved at the edge, checked at the kernel, written to a full trace.',
    src: 'govern-sandbox-scope',
    label: 'Scoping a sandbox in AgentZ down to per-tool permissions and allowed hosts',
  },
]

export function Stepper() {
  return (
    <section className="stepper" id="brg">
      <PhotoGround plate="climb" className="pground-stepper" />
      <div className="stepper-sticky">
        <div className="wrap steps-wrap">
          <div className="steps">
            {STEPS.map((s, i) => (
              <article className={i === 0 ? 'step is-on' : 'step'} data-step={i} key={s.h}>
                <div className="step-copy">
                  <span className="step-kicker">{s.n}</span>
                  <h2>{s.h}</h2>
                  <p>{s.p}</p>
                </div>
                <div className="step-media">
                  <div className="vw vw-dark vw-step">
                    <LazyVideo
                      src={`./assets/video/${s.src}.mp4`}
                      poster={`./assets/video/${s.src}.jpg`}
                      label={s.label}
                      cue="held"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="step-dots">
            {STEPS.map((s, i) => (
              <button className={i === 0 ? 'step-dot is-on' : 'step-dot'} data-go={i} key={s.h}>
                <span>{String(i + 1).padStart(2, '0')}</span> {s.h}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
