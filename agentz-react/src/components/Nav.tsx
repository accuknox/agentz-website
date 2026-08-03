import { ThemeToggle } from './ThemeToggle'
import { Icon } from './ui/Icon'

/**
 * Transparent top nav. It sits over the hero with no background of its own and
 * only picks up a hairline and a wash once you scroll past the fold, which
 * useSiteEffects toggles with .is-stuck.
 *
 * Five links, deliberately. Anything past that and the row crowds the wordmark.
 */
const LINKS = [
  ['Platform', '#platform'],
  ['Comparison', '#comparison'],
  ['Governance', '#governance'],
  ['Pricing', '#pricing'],
  ['FAQ', '#faq'],
]

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
          <ThemeToggle />
          <a className="nav-cta" href="https://agentz.accuknox.com/" target="_blank" rel="noopener">
            Try AgentZ
          </a>
          <a
            className="nav-gh"
            href="https://github.com/accuknox/agentZ"
            target="_blank"
            rel="noopener"
            aria-label="AgentZ on GitHub"
            title="AgentZ on GitHub"
          >
            <Icon name="github" />
          </a>
        </div>
      </div>
    </header>
  )
}
