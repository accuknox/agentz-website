import { useState } from 'react'
import { Icon } from './ui/Icon'
import { PhotoGround } from './ui/PhotoGround'

/**
 * The two AccuKnox films, on a dark navy band with a photographic ground.
 *
 * Each card is a facade, not an iframe. A YouTube embed pulls roughly 900KB of
 * player before anyone presses anything, and two of them on one page is most of
 * the transfer budget spent on a thing nobody asked for. So the card renders the
 * poster, and the iframe is created on the first click, with autoplay set so the
 * click that loads the player is also the click that starts the film.
 */
type Film = {
  id: string
  title: string
  sub: string
  alt: string
}

const FILMS: Film[] = [
  {
    id: 'mAzLWcr59g0',
    title: 'Introducing AgentZ',
    sub: 'Build, run and automate AI agents on one Zero Trust platform. The launch film.',
    alt: 'AgentZ launch film: Introducing AgentZ, the Zero Trust Agentic AI Platform',
  },
  {
    id: 'dX1sO3sOoFI',
    title: 'A live demo on Kubernetes',
    sub: 'Rahul Jadhav, CTO at AccuKnox, on why agent sandboxes fail and what AgentZ enforces instead.',
    alt: 'AgentZ demo with Rahul Jadhav, CTO and cofounder of AccuKnox, on AI agents with secured workflows',
  },
]

function FilmCard({ film }: { film: Film }) {
  const [playing, setPlaying] = useState(false)

  return (
    <article className="film">
      <div className="film-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&modestbranding=1`}
            title={film.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button type="button" className="film-hit" onClick={() => setPlaying(true)} aria-label={`Play: ${film.title}`}>
            <img
              src={`./assets/img/yt/${film.id}.webp`}
              alt={film.alt}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
            />
            <span className="film-play" aria-hidden="true">
              <Icon name="play" />
            </span>
          </button>
        )}
      </div>
      <div className="film-copy">
        <b>{film.title}</b>
        <p>{film.sub}</p>
        <a href={`https://www.youtube.com/watch?v=${film.id}`} target="_blank" rel="noopener">
          Watch on YouTube
        </a>
      </div>
    </article>
  )
}

export function Watch() {
  return (
    <section className="watch" id="watch">
      <PhotoGround plate="field" className="pground-watch" />
      <div className="wrap watch-inner">
        <div className="watch-head">
          <h2 className="section-h2">
            Watch the platform <span className="hl hl-a">run</span>.
          </h2>
          <p className="watch-lead">
            One overview and one live demo, both from the team that builds it.
          </p>
        </div>
        <div className="watch-grid">
          {FILMS.map((f) => (
            <FilmCard film={f} key={f.id} />
          ))}
        </div>
      </div>
    </section>
  )
}
