import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from './ui/Icon'
import { ROWS, VENDORS, type Mark } from '../data/comparison'

const MARK_ICON: Record<Mark, string> = { yes: 'check', part: 'dash', no: 'close' }
const MARK_LABEL: Record<Mark, string> = {
  yes: 'Built in',
  part: 'Costs extra, or you build it',
  no: 'Not available',
}

type PopData = { title: string; sub?: string; mark?: Mark; body: string }
type Pop = (PopData & { x: number; y: number }) | null

/**
 * One table, eight products. Every mark carries its own reason: point at it and
 * a card explains why that product scored the way it did. The row label's info
 * button explains the capability itself.
 *
 * The card is a single fixed-position node anchored off the trigger's rect
 * rather than a child of the cell, because the table scrolls sideways and a
 * nested card would be clipped at the edges.
 */
export function Comparison() {
  const [pop, setPop] = useState<Pop>(null)
  const [openKey, setOpenKey] = useState<string | null>(null)

  // Hover is the primary way in on a pointer device. Touch has no hover, so
  // there the same triggers work on tap.
  const canHover = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    [],
  )

  const close = useCallback(() => {
    setPop(null)
    setOpenKey(null)
  }, [])

  const show = useCallback((el: HTMLElement, key: string, data: PopData) => {
    const r = el.getBoundingClientRect()
    // clientWidth, not innerWidth: innerWidth includes a classic scrollbar and
    // would let the card sit under it
    const vw = document.documentElement.clientWidth
    const width = Math.min(320, vw - 24)
    const x = Math.min(Math.max(12 + width / 2, r.left + r.width / 2), vw - 12 - width / 2)
    setPop({ ...data, x, y: r.bottom + 10 })
    setOpenKey(key)
  }, [])

  /** Hover in, tap to toggle, and focus for keyboard users. */
  const triggerProps = useCallback(
    (key: string, data: PopData) => ({
      'data-cmp-trigger': true,
      'aria-expanded': openKey === key,
      onMouseEnter: canHover
        ? (e: React.MouseEvent<HTMLElement>) => show(e.currentTarget, key, data)
        : undefined,
      onMouseLeave: canHover ? close : undefined,
      onFocus: (e: React.FocusEvent<HTMLElement>) => show(e.currentTarget, key, data),
      onBlur: close,
      onClick: (e: React.MouseEvent<HTMLElement>) =>
        openKey === key ? close() : show(e.currentTarget, key, data),
    }),
    [openKey, canHover, show, close],
  )

  useEffect(() => {
    if (!openKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('.cmp-pop') && !t.closest('[data-cmp-trigger]')) close()
    }
    // a scroll moves the anchor out from under the card, so dismiss it
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', close, { passive: true, capture: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('resize', close)
    }
  }, [openKey, close])

  return (
    <section className="cmp" id="comparison">
      <div className="wrap">
        <div className="fhead">
          <h2 className="fhead-h">How AgentZ compares.</h2>
          <p className="fhead-p">
            Every other platform here treats security as something you add later. AgentZ ships with a security sandbox
            by default.
          </p>
        </div>

        <div className="cmp-key" role="note">
          <span><span className="cmp-mark is-yes"><Icon name="check" /></span> Built in</span>
          <span><span className="cmp-mark is-part"><Icon name="dash" /></span> Costs extra, or you build it</span>
          <span><span className="cmp-mark is-no"><Icon name="close" /></span> Not available</span>
        </div>

        <div
          className="cmp-scroll"
          tabIndex={0}
          role="group"
          aria-label="Feature comparison table, scroll sideways to see every product"
        >
          <table className="cmp-table">
            <caption className="sr-only">
              AgentZ compared with LangGraph, CrewAI AMP, Microsoft Foundry Agents, AWS Bedrock AgentCore, OpenClaw,
              Hermes Agent and n8n
            </caption>
            <thead>
              <tr>
                <th scope="col" className="cmp-rowhead">Capability</th>
                {VENDORS.map((v) => (
                  <th scope="col" key={v.id} className={v.id === 'agentz' ? 'cmp-us' : undefined}>
                    <span className="cmp-vendor">{v.name}</span>
                    <span className="cmp-kind">{v.kind}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label}>
                  <th scope="row" className="cmp-rowhead">
                    <span className="cmp-label">
                      {row.label} <span className="cmp-term">({row.term})</span>
                    </span>
                    <button
                      type="button"
                      className={`cmp-info${openKey === `r${i}` ? ' is-on' : ''}`}
                      aria-label={`What "${row.label}" means`}
                      {...triggerProps(`r${i}`, { title: row.label, body: row.plain })}
                    >
                      <Icon name="info" />
                    </button>
                  </th>
                  {VENDORS.map((v) => {
                    const cell = row.cells[v.id]
                    const key = `c${i}-${v.id}`
                    return (
                      <td key={v.id} className={v.id === 'agentz' ? 'cmp-us' : undefined}>
                        <button
                          type="button"
                          className={`cmp-cell${openKey === key ? ' is-on' : ''}`}
                          aria-label={`${v.name}, ${row.label}: ${MARK_LABEL[cell.mark]}. ${cell.note}`}
                          {...triggerProps(key, {
                            title: v.name,
                            sub: row.label,
                            mark: cell.mark,
                            body: cell.note,
                          })}
                        >
                          <span className={`cmp-mark is-${cell.mark}`}>
                            <Icon name={MARK_ICON[cell.mark]} />
                          </span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pop && (
        <div className="cmp-pop" role="tooltip" aria-hidden="true" style={{ left: pop.x, top: pop.y }}>
          <div className="cmp-pop-head">
            {pop.mark && (
              <span className={`cmp-mark is-${pop.mark}`}>
                <Icon name={MARK_ICON[pop.mark]} />
              </span>
            )}
            <b>{pop.title}</b>
            {pop.sub && <span className="cmp-pop-sub">{pop.sub}</span>}
          </div>
          {pop.mark && <span className="cmp-pop-verdict">{MARK_LABEL[pop.mark]}</span>}
          <p>{pop.body}</p>
        </div>
      )}
    </section>
  )
}
