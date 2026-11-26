import { useState } from 'react'
import FinishDialog from '../components/FinishDialog'
import FinishedWorkout from '../components/FinishedSession'
import { PrescriptionDialog } from '../components/Groups'
import Note from '../components/Note'
import RestTimer from '../components/RestTimer'
import SetsCard from '../components/SetsCard'
import useConfirm from '../components/useConfirm'
import {
  activeSession, cancelSession, isExtra, removeExtra, restOf, sessionEntry, sessionName, clockTime, draftSecondaries, exerciseHistory, exerciseName, finishSession, finishedDate,
  liftOf, mainLifts, parseKey, secondaryKey, sessionPlan, sessionsOf, setKey, setsSummary, startSession, targetWeight, unfinishedBefore,
  todayIso, untickedSets, weekRange,
} from '../program'
import { currentCycle, update, updateCycle } from '../store'
import ScreenHeader from '../components/ScreenHeader'

const setLog = (key, patch) =>
  updateCycle((c) => {
    c.logs[key] = { ...c.logs[key], ...patch }
  })
const setNote = (key, text) =>
  updateCycle((c) => {
    c.notes[key] = text
  })

export default function Session({ state, sessionKey, onBack }) {
  const cycle = currentCycle(state)
  const { week, session } = parseKey(sessionKey)
  const plan = sessionPlan(cycle, week, session)
  const record = cycle.finished[plan.key]
  const active = activeSession(cycle)
  const isOpen = active?.key === plan.key
  const canStart = !record && !isOpen
  const skipped = canStart && unfinishedBefore(cycle, plan).length > 0
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
  const [confirmDialog, confirm] = useConfirm()
  const cancel = async () => {
    const ok = await confirm({
      title: 'Cancel this session?',
      message: 'Everything logged in it is discarded and nothing is saved to History. The session stays unstarted.',
      confirmLabel: 'Cancel session',
      cancelLabel: 'Keep session',
      danger: true,
    })
    if (ok) update((d) => cancelSession(currentCycle(d), plan))
  }
  // Starting finishes an open session first, so that needs a confirmation
  const onStart = () => (active ? setDialog('start') : start())

  return (
    <div className="screen">
      {/* Back to the screen this session was opened from (none when opened from the tab bar) */}
      <ScreenHeader title={sessionName(plan)} subtitle={record ? finishedDate(record) : `${weekRange(cycle, week)} · Group ${plan.group}`} onBack={onBack} />

      {record ? (
        <FinishedWorkout state={state} cycleIndex={state.cycles.length - 1} planKey={plan.key} />
      ) : (
        <>
          {isOpen && <p className="in-progress small">● In progress since {clockTime(cycle.active.startedAt)}</p>}
          {canStart && (
            <div className="card start-card">
              {skipped && <p className="warning small">There are unfinished previous workouts.</p>}
              {active && <p className="small">{sessionName(active)} is still open. Starting this session finishes it.</p>}
              <button className="primary" onClick={onStart}>Start session</button>
            </div>
          )}
          <Draft state={state} cycle={cycle} plan={plan} open={isOpen} onFinish={() => setDialog('finish')} onCancel={cancel} />
        </>
      )}
      {confirmDialog}
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

/**
 * The open session: every change is saved to the device straight away (the draft).
 * An unfinished session that isn't open is shown the same way as a preview, with all controls
 * disabled, above a "Start session" button.
 */
function Draft({ state, cycle, plan, open, onFinish, onCancel }) {
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
    <>
      <fieldset className="draft">
        {mainLifts(cycle, plan).map((p) => (
          <PrimaryBlock key={p.slot} state={state} cycle={cycle} plan={plan} p={p} open={open} />
        ))}

        {secondaries.map((id) => (
          <SecondaryBlock key={id} state={state} cycle={cycle} plan={plan} id={id} open={open} />
        ))}
        {secondaries.length === 0 && (
          <p className="muted small center">No accessory work in group {plan.group} yet. Add it in Settings.</p>
        )}
      </fieldset>

        {/* Outside the (disabled) fieldset: exercises can be added before the session is started too */}
        <button className="add-exercise" onClick={() => setAdding(true)}>
          + Add exercise
        </button>
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
          <fieldset className="draft">
            <section className="card">
              <h2>Session note</h2>
              <Note label="Add a session note" value={cycle.notes[plan.key]} onChange={(t) => setNote(plan.key, t)} />
            </section>

            <div className="finish-row">
              <button className="small-btn" onClick={onCancel}>
                Cancel session
              </button>
              <button className="primary finish" onClick={onFinish}>
                Finish session
              </button>
            </div>
          </fieldset>
        )}
    </>
  )
}

/** A main lift: prescribed by the program (sets × reps at a % of the 1RM). */
function PrimaryBlock({ state, cycle, plan, p, open }) {
  const lift = liftOf(cycle, p)
  return (
    <ExerciseCard
      cycle={cycle}
      plan={plan}
      entry={lift}
      name={exerciseName(state, lift)}
      pres={{ sets: p.sets, reps: p.reps, weight: targetWeight(cycle, p) }}
      open={open}
      highlight={p.retest}
      hint={p.retest && 'Tick the single you actually lifted. Its weight becomes your 1RM for the next cycle.'}
    />
  )
}

/** Accessory work: prescribed by the group (or when added), with last time for reference. */
function SecondaryBlock({ state, cycle, plan, id, open }) {
  const cycleIdx = state.cycles.length - 1
  const order = sessionsOf(cycle).findIndex((s) => s.key === plan.key)
  const last = exerciseHistory(state, id, 'secondary')
    .filter((h) => h.cycle < cycleIdx || (h.cycle === cycleIdx && h.order < order))
    .at(-1)
  const pres = sessionEntry(state, cycle, plan, id)
  const name = exerciseName(state, id)
  // Added to this session (not part of the group): the sets dialog can remove it, also before the session is started
  const [confirmDialog, confirm] = useConfirm()
  const remove = async () => {
    const ok = await confirm({
      title: `Remove ${name}?`,
      message: 'It was added for this session only. Sets logged for it are dropped.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (ok) updateCycle((c) => removeExtra(c, plan, id))
  }
  return (
    <>
      <ExerciseCard
        cycle={cycle}
        plan={plan}
        entry={secondaryKey(id)}
        name={name}
        pres={pres}
        last={last}
        lastLine={last ? `Last time (${sessionName(last)}): ${setsSummary(last.sets)}` : 'First time, no history yet'}
        open={open}
        onRemove={isExtra(cycle, plan, id) ? remove : undefined}
      />
      {confirmDialog}
    </>
  )
}

/**
 * One exercise card of the session (see SetsCard), backed by the draft: every change is saved
 * to the device straight away. `entry` is the exercise's part of the log keys (liftId or +id).
 */
function ExerciseCard({ cycle, plan, entry, name, pres, last, lastLine, open, highlight, hint, onRemove }) {
  const countKey = `${plan.key}:${entry}`
  const count = cycle.setCounts[countKey] ?? pres?.sets ?? Math.max(last?.sets.length ?? 3, 1)
  const keys = Array.from({ length: count }, (_, i) => setKey(plan.key, entry, i))
  // What an empty set stands for: the prescription, else last time's set
  const hints = keys.map((_, i) => (pres ? { w: pres.weight, r: pres.reps } : (last?.sets[i] ?? last?.sets.at(-1) ?? {})))
  const sets = keys.map((k) => ({ w: cycle.logs[k]?.w ?? null, r: cycle.logs[k]?.r ?? null, done: !!cycle.logs[k]?.done }))
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
  const rest = restOf(cycle, countKey, pres?.rest)

  return (
    <SetsCard
      name={name}
      pres={pres}
      lastLine={lastLine}
      highlight={highlight}
      hint={hint}
      sets={sets}
      hints={hints}
      editable={open || !!onRemove}
      locked={!open}
      comment={cycle.notes[countKey]}
      onComment={(t) => setNote(countKey, t)}
      rest={rest}
      onRest={(v) =>
        updateCycle((c) => {
          c.rest ??= {}
          c.rest[countKey] = v
        })
      }
      onToggle={(i, shown) => setLog(keys[i], { ...shown, done: !sets[i].done })}
      onSaveSets={saveSets}
      onRemove={onRemove}
    >
      {open && <RestTimer cycle={cycle} card={countKey} sets={count} defaultRest={pres?.rest} />}
    </SetsCard>
  )
}
