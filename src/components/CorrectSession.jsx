import { useState } from 'react'
import { PrescriptionDialog } from './Groups'
import Note from './Note'
import SetsCard from './SetsCard'
import useConfirm from './useConfirm'
import { ALL_SESSIONS, DEFAULT_REST, exerciseHistory, exerciseName, fmtDate, sessionName, setsSummary } from '../program'
import { update } from '../store'

/**
 * Correcting a finished workout: the same cards as during the session (set toggles, sets dialog,
 * comments, rest, added exercises, session note), working on the permanent record. Every change
 * is saved straight away. The prescription, names and finish date stay as they were, and the
 * workout doesn't become open again. "Done" goes back to the read-only view.
 */
export default function CorrectSession({ state, cycleIndex, planKey, onDone }) {
  const record = state.cycles[cycleIndex].finished[planKey]
  const [adding, setAdding] = useState(false)
  const [confirmDialog, confirm] = useConfirm()

  // Changes the stored record. A re-test result from before 0.20.0 is fixed first, so a
  // correction can't change the next cycle's 1RM.
  const change = (fn) =>
    update((d) => {
      const rec = d.cycles[cycleIndex].finished[planKey]
      for (const e of rec.entries) if (e.retest && !('result' in e)) e.result = e.sets[0]?.done ? e.sets[0].w : null
      fn(rec)
    })
  const changeEntry = (e, fn) =>
    change((rec) => fn(rec.entries.find((x) => x.kind === e.kind && x.exerciseId === e.exerciseId)))

  const secondaryIds = record.entries.filter((e) => e.kind === 'secondary').map((e) => e.exerciseId)
  const choices = state.catalog.filter((e) => !secondaryIds.includes(e.id))
  const addExercise = ({ id, sets, reps, weight, rest }) =>
    change((rec) =>
      rec.entries.push({
        kind: 'secondary',
        exerciseId: id,
        name: exerciseName(state, id),
        added: true,
        prescription: { sets, reps, weight },
        sets: [],
        rest,
      }),
    )
  const remove = async (e) => {
    const ok = await confirm({
      title: `Remove ${e.name}?`,
      message: 'It was added for this session only. Sets logged for it are dropped.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (ok) change((rec) => (rec.entries = rec.entries.filter((x) => !(x.kind === e.kind && x.exerciseId === e.exerciseId))))
  }

  return (
    <>
      <p className="finished-banner small">
        Correcting · finished{record.finishedAt ? ` on ${fmtDate(record.finishedAt)}` : ''}
      </p>
      <p className="muted small center">Changes are saved straight away.</p>

      {record.entries.map((e) => (
        <EntryCard
          key={`${e.kind}-${e.exerciseId}`}
          state={state}
          cycleIndex={cycleIndex}
          planKey={planKey}
          e={e}
          onChange={(fn) => changeEntry(e, fn)}
          onRemove={e.added ? () => remove(e) : undefined}
        />
      ))}

      <button className="add-exercise" onClick={() => setAdding(true)}>
        + Add exercise
      </button>
      {adding && (
        <PrescriptionDialog title="Add exercise" choices={choices} saveLabel="Add" onSave={addExercise} onClose={() => setAdding(false)} />
      )}

      <section className="card">
        <h2>Session note</h2>
        <Note label="Add a session note" value={record.note} onChange={(t) => change((rec) => (rec.note = t))} />
      </section>

      <button className="primary finish" onClick={onDone}>
        Done
      </button>
      {confirmDialog}
    </>
  )
}

/** One exercise of the record as a session card. Untouched sets: { w: null, r: null, done: false }. */
function EntryCard({ state, cycleIndex, planKey, e, onChange, onRemove }) {
  const p = e.prescription
  const main = e.kind === 'main'
  // Accessory work keeps only the sets that were logged, so the planned ones are shown again
  const count = main ? e.sets.length : Math.max(e.sets.length, p?.sets ?? 0) || 3
  const untouched = { w: null, r: null, done: false }
  const sets = Array.from({ length: count }, (_, i) => e.sets[i] ?? untouched)
  const hint = p ? { w: p.weight, r: p.reps } : {}
  const hints = sets.map(() => hint)

  // Back into the record: empty values stand for the plan; untouched sets at the end of accessory
  // work are left out, as when finishing
  const store = (rows) => {
    let end = rows.length
    if (!main) while (end && !rows[end - 1].done && rows[end - 1].w == null && rows[end - 1].r == null) end--
    return rows.slice(0, end).map((s) => ({ w: s.w ?? hint.w ?? null, r: s.r ?? hint.r ?? null, done: !!s.done }))
  }
  const toggle = (i, shown) =>
    onChange((x) => (x.sets = store(sets.map((s, j) => (j === i ? { ...shown, done: !s.done } : s)))))
  const saveSets = (rows) =>
    onChange((x) => (x.sets = store(rows.map((r, i) => ({ ...r, done: !!sets[i]?.done })))))

  // Last time before this workout, for accessory work as in the session
  let lastLine
  if (!main) {
    const order = ALL_SESSIONS.findIndex((s) => s.key === planKey)
    const last = exerciseHistory(state, e.exerciseId, 'secondary')
      .filter((h) => h.cycle < cycleIndex || (h.cycle === cycleIndex && h.order < order))
      .at(-1)
    lastLine = last ? `Last time (${sessionName(last)}): ${setsSummary(last.sets)}` : 'First time, no history yet'
  }

  return (
    <SetsCard
      name={e.name}
      pres={p}
      lastLine={lastLine}
      highlight={e.retest}
      hint={e.retest && "Its weight when the workout was finished is the next cycle's 1RM. A correction here doesn't change it."}
      sets={sets}
      hints={hints}
      editable
      comment={e.note}
      onComment={(t) => onChange((x) => (x.note = t || undefined))}
      rest={e.rest ?? DEFAULT_REST}
      onRest={(v) => onChange((x) => (x.rest = v))}
      onToggle={toggle}
      onSaveSets={saveSets}
      onRemove={onRemove}
    />
  )
}
