import { Icon } from './ui/Icon'

/**
 * Two guarantees, side by side. Left: secrets never enter the agent context, so
 * an injection has nothing to leak. Right: the platform runs on the customer's
 * own infrastructure, so no data leaves the perimeter. Plain hairline panels,
 * no fake OS chrome (see CLAUDE.md).
 */

/** Fuzzy, redacted content standing in for logs and evidence the platform never reads. */
function RedactedCard({ className }: { className: string }) {
  return (
    <div className={`resid-card ${className}`}>
      <div className="resid-head">
        <span className="resid-dot" />
        <div className="resid-lines">
          <span className="resid-line w-60" />
          <span className="resid-line w-40" />
        </div>
      </div>
      <span className="resid-line w-90" />
      <span className="resid-line w-80" />
      <span className="resid-line w-70" />
      <span className="resid-line w-85" />
    </div>
  )
}

export function Trust() {
  return (
    <section className="trust" id="trust">
      <div className="wrap">
        <div className="trust-grid">
          <article className="trust-card">
            <h2 className="trust-h">Agents never hold secrets.</h2>
            <p className="trust-p">
              AgentZ injects scoped credentials at runtime and never stores them in the agent context. A prompt
              injection cannot leak what the agent never receives.
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
            <h2 className="trust-h">Data never leaves the perimeter.</h2>
            <p className="trust-p">
              Deploy on-prem or fully air-gapped. Logs, traces, and audit evidence remain on customer infrastructure.
              AgentZ makes no outbound calls.
            </p>

            <div className="trust-visual" aria-hidden="true">
              <div className="resid-stack">
                <RedactedCard className="resid-c3" />
                <RedactedCard className="resid-c2" />
                <RedactedCard className="resid-c1" />
                <span className="resid-eye">
                  <Icon name="eye" />
                  <span className="resid-slash" />
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
