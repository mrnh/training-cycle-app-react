import { useState } from 'react'
import {
  activeSession, sessionName, cycleComplete, exerciseName, fmt, isFinished, liftOf, mainLifts, nextSession, programOf,
  retestResults, targetWeight, todayIso, unit, weekRange,
} from '../program'
import { currentCycle, newCycle, update } from '../store'
import useConfirm from '../components/useConfirm'

export default function Plan({ state, onOpen }) {
  const cycle = currentCycle(state)
  const active = activeSession(cycle)
  const next = active ?? nextSession(cycle)
  const program = programOf(cycle)
  const sessions = program.sessions
  const doneCount = sessions.filter((p) => isFinished(cycle, p)).length

  return (
    <div className="screen plan">
      {next && (
        <button className="card next-up" onClick={() => onOpen(next.key)}>
          <span className="muted small">{active ? 'In progress' : 'Next up'}</span>
          <strong>{sessionName(next)}</strong>
          <span className="small">
            {mainLifts(cycle, next)
              .map((p) => `${exerciseName(state, liftOf(cycle, p))} ${p.sets}×${p.reps} @ ${fmt(targetWeight(cycle, p))} ${unit()}`)
              .join(' · ') || `Accessory work, group ${next.group}`}
          </span>
        </button>
      )}

      {cycleComplete(cycle) && <NextCycle state={state} />}

      <div className="weeks">
        {program.weeks.map((plans, w) => {
          const week = w + 1
          return (
            <div className="week" key={week}>
              <span className="week-label">
                Week {week}
                <span className="muted small">{weekRange(cycle, week)}</span>
              </span>
              <span className="dots">
                {plans.map((plan) => {
                  const s = plan.session
                  const complete = isFinished(cycle, plan)
                  const cls = complete ? 'done' : active?.key === plan.key ? 'partial' : next?.key === plan.key ? 'next' : ''
                  return (
                    <button
                      key={s}
                      className={`dot ${cls}`}
                      aria-label={`${sessionName(plan)}${complete ? ', done' : cls === 'partial' ? ', in progress' : ''}`}
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

      <div className="bar" role="progressbar" aria-valuenow={doneCount} aria-valuemax={sessions.length}>
        <div style={{ width: `${(doneCount / sessions.length) * 100}%` }} />
      </div>
      <p className="muted small">{doneCount} of {sessions.length} sessions done</p>
    </div>
  )
}

function NextCycle({ state }) {
  const cycle = currentCycle(state)
  const program = programOf(cycle)
  const results = retestResults(cycle)
  const [date, setDate] = useState(todayIso())
  // A re-test that wasn't ticked keeps the old 1RM (it can be changed in Settings)
  const lifts = cycle.primaries.filter(Boolean)
  const newRM = Object.fromEntries(lifts.map((id) => [id, results[id] ?? cycle.oneRM[id]]))

  const [confirmDialog, confirm] = useConfirm()
  async function start() {
    const ok = await confirm({
      title: 'Start the next cycle?',
      message: `A new ${program.weekCount}-week cycle with these 1RMs. This cycle stays in your history.`,
      confirmLabel: 'Start cycle',
    })
    if (!ok) return
    update((d) => d.cycles.push(newCycle(date, newRM, cycle.primaries, cycle.program)))
  }

  return (
    <div className="card highlight">
      <strong>Cycle complete</strong>
      <p className="muted small">New 1RMs from the week-{program.weekCount} re-test:</p>
      {lifts.map((id) => (
        <div className="row small" key={id}>
          <span>{exerciseName(state, id)}</span>
          {results[id] != null ? (
            <span>
              {fmt(cycle.oneRM[id])} → <strong>{fmt(newRM[id])} {unit()}</strong>
            </span>
          ) : (
            <span>
              <strong>{fmt(newRM[id])} {unit()}</strong> <span className="muted">kept, re-test not ticked</span>
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
      {confirmDialog}
    </div>
  )
}
