import { useState } from 'react'
import {
  DEFAULT_PRESCRIPTION, GROUPS, MAX_SETS, REST_MAX, REST_MIN, REST_STEP, exerciseName, fmt, minSec, prescriptionText, unit,
} from '../program'
import { update } from '../store'
import NumInput from './NumInput'
import Sheet from './Sheet'

/**
 * Part of the Current cycle card in Settings: what each group (A/B/C) adds to its sessions, one
 * line per exercise with its prescription and rest. The pen opens the editing screen.
 */
export default function GroupsSummary({ state, onEdit }) {
  return (
    <>
      <div className="row subhead">
        <h3>Accessory work</h3>
        <button className="sec-pen" aria-label="Edit accessory work" onClick={onEdit}>
          ✎
        </button>
      </div>
      {GROUPS.map((g, i) => (
        <div key={g} className="group-summary">
          <h4>Group {g} · session {i + 1}</h4>
          {state.groups[g].length === 0 ? (
            <p className="muted small">No exercises yet</p>
          ) : (
            <ul>
              {state.groups[g].map((x) => (
                <li key={x.id}>
                  <span>{exerciseName(state, x.id)}</span>
                  <span className="muted">
                    {prescriptionText(x)} · rest {minSec(x.rest)}
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

/** Sub-screen of Settings: add, remove and set up the exercises of each group. */
export function GroupsEditor({ state, onBack }) {
  return (
    <div className="screen">
      <header className="session-head">
        <button className="icon" aria-label="Back to settings" onClick={onBack}>
          ‹
        </button>
        <h1>Accessory work</h1>
        <span className="icon-spacer" />
      </header>
      <section className="card">
        <p className="muted small">
          Each session adds one group. Pick exercises from your catalog (Exercises tab) and tap one to set its sets,
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
  const [sets, setSets] = useState(value.sets)
  const [reps, setReps] = useState(value.reps)
  const [weight, setWeight] = useState(value.weight)
  const [rest, setRest] = useState(value.rest)

  function save() {
    onSave({ sets, reps, weight: weight ?? 0, rest })
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title}</h2>
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
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary">Save</button>
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
