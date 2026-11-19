import { useState } from 'react'
import {
  ALL_SESSIONS, WEEKS, cycleComplete, exerciseName, fmt, isFinished, isStarted, liftOf, nextSession,
  retestResults, todayIso, weekRange,
} from '../program'
import { currentCycle, newCycle, update } from '../store'

export default function Plan({ state, onOpen }) {
  const cycle = currentCycle(state)
  const next = nextSession(cycle)
  const doneCount = ALL_SESSIONS.filter((p) => isFinished(cycle, p)).length

  return (
    <div className="screen plan">
      {next && (
        <button className="card next-up" onClick={() => onOpen(next.key)}>
          <span className="muted small">Next up</span>
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
                  const cls = complete ? 'done' : next?.key === plan.key ? 'next' : isStarted(cycle, plan) ? 'partial' : ''
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
  // A re-test that wasn't ticked keeps the old 1RM (it can be changed in Settings)
  const newRM = Object.fromEntries(cycle.primaries.map((id) => [id, results[id] ?? cycle.oneRM[id]]))

  function start() {
    if (!confirm('Start a new 9-week cycle with these 1RMs? This cycle stays in your history.')) return
    update((d) => d.cycles.push(newCycle(date, newRM, cycle.primaries)))
  }

  return (
    <div className="card highlight">
      <strong>Re-test done</strong>
      {cycle.primaries.map((id) => (
        <div className="row small" key={id}>
          <span>{exerciseName(state, id)}</span>
          <span>
            {fmt(cycle.oneRM[id])} → <strong>{fmt(newRM[id])} kg</strong>
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
