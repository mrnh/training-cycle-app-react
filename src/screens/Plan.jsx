import { useState } from 'react'
import {
  ALL_SESSIONS, WEEKS, activeSession, cycleComplete, exerciseName, fmt, isFinished, liftOf, nextSession,
  retestResults, todayIso, weekRange,
} from '../program'
import { currentCycle, newCycle, update } from '../store'

export default function Plan({ state, onOpen }) {
  const cycle = currentCycle(state)
  const active = activeSession(cycle)
  const next = active ?? nextSession(cycle)
  const doneCount = ALL_SESSIONS.filter((p) => isFinished(cycle, p)).length

  return (
    <div className="screen plan">
      {next && (
        <button className="card next-up" onClick={() => onOpen(next.key)}>
          <span className="muted small">{active ? 'In progress' : 'Next up'}</span>
          <strong>Week {next.week} · Session {next.session}</strong>
          <span className="small">
            {next.primaries.map((p) => `${exerciseName(state, liftOf(cycle, p))} ${p.sets}×${p.reps} @ ${p.pct}%`).join(' · ')}
          </span>
        </button>
      )}

      {cycleComplete(cycle) && <NextCycle state={state} />}

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
                  const complete = isFinished(cycle, plan)
                  const cls = complete ? 'done' : active?.key === plan.key ? 'partial' : next?.key === plan.key ? 'next' : ''
                  return (
                    <button
                      key={s}
                      className={`dot ${cls}`}
                      aria-label={`Week ${week} session ${s}${complete ? ', done' : cls === 'partial' ? ', in progress' : ''}`}
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
  // A re-test that wasn't ticked keeps the old 1RM (it can be changed in Settings)
  const newRM = Object.fromEntries(cycle.primaries.map((id) => [id, results[id] ?? cycle.oneRM[id]]))

  function start() {
    if (!confirm('Start a new 9-week cycle with these 1RMs? This cycle stays in your history.')) return
    update((d) => d.cycles.push(newCycle(date, newRM, cycle.primaries)))
  }

  return (
    <div className="card highlight">
      <strong>Cycle complete</strong>
      <p className="muted small">New 1RMs from the week-9 re-test:</p>
      {cycle.primaries.map((id) => (
        <div className="row small" key={id}>
          <span>{exerciseName(state, id)}</span>
          {results[id] != null ? (
            <span>
              {fmt(cycle.oneRM[id])} → <strong>{fmt(newRM[id])} kg</strong>
            </span>
          ) : (
            <span>
              <strong>{fmt(newRM[id])} kg</strong> <span className="muted">kept, re-test not ticked</span>
            </span>
          )}
        </div>
      ))}
      <p className="muted small">You can still change them in Settings after starting.</p>
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
