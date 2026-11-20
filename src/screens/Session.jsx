import Note from '../components/Note'
import { useState } from 'react'
import FinishDialog from '../components/FinishDialog'
import FinishedSession from '../components/FinishedSession'
import RestTimer from '../components/RestTimer'
import WeightDialog from '../components/WeightDialog'
import SetRow, { SetHeader } from '../components/SetRow'
import {
  ALL_SESSIONS, activeSession, sessionName, clockTime, draftSecondaries, exerciseHistory, exerciseName, finishSession, fmt,
  liftOf, parseKey, secondaryKey, sessionPlan, setKey, setsSummary, startSession, startableSession, targetWeight,
  todayIso, untickedSets, weekRange,
} from '../program'
import { currentCycle, update, updateCycle } from '../store'

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
  const record = cycle.finished[plan.key]
  const active = activeSession(cycle)
  const isOpen = active?.key === plan.key
  const canStart = !record && !isOpen && startableSession(cycle)?.key === plan.key
  const [dialog, setDialog] = useState(null) // 'finish' | 'start'
  const unticked = (p) => untickedSets(cycle, p).map((u) => ({ ...u, name: exerciseName(state, u.id) }))
  const finish = () =>
    update((d) => {
      finishSession(d, currentCycle(d), plan, todayIso())
    })
  const start = () =>
    update((d) => {
      startSession(d, currentCycle(d), plan)
    })
  // Starting finishes an open session first, so that needs a confirmation
  const onStart = () => (active ? setDialog('start') : start())

  return (
    <div className="screen">
      <header className="session-head">
        <button className="icon" aria-label="Previous session" disabled={!prev} onClick={() => onNavigate(prev.key)}>
          ‹
        </button>
        <div>
          <h1>{sessionName(plan)}</h1>
          <p className="muted small">
            {weekRange(cycle, week)} · Group {plan.group}
          </p>
        </div>
        <button className="icon" aria-label="Next session" disabled={!next} onClick={() => onNavigate(next.key)}>
          ›
        </button>
      </header>

      {record ? (
        <FinishedSession record={record} />
      ) : (
        <>
          {isOpen && <p className="in-progress small">● In progress since {clockTime(cycle.active.startedAt)}</p>}
          {canStart && (
            <div className="card start-card">
              {active && <p className="small">{sessionName(active)} is still open. Starting this session finishes it.</p>}
              <button className="primary" onClick={onStart}>Start session</button>
            </div>
          )}
          {!isOpen && !canStart && <NotYet cycle={cycle} active={active} onNavigate={onNavigate} />}
          <Draft state={state} cycle={cycle} plan={plan} open={isOpen} onFinish={() => setDialog('finish')} />
        </>
      )}
      {dialog === 'finish' && (
        <FinishDialog unticked={unticked(plan)} onConfirm={finish} onClose={() => setDialog(null)} />
      )}
      {dialog === 'start' && (
        <FinishDialog
          heading="Start this session?"
          message={`${sessionName(active)} is still open. Starting ${sessionName(plan)} finishes it as it is and saves it permanently.`}
          confirmLabel="Finish it and start"
          unticked={unticked(active)}
          onConfirm={start}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

/** A session that can't be started yet: points to the one to do first. */
function NotYet({ cycle, active, onNavigate }) {
  const first = active ?? startableSession(cycle)
  if (!first) return null
  return (
    <p className="muted small center">
      Preview. Sessions are done in order:{' '}
      <button className="link inline" onClick={() => onNavigate(first.key)}>
        {active ? `${sessionName(first)} is open` : `start ${sessionName(first)}`}
      </button>
    </p>
  )
}

/**
 * The open session: every change is saved to the device straight away (the draft).
 * Any other unfinished session is shown the same way as a preview, with all controls disabled.
 */
function Draft({ state, cycle, plan, open, onFinish }) {
  const secondaries = draftSecondaries(state, cycle, plan)
  return (
    <fieldset className="draft" disabled={!open}>
      {plan.primaries.map((p) => (
        <PrimaryBlock key={p.slot} state={state} cycle={cycle} plan={plan} p={p} open={open} />
      ))}

      {secondaries.map((id) => (
        <SecondaryBlock key={id} state={state} cycle={cycle} plan={plan} id={id} open={open} />
      ))}
      {secondaries.length === 0 && (
        <p className="muted small center">No secondary exercises in group {plan.group} yet. Add them in Settings.</p>
      )}

      {open && (
        <>
          <section className="card">
            <h2>Session note</h2>
            <Note label="Add a session note" value={cycle.notes[plan.key]} onChange={(t) => setNote(plan.key, t)} />
          </section>

          <button className="primary finish" onClick={onFinish}>
            Finish session
          </button>
        </>
      )}
    </fieldset>
  )
}

/**
 * Main lifts use the same reps and weight for every set: the weight sits top right
 * ("Weight used", applies to all sets) and each set is a toggle across the card.
 * Sets are still stored one by one, so history and the week-9 re-test keep working.
 */
function PrimaryBlock({ state, cycle, plan, p, open }) {
  const lift = liftOf(cycle, p)
  const name = exerciseName(state, lift)
  const target = targetWeight(cycle, p)
  const keys = Array.from({ length: p.sets }, (_, i) => setKey(plan.key, lift, i))
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
          <h2>{name}</h2>
          <p className="muted small">
            {p.sets}×{p.reps} @ {p.pct}% · <strong className="planned">{fmt(target)} kg</strong>
          </p>
        </div>
        <div className="weight-used">
          <span>Weight used</span>
          <span className="weight-value">
            <strong className={w !== target ? 'changed' : undefined}>{fmt(w)} kg</strong>
            {open && (
              <button className="pen" aria-label={`Change ${name} weight`} onClick={() => setEditing(true)}>
                ✎
              </button>
            )}
          </span>
        </div>
      </div>
      {editing && (
        <WeightDialog
          title={`${name} · weight used`}
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
      {open && (
        <RestTimer
          cycle={cycle}
          card={`${plan.key}:${lift}`}
          sets={p.sets}
          label={name}
          note={<Note value={cycle.notes[`${plan.key}:${lift}`]} onChange={(t) => setNote(`${plan.key}:${lift}`, t)} />}
        />
      )}
    </section>
  )
}

function SecondaryBlock({ state, cycle, plan, id, open }) {
  const cycleIdx = state.cycles.length - 1
  const order = ALL_SESSIONS.findIndex((s) => s.key === plan.key)
  const entry = secondaryKey(id)
  const last = exerciseHistory(state, id, 'secondary')
    .filter((h) => h.cycle < cycleIdx || (h.cycle === cycleIdx && h.order < order))
    .at(-1)
  const countKey = `${plan.key}:${entry}`
  const count = cycle.setCounts[countKey] ?? Math.max(last?.sets.length ?? 3, 1)
  const setCount = (n) =>
    updateCycle((c) => {
      const clamped = Math.max(1, Math.min(12, n))
      for (let i = clamped; i < count; i++) delete c.logs[setKey(plan.key, entry, i)]
      c.setCounts[countKey] = clamped
    })

  return (
    <section className="card">
      <div className="row">
        <h2>{exerciseName(state, id)}</h2>
        <span className="badge">Group {plan.group}</span>
      </div>
      <p className="muted small">
        {last ? `Last time (${sessionName(last)}): ${setsSummary(last.sets)}` : 'First time, no history yet'}
      </p>
      <SetHeader />
      {Array.from({ length: count }, (_, i) => {
        const key = setKey(plan.key, entry, i)
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
      {open && (
        <>
          <span className="stepper end">
            <button className="small-btn" aria-label="Remove a set" onClick={() => setCount(count - 1)}>−</button>
            <button className="small-btn" aria-label="Add a set" onClick={() => setCount(count + 1)}>+ Set</button>
          </span>
          <RestTimer
            cycle={cycle}
            card={countKey}
            sets={count}
            label={exerciseName(state, id)}
            note={<Note value={cycle.notes[countKey]} onChange={(t) => setNote(countKey, t)} />}
          />
        </>
      )}
    </section>
  )
}
