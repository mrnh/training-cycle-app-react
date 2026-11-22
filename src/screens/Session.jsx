import { useState } from 'react'
import FinishDialog from '../components/FinishDialog'
import FinishedSession from '../components/FinishedSession'
import { PrescriptionDialog } from '../components/Groups'
import Note from '../components/Note'
import Planned from '../components/Planned'
import RestTimer from '../components/RestTimer'
import SetsDialog from '../components/SetsDialog'
import useConfirm from '../components/useConfirm'
import WeightDialog from '../components/WeightDialog'
import {
  ALL_SESSIONS, activeSession, isExtra, prescriptionText, removeExtra, sessionEntry, sessionName, setText, clockTime, draftSecondaries, exerciseHistory, exerciseName, finishSession, fmt,
  liftOf, mainLifts, parseKey, secondaryKey, sessionPlan, setKey, setsSummary, startSession, startableSession, targetWeight,
  todayIso, unit, untickedSets, weekRange,
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
  const [adding, setAdding] = useState(false)
  // Any catalog exercise not already among this session's accessory work
  const choices = state.catalog.filter((e) => !secondaries.includes(e.id))
  const addExtra = ({ id, ...pres }) =>
    updateCycle((c) => {
      c.extras ??= {}
      c.extras[plan.key] = [...(c.extras[plan.key] ?? []), { id, ...pres }]
    })
  return (
    <fieldset className="draft" disabled={!open}>
      {mainLifts(cycle, plan).map((p) => (
        <PrimaryBlock key={p.slot} state={state} cycle={cycle} plan={plan} p={p} open={open} />
      ))}

      {secondaries.map((id) => (
        <SecondaryBlock key={id} state={state} cycle={cycle} plan={plan} id={id} open={open} />
      ))}
      {secondaries.length === 0 && (
        <p className="muted small center">No accessory work in group {plan.group} yet. Add it in Settings.</p>
      )}
      {open && (
        <button className="add-exercise" onClick={() => setAdding(true)}>
          + Add exercise
        </button>
      )}
      {adding && (
        <PrescriptionDialog
          title="Add exercise"
          choices={choices}
          saveLabel="Add"
          onSave={addExtra}
          onClose={() => setAdding(false)}
        />
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
          <Planned sets={p.sets} reps={p.reps} weight={target} />
        </div>
        <div className="weight-used">
          <span>Weight used</span>
          <span className="weight-value">
            <strong className={w !== target ? 'changed' : undefined}>{fmt(w)} {unit()}</strong>
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
  // The group's prescription sets the rows and pre-fills them; "last time" is for reference
  const pres = sessionEntry(state, cycle, plan, id)
  // Added during this workout (not part of the group): can be removed again while it's open
  const removable = open && isExtra(cycle, plan, id)
  const [confirmDialog, confirm] = useConfirm()
  const remove = async () => {
    const ok = await confirm({
      title: `Remove ${exerciseName(state, id)}?`,
      message: 'It was added for this session only. Sets logged for it are dropped.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (ok) updateCycle((c) => removeExtra(c, plan, id))
  }
  const count = cycle.setCounts[countKey] ?? pres?.sets ?? Math.max(last?.sets.length ?? 3, 1)
  const [editing, setEditing] = useState(false)
  const keys = Array.from({ length: count }, (_, i) => setKey(plan.key, entry, i))
  // What an empty set stands for: the prescription, else last time's set
  const hints = keys.map((_, i) => (pres ? { w: pres.weight, r: pres.reps } : (last?.sets[i] ?? last?.sets.at(-1) ?? {})))
  const shown = (i) => {
    const log = cycle.logs[keys[i]]
    return { w: log?.w ?? hints[i].w ?? null, r: log?.r ?? hints[i].r ?? null }
  }
  const toggle = (i) => setLog(keys[i], { ...shown(i), done: !cycle.logs[keys[i]]?.done })
  // Save from the dialog: new set count, weight and reps per set (ticks stay)
  const saveSets = (rows) =>
    updateCycle((c) => {
      for (let i = rows.length; i < count; i++) delete c.logs[setKey(plan.key, entry, i)]
      rows.forEach((x, i) => {
        const k = setKey(plan.key, entry, i)
        c.logs[k] = { ...c.logs[k], w: x.w, r: x.r }
      })
      c.setCounts[countKey] = rows.length
    })
  const cols = Math.min(count, 6)

  return (
    <section className="card">
      <div className="row">
        <h2>{exerciseName(state, id)}</h2>
        {removable && (
          <button className="icon-btn remove-extra" aria-label={`Remove ${exerciseName(state, id)} from this session`} onClick={remove}>
            ×
          </button>
        )}
      </div>
      {confirmDialog}
      {/* Prescription and last time on the left, the pen for editing all sets on the right */}
      <div className="sec-head">
        <div>
          {pres && <Planned sets={pres.sets} reps={pres.reps} weight={pres.weight} />}
          <p className="muted small">
            {last ? `Last time (${sessionName(last)}): ${setsSummary(last.sets)}` : 'First time, no history yet'}
          </p>
        </div>
        {open && (
          <button className="sec-pen" aria-label={`Edit ${exerciseName(state, id)} sets`} onClick={() => setEditing(true)}>
            ✎
          </button>
        )}
      </div>
      {/* Toggles with each set's reps@weight under them, in equal columns that line up with the
          timer segments below; lines of up to 6 sets */}
      <div className="sec-sets" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {keys.map((k, i) => {
          const log = cycle.logs[k]
          const done = !!log?.done
          const line = Math.floor(i / 6)
          const col = (i % 6) + 1
          const entered = log?.w != null || log?.r != null
          return [
            <button
              key={`t${i}`}
              className={`set-toggle ${done ? 'is-done' : ''}`}
              style={{ gridRow: line * 2 + 1, gridColumn: col }}
              aria-pressed={done}
              aria-label={`Set ${i + 1}, ${setText(shown(i))}${done ? ', done' : ''}`}
              onClick={() => toggle(i)}
            >
              {i + 1}
            </button>,
            <span key={`v${i}`} className={`sec-value ${entered ? '' : 'muted'}`} style={{ gridRow: line * 2 + 2, gridColumn: col }}>
              {/* May break before "@" when the column is narrow (5–6 sets) */}
              {setText(shown(i)).replace('@', '\u200B@')}
            </span>,
          ]
        })}
      </div>
      {editing && (
        <SetsDialog
          title={`${exerciseName(state, id)} · sets`}
          planned={pres && prescriptionText(pres)}
          rows={keys.map((k) => ({ w: cycle.logs[k]?.w ?? null, r: cycle.logs[k]?.r ?? null }))}
          hints={hints}
          onSave={saveSets}
          onClose={() => setEditing(false)}
        />
      )}
      {open && (
        <RestTimer
          cycle={cycle}
          card={countKey}
          sets={count}
          defaultRest={pres?.rest}
          label={exerciseName(state, id)}
          note={<Note value={cycle.notes[countKey]} onChange={(t) => setNote(countKey, t)} />}
        />
      )}
    </section>
  )
}
