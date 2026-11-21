import { useState } from 'react'
import NumInput from './NumInput'
import Sheet from './Sheet'
import { fmt, unit } from '../program'

/** Modal to change the weight used for a lift. Nothing is saved until "Save". */
export default function WeightDialog({ title, value, planned, onSave, onClose }) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')

  function save() {
    if (!(draft > 0)) return setError('Enter a weight above 0.')
    onSave(draft)
    onClose()
  }

  return (
    <Sheet onClose={onClose} onSubmit={save} focusInput>
      <h2>{title}</h2>
      <p className="muted small">Planned: {fmt(planned)} {unit()}</p>
      <label className="weight-input big">
        <NumInput
          value={draft}
          label={`Weight used in ${unit()}`}
          onChange={(v) => {
            setError('')
            setDraft(v)
          }}
        />
        {unit()}
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
    </Sheet>
  )
}
