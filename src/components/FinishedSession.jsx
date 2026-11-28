import { useState } from 'react'
import { PrescriptionDialog } from './Groups'
import Note from './Note'
import NumInput from './NumInput'
import Planned from './Planned'
import useConfirm from './useConfirm'
import { MAX_SETS, exerciseName, setText, todayIso, unit } from '../program'
import { update } from '../store'
import { t } from '../i18n'

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
      title: t('finished.removeTitle', { name: e.name }),
      message: t('finished.removeMessage'),
      confirmLabel: t('common.remove'),
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
        <button className={`small-btn ${editing ? 'primary' : ''}`} onClick={toggleEditing}>
          {editing ? t('common.done') : t('common.edit')}
        </button>
      </div>

      {editing && (
        <section className="card">
          <h2>{t('finished.date')}</h2>
          {/* Any day up to today; an emptied field keeps the old date */}
          <input
            type="date"
            aria-label={t('finished.dateFinished')}
            value={record.finishedAt ?? ''}
            max={todayIso()}
            onChange={(e) => e.target.value && change((rec) => (rec.finishedAt = e.target.value))}
          />
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
            {t('finished.addExerciseButton')}
          </button>
          <section className="card">
            <h2>{t('finished.sessionNote')}</h2>
            <Note label={t('finished.addSessionNote')} value={record.note} onChange={(text) => change((rec) => (rec.note = text))} />
          </section>
          <button className="primary finish" onClick={toggleEditing}>
            {t('common.done')}
          </button>
        </>
      )}
      {!editing && record.note && (
        <section className="card">
          <h2>{t('finished.sessionNote')}</h2>
          <p className="note-text">{record.note}</p>
        </section>
      )}

      {adding && (
        <PrescriptionDialog
          title={t('finished.addExerciseTitle')}
          choices={state.catalog.filter((x) => !secondaryIds.includes(x.id))}
          saveLabel={t('common.add')}
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
      {e.prescription && <Planned sets={e.prescription.sets} reps={e.prescription.reps} weight={e.prescription.weight} perSet={e.prescription.perSet} />}
      {e.sets.length === 0 ? (
        // Same row layout as the sets, with a red cross like the History tab
        <ol className="done-sets">
          <li className="muted">
            <span className="set-no" />
            <span>{t('finished.noSets')}</span>
            <span className="not-done" aria-label={t('finished.notDone')}>
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
              <span className={x.done ? undefined : 'not-done'} aria-label={x.done ? t('finished.doneAria') : t('finished.notDone')}>
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
      {p && <Planned sets={p.sets} reps={p.reps} weight={p.weight} perSet={p.perSet} />}
      {e.retest && <p className="small">{t('finished.retestNote')}</p>}
      {e.sets.length > 0 && (
        <div className="sets-edit with-done">
          <span className="set-head">{t('sets.set')}</span>
          <span className="set-head">{unit()}</span>
          <span className="set-head">{t('sets.reps')}</span>
          <span className="set-head">{t('common.done')}</span>
          {e.sets.map((x, i) => (
            <div key={i} className="sets-edit-row">
              <span className="set-no">{i + 1}</span>
              <NumInput value={x.w} placeholder={p?.weight} label={t('sets.weightOf', { n: i + 1 })} onChange={(w) => setSet(i, { w })} />
              <NumInput value={x.r} placeholder={p?.reps} label={t('sets.repsOf', { n: i + 1 })} onChange={(r) => setSet(i, { r })} />
              <button
                className={`done-toggle ${x.done ? 'is-done' : ''}`}
                aria-pressed={x.done}
                aria-label={t('sets.doneOf', { n: i + 1 })}
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
          {t('sets.removeSet')}
        </button>
        <button className="small-btn" disabled={e.sets.length >= MAX_SETS} onClick={addSet}>
          {t('sets.addSet')}
        </button>
      </div>
      <Note label={t('common.addComment')} value={e.note} onChange={(text) => onChange((x) => (x.note = text))} />
      <button className="link danger" onClick={onRemove}>
        {t('common.removeExercise')}
      </button>
    </section>
  )
}
