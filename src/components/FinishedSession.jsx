import { useState } from 'react'
import { PrescriptionDialog } from './Groups'
import Note from './Note'
import NumInput from './NumInput'
import Planned from './Planned'
import useConfirm from './useConfirm'
import { MAX_SETS, exerciseName, fmtDate, setText, todayIso, unit } from '../program'
import { update } from '../store'

/**
 * A finished workout (of any cycle), shown from its permanent record. "Edit" turns the same
 * cards into a form to correct what was logged: weight, reps and done per set, sets added or
 * removed, comments, exercises added or removed, the session note, the finish date. Every change
 * is saved straight away; "Done" ends editing. The prescription and names stay as they were, and
 * the workout doesn't become open again.
 */
export default function FinishedWorkout({ state, cycleIndex, planKey }) {
  const record = state.cycles[cycleIndex].finished[planKey]
  const [editing, setEditing] = useState(false)
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
  const same = (a) => (b) => a.kind === b.kind && a.exerciseId === b.exerciseId
  const changeEntry = (e, fn) => change((rec) => fn(rec.entries.find(same(e))))

  const removeEntry = async (e) => {
    const ok = await confirm({
      title: `Remove ${e.name}?`,
      message: 'It is removed from this workout with all its sets.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (ok) change((rec) => (rec.entries = rec.entries.filter((x) => !same(e)(x))))
  }
  const secondaryIds = record.entries.filter((e) => e.kind === 'secondary').map((e) => e.exerciseId)
  const addExercise = ({ id, sets, reps, weight, rest }) =>
    change((rec) =>
      rec.entries.push({
        kind: 'secondary',
        exerciseId: id,
        name: exerciseName(state, id),
        added: true,
        prescription: { sets, reps, weight },
        // The planned sets, to be ticked
        sets: Array.from({ length: sets }, () => ({ w: weight, r: reps, done: false })),
        rest,
      }),
    )

  const toggleEditing = () => {
    setEditing(!editing)
    if (editing) window.scrollTo(0, 0)
  }

  return (
    <>
      <div className="finished-row">
        <p className="finished-banner small">
          ✓ Finished{record.finishedAt ? ` on ${fmtDate(record.finishedAt)}` : ''}
        </p>
        <button className={`small-btn ${editing ? 'primary' : ''}`} onClick={toggleEditing}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing && (
        <section className="card">
          <h2>Date</h2>
          <label className="field">
            <span>Finished on</span>
            {/* Any day up to today; an emptied field keeps the old date */}
            <input
              type="date"
              value={record.finishedAt ?? ''}
              max={todayIso()}
              onChange={(e) => e.target.value && change((rec) => (rec.finishedAt = e.target.value))}
            />
          </label>
        </section>
      )}

      {record.entries.map((e) =>
        editing ? (
          <EditEntry key={`${e.kind}-${e.exerciseId}`} e={e} onChange={(fn) => changeEntry(e, fn)} onRemove={() => removeEntry(e)} />
        ) : (
          <Entry key={`${e.kind}-${e.exerciseId}`} e={e} />
        ),
      )}

      {editing && (
        <>
          <button className="add-exercise" onClick={() => setAdding(true)}>
            + Add exercise
          </button>
          <section className="card">
            <h2>Session note</h2>
            <Note label="Add a session note" value={record.note} onChange={(t) => change((rec) => (rec.note = t))} />
          </section>
          <button className="primary finish" onClick={toggleEditing}>
            Done
          </button>
        </>
      )}
      {!editing && record.note && (
        <section className="card">
          <h2>Session note</h2>
          <p className="note-text">{record.note}</p>
        </section>
      )}

      {adding && (
        <PrescriptionDialog
          title="Add exercise"
          choices={state.catalog.filter((x) => !secondaryIds.includes(x.id))}
          saveLabel="Add"
          onSave={addExercise}
          onClose={() => setAdding(false)}
        />
      )}
      {confirmDialog}
    </>
  )
}

/** One exercise of a finished session (main lift or accessory work): prescription, then each set. */
function Entry({ e }) {
  return (
    <section className={`card ${e.retest ? 'highlight' : ''}`}>
      <h2>{e.name}</h2>
      {e.prescription && <Planned sets={e.prescription.sets} reps={e.prescription.reps} weight={e.prescription.weight} />}
      {e.sets.length === 0 ? (
        // Same row layout as the sets, with a red cross like the History tab
        <ol className="done-sets">
          <li className="muted">
            <span className="set-no" />
            <span>No sets logged</span>
            <span className="not-done" aria-label="not done">
              ✗
            </span>
          </li>
        </ol>
      ) : (
        <ol className="done-sets">
          {e.sets.map((x, i) => (
            <li key={i} className={x.done ? 'is-done' : 'muted'}>
              <span className="set-no">{i + 1}</span>
              <span>{setText(x)}</span>
              <span className={x.done ? undefined : 'not-done'} aria-label={x.done ? 'done' : 'not done'}>
                {x.done ? '✓' : '✗'}
              </span>
            </li>
          ))}
        </ol>
      )}
      {e.note && <p className="note-text">{e.note}</p>}
    </section>
  )
}

/** The same card while editing: weight, reps and done per set, add/remove set, comment, remove. */
function EditEntry({ e, onChange, onRemove }) {
  const p = e.prescription
  const setSet = (i, patch) => onChange((x) => (x.sets[i] = { ...x.sets[i], ...patch }))
  // A new set copies the last one (or the plan), not yet done
  const addSet = () =>
    onChange((x) => {
      const last = x.sets.at(-1)
      x.sets.push({ w: last?.w ?? p?.weight ?? null, r: last?.r ?? p?.reps ?? null, done: false })
    })
  return (
    <section className={`card ${e.retest ? 'highlight' : ''}`}>
      <h2>{e.name}</h2>
      {p && <Planned sets={p.sets} reps={p.reps} weight={p.weight} />}
      {e.retest && <p className="small">The next cycle's 1RM was set when this workout was finished. Changes here don't affect it.</p>}
      {e.sets.length > 0 && (
        <div className="sets-edit with-done">
          <span className="set-head">Set</span>
          <span className="set-head">{unit()}</span>
          <span className="set-head">Reps</span>
          <span className="set-head">Done</span>
          {e.sets.map((x, i) => (
            <div key={i} className="sets-edit-row">
              <span className="set-no">{i + 1}</span>
              <NumInput value={x.w} placeholder={p?.weight} label={`Set ${i + 1} weight`} onChange={(w) => setSet(i, { w })} />
              <NumInput value={x.r} placeholder={p?.reps} label={`Set ${i + 1} reps`} onChange={(r) => setSet(i, { r })} />
              <button
                className={`done-toggle ${x.done ? 'is-done' : ''}`}
                aria-pressed={x.done}
                aria-label={`Set ${i + 1} done`}
                onClick={() => setSet(i, { done: !x.done })}
              >
                {x.done ? '✓' : '✗'}
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="row">
        <button className="small-btn" disabled={!e.sets.length} onClick={() => onChange((x) => x.sets.pop())}>
          − Remove set
        </button>
        <button className="small-btn" disabled={e.sets.length >= MAX_SETS} onClick={addSet}>
          + Add set
        </button>
      </div>
      <Note label="Add a comment" value={e.note} onChange={(t) => onChange((x) => (x.note = t))} />
      <button className="link danger" onClick={onRemove}>
        Remove exercise
      </button>
    </section>
  )
}
