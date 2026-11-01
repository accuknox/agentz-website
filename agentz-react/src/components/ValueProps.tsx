import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './ui/Icon'
import '../styles/valueprops.css'

/**
 * Section 3: the value, then the proof.
 *
 * A bento of seven tiles, each a headline and one line. The two large tiles
 * carry a visual: where AgentZ runs, and every model it runs on. The rest
 * carry one duotone glyph in the hue of what they protect. Below it, the four
 * AccuKnox security workflows as a carousel, each drawn as its own flow:
 * a funnel, a sweep, a chain and a report.
 *
 * Text stays in three styles on purpose: a section heading, a tile title and
 * one line under it. Labels inside the visuals are data, not copy.
 *
 * Loops run only on elements marked .is-live, which an observer sets while
 * they are on screen. Nothing is hidden by default, so a missed observer or a
 * reduced-motion visitor still sees the whole section.
 */

type Hue = 'blue' | 'violet' | 'cyan' | 'red'

const hue = (h: Hue) => `hue-${h}`

/* ── shared ── */

function Duo({ name, className }: { name: string; className?: string }) {
  return <Icon name={`d-${name}`} className={className ? `duo ${className}` : 'duo'} />
}

function useLive<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-live')
      return
    }
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-live', e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return ref
}

/* ── bento visuals ── */

const DEPLOY = [
  { icon: 'cloud', label: 'SaaS' },
  { icon: 'server', label: 'On-prem' },
  { icon: 'airgap', label: 'Air-gapped' },
]

function DeployVisual() {
  const [on, setOn] = useState(1)
  const ref = useLive<HTMLDivElement>()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (ref.current?.classList.contains('is-live')) setOn((i) => (i + 1) % DEPLOY.length)
    }, 2400)
    return () => window.clearInterval(id)
  }, [ref])
  return (
    <div className="bx-deploy" ref={ref} style={{ '--on': on } as CSSProperties}>
      {DEPLOY.map((d, i) => (
        <button
          type="button"
          key={d.label}
          className={i === on ? 'is-on' : ''}
          aria-pressed={i === on}
          onClick={() => setOn(i)}
        >
          <Duo name={d.icon} />
          <span>{d.label}</span>
        </button>
      ))}
      <span className="bx-deploy-rail" aria-hidden="true">
        <span />
      </span>
    </div>
  )
}

const MODELS = [
  ['anthropic', 'Anthropic'],
  ['openai', 'OpenAI'],
  ['gemini', 'Gemini'],
  ['deepseek', 'DeepSeek'],
  ['qwen', 'Qwen'],
  ['kimi', 'Kimi'],
  ['mistral', 'Mistral'],
]

function ModelVisual() {
  const ref = useLive<HTMLDivElement>()
  const row = MODELS.map(([f, n]) => (
    <span className="bx-model" key={f}>
      <img src={`./assets/img/logos/${f}.svg`} alt="" width={22} height={22} loading="lazy" decoding="async" />
      {n}
    </span>
  ))
  return (
    <div className="bx-models" ref={ref} aria-label={`Works with ${MODELS.map((m) => m[1]).join(', ')} and more`}>
      <div className="bx-models-track" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  )
}

const SPANS: [string, number, number][] = [
  ['model.call', 0, 58],
  ['jira.search', 12, 26],
  ['policy.check', 40, 14],
  ['slack.post', 56, 30],
]

function AuditVisual() {
  const ref = useLive<HTMLDivElement>()
  return (
    <div className="bx-spans" ref={ref} aria-hidden="true">
      {SPANS.map(([n, at, w], i) => (
        <div className="bx-span" key={n} style={{ '--i': i } as CSSProperties}>
          <span>{n}</span>
          <i>
            <b style={{ left: `${at}%`, width: `${w}%` }} />
          </i>
        </div>
      ))}
      <span className="bx-scrub" />
    </div>
  )
}

type Tile = { area: string; hue: Hue; icon?: string; h: string; p: string; visual?: ReactNode }

const TILES: Tile[] = [
  {
    area: 'deploy',
    hue: 'blue',
    h: 'SaaS, on-prem or air-gapped.',
    p: 'One platform. Logs, traces and audit stay where you deploy it.',
    visual: <DeployVisual />,
  },
  {
    area: 'models',
    hue: 'violet',
    h: 'BYOK, BYOS or BYOM.',
    p: 'Your key, your subscription or a private model. Zero markup.',
    visual: <ModelVisual />,
  },
  { area: 'deny', hue: 'red', icon: 'lock', h: 'Default-deny sandbox.', p: 'No tool, domain or secret is reachable until policy allows it.' },
  { area: 'keys', hue: 'cyan', icon: 'key', h: 'Credential broker.', p: 'Agents carry placeholders. The proxy injects vault keys per domain.' },
  {
    area: 'audit',
    hue: 'blue',
    h: 'Signed span trees.',
    p: 'Every tool call, file, process and network event, replayable.',
    visual: <AuditVisual />,
  },
  { area: 'triggers', hue: 'violet', icon: 'clock', h: 'Cron, webhook and event triggers.', p: 'Edit schedules in place, with no redeploy.' },
  { area: 'teams', hue: 'cyan', icon: 'teams', h: 'Org-wide RBAC and SSO.', p: 'Workspaces inherit skills, sandboxes and MCP. SAML and OIDC.' },
]

/* ── use case pipelines ──
   Each workflow is drawn as what it is: sources fan into the AgentZ sandbox,
   the steps run left to right with the data count at each one, and the result
   is pushed back. A step counter walks the pipeline while the card is on
   screen, and the output panel beside it changes with every step, so the
   reader watches findings get filtered, scoped, chained or written up.
   All rows are sample data. */

type Node = { icon?: string; logo?: string; label: string }
type Step = { icon: string; label: string; stat: string }
type Flow = {
  hue: Hue
  h: string
  p: string
  pull: Node[]
  steps: Step[]
  push: Node[]
  output: (k: number) => ReactNode
}

const VULNS: [string, string, boolean, number, boolean, string][] = [
  ['CVE-2021-44228', 'log4j-core 2.14.1', true, 96, true, 'P1'],
  ['CVE-2023-44487', 'golang.org/x/net', true, 80, true, 'P2'],
  ['CVE-2022-22965', 'spring-beans 5.3.17', true, 90, true, 'P3'],
  ['CVE-2023-4863', 'libwebp 1.3.1', true, 70, false, ''],
  ['CVE-2024-24790', 'go stdlib 1.22.3', false, 8, true, ''],
  ['CVE-2023-5363', 'openssl 3.0.11', false, 4, false, ''],
]

function VulnOutput({ k }: { k: number }) {
  const rows = [...VULNS].sort((a, b) => (k >= 3 ? (a[5] || 'Z').localeCompare(b[5] || 'Z') : 0))
  return (
    <div className="op-table op-vuln">
      <div className="op-tr op-th">
        <span>Finding</span>
        <span>KEV</span>
        <span>EPSS</span>
        <span>Exposed</span>
        <span>Rank</span>
      </div>
      {rows.map(([id, pkg, kev, epss, exp, rank]) => {
        const out = (k >= 1 && !kev) || (k >= 2 && !exp)
        return (
          <motion.div layout transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} key={id} className={`op-tr${out ? ' is-out' : ''}`}>
            <span className="op-id">
              <b>{id}</b>
              <small>{pkg}</small>
            </span>
            <span>{k >= 1 ? <Flag on={kev} /> : <Wait />}</span>
            <span>{k >= 1 ? <i className="op-bar" style={{ '--w': `${epss}%` } as CSSProperties} /> : <Wait />}</span>
            <span>{k >= 2 ? <Flag on={exp} /> : <Wait />}</span>
            <span>{k >= 3 && rank ? <em className="op-rank">{rank}</em> : k >= 3 ? <small>drop</small> : <Wait />}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

const WORKLOADS: [string, string, 'hit' | 'ok' | 'none', string][] = [
  ['checkout-web', '1.3.1', 'hit', 'OPS-1421'],
  ['media-resizer', '1.2.4', 'hit', 'OPS-1422'],
  ['cms-preview', '1.3.0', 'hit', 'OPS-1423'],
  ['api-gateway', '1.3.2', 'ok', ''],
  ['billing-svc', 'not present', 'none', ''],
  ['search-api', '1.3.2', 'ok', ''],
]

function AdvisoryOutput({ k }: { k: number }) {
  return (
    <div className="op-table op-adv">
      <p className="op-note">
        <Duo name="advisory" />
        CVE-2023-4863, libwebp heap overflow, fixed in 1.3.2
      </p>
      <div className="op-tr op-th">
        <span>Workload</span>
        <span>libwebp</span>
        <span>Status</span>
        <span>Ticket</span>
      </div>
      {WORKLOADS.map(([w, v, st, t], i) => (
        <div key={w} className={`op-tr${k >= 2 && st !== 'hit' ? ' is-out' : ''}${k >= 2 && st === 'hit' ? ' is-hit' : ''}`}>
          <span className="op-id">
            <b>{w}</b>
          </span>
          <span>{k >= 1 ? <motion.code initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.12 } }}>{v}</motion.code> : <Wait />}</span>
          <span>{k >= 2 ? <em className={`op-st op-st-${st}`}>{st === 'hit' ? 'affected' : st === 'ok' ? 'patched' : 'n/a'}</em> : <Wait />}</span>
          <span>{k >= 3 && t ? <code className="op-ticket">{t}</code> : k >= 3 ? <small>none</small> : <Wait />}</span>
        </div>
      ))}
    </div>
  )
}

const PATH: [string, string, string][] = [
  ['globe', 'Internet', 'Security group allows 0.0.0.0/0 on port 22'],
  ['server', 'VM i-0a3f, public IP', 'Unpatched OpenSSH on the host'],
  ['iam', 'Shell on the VM', 'Instance role carries AdminAccess'],
  ['db', 'S3 bucket customer-pii', ''],
]

function ChainOutput({ k }: { k: number }) {
  return (
    <div className="op-path">
      {PATH.map(([icon, node, edge], i) => (
        <div key={node} className={`op-hop${k >= 2 ? ' is-path' : ''}`} style={{ '--i': i } as CSSProperties}>
          <span className="op-node">
            <Duo name={icon} />
            {node}
          </span>
          {edge && (
            <span className={`op-edge${k >= 1 ? ' is-on' : ''}${k >= 4 && i === 2 ? ' is-cut' : ''}`}>
              <i />
              <span>
                {edge}
                <em>Medium</em>
              </span>
            </span>
          )}
        </div>
      ))}
      <AnimatePresence>
        {k >= 3 && (
          <motion.p className="op-verdict" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <b>3 × Medium on one path = Critical.</b>
            {k >= 4 ? ' Fix: detach AdminAccess. The path breaks.' : ' Scoring the chain.'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

const EVIDENCE: [number, string, string][] = [
  [0, 'Finding', 'RDS payments-db is publicly accessible'],
  [1, 'Asset', 'prod, VPC vpc-prod-01, owner team-payments'],
  [1, 'History', 'first seen 3 days ago, reopened twice'],
  [1, 'Controls', 'no WAF rule, no IP allowlist'],
  [2, 'Verdict', 'true positive'],
  [2, 'Root cause', 'Terraform sets publicly_accessible = true'],
  [3, 'Report', 'payments-db-finding.pdf, 6 pages'],
]

function InvestigationOutput({ k }: { k: number }) {
  return (
    <ul className="op-list">
      {EVIDENCE.filter(([at]) => k >= at).map(([at, key, val]) => (
        <motion.li key={key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <Icon name="check" className={`op-tick${at === 2 ? ' is-strong' : ''}`} />
          <span>{key}</span>
          <b>{val}</b>
        </motion.li>
      ))}
      {k >= 4 && (
        <motion.li className="op-push" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Icon name="arrow" className="op-tick" />
          <span>Pushed</span>
          <b>OPS-1440 set to In progress, report linked</b>
        </motion.li>
      )}
    </ul>
  )
}

const Flag = ({ on }: { on: boolean }) => <em className={`op-flag${on ? ' is-on' : ''}`}>{on ? 'yes' : 'no'}</em>
const Wait = () => <i className="op-wait" />

const FLOWS: Flow[] = [
  {
    hue: 'red',
    h: 'Exploit-aware CVE prioritization.',
    p: 'KEV, EPSS and runtime exposure turn 1,284 open CVEs into a fix list of five.',
    pull: [
      { icon: 'bug', label: 'CNAPP findings' },
      { icon: 'flame', label: 'CISA KEV' },
      { icon: 'rank', label: 'FIRST EPSS' },
      { icon: 'server', label: 'Runtime inventory' },
    ],
    steps: [
      { icon: 'bug', label: 'Pull', stat: '1,284' },
      { icon: 'flame', label: 'Enrich', stat: '61' },
      { icon: 'globe', label: 'Exposure', stat: '9' },
      { icon: 'rank', label: 'Rank', stat: '5' },
    ],
    push: [
      { logo: 'jira', label: 'Tickets with owners' },
      { icon: 'ticket', label: 'Priority tags' },
    ],
    output: (k) => <VulnOutput k={k} />,
  },
  {
    hue: 'cyan',
    h: 'Advisory-to-asset scoping.',
    p: 'An SBOM sweep finds every workload a new advisory hits, then tickets only those.',
    pull: [
      { icon: 'advisory', label: 'Advisory feed' },
      { icon: 'report', label: 'SBOMs' },
      { icon: 'server', label: 'Workloads' },
      { icon: 'bug', label: 'Findings' },
    ],
    steps: [
      { icon: 'advisory', label: 'Ingest', stat: '1' },
      { icon: 'radar', label: 'Sweep', stat: '412' },
      { icon: 'search', label: 'Scope', stat: '3' },
      { icon: 'ticket', label: 'Act', stat: '3' },
    ],
    push: [
      { logo: 'jira', label: '3 tickets' },
      { icon: 'ticket', label: 'Advisory tags' },
    ],
    output: (k) => <AdvisoryOutput k={k} />,
  },
  {
    hue: 'violet',
    h: 'Toxic-combination detection.',
    p: 'Medium findings on one reachable path, scored as the critical chain they form.',
    pull: [
      { icon: 'lock', label: 'Misconfigs' },
      { icon: 'bug', label: 'CVEs' },
      { icon: 'iam', label: 'IAM' },
      { icon: 'db', label: 'Asset graph' },
    ],
    steps: [
      { icon: 'bug', label: 'Pull', stat: '3' },
      { icon: 'db', label: 'Join', stat: '1 asset' },
      { icon: 'globe', label: 'Reach', stat: '1 path' },
      { icon: 'flame', label: 'Score', stat: 'Critical' },
    ],
    push: [
      { logo: 'jira', label: 'One fix ticket' },
      { icon: 'flame', label: 'Chain severity' },
    ],
    output: (k) => <ChainOutput k={k} />,
  },
  {
    hue: 'blue',
    h: 'Autonomous critical-finding triage.',
    p: 'Each critical gets evidence, a verdict with root cause, and a report.',
    pull: [
      { icon: 'flame', label: 'Criticals' },
      { icon: 'replay', label: 'History' },
      { icon: 'search', label: 'Related findings' },
      { icon: 'verdict', label: 'Controls' },
    ],
    steps: [
      { icon: 'triage', label: 'Triage', stat: '4' },
      { icon: 'search', label: 'Investigate', stat: '3 sources' },
      { icon: 'verdict', label: 'Verdict', stat: 'TP' },
      { icon: 'report', label: 'Report', stat: 'PDF' },
    ],
    push: [
      { logo: 'jira', label: 'Status and notes' },
      { logo: 'slack', label: 'Report link' },
    ],
    output: (k) => <InvestigationOutput k={k} />,
  },
]

function Chip({ n }: { n: Node }) {
  return (
    <span className="pp-chip">
      {n.logo ? <img src={`./assets/img/logos/${n.logo}.svg`} alt="" width={18} height={18} /> : <Duo name={n.icon!} />}
      {n.label}
    </span>
  )
}

function UseCaseCard({ f }: { f: Flow }) {
  const ref = useLive<HTMLElement>(0.45)
  const [k, setK] = useState(0)
  const n = f.steps.length
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // walk the steps, then the push, then hold before starting over. This runs
    // under reduced motion too: the data changes, the transitions do not.
    const id = window.setInterval(() => {
      if (el.classList.contains('is-live')) setK((x) => (x >= n + 1 ? 0 : x + 1))
    }, 1800)
    return () => window.clearInterval(id)
  }, [ref, n])

  return (
    <article className={`uc ${hue(f.hue)}`} ref={ref}>
      <h4 className="uc-h">{f.h}</h4>
      <p className="uc-p">{f.p}</p>

      <div className="uc-body">
        <div className={`pp is-k${k}`} aria-hidden="true">
          <div className={`pp-row${k === 0 ? ' is-flow' : ''}`}>
            {f.pull.map((s) => (
              <Chip n={s} key={s.label} />
            ))}
          </div>
          <svg className={`pp-fan${k === 0 ? ' is-flow' : ''}`} viewBox="0 0 100 40" preserveAspectRatio="none">
            {[12.5, 37.5, 62.5, 87.5].map((x) => (
              <path key={x} d={`M${x} 0 C ${x} 22, 50 18, 50 40`} />
            ))}
          </svg>
          <div className="pp-lane">
            <span className="pp-lane-h">
              <img src="./assets/img/agentz-logo.svg" alt="" width={16} height={16} />
              AgentZ sandbox, default deny, every call traced
            </span>
            <ol className="pp-steps">
              {f.steps.map((s, j) => (
                <li key={s.label} className={j < k ? 'is-done' : j === k ? 'is-on' : ''}>
                  <span className="pp-step">
                    <Duo name={s.icon} />
                    <b>{s.label}</b>
                    <em>{j <= k ? s.stat : '·'}</em>
                  </span>
                  {j < n - 1 && <i className={`pp-arrow${j === k ? ' is-flow' : j < k ? ' is-done' : ''}`} />}
                </li>
              ))}
            </ol>
          </div>
          <span className={`pp-drop${k >= n ? ' is-flow' : ''}`}>
            <i />
            Push back
          </span>
          <div className={`pp-row pp-sink${k >= n ? ' is-on' : ''}`}>
            {f.push.map((s) => (
              <Chip n={s} key={s.label} />
            ))}
          </div>
        </div>

        <div className="op">
          <p className="op-h">
            <span>Output</span>
            <code>{k < n ? `${f.steps[k].label.toLowerCase()}…` : k === n ? 'pushed' : 'done'}</code>
          </p>
          {f.output(k)}
          <p className="op-foot">Sample data</p>
        </div>
      </div>
    </article>
  )
}

function UseCases() {
  const track = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () =>
      setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const page = (dir: 1 | -1) => {
    const el = track.current
    const card = el?.querySelector<HTMLElement>('.uc')
    if (!el || !card) return
    el.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: 'smooth' })
  }

  return (
    <div className="ucs">
      <div className="wrap ucs-head">
        <h3 className="ucs-h">Agentic SecOps workflows, sandboxed end to end.</h3>
        <p className="ucs-p">Four AccuKnox workflows. Every pull, decision and write-back is traced.</p>
      </div>
      <div className="ucs-track" ref={track} role="region" aria-label="Security use cases" tabIndex={0}>
        {FLOWS.map((f) => (
          <UseCaseCard key={f.h} f={f} />
        ))}
      </div>
      <div className="wrap ucs-nav">
        <button type="button" aria-label="Previous use case" disabled={edge.start} onClick={() => page(-1)}>
          <Icon name="chev" className="is-prev" />
        </button>
        <button type="button" aria-label="Next use case" disabled={edge.end} onClick={() => page(1)}>
          <Icon name="chev" />
        </button>
      </div>
    </div>
  )
}

export function ValueProps() {
  return (
    <section className="vp" id="why" aria-labelledby="vp-h">
      <div className="wrap">
        <header className="vp-head">
          <h2 className="vp-h" id="vp-h">
            Ship agents fast. <span>Stay in control.</span>
          </h2>
          <p className="vp-sub">
            Build, run and govern AI agents on any model, in a sandbox that trusts nothing by default.
          </p>
        </header>

        <div className="bento">
          {TILES.map((t) => (
            <article key={t.area} className={`tile tile-${t.area} ${hue(t.hue)}${t.visual ? ' has-visual' : ''}`}>
              {t.icon && <Duo name={t.icon} className="tile-ico" />}
              <h3 className="tile-h">{t.h}</h3>
              <p className="tile-p">{t.p}</p>
              {t.visual && <div className="tile-visual">{t.visual}</div>}
            </article>
          ))}
        </div>
      </div>

      <UseCases />
    </section>
  )
}
