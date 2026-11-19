import Note from '../components/Note'
import { useState } from 'react'
import WeightDialog from '../components/WeightDialog'
import SetRow, { SetHeader } from '../components/SetRow'
import {
  ALL_SESSIONS, exerciseHistory, fmt, liftName, parseKey, sessionPlan,
  setKey, setsSummary, targetWeight, weekRange,
} from '../program'
import { currentCycle, updateCycle } from '../store'

const setLog = (key, patch) =>
  updateCycle((c) => {
    c.logs[key] = { ...c.logs[key], ...patch }
  })
const setNote = (key, text) =>
  updateCycle((c) => {
    c.notes[key] = text
  })

export default function Session({ state, sessionKey, onNavigate }) {
  const cycle = currentCycle(state)
  const { week, session } = parseKey(sessionKey)
  const plan = sessionPlan(week, session)
  const idx = ALL_SESSIONS.findIndex((p) => p.key === sessionKey)
  const prev = ALL_SESSIONS[idx - 1]
  const next = ALL_SESSIONS[idx + 1]
  const secondaries = state.secondary.filter((e) => e.group === plan.group)

  return (
    <div className="screen">
      <header className="session-head">
        <button className="icon" aria-label="Previous session" disabled={!prev} onClick={() => onNavigate(prev.key)}>
          ‹
        </button>
        <div>
          <h1>Week {week} · Session {session}</h1>
          <p className="muted small">
            {weekRange(cycle, week)} · Group {plan.group}
          </p>
        </div>
        <button className="icon" aria-label="Next session" disabled={!next} onClick={() => onNavigate(next.key)}>
          ›
        </button>
      </header>

      {plan.primaries.map((p) => (
        <PrimaryBlock key={p.lift} cycle={cycle} plan={plan} p={p} />
      ))}

      {secondaries.map((ex) => (
        <SecondaryBlock key={ex.id} state={state} cycle={cycle} plan={plan} ex={ex} />
      ))}
      {secondaries.length === 0 && (
        <p className="muted small center">No secondary exercises in group {plan.group} yet. Add them under Exercises.</p>
      )}

      <section className="card">
        <h2>Session note</h2>
        <Note label="Add a session note" value={cycle.notes[plan.key]} onChange={(t) => setNote(plan.key, t)} />
      </section>
    </div>
  )
}

/**
 * Main lifts use the same reps and weight for every set: the weight sits top right
 * ("Weight used", applies to all sets) and each set is a toggle across the card.
 * Sets are still stored one by one, so history and the week-9 re-test keep working.
 */
function PrimaryBlock({ cycle, plan, p }) {
  const target = targetWeight(cycle, p)
  const keys = Array.from({ length: p.sets }, (_, i) => setKey(plan.key, p.lift, i))
  const w = cycle.logs[keys[0]]?.w ?? target
  const [editing, setEditing] = useState(false)
  const setWeight = (v) =>
    updateCycle((c) => {
      for (const k of keys) c.logs[k] = { ...c.logs[k], w: v }
    })

  return (
    <section className={`card ${p.retest ? 'highlight' : ''}`}>
      <div className="lift-head">
        <div>
          <h2>{liftName(p.lift)}</h2>
          <p className="prescription">
            {p.sets}×{p.reps} @ {p.pct}% · <strong>{fmt(target)} kg</strong>
          </p>
        </div>
        <div className="weight-used">
          <span>Weight used</span>
          <span className="weight-value">
            <strong className={w !== target ? 'changed' : undefined}>{fmt(w)} kg</strong>
            <button className="pen" aria-label={`Change ${liftName(p.lift)} weight`} onClick={() => setEditing(true)}>
              ✎
            </button>
          </span>
        </div>
      </div>
      {editing && (
        <WeightDialog
          title={`${liftName(p.lift)} · weight used`}
          value={w}
          planned={target}
          onSave={setWeight}
          onClose={() => setEditing(false)}
        />
      )}
      {p.retest && (
        <p className="small">Tick the single you actually lifted. Its weight becomes your 1RM for the next cycle.</p>
      )}
      <div className="set-toggles">
        {keys.map((k, i) => {
          const done = !!cycle.logs[k]?.done
          return (
            <button
              key={k}
              className={`set-toggle ${done ? 'is-done' : ''}`}
              aria-pressed={done}
              aria-label={`Set ${i + 1}${done ? ', done' : ''}`}
              onClick={() => setLog(k, { w, r: p.reps, done: !done })}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
      <Note value={cycle.notes[`${plan.key}:${p.lift}`]} onChange={(t) => setNote(`${plan.key}:${p.lift}`, t)} />
    </section>
  )
}

function SecondaryBlock({ state, cycle, plan, ex }) {
  const cycleIdx = state.cycles.length - 1
  const order = ALL_SESSIONS.findIndex((s) => s.key === plan.key)
  const last = exerciseHistory(state, ex.id)
    .filter((h) => h.cycle < cycleIdx || (h.cycle === cycleIdx && h.order < order))
    .at(-1)
  const countKey = `${plan.key}:${ex.id}`
  const count = cycle.setCounts[countKey] ?? Math.max(last?.sets.length ?? 3, 1)
  const setCount = (n) =>
    updateCycle((c) => {
      const clamped = Math.max(1, Math.min(12, n))
      for (let i = clamped; i < count; i++) delete c.logs[setKey(plan.key, ex.id, i)]
      c.setCounts[countKey] = clamped
    })

  return (
    <section className="card">
      <div className="row">
        <h2>{ex.name}</h2>
        <span className="badge">Group {ex.group}</span>
      </div>
      <p className="muted small">
        {last ? `Last time (W${last.week} S${last.session}): ${setsSummary(last.sets)}` : 'First time, no history yet'}
      </p>
      <SetHeader />
      {Array.from({ length: count }, (_, i) => {
        const key = setKey(plan.key, ex.id, i)
        const log = cycle.logs[key]
        const hint = last?.sets[i] ?? last?.sets.at(-1)
        return (
          <SetRow
            key={i}
            index={i}
            weight={log?.w}
            reps={log?.r}
            hintW={hint?.w}
            hintR={hint?.r}
            done={!!log?.done}
            onChange={(patch) => setLog(key, patch)}
            onToggle={() => setLog(key, { w: log?.w ?? hint?.w ?? null, r: log?.r ?? hint?.r ?? null, done: !log?.done })}
          />
        )
      })}
      <div className="row">
        <Note value={cycle.notes[countKey]} onChange={(t) => setNote(countKey, t)} />
        <span className="stepper">
          <button className="small-btn" aria-label="Remove a set" onClick={() => setCount(count - 1)}>−</button>
          <button className="small-btn" aria-label="Add a set" onClick={() => setCount(count + 1)}>+ Set</button>
        </span>
      </div>
    </section>
  )
}
