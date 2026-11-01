import { Icon } from './ui/Icon'
import { SpotlightCard } from './ui/SpotlightCard'
import '../styles/sections.css'

/**
 * The control plane: six building blocks, then what they connect to.
 * Same grammar as the value bento above it: a heading, one line, and tiles
 * that carry a title and one line each. The illustrations do the talking.
 */

const ARCH = [
  { illus: 'skills', h: 'Skills', p: 'Reusable, versioned steps.' },
  { illus: 'workflows', h: 'Workflows', p: 'Chain, schedule, hand off.' },
  { illus: 'context', h: 'Context', p: 'Shared memory and files.' },
  { illus: 'teams', h: 'Teams', p: 'Roles, owners, scopes.' },
  { illus: 'guardrails', h: 'Guardrails', p: 'No standing access.' },
  { illus: 'audit', h: 'Audit', p: 'Every step replayable.' },
]

const TOOLS = [
  ['db', 'Databases'],
  ['globe', 'SaaS APIs'],
  ['model', 'MCP servers'],
  ['report', 'Files'],
]

const MODELS = [
  ['openai', 'OpenAI', true],
  ['anthropic', 'Anthropic', true],
  ['gemini', 'Gemini', false],
  ['deepseek', 'DeepSeek', false],
  ['qwen', 'Qwen', false],
  ['mistral', 'Mistral', false],
] as const

export function PlatformArch() {
  return (
    <section className="pa" id="platform" aria-labelledby="pa-h">
      <div className="wrap">
        <header className="sx-head">
          <h2 className="sx-h" id="pa-h">
            One control plane for every agent, model and team.
          </h2>
          <p className="sx-sub">Six building blocks, managed in one place.</p>
        </header>

        <div className="pa-grid">
          {ARCH.map((c) => (
            <SpotlightCard className="pa-card" key={c.h}>
              <img src={`./assets/img/illus/${c.illus}.webp`} alt="" className="pa-illus" loading="lazy" decoding="async" />
              <h3 className="pa-card-h">{c.h}</h3>
              <p className="pa-card-p">{c.p}</p>
            </SpotlightCard>
          ))}
        </div>

        <div className="pa-connect">
          <div className="pa-half hue-cyan">
            <p className="pa-half-h">Connects to your tools and data</p>
            <div className="pa-chips">
              {TOOLS.map(([ic, t]) => (
                <span className="pa-chip" key={t}>
                  <Icon name={`d-${ic}`} className="duo" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="pa-half">
            <p className="pa-half-h">Runs on any model</p>
            <div className="pa-chips">
              {MODELS.map(([f, n, mono]) => (
                <span className="pa-chip" key={f}>
                  <img className={mono ? 'pa-logo is-mono' : 'pa-logo'} src={`./assets/img/logos/${f}.svg`} alt="" width={20} height={20} />
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
