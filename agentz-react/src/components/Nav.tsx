import { ThemeToggle } from './ThemeToggle'
import { Icon } from './ui/Icon'

/**
 * Floating island nav. Three tracks: wordmark, section links, actions.
 *
 * The action cluster is deliberately three tiers of weight, because four
 * same-looking chips in a row read as one blur:
 *   glyph   Product Hunt, the orange mark alone, no label to compete with
 *   quiet   Docs, text with a leading glyph and no container
 *   outline Star on GitHub, a hairline pill
 *   solid   Try AgentZ, the only filled control in the bar
 * A hairline divider separates the two quiet marks from the two that ask for a
 * click, and the theme toggle sits past a second divider as a utility.
 */
const LINKS = [
  ['Platform', '#platform'],
  ['Tour', '#tour'],
  ['Comparison', '#comparison'],
  ['Governance', '#governance'],
  ['Pricing', '#pricing'],
]

export const PRODUCT_HUNT_URL =
  'https://www.producthunt.com/products/agentz?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-agentz'

export function Nav() {
  return (
    <header className="nav" id="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#top" aria-label="AgentZ home">
          <img src="./assets/img/agentz-logo.svg" alt="" width={26} height={26} />
          AgentZ
        </a>

        <nav className="nav-links" aria-label="Sections">
          {LINKS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a
            className="nav-ph"
            href={PRODUCT_HUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Upvote AgentZ on Product Hunt"
            aria-label="Upvote AgentZ on Product Hunt"
          >
            <Icon name="producthunt" />
          </a>

          <a className="nav-quiet" href="https://docs.agentzharness.ai/" target="_blank" rel="noopener">
            <Icon name="book" />
            <span>Docs</span>
          </a>

          <span className="nav-div" aria-hidden="true" />

          <a
            className="nav-star"
            href="https://github.com/accuknox/agentZ"
            target="_blank"
            rel="noopener"
            title="Star AgentZ on GitHub"
          >
            <Icon name="github" />
            <span className="nav-star-label">Star</span>
          </a>

          <a className="nav-cta" href="https://agentzharness.ai/" target="_blank" rel="noopener">
            Try AgentZ
            <Icon name="arrow" />
          </a>

          <span className="nav-div nav-div-end" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
