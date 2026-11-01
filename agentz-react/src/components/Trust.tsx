import { Icon } from './ui/Icon'
import '../styles/sections.css'

/**
 * Two guarantees, as two tiles. Left: the agent carries a placeholder and the
 * proxy swaps in the real key at the door, so a prompt injection has nothing
 * to leak. Right: logs, traces and audit stay inside the customer's own
 * perimeter, and nothing goes out.
 */
export function Trust() {
  return (
    <section className="tr" id="trust">
      <div className="wrap tr-grid">
        <article className="tr-tile hue-cyan">
          <h2 className="tr-h">Agents never hold secrets.</h2>
          <p className="sx-sub">The proxy injects a scoped key at runtime. A prompt injection has nothing to leak.</p>

          <div className="tr-visual tr-broker" aria-hidden="true">
            <div className="tr-node">
              <Icon name="d-model" className="duo hue-violet" />
              <span>Agent</span>
              <code className="tr-fake">PLACEHOLDER</code>
            </div>
            <span className="tr-link">
              <i />
            </span>
            <div className="tr-node tr-hub">
              <img src="./assets/img/agentz-logo.svg" alt="" width={24} height={24} />
              <span>Proxy</span>
              <code className="tr-real">••••••••</code>
            </div>
            <span className="tr-link tr-link-b">
              <i />
            </span>
            <div className="tr-node">
              <img className="pa-logo is-mono" src="./assets/img/logos/github.svg" alt="" width={22} height={22} />
              <span>github.com</span>
              <code className="tr-ok">200</code>
            </div>
          </div>
        </article>

        <article className="tr-tile hue-blue">
          <h2 className="tr-h">Data never leaves the perimeter.</h2>
          <p className="sx-sub">Run on-prem or air-gapped. Logs, traces and audit stay on your infrastructure.</p>

          <div className="tr-visual tr-perim" aria-hidden="true">
            <div className="tr-fence">
              <span className="tr-fence-label">Your network</span>
              {[
                ['report', 'Logs'],
                ['replay', 'Traces'],
                ['verdict', 'Audit'],
              ].map(([ic, t]) => (
                <span className="tr-item" key={t}>
                  <Icon name={`d-${ic}`} className="duo" />
                  {t}
                </span>
              ))}
            </div>
            <span className="tr-out">
              <i />
              <b>
                <Icon name="close" />
              </b>
            </span>
            <span className="tr-cloud">
              <Icon name="d-cloud" className="duo" />
            </span>
          </div>
        </article>
      </div>
    </section>
  )
}
