import { useEffect, useRef, useState } from 'react'
import NumInput from './NumInput'

/** Modal to change the weight used for a lift. Nothing is saved until "Save". */
export default function WeightDialog({ title, value, planned, onSave, onClose }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')

  useEffect(() => {
    const d = ref.current
    d.showModal()
    // Focus the field so the number keyboard opens straight away
    d.querySelector('input')?.focus()
    return () => d.open && d.close()
  }, [])

  function save(e) {
    e.preventDefault()
    if (!(draft > 0)) return setError('Enter a weight above 0.')
    onSave(draft)
    onClose()
  }

  return (
    // Escape / backdrop "cancel" closes without saving
    <dialog ref={ref} className="sheet" onCancel={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <form onSubmit={save}>
        <h2>{title}</h2>
        <p className="muted small">Planned: {planned} kg</p>
        <label className="weight-input big">
          <NumInput
            value={draft}
            label="Weight used in kg"
            onChange={(v) => {
              setError('')
              setDraft(v)
            }}
          />
          kg
        </label>
        {error && <p className="error">{error}</p>}
        {draft !== planned && (
          <button type="button" className="link" onClick={() => setDraft(planned)}>
            Use planned weight
          </button>
        )}
        <div className="button-row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Save</button>
        </div>
      </form>
    </dialog>
  )
}
