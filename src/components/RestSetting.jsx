import { useState } from 'react'
import Sheet from './Sheet'
import { REST_MAX, REST_MIN, REST_STEP, minSec } from '../program'
import { t } from '../i18n'

/**
 * The rest interval of an exercise card (clock icon + time, in the card header). Tapping it opens
 * a dialog to change it; `onSave` stores it (per session card in an open session, in the record
 * of a finished one).
 */
export default function RestSetting({ rest, onSave, label }) {
  const [editing, setEditing] = useState(false)
  return (
    <>
      <button className="rest-time" aria-label={t('rest.interval', { time: minSec(rest) })} onClick={() => setEditing(true)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2M9.5 2.5h5" />
        </svg>
        {minSec(rest)}
      </button>
      {editing && <RestDialog title={label} value={rest} onSave={onSave} onClose={() => setEditing(false)} />}
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
      <h2>{t('rest.title', { title })}</h2>
      <p className="muted small">{t('rest.hint')}</p>
      <div className="rest-stepper">
        <button type="button" aria-label={t('rest.less')} disabled={draft <= REST_MIN} onClick={() => setDraft(draft - REST_STEP)}>−</button>
        <strong aria-live="polite">{minSec(draft)}</strong>
        <button type="button" aria-label={t('rest.more')} disabled={draft >= REST_MAX} onClick={() => setDraft(draft + REST_STEP)}>+</button>
      </div>
      <div className="button-row end">
        <button type="button" onClick={onClose}>{t('common.cancel')}</button>
        <button type="submit" className="primary">{t('common.save')}</button>
      </div>
    </Sheet>
  )
}
