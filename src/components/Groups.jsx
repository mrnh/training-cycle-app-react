import { useEffect, useRef, useState } from 'react'
import { DEFAULT_PRESCRIPTION, GROUPS, exerciseName, fmt, minSec, prescriptionText } from '../program'
import { update } from '../store'
import NumInput from './NumInput'

/** Settings: which catalog exercises each group (A/B/C) adds to its sessions, with their prescription. */
export default function Groups({ state }) {
  return (
    <section className="card">
      <h2>Secondary groups</h2>
      <p className="muted small">
        Each session adds one group. Pick exercises from your catalog (Exercises tab) and tap one to set its sets,
        reps, weight and rest.
      </p>
      {GROUPS.map((g, i) => (
        <Group key={g} state={state} group={g} session={i + 1} />
      ))}
    </section>
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

  return (
    <div className="group">
      <h3>Group {group} · session {session}</h3>
      {entries.length === 0 && <p className="muted small">No exercises yet</p>}
      <ul className="group-list">
        {entries.map((x) => (
          <li key={x.id} className="row">
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

/** Sets, reps, weight (0 = bodyweight) and rest interval of one group entry. Saved on "Save". */
function PrescriptionDialog({ title, value, onSave, onClose }) {
  const ref = useRef(null)
  const [sets, setSets] = useState(value.sets)
  const [reps, setReps] = useState(value.reps)
  const [weight, setWeight] = useState(value.weight)
  const [rest, setRest] = useState(value.rest)

  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.open && d.close()
  }, [])

  function save(e) {
    e.preventDefault()
    onSave({ sets, reps, weight: weight ?? 0, rest })
    onClose()
  }

  return (
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form onSubmit={save}>
        <h2>{title}</h2>
        <Stepper label="Sets" value={sets} text={sets} min={1} max={12} step={1} onChange={setSets} />
        <Stepper label="Reps" value={reps} text={reps} min={1} max={50} step={1} onChange={setReps} />
        <label className="stepper-row">
          <span>Weight</span>
          <span className="weight-input">
            <NumInput value={weight} label="Weight in kg" onChange={setWeight} />
            kg
          </span>
        </label>
        <Stepper label="Rest" value={rest} text={minSec(rest)} min={15} max={600} step={15} onChange={setRest} />
        <p className="muted small">
          {sets}×{reps} @ {fmt(weight ?? 0)} kg. Weight 0 means bodyweight.
        </p>
        <div className="button-row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Save</button>
        </div>
      </form>
    </dialog>
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
