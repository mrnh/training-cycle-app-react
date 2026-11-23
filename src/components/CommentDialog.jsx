import { useState } from 'react'
import Sheet from './Sheet'

/** Write or change the comment of an exercise card. Saving it empty removes the comment. */
export default function CommentDialog({ title, value, onSave, onClose }) {
  const [draft, setDraft] = useState(value ?? '')
  function save() {
    onSave(draft.trim())
    onClose()
  }
  return (
    <Sheet onClose={onClose} onSubmit={save}>
      <h2>{title}</h2>
      <textarea
        className="note"
        rows={4}
        autoFocus
        placeholder="Comment"
        aria-label="Comment"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="button-row end">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary">Save</button>
      </div>
    </Sheet>
  )
}
