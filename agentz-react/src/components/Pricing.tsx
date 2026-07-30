type Cell = { text: string; sub?: string; cross?: boolean }
type DataRow = { label: string; cells: [Cell, Cell, Cell, Cell] }
type SectionRow = { section: string }
type Row = SectionRow | DataRow

function c(text: string, sub?: string, cross?: boolean): Cell {
  return { text, sub, cross }
}

const ROWS: Row[] = [
  { section: 'Access' },
  {
    label: 'Seats',
    cells: [
      c('Up to 3 members', 'try it out as a team'),
      c('1 (per seat)'),
      c('Per seat', 'org roster, admin-provisioned'),
      c('Unlimited, custom SSO/SCIM'),
    ],
  },
  {
    label: 'Model access (BYOK)',
    cells: [c('✓ Any provider'), c('✓ Any provider'), c('✓ Any provider'), c('✓ Any + private/on-prem models')],
  },
  { section: 'Build' },
  {
    label: 'Skills library',
    cells: [c('✓ Unlimited'), c('✓ Unlimited'), c('✓ Unlimited + shared org library'), c('✓ Unlimited')],
  },
  {
    label: 'Workflow runs',
    cells: [
      c('✓ Unlimited', 'bounded by compute quota below'),
      c('✓ Unlimited', 'bounded by compute quota below'),
      c('✓ Unlimited', 'bounded by compute quota below'),
      c('✓ Unlimited'),
    ],
  },
  {
    label: 'Sandbox compute',
    cells: [
      c('Small included quota', undefined, true),
      c('Standard quota', 'metered overage'),
      c('Pooled org quota', 'metered overage'),
      c('Custom / dedicated capacity'),
    ],
  },
  { section: 'Govern' },
  {
    label: 'Sandbox guardrails (default-deny)',
    cells: [c('✓'), c('✓'), c('✓'), c('✓')],
  },
  {
    label: 'Prompt firewalling',
    cells: [c('✗', undefined, true), c('✓'), c('✓'), c('✓ custom policies')],
  },
  {
    label: 'Teams & RBAC (roles, admin)',
    cells: [c('✗', undefined, true), c('✗', undefined, true), c('✓'), c('✓ custom roles')],
  },
  {
    label: 'Signed audit trace',
    cells: [
      c('7-day retention', undefined, true),
      c('30-day retention'),
      c('90-day retention, org-wide'),
      c('Custom retention, exportable'),
    ],
  },
  {
    label: 'Deployment',
    cells: [c('Shared cloud'), c('Shared cloud'), c('Shared cloud'), c('✓ VPC / on-prem / air-gapped')],
  },
  { section: 'Support' },
  {
    label: 'Support level',
    cells: [c('Community'), c('Email'), c('Priority'), c('Dedicated CSM + SLA')],
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
        <div className="pt-outer">
          <table className="pt">
            <thead>
              <tr>
                <th className="pt-empty" />
                <th className="pt-plan">
                  <span className="pt-name">Free</span>
                  <span className="pt-price">$0/month</span>
                </th>
                <th className="pt-plan">
                  <span className="pt-name">Pro</span>
                  <span className="pt-price">Per seat, priced at launch</span>
                </th>
                <th className="pt-plan pt-hl">
                  <span className="pt-name">Team</span>
                  <span className="pt-price">Per seat, priced at launch</span>
                  <span className="pt-price-sub">+ platform fee</span>
                </th>
                <th className="pt-plan">
                  <span className="pt-name">Enterprise</span>
                  <span className="pt-price">Let's talk</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                if ('section' in row) {
                  return (
                    <tr key={i} className="pt-section">
                      <td colSpan={5}>{row.section}</td>
                    </tr>
                  )
                }
                return (
                  <tr key={i} className="pt-row">
                    <td className="pt-feature">{row.label}</td>
                    {row.cells.map((cell, j) => (
                      <td key={j} className={j === 2 ? 'pt-hl' : ''}>
                        <CellContent cell={cell} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
