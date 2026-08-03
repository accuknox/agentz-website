type Cell = { text: string; sub?: string }
type DataRow = { label: string; cells: [Cell, Cell] }
type SectionRow = { section: string }
type Row = SectionRow | DataRow

function c(text: string, sub?: string): Cell {
  return { text, sub }
}

/**
 * Two tiers at launch: Free for evaluation, Enterprise for real usage. Pro is
 * deliberately absent until there is traction to price it against, so nothing
 * here should hint at a middle tier.
 */
const ROWS: Row[] = [
  { section: 'Access' },
  {
    label: 'Users',
    cells: [
      c('2 users', 'enough to evaluate with a colleague'),
      c('Talk to sales', 'seat count sized to your org'),
    ],
  },
  {
    label: 'Workspaces',
    cells: [c('1'), c('Unlimited')],
  },
  {
    label: 'SSO',
    cells: [c('GitHub, Google, Microsoft'), c('GitHub, Google, Microsoft, SAML, OIDC')],
  },
  { section: 'Build' },
  {
    label: 'LLM model',
    cells: [
      c('BYOS / BYOK', 'bring your own subscription or key'),
      c('BYOS / BYOK / BYOM', 'or bring your own model, including private ones'),
    ],
  },
  {
    label: 'Workflows and compute',
    cells: [c('One small agent', '1 vCPU, 1 GB RAM'), c('Sized to your workload', 'custom pricing')],
  },
  { section: 'Govern' },
  {
    label: 'Prompt guardrails',
    cells: [c('✗', 'platform defaults only'), c('✓ Custom guardrails', 'written for your domain')],
  },
  {
    label: 'Hosting',
    cells: [c('SaaS'), c('SaaS, on-prem, or self-deployed', 'run it yourself or let AccuKnox run it')],
  },
  {
    label: 'Data residency',
    cells: [c('Shared, multi-tenant'), c('Sandboxed', 'stays inside your network')],
  },
  { section: 'Support' },
  {
    label: 'Dedicated support',
    cells: [c('✗', 'docs and community'), c('✓', 'named contact')],
  },
  {
    label: 'Best for',
    cells: [
      c('Fast rollout, smaller teams'),
      c('Regulated and security-sensitive orgs', 'BFSI, government, PSU'),
    ],
  },
]

function CellContent({ cell }: { cell: Cell }) {
  return (
    <span className={`pt-val${cell.text === '✗' ? ' pt-cross' : ''}`}>
      {cell.text}
      {cell.sub && <span className="pt-sub">{cell.sub}</span>}
    </span>
  )
}

export function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="wrap">
        <h2 className="pricing-h">Start free. Scale when you're ready.</h2>
        <p className="pricing-lede">
          Free is the evaluation tier, so you can build and run real agents before you talk to
          anyone. Enterprise is priced on what you actually run.
        </p>
        <div className="pt-outer">
          <table className="pt pt-2">
            <thead>
              <tr>
                <th className="pt-empty" />
                <th className="pt-plan">
                  <span className="pt-name">Free</span>
                  <span className="pt-price">$0/month</span>
                  <span className="pt-price-sub">Evaluate the platform</span>
                </th>
                <th className="pt-plan pt-hl">
                  <span className="pt-name">Enterprise</span>
                  <span className="pt-price">Custom pricing</span>
                  <span className="pt-price-sub">Talk to sales</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                if ('section' in row) {
                  return (
                    <tr key={i} className="pt-section">
                      <td colSpan={3}>{row.section}</td>
                    </tr>
                  )
                }
                return (
                  <tr key={i} className="pt-row">
                    <td className="pt-feature">{row.label}</td>
                    {row.cells.map((cell, j) => (
                      <td key={j} className={j === 1 ? 'pt-hl' : ''}>
                        <CellContent cell={cell} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="pricing-cta">
          <a className="btn btn-primary" href="https://agentz.accuknox.com/" target="_blank" rel="noopener">
            Start free
          </a>
          <a className="btn btn-line" href="https://accuknox.com/demo" target="_blank" rel="noopener">
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  )
}
