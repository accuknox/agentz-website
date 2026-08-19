import { Icon } from './ui/Icon'

const ITEMS = [
  {
    n: '01',
    q: 'Does AgentZ run in our cloud or yours?',
    a: 'Standard tiers run on shared cloud. Enterprise gets VPC, on-prem, or air-gapped deployment with a private tenant. Either way the sandbox policy engine runs local to the agents. It is not a remote proxy making decisions over the wire.',
  },
  {
    n: '02',
    q: 'What stops an agent from calling an API it shouldn\'t?',
    a: 'The sandbox enforces a default-deny network policy. Every outbound call is checked against an explicit allowlist before it leaves the sandbox, and anything blocked lands in the audit trace with the domain and port it tried to reach.',
  },
  {
    n: '03',
    q: 'Will it work with the model and framework we already use?',
    a: 'Yes. AgentZ accepts any model provider via BYOK. OpenAI, Anthropic, Google, or a self-hosted endpoint. Wrap an existing LangGraph or CrewAI agent, or build skills natively. The governance layer sits underneath either way.',
  },
  {
    n: '04',
    q: 'How does the audit trail hold up in a compliance review?',
    a: 'Every tool call, memory read, and model response is recorded and stored with a deterministic replay ID. Pro retains 30 days, Team 90 days, Enterprise is custom. Auditors and internal security teams can replay any run exactly as it happened, down to the token.',
  },
  {
    n: '05',
    q: 'What\'s on the free tier and what costs extra?',
    a: 'Free covers up to 3 members, unlimited skills, sandbox guardrails, and a small compute quota with 7-day audit retention. Prompt firewalling, RBAC and teams, longer retention, and dedicated compute require Pro or above.',
  },
]

export function FAQ() {
  return (
    <section className="faq" id="faq">
      <div className="wrap faq-grid">
        <div className="faq-intro">
          <p className="section-eyebrow">FAQ</p>
          <h2 className="section-h2">Common questions.</h2>
          <p className="faq-lead">
            Real questions from teams evaluating AgentZ. Straight answers.
          </p>
        </div>
        <div className="faq-list">
          {ITEMS.map((item, i) => (
            <details className="faq-item" key={item.n} open={i === 0}>
              <summary>
                <span className="faq-n">{item.n}</span>
                <span className="faq-q">{item.q}</span>
                <span className="faq-plus"><Icon name="plus" /></span>
              </summary>
              <div className="faq-a">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
      <div className="wrap">
        <div className="faq-help">
          <div>
            <b>Still need help?</b>
            <p>We're happy to walk your team through it and look at your stack.</p>
          </div>
          <a className="btn btn-line" href="https://agentzharness.ai/" target="_blank" rel="noopener">
            See the platform
          </a>
        </div>
      </div>
    </section>
  )
}
