import { useRef, useState } from 'react'
import {
  DEFAULT_PRESCRIPTION, MAX_SETS, REST_MAX, REST_MIN, REST_STEP, exerciseName, fmt, groupDraft, groupList, minSec, prescriptionText, programOf, unit,
} from '../program'
import { groupSession } from '../programs'
import { currentCycle, update } from '../store'
import NumInput from './NumInput'
import Sheet from './Sheet'
import ScreenHeader from './ScreenHeader'
import { t } from '../i18n'

/**
 * Part of the Current cycle card in Settings: what each group (A/B/C) adds to its sessions, one
 * line per exercise with its prescription and rest. The pen (only with `onEdit`) opens the editing screen.
 */
export default function GroupsSummary({ state, onEdit }) {
  const program = programOf(currentCycle(state))
  return (
    <>
      <div className="row subhead">
        <h3>{t('groups.accessoryWork')}</h3>
        {onEdit && (
          <button className="sec-pen" aria-label={t('groups.editAccessory')} onClick={onEdit}>
            ✎
          </button>
        )}
      </div>
      {program.groups.map((g) => (
        <div key={g} className="group-summary">
          <h4>{groupTitle(g, groupSession(program, g))}</h4>
          {groupList(state, program, g).length === 0 ? (
            <p className="muted small">{t('groups.noExercises')}</p>
          ) : (
            <ul>
              {groupList(state, program, g).map((x) => (
                <li key={x.id}>
                  <span>{exerciseName(state, x.id)}</span>
                  <span className="muted">
                    {t('groups.line', { prescription: prescriptionText(x), rest: minSec(x.rest) })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  )
}

/** "Group A · session 1", or just "Group D" when it isn't part of the first week. */
const groupTitle = (group, session) => (session == null ? t('groups.group', { group }) : t('groups.groupSession', { group, n: session }))

/** Sub-screen of Settings: add, remove and set up the exercises of each group. */
export function GroupsEditor({ state, onBack }) {
  const program = programOf(currentCycle(state))
  return (
    <div className="screen">
      <ScreenHeader title={t('groups.accessoryWork')} backLabel={t('groups.backToCycle')} onBack={onBack} />
      <section className="card">
        <p className="muted small">
          {t('groups.intro')}
        </p>
        {program.groups.map((g) => (
          <Group key={g} state={state} program={program} group={g} session={groupSession(program, g)} />
        ))}
      </section>
    </div>
  )
}

function Group({ state, program, group, session }) {
  const entries = groupList(state, program, group)
  const available = state.catalog.filter((e) => !entries.some((x) => x.id === e.id))
  const [pick, setPick] = useState('')
  const [editing, setEditing] = useState(null) // exercise id

  function add(e) {
    e.preventDefault()
    if (!pick) return
    update((d) => void groupDraft(d, program, group).push({ id: pick, ...DEFAULT_PRESCRIPTION }))
    setPick('')
  }
  const remove = (id) => update((d) => void (d.groups[program.id][group] = groupDraft(d, program, group).filter((x) => x.id !== id)))
  const save = (id, values) =>
    update((d) => {
      Object.assign(groupDraft(d, program, group).find((x) => x.id === id), values)
    })
  const current = entries.find((x) => x.id === editing)
  const move = (from, to) =>
    update((d) => {
      const list = groupDraft(d, program, group)
      list.splice(to, 0, ...list.splice(from, 1))
    })
  const { listRef, handleProps, rowStyle } = useReorder(entries.length, move)

  return (
    <div className="group">
      <h3>{groupTitle(group, session)}</h3>
      {entries.length === 0 && <p className="muted small">{t('groups.noExercises')}</p>}
      <ul className="group-list" ref={listRef}>
        {entries.map((x, i) => (
          <li key={x.id} className="row" style={rowStyle(i)}>
            <button
              className="drag-handle"
              aria-label={t('groups.move', { name: exerciseName(state, x.id) })}
              {...handleProps(i)}
            >
              <GripIcon />
            </button>
            <button className="group-entry" onClick={() => setEditing(x.id)}>
              <span>{exerciseName(state, x.id)}</span>
              <span className="muted small">
                {t('groups.line', { prescription: prescriptionText(x), rest: minSec(x.rest) })}
              </span>
            </button>
            <button className="icon-btn" aria-label={t('groups.removeFrom', { name: exerciseName(state, x.id), group })} onClick={() => remove(x.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="add-row" onSubmit={add}>
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={t('groups.addTo', { group })}>
          <option value="">{available.length ? t('groups.choose') : t('groups.allAdded')}</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <button type="submit" disabled={!pick}>{t('common.add')}</button>
      </form>
      {current && (
        <PrescriptionDialog
          title={t('groups.dialogTitle', { name: exerciseName(state, current.id), group })}
          value={current}
          onSave={(v) => save(current.id, v)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

/**
 * Drag to reorder a list: press the handle of a row and move it; the other rows slide aside and
 * the new order is saved on release. Arrow keys on a focused handle move the row one step.
 * Only the handle starts a drag, so tapping a row and scrolling the page keep working.
 */
function useReorder(count, onMove) {
  const listRef = useRef(null)
  const [drag, setDrag] = useState(null) // { from, to, dy, startY, height, mids }

  const handleProps = (i) => ({
    onPointerDown: (e) => {
      const rects = [...listRef.current.children].map((r) => r.getBoundingClientRect())
      e.currentTarget.setPointerCapture(e.pointerId)
      setDrag({ from: i, to: i, dy: 0, startY: e.clientY, height: rects[i].height, mids: rects.map((r) => r.top + r.height / 2) })
    },
    onPointerMove: (e) => {
      if (!drag) return
      const dy = e.clientY - drag.startY
      const centre = drag.mids[drag.from] + dy
      // New position = how many of the other rows now sit above the dragged row's centre
      const to = drag.mids.filter((m, j) => j !== drag.from && m < centre).length
      setDrag({ ...drag, dy, to })
    },
    onPointerUp: () => {
      if (drag && drag.to !== drag.from) onMove(drag.from, drag.to)
      setDrag(null)
    },
    onPointerCancel: () => setDrag(null),
    onKeyDown: (e) => {
      const to = e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowDown' ? i + 1 : null
      if (to == null || to < 0 || to >= count) return
      e.preventDefault()
      onMove(i, to)
    },
  })

  const rowStyle = (j) => {
    if (!drag) return undefined
    const { from, to, dy, height } = drag
    if (j === from) return { transform: `translateY(${dy}px)`, position: 'relative', zIndex: 1 }
    const shift = from < to && j > from && j <= to ? -height : to < from && j >= to && j < from ? height : 0
    return { transform: `translateY(${shift}px)`, transition: 'transform 0.15s' }
  }

  return { listRef, handleProps, rowStyle, dragging: drag?.from ?? null }
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      {[3, 8, 13].flatMap((y) => [<circle key={`a${y}`} cx="5.5" cy={y} r="1.5" />, <circle key={`b${y}`} cx="10.5" cy={y} r="1.5" />])}
    </svg>
  )
}

/**
 * Sets, reps, weight (0 = bodyweight) and rest interval of one group entry. Saved on "Save".
 * With `choices` ([{ id, name }]) it also picks the exercise (adding one during a workout);
 * `onSave` then gets the id too.
 */
export function PrescriptionDialog({ title, value = DEFAULT_PRESCRIPTION, choices, saveLabel = t('common.save'), onSave, onClose }) {
  const [exercise, setExercise] = useState('')
  const [error, setError] = useState('')
  const [sets, setSets] = useState(value.sets)
  const [reps, setReps] = useState(value.reps)
  const [weight, setWeight] = useState(value.weight)
  const [rest, setRest] = useState(value.rest)

  function save() {
    if (choices && !exercise) return setError(t('prescription.chooseError'))
    onSave({ ...(choices && { id: exercise }), sets, reps, weight: weight ?? 0, rest })
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title}</h2>
      {choices && (
        <select
          value={exercise}
          aria-label={t('prescription.exercise')}
          onChange={(e) => {
            setError('')
            setExercise(e.target.value)
          }}
        >
          <option value="">{t('groups.choose')}</option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      <Stepper label={t('prescription.sets')} value={sets} text={sets} min={1} max={MAX_SETS} step={1} onChange={setSets} />
      <Stepper label={t('prescription.reps')} value={reps} text={reps} min={1} max={50} step={1} onChange={setReps} />
      <label className="stepper-row">
        <span>{t('prescription.weight')}</span>
        <span className="weight-input">
          <NumInput value={weight} label={t('prescription.weightIn', { unit: unit() })} onChange={setWeight} />
          {unit()}
        </span>
      </label>
      <Stepper label={t('prescription.rest')} value={rest} text={minSec(rest)} min={REST_MIN} max={REST_MAX} step={REST_STEP} onChange={setRest} />
      <p className="muted small">
        {t('prescription.summary', { sets, reps, weight: fmt(weight ?? 0), unit: unit() })}
      </p>
      {error && <p className="error">{error}</p>}
      <div className="button-row end">
        <button type="button" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="primary">{saveLabel}</button>
      </div>
    </Sheet>
  )
}

function Stepper({ label, value, text, min, max, step, onChange }) {
  return (
    <div className="stepper-row">
      <span>{label}</span>
      <span className="stepper">
        <button type="button" className="small-btn" aria-label={t('prescription.down', { label })} disabled={value <= min} onClick={() => onChange(value - step)}>−</button>
        <strong aria-live="polite">{text}</strong>
        <button type="button" className="small-btn" aria-label={t('prescription.up', { label })} disabled={value >= max} onClick={() => onChange(value + step)}>+</button>
      </span>
    </div>
  )
}
