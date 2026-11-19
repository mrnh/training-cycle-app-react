import { useState } from 'react'
import {
  ALL_SESSIONS, PRIMARY, WEEKS, fmt, liftName, nextSession, retestComplete,
  retestResults, sessionProgress, todayIso, weekRange,
} from '../program'
import { currentCycle, newCycle, update } from '../store'

export default function Plan({ state, onOpen }) {
  const cycle = currentCycle(state)
  const next = nextSession(cycle)
  const doneCount = ALL_SESSIONS.filter((p) => sessionProgress(cycle, p).complete).length

  return (
    <div className="screen plan">
      {next && (
        <button className="card next-up" onClick={() => onOpen(next.key)}>
          <span className="muted small">Next up</span>
          <strong>Week {next.week} · Session {next.session}</strong>
          <span className="small">
            {next.primaries.map((p) => `${liftName(p.lift)} ${p.sets}×${p.reps} @ ${p.pct}%`).join(' · ')}
          </span>
        </button>
      )}

      {retestComplete(cycle) && <NextCycle state={state} />}

      <div className="weeks">
        {Array.from({ length: WEEKS }, (_, w) => {
          const week = w + 1
          return (
            <div className="week" key={week}>
              <span className="week-label">
                Week {week}
                <span className="muted small">{weekRange(cycle, week)}</span>
              </span>
              <span className="dots">
                {[1, 2, 3].map((s) => {
                  const plan = ALL_SESSIONS[(week - 1) * 3 + s - 1]
                  const { done, complete } = sessionProgress(cycle, plan)
                  const cls = complete ? 'done' : next?.key === plan.key ? 'next' : done > 0 ? 'partial' : ''
                  return (
                    <button
                      key={s}
                      className={`dot ${cls}`}
                      aria-label={`Week ${week} session ${s}${complete ? ', done' : ''}`}
                      onClick={() => onOpen(plan.key)}
                    >
                      {s}
                    </button>
                  )
                })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="bar" role="progressbar" aria-valuenow={doneCount} aria-valuemax={ALL_SESSIONS.length}>
        <div style={{ width: `${(doneCount / ALL_SESSIONS.length) * 100}%` }} />
      </div>
      <p className="muted small">{doneCount} of {ALL_SESSIONS.length} sessions done</p>
    </div>
  )
}

function NextCycle({ state }) {
  const cycle = currentCycle(state)
  const results = retestResults(cycle)
  const [date, setDate] = useState(todayIso())
  const newRM = Object.fromEntries(PRIMARY.map((p) => [p.id, results[p.id] ?? cycle.oneRM[p.id]]))

  function start() {
    if (!confirm('Start a new 9-week cycle with these 1RMs? This cycle stays in your history.')) return
    update((d) => d.cycles.push(newCycle(date, newRM)))
  }

  return (
    <div className="card highlight">
      <strong>Re-test done</strong>
      {PRIMARY.map((p) => (
        <div className="row small" key={p.id}>
          <span>{p.name}</span>
          <span>
            {fmt(cycle.oneRM[p.id])} → <strong>{fmt(newRM[p.id])} kg</strong>
          </span>
        </div>
      ))}
      <label className="field">
        <span>Next cycle starts</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button className="primary" onClick={start} disabled={!date}>
        Start next cycle
      </button>
    </div>
  )
}
