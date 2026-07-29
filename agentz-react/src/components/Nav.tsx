import { ThemeToggle } from './ThemeToggle'

/**
 * Transparent top nav. It sits over the hero with no background of its own and
 * only picks up a hairline and a wash once you scroll past the fold, which
 * useSiteEffects toggles with .is-stuck.
 *
 * Four links, deliberately. Pricing lands here when it exists.
 */
const LINKS = [
  ['Platform', '#platform'],
  ['Comparison', '#comparison'],
  ['Governance', '#governance'],
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
          <a
            className="nav-cta"
            href="#waitlist"
            data-tally-open="RGlZ1l"
            data-tally-layout="modal"
            data-tally-width="540"
            data-tally-overlay="1"
            data-tally-emoji-text="👋"
            data-tally-emoji-animation="wave"
          >
            Join the waitlist
          </a>
        </div>
      </div>
    </header>
  )
}
