import { LazyVideo } from './ui/LazyVideo'

export function Showcase() {
  return (
    <section className="showcase">
      <div className="wrap">
        <div className="vw vw-hero">
          <LazyVideo
            src="./assets/video/hero-workflow-graph.mp4"
            poster="./assets/video/hero-workflow-graph.jpg"
            label="A workflow running live in AgentZ, steps moving through running and succeeded"
          />
        </div>
      </div>
    </section>
  )
}
