import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

/**
 * Interactive run panel. A workflow is selected on the left; the trace on the
 * right swaps to show the prompt, the tool calls the agent made, and the
 * outcome. Every glyph is a brand SVG from assets/img/logos. No model
 * branding, no fake window chrome.
 */
type Call = { logo: string; mono?: boolean; tool: string; op: string; args: string[] }
type Demo = {
  title: string
  tools: string
  logos: { file: string; mono?: boolean }[]
  prompt: string
  calls: Call[]
  result: string
}

const DEMOS: Demo[] = [
  {
    title: 'Triage a cloud misconfiguration',
    tools: 'AWS · OpenTelemetry · Slack',
    logos: [{ file: 'aws', mono: true }, { file: 'opentelemetry' }, { file: 'slack' }],
    prompt:
      'An S3 bucket was flagged public. Confirm the exposure, find the change that caused it, and open an incident in #sec-incidents.',
    calls: [
      { logo: 'aws', mono: true, tool: 'aws', op: 'get_bucket_policy', args: ['prod-assets', 'public'] },
      { logo: 'opentelemetry', tool: 'trace', op: 'find_change', args: ['PutBucketPolicy', '12m'] },
      { logo: 'slack', tool: 'slack', op: 'post_message', args: ['#sec-incidents', 'incident'] },
    ],
    result:
      'Bucket prod-assets was opened by IAM change abc123 twelve minutes ago. Access reverted to private and an incident opened in #sec-incidents with the change author and the revert command.',
  },
  {
    title: 'Provision an agent’s access',
    tools: 'Kubernetes · GitHub · Slack',
    logos: [{ file: 'kubernetes' }, { file: 'github', mono: true }, { file: 'slack' }],
    prompt:
      'Provision a new triage agent. Scope it read-only on the staging cluster and post the access grant to #platform.',
    calls: [
      { logo: 'kubernetes', tool: 'k8s', op: 'bind_role', args: ['staging', 'view'] },
      { logo: 'github', mono: true, tool: 'github', op: 'add_to_team', args: ['triage-agents', 'read'] },
      { logo: 'slack', tool: 'slack', op: 'post_message', args: ['#platform', 'grant'] },
    ],
    result:
      'Triage agent provisioned with read-only access on the staging cluster and read scope on the triage-agents repositories. The grant was recorded and posted to #platform for review.',
  },
  {
    title: 'Investigate a runtime alert',
    tools: 'OpenTelemetry · GitHub · Slack',
    logos: [{ file: 'opentelemetry' }, { file: 'github', mono: true }, { file: 'slack' }],
    prompt:
      'A runtime alert fired on payments-svc. Trace the process, identify the image and deploy, and file the fix.',
    calls: [
      { logo: 'opentelemetry', tool: 'runtime', op: 'get_alert', args: ['payments-svc', 'exec'] },
      { logo: 'github', mono: true, tool: 'github', op: 'list_deploys', args: ['payments-svc', 'last 2h'] },
      { logo: 'github', mono: true, tool: 'github', op: 'open_issue', args: ['payments-svc', 'fix'] },
    ],
    result:
      'The alert traced to an unexpected shell in payments-svc from deploy abc123 two hours ago. The image was identified, an issue filed against the offending change, and the workload isolated pending review.',
  },
  {
    title: 'Assemble compliance evidence',
    tools: 'AWS · Jira · Notion',
    logos: [{ file: 'aws', mono: true }, { file: 'jira' }, { file: 'notion', mono: true }],
    prompt:
      'Assemble Q1 SOC2 evidence. Collect the access reviews and cloud policy configuration into a report for the auditor.',
    calls: [
      { logo: 'aws', mono: true, tool: 'aws', op: 'export_config', args: ['org', 'q1'] },
      { logo: 'jira', tool: 'jira', op: 'list_reviews', args: ['access', 'q1'] },
      { logo: 'notion', mono: true, tool: 'notion', op: 'create_page', args: ['SOC2 Q1', 'report'] },
    ],
    result:
      'Q1 access reviews and cloud policy configuration were compiled into a single SOC2 report in Notion, cross-referenced to each control and ready for the auditor.',
  },
]

function ToolCall({ call }: { call: Call }) {
  return (
    <div className="run-call">
      <img
        className={call.mono ? 'logo-img logo-img--mono' : 'logo-img'}
        src={`./assets/img/logos/${call.logo}.svg`}
        alt=""
        width={18}
        height={18}
      />
      <span className="run-call-tool">{call.tool}</span>
      <span className="run-call-op">{call.op}</span>
      {call.args.map((a) => (
        <span className="run-call-arg" key={a}>
          <span className="run-dot">·</span>
          {a}
        </span>
      ))}
    </div>
  )
}

export function AgentRun() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const demo = DEMOS[active]

  return (
    <section className="run feature" id="run">
      <div className="wrap">
        <div className="fhead">
          <h2 className="fhead-h">From one prompt to a finished task.</h2>
          <p className="fhead-p">Select a workflow to trace every model and tool call it runs.</p>
        </div>

        <div className="run-grid">
          <div className="run-list" role="tablist" aria-label="Workflows">
            {DEMOS.map((d, i) => (
              <button
                type="button"
                key={d.title}
                role="tab"
                aria-selected={active === i}
                className={`run-item${active === i ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
              >
                <span className="run-item-logos">
                  {d.logos.map((l) => (
                    <img
                      key={l.file}
                      className={l.mono ? 'logo-img logo-img--mono' : 'logo-img'}
                      src={`./assets/img/logos/${l.file}.svg`}
                      alt=""
                      width={20}
                      height={20}
                    />
                  ))}
                </span>
                <span className="run-item-body">
                  <span className="run-item-title">{d.title}</span>
                  <span className="run-item-tools">{d.tools}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="run-panel">
            <div className="run-panel-head">
              <img src="./assets/img/agentz-logo.svg" alt="" width={22} height={22} />
              AgentZ
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="run-panel-body"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <p className="run-prompt">{demo.prompt}</p>
                <div className="run-calls">
                  {demo.calls.map((c, i) => (
                    <ToolCall call={c} key={`${c.tool}-${c.op}-${i}`} />
                  ))}
                </div>
                <p className="run-result">{demo.result}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
