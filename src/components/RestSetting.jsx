import { useState } from 'react'
import Sheet from './Sheet'
import { REST_MAX, REST_MIN, REST_STEP, minSec, restOf } from '../program'
import { updateCycle } from '../store'

/**
 * The rest interval of an exercise card (clock icon + time, in the card header). Tapping it opens
 * a dialog to change it; it's stored per session card in cycle.rest.
 */
export default function RestSetting({ cycle, card, defaultRest, label }) {
  const rest = restOf(cycle, card, defaultRest)
  const [editing, setEditing] = useState(false)
  const save = (v) =>
    updateCycle((c) => {
      c.rest ??= {}
      c.rest[card] = v
    })
  return (
    <>
      <button className="rest-time" aria-label={`Rest interval ${minSec(rest)}, change`} onClick={() => setEditing(true)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2M9.5 2.5h5" />
        </svg>
        {minSec(rest)}
      </button>
      {editing && <RestDialog title={label} value={rest} onSave={save} onClose={() => setEditing(false)} />}
    </>
  )
}

/** Rest interval in 15-second steps, 0:15 to 10:00. Nothing is saved until "Save". */
function RestDialog({ title, value, onSave, onClose }) {
  const [draft, setDraft] = useState(value)

  function save() {
    onSave(draft)
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title} · rest</h2>
      <p className="muted small">Time per set, including the set itself.</p>
      <div className="rest-stepper">
        <button type="button" aria-label="15 seconds less" disabled={draft <= REST_MIN} onClick={() => setDraft(draft - REST_STEP)}>−</button>
        <strong aria-live="polite">{minSec(draft)}</strong>
        <button type="button" aria-label="15 seconds more" disabled={draft >= REST_MAX} onClick={() => setDraft(draft + REST_STEP)}>+</button>
      </div>
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary">Save</button>
      </div>
    </Sheet>
  )
}
