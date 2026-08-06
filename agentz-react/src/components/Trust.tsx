import { Icon } from './ui/Icon'

/**
 * Two trust guarantees, side by side. Left: secrets never enter the agent
 * context, so an injection has nothing to leak. Right: the platform runs on the
 * customer's own ground, so nobody else sees the data. Both are plain hairline
 * panels, no fake OS chrome (see CLAUDE.md).
 */
export function Trust() {
  return (
    <section className="trust" id="trust">
      <div className="wrap">
        <div className="trust-grid">
          <article className="trust-card">
            <span className="section-eyebrow">No keys in the agent</span>
            <h2 className="trust-h">Agents never hold your secrets.</h2>
            <p className="trust-p">
              AgentZ injects scoped credentials at runtime and never stores them in the agent context. A prompt
              injection cannot leak what the agent never sees.
            </p>

            <div className="trust-visual" aria-hidden="true">
              <div className="env-panel">
                <span className="env-name">.env</span>
                <code className="env-line struck">AWS_SECRET_KEY=…</code>
                <code className="env-line struck">GITHUB_TOKEN=…</code>
                <code className="env-line struck">SLACK_TOKEN=…</code>
              </div>
              <div className="trust-flow">
                <span className="tf-node">Agent</span>
                <span className="tf-wire" />
                <span className="tf-node tf-hub">
                  <img src="./assets/img/agentz-logo.svg" alt="" width={22} height={22} />
                </span>
                <span className="tf-wire" />
                <span className="tf-token">
                  <Icon name="key" className="ico-sm" />
                  scoped
                </span>
              </div>
            </div>
          </article>

          <article className="trust-card">
            <span className="section-eyebrow">Runs on your ground</span>
            <h2 className="trust-h">Nobody else sees your data.</h2>
            <p className="trust-p">
              Deploy on-prem or fully air-gapped. Logs, traces and audit evidence stay on your infrastructure. AgentZ
              never phones home.
            </p>

            <div className="trust-visual" aria-hidden="true">
              <div className="resid-stack">
                <span className="resid-card" />
                <span className="resid-card" />
                <span className="resid-card resid-front">
                  <Icon name="eye" />
                  <s className="resid-slash" />
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
