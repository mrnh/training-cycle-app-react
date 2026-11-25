import { useRef, useState } from 'react'
import {
  DEFAULT_PRESCRIPTION, GROUPS, MAX_SETS, REST_MAX, REST_MIN, REST_STEP, exerciseName, fmt, minSec, prescriptionText, unit,
} from '../program'
import { update } from '../store'
import NumInput from './NumInput'
import Sheet from './Sheet'
import ScreenHeader from './ScreenHeader'

/**
 * Part of the Current cycle card in Settings: what each group (A/B/C) adds to its sessions, one
 * line per exercise with its prescription and rest. The pen (only with `onEdit`) opens the editing screen.
 */
/** Accessory work per group. `compact`: just the exercise names as bullets, no sets, reps or rest. */
export default function GroupsSummary({ state, onEdit, compact }) {
  return (
    <>
      <div className="row subhead">
        <h3>Accessory work</h3>
        {onEdit && (
          <button className="sec-pen" aria-label="Edit accessory work" onClick={onEdit}>
            ✎
          </button>
        )}
      </div>
      {GROUPS.map((g, i) => (
        <div key={g} className="group-summary">
          <h4>Group {g} · session {i + 1}</h4>
          {state.groups[g].length === 0 ? (
            <p className="muted small">No exercises yet</p>
          ) : (
            <ul className={compact ? 'bullets' : undefined}>
              {state.groups[g].map((x) => (
                <li key={x.id}>
                  <span>{exerciseName(state, x.id)}</span>
                  {!compact && (
                    <span className="muted">
                      {prescriptionText(x)} · rest {minSec(x.rest)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  )
}

/** Sub-screen of Settings: add, remove and set up the exercises of each group. */
export function GroupsEditor({ state, onBack }) {
  return (
    <div className="screen">
      <ScreenHeader title="Accessory work" backLabel="Back to current cycle" onBack={onBack} />
      <section className="card">
        <p className="muted small">
          Each session adds one group. Pick exercises from your catalog (Settings → Exercise catalog) and tap one to set its sets,
          reps, weight and rest.
        </p>
        {GROUPS.map((g, i) => (
          <Group key={g} state={state} group={g} session={i + 1} />
        ))}
      </section>
    </div>
  )
}

function Group({ state, group, session }) {
  const entries = state.groups[group]
  const available = state.catalog.filter((e) => !entries.some((x) => x.id === e.id))
  const [pick, setPick] = useState('')
  const [editing, setEditing] = useState(null) // exercise id

  function add(e) {
    e.preventDefault()
    if (!pick) return
    update((d) => void d.groups[group].push({ id: pick, ...DEFAULT_PRESCRIPTION }))
    setPick('')
  }
  const remove = (id) => update((d) => void (d.groups[group] = d.groups[group].filter((x) => x.id !== id)))
  const save = (id, values) =>
    update((d) => {
      Object.assign(d.groups[group].find((x) => x.id === id), values)
    })
  const current = entries.find((x) => x.id === editing)
  const move = (from, to) =>
    update((d) => {
      const list = d.groups[group]
      list.splice(to, 0, ...list.splice(from, 1))
    })
  const { listRef, handleProps, rowStyle } = useReorder(entries.length, move)

  return (
    <div className="group">
      <h3>Group {group} · session {session}</h3>
      {entries.length === 0 && <p className="muted small">No exercises yet</p>}
      <ul className="group-list" ref={listRef}>
        {entries.map((x, i) => (
          <li key={x.id} className="row" style={rowStyle(i)}>
            <button
              className="drag-handle"
              aria-label={`Move ${exerciseName(state, x.id)}: drag, or use the arrow keys`}
              {...handleProps(i)}
            >
              <GripIcon />
            </button>
            <button className="group-entry" onClick={() => setEditing(x.id)}>
              <span>{exerciseName(state, x.id)}</span>
              <span className="muted small">
                {prescriptionText(x)} · rest {minSec(x.rest)}
              </span>
            </button>
            <button className="icon-btn" aria-label={`Remove ${exerciseName(state, x.id)} from group ${group}`} onClick={() => remove(x.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form className="add-row" onSubmit={add}>
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label={`Exercise to add to group ${group}`}>
          <option value="">{available.length ? 'Choose an exercise…' : 'All exercises added'}</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <button type="submit" disabled={!pick}>Add</button>
      </form>
      {current && (
        <PrescriptionDialog
          title={`${exerciseName(state, current.id)} · group ${group}`}
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
export function PrescriptionDialog({ title, value = DEFAULT_PRESCRIPTION, choices, saveLabel = 'Save', onSave, onClose }) {
  const [exercise, setExercise] = useState('')
  const [error, setError] = useState('')
  const [sets, setSets] = useState(value.sets)
  const [reps, setReps] = useState(value.reps)
  const [weight, setWeight] = useState(value.weight)
  const [rest, setRest] = useState(value.rest)

  function save() {
    if (choices && !exercise) return setError('Choose an exercise.')
    onSave({ ...(choices && { id: exercise }), sets, reps, weight: weight ?? 0, rest })
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title}</h2>
      {choices && (
        <select
          value={exercise}
          aria-label="Exercise"
          onChange={(e) => {
            setError('')
            setExercise(e.target.value)
          }}
        >
          <option value="">Choose an exercise…</option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      <Stepper label="Sets" value={sets} text={sets} min={1} max={MAX_SETS} step={1} onChange={setSets} />
      <Stepper label="Reps" value={reps} text={reps} min={1} max={50} step={1} onChange={setReps} />
      <label className="stepper-row">
        <span>Weight</span>
        <span className="weight-input">
          <NumInput value={weight} label={`Weight in ${unit()}`} onChange={setWeight} />
          {unit()}
        </span>
      </label>
      <Stepper label="Rest" value={rest} text={minSec(rest)} min={REST_MIN} max={REST_MAX} step={REST_STEP} onChange={setRest} />
      <p className="muted small">
        {sets}×{reps} @ {fmt(weight ?? 0)} {unit()}. Weight 0 means bodyweight.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
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
        <button type="button" className="small-btn" aria-label={`${label} down`} disabled={value <= min} onClick={() => onChange(value - step)}>−</button>
        <strong aria-live="polite">{text}</strong>
        <button type="button" className="small-btn" aria-label={`${label} up`} disabled={value >= max} onClick={() => onChange(value + step)}>+</button>
      </span>
    </div>
  )
}
