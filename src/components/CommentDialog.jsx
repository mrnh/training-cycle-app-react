import { useState } from 'react'
import Sheet from './Sheet'
import { t } from '../i18n'

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
        placeholder={t('common.comment')}
        aria-label={t('common.comment')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="button-row end">
        <button type="button" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="primary">{t('common.save')}</button>
      </div>
    </Sheet>
  )
}
