export function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="wrap">
        <div className="cta-inner cta-dark">
          <div className="cta-copy">
            <h2>Put your first agent in production.</h2>
            <p>Start with one skill. Bring your own model. Ship your first agent to production this week.</p>
            <a
              className="btn btn-light btn-lg"
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
          <div className="cta-art">
            <img src="./assets/img/scenes/robot.webp" alt="An agent moving fast, governed by default" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  )
}
