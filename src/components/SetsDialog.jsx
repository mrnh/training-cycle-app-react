import { useEffect, useRef, useState } from 'react'
import NumInput from './NumInput'

const MAX_SETS = 12

/**
 * Edit weight and reps of all sets of a secondary exercise at once, and add or remove sets.
 * `rows` are the logged values ({ w, r }, null = not entered); `hints` are what an empty field
 * stands for (the prescription). Nothing is saved until "Save".
 */
export default function SetsDialog({ title, planned, rows, hints, onSave, onClose }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(rows)

  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.open && d.close()
  }, [])

  const setRow = (i, patch) => setDraft(draft.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const hint = (i) => hints[i] ?? hints.at(-1) ?? {}

  function save(e) {
    e.preventDefault()
    onSave(draft)
    onClose()
  }

  return (
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form onSubmit={save}>
        <h2>{title}</h2>
        {planned && <p className="muted small">Planned: {planned}</p>}
        <div className="sets-edit">
          <span className="set-head">Set</span>
          <span className="set-head">kg</span>
          <span className="set-head">Reps</span>
          {draft.map((x, i) => (
            <div key={i} className="sets-edit-row">
              <span className="set-no">{i + 1}</span>
              <NumInput value={x.w} placeholder={hint(i).w} label={`Set ${i + 1} weight`} onChange={(w) => setRow(i, { w })} />
              <NumInput value={x.r} placeholder={hint(i).r} label={`Set ${i + 1} reps`} onChange={(r) => setRow(i, { r })} />
            </div>
          ))}
        </div>
        <div className="row">
          <button type="button" className="small-btn" disabled={draft.length <= 1} onClick={() => setDraft(draft.slice(0, -1))}>
            − Remove set
          </button>
          <button type="button" className="small-btn" disabled={draft.length >= MAX_SETS} onClick={() => setDraft([...draft, { w: null, r: null }])}>
            + Add set
          </button>
        </div>
        <div className="button-row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Save</button>
        </div>
      </form>
    </dialog>
  )
}
